import type { Metadata } from "next";
import ListingsTable from "@/components/admin/ListingsTable";
import { listPropertiesForAdmin } from "@/lib/services/properties";

export const metadata: Metadata = {
  title: "Manage Listings",
};

export default async function AdminListingsPage() {
  const listings = await listPropertiesForAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Listings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Review, approve, reject, or feature property listings.
        </p>
      </div>
      <ListingsTable initialListings={listings} />
    </div>
  );
}
