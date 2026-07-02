// Auth session helpers for Server Components, layouts, and Server
// Actions. Pairs with src/middleware.ts, which handles the common "not
// logged in" redirect for protected route prefixes (and can preserve a
// `?next=` param, since it has access to the real request path).
//
// requireAuth()/requireApprovedRole() below are a second line of defense
// *inside* layouts, and the only place role/approval is actually checked
// — middleware deliberately only checks "is there a session" to stay
// fast. They redirect via next/navigation's redirect() (a controlled,
// Next.js-native navigation) rather than throwing raw errors.

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfigStatus } from "@/lib/supabase/status";
import { getCurrentProfile as fetchCurrentProfile, getRoleRedirectPath } from "@/lib/services/profiles";
import type { AppUser, UserRole } from "@/lib/types";

/**
 * Returns the signed-in Supabase auth user, or `null` if Supabase isn't
 * configured or there's no session. Uses `auth.getUser()` (not
 * `getSession()`) because it revalidates the token against the Supabase
 * Auth server — the safe choice for server-side checks.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }

  return data.user;
}

/** Re-exported from the profiles service so `@/lib/auth/session` is a
 * one-stop import for anything auth-related in Server Components. */
export async function getCurrentProfile(): Promise<AppUser | null> {
  return fetchCurrentProfile();
}

/**
 * Where to send someone right after login (or whenever we need to route
 * a signed-in user to "the right place"): their role dashboard if
 * approved, otherwise the access-status page explaining why not.
 */
export function getPostLoginRedirect(profile: AppUser | null): string {
  if (!profile || profile.status !== "approved") {
    return "/access-status";
  }
  return getRoleRedirectPath(profile.role);
}

/**
 * Ensures the visitor is signed in AND has an approved profile row.
 * Redirects to /login (no Supabase configured, or no session) or
 * /access-status (session but no/unapproved profile) otherwise.
 *
 * Note: unlike middleware, this does not preserve a `?next=` param —
 * layouts don't have easy access to the current pathname in the App
 * Router. Treat this as the defense-in-depth check behind middleware,
 * not the primary path a user normally hits.
 */
export async function requireAuth(): Promise<AppUser> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    redirect("/login");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "approved") {
    redirect("/access-status");
  }

  return profile;
}

/**
 * Ensures the visitor is signed in, approved, AND has one of the allowed
 * roles. An approved user with the *wrong* role is sent to their own
 * dashboard rather than an error page, since they do have valid access —
 * just not to this section.
 */
export async function requireApprovedRole(allowedRoles: UserRole[]): Promise<AppUser> {
  const profile = await requireAuth();

  if (!allowedRoles.includes(profile.role)) {
    redirect(getRoleRedirectPath(profile.role));
  }

  return profile;
}
