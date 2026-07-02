// Service layer for buyer "saved properties". When Supabase isn't
// configured, this falls back to a process-memory-only Map instead of a
// hardcoded empty list — buyers can still save/unsave properties during
// a local dev session, it just doesn't persist across a server restart
// and isn't safe across multiple server instances. That's an acceptable
// trade-off for a mock-mode demo, not a production data store.

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfigStatus } from "@/lib/supabase/status";
import { getApprovedProperties as getMockApprovedProperties } from "@/lib/mock-data";
import type { Property } from "@/lib/types";
import { mapRowToProperty } from "./properties";
import { SUPABASE_NOT_CONFIGURED_RESULT, type ServiceResult } from "./result";

const mockSavedPropertyIds = new Map<string, Set<string>>();

function getMockSavedSet(buyerId: string): Set<string> {
  let set = mockSavedPropertyIds.get(buyerId);
  if (!set) {
    set = new Set();
    mockSavedPropertyIds.set(buyerId, set);
  }
  return set;
}

export async function listSavedPropertiesForBuyer(buyerId: string): Promise<Property[]> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    const ids = getMockSavedSet(buyerId);
    return getMockApprovedProperties().filter((p) => ids.has(p.id));
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("saved_properties")
    .select("properties(*)")
    .eq("buyer_id", buyerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data
    .map((row) => (row as unknown as { properties: Parameters<typeof mapRowToProperty>[0] | null }).properties)
    .filter((property): property is Parameters<typeof mapRowToProperty>[0] => Boolean(property))
    .map(mapRowToProperty);
}

export async function isPropertySavedForBuyer(buyerId: string, propertyId: string): Promise<boolean> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return getMockSavedSet(buyerId).has(propertyId);
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return false;

  const { data } = await supabase
    .from("saved_properties")
    .select("id")
    .eq("buyer_id", buyerId)
    .eq("property_id", propertyId)
    .maybeSingle();

  return Boolean(data);
}

/**
 * RLS (saved_properties_insert_own in rls.sql) requires the property
 * being saved to belong to an approved buyer's own buyer_id — but does
 * NOT check the property itself is approved. We enforce "only approved
 * properties can be saved" here at the application level instead.
 */
export async function savePropertyForBuyer(buyerId: string, propertyId: string): Promise<ServiceResult> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    getMockSavedSet(buyerId).add(propertyId);
    return { ok: true, data: undefined };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return SUPABASE_NOT_CONFIGURED_RESULT;

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("status", "approved")
    .maybeSingle();

  if (propertyError || !property) {
    return { ok: false, message: "This property is not available to save." };
  }

  const { error } = await supabase
    .from("saved_properties")
    .upsert({ buyer_id: buyerId, property_id: propertyId }, { onConflict: "buyer_id,property_id" });

  if (error) {
    return { ok: false, message: "Failed to save property." };
  }

  return { ok: true, data: undefined };
}

export async function unsavePropertyForBuyer(buyerId: string, propertyId: string): Promise<ServiceResult> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    getMockSavedSet(buyerId).delete(propertyId);
    return { ok: true, data: undefined };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return SUPABASE_NOT_CONFIGURED_RESULT;

  const { error } = await supabase
    .from("saved_properties")
    .delete()
    .eq("buyer_id", buyerId)
    .eq("property_id", propertyId);

  if (error) {
    return { ok: false, message: "Failed to remove saved property." };
  }

  return { ok: true, data: undefined };
}
