# I'm Realtor

A simple, verified, admin-reviewed real estate marketplace — currently in
**soft-live private beta**.

Built with Next.js App Router, TypeScript, and Tailwind CSS. The Supabase
backend is optional during development: every page falls back to mock data
in `src/lib/mock-data.ts` when Supabase env vars aren't set.

## Project Status

- **Phase 1 — Frontend MVP:** ✅ complete. Public marketing pages, property
  browsing, request-access flow, and role dashboards (admin/agent/owner/buyer),
  all running on mock data.
- **Phase 2 — Supabase Backend Foundation:** ✅ complete. Database schema,
  Row Level Security policies, storage bucket plan, and a service layer
  that's ready to swap in for the mock data.
- **Phase 3 — Auth + Role-Based Access:** ✅ complete. Real Supabase Auth
  email/password login, session middleware, and per-role dashboard guards
  (`/admin`, `/agent`, `/owner`, `/buyer`) with an `/access-status` page
  explaining pending/rejected/suspended states. Still no signup page —
  see `docs/SUPABASE_SETUP.md` for how accounts are created. See
  `docs/BACKEND_PHASES.md` for what's next (Phase 4: real property
  workflow, Phase 5: launch hardening).

## Commands

```bash
npm run dev     # start the dev server (http://localhost:3000)
npm run lint    # eslint
npm run build   # production build + type check
```

## Private Beta Rules

- No open public signup, no signup page at all — new users go through
  `/request-access` and are reviewed by admin, who creates their account
  manually (see `docs/SUPABASE_SETUP.md`).
- Agents and owners are admin-created or admin-approved.
- `/admin`, `/agent`, `/owner`, `/buyer` are gated by real auth + role +
  approval status (`src/middleware.ts`, `src/lib/auth/session.ts`) — an
  approved user can only reach their own role's dashboard.
- Listings require admin approval (`properties.status = 'approved'`)
  before they're publicly visible.
- No ads, analytics, tracking pixels, or SEO push during the beta.

## Supabase Backend

See [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) for how to connect a
real Supabase project (schema, RLS, storage, seed data, and a private-beta
safety checklist). Until then, the app runs entirely on mock data.

## SEO / Crawling

This app is intentionally **not** indexed while in private beta:

- Root layout metadata sets `robots: { index: false, follow: false }`.
- `src/app/robots.ts` serves a `robots.txt` that disallows all crawling.
- No sitemap, analytics, or tracking scripts are included.

Do not remove these until the private beta ends and public launch is
intentional (see `docs/BACKEND_PHASES.md`, Phase 5).
