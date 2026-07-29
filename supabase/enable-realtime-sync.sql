-- Enables instant cross-browser updates. The CRM also has a polling fallback.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'clients',
    'orders',
    'payments',
    'production_tasks',
    'installation_tasks',
    'crm_events',
    'documents',
    'inventory_items',
    'inventory_reservations',
    'inventory_movements'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end
$$;
