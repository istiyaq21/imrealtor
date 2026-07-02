import type { ReactNode } from "react";
import DashboardSidebar, { type SidebarLink } from "@/components/dashboard/DashboardSidebar";
import { requireApprovedRole } from "@/lib/auth/session";

const links: SidebarLink[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/imports", label: "AI Imports" },
  { href: "/admin/system", label: "System Check" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Admin-only — deliberately no other role is ever allowed in here.
  await requireApprovedRole(["admin"]);

  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col md:flex-row">
      <DashboardSidebar roleLabel="Admin" links={links} />
      <div className="flex-1 bg-slate-50 p-6 md:p-10">{children}</div>
    </div>
  );
}
