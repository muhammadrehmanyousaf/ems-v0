 API · A8-2/A8-3 — 421 stated → 361 adults → 366 billable | API · H-5b — “The guarantee was agreed when you booked” | API · H-7b/H-10 — the customer can read the arithmetic beforehand | API · A8-7 — 420 adults + 1 half-plate = 421, rounded up | API · A8-4/A8-5 — 30 staff leave the count, billed 30 × Rs 800 | API · A8-2/A8-3 — 20 under-5 free, 10 aged 5–12 at half | API · H-7 — billed at walk-in; implausible counts refused (H-9) | API · H-5 — guarantee still bills; the line says why | API · H-7 — 300 → 275 at Rs 2,500 + 25 at the Rs 3,500 walk-in | API · H-6 — 260 inside the 10% band, all at the agreed rate | API · H-5 — 200 turn up against a 250 guarantee, billed 250 | API · H-4/H-4b — locks, and the lock is visible to both sides |# WW venue booking — test cases

Covers **everything specified across the whole programme**, not only what has
been built. Cases trace to their source document so a reader can go back to the
reasoning:

- `PK-VENUE-PRICING-RESEARCH.md` — the five selling shapes, per-head vs flat
- `VENUE-BOOKING-ARCHITECTURE.md` — the ~150 edge cases (A–J)
- `VENDOR-REGISTRATION-AND-SCENARIOS.md` — the 12-step wizard, RateCardLine
- `VENDOR-PORTAL-AND-SETTINGS-REGISTRY.md` — the settings registry
- `BOOKING-USE-CASES.md` — UC-01…UC-24
- `D1-SETTLED-AND-PACKAGE-MENU-DESIGN.md` — custody, builders, detail page

Each case states **what breaks in the real world if it regresses**, because a
case that only says "check X renders" gets deleted the first time it is
inconvenient.

**Environment:** production, `https://www.weddingwala.pk`
**Fixtures:** venue `3358` "Rehman Grand Marquee" (owner account); throwaway
## Where this stands

**149 covered · 29 still specified-and-not-built** across 11 parts.

`GAP` never meant broken. It means the case was written from the architecture
and the product does not do it yet — the row is the target, not a defect. What
follows is the honest split, so nobody has to read the whole document to learn
what is left.

| Part | Covered | Open |
|---|---|---|
| Part 1 — Pricing shapes | 6 | 3 |
| Part 2 — Packages & menus on the public detail page | 23 | 2 |
| Part 3 — The double-charge | 9 | — |
| Part 4 — Compliance (Punjab Marriage Functions Act 2016) | 16 | 3 |
| Part 5 — Request-to-book (`bookingMode`) | 13 | 2 |
| Part 6 — Quote / negotiation (UC-06, UC-21) | 31 | 1 |
| Part 7 — Payment & custody (D-1) | 12 | 2 |
| Part 8 — Settlement | 12 | 2 |
| Part 9 — Vendor registration & the rate card | 6 | 8 |
| Part 10 — Booking flow mechanics | 12 | 6 |
| Part 11 — Safety rails for testing on production | 9 | — |

The two biggest open areas are **Part 9 (vendor rate card)** — the "how do you
charge?" fork and everything downstream of it — and a scatter of single cases
in Parts 1, 2, 4, 5, 7 and 10. Settlement (Part 8) and the advance-transfer
window are now built and verified against production.

---

customer `zzqamt643ik8.customer@example.com`

| Status | Meaning |
|---|---|
| `AUTO` | driven by the headed Playwright suite |
| `API` | asserted over HTTP |
| `UNIT` | jest |
| `MANUAL` | needs a human eye |
| **`GAP`** | **specified, not built — the case is the target** |

---

# Part 1 — Pricing shapes

`PK-VENUE-PRICING-RESEARCH.md` Part 3. Per-head and per-plate are the same
thing; the **menu** sets the rate, a **package** bundles hall + food + extras at
one headline rate. A venue that cannot express its shape prices wrongly on
every booking.

