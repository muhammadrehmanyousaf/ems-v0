# The customer surface — logic and endpoint map

**Authoritative map of every customer-side (couple-facing) screen, the logic it runs, and the exact endpoint it calls.** Written so the mobile customer app (`../weddingwala-app`) can mirror the web without guessing.

Every endpoint below was **probed against live production** on 2026-08-17 with a real customer token. Status column = what prod actually returned, not what the router file implies. Re-probe before trusting this after backend changes; the probe script is `scratchpad/probe-customer-api.mjs`.

- Base URL: `${BACKEND_URL}api/v1/…` — `BACKEND_URL` from [lib/backend-url.ts](../lib/backend-url.ts), **trailing slash required**.
- Every response is the envelope `{ status: boolean, message: string, data: T | null }`. Unwrap to `data`.
- Auth: `Authorization: Bearer <token>`. Token in `localStorage` first, then the `auth_token` cookie ([lib/axiosConfig.js](../lib/axiosConfig.js)).
- Force-logout trigger: HTTP 401 **or** `message === "Please get your account activated"`.

---

## 1. Traps — read these first

These cost real debugging time. Every one is verified on prod.

| # | Trap |
|---|---|
| 1 | **`GET /bookings/:id` does not exist → 404.** Use **`GET /bookings/:id/with-availability`** → `{ booking, availabilityContext }`. The web's booking-detail page instead fetches the whole list (`/bookings/simple-user-bookings`) and finds the row client-side. |
| 2 | **`GET /bookings` is the VENDOR listing**, not the customer's. For a customer it returns `{ data: [], … }` with `message: "No businesses found for this vendor"`. The customer's bookings are **`/bookings/simple-user-bookings`** (bare array). |
| 3 | **Ownership resolves by `userId`, not `customerEmail`.** `/bookings/:id/{refund-preview,refund-requests,policy-acceptance,order,timeline}` return **403 "Not your booking"** for bookings that `simple-user-bookings` lists as the customer's. Customer-side cancel/refund UI is blocked on a backend fix — do not build against these until it lands. |
| 4 | **Complaints mount at `/complaints`**, not `/support-complaints` (404). |
| 5 | **Pagination is inconsistent per domain.** `{data,pagination}` for businesses · `{results,meta}` for packages/favorites · `{data,meta}` for menus · `{notifications,total,page,totalPages,hasMore}` · bare array for `simple-user-bookings`, `payments/*`, `chat/conversations`, `reviews/my-reviews`. Never assume a shape. |
| 6 | **Vendor-only on a business:** `/businesses/:id/{cancellation-policy,completeness,recurring-blocks}` → 403 for customers. `/quotes/business/:id` → 403 "That business isn't yours". |
| 7 | **`/payments/pk/methods` requires `?bookingId=`** or it 400s. |
| 8 | A **2xx body can still be a failure** — `status: false` inside HTTP 200. Treat it as an error, never as data. |
| 9 | Business rows carry **111 columns**. Type only what you consume and tolerate extras. |
| 10 | ~98% of businesses are **unclaimed OSM imports** — null price, no images, no owner. Every surface must degrade gracefully. |

---

## 2. Screen → endpoint map

Paths are under `app/(main)/`. LOC indicates how much logic lives there.

### Authenticated customer app — `user/`

