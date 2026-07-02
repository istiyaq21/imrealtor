# Soft-Live Checklist — I'm Realtor

Practical, checkbox-based. Work through top to bottom before sharing the
deployed link with real testers/brokers/agents. See `docs/DEPLOYMENT.md`
for the deploy steps themselves and `docs/SECURITY_REVIEW.md` for the
reasoning behind each safeguard.

## 1. Local checks

- [ ] `git status` clean — no uncommitted secrets, no stray `.env.local`
- [ ] `.env.example` has no real values, only placeholders
- [ ] `npm install` completes with no errors

## 2. Build checks

- [ ] `npm run lint` — zero errors
- [ ] `npm run build` — zero errors, all routes listed in the output
- [ ] `npm run check:soft-live` — passes (see `scripts/soft-live-check.mjs`)
- [ ] Build succeeds with **no** Supabase env vars set (delete/rename
      `.env.local` temporarily and rebuild, to confirm the mock fallback
      path still compiles)

## 3. Supabase checks

- [ ] Project created, URL/anon/service-role keys copied to `.env.local`
      (local) and Vercel (deployed)
- [ ] `schema.sql` → `rls.sql` → `storage.sql` run in that order, no
      errors in the SQL Editor
- [ ] `property-images` bucket exists and is **private** (not public)
- [ ] `/admin/system` shows all Supabase config checks green

## 4. Auth checks

- [ ] First admin auth user + profile created manually (no signup page
      — see `docs/SUPABASE_SETUP.md`)
- [ ] Can sign in at `/login` as that admin
- [ ] `/login` shows a clear setup message (not a crash) when Supabase
      env vars are absent
- [ ] `/logout` signs out and redirects to `/login`
- [ ] A `pending`-status profile signing in lands on `/access-status`
      with the correct message, not a dashboard

## 5. Role checks

- [ ] Seed one approved profile per role: admin, agent, owner, buyer
- [ ] Each signs in and lands on their own dashboard (`/admin`, `/agent`,
      `/owner`, `/buyer`)
- [ ] Signing in as buyer and visiting `/admin` directly redirects back
      to `/buyer`, does not let them in
- [ ] Same cross-role check for agent → `/admin`, owner → `/agent`, etc.
- [ ] Admin has no automatic access to agent/owner/buyer dashboards

## 6. Property workflow checks

- [ ] Owner submits a property → appears in `/owner` as `pending`
- [ ] Agent submits a property → appears in `/agent/listings` as `pending`
- [ ] Admin approves a pending listing in `/admin/listings` → status
      flips to `approved`
- [ ] Approved listing appears on `/properties` and its own
      `/properties/[id]` page
- [ ] Admin rejects a listing with a reason → status flips to `rejected`
- [ ] Admin can feature/unfeature an approved listing → shows on `/` if
      featured
- [ ] Owner/agent cannot approve their own submission (try it — the
      dashboards don't even expose the control, and the DB will reject it
      if attempted directly)

## 7. Enquiry checks

- [ ] Guest (signed out) can submit an enquiry on an approved property
- [ ] Enquiry against a non-approved property is rejected
- [ ] Enquiry appears in `/admin/enquiries`
- [ ] Admin can mark it contacted / closed / spam
- [ ] Assigned agent can update status only for enquiries assigned to
      them (not others')
- [ ] Buyer can save/unsave an approved property from its detail page,
      and it shows up on `/buyer`

## 8. AI importer checks

- [ ] `/admin/imports` loads for admin only
- [ ] Pasting sample WhatsApp-style text and clicking "Parse Listing"
      extracts at least city/price/type in most cases (best-effort, not
      required to be perfect)
- [ ] Parsed fields are editable before saving
- [ ] "Save as Pending Property" creates a `pending` listing (never
      auto-approved)
- [ ] Confirm **no external network call** happens during parsing (check
      browser/server network logs — parsing must stay local-only per
      `docs/SECURITY_REVIEW.md` §9)

## 9. Mobile checks

- [ ] `/`, `/properties`, `/properties/[id]`, `/login`, `/request-access`
      all render cleanly on a real phone or narrow viewport
- [ ] Dashboard sidebars collapse/scroll sensibly on mobile
- [ ] Forms (enquiry, property submission, request access) are usable
      with a mobile keyboard, no layout breakage
- [ ] Private beta banner doesn't crowd out the header on small screens

## 10. Security checks

- [ ] No `SUPABASE_SERVICE_ROLE_KEY` in any client bundle (check
      `docs/SECURITY_REVIEW.md` §4 — already grepped clean, spot-check
      again after any new code)
- [ ] No raw Supabase/Postgres error text shown in any form's error state
- [ ] `robots.txt` disallows all (`curl https://your-domain/robots.txt`)
- [ ] `noindex, nofollow` meta tag present on page source
- [ ] No signup route reachable at any URL
- [ ] No analytics/tracking script in page source (view-source, search
      for `gtag`, `fbclid`, `pixel`)

## 11. Deployment checks

- [ ] Vercel project connected to the correct GitHub branch
- [ ] All 4 env vars set in Vercel (Production, and Preview if used)
- [ ] Production deployment succeeds
- [ ] Smoke test checklist in `docs/DEPLOYMENT.md` §9 passes on the
      deployed URL, not just localhost

## 12. Old domain checks

- [ ] Domain added in Vercel > Domains
- [ ] DNS records updated at the registrar
- [ ] DNS propagated (Vercel shows "Valid Configuration")
- [ ] HTTPS certificate issued, no browser warning
- [ ] `NEXT_PUBLIC_APP_URL` updated to match the final domain

## 13. Go/no-go decision

Go **only if**:
- [ ] Sections 1–12 above are all checked
- [ ] At least one full role-by-role walkthrough (§5–7) was done on the
      **deployed** URL, not just localhost
- [ ] Whoever is admin knows how to: approve a listing, approve/suspend a
      user, and manually create a new account from an access request
      (see `docs/SUPABASE_SETUP.md`)
- [ ] You are comfortable this is still **private beta** — controlled
      access, admin-reviewed listings, no public signup, no SEO/analytics

If any box above is unchecked, **do not** share the link with real
testers yet — fix it first.
