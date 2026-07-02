// Read-only, safe-to-display status for the admin System Check page.
// Only ever returns booleans and static reminder text — never actual
// secret values. Anything this module can't verify from inside the app
// (DNS, HTTPS, whether a Supabase bucket was actually created) is a
// plain reminder, not a pass/fail check, so the page doesn't show a
// misleading red "false" for things it has no way to confirm.

import { getSupabaseConfigStatus } from "@/lib/supabase/status";

export interface SystemCheckItem {
  label: string;
  ok: boolean;
  detail: string;
}

export interface ReminderItem {
  label: string;
  detail: string;
}

export interface SystemCheckData {
  supabase: SystemCheckItem[];
  privateBeta: SystemCheckItem[];
  storageReminders: ReminderItem[];
  authReminders: ReminderItem[];
  deploymentReminders: ReminderItem[];
}

export function getSystemCheckData(): SystemCheckData {
  const { hasUrl, hasAnonKey, hasServiceRoleKey, isPublicClientConfigured, isAdminClientConfigured } =
    getSupabaseConfigStatus();

  return {
    supabase: [
      {
        label: "NEXT_PUBLIC_SUPABASE_URL",
        ok: hasUrl,
        detail: hasUrl ? "Present" : "Missing — set in .env.local or Vercel project settings",
      },
      {
        label: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        ok: hasAnonKey,
        detail: hasAnonKey ? "Present" : "Missing — set in .env.local or Vercel project settings",
      },
      {
        label: "SUPABASE_SERVICE_ROLE_KEY",
        ok: hasServiceRoleKey,
        detail: hasServiceRoleKey
          ? "Present (server-only — never exposed to the browser)"
          : "Missing — admin approve/reject/status actions will report \"not configured\"",
      },
      {
        label: "Public client (reads, guest actions)",
        ok: isPublicClientConfigured,
        detail: isPublicClientConfigured ? "Ready" : "Falling back to mock data across the app",
      },
      {
        label: "Admin client (service-role actions)",
        ok: isAdminClientConfigured,
        detail: isAdminClientConfigured ? "Ready" : "Admin mutations are disabled until configured",
      },
    ],
    privateBeta: [
      {
        label: "noindex / nofollow metadata",
        ok: true,
        detail: "Set in src/app/layout.tsx — do not remove before an intentional public launch",
      },
      {
        label: "robots.txt disallow all",
        ok: true,
        detail: "Served by src/app/robots.ts",
      },
      {
        label: "No sitemap",
        ok: true,
        detail: "No sitemap.ts / sitemap.xml exists in the project — intentional",
      },
      {
        label: "No analytics / tracking scripts",
        ok: true,
        detail: "None present in the codebase — intentional",
      },
    ],
    storageReminders: [
      {
        label: "property-images bucket",
        detail:
          "Run src/lib/db/storage.sql (or create manually) as a PRIVATE bucket — not public. See docs/SUPABASE_SETUP.md.",
      },
    ],
    authReminders: [
      {
        label: "Admin account",
        detail:
          "Create the user in Supabase Auth first, then insert a matching profiles row with role='admin', status='approved'. There is no signup page — see docs/SUPABASE_SETUP.md.",
      },
    ],
    deploymentReminders: [
      {
        label: "Vercel environment variables",
        detail: "Set the same 4 keys from .env.example in Vercel Project Settings > Environment Variables.",
      },
      {
        label: "Old domain DNS",
        detail: "Add the domain in Vercel > Domains and point your DNS records at it. See docs/DEPLOYMENT.md.",
      },
      {
        label: "HTTPS",
        detail: "Issued automatically by Vercel once the domain's DNS is verified.",
      },
    ],
  };
}
