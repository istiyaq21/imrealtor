// Central place to check whether Supabase env vars are present.
// Every Supabase helper in this folder reads through here instead of
// reading process.env directly, so "is Supabase configured?" always
// means the same thing across the app.

export interface SupabaseConfigStatus {
  hasUrl: boolean;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  isPublicClientConfigured: boolean;
  isAdminClientConfigured: boolean;
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return {
    hasUrl,
    hasAnonKey,
    hasServiceRoleKey,
    isPublicClientConfigured: hasUrl && hasAnonKey,
    isAdminClientConfigured: hasUrl && hasServiceRoleKey,
  };
}
