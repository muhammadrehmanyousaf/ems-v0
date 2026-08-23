# WW venue booking — test cases

Every case below traces to a defect we found or a behaviour we built during this
work. Each names **what breaks in the real world if it regresses**, because a
test case that only says "check X renders" gets deleted the first time it's
inconvenient.

**Environment:** production, `https://www.weddingwala.pk`.
**Fixtures:** venue `3358` "Rehman Grand Marquee" (owner account), throwaway
customer `zzqamt643ik8.customer@example.com`.

Status key: `AUTO` driven by the Playwright harness · `API` asserted over HTTP ·
`UNIT` covered by jest · `MANUAL` needs a human eye.

---

## 1 · Packages & menus on the public detail page

The page a couple actually compares venues on. Before this work it printed a
name and a bare number, and no menus at all.

| # | Case | Expected | How |
|---|---|---|---|
| 1.1 | Packages section renders | Every non-deleted package appears | AUTO |
| 1.2 | **Menus section renders** | All menus appear. Regression = a venue's entire food offering is invisible until deep inside the booking flow | AUTO |
| 1.3 | Per-head price shows its unit | `Rs 2,650 per head`, never a bare `Rs 2,650` | AUTO |
| 1.4 | Per-event price shows its unit | `Rs 1,320,000 per event`. Regression = a whole-wedding price reads as the price of one plate | AUTO |
| 1.5 | Per-head worked example | `400 guests = Rs 1,060,000` — the sum the couple is doing in their head anyway | AUTO |
| 1.6 | Food-inclusion badge | `Food included` or `Food charged separately` on every package | AUTO |
| 1.7 | Guest band | `Best for 250–450 guests` when `guestRangeMin/Max` set — distinct from hall capacity | AUTO |
| 1.8 | Min guarantee | `Billed for at least N` when set. Regression = the customer discovers the floor at settlement | AUTO |
| 1.9 | Capacity | `Up to N guests` when `capacity` set | AUTO |
| 1.10 | Service style | Buffet / Sit-down / Family style / Hi-tea / Live stations when set | AUTO |
| 1.11 | Bundled menu named | `menuId` set → "Menu included: Gold Menu (Rs 2,650 per head value)" | AUTO |
| 1.12 | Extras with prices | `{code,label,price}` → "Generator backup + Rs 45,000". Regression = "generator available" instead of a price | AUTO |
| 1.13 | Per-look pricing | `looksJson` → each look with its own price | MANUAL (no live data) |
| 1.14 | Image gallery | First image large, `+N photos` when more | AUTO |
| 1.15 | Features list | Every feature rendered | AUTO |
| 1.16 | Menu dishes grouped by course | salan → rice → roti → salad → sweet → drinks | AUTO |
| 1.17 | Live counters marked | `live counter` chip; does **not** count toward the one-dish limit | MANUAL |
| 1.18 | Per-head supplements | `+ Rs 500/head` beside the dish | MANUAL |
| 1.19 | Menu min guarantee + floor | "Billed for at least 148 guests · from Rs 273,800" | AUTO |
| 1.20 | One-dish warning on a non-compliant menu | Amber note. **Never green on an unclassifiable menu** | AUTO |
| 1.21 | All-inclusive wording | Every package `includesFood` → menus header says "Included in the packages above" | MANUAL |
| 1.22 | Venue with no menus | Menus section absent entirely, no empty heading | MANUAL |

---

## 2 · The double-charge

The most expensive defect found. A package advertising a menu in its own
features, with `includesFood = false`, bills the menu **again** on top.

| # | Case | Expected | How |
|---|---|---|---|
| 2.1 | Package with `includesFood=true` suppresses the menu charge | Menu line reads "Included"; total does not move | UNIT |
| 2.2 | `includesFood=false` charges both | Legacy behaviour preserved | UNIT |
| 2.3 | Per-head package × guest count | `price × max(guests, minGuarantee)` | UNIT |
| 2.4 | **Live regression case** | Platinum (Rs 1,320,000, features say "Platinum menu (12 dishes)") + Platinum Menu @ 300 → **must not be Rs 2,490,000** | API |
| 2.5 | Vendor warning while typing | Features mention a menu + food charged separately → amber warning quoting the phrase | AUTO |
| 2.6 | Backfill dry-run | Names each package and the matched phrase; writes nothing | UNIT + MANUAL |
| 2.7 | Backfill veto | "Gold menu (8 dishes)" + "Catering charged separately" → **not** flipped. Wrong direction costs the *vendor* | UNIT |
| 2.8 | Backfill scope | `--only=<id>` touches one venue | MANUAL |

