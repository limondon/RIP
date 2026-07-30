-- Pamyat CRM: transactional payments, inventory operations and staff audit log.
-- Apply once after schema.sql (or after enable-shared-crm-data.sql on an existing project).
-- The functions use the signed-in employee from auth.uid(); no service role key is required.

create table if not exists public.staff_action_log (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null unique,
  staff_id uuid not null references public.staff_profiles(id) on delete restrict,
  staff_name text not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  order_id text references public.orders(id) on delete set null,
  summary text not null,
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists staff_action_log_created_at_idx
  on public.staff_action_log (created_at desc);
create index if not exists staff_action_log_staff_id_idx
  on public.staff_action_log (staff_id, created_at desc);
create index if not exists staff_action_log_order_id_idx
  on public.staff_action_log (order_id, created_at desc)
  where order_id is not null;

alter table public.staff_action_log enable row level security;

drop policy if exists "Active staff can read action log" on public.staff_action_log;
create policy "Active staff can read action log" on public.staff_action_log
  for select to authenticated
  using (
    exists (
      select 1
      from public.staff_profiles staff
      where staff.id = auth.uid() and staff.active
    )
  );

grant select on table public.staff_action_log to authenticated;
revoke insert, update, delete on table public.staff_action_log from authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'staff_action_log'
  ) then
    alter publication supabase_realtime add table public.staff_action_log;
  end if;
end
$$;

create or replace function public.recalculate_order_payment_totals_row()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_paid numeric(12,2);
begin
  select coalesce(sum(case when payment.type = 'Возврат' then -payment.amount else payment.amount end), 0)
    into v_paid
  from public.payments payment
  where payment."orderId" = new.id;

  new."paidAmount" := greatest(0, v_paid);
  new."remainingAmount" := greatest(0, new."totalAmount" - new."paidAmount");
  return new;
end;
$$;

drop trigger if exists orders_recalculate_payment_totals on public.orders;
create trigger orders_recalculate_payment_totals
before insert or update of "totalAmount", "paidAmount", "remainingAmount"
on public.orders
for each row
execute function public.recalculate_order_payment_totals_row();