| # | Case | Expected | How |
|---|---|---|---|
| P1.1 | **Shape 1** — all-inclusive per head | `Rs 2,500/head × 400` = Rs 1,000,000; menu suppressed | UNIT |
| P1.2 | **Shape 2** — hall flat + food per head | Hall Rs 450,000 + menu × heads, both visible as separate lines | UNIT |
| P1.3 | **Shape 3** — hall only, outside caterer | No menu step at all; kitchen-access fee if set | AUTO |
| P1.4 | **Shape 4** — caterer with no hall | Per-head only, no venue charge, service location asked | GAP |
| P1.5 | **Shape 5** — hall rent + minimum food spend | Floor is a *spend*, not a guest count | GAP |
| P1.6 | Legacy package (`pricingUnit=null`) | Prices exactly as before — `price × qty` | UNIT |
| P1.7 | Switching a package per_event → per_head | Existing bookings keep their snapshot | UNIT |
| P1.8 | `minGuaranteeCount` only valid on per-head | Coherence validation refuses otherwise | API |
| P1.9 | Comparing two venues with different shapes (UC-05) | Both normalised to an all-in per-head figure | GAP |

---

# Part 2 — Packages & menus on the public detail page

`D1-SETTLED-AND-PACKAGE-MENU-DESIGN.md` §4. The page a couple compares venues
on. It previously printed a name and a bare number, and no menus at all.

| # | Case | Expected | How |
|---|---|---|---|
| 2.1 | Packages section renders | Every non-deleted package | AUTO |
| 2.2 | **Menus section renders** | Regression = a venue's entire food offering is invisible | AUTO |
| 2.3 | Per-head price shows its unit | `Rs 2,650 per head`, never bare | AUTO |
| 2.4 | Per-event price shows its unit | Regression = a whole-wedding price reads as one plate | AUTO |
| 2.5 | Per-head worked example | `400 guests = Rs 1,060,000` | AUTO |
| 2.6 | Food-inclusion badge | On every package | AUTO |
| 2.7 | Guest band | `Best for 250–450` — **not** the hall's capacity | AUTO |
| 2.8 | Min guarantee | Regression = the floor is discovered at settlement | AUTO |
| 2.9 | Capacity | `Up to N guests` | AUTO |
| 2.10 | Service style | Buffet / sit-down / family / hi-tea / stations | AUTO |
| 2.11 | Bundled menu named + value | "Food included" stops being unqualified | AUTO |
| 2.12 | Extras with prices | "generator available" vs "generator, Rs 45,000" | AUTO |
| 2.13 | Per-look pricing (`looksJson`) | Salon prices by look | MANUAL |
| 2.14 | Image gallery | First large, `+N photos` | AUTO |
| 2.15 | Features list | All rendered | AUTO |
| 2.16 | Dishes grouped in service order | salan → rice → roti → salad → sweet → drinks | AUTO |
| 2.17 | Live counters marked, excluded from the one-dish count | | MANUAL |
| 2.18 | Per-head supplements (A10) | `+ Rs 500/head` beside the dish, not a second menu | MANUAL |
| 2.19 | Menu guarantee floor | "at least 148 guests · from Rs 273,800" | AUTO |
| 2.20 | One-dish warning | Amber; **never green on an unclassifiable menu** | AUTO |
| 2.21 | All packages inclusive | Menus header says "Included in the packages above" | MANUAL |
| 2.22 | Venue with no menus | Section absent, no empty heading | MANUAL |
| 2.23 | Six answers above the fold (§4.1) | Price basis · capacity · date · food · deposit · closing time | GAP |
| 2.24 | Sticky quote bar (§4.4) | Live total as selections change | GAP |
| 2.25 | Mobile primary (§4.5) | 360px readable, no horizontal scroll | MANUAL |

---

# Part 3 — The double-charge

The most expensive defect found. A package advertising a menu in its own
features with `includesFood=false` bills the menu **again** on top.

