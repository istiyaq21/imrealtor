import type { ReactNode } from "react";
import DashboardSidebar, { type SidebarLink } from "@/components/dashboard/DashboardSidebar";

const links: SidebarLink[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/enquiries", label: "Enquiries" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col md:flex-row">
      <DashboardSidebar roleLabel="Admin" links={links} />
      <div className="flex-1 bg-slate-50 p-6 md:p-10">{children}</div>
    </div>
  );
}
