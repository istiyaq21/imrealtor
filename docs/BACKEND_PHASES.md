# Backend Roadmap — I'm Realtor

## Phase 2 — Backend Foundation ✅ (this phase)

- Supabase client helpers (browser/server/admin) that degrade gracefully
  with no env vars configured.
- Full database schema (`src/lib/db/schema.sql`): profiles, access
  requests, properties, property images, enquiries, saved properties,
  agent assignments, audit logs, and a listing-imports table for a future
  AI importer.
- Row Level Security policies (`src/lib/db/rls.sql`) enforcing the private
  beta's approval workflow at the database layer, not just in the UI.
- Storage bucket plan (`src/lib/db/storage.sql`) for property images.
- Seed data (`src/lib/db/seed.sql`) for local testing.
- Hand-written database TypeScript types (`src/lib/database.types.ts`).
- Service layer stubs (`src/lib/services/*.ts`) that fall back to mock
  data until Supabase is connected.
- No changes to Phase 1 pages/components — the frontend still renders from
  mock data either way.

## Phase 3 — Auth + Role Access ✅ (this phase)

- Real Supabase Auth: email/password sign-in (`src/app/auth/actions.ts`,
  `src/components/auth/LoginForm.tsx`), replacing the `/login` demo
  buttons with actual sessions. No signup page — accounts are still
  created manually by admin (see `docs/SUPABASE_SETUP.md`).
- `src/proxy.ts` refreshes the session cookie on every request and
  redirects unauthenticated visitors away from `/admin`, `/agent`,
  `/owner`, `/buyer` to `/login?next=...`.
- `src/lib/auth/session.ts` (`getCurrentUser`, `getCurrentProfile`,
  `requireAuth`, `requireApprovedRole`, `getPostLoginRedirect`) and
  `src/lib/auth/guards.ts` (pure role/approval predicates +
  `getAccessDeniedReason`) are the source of truth for role/approval
  checks — middleware deliberately stays session-only for speed.
- Every dashboard layout (`admin`/`agent`/`owner`/`buyer`) now calls
  `requireApprovedRole([...])`; an approved user with the wrong role is
  bounced to their own dashboard, not an error page. Admin does **not**
  get an automatic override into the other three dashboards.
- `/access-status` explains pending/rejected/suspended/missing-profile
  states and links approved users to their dashboard.
- `/logout` (`src/app/logout/route.ts`) signs out and redirects to
  `/login`. Header and DashboardSidebar both link to it when signed in.
- Everything degrades gracefully with no Supabase env vars: `/login` shows
  a setup message instead of a form, protected routes redirect to
  `/login` instead of crashing.
