# Dashboard Redesign — Go-Live Runbook (Phases 1–4)

**Status:** Phase 0 DONE + verified (flag wired into 35 canonical routes, OFF by default).
This runbook is the **operator** guide for the rollout — the steps that require
production access (env vars / deploy) and calendar time (bake). Code is complete;
nothing below needs a code change unless noted.

Live production — every step is reversible. The kill-switch
`NEXT_PUBLIC_DASHBOARD_REDESIGN_OFF=true` wins over everything, instantly.

---

## The flag (already shipped — `lib/dashboard-redesign-flag.ts`)

`isRedesignOn(businessId?)` precedence:
1. `NEXT_PUBLIC_DASHBOARD_REDESIGN_OFF=true` → **always original** (hard kill-switch).
2. `NEXT_PUBLIC_DASHBOARD_REDESIGN=true` → **redesign for everyone**.
3. `NEXT_PUBLIC_DASHBOARD_REDESIGN_BUSINESSES="3406,512,…"` → redesign only for those business ids.
4. else → original.

> These are `NEXT_PUBLIC_*` (build-time inlined). On Railway/Vercel, changing one
> triggers a rebuild/redeploy. To flip **without** redeploy, do the optional
> "runtime flag" upgrade in the Appendix first.

The 35 wired canonical routes render the redesign when the flag resolves on; URLs
never change. `*-new` routes stay live for side-by-side QA until Phase 4.

---

## Phase 1 — Internal canary (your own businesses)

1. Find your team's own vendor business ids (the accounts you control on prod).
2. Set on the **frontend** service (Vercel/Railway → ems-v0 env):
   ```
   NEXT_PUBLIC_DASHBOARD_REDESIGN_BUSINESSES=<id1>,<id2>
   ```
3. Redeploy the frontend. Log in as each canary account and walk every screen +
   editor on **real prod data**.
4. **Gate to pass before Phase 2:** no console error spike, dashboard latency flat,
   function-sheet + business-settings saves succeed, bulk export works, no layout
   breakage on mobile. If anything regresses → remove the id(s) (instant per-cohort
   rollback) and report back.

## Phase 2 — Ramp (5% → 25% → 50%)

Expand the cohort gradually. Two options:
- **Simple:** keep adding business ids to `…_BUSINESSES`.
- **Smooth %:** switch to a hash-on-businessId gate (small code change — see Appendix
  "percent ramp"). Recommended once the canary is clean.

Hold ~2–3 days at each step. **Gate at each step:** support tickets flat, no spike in
dashboard JS errors, saves succeed, export works.

## Phase 3 — Default ON

1. Set `NEXT_PUBLIC_DASHBOARD_REDESIGN=true` (drop the cohort var). Redeploy.
2. Everyone now gets the redesign; originals remain one flag away.
3. **Bake ≥ 2 weeks.** Keep `…_DASHBOARD_REDESIGN_OFF` documented as the instant
   rollback. Watch error rates + support.

## Phase 4 — Cleanup (only after a clean 2-week bake)

This IS a code change (a PR). In each canonical route page:
1. Inline the redesigned view (drop the `isRedesignOn()` guard + the original import).
2. Delete the original view components once nothing imports them.
3. Delete the `*-new` route folders **EXCEPT the 5 function-sheet editor routes**
   (`function-sheet-detail-new`, `-composer-new`, `-operations-new`, `-sign-new`,
   `trade-ops-new`) — those are the editors' permanent home, reached via links from
   the (now-canonical) function-sheets list. Repoint/clean their ⌘K entries.
4. Remove `lib/dashboard-redesign-flag.ts` and its imports.
5. **Gate:** `grep` shows zero references to removed components; `tsc` clean; full QA re-run.

---

## Rollback (any phase)

- **Instant, no code:** `NEXT_PUBLIC_DASHBOARD_REDESIGN_OFF=true` → originals on next request/build.
- **Per-cohort:** remove the id from `…_BUSINESSES`.
- **Code:** the original import stays in every page until Phase 4, so reverting is a
  one-line change even after global-on.

---

## Known follow-ups (polish, not blockers)

- **Function-sheet `[id]` detail:** the canonical `/dashboard/function-sheets/[id]`
  still renders the ORIGINAL detail. The redesigned detail loads "the latest sheet"
  (not the `[id]` param), so it can't be wired to `[id]` until it reads the route id.
  The redesigned function-sheets LIST is canonical; it enters the editor sub-app at
  the `-new` routes. Low-impact; fix when the detail is made id-aware.

## Appendix — optional runtime flag (skip per-redeploy ramps)

To flip cohorts/percent without a rebuild: read the flag from a request cookie or a
`/api/v1/flags` value server-side, and have `isRedesignOn` consult it. This lets
Phases 1–3 ramp by flipping a value (no redeploy). Build-time env still works as the
default + kill-switch. Implement before Phase 2 if redeploy-per-step is painful.

### Appendix — percent ramp gate (sketch)
Replace the cohort check with a stable hash: `hash(businessId) % 100 < ROLLOUT_PCT`,
driven by `NEXT_PUBLIC_DASHBOARD_REDESIGN_PCT`. Deterministic per business, smooth ramp.