| Screen | LOC | Endpoints | Status |
|---|---:|---|---|
| `user/bookings` | 659 | `GET /bookings/simple-user-bookings`<br>`PATCH /bookings/:id/cancel`<br>`DELETE /bookings/:id/cancel-pending` | 200 |
| `user/bookings/[id]` | 1060 | same list + find-by-id · `GET /bookings/:id/refund-preview` (via `lib/api/bookingOrder`) | list 200 · refund-preview **403** |
| `user/bookings/[id]/pay` | 186 | `GET /bookings/simple-user-bookings` → then `PaymentAPI` | 200 |
| `user/payments` | 626 | `GET /payments/history` · `GET /payments/pending` · `GET /payments/booking-status/:bookingId` | 200 |
| `user/plan` | 255 | `GET /wedding-plans/mine` | 200 · 1 plan |
| `user/plan/[id]` | 514 | `GET /wedding-plans/:id` + events/items CRUD | 200 |
| `user/plan/[id]/checkout` | 491 | `POST /wedding-plans/:id/availability` · `POST /wedding-plans/:id/checkout` | live |
| `user/plan/[id]/pay` | 436 | `GET /wedding-plans/:id/payment-summary` | live |
| `user/umbrellas` | 213 | `GET /wedding-umbrellas/mine` | 200 · 1 |
| `user/umbrellas/[id]` | 854 | `GET /wedding-umbrellas/:id` · `/preview-bundle` · `link` · `unlink` · `cancel` · `portal-token` | live |
| `user/quotes` | 11 | `GET /quotes/mine` (delegates to a component) | 200 · 3 quotes |
| `user/favorites` | 313 | `GET /favorites` · `POST /favorites` · `DELETE /favorites/:businessId` | 200 |
| `user/notifications` | 446 | `GET /notifications?page&limit&unreadOnly` · `/unread-count` · `PATCH /:id/read` · `PATCH /read-all` · `DELETE /:id` | 200 |
| `user/conversations` | 114 | `GET /chat/conversations` · `/chat/contacts` · `/chat/unread-total` · `GET,POST /chat/conversations/:id/messages` | 200 |
| `user/reviews` | 255 | `GET /reviews/my-reviews` | 200 (empty) |
| `user/complaints` | 158 | `GET /complaints/mine` · `GET /complaints/:id` | 200 · 6 rows |
| `user/activity` | 83 | `GET /activity/feed?page&pageSize` | 200 · 30 events |
| `user/profile` | 678 | `GET /users/profile/me` · `PATCH /users/profile` · `PATCH /users/change-password` · `POST /users/upload-profile-picture` | 200 |
| `user/settings` | 765 | same three write endpoints as profile + `lib/api/auth` (`/auth/sessions`, `/auth/2fa/*`, `/auth/verify-{email,phone}`) | 200 |

### Public / tokenised

| Screen | LOC | Endpoints |
|---|---:|---|
| `search` | 676 | `hooks/use-vendors` → `GET /businesses`, `GET /businesses/businesses-by-vendor` |
| `compare/[vendorType]` | 252 | business list + detail |
| `(booking)/[id]/booking` | 24 → 1366 in `components/booking/booking-form.tsx` | see §3 |
| `review/[token]` | 413 | `GET,POST /public/bookings/review/:token` · `POST …/photos` |
| `sign/[token]` | 712 | `GET /public/function-sheets/share/:token` · `…/sign` · `…/pdf` |
| `wedding/[token]` | 446 | `GET /public/wedding-umbrellas/portal/:token` · `…/sheets/:id/beo.pdf` |
| `claim/[id]` | 18 | `POST /claims/start` · `/:id/verify` · `/:id/finalize` · `/:id/evidence` |
| `planning-tools/*` | — | **localStorage only. No API.** Budget, checklist, guest-list, timeline never reach the server. |

⚠️ Tokens in `/sign/`, `/review/`, `/wedding/` are **43-char base64url and case-sensitive**. `middleware.ts` exempts them from the lowercase 301 via `CASE_SENSITIVE_PATHS`. Lowercasing them broke every customer contract link.

---

## 3. The booking flow — the most important logic in the product

Entry `app/(main)/(booking)/[id]/booking/page.tsx` (24 lines) → **[components/booking/booking-form.tsx](../components/booking/booking-form.tsx)** (1366 lines) orchestrating `steps-v2/`:

```
date-time-step.tsx   956   date + slot + space + guest count
package-step.tsx     276   package / menu / bundled add-ons
review-step.tsx      655   final review
```

Payment is NOT a step in this flow. The customer submits a request, the vendor
accepts, and only then are they shown where to pay — on
`steps/bank-transfer-screen.tsx`, reached inline after submit or later from
`/user/bookings/[id]/pay`. `booking-payment-screen.tsx` (Stripe) was deleted.

