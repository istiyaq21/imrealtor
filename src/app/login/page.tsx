import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import PageShell from "@/components/site/PageShell";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Login",
};

const demoRoles = [
  { label: "Continue as Admin", href: "/admin" },
  { label: "Continue as Agent", href: "/agent" },
  { label: "Continue as Owner", href: "/owner" },
  { label: "Continue as Buyer", href: "/buyer" },
];

// TODO(supabase): replace this page with real Supabase Auth (email/password
// or magic link) once the database is connected. The demo buttons below only
// redirect to dashboards and do not perform any authentication.
export default function LoginPage() {
  return (
    <PageShell className="max-w-md">
      <div className="flex flex-col items-center text-center">
        <Image src="/im-realtor-logo.png" alt="I'm Realtor" width={56} height={56} className="rounded-xl" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in to your I&apos;m Realtor account.</p>
      </div>

      <Card className="mt-8 p-6 sm:p-8">
        <form className="flex flex-col gap-4">
          <Input label="Email" name="email" type="email" placeholder="you@example.com" required />
          <Input label="Password" name="password" type="password" placeholder="••••••••" required />
          <Button type="submit" className="mt-2 w-full">
            Sign In
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs uppercase tracking-wide text-slate-400">Demo Access</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="grid gap-3">
          {demoRoles.map((role) => (
            <Button key={role.href} href={role.href} variant="outline" className="w-full">
              {role.label}
            </Button>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Demo access for private beta testing only. No real authentication is
          connected yet — demo buttons redirect directly to role dashboards.
        </p>
      </Card>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have access yet?{" "}
        <Link href="/request-access" className="font-medium text-brand-600 hover:text-brand-700">
          Request Access
        </Link>
      </p>
    </PageShell>
  );
}
