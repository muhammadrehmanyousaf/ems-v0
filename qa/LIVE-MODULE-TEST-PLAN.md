# Wedding Wala — Vendor Portal LIVE Test Plan

Live target: **https://www.weddingwala.pk** (production). Account: `muhammadrehmanyousaf786@gmail.com`
(user **3351**, vendor, 3 venues — business **3358** and siblings). Backend:
`ems-v0-backend-production.up.railway.app`.

## Rules this plan is executed under

1. **Live only.** Every case is exercised on production through the real UI. No localhost,
   no API-only shortcuts to *prove* a case — the API is used only as an independent oracle
   to check what the UI claims.
2. **Click it, then hard-reload and re-read.** Post-action UI state is not evidence. Every
   mutation is followed by a full reload and a re-read of the value.
3. **A render check is never `[x]`.** `[x]` requires the control to have been driven and its
   effect verified.
4. **Desktop and 360px.** Both, for every module.
5. **No money rows written.** Receipts / payments / expenses / cheques are validated but not
   created on this live vendor's ledger. Any other test row created is deleted, and the
   deletion verified.
6. Findings get an ID `WWL-###`. Severity: **S1** data/money wrong · **S2** feature broken ·
   **S3** confusing or inaccessible · **S4** cosmetic.

## Status legend

`[ ]` not run · `[~]` partially run · `[x]` executed & verified · `🔴` failed (finding raised)

---

## Module index (44)

| # | Module | Route | Cases written | Status |
|---|---|---|---|---|
| 1 | Dashboard | `/dashboard` | ✅ 62 | `[~]` in progress |
| 2 | Today | `/dashboard/today` | — | `[ ]` |
| 3 | Lead inbox | `/dashboard/leads` | — | `[ ]` |
| 4 | Bookings | `/dashboard/bookings` | — | `[ ]` |
| 5 | Date holds | `/dashboard/date-holds` | — | `[ ]` |
| 6 | Function sheets | `/dashboard/function-sheets` | — | `[ ]` |
| 7 | Customers | `/dashboard/customers` | — | `[ ]` |
| 8 | Calendar | `/dashboard/calendar` | — | `[ ]` |
| 9 | Conversations | `/dashboard/chat` | — | `[ ]` |
| 10 | Payments | `/dashboard/payments` | — | `[ ]` |
| 11 | Receivables | `/dashboard/receivables` | — | `[ ]` |
| 12 | Receipts | `/dashboard/receipts` | — | `[ ]` |
| 13 | Cheque ledger | `/dashboard/pdcs` | — | `[ ]` |
| 14 | Expenses | `/dashboard/expenses` | — | `[ ]` |
| 15 | Tax report | `/dashboard/tax` | — | `[ ]` |
| 16 | Reports | `/dashboard/reports` | — | `[ ]` |
| 17 | Trade operations | `/dashboard/trade-ops` | — | `[ ]` |
| 18 | Automation | `/dashboard/automation` | — | `[ ]` |
| 19 | Kitchen prep | `/dashboard/kitchen` | — | `[ ]` |
| 20 | Inventory | `/dashboard/inventory` | — | `[ ]` |
| 21 | Staff & payroll | `/dashboard/staff` | — | `[~]` bug confirmed, fix unverified |
| 22 | Suppliers | `/dashboard/suppliers` | — | `[~]` dead tab open |
| 23 | Brokers | `/dashboard/brokers` | — | `[ ]` |
| 24 | Generator fuel | `/dashboard/generator-fuel` | — | `[ ]` |
| 25 | Halal certs | `/dashboard/halal-certs` | — | `[ ]` |
| 26 | Drone NOC | `/dashboard/drone-noc` | — | `[ ]` |
| 27 | Reviews | `/dashboard/reviews` | — | `[ ]` |
| 28 | Notifications | `/dashboard/notifications` | — | `[ ]` |
| 29 | Promote | `/dashboard/promote` | — | `[ ]` |
| 30 | Plan & billing | `/dashboard/billing` | — | `[ ]` |
| 31 | Collaborations | `/dashboard/collaborations` | — | `[ ]` |
| 32 | Business Settings | `/dashboard/settings` | — | `[~]` 11 tabs done earlier |
| 33 | Availability | `/dashboard/settings?tab=availability` | — | `[ ]` |
| 34 | Cancellation policy | `/dashboard/settings?tab=policy` | — | `[ ]` |
| 35 | Setup checklist | `/dashboard/onboarding` | — | `[ ]` |
| 36 | Tonight | `/dashboard/tonight` | — | `[ ]` |
| 37 | Event profit | `/dashboard/event-profit` | — | `[ ]` |
| 38 | Venue money | `/dashboard/venue-money` | — | `[ ]` |
| 39 | Halls & spaces | `/dashboard/halls` | — | `[ ]` |
| 40 | Cash & cheques | `/dashboard/cash-cheques` | — | `[ ]` |
| 41 | Kitchen | `/dashboard/kitchen-suppliers` | — | `[ ]` |
| 42 | Accounting | `/dashboard/accounting` | — | `[ ]` |
| 43 | Field capture | `/dashboard/field-capture` | — | `[ ]` |
| 44 | Quote requests | `/dashboard/quotes` | — | `[ ]` |

