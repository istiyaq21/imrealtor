// Service layer for properties. Every read function transparently falls
// back to src/lib/mock-data.ts when Supabase isn't configured, so existing
// pages keep working unchanged. Mutation functions instead return a
// { ok: false, message } result when Supabase isn't configured, since
// there's no safe mock write to fall back to.
//
// TODO(phase-3/4): once real auth exists, wire these into
// Server Components/Server Actions in src/app/** to replace the direct
// mock-data imports currently used by the frontend.

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfigStatus } from "@/lib/supabase/status";
import {
  getApprovedProperties as getMockApprovedProperties,
  getFeaturedProperties as getMockFeaturedProperties,
  getPropertyById as getMockPropertyById,
} from "@/lib/mock-data";
import type { Property, ListingStatus, PropertyPurpose, PropertyType } from "@/lib/types";
import type { Tables } from "@/lib/database.types";
import { SUPABASE_NOT_CONFIGURED_RESULT, type ServiceResult } from "./result";

type PropertyRow = Tables<"properties">;

function mapRowToProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    title: row.title,
    city: row.city,
    locality: row.locality,
    price: Number(row.price),
    purpose: row.purpose,
    // TODO(phase-4): `type` is free text in the DB (schema.sql) but a closed
    // union in the app layer (src/lib/types.ts) — validate/narrow once real
    // listing types are finalized, instead of trusting the cast below.
    type: row.type as PropertyType,
    bedrooms: row.bedrooms ?? 0,
    bathrooms: row.bathrooms ?? 0,
    // TODO(phase-4): `area` is stored as free text (e.g. "1450 sq ft") to
    // support imported listings; parse/normalize before display.
    area: Number.parseInt(row.area ?? "0", 10) || 0,
    status: row.status as ListingStatus,
    featured: row.featured,
    // TODO(phase-4): join property_images instead of a static placeholder.
    image: "/window.svg",
    description: row.description ?? "",
    amenities: row.amenities,
    // TODO(phase-4): join agent_assignments for the currently assigned agent.
    assignedAgent: null,
    ownerId: row.owner_id ?? "",
    createdAt: row.created_at,
  };
}

export interface CreatePendingPropertyInput {
  title: string;
  purpose: PropertyPurpose;
  type: string;
  city: string;
  locality: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  description?: string;
  amenities?: string[];
  ownerId?: string;
  createdBy?: string;
}

export async function getPublicApprovedProperties(): Promise<Property[]> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return getMockApprovedProperties();
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return getMockApprovedProperties();

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[services/properties] falling back to mock data:", error?.message);
    return getMockApprovedProperties();
  }

  return data.map(mapRowToProperty);
}

export async function getFeaturedPublicProperties(): Promise<Property[]> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return getMockFeaturedProperties();
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return getMockFeaturedProperties();

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("status", "approved")
    .eq("featured", true)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[services/properties] falling back to mock data:", error?.message);
    return getMockFeaturedProperties();
  }

  return data.map(mapRowToProperty);
}

export async function getPublicPropertyById(id: string): Promise<Property | undefined> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return getMockPropertyById(id);
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return getMockPropertyById(id);

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (error || !data) {
    return undefined;
  }

  return mapRowToProperty(data);
}

/**
 * Creates a property in "pending" status on behalf of an owner/agent.
 * Uses the request-scoped server client so Row Level Security (see
 * src/lib/db/rls.sql) applies exactly as it would for that logged-in user.
 */
export async function createPendingProperty(
  input: CreatePendingPropertyInput,
): Promise<ServiceResult<{ id: string }>> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return SUPABASE_NOT_CONFIGURED_RESULT;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return SUPABASE_NOT_CONFIGURED_RESULT;

  const { data, error } = await supabase
    .from("properties")
    .insert({
      title: input.title,
      purpose: input.purpose,
      type: input.type,
      city: input.city,
      locality: input.locality,
      price: input.price,
      bedrooms: input.bedrooms ?? null,
      bathrooms: input.bathrooms ?? null,
      area: input.area ?? null,
      description: input.description ?? null,
      amenities: input.amenities ?? [],
      status: "pending",
      owner_id: input.ownerId ?? null,
      created_by: input.createdBy ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "Failed to submit property." };
  }

  return { ok: true, data: { id: data.id } };
}

/**
 * Admin-only status change. Uses the service-role client (bypasses RLS)
 * because this is meant to be called from a verified-admin server action,
 * not directly from arbitrary user input.
 *
 * TODO(phase-3/4): gate the call site of this function behind a real
 * "is this session an approved admin?" check before exposing it.
 */
export async function updatePropertyStatusForAdmin(
  id: string,
  status: ListingStatus,
  adminId?: string,
): Promise<ServiceResult> {
  const { isAdminClientConfigured } = getSupabaseConfigStatus();
  if (!isAdminClientConfigured) {
    return SUPABASE_NOT_CONFIGURED_RESULT;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return SUPABASE_NOT_CONFIGURED_RESULT;

  const { error } = await supabase
    .from("properties")
    .update({
      status,
      approved_by: status === "approved" ? adminId ?? null : null,
      approved_at: status === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, data: undefined };
}
