-- Apply once after enable-staff-login.sql.
-- Active employees remain limited by the RLS policies in schema.sql.

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.clients, public.orders, public.payments, public.crm_events, public.production_tasks, public.installation_tasks, public.documents, public.inventory_items, public.inventory_reservations, public.inventory_movements to authenticated;
