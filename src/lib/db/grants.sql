-- I'm Realtor: explicit API privileges for projects created with
-- "Automatically expose new tables" disabled.
-- Run after schema.sql and rls.sql, as the project owner in Supabase SQL Editor.
-- GRANT is NOT an RLS bypass: the existing row-level policies continue to apply.
-- Do NOT grant SELECT on profiles to anon, or disable RLS.

grant usage on schema public to anon, authenticated, service_role;

-- Public visitors can browse approved properties and submit forms.
grant select on table public.properties, public.property_images to anon;
grant insert on table public.access_requests, public.enquiries to anon;

-- Signed-in users: permissions below are further restricted by RLS.
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.access_requests to authenticated;
grant select, insert, update, delete on table public.properties to authenticated;
grant select, insert, delete on table public.property_images to authenticated;
grant select, insert, update, delete on table public.enquiries to authenticated;
grant select, insert, delete on table public.saved_properties to authenticated;
grant select, insert, update, delete on table public.agent_assignments to authenticated;
grant select, insert on table public.audit_logs to authenticated;
grant select, insert, update, delete on table public.listing_imports to authenticated;

-- Trusted server-side service-role operations (RLS bypass is controlled by
-- the Supabase service-role credential, never by browser code).
grant all privileges on table
  public.profiles,
  public.access_requests,
  public.properties,
  public.property_images,
  public.enquiries,
  public.saved_properties,
  public.agent_assignments,
  public.audit_logs,
  public.listing_imports
to service_role;

-- Validate without exposing private rows:
-- select has_table_privilege('authenticated','public.profiles','SELECT');
-- select has_table_privilege('anon','public.profiles','SELECT'); -- expected false
-- select has_table_privilege('service_role','public.profiles','SELECT');
