// Service layer for the AI WhatsApp listing importer foundation (see
// docs/BACKEND_PHASES.md, Phase 4). This is a *local* best-effort
// regex/keyword parser only — no external AI API calls happen here.
// TODO(ai): swap parseListingTextLocally() for an OpenAI/Claude extraction
// call once we're ready to spend on real NLP; keep the same return shape
// so callers (the admin import UI, saveParsedImportAsPendingProperty)
// don't need to change.
//
// Mock fallback (no Supabase configured) uses a process-memory-only
// array, same trade-off as services/saved-properties.ts — fine for local
// demoing, not a real data store.

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfigStatus } from "@/lib/supabase/status";
import type { Json } from "@/lib/database.types";
import type { Tables } from "@/lib/database.types";
import { createPendingProperty } from "./properties";
import { SUPABASE_NOT_CONFIGURED_RESULT, type ServiceResult } from "./result";

type ListingImportRow = Tables<"listing_imports">;

export interface ParsedListingData {
  purpose?: "sell" | "rent";
  city?: string;
  locality?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  type?: string;
  phone?: string;
  description?: string;
  amenities?: string[];
}

const KNOWN_CITIES: Record<string, string> = {
  mumbai: "Mumbai",
  bengaluru: "Bengaluru",
  bangalore: "Bengaluru",
  pune: "Pune",
  delhi: "Delhi",
  hyderabad: "Hyderabad",
  jaipur: "Jaipur",
  ahmedabad: "Ahmedabad",
  surat: "Surat",
  chennai: "Chennai",
  kolkata: "Kolkata",
  gurugram: "Gurugram",
  gurgaon: "Gurugram",
  noida: "Noida",
};

const PROPERTY_TYPE_KEYWORDS: [string, string][] = [
  ["independent house", "independent-house"],
  ["bungalow", "independent-house"],
  ["villa", "villa"],
  ["plot", "plot"],
  ["land", "plot"],
  ["commercial", "commercial"],
  ["shop", "commercial"],
  ["office", "office"],
  ["flat", "apartment"],
  ["apartment", "apartment"],
  ["bhk", "apartment"],
];

const AMENITY_KEYWORDS = [
  "clubhouse",
  "gym",
  "swimming pool",
  "pool",
  "security",
  "power backup",
  "parking",
  "lift",
  "garden",
  "play area",
  "24x7",
  "wifi",
  "furnished",
];

