"use server";

import { revalidatePath } from "next/cache";
import { requireApprovedRole } from "@/lib/auth/session";
import { createPendingProperty } from "@/lib/services/properties";
import { uploadPropertyImages } from "@/lib/services/storage";
import { updateEnquiryStatusForAgent } from "@/lib/services/enquiries";
import type { EnquiryStatus, PropertyPurpose } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  message: string;
}

/**
 * Agents submit listings the same way owners do — always "pending", and
 * an agent can never set status/featured directly (enforced by RLS +
 * the guard_property_approval_fields trigger in rls.sql, not by this
 * function). No ownerId is set here since the agent is submitting on
 * behalf of a property they don't own; admin can assign an owner later
 * if needed.
 */
export async function submitAgentPropertyAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireApprovedRole(["agent"]);

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
    createdBy: profile.id,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  const imageFiles = formData.getAll("images").filter((entry): entry is File => entry instanceof File);
  let message = "Listing submitted for admin review.";

  if (imageFiles.length > 0) {
    const { uploaded, failed } = await uploadPropertyImages(imageFiles, result.data.id);
    if (uploaded > 0) message += ` ${uploaded} image${uploaded === 1 ? "" : "s"} uploaded.`;
    if (failed > 0) {
      message += ` ${failed} image${failed === 1 ? "" : "s"} could not be uploaded — you can add them later.`;
    }
  }

  revalidatePath("/agent/listings");
  revalidatePath("/agent");
  return { ok: true, message };
}

export async function updateAgentEnquiryStatusAction(id: string, status: EnquiryStatus): Promise<ActionResult> {
  await requireApprovedRole(["agent"]);

  const result = await updateEnquiryStatusForAgent(id, status);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath("/agent");
  return { ok: true, message: "Enquiry updated." };
}