---

## 3 · Prohibited services (Punjab Marriage Functions Act 2016 s.3)

Liability reaches the **venue**, not only the host.

| # | Case | Expected | How |
|---|---|---|---|
| 3.1 | Bundled service named "Fireworks" | 400 `PROHIBITED_SERVICE` | API |
| 3.2 | **Package `features[]` containing "Fireworks"** | 400. Regression = sold through the field nobody screens | API |
| 3.3 | Romanised Urdu | `patakhay`, `aatishbazi`, `atish bazi` refused | UNIT |
| 3.4 | "firing in the air" in description | Refused | UNIT |
| 3.5 | **"Firework-free celebration" allowed** | Must pass — blocking it punishes the compliant venue | API |
| 3.6 | "No fireworks" / "Without fireworks" allowed | Must pass | UNIT |
| 3.7 | "Fireworks and no alcohol" refused | A stray "no" must not launder a real listing | UNIT |
| 3.8 | Innocent words | "Cracker platter", "Gun-metal theme" allowed | UNIT |
| 3.9 | Update path | A PATCH omitting `features` is judged on the merged row | UNIT |

---

## 4 · One-dish rule (s.5 — binds venue **and** caterer)

| # | Case | Expected | How |
|---|---|---|---|
| 4.1 | Two salans | **Violation**, red | AUTO |
| 4.2 | One salan + rice + sweet | Compliant | AUTO |
| 4.3 | Unclassified legacy menu | **`unknown`, amber — never green.** A false green is what a vendor relies on in front of an inspector | UNIT |
| 4.4 | Inferred classification | Amber "we guessed" state | AUTO |
| 4.5 | Customer-side notice | Booking date step shows the compliance note | AUTO |
| 4.6 | 10 PM close | Slot at/after legal closing refused | UNIT |

---

## 5 · Request-to-book (`bookingMode`)

| # | Case | Expected | How |
|---|---|---|---|
| 5.1 | Vendor sets `bookingMode` | Three options; saves; server confirms | AUTO |
| 5.2 | Default (`null`) unchanged | Reads as `instant`; no live venue changes on deploy | UNIT |
| 5.3 | Final CTA in request mode | **"Send request"**, not "Pay & confirm" | AUTO |
| 5.4 | No payment before acceptance | Request-sent screen; nothing charged | AUTO |
| 5.5 | Booking created | Status `Awaiting Payment`, `vendorApprovedAt` null | API |
| 5.6 | Approval card on `/dashboard/bookings/[id]` | Renders. Regression = vendor lands somewhere with no way to accept | AUTO |
| 5.7 | Approval card in the list side-sheet | Renders (kebab → Quick view) | AUTO |
| 5.8 | **Accepting does NOT confirm** | Stays `Awaiting Payment`; `vendorApprovedAt` set. Regression = a peak Saturday given away for Rs 0 | API |
| 5.9 | Advance becomes payable | `awaitingVendorApproval=false`, `amountDue>0` | API |
| 5.10 | Payment confirms | Advance recorded → `Confirmed` | MANUAL |
| 5.11 | Instant mode unchanged | Approve still confirms directly (BK-081) | API |
| 5.12 | Card hides after acceptance | Both surfaces; a second click must not 400 | AUTO |

---

## 6 · Quote / negotiation pipeline

