import type { Metadata } from "next";
import PageShell from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <PageShell className="max-w-3xl">
      <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
      <p className="mt-4 text-sm text-slate-500">Last updated: July 2026</p>

      <div className="mt-8 space-y-6 text-slate-600">
        <p>
          These terms govern your use of I&apos;m Realtor during its private
          beta period. By using this app, you agree to the terms below.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Private Beta Status</h2>
          <p className="mt-2">
            I&apos;m Realtor is a work in progress. Features, listings, and
            access may change without notice while we test the platform with
            a limited group of users.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Access &amp; Approval</h2>
          <p className="mt-2">
            Access to agent, owner, and certain buyer features requires admin
            approval. Admin reserves the right to approve, reject, or suspend
            any account or listing at its discretion.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Listing Accuracy</h2>
          <p className="mt-2">
            While listings are reviewed before approval, I&apos;m Realtor does
            not guarantee the accuracy of property information submitted by
            owners or agents. Please verify details independently before any
            transaction.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">No Warranty</h2>
          <p className="mt-2">
            The platform is provided &quot;as is&quot; during the beta period,
            without warranties of any kind.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
