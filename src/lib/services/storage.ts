// Storage service for property images (foundation only — the UI still
// uses placeholders in most places; see PropertySubmissionForm). Uses the
// `property-images` bucket from src/lib/db/storage.sql, which is a
// PRIVATE bucket gated by RLS on storage.objects, not a public bucket.
//
// TODO(storage): final decision on signed URLs vs a public approved-image
// proxy route. Signed URLs (used below) are simple and correct today, but
// expire and require a server round-trip to mint; a dedicated
// `/api/property-images/[path]` proxy that streams from the bucket after
// checking `properties.status = 'approved'` would avoid re-signing on
// every page load if this becomes a real bottleneck.

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfigStatus } from "@/lib/supabase/status";
import { addPropertyImage } from "./properties";
import { SUPABASE_NOT_CONFIGURED_RESULT, type ServiceResult } from "./result";

const BUCKET = "property-images";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

/**
 * Uploads an image file under property-images/{propertyId}/{filename}.
 * Uses the request-scoped server client — RLS restricts uploads to the
 * property's own owner/agent (while unapproved) or admin, see
 * property_images_bucket_insert_approved_uploader in storage.sql.
 */
export async function uploadPropertyImage(
  file: File,
  propertyId: string,
): Promise<ServiceResult<{ path: string }>> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return SUPABASE_NOT_CONFIGURED_RESULT;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return SUPABASE_NOT_CONFIGURED_RESULT;

  const path = `${propertyId}/${Date.now()}-${sanitizeFileName(file.name)}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    return { ok: false, message: "Failed to upload image. Please try a different file." };
  }

  return { ok: true, data: { path } };
}

export interface UploadPropertyImagesSummary {
  uploaded: number;
  failed: number;
}

/**
 * Best-effort: uploads each selected file and attaches it as a
 * property_images row. Called right after a property is created, but
 * deliberately never fails the caller's submission — the property
 * already exists as "pending" at that point, and a failed image is a
 * lesser problem than losing the whole submission. Skips anything that
 * isn't a real file (the common case when no file was chosen at all).
 */
export async function uploadPropertyImages(
  files: File[],
  propertyId: string,
): Promise<UploadPropertyImagesSummary> {
  let uploaded = 0;
  let failed = 0;

  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;

    const uploadResult = await uploadPropertyImage(file, propertyId);
    if (!uploadResult.ok) {
      failed += 1;
      continue;
    }

    const imageResult = await addPropertyImage(propertyId, uploadResult.data.path);
    if (!imageResult.ok) {
      failed += 1;
      continue;
    }

    uploaded += 1;
  }

  return { uploaded, failed };
}

/**
 * Returns a short-lived signed URL for a private bucket object, or null
 * if Supabase isn't configured, the caller isn't authorized under RLS,
 * or the object doesn't exist.
 */
export async function getPropertyImagePublicOrSignedUrl(path: string): Promise<string | null> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) return null;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return null;

  return data.signedUrl;
}

/**
 * Admin-only delete. Uses the service-role client so an admin can remove
 * any property's image regardless of who uploaded it, mirroring the
 * admin branch of property_images_bucket_delete_uploader_or_admin in
 * storage.sql explicitly rather than depending on the admin's own
 * session carrying the right storage grants.
 */
export async function deletePropertyImageForAdmin(path: string): Promise<ServiceResult> {
  const { isAdminClientConfigured } = getSupabaseConfigStatus();
  if (!isAdminClientConfigured) {
    return SUPABASE_NOT_CONFIGURED_RESULT;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return SUPABASE_NOT_CONFIGURED_RESULT;

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    return { ok: false, message: "Failed to delete image." };
  }

  return { ok: true, data: undefined };
}
