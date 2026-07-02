import type { Metadata } from "next";
import ListingImportForm from "@/components/admin/ListingImportForm";
import ListingImportsTable from "@/components/admin/ListingImportsTable";
import { listListingImportsForAdmin } from "@/lib/services/listing-imports";

export const metadata: Metadata = {
  title: "AI Imports",
};

export default async function AdminImportsPage() {
  const imports = await listListingImportsForAdmin();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI Imports</h1>
        <p className="mt-1 text-sm text-slate-600">
          Paste a WhatsApp-style listing message to extract structured fields locally — no external AI
          calls happen here yet.
        </p>
        <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
          AI import is a draft helper. Admin must verify before listing goes public.
        </p>
      </div>

      <ListingImportForm />

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Import History</h2>
        <ListingImportsTable imports={imports} />
      </section>
    </div>
  );
}
