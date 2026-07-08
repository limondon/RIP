-- Pamyat CRM baseline schema.
-- Safe default: RLS is enabled on every table. Do not add service_role keys to the frontend.

create table if not exists public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  short_name text not null,
  phone text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id text primary key,
  fullName text not null,
  phone text not null,
  additionalPhone text not null default '',
  address text not null default '',
  source text not null default '',
  comment text not null default '',
  createdAt text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  orderNumber text not null unique,
  clientId text not null references public.clients(id) on delete restrict,
  deceasedFullName text not null,
  cemetery text not null default '',
  section text not null default '',
  row text not null default '',
  place text not null default '',
  monumentType text not null,
  material text not null,
  color text not null default '',
  shape text not null default '',
  polishing text not null default '',
  steleSize text not null default '',
  baseSize text not null default '',
  flowerBedSize text not null default '',
  decoration jsonb not null default '{}'::jsonb,
  services jsonb not null default '[]'::jsonb,
  items jsonb not null default '[]'::jsonb,
  totalAmount numeric(12,2) not null default 0 check (totalAmount >= 0),
  paidAmount numeric(12,2) not null default 0 check (paidAmount >= 0),
  remainingAmount numeric(12,2) not null default 0 check (remainingAmount >= 0),
  status text not null,
  deadline text not null default '',
  createdAt text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id text primary key,
  orderId text not null references public.orders(id) on delete cascade,
  clientId text not null references public.clients(id) on delete restrict,
  date text not null,
  amount numeric(12,2) not null check (amount > 0),
  method text not null,
  type text not null,
  comment text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.crm_events (
  id text primary key,
  orderId text not null references public.orders(id) on delete cascade,
  clientId text references public.clients(id) on delete set null,
  type text not null,
  title text not null,
  detail text not null,
  actor text not null,
  createdAt text not null
);

create table if not exists public.production_tasks (
  id text primary key,
  orderId text not null references public.orders(id) on delete cascade,
  stage text not null,
  masterId text not null default '',
  startedAt text not null default '',
  plannedReadyAt text not null default '',
  comment text not null default ''
);

create table if not exists public.installation_tasks (
  id text primary key,
  orderId text not null references public.orders(id) on delete cascade,
  brigadeId text not null default '',
  date text not null default '',
  time text not null default '',
  status text not null,
  comment text not null default ''
);

create table if not exists public.documents (
  id text primary key,
  orderId text not null references public.orders(id) on delete cascade,
  clientId text not null references public.clients(id) on delete restrict,
  type text not null,
  number text not null,
  date text not null,
  status text not null,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_items (
  id text primary key,
  materialId text not null,
  name text not null,
  category text not null,
  color text not null,
  unit text not null,
  onHand numeric(12,3) not null default 0 check (onHand >= 0),
  minStock numeric(12,3) not null default 0 check (minStock >= 0),
  cost numeric(12,2) not null default 0 check (cost >= 0),
  supplier text not null default '',
  location text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_reservations (
  id text primary key,
  orderId text not null references public.orders(id) on delete cascade,
  itemId text not null references public.inventory_items(id) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0),
  status text not null,
  comment text not null default '',
  createdAt text not null
);

create table if not exists public.inventory_movements (
  id text primary key,
  itemId text not null references public.inventory_items(id) on delete restrict,
  orderId text references public.orders(id) on delete set null,
  type text not null,
  quantity numeric(12,3) not null check (quantity > 0),
  comment text not null default '',
  createdAt text not null
);

alter table public.staff_profiles enable row level security;
alter table public.clients enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.crm_events enable row level security;
alter table public.production_tasks enable row level security;
alter table public.installation_tasks enable row level security;
alter table public.documents enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_reservations enable row level security;
alter table public.inventory_movements enable row level security;

create policy "Active staff can read staff profiles" on public.staff_profiles
  for select to authenticated
  using (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active));

create policy "Active staff can use clients" on public.clients
  for all to authenticated
  using (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active))
  with check (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active));

create policy "Active staff can use orders" on public.orders
  for all to authenticated
  using (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active))
  with check (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active));

create policy "Active staff can use payments" on public.payments
  for all to authenticated
  using (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active))
  with check (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active));

create policy "Active staff can use events" on public.crm_events
  for all to authenticated
  using (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active))
  with check (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active));

create policy "Active staff can use production" on public.production_tasks
  for all to authenticated
  using (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active))
  with check (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active));

create policy "Active staff can use installation" on public.installation_tasks
  for all to authenticated
  using (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active))
  with check (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active));

create policy "Active staff can use documents" on public.documents
  for all to authenticated
  using (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active))
  with check (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active));

create policy "Active staff can use inventory items" on public.inventory_items
  for all to authenticated
  using (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active))
  with check (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active));

create policy "Active staff can use inventory reservations" on public.inventory_reservations
  for all to authenticated
  using (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active))
  with check (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active));

create policy "Active staff can use inventory movements" on public.inventory_movements
  for all to authenticated
  using (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active))
  with check (exists (select 1 from public.staff_profiles staff where staff.id = auth.uid() and staff.active));
