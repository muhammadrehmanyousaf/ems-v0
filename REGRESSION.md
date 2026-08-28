# REGRESSION.md

The regression-control sheet for **Wedding Wala** — `ems-v0` (Next.js frontend)
and `../ems-v0-backend` (Express API). One file for both repos, because a change
of any size lands in both and a gate passing in one proves nothing about the other.

Written after **WW-DIRECT-PAY** (2026-08-28), which removed payments from the
platform entirely. That is the highest-risk area in the product right now and it
has its own section below.

---

## 1. Green baselines — anything worse is a regression, not the environment

| Gate | Where | Green |
|---|---|---|
| Unit tests | backend | **3,734 passed / 167 suites**, no DB needed |
| Integration | backend | **268 passed / 17 skipped / 0 failed** (70 suites, needs PGlite) |
| HTTP | backend | **154 passed / 10 skipped / 0 failed** (14 suites, needs PGlite) |
| Migrations | backend | **322 applied / 0 failed** |
| Typecheck ratchet | frontend | **121 known errors, 0 new** |
| Parity guards | frontend | **5/5 suites pass** |
| Production build | frontend | **exit 0**, `Compiled successfully` |
| Cypress | frontend | 73 specs — see §4, these hit PRODUCTION |
| Playwright | frontend | 4 specs — **headed only**, never headless |

Every number above was **measured on 2026-08-28**, not copied forward. The skip
counts are part of the baseline: a suite that starts passing 268 with 0 skipped
has had a gate quietly disabled, which is a regression too.

`npx tsc --noEmit` on the default tsconfig reports **~172** errors. That is a
different, wider file set from the ratchet's 121 — do not compare the two numbers
and conclude something broke.

---

## 2. The fast loop — before every commit

Under a minute. No database, no network.

```bash
# backend
cd ems-v0-backend && npm run test:unit

# frontend
cd ems-v0 && npm run typecheck:ratchet && npm run guards
```

If any of those is red, stop. They are cheap enough that there is never a reason
to skip them, and each catches a class the others cannot.

---

## 3. The full loop — before opening a PR

```bash
# backend: unit + the DB tiers
cd ems-v0-backend
npm run test:unit
npm run db:local            # terminal 1 — PGlite on 127.0.0.1:5433
npm run db:local:setup      # terminal 2 — migrate + seed (pins the loopback DSN itself)
npm run test:integration
npx jest --runInBand --testPathPattern='tests/http'

# frontend
cd ems-v0
npm run typecheck:ratchet
npm run guards
npm run build               # prebuild runs the ratchet
```

**`npx next build` bypasses the ratchet.** The gate is the `prebuild` hook on
`npm run build`. A green `npx next build` proves the bundle compiles and says
nothing about type regressions.

---

## 4. What each gate catches — and what it is blind to

| Gate | Catches | Blind to |
|---|---|---|
| `test:unit` | pure logic: money math, policy rules, state machines, validators | anything needing a DB, every HTTP shape, all UI |
| `test:integration` / `http` | schema drift, real queries, route wiring, RBAC | UI, and anything the seed fixtures do not create |
| `typecheck:ratchet` | NEW type errors only | the 121 it already knows about; all runtime behaviour |
| `guards` | a client mirror drifting from its server original | anything with no mirror |
| `npm run build` | imports, JSX, bundling, route collection | types (`ignoreBuildErrors: true`), all behaviour |
| Cypress / Playwright | real end-to-end behaviour | anything not written yet; they run against PRODUCTION |

**The parity guards are the cheapest real-bug detector in the repo.** Each reads
the actual source of a client mirror and its server original and asserts they
still agree. Run the matching guard after touching:

| Guard | Fires on changes to |
|---|---|
| `guard:deposit` | deposit terms, cancellation policy display |
| `guard:space-fit` | space/capacity rules, `src/utils/spaceRequirements.js` |
| `guard:fx` | indicative-price wiring — **inverted**: now asserts venue pages do NOT show a converted price |
| `guard:amenities` | amenity keys/labels on either side |
| `plan-events-shape` (via `npm run guards`) | the Shaadi Plan checkout envelope |

### E2E runs against live production — read `cypress/README.md` first

Every harness points at `https://www.weddingwala.pk`. The safety rails exist
because of that and must not be removed:

- `describeMutating()` blocks **skip** unless `CYPRESS_ALLOW_MUTATION=1`, and a
  skipped block reports as *pending* — so "did not run" cannot be misread as passed.
- `refuseMoneyWrites()` throws on POST to payments / refunds / payouts / invoices.
  Never gated.
- Every mutating spec deletes what it created in an `after` hook and asserts it.
- **Playwright runs headed. Headless against production is not permitted.**

---

