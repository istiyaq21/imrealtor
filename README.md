# I'm Realtor

A simple, verified, admin-reviewed real estate marketplace — currently in
**soft-live private beta**.

⚠️ **Private beta.** Access is controlled, listings are admin-reviewed,
and public signup is disabled. Do not enable analytics, ads, a sitemap,
or SEO until an intentional public launch decision is made — see
`docs/SOFT_LIVE_CHECKLIST.md` before deploying anywhere real testers can
reach.

Built with Next.js App Router, TypeScript, and Tailwind CSS. The Supabase
backend is optional during development: every page falls back to mock data
in `src/lib/mock-data.ts` when Supabase env vars aren't set.

## Project Status: Phase 5 — Soft-Live Readiness

- **Phase 1 — Frontend MVP:** ✅ complete.
- **Phase 2 — Supabase Backend Foundation:** ✅ complete.
- **Phase 3 — Auth + Role-Based Access:** ✅ complete.
- **Phase 4 — Real Property Workflow:** ✅ complete.
- **Phase 5 — Launch Hardening + Soft-Live Deployment Readiness:** ✅ complete.
  Full audit pass, a private-beta banner, an admin System Check page
  (`/admin/system`), reusable empty/error/loading UI states, a real
  (optional) image upload path wired into property submission, a fixed
  `/request-access` flow (now actually persists when Supabase is
  configured — it didn't before), and a full deployment/security/checklist
  doc set (this README's links below).

See `docs/BACKEND_PHASES.md` for the full phase-by-phase history and what
a Phase 5.1 might cover next.

## How to run locally

```bash
npm install
npm run dev              # http://localhost:3000
npm run lint              # eslint
npm run build              # production build + type check
npm run check:soft-live    # verifies private-beta safeguards are in place
```

Works with **zero Supabase env vars** — every page falls back to mock
data, auth pages show a clear setup message, and protected routes
redirect safely instead of crashing. See `docs/SUPABASE_SETUP.md` to
connect a real backend.

## How to deploy

Deploying to Vercel (including pointing an old domain at it for private
beta testing) is covered step by step in
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — repo connection, env vars,
Supabase SQL run order, first admin setup, domain/DNS/HTTPS, and a
rollback plan. Run through
[`docs/SOFT_LIVE_CHECKLIST.md`](docs/SOFT_LIVE_CHECKLIST.md) before
sharing the link with anyone.

## Docs

- [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) — connect a real
  Supabase project: schema, RLS, storage, seed data, first admin, and a
  Phase 4 manual testing checklist.
- [`docs/BACKEND_PHASES.md`](docs/BACKEND_PHASES.md) — the full Phase
  1–5 roadmap and history, plus what's left for a Phase 5.1.
- [`docs/SECURITY_REVIEW.md`](docs/SECURITY_REVIEW.md) — the auth/role/
  RLS model, what's admin-only vs. public, and pre-public-launch
  security TODOs.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Vercel + old domain
  deployment guide, soft-live launch mode checklist, rollback plan.
- [`docs/SOFT_LIVE_CHECKLIST.md`](docs/SOFT_LIVE_CHECKLIST.md) — the
  practical, checkbox-based go/no-go checklist before sharing the
  deployed link with real testers.

## Private Beta Rules

- No open public signup, no signup page at all — new users go through
  `/request-access` and are reviewed by admin, who creates their account
  manually (see `docs/SUPABASE_SETUP.md`).
- Agents and owners are admin-created or admin-approved.
- `/admin`, `/agent`, `/owner`, `/buyer` are gated by real auth + role +
  approval status (`src/proxy.ts`, `src/lib/auth/session.ts`) — an
  approved user can only reach their own role's dashboard.
- Listings require admin approval (`properties.status = 'approved'`)
  before they're publicly visible.
- No ads, analytics, tracking pixels, or SEO push during the beta.
- A visible `PrivateBetaBanner` on public pages says exactly this to
  visitors, too.

## SEO / Crawling

This app is intentionally **not** indexed while in private beta:

- Root layout metadata sets `robots: { index: false, follow: false }`.
- `src/app/robots.ts` serves a `robots.txt` that disallows all crawling.
- No sitemap, analytics, or tracking scripts are included.

Do not remove these until the private beta ends and public launch is an
intentional decision — see `docs/SECURITY_REVIEW.md` §12 and
`docs/DEPLOYMENT.md` §7.