`steps/` (11 files) is the **older** flow. `steps-v2/` is current — check which is wired before editing.

### 3.1 Loading the vendor

`GET /businesses/:id` → the 111-column row, including `packages[]`, `menus[]`, `reliability`, `isFavorite`, `availabilityPrimitive`, `pricingMode`, `minLeadDays`/`maxLeadDays`, `vacationMode`, `legalGuestCap`, `eventClosingTime`, `oneDishPolicy`.

### 3.2 The calendar — two engines, and the fallback matters

**Engine A — vendor slot templates (capacity-aware).** Preferred when the vendor has configured them.

```
GET /businesses/:id/slots/availability/bulk?from=YYYY-MM-DD&to=YYYY-MM-DD[&subVenueId=]
    → { from, to, days: { "2026-09-14": SlotAvailabilityRow[] } }        ✅ 200 on prod

SlotAvailabilityRow = {
  slotTemplateId, label, startTime, endTime,
  capacity,            // concurrent BOOKINGS this slot allows
  used, free,
  unitGuestCapacity,   // guests ONE booking may bring — NOT capacity
  subVenueId           // null = venue-wide
}
```

`capacity` vs `unitGuestCapacity` is the pair the vendor form conflated badly enough to publish *"150 bookings at once"*. Render `free of capacity left`, and validate guests against `unitGuestCapacity`.

**Space scoping is load-bearing.** Fetch with the customer's chosen `subVenueId`. Caught live on business 3358: five spaces, and a slot belonging only to the space "afsana" was offered to a customer who had picked a different hall — a bookable time that does not exist in the room they chose. A space defining no slots inherits the venue-wide set. **Changing space must clear `slotTemplateId` and drop the month cache**, or the customer gets booked into a slot the new hall doesn't have.

**Engine B — fixed legacy periods.** Fallback when the vendor has no templates. Four slots, defined **once** in [lib/booking/slot-vocabulary.ts](../lib/booking/slot-vocabulary.ts) (`LEGACY_PERIODS`):

| `bookingTime` | Label | Hours |
|---|---|---|
| `10:00` | Whole day | 10:00–22:00 |
| `09:00` | Morning | 09:00–12:00 |
| `12:00` | Midday | 12:00–16:00 |
| `18:00` | Evening | **18:00–22:00** |

`bookingTime` is the slot's **identity**, so two slots cannot share a start time — that's why "Whole day" is 10:00 and not 09:00 (09:00 has 10 live bookings; re-timing them would misrepresent real calendars). `14:00 Afternoon` and `17:00` are retired from the picker but kept in `LEGACY_ALIASES` so their stored bookings still render with real names.

🔴 **Evening ends 22:00, never 23:00.** Punjab wedding halls must close by 10 PM. A canonical "Evening → 23:00" shipped once, vendors copied the platform's own example into their templates, and **40 of 115 active slots ended past closure**. Nothing caught it until a customer pressed Pay & Confirm. `CLOSING_MINUTES = 22 * 60` in [lib/booking/preflight.ts](../lib/booking/preflight.ts).

