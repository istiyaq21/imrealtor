// Server-side Supabase client for Server Components, Server Actions, and
// Route Handlers in the App Router. Reads/writes auth cookies via
// next/headers so a logged-in session survives across requests.
//
// TODO(phase-3): once Supabase Auth is enabled, pair this with middleware
// that refreshes the session cookie on every request.

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { getSupabaseConfigStatus } from "./status";

/**
 * Returns a request-scoped Supabase server client, or `null` if Supabase
 * env vars are not configured. Never throws — callers must check for
 * `null` and fall back to mock data / a "not configured" UI state.
 */
export async function getSupabaseServerClient() {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component with no request/response to
            // attach cookies to — safe to ignore when session refresh is
            // handled by middleware instead.
          }
        },
      },
    },
  );
}
