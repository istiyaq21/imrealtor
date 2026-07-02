-- =============================================================================
-- I'm Realtor — Phase 2 Row Level Security Policies
-- =============================================================================
-- Run this AFTER schema.sql. Every table gets RLS enabled; once enabled,
-- Postgres denies all access by default except what an explicit policy
-- allows. The service role (src/lib/supabase/admin.ts) bypasses RLS
-- entirely — these policies protect the anon/authenticated (browser) path.
--
-- ⚠️ SECURITY: sections marked TODO(security-review) implement reasonable
-- defaults for the private beta but should get a dedicated review pass
-- before public launch (see docs/BACKEND_PHASES.md, Phase 5).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper functions
-- These are SECURITY DEFINER so they can read public.profiles regardless of
-- the calling user's own RLS visibility into that table, which avoids
-- recursive-policy issues (a profiles SELECT policy that itself queries
-- profiles). They only ever read data scoped to auth.uid(), never take
-- caller-supplied ids, so they can't be used to leak other users' rows.
-- -----------------------------------------------------------------------------

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_status()
returns public.approval_status
language sql
stable
security definer
set search_path = public
as $$
  select status from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'approved'
  );
$$;

create or replace function public.is_approved_agent()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'agent' and status = 'approved'
  );
$$;

create or replace function public.is_approved_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner' and status = 'approved'
  );
$$;

create or replace function public.is_approved_buyer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'buyer' and status = 'approved'
  );
$$;

grant execute on function
  public.current_user_role(),
  public.current_user_status(),
  public.is_admin(),
  public.is_approved_agent(),
  public.is_approved_owner(),
  public.is_approved_buyer()
to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Enable RLS everywhere
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.access_requests enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.enquiries enable row level security;
alter table public.saved_properties enable row level security;
alter table public.agent_assignments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.listing_imports enable row level security;

-- =============================================================================
-- profiles
-- =============================================================================

-- TODO(security-review): RLS alone cannot restrict *which columns* an
-- UPDATE touches, only which *rows* — so "users can update limited fields
-- but not role/status" is enforced by this trigger, not by the policy
-- below. The trigger allows the change through when auth.uid() is null,
-- which is true for service-role/server-side calls (they have no user JWT)
-- — this is what lets admin service functions change role/status. Review
-- this assumption before launch if service-role code paths change.
create or replace function public.guard_profile_role_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.status is distinct from old.status) then
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'Only admin can change role or status on a profile.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role_status on public.profiles;
create trigger guard_profile_role_status
  before update on public.profiles
  for each row execute function public.guard_profile_role_status_change();

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
  -- role/status changes are further blocked for non-admins by the trigger above.

-- Profiles are admin-created/admin-approved during the private beta — see
-- AGENTS/AGENTS.md context. TODO(phase-3): once self-signup exists, add a
-- SECURITY DEFINER trigger on auth.users insert that creates the matching
-- profiles row (bypassing this policy entirely), rather than loosening this.
create policy "profiles_insert_admin_only"
  on public.profiles for insert
  with check (public.is_admin());

create policy "profiles_delete_admin_only"
  on public.profiles for delete
  using (public.is_admin());

-- =============================================================================
-- access_requests
-- =============================================================================

-- Intentionally open INSERT — this *is* the private-beta's controlled
-- front door (see /request-access in the app), not open signup: it only
-- creates a pending request row that an admin must act on before any
-- account or access is granted.
create policy "access_requests_insert_anyone"
  on public.access_requests for insert
  with check (
    status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
  );

create policy "access_requests_select_admin_only"
  on public.access_requests for select
  using (public.is_admin());

create policy "access_requests_update_admin_only"
  on public.access_requests for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "access_requests_delete_admin_only"
  on public.access_requests for delete
  using (public.is_admin());

-- =============================================================================
-- properties
-- =============================================================================

-- TODO(security-review): same auth.uid()-is-null carve-out as the profiles
-- guard above, for the same reason (service-role admin actions).
create or replace function public.guard_property_approval_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    new.status is distinct from old.status
    or new.featured is distinct from old.featured
    or new.approved_by is distinct from old.approved_by
    or new.approved_at is distinct from old.approved_at
  ) then
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'Only admin can change status, featured, approved_by, or approved_at on a property.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_property_approval_fields on public.properties;
create trigger guard_property_approval_fields
  before update on public.properties
  for each row execute function public.guard_property_approval_fields();

-- SELECT: public approved listings, plus admin/owner/agent visibility into
-- their own or assigned listings regardless of status.
create policy "properties_select_public_approved"
  on public.properties for select
  using (status = 'approved');

create policy "properties_select_admin_all"
  on public.properties for select
  using (public.is_admin());

create policy "properties_select_owner_own"
  on public.properties for select
  using (public.is_approved_owner() and owner_id = auth.uid());

create policy "properties_select_agent_assigned"
  on public.properties for select
  using (
    public.is_approved_agent()
    and exists (
      select 1 from public.agent_assignments aa
      where aa.property_id = properties.id and aa.agent_id = auth.uid()
    )
  );

create policy "properties_select_agent_own_created"
  on public.properties for select
  using (public.is_approved_agent() and created_by = auth.uid());

-- INSERT: admin is unrestricted; owner/agent submissions are forced into a
-- safe, unapproved state regardless of what the client sends.
create policy "properties_insert_admin"
  on public.properties for insert
  with check (public.is_admin());

create policy "properties_insert_owner"
  on public.properties for insert
  with check (
    public.is_approved_owner()
    and owner_id = auth.uid()
    and created_by = auth.uid()
    and status in ('draft', 'pending')
    and featured = false
    and approved_by is null
    and approved_at is null
  );