**Naming a slot:** always `slotText(slotFromBooking(row))`. Resolution order — vendor snapshot → canonical period → bare clock → raw string. Never build a 5th label map; there were seven and they disagreed. Punctuation is **"9 AM to 12 PM"**, not an en-dash: Pakistani vendors misread the dash (Issue #46).

**Other calendar inputs:**

```
GET /bookings/availability?businessIds=<id>&month=YYYY-MM   → { availability: { "<id>": {…} } }   ✅
GET /bookings/blocked-dates?businessId=<id>                  → { blockedDates: [] }               ✅
GET /businesses/:id/resources                                → { resources, useMultiResourceCapacity } ✅
GET /businesses/:id/recurring-blocks                         403 — vendor only
```

Also gate on the business row's own `minLeadDays`, `maxLeadDays`, `vacationMode` + `vacationStartsAt/EndsAt`, and `honorMarketplaceBlackouts`.

### 3.3 Guest count is per-vendor-type

```
GET /bookings/meta/guest-count-label?businessId=<id>   ✅ 200
    → { vendorType, businessId, label, plural, semantic, capacityCheck, helpText }
```

Use this rather than hardcoding "Guests" — a caterer counts plates, a car rental counts seats. Validate against `legalGuestCap`, `comfortCapacity`, `seatedCapacity`, and the slot's `unitGuestCapacity`.

### 3.4 Pre-flight — fail SETUP problems before the customer arrives

[lib/booking/preflight.ts](../lib/booking/preflight.ts) is a **pure function** (no fetch, no clock, no imports). `bookingCreateService` rejects with 18 codes in two families:

- **RACES** — `SLOT_CONFLICT`, `DAILY_CAPACITY_FULL`, `UNIT_POOL_FULL`, `DATE_BLOCKED`. Someone booked first; only checkable at confirm time.
- **SETUP** — `VENDOR_NOT_PRICED`, `BUSINESS_NOT_BOOKABLE`, `SPACE_OVER_CAPACITY`, `SLOT_ENDS_AFTER_CLOSURE`. Knowable from the vendor's own data before anyone opens the page.

`undefined` on a signal means **not known** → the check is skipped and named in `unknown`, never failed. A pre-flight that invents blockers teaches vendors to ignore it.

### 3.5 `POST /bookings` — the exact payload

From [booking-form.tsx:468](../components/booking/booking-form.tsx). **Optional fields are omitted entirely, not sent as null** — that keeps non-applicable bookings byte-identical.

```jsonc
{
  "customerName":  "…",              // required
  "customerEmail": "…",              // required
  "customerPhone": "…",              // required
  "vendorId":      123,              // venue.vendor.id ?? venue.id
  "bookingDate":   "2026-09-14",     // YYYY-MM-DD
  "bookingTime":   "18:00",          // slot identity — see §3.2
  "vendors": [                        // required, ≥1
    {
      "businessId":      3358,        // Number()
      "packageId":       null,        // Number() | null
      "menuId":          null,        // Number() | null
      "totalAmount":     760000,      // Number()
      "downPayment":     76000,       // Number()
      "specialRequests": "",
      "slotTemplateId":  12           // ONLY when a single-vendor cart picked a
                                      // template. Backend REJECTS mixed-mode
                                      // carts (some with, some without).
    }
  ],

  // all below omitted when absent/blank
  "guestCount":              500,
  "serviceLocationMode":     "at_vendor",   // absent → NULL → at_vendor
  "serviceLocationAddress":  "…",
  "serviceLocationNotes":    "…",
  "umbrellaId":              7,             // ownership + active validated server-side;
                                            // applies any qualifying bundle discount
  "selectedBundledServices": { "12": 2 },   // priceModel applied server-side:
                                            // flat | per_plate × guestCount |
                                            // percentage_of_total | free
  "pickupAddress":           "…",           // car rental only
  "dropoffAddress":          "…"
}
```

Response: `201`/`200`, id at `data.booking.id ?? data.id ?? data.bookingId`. **If no id comes back, stop and surface an error** — do not proceed to payment.

Multi-vendor carts fall back to the legacy fixed-period path (no `slotTemplateId`).

### 3.6 Payment

🔴 **Stripe caps Pakistan card payments near Rs 999,999.** If the summed `downPayment` exceeds `999999`, the flow must divert to **bank-transfer instructions**, not an inline card screen.

```
GET  /payments/config                                 → { publishableKey }               ✅
GET  /payments/pk/methods?bookingId=<id>              → { methods }                      ✅
GET  /payments/check-existing-intent?bookingId&paymentType                               ✅
POST /payments/create-payment-intent
POST /payments/create-checkout-session
GET  /payments/verify-checkout-session?sessionId&bookingId&paymentType                    ✅
POST /payments/process-{down,remaining,full}-payment   { bookingId }
POST /payments/cancel-incomplete-intents               { bookingId }
GET  /payments/booking-status/:bookingId  → { status, paymentStatus, totalAmount,
        downPayment, paidAmount, remainingAmount, transactions,
        cashRefundOwedTotal, cashRefundsOwed }                                           ✅
```

PK local methods (JazzCash / Easypaisa / Raast / IBFT / bank transfer / cash) come from `/payments/pk/methods` — **not hardcoded**. `POST /payments/pk/initiate` starts one.

`createPaymentIntent` **checks for an existing intent first** and reuses it — that dedupe is deliberate; removing it recreates the duplicate-payment bug.

**Abandonment cleanup:** on leaving the payment screen, `DELETE /bookings/:id/cancel-pending`. Without it, unpaid bookings hold vendor capacity.

Payments are rate-limited to **30 requests/hour**.

---

## 4. Post-booking

```
GET /bookings/:id/with-availability   → { booking, availabilityContext }   ✅ ← use this, not /bookings/:id
GET /bookings/:id/history             → { rows: [] }                       ✅ status timeline
GET /bookings/:id/installments        → { installments, totals:{scheduled,paid,outstanding} } ✅
GET /bookings/:id/milestones          → { rows: [] }                       ✅
GET /bookings/:id/change-requests     → { requests, rows }                 ✅
GET /bookings/:id/dispute             → 404 when none exists (not an error) ✅
GET /bookings/my-disputes             → { rows, count, page, limit }       ✅
GET /bookings/policy                  → { businessId, active, effective,
                                          effectiveSource, templates }     ✅
PATCH  /bookings/:id/cancel
DELETE /bookings/:id/cancel-pending
POST   /bookings/:id/{reschedule,postpone,dispute,no-show,change-requests}
GET    /bookings/:id/{refund-preview,refund-requests,order,timeline,policy-acceptance}   ❌ 403 — see trap 3
```

Reviews: `GET /reviews/:businessId` → `{ reviews, averageRating, totalReviews, page, limit }` · `POST /reviews` · `GET /reviews/my-reviews`. Token-based invites via `/public/bookings/review/:token`.

---

## 5. Realtime

`socket.io-client` from [context/ChatContext.tsx](../context/ChatContext.tsx) and [context/NotificationContext.tsx](../context/NotificationContext.tsx). Same JWT for the handshake (`socket.handshake.auth.token`). Attached to the **same HTTP server** as the API, not a separate port. Personal room `user:<id>`; chat joins `conversation:<id>`. Events namespaced `notification:*` and `chat:*`.

Whether a new message is marked read immediately or bumps the unread counter depends on the backend's "is the other participant viewing the room?" check against its `userSockets` map.

---

## 6. Provider order

[app/layout.tsx](../app/layout.tsx): `QueryProvider > UserProvider > NotificationProvider > ChatProvider`. Notification and Chat need the user loaded — keep them inside `UserProvider`.

---

## 7. Gaps the mobile app should know about

| Capability | Backend | Web | Mobile app |
|---|---|---|---|
| Chat | ✅ live | ✅ | ✗ |
| Quote negotiation | ✅ live | ✅ | ✗ |
| Shaadi Plan cart + checkout | ✅ live | ✅ | ✗ |
| Umbrellas (multi-event) | ✅ live | ✅ | ✗ |
| Payments (Stripe + PK methods) | ✅ live | ✅ | ✗ |
| Booking detail / cancel / reschedule / installments | ✅ live | ✅ | list only |
| Complaints | ✅ live | ✅ | ✗ |
| Activity feed | ✅ live | ✅ | ✗ |
| Write reviews | ✅ live | ✅ | read only |
| Favourites | ✅ live | ✅ server | local AsyncStorage only |
| Sessions / 2FA | ✅ live | ✅ | ✗ |
| Push | ✅ `/push/*` | ✅ | ✗ |
| Planning tools | ✗ none | localStorage | AsyncStorage |

Planning tools have **no backend at all** on either client — budget/checklist/guests/timeline are device-local, so they don't sync between web and app and are lost with the browser or app. Building server persistence means new backend work, not just a client change.
