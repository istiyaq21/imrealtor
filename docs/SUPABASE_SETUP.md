# Supabase Setup — I'm Realtor

This app runs perfectly well with **no Supabase project connected** — every
page falls back to the mock data in `src/lib/mock-data.ts`. Follow this guide
when you're ready to connect a real backend.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Choose a strong database password and save it somewhere safe (you won't
   need it for this app directly, but you'll want it for direct `psql` access).
3. Wait for provisioning to finish.

## 2. Copy environment variables

In the Supabase dashboard: **Project Settings > API**.

Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=          # "Project URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # "anon public" key
SUPABASE_SERVICE_ROLE_KEY=         # "service_role" key — server only, never commit
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security entirely. Never
prefix it with `NEXT_PUBLIC_`, never log it, never send it to the browser.

Restart `npm run dev` after editing `.env.local` — Next.js only reads env
files at startup.

## 3. Run the SQL files, in this exact order

Open **SQL Editor** in the Supabase dashboard and run each file's contents
as a new query, in order:

1. `src/lib/db/schema.sql` — tables, enums, indexes, triggers
2. `src/lib/db/rls.sql` — Row Level Security policies and helper functions
3. `src/lib/db/storage.sql` — the `property-images` storage bucket + policies
4. `src/lib/db/seed.sql` — **optional**, sample data for local testing (see
   step 5 first — it depends on real user IDs)

## 4. Create your first admin user

`profiles.id` is a foreign key into `auth.users(id)`, so a profile can't
exist before the matching auth user does. There is **no signup page** in
this app by design — every account, including the first admin, is created
manually during the private beta.

1. **Authentication > Users > Add user** in the dashboard. Create a user
   with your email and set a real password (this is what you'll type into
   `/login` — "Send invite" alone won't give you a password to sign in
   with, since there's no email flow wired up yet).
2. Copy that user's UUID.
3. Run this in the SQL Editor, replacing the UUID:

   ```sql
   insert into public.profiles (id, full_name, email, role, status)
   values ('PASTE-USER-UUID-HERE', 'Your Name', 'you@example.com', 'admin', 'approved');
   ```

4. Repeat for any agent/owner/buyer test accounts you want, or use
   `src/lib/db/seed.sql` as a template — it documents the same UUID
   substitution step for four demo roles.

See also `docs/BACKEND_PHASES.md` and the "Testing login" section below.

## 5. (Optional) Run the seed data

`src/lib/db/seed.sql` creates a handful of approved/pending properties,
access requests, and enquiries for local testing. It requires four
placeholder UUIDs (`PLACEHOLDER_ADMIN_ID`, etc.) to be replaced with real
`auth.users` UUIDs first — see the comment block at the top of that file.

## 6. Add environment variables to Vercel

**Project Settings > Environment Variables** in Vercel — add the same four
keys from `.env.example`, scoped to the environments you need (Production /
Preview / Development). Never commit `.env.local`.

## 7. Private beta safety checklist

Before connecting a real Supabase project, double-check these are still true:

- [ ] `src/app/robots.ts` still disallows all crawling
- [ ] Root layout metadata still sets `robots: { index: false, follow: false }`
- [ ] No analytics/ads/tracking scripts have been added anywhere
- [ ] `/request-access` is the only public write path for new users — there
      is still no open public signup
- [ ] `access_requests_insert_anyone` in `rls.sql` is the *only* public
      insert-anything policy — everything else requires an approved role
- [ ] Listings only become publicly visible via `properties.status = 'approved'`,
      settable only by admin (enforced by both RLS and the
      `guard_property_approval_fields` trigger)

## 8. Auth setup (Phase 3)

Real Supabase Auth is wired in: `/login` signs in with email/password
against `auth.users`, `src/middleware.ts` refreshes the session and gates
`/admin`, `/agent`, `/owner`, `/buyer`, and layouts check the signed-in
user's `profiles.role`/`status` before rendering.

**There is still no signup page anywhere in the app.** Every account is
created the same way as the first admin user in step 4 above:

1. **Authentication > Users > Add user** — create the auth user with a
   real password.
2. Copy the UUID, then insert a matching `profiles` row with the right
   `role` and `status = 'approved'` (or leave `status = 'pending'` to test
   the pending-approval message).
3. Approving/rejecting/suspending a user going forward is normally done
   through `/admin/users` (Phase 4 will wire that page to
   `updateUserStatusForAdmin()` in `src/lib/services/profiles.ts` — for
   now it still edits local mock state, and real status changes need a
   direct SQL update or the Supabase dashboard).

### Testing login for each role

1. Create four auth users + profiles as above with roles
   `admin` / `agent` / `owner` / `buyer`, all `status = 'approved'`.
2. Visit `/login` and sign in as each one. You should land on
   `/admin`, `/agent`, `/owner`, or `/buyer` respectively.
3. Try visiting a dashboard that doesn't match the signed-in role (e.g.
   sign in as a buyer, visit `/admin`) — you should be redirected back to
   your own dashboard, not let in.
4. Create a fifth profile with `status = 'pending'` and sign in as them —
   you should land on `/access-status` with the pending-approval message
   instead of a dashboard.
5. Test `/logout` from the header or dashboard sidebar — it should sign
   you out and redirect to `/login`.

### What's still a TODO

- **Password reset / forgot password** — not implemented yet. For the
  private beta, reset a user's password manually from
  **Authentication > Users** in the Supabase dashboard.
- **Auto-creating a `profiles` row on signup** — moot for now since there's
  no signup page, but if an invite-based signup flow is added in a later
  phase, pair it with a `handle_new_user()` trigger (see
  `docs/BACKEND_PHASES.md`, Phase 4/5) rather than relying on manual inserts.

## How the app behaves without Supabase configured

- `getSupabaseConfigStatus()` (`src/lib/supabase/status.ts`) reports which
  env vars are present.
- Browser/server Supabase clients (`src/lib/supabase/client.ts`,
  `server.ts`, `admin.ts`) return `null` instead of throwing when
  unconfigured.
- Service functions in `src/lib/services/*.ts` fall back to
  `src/lib/mock-data.ts` for reads, and return
  `{ ok: false, message: "Supabase is not configured yet." }` for
  mutations.
- The frontend (Phase 1) still imports mock data directly for dashboard
  *content* (listings, enquiries, users tables) — the service layer exists
  so Phase 4 can swap those imports for real Supabase calls without
  touching component code.
- Auth (Phase 3) is the exception: `/login`, `/logout`, `/access-status`,
  and every dashboard layout are wired to real Supabase Auth already. With
  no env vars set, `/login` shows a setup message instead of a form, and
  `/admin`, `/agent`, `/owner`, `/buyer` all redirect to `/login` instead
  of rendering — see `src/middleware.ts` and `src/lib/auth/session.ts`.
