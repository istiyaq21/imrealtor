// Service layer for private-beta "Request Access" submissions. Read
// functions fall back to src/lib/mock-data.ts when Supabase isn't
// configured; mutations return a { ok: false, message } result instead.

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfigStatus } from "@/lib/supabase/status";
import { accessRequests as mockAccessRequests } from "@/lib/mock-data";
import type { AccessRequest, ApprovalStatus, UserRole } from "@/lib/types";
import type { Tables } from "@/lib/database.types";
import { SUPABASE_NOT_CONFIGURED_RESULT, type ServiceResult } from "./result";

type AccessRequestRow = Tables<"access_requests">;

function mapRowToAccessRequest(row: AccessRequestRow): AccessRequest {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    roleRequested: row.requested_role as AccessRequest["roleRequested"],
    city: row.city ?? "",
    message: row.message ?? "",
    // DB access_request_status enum (pending/approved/rejected) is a subset
    // of the app's shared ApprovalStatus type; map 1:1 since values line up.
    status: row.status as ApprovalStatus,
    createdAt: row.created_at,
  };
}

export interface CreateAccessRequestInput {
  fullName: string;
  phone: string;
  email: string;
  roleRequested: Exclude<UserRole, "admin" | "support">;
  city?: string;
  message?: string;
}

/**
 * Public entry point for the /request-access form. Intentionally allowed
 * for anonymous visitors (see rls.sql access_requests_insert_anyone) —
 * this is the private beta's controlled front door, not open signup.
 */
export async function createAccessRequest(
  input: CreateAccessRequestInput,
): Promise<ServiceResult<{ id: string }>> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return SUPABASE_NOT_CONFIGURED_RESULT;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return SUPABASE_NOT_CONFIGURED_RESULT;

  const { data, error } = await supabase
    .from("access_requests")
    .insert({
      full_name: input.fullName,
      phone: input.phone,
      email: input.email,
      requested_role: input.roleRequested,
      city: input.city ?? null,
      message: input.message ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "Failed to submit access request." };
  }

  return { ok: true, data: { id: data.id } };
}

export async function listPendingAccessRequestsForAdmin(): Promise<AccessRequest[]> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return mockAccessRequests.filter((request) => request.status === "pending");
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return mockAccessRequests.filter((request) => request.status === "pending");

  const { data, error } = await supabase
    .from("access_requests")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[services/access-requests] falling back to mock data:", error?.message);
    return mockAccessRequests.filter((request) => request.status === "pending");
  }

  return data.map(mapRowToAccessRequest);
}

/**
 * Admin-only approve/reject action. Uses the service-role client since
 * approving a request should also be able to create the corresponding
 * profile/auth user in a future phase, which requires bypassing RLS.
 *
 * TODO(phase-3): on approval, also create the auth.users + profiles rows
 * (or send an invite email) instead of just flipping this row's status.
 */
export async function updateAccessRequestStatusForAdmin(
  id: string,
  status: "approved" | "rejected",
  adminId?: string,
): Promise<ServiceResult> {
  const { isAdminClientConfigured } = getSupabaseConfigStatus();
  if (!isAdminClientConfigured) {
    return SUPABASE_NOT_CONFIGURED_RESULT;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return SUPABASE_NOT_CONFIGURED_RESULT;

  const { error } = await supabase
    .from("access_requests")
    .update({
      status,
      reviewed_by: adminId ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, data: undefined };
}
