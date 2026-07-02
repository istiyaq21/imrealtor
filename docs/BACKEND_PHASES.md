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
- `src/middleware.ts` refreshes the session cookie on every request and
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

## Phase 4 — Real Property Workflow

- Swap the Phase 1 dashboard pages (`/admin/listings`, `/owner/submit-property`,
  `/agent/listings`, etc.) from `src/lib/mock-data.ts` to the service layer
  in `src/lib/services/*.ts`.
- Real image upload to the `property-images` storage bucket, replacing the
  placeholder upload UI in `PropertySubmissionForm`.
- Join `property_images` and `agent_assignments` into property reads
  instead of the placeholders currently in `mapRowToProperty()`.
- Normalize `properties.area` and `properties.type` (currently free text)
  once real listing categories are finalized — see TODOs in
  `src/lib/services/properties.ts`.
- Audit logging for approvals/rejections via `audit_logs`.
- First pass at the AI WhatsApp listing importer using `listing_imports`.
- Wire `/admin/users` approve/suspend actions to
  `updateUserStatusForAdmin()` instead of local mock state, so admin can
  actually change who can log in.
- Consider an admin-initiated invite flow (admin creates the auth user +
  approved profile in one step) instead of the two-step manual process
  from Phase 3.

## Phase 5 — Launch Hardening

- Security review of every `TODO(security-review)` comment in `rls.sql`
  (column-level restrictions on `profiles.role`/`status` and
  `enquiries` agent updates currently rely on trigger + convention, not
  column-level grants).
- Load/perf review of RLS policies with realistic data volume.
- Decide on and enable analytics/SEO for public launch (currently
  deliberately disabled — see `src/app/robots.ts` and root layout metadata).
- Open (or semi-open) signup flow, replacing the admin-only
  `access_requests` approval loop if appropriate.
- Production monitoring/alerting for failed admin actions and audit log
  gaps.
