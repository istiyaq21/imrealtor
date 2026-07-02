// Auth proxy (formerly "middleware" pre-Next.js 16 — same functionality,
// new file convention/export name). Refreshes the Supabase session cookie
// on every request, and gates the protected dashboard prefixes (/admin,
// /agent, /owner, /buyer) behind "is there a session at all". Role/
// approval checks happen one layer in, at the layout level (see
// src/lib/auth/session.ts) — this file intentionally stays cheap, per
// Next.js's own guidance to avoid slow/database-heavy checks in Proxy.
// Supabase's own SSR guidance is to use auth.getUser() (not getSession())
// even here, since it's the only way to revalidate the token rather than
// trust a possibly-stale local cookie — that one Supabase-specific check
// is the exception to "cookie-only" and is intentional.
//
// If Supabase env vars are missing, protected prefixes redirect to
// /login (which shows a setup message) instead of allowing access or
// crashing. Public pages are unaffected either way.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfigStatus } from "@/lib/supabase/status";

const PROTECTED_PREFIXES = ["/admin", "/agent", "/owner", "/buyer"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function redirectToLogin(request: NextRequest, extraParams?: Record<string, string>) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  for (const [key, value] of Object.entries(extraParams ?? {})) {
    loginUrl.searchParams.set(key, value);
  }
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const protectedRoute = isProtectedPath(request.nextUrl.pathname);
  const { isPublicClientConfigured } = getSupabaseConfigStatus();

  if (!isPublicClientConfigured) {
    if (protectedRoute) {
      return redirectToLogin(request, { setup: "1" });
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Always use getUser() here, never getSession() — getUser() revalidates
  // the token against the Supabase Auth server instead of trusting a
  // possibly-stale local cookie.
  const { data } = await supabase.auth.getUser();

  if (protectedRoute && !data.user) {
    return redirectToLogin(request);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