---

# MODULE 1 — Dashboard (`/dashboard`)

**What this screen is.** The vendor's first screen after login and the one that sets their
belief about whether the portal is telling the truth. It aggregates from every other module —
bookings, leads, calendar, receivables, event profit, per-hall performance — so it is the
single place where a disagreement between modules becomes visible to the owner. That makes
**cross-consistency the highest-value thing to test here**, above any individual control.

**Live inventory captured 2026-08-05** — 25 buttons, 10 headings, 14 `Yaad dilao` actions,
3 sort segments, 14 in-`main` dashboard links, business scope switcher `AV` (All venues).

**Sections on screen:** Welcome banner · "Your listing is half-built" onboarding strip ·
BAQAYA/TO COLLECT hero · Aaj ke events · Naye Rabtay · Agle 7 din · Aaj kis ko yaad dilana hai ·
What needs you · KPI row (Total bookings / Revenue collected / Revenue due / Today's events /
Upcoming 7d) · Upcoming events · Who to chase · PER-HALL PERFORMANCE · RECENT BOOKINGS ·
"Did each shaadi make money?" profit board.

---

## A. Cross-consistency of money and counts (S1 class — highest priority)

Two contradictions are already visible in the captured inventory. These are written first
because a headline number that disagrees with itself destroys trust in every other screen.

- [ ] **D1-001** — `BAQAYA · TO COLLECT` reads **Rs 13,417,229 across 14 events**, while the
  KPI tile `Revenue due` reads **Rs 12,292,729 to chase**, on the same screen at the same
  moment. Δ = **Rs 1,124,500**. Determine which is right by summing outstanding from the API
  and identify the extra rows the larger figure is counting.
- [ ] **D1-002** — Establish whether the Δ is exactly the cancelled bookings. Prior work found
  3 cancelled bookings worth Rs 3,855,050 inflating tiles; confirm whether cancellations,
  refunded rows, or a different date window explain **this** Δ.
- [ ] **D1-003** — `Aaj ke events` says **2 today**; KPI `Today's events` says **1**. Same
  screen, same moment. Determine which matches the API for today's date in **PKT**, not UTC.
- [ ] **D1-004** — Confirm whether D1-003 is a timezone boundary bug: an event at 00:00–05:00
  PKT falls on the previous UTC day. Check each of today's bookings' stored timestamp vs the
  two counters.
- [ ] **D1-005** — `Revenue due` (Rs 12,292,729) must equal the Receivables module's
  Outstanding exactly. Cross-check live.
- [ ] **D1-006** — `Revenue collected` (Rs 21,201,121) must equal the sum of Receipts.
  Cross-check against the Receipts module total and the API.
- [ ] **D1-007** — `Revenue collected + Revenue due` must reconcile to total booked value.
  Verify the identity holds; if not, quantify the gap and find the excluded status.
- [ ] **D1-008** — `Total bookings 25` must equal the Bookings module row count under the
  same business scope. Verify cancelled bookings are or aren't included, consistently.
