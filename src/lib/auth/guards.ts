// Pure role/approval guard helpers — no Supabase calls here. They operate
// on an already-fetched AppUser | null profile, so they're cheap to reuse
// anywhere (Server Components, Server Actions, unit tests) without
// pulling in a Supabase client.
//
// src/lib/auth/session.ts is where the actual Supabase session/profile
// lookups happen; these two files are meant to be used together.

import type { AppUser, UserRole } from "@/lib/types";

export function isApprovedProfile(profile: AppUser | null): profile is AppUser {
  return Boolean(profile) && profile!.status === "approved";
}

export function canAccessAdmin(profile: AppUser | null): boolean {
  return isApprovedProfile(profile) && profile.role === "admin";
}

export function canAccessAgent(profile: AppUser | null): boolean {
  return isApprovedProfile(profile) && profile.role === "agent";
}

export function canAccessOwner(profile: AppUser | null): boolean {
  return isApprovedProfile(profile) && profile.role === "owner";
}

export function canAccessBuyer(profile: AppUser | null): boolean {
  return isApprovedProfile(profile) && profile.role === "buyer";
}

/**
 * Human-readable reason a visitor was denied access to `requiredRole`'s
 * area. Only meaningful to call when access has already been determined
 * to be denied — it always returns a non-empty message.
 */
export function getAccessDeniedReason(profile: AppUser | null, requiredRole: UserRole): string {
  if (!profile) {
    return "Profile not found. Contact admin.";
  }

  if (profile.status === "pending") {
    return "Your access is pending admin approval.";
  }

  if (profile.status === "rejected") {
    return "Your access request was not approved.";
  }

  if (profile.status === "suspended") {
    return "Your account is suspended.";
  }

  if (profile.role !== requiredRole) {
    return `Your account doesn't have access to the ${requiredRole} area.`;
  }

  return "You don't have access to this page.";
}
