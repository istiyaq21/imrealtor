// Service layer for user profiles. Read functions fall back to
// src/lib/mock-data.ts when Supabase isn't configured; mutations return a
// { ok: false, message } result instead.
//
// Role/status changes always go through the service-role client — see
// rls.sql guard_profile_role_status, which blocks exactly this change for
// any authenticated (non-admin) session at the database level. Call
// sites MUST gate these behind requireApprovedRole(["admin"]).

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfigStatus } from "@/lib/supabase/status";
import { users as mockUsers } from "@/lib/mock-data";
import type { AppUser, ApprovalStatus, UserRole } from "@/lib/types";
import type { Tables } from "@/lib/database.types";
import { logAuditEvent } from "./audit";
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

export interface AdminUserFilters {
  role?: UserRole;
  status?: ApprovalStatus;
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

/**
 * Looks up a single profile by id. Restricted by RLS to the caller's own
 * profile or (if the caller is admin) any profile — there is no public
 * profile lookup policy, so this is only useful for self-lookups or
 * admin-facing screens, not for resolving "who owns this listing" on a
 * public page (see getAssignedAgentName() in services/properties.ts for
 * that narrower, service-role-backed use case).
 */
export async function getProfileById(id: string): Promise<AppUser | null> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return mockUsers.find((u) => u.id === id) ?? null;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return mockUsers.find((u) => u.id === id) ?? null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;

  return mapRowToAppUser(data);
}

export async function listUsersForAdmin(filters?: AdminUserFilters): Promise<AppUser[]> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return mockUsers.filter((u) => {
      if (filters?.role && u.role !== filters.role) return false;
      if (filters?.status && u.status !== filters.status) return false;
      return true;
    });
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return mockUsers;

  let query = supabase.from("profiles").select("*");
  if (filters?.role) query = query.eq("role", filters.role);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[services/profiles] falling back to mock data:", error?.message);
    return mockUsers;
  }

  return data.map(mapRowToAppUser);
}

export async function listApprovedAgentsForAdmin(): Promise<AppUser[]> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return mockUsers.filter((u) => u.role === "agent" && u.status === "approved");
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return mockUsers.filter((u) => u.role === "agent" && u.status === "approved");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "agent")
    .eq("status", "approved")
    .order("full_name", { ascending: true });

  if (error || !data) {
    console.error("[services/profiles] falling back to mock data:", error?.message);
    return mockUsers.filter((u) => u.role === "agent" && u.status === "approved");
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
  adminId?: string,
): Promise<ServiceResult> {
  const { isAdminClientConfigured } = getSupabaseConfigStatus();
  if (!isAdminClientConfigured) {
    return SUPABASE_NOT_CONFIGURED_RESULT;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return SUPABASE_NOT_CONFIGURED_RESULT;

  const { error } = await supabase.from("profiles").update({ status }).eq("id", id);

  if (error) {
    return { ok: false, message: "Failed to update user status." };
  }

  await logAuditEvent({
    actorId: adminId,
    action: "user.status_changed",
    entityType: "profile",
    entityId: id,
    metadata: { status },
  });

  return { ok: true, data: undefined };
}

/**
 * Admin-only role change. Same rationale/guard as updateUserStatusForAdmin.
 */
export async function updateUserRoleForAdmin(
  id: string,
  role: UserRole,
  adminId?: string,
): Promise<ServiceResult> {
  const { isAdminClientConfigured } = getSupabaseConfigStatus();
  if (!isAdminClientConfigured) {
    return SUPABASE_NOT_CONFIGURED_RESULT;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return SUPABASE_NOT_CONFIGURED_RESULT;

  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);

  if (error) {
    return { ok: false, message: "Failed to update user role." };
  }

  await logAuditEvent({
    actorId: adminId,
    action: "user.role_changed",
    entityType: "profile",
    entityId: id,
    metadata: { role },
  });

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

/**
 * Pure helper — no Supabase involved. Accepts either a bare role (when
 * the caller already knows the user is approved) or a full profile
 * (when approval still needs checking, e.g. right after login).
 */
export function getRoleRedirectPath(roleOrProfile: UserRole | AppUser | null): string {
  if (roleOrProfile && typeof roleOrProfile === "object") {
    if (roleOrProfile.status !== "approved") return "/access-status";
    return ROLE_DASHBOARD_PATHS[roleOrProfile.role];
  }
  if (!roleOrProfile) return "/access-status";
  return ROLE_DASHBOARD_PATHS[roleOrProfile];
}
