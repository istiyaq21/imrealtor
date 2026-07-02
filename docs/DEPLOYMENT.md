# Deployment Guide — I'm Realtor (Soft-Live / Private Beta)

This covers deploying to Vercel for **private beta / real-device testing
and selected broker/agent preview only** — not a public launch. Keep the
private-beta safeguards in `docs/SECURITY_REVIEW.md` intact throughout.

## 1. Connect the GitHub repo to Vercel

1. Push this repo to GitHub if it isn't already.
2. In Vercel: **Add New > Project**, import the GitHub repo.
3. Framework preset should auto-detect as Next.js. Leave build/output
   settings at their defaults (`npm run build`, `.next`).

## 2. Vercel project setup

- Root directory: repo root (unless you've nested the app elsewhere).
- Node version: whatever this repo's `package.json`/Vercel defaults
  resolve to — no special override needed.
- Do **not** enable Vercel Analytics, Speed Insights, or any tracking
  add-on for this project while it's in private beta (see
  `docs/SECURITY_REVIEW.md` §12 — no analytics is intentional).

## 3. Environment variables

In **Project Settings > Environment Variables**, add (scope to
Production and Preview as needed):

| Key | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL | safe to expose to the browser |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key | safe to expose — RLS gates what it can do |
| `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service role key | **server only** — bypasses RLS, never prefix with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_APP_URL` | your deployed URL (e.g. `https://your-old-domain.com`) | used for building absolute links |

The app **builds and runs without these set** (falls back to mock data,
auth pages show a setup message) — but obviously you want them set for a
real deployment. Never commit any of these to git; `.env.local` is
gitignored (see `.env.example` for the template).

## 4. Supabase SQL, in this exact order

Run each file's contents in the Supabase SQL Editor:

1. `src/lib/db/schema.sql` — tables, enums, indexes, triggers
2. `src/lib/db/rls.sql` — RLS policies and helper functions
3. `src/lib/db/storage.sql` — the `property-images` **private** bucket + policies
4. `src/lib/db/seed.sql` — **optional**, sample data (needs real
   `auth.users` UUIDs substituted first — see the file's own comments)

Full walkthrough: `docs/SUPABASE_SETUP.md`.

## 5. First admin setup

`profiles.id` is a foreign key into `auth.users(id)` — there is no
signup page, so:

1. Supabase Dashboard > **Authentication > Users > Add user** — set a
   real password (this is what you'll type into `/login`).
2. Copy that user's UUID.
3. SQL Editor:
   ```sql
   insert into public.profiles (id, full_name, email, role, status)
   values ('PASTE-USER-UUID-HERE', 'Your Name', 'you@example.com', 'admin', 'approved');
   ```
4. Confirm via `/admin/system` (System Check page) once deployed — it
   shows config status without ever displaying secret values.

## 6. Old domain setup

1. Vercel: **Project Settings > Domains > Add**, enter your old domain.
2. Follow Vercel's DNS instructions — typically an `A`/`CNAME` record at
   your DNS provider pointing at Vercel.
3. Wait for DNS propagation (can take minutes to a few hours).
4. Vercel issues an HTTPS certificate automatically once DNS resolves
   correctly — verify the domain shows "Valid Configuration" in the
   Vercel dashboard and that `https://` loads without a certificate
   warning.
5. Update `NEXT_PUBLIC_APP_URL` to match the final domain if it changed.

## 7. Soft-live launch mode — confirm before going live

- [ ] `robots: { index: false, follow: false }` still present in
      `src/app/layout.tsx`
- [ ] `src/app/robots.ts` still disallows all crawling
- [ ] No `sitemap.ts`/`sitemap.xml` exists
- [ ] No analytics/ads/tracking script anywhere (grep the codebase for
      `gtag`, `googletagmanager`, `fbq`, `analytics`, `pixel` — should be
      zero real hits, only prose mentions in `/privacy`)
- [ ] No signup route exists
- [ ] `/request-access` is the only public write path for new users

If any of these are missing, fix them **before** pointing the old domain
at this deployment — see `docs/SECURITY_REVIEW.md` for why each matters.

## 8. Rollback plan

- **Revert a bad deployment**: Vercel dashboard > Deployments > find the
  last known-good deployment > **Promote to Production** (instant,
  no rebuild needed).
- **Disable the domain**: Vercel > Project Settings > Domains > remove
  or unassign the old domain from this project if you need to pull the
  app offline without deleting the Vercel project itself.
- **Rotate Supabase keys if exposed**: Supabase Dashboard > Project
  Settings > API > regenerate the anon key and/or service role key
  immediately, then update the Vercel environment variables and
  redeploy. Treat any accidental commit of `SUPABASE_SERVICE_ROLE_KEY`
  as a full rotation event, not just a git history cleanup — assume it
  was seen.

## 9. Smoke test checklist

After every deploy, before sharing the link with testers:

- [ ] `/` renders, shows the private beta banner
- [ ] `/properties` renders (approved listings or empty state)
- [ ] `/login` renders (real form if Supabase configured, setup message
      if not)
- [ ] `/request-access` renders and submits successfully
- [ ] `/admin` redirects to `/login` when signed out; loads for an
      approved admin
- [ ] `/admin/system` shows all-green Supabase config checks
- [ ] `curl -s https://your-domain/robots.txt` returns `Disallow: /`
- [ ] View source on `/` — confirm the `noindex, nofollow` meta tag is
      present
- [ ] Sign in as each seeded role (admin/agent/owner/buyer) and confirm
      each lands on their own dashboard, not someone else's

See `docs/SOFT_LIVE_CHECKLIST.md` for the full pre-launch checklist.
