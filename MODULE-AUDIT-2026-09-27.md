# Module audit — weddingwala.pk, 2026-09-27 (pass 1)

Every claim below was checked against **live production** — the console driven
headed in Playwright as the vendor, and the API probed with a real session.
Where I am proposing rather than reporting, it says so.

**Scope of this pass:** all 48 vendor-console screens loaded and inventoried;
the Bookings module taken apart in depth because that is where your three
questions live. Remaining modules are queued at the end — I have not yet given
Leads, Quotes, Khata, Venue-OS or the customer surface the same treatment, and
I would rather say so than imply coverage I have not done.

---

## 0. The health baseline — so the problems below are read correctly

All 48 console screens load without an error banner. None is blank, none 500s,
none is a legacy shell. That is a genuinely good starting point and it is worth
saying before a long list of gaps.

What the sweep found is not breakage. It is **reach**: things that are built,
correct, and that nobody can get to.

---

## 1. Your three questions, answered

### 1.1 Installments — the schedule exists, the negotiation does not

**What is already there** (`src/services/bookingInstallmentService.js`, BK-042):

- `BookingInstallment` with `sequence`, `label`, `amount`, `amountPaid`, `dueAt`, `status`, `paidAt`
- a schedule **seeded automatically at booking creation** — exactly 2 rows: advance, then balance
- balance due date = event day minus `INSTALLMENT_BALANCE_DAYS_BEFORE` (default 7), anchored at Pakistan midnight (+05:00)
- `GET /bookings/:id/installments` returns `{ installments, totals }` — live, 200
- a daily sweeper flips past-due `pending` rows to `overdue`
- the three payment paths mark rows paid as money lands
- `UNIQUE(bookingId, sequence)` makes seeding idempotent

**What is missing — and it is the whole of what you asked for:**

| | |
|---|---|
| Customer proposes a plan | **no** — the 2 rows are fixed, nobody chooses them |
| Custom number of instalments | **no** — hardcoded advance + balance |
| Vendor sees a proposed plan | **no** |
| Vendor approves / counters / declines | **no** |
| Either side edits an agreed plan | **no** |
| Any UI at all for instalments | **no** — the read endpoint has no consumer on the vendor booking screen |

So the object model is roughly right and the lifecycle plumbing (due dates,
overdue sweeper, payment matching) already works. What is absent is the
*conversation*.

**Proposed design.** Keep the seeded 2-row plan as the default — never make a
couple design a payment plan to book a hall. Add a request on top:

```
customer proposes  →  PROPOSED   (n rows, amounts + dates, must sum to total)
vendor counters    →  COUNTERED  (vendor's rows, customer accepts or walks)
vendor approves    →  ACTIVE     (replaces the seeded rows atomically)
vendor declines    →  DECLINED   (seeded plan stands)
```

Constraints that matter in Pakistan specifically:

- **The last instalment must clear before the event**, not on the day. A venue
  that lets the balance ride to the morning of the barat is carrying the risk
  for a wedding it cannot un-cater. Default the final row to event − 7 days
  (the existing `INSTALLMENT_BALANCE_DAYS_BEFORE`) and refuse a plan that
  pushes past it without an explicit vendor override.
- **Salary-day alignment.** Most Pakistani households are paid on the 1st.
  When suggesting dates, snap to the 1st–5th rather than "every 30 days" — it
  is the difference between a plan that is kept and one that is chased.
- **3 instalments is the realistic ceiling** for a 3–6 month booking horizon.
  Offer 2 / 3 / custom, not a free-form builder.
- **Show the plan as a ladder with what is paid, due, and overdue** — the data
  is already there; nothing renders it.
- Reuse the existing overdue sweeper rather than inventing reminders: it
  already flips rows, and `/dashboard/receivables` already ages money.

This is a **new** capability, not a missing door. It needs backend work
(a proposal table or a status on the existing rows) and UI on both sides.

### 1.2 Vendor changing the price — three ways in, none reachable

This is the more urgent of the two, because the negotiation is how business is
actually done here and the product currently refuses to record it.

