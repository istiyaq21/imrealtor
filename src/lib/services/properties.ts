// Service layer for properties. Every read function transparently falls
// back to src/lib/mock-data.ts when Supabase isn't configured, so existing
// pages keep working unchanged. Mutation functions instead return a
// { ok: false, message } result when Supabase isn't configured, since
// there's no safe mock write to fall back to.
//
// Read functions default to the request-scoped server client (respects
// RLS via the caller's own session) — this is deliberate: even the
// "*ForAdmin" reads go through RLS's admin policies rather than the
// service-role client, so a bug in a call site can't silently expose
// everything. Only mutations that need to bypass a client-side-unsafe
// restriction (self-approval, role/status escalation) use the
// service-role client, and only ever from server actions gated by
// requireApprovedRole(["admin"]).

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfigStatus } from "@/lib/supabase/status";
import {
  getApprovedProperties as getMockApprovedProperties,
  getFeaturedProperties as getMockFeaturedProperties,
  getPropertyById as getMockPropertyById,
  getPropertiesByOwnerId as getMockPropertiesByOwnerId,
  getPropertiesByAssignedAgent as getMockPropertiesByAssignedAgent,
  properties as mockProperties,
} from "@/lib/mock-data";
import type { Property, ListingStatus, PropertyPurpose, PropertyType } from "@/lib/types";
import type { Tables } from "@/lib/database.types";
import { logAuditEvent } from "./audit";
import { SUPABASE_NOT_CONFIGURED_RESULT, type ServiceResult } from "./result";

type PropertyRow = Tables<"properties">;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function mapRowToProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    slug: row.slug ?? undefined,
    title: row.title,
    city: row.city,
    locality: row.locality,
    price: Number(row.price),
    purpose: row.purpose,
    // TODO(phase-5): `type` is free text in the DB (schema.sql) but a closed
    // union in the app layer (src/lib/types.ts) — validate/narrow once real
    // listing types are finalized, instead of trusting the cast below.
    type: row.type as PropertyType,
    bedrooms: row.bedrooms ?? 0,
    bathrooms: row.bathrooms ?? 0,
    // TODO(phase-5): `area` is stored as free text (e.g. "1450 sq ft") to
    // support imported listings; parse/normalize before display.
    area: Number.parseInt(row.area ?? "0", 10) || 0,
    status: row.status as ListingStatus,
    featured: row.featured,
    // TODO(phase-5): join property_images for list/grid views. Deferred to
    // avoid an N+1 query per card — a Postgres view exposing "first image
    // per property" would be the efficient fix. The detail page instead
    // calls listPropertyImages() directly (see properties/[id]/page.tsx).
    image: "/window.svg",
    description: row.description ?? "",
    amenities: row.amenities,
    // TODO(phase-5): join agent_assignments for list/grid views (same N+1
    // concern as images). getPublicPropertyById() resolves this for the
    // detail page via a single scoped lookup — see getAssignedAgentName().
    assignedAgent: null,
    ownerId: row.owner_id ?? "",
    createdAt: row.created_at,
  };
}

export interface PublicPropertyFilters {
  q?: string;
  city?: string;
  type?: string;
  purpose?: PropertyPurpose;
  maxBudget?: number;
  minBedrooms?: number;
}

