"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/site/Logo";
import Badge from "@/components/ui/Badge";

export interface SidebarLink {
  href: string;
  label: string;
}

interface DashboardSidebarProps {
  roleLabel: string;
  links: SidebarLink[];
}

export default function DashboardSidebar({ roleLabel, links }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col gap-6 border-b border-slate-200 bg-white p-5 md:h-full md:w-64 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between">
        <Logo showWordmark={false} />
        <Badge tone="brand">{roleLabel}</Badge>
      </div>

      <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {links.map((link) => {
          const isActive = link.href === pathname;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
        Demo dashboard — private beta only. No real authentication is connected yet.
      </div>
    </aside>
  );
}
