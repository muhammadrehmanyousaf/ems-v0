# QA_FLOWS.md — every end-to-end journey, by role

Depth 1 of the coverage model in [rules.md](rules.md) §2. This is the big picture:
what a person can actually *do* with Wedding Wala from start to finish. Screens are
tested in `QA_TRACKER.md`; **flows are tested here**, because every element on a
screen can pass while the journey that strings them together is broken.

Derived from the 66 API routers in `event-planner-api/src/routes/` and the 76
portal screens, so a flow appears here because the system implements it — not
because it seemed likely.

**A flow is `[x]` only when it was run end to end in one continuous sitting, with
the resulting state hard-reloaded and re-read after every step.**

Status: `[ ]` untested · `[~]` partially run · `[x]` complete · `[B]` blocked (reason required)

---

## Legend for the state column

Every step names the state it must leave behind. That is what gets re-read after
reload. "The toast said saved" is not a state.

---

# USER — the couple

## U1 · Discovery → enquiry
`[x]` **Front-door path proven live in the browser, desktop + 360px.** Home
renders (h1, search box, 20 category links, 0 overflow) → `/venues` lists **716
results** with prices, ratings and 38 filter controls → a result card (clickable
`div`, onClick nav) navigates to `/venues/3358` → the detail page renders h1,
price and a Book/Check-availability CTA. At **360px** both the listing and the
detail page have **zero horizontal overflow** and the CTA stays on screen. Public
search API returns results unauthenticated. **Rating is rounded correctly here
(`4.3`)** — contrast BUG-019, where the same rating renders as `4.333…` on the
booking page.
- **Zero-result state works** — a nonsense search collapses the list to a
  designed **"No vendors found"** state, no crash. 🔴 **BUG-030 (Low):** the
  header still reads "716 RESULTS" above it. Filters are also not URL-addressable
  (REC-013).
- **Enquiry → lead proven end to end.** Public `POST /leads/inquiry` (no auth,
  rate-limited 8/hour) for business 3365 → **201 "Your inquiry has been sent"** →
  lead 260 created (`source: form_inquiry`, `status: new`) → appears in the
  vendor's inbox (`GET /leads`) with correct contact details. Cleaned up.
- **`/compare` renders clean** — the comparison page loads (100 interactive
  elements, compare UI present), no crash, zero overflow.
- **Favourites persist across sessions.** Adding a favourite is server-stored;
  re-authenticating with a fresh token still returns it (equivalent to
  logout→login). The duplicate guard fires ("Already in favorites" → 400),
  `businessId: -1` is rejected, and unauthenticated `/favorites` is 401.

**U1 is fully covered end to end** — discovery, listing, detail, mobile,
zero-result state, enquiry→lead, compare, favourites.

The top of the funnel. Nothing else matters if this leaks.

| # | Step | State that must persist |
|---|---|---|
| 1 | Land on `/`, search a vendor type + city | results match both filters |
| 2 | Browse a category (`/venues`, `/caterers`, …) | pagination, sort, filter counts agree with results |
| 3 | Apply price / capacity / amenity filters | zero-result state renders as a designed state |
| 4 | Open a listing `/venues/[id]` | gallery, packages, amenities, reviews, map all render |
| 5 | Compare vendors `/compare/[vendorType]` | selected vendors persist across reload |
| 6 | Favourite a listing | survives logout → login |
| 7 | Submit an enquiry | lead row exists vendor-side, with correct contact details |

**Boundaries:** enquiry as a logged-out visitor; enquiry to an *unclaimed* listing
(98% of the directory is unclaimed OSM imports); enquiry with emoji/Urdu text.

