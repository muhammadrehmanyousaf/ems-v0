# QA_BUGS.md

Every defect, written the moment it is found. Format and severity guide in
[rules.md](rules.md) §6. Sorted by severity.

Only findings that have been **verified** appear here — see the `Verified by` line
on each. A check firing is not a bug until the mechanism is proved.

---

## Critical

### BUG-008: `POST /businesses/upload-images` accepts uploads with no authentication
- **Module / Screen:** API · `«api»/src/routes/businessRouter.js:69`
- **Role:** none — anyone on the internet
- **Severity:** Critical
- **Steps to reproduce:**
  1. `curl -X POST https://ems-v0-backend-production.up.railway.app/api/v1/businesses/upload-images`
  2. Send with no `Authorization` header
- **Expected:** `401`
- **Actual:** `400 {"status":false,"message":"No images uploaded"}` — the request passed straight through to the controller. Attaching files would upload them.
- **Evidence:** the route is declared with an inline multer wrapper and then `businessController.uploadBusinessImages` — **no `auth()`, no rate limiter**:
  ```js
  businessRouter.post("/upload-images",
    (req, res, next) => { uploadBusinessImages(req, res, (err) => { … }) },
    businessController.uploadBusinessImages);
  ```
- **Verified by:** live unauthenticated request to production. "No images uploaded" is the handler's own validation message, which proves execution reached it. Compare `POST /businesses/create-business-with-vendor` on the same router, which *does* carry CAPTCHA + a rate limiter.
- **Impact:** unmetered storage/bandwidth cost on your Cloudinary account, and arbitrary third-party content hosted under your domain.

### BUG-009: Registration drafts are readable and deletable by email alone, unauthenticated
- **Module / Screen:** API · `«api»/src/routes/registrationDraftRouter.js`
- **Role:** none — anyone on the internet
- **Severity:** Critical
- **Steps to reproduce:**
  1. `GET /api/v1/businesses/draft?email=<any vendor's email>` with no token
  2. `DELETE /api/v1/businesses/draft?email=<same>` with no token
- **Expected:** `401` on all four draft routes
- **Actual:** all four are unguarded and reach their handlers:
  ```
  OPEN  POST   /businesses/draft          400 "Email is required"
  OPEN  GET    /businesses/draft          400 "Email is required"
  OPEN  DELETE /businesses/draft          400 "Email is required"
  OPEN  POST   /businesses/draft/lookup   400 "OwnerEmail is required"
  ```
  With a real email the response is `404 {"message":"No draft found"}` — a **different response for an email that has a draft versus one that does not**, which is email enumeration on its own.
- **Verified by:** live unauthenticated requests. The read was run once against the founder's own email only. **The DELETE was deliberately not executed against any real email** — its guard was proven by the same 400 the other three return.
- **Impact:** an in-progress vendor registration (contact details, address, documents) is readable by anyone who knows the email, and **destroyable by anyone who guesses one**. Email is an identifier, not a credential.
- **Not yet proven:** the exact fields a populated draft returns — no draft existed for the only email I am authorised to use. The missing guard is proven; the payload is not.

---

### BUG-028: A vendor's business name is injected unescaped into public JSON-LD — stored XSS on an indexed page

