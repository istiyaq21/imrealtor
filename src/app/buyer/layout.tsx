import type { ReactNode } from "react";
import DashboardSidebar, { type SidebarLink } from "@/components/dashboard/DashboardSidebar";
import { requireApprovedRole } from "@/lib/auth/session";

const links: SidebarLink[] = [
  { href: "/buyer", label: "Overview" },
  { href: "/properties", label: "Browse Properties" },
];

export default async function BuyerLayout({ children }: { children: ReactNode }) {
  // Only approved buyers — admin is intentionally NOT included here.
  // If an admin-override is ever needed, add "admin" explicitly with a
  // comment explaining why, rather than loosening this by default.
  await requireApprovedRole(["buyer"]);

  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col md:flex-row">
      <DashboardSidebar roleLabel="Buyer" links={links} />
      <div className="flex-1 bg-slate-50 p-6 md:p-10">{children}</div>
    </div>
  );
}
