-- =============================================================================
-- I'm Realtor — Phase 2 Database Schema
-- =============================================================================
-- Run this in the Supabase SQL editor (or via `supabase db push`) BEFORE
-- rls.sql, storage.sql, and seed.sql. This file only defines structure —
-- no Row Level Security is enabled here (see rls.sql for that).
--
-- Safe to re-run on a fresh database. Not idempotent against partial
-- manual edits — if you changed things by hand, review before re-running.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------

create type public.user_role as enum ('admin', 'agent', 'owner', 'buyer', 'support');
create type public.approval_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.listing_status as enum ('draft', 'pending', 'approved', 'rejected', 'archived');
create type public.property_purpose as enum ('sell', 'rent');
create type public.enquiry_status as enum ('new', 'contacted', 'closed', 'spam');
create type public.access_request_status as enum ('pending', 'approved', 'rejected');
create type public.import_status as enum ('parsed', 'needs_review', 'saved', 'rejected');

-- -----------------------------------------------------------------------------
-- updated_at trigger helper — attach with a per-table trigger below.
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- A. profiles
-- One row per authenticated user, keyed to auth.users. Created on signup
-- (see docs/SUPABASE_SETUP.md for the trigger you may add in Phase 3) or
-- manually by an admin during the private beta.
-- -----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  role public.user_role not null default 'buyer',
  status public.approval_status not null default 'pending',
  city text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per auth.users account. role/status gate what a user can do — see rls.sql.';

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

create index profiles_role_idx on public.profiles (role);
create index profiles_status_idx on public.profiles (status);
create index profiles_city_idx on public.profiles (city);

-- -----------------------------------------------------------------------------
-- B. access_requests
-- Private-beta "Request Access" submissions. Reviewed by admin, who then
-- (manually, for now) creates/approves the corresponding auth user + profile.
-- -----------------------------------------------------------------------------

create table public.access_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text not null,
  requested_role public.user_role not null,
  city text,
  message text,
  status public.access_request_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.access_requests is
  'Public "Request Access" form submissions, reviewed by admin during private beta.';

create index access_requests_status_idx on public.access_requests (status);

-- -----------------------------------------------------------------------------
-- C. properties
-- Core listing table. Only status = 'approved' is publicly visible
-- (enforced in rls.sql, not here).
-- -----------------------------------------------------------------------------

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  purpose public.property_purpose not null,
  type text not null,
  city text not null,
  locality text not null,
  price numeric not null check (price >= 0),
  bedrooms int check (bedrooms is null or bedrooms >= 0),
  bathrooms int check (bathrooms is null or bathrooms >= 0),
  area text,
  description text,
  amenities text[] not null default '{}',
  status public.listing_status not null default 'pending',
  featured boolean not null default false,
  owner_id uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  rejected_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.properties is
  'Property listings. status/approved_by/approved_at/featured may only be set by admin — see rls.sql.';

create trigger set_updated_at_properties
  before update on public.properties
  for each row execute function public.set_updated_at();

create index properties_city_idx on public.properties (city);
create index properties_status_idx on public.properties (status);
create index properties_owner_id_idx on public.properties (owner_id);
create index properties_featured_idx on public.properties (featured) where featured = true;

-- Slug helper: generates a URL-friendly, unique-ish slug from a title.
-- Intended to be called from the app layer before insert (or wire it into
-- a BEFORE INSERT trigger later if you want slugs generated in the DB).
create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(
    both '-' from
    regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g')
  );
$$;

-- -----------------------------------------------------------------------------
-- D. property_images
-- Metadata rows pointing at files in the `property-images` storage bucket
-- (see storage.sql). storage_path convention: {property_id}/{filename}.
-- -----------------------------------------------------------------------------

create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.property_images is
  'Image metadata for a property. Actual files live in the property-images storage bucket.';

create index property_images_property_id_idx on public.property_images (property_id);

-- -----------------------------------------------------------------------------
-- E. enquiries
-- Buyer enquiries against a property. Only allowed against approved
-- listings (enforced in rls.sql).
-- -----------------------------------------------------------------------------

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  buyer_id uuid references public.profiles(id),
  buyer_name text not null,
  email text,
  phone text not null,
  message text,
  status public.enquiry_status not null default 'new',
  assigned_agent_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.enquiries is
  'Buyer enquiries. buyer_id is nullable to allow anonymous/private-beta enquiries.';

create trigger set_updated_at_enquiries
  before update on public.enquiries
  for each row execute function public.set_updated_at();

create index enquiries_status_idx on public.enquiries (status);
create index enquiries_property_id_idx on public.enquiries (property_id);
create index enquiries_assigned_agent_id_idx on public.enquiries (assigned_agent_id);

-- -----------------------------------------------------------------------------
-- F. saved_properties
-- Buyer "save for later" placeholder feature.
-- -----------------------------------------------------------------------------

create table public.saved_properties (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (buyer_id, property_id)
);

comment on table public.saved_properties is 'Buyer-saved properties, one row per (buyer, property) pair.';

create index saved_properties_buyer_id_idx on public.saved_properties (buyer_id);

-- -----------------------------------------------------------------------------
-- G. agent_assignments
-- Which agent(s) are assigned to which property. Admin-managed.
-- -----------------------------------------------------------------------------

create table public.agent_assignments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  agent_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (property_id, agent_id)
);

comment on table public.agent_assignments is 'Admin-managed mapping of agents to properties.';

create index agent_assignments_agent_id_idx on public.agent_assignments (agent_id);
create index agent_assignments_property_id_idx on public.agent_assignments (property_id);

-- -----------------------------------------------------------------------------
-- H. audit_logs
-- Append-only trail of sensitive actions (approvals, rejections, status
-- changes). Written by service-role code paths, not by end users directly.
-- -----------------------------------------------------------------------------

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is
  'Append-only audit trail. Written server-side (service role) — see rls.sql.';

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_actor_id_idx on public.audit_logs (actor_id);

-- -----------------------------------------------------------------------------
-- I. listing_imports
-- Future AI WhatsApp/forwarded-message listing importer. Raw text is
-- parsed (by a future server-side job) into structured parsed_data, then
-- reviewed by admin/agent before becoming a real `properties` row.
-- -----------------------------------------------------------------------------

create table public.listing_imports (
  id uuid primary key default gen_random_uuid(),
  raw_text text not null,
  parsed_data jsonb not null default '{}',
  status public.import_status not null default 'needs_review',
  created_by uuid references public.profiles(id),
  created_property_id uuid references public.properties(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.listing_imports is
  'Raw + parsed data for the future AI listing importer. Not used by Phase 2 UI yet.';

create trigger set_updated_at_listing_imports
  before update on public.listing_imports
  for each row execute function public.set_updated_at();

create index listing_imports_status_idx on public.listing_imports (status);
