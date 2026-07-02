import type { Metadata } from "next";
import PageShell from "@/components/site/PageShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <PageShell className="max-w-3xl">
      <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="mt-4 text-sm text-slate-500">Last updated: July 2026</p>

      <div className="mt-8 space-y-6 text-slate-600">
        <p>
          I&apos;m Realtor is currently operating as a private beta. This
          policy describes, at a high level, how information submitted
          through this app is handled during the beta period.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Information We Collect</h2>
          <p className="mt-2">
            We collect information you provide directly, such as your name,
            phone number, email, city, and any message you submit through
            our Request Access, property submission, or enquiry forms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">How We Use It</h2>
          <p className="mt-2">
            Information is used solely to review access requests, verify
            listings, and connect buyers with agents or owners. We do not
            sell your information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">No Public Indexing</h2>
          <p className="mt-2">
            During the private beta, this site is configured to discourage
            search engine indexing and does not use advertising or
            third-party tracking pixels.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
          <p className="mt-2">
            For any privacy-related questions, please reach out via our{" "}
            <a href="/contact" className="font-medium text-brand-600 hover:text-brand-700">
              Contact
            </a>{" "}
            page.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
