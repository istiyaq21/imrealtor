"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { formatPrice } from "@/lib/mock-data";
import type { ListingStatus, Property } from "@/lib/types";

const statusTone: Record<ListingStatus, "neutral" | "warning" | "success" | "danger"> = {
  draft: "neutral",
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

const statusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

// TODO(supabase): persist approve/reject/feature actions to the
// `properties` table instead of local component state.
export default function ListingsTable({ initialListings }: { initialListings: Property[] }) {
  const [listings, setListings] = useState(initialListings);
  const [statusFilter, setStatusFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  const cityOptions = useMemo(
    () =>
      Array.from(new Set(initialListings.map((item) => item.city))).map((city) => ({
        label: city,
        value: city,
      })),
    [initialListings],
  );

  const filtered = listings.filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (cityFilter && item.city !== cityFilter) return false;
    return true;
  });

  function setStatus(id: string, status: ListingStatus) {
    setListings((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  function toggleFeatured(id: string) {
    setListings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, featured: !item.featured } : item)),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="w-44">
          <Select
            label="Status"
            placeholder="All statuses"
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <div className="w-44">
          <Select
            label="City"
            placeholder="All cities"
            options={cityOptions}
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((property) => (
              <tr key={property.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900">
                  <Link href={`/properties/${property.id}`} className="hover:text-brand-600">
                    {property.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{property.city}</td>
                <td className="px-4 py-3 text-slate-600">{formatPrice(property.price)}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[property.status]} className="capitalize">
                    {property.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {property.featured ? <Badge tone="brand">Featured</Badge> : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setStatus(property.id, "approved")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setStatus(property.id, "rejected")}>
                      Reject
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleFeatured(property.id)}>
                      {property.featured ? "Unfeature" : "Feature"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No listings match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
