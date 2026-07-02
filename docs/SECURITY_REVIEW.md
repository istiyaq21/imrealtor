# Security Review — I'm Realtor (Private Beta)

This document summarizes the current security model as of Phase 5. It is
written for whoever operates or audits this app before/during the private
beta — not a marketing document, and not exhaustive proof of security,
just an honest map of what's enforced, where, and what still needs review
before a real public launch.

## 1. Auth model

- Real Supabase Auth (email/password only — no magic link, no OAuth, no
  password reset UI yet).
- **No signup page exists anywhere in the app.** Every account —
  including the first admin — is created manually: an auth user via the
  Supabase dashboard, then a matching `profiles` row via SQL. See
  `docs/SUPABASE_SETUP.md`.
- `src/proxy.ts` (the renamed `middleware.ts` — see `docs/BACKEND_PHASES.md`
  Phase 3) refreshes the session cookie on every request and does a cheap
  "is there a session at all" check for `/admin`, `/agent`, `/owner`,
  `/buyer`. It deliberately does not check role/status — see next section.
- `src/lib/auth/session.ts`'s `getCurrentUser()` always calls
  `supabase.auth.getUser()`, never `getSession()`, since only `getUser()`
  revalidates the token against the Supabase Auth server rather than
  trusting a possibly-stale cookie.

## 2. Role model

- Five roles: `admin`, `agent`, `owner`, `buyer`, `support`. `support` is
  scaffolded in the type system and database enum but has no dashboard.
- Four approval statuses: `pending`, `approved`, `rejected`, `suspended`.
  Only `approved` grants dashboard access.
- Every dashboard layout (`src/app/admin/layout.tsx`, `agent/layout.tsx`,
  `owner/layout.tsx`, `buyer/layout.tsx`) calls
  `requireApprovedRole([...])` — the **only** place role/approval is
  actually checked. An approved user with the wrong role is redirected to
  their own dashboard, not shown an error page.
- **Admin has no automatic override** into the agent/owner/buyer
  dashboards. This is a deliberate choice, not an oversight — if a future
  admin-override is needed, it must be added explicitly with a comment
  explaining why, not by loosening `requireApprovedRole`.
- Role/status changes cannot be made by the affected user themselves —
  enforced twice: once by RLS policy `profiles_update_own_or_admin`
  (which allows a self-update but not to `role`/`status`), and once by
  the `guard_profile_role_status_change` trigger in `rls.sql`, which
  raises an exception if a non-admin, authenticated session tries to
  change either column.

## 3. RLS overview

Every table has Row Level Security enabled (`src/lib/db/rls.sql`). Key
policies, grouped by intent:

- **Public read**: `properties` where `status = 'approved'`;
  `property_images` for an approved property's images.
