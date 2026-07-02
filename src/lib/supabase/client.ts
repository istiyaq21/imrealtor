// Browser Supabase client. Import this only from Client Components
// ("use client" files) — for Server Components/Route Handlers use
// src/lib/supabase/server.ts instead.
//
// TODO(phase-3): wire this into real auth flows (sign in, sign up,
// session refresh) once Supabase Auth is enabled.

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { getSupabaseConfigStatus } from "./status";

type BrowserClient = ReturnType<typeof createBrowserClient<Database>>;

let cachedClient: BrowserClient | null = null;

/**
 * Returns a singleton Supabase browser client, or `null` if Supabase env
 * vars are not configured. Never throws — callers must check for `null`
 * and fall back to mock data / a "not configured" UI state.
 */
export function getSupabaseBrowserClient(): BrowserClient | null {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    );
  }

  return cachedClient;
}
