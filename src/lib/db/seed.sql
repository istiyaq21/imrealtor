-- =============================================================================
-- I'm Realtor — Phase 2 Seed Data (private beta testing only)
-- =============================================================================
-- Run this AFTER schema.sql, rls.sql, and storage.sql. Contains NO real
-- passwords or secrets — only placeholder profile/content data.
--
-- ⚠️ IMPORTANT — READ BEFORE RUNNING:
-- public.profiles.id is a foreign key into auth.users(id). You CANNOT
-- insert a profiles row for a user that doesn't exist in auth.users yet.
-- Before running the "profiles" section below:
--   1. In the Supabase Dashboard, go to Authentication > Users > Add user
--      and create 4 users (admin/agent/owner/buyer) with any email +
--      temporary password (or use "Send invite" instead of a password).
--   2. Copy each new user's UUID from the dashboard.
--   3. Replace the four PLACEHOLDER_*_ID values below with those real
--      UUIDs (find-and-replace is easiest).
-- Alternatively, run this via the Supabase CLI with `supabase auth admin
-- create-user` scripted ahead of this file.
--
-- The property/access-request/enquiry data below does NOT require real
-- auth users except where it references one of the four profiles.
-- =============================================================================

-- Replace these with real auth.users UUIDs before running (see note above).
-- Using a DO block with variables keeps the placeholder values in one place.
do $$
declare
  admin_id uuid := '00000000-0000-0000-0000-000000000001'; -- PLACEHOLDER_ADMIN_ID
  agent_id uuid := '00000000-0000-0000-0000-000000000002'; -- PLACEHOLDER_AGENT_ID
  owner_id uuid := '00000000-0000-0000-0000-000000000003'; -- PLACEHOLDER_OWNER_ID
  buyer_id uuid := '00000000-0000-0000-0000-000000000004'; -- PLACEHOLDER_BUYER_ID

  property_1 uuid := '10000000-0000-0000-0000-000000000001';
  property_2 uuid := '10000000-0000-0000-0000-000000000002';
  property_3 uuid := '10000000-0000-0000-0000-000000000003';
  property_4 uuid := '10000000-0000-0000-0000-000000000004';
begin

  -- ---------------------------------------------------------------------------
  -- Profiles (requires the 4 auth.users rows described above to already exist)
  -- ---------------------------------------------------------------------------
  insert into public.profiles (id, full_name, phone, email, role, status, city)
  values
    (admin_id, 'Vishal Sharma', '+91 90000 00001', 'admin@imrealtor.app', 'admin', 'approved', 'Mumbai'),
    (agent_id, 'Ananya Kapoor', '+91 90000 00002', 'ananya.agent@imrealtor.app', 'agent', 'approved', 'Mumbai'),
    (owner_id, 'Rahul Mehta', '+91 90000 00003', 'rahul.owner@imrealtor.app', 'owner', 'approved', 'Mumbai'),
    (buyer_id, 'Sneha Iyer', '+91 90000 00006', 'sneha.buyer@imrealtor.app', 'buyer', 'approved', 'Pune')
  on conflict (id) do nothing;

  -- ---------------------------------------------------------------------------
  -- Properties: 2 approved (one featured), 1 pending, 1 draft
  -- ---------------------------------------------------------------------------
  insert into public.properties (
    id, title, slug, purpose, type, city, locality, price, bedrooms, bathrooms,
    area, description, amenities, status, featured, owner_id, created_by,
    approved_by, approved_at
  )
  values
    (
      property_1, 'Sunrise Heights 3BHK', public.slugify('Sunrise Heights 3BHK') || '-' || substr(property_1::text, 1, 8),
      'sell', 'apartment', 'Mumbai', 'Andheri West', 21500000, 3, 3, '1450 sq ft',
      'A well-ventilated 3BHK apartment in a gated society with clubhouse, landscaped gardens, and 24x7 security.',
      array['Clubhouse', '24x7 Security', 'Power Backup', 'Covered Parking', 'Gym'],
      'approved', true, owner_id, agent_id, admin_id, now()
    ),
    (
      property_2, 'Lakeview 2BHK for Rent', public.slugify('Lakeview 2BHK for Rent') || '-' || substr(property_2::text, 1, 8),
      'rent', 'apartment', 'Pune', 'Hinjewadi', 32000, 2, 2, '1080 sq ft',
      'Semi-furnished 2BHK close to IT parks, ideal for working professionals.',
      array['Gym', 'Play Area', 'Lift', 'Power Backup'],
      'approved', false, owner_id, agent_id, admin_id, now()
    ),
    (
      property_3, 'Riverside Plot', public.slugify('Riverside Plot') || '-' || substr(property_3::text, 1, 8),
      'sell', 'plot', 'Hyderabad', 'Shamshabad', 8500000, null, null, '2400 sq ft',
      'Clear-title residential plot near the upcoming ring road expansion.',
      array['Clear Title', 'Gated Layout', 'Water Connection'],
      'pending', false, owner_id, owner_id, null, null
    ),
    (
      property_4, 'Heritage Bungalow', public.slugify('Heritage Bungalow') || '-' || substr(property_4::text, 1, 8),
      'sell', 'independent-house', 'Jaipur', 'Civil Lines', 62000000, 5, 5, '4800 sq ft',
      'Restored heritage bungalow with modern interiors and a large courtyard.',
      array['Courtyard', 'Heritage Architecture', 'Private Parking'],
      'draft', false, owner_id, owner_id, null, null
    )
  on conflict (id) do nothing;

  insert into public.agent_assignments (property_id, agent_id, assigned_by)
  values
    (property_1, agent_id, admin_id),
    (property_2, agent_id, admin_id)
  on conflict (property_id, agent_id) do nothing;

  -- ---------------------------------------------------------------------------
  -- Access requests: two pending, one already approved
  -- ---------------------------------------------------------------------------
  insert into public.access_requests (full_name, phone, email, requested_role, city, message, status, reviewed_by, reviewed_at)
  values
    ('Meera Joshi', '+91 90000 10001', 'meera.joshi@example.com', 'agent', 'Ahmedabad',
     '10+ years experience in residential real estate, looking to onboard as a verified agent.', 'pending', null, null),
    ('Vikram Desai', '+91 90000 10002', 'vikram.desai@example.com', 'owner', 'Surat',
     'I want to list my 2 residential properties for sale.', 'pending', null, null),
    ('Ritu Bansal', '+91 90000 10003', 'ritu.bansal@example.com', 'buyer', 'Mumbai',
     'Looking for a 2BHK in Andheri or Bandra within budget.', 'approved', admin_id, now());

  -- ---------------------------------------------------------------------------
  -- Enquiries against the approved properties above
  -- ---------------------------------------------------------------------------
  insert into public.enquiries (property_id, buyer_id, buyer_name, email, phone, message, status, assigned_agent_id)
  values
    (property_1, buyer_id, 'Sneha Iyer', 'sneha.buyer@imrealtor.app', '+91 90000 00006',
     'Is this property still available? Would like to schedule a visit this weekend.', 'new', agent_id),
    (property_2, null, 'Rohan Bhatt', 'rohan.bhatt@example.com', '+91 90000 20004',
     'Can the rent be negotiated slightly? Also need parking for 2 bikes.', 'new', agent_id);

end $$;