- **Public insert (the private beta's one open door)**:
  `access_requests` (anyone can request access — this is *not* signup,
  just a request row admin must act on) and `enquiries` (guest enquiries,
  restricted to approved properties only, with `status`/`assigned_agent_id`
  forced to safe defaults via `with check`).
- **Self/admin read**: `profiles` (own row or admin).
- **Owner/agent scoped**: `properties` insert/update restricted to the
  submitter's own rows, always forced into `draft`/`pending` status —
  owners and agents **cannot** set `status = 'approved'`, `featured`,
  `approved_by`, or `approved_at` on their own submissions. This is
  enforced twice: by the insert/update policies' `with check` clauses,
  and independently by the `guard_property_approval_fields` trigger.
- **Buyer scoped**: `saved_properties` limited to the buyer's own
  `buyer_id`; `enquiries` select limited to the buyer's own rows.
- **Agent scoped**: `enquiries` update limited to the agent's own
  `assigned_agent_id` rows.
- **Admin-all**: `audit_logs`, `agent_assignments`, `listing_imports`
  have blanket admin policies; every other table has admin covered via
  `is_admin()`-gated policies alongside the scoped ones above.
- Helper functions `current_user_role()`, `current_user_status()`,
  `is_admin()`, `is_approved_agent()`, `is_approved_owner()`,
  `is_approved_buyer()` are all `SECURITY DEFINER`, reading only
  `auth.uid()`'s own row — never a caller-supplied id — so they can't be
  used to probe other users' data.
- `TODO(security-review)` comments already exist inline in `rls.sql` for
  the two spots this document flags again in §11.

## 4. Admin-only / service-role usage

- `src/lib/supabase/admin.ts` throws immediately if executed in a browser
  context (`typeof window !== "undefined"`), as a runtime backstop.
- Confirmed (Phase 4 and re-confirmed in Phase 5's audit) that no
  `"use client"` file anywhere imports `@/lib/supabase/admin` or
  `@/lib/supabase/server` — grepped, zero matches.
- The service-role client is used only for: role/status changes on
  `profiles` (bypassing the trigger that blocks a normal session),
  property approve/reject/feature/agent-assignment, enquiry status
  updates from admin, audit log writes, and admin's storage delete.
  Every one of those call sites is a Server Action gated by
  `requireApprovedRole(["admin"])` before the service function runs.
- Admin **reads** (listings, users, enquiries tables) deliberately go
  through the request-scoped client (respecting RLS's admin policies)
  rather than the service-role client — a second, independent guard: even
  if a call site's `requireApprovedRole` check were ever removed by
  mistake, RLS would still block a non-admin session from reading
  everything.
- One documented exception: `getAssignedAgentName()` in
  `services/properties.ts` uses the service-role client for a narrow,
  single-column, read-only lookup (an agent's name) to display on a
  *public* approved listing, since there's no public RLS policy for
  reading `profiles`/`agent_assignments` otherwise. This was a deliberate
  choice over loosening `profiles` RLS — see the comment at that call site.

## 5. Public access rules

- Anonymous visitors can: browse approved properties, view an approved
  property's detail page, submit a guest enquiry against an approved
  property, and submit a `/request-access` request.
- Anonymous visitors cannot: see pending/rejected/draft/archived
  properties, see any profile data, save properties (requires an
  approved buyer session), or self-register an account.

## 6. Property approval workflow

`draft` / `pending` → admin approves → `approved` (or admin rejects →
`rejected`, with an optional `rejected_reason`). Only `approved` is
publicly visible. `featured` is admin-only, independent of approval
status. Every approve/reject/feature/agent-assignment action is written
to `audit_logs` (best-effort — a failed audit write never blocks the
underlying action, see `src/lib/services/audit.ts`).

## 7. Enquiry rules

Guest or buyer enquiries are only accepted against `status = 'approved'`
properties (checked in `services/enquiries.ts` before insert, in addition
to the RLS policy that would reject it anyway — the app-level check exists
purely to return a friendlier error than a raw RLS denial would). Agents
can only update the status of enquiries assigned to them
(`updateEnquiryStatusForAgent` uses the request-scoped client specifically
so RLS enforces this, not application logic). Admin can update any
enquiry's status, including `spam`.

## 8. Storage rules

`property-images` is a **private** bucket (`src/lib/db/storage.sql`) —
deliberately not marked public, since a public bucket in Supabase skips
RLS entirely for reads. Upload is restricted by RLS to the property's own
owner/agent (while unapproved) or admin. Reads go through a short-lived
signed URL (`getPropertyImagePublicOrSignedUrl()`), gated by the same RLS
that restricts public reads to approved properties' images. See
`TODO(storage)` comments in `services/storage.ts` for the still-open
signed-URL-vs-image-proxy decision before real launch traffic.

## 9. AI importer safety

`src/lib/services/listing-imports.ts`'s `parseListingTextLocally()` is a
**local regex/keyword parser only** — it makes zero external network
calls, zero AI API calls. Saving a parsed import always creates a
`pending` property via the exact same `createPendingProperty()` path as
any other submission (owner, agent, or importer) — an AI-imported listing
gets no shortcut around admin review. `docs/BACKEND_PHASES.md` documents
swapping this for a real LLM extraction call as a Phase 5 follow-up
(`TODO(ai)` in that file); when that happens, treat the raw pasted text as
untrusted input to whatever provider is called, same as any other
user-submitted text.

## 10. Private beta limitations (by design, not bugs)

- No signup page. No open registration. No password reset UI.
- `access_requests` approval only flips a status flag — it does **not**
  create the matching `auth.users`/`profiles` rows. Admin must do that
  manually today (see `docs/SUPABASE_SETUP.md` and the note on
  `/admin`'s Pending Access Requests section). Automating this is
  explicitly deferred — see §11.
- `PropertySubmissionForm` now has a real optional file input (Phase 5),
  but there's no image management UI (reorder, delete, replace) yet —
  images are attach-only after submission.
- No rate limiting on `/request-access` or the guest enquiry form beyond
  what Supabase/Vercel provide by default.

## 11. Pre-public-launch security TODOs

- Column-level restrictions on `profiles.role`/`status` and the agent's
  `enquiries` update currently rely on a trigger + RLS row-scoping, not
  Postgres column-level `GRANT`/`REVOKE`. Flagged inline in `rls.sql` as
  `TODO(security-review)` — add column grants for defense in depth before
  a wider launch.
- Decide and implement an admin-initiated invite flow (create the auth
  user + approved profile in one step, or have `access_requests` approval
  actually provision the account) instead of the current two-step manual
  process.
- Load/perf review of RLS policies and the per-property
  `getAssignedAgentName()`/image-gallery lookups at real traffic volume.
- Finalize the signed-URL vs. image-proxy decision in `services/storage.ts`.
- Add rate limiting / abuse protection to the two public write paths
  (`/request-access`, guest enquiries) before any wider exposure.
- Swap the local listing-import parser for a real AI extraction call
  (`TODO(ai)`), and treat that as a new untrusted-input surface requiring
  its own review at that time.

## 12. Things NOT enabled (intentionally)

- **Public signup** — no signup route exists.
- **Analytics / tracking** — no Google Analytics, Meta Pixel, or any
  tracking script anywhere in the codebase (grepped as part of Phase 5's
  audit — zero matches).
- **Sitemap** — no `sitemap.ts`/`sitemap.xml` exists.
- **SEO push** — root layout metadata sets
  `robots: { index: false, follow: false }`, and `src/app/robots.ts`
  serves a `robots.txt` disallowing all crawling. Do not remove either
  until public launch is an intentional decision, not an accident.
