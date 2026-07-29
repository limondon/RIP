-- Apply once to an existing Supabase project after the baseline schema.
-- Allows only the server-side service key to manage employee profiles.
-- RLS remains enabled; no browser role gets access from these grants.

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.staff_profiles to service_role;
