"use server";

// Server actions for the public property pages. Enquiries are allowed
// from anonymous visitors (guest enquiry) as long as the target property
// is approved — enforced inside services/enquiries.ts, not here. Saving
// a property requires an approved buyer session.

import { revalidatePath } from "next/cache";
import { getCurrentProfile, getCurrentUser, requireApprovedRole } from "@/lib/auth/session";
import { createEnquiry } from "@/lib/services/enquiries";
import { savePropertyForBuyer, unsavePropertyForBuyer } from "@/lib/services/saved-properties";

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function submitEnquiryAction(formData: FormData): Promise<ActionResult> {
  const propertyId = String(formData.get("propertyId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!propertyId || !name || !phone) {
    return { ok: false, message: "Please fill in your name and phone number." };
  }

  // Best-effort: if the visitor happens to be signed in as an approved
  // buyer, link the enquiry to their profile. Guests can still enquire.
  const user = await getCurrentUser();
  const profile = user ? await getCurrentProfile() : null;

  const result = await createEnquiry({
    propertyId,
    buyerName: name,
    phone,
    email: email || undefined,
    message: message || undefined,
    buyerId: profile?.role === "buyer" && profile.status === "approved" ? profile.id : undefined,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  revalidatePath(`/properties/${propertyId}`);
  return { ok: true, message: "Your enquiry has been sent. The assigned agent will contact you shortly." };
}

export async function savePropertyAction(propertyId: string): Promise<ActionResult> {
  const profile = await requireApprovedRole(["buyer"]);

  const result = await savePropertyForBuyer(profile.id, propertyId);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath("/buyer");
  revalidatePath(`/properties/${propertyId}`);
  return { ok: true, message: "Saved to your dashboard." };
}

export async function unsavePropertyAction(propertyId: string): Promise<ActionResult> {
  const profile = await requireApprovedRole(["buyer"]);

  const result = await unsavePropertyForBuyer(profile.id, propertyId);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath("/buyer");
  revalidatePath(`/properties/${propertyId}`);
  return { ok: true, message: "Removed from saved properties." };
}