create or replace function public.add_order_payment(
  p_operation_id uuid,
  p_order_id text,
  p_amount numeric,
  p_method text,
  p_type text,
  p_date text,
  p_comment text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_staff public.staff_profiles%rowtype;
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_existing_staff_id uuid;
  v_existing_result jsonb;
  v_current_paid numeric(12,2);
  v_current_remaining numeric(12,2);
  v_amount numeric(12,2);
  v_new_paid numeric(12,2);
  v_result jsonb;
begin
  if p_operation_id is null then
    raise exception 'Не указан идентификатор операции';
  end if;

  select *
    into v_staff
  from public.staff_profiles
  where id = auth.uid() and active;
  if not found then
    raise exception 'Операция доступна только активному сотруднику' using errcode = '42501';
  end if;

  select staff_id, result
    into v_existing_staff_id, v_existing_result
  from public.staff_action_log
  where operation_id = p_operation_id;
  if found then
    if v_existing_staff_id <> v_staff.id then
      raise exception 'Идентификатор операции уже использован другим сотрудником';
    end if;
    return v_existing_result;
  end if;

  if p_type not in ('Предоплата', 'Доплата', 'Полная оплата', 'Возврат') then
    raise exception 'Неизвестный тип платежа';
  end if;
  if p_method not in ('Наличные', 'Карта', 'Перевод', 'Расчетный счет') then
    raise exception 'Неизвестный способ оплаты';
  end if;

  select *
    into v_order
  from public.orders
  where id = p_order_id
  for update;
  if not found then
    raise exception 'Заказ не найден';
  end if;

  -- A concurrent retry waits on the order lock and then receives the first result.
  select staff_id, result
    into v_existing_staff_id, v_existing_result
  from public.staff_action_log
  where operation_id = p_operation_id;
  if found then
    if v_existing_staff_id <> v_staff.id then
      raise exception 'Идентификатор операции уже использован другим сотрудником';
    end if;
    return v_existing_result;
  end if;

  select coalesce(sum(case when payment.type = 'Возврат' then -payment.amount else payment.amount end), 0)
    into v_current_paid
  from public.payments payment
  where payment."orderId" = v_order.id;

  v_current_paid := greatest(0, v_current_paid);
  v_current_remaining := greatest(0, v_order."totalAmount" - v_current_paid);
  v_amount := case
    when p_type = 'Полная оплата' then v_current_remaining
    else round(coalesce(p_amount, 0), 2)
  end;

  if v_amount <= 0 then
    if p_type = 'Полная оплата' then
      raise exception 'Заказ уже полностью оплачен';
    end if;
    raise exception 'Сумма платежа должна быть больше 0';
  end if;
  if p_type = 'Возврат' and v_amount > v_current_paid then
    raise exception 'Возврат не может быть больше оплаченной суммы';
  end if;

  insert into public.payments (
    id, "orderId", "clientId", date, amount, method, type, comment
  )
  values (
    'pay-' || replace(gen_random_uuid()::text, '-', ''),
    v_order.id,
    v_order."clientId",
    coalesce(nullif(trim(p_date), ''), current_date::text),
    v_amount,
    p_method,
    p_type,
    coalesce(
      nullif(trim(p_comment), ''),
      case
        when p_type = 'Возврат' then 'Возврат по заказу'
        when p_type = 'Полная оплата' then 'Полная оплата заказа'
        else 'Платеж по заказу'
      end
    )
  )
  returning * into v_payment;

  v_new_paid := greatest(
    0,
    v_current_paid + case when p_type = 'Возврат' then -v_amount else v_amount end
  );

  update public.orders
  set
    "paidAmount" = v_new_paid,
    "remainingAmount" = greatest(0, "totalAmount" - v_new_paid),
    updated_at = now()
  where id = v_order.id
  returning * into v_order;

  insert into public.crm_events (
    id, "orderId", "clientId", type, title, detail, actor, "createdAt"
  )
  values (
    'event-' || replace(gen_random_uuid()::text, '-', ''),
    v_order.id,
    v_order."clientId",
    'payment',
    case when p_type = 'Возврат' then 'Оформлен возврат' else 'Добавлен платеж' end,
    p_type || ': ' || trim(to_char(v_amount, 'FM999999999990D00')) || ' ₽, ' || p_method,
    v_staff.full_name,
    now()::text
  );

  v_result := jsonb_build_object(
    'ok', true,
    'payment', to_jsonb(v_payment) - 'created_at',
    'order', to_jsonb(v_order) - 'created_at' - 'updated_at',
    'paidAmount', v_order."paidAmount",
    'remainingAmount', v_order."remainingAmount"
  );

  insert into public.staff_action_log (
    operation_id, staff_id, staff_name, action, entity_type, entity_id,
    order_id, summary, before_state, after_state, result
  )
  values (
    p_operation_id,
    v_staff.id,
    v_staff.full_name,
    case when p_type = 'Возврат' then 'payment.refund' else 'payment.add' end,
    'payment',
    v_payment.id,
    v_order.id,
    case when p_type = 'Возврат' then 'Оформил возврат по заказу' else 'Добавил платеж по заказу' end,
    jsonb_build_object(
      'paidAmount', v_current_paid,
      'remainingAmount', v_current_remaining
    ),
    jsonb_build_object(
      'payment', to_jsonb(v_payment) - 'created_at',
      'paidAmount', v_order."paidAmount",
      'remainingAmount', v_order."remainingAmount"
    ),
    v_result
  );

  return v_result;
end;
$$;

create or replace function public.receive_inventory(
  p_operation_id uuid,
  p_item_id text,
  p_quantity numeric,
  p_comment text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_staff public.staff_profiles%rowtype;
  v_item public.inventory_items%rowtype;
  v_movement public.inventory_movements%rowtype;
  v_existing_staff_id uuid;
  v_existing_result jsonb;
  v_quantity numeric(12,3);
  v_before numeric(12,3);
  v_result jsonb;
begin
  if p_operation_id is null then raise exception 'Не указан идентификатор операции'; end if;
  select * into v_staff from public.staff_profiles where id = auth.uid() and active;
  if not found then raise exception 'Операция доступна только активному сотруднику' using errcode = '42501'; end if;

  select staff_id, result into v_existing_staff_id, v_existing_result
  from public.staff_action_log where operation_id = p_operation_id;
  if found then
    if v_existing_staff_id <> v_staff.id then raise exception 'Идентификатор операции уже использован другим сотрудником'; end if;
    return v_existing_result;
  end if;

  v_quantity := round(coalesce(p_quantity, 0), 3);
  if v_quantity <= 0 then raise exception 'Количество должно быть больше 0'; end if;

  select * into v_item from public.inventory_items where id = p_item_id for update;
  if not found then raise exception 'Материал не найден'; end if;

  select staff_id, result into v_existing_staff_id, v_existing_result
  from public.staff_action_log where operation_id = p_operation_id;
  if found then
    if v_existing_staff_id <> v_staff.id then raise exception 'Идентификатор операции уже использован другим сотрудником'; end if;
    return v_existing_result;
  end if;

  v_before := v_item."onHand";
  update public.inventory_items
  set "onHand" = "onHand" + v_quantity, updated_at = now()
  where id = v_item.id
  returning * into v_item;

  insert into public.inventory_movements (
    id, "itemId", "orderId", type, quantity, comment, "createdAt"
  )
  values (
    'move-' || replace(gen_random_uuid()::text, '-', ''),
    v_item.id,
    null,
    'Поступление',
    v_quantity,
    coalesce(nullif(trim(p_comment), ''), 'Поступление'),
    now()::text
  )
  returning * into v_movement;

  v_result := jsonb_build_object(
    'ok', true,
    'item', to_jsonb(v_item) - 'created_at' - 'updated_at',
    'movement', to_jsonb(v_movement)
  );

  insert into public.staff_action_log (
    operation_id, staff_id, staff_name, action, entity_type, entity_id,
    summary, before_state, after_state, result
  )
  values (
    p_operation_id, v_staff.id, v_staff.full_name, 'inventory.receive',
    'inventory_item', v_item.id, 'Принял материал на склад',
    jsonb_build_object('onHand', v_before),
    jsonb_build_object('onHand', v_item."onHand", 'quantity', v_quantity, 'movementId', v_movement.id),
    v_result
  );

  return v_result;
end;
$$;

create or replace function public.reserve_inventory_for_order(
  p_operation_id uuid,
  p_item_id text,
  p_order_id text,
  p_quantity numeric,
  p_comment text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_staff public.staff_profiles%rowtype;
  v_item public.inventory_items%rowtype;
  v_order public.orders%rowtype;
  v_reservation public.inventory_reservations%rowtype;
  v_movement public.inventory_movements%rowtype;
  v_existing_staff_id uuid;
  v_existing_result jsonb;
  v_quantity numeric(12,3);
  v_reserved numeric(12,3);
  v_available numeric(12,3);
  v_result jsonb;
begin
  if p_operation_id is null then raise exception 'Не указан идентификатор операции'; end if;
  select * into v_staff from public.staff_profiles where id = auth.uid() and active;
  if not found then raise exception 'Операция доступна только активному сотруднику' using errcode = '42501'; end if;

  select staff_id, result into v_existing_staff_id, v_existing_result
  from public.staff_action_log where operation_id = p_operation_id;
  if found then
    if v_existing_staff_id <> v_staff.id then raise exception 'Идентификатор операции уже использован другим сотрудником'; end if;
    return v_existing_result;
  end if;

  v_quantity := round(coalesce(p_quantity, 0), 3);
  if v_quantity <= 0 then raise exception 'Количество должно быть больше 0'; end if;

  select * into v_item from public.inventory_items where id = p_item_id for update;
  if not found then raise exception 'Материал не найден'; end if;
  select * into v_order from public.orders where id = p_order_id;
  if not found then raise exception 'Заказ не найден'; end if;

  select staff_id, result into v_existing_staff_id, v_existing_result
  from public.staff_action_log where operation_id = p_operation_id;
  if found then
    if v_existing_staff_id <> v_staff.id then raise exception 'Идентификатор операции уже использован другим сотрудником'; end if;
    return v_existing_result;
  end if;

  select coalesce(sum(quantity), 0)
    into v_reserved
  from public.inventory_reservations
  where "itemId" = v_item.id and status = 'Активен';
  v_available := greatest(0, v_item."onHand" - v_reserved);
  if v_quantity > v_available then
    raise exception 'Доступно только % %', v_available, v_item.unit;
  end if;

  insert into public.inventory_reservations (
    id, "orderId", "itemId", quantity, status, comment, "createdAt"
  )
  values (
    'reserve-' || replace(gen_random_uuid()::text, '-', ''),
    v_order.id,
    v_item.id,
    v_quantity,
    'Активен',
    coalesce(nullif(trim(p_comment), ''), 'Резерв под заказ'),
    now()::text
  )
  returning * into v_reservation;

  insert into public.inventory_movements (
    id, "itemId", "orderId", type, quantity, comment, "createdAt"
  )
  values (
    'move-' || replace(gen_random_uuid()::text, '-', ''),
    v_item.id,
    v_order.id,
    'Резерв',
    v_quantity,
    v_reservation.comment,
    now()::text
  )
  returning * into v_movement;

  insert into public.crm_events (
    id, "orderId", "clientId", type, title, detail, actor, "createdAt"
  )
  values (
    'event-' || replace(gen_random_uuid()::text, '-', ''),
    v_order.id,
    v_order."clientId",
    'inventory',
    'Материал зарезервирован',
    v_item.name || ': ' || trim(to_char(v_quantity, 'FM999999990D999')) || ' ' || v_item.unit,
    v_staff.full_name,
    now()::text
  );

  v_result := jsonb_build_object(
    'ok', true,
    'reservation', to_jsonb(v_reservation),
    'movement', to_jsonb(v_movement),
    'available', v_available - v_quantity
  );

  insert into public.staff_action_log (
    operation_id, staff_id, staff_name, action, entity_type, entity_id,
    order_id, summary, before_state, after_state, result
  )
  values (
    p_operation_id, v_staff.id, v_staff.full_name, 'inventory.reserve',
    'inventory_reservation', v_reservation.id, v_order.id,
    'Зарезервировал материал под заказ',
    jsonb_build_object('available', v_available),
    jsonb_build_object(
      'available', v_available - v_quantity,
      'quantity', v_quantity,
      'itemId', v_item.id,
      'reservationId', v_reservation.id
    ),
    v_result
  );

  return v_result;
end;
$$;

create or replace function public.write_off_inventory_reservation(
  p_operation_id uuid,
  p_reservation_id text,
  p_comment text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_staff public.staff_profiles%rowtype;
  v_item public.inventory_items%rowtype;
  v_order public.orders%rowtype;
  v_reservation public.inventory_reservations%rowtype;
  v_movement public.inventory_movements%rowtype;
  v_existing_staff_id uuid;
  v_existing_result jsonb;
  v_before numeric(12,3);
  v_result jsonb;
begin
  if p_operation_id is null then raise exception 'Не указан идентификатор операции'; end if;
  select * into v_staff from public.staff_profiles where id = auth.uid() and active;
  if not found then raise exception 'Операция доступна только активному сотруднику' using errcode = '42501'; end if;

  select staff_id, result into v_existing_staff_id, v_existing_result
  from public.staff_action_log where operation_id = p_operation_id;
  if found then
    if v_existing_staff_id <> v_staff.id then raise exception 'Идентификатор операции уже использован другим сотрудником'; end if;
    return v_existing_result;
  end if;

  select * into v_reservation
  from public.inventory_reservations
  where id = p_reservation_id
  for update;
  if not found then raise exception 'Резерв не найден'; end if;

  select * into v_item
  from public.inventory_items
  where id = v_reservation."itemId"
  for update;
  if not found then raise exception 'Материал не найден'; end if;

  select staff_id, result into v_existing_staff_id, v_existing_result
  from public.staff_action_log where operation_id = p_operation_id;
  if found then
    if v_existing_staff_id <> v_staff.id then raise exception 'Идентификатор операции уже использован другим сотрудником'; end if;
    return v_existing_result;
  end if;

  if v_reservation.status <> 'Активен' then raise exception 'Резерв уже закрыт'; end if;
  if v_reservation.quantity > v_item."onHand" then raise exception 'На складе недостаточно материала для списания'; end if;

  v_before := v_item."onHand";
  update public.inventory_items
  set "onHand" = "onHand" - v_reservation.quantity, updated_at = now()
  where id = v_item.id
  returning * into v_item;

  update public.inventory_reservations
  set
    status = 'Списан',
    comment = coalesce(nullif(trim(p_comment), ''), comment)
  where id = v_reservation.id
  returning * into v_reservation;

  insert into public.inventory_movements (
    id, "itemId", "orderId", type, quantity, comment, "createdAt"
  )
  values (
    'move-' || replace(gen_random_uuid()::text, '-', ''),
    v_item.id,
    v_reservation."orderId",
    'Списание',
    v_reservation.quantity,
    coalesce(nullif(trim(p_comment), ''), v_reservation.comment),
    now()::text
  )
  returning * into v_movement;

  select * into v_order from public.orders where id = v_reservation."orderId";
  if found then
    insert into public.crm_events (
      id, "orderId", "clientId", type, title, detail, actor, "createdAt"
    )
    values (
      'event-' || replace(gen_random_uuid()::text, '-', ''),
      v_order.id,
      v_order."clientId",
      'inventory',
      'Материал списан со склада',
      v_item.name || ': ' || trim(to_char(v_reservation.quantity, 'FM999999990D999')) || ' ' || v_item.unit,
      v_staff.full_name,
      now()::text
    );
  end if;

  v_result := jsonb_build_object(
    'ok', true,
    'item', to_jsonb(v_item) - 'created_at' - 'updated_at',
    'reservation', to_jsonb(v_reservation),
    'movement', to_jsonb(v_movement)
  );

  insert into public.staff_action_log (
    operation_id, staff_id, staff_name, action, entity_type, entity_id,
    order_id, summary, before_state, after_state, result
  )
  values (
    p_operation_id, v_staff.id, v_staff.full_name, 'inventory.write_off',
    'inventory_reservation', v_reservation.id, v_reservation."orderId",
    'Списал зарезервированный материал',
    jsonb_build_object('onHand', v_before, 'reservationStatus', 'Активен'),
    jsonb_build_object(
      'onHand', v_item."onHand",
      'reservationStatus', v_reservation.status,
      'quantity', v_reservation.quantity,
      'movementId', v_movement.id
    ),
    v_result
  );

  return v_result;
end;
$$;

create or replace function public.cancel_inventory_reservation(
  p_operation_id uuid,
  p_reservation_id text,
  p_comment text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_staff public.staff_profiles%rowtype;
  v_item public.inventory_items%rowtype;
  v_order public.orders%rowtype;
  v_reservation public.inventory_reservations%rowtype;
  v_movement public.inventory_movements%rowtype;
  v_existing_staff_id uuid;
  v_existing_result jsonb;
  v_result jsonb;
begin
  if p_operation_id is null then raise exception 'Не указан идентификатор операции'; end if;
  select * into v_staff from public.staff_profiles where id = auth.uid() and active;
  if not found then raise exception 'Операция доступна только активному сотруднику' using errcode = '42501'; end if;

  select staff_id, result into v_existing_staff_id, v_existing_result
  from public.staff_action_log where operation_id = p_operation_id;
  if found then
    if v_existing_staff_id <> v_staff.id then raise exception 'Идентификатор операции уже использован другим сотрудником'; end if;
    return v_existing_result;
  end if;

  select * into v_reservation
  from public.inventory_reservations
  where id = p_reservation_id
  for update;
  if not found then raise exception 'Резерв не найден'; end if;

  select staff_id, result into v_existing_staff_id, v_existing_result
  from public.staff_action_log where operation_id = p_operation_id;
  if found then
    if v_existing_staff_id <> v_staff.id then raise exception 'Идентификатор операции уже использован другим сотрудником'; end if;
    return v_existing_result;
  end if;

  if v_reservation.status <> 'Активен' then raise exception 'Резерв уже закрыт'; end if;
  select * into v_item from public.inventory_items where id = v_reservation."itemId";
  select * into v_order from public.orders where id = v_reservation."orderId";

  update public.inventory_reservations
  set
    status = 'Отменен',
    comment = coalesce(nullif(trim(p_comment), ''), comment)
  where id = v_reservation.id
  returning * into v_reservation;

  insert into public.inventory_movements (
    id, "itemId", "orderId", type, quantity, comment, "createdAt"
  )
  values (
    'move-' || replace(gen_random_uuid()::text, '-', ''),
    v_reservation."itemId",
    v_reservation."orderId",
    'Снятие резерва',
    v_reservation.quantity,
    coalesce(nullif(trim(p_comment), ''), v_reservation.comment),
    now()::text
  )
  returning * into v_movement;

  if v_order.id is not null and v_item.id is not null then
    insert into public.crm_events (
      id, "orderId", "clientId", type, title, detail, actor, "createdAt"
    )
    values (
      'event-' || replace(gen_random_uuid()::text, '-', ''),
      v_order.id,
      v_order."clientId",
      'inventory',
      'Резерв материала снят',
      v_item.name || ': ' || trim(to_char(v_reservation.quantity, 'FM999999990D999')) || ' ' || v_item.unit,
      v_staff.full_name,
      now()::text
    );
  end if;

  v_result := jsonb_build_object(
    'ok', true,
    'reservation', to_jsonb(v_reservation),
    'movement', to_jsonb(v_movement)
  );

  insert into public.staff_action_log (
    operation_id, staff_id, staff_name, action, entity_type, entity_id,
    order_id, summary, before_state, after_state, result
  )
  values (
    p_operation_id, v_staff.id, v_staff.full_name, 'inventory.cancel_reservation',
    'inventory_reservation', v_reservation.id, v_reservation."orderId",
    'Снял резерв материала',
    jsonb_build_object('reservationStatus', 'Активен'),
    jsonb_build_object(
      'reservationStatus', v_reservation.status,
      'quantity', v_reservation.quantity,
      'movementId', v_movement.id
    ),
    v_result
  );

  return v_result;
end;
$$;

revoke all on function public.add_order_payment(uuid, text, numeric, text, text, text, text) from public, anon;
revoke all on function public.receive_inventory(uuid, text, numeric, text) from public, anon;
revoke all on function public.reserve_inventory_for_order(uuid, text, text, numeric, text) from public, anon;
revoke all on function public.write_off_inventory_reservation(uuid, text, text) from public, anon;
revoke all on function public.cancel_inventory_reservation(uuid, text, text) from public, anon;

grant execute on function public.add_order_payment(uuid, text, numeric, text, text, text, text) to authenticated;
grant execute on function public.receive_inventory(uuid, text, numeric, text) to authenticated;
grant execute on function public.reserve_inventory_for_order(uuid, text, text, numeric, text) to authenticated;
grant execute on function public.write_off_inventory_reservation(uuid, text, text) to authenticated;
grant execute on function public.cancel_inventory_reservation(uuid, text, text) to authenticated;

-- Critical tables can be read by employees, but changes must go through the functions above.
revoke insert, update, delete on table
  public.payments,
  public.inventory_items,
  public.inventory_reservations,
  public.inventory_movements
from authenticated;
grant select on table
  public.payments,
  public.inventory_items,
  public.inventory_reservations,
  public.inventory_movements
to authenticated;
