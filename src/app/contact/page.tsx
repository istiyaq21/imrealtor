import type { Metadata } from "next";
import PageShell from "@/components/site/PageShell";
import Card from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <PageShell className="max-w-2xl">
      <h1 className="text-3xl font-bold text-slate-900">Contact Us</h1>
      <p className="mt-2 text-slate-600">
        Have a question, found an incorrect listing, or need help during the
        private beta? Reach out to our team.
      </p>

      <Card className="mt-8 p-6 sm:p-8">
        <dl className="space-y-5">
          <div>
            <dt className="text-sm font-medium text-slate-500">Support Email</dt>
            <dd className="mt-1 text-slate-900">support@imrealtor.app</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Phone</dt>
            <dd className="mt-1 text-slate-900">+91 90000 00000</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Response Time</dt>
            <dd className="mt-1 text-slate-900">
              Within 1–2 business days during the private beta.
            </dd>
          </div>
        </dl>
      </Card>
    </PageShell>
  );
}
