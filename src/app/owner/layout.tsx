import type { ReactNode } from "react";
import DashboardSidebar, { type SidebarLink } from "@/components/dashboard/DashboardSidebar";

const links: SidebarLink[] = [
  { href: "/owner", label: "Overview" },
  { href: "/owner/submit-property", label: "Submit Property" },
];

export default function OwnerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col md:flex-row">
      <DashboardSidebar roleLabel="Owner" links={links} />
      <div className="flex-1 bg-slate-50 p-6 md:p-10">{children}</div>
    </div>
  );
}
