"use client";

import { useState, useTransition } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { updateEnquiryStatusAction } from "@/app/admin/actions";
import type { Enquiry, EnquiryStatus } from "@/lib/types";

const statusTone: Record<EnquiryStatus, "brand" | "warning" | "success" | "danger"> = {
  new: "brand",
  contacted: "warning",
  closed: "success",
  spam: "danger",
};

export default function EnquiriesTable({ initialEnquiries }: { initialEnquiries: Enquiry[] }) {
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setStatus(id: string, status: EnquiryStatus) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateEnquiryStatusAction(id, status);
      if (result.ok) {
        setEnquiries((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
      }
      setMessage(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {message && <p className="text-sm text-slate-500">{message}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
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
                    <Button size="sm" variant="outline" disabled={isPending} onClick={() => setStatus(enquiry.id, "contacted")}>
                      Mark Contacted
                    </Button>
                    <Button size="sm" variant="ghost" disabled={isPending} onClick={() => setStatus(enquiry.id, "closed")}>
                      Mark Closed
                    </Button>
                    <Button size="sm" variant="ghost" disabled={isPending} onClick={() => setStatus(enquiry.id, "spam")}>
                      Mark Spam
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {enquiries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No enquiries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
