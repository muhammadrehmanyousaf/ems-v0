# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`ems-v0` is the **Next.js 14 App Router frontend** of Wedding Wala (weddingwala.pk) — Pakistan's wedding & event marketplace. It serves three audiences from one codebase: the public/customer site, the vendor portal, and the super-admin console.

Read [../CLAUDE.md](../CLAUDE.md) first — it covers the workspace layout, the Express/Sequelize backend (`../event-planner-api`), the shared API response envelope, auth/RBAC, and cross-cutting money/date conventions. This file covers only what is specific to the frontend.

## Commands

```bash
npm run dev                  # next dev — port 3000 collides with the backend; use `next dev -p 3001`
npm run build                # runs `prebuild` (typecheck ratchet) first, then next build
npm run lint
```

### Typecheck ratchet (the real build gate)

`next.config.mjs` sets `eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors` to **true**, so `next build` alone ignores type errors. The gate is `prebuild`:

```bash
npm run typecheck            # tsc via tsconfig.ratchet.json — full error listing
npm run typecheck:ratchet    # gate: fails only on NEW errors. Runs automatically as prebuild.
npm run typecheck:baseline   # re-record typecheck-baseline.json after fixing errors
```

The baseline keys errors by `file|TScode`, never by line number. Adding an error to a clean file — or exceeding a file's recorded budget — stops the build. Do not flip `ignoreBuildErrors` to `false` until the baseline reaches 0; that would block every deploy.

### Tests — three harnesses, all pointed at production

**There is no local server and no test database.** `next dev` needs the production API, and the standing instruction on this project is not to run the backend. Every harness therefore runs against a *deployed* origin, in practice `https://www.weddingwala.pk` — the live system taking real bookings and real money. Read [cypress/README.md](cypress/README.md) before running anything.

```bash
# Cypress — per-module depth. baseUrl = E2E_BASE_URL (default https://www.weddingwala.pk)
npm run cy:open              # interactive
npm run cy:smoke             # cypress/e2e/00-harness/**
npm run cy:modules           # cypress/e2e/10-modules/**
npm run cy:regression        # cypress/e2e/02-regression/** — pins defects already fixed on prod
npx cypress run --e2e --spec "cypress/e2e/10-modules/bookings.cy.ts"   # one spec
npm run cy:generate          # regenerate module inventory + spec skeletons

# Playwright — auth-setup + render smoke. E2E_BASE_URL required for anything but public.
npm run test:e2e
npm run test:e2e:public      # no-auth marketing render smoke
npx playwright test e2e/vendor.crud.spec.ts --project=vendor   # one spec
npm run test:e2e:report
```

Safety rails that exist because the target is production — do not remove them:

- Cypress write blocks use `describeMutating()` in `cypress/support/safety.ts` and **skip** unless `CYPRESS_ALLOW_MUTATION=1`. A skipped block reports as *pending*, so "did not run" can't be mistaken for "passed".
- `refuseMoneyWrites()` throws on POST to payments/refunds/payouts/invoices. Not gated — never written.
- Every mutating spec deletes what it created in an `after` hook, and asserts the deletion.
- Credentials live in `cypress.env.json` (gitignored) and Playwright's `e2e/.auth/credentials.json`. These are real logins, not seeded rows.

`scripts/qa-*.mjs` is a third layer: standalone Node probes that hit the live API directly with per-role tokens (`qa-deep.mjs`, `qa-superadmin.mjs`, `qa-money-catalog.mjs`, …). Run with `node scripts/<name>.mjs`. `qa-discover.mjs` regenerates the QA docs below.

### QA documentation (generated — do not hand-edit the inventories)

| File | What it is |
|---|---|
| [QA_TRACKER.md](QA_TRACKER.md) | The full testable surface, screen by screen, element by element. Check boxes in place. |
| [QA_API_MATRIX.md](QA_API_MATRIX.md) | Every mounted endpoint × every role's token, with the asserted response. Exists because *a control hidden in the UI while its endpoint still answers is a Critical finding* — hiding a button is not a permission boundary. |
| [QA_BUGS.md](QA_BUGS.md) · [QA_FLOWS.md](QA_FLOWS.md) · [QA_RESEARCH.md](QA_RESEARCH.md) · [QA_RECOMMENDATIONS.md](QA_RECOMMENDATIONS.md) | Findings, flow walkthroughs, research, and the recommendation backlog. |