- [ ] **D1-009** — `Upcoming (7d) 8` must equal the count of non-cancelled bookings dated
  within the next 7 days PKT. Verify boundary days (today, today+7) are handled per the label.
- [ ] **D1-010** — `Aaj kis ko yaad dilana hai` says **14 baqaya**; `BAQAYA` says **14 events**;
  `Who to chase` list length must agree with both. Verify all three.
- [ ] **D1-011** — Cancelled bookings must not appear in `Upcoming events`, `Who to chase`,
  `RECENT BOOKINGS` or the profit board. Enumerate all cancelled bookings via API, then assert
  none appear in any of the four.
- [ ] **D1-012** — Regression guard on the already-fixed bug: confirm no cancelled booking is
  ranked in `Did each shaadi make money?` under any of the three sorts.
- [ ] **D1-013** — `PER-HALL PERFORMANCE · revenue this year` — the three halls' revenue must
  sum to the year-to-date collected figure, and must not double-count a booking that moved
  between halls.
- [ ] **D1-014** — Verify per-hall figures are scoped to *this year* as labelled, not lifetime.
- [ ] **D1-015** — Rs formatting: every money figure uses thousands separators, no floating
  point drift (e.g. `Rs 1,673,250.00000001`), and no `NaN`/`undefined`/`Rs 0` where a real
  value exists.

## B. Business scope (3-venue account — the `AV` switcher)

- [ ] **D1-016** — With scope = **All venues**, KPI totals must equal the sum of the three
  individual venues. Switch to each venue, record its numbers, and assert the sum.
- [ ] **D1-017** — Switching scope must update **every** section, not just the KPI row.
  Verify Aaj ke events, Who to chase, PER-HALL, RECENT BOOKINGS and the profit board all rescope.
- [ ] **D1-018** — After switching scope, **hard-reload**. The selected scope must persist and
  the numbers must be identical to pre-reload (tests `ww-active-business` persistence).
- [ ] **D1-019** — With a single venue selected, `PER-HALL PERFORMANCE` must show only that
  venue's halls — not all three venues' halls.
- [ ] **D1-020** — Scope switch must not leak another venue's customer names into `Who to chase`.
- [ ] **D1-021** — Rapidly switch scope 3× in under 2s. Assert no stale render — the numbers
  shown must belong to the finally-selected venue (race/out-of-order response check).

## C. Interactive controls — driven, not just present

- [ ] **D1-022** — `Recent` sort: click, assert RECENT BOOKINGS/profit board reorders by date
  descending, and verify the actual order against the API dates.
- [ ] **D1-023** — `Most profit` sort: click, assert ordering by profit descending; verify the
  profit values are real (revenue − expenses), not just revenue.
- [ ] **D1-024** — `Biggest` sort: click, assert ordering by booking value descending.
- [ ] **D1-025** — Sort segments must set `aria-pressed` or `aria-current` (known open finding —
  confirm it is still open on live, then fix).
- [ ] **D1-026** — Sorting must be stable for ties (two bookings of equal value keep a
  deterministic order across repeated clicks).
- [ ] **D1-027** — Click each sort 2× — the second click must not silently reverse or clear the
  sort unless that is the designed toggle; whichever it is, it must be discoverable.
- [ ] **D1-028** — `Hide details` toggle: click, assert what hides, click again, assert full
  restore with no layout shift left behind.
- [ ] **D1-029** — `Hide details` state after hard-reload: does it persist? Either is
  defensible; assert the behaviour is consistent, not random.
- [ ] **D1-030** — All 14 `Yaad dilao` (remind) buttons: click one, capture the network call,
  confirm a reminder is actually created, then **hard-reload** and confirm it persisted.
- [ ] **D1-031** — `Yaad dilao` must be idempotent or must visibly change state — click the
  same one twice and assert it does not silently create two duplicate reminders.
- [ ] **D1-032** — `Yaad dilao` on a customer with **no phone/WhatsApp** must fail loudly with
  a reason, not silently no-op.
