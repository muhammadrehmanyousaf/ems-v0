# Booking Flow Assessment — Real-World Pakistani Venue Booking

**Date:** 2026-08-23
**Scope:** `ems-v0` (Next.js frontend) + `ems-v0-backend` (Express/Sequelize API)
**Question asked:** *Is the venue booking flow 100% OK for real-world venue booking in Pakistan?*
**Companions:** `PK-VENUE-PRICING-RESEARCH.md` (per-head / package / menu) ·
`VENUE-BOOKING-ARCHITECTURE.md` (registration → completion, full edge-case catalogue)

**Short answer:** The **mechanics are excellent** — arguably the strongest-engineered part of the
system. The **commercial model has real mismatches** with how a Pakistani marquee/banquet actually
sells a date. These are not bugs; they are product-shape decisions that need to be made
deliberately.

---

## 1. What the flow actually is today

### Customer journey (venue path)

Source: `components/booking/booking-form.tsx:668-689`

```
Event Selection
  -> Date & Time      (15-min DateHold)
  -> Additional Vendors
  -> Packages
  -> Menu
  -> Review
  -> Pay advance
  -> Confirmed
```

### Server side

Source: `src/controllers/bookingController.js:136` -> `bookingCreateService.createBookingCore`

```
validate (past-date, slot vocabulary, service-location)
  -> OPEN TRANSACTION
  -> pg_advisory_xact_lock(date, business)     WW-299
  -> per-business conflict check (FOR UPDATE)
  -> slot-template capacity check              BK-008/015/019
  -> blocked-date / closure check              DATE_BLOCKED
  -> BookingSpace claim (hall-level)
  -> hold conversion
  -> COMMIT
  -> post-commit fan-out (emails, notifications, customer link)
```

Pay the advance -> `bookingController.js:3243` flips status to **`Confirmed` automatically**.
The vendor acknowledges *afterwards* (`acknowledgeBooking`, BK-060), with escalation if they don't.

**That is an Airbnb instant-book model.** Pakistani venue selling is not instant-book.

---

## 2. Findings, ranked by real-world severity

### P0 — The money rail does not exist in Pakistan

| Rail | Status |
|---|---|
| **Card (Stripe)** — the **default** method | Stripe does not onboard Pakistani businesses. A Lahore marquee cannot receive this money. |
| **JazzCash / Easypaisa** | Scaffolds. Return `{ ok: false, reason: "not_configured" }`. Documented in `lib/payment-flags.ts`. |
| **Bank transfer** — the rail ~90% of real advances use | Only reachable **above Rs 999,999** (`booking-form.tsx:557`), and shows **hardcoded dummy account details** (`0123-4567890-001`, `PK36HABB0000000123456789`) plus a hardcoded WhatsApp number — `components/booking/steps/bank-transfer-screen.tsx:17-19`. |
| **Cash** | Works (`/bookings/:id/confirm-cash`). Honest `cash_reserved` outcome. Good. |

> **Correction (2026-08-23):** I first wrote that per-venue bank details don't exist. They do.
> `VendorBankDetails` + `bank-accounts-manager.tsx` are complete, with PK IBAN validation and a
> deliberate exclusion from the localStorage draft layer. The real defect is narrower: those details
> exist for **payouts** (platform → vendor) and are **never surfaced to the customer** — `grep` for
> `bankAccount` in `components/booking/` returns nothing. The customer sees a *platform* account,
> and that account is a placeholder. **Which fix is right depends on decision D-1** (collect vs
> record): if the platform collects, the platform account merely needs to be real; if the venue
> collects, surface `VendorBankDetails`. See `VENDOR-PORTAL-AND-SETTINGS-REGISTRY.md` Part 2.

**Impact:** The entire flow terminates in a payment step that cannot move money from a Pakistani
customer to a Pakistani venue. Everything upstream is theoretical until this is resolved.

**Also a live hazard:** the placeholder IBAN is shown to real customers on any booking over
Rs 999,999. Those are exactly the bookings worth defrauding.

---

### P0 — Auto-confirm on advance is the wrong gate

No marquee owner lets an unknown online user lock a December Barat date without a phone call.
Research confirms peak-season dates are negotiated 8–12 months out and are the venue's scarcest
asset.

The vendor-ack machinery **already exists** — it is simply on the wrong side of the payment.

- **Real sequence:** inquiry -> site visit -> negotiation -> **vendor says yes** -> advance
- **Current sequence:** advance -> auto-`Confirmed` -> vendor acks

---

### P1 — No site-visit or quotation path

`orderStage: tentative | quotation | confirmed | postponed | cancelled` exists on
`src/models/bookingModel.js` (Phase-1 SPINE) but the **customer flow never exposes it**.

