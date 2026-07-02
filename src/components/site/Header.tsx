import Link from "next/link";
import Logo from "./Logo";
import Button from "@/components/ui/Button";

const navLinks = [
  { href: "/properties", label: "Properties" },
  { href: "/about", label: "About" },
  { href: "/request-access", label: "Request Access" },
];

export default function Header() {
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
          <Button href="/login" variant="outline" size="sm" className="hidden sm:inline-flex">
            Login
          </Button>
          <Button href="/request-access" size="sm">
            Request Access
          </Button>
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
        <Link href="/login" className="whitespace-nowrap text-sm font-medium text-slate-700 hover:text-brand-600">
          Login
        </Link>
      </nav>
    </header>
  );
}
