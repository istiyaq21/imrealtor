import type { Metadata } from "next";
import EnquiriesTable from "@/components/admin/EnquiriesTable";
import { listEnquiriesForAdmin } from "@/lib/services/enquiries";

export const metadata: Metadata = {
  title: "Manage Enquiries",
};

export default async function AdminEnquiriesPage() {
  const enquiries = await listEnquiriesForAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Enquiries</h1>
        <p className="mt-1 text-sm text-slate-600">
          Track and update the status of buyer enquiries.
        </p>
      </div>
      <EnquiriesTable initialEnquiries={enquiries} />
    </div>
  );
}