| # | Case | Expected | How |
|---|---|---|---|
| 3.1 | `includesFood=true` suppresses the menu charge | Line reads "Included"; total does not move | UNIT |
| 3.2 | `includesFood=false` charges both | Legacy behaviour preserved | UNIT |
| 3.3 | Per-head package × guests | `price × max(guests, minGuarantee)` | UNIT |
| 3.4 | **Live case** | Platinum Rs 1,320,000 (features: "Platinum menu (12 dishes)") + Platinum Menu @300 → must **not** be Rs 2,490,000 | API |
| 3.5 | Vendor warning while typing | Amber, quoting the matched phrase | AUTO |
| 3.6 | Backfill dry-run | Names each package and phrase; writes nothing | UNIT |
| 3.7 | Backfill veto | "Gold menu" + "Catering charged separately" → not flipped. Wrong way costs the *vendor* | UNIT |
| 3.8 | Backfill scope | `--only=<id>` touches one venue | MANUAL |
| 3.9 | Menu suppressed but still selectable | Kitchen still needs the dish choice | UNIT |

---

# Part 4 — Compliance (Punjab Marriage Functions Act 2016)

Liability reaches the **venue and the caterer** (s.5), not only the host.

## 4A — Prohibited services (s.3)

| # | Case | Expected | How |
|---|---|---|---|
| 4.1 | Bundled service "Fireworks" | 400 `PROHIBITED_SERVICE` | API |
| 4.2 | **Package `features[]` "Fireworks"** | 400 — the field nobody screened | API |
| 4.3 | Romanised Urdu | `patakhay`, `aatishbazi`, `atish bazi` | API + UNIT |
| 4.4 | "firing in the air" | Refused | UNIT |
| 4.5 | **"Firework-free celebration" ALLOWED** | Blocking it punishes the compliant venue | API |
| 4.6 | "No fireworks" / "Without fireworks" | Allowed | UNIT |
| 4.7 | "Fireworks and no alcohol" | Refused — a stray "no" must not launder a listing | UNIT |
| 4.8 | Innocent words | "Cracker platter", "Gun-metal theme" allowed | UNIT |
| 4.9 | Update path | PATCH omitting `features` judged on the merged row | UNIT |
| 4.10 | UC-13 — customer asks for fireworks in free text | Not auto-refused; surfaced to the venue to answer | GAP |

## 4B — One-dish rule (s.5)

| # | Case | Expected | How |
|---|---|---|---|
| 4.11 | Two salans | Violation, red | AUTO |
| 4.12 | One salan + rice + sweet | Compliant | AUTO |
| 4.13 | Unclassified legacy menu | **`unknown`, amber — never green** | UNIT |
| 4.14 | Inferred classification | Amber "we guessed" | AUTO |
| 4.15 | Customer-side notice on the date step | Shown | AUTO |
| 4.16 | UC-12 — customer wants two mains | Venue told; menu served in reduced form | MANUAL |
| 4.17 | Region without the rule | No warning; not every city is Punjab/ICT | GAP |

## 4C — Timing (s.6)

| # | Case | Expected | How |
|---|---|---|---|
| 4.18 | Slot at/after legal closing | Refused | UNIT |
| 4.19 | UC-11 — baraat late, clock is the law | Overtime add-on **capped** by closing time (A26) | GAP |

---

# Part 5 — Request-to-book (`bookingMode`)

| # | Case | Expected | How |
|---|---|---|---|
| 5.1 | Vendor sets mode | Three options; saves; server confirms | AUTO |
| 5.2 | Default `null` | Reads as `instant`; no live venue changes on deploy | UNIT |
| 5.3 | CTA in request mode | **"Send request"**, not "Pay & confirm" | AUTO |
| 5.4 | No payment before acceptance | Request-sent screen; nothing charged | AUTO |
| 5.5 | Booking created unapproved | `Awaiting Payment`, `vendorApprovedAt` null | API |
| 5.6 | Card on `/dashboard/bookings/[id]` | Renders — regression = vendor lands with no way to accept | AUTO |
| 5.7 | Card in the list side-sheet | kebab → Quick view | AUTO |
| 5.8 | **Accepting does NOT confirm** | Stays `Awaiting Payment`. Regression = a peak Saturday given away for Rs 0 | API |
| 5.9 | Advance becomes payable | `awaitingVendorApproval=false`, `amountDue>0` | API |
| 5.10 | Payment confirms | Advance recorded → `Confirmed` | MANUAL |
| 5.11 | Instant mode unchanged | Approve still confirms (BK-081) | API |
| 5.12 | Card hides after acceptance | Both surfaces; second click must not 400 | AUTO |
| 5.13 | UC-20 — venue declines | Reason reaches the customer; nothing charged | MANUAL |
| 5.14 | `inquiry_only` | No online booking; venue calls back | GAP |
| 5.15 | Multi-vendor cart | Waits on the **strictest** vendor | GAP |