- **Module:** `components/seo/vendor-detail-page.tsx:241` (and the sibling SEO detail pages that render `JSON.stringify(ld)`)
- **Roles:** injected by a VENDOR (or by anyone hitting the public registration endpoint — **BUG-021** proves the name is not server-validated); executes in **every visitor's** browser, unauthenticated, on a Google-indexed page
- **Severity:** Critical — stored XSS on a public page, self-serviceable through registration
- **The injection point, exact:**
  ```jsx
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
  />
  ```
  `ld` contains `vendor.name` in several places (the `EventVenue` node's `name`, the breadcrumb, and the FAQ answer strings built as `` `How do I book ${vendor.name}?` ``). `vendor.name` comes from `fetchVendorById(id)` — live database data, vendor-controlled.
- **Why it breaks out:** `JSON.stringify` does **not** escape `<`, `>` or `/`, and `dangerouslySetInnerHTML` does no escaping by definition. Inside a `<script>` element the HTML parser ends the element on the literal byte sequence `</script>` regardless of JSON context. So a business name of:
  ```
  </script><script>/* attacker JS */</script>
  ```
  renders as:
  ```html
  <script type="application/ld+json">{ ... "name":"</script><script>/* attacker JS */</script>", ... }</script>
  ```
  The first `</script>` closes the LD block early; everything after it is live HTML, and the injected `<script>` executes in the visitor's session.
- **Confirmed:**
  1. The name **does** reach the LD block verbatim — fetched the live page `/wedding-venues/lahore/zz-qa-test-vendor-do-not-book-3365` and found `"@type":"EventVenue" … "name":"ZZ QA TEST VENDOR — DO NOT BOOK"` inside `<script type="application/ld+json">`. A plain name (no metacharacters) sits there unescaped.
  2. The serialization path has **no escaping** — the injection line above is the terminal render, `JSON.stringify(ld)` with no `<`-escaping wrapper.
- **Not visually reproduced with a breakout marker, and why:** `fetchVendorById` sets `next: { revalidate: 3600 }`, a 1-hour data cache. After renaming the business to a benign `</script><!--probe-->` marker, the public page kept serving the pre-marker name (verified `X-Vercel-Cache: MISS`, `Age: 0`, old name still rendered — the *data* cache, not the edge cache, holds it). I restored the clean name immediately rather than leave broken/injected JSON-LD on a Google-indexed page for an hour. The breakout is proven by construction, not by a live screenshot; **the one outstanding step is to watch the marker render after the 3600s window on a throwaway listing.**
- **This is the chain BUG-027 flagged, now located.** BUG-027 noted the session token is JS-readable and that stored XSS would make it Critical. BUG-011 proved script tags are *stored*. This is where a stored, vendor-controlled string is *emitted into an executable context* on a public page. Together: a self-registered vendor can run script in any visitor's browser and, via the non-`httpOnly` `auth_token`, exfiltrate sessions.
- **Fix:** serialize JSON-LD with a `<`-escaping serializer — replace `<` with `<` (and `>` with `>`, `&` with `&`) in the stringified output before injecting. This is the standard JSON-LD hardening and fixes all ~10 `JSON.stringify(ld)` sites at once via a shared `safeJsonLd()` helper.

---

### BUG-011: Script tags are accepted and stored raw in `customerName`
- **Module / Screen:** API · `POST /api/v1/bookings` → flow U3
- **Role:** USER (any authenticated customer)
- **Severity:** Critical
- **Steps to reproduce:**
  1. `POST /api/v1/bookings` with a valid business, date and slot
  2. Set `customerName` to `<script>alert(1)</script>`
- **Expected:** rejected, or stored escaped
- **Actual:** `201 Created` (booking 195), and reading it back gives
  `customerName = "<script>alert(1)</script>"` — byte-for-byte, unescaped.
- **Evidence:**
  ```
  POST /bookings { customerName: "<script>alert(1)</script>", … }  → 201
  GET  /bookings/195/with-availability → customerName = <script>alert(1)</script>
  ```
- **Verified by:** written and read back across two separate requests on production. Every other hostile input in the same battery (SQL string, 5000 chars, bad phone, negative guests, past date) was refused — this one alone was accepted, so it is not a blanket "validation is off" observation.
- **Render paths — checked:**

  **Email: UNESCAPED. Confirmed.** `«api»/src/templates/emailTemplates.js` interpolates the value straight into HTML with no escaping:
  ```js
  Hi ${customerName}, your booking has been placed successfully.     // line 206
  infoRow("Customer", customerName)                                   // line 243
  html: baseLayout(content, `New booking request from ${customerName}…`)  // line 259
  ```
  A search for `escapeHtml`, `sanitize`, `DOMPurify` or `escape(` across `src/templates/`, `src/emailTemplates/` and `src/utils/` returns **zero results** — there is no escaping helper in the codebase to have been forgotten.

  So a customer controls raw HTML inside the email delivered to the vendor (`vendorNewBookingEmail`), and inside their own confirmation and receipt emails. Most clients strip `<script>`, but injected anchors, styling and forged content survive — which makes this a phishing vector aimed at vendors, using your domain and your template.

  **Portal UI: INCONCLUSIVE, not safe.** The vendor bookings list showed no `alert()`, no injected `<script>`, and nothing unescaped in `innerHTML` — but the name did not appear on the page at all, because booking 195 had already been cancelled and the default view does not list cancelled bookings. **The render path was never exercised.** React escapes by default so it is probably fine; that is an expectation, not a result, and it is recorded as untested.

  **Function sheet: not yet checked.**
- **Cleanup:** booking 195 was cancelled immediately (`PATCH /bookings/195/vendor-cancel` → 200); the date is released. Cancelling for safety is what made the UI render path untestable — an accepted trade, and the reason REC-007 (a seeded vendor) matters.

### BUG-014: A refund is Rs 0 whenever the policy's deposit % is at or above what the customer has paid — even at a 100% tier
- **Module / Screen:** API · `GET /api/v1/bookings/:id/refund-preview`, `«api»/src/services/refundService.js` → flow U6
- **Role:** USER (loses the refund), VENDOR (picks a policy that cannot pay out)
- **Severity:** Critical — money, and it silently voids the tier a customer was shown
- **The rule, proven on a purpose-built booking** (199: grand Rs 100,000, customer paid Rs 20,000 = 20%):

  | policy | policy `depositPct` | deposit withheld | advance left | tier @40 days | refund |
  |---|---:|---:|---:|---:|---:|
  | flexible | 10% | 10,000 | 10,000 | **100%** | **10,000** ✓ |
  | standard | 20% | 20,000 | **0** | **100%** | **0** ✗ |
  | strict | 30% | 20,000 | **0** | 50% | **0** ✗ |

  **The tier percentage is applied to `advance`, which is what remains after the
  non-refundable deposit is withheld — and the deposit is computed from the GRAND
  TOTAL, not from what the customer actually paid.** So whenever
  `policy.depositPct × grand ≥ amount paid`, the deposit consumes the entire
  payment, `advance` is 0, and every tier — including 100% — returns nothing.
- **Root cause:**
  ```js
  depositDefault = round((grand * (policy.depositPct || 0)) / 100);
  deposit        = Math.min(bookingDeposit ?? depositDefault, paidTowardDeal);  // capped at what was paid
  advance        = Math.max(0, paidTowardDeal - deposit - securityDeposit);     // → 0
  ```
- **Why it bites in practice:** before the balance falls due, a customer has paid
  exactly their deposit — typically 10–30%. The three presets are 10%, 20% and 30%.
  So for most vendor/policy pairings the customer is in precisely the state where
  the refund is structurally 0, while the UI shows them a 50% or 100% tier.
- **Verified by:** a vendor created for this test, configured with a 20% deposit, a
  real booking, a real recorded payment, then the preview run against all three
  presets at four distances. **Refunds are NOT universally broken** — `flexible`
  paid out correctly at 10,000. The defect is the interaction, not the arithmetic.
- **Correction to the first report of this bug:** it was originally written as
  "every policy refunds Rs 0 at every distance", measured on booking 193 where the
  vendor's deposit and the policy's `depositPct` both happened to be 10%. That was
  one instance of the rule above, not the whole rule, and `flexible` disproves the
  general claim. The trigger condition is what matters for the fix.
- **Fix direction:** decide whether the non-refundable deposit is a slice **of what
  was paid** or a fixed share of the total. If a tier says 100%, a customer who has
  paid only their deposit should not receive 0.

### BUG-020: A vendor with no deposit percentage set takes bookings for Rs 0 — "a payment of 0 RS is required"
- **Module / Screen:** API + booking confirmation copy · flow U3 → U4
- **Role:** VENDOR (loses the deposit), USER (sees the message)
- **Severity:** Critical — money, and it lets anyone hold a vendor's dates for free
- **Steps to reproduce:**
  1. Register a new vendor (no deposit percentage configured — the registration flow never asks)
  2. Create a booking against it
- **Expected:** a deposit proportional to the total, as on configured vendors (business 3358 charges 10%: Rs 35,000 on Rs 350,000)
- **Actual:** on the freshly-registered business 3365 (`minimumPrice` Rs 100,000):
  ```
  booking 197   totalAmount 100000.00   downPayment 0.00
  API message:  "Dear Customer, a payment of 0 RS is required to finalize your booking."
  ```
  The booking then reaches **Confirmed / Partial** with **zero money taken**.
- **Verified by:** a real vendor created through the live public registration endpoint, then a real booking created against it. `downPaymentPercent` is **not set** on the new business, and nothing in registration asks for it. Compare business 3358, which has it configured and correctly charges 10%.
- **Why this is Critical:** every vendor who registers and never finds the deposit setting can have their calendar filled by anyone, for free, with the customer explicitly told no payment is required. It is the deposit-side twin of the Rs 0 price hole that `ZERO_PRICE_GUARD` was added to close — the guard covers the price, not the deposit.
- **Fix direction:** default `downPaymentPercent` to a platform minimum at registration, and refuse to confirm a booking whose computed deposit is 0 unless the vendor has explicitly chosen zero-deposit.
- **Not the same as:** `record-payment` ignoring an `amount` field. It reads only `{ paymentType, paymentMethod }` **by design** and derives the figure from the booking, so passing an amount is correctly ignored. Checked before reporting.

---

### BUG-026: Cancelling a paid booking records no refund — the customer's money simply stops existing

- **Module / Screen:** `/dashboard/bookings` → row actions → **Cancel booking** → flow U6
- **Roles:** VENDOR performs it; **USER loses the money**
- **Severity:** Critical — a customer who has paid is owed a refund, and after cancellation nothing anywhere in the system records that the debt exists
- **Steps to reproduce (done in the live UI, signed in as the vendor):**
  1. Take a booking with a real payment against it — booking 199, grand Rs 100,000, customer paid Rs 20,000.
  2. Row actions → *Cancel booking* → *"Yes, cancel booking"*.
  3. Read the booking back.
- **Expected:** the Rs 10,000 the policy owes the customer is recorded — a refund request, a payable, an outstanding-refund flag, *something*.
- **Actual:** **nothing is created.** The booking flips to Cancelled and the obligation vanishes.
- **The system computed the refund correctly right up until the moment it was needed:**
  ```
  BEFORE  GET /bookings/199/refund-preview
     paid 20,000 · deposit forfeit 0% · tier { minDaysBefore: 35, refundPct: 50 }
     refund 10,000 · forfeit 10,000

  AFTER   GET /bookings/199/refund-requests   →  { "requests": [] }
          GET /bookings/199/paisa-reconcile   →  receiptsTotal 20,000 · refundsTotal 0
          GET /bookings/199/refund-preview    →  refund undefined · forfeit undefined
          booking 199  status Cancelled · paymentStatus "Partial" · cancellationReason null
  ```
  `refundsTotal: 0` against `receiptsTotal: 20,000` is the system's own reconciliation saying the customer paid and got nothing back.
- **The customer cannot even find out.** Booking 199 is invisible in their account (**BUG-025** — "My bookings" matches on email only), so there is no screen on which they could see the cancellation, the refund, or its absence. Between the two bugs, the money leaves the customer with no artefact and no notification.
- **The vendor is not told either.** The confirmation dialog is the entire disclosure:
  > *Cancel Booking — Are you sure you want to cancel booking #199? This action cannot be undone.*

  No refund amount, no forfeit split, no mention that Rs 20,000 has been paid. A vendor cancelling a no-show is never shown that they owe Rs 10,000 back.
- **A manual path exists but nothing routes anyone to it.** The same row menu offers *Record refund*, and `POST /bookings/:id/refund-requests` exists. So the refund machinery is built — the cancel flow just never invokes it and never flags the obligation. If the vendor does not spontaneously remember, the customer loses the money silently.
- **The refund engine is ENABLED, not flag-dark — confirmed live 2026-08-15.** Raising a refund request directly (`POST /bookings/189/refund-requests`) returns **201 "Refund request raised"** for the vendor's own token (the `DISPUTE_FLAG` gate is on for this account; superadmin also 201). So the cancel-with-no-refund is *not* explained by a disabled engine — the engine works when called; **the cancel flow simply never calls it.** This raises confidence: the fix is wiring the existing, working refund path into the cancel action, not building anything new.
- **The reason field is dropped too.** `cancellationReason` is `null`. It is not that the column is unused — booking 198, cancelled by the auto-release job, reads *"Auto-released: unpaid for over 30 minutes with no payment attempted."* The API supports a reason; the UI never asks for one, so a cancellation that later becomes a dispute has no recorded cause.
- **Fix, in the order that matters:**
  1. On cancel, create the refund obligation from the preview the system already computes — or at minimum persist it and surface it as outstanding.
  2. Show the money in the confirmation dialog: paid, forfeit, refund due.
  3. Capture a cancellation reason.
- **Related:** BUG-014 (the refund maths can compute Rs 0 when the deposit % meets what was paid) is about the *amount*. This is worse and separate: even when the amount is correct and non-zero, **it is never recorded**.

---

## High

### BUG-029: A successful card payment posts no receipt to the cash ledger — the booking reads paid, the khata reads Rs 0

- **Module:** `paymentController` Stripe webhook (`payment_intent.succeeded`, line ~1926) vs the client confirmation path → flows U4, V6
- **Roles:** VENDOR (khata under-reports real cash); platform (reconciliation breaks)
- **Severity:** High — every card payment currently lands the booking in a `paid` state with **no matching receipt**, and the system's own reconciler flags the mismatch but nothing surfaces it
- **Proven live** with a real Stripe test charge (card `4242…`, booking 201, Rs 20,000 deposit paid):
  ```
  booking 201     status Confirmed · paymentStatus Partial · downPayment 20,000 · method stripe
  paisa-reconcile receiptsTotal 0 · receiptCount 0 · refundsTotal 0
                  displayedAdvance 20,000 · trueBalance 100,000 · delta -20,000 · reconciled FALSE
  ```
  Stable across three polls over 20 seconds — not webhook lag.
- **Root cause, from the code:** the `PaymentReceipt` that `paisa-reconcile` and the khata read is written **only** inside the Stripe `payment_intent.succeeded` webhook handler. The client/polling path marks the booking `Confirmed/Partial` (and the code even has a fallback at `paymentController.js:299-312` that reflects Stripe's "succeeded" locally when *"the webhook never landed (e.g. STRIPE_WEBHOOK_SECRET not configured)"*) — but **neither path posts a receipt**. Receipts are webhook-only.
- **Why this is not just a test-environment artefact:** the same architecture ships to production. If the live webhook endpoint or `STRIPE_WEBHOOK_SECRET` is misconfigured — or simply slow — every card payment marks the booking paid while the vendor's khata shows nothing received, and the payout/receivables math is wrong by the full amount. The reconciler *correctly* sets `reconciled: false`, which is the one good part; the bad part is that **nothing shows that flag to the vendor or admin**, so silent under-reporting is the default failure mode.
- **What works, to bound it:** the customer-facing success/decline/idempotency all behave correctly (booking 201 paid, 202 declined→Failed, re-pay refused). This is specifically the *ledger settlement* half.
- **Fix:**
  1. Before go-live, verify the production Stripe webhook endpoint is registered and `STRIPE_WEBHOOK_SECRET` is set — and prove one real `payment_intent.succeeded` posts a receipt (tie to REC-002).
  2. Make the reconciler's `reconciled: false` visible — a vendor/admin banner on any booking whose `receiptsTotal` disagrees with its `paymentStatus`.
  3. Consider posting a provisional receipt on the client-confirmed path so a dropped webhook degrades to a *reconcilable* record rather than a missing one.
- **Related:** REC-002 (swap Stripe test→live keys). This bug shows that swap is necessary but **not sufficient** — the webhook delivery must be proven, not assumed.

---

### BUG-001: Cookie banner covers Sign In — nobody on a phone can log in
- **Module / Screen:** Auth · `/login`
- **Role:** PUBLIC (blocks USER and VENDOR)
- **Severity:** High
- **Steps to reproduce:**
  1. Open `https://www.weddingwala.pk/login` at 390×844 (or 1366×657) in a fresh session
  2. Do not dismiss the cookie banner
  3. Click the centre of the **Sign In** button
- **Expected:** the form submits
- **Actual:** the click lands on the cookie dialog; nothing happens
- **Evidence:** `document.elementFromPoint(centre of Sign In)` returns the element inside `[aria-label="Cookie preferences"]`, not the button.

  | Viewport | Overlap | Hit at centre |
  |---|---|---|
  | 1366×657 | 356×34 px | **cookie banner** (left edge still works) |
  | 390×844 | 343×44 px | **cookie banner** (whole button) |
  | 360×720 | 313×48 px | **cookie banner** (whole button) |
  | 1366×768 / 1440×900 / 1920×1080 | none | Sign In ✓ |

  Also covers **Forgot password?**, **Create an account**, **Or list your business →** at phone widths.
- **Verified by:** measured across six viewports; the three clean widths prove it is height-dependent, not a measurement artefact. Independently reproduced when it broke the test harness's own login.

### BUG-002: `/dashboard/admin/complaints` renders an error boundary
- **Module / Screen:** Admin · Complaints
- **Role:** SUPERADMIN
- **Severity:** High
- **Steps to reproduce:**
  1. Sign in as super admin
  2. Go to `/dashboard/admin/complaints`
- **Expected:** the complaints queue
- **Actual:** "Something went wrong". Sidebar renders; the main content area does not.
- **Evidence:** the only 1 of 67 portal screens to match the error-boundary pattern in the superadmin sweep.
- **Verified by:** re-visited directly and confirmed the main region is empty.
- **Blocks:** flow **S4 · Complaints** entirely.

---

### BUG-012: A 5000-character name returns 500 instead of a validation error
- **Module / Screen:** API · `POST /api/v1/bookings`
- **Role:** USER
- **Severity:** High
- **Steps to reproduce:** submit a booking with `customerName` of 5000 characters
- **Expected:** `400` naming the field and its limit
- **Actual:** `500 "Error creating booking: current transaction is aborted"`
- **Verified by:** live request. This is the known VARCHAR-overflow signature — the value overruns its column instead of being rejected, aborting the transaction. Previously seen on vendor registration; **it is still live on the booking path.**
- **Why it matters beyond the 500:** a caller cannot tell this apart from a genuine server fault, and the aborted transaction means the failure happens *after* work has begun.

### BUG-013: Slot validation errors return the wrong HTTP status and put a machine code where the human message belongs
- **Module / Screen:** API · `POST /api/v1/businesses/:id/slots` → flow V3
- **Role:** VENDOR
- **Severity:** High — it defeats the entire purpose of the closure rule
- **Steps to reproduce:** create a slot ending at 23:00 on a non-exempt vendor type
- **Expected:** `422` with the vendor-facing sentence in `message`
- **Actual:**
  ```json
  HTTP 409
  { "message": "SLOT_ENDS_AFTER_CLOSURE",
    "data": { "code": "SLOT_CONFLICT",
              "details": { "reason": "Wedding halls have to be closed by 10 PM. Set this slot to end at 10 PM or earlier — otherwise customers can see it but can never book it." } } }
  ```
  Three separate problems in one response:
  1. **HTTP 409 Conflict**, but `venueSlotService` raises every one of these with **422** — `fail(msg, "SLOT_ENDS_AFTER_CLOSURE", 422)`. The status is overwritten somewhere between the service and the response.
  2. **`message` carries the machine code.** `lib/api/dashboard.ts:353` states callers "surface `error.response.data.message` verbatim" — so the vendor is shown the literal string `SLOT_ENDS_AFTER_CLOSURE`.
  3. **`data.code` is always `SLOT_CONFLICT`**, for all nine distinct validation failures, so a client cannot branch on the actual cause.
- **Verified by:** full response bodies captured for two different rules (`SLOT_ENDS_AFTER_CLOSURE`, `CAPACITY_LOOKS_LIKE_GUESTS`) — identical shape, identical generic `code`, human text buried at `data.details.reason`. Valid slots return 201 normally, so this is specific to the failure path.
- **Why this matters more than it looks:** the service documents that **40 of 115 active slots ended after 22:00** — every one a dead end at checkout — and the closure check exists so a vendor learns at 2pm rather than a customer at 1am. That fix only works if the vendor can *read* the refusal. A vendor who types 23:00 and sees `SLOT_ENDS_AFTER_CLOSURE` learns nothing, and the carefully-written sentence sitting one field away is never displayed.
- **Not pinned:** which frontend component renders the slot editor's error. The API shape is proven; the exact on-screen string is inferred from the documented convention, so confirm in the UI before closing.
- **The validation itself is correct.** All nine rules fire on the right inputs: `BAD_SLOT_TIME`, `EMPTY_SLOT`, `SLOT_ENDS_BEFORE_START`, `SLOT_ENDS_AFTER_CLOSURE` (22:01 and 23:00 both caught, 22:00 exactly accepted), `BAD_SLOT_CAPACITY` (0, −3, 1.5), `CAPACITY_LOOKS_LIKE_GUESTS` (500), `BAD_GUEST_CAPACITY`. Only the reporting is wrong.

### BUG-015: The vendor ledger shows Rs 2,832,750 owed on bookings that are fully paid
- **Module / Screen:** Vendor · Money / receivables · `GET /bookings/:id/order` → flow V6
- **Role:** VENDOR
- **Severity:** High
- **Steps to reproduce:** sign in as the vendor, open bookings 173 and 170, read the order balance.
- **Expected:** a fully-paid booking shows a balance of 0.
- **Actual:**

  | Booking | grand | `order.balance` (what the vendor sees) | receipts collected | true balance |
  |---|---:|---:|---:|---:|
  | 173 | 1,673,250 | **1,673,250** | 1,673,250 | **0** |
  | 170 | 1,546,000 | **1,159,500** | 1,546,000 | **0** |

  Both are marked `Paid`. The vendor's ledger shows **Rs 2,832,750 outstanding** across two bookings where nothing is owed.
- **Verified by:** `paisa-reconcile` and `order` cross-checked per booking. `trueBalance` (grand − receipts) is 0 for both, while `order.balance` (grand − displayedAdvance) is the full amount. The platform already knows: `paisaReconcileService` exists precisely to surface this, and its header says the displayed advance is *"NOT the sum of actual PaymentReceipts, so a logged receipt doesn't move it"*.
- **Scope — important:** both bookings are **seed data** (`@demo.weddingwala.pk`). 21 of the vendor's 34 bookings are seeded. So this proves the *displayed* ledger can contradict the receipts, and that it does so on this account today — it does **not** prove the live booking/payment path produces the divergence. That distinction needs a clean booking taken through payment on a seeded vendor (REC-007) before the severity is final.
- **Either way there is something to fix:** if the seeder writes bookings whose `downPayment` disagrees with their receipts, the demo data is internally inconsistent and every vendor demo shows phantom receivables. If the live path can do it too, it is Critical.
- **Wider observation:** 12 of 34 bookings show a non-zero delta. Ten are the harmless direction (an advance recorded on the booking with no `PaymentReceipt` row — expected for online payments). Two are the dangerous direction, and both are above.

---

### BUG-025: "My bookings" matches on email only — a customer's own bookings can vanish from their account

- **Module / Endpoint:** `GET /api/v1/bookings/simple-user-bookings` (`bookingController.getSimpleUserBookings`) → screen `/user/bookings`, flows U5 and U6
- **Role:** USER — every customer
- **Severity:** High — money-bearing records become unreachable, and with them the **Cancel** and **Pay now** buttons. Not Critical because the common path (book while signed in, with your own email) works.
- **Expected:** a booking linked to my account by `customerUserId` appears in my bookings.
- **Actual:** it does not. The query ORs `LOWER(customerEmail) = <my email>` with a `customerPhone` digit match, and **never references `customerUserId`** — the authoritative foreign key, which is populated on the row.
- **Proven live, both halves, on production:**
  ```
  signed in as user 3370  muhammadrehmanyousaf7866@gmail.com  phoneNumber 03001112233

  GET /bookings/simple-user-bookings  →  200, 3 bookings: 192, 190, 189

  booking 199  customerUserId 3370   customerEmail qa-dep@example.invalid    customerPhone 03001112233
  booking 198  customerUserId 3370   customerEmail qa-money2@example.invalid customerPhone 03001112233
  booking 197  customerUserId 3370   customerEmail qa-refund@example.invalid customerPhone 03001112233
  ```
  All three belong to user 3370 — that is how `createPdc` derived `customerUserId: 3370` from booking 199 — and none of the three is returned.
- **The phone fallback is dead code, which is why the phone match did not save it.** The handler reads:
  ```js
  const rawPhones = [user.phone, user.mobile, user.contactNumber].filter(Boolean);
  ```
  `userModel.js` defines **`phoneNumber`** and **`phoneE164`**. There is no `phone`, `mobile` or `contactNumber` attribute, so `rawPhones` is always `[]` and the phone branch never contributes a condition. The live proof is above: all three bookings carry `customerPhone` **03001112233**, an exact digit match for the user's `phoneNumber`, and still do not appear. **Email is the only match that works.**
- **How a real customer hits this:**
  1. **They change their email address.** Every past booking silently disappears from their account — they can no longer view, pay or cancel it. Nothing tells them why.
  2. **A vendor takes the booking by phone** and enters their own or a partial email, which is ordinary practice here. The customer never sees it even after registering with that phone number.
  3. They book as a guest with one email, then register with another.
- **Why it is worse than a listing bug:** `/user/bookings` is where **Cancel** and **Pay now** live. A stranded booking cannot be cancelled by the customer at all, so this defect also blocks the refund path (flow U6) for anyone it affects.
- **Fix:** add `customerUserId = req.user.id` as the first OR condition — it is the reliable link and it is already on the row. Separately, repair the phone branch to read `user.phoneNumber` / `user.phoneE164`, or delete it, because right now it silently does nothing while appearing to work.

---

## Medium

### BUG-003: `/dashboard/availability` — GET `/availability/setup` returns 503
- **Module / Screen:** Vendor · Availability
- **Role:** SUPERADMIN (needs re-test as VENDOR)
- **Severity:** Medium — a 5xx is a server fault regardless of role
- **Actual:** `503 GET /api/v1/availability/setup` on page load
- **Verified by:** captured from the network layer during the superadmin sweep.
- **Note:** did **not** reproduce on the vendor sweep — zero failing API calls there. Likely an admin-session-specific path. Needs isolating before it can be closed.

### BUG-004: Admin console calls vendor-scoped endpoints and logs errors
- **Module / Screen:** `/dashboard/calendar`, `/dashboard/holds`, `/dashboard/customers`
- **Role:** SUPERADMIN
- **Severity:** Medium
- **Actual:** `400 GET /vendor-holds` (calendar and holds), `403 GET /offlineCustomers` (customers) — the screens fire vendor-scoped calls under an admin session and log console errors.
- **Verified by:** vendor sweep produced **zero** failing calls on the same screens, isolating this to the admin session.

### BUG-005: Icon-only header button has no accessible name — on all 67 portal screens
- **Module / Screen:** shared portal header
- **Role:** SUPERADMIN (not reproduced as VENDOR)
- **Severity:** Medium
- **Actual:** a 36×36 `<button>` at x≈1214, y≈10 containing only an `<svg>` — no text, no `aria-label`, no `title`, no `aria-labelledby`, no `<title>` in the SVG.
- **Verified by:** resolved through the full accessible-name chain, not just `textContent`. **One defect with 67 occurrences, not 67 defects.**

### BUG-006: `/dashboard` second table has no column headers at all
- **Module / Screen:** Vendor · Dashboard home
- **Role:** VENDOR
- **Severity:** Medium
- **Actual:**
  ```
  table 0:  CUSTOMER  EVENT  DATE  AMOUNT  STATUS  PAYMENT   ✓
  table 1:  (blank) ×7                                        ← seven blank headers
  ```
- **Verified by:** read both tables' `thead th` text directly. Distinct from the 16 other screens, which have exactly one blank header — the actions column, which is conventional.

---

### BUG-010: Dialogs render without a `DialogTitle` — unlabelled for screen readers
- **Module / Screen:** Public · `/` and `/venues` (fires on load, so likely global)
- **Role:** USER / PUBLIC
- **Severity:** Medium
- **Steps to reproduce:**
  1. Open `https://www.weddingwala.pk/` with the console visible
  2. Read the console on load — no interaction needed
- **Expected:** no accessibility errors
- **Actual:**
  ```
  `DialogContent` requires a `DialogTitle` for the component to be accessible
  for screen reader users. If you want to hide the `DialogTitle`, you can wrap
  it with our VisuallyHidden component.
  ```
- **Verified by:** Radix emits this at runtime only when a `DialogContent` actually mounts without a title — the error is the proof, not an inference. Reproduced on two independent screens, in two separate runs.
- **Fix:** add a `DialogTitle`, wrapped in `VisuallyHidden` where the design has no visible heading.
- **Related:** [[ww_dialog_no_maxheight_mobile_trap]] — the shared `DialogContent` is already a known weak point.

### BUG-016: An unrecognised field on `reminders/log` returns 500, not 400
- **Module / Screen:** API · `POST /api/v1/bookings/:id/reminders/log` → flow V10
- **Role:** VENDOR
- **Severity:** Medium
- **Steps to reproduce:**
  ```
  POST /bookings/180/reminders/log  {}                    → 200  "Reminder logged"
  POST /bookings/180/reminders/log  {"kind":"baqaya"}     → 500  "Validation error"
  POST /bookings/180/reminders/log  {"type":"payment"}    → 500  "Validation error"
  ```
- **Expected:** `400` naming the offending field, or the unknown field ignored as it is elsewhere in this API.
- **Actual:** `500 "Validation error"` — the message admits it is a validation problem while the status says the server broke.
- **Verified by:** three live calls on the same endpoint and booking; the empty body succeeds, so the route and permissions are fine and the failure is specific to the field.
- **Same family as BUG-012** (5000-char name → 500). Both are validation failures escaping as 5xx, which makes a client unable to distinguish "you sent something wrong" from "we are broken", and hides real outages in the same bucket.
- **How it was found:** the UI sweep clicked a safe-classified control on `/dashboard`, which fired this POST and logged a 500 in the console.
- **Note — one row written:** the `{}` probe returned 200 and created reminder-log row `id=36` on booking 180. It is an append-only audit entry, not money, and it is disclosed here rather than quietly left.

### BUG-017: The "Admin" breadcrumb 404s on every admin screen
- **Module / Screen:** Admin console · breadcrumb, all `/dashboard/admin/*`
- **Role:** SUPERADMIN
- **Severity:** Medium
- **Steps to reproduce:** sign in as super admin, open any admin screen, click **Admin** in the breadcrumb.
- **Expected:** an admin index, or no link at all if there isn't one.
- **Actual:** `GET /dashboard/admin` → **404**.
- **Evidence:** the element is a breadcrumb segment, desktop-only:
  ```html
  <a href="/dashboard/admin" class="transition-colors hover:text-foreground">Admin</a>
  <!-- parent: "items-center gap-1.5 hidden md:block" -->
  ```
- **Verified by:** the link-resolution pass caught it on **six** admin screens (`vendor-queue`, `documents`, `disputes`, `complaints`, `platform-pulse`, `audit-logs`), then confirmed directly with an HTTP request. It is the only dead link found in **1,300+ links** across 58 screens.
- **Fix:** either create `/dashboard/admin` as an index, or render the segment as plain text rather than a link. `hidden md:block` means only desktop admins ever see it.

### BUG-019: A raw unrounded rating renders on the booking page
- **Module / Screen:** Public · `/[id]/booking` step 1 → flow U3
- **Role:** USER — every customer who starts a booking
- **Severity:** Medium — cosmetic, but on the highest-intent screen in the funnel
- **Steps to reproduce:** sign in as a customer, open `/3358/booking`, read the rating beside the venue name.
- **Expected:** `4.3`
- **Actual:** **`4.333333333333333`**
- **Evidence:** the text node is rendered inside a deliberately styled element, so it is display copy, not a stray debug value:
  ```
  text:   "4.333333333333333"
  parent: class="font-display italic text-bridal-charcoal tabular-n…"
  ```
- **Verified by:** a TreeWalker over the live DOM looking for any text node matching `^\d+\.\d{3,}$`. Exactly one hit on the page, in the rating slot next to "Rehman Grand Marquee".
- **Fix:** round at the render site — `rating.toFixed(1)`. The `tabular-nums` class shows the slot was designed for a short number.
- **Why it matters more than it reads:** this is the first screen after a customer decides to book. An unrounded float is the classic tell of an unfinished page, on the screen where confidence matters most.

---

### BUG-021: The public registration endpoint creates a business with no name, and it can be approved and served

- **Module / Endpoint:** `POST /api/v1/businesses/create-business-with-vendor` — public, CAPTCHA + rate-limited
- **Role:** PUBLIC → SUPERADMIN (who then approves a nameless row)
- **Severity:** Medium — not reachable from the real form, but reachable, and the row reaches production in an approved state
- **Steps to reproduce:** POST a valid registration payload with the `name` key absent. Approve it in the vendor queue. Then `GET /api/v1/businesses/<id>` unauthenticated.
- **Expected:** 400 — a marketplace listing cannot exist without a business name.
- **Actual:** **201.** The business is created, enters the review queue, is approvable, and is publicly readable:
  ```
  GET /api/v1/businesses/3365   →  200
  { "id": 3365, "name": null, "status": "approved", "city": "Lahore",
    "minimumPrice": "100000.00" }
  ```
  Every sibling field written in the same payload persisted — `city`, `description`, `minimumPrice`. Only `name` is null, because nothing required it.
- **Verified by:** business 3365 on live production, created by `scripts/seed-qa-vendor.mjs`, approved through the admin console, then read back unauthenticated. It renders as a nameless approved venue.
- **Root cause:** `businessController.js:424` builds the payload as `name: req.body.name` with no preceding check. The only guard is client-side, at `components/business-registration-form.tsx:490`:
  ```js
  if (!formData.name) currentErrors.name = "Brand Name is required";
  ```
- **Why it is Medium and not Low:** the endpoint is *public*. Client-side validation is not a control on a public endpoint — it is a convenience for honest users. Anything that reaches this route directly bypasses it, and the result is an approved listing on a marketplace whose entire product is discovery by name.
- **Why it is Medium and not High:** no path through the shipped UI produces it. Every real registration sends `name`.
- **Fix:** reject a missing or blank `name` server-side, in the same block that already validates `password` and `vendorType`. Two lines, next to guards that already exist.
- **Found via:** my own seed script sent `businessName` instead of `name` — the API ignored the unknown key and accepted the registration without one. The wrong key was my mistake; that it was *accepted* is the product's.

**The name is not the only unvalidated field — the same hole makes the listing unbookable.** `subBusinessType` is also client-validated only (`business-registration-form.tsx:528` — *"Business type is required"*) and also defaults to `[]` server-side with no check. That array drives the event picker on step 1 of the booking flow, so an API-created vendor reaches production **with a dead booking page**. Measured on the live site, signed in as a customer:

| | `/3358/booking` (real vendor) | `/3365/booking` (API-created) |
|---|---|---|
| Vendor name shown | "Rehman Grand Marquee" | **"Vendor"** |
| `subBusinessType` | `["Banquet Hall"]` | `[]` |
| Step 1 event options | Wedding, Engagement, Parties, Fashion Show, Dinner | **none** |
| Step-1 panel HTML | 5,615 chars | 370 chars |
| "Continue" | disabled until you choose | **disabled forever** |

So the real cost of this bug is not a cosmetic blank name. A business can be created, **approved by an admin**, and served publicly while being impossible to book from and displaying the literal placeholder "Vendor" where its name belongs. Nothing in registration, in the admin queue, or on the public page flags it.

- **Wider fix:** validate registration *completeness* server-side — at minimum `name` and a non-empty `subBusinessType` — and give the admin vendor-queue a visible "incomplete listing" state so an unbookable business cannot be approved into public search by accident.

---

### BUG-022: A staff member paid in advance sees "0 payslips" — the money is invisible until the shift date arrives

- **Module / Endpoint:** `GET /api/v1/staff/me/payslips` → flow T4
- **Role:** STAFF — the lowest-paid person on the platform, checking whether they were paid
- **Severity:** Medium — no data is lost and nothing is insecure, but a paid staffer is shown an empty payslip list
- **Steps to reproduce:**
  1. As a vendor, roster a shift dated **tomorrow** and mark it `paid`.
  2. Sign in as that staff member and open payslips.
- **Expected:** the payslip for the shift they have already been paid for.
- **Actual:** **an empty list.** The row exists and is `paid`; it is simply outside the query window.
- **Evidence** — two shifts, identical but for the date, both paid, same staff account:
  ```
  shift 270  shiftDate = today      paid 2000 cash
  shift 271  shiftDate = tomorrow   paid 2000 cash

  GET /staff/me/payslips              → "1 payslip(s)"   from 2026-02-16 to 2026-08-15   ids [270]
  GET /staff/me/payslips?to=<+30d>    → "2 payslip(s)"                                   ids [271, 270]
  ```
  Widening the window alone makes the missing payslip appear, which isolates the cause exactly.
- **Root cause:** `staffPortalController.listMyPayslips` defaults the range to `[today − 180 days, today]`. The upper bound is *today*, so a paid shift dated in the future is filtered out by `shiftDate BETWEEN from AND to`.
- **Why this is not an edge case in Pakistan:** advance dihari is normal practice. Dhol players, waiters and valets are routinely paid before or on the morning of a function. This is the ordinary case, not an unusual one.
- **Why it matters:** the staff portal exists so a worker can confirm they were paid. A worker who was paid, opening the screen built to tell them so, is told nothing is there. The likely next step is asking the vendor to pay again.
- **Fix:** default the upper bound to the later of today and the furthest paid shift — or simply leave `to` unbounded when not supplied. The lower bound is the one doing useful work.
- **Note:** the same 180-day window governs `listMyShifts`; worth checking whether a future *rostered* shift is invisible for the same reason. Not tested here.

---

### BUG-027: The session JWT is readable by JavaScript, and stored XSS is already possible

- **Module:** auth session handling (cookie + localStorage)
- **Roles:** all
- **Severity:** Medium on its own; **High in combination with BUG-011**, which proves stored XSS is achievable
- **Observed:** `document.cookie` returns the session token in plain text on a normal signed-in page:
  ```
  user_id=3370; auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMzNzAsImp0aSI6...
  ```
  The `auth_token` cookie is **not `httpOnly`**, so any script running on the page can read a valid session JWT. The app also keeps a token in `localStorage` (clearing it breaks the portal), which is JS-readable by design.
- **Why this matters here rather than in the abstract:** **BUG-011** on this same list records that `<script>` tags are accepted and stored raw in `customerName`. Stored XSS plus a JS-readable session token is full account takeover — a payload in a booking name that runs in the vendor's dashboard can exfiltrate their session and act as them.
- **Not verified:** I did not attempt to chain them. BUG-011 established that the script tag is *stored*; whether it *executes* unescaped on a vendor screen was not tested, and React escapes by default. That test is the one that decides whether this pair is Critical.
- **Fix:** set `httpOnly` + `Secure` + `SameSite` on `auth_token`, and stop mirroring the token into `localStorage`. If the axios interceptor needs it, read it from a same-origin endpoint instead.
- **Also exposed:** `user_id` is a plain readable cookie. Harmless alone; useful to an attacker enumerating targets.

---

### BUG-024: Event selection never says what you selected — the toggle state is visual only

- **Module / Screen:** `components/booking/steps/event-selection-step.tsx` → flow U3 step 1
- **Role:** USER — any customer using a screen reader to book
- **Severity:** Medium — WCAG 2.1 **4.1.2 (Name, Role, Value)** failure on the first step of the revenue path
- **Steps to reproduce:** open `/<id>/booking`, select "Wedding", and inspect the toggle buttons.
- **Expected:** the selected option exposes its state — `aria-pressed="true"` on a toggle button, or `role="checkbox"` + `aria-checked` given the step says *"Select the events you'd like to book"* (multi-select).
- **Actual:** the state is carried **entirely by colour**. Measured live after selecting "Wedding":
  ```
  Wedding      border rgb(145, 101, 57)   aria-pressed: null  aria-selected: null  role: null
  Engagement   border rgb(237, 217, 195)  aria-pressed: null  aria-selected: null  role: null
  Parties      border rgb(237, 217, 195)  aria-pressed: null  aria-selected: null  role: null
  ```
- **Why it matters:** the buttons are labelled, so they can be found and pressed — but nothing tells the user whether pressing worked. On a multi-select step where every choice changes what is booked and what is charged, a user who cannot see the border colour has no way to confirm their own selection before paying. It also fails for anyone who cannot distinguish those two browns.
- **Fix:** add `aria-pressed={isSelected}` to each toggle. One attribute.
- **Related:** same class as BUG-005 (icon-only button with no accessible name) and BUG-010 (dialogs with no `DialogTitle`) — this codebase renders custom controls without their ARIA state, and it is now confirmed on the booking flow itself.

---

### BUG-023: An empty `expertise` array kills the booking page — the 5-event fallback can never fire

- **Module / Screen:** `components/booking/steps/event-selection-step.tsx:34-45` → flow U3 step 1
- **Role:** USER — every customer trying to book an affected vendor
- **Severity:** Medium — a one-line robustness defect on the highest-intent screen, but **measured live exposure today is zero real vendors** (see below)
- **Steps to reproduce:** give a business `expertise: []` (or `serviceProvided: []`), then open `/<id>/booking` as a signed-in customer.
- **Expected:** the five default events, which the code explicitly provides as a fallback.
- **Actual:** **no options at all**, and "Continue" is disabled forever. The flow cannot start.
- **Root cause** — the guards test for presence and array-ness but never for *length*, so an empty array is returned as the answer and the fallback below it is unreachable:
  ```js
  if ('expertise' in venue && venue.expertise && Array.isArray(venue.expertise))
    return venue.expertise            // ← [] is truthy and IS an array → returns []
  if ('serviceProvided' in venue && venue.serviceProvided && Array.isArray(venue.serviceProvided))
    return venue.serviceProvided      // ← same
  ...
  return ["Wedding", "Engagement", "Parties", "Fashion Show", "Dinner"]  // never reached
  ```
- **Verified live, side by side, signed in as a customer:**

  | | `/3358/booking` | `/3365/booking` |
  |---|---|---|
  | `expertise` / `serviceProvided` | `null` / `null` | `[]` / `[]` |
  | Which branch runs | falls through to the default | returns `[]` |
  | Options rendered | Wedding, Engagement, Parties, Fashion Show, Dinner | **none** |
  | Step-1 panel HTML | 5,615 chars | 370 chars |

  `null` is falsy, so the real vendor reaches the fallback. An empty array does not. That single difference is the whole bug.
- **Measured exposure — stated plainly because it bounds the severity:** across **600 live businesses**, 596 have `null` (OSM imports, unaffected), 3 are populated (fine), and **1 is empty — my own QA fixture.** No real vendor is broken today.
- **Why file it anyway:** `createBusinessWithVendor` normalises both fields with `parseJsonField(req.body.expertise, [])`, so **the API's own default is the broken value**. The vendor step forms happen to populate `expertise` for the types checked, which is the only reason this is latent rather than live. It is one `.length` away from being correct, on the screen where the money is.
- **Fix:** `Array.isArray(x) && x.length > 0` on both guards. Optionally default the column to `null` rather than `[]` at registration.
- **Correction to my own first reading:** I initially attributed the dead page to `subBusinessType` being `[]` and set it to `["Banquet Hall"]` to test — **the page stayed dead**, which disproved it. `subBusinessType` has nothing to do with this list. The cause above is the one confirmed by reading the component and reproducing both branches.

---

## Low

### BUG-033: The admin claims queue default view (and `?status=all`) return empty — pending claims are invisible unless you filter by the exact status

- **Module / Screen:** `GET /claims/admin/claims` (super-admin claim moderation) → flow S2/V2
- **Role:** SUPERADMIN
- **Severity:** Medium — an admin working the claims queue sees "no claims" while claims are actually pending action
- **Steps to reproduce:** create a claim (`POST /claims/start` on a claimable listing → status `pending_otp`), then as super-admin `GET /claims/admin/claims` (no filter) and `GET /claims/admin/claims?status=all`.
- **Expected:** the default view (or `all`) surfaces every open claim, including `pending_otp`, so the admin can see and act on them.
- **Actual:** both the default (no `status`) and `?status=all` return `{ claims: [] }`. The four live `pending_otp` claims only appear under the **exact** `?status=pending_otp` filter. Verified live: `?status=pending_otp` → 4 rows; default → 0; `?status=all` → 0.
- **Impact:** a moderator who opens the queue sees nothing and reasonably concludes there's no work — while claims sit unattended. `all` being empty is especially misleading.
- **Fix:** make the default view show actionable statuses (at least `pending_otp` + `otp_verified` + `evidence_submitted`), and make `?status=all` mean *all* rather than *none*.

---

### BUG-032: The dashboard اردو (Urdu) language toggle is a dead control — it sets `lang="ur"` but never translates the UI

- **Module / Screen:** dashboard header language switch (`EN` / `اردو`), every `/dashboard/*` screen → flow X7
- **Role:** VENDOR / SUPERADMIN (the authed portal)
- **Severity:** Medium — a prominent, persistent affordance that does nothing, aimed squarely at the Urdu-preferring vendors this product targets
- **Steps to reproduce (live, 360×720):** log into the portal → open any dashboard screen (tested `/dashboard/bookings/203` and `/dashboard/settings`) → click **اردو** in the header.
- **Expected:** the UI chrome switches to Urdu script and `dir="rtl"` (or, if Urdu isn't wired yet, the toggle shouldn't be shown).
- **Actual:** `document.documentElement.lang` flips to `ur` and **persists across a hard reload**, but the content stays English / Roman-Urdu, `dir` stays `ltr`, and the Urdu character count on the page stays at ~8 (just the toggle's own label). Verified on two screens and after an `ignoreCache` reload — the i18n content layer is simply not wired to the toggle.
- **Not to be confused with:** real **Urdu-script _data_** renders fine — the public homepage shows vendor names like `ماڈرن مارکی` / `قصر نور میرج ہال` correctly with no overflow. This bug is specifically the **UI-translation toggle**, not glyph rendering.
- **Context:** the portal deliberately uses Roman-Urdu labels ("Naam kaise dikhayein?", "Policy accept karwayen", "Refund nikalein", pricing tiers "Aasaan / Aam / Sakht"), so the audience clearly reads Urdu — which makes a dead اردو switch more misleading, not less.
- **Fix:** either wire the toggle to the i18n dictionary + `dir="rtl"` for the dashboard, or hide it until Urdu translations exist. Don't ship a control that only mutates an attribute.

---

### BUG-031: An expense can be logged against a business you don't own — no ownership check on create

- **Module / Screen:** `POST /expenses` (`vendorExpenseController.createExpense`) → flow V6
- **Role:** any authenticated user (a customer suffices)
- **Severity:** Low — no data exposure and no report pollution, but a data-integrity / defence-in-depth gap
- **Steps to reproduce:** as a plain customer account, `POST /expenses { businessId: 3365, amount: 1, category: "other", spentDate: "2026-08-01" }` (3365 is a vendor's business the customer has no relationship with).
- **Expected:** `403/404` — the caller doesn't own that business, mirroring the ownership check the same controller already performs when a `bookingId` is supplied.
- **Actual:** `201 Expense logged`. The row is created with `businessId: 3365` and `createdByUserId: <customer>`. Verified live; the forged row (id 560) was then deleted with the customer's own token.
- **Why it's only Low:** every read path is `createdByUserId`-scoped — `listExpenses` (`where.createdByUserId = req.user.id`), `perEventPnl` (`ledgerScope: { createdByUserId }`), and `analytics/monthly-pnl` (`ownerWhere = { createdByUserId: req.user.id }`). So the forged expense lives entirely in the *creator's* private ledger and never appears in the real owner's list, per-event P&L, or monthly P&L. No cross-tenant read, no financial pollution today.
- **Risk if left:** the pattern is fragile — the day any future report aggregates `VendorExpense` by `businessId` without the creator filter, this becomes a live P&L-poisoning vector. It also leaves orphan rows carrying a `businessId` the creator doesn't own.
- **Fix:** in `createExpense`, when `businessId` is present, run the same `checkBusinessOwnership(businessId, req)` guard the controller already applies to `bookingId`, and reject non-owners with `403`.

---

### BUG-030: Search shows "716 RESULTS" directly above "No vendors found"

- **Module / Screen:** `/venues` (and sibling category listings) → flow U1
- **Role:** USER / PUBLIC
- **Severity:** Low — cosmetic contradiction on the discovery page, not blocking
- **Steps to reproduce:** open `/venues`, type a nonsense query (`zzqxwv…`) into the "Name, city, type…" search box.
- **Expected:** the result-count header updates to match what's shown — "0 results" / hidden.
- **Actual:** the list correctly collapses to the **"No vendors found"** empty state (good — no crash), but the header still reads **"716 RESULTS"** immediately above it. The count is the unfiltered category total and does not react to the search.
- **Verified live** on production: nonsense query → 0 cards → "No vendors found" rendered → header text still `716 RESULTS`.
- **Fix:** drive the count from the same filtered/searched collection the cards render from, or hide it in the empty state.

---

### BUG-007: `/dashboard/settings` has no `<h1>` — and a few screens have generic `<title>`s
- **Role:** VENDOR / SUPERADMIN
- **Severity:** Low
- **Actual:** `/dashboard/settings` has no page-level heading, unlike every other portal screen.
- **Extended (dashboard sweep, 2026-08-15):** most dashboard screens set a page-specific document title (`Dashboard : Inventory`, `Dashboard : Tax report`, `Dashboard : Quote requests`, …), but **`/dashboard/settings/security` and `/dashboard/chat` fall back to the generic `Wedding Wala — Dashboard`**. Same class of inconsistency as the missing `<h1>` — the per-screen title/heading is set unevenly across the 76 dashboard pages. Cheap to normalise; helps tab identification and accessibility.

---

### BUG-018: Two "Approve" buttons are clipped off the left edge at 360px
- **Module / Screen:** Admin · `/dashboard/admin/vendor-queue`
- **Role:** SUPERADMIN
- **Severity:** Low — cosmetic, not blocking
- **Actual:** at 360×720 two Approve buttons render at `left: -19px`, so 19px is cut off past the viewport edge. `scrollIntoView` does not move them (it is horizontal clipping, not vertical position).
- **Still usable:** the button spans −19 → 91, so **91px remains on screen and tappable**. This is visual clipping, not an unreachable control — recorded at Low for that reason rather than as a blocker.
- **Verified by:** geometry measured before and after scrolling, at 360px, on the live screen.
- **Note:** approving a vendor is a FORBIDDEN action for this campaign, so the button was never clicked — only measured.

---

## Retracted — reported then disproved

Kept deliberately. A finding that was withdrawn is evidence the check was tested.

- **`controlsOnScreen` on `/dashboard/business`, `/reviews`, `/trade-ops` (124 controls).** All 100 sampled sat inside the table's horizontal scroll viewport — reachable by scrolling, working as designed. The check was fixed in both `scripts/module-contract-run.mjs` and `cypress/support/module-suite.ts` to ignore controls with a scrollable ancestor.
- **"Vendors can reach admin pages."** They cannot. The page renders *"Admin only — You don't have permission to view this page."* and the API returns **403** to a vendor token on `/admin/platform-pulse` and `/users`. The gate holds in both layers; the contract was wrongly asserting a table on a page correctly refusing to show one.
- **`tableOrEmptyState` on 8 screens.** Same cause as above.
- **"PDCs cannot be logged against a QA booking" (flow V-PDC, declared BLOCKED).** They can. The booking *list* projection simply does not return `customerUserId`, and my discovery step filtered on that field — so it found none and declared the whole flow blocked. `createPdc` derives the customer from the booking itself (Issue #41), which is the path a vendor actually uses. Probed directly: `POST /pdcs {bookingId: 199}` → **201**, `customerUserId: 3370` derived. The flow then ran to 35 assertions, 0 failures. **Same class of error as the `data.data` shape trap below — twice in one session.**
- **"New packages do not appear in the vendor's package list" (PKG-03).** They do. `GET /packages/vendor-packages` returns rows at `data.data`; I read `data.packages`. The package was present the whole time, at `meta.total: 1`.
- **"Malformed `features` is accepted" (PKG-09).** Working as designed. `validateCatalogJson` is a *bound*, not a schema — it enforces byte size and nesting depth only, deliberately, because `features` is free-form catalogue JSON. `{junk: true}` is within both bounds. My expectation was invented rather than read from the validator.
- **"A staff leave request never reaches the vendor's queue" (STP-25).** It does. `GET /staff/leave` returns rows at `data.leave`; I read `data.requests`. The request was sitting in the queue the whole time — *"1 leave request(s)"*, `id: 1`, status `pending`. **The third response-shape false positive in this session** (`data.data` for packages, the absent `customerUserId` projection for PDCs, and now `data.leave`). Three different keys across three subsystems; the lesson is to read the controller's `apiResponse` call before asserting on its shape, not after.
- **"A revoked staff session keeps working" (STP-39).** It does not — access is refused. The status is **400**, not the 401/403 my predicate accepted, and that choice is deliberate and documented at `authMiddleware.js:205-213`: only a 401 makes the FE axios interceptor force-logout, so a *transient* DB error during the user lookup must stay 400 or an outage would log every user out at once. Security holds; the status is a UX inconsistency, filed as REC-012.
- **"Stored `customerName` XSS executes in the vendor dashboard" — tested, does NOT execute there.** BUG-011 proved a `<img onerror>` / `<script>` name is *stored* raw. I then created booking 200 with `QA<img src=x onerror="window.__xssProbe=1">` and opened `/dashboard/bookings` in a real browser as the vendor. Result: `window.__xssProbe` **undefined**, zero injected `<img src="x">` elements, and the payload rendered as literal visible text in the row. React escapes it on this surface. So the booking-table render is safe — the stored value is *not* dangerous *there*. (The danger is the JSON-LD path, BUG-028, which is a different sink. The stored-value finding BUG-011 stands as an input-validation defect and the raw material for BUG-028.)
- **"Package create returns the wrong status" (PKG-01).** `200` rather than `201`. Not a defect — the endpoint has always returned 200 with `"Package created successfully"`. It is inconsistent with `POST /staff/members`, which returns 201; recorded as a consistency note in QA_RECOMMENDATIONS (REC-011), not as a bug.
