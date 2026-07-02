// Service-role Supabase client — SERVER ONLY.
//
// ⚠️ SECURITY:
// - This client uses SUPABASE_SERVICE_ROLE_KEY, which BYPASSES Row Level
//   Security (see src/lib/db/rls.sql) entirely.
// - NEVER import this file from a Client Component ("use client") or any
//   code that ships to the browser. There is a runtime guard below that
//   throws if this ever executes in a browser context, but treat that as
//   a last resort, not a substitute for careful imports.
// - Use only for trusted admin actions (e.g. admin approving a listing)
//   and server-side scripts (e.g. seeding, migrations, background jobs).
//
// TODO(phase-3/4): audit every call site of getSupabaseAdminClient() to
// confirm it is gated behind a verified admin session, not just "logged in".

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getSupabaseConfigStatus } from "./status";

type AdminClient = ReturnType<typeof createClient<Database>>;

let cachedClient: AdminClient | null = null;

/**
 * Returns a singleton Supabase service-role client, or `null` if
 * SUPABASE_SERVICE_ROLE_KEY / the Supabase URL are not configured. Never
 * throws for missing config — callers must check for `null`.
 */
export function getSupabaseAdminClient(): AdminClient | null {
  if (typeof window !== "undefined") {
    throw new Error(
      "getSupabaseAdminClient() was called in the browser. The service role client must only be used on the server.",
    );
  }

  const { isAdminClientConfigured } = getSupabaseConfigStatus();
  if (!isAdminClientConfigured) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }

  return cachedClient;
}
