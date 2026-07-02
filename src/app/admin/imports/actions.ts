"use server";

// Admin-only. Note: "createPropertyFromImportAction" from the original
// task list and "saveImportAsPropertyAction" here are the same action —
// consolidated into one implementation (colocated with the importer
// feature) instead of duplicating it in src/app/admin/actions.ts.

import { revalidatePath } from "next/cache";
import { requireApprovedRole } from "@/lib/auth/session";
import {
  createListingImport,
  saveParsedImportAsPendingProperty,
  type ParsedListingData,
} from "@/lib/services/listing-imports";

export interface ImportActionResult {
  ok: boolean;
  message: string;
  parsed?: ParsedListingData;
  importId?: string;
}

export async function createListingImportAction(formData: FormData): Promise<ImportActionResult> {
  const admin = await requireApprovedRole(["admin"]);

  const rawText = String(formData.get("rawText") ?? "");
  const result = await createListingImport(rawText, admin.id);

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  revalidatePath("/admin/imports");
  return {
    ok: true,
    message: "Listing text parsed. Review the fields below before saving.",
    parsed: result.data.parsed,
    importId: result.data.id,
  };
}

/**
 * Accepts the (possibly admin-edited) parsed fields rather than
 * re-reading parsed_data from the import row, since the preview UI lets
 * admin correct anything the local parser got wrong before saving.
 */
export async function saveImportAsPropertyAction(
  importId: string,
  parsedData: ParsedListingData,
): Promise<ImportActionResult> {
  const admin = await requireApprovedRole(["admin"]);

  const result = await saveParsedImportAsPendingProperty(importId, parsedData, admin.id);
  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  revalidatePath("/admin/imports");
  revalidatePath("/admin/listings");
  return { ok: true, message: "AI import is a draft helper — pending property created. Verify it before approving." };
}
