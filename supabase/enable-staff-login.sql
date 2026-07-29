-- Apply once after the baseline schema and fix-staff-profiles-grants.sql.
-- Lets a signed-in employee read only their own active flag for route protection.

drop policy if exists "Active staff can read staff profiles" on public.staff_profiles;
drop policy if exists "Staff can read own profile" on public.staff_profiles;

create policy "Staff can read own profile" on public.staff_profiles
  for select to authenticated
  using (id = auth.uid());

grant select on table public.staff_profiles to authenticated;
