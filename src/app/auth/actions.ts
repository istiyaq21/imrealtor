"use server";

// Server Actions for auth. Called from src/components/auth/LoginForm.tsx
// (a Client Component) via Next.js's server action RPC boundary, and from
// src/app/logout/route.ts as a plain server-side function call.
//
// Errors are always translated to a short, safe message — raw Supabase
// error text (which can include internal details) is never returned to
// the client.

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfigStatus } from "@/lib/supabase/status";
import { getCurrentProfile, getPostLoginRedirect } from "@/lib/auth/session";

const SUPABASE_NOT_CONFIGURED_MESSAGE =
  "Supabase is not configured yet. Login is unavailable in local mock mode.";

export interface SignInResult {
  ok: boolean;
  message?: string;
  redirectTo?: string;
}

function sanitizeNextParam(next: string | null): string | null {
  if (!next) return null;
  // Only allow same-site relative paths — reject protocol-relative
  // ("//evil.com") or absolute URLs to avoid an open-redirect.
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export async function signInWithPassword(formData: FormData): Promise<SignInResult> {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();
  if (!isPublicClientConfigured) {
    return { ok: false, message: SUPABASE_NOT_CONFIGURED_MESSAGE };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeNextParam(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { ok: false, message: "Enter your email and password." };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: SUPABASE_NOT_CONFIGURED_MESSAGE };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, message: "Incorrect email or password." };
  }

  const profile = await getCurrentProfile();
  const isApproved = profile?.status === "approved";

  return {
    ok: true,
    redirectTo: isApproved && next ? next : getPostLoginRedirect(profile),
  };
}

export async function signOut(): Promise<void> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}
