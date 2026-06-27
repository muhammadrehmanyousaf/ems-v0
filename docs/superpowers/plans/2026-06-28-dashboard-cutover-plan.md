# Dashboard Redesign — Live Cutover Plan

**Status:** ready to execute on command · **Owner:** vendor/admin dashboard
**Branch:** `feat/dashboard-redesign` (unpushed) · **Date:** 2026-06-28

Wedding Wala is **live production**. Every step here is **additive, flag-gated,
backward-compatible, and instantly reversible** ([[feedback_live_system_safety]]).
Nothing below deletes or rewrites an original screen until the redesign has baked.

---

## 1. What we're cutting over

45 redesigned surfaces (35 read-only screens + 10 interactive editors), all built
and verified, currently mounted at **parallel `*-new` routes** (e.g.
`/dashboard/bookings-new`) next to the untouched originals (`/dashboard/bookings`).
The theme engine, primitives, ⌘K, and bulk export are already live and shared.

Cutover = make the **canonical** routes render the redesigned views, **without
changing URLs**, behind a flag, so we can ramp and roll back at will.

---

## 2. Mechanism — per-route component swap behind a flag

A canonical route today looks like:

```tsx
// app/(dashboard)/dashboard/bookings/page.tsx  (BEFORE)
export default function BookingsPage({ searchParams }) {
  searchParamsCache.parse(searchParams)
  return <BookingListingView />
}
```

Cutover wraps the view choice in the flag (`lib/dashboard-redesign-flag.ts`,
already added, **OFF by default**):

```tsx
// app/(dashboard)/dashboard/bookings/page.tsx  (AFTER — additive, reversible)
import { isRedesignOn } from "@/lib/dashboard-redesign-flag"
import { BookingsRedesignedView } from "@/components/.../bookings/redesigned/bookings-redesigned-view"

export default function BookingsPage({ searchParams }) {
  searchParamsCache.parse(searchParams)
  if (isRedesignOn(/* businessId if available server-side */)) return <BookingsRedesignedView />
  return <BookingListingView />
}
```

- **URLs never change** → no broken links, bookmarks, deep links, or SEO surprises.
- The original component stays imported and one boolean away → **instant rollback**.
- The `*-new` routes stay live throughout (used by ⌘K and for side-by-side QA);
  they're removed only in the final cleanup phase.

### Flag surface (env-driven, no deploy needed to flip on most hosts)
- `NEXT_PUBLIC_DASHBOARD_REDESIGN=true` — global on (default off).
- `NEXT_PUBLIC_DASHBOARD_REDESIGN_OFF=true` — hard global kill-switch (wins over all).
- `NEXT_PUBLIC_DASHBOARD_REDESIGN_BUSINESSES="3406,…"` — business-id allowlist for canary.

> `NEXT_PUBLIC_*` is build-time inlined by Next. On Vercel/Railway, changing the
> var triggers a rebuild/redeploy. If we want **runtime** flips (no rebuild),
> Phase 0 includes promoting the flag to a server-read (cookie/header or a
> `/api/v1/flags` value) — see §6.

---

## 3. Rollout phases (each gated on the previous)

**Phase 0 — Scaffold (no user impact).**
- Land `lib/dashboard-redesign-flag.ts` (done) + wire it into all 45 canonical
  routes (swap pattern above). Flag OFF → production renders originals, byte-for-byte.
- (Optional) promote the flag to a runtime server-read so later phases don't need redeploys.
- Gate: prod diff is zero with flag off; `tsc` clean; the 45 `*-new` routes still work.

**Phase 1 — Internal canary.**
- Add the team's own businesses to `…_BUSINESSES`. Dogfood every screen + editor on real data.
- Gate: the runtime QA sweep (mobile overflow, theme, crashes) passes on prod;
  no error-rate or latency regression on the dashboard; editors save correctly.

