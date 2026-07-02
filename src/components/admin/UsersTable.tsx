"use client";

import { useState, useTransition } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { updateUserRoleAction, updateUserStatusAction } from "@/app/admin/actions";
import type { AppUser, ApprovalStatus, UserRole } from "@/lib/types";

const tabs: { label: string; role: UserRole }[] = [
  { label: "Agents", role: "agent" },
  { label: "Owners", role: "owner" },
  { label: "Buyers", role: "buyer" },
];

const roleOptions = [
  { label: "Agent", value: "agent" },
  { label: "Owner", value: "owner" },
  { label: "Buyer", value: "buyer" },
];

const statusTone: Record<ApprovalStatus, "warning" | "success" | "danger" | "neutral"> = {
  pending: "warning",
  approved: "success",
  suspended: "danger",
  rejected: "danger",
};

export default function UsersTable({ initialUsers }: { initialUsers: AppUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [activeTab, setActiveTab] = useState<UserRole>("agent");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setStatus(id: string, status: ApprovalStatus) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateUserStatusAction(id, status);
      if (result.ok) {
        setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, status } : user)));
      }
      setMessage(result.message);
    });
  }

  function setRole(id: string, role: UserRole) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateUserRoleAction(id, role);
      if (result.ok) {
        setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, role } : user)));
      }
      setMessage(result.message);
    });
  }

  const filtered = users.filter((user) => user.role === activeTab);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 rounded-xl bg-slate-100 p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.role}
            type="button"
            onClick={() => setActiveTab(tab.role)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.role
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message && <p className="text-sm text-slate-500">{message}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                <td className="px-4 py-3 text-slate-600">
                  <div>{user.email}</div>
                  <div className="text-xs text-slate-400">{user.phone}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{user.city}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone[user.status]} className="capitalize">
                    {user.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="w-36">
                    <Select
                      options={roleOptions}
                      value={user.role}
                      disabled={isPending}
                      onChange={(e) => setRole(user.id, e.target.value as UserRole)}
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled={isPending} onClick={() => setStatus(user.id, "approved")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="ghost" disabled={isPending} onClick={() => setStatus(user.id, "suspended")}>
                      Suspend
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No users in this category yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
