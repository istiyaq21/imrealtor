"use server";

// Public entry point — no role/auth guard here by design. This is the
// private beta's one intentionally-open write path (see
// access_requests_insert_anyone in rls.sql), and it only ever creates a
// row an admin must act on; it never creates a real account by itself.

import { createAccessRequest, type CreateAccessRequestInput } from "@/lib/services/access-requests";

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function submitAccessRequestAction(formData: FormData): Promise<ActionResult> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "") as CreateAccessRequestInput["roleRequested"];
  const city = String(formData.get("city") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!fullName || !phone || !email || !role) {
    return { ok: false, message: "Please fill in your name, phone, email, and requested role." };
  }

  const result = await createAccessRequest({
    fullName,
    phone,
    email,
    roleRequested: role,
    city: city || undefined,
    message: message || undefined,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  return { ok: true, message: "Thank you for your interest in I'm Realtor. Our team will review and contact you." };
}