---

# Part 6 — Quote / negotiation (UC-06, UC-21)

| # | Case | Expected | How |
|---|---|---|---|
| 6.1 | Customer opens an inquiry | `status=inquiry` | API |
| 6.2 | Appears in the vendor's list | | AUTO |
| 6.3 | Single-number quote | Legacy path unchanged | API |
| 6.4 | Itemised quotation | Total derived from lines | API |
| 6.5 | Worked example | 450k + 2,650×400 + 180k + 45k − 5% = **Rs 1,648,250** | UNIT + API |
| 6.6 | Percent line position-independent | Same total either order | UNIT |
| 6.7 | Positive "discount" refused | | UNIT |
| 6.8 | Negative charge refused | | UNIT |
| 6.9 | Per-head line, no guest count | Refused unless explicit qty | UNIT |
| 6.10 | Zero/negative total refused | | UNIT |
| 6.11 | **First quotation is v1** | | API |
| 6.12 | Vendor revision → v2 | | API |
| 6.13 | `validUntil` stored and shown | Both sides (A15) | API + AUTO |
| 6.14 | Expiry inclusive of the final day | | UNIT |
| 6.15 | Expired quote can't be countered/accepted | 409; Accept hidden | UNIT + AUTO |
| 6.16 | Vendor may re-issue on an expired quote | The documented recovery | API |
| 6.17 | Counter carries the document | Lines survive the round trip | API |
| 6.18 | Customer sees the lines | Not just a number | AUTO |
| 6.19 | Turn-taking | Only the party without the ball may move | UNIT |
| 6.20 | Owner scoping | Stranger gets 404, not 403 | UNIT |
| 6.21 | Site visit proposed | Either side | API |
| 6.22 | **Cannot confirm own proposal** | 409 | API |
| 6.23 | Counterparty confirms | | API |
| 6.24 | Visit runs alongside haggling | Does not touch quote status | API |
| 6.25 | **Accept creates a booking** | Regression = the deal evaporates | API |
| 6.26 | **Booked at the negotiated price** | Not the `minimumPrice` floor | API + UNIT |
| 6.27 | Booked on the quote's date and slot | | API |
| 6.28 | Date gone → clean failure | 409 `QUOTE_DATE_UNAVAILABLE`, quote stays open | MANUAL |
| 6.29 | Quote with no date | 409 `QUOTE_NO_DATE` | UNIT |
| 6.30 | Customer routed to pay | | AUTO |
| 6.31 | Deposit on a negotiated booking | Same rules as any other | UNIT |
| 6.32 | Discount reason + audit (A14) | Recorded against the quotation | GAP |

---

# Part 7 — Payment & custody (D-1)

A PSP may not hold consumer money (PEFTA 2007 / SBP PSO-PSP). The platform
**records**; the venue **collects**.

| # | Case | Expected | How |
|---|---|---|---|
| 7.1 | No placeholder IBAN | Venue's own published account | AUTO |
| 7.2 | Fallback names the venue's real contact | Not a hardcoded number | AUTO |
| 7.3 | Reference shown | `BK-<id>` | AUTO |
| 7.4 | Custody statement true | "we don't hold the money" | AUTO |
| 7.5 | **No Stripe claim in the venue flow** | Stripe does not onboard PK businesses | AUTO |
| 7.6 | Stripe badge kept where real | `booking-payment-screen.tsx` genuinely mounts `PaymentElement` | MANUAL |
| 7.7 | UC-07 — customer reports a transfer | Claim recorded; vendor confirms/rejects | MANUAL |
| 7.8 | Only verified accounts shown | `showToCustomers && isActive && isVerified` | UNIT |
| 7.9 | Methods offered | Bank transfer · Raast · IBFT · JazzCash · Easypaisa · Cash | AUTO |
| 7.10 | Chargeback warning | "keep your receipt" | AUTO |
| 7.11 | A17 — security deposit ≠ advance | Separate refundable line, own ledger | GAP |
| 7.12 | A24 — instalments | `BookingInstallment` | MANUAL |
| 7.13 | A22 — diaspora pays in USD/GBP (UC-16) | | GAP |
| 7.14 | A23 — post-dated cheque | | MANUAL |

