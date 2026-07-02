// Service layer for user profiles. Read functions fall back to
// src/lib/mock-data.ts when Supabase isn't configured; mutations return a
// { ok: false, message } result instead.
//
// TODO(phase-3): getCurrentProfile() has nothing to read until real
// Supabase Auth sessions exist — the /login demo buttons today only
// redirect, they don't create a session.

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfigStatus } from "@/lib/supabase/status";
import { users as mockUsers } from "@/lib/mock-data";
import type { AppUser, ApprovalStatus, UserRole } from "@/lib/types";
import type { Tables } from "@/lib/database.types";
import { SUPABASE_NOT_CONFIGURED_RESULT, type ServiceResult } from "./result";

type ProfileRow = Tables<"profiles">;

function mapRowToAppUser(row: ProfileRow): AppUser {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    role: row.role,
    status: row.status,
    city: row.city ?? "",
    joinedAt: row.created_at,
  };
}

/**
 * Returns the signed-in user's profile, or `null` if Supabase isn't
 * configured, there's no session, or the session has no matching profile
 * row yet.
 */
export async function getCurrentProfile(): Promise<AppUser | null> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRowToAppUser(data);
}

export async function listUsersForAdmin(): Promise<AppUser[]> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return mockUsers;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return mockUsers;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[services/profiles] falling back to mock data:", error?.message);
    return mockUsers;
  }

  return data.map(mapRowToAppUser);
}

/**
 * Admin-only approve/suspend action. Uses the service-role client because
 * changing role/status is deliberately blocked for normal users by both
 * RLS and a DB trigger (see rls.sql guard_profile_role_status).
 */
export async function updateUserStatusForAdmin(
  id: string,
  status: ApprovalStatus,
): Promise<ServiceResult> {
  const { isAdminClientConfigured } = getSupabaseConfigStatus();
  if (!isAdminClientConfigured) {
    return SUPABASE_NOT_CONFIGURED_RESULT;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return SUPABASE_NOT_CONFIGURED_RESULT;

  const { error } = await supabase.from("profiles").update({ status }).eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, data: undefined };
}

const ROLE_DASHBOARD_PATHS: Record<UserRole, string> = {
  admin: "/admin",
  agent: "/agent",
  owner: "/owner",
  buyer: "/buyer",
  // No dedicated support dashboard exists yet — route home rather than
  // implying support has admin access.
  support: "/",
};

/** Pure helper — no Supabase involved. Used by the login page's demo buttons. */
export function getRoleRedirectPath(role: UserRole): string {
  return ROLE_DASHBOARD_PATHS[role];
}