`VendorInquiryDialog` fires only as a dead-end fallback for *unpriced* vendors
(`booking-form.tsx:1043`). For venues, **inquiry should be the front door, not the error handler**.

Competitor confirmation: Hamara Venue's marquee pages say *"Confirm Availability Via Call"*.
MarqSuite (PK venue software) models **Inquiries as a first-class pipeline** — source, status,
venue, slot, guest count, follow-up date — that *converts* to a booking.

---

### P1 — The price on the Review step is not the price the customer pays

`components/booking/steps-v2/review-step.tsx:107`

```ts
const baseTotal = pkgPrice * qty + menuPrice   // + add-ons. That's it.
```

**Missing from the customer-facing quote:**

| Cost | Real magnitude (2026) |
|---|---|
| Sales tax on services | Punjab (PRA) **8%** on marriage halls/catering (raised from 5%); federal GST on commercial event services reported at **18%**; Sindh (SRB) separate |
| Service charge | commonly 5–10% |
| Security / damage deposit | typically Rs 25,000–100,000, refundable |
| Generator / fuel surcharge | **Rs 40,000–120,000 per event**, May–Sep — "now a standard line item" |
| Kitchen access fee (outside caterer) | **Rs 50,000–100,000** |
| Décor / stage | **Rs 100,000–600,000+** — "almost always a paid add-on, not part of base price" |
| Valet / parking | Rs 15,000–40,000 |
| Extra hours / overtime | venue-specific |

One cited example: a quoted **PKR 3,500/head becomes ~PKR 4,230/head after GST + service charge** —
on 500 guests that is **PKR 365,000 extra**.

The infrastructure exists (`taxProfileModel`, `taxRuleModel`, `fbrProvider`) but lives entirely in
the VenueOS back-office and never reaches the customer quote.

**This single gap will generate more disputes than every race condition in the codebase combined.**

---

### P1 — Cancellation policy is never shown at the moment of payment

The server correctly snapshots `cancellationPolicySnapshotJson` at creation so later vendor edits
can't rewrite history — genuinely good. But the Review step never renders it. Grep for
`cancellationPolicy` in `components/booking/` returns exactly one hit, in the legacy `preview-step`.

Pakistani reality (verified across venues): advances are typically **non-refundable** or
adjustable-only. Decorium states plainly: *"A non-refundable advance deposit of Rs. 100,000 is
required to secure your date."* Karachi venues range from non-refundable (Maham Banquet) to
partially refundable (Largesse, Rani Mahal).

Taking money without showing the term is both a trust problem and a legal one.

---

### P2 — Phone verification is `warn`, not `block`

`src/middlewares/requirePhoneVerifiedForBooking.js` defaults to `warn` because no SMS provider is
wired (`/auth/phone-otp/request` -> 503 `not_configured`).

The reasoning in that file is **correct and well-argued** — a door with no key is an outage, not
security. But the consequence stands: an unverified phone number can hold and confirm peak dates.
For venues, unverified-phone bookings are the single largest no-show source.

---

### P2 — WhatsApp is not a channel

Email dispatch (C1/C2/C3 + outbox + templates) is thorough and **largely irrelevant to this market**.
Pakistani couples and marquee managers transact on WhatsApp. MarqSuite stores WhatsApp as a
first-class customer field. EventsBooking.pk sends confirmations *"via email or WhatsApp"*.

One hardcoded number on a bank-transfer screen is not integration.

---

### P2 — Package cannot be priced per-head

`src/models/package.js` has `price` but **no `pricingUnit`** and **no `minGuaranteeCount`**.
`src/models/menu.js` has both.

`review-step.tsx:102` sets `qty = 1` for venues, so **a venue package is always a flat per-event
price**. The dominant Pakistani model — *"Gold Package Rs 3,500/head, all-inclusive"* — cannot be
expressed. Full analysis and proposed fix in **`PK-VENUE-PRICING-RESEARCH.md`**.

Also: `menu.price` is `DataTypes.FLOAT` while every other money column was migrated to
`NUMERIC(12,2)` under PA-009. Money as float, in the one place per-head multiplication happens.

---

## 3. What is genuinely strong — do not rebuild these

- **DateHold concurrency**: `pg_advisory_xact_lock` + `FOR UPDATE` + per-user quota + captcha
  escalation. The WW-299 comment documents 12/12 observed live double-bookings before the advisory
  lock. This is correct, hard-won work.
- **Per-business time resolution** for mixed carts (SLOTS step 11) — lifting `MIXED_SLOT_MODE` and
  `RACE-3` was done with real rigour.
