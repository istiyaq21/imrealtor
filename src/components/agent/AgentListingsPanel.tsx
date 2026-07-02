"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PropertySubmissionForm from "@/components/forms/PropertySubmissionForm";
import { submitAgentPropertyAction } from "@/app/agent/actions";
import { formatPrice } from "@/lib/mock-data";
import type { ListingStatus, Property } from "@/lib/types";

const statusTone: Record<ListingStatus, "neutral" | "warning" | "success" | "danger"> = {
  draft: "neutral",
  pending: "warning",
  approved: "success",
  rejected: "danger",
  archived: "neutral",
};

export default function AgentListingsPanel({ listings }: { listings: Property[] }) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const result = await submitAgentPropertyAction(formData);
    if (result.ok) {
      setShowForm(false);
      router.refresh();
    }
    return result;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          You cannot publish listings directly — every submission is reviewed by admin.
        </p>
        <Button onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? "Close" : "Add Listing"}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">New Listing (Requires Admin Approval)</h2>
          <PropertySubmissionForm action={handleSubmit} />
        </Card>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((property) => (
              <tr key={property.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900">
                  {property.status === "approved" ? (
                    <Link href={`/properties/${property.id}`} className="hover:text-brand-600">
                      {property.title}
                    </Link>
                  ) : (
                    property.title
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{property.city}</td>
                <td className="px-4 py-3 text-slate-600">{formatPrice(property.price)}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[property.status]} className="capitalize">
                    {property.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {listings.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No listings yet. Add your first listing above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
