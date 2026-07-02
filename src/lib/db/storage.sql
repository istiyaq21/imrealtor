-- =============================================================================
-- I'm Realtor — Phase 2 Storage Bucket Plan
-- =============================================================================
-- Run this AFTER schema.sql and rls.sql (it depends on public.properties
-- and the is_admin()/is_approved_*() helpers).
--
-- Bucket: property-images
-- Path convention: property-images/{property_id}/{filename}
--   (the "property-images" segment is the bucket itself — an object's
--   `name` inside the bucket is just "{property_id}/{filename}")
--
-- ⚠️ NOTE on "public read for approved images only": Supabase buckets
-- marked `public = true` skip RLS entirely for reads (anyone with the URL
-- can fetch the object, approved or not). To actually gate reads on
-- `properties.status = 'approved'`, this bucket is created as PRIVATE and
-- read access is granted via an RLS policy on storage.objects instead —
-- the anon key still respects RLS for private buckets. If you create the
-- bucket manually via Dashboard > Storage > New bucket, leave the
-- "Public bucket" toggle OFF.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', false)
on conflict (id) do nothing;

-- Extracts the {property_id} folder segment from an object path and
-- returns it as a uuid, or null if the path doesn't start with a valid
-- uuid segment (defensive — avoids a cast error breaking the policy).
create or replace function public.storage_object_property_id(object_name text)
returns uuid
language plpgsql
stable
as $$
declare
  first_segment text;
begin
  first_segment := (storage.foldername(object_name))[1];
  if first_segment is null then
    return null;
  end if;
  return first_segment::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

-- -----------------------------------------------------------------------------
-- storage.objects policies, scoped to bucket_id = 'property-images'
-- -----------------------------------------------------------------------------

create policy "property_images_bucket_select_public_approved"
  on storage.objects for select
  using (
    bucket_id = 'property-images'
    and exists (
      select 1 from public.properties p
      where p.id = public.storage_object_property_id(storage.objects.name)
        and p.status = 'approved'
    )
  );

create policy "property_images_bucket_select_admin"
  on storage.objects for select
  using (bucket_id = 'property-images' and public.is_admin());

create policy "property_images_bucket_select_owner_or_agent"
  on storage.objects for select
  using (
    bucket_id = 'property-images'
    and exists (
      select 1 from public.properties p
      where p.id = public.storage_object_property_id(storage.objects.name)
        and (p.owner_id = auth.uid() or p.created_by = auth.uid())
    )
  );

-- Upload restricted to admin, or the approved agent/owner who owns the
-- (not-yet-approved) property the image is being attached to.
create policy "property_images_bucket_insert_approved_uploader"
  on storage.objects for insert
  with check (
    bucket_id = 'property-images'
    and (
      public.is_admin()
      or (
        (public.is_approved_agent() or public.is_approved_owner())
        and exists (
          select 1 from public.properties p
          where p.id = public.storage_object_property_id(storage.objects.name)
            and (p.owner_id = auth.uid() or p.created_by = auth.uid())
            and p.status in ('draft', 'pending')
        )
      )
    )
  );

create policy "property_images_bucket_delete_uploader_or_admin"
  on storage.objects for delete
  using (
    bucket_id = 'property-images'
    and (
      public.is_admin()
      or exists (
        select 1 from public.properties p
        where p.id = public.storage_object_property_id(storage.objects.name)
          and (p.owner_id = auth.uid() or p.created_by = auth.uid())
          and p.status in ('draft', 'pending')
      )
    )
  );

-- No update policy: treat uploads as immutable — delete + re-upload
-- instead of overwriting in place. This keeps audit history simpler.

-- -----------------------------------------------------------------------------
-- Manual dashboard steps (if you prefer not to run the insert above)
-- -----------------------------------------------------------------------------
-- 1. Dashboard > Storage > New bucket
-- 2. Name: property-images
-- 3. Public bucket: OFF
-- 4. File size limit / allowed MIME types: set per your needs (e.g. 5MB,
--    image/png, image/jpeg, image/webp) — not enforced by this SQL file.
-- 5. Re-run the "storage.objects policies" section above from the SQL
--    editor after creating the bucket via the dashboard.