A checked box means: clicked it, submitted it, **reloaded**, re-read the value. A render check is never `[x]`. Responsive coverage is 1366×657 (the 15" laptop most PK vendors use) **and** 360×720.

## Architecture

### Route groups

```
app/
  (auth)/        login · register · business-registration · forgot/reset-password · onboarding — no chrome
  (main)/        public site + the customer surface
  (dashboard)/   vendor portal + super-admin console (~90 routes under /dashboard)
  api/           Next route handlers (thin — the Express API is the real backend)
```

**The customer surface has its own authoritative map: [docs/CUSTOMER-SURFACE.md](docs/CUSTOMER-SURFACE.md)** — every couple-facing screen, the logic it runs, and the exact endpoint it calls, with each endpoint's status verified against live production. Read it before touching anything under `(main)/user/`, the booking flow, or the mobile customer app. It also lists the ten traps that cost real debugging time (e.g. `GET /bookings/:id` does not exist).

`(main)` is far larger than it looks. Three distinct kinds of route live there:

1. **`(vendorListings)/`** — one directory per vendor category (`wedding-venues`, `caterers`, `bridal-makeup-artists`, `dhol-players`, …) each with a `[id]` detail page. Adding a category means adding a route pair here **and** wiring `lib/vendor-type-config.ts` / `lib/vendor-types.ts`.
2. **`user/`** — the whole authenticated *customer* app: `bookings/[id]`, `bookings/[id]/pay`, `plan` + `plan/[id]/checkout` + `plan/[id]/pay` (Shaadi Plan multi-event cart), `umbrellas/[id]`, `quotes`, `conversations`, `reviews`, `complaints`, `payments`, `favorites`, `notifications`, `activity`, `profile`, `settings`. This is the surface the mobile customer app (`../weddingwala-app`) mirrors.
3. **~70 SEO content routes** — long-tail guides and cost pages (`wedding-cost-in-lahore`, `nikah-process-in-pakistan`, `how-to-choose-a-wedding-photographer-in-pakistan`, …). Content-only; they are an SEO asset, not app surface.

`(booking)/[id]/booking` is the public booking flow. `/sign/<token>`, `/review/<token>`, `/wedding/<token>` are tokenised share links.

### URL conventions are LOCKED

Read [../docs/seo/03-url-conventions-LOCKED.md](../docs/seo/03-url-conventions-LOCKED.md) before adding any public route. Apex domain · no trailing slash (`next.config.mjs`) · lowercase only (301 in `middleware.ts`) · hyphens only · plural hubs / singular resources · vendors at `/{type}/{city}/{slug}-{shortid}`.

**`middleware.ts` gotcha you must not regress:** the lowercase 301 is skipped for `CASE_SENSITIVE_PATHS` = `/(sign|review|wedding)/<token>`. Those tokens are 43-char base64url — lowercasing them mangles every uppercase character. When that rule applied to them, no customer could ever open a contract, and resending produced another link that died identically. Anything added to that list must be a non-indexable, token-bearing route.

`middleware.ts` also holds the auth gate, reading the `user_id` + `auth_token` cookies. Protected prefixes: `/user/*`, `/dashboard`. Authenticated users hitting `/login` or `/register` are bounced to `/dashboard`.

### Data layer

- **HTTP** — the shared axios instance in [lib/axiosConfig.js](lib/axiosConfig.js). Adds `Authorization: Bearer <token>`, and force-logs-out on `status: 401` **or** `message === "Please get your account activated"`. Token is read from `localStorage` first, then the cookie.
- **Base URL** — [lib/backend-url.ts](lib/backend-url.ts) reads `NEXT_PUBLIC_BACKEND_URL` (fallback `http://localhost:3000/`). The **trailing slash is required** — callers concatenate as `${BACKEND_URL}api/v1/...`.
- **API modules** — [lib/api/](lib/api/), one file per domain (~55 of them: `bookings`, `payments`, `quotes`, `weddingPlans`, `disputes`, `functionSheets`, `venueOs`, `staffPortal`, …). Add endpoints here, not inline in components.
- **Server state** — TanStack Query, wrapped by `QueryProvider` in [lib/providers/query-provider.tsx](lib/providers/query-provider.tsx).
- **Client state** — Zustand in [lib/store/](lib/store/) (`active-business-store`, `vendor-store`, `ui-store`, `theme-prefs`) + React contexts in [context/](context/) (`UserContext`, `BusinessContext`, `NotificationContext`, `ChatContext`, `FavoritesContext`).
- **Forms** — `react-hook-form` + zod schemas in [lib/formSchema/](lib/formSchema/). Draft persistence via [lib/draftStorage/](lib/draftStorage/) + `lib/hooks/useDraftSync.ts` + `useBeforeUnloadGuard.ts` (create-mode only).
- **Realtime** — `socket.io-client` from `ChatContext` / `NotificationContext`, consuming the backend's `chat:*` and `notification:*` events.

Provider order in [app/layout.tsx](app/layout.tsx): `QueryProvider > UserProvider > NotificationProvider > ChatProvider`. Notification and Chat need the user loaded, so keep them inside `UserProvider`.

### Design system — the Bridal palette

Tailwind + shadcn/ui (Radix). The revamp palette lives under `theme.extend.colors.bridal` in [tailwind.config.ts](tailwind.config.ts) and is the source of truth the mobile app ports from:

```
ivory #FDF8F2 · cream #FFF9F4 · blush #FFF0F3 · rose #F2B5C0
gold #C9956A (primary) · gold-dark #916539 · mauve #8B5A72 · sage #A8C4A2
coral #E8917A · charcoal #2C1810 · beige #EDD9C3 · sand #F5E6D3
text #5C3D2E · text-soft #7A5040 · text-label #955E39
```

Type: Playfair Display (display) · DM Sans (body) · Inter (dense UI/numbers) · Noto Nastaliq Urdu (Urdu). The `purple.*` and legacy `gold.50–950` scales in the config predate the revamp — **do not use purple in new work**; the bridal aesthetic has zero purple. Urdu strings go through [lib/i18n/](lib/i18n/) (`dictionary.ts` + `useT.tsx`); `/ur` is the Urdu route tree.

### Vendor configuration cluster

Adding or changing a vendor type usually means touching all of these together: [lib/vendor-type-config.ts](lib/vendor-type-config.ts), [lib/vendor-types.ts](lib/vendor-types.ts), [lib/vendor-steps-data.tsx](lib/vendor-steps-data.tsx), [components/VendorStepForms/](components/VendorStepForms/), plus the matching `(vendorListings)` route pair. Vendor types are a Postgres enum on `User.vendorType` — new values need a backend migration, and the string must match the enum exactly.

## Conventions and traps

- **Live production.** Every change ships to a system with real vendors and real money. Additive, backward-compatible, zero-downtime. Migrations run on prod *before* the frontend that depends on them.
- **Feature flags.** The `FEAT_*` gates remaining in `lib/` (`FEAT_PK_PAYMENTS`, `FEAT_PHONE_OTP`, `FEAT_CASH_BOOKING`, `FEAT_WEDDING_PLAN`, `FEAT_QUOTE_NEGOTIATION`, `FEAT_OFFLINE_OUTBOX`, `FEAT_PRIMITIVE_ROUTING`) are the survivors of a deliberate sweep — a portal full of flags defaulting OFF is why it "felt empty". Do not add new ones; ship the feature on.
- **A flag's frontend state is not what's live.** `FeatureFlagOverrides` in the DB is not authoritative for prod behaviour. Probe the route: 200 = feature absent/open, 401 = present and gated.
- **Money is already `NUMERIC`** in Postgres. Do not write a money-type migration. Stripe amounts are integer minor units; convert at the API boundary, not deep in components.
- **Dialogs have no max-height.** The shared shadcn `DialogContent` sets no `max-h`, so a tall dialog's actions become unreachable on a 360px viewport. Any new dialog needs its own height cap + internal scroll, and must be checked at 360px.
- **Images.** `next/image` refuses hosts not listed in `next.config.mjs` `images.remotePatterns`. Vendor media is on Cloudinary (`res.cloudinary.com`) so it survives Railway redeploys — an unlisted host renders every vendor image broken.
- **`README-*.md` at the repo root** (PAYMENT-SYSTEM, DUPLICATE-PAYMENT-FIX, VendorSystem, OPTIMIZATION, …) plus `database-schema.sql` and `backend-payment-endpoints*.js` are historical design notes, some MySQL-flavoured, describing code that may never have merged. The Sequelize migrations in `../event-planner-api/src/migrations/` are the schema's only source of truth. Verify against current source before trusting any snippet from them.