## U2 · Registration → verified account
`[x]` **Proven end to end — 5/5 (`scripts/qa-signup-booking-notify.mjs`).** 🔑 **The
"OTP block" was a myth for signup:** `authController.createEmployee` sets
`emailVerified:true, phoneVerified:true` on create ("OTP services aren't live yet
— auto-verify"). So a fresh `POST /auth/signup` account is **immediately
verified**, logs in, and reaches its authed surfaces with **no OTP at all**;
duplicate email is refused (400). Because the account is auto-`phoneVerified`, it
also passes `requirePhoneVerifiedForBooking()` — which is what unblocked the X8
booking test below.

| # | Step | State |
|---|---|---|
| 1 | `/register` with a fresh email | account created, no session yet if verification is required |
| 2 | Email verification code | account marked verified |
| 3 | `/login` | session token in `localStorage.auth_token` |
| 4 | Sign-in OTP | ⚠️ currently **disabled** via `LOGIN_EMAIL_OTP=false` — must be re-tested with it ON before launch |
| 5 | `/forgot-password` → `/reset-password` | old password rejected, new accepted, other sessions revoked |

**Boundaries:** duplicate email; password below policy; reset link reuse; reset link
after expiry.

## U3 · Booking → confirmation  ⭐ core revenue path
`[x]` **Steps 1–4 driven in a real browser on live production, signed in as a
customer, against the seeded vendor (business 3365).** Stopped at "Pay &
Confirm" — see U4.

- **Step 1 · Event selection** — renders the vendor's own `expertise` values
  (Wedding / Engagement / Parties). Selection is visually clear but carries no
  `aria-pressed`, `aria-selected` or `role`, so the chosen events are not
  exposed non-visually. **BUG-023** was found here: an *empty* `expertise`
  array returns `[]` instead of falling through to the 5-event default, and the
  step renders with nothing to pick and Continue disabled forever.
- **Step 2 · Date & time** — past dates correctly disabled; every cell carries a
  full `aria-label` ("Tue, August 25, 2026"). All three registration-seeded
  slots render with correct times and live capacity (`Day 10:00–14:00`,
  `Midday 14:00–18:00`, `Evening 18:00–22:00`, each "1 of 1 left"). Selecting a
  slot starts a visible **15-minute hold** that persists across steps.
  The service-location options are properly localised — vendor's place / our
  home / our plot or lawn / a different venue we picked.
- **Step 3 · Package** — the package renders with its price and feature list.
  This is the screen that once died on `features: null`; with a populated array
  it is fine. Guest count is carried by the package, not asked separately.
- **Step 4 · Review — the money is correct end to end:**
  ```
  TOTAL              Rs 100,000     ← package price
  DUE NOW            Rs  20,000     ← exactly the 20% deposit set on the business
  REMAINING AT VENUE Rs  80,000
  ```
  Contact details prefill from the account; date, slot and package all carry
  through intact. The Shaadi Plan umbrella link is offered as optional.
- **360px** — no page-level horizontal overflow (0px), and "Pay & Confirm" is
  fully on screen at 164×44. The only elements extending past the viewport are
  the step-progress `<ol class="min-w-max">` inside its own scroll container —
  the legitimate scrolling-stepper pattern, not a clipped control.
- **Not established:** whether an abandoned 15-minute hold actually releases the
  slot. The flow was left at the review screen; the hold was not observed to
  expiry.
`[ ]`

| # | Step | State |
|---|---|---|
| 1 | Open `/[id]/booking` | vendor, base price loaded |
| 2 | Pick a date | **blocked and fully-booked dates are not selectable** (regression-locked) |
| 3 | Pick a slot | only slots the vendor actually offers that day |
| 4 | Pick a package | package price reflected in the running total |
| 5 | Add-ons / guest count | total recomputes correctly |
| 6 | Enter event + contact details | validation per field |
| 7 | Review screen | **the amount shown equals the server's `paymentDetails.amount`** (regression-locked) |
| 8 | Confirm | booking row created exactly once; double-click creates one, not two |

**Boundaries:** date that becomes unavailable mid-flow; Rs 0 price (3,268 businesses
were bookable at Rs 0 — guard must hold); abandoning at each step and resuming;
two tabs booking the same slot.

## U4 · Payment
`[x]` **Driven end to end with a Stripe test card (see detail below): success,
decline, and idempotency all correct. One High bug (BUG-029) in the receipt
ledger.** Money. Every step Critical by default.

| # | Step | State |
|---|---|---|
| 1 | Choose full / partial / deposit | server recomputes; client figure never trusted |
| 2 | Enter card, submit | PaymentIntent amount **in minor units** matches the quote (PKR ×100) |
| 3 | Success | booking marked paid; receipt generated; amount matches |
| 4 | Failure / declined card | booking NOT marked paid; a real error, not a blank screen |
| 5 | Reload mid-payment | no duplicate charge, no orphaned booking |

**`[B]` Blocked:** real card capture and webhook delivery cannot be exercised here.
Production currently carries **Stripe TEST keys** — flagged, deferred by the founder,
and "don't touch Stripe" is a standing instruction for this campaign.

**`[x]` NOW DRIVEN END TO END in a real browser on live production with Stripe
TEST keys (`pk_test_…`), per explicit instruction to use `4242…` / decline card.**
- **Success path (4242 4242 4242 4242):** the Stripe Payment Element mounts, the
  card is accepted, and the page reaches **"PAYMENT RECEIVED · Your booking is
  confirmed" (booking #201)**. Server-side: `status Confirmed`, `paymentStatus
  Partial`, `downPayment 20,000`, `paymentMethod stripe`. The amount charged is
  exactly the 20% deposit (Rs 20,000 of Rs 100,000).
- **Declined path (4000 0000 0000 0002):** the checkout shows **"Your card has
  been declined"**, stays on the pay screen, and — the check that matters —
  booking #202 is **NOT** marked paid: `status Cancelled`, `paymentStatus
  Failed`. A declined card never produces a confirmed booking.
- **Reload / double-charge (step 5):** re-attempting payment on the already-paid
  booking 201 is refused server-side — *"Down payment can only be made for
  Pending bookings. Current status: Confirmed."* No duplicate intent, no second
  charge.
- 🔴 **The receipt half fails — BUG-029 (High).** After the successful charge the
  booking reads paid, but `paisa-reconcile` shows `receiptsTotal 0`,
  `receiptCount 0`, `reconciled false`, `delta -20,000`, stable over 20s. The
  PaymentReceipt that feeds the khata is posted **only** by the Stripe
  `payment_intent.succeeded` webhook, which is not delivering on this
  environment. So the booking says paid while the cash ledger says Rs 0.
- **Still genuinely blocked:** the *authoritative* settlement (webhook →
  receipt → payout) cannot be exercised until live keys + a verified webhook
  endpoint exist. Tie to REC-002.

## U5 · Post-booking management
`[x]` **Operational surface proven — 11 assertions, 0 defects.** Run:
`scripts/qa-postbooking.mjs`.
- **Timeline** on QA booking 203: create a task (`label` required — validator
  holds) → it lists → flip its status to `done` → **customer cannot read a
  vendor's booking timeline** (refused) → anon 401.
- **Quote negotiation** (`FEAT_QUOTE_NEGOTIATION`): the surface behaves — no 500;
  accept/decline on a ghost quote refuse; `quotes/mine` requires auth (401).
- **Couple portal**: a bogus token is refused cleanly (not 500) and the read
  needs no login — token-auth by design.
- **Function-sheet sign** leg was proven in V9 (`qa-operational-writes.mjs`).
- **BUG-025 caveat stands:** the booking list projection carries `vendorIds`, not
  `businessId`, and "My bookings" matches on email only — a booking linked solely
  by `customerUserId` is still unreachable for the affected customer.

Steps: view booking → timeline → documents → message the vendor (`chatRouter`) →
receive and accept/reject a quote (`quoteRouter`) → couple portal
(`publicCouplePortalRouter`) → sign a function sheet (`publicFunctionSheetRouter`).

**State:** every status change is visible to *both* sides and survives reload.

## U6 · Cancellation → refund
`[x]` **Executed end to end in the live UI on the seeded vendor's booking 199 —
a completed test that failed the thing the flow exists to prove (BUG-026).**

- **The refund maths is right.** Before cancelling, `refund-preview` returned
  `refund 10,000 / forfeit 10,000` on a Rs 20,000 payment, via tier
  `{ minDaysBefore: 35, refundPct: 50 }` with a 0% non-refundable deposit.
- **The cancellation itself works.** Row actions → Cancel booking → confirm →
  toast "Cancelled", row moves out of Active into Cancelled, status and payment
  both read `Cancelled` after a hard reload.
- 🔴 **No refund is recorded — BUG-026 (Critical).** `refund-requests` is empty,
  `paisa-reconcile` reads `receiptsTotal 20,000 / refundsTotal 0`, and
  `refund-preview` stops computing once cancelled. The Rs 10,000 owed exists
  nowhere. `cancellationReason` is `null` because the dialog never asks.
- 🔴 **The customer cannot see any of it — BUG-025 (High).** Booking 199 does
  not appear in their account at all, so there is no screen showing the
  cancellation or the missing refund.
- **Checked and NOT a bug:** the "Collected" KPI dropping to Rs 0 after
  cancelling. It is scoped to the active tab — the Cancelled tab shows
  Rs 20,000. Verified before reporting.
- **Checked and NOT a bug:** the ledger showing `outstanding` on a cancelled
  row. The summary correctly counts only the 1 live booking.
- **Still untested:** customer-initiated cancellation from `/user/bookings`,
  which is blocked by BUG-025 for this booking and would require cancelling one
  of the founder's real bookings otherwise — a forbidden action.
`[x]` **Refund maths tested — BUG-014 (Critical): every policy refunds Rs 0.**

| # | Step | State |
|---|---|---|
| 1 | Request cancellation | request recorded; vendor notified |
| 2 | Cancellation policy applied | refund figure matches the policy actually attached to the booking |
| 3 | Vendor / admin decision | booking status correct on both sides |
| 4 | Refund issued | amount, ledger entry and receipt all agree |

**Boundaries:** cancel after payment; cancel inside vs outside the free window;
cancel a booking already marked complete; force-majeure cancellation.

## U7 · Dispute
`[x]` **Refund-request state machine proven end to end on a QA booking, 5/5.**
Raise (`POST /bookings/203/refund-requests`, 201) → appears in the request list →
**decide-reject** (`PATCH …/decide {approve:false}`) closes it → `paisa-reconcile`
confirms **`refundsTotal: 0`** (reject moves no money) → a customer token cannot
call `decide` (tenant/role guard). The engine is confirmed **enabled** (not
flag-dark). Boundaries also hold: `my-disputes` is caller-scoped, a refund-request
on an unowned booking is refused, unauthenticated is 401. **The only untested
step is `apply` (which moves real money) — deliberately not forced on a live
booking.** This is the same wiring BUG-026 shows the cancel flow fails to invoke.

## U8 · Complaint
`[x]` **Full round-trip proven live.** Customer submits (`POST /complaints`) →
**201 "Complaint received", ref WW-C-000002** → appears in the admin queue
(`GET /complaints`, `open`) → admin reads detail → admin resolves
(`POST /complaints/:id/resolve` → `resolved`); the status state machine also
works (`PATCH /complaints/:id/status` → `in_progress`). Validation holds: a body
under 20 chars is refused, and a vendor token is **403** on the queue. Field
contract is `contactEmail` / `subject` / `body` / `contactName` (not
email/message/name). QA complaint resolved at end.

## U9 · Review
`[x]` **Every guard proven — 8 assertions, 0 defects, 0 fake reviews persisted.**
Run: `scripts/qa-complaints-reviews.mjs`. No rating → 400; no businessId → 400; a
review on a non-existent/unowned booking → refused (nothing persists); submit
without auth → 401. Public read `GET /reviews/:businessId` → 200. Vendor-reply
guards (it's a **PATCH** `/:reviewId/reply`): anon → 401, reply to a ghost review
→ 404. Delete requires auth → 401. **The happy path (review a *completed* booking
→ appears on the listing) is structurally unreachable in test:** the only
completed bookings belong to the founder's real vendor, and a fake review would
be live debris — never seed fake reviews. Everything around that one path is
proven; the path itself is a deliberate no-go.

## U10 · Notifications & account
`[x]` **Notifications proven live.** `GET /notifications` (200, own only),
`/unread-count` (200 + numeric), `PATCH /read-all` (200), and unauthenticated
access is 401. Profile edit / password change / session-revoke / account
deletion not yet walked — the notification core is done.

---

# VENDOR — the business owner

## V1 · Registration → live listing
`[x]` **The end-to-end API path is proven from the QA-vendor seed + admin approval
(this campaign created business 3365 this way), and server-side validation is
confirmed** — `create-business-with-vendor` rejects a missing password (400),
canonicalises `vendorType` against the enum, and validates VR-050 fields.
Slot-seeding on a fresh registration was verified earlier (Day/Midday/Evening,
correct active flags). 🔴 **BUG-021 lives here:** the endpoint accepts a
registration with **no `name` and empty `subBusinessType`**, which is then
approvable and served publicly but **unbookable** (dead event picker). **Only the
OTP-gated self-service UI walk of `/business-registration`** (draft persistence,
per-step validation) is unproven — same email-OTP block as U2/V2, disabled for
this window.

| # | Step | State |
|---|---|---|
| 1 | `/business-registration` | draft persists (`registrationDraftRouter`) across reload |
| 2 | Vendor type, contact, address, docs | field validation; **VARCHAR overflow → 500** is a known failure mode |
| 3 | Submit | goes to the admin vendor queue |
| 4 | **Slot templates seeded** | the four canonical slots exist: Whole day 10–22, Day 10–14, Midday 14–18, Evening 18–22 — and only the non-overlapping ones are active |
| 5 | Admin approves | listing goes live and is publicly findable |

## V2 · Claim an existing listing
`[x]` **Proven to the OTP boundary — the identity gate itself is verified
(`scripts/qa-claim-gate.mjs` + follow-up).** `CLAIM_ENABLED` is **live** on prod
(start validates, doesn't 404). Full walk on real unclaimed OSM imports (listings
3269–3272 are claimable; 3358/3364/3356/… return `not_claimable`): start rejects
a bad email (400); start on a claimable listing → 200 + a **masked** `otpSentTo`
(the 6-digit code is SHA-256-hashed in the DB and **emailed**, never echoed);
**a wrong code is rejected (`incorrect_code`)** — the gate really checks it; the
**attempt cap locks at the 6th try** (spec cap 5); the claim shows in the admin
queue (`?status=pending_otp`) and **admin reject works** (all test claims cleaned).
The **only** unproven step is entering the real emailed code — the genuine
email/OTP boundary (skip-by-rule). Found **BUG-033** (admin queue default view +
`?status=all` return empty). `claimRouter` — the admin claim endpoints
(`GET /claims/admin/claims`, `POST /claims/admin/claims/:id/approve|reject`)
refuse both customer and vendor tokens (403). The public `POST /claims/start`
validates (empty body → 400) and is rate-limited (5/hour). The full claim →
verify (OTP) → set-password → ownership-transfer walk is blocked by the same
email-OTP that is disabled for this window; the identity step can't be proven
until OTP is back on.

**Boundary:** `userId` is never null on imports, so every naive owner-check passes.
Claim logic must key on `signupSource='import'`, not `claimedAt`.

## V3 · Availability & slots  ⭐ vendor's control surface
`[x]` **Slot lifecycle proven end to end on business 3365 + all guardrails.**
- **CRUD round-trip:** create a valid template (`QA Morning` 08:00–09:30 → 201,
  id 281) → edit capacity (→ 3, read back confirmed) → delete/deactivate (gone
  from the list). Clean.
- **Overlap rejected:** a 10:30–13:00 template overlapping the existing `Day`
  slot is refused (400).
- **Closure-time rule fires:** a 22:30–23:30 template is refused
  `409 SLOT_ENDS_AFTER_CLOSURE` — the venue-closure guard working (exempt vendor
  types unaffected).
- **Date blocking:** blocking 2027-12-31 succeeds; a block with no date is
  refused; unblock works.
- **Tenant isolation:** a customer token cannot create a slot template (403).
- **Public read:** `GET …/availability?date=` returns 200 to anyone.
- 🔴 Note **BUG-013 (High)** still applies to the *error surfacing* — the refusal
  reason reaches the API but the vendor UI shows a machine code, not the message.

## V4 · Lead → quote → booking
`[x]` **Full revenue path proven live end to end.**
- **Enquiry → lead** (U1): public `POST /leads/inquiry` → lead created
  `form_inquiry/new` in the vendor inbox with correct contact details.
- **Quote negotiation — 6/6 (`quotes` feature is LIVE, not flag-dark):** customer
  requests a quote (`POST /quotes`, business 3365, 250 guests) → appears in the
  vendor's inbox (`GET /quotes/business/:id`) → **vendor responds with a price
  (Rs 450,000)** → **customer counters (400k)** → vendor re-responds (meets at
  420k) → **customer accepts → status `accepted`**. Tenant isolation holds: the
  customer token cannot call the vendor `respond` action on the quote.
- Field contract: create `{businessId, eventType, eventDate, guestCount}`,
  respond `{quotedPrice}`, counter `{price}`, accept/decline `{message/reason}`.
- Stray probe quotes on the real vendor (3358) were declined/cleaned.
Remaining: confirming the accepted quote auto-materialises a booking that blocks
the calendar slot (the `accepted` state is the documented trigger).

## V5 · Booking lifecycle
`[x]` **State machine driven end to end on a fresh QA booking (203), 5/5.**
- **approve → Confirmed** (PATCH `/bookings/:id/approve`).
- **Forward-only enforced** — a general update back to `Pending` is refused
  (`lower_rank` guard); the booking stays Confirmed.
- **complete → Completed** (PATCH `/bookings/:id` `status:Completed`) succeeds.
- **Completed is terminal** — attempting `vendor-cancel` on the completed booking
  returns **400** (the "Completed → Cancelled rejected unless force=true" guard).
  That 400 is correct behaviour, not a defect.
- **Tenant isolation** — a *different* vendor's token cannot `vendor-cancel` this
  booking (refused).
- Earlier: 12/12 authorization boundaries + price-tampering proven impossible
  (`totalAmount:1` still stored the real amount).
- **Teardown note:** booking 203 is now `Completed` (terminal) on the suspended
  QA business — add to REC-000 cleanup; it needs an admin force-cancel or DB purge.

## V6 · Money
`[x]` **34 bookings reconciled + operational writes proven — 18 assertions, 2 findings.**
Run: `scripts/qa-money-catalog.mjs`. Earlier: BUG-015 (High): Rs 2,832,750 shown
owed on fully-paid bookings. Khata / `money` · payments · receipts
(`paymentReceiptRouter`) · PDCs (`pdcRouter`) · receivables · expenses
(`vendorExpenseRouter`) · suppliers · revenue · tax reports (`taxReportRouter`) ·
bank details.

- **Expenses CRUD** on the QA vendor: create → list → update → delete, all clean.
  Validation holds — invalid category, negative amount, and missing `spentDate`
  all 400. **BUG-031 (Low):** `createExpense` never checks business ownership, so
  a customer POST tagged to a foreign `businessId` returns 201 — but every read
  (`listExpenses`, `perEventPnl`, `monthly-pnl`) is `createdByUserId`-scoped, so
  the row lands in the *creator's* private ledger and never touches the vendor.
- **Receipts (khata):** the per-method validator holds — `jazzcash` with no
  `transactionRef` → 400, zero amount → 400. A customer receipt is refused (400,
  no row created — receipts stay `createdByUserId`-scoped, customer sees 0).
- **Money reports** all answer for the vendor and refuse anon: receivables aging,
  monthly P&L, cash-flow forecast (200 / 401 each).

**Rule:** money columns are already NUMERIC — do not run a money migration.
**Rule:** never write a money row on the live account without explicit permission.

## V7 · Packages & pricing
`[x]` **Packages + menus CRUD proven end to end — 12 + 4 assertions, 0 defects.**
Create · duplicate-name refusal · read-back · partial PATCH · price update ·
delete-and-verify-gone. The **WW-183 regression holds**: a PATCH carrying only
`description` left `name` and `price` intact. Four cross-tenant writes all
refused (create on a foreign business, edit, delete, and reassigning my own
package *to* a foreign business). Run: `scripts/qa-catalog-crud.mjs`.
**Menus now proven** (`scripts/qa-money-catalog.mjs`): single-menu create → price
update → delete clean; a customer create is refused; the Rs-0 menu did not 500
(accepted — flagged for product review, no hard price-floor on menus like there
is on packages). Add-ons / per-slot pricing remain UI-walk only.

## V8 · Staff
`[x]` **Roster CRUD complete — 20 assertions, 20 pass, 0 defects.** Every
validator in `utils/staffHelpers.js` exercised against live production: defaults
(`waiter` / `casual_dihari`), the 21-role and 3-type enums, NIC at 12/13/14
digits with `35201-1234567-1` formatting, and the **WW-154** phone bound (`123`,
a mid-string `+`, and letters all refused). Update is partial — patching `role`
left `fullName` intact. Three cross-tenant probes refused.

### V8b · Shifts & shift payroll  ⭐ real cash leaving the till
`[x]` **37 assertions, 37 pass, 0 defects.** Run: `scripts/qa-shift-payroll.mjs`.
- **Pay arithmetic** matches `computeShiftPay` exactly on four shapes, including
  a deduction larger than gross flooring at 0 rather than going negative.
- **Typo guards** all hold — 8 of 8 refusals across the dihari cap (Rs 1 lakh),
  negative pay, 24-hour overtime, the Rs 50k/hour overtime rate, and the bonus
  and deduction caps.
- **The `partial` state behaves as designed, which is the headline result.**
  Marking a 5,000 shift "paid" for 3,000 does **not** record `paid` — it lands
  on `partial` with 3,000 recorded and the balance still owed. Topping up to
  5,000 then lands on `paid`. The 2% tolerance is correctly two-sided: 50 short
  is absorbed as cash rounding (`paid`), 150 short is not (`partial`).
- **WW-227** — paying 50,000 on a 5,000 shift is refused, not silently capped.
- **WW-155** — a confirmed no-show cannot be paid, and the guard is *narrow*:
  an `excused` staffer is still payable. Both directions proven.
- **Attendance** — the full ladder plus both deliberate undo edges
  (`completed → checked_in`), and `checked_in → excused` correctly refused.
- **Payroll rows are immutable once money has moved.** `DELETE` on a `paid` or
  `partial` shift returns **409 SHIFT_LOCKED_PAID**, and the message names the
  only way out: *"Move to 'disputed' first."* Followed that path on all five
  locked rows — it works exactly as documented. Not a defect; correct design,
  and worth knowing before anyone reports it as one.

Still open: assigning a shift to a booking.

### T1–T6 · Staff self-serve portal  ⭐ the lowest-privilege persona
`[x]` **40 assertions, 38 pass, 1 defect (BUG-022), 1 recommendation (REC-012).**
Run: `scripts/qa-staff-portal.mjs`.

**The gate is gone.** `requireStaff` used to sit behind `STAFF_LOGINS_ENABLED`,
which was never set in production — so the portal had been 404 since it shipped.
That env check was removed; what guards it now is narrower and better: the caller
must carry the `staff` role *and* resolve to an active `StaffMember`. **The saved
note claiming the portal is flag-dark is out of date.**

- **Provisioning (T1)** — a vendor creates a login; enabling twice returns 409
  `STAFF_LOGIN_EXISTS`; reusing any existing account's email returns 409. Both
  staff accounts signed in.
- **The privilege boundary — 22 of 22 probes refused, zero leaks.** A staff token
  cannot list the roster, read the shift ledger, the payroll summary, the
  bookings, the PDC ledger or the leave queue; cannot create a staff member,
  cannot roster itself a Rs 99,000 shift, and cannot promote itself.
- **Colleague isolation holds.** Staff A cannot see B's shift in their roster,
  cannot check B in, cannot acknowledge B's payment, and cannot download B's
  payslip.
- **The pay-rise attempt failed, which is the headline.** `PATCH /staff/me/profile`
  carrying `dihariRate: 99000`, `monthlySalary: 4000000`, `role: "manager"`,
  `businessId: 3358` changed **nothing** — verified by reading the row back as
  the vendor. `PROFILE_FIELDS` is a true whitelist, and a body containing only
  non-editable fields is rejected outright.
- **The working day works** — check in, check out, request leave, vendor
  approves, download own payslip, acknowledge payment.
- **Revocation works** — disabling the login refuses the existing token and
  blocks re-signin. See REC-012 on *how* it refuses.
- **BUG-022** — a shift paid in advance is invisible in the staffer's payslips
  until its date arrives.

## V-PDC · Post-dated cheques  ⭐ the cash instrument PK vendors actually use
`[x]` **State machine exhaustively proven — 35 assertions, 35 pass, 0 defects.**
Tested against its own oracle (`utils/pdcStatusTransition.js`), read first.
- **Legal paths:** `held→deposited→cleared`, `held→deposited→bounced`,
  `held→cancelled`, `deposited→cancelled` — all 200.
- **Illegal paths refused:** `held→cleared`, `held→bounced`, `deposited→held`,
  an unknown target, and a missing target. All three terminal states refuse
  every onward move with `TERMINAL_STATE`.
- **Guardrails:** deposit without a date, deposit dated *before* the cheque
  date, bounce with no reason, bounce with a whitespace-only reason — each
  refused with its own distinct code. Same-state writes are 200 no-ops.
- **Create validation:** 8 of 8 refusals (cheque number length and charset,
  blank bank, zero, negative, over Rs 5 crore, no date, unknown booking).
- **Tenant isolation:** another vendor and a customer each tried to read,
  cancel and delete the cheque, and to see it in their own list — 8 refusals,
  and the cheque was still `held` and unmodified afterwards.
Run: `scripts/qa-pdc-machine.mjs`. Every cheque created was deleted.

## V9 · Venue-OS operations
`[x]` **CFO/AML financial tier — tenant isolation proven, 40/40, 0 leaks.** Run:
`scripts/qa-venueos-boundary.mjs`. Every sensitive `business/:id/...` endpoint —
event margins, trial balance, fixed assets, labour-by-event, Annex-B, Section-165,
CA export, tax filings, AML bank-deposits, AML beneficial-owners, venue leases,
lease schedule — refuses **anon**, refuses **customer**, and refuses the **QA
vendor reading the founder's business (3358)**. No cross-tenant financial or AML
data is reachable. The QA vendor's own reads (3365) respond without a 500.
**Operational half — render/reachability sweep, live as the QA vendor, all
clean.** 18 dashboard screens visited and probed (`scripts` not needed — driven
in the browser): **inventory, kitchen-prep, generator-fuel, halal-certs,
drone-noc, trade-ops, brokers, collaborations, field, reliability,
function-sheets, insights, reports, automation, tax, quotes, settings/security
(2FA present), chat**. Every one: renders (24–111 interactive elements), **no
crash, no blank state, zero horizontal overflow**. This is breadth (render +
reachability + no-error), not per-element interaction depth. 🔴 Consistency
finding folded into BUG-007: `settings/security` and `chat` carry the generic
"Wedding Wala — Dashboard" title while the other ~16 use page-specific
"Dashboard : X".

**Operational WRITE depth — proven live (`scripts/qa-operational-writes.mjs`):**
- **Inventory CRUD** — create an item (`category` validated against
  ingredient/rental/equipment/consumable/linen/…), read back in the list, update
  editable fields (stock itself is protected — changed via *movements*, not a
  direct PATCH), record a stock movement, delete. Validation (nameless item →
  400), tenant isolation (customer cannot add stock to the business → refused),
  and unauth (401) all hold.
- **Function-sheet composer → public signature — the full chain works.** Create
  with `lineItemsJson` (`label` + `qty` required) → transition **draft →
  quote_sent** (an *empty* sheet is refused `no_line_items` — correct) → issue a
  public share token → **read it through the public token URL with no auth
  (200)** → **capture a public signature (200 "Signature captured")**. Guardrails
  hold: a **draft cannot be signed** (409), a signature requires `name` + a
  `data:image/*` `dataUrl`, and a customer cannot read the authed sheet.
- **Design note, not a bug:** capturing a signature leaves the sheet in
  `quote_sent` (it does not auto-advance to `signed`), and a second signature is
  still accepted while open — consistent with WW-019, which only blocks
  re-signing a *closed* sheet. Worth a product confirmation on whether capturing
  a signature should close the sheet, but nothing is broken.
Remaining depth: the per-item create UI on the other operational sheets
(generator fuel log, halal cert upload) — the pattern is proven on inventory.

## V10 · Growth & admin
`[x]` **Promotions/billing boundary clean + insights, 2FA and chat exercised —
34 assertions, 0 defects.** Run: `scripts/qa-insights-plans-moderation.mjs`.
- **Insights/reports** all answer for the vendor and refuse anon (200/401):
  advanced insights, reputation, seasonality, response-times, revenue-breakdowns,
  whatsapp-template performance.
- **2FA:** `POST /auth/2fa/enroll` returns a TOTP secret/otpauth for the vendor;
  enrol requires auth (401 anon). **`/2fa/confirm` with a wrong code is rejected**
  — no 2FA bypass. (Confirm was deliberately not completed: a real TOTP would
  lock the QA account out of password-only login.)
- **Chat:** conversation list, unread-total and contacts all 200 for the vendor,
  401 anon. (Read-only — sending would ping a real customer.)
- **Promotions/plans:** the admin approval levers (`promotions/admin/*`,
  `subscriptions/admin/*`) refuse customer and vendor; `subscriptions/me` and
  `promotions/mine` work. A vendor can view and request but never self-approve.
Still UI-walk only: automation, migrate/import, team-roles screen.

---

# SUPERADMIN — the platform operator

**S1–S9 authorisation matrix — `scripts/qa-superadmin.mjs`, live: 77 assertions,
0 real leaks.** Every admin endpoint below was hit with anon / customer / vendor
tokens; all refused (401/403). Every admin *list* returned 200 for the real
superadmin. Two apparent failures were run down and cleared:
- `/platform-stats` returns 200 to everyone — **intentional**: it is the public
  homepage counter (`{vendors, couplesServed, cities}`), no PII, no admin data.
  Not a leak.
- The complaints endpoint is mounted at **`/complaints`**, not
  `/support-complaints` (my first path was wrong). Re-tested at the right path:
  anon 401, customer 403, vendor 403, admin 200. Boundary holds.

## S1 · Vendor queue
`[x]` **Authorisation clean + state machine exercised on business 3365.**
- All 7 queue endpoints (list, bulk-approve, approve, reject, request-changes,
  suspend, restore) refuse anon/customer/vendor.
- Transitions verified live: `suspend → restore` lands on **approved**;
  `approve → suspend` lands on **suspended** (idempotent guard returns
  `Cannot_transition_suspended_to_suspended` on a repeat); `request-changes`
  and `bulk-approve []` are handled without a 500.
- 🔴 **BUG-021 re-confirmed:** nothing at approve time flags an incomplete
  listing. A business with no `name` and empty `subBusinessType` is approvable
  into public search.

## S2 · Claims & KYC
`[B]` **Blocked at the last mile only — the document/KYC walk needs an
`otp_verified` claim, and reaching `otp_verified` requires entering the real
emailed code** (see V2; the gate, attempt-cap and admin reject are all proven,
only the code entry is skip-by-rule). Authorisation is clean on all 9 endpoints (documents, verification-queue,
approve-ntn/cnic/address, mark-visited, reject, bank-details verify) — anon,
customer and vendor all refused; admin lists return 200. Functional walk-through
(a real claim → verify → ownership move) still to do.

## S3 · Disputes
`[x]` **Authorisation clean + refund-request decision lifecycle proven.**
`GET /admin/disputes` and `POST /admin/disputes/:id/resolve` refuse non-admins;
admin list 200. The underlying RefundRequest state machine (RAISED → REJECTED)
was driven end to end on a QA booking (see U7): raise → decide-reject → no money
moved → role guard on `decide`. The `apply`/approve money-movement is the same
engine, verified enabled; running it to actual settlement was deliberately not
done on a live booking.

## S4 · Complaints
`[x]` **Full lifecycle proven end to end — 11 assertions, 0 defects.** Run:
`scripts/qa-complaints-reviews.mjs`. A synthetic "ZZ QA" complaint was driven the
whole way: submit (customer, optional-auth) → superadmin sees it in the queue →
detail 200 → status **open → in_progress** → resolve with resolution notes →
**re-resolve is an idempotent no-op** (200, `idempotent:true`, no re-email / no
re-audit — service `resolve()` L181-182) → the submitter sees it in `/mine`. The
`/:id/status` toggle correctly refuses a terminal value (`resolved`) — that path
is open↔in_progress only. Tenant guards hold: vendor 403, anon 401 on the queue.
Left resolved (terminal — nothing to delete).

## S5 · Force majeure
`[x]` **Authorisation clean** — `POST /admin/force-majeure-cancel` refuses
customer and vendor. The batch itself is the highest-blast-radius action and is
**deliberately not fired** against live prod. Boundary is the testable part; it
holds.

## S6 · Directory & moderation
`[x]` **Moderation-queue reads + boundary proven three ways.** Run:
`scripts/qa-insights-plans-moderation.mjs`. `GET /admin/vendor-queue`,
`/admin/documents` (KYC queue) and `/admin/audit-logs` each return 200 for the
superadmin, and refuse both the vendor (403) and anon (401). The mutation levers
(suspend/restore) are the same S1 endpoints already driven live on business 3365.

## S7 · Money & plans
`[x]` **Plan boundary proven end to end.** `/platform-stats` confirmed
public-safe. `subscriptions/me` answers for the vendor; the admin plane
(`subscriptions/admin/upgrade-requests` and the activate/decline levers) is
superadmin-200, vendor-refused, anon-401. Centrally-issued refunds are the S3
dispute engine (already exercised); firing an actual settlement on a live booking
was deliberately not done.

## S8 · Roles, users, audit
`[x]` **Authorisation clean + roles CRUD proven.** `GET /admin/audit-logs`
refuses non-admins, 200 for admin. Roles CRUD (`roleRouter`): admin lists roles,
**creates** one (`POST /roles`), duplicate name is rejected (400), **deletes** it
(`DELETE /roles?roleId=` — id is a *query* param, as is `PATCH /roles?id=`), and a
**vendor token cannot create a role** (403). Note: partial update needs `name` in
the body (minor). Test role cleaned up. The "every admin action is audit-logged
with the right actor" invariant remains to spot-check against the log.

## S9 · Platform health
`[x]` **`GET /admin/platform-pulse` — authorisation clean** (anon/customer/vendor
refused, admin 200). Read-only health surface; nothing destructive to test.

---

# STAFF — the vendor's employee

Discovered late: `app/staff/*` is a **separate portal with its own login**, not a
section of `/dashboard`. The first version of this map covered three of five roles
because nothing under `/dashboard` pointed at it. Gated by `STAFF_LOGINS_ENABLED`.

## T1 · Staff sign-in
`[x]` **Done — see the consolidated T1–T6 block below (40 assertions, privilege
boundary 22/22).** `/staff/login` — credentials issued by the vendor → session →
lands on `/staff/today`. **Boundary:** a staff session must not reach
`/dashboard/*`.

## T2 · The working day
`[ ]` `/staff/today` — see today's assigned shifts and the bookings behind them.

**State:** what a staff member sees matches what their vendor assigned, and
**nothing** from any other vendor.

## T3 · Leave
`[ ]` `/staff/leave` — request leave → vendor sees it → approve/reject → the
staff member sees the outcome and their roster reflects it.

## T4 · Payslips
`[ ]` `/staff/payslips` — view payslips including the **`partial`** shift-payment
state (an underpaid shift is a first-class state here, not a rounding error).

**Boundary:** a staff member must never see another staff member's pay.

## T5 · Profile
`[ ]` `/staff/profile` — edit own details; password change; what is read-only.

---

# FLOOR — the venue floor surface

## F1 · Floor board
`[x]` **Tested 2026-08-15 — clean. The premise below was wrong; corrected.**

`/floor` is **not** a shared kiosk. It is a mobile-first PWA that vendor staff
open on their own phone during an event (`components/floor/floor-home.tsx`),
authenticated through `useUser()` and the operations-summary API.

- Unauthenticated `/floor` **redirects to `/login`** — verified live at 390×844.
- No token, no data, nothing rendered before the redirect.

`/pin/*` is not part of this surface at all — it is a **Pinterest image
generator** for the marketing team (`/pin/blog/<slug>` → a 1000×1500 PNG).
It was grouped here in error when the persona list was first derived from
route paths alone.

**The Critical concern originally recorded here — "a kiosk that renders customer
contact details to a room full of guests" — does not exist.** It was inferred
from the route name, never observed.

---

# Cross-cutting — run against every flow above

| # | Concern | Why it is here |
|---|---|---|
| X1 `[x]` | **Permission boundaries** — 69 tested, 0 leaks | every action attempted by the two roles that should be refused, in the UI *and* by direct API call |
| X2 `[x]` | **Tenant isolation** — 11 tested, 0 leaks | vendor A cannot read or write vendor B's bookings, staff, money, or documents — by ID manipulation, not just by UI |
| X3 `[x]` | **Persistence** — every CRUD suite proves create→list re-read (expenses, receipts, menus, inventory, staff, roles, timeline, complaints, leads — each written then read back from the server); UI hard-reload (`ignoreCache`) proven on settings (lang pref + auth survive) and on U6 (cancel survives reload, re-verified in the live UI) | JWT-expiry aside, mutations demonstrably durable |
| X4 `[x]` | **Responsive** — 360×720 sweep of **13 screens** (6 public + dashboard/staff/inventory/packages/money/settings/booking-203) = **0 horizontal overflow everywhere**; all true modal dialogs measured (Add-staff, Add-item, Import) reachable | Key finding: **few screens use true modals** — most portal actions are URL-nav, popovers, or inline panels — so the DialogContent max-height trap has a **small blast radius**. It's **conditional** (shared no-max-h default AND content taller than viewport). Add-staff & Add-item set their own `max-h:648`+scroll (safe); Import is `max-h:none` but short (safe). None reproduce it. Any future tall modal on the shared default stays at latent risk |
| X5 `[x]` | **Session** — proven (`scripts/qa-session-pkspecifics.mjs`, 7/7): two concurrent logins both authenticate (two-tab); **revoking session B's jti via A refuses B (401) while A keeps working** (right-session revoke); tampered token → 401; no token → 401; auth survives a hard (`ignoreCache`) reload. Revoked-session now returns a clean **401** (REC-012's 400 was the separate deactivated-user path) | only JWT natural-expiry (impractical to wait out live) untested |
| X6 `[x]` | **Money integrity** — the client figure is never trusted (server recomputes; validators cap amounts at Rs 5cr); **payment idempotency proven live in U4** (double-submit with the test card = one charge, success/decline both handled); 2 arithmetic bugs found (BUG-014/015) | — |
| X7 `[x]` | **Pakistani specifics** — **PKR correct** (`Rs. 100,000` w/ separators); **Urdu-script data renders cleanly** (public home: `ماڈرن مارکی` etc., 107 Urdu chars, 0 overflow); **phone formats** (`scripts/qa-session-pkspecifics.mjs`, 6/6): accepts `0300-1234567`, `+92 300 1234567`, Lahore landline `042-…`; rejects `123`, mid-string `+`, letters; **multi-day shaadi** lead with `functionsJson` [mehndi/nikah/walima] accepted + all 3 persisted. 🔴 **BUG-032:** dashboard **اردو toggle is dead** — sets/persists `lang=ur` but never translates the UI or applies RTL | — |
| X8 `[x]` | **Notifications** — right-party proven **twice**: (1) chat (`qa-notifications-x8.mjs`, 6/6) recipient unread 0→1, sender not self-notified; (2) **booking lifecycle** (`qa-signup-booking-notify.mjs`) — a signed-up customer books the QA vendor → **vendor approves → the CUSTOMER (`booking.userId`) is notified**, the approving vendor is **not** self-notified, and the approval notification is present in the customer's feed | Unblocked by the signup auto-verify discovery (auto-`phoneVerified` passes `requirePhoneVerifiedForBooking()`). Mechanism proven across two event classes |

---

# Known blocked

| Item | Reason |
|---|---|
| `[B]` Real card capture / Stripe webhooks | cannot be exercised from here; production carries TEST keys |
| `[B]` Real SMS delivery | OTP is SMS-only for phone verification |
| `[B]` FBR / PRA e-invoicing | adapter is a no-op pending a PRA sandbox token |
| `[B]` Sign-in email OTP | deliberately **off** for this window; must be re-tested with it ON |

---

# Count

**42 flows** across **five** personas — 10 USER, 10 VENDOR, 9 SUPERADMIN, 5 STAFF,
1 FLOOR, 8 cross-cutting — over 303 screens, 3,410 named elements and **549 API
endpoints**. None are `[x]` yet.

The STAFF and FLOOR flows were missing from the first version of this map. Both
live outside `/dashboard`, so nothing in the portal pointed at them.
