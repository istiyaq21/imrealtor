-- Fix a public-listing SELECT failure under strict Supabase API grants.
-- The agent-assignment visibility policy must not be evaluated for anonymous
-- users: they do not have SELECT privileges on agent_assignments, by design.
-- Run this ONCE in the Supabase SQL Editor after grants.sql.
-- This does not loosen privileges, expose assignments, or disable RLS.

drop policy if exists "properties_select_agent_assigned" on public.properties;

create policy "properties_select_agent_assigned"
  on public.properties
  for select
  to authenticated
  using (
    public.is_approved_agent()
    and exists (
      select 1 from public.agent_assignments aa
      where aa.property_id = properties.id
        and aa.agent_id = auth.uid()
    )
  );

-- Public approved listings should be accessible without the user needing
-- direct permission on agent_assignments. All other listing RLS remains.