---

# Part 8 — Settlement — **BUILT & VERIFIED LIVE**

When this was written, `settlementPolicy.js` was referenced in three comments
and called from nowhere: a venue could set every term below and nothing
computed a bill from them. It is now wired end to end — `bookingSettlementService`,
`GET /:id/settlement`, `POST /:id/headcount-lock`, `POST /:id/settle`, and the
vendor's settlement card — and every rule below is asserted against production
on the disposable QA venue. Architecture A2–A9; UC-09, UC-10, UC-14.

Two rows remain open and stay marked `GAP`.

| # | Case | Expected | How |
|---|---|---|---|
| 8.1 | Headcount lock at `headcountLockDays` | Count freezes; both sides see it | API · H-4 — locks, and the lock shows on both sides |
| 8.2 | **`bill = max(guaranteed, actual)`** (A2) | The core Pakistani rule | API · H-5 — 200 turn up against a 250 guarantee, billed 250 |
| 8.3 | Within tolerance (A3) | Normal rate up to `toleranceBandPct` | API · H-6 — 260 inside the 10% band, all at the agreed rate |
| 8.4 | Beyond the band (A4) | `walkInRatePerHead` | API · H-7 — 300 → 275 at Rs 2,500 + 25 at the Rs 3,500 walk-in |
| 8.5 | Count drops after lock (A5) | Guarantee still bills; shown at lock time | API · H-5 — guarantee still bills, and the line says why |
| 8.6 | Count rises after lock (A6) | Venue accepts at walk-in rate or refuses on capacity | API · H-7 — billed at walk-in; implausible counts refused (H-9) |
| 8.7 | Children (A7) | `childUnder5Pct`; come **out** of the stated total | API · A8-2 — 20 under-5 free, 10 aged 5–12 at half |
| 8.8 | Drivers / domestic staff (A8) | `staffMealRatePkr`; leave the head count | API · A8-5 — 30 staff leave the count, billed 30 × Rs 800 |
| 8.9 | Vendor crew meals (A9) | `crewMealCount` on the BEO | GAP |
| 8.10 | Fractions round up | Never against the venue | API · A8-7 — 420 adults + 1 half-plate = 421, rounded up |
| 8.11 | UC-09 — more guests than guaranteed | Walk-in arithmetic shown before the night | API · H-10 — the customer can read the arithmetic beforehand |
| 8.12 | UC-10 — fewer guests | Guarantee bills; no dispute at the door | API · H-5b — “the food was prepared for 250” |
| 8.13 | UC-14 — 421 vs 391 billable heads | Staff billed separately leave the head count | API · A8-3 — 421 stated → 361 adults → 366 billable |
| 8.14 | Cash settlement on the night (A25) | `confirm-cash` wired to settlement | GAP |

---

# Part 9 — Vendor registration & the rate card

`VENDOR-REGISTRATION-AND-SCENARIOS.md` — 12 steps in 3 phases. Everything set
at registration must also be editable in the portal (`VENDOR-PORTAL-...` §1.2).

| # | Case | Expected | How |
|---|---|---|---|
| 9.1 | A4 — "How do you charge?" fork | The most important screen; picks the shape | GAP |
| 9.2 | A5 — rate card pre-filled from A4 | | GAP |
| 9.3 | `RateCardLine` model | Replaces the `pricingShape` enum | GAP |
| 9.4 | Three `selection` values | required · optional · one-of | GAP |
| 9.5 | A7 — preview & publish (the pamphlet) | Same component as the detail page (§4.6) | GAP |
| 9.6 | Nothing is registration-only | Every field editable later | MANUAL |
| 9.7 | Package form: per-head/per-event radios | With live multiplication | AUTO |
| 9.8 | Settlement terms editable | All five fields save | AUTO |
| 9.9 | Booking rules editable | `bookingMode` saves | AUTO |
| 9.10 | Menu builder classification | Dish rows + `countsAs` | AUTO |
| 9.11 | Bank details published to customers | `showToCustomers` | MANUAL |
| 9.12 | Three-severity validation (§2.4) | Never a silent save | GAP |
| 9.13 | Dish library (§3.2) | Reuse across menus | GAP |
| 9.14 | Customer-choice groups (§3.3) | "pick 2 of 5" | GAP |

