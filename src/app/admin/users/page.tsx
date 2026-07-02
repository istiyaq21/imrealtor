import type { Metadata } from "next";
import UsersTable from "@/components/admin/UsersTable";
import { users } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Manage Users",
};

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-600">
          Approve or suspend agents, owners, and buyers.
        </p>
      </div>
      <UsersTable initialUsers={users} />
    </div>
  );
}