**Phase 2 — Ramp (5% → 25% → 50%).**
- Expand the cohort allowlist (or a %-hash on businessId). Watch dashboards.
- Gate at each step: support tickets flat, no spike in dashboard JS errors,
  function-sheet / settings saves succeed, bulk export works.

**Phase 3 — Default on.**
- `NEXT_PUBLIC_DASHBOARD_REDESIGN=true`. Originals remain one flag away.
- Bake ≥ 2 weeks. Keep `…_OFF` as the documented instant rollback.

**Phase 4 — Cleanup (only after a clean bake).**
- Inline the redesigned view at each canonical route; delete the flag branch.
- Delete the `*-new` routes and remove their ⌘K entries (or repoint ⌘K to canonical).
- Delete the original view components + their dead imports.
- Gate: grep shows zero references to removed components; `tsc` clean; full QA re-run.

---

## 4. Per-route manifest (the 45 swaps)

Vendor (canonical ← redesigned):
`bookings, leads, customers, calendar, inventory, expenses, receipts, suppliers,
staff, payments, receivables, pdcs, revenue, tax, today, insights, function-sheets,
drone-noc, halal-certs, generator-fuel, brokers, collaborations, automation, promote,
billing, settings (account), business-settings, overview (/dashboard)`.

Admin: `vendors, users, roles, businesses, admin/vendor-queue, admin/disputes,
admin/audit-logs`.

Editors (reached from the above via ⌘K / links; no separate canonical today —
keep at their routes or surface from the function-sheet/settings screens):
`function-sheet-detail, -composer, -operations, -sign, trade-ops`.

> Some canonical routes pass `searchParams`/`searchParamsCache`; preserve that
> parsing in the swapped page (the redesigned views ignore it but the parse is
> harmless and keeps nuqs state intact).

---

## 5. Rollback

- **Instant, no code:** set `NEXT_PUBLIC_DASHBOARD_REDESIGN_OFF=true` (wins over
  everything) → every canonical route serves the original on next request/build.
- **Per-cohort:** remove the business id from `…_BUSINESSES`.
- **Code-level:** the original component import stays in each page until Phase 4,
  so reverting is a one-line change even after global-on.

---

## 6. Open decisions (surface before Phase 0 wiring)

1. **Build-time vs runtime flag.** Env (simple, needs redeploy to flip) vs
   server-read cookie/`/api/v1/flags` (runtime flips, slightly more plumbing).
   Recommended: runtime read for Phases 1–3 so ramps don't need redeploys.
2. **Cohort source.** Static id allowlist (now) vs a `businesses.redesignOptIn`
   column / a %-by-hash on businessId for smooth ramps.
3. **Editors' canonical home.** Keep editors at `*-new` and link to them from the
   swapped screens, or give them canonical routes too. Lowest-risk: link from the
   function-sheet + business-settings screens (already wired in the detail view).
4. **`businessId` server-side.** `isRedesignOn(businessId)` needs the id at render;
   for per-business cohorts on server components, resolve it from the session/route.
   Global + `…_OFF` work with no businessId, so Phases 0/3/rollback need nothing extra.

---

## 7. Risk register

| Risk | Mitigation |
|---|---|
| Redesigned screen regresses on a vendor's real data shape | Canary on real businesses first; per-screen flag granularity possible (extend flag to take a route key) |
| Build-time flag can't roll back fast enough | `…_OFF` kill-switch + (Phase 0) runtime flag option |
| URL/SEO/deep-link breakage | None — URLs unchanged; only the rendered component swaps |
| Editor writes to PROD data incorrectly | Editors already verified against dev DB; canary validates on prod with the team's own businesses before any vendor sees them |
| Stale ⌘K "— new design" entries post-cutover confuse users | Phase 4 repoints/removes them |

---

## 8. Definition of done

Flag scaffolded + all 45 canonical routes swap behind it (off in prod); canary →
ramp → default-on with green gates at each step; ≥2-week bake; then originals +
`*-new` routes + flag removed, `tsc` clean, QA re-run green.