- [ ] **D1-033** — `Yaad dilao` error path: if the API rejects, the vendor must see the
  server's reason, not `Request failed with status code 4xx`.
- [ ] **D1-034** — `see all` (BAQAYA) navigates to the receivables/chase list and the
  destination count matches the 14 claimed.
- [ ] **D1-035** — `Nayi Booking` opens the new-booking flow and pre-fills nothing incorrect.
- [ ] **D1-036** — `open calendar` (Agle 7 din) lands on `/dashboard/calendar` on the correct
  week, not the current-month default.
- [ ] **D1-037** — `More` (overflow) opens, every item inside is reachable and does something.
- [ ] **D1-038** — `Search or jump to… ⌘K`: open by click AND by ⌘K/Ctrl-K, search a known
  booking, and confirm the result navigates correctly.
- [ ] **D1-039** — Notification bell (`53`): opens, count matches the notifications API, and
  reading one decrements it after hard-reload.
- [ ] **D1-040** — `Theme settings`: change theme, assert it applies, hard-reload, assert persistence.
- [ ] **D1-041** — `EN` / `اردو` toggle: switch to Urdu, assert the dashboard actually
  translates (not just the toggle state), numerals render correctly, and layout does not break.
- [ ] **D1-042** — Urdu mode must not break RTL-sensitive money strings (`Rs 13,417,229` must
  not render reversed or mis-grouped).
- [ ] **D1-043** — `Toggle Sidebar`: collapse, assert content reflows without overlap, expand,
  assert restore; persists across hard-reload.

## D. Navigation integrity — every door must open

- [ ] **D1-044** — All 14 in-`main` dashboard links resolve to a **rendered** page, not just
  HTTP 200 (guard against the known blank-page-on-same-route class of bug).
- [ ] **D1-045** — `/dashboard/bookings/179` and `/dashboard/bookings/166` (deep links from
  RECENT BOOKINGS) open the correct booking, matching the customer name shown on the card.
- [ ] **D1-046** — Clicking a dashboard link while **already on** `/dashboard` must not blank
  the page.
- [ ] **D1-047** — Browser Back from each destination returns to a fully-rendered dashboard
  with numbers intact (no empty shell).
- [ ] **D1-048** — `Add your business` / `Add booking` / `Skip` / `Retry` (matrix-listed
  actions) — confirm which still exist on live, and drive each that does.
- [ ] **D1-049** — Onboarding strip links (`?tab=profile`, `?tab=listing`, `/dashboard/onboarding`)
  land on the correct tab already selected, not the default tab.

## E. Onboarding strip — "Your listing is half-built"

- [ ] **D1-050** — The three prompts (Owner name, WhatsApp number, Cancellation policy set)
  must reflect **actual** current data. Verify each against the business record.
- [ ] **D1-051** — Fill one of them for real (e.g. Owner name), hard-reload the dashboard, and
  assert that prompt disappears and the completion count changes. Then restore the original value.
- [ ] **D1-052** — The `+5` completion weighting must add up to a sane total; assert the
  percentage/"half-built" wording matches the actual number of outstanding items.

## F. Empty, edge and failure states

- [ ] **D1-053** — Simulate an API failure for one panel (block the request) and confirm the
  panel shows an error with a `Retry`, rather than rendering `Rs 0` or an empty success state.
  **A zero that means "failed to load" is an S1 — it reads as "no money owed".**
- [ ] **D1-054** — `Retry` after a failed panel actually refetches and recovers.
- [ ] **D1-055** — Slow network (throttle): no layout shift as panels arrive; skeletons, not
  jumping content.
- [ ] **D1-056** — Long customer name (e.g. 60+ chars) in `Who to chase` must truncate, not
  overflow the card or push the page horizontally.

## G. Accessibility

- [ ] **D1-057** — Full keyboard pass: Tab reaches every one of the 25 buttons and 14 links in
  a sensible order; nothing is focus-trapped; focus ring always visible.
- [ ] **D1-058** — All 14 `Yaad dilao` buttons have identical accessible names — a screen
  reader user cannot tell which customer each belongs to. Verify and raise if so.