| # | Case | Expected | How |
|---|---|---|---|
| 6.1 | Customer opens an inquiry from the venue page | Quote created, `status=inquiry` | API |
| 6.2 | Appears in the vendor's list | Visible | AUTO |
| 6.3 | Vendor issues a **single-number** quote | Legacy path unchanged | API |
| 6.4 | Vendor issues an **itemised quotation** | Total derived from lines; client and server agree | API |
| 6.5 | Worked example | Hall 450k + Gold 2,650×400 + stage 180k + generator 45k − 5% = **Rs 1,648,250** | UNIT + API |
| 6.6 | Percent line position-independent | Discount first or last → same total | UNIT |
| 6.7 | Positive "discount" refused | Must be negative | UNIT |
| 6.8 | Negative charge refused | Use a discount line | UNIT |
| 6.9 | Per-head line with no guest count refused | Unless explicit qty | UNIT |
| 6.10 | Zero/negative total refused | | UNIT |
| 6.11 | **First quotation is v1** | Not v2 | API |
| 6.12 | Vendor revision bumps version | v1 → v2 | API |
| 6.13 | `validUntil` stored and shown | Both sides | API + AUTO |
| 6.14 | Expiry inclusive of final day | Valid all of the last day | UNIT |
| 6.15 | Expired quote can't be countered or accepted | 409 `QUOTE_EXPIRED`; Accept hidden in UI | UNIT + AUTO |
| 6.16 | Vendor can re-issue on an expired quote | The documented recovery path | API |
| 6.17 | Counter carries the document | Lines survive the round trip | API |
| 6.18 | Customer sees the itemised lines | Not just a number | AUTO |
| 6.19 | Turn-taking | Only the party without the ball may move | UNIT |
| 6.20 | Owner scoping | A stranger gets 404, not 403 | UNIT |
| 6.21 | Site visit — propose | Either side; `proposed` | API |
| 6.22 | **Cannot confirm own proposal** | 409 | API |
| 6.23 | Counterparty confirms | `confirmed` | API |
| 6.24 | Visit runs alongside haggling | Does not touch quote status | API |
| 6.25 | **Accept creates a booking** | `bookingId` returned. Regression = the deal evaporates | API |
| 6.26 | **Booked at the negotiated price** | Rs 1,648,250 — *not* the venue's `minimumPrice` floor | API + UNIT |
| 6.27 | Booked on the quote's date and slot | | API |
| 6.28 | Date gone → clean failure | 409 `QUOTE_DATE_UNAVAILABLE`, quote stays open | MANUAL |
| 6.29 | Quote with no date can't convert | 409 `QUOTE_NO_DATE` | UNIT |
| 6.30 | Customer routed to pay | Link to the booking | AUTO |
| 6.31 | Deposit on a negotiated booking | Same percentage/flat/default/card-minimum rules | UNIT |

---

## 7 · Payment truthfulness

| # | Case | Expected | How |
|---|---|---|---|
| 7.1 | No placeholder IBAN | Venue's own published account, or a graceful fallback | AUTO |
| 7.2 | Fallback names the venue's real contact | Not a hardcoded number | AUTO |
| 7.3 | Reference shown | `BK-<id>` | AUTO |
| 7.4 | Custody statement true | "we don't hold the money" — a non-EMI may not | AUTO |
| 7.5 | **No Stripe claim in the venue flow** | Stripe does not onboard Pakistani businesses | AUTO |
| 7.6 | Stripe badge kept where real | `booking-payment-screen.tsx` genuinely mounts `PaymentElement` | MANUAL |
| 7.7 | Customer reports a transfer | Claim recorded; vendor confirms | MANUAL |

---

## 8 · Settlement — **NOT IMPLEMENTED**

`settlementPolicy.js` is referenced in three comments and called from nowhere.
A venue can set every term below and nothing computes a bill from them. These
cases are written now so the gap is visible and the work has a target.

| # | Case | Expected | How |
|---|---|---|---|
| 8.1 | Headcount lock | Final count locks `headcountLockDays` before the event | ✗ not built |
| 8.2 | `bill = max(guaranteed, actual)` | The core Pakistani settlement rule | ✗ not built |
| 8.3 | Tolerance band | Within `toleranceBandPct` billed at the normal rate | ✗ not built |
| 8.4 | Walk-ins beyond the band | Billed at `walkInRatePerHead` | ✗ not built |
| 8.5 | Children under 5 | `childUnder5Pct` applied; come **out** of the stated total | ✗ not built |
| 8.6 | Staff meals | `staffMealRatePkr`; billed separately, leave the head count | ✗ not built |
| 8.7 | Fractions round up | Never against the venue | ✗ not built |

---

## 9 · Safety rails for testing on production

| # | Case | Expected |
|---|---|---|
| 9.1 | Test venues hidden | Name matches **both** `%zzz qa%` and `%safe to delete%` — `submitted` status alone does **not** hide a business |
| 9.2 | Verify hidden **before** driving | Check the public catalogue first, not after |
| 9.3 | Bookings cancelled | Every test booking ends `Cancelled` |
| 9.4 | `bookingMode` restored | Back to `null` on all owner venues |
| 9.5 | Test packages deleted | No `zzz qa` rows left |
| 9.6 | Real data untouched | Booking 173 still `Confirmed` |
| 9.7 | Never guess a selector | Read the source gate first — e.g. `getIsStepValid` in `booking-form.tsx` |
| 9.8 | Headed only | `headless: false`; the owner watches what is done to their system |

---

## Known-red before this work (not caused by it)

- `zeroPriceGuard` › "still floors at minimumPrice" — Expected 220000, Received 50000.
- `refundPolicyEngine` › `calcRefund` — 5 failures.
- `collabPhoneMatch` › `PLAN_CATALOG` — 2 failures.

Verified identical on clean `main` by stashing. **8 failures, 3 suites.**
