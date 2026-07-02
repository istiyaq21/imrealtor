import type { Metadata } from "next";
import PageShell from "@/components/site/PageShell";
import Badge from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <PageShell className="max-w-3xl">
      <Badge tone="brand">Soft-live Private Beta</Badge>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">About I&apos;m Realtor</h1>

      <p className="mt-6 text-slate-600">
        I&apos;m Realtor is a simple, verified, admin-reviewed real estate
        marketplace. We&apos;re currently in a soft-live private beta, which
        means the platform is intentionally limited while we test the
        experience with a small group of agents, owners, and buyers.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">Our Mission</h2>
      <p className="mt-3 text-slate-600">
        To make property discovery simple and trustworthy by ensuring every
        agent, owner, and listing on the platform is reviewed by our admin
        team before it&apos;s visible to buyers — no unverified listings, no
        spam, no noise.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-slate-900">What Private Beta Means</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-600">
        <li>There is no fully open public signup yet.</li>
        <li>Agents and owners are admin-created or admin-approved.</li>
        <li>Every listing requires admin approval before it becomes visible.</li>
        <li>We&apos;re deliberately avoiding ads, tracking, and SEO push during this phase.</li>
      </ul>

      <p className="mt-8 text-sm text-slate-500">
        Interested in joining? Visit our{" "}
        <a href="/request-access" className="font-medium text-brand-600 hover:text-brand-700">
          Request Access
        </a>{" "}
        page.
      </p>
    </PageShell>
  );
}