- [ ] **D1-059** — Icon-only buttons (`AV`, `MR`, `53`, Toggle Sidebar, Theme settings) all
  carry an accessible name.
- [ ] **D1-060** — Heading order is not skipped (h1 → h2 → h3), so the page is navigable by
  headings.

## H. Responsive

- [ ] **D1-061** — 360px: no horizontal overflow (`scrollWidth <= innerWidth`), no control
  covered by another element, KPI row stacks, tables scroll inside their own container.
- [ ] **D1-062** — Desktop 1536px: no covered controls, no overflow, sticky elements behave
  when the sidebar is collapsed.

---

## Findings raised (Module 1)

### 🔴 WWL-001 — S1 — Rs 1,159,500 owed is invisible on the Receivables chase screen

**Booking 170 — Imran Shafi & Hafsa Imran** (status `Completed`, total Rs 1,546,000,
down payment Rs 386,500, **balance Rs 1,159,500**).

- The booking's **own detail page** renders `Rs 1,159,500` as *Balance due* and does **not**
  mark it paid. So the balance is real, not a stale `downPayment` field.
- It is **absent** from `/dashboard/receivables` — verified in the live DOM: 13 rows,
  no "Imran Shafi", `Customers owing = 13`.
- It is therefore also excluded from the KPI `Revenue due` (Rs 12,292,729), which is
  served by `analytics/kpis` and agrees with `analytics/receivables`.
- It **is** counted by the BAQAYA hero (Rs 13,417,229, from `bookings/action-summary`).

**Why it matters:** Receivables is the screen a vendor uses to decide who to chase. A
completed wedding with Rs 1.16M unpaid never appears on it. The money is not flagged
anywhere the vendor would look to collect it.

**Suspected cause:** the receivables/installment source excludes `status = Completed`,
treating a finished event as a closed account regardless of its balance.

### 🔴 WWL-002 — S1 — Receivables ignores a down payment already taken

**Booking 179 — Waheed Jutt.** Total Rs 350,000, down payment Rs 35,000 → Rs 315,000 owed.

- Receivables lists **Rs 350,000** outstanding (and "2" open installments).
- The dashboard's own `Aaj ke events` panel lists the same booking as **Rs 315,000 due**.
- Overstated by exactly the Rs 35,000 down payment.

The installment ledger and the booking row disagree about money already received.

### 🔴 WWL-003 — S2 — The dashboard shows two different answers to "how much am I owed?"

On one screen, at one moment:

| Element | Figure | Source |
|---|---:|---|
| `BAQAYA · TO COLLECT` | **Rs 13,417,229** across 14 events | `bookings/action-summary` (`totalAmount − downPayment`) |
| KPI `Revenue due · to chase` | **Rs 12,292,729** | `analytics/kpis` (installment ledger) |

Δ = **Rs 1,124,500**, which reconciles exactly: `+1,159,500` (WWL-001) `− 35,000` (WWL-002).

Ruled out by test: it is **not** cancelled bookings (all 3 cancelled rows are correctly
excluded from both) and **not** a year-range filter (all 14 outstanding bookings are 2026).

Given WWL-001 and WWL-002, **Rs 13,417,229 is the closer figure and the KPI understates.**

### 🔴 WWL-004 — S1 — A real event today is missing from the "Today's events" KPI

Two bookings are dated today (2026-08-05): **166** Owais Siddiqui (`Confirmed`, 13:00) and
**179** Waheed Jutt (`Awaiting Payment`, 12:00, Rs 315,000 due).

- `Aaj ke events` panel: **2 today** — correct, lists both.
- KPI tile `Today's events`: **1** — excludes the `Awaiting Payment` booking.

A vendor reading the KPI believes they have one event today. They have two, and the
uncounted one starts *earlier*. Status is not a safe proxy for "is this happening today".

### Cases executed so far

`[x]` D1-001 · D1-002 · D1-003 · D1-005 (fails → WWL-003) · D1-008 (25 = 25, passes)
`[x]` D1-011 (cancelled correctly excluded from both totals — passes)
`[x]` D1-012 (regression guard: no cancelled row in the profit board — passes)