- **`slotTemplateSnapshotJson`** — a vendor lowering capacity can't retroactively change what an
  existing booking was made against.
- **`cancellationPolicySnapshotJson`**, `bundleDiscountSnapshot`, `platformFeeSnapshot`,
  `umbrellaBundleSnapshotJson` — consistent snapshot discipline so the refund engine can never
  refund more than was charged.
- **Wedding Umbrella** (BK-100.2) — mehndi / barat / walima as linked events with bundle tiers.
  Correct model for this market.
- **Postpone-without-cancel** (BK-100.9) for Islamic mourning. Genuinely thoughtful and PK-specific.
  Nothing else in the market does this.
- **Compliance warnings** — one-dish policy, legal guest cap, closing time
  (`date-time-step.tsx:409-428`). Advisory, never blocking. Exactly right, and directly relevant:
  May 2026 saw late-night raids sealing marquees in Islamabad over one-dish violations.
- **Space-level `fireRatedCapacity` vs `comfortCapacity`** — legal occupancy separated from the
  vendor's seated-comfort figure.
- **`payoutEligibleAt`** — payout gated to `bookingDate + dispute window`, so the vendor can't cash
  out before the customer's dispute window closes.
- **Soft-delete + append-only `BookingStatusHistory`**.
- **Honest scaffolds** — `payment-flags.ts` and `requirePhoneVerifiedForBooking.js` both refuse to
  fake a working feature. That discipline is rarer than the code quality.

---

## 4. The structural question underneath all of this

The booking flow is built as a **consumer marketplace**: instant book, platform collects payment,
platform retains a fee.

The deep parts of the repo — VenueOS, chart of accounts, BEO, kitchen BOM, event P&L, FBR/PRA
providers, payroll, month-end close — are built as **venue back-office software**.

Those are two different products and they want two different booking flows:

| | Marketplace | Back-office (VenueOS) |
|---|---|---|
| Advance | platform **collects** | venue collects, system **records** |
| Confirmation | instant on payment | on advance *received*, marked by staff |
| Front door | Book Now | Inquiry -> Quotation |
| Payment rails | needs a working gateway | needs a receipt ledger |
| Tax | platform invoice | PRA/FBR fiscal invoice with QR |

Pakistani competitors (Sum Cloud POS, iTech, MarqSuite, Nizi, SolutionsPlayer) are **all
back-office**. Note also that PRA requires venues earning Rs 6M+/yr to register and submit a
**real-time fiscal invoice on every advance and final payment**, with QR code and CNIC capture on
payments over Rs 1,000 (Amanat Scheme). A marketplace that collects the advance sits *inside* that
obligation.

---

## 5. Decisions needed (in order)

1. **Does the platform *collect* the advance, or *record* an advance the venue collects?**
   This one answer resolves P0-money, P0-auto-confirm, and P1-cancellation-policy at once.
2. **Per-listing choice: instant-book vs request-to-book?** (Venues will want request-to-book for
   peak dates and instant for off-season weekdays.)
3. **Does the customer-facing quote include tax + deposit + extras, or is it explicitly a
   "starting from" price?** If the latter, say so on the Review step in words.
4. **Is a package per-head or flat?** — see `PK-VENUE-PRICING-RESEARCH.md`.

> The live decision log for all of the above is **`PK-VENUE-PRICING-RESEARCH.md` PART 13**.
> The plain-language answer to "per plate vs package vs menu" is **PART 12** of the same file.

---

## Sources

- [Best Marquees in Lahore: 2026 Prices & Hidden Costs Guide](https://pakbestfinds.com/best-marquees-in-lahore/)
- [Decorium Luxury Marquee, Islamabad](https://decoriumplmarquee.com/)
- [MarqSuite — Venue booking software, Pakistan](https://marquee-management-qzrb.vercel.app/)
- [Sum Cloud POS — Banquet Hall POS, PRA eIMS integrated](https://sumcloudpos.com/banquet-hall-pos-software.html)
- [Hamara Venue — Elite Marquee Lahore](https://hamaravenue.com/elite-marquee/dha-phase-8-ex-park-view-block-f-gate-lahore/wedding-marquee)
- [Arranging a wedding in Pakistan 2025 — Neemopani](https://neemopani.com/arranging-a-wedding-in-pakistan-2025/)
- [One-Dish Policy: Islamabad Wedding Hall Crackdown 2026](https://www.pakistantruth.com/one-dish-policy/)
- [Punjab Sales Tax on Services rates 2026-27](https://conseric.pk/punjab-sales-tax-on-services/)
- [Shadiyana — Wedding Venues Pakistan](https://www.shadiyana.pk/list/wedding-venues)
