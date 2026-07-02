// Service layer for buyer enquiries. Read functions fall back to
// src/lib/mock-data.ts when Supabase isn't configured; mutations return a
// { ok: false, message } result instead.

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfigStatus } from "@/lib/supabase/status";
import { enquiries as mockEnquiries, getPropertyById } from "@/lib/mock-data";
import type { Enquiry, EnquiryStatus } from "@/lib/types";
import type { Tables } from "@/lib/database.types";
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
    // TODO(phase-4): DB enquiry_status also has a 'spam' value that the
    // app's EnquiryStatus type doesn't model yet — surface it once the
    // admin UI has a way to display/filter spam enquiries.
    status: row.status as EnquiryStatus,
    createdAt: row.created_at,
  };
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
 * this against a property with status = 'approved'.
 */
export async function createEnquiry(
  input: CreateEnquiryInput,
): Promise<ServiceResult<{ id: string }>> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return SUPABASE_NOT_CONFIGURED_RESULT;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return SUPABASE_NOT_CONFIGURED_RESULT;

  const { data, error } = await supabase
    .from("enquiries")
    .insert({
      property_id: input.propertyId,
      buyer_id: input.buyerId ?? null,
      buyer_name: input.buyerName,
      phone: input.phone,
      email: input.email ?? null,
      message: input.message ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "Failed to send enquiry." };
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

  return data.map((row) => {
    // `properties(title)` comes back as a joined object when the FK is
    // singular; fall back to a local lookup if the join shape ever changes.
    const joined = row as EnquiryRow & { properties?: { title: string } | null };
    const propertyTitle = joined.properties?.title ?? getPropertyById(row.property_id)?.title ?? "Unknown property";
    return mapRowToEnquiry(row, propertyTitle);
  });
}

/**
 * Admin-only status update. Uses the service-role client since this is
 * meant to be called from a verified-admin server action.
 */
export async function updateEnquiryStatusForAdmin(
  id: string,
  status: EnquiryStatus,
): Promise<ServiceResult> {
  const { isAdminClientConfigured } = getSupabaseConfigStatus();
  if (!isAdminClientConfigured) {
    return SUPABASE_NOT_CONFIGURED_RESULT;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return SUPABASE_NOT_CONFIGURED_RESULT;

  const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, data: undefined };
}
