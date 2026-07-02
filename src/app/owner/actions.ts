"use server";

import { revalidatePath } from "next/cache";
import { requireApprovedRole } from "@/lib/auth/session";
import { addPropertyImage, createPendingProperty } from "@/lib/services/properties";
import { uploadPropertyImage } from "@/lib/services/storage";
import type { PropertyPurpose } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function submitOwnerPropertyAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireApprovedRole(["owner"]);

  const title = String(formData.get("title") ?? "").trim();
  const purpose = String(formData.get("purpose") ?? "") as PropertyPurpose;
  const type = String(formData.get("type") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const locality = String(formData.get("locality") ?? "").trim();
  const price = Number(formData.get("price"));
  const area = String(formData.get("area") ?? "").trim();
  const bedroomsRaw = formData.get("bedrooms");
  const bathroomsRaw = formData.get("bathrooms");
  const description = String(formData.get("description") ?? "").trim();
  const amenities = formData.getAll("amenities").map(String);

  if (!title || !purpose || !type || !city || !locality || !description || !Number.isFinite(price) || price < 0) {
    return { ok: false, message: "Please fill in all required fields." };
  }

  const result = await createPendingProperty({
    title,
    purpose,
    type,
    city,
    locality,
    price,
    bedrooms: bedroomsRaw ? Number(bedroomsRaw) : undefined,
    bathrooms: bathroomsRaw ? Number(bathroomsRaw) : undefined,
    area: area || undefined,
    description,
    amenities,
    ownerId: profile.id,
    createdBy: profile.id,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  revalidatePath("/owner");
  return { ok: true, message: "Property submitted for admin review." };
}

/**
 * Foundation only: attaches an already-selected image file to a pending
 * property the owner just created. PropertySubmissionForm's image field
 * is still a placeholder UI, so nothing currently calls this — it exists
 * so the plumbing is ready once a real file input is wired up.
 */
export async function uploadPropertyImageAction(formData: FormData): Promise<ActionResult> {
  await requireApprovedRole(["owner"]);

  const propertyId = String(formData.get("propertyId") ?? "");
  const file = formData.get("file");

  if (!propertyId || !(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a property and an image file first." };
  }

  const uploadResult = await uploadPropertyImage(file, propertyId);
  if (!uploadResult.ok) {
    return { ok: false, message: uploadResult.message };
  }

  const imageResult = await addPropertyImage(propertyId, uploadResult.data.path);
  if (!imageResult.ok) {
    return { ok: false, message: imageResult.message };
  }

  revalidatePath("/owner");
  return { ok: true, message: "Image uploaded." };
}
