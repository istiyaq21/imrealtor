"use server";

// Admin-only server actions. Every export here calls
// requireApprovedRole(["admin"]) first — none of the underlying service
// functions should be reachable from a client component without going
// through one of these, and none of them import the service-role client
// directly into anything client-facing.

import { revalidatePath } from "next/cache";
import { requireApprovedRole } from "@/lib/auth/session";
import {
  assignAgentToPropertyForAdmin,
  setPropertyFeaturedForAdmin,
  updatePropertyStatusForAdmin,
} from "@/lib/services/properties";
import { updateUserRoleForAdmin, updateUserStatusForAdmin } from "@/lib/services/profiles";
import { updateEnquiryStatusForAdmin } from "@/lib/services/enquiries";
import { updateAccessRequestStatusForAdmin } from "@/lib/services/access-requests";
import type { ApprovalStatus, EnquiryStatus, UserRole } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  message: string;
}

export async function approvePropertyAction(id: string): Promise<ActionResult> {
  const admin = await requireApprovedRole(["admin"]);

  const result = await updatePropertyStatusForAdmin(id, "approved", { adminId: admin.id });
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath("/admin/listings");
  revalidatePath("/admin");
  revalidatePath("/properties");
  revalidatePath(`/properties/${id}`);
  revalidatePath("/");
  return { ok: true, message: "Listing approved." };
}

export async function rejectPropertyAction(id: string, reason: string): Promise<ActionResult> {
  const admin = await requireApprovedRole(["admin"]);

  const result = await updatePropertyStatusForAdmin(id, "rejected", {
    adminId: admin.id,
    rejectedReason: reason || undefined,
  });
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath("/admin/listings");
  revalidatePath("/admin");
  return { ok: true, message: "Listing rejected." };
}

export async function featurePropertyAction(id: string, featured: boolean): Promise<ActionResult> {
  const admin = await requireApprovedRole(["admin"]);

  const result = await setPropertyFeaturedForAdmin(id, featured, admin.id);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath("/admin/listings");
  revalidatePath("/properties");
  revalidatePath("/");
  return { ok: true, message: featured ? "Listing featured." : "Listing unfeatured." };
}

export async function updateUserStatusAction(id: string, status: ApprovalStatus): Promise<ActionResult> {
  const admin = await requireApprovedRole(["admin"]);

  const result = await updateUserStatusForAdmin(id, status, admin.id);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { ok: true, message: "User status updated." };
}

export async function updateUserRoleAction(id: string, role: UserRole): Promise<ActionResult> {
  const admin = await requireApprovedRole(["admin"]);

  const result = await updateUserRoleForAdmin(id, role, admin.id);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath("/admin/users");
  return { ok: true, message: "User role updated." };
}

export async function updateEnquiryStatusAction(id: string, status: EnquiryStatus): Promise<ActionResult> {
  const admin = await requireApprovedRole(["admin"]);

  const result = await updateEnquiryStatusForAdmin(id, status, admin.id);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath("/admin/enquiries");
  revalidatePath("/admin");
  return { ok: true, message: "Enquiry updated." };
}

export async function updateAccessRequestStatusAction(
  id: string,
  status: "approved" | "rejected",
): Promise<ActionResult> {
  const admin = await requireApprovedRole(["admin"]);

  const result = await updateAccessRequestStatusForAdmin(id, status, admin.id);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath("/admin");
  // TODO(phase-5): approving here only flips access_requests.status — it
  // does not yet create the matching auth.users + profiles rows. Admin
  // still needs to create the account manually (see docs/SUPABASE_SETUP.md)
  // until an invite flow exists.
  return { ok: true, message: "Access request updated." };
}

export async function assignAgentAction(propertyId: string, agentId: string): Promise<ActionResult> {
  const admin = await requireApprovedRole(["admin"]);

  const result = await assignAgentToPropertyForAdmin(propertyId, agentId, admin.id);
  if (!result.ok) return { ok: false, message: result.message };

  revalidatePath("/admin/listings");
  revalidatePath("/agent");
  return { ok: true, message: "Agent assigned." };
}