function titleCase(text: string): string {
  return text.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Best-effort local extraction from pasted WhatsApp-style listing text.
 * Deliberately simple regex/keyword matching — not meant to be perfect,
 * just good enough that an admin has less typing to do before reviewing.
 */
export function parseListingTextLocally(rawText: string): ParsedListingData {
  const text = rawText.trim();
  const lower = text.toLowerCase();
  const result: ParsedListingData = {};

  if (/\bfor\s*sale\b|\bsale\b|\bsell\b/i.test(text)) {
    result.purpose = "sell";
  } else if (/\bfor\s*rent\b|\brent\b/i.test(text)) {
    result.purpose = "rent";
  }

  for (const [keyword, city] of Object.entries(KNOWN_CITIES)) {
    if (lower.includes(keyword)) {
      result.city = city;
      break;
    }
  }

  const bhkMatch = text.match(/(\d+)\s*[- ]?\s*bhk/i);
  if (bhkMatch) {
    result.bedrooms = Number.parseInt(bhkMatch[1], 10);
  } else {
    const bedroomMatch = text.match(/(\d+)\s*bed(?:room)?s?/i);
    if (bedroomMatch) result.bedrooms = Number.parseInt(bedroomMatch[1], 10);
  }

  const bathMatch = text.match(/(\d+)\s*bath(?:room)?s?/i);
  if (bathMatch) result.bathrooms = Number.parseInt(bathMatch[1], 10);

  const areaMatch = text.match(/(\d[\d,]*)\s*(?:sq\.?\s?ft|sqft|square\s?feet)/i);
  if (areaMatch) result.area = `${areaMatch[1].replace(/,/g, "")} sq ft`;

  const croreOrLakhMatch = text.match(/(?:₹|rs\.?|inr)?\s*([\d,.]+)\s*(cr|crore|l|lakh|lac)\b/i);
  if (croreOrLakhMatch) {
    const value = Number.parseFloat(croreOrLakhMatch[1].replace(/,/g, ""));
    if (!Number.isNaN(value)) {
      result.price = croreOrLakhMatch[2].toLowerCase().startsWith("cr") ? value * 10000000 : value * 100000;
    }
  } else {
    const plainPriceMatch = text.match(/(?:₹|rs\.?|inr)\s*([\d,]{4,})/i);
    if (plainPriceMatch) {
      const value = Number.parseInt(plainPriceMatch[1].replace(/,/g, ""), 10);
      if (!Number.isNaN(value)) result.price = value;
    }
  }

  for (const [keyword, type] of PROPERTY_TYPE_KEYWORDS) {
    if (lower.includes(keyword)) {
      result.type = type;
      break;
    }
  }
  if (!result.type && result.bedrooms) result.type = "apartment";

  const phoneMatch = text.match(/(?:\+?91[-\s]?)?[6-9]\d{9}\b/);
  if (phoneMatch) result.phone = phoneMatch[0];

  const localityMatch = text.match(/(?:in|at)\s+([A-Z][a-zA-Z\s]{2,30}?)(?:[,.\n]|$)/);
  if (localityMatch) result.locality = localityMatch[1].trim();

  const foundAmenities = AMENITY_KEYWORDS.filter((keyword) => lower.includes(keyword));
  if (foundAmenities.length > 0) {
    result.amenities = Array.from(new Set(foundAmenities.map(titleCase)));
  }

  result.description = text;

  return result;
}

function isUsefullyParsed(parsed: ParsedListingData): boolean {
  return Boolean(parsed.city || parsed.price || parsed.bedrooms || parsed.type);
}

const mockListingImports: ListingImportRow[] = [];

export async function createListingImport(
  rawText: string,
  createdBy?: string,
): Promise<ServiceResult<{ id: string; parsed: ParsedListingData }>> {
  if (!rawText.trim()) {
    return { ok: false, message: "Paste some listing text first." };
  }

  const parsed = parseListingTextLocally(rawText);
  const status = isUsefullyParsed(parsed) ? "parsed" : "needs_review";

  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    const row: ListingImportRow = {
      id: `mock-${Date.now()}`,
      raw_text: rawText,
      parsed_data: parsed as Json,
      status,
      created_by: createdBy ?? null,
      created_property_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockListingImports.unshift(row);
    return { ok: true, data: { id: row.id, parsed } };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return SUPABASE_NOT_CONFIGURED_RESULT;

  const { data, error } = await supabase
    .from("listing_imports")
    .insert({
      raw_text: rawText,
      parsed_data: parsed as Json,
      status,
      created_by: createdBy ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: "Failed to save the import." };
  }

  return { ok: true, data: { id: data.id, parsed } };
}

export async function listListingImportsForAdmin(): Promise<ListingImportRow[]> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return mockListingImports;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return mockListingImports;

  const { data, error } = await supabase
    .from("listing_imports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[services/listing-imports] falling back to in-memory data:", error?.message);
    return mockListingImports;
  }

  return data;
}

/**
 * Creates a pending property from a reviewed/edited parsed import, then
 * links the import row to it. Reuses createPendingProperty() so the new
 * listing goes through the exact same admin-review workflow as any other
 * submission — "AI import is a draft helper, admin must verify before
 * listing goes public" is enforced by that shared function always
 * forcing status = 'pending', not by anything importer-specific.
 */
export async function saveParsedImportAsPendingProperty(
  importId: string,
  parsedData: ParsedListingData,
  createdBy?: string,
): Promise<ServiceResult<{ propertyId: string }>> {
  if (!parsedData.city || !parsedData.type || !parsedData.purpose) {
    return { ok: false, message: "City, property type, and purpose are required before saving." };
  }

  const propertyResult = await createPendingProperty({
    title:
      parsedData.locality && parsedData.city
        ? `${titleCase(parsedData.type)} in ${parsedData.locality}, ${parsedData.city}`
        : `Imported ${titleCase(parsedData.type)} listing`,
    purpose: parsedData.purpose,
    type: parsedData.type,
    city: parsedData.city,
    locality: parsedData.locality ?? "Unspecified",
    price: parsedData.price ?? 0,
    bedrooms: parsedData.bedrooms,
    bathrooms: parsedData.bathrooms,
    area: parsedData.area,
    description: parsedData.description,
    amenities: parsedData.amenities,
    createdBy,
  });

  if (!propertyResult.ok) {
    return propertyResult;
  }

  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    const row = mockListingImports.find((item) => item.id === importId);
    if (row) {
      row.status = "saved";
      row.created_property_id = propertyResult.data.id;
    }
    return { ok: true, data: { propertyId: propertyResult.data.id } };
  }

  const supabase = await getSupabaseServerClient();
  if (supabase) {
    await supabase
      .from("listing_imports")
      .update({ status: "saved", created_property_id: propertyResult.data.id })
      .eq("id", importId);
  }

  return { ok: true, data: { propertyId: propertyResult.data.id } };
}
