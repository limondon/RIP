-- Pamyat CRM empty-project reset.
-- Use only while the Supabase project has no real CRM data yet.
-- This removes the baseline tables so supabase/schema.sql can recreate them with exact column names.

drop table if exists public.inventory_movements cascade;
drop table if exists public.inventory_reservations cascade;
drop table if exists public.inventory_items cascade;
drop table if exists public.documents cascade;
drop table if exists public.installation_tasks cascade;
drop table if exists public.production_tasks cascade;
drop table if exists public.crm_events cascade;
drop table if exists public.payments cascade;
drop table if exists public.orders cascade;
drop table if exists public.clients cascade;
drop table if exists public.staff_profiles cascade;
