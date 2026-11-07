# RESUME NOTE: paused 9 October 2026 (second pause, owner said "pause this")

Everything I started is stopped and re-checked after 5 s: the 390px sweep and its interaction script, the wait loops, my dev server (3000), my local test database (5433) and my automation Chrome (9224). Nothing of mine is listening. The owner's own debug Chrome on 9222 was not running and was never touched. The three workers (qist, slots, plans) have all finished and reported.

The issue list is `docs/PORTAL-ISSUES.md` (untracked file in this checkout, deliberately not committed: the repo is public). Read it first.

## State of the issues
| # | Issue | State |
|---|---|---|
| 1, 2 | Dashboard chart and event cards | DONE, live, verified |
| 3 | Add a business | DONE, live |
| 4 | "?" help on fields | DONE, live |
| 5 | Plan limits | DONE, merged (backend #183 + #188, frontend #351). Enforcement is OFF in production (verified: `enforced:false`, nothing locked). Owner must pick the rollout mode |
| 6 | Lead source Instagram | DONE, live |
| 7 | Slot picker for Nayi booking | DONE, merged (backend #187, frontend #346), verified on production (Waqt (slot) list, no clock input, no write sent) |
| 8 | Customer "Pay Rs. 0" | merged (#344). NOT yet seen on a live customer account; also changes again with the qist PR |
| 9 | Qist (instalments) rebuild | BUILT, NOT MERGED. Backend PR #189, frontend PR #352 both open, mergeable, current with main. 102 integration+HTTP suites (829 tests) pass locally, 101 qist tests pass. **Blocked on the owner's yes to the production migration, see below** |
| 10 | Found by reading the phone screenshots | DONE and verified live (#345 drawer smudge, #347 Venue OS empty state, #348 Customers search, #349 Halls & Spaces cards, #350 PageHeader) |

## The one thing blocking issue 9 (needs the owner)
Production has exactly two migrations pending, nothing else: `20261009100000-qist-schedule-columns.js` and `20261009100100-notification-qist-enums.js`. Both are additive and idempotent (IF NOT EXISTS). The new backend code breaks every installment query until they are applied, so #189 must NOT be merged first.
The tool refused to run them against the live database ("Production Deploy"), so the owner has to say go, or add a permission rule for it. Then, in this order:
1. Apply them (pin the URL inline: `cd C:\Projects\ww-wt\qist-be`, `DATABASE_URL=<prod from C:\Projects\ems-v0-backend\.env> npx sequelize-cli db:migrate`; print the host first; sequelize-cli reads .env by itself, which is production).
2. Set `QIST_REMINDERS_DISABLED=1` on Railway BEFORE merging (I have no Railway access, the owner sets it). The daily job starts ~5 min after boot and sends every vendor one in-app digest about every past-due qist, and some old rows have wrong due dates from the bug being fixed.
3. Merge backend #189, wait for the Railway restart (poll `/health` bootedAt), merge frontend #352.
4. Read-only dry run of the data clean-up: `DATABASE_URL=<prod> node scripts/migrate-qist-schedules.js --json=qist-dry.json` (needs step 1). Review counts with the owner (unledgered advances are the owner's decision). Apply only with `--commit --confirm-host=<host>`. Re-run the dry run, it must report 0 to change.
5. Then enable the reminder job (remove the env var) and verify headed on production.

## Verified on production (final test pass, 9 Oct; everything read-only, every browser write aborted)
- 62 vendor routes at 1536px AND at 390px: 0 flagged each (no console/page errors, failed requests, NaN/undefined text, overflow, blank pages, or parked panels still painting a shadow). 25/25 read-only API checks: entitlements `enforced:false`, nothing locked, gated routes (cheque ledger, advanced insights, cash-flow forecast, automation, staff) not refused, slot availability per hall correct, bad date is a clean 400, KPIs have no NaN.
- Interaction pass (`.qa/sweep/verify-interactions.cjs`, 26 checks at two widths): all real behaviour correct. 9 reported failures were triaged: 1 real defect (Add a business had no "?" help) FIXED in #353 and verified headed; the other 8 were my instrument being wrong (the slot rows use different markup than my selector; "no slot picked" IS refused, by a red toast "Waqt (slot) chunein."; "NaN" matched inside the word "u-nan-swered" on the Overview; I had assumed Main Hall was hall id 3355, it is "afsana"). Hall slot lists verified against the API for all 5 halls: halls with no slots of their own show the venue-wide "Day" slot, afsana shows its own Day/Midday/Evening.
- Plan & billing with enforcement off: usage card shows plain counts only (5 businesses, 34 staff, 5 halls, 10 photos), no "of N", no locks.
- Small nit left: the red "Waqt (slot) chunein." toast sits over the drawer title and close button for a few seconds.
- Tooling for the next run: restart a headed Chrome with `--remote-debugging-port=9224 --user-data-dir=<scratch dir>` (never 9222), use `MSYS_NO_PATHCONV=1` in Git Bash, run from `C:\Projects\ems-v0\.qa\sweep`.

## Needs the owner (carried over)
1. Yes/no to the production migration above, and to setting `QIST_REMINDERS_DISABLED=1`.
2. Delete the two QA venues on the live account: "Zzz QA Coverage Marquee (safe to delete)" and "... Two" (under review, not public).
3. Authorization gap found by the slots worker, NOT changed: any `isVendor` user can create an offline, auto-Confirmed booking on another vendor's venue via `POST /bookings`. Recommend an owner-only guard for `isOfflineBooking`.
4. Mobile vendor app (ems-v0-app) not checked against the new slot rule (a clock time outside a slot now gets a 409).
5. Plan limits mode: recommend `PLAN_LIMITS_ENFORCE=new` + `PLAN_LIMITS_NEW_FROM=<launch date>`. Note this test account is over every limit (5 businesses vs 1, 34 staff vs 0); nothing is ever deleted, only growth is refused.
6. Safepay: what the page showed after "Agree & Subscribe" (live account shows no subscription), go-ahead to create the real Rs 2,500 / 5,000 / 10,000 live plans and swap `SAFEPAY_PLAN_*`, rotate the Safepay secret key + webhook secret (both appeared in chat).
7. Site money wording contradicts itself (/pricing, /terms, /payments say the platform holds deposits; the footer, /privacy and /aml say it never does).

## Issue 4 addendum
Add a business now has the "?" help on 7 fields (#353, merged), and tapping a "?" no longer shows a premature "required" error. Still without "?": Shadow-DOM console screens, packages/menus/type-specific managers, staff/supplier/broker dialogs.

## Not yet tested (no credentials / needs data)
Customer screens on a live customer account (issue 8), admin routes, the reschedule dialog (no bookings exist after the wipe), any real Safepay checkout.

## Data already changed on production (backed up locally)
`muhammadrehmanyousaf786@gmail.com` (user 3351): 6,719 rows of operational data removed on the owner's request (see earlier note). Backups: `.qa/wipe/backup-2026-10-08T19-36-35-271Z` and `...T21-14-55-221Z`. Nothing was written to production today beyond the merged code (no schema change, no data).

## Loose ends I left on disk
Worker worktrees under `C:\Projects\ww-wt\*` (all clean and pushed). Scratch scripts and screenshots in `C:\Projects\ems-v0\.qa\` (git-ignored). `pass-flows.log` untracked in the frontend checkout, and a new untracked `.claude/` folder.
