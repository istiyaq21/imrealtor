"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { Enquiry, EnquiryStatus } from "@/lib/types";

const statusTone: Record<EnquiryStatus, "brand" | "warning" | "success"> = {
  new: "brand",
  contacted: "warning",
  closed: "success",
};

// TODO(supabase): persist status updates to the `enquiries` table.
export default function EnquiriesTable({ initialEnquiries }: { initialEnquiries: Enquiry[] }) {
  const [enquiries, setEnquiries] = useState(initialEnquiries);

  function setStatus(id: string, status: EnquiryStatus) {
    setEnquiries((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Buyer</th>
            <th className="px-4 py-3">Property</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {enquiries.map((enquiry) => (
            <tr key={enquiry.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 font-medium text-slate-900">{enquiry.buyerName}</td>
              <td className="px-4 py-3 text-slate-600">{enquiry.propertyTitle}</td>
              <td className="px-4 py-3 text-slate-600">
                <div>{enquiry.email}</div>
                <div className="text-xs text-slate-400">{enquiry.phone}</div>
              </td>
              <td className="px-4 py-3">
                <Badge tone={statusTone[enquiry.status]} className="capitalize">
                  {enquiry.status}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setStatus(enquiry.id, "contacted")}>
                    Mark Contacted
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setStatus(enquiry.id, "closed")}>
                    Mark Closed
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
