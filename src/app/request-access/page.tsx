import type { Metadata } from "next";
import PageShell from "@/components/site/PageShell";
import Card from "@/components/ui/Card";
import RequestAccessForm from "@/components/forms/RequestAccessForm";

export const metadata: Metadata = {
  title: "Request Access",
};

export default function RequestAccessPage() {
  return (
    <PageShell className="max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Request Access</h1>
        <p className="mt-2 text-slate-600">
          I&apos;m Realtor is currently in private beta. Public signup is
          controlled — private beta access is reviewed by admin.
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        <RequestAccessForm />
      </Card>
    </PageShell>
  );
}
