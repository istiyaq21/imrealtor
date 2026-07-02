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

## Phase 3 — Auth + Role Access

- Real Supabase Auth: email/password or magic link sign-in, replacing the
  `/login` demo buttons with actual sessions.
- Middleware to refresh the auth session cookie on every request.
- A `handle_new_user()` trigger on `auth.users` insert to auto-create the
  matching `profiles` row (or an admin-invite flow, since the private beta
  has no open signup).
- Wire `getCurrentProfile()` into dashboard layouts to redirect
  unauthenticated/unapproved users away from role dashboards.
- Replace demo-only redirects in `getRoleRedirectPath()` call sites with
  real post-login redirects based on the signed-in user's actual role.

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
