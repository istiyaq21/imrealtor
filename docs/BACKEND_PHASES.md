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
- **Not done in this phase:** `PropertySubmissionForm`'s image field is
  still a placeholder (no real file input yet); `access_requests`
  approval still only flips a status flag, it does not create the
  matching `auth.users`/`profiles` rows (see `updateAccessRequestStatusAction`
  TODO); `properties.area`/`type` are still free text, not normalized.

## Phase 5 — Launch Hardening

- Security review of every `TODO(security-review)` comment in `rls.sql`
  (column-level restrictions on `profiles.role`/`status` and
  `enquiries` agent updates currently rely on trigger + convention, not
  column-level grants).
- Wire `PropertySubmissionForm` to a real file input calling
  `uploadPropertyImageAction`/`uploadPropertyImage()` — the service and
  action already exist (see Phase 4), only the UI doesn't call them yet.
- Decide the final signed-URL vs. public-image-proxy strategy for
  property images (see `TODO(storage)` in `src/lib/services/storage.ts`)
  before real traffic — signed URLs re-sign on every request today.
- Admin-initiated invite flow (create the auth user + approved profile
  in one step) instead of the current two-step manual process, and make
  `access_requests` approval actually provision the account.
- Swap `parseListingTextLocally()` for a real OpenAI/Claude extraction
  call (see `TODO(ai)` in `src/lib/services/listing-imports.ts`) once
  ready to spend on real NLP — keep the same `ParsedListingData` shape.
- Normalize `properties.area`/`type` to typed columns once real listing
  categories are finalized (currently free text to support imports).
- Load/perf review of RLS policies with realistic data volume, and of
  the per-property `getAssignedAgentName()`/image-gallery lookups on the
  detail page (fine at private-beta scale, not reviewed for a public
  launch's traffic).
- Decide on and enable analytics/SEO for public launch (currently
  deliberately disabled — see `src/app/robots.ts` and root layout metadata).
- Open (or semi-open) signup flow, replacing the admin-only
  `access_requests` approval loop if appropriate.
- Production monitoring/alerting for failed admin actions and audit log
  gaps.
