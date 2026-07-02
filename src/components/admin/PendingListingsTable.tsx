"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { approvePropertyAction, rejectPropertyAction } from "@/app/admin/actions";
import { formatPrice } from "@/lib/mock-data";
import type { Property } from "@/lib/types";

interface PendingListingsTableProps {
  initialListings: Property[];
}

export default function PendingListingsTable({ initialListings }: PendingListingsTableProps) {
  const [listings, setListings] = useState(initialListings);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function approve(id: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await approvePropertyAction(id);
      if (result.ok) {
        setListings((prev) => prev.filter((item) => item.id !== id));
      }
      setMessage(result.message);
    });
  }

  function reject(id: string) {
    const reason = window.prompt("Reason for rejection (optional):") ?? "";
    setMessage(null);
    startTransition(async () => {
      const result = await rejectPropertyAction(id, reason);
      if (result.ok) {
        setListings((prev) => prev.filter((item) => item.id !== id));
      }
      setMessage(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {message && <p className="text-sm text-slate-500">{message}</p>}

      {listings.length === 0 ? (
        <EmptyState title="No pending listings right now." />
      ) : (
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
              {listings.map((property) => (
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
                      <Button size="sm" disabled={isPending} onClick={() => approve(property.id)}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" disabled={isPending} onClick={() => reject(property.id)}>
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
