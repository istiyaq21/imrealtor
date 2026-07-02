// Service layer for buyer enquiries. Read functions fall back to
// src/lib/mock-data.ts when Supabase isn't configured; mutations return a
// { ok: false, message } result instead.

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfigStatus } from "@/lib/supabase/status";
import {
  enquiries as mockEnquiries,
  getPropertyById,
  getEnquiriesForPropertyIds,
  getEnquiriesForBuyerName,
  getPropertiesByAssignedAgent,
  getPropertiesByOwnerId,
  getUserById,
} from "@/lib/mock-data";
import type { Enquiry, EnquiryStatus } from "@/lib/types";
import type { Tables } from "@/lib/database.types";
import { logAuditEvent } from "./audit";
import { SUPABASE_NOT_CONFIGURED_RESULT, type ServiceResult } from "./result";

type EnquiryRow = Tables<"enquiries">;

function mapRowToEnquiry(row: EnquiryRow, propertyTitle: string): Enquiry {
  return {
    id: row.id,
    propertyId: row.property_id,
    propertyTitle,
    buyerName: row.buyer_name,
    phone: row.phone,
    email: row.email ?? "",
    message: row.message ?? "",
    status: row.status,
    createdAt: row.created_at,
  };
}

function resolvePropertyTitle(row: EnquiryRow): string {
  const joined = row as EnquiryRow & { properties?: { title: string } | null };
  return joined.properties?.title ?? getPropertyById(row.property_id)?.title ?? "Unknown property";
}

export interface CreateEnquiryInput {
  propertyId: string;
  buyerName: string;
  phone: string;
  email?: string;
  message?: string;
  buyerId?: string;
}

/**
 * Public entry point for property detail page enquiry forms. RLS (see
 * enquiries_insert_public_for_approved_property in rls.sql) only allows
 * this against a property with status = 'approved' — this extra
 * application-level check exists purely to return a friendlier error
 * message than a raw RLS-denied Postgres error would.
 */
export async function createEnquiry(
  input: CreateEnquiryInput,
): Promise<ServiceResult<{ id: string }>> {
  if (!input.buyerName.trim() || !input.phone.trim()) {
    return { ok: false, message: "Name and phone are required." };
  }

  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return SUPABASE_NOT_CONFIGURED_RESULT;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return SUPABASE_NOT_CONFIGURED_RESULT;

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("id", input.propertyId)
    .eq("status", "approved")
    .maybeSingle();

  if (propertyError || !property) {
    return { ok: false, message: "This property is no longer available for enquiries." };
  }

  const { data, error } = await supabase
    .from("enquiries")
    .insert({
      property_id: input.propertyId,
      buyer_id: input.buyerId ?? null,
      buyer_name: input.buyerName.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      message: input.message?.trim() || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: "Failed to send enquiry. Please try again." };
  }

  return { ok: true, data: { id: data.id } };
}

export async function listEnquiriesForAdmin(): Promise<Enquiry[]> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return mockEnquiries;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return mockEnquiries;

  const { data, error } = await supabase
    .from("enquiries")
    .select("*, properties(title)")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[services/enquiries] falling back to mock data:", error?.message);
    return mockEnquiries;
  }

  return data.map((row) => mapRowToEnquiry(row, resolvePropertyTitle(row)));
}

export async function listEnquiriesForBuyer(buyerId: string): Promise<Enquiry[]> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    // Mock enquiries have no buyerId, only buyerName — resolve the mock
    // user's name first, since that's the only link mock data models.
    const buyerName = getUserById(buyerId)?.name;
    return buyerName ? getEnquiriesForBuyerName(buyerName) : [];
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("enquiries")
    .select("*, properties(title)")
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => mapRowToEnquiry(row, resolvePropertyTitle(row)));
}

export async function listEnquiriesForAgent(agentId: string): Promise<Enquiry[]> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    const propertyIds = getPropertiesByAssignedAgent(agentId).map((p) => p.id);
    return getEnquiriesForPropertyIds(propertyIds);
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("enquiries")
    .select("*, properties(title)")
    .eq("assigned_agent_id", agentId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => mapRowToEnquiry(row, resolvePropertyTitle(row)));
}

/**
 * Enquiries against any of this owner's properties. Relies on RLS's
 * enquiries_select_property_owner policy — the `properties!inner` join
 * hint lets PostgREST filter on the embedded resource's column.
 */
export async function listEnquiriesForOwner(ownerId: string): Promise<Enquiry[]> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    const propertyIds = getPropertiesByOwnerId(ownerId).map((p) => p.id);
    return getEnquiriesForPropertyIds(propertyIds);
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("enquiries")
    .select("*, properties!inner(title, owner_id)")
    .eq("properties.owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => mapRowToEnquiry(row, resolvePropertyTitle(row)));
}

/**
 * Admin-only status update. Uses the service-role client since this is
 * meant to be called from a verified-admin server action.
 */
export async function updateEnquiryStatusForAdmin(
  id: string,
  status: EnquiryStatus,
  adminId?: string,
): Promise<ServiceResult> {
  const { isAdminClientConfigured } = getSupabaseConfigStatus();
  if (!isAdminClientConfigured) {
    return SUPABASE_NOT_CONFIGURED_RESULT;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return SUPABASE_NOT_CONFIGURED_RESULT;

  const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);

  if (error) {
    return { ok: false, message: "Failed to update enquiry status." };
  }

  await logAuditEvent({
    actorId: adminId,
    action: "enquiry.status_changed",
    entityType: "enquiry",
    entityId: id,
    metadata: { status },
  });

  return { ok: true, data: undefined };
}

/**
 * Agent-only status update, scoped to their own assigned enquiries. Uses
 * the request-scoped server client deliberately (not the service-role
 * client) — RLS's enquiries_update_assigned_agent policy is what actually
 * enforces "only your assigned enquiries", so this respects that instead
 * of bypassing it. If the enquiry isn't assigned to this agent, the
 * update silently affects 0 rows under RLS, which we detect via the
 * `.select()` below and report as a denial rather than a silent success.
 */
export async function updateEnquiryStatusForAgent(
  id: string,
  status: EnquiryStatus,
): Promise<ServiceResult> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return SUPABASE_NOT_CONFIGURED_RESULT;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return SUPABASE_NOT_CONFIGURED_RESULT;

  const { data, error } = await supabase.from("enquiries").update({ status }).eq("id", id).select("id");

  if (error) {
    return { ok: false, message: "Failed to update enquiry status." };
  }

  if (!data || data.length === 0) {
    return { ok: false, message: "This enquiry isn't assigned to you." };
  }

  return { ok: true, data: undefined };
}
