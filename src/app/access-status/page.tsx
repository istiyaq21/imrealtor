import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/site/PageShell";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { getSupabaseConfigStatus } from "@/lib/supabase/status";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth/session";
import { getRoleRedirectPath } from "@/lib/services/profiles";
import type { ApprovalStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Access Status",
};

const STATUS_MESSAGES: Record<Exclude<ApprovalStatus, "approved">, string> = {
  pending: "Your access is pending admin approval.",
  rejected: "Your access request was not approved.",
  suspended: "Your account is suspended.",
};

export default async function AccessStatusPage() {
  const { isPublicClientConfigured } = getSupabaseConfigStatus();

  if (!isPublicClientConfigured) {
    return (
      <StatusShell title="Setup required">
        <p className="text-sm text-slate-600">
          Supabase is not configured yet, so account status can&apos;t be checked in local mock mode.
        </p>
      </StatusShell>
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    return (
      <StatusShell title="You're not signed in">
        <p className="text-sm text-slate-600">Sign in to check your access status.</p>
        <Button href="/login" className="mt-6 w-full">
          Go to Login
        </Button>
      </StatusShell>
    );
  }

  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <StatusShell title="Profile not found" tone="danger">
        <p className="text-sm text-slate-600">Profile not found. Contact admin.</p>
        <Button href="/contact" variant="outline" className="mt-6 w-full">
          Contact Support
        </Button>
      </StatusShell>
    );
  }

  if (profile.status === "approved") {
    return (
      <StatusShell title="You're approved" tone="success">
        <p className="text-sm text-slate-600">
          Your {profile.role} account is approved. Head to your dashboard to get started.
        </p>
        <Button href={getRoleRedirectPath(profile.role)} className="mt-6 w-full">
          Go to My Dashboard
        </Button>
      </StatusShell>
    );
  }

  return (
    <StatusShell title="Access not yet available" tone="warning">
      <p className="text-sm text-slate-600">{STATUS_MESSAGES[profile.status]}</p>
      <Button href="/contact" variant="outline" className="mt-6 w-full">
        Contact Support
      </Button>
    </StatusShell>
  );
}

function StatusShell({
  title,
  tone = "neutral",
  children,
}: {
  title: string;
  tone?: "neutral" | "success" | "warning" | "danger";
  children: React.ReactNode;
}) {
  return (
    <PageShell className="max-w-md">
      <Card className="p-6 text-center sm:p-8">
        <Badge tone={tone === "neutral" ? "brand" : tone}>Account Status</Badge>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{title}</h1>
        <div className="mt-4">{children}</div>
      </Card>
      <p className="mt-6 text-center text-sm text-slate-500">
        Wrong account?{" "}
        <Link href="/logout" className="font-medium text-brand-600 hover:text-brand-700">
          Sign out
        </Link>
      </p>
    </PageShell>
  );
}