- Still not done: password reset, and any real auto-provisioning on
  signup (there's no signup to provision from yet).

## Phase 4 — Real Property Workflow ✅ (this phase)

- Every dashboard page (`/admin/*`, `/owner`, `/owner/submit-property`,
  `/agent`, `/agent/listings`, `/buyer`) now reads through the service
  layer (`src/lib/services/*.ts`) instead of importing mock data
  directly — falls back to mock data automatically when Supabase isn't
  configured, exactly as before, but the wiring is real.
- New server actions gate every mutation behind `requireApprovedRole()`:
  `src/app/properties/actions.ts` (enquiry, save/unsave),
  `src/app/owner/actions.ts`, `src/app/agent/actions.ts`,
  `src/app/admin/actions.ts`, `src/app/admin/imports/actions.ts`.
- Admin listings/users/enquiries tables persist for real (approve/reject/
  feature, approve/suspend/role-change, contacted/closed/spam) with
  optimistic local UI updates that roll back to a message-only failure
  state if the server action reports `ok: false`.
- Audit logging (`src/lib/services/audit.ts`) records every admin
  approve/reject/feature/assign/status/role action to `audit_logs`,
  best-effort (never blocks the underlying action if the log write fails).
- Saved properties (`src/lib/services/saved-properties.ts`) and a
  `SavePropertyButton` on the property detail page for signed-in approved
  buyers — enforces "only approved properties can be saved" at the
  application level, since RLS alone doesn't check that.
- AI WhatsApp listing importer foundation: `/admin/imports`, a **local
  regex/keyword parser only** (`parseListingTextLocally()` in
  `src/lib/services/listing-imports.ts` — no external AI API calls),
  an editable preview before saving, and "save as pending property" that
  reuses the exact same admin-review path as any other submission.
- Storage foundation (`src/lib/services/storage.ts`): upload/signed-URL/
  admin-delete for the `property-images` bucket. Still not wired into
  `PropertySubmissionForm`'s UI, which remains a placeholder — see
  `uploadPropertyImageAction` in `src/app/owner/actions.ts` for the ready
  server-side half of this.
- Dashboard stats (`src/lib/services/dashboard.ts`) per role, reusing the
  list functions above rather than duplicating filtering logic.
- Property detail page now resolves the assigned agent's name and a real
  image gallery via a narrow, read-only service-role lookup (documented
  in `getAssignedAgentName()` in `properties.ts`) rather than a public
  RLS policy change — see "Security notes" below.
- **Not done in this phase:** `PropertySubmissionForm`'s image field was
  still a static placeholder (no real file input) — fixed in Phase 5.
  `access_requests` approval still only flips a status flag, it does not
  create the matching `auth.users`/`profiles` rows (see
  `updateAccessRequestStatusAction` TODO, still true after Phase 5);
  `properties.area`/`type` are still free text, not normalized.

## Phase 5 — Launch Hardening + Soft-Live Deployment Readiness ✅ (this phase)

- Full project audit: confirmed no client/server boundary violations, no
  service-role leaks, no analytics/tracking/sitemap/signup routes, and
  found + fixed one real bug — `RequestAccessForm` was 100% local-state
  and never actually called `createAccessRequest()`, even when Supabase
  was configured. Also fixed two spots in `services/access-requests.ts`
  that leaked raw Supabase error text.
- `PrivateBetaBanner` (`src/components/site/PrivateBetaBanner.tsx`) — a
  small top-of-page banner on public routes, self-hiding on
  dashboard/auth routes via `usePathname()` so it doesn't stack with the
  dashboard sidebar's own private-beta note or the footer badge.
- Admin-only System Check page at `/admin/system`
  (`src/lib/system/checks.ts` + the page) — safe booleans and reminder
  text only, never secret values.
- Reusable `EmptyState`, `ErrorMessage`, `LoadingState` components
  (`src/components/ui/`), wired into the properties page, admin's
  standalone pending-listings/pending-access-requests panels, the buyer
  dashboard's saved-properties section, and every form's error display
  (replacing one-off inline markup with a shared component).
- `PropertySubmissionForm` now has a real optional multi-file image
  input. `services/storage.ts` gained `uploadPropertyImages()` (a
  best-effort batch helper); both `submitOwnerPropertyAction` and
  `submitAgentPropertyAction` upload any selected images right after the
  property is created and report upload counts in the success message —
  without ever failing the property submission itself if an image fails.
- `/request-access` now actually persists via a new
  `src/app/request-access/actions.ts` + wired `RequestAccessForm`, with a
  documented UI note on `/admin` that approving a request does not yet
  create the actual login — admin still does that step manually (by
  design, not yet automated — see Phase 5.1).
- New docs: `docs/SECURITY_REVIEW.md`, `docs/DEPLOYMENT.md`,
  `docs/SOFT_LIVE_CHECKLIST.md`. `scripts/soft-live-check.mjs`
  (`npm run check:soft-live`) as a lightweight automated safeguard check.
- Re-confirmed (didn't need fixing): noindex/robots metadata, no
  sitemap, no analytics, no signup route, RLS-enforced approval
  workflow — all still intact from Phases 1–4.

## Phase 5.1 — Suggested Next Mini-Phase

Everything below was already known and documented before Phase 5 (see
`docs/SECURITY_REVIEW.md` §11) — listed here again as the practical
next-steps list once the private beta itself is running:

- Admin-initiated invite flow (create the auth user + approved profile
  in one step), or make `access_requests` approval actually provision
  the account, instead of the current two-step manual process.
- Column-level `GRANT`/`REVOKE` on `profiles.role`/`status` and the
  agent `enquiries` update, as defense in depth alongside the existing
  trigger + RLS row-scoping (`TODO(security-review)` in `rls.sql`).
- Decide the final signed-URL vs. public-image-proxy strategy in
  `services/storage.ts` before real traffic (signed URLs re-sign on
  every request today — fine at private-beta volume).
- Swap `parseListingTextLocally()` for a real OpenAI/Claude extraction
  call (`TODO(ai)`) once ready to spend on real NLP.
- Normalize `properties.area`/`type` to typed columns once real listing
  categories are finalized.
- Rate limiting / abuse protection on the two public write paths
  (`/request-access`, guest enquiries).
- Load/perf review of RLS policies and the per-property
  `getAssignedAgentName()`/image-gallery lookups at real traffic volume.
- Production monitoring/alerting for failed admin actions and audit log
  gaps.
- When ready for an intentional public launch: enable analytics/SEO,
  add a sitemap, and open (or semi-open) the signup flow — none of these
  should happen by accident; re-read `docs/SECURITY_REVIEW.md` §12 first.