## 5. WW-DIRECT-PAY — the current high-risk surface

The platform stopped taking payments. The customer pays the vendor directly and
files a claim; the vendor confirming it records the money. Four migrations, a
changed default, and a deleted gateway.

### Run after any change touching booking, money or holds

```bash
cd ems-v0-backend && npx jest --runInBand \
  tests/unit/bookingMoney.test.js \
  tests/unit/staleBookingPolicy.test.js \
  tests/unit/bookingMode.test.js \
  tests/unit/strictestVendor.test.js \
  tests/unit/stripeCheckoutSession.test.js \
  tests/unit/bookingCreateServiceCore.test.js
```

`stripeCheckoutSession.test.js` is badly named — it covers `getVendorRevenue` and
the Khata, and it is the suite that caught a real regression when a guard was
removed mid-change.

### The four traps, and what pins each

| Trap | Pinned by |
|---|---|
| `downPayment` is money RECEIVED; `advanceDuePkr` is the advance OWED. Reading the wrong one reports a phantom advance the moment a vendor accepts. | `bookingMoney.test.js` — including the live Waheed Jutt row: Confirmed/Pending with Rs 35,000 genuinely received |
| The stale sweeper cancels every booking awaiting acceptance if `awaitingVendorDecision` is weakened. `paymentMethod` and `hasPaymentAttempt` no longer guard anything. | `staleBookingPolicy.test.js` — 4 tests, including that an OMITTED flag grants no immunity |
| An unset `bookingMode` means **`request`**, not `instant`. Flipping it back confirms dates against money nobody asked for. | `bookingMode.test.js`, `strictestVendor.test.js` |
| A new online booking has `downPayment: 0`. Code asserting it is positive is asserting the old overload. | `bookingCreateServiceCore.test.js` |

### Migrations that must be applied before the frontend ships

```
20260828120000-ww-direct-pay-request-mode        every venue reviews first
20260828130000-ww-advance-due-column             the advance/received split
20260828140000-ww-vendor-wallet-accounts         JazzCash / Easypaisa accounts
20260828150000-ww-requirement-setup-counts       sofas / tables / stalls
```

`20260828130000` is deliberately a **no-op on read**: it seeds `advanceDuePkr`
from `downPayment` and leaves `downPayment` alone, so every historical row is
unchanged on every screen. Pre-existing unpaid bookings therefore still show a
phantom advance — status quo, not a new defect.

### Manual checks no automation covers

These need a browser and a real venue.

- [ ] A venue with **no published account** shows "contact the venue", never a
      placeholder IBAN.
- [ ] A **JazzCash** row renders 3 fields (rail / registered name / mobile), not
      5 with two blank, and no IBAN row.
- [ ] `/user/bookings/<id>/pay` on a booking the vendor has **not** accepted shows
      "the venue is reviewing your request" and asks for **nothing**.
- [ ] The amount on that page equals the server's `amountDue` — never Rs 0, never
      the full booking total on a deposit.
- [ ] A **portal-written menu** (flat `items` array) shows its dishes, not just a
      title and price.
- [ ] Picking a smaller hall **clamps** the guest count down, on BOTH hall models
      ("Which hall?" and "Which space?").
- [ ] A day the venue is closed is **not selectable**; a day still loading is
      greyed but **not** struck through.
- [ ] A vendor can save a JazzCash account and see it appear at checkout after
      ticking "show to customers".

---

## 6. Git workflow — both repos squash-merge

This bit us once. `main` receives a **squash** of each PR, so the original commits
never appear there. A branch stacked on another feature branch will conflict
against `main` after that branch merges — the same content exists twice under
different ids.

When `main` has moved under you:

```bash
git fetch origin
git merge-tree --write-tree origin/main HEAD >/dev/null && echo CLEAN || echo CONFLICTS

# replay ONLY your own commits onto main, dropping merged ancestors
git tag backup/pre-rebase
git rebase --onto origin/main <your-first-commit>^ <your-branch>
```

Then **re-verify before force-pushing** — a rebase onto moved code can resolve
silently and wrongly. Re-run §2 at minimum, §3 if the rebase touched anything a
guard covers. Push with `--force-with-lease`, never bare `--force`.

---

## 7. Known-noisy — not regressions

- A DB suite that fails once and passes on re-run and in isolation is most likely
  the PGlite wire-protocol desync documented in `tests/setup-pglite.js`. Re-run
  before chasing it.
- GitHub Actions shows `startup_failure` on every push: the workflow is
  `workflow_dispatch`-only and Actions is blocked at account-billing level.
- `next build` prints `duration-[2000ms] is ambiguous` Tailwind warnings. Long
  pre-existing.
- `npm install` warns about `cypress` install scripts not being allow-listed.
