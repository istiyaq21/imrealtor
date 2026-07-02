import Link from "next/link";
import Logo from "./Logo";
import Button from "@/components/ui/Button";
import { getCurrentProfile, getPostLoginRedirect } from "@/lib/auth/session";

const navLinks = [
  { href: "/properties", label: "Properties" },
  { href: "/about", label: "About" },
  { href: "/request-access", label: "Request Access" },
];

// Async Server Component — getCurrentProfile() already returns null
// gracefully when Supabase isn't configured, so this never crashes the
// build. Treats "no profile row" the same as "not logged in" for display
// purposes here; a signed-in-but-profileless user still reaches
// /access-status by visiting it directly or via a dashboard layout.
export default async function Header() {
  const profile = await getCurrentProfile();
  const isSignedIn = Boolean(profile);
  const dashboardHref = getPostLoginRedirect(profile);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-700 transition-colors hover:text-brand-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <>
              <Button href={dashboardHref} variant="outline" size="sm" className="hidden sm:inline-flex">
                Dashboard
              </Button>
              <Button href="/logout" size="sm">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button href="/login" variant="outline" size="sm" className="hidden sm:inline-flex">
                Login
              </Button>
              <Button href="/request-access" size="sm">
                Request Access
              </Button>
            </>
          )}
        </div>
      </div>

      <nav className="flex items-center gap-5 overflow-x-auto border-t border-slate-100 px-6 py-2.5 md:hidden">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap text-sm font-medium text-slate-700 hover:text-brand-600"
          >
            {link.label}
          </Link>
        ))}
        {isSignedIn ? (
          <>
            <Link href={dashboardHref} className="whitespace-nowrap text-sm font-medium text-slate-700 hover:text-brand-600">
              Dashboard
            </Link>
            <Link href="/logout" className="whitespace-nowrap text-sm font-medium text-slate-700 hover:text-brand-600">
              Logout
            </Link>
          </>
        ) : (
          <Link href="/login" className="whitespace-nowrap text-sm font-medium text-slate-700 hover:text-brand-600">
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}
