"use client";

import { useState, useTransition } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { updateAccessRequestStatusAction } from "@/app/admin/actions";
import type { AccessRequest } from "@/lib/types";

interface PendingAccessRequestsTableProps {
  initialRequests: AccessRequest[];
}

export default function PendingAccessRequestsTable({
  initialRequests,
}: PendingAccessRequestsTableProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateStatus(id: string, status: "approved" | "rejected") {
    setMessage(null);
    startTransition(async () => {
      const result = await updateAccessRequestStatusAction(id, status);
      if (result.ok) {
        setRequests((prev) => prev.filter((item) => item.id !== id));
      }
      setMessage(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {message && <p className="text-sm text-slate-500">{message}</p>}

      {requests.length === 0 ? (
        <EmptyState title="No pending access requests." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role Requested</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{request.fullName}</td>
                  <td className="px-4 py-3">
                    <Badge tone="brand" className="capitalize">
                      {request.roleRequested}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{request.city}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{request.email}</div>
                    <div className="text-xs text-slate-400">{request.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" disabled={isPending} onClick={() => updateStatus(request.id, "approved")}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => updateStatus(request.id, "rejected")}
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
      )}
    </div>
  );
}
