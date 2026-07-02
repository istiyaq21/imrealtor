import type { Metadata } from "next";
import Card from "@/components/ui/Card";
import PropertySubmissionForm from "@/components/forms/PropertySubmissionForm";
import { submitOwnerPropertyAction } from "@/app/owner/actions";

export const metadata: Metadata = {
  title: "Submit Property",
};

export default function SubmitPropertyPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Submit a Property</h1>
        <p className="mt-1 text-sm text-slate-600">
          Fill in the details below. Your listing will be reviewed by our admin team before publishing.
        </p>
      </div>
      <Card className="max-w-3xl p-6 sm:p-8">
        <PropertySubmissionForm action={submitOwnerPropertyAction} />
      </Card>
    </div>
  );
}
