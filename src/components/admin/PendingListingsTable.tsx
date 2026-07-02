"use client";

import { useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatPrice } from "@/lib/mock-data";
import type { Property } from "@/lib/types";

interface PendingListingsTableProps {
  initialListings: Property[];
}

// TODO(supabase): persist approve/reject actions to the `properties` table
// instead of local component state.
export default function PendingListingsTable({ initialListings }: PendingListingsTableProps) {
  const [listings, setListings] = useState(initialListings);

  function updateStatus(id: string, status: "approved" | "rejected") {
    setListings((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  const pending = listings.filter((item) => item.status === "pending");

  if (pending.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        No pending listings right now.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">City</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pending.map((property) => (
            <tr key={property.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 font-medium text-slate-900">
                <Link href={`/properties/${property.id}`} className="hover:text-brand-600">
                  {property.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-slate-600">{property.city}</td>
              <td className="px-4 py-3 text-slate-600">{formatPrice(property.price)}</td>
              <td className="px-4 py-3">
                <Badge tone="warning">Pending</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateStatus(property.id, "approved")}>
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(property.id, "rejected")}
                  >
                    Reject
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