---

# Part 10 — Booking flow mechanics

| # | Case | Expected | How |
|---|---|---|---|
| 10.1 | Step gating | date + slot + guests before Continue | AUTO |
| 10.2 | Menu step dropped when no menus | Hall-only venue not forced through it | AUTO |
| 10.3 | Vendors step dropped when no bundled services | | AUTO |
| 10.4 | Requirements step never blocks | A full stop must not be a toll gate | UNIT |
| 10.5 | Free-text requirement stored verbatim | Urdu exactly as typed (UC-14) | AUTO |
| 10.6 | Requirements visible to both parties | One component, two roles | MANUAL |
| 10.7 | Adaptive step engine from rate-card groups (§5.1) | | GAP |
| 10.8 | Slot hold on date select | 15-minute hold; auto-release | AUTO |
| 10.9 | Hold failure surfaced | Date cleared, told why | MANUAL |
| 10.10 | UC-24 — two families race a peak Saturday | Hold decides; loser told immediately | GAP |
| 10.11 | Guest count outside capacity | Refused with the real limit | UNIT |
| 10.12 | UC-17 — small Nikah in a big marquee | Min guarantee makes the real cost visible | MANUAL |
| 10.13 | UC-15 — ladies-only function | Requirement captured; `genderMode` on the space | GAP |
| 10.14 | UC-18 / UC-19 — corporate dinner, soyem | Non-wedding event types priced the same way | GAP |
| 10.15 | UC-04 — three-event umbrella | Bundle discount across events | MANUAL |
| 10.16 | UC-22 — rain on an open lawn | Backup-space plan surfaced | GAP |
| 10.17 | UC-08 — advance moves to a new date (A20) | **The PK norm** — credit ledger, not a refund | API · I-1…I-4 — refused beyond the window, date unchanged, message names the last workable date |
| 10.18 | UC-23 — damage vs deposit (A18) | `DamageClaim` with photos | GAP |

---

# Part 11 — Safety rails for testing on production

| # | Case | Expected |
|---|---|---|
| 11.1 | Test venues hidden | Name matches **both** `%zzz qa%` and `%safe to delete%`. `submitted` status alone does **not** hide a business |
| 11.2 | Verify hidden **before** driving | Check the public catalogue first, not after |
| 11.3 | Bookings cancelled | Every test booking ends `Cancelled` |
| 11.4 | `bookingMode` restored | `null` on all owner venues |
| 11.5 | Test packages deleted | No `zzz qa` rows left |
| 11.6 | Real data untouched | Booking 173 still `Confirmed` |
| 11.7 | Never guess a selector | Read the gate first — e.g. `getIsStepValid` |
| 11.8 | Headed only | `headless: false`; the owner watches |
| 11.9 | Probe failures are suspect first | Four "failures" this programme were harness bugs, not defects |

---

## Known-red before this work

- `zeroPriceGuard` › "still floors at minimumPrice" — Expected 220000, Received 50000
- `refundPolicyEngine` › `calcRefund` — 5 failures
- `collabPhoneMatch` › `PLAN_CATALOG` — 2 failures

Verified identical on clean `main` by stashing. **8 failures, 3 suites.**

---

## Coverage summary

| Part | Built & tested | Specified, not built (`GAP`) |
|---|---|---|
| 1 Pricing shapes | 6 | 3 |
| 2 Detail page | 22 | 3 |
| 3 Double-charge | 9 | 0 |
| 4 Compliance | 17 | 3 |
| 5 Request-to-book | 13 | 2 |
| 6 Quote pipeline | 31 | 1 |
| 7 Payment | 11 | 3 |
| 8 **Settlement** | **0** | **14** |
| 9 Registration | 6 | 8 |
| 10 Booking mechanics | 8 | 10 |

Settlement is the largest untouched block and the one with real money attached.
