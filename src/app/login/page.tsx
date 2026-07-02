import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import PageShell from "@/components/site/PageShell";
import Card from "@/components/ui/Card";
import LoginForm from "@/components/auth/LoginForm";
import { getSupabaseConfigStatus } from "@/lib/supabase/status";

export const metadata: Metadata = {
  title: "Login",
};

// No public signup here — /request-access is the only way to ask for
// access during the private beta. See docs/SUPABASE_SETUP.md for how to
// create the first admin/agent/owner/buyer accounts.
export default function LoginPage() {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();

  return (
    <PageShell className="max-w-md">
      <div className="flex flex-col items-center text-center">
        <Image src="/im-realtor-logo.png" alt="I'm Realtor" width={56} height={56} className="rounded-xl" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in to your I&apos;m Realtor account.</p>
      </div>

      <Card className="mt-8 p-6 sm:p-8">
        {isPublicClientConfigured ? (
          <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
            <LoginForm />
          </Suspense>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Supabase is not configured yet. Login is unavailable in local mock mode.
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          Private beta testing only — access is limited to approved accounts.
        </p>
      </Card>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have access yet?{" "}
        <Link href="/request-access" className="font-medium text-brand-600 hover:text-brand-700">
          Request Access
        </Link>
      </p>
    </PageShell>
  );
}