create policy "properties_insert_agent"
  on public.properties for insert
  with check (
    public.is_approved_agent()
    and created_by = auth.uid()
    and status in ('draft', 'pending')
    and featured = false
    and approved_by is null
    and approved_at is null
  );

-- UPDATE: admin unrestricted. Owner/agent may only edit their own listing
-- while it's not yet approved; approval-related columns are additionally
-- blocked by the trigger above, so this "cannot approve themselves" rule
-- is enforced twice (defense in depth).
create policy "properties_update_admin"
  on public.properties for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "properties_update_owner_own_unapproved"
  on public.properties for update
  using (
    public.is_approved_owner()
    and owner_id = auth.uid()
    and status in ('draft', 'pending', 'rejected')
  )
  with check (
    owner_id = auth.uid()
    and status in ('draft', 'pending')
  );

create policy "properties_update_agent_own_unapproved"
  on public.properties for update
  using (
    public.is_approved_agent()
    and created_by = auth.uid()
    and status in ('draft', 'pending', 'rejected')
  )
  with check (
    created_by = auth.uid()
    and status in ('draft', 'pending')
  );

create policy "properties_delete_admin"
  on public.properties for delete
  using (public.is_admin());

create policy "properties_delete_owner_own_draft"
  on public.properties for delete
  using (public.is_approved_owner() and owner_id = auth.uid() and status = 'draft');

-- =============================================================================
-- property_images
-- =============================================================================

create policy "property_images_admin_all"
  on public.property_images for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "property_images_select_public_approved"
  on public.property_images for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id and p.status = 'approved'
    )
  );

create policy "property_images_select_owner_or_agent"
  on public.property_images for select
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id
        and (p.owner_id = auth.uid() or p.created_by = auth.uid())
    )
  );

create policy "property_images_insert_owner_or_agent"
  on public.property_images for insert
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id
        and (p.owner_id = auth.uid() or p.created_by = auth.uid())
        and p.status in ('draft', 'pending')
    )
  );

create policy "property_images_delete_owner_or_agent"
  on public.property_images for delete
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id
        and (p.owner_id = auth.uid() or p.created_by = auth.uid())
        and p.status in ('draft', 'pending')
    )
  );

-- =============================================================================
-- enquiries
-- =============================================================================

-- Public (including anonymous) visitors may enquire only about approved
-- listings, and cannot set status/assignment themselves.
create policy "enquiries_insert_public_for_approved_property"
  on public.enquiries for insert
  with check (
    (buyer_id is null or buyer_id = auth.uid())
    and status = 'new'
    and assigned_agent_id is null
    and exists (
      select 1 from public.properties p
      where p.id = enquiries.property_id and p.status = 'approved'
    )
  );

create policy "enquiries_select_admin"
  on public.enquiries for select
  using (public.is_admin());

create policy "enquiries_select_own_buyer"
  on public.enquiries for select
  using (buyer_id = auth.uid());

create policy "enquiries_select_assigned_agent"
  on public.enquiries for select
  using (public.is_approved_agent() and assigned_agent_id = auth.uid());

create policy "enquiries_select_property_owner"
  on public.enquiries for select
  using (
    public.is_approved_owner()
    and exists (
      select 1 from public.properties p
      where p.id = enquiries.property_id and p.owner_id = auth.uid()
    )
  );

create policy "enquiries_update_admin"
  on public.enquiries for update
  using (public.is_admin())
  with check (public.is_admin());

-- TODO(security-review): this allows the assigned agent to update any
-- column on their enquiry, not just `status`. Add column-level grants
-- (see the profiles role/status pattern in docs/SUPABASE_SETUP.md) to
-- restrict this to status transitions only before public launch.
create policy "enquiries_update_assigned_agent"
  on public.enquiries for update
  using (public.is_approved_agent() and assigned_agent_id = auth.uid())
  with check (public.is_approved_agent() and assigned_agent_id = auth.uid());

create policy "enquiries_delete_admin"
  on public.enquiries for delete
  using (public.is_admin());

-- =============================================================================
-- saved_properties
-- =============================================================================

create policy "saved_properties_select_own"
  on public.saved_properties for select
  using (buyer_id = auth.uid());

create policy "saved_properties_select_admin"
  on public.saved_properties for select
  using (public.is_admin());

create policy "saved_properties_insert_own"
  on public.saved_properties for insert
  with check (buyer_id = auth.uid() and public.is_approved_buyer());

create policy "saved_properties_delete_own"
  on public.saved_properties for delete
  using (buyer_id = auth.uid());

-- =============================================================================
-- agent_assignments
-- =============================================================================

create policy "agent_assignments_admin_all"
  on public.agent_assignments for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "agent_assignments_select_own_agent"
  on public.agent_assignments for select
  using (agent_id = auth.uid());

-- =============================================================================
-- audit_logs
-- =============================================================================
-- Append-only by design: no update/delete policy is defined, so once RLS
-- is enabled those operations are denied for anon/authenticated by default.

create policy "audit_logs_select_admin"
  on public.audit_logs for select
  using (public.is_admin());

create policy "audit_logs_insert_admin"
  on public.audit_logs for insert
  with check (public.is_admin());

-- =============================================================================
-- listing_imports
-- =============================================================================
-- Not wired into the Phase 2 UI yet — policies exist so the table is safe
-- to write to from future admin/agent tooling without an RLS gap.

create policy "listing_imports_admin_all"
  on public.listing_imports for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "listing_imports_select_own_creator"
  on public.listing_imports for select
  using (created_by = auth.uid());

create policy "listing_imports_insert_own_creator"
  on public.listing_imports for insert
  with check (created_by = auth.uid());
