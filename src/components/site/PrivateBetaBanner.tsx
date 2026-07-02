"use client";

import { usePathname } from "next/navigation";

// Dashboard layouts (DashboardSidebar) and the Footer already carry a
// short private-beta note — showing this banner there too would just be
// noise. Hiding by pathname here (rather than only omitting it from
// individual pages) means any new dashboard/auth route added later is
// covered automatically without remembering to opt out.
const HIDDEN_PREFIXES = ["/admin", "/agent", "/owner", "/buyer", "/login", "/access-status"];

export default function PrivateBetaBanner() {
  const pathname = usePathname();

  if (HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return null;
  }

  return (
    <div className="border-b border-brand-100 bg-brand-50">
      <p className="mx-auto max-w-6xl px-6 py-2 text-center text-xs font-medium text-brand-800 sm:text-sm">
        Private beta: access is controlled, listings are admin-reviewed, and public signup is disabled.
      </p>
    </div>
  );
}