**What I found, in order of severity:**

**(a) A negotiated price on a package is impossible to record.**
The vendor's booking drawer has a "Tay raqam" (agreed amount) field — but it is
labelled *"sirf agar package select nahi"* and the code is explicit:

```ts
const agreed = Number(val(shadow, "bf-agreed"))
if (!pkg && agreed) vendor.agreedAmount = agreed     // ← only when NO package
```

So a vendor who picks *Gold — Barat Package* at Rs 760,000 and settles at
Rs 700,000 — which is an ordinary Tuesday in this market — has two bad options:
book at the list price and let the khata lie, or drop the package and lose the
menu and package linkage with it. **This is the single highest-value small fix
in this audit.**

**(b) After creation, there is no price edit at all.**
`PATCH /bookings/:id` accepts `totalAmount` from a vendor (the controller
explicitly pushes it into `allowedFields` for non-customers). Nothing in the
console calls it. The booking detail screen's money controls are
`data-settle-*`, and those are **final-headcount settlement** (per-head
billing), not a price change — a different thing entirely.

**(c) The order builder — a whole pricing engine with no screen.**
`PUT /bookings/:id/order-lines` + `computeOrderTotals` exist and work;
`GET /bookings/:id/order` returns `{ lines, totals, deposit, profit,
advanceTransfer, spaceChecks }` — I called it on production, 200. The frontend
wrapper `lib/api/bookingOrder.ts` is written. **No component imports it.**
This is the seventh instance of the missing-door pattern.

**Proposed design.** Do not build a new pricing system — surface the one that
exists:

1. Let `agreedAmount` override a package price (drop the `!pkg` condition),
   and record the delta as a discount with a reason. Every venue gives
   "shadi season discount" or a family rate; the khata should show it as a
   discount, not a fictional list price.
2. Add a **"Rate change karein"** drawer on the booking detail: new total,
   reason, and — critically — what it does to the instalment plan and the
   outstanding balance, shown before saving.
3. Price changes are money history. Write them through a transition that
   appends a row, the way `BookingStatusHistories` does for status. A price
   that changed with no record is how disputes become unwinnable.
4. When the couple has already paid, a reduction below what they have paid
   must produce a refund obligation, not a negative balance. The refund
   engine already handles that — route into it rather than around it.

### 1.3 "One modal for the whole booking" — you already have it, and it should stay one-sided

**On the vendor side it exists.** `openBookingForm` is a single drawer
(195 lines) collecting: venue, city, date, time, hall/sub-venue, package,
menu, guests, gender mode, customer name/email/phone, agreed price, advance,
payment method, special requests. That is the fast path you are describing, and
it is live on `/dashboard/bookings`.

**On the customer side I would not do it**, and I want to give you the real
reason rather than just agreeing:

The public booking flow is 7 steps because four things in it are genuinely
sequential — each answer changes what the next question even is:

- the hall you pick changes the capacity ceiling, and a venue models halls in
  **two mutually exclusive ways** (`subVenueSpaces` vs `spaces`)
- the package you pick changes which menus exist
- the menu enforces the one-dish rule
- the date drives a **three-state** availability check (free / partial /
  unknown — where "unknown" deliberately stays permissive so a network blip
  does not refuse every date) and a 48-hour server-owned hold

Collapsing that into one modal means showing a couple every field at once,
most of them disabled or wrong until earlier ones are answered. On a 360px
phone — which is most of your traffic — that is worse, not faster.

**What I would do instead**, and I think it gets you the speed you actually
want:

- **Keep the steps, kill the page loads.** One sheet, steps sliding inside it,
  progress visible, state preserved. It feels like one modal without lying
  about the dependencies.
- **Collapse steps that are already decided.** The flow derives its step list
  (a venue with no menus renders no Menu step) — lean on that harder. A venue
  with one hall should never ask "which hall?".
- **Add a genuine one-screen express path for the common case**: enquiry with
  date + guests + phone, vendor calls back. In this market a large share of
  bookings are closed on the phone anyway; the product should stop pretending
  every booking is self-serve.