function matchesMockFilters(property: Property, filters?: PublicPropertyFilters): boolean {
  if (!filters) return true;
  if (filters.q) {
    const haystack = `${property.title} ${property.city} ${property.locality}`.toLowerCase();
    if (!haystack.includes(filters.q.toLowerCase())) return false;
  }
  if (filters.city && property.city !== filters.city) return false;
  if (filters.type && property.type !== filters.type) return false;
  if (filters.purpose && property.purpose !== filters.purpose) return false;
  if (filters.maxBudget && property.price > filters.maxBudget) return false;
  if (filters.minBedrooms && property.bedrooms < filters.minBedrooms) return false;
  return true;
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

export interface AdminPropertyFilters {
  status?: ListingStatus;
  city?: string;
}

export async function getPublicApprovedProperties(filters?: PublicPropertyFilters): Promise<Property[]> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return getMockApprovedProperties().filter((p) => matchesMockFilters(p, filters));
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return getMockApprovedProperties().filter((p) => matchesMockFilters(p, filters));

  let query = supabase.from("properties").select("*").eq("status", "approved");

  if (filters?.city) query = query.eq("city", filters.city);
  if (filters?.type) query = query.eq("type", filters.type);
  if (filters?.purpose) query = query.eq("purpose", filters.purpose);
  if (filters?.maxBudget) query = query.lte("price", filters.maxBudget);
  if (filters?.minBedrooms) query = query.gte("bedrooms", filters.minBedrooms);
  if (filters?.q) {
    // `.or()` splits on commas, so strip them from user input to avoid a
    // malformed filter string (not an injection risk via PostgREST, just
    // a correctness one).
    const q = filters.q.replace(/[,%]/g, "").trim();
    if (q) {
      query = query.or(`title.ilike.%${q}%,city.ilike.%${q}%,locality.ilike.%${q}%`);
    }
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[services/properties] falling back to mock data:", error?.message);
    return getMockApprovedProperties().filter((p) => matchesMockFilters(p, filters));
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

/**
 * Resolves the assigned agent's display name for a public listing.
 * Uses the service-role client deliberately: this is a narrow,
 * read-only, single-column lookup used only to assemble a public-safe
 * view (a name, nothing sensitive) — agent_assignments/profiles have no
 * public SELECT policy otherwise. Not a general-purpose profile lookup.
 */
async function getAssignedAgentName(propertyId: string): Promise<string | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("agent_assignments")
    .select("profiles(full_name)")
    .eq("property_id", propertyId)
    .limit(1)
    .maybeSingle();

  const joined = data as { profiles?: { full_name: string } | null } | null;
  return joined?.profiles?.full_name ?? null;
}

export interface PublicPropertyDetail {
  property: Property;
  assignedAgentName: string | null;
}

/**
 * Looks up a property by id (uuid) or slug. Mock mode only supports the
 * short mock ids (e.g. "p1") since mock data has no slug field.
 */
export async function getPublicPropertyById(idOrSlug: string): Promise<PublicPropertyDetail | undefined> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    const property = getMockPropertyById(idOrSlug);
    return property ? { property, assignedAgentName: null } : undefined;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    const property = getMockPropertyById(idOrSlug);
    return property ? { property, assignedAgentName: null } : undefined;
  }

  let query = supabase.from("properties").select("*").eq("status", "approved");
  query = UUID_RE.test(idOrSlug) ? query.or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`) : query.eq("slug", idOrSlug);

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    return undefined;
  }

  const assignedAgentName = await getAssignedAgentName(data.id);
  return { property: mapRowToProperty(data), assignedAgentName };
}

/**
 * Creates a property in "pending" status on behalf of an owner/agent.
 * Uses the request-scoped server client so Row Level Security (see
 * src/lib/db/rls.sql) applies exactly as it would for that logged-in user
 * — owners/agents literally cannot insert a row with status != pending,
 * enforced at the database level regardless of what this function does.
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
    return { ok: false, message: "Failed to submit property. Please check your details and try again." };
  }

  return { ok: true, data: { id: data.id } };
}

/**
 * Admin-only status change. Uses the service-role client (bypasses RLS)
 * because this is meant to be called from a verified-admin server action,
 * not directly from arbitrary user input — call sites MUST gate this
 * behind requireApprovedRole(["admin"]) (see src/app/admin/actions.ts).
 */
export async function updatePropertyStatusForAdmin(
  id: string,
  status: ListingStatus,
  options?: { adminId?: string; rejectedReason?: string },
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
      approved_by: status === "approved" ? options?.adminId ?? null : null,
      approved_at: status === "approved" ? new Date().toISOString() : null,
      rejected_reason: status === "rejected" ? options?.rejectedReason ?? null : null,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, message: "Failed to update the listing status." };
  }

  await logAuditEvent({
    actorId: options?.adminId,
    action: `property.${status}`,
    entityType: "property",
    entityId: id,
    metadata: options?.rejectedReason ? { rejectedReason: options.rejectedReason } : {},
  });

  return { ok: true, data: undefined };
}

export async function setPropertyFeaturedForAdmin(
  id: string,
  featured: boolean,
  adminId?: string,
): Promise<ServiceResult> {
  const { isAdminClientConfigured } = getSupabaseConfigStatus();
  if (!isAdminClientConfigured) {
    return SUPABASE_NOT_CONFIGURED_RESULT;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return SUPABASE_NOT_CONFIGURED_RESULT;

  const { error } = await supabase.from("properties").update({ featured }).eq("id", id);

  if (error) {
    return { ok: false, message: "Failed to update the featured flag." };
  }

  await logAuditEvent({
    actorId: adminId,
    action: featured ? "property.featured" : "property.unfeatured",
    entityType: "property",
    entityId: id,
  });

  return { ok: true, data: undefined };
}

/**
 * Full listing table for admin. Uses the request-scoped server client —
 * relies on the `properties_select_admin_all` RLS policy, so this only
 * actually returns everything when the calling session is really an
 * approved admin, regardless of what this function assumes.
 */
export async function listPropertiesForAdmin(filters?: AdminPropertyFilters): Promise<Property[]> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return mockProperties.filter((p) => {
      if (filters?.status && p.status !== filters.status) return false;
      if (filters?.city && p.city !== filters.city) return false;
      return true;
    });
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return mockProperties.filter((p) => {
      if (filters?.status && p.status !== filters.status) return false;
      if (filters?.city && p.city !== filters.city) return false;
      return true;
    });
  }

  let query = supabase.from("properties").select("*");
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.city) query = query.eq("city", filters.city);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[services/properties] falling back to mock data:", error?.message);
    return mockProperties;
  }

  return data.map(mapRowToProperty);
}

export async function listPropertiesForOwner(ownerId: string): Promise<Property[]> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return getMockPropertiesByOwnerId(ownerId);
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return getMockPropertiesByOwnerId(ownerId);

  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[services/properties] falling back to mock data:", error?.message);
    return getMockPropertiesByOwnerId(ownerId);
  }

  return data.map(mapRowToProperty);
}

/**
 * Properties an agent can see: their own submissions plus anything an
 * admin has assigned them to. Two queries + a dedupe, since PostgREST
 * can't easily express "created_by = X OR has a matching agent_assignments
 * row" in a single .or() across tables.
 */
export async function listPropertiesForAgent(agentId: string): Promise<Property[]> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    // TODO(phase-5): mock data only models a single assignedAgent per
    // property, not "created by this agent but unassigned" — real mode
    // covers both, mock mode only covers assigned.
    return getMockPropertiesByAssignedAgent(agentId);
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return getMockPropertiesByAssignedAgent(agentId);

  const [ownRes, assignedRes] = await Promise.all([
    supabase.from("properties").select("*").eq("created_by", agentId),
    supabase.from("agent_assignments").select("properties(*)").eq("agent_id", agentId),
  ]);

  if (ownRes.error) {
    console.error("[services/properties] falling back to mock data:", ownRes.error.message);
    return getMockPropertiesByAssignedAgent(agentId);
  }

  const own = ownRes.data ?? [];
  const assigned = (assignedRes.data ?? [])
    .map((row) => (row as unknown as { properties: PropertyRow | null }).properties)
    .filter((p): p is PropertyRow => Boolean(p));

  const byId = new Map<string, PropertyRow>();
  for (const row of [...own, ...assigned]) byId.set(row.id, row);

  return Array.from(byId.values())
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map(mapRowToProperty);
}

/**
 * Admin-only. Uses the service-role client since assigning an agent is
 * an admin action that shouldn't depend on the admin's own session
 * having an agent_assignments INSERT grant beyond `is_admin()`.
 */
export async function assignAgentToPropertyForAdmin(
  propertyId: string,
  agentId: string,
  adminId?: string,
): Promise<ServiceResult> {
  const { isAdminClientConfigured } = getSupabaseConfigStatus();
  if (!isAdminClientConfigured) {
    return SUPABASE_NOT_CONFIGURED_RESULT;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return SUPABASE_NOT_CONFIGURED_RESULT;

  const { error } = await supabase
    .from("agent_assignments")
    .upsert(
      { property_id: propertyId, agent_id: agentId, assigned_by: adminId ?? null },
      { onConflict: "property_id,agent_id" },
    );

  if (error) {
    return { ok: false, message: "Failed to assign agent to this property." };
  }

  await logAuditEvent({
    actorId: adminId,
    action: "property.agent_assigned",
    entityType: "property",
    entityId: propertyId,
    metadata: { agentId },
  });

  return { ok: true, data: undefined };
}

/**
 * Attaches an uploaded image's storage path to a property. Uses the
 * request-scoped server client — RLS restricts this to the property's
 * own owner/agent (while unapproved) or admin, see
 * property_images_insert_owner_or_agent in rls.sql.
 */
export async function addPropertyImage(
  propertyId: string,
  storagePath: string,
  altText?: string,
  sortOrder?: number,
): Promise<ServiceResult<{ id: string }>> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return SUPABASE_NOT_CONFIGURED_RESULT;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return SUPABASE_NOT_CONFIGURED_RESULT;

  const { data, error } = await supabase
    .from("property_images")
    .insert({
      property_id: propertyId,
      storage_path: storagePath,
      alt_text: altText ?? null,
      sort_order: sortOrder ?? 0,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: "Failed to attach image to property." };
  }

  return { ok: true, data: { id: data.id } };
}

export async function listPropertyImages(propertyId: string): Promise<Tables<"property_images">[]> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) return [];

  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("property_images")
    .select("*")
    .eq("property_id", propertyId)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data;
}