- **Let the couple leave and come back.** Draft persistence exists
  (`lib/draftStorage/`, `useDraftSync`) — it is create-mode only. A 7-step form
  a bride abandons at step 5 on a patchy connection should still be there.

So: yes to one surface, no to one form.

---

## 2. Found while sweeping — things nobody can reach

### 2.1 Change requests are a dead end, and it is live

The customer's booking page renders **"Change requests — Need to add guests,
swap a slot, or change a package? Send a request to the vendor."** with a
working *Request change* button. The backend is complete:
`POST /bookings/:id/change-requests`, `…/approve`, `…/decline`,
`…/initiate-topup`.

**The vendor can never see them.** `VendorChangeRequestsCard` is imported only
by `booking-detail-view.tsx` and `booking-detail-sheet.tsx`; those are reached
only from `bookings-redesigned-view.tsx`, which **nothing imports**. The live
screen is `booking-detail-artifact.tsx`, whose only controls are navigate,
cancel, withdraw-claim, contact, settle, and (as of yesterday) complete.

Evidence from production — every change request this vendor has ever received:

| booking | type | status | raised |
|---|---|---|---|
| 688 | guest_count | **expired** | 2026-08-26 |
| 673 | guest_count | **expired** | 2026-08-26 |
| 563 | guest_count | **expired** | 2026-08-26 |
| 548 | guest_count | **expired** | 2026-08-26 |

Four couples asked to change their guest count. All four requests expired
unanswered, because the answer screen does not exist. This is worse than the
other missing doors: the customer-facing half is live and **promises a reply**.

**Fix:** a change-requests card on the booking-detail artifact with
approve / decline / counter, plus a count on the bookings list so it is visible
without opening each booking. Until then, consider hiding the customer CTA —
a button that silently expires is worse than no button.

### 2.2 `GET /packages` returns zero for everything

`/api/v1/packages` and `/api/v1/packages?businessId=3358` both return **0**,
anonymously and authenticated, while `/packages/vendor-packages` returns the
real three (Silver Rs 325,000, Gold Rs 760,000, and one at Rs 1,320,000) and
`/businesses/3358` embeds 4.

No customer-facing damage today — the public vendor page reads packages from
the business payload, not this endpoint. But it is a public listing endpoint
that silently returns nothing, and anything built on it later will appear to
work and show an empty list. Worth fixing or deleting rather than leaving as a
trap.

---

## 3. What I have NOT done yet

Stated plainly so you can judge the coverage:

- **Leads, Quotes, Calendar, Customers, Chat, Function sheets** — loaded and
  inventoried, not taken apart. Quotes in particular: `FEAT_QUOTE_NEGOTIATION`
  exists and I have not checked whether the negotiation loop is reachable.
- **Khata / money cluster** (payments, receipts, receivables, PDCs, expenses,
  money, revenue, reports, tax, billing) — loaded; `/revenue` and `/reports`
  render 0 rows, which I have not yet established as "no data" vs "broken".
- **Venue-OS cluster** (inventory, kitchen-prep, generator-fuel, halal-certs,
  drone-NOC, field, reliability, staff, suppliers) — loaded, all render.
- **The whole customer surface** — only the booking detail and bookings list
  were examined, during the pay-CTA work.
- **Admin console** (12 routes) — not touched.
- **Mobile at 360px** — not checked this pass, and the CLAUDE.md notes two
  past cases where a fixed overlay made a primary button unreachable.

---

## 4. Order I would do this in

1. **Change-requests card on the vendor booking detail** — live customers are
   being ignored today. Smallest fix, worst current harm.
2. **Agreed price on a package** — drop the `!pkg` condition, record the
   discount. One-line shape, unblocks how business is actually done.
3. **Price change after creation**, routed through history and the refund
   engine.
4. **Instalment proposal + approval** — the real new build of the three.
5. Booking flow: one sheet, derived steps, express enquiry path, draft resume.
6. Continue the module sweep at this depth (§3).

Items 1–3 are days, not weeks, because in each case the engine is already
written and tested — what is missing is the screen.
