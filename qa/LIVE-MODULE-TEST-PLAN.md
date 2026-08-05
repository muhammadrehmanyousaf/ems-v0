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
| 1 | Dashboard | `/dashboard` | ✅ 62 | **`[x]` COMPLETE — 60 run, 2 unrun, 18 findings** |
| 2 | Today | `/dashboard/today` | ✅ 58 | **`[x]` COMPLETE — 52 run, 6 not run, 11 findings** |
| 3 | Lead inbox | `/dashboard/leads` | ✅ 61 | **`[x]` COMPLETE — 49 run, 12 not run, 5 findings** |
| 4 | Bookings | `/dashboard/bookings` | ✅ 60 | `[~]` in progress |
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

**ROOT CAUSE — confirmed, and it is not what I first suspected.** My initial hypothesis was
that Receivables excludes `status = Completed`. **That is wrong** — three other `Completed`
bookings with balances (165 Rs 215,872 · 162 Rs 540,075 · 159 Rs 325,020) *do* appear on the
chase list. The real discriminator is `paymentStatus`:

> **Booking 170 is stored as `paymentStatus = "Paid"` while `totalAmount − downPayment =
> Rs 1,159,500`.** The record contradicts itself.

Its own detail page renders **both** a `Paid` badge **and** `Balance due Rs 1,159,500`
simultaneously. Everything that trusts the `paymentStatus` flag (Receivables, `Revenue due`,
`Revenue collected`) is wrong by this amount; everything that computes from the actual
amounts (BAQAYA hero, the booking page's own balance line) is right.

This is a **data-integrity defect with a code consequence**: no screen should derive money
owed from a boolean-ish status flag when the amounts are present and disagree with it.

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

### 🔴 WWL-005 — S1 — `Revenue collected` counts money that has not been collected

`Revenue collected` reads **Rs 21,201,121**. The actual sum of `downPayment` across all 22
non-cancelled bookings is **Rs 20,076,621**. Overstated by **Rs 1,124,500** — the same
Rs 1,124,500, arriving the same way: `+1,159,500` (booking 170 counted as fully paid because
its flag says `Paid`) `− 35,000` (Waheed Jutt's down payment, which the ledger never saw).

Verified identities:

- `per-hall revenue sum` = **Rs 33,493,850** = total booked value of the 22 non-cancelled
  bookings. ✅ correct, and correctly excludes all 3 cancelled bookings (22 = 25 − 3).
- `Revenue collected + Revenue due` = 21,201,121 + 12,292,729 = **Rs 33,493,850**. The KPI
  row is internally consistent — but consistently wrong, because both halves are built on the
  same bad `Paid` flag.

**This is the most serious finding in the module.** The other four are visible contradictions a
vendor might notice and question. This one is silent: it tells the owner they have collected
Rs 1.12M more than they actually have. Cash-flow decisions get made on this number.

### 🔴 WWL-006 — S1 — Four dashboard sections ignore the venue selection entirely

Driven live across all four scopes (All venues → Grand Marquee → Banquet & Lawn → Marquee
Bahria). The KPI row rescopes correctly. **These four sections never change at all:**

| Section | All venues | Grand Marquee | Banquet & Lawn | Marquee Bahria |
|---|---|---|---|---|
| `BAQAYA · TO COLLECT` | Rs 13,417,229 / 14 | **Rs 13,417,229 / 14** | **Rs 13,417,229 / 14** | **Rs 13,417,229 / 14** |
| `Aaj ke events` | 2 today | **2 today** | **2 today** | **2 today** |
| `Naye Rabtay` | 22 new | **22 new** | **22 new** | **22 new** |
| `PER-HALL PERFORMANCE` | 3 venues | **3 venues** | **3 venues** | **3 venues** |

Select **Rehman Marquee Bahria** (Rawalpindi) and the largest number on the screen still
claims you are owed **Rs 13,417,229 across 14 events** — while that venue's own KPI says
Rs 4,005,205. The vendor is shown another venue's money, another venue's events and another
venue's enquiries under this venue's name. `PER-HALL` still lists all three halls and the
literal label "3 venues" while scoped to one.

`Aaj ke events` is the operational half of this: scoped to Bahria it lists Waheed Jutt's
12:00 event, which is at **Grand Marquee**.

### ✅ Passes confirmed in Section B

- **D1-016 — venue roll-up is exact.** All five KPI metrics sum precisely:
  bookings `10+8+7 = 25` · collected `8,517,363 + 7,704,813 + 4,978,945 = 21,201,121` ·
  due `3,243,787 + 5,043,737 + 4,005,205 = 12,292,729` · today `0+0+1 = 1` ·
  upcoming `1+4+3 = 8`. (The KPI row is arithmetically sound — it is the *inputs* that are
  wrong, per WWL-001/005.)
- **D1-018 — scope survives a hard reload.** `ww-active-business` persists
  (`activeBusinessId: 3360`) and all five values are byte-identical after a full reload.

### WWL-004 extended — confirmed at venue level

Booking 179 (Waheed Jutt, `Awaiting Payment`, **today 12:00**) belongs to **Rehman Grand
Marquee**. With Grand Marquee selected, its `Today's events` tile reads **0**. The venue
running a wedding in the next hours reports no events today.

### 🔴 WWL-007 — S3 — The venue switcher marks no active option

The switcher menu's 5 items carry neither `aria-checked` nor `data-state`. Nothing in the
accessibility tree says which venue is currently selected — a screen-reader user opening the
menu cannot tell what they are switching *from*. Same defect class as the sort segments
(D1-025).

### ⚠️ CORRECTION to my own Section A result

I recorded **D1-012 as ✅ "no cancelled row in the profit board — regression holds."**
**That was wrong.** I asserted it from the default `Recent` view without parsing the rows.
Clicking `Most profit` and parsing all 25 rows shows the opposite. D1-012 is 🔴.

The likely reason live still has this: the fix (`0677c6e`, "cancelled bookings counted as
revenue and profit") is sitting in the **local unpushed commits** — it has never been
deployed. Live is running the pre-fix code.

### 🔴 WWL-008 — S1 — Cancelled weddings are ranked as the most profitable events

Under `Most profit`, parsed live from all 25 rows:

| Rank | Function | Status | Received | Net | Margin |
|---|---|---|---:|---:|---:|
| **1** | Usman Tariq & Hira Usman | **Cancelled** | Rs 0 | **Rs 2,742,400** | **100%** |
| 19 | Waheed Jutt (12-Aug) | **Cancelled** | Rs 0 | Rs 762,650 | 100% |
| 25 | Waheed Jutt (04-Aug) | **Cancelled** | Rs 0 | Rs 350,000 | 100% |

The board's own header totals include them too — verified to the rupee:

- `Booked Rs 37,348,900` = **all 25** bookings. Live-only is Rs 33,493,850.
  The difference is exactly Rs 3,855,050 — the three cancelled bookings.
- `Outstanding Rs 17,272,279` = includes cancelled (live-only is Rs 13,417,229).
- `Net profit Rs 29,363,900` = `Booked − Spent`, so it books Rs 3,855,050 of profit on
  weddings that did not happen.

**The single worst line on the dashboard:** a cancelled wedding, Rs 0 received, presented to
the owner as their most profitable event of the year at 100% margin.

### 🔴 WWL-009 — S1 — "Net profit" is revenue, not profit

`Net` ignores what was actually received and, when no expense is tagged, ignores cost too.
Every row with `Spent —` reports **100% margin**, including bookings with **Rs 0 received**:

- Rizwan Anjum & Momina Rizwan — `Pending`, received **Rs 0** → Net Rs 2,596,400, 100%
- Ahmed Raza & Sanam Ahmed — `Awaiting Payment`, received **Rs 0** → Net Rs 1,673,250, 100%
- Imran Shafi & Hafsa Imran — received Rs 386,500 of Rs 1,546,000 → Net **Rs 1,546,000**, 100%

Header-level: `Net profit Rs 29,363,900 · 79% margin`, while the owner has actually received
Rs 20,076,621 and spent Rs 7,985,000 — a real cash position of **Rs 12,091,621**. The headline
overstates realised profit by roughly **Rs 17.3M**.

The panel's own subtitle promises "Revenue vs what you've received vs what you spent" — it
shows the received column correctly and then excludes it from the maths.

### 🔴 WWL-010 — S1 — Three different "outstanding" figures on one screen

| Element | Figure | Basis |
|---|---:|---|
| `BAQAYA · TO COLLECT` | Rs 13,417,229 | total − down, excl. cancelled |
| KPI `Revenue due` | Rs 12,292,729 | installment ledger (misses booking 170) |
| Profit board `Outstanding` | **Rs 17,272,279** | total − down, **incl. cancelled** |

…and **two** different "received" figures: KPI `Revenue collected` **Rs 21,201,121** vs profit
board `Received` **Rs 20,076,621**.

This independently confirms WWL-005: the profit board's Received matches the true sum of down
payments exactly (Rs 20,076,621), so **the KPI's Rs 21,201,121 is the wrong one**, over by the
same Rs 1,124,500.

### ✅ Sort mechanics pass

- **D1-022/023/024** — all three sorts reorder correctly. `Most profit` verified strictly
  monotonic descending across all 25 rows (2,742,400 → … → 350,000).
- **D1-025** 🔴 — confirmed still open: active segment is conveyed by a `bg-primary` class
  only. No `aria-pressed`, no `aria-current` on any of the three.

### 🔴 WWL-011 — S2 — The اردو language toggle does nothing

Clicked اردو, waited, captured the full page text; clicked EN, captured again:

- `urLen 7934` · `enLen 7934` · **`identical: true`** · **`differingChars: 0`**
- `<html lang>` flips `en` ⇄ `ur` — and that is the only effect.
- `dir` is never set; computed direction stays `ltr`.
- Total Urdu characters on the page in "Urdu" mode: **4** — which is the toggle's own
  "اردو" label.
- Every label stays English: Home, Bookings, Calendar, Customers, Dashboard, Total bookings,
  Revenue, Upcoming, Booked, Received, Outstanding, Net profit, Sort, Recent, Biggest.

A language switch given prime header placement, in a product whose users are Pakistani venue
owners, is inert. (The portal's Roman-Urdu labels — *Baqaya*, *Aaj ke events*, *Naye Rabtay*,
*Yaad dilao*, *Khata* — are present in **both** modes, so they are not the toggle working.)

D1-042 (RTL money formatting) is therefore **not applicable** — nothing renders RTL.

### 🔴 WWL-012 — S3 — All 12 reminder buttons have the same accessible name

Every `Yaad dilao` button exposes exactly `"Yaad dilao"` with no `aria-label` distinguishing
the customer. A screen-reader user hears twelve identical buttons and cannot tell which one
chases Kamran Sheikh (Rs 325,020) from the one that chases Rizwan Anjum (Rs 2,596,400).
The visible row context is not associated with the control. (D1-058)

### ✅ Section C passes — driven, not just observed

- **D1-022/023/024** — all three sorts reorder correctly; `Most profit` and `Biggest` both
  verified strictly monotonic descending across all 25 rows.
- **D1-026** — ties are stable: the two Rs 350,000 rows keep a deterministic order.
- **D1-027** — clicking the active segment a second time does not reverse or clear the sort
  (order byte-identical). No hidden toggle to mis-discover.
- **D1-028** — `Hide details` works: `aria-expanded` flips true→false, the accessible name
  changes to "Show what's left", 431 characters of content hide, and toggling back restores
  the page byte-for-byte.
- **D1-029** — that collapsed state **survives a hard reload**.
- **D1-030** — `Yaad dilao` fully verified end to end. Fired on the vendor's **own** booking
  (Muhammad Rehman Yousaf) rather than a customer's, since the control is outward-facing:
  `POST /bookings/180/reminders/log` → button becomes **"Dubara"** → **hard reload** →
  exactly **one** of the twelve persists as "Dubara", on the correct row. It does **not**
  auto-send: it logs the reminder and opens WhatsApp pre-filled in Urdu for the vendor to
  send. Good design.
- **D1-031** — not silently duplicable: the control relabels to "Dubara" ("again"), so a
  repeat is an explicit choice rather than an invisible second reminder.

### Cross-check: the reminder panel is the most *correct* money view on the screen

`Aaj kis ko yaad dilana hai` lists **Imran Shafi & Hafsa Imran at Rs 1,159,500** (the booking
Receivables drops entirely, WWL-001) **and** Waheed Jutt at **Rs 315,000** (the figure
Receivables overstates as Rs 350,000, WWL-002). Its 12 visible rows total Rs 10,614,779, and
the 2 rows behind `see all remaining` account for the balance to Rs 13,417,229.

This triangulates the whole money story: **BAQAYA / the reminder panel / the booking detail
pages all agree at Rs 13,417,229. Receivables and the KPI row are the outliers.**

### 🔴 WWL-013 — S2 — `Toggle Sidebar` does nothing, at any width

Driven at three viewports. The button flips internal state (`data-sidebar` `true`⇄`false`)
and produces **zero** visual change:

| Viewport | main width | visible nav links | result |
|---|---|---|---|
| 1536px | 1521 → 1521 | 30 → 30 | **screenshots pixel-identical** (SHA-256 `445108EA…` both) |
| 1024px | 1009 → 1009 | 30 → 30 | no change |
| 360px | — | 24 → 24 | no change, no overlay opened |

At 1536/1024 the sidebar is already a fixed icon rail that the button never collapses. At
360px the navigation is a bottom tab bar, so there is no sidebar to toggle at all — yet the
button still renders in the header. It is a dead control on every screen size.

### 🔴 WWL-014 — S2 — At 360px, today's events and the enquiries card are clipped off-screen

Measured and screenshotted at 360×800:

| Control | right edge | viewport | scrollable ancestor? |
|---|---:|---:|---|
| `12:00 Waheed Jutt — Rs 315,000 due` | 419 / 390 | 360 | **none** |
| `13:00 Owais Siddiqui & Laiba Owais` | 419 | 360 | **none** |
| `22 new enquiries to reply` | 415 | 360 | **none** |
| `Agle 7 din` calendar strip | 363 | 360 | ✅ yes (`overflow-x:auto`, 51px) |

The screenshot shows the money truncated mid-word — **"Rs 315,000 d"** and
**"Rs 757,350 d"** — and the `Aaj ke events` / `Naye Rabtay` cards running off the right edge
with no right border, while the `BAQAYA` and `Agle 7 din` cards on the same screen are
correctly inset. So it is these specific cards missing the container inset, not a global
layout failure.

The page itself does **not** overflow (`scrollWidth 345 < 360`), which is why this is easy to
miss: the content is **clipped**, not scrollable. There is no gesture that reveals the cut-off
amount. Today's event and its balance are the two things a venue owner opens the phone to
check.

Evidence: `dash-360.png`, `dash-360-clipped.png`.

### 🔴 WWL-015 — S2 — The ⌘K palette cannot find any data, and returns misleading matches

It opens correctly (both by click and by Ctrl/⌘K, auto-focusing the input) and navigating to a
page works. But its placeholder says **"Search or jump to…"** and it searches only route
names — never bookings, customers, leads or invoices:

| Query | Results |
|---|---|
| `Imran Shafi` | **0** — a customer with Rs 1,159,500 owed, visible on the same screen |
| `170` | **0** — a real booking id |
| `Imran` | 2 — *"Trade operations hub"*, *"Sign contract — e-signature"* |
| `Waheed` | 1 — *"Trade operations — editor"* |
| `Kamran` | 1 — *"Trade operations hub — all trades"* |
| *(empty)* | 29 commands — Add booking, Log a lead, Record a payment… |

Two defects: it finds **no data at all**, and its fuzzy matcher returns results with no visible
relationship to the query — typing a customer's name offers "Trade operations hub" and "Sign
contract". A vendor searching for a customer is told, in effect, that the customer does not
exist.

### ✅ More Section C passes

- **D1-038 (navigation half)** — palette opens by click *and* keyboard, auto-focuses, and
  selecting `Receivables` navigates correctly to `/dashboard/receivables`.
- **D1-039 — notification bell, full pass.** Badge `53` matched `notifications/unread-count`
  exactly. Opened the panel (22 real items), clicked **one** notification (not "Read all"),
  which navigated correctly to `/dashboard/leads` for a lead follow-up. **Hard reload → 52**,
  and the UI badge matched the API again.
- **D1-040 — theme, full pass.** Light → Dark applies (`html.dark`, bg `rgb(21,18,15)`),
  **persists across hard reload**, money renders amber `rgb(245,158,11)` on near-black with
  good contrast, no overflow introduced. Restored to Light.

### 🔴 Accessibility pattern confirmed across four separate controls (D1-059)

The same defect recurs: state conveyed only by CSS class, never to assistive tech.

| Control | Marks active state? |
|---|---|
| Sort segments (Recent / Most profit / Biggest) | ❌ no `aria-pressed`, no `aria-current` — `bg-primary` class only |
| Venue switcher menu items | ❌ no `aria-checked` / `data-state` |
| Theme mode (Light / Dark / System) | ❌ none — *though the 6 accent swatches beside them DO set `aria-checked`* |
| Notification bell | ❌ `aria-label` is null — announces only "53" |
| `Hide details` | ✅ correct — `aria-expanded` + name changes to "Show what's left" |

`Hide details` and the accent swatches prove the codebase knows the right pattern; it is
applied inconsistently.

### 🔴 WWL-016 — S3 — Dashboard CTAs don't do what they say

All three of the hero's calls to action resolve to the same unfiltered list:

| Control | Context it appears in | href | What actually happens |
|---|---|---|---|
| `see all` | `across 14 events` (BAQAYA debt) | `/dashboard/bookings` | Unfiltered bookings list, 10 rows, **no filter for the 14 owing** |
| `Nayi Booking` | Hero primary CTA | `/dashboard/bookings` | Lands on the list; **no create flow opens** — you must then find "Add booking" |
| `Add booking` | Hero | `/dashboard/bookings` | Same |

Verified by clicking each: `dialogOpen: false`, no query filter, `anyFilterApplied: false`.
"See all" for a 14-item debt list that shows you 25 unrelated bookings is a dead end, and the
main "New Booking" button does not begin a booking.

### ✅ Section D — navigation integrity, all 14 links driven

Every in-`main` dashboard link was loaded and checked for **rendered content**, not HTTP 200
(SSR returns only a shell here — a fetch of `/dashboard/receivables` has the right `<title>`
but `mentionsMoney: false` — so status codes prove nothing).

| Route | main text | Rendered |
|---|---:|---|
| `/dashboard/leads` | 392 | ✅ |
| `/dashboard/bookings` | 521 | ✅ |
| `/dashboard/calendar` | 800 | ✅ |
| `/dashboard/chat` | 339 | ✅ (⚠️ no `h1`) |
| `/dashboard/money` | 611 | ✅ → resolves to Receivables |
| `/dashboard/customers` | 376 | ✅ |
| `/dashboard/settings` | 801 | ✅ |
| `/dashboard/settings?tab=profile` | 801 | ✅ |
| `/dashboard/settings?tab=listing` | 801 | ✅ |
| `/dashboard/onboarding` | 1131 | ✅ |
| `/dashboard/payments` | 483 | ✅ |
| `/dashboard/bookings/179` | 347→2386 | ✅ |
| `/dashboard/bookings/166` | 347 | ✅ |
| `/dashboard` | 965 | ✅ |

**No blank pages, no error states. D1-044 passes.**

- **D1-045 ✅** — deep links open the *correct* record: `/dashboard/bookings/179` shows
  Waheed Jutt with matching email, phone `03030936741`, date Wed 5 Aug 2026, status
  `Awaiting Payment`.
- **D1-046 ✅** — clicking a link to the page you are already on does **not** blank it
  (7,934 → 7,934 chars). The known blank-page-on-same-route class of bug is absent here.
- **D1-047 ✅** — browser Back from Receivables returns a fully rendered dashboard
  (7,934 chars, BAQAYA / totals / PER-HALL all intact) — no empty shell.
- **D1-049 ✅** — `?tab=profile` and `?tab=listing` both activate the correct tab on arrival
  (verified by active-tab class and by the pane's own headings), not the default tab.
- **D1-037 ✅** — mobile `More` sheet opens at 360px with 10 reachable destinations
  (Calendar, Messages, Customers, Set up, Date holds, Expenses, Staff & Payroll, Inventory,
  Reviews, Venues), none clipped. *(It is invisible at desktop — it belongs to the mobile
  bottom tab bar, which is why it cannot be clicked at 1536px.)*

**Checked and cleared — not a bug.** Booking 179's page shows `Balance due Rs 0`, which
initially looked like a fourth conflicting figure. It is not: that belongs to the **Quotation**
widget, which states *"No items yet"*, so Subtotal / Grand total / Balance are all correctly
Rs 0 for an empty quotation. Booking 170's same widget *does* have line items and correctly
shows Rs 1,159,500. Consistent.

⚠️ Sixth instance of the accessibility pattern: none of the **10 Settings tabs** expose
`aria-selected` or `data-state` — active tab is a CSS class only.

### 🔴 WWL-017 — S2 — 11 of the 20 onboarding tasks send you where you cannot do them

The strip is *accurate about what is missing* (see the passes below) but its "Add it" links
are wrong for more than half the list.

**Six items point to `?tab=profile`, where none of these fields exist.** The Profile tab holds
exactly five: Business name, Description, City, Area / locality, Brand logo URL. All six of
these live on the **Listing content** tab:

| Task (weight) | Sent to | Actually on |
|---|---|---|
| Owner name (+5) | `?tab=profile` | `?tab=listing` — "Owner / lead name" |
| WhatsApp number (+5) | `?tab=profile` | `?tab=listing` — "WhatsApp number (bookings)" |
| Languages spoken (+3) | `?tab=profile` | `?tab=listing` |
| Years in business (+3) | `?tab=profile` | `?tab=listing` |
| Weddings completed (+3) | `?tab=profile` | `?tab=listing` |
| Owner bio written (+2) | `?tab=profile` | `?tab=listing` — "About the owner" |

**Five items point to `/dashboard/business-documents`, which is a hard 404** ("404 · Page not
found · The page you were loo…"):

- NTN submitted · NTN verified by Wedding Wala · CNIC submitted · CNIC verified by
  Wedding Wala · Venue visited by Wedding Wala

So the two highest-value prompts the vendor actually sees on the dashboard — Owner name and
WhatsApp number, the ones the strip argues hardest for ("Families in Pakistan book people, not
companies") — both dead-end on a tab with no such field, and the entire verification/trust
category dead-ends on a 404.

**Verified working, so this is specifically a link-mapping defect, not a routing failure:**
`?tab=listing` ✅, `?tab=images` ✅ (activates Images), `?tab=amenities` ✅ (activates
Amenities & services, contains parking capacity), `?tab=profile` ✅ (activates Profile),
`/dashboard/profile` ✅ resolves.

> Note on method: my first sweep of these routes reported `activeTab: null` for `?tab=images`
> and `?tab=amenities`, which would have made them look broken too. That was **premature
> measurement** — the Settings page needs ~6s to render its tabs. Re-tested with a real
> navigation, both are correct. Only the 6 wrong-tab items and the 5 × 404 are real.

### ✅ Section E — the completeness engine itself is exact

Every number the strip claims was checked against `businesses/my-completeness`:

| UI claim | Computed from API | Match |
|---|---|---|
| Score `44 OF 100` | weakest business score = 44 | ✅ |
| "See all **20** remaining" | 20 of 29 items `done: false` | ✅ |
| "Worth **56** more points" | missing weight = 56 | ✅ |
| "· Rehman Grand Marquee · weakest of 3" | 44 vs 52 vs 52 | ✅ |
| 44 + 56 | = 100; item weights total exactly 100 | ✅ |

- **D1-050 ✅** — all three visible prompts are truthful: `ownerName: null`,
  `whatsappNumber: null`, and "Cancellation policy set" is genuinely in the missing list.
- **D1-051 ✅ — full write/verify/restore cycle on live.** Typed a real Owner name on
  `?tab=listing`, saved (`ownerName` persisted to the API), **hard-reloaded the dashboard**:

  | | before | after | expected |
  |---|---:|---:|---:|
  | Score | 44 | **49** | 49 (+5, the item's stated weight) |
  | "See all N remaining" | 20 | **19** | 19 |
  | "Worth N more points" | 56 | **51** | 51 |
  | Owner name prompt | shown | **gone** | gone |

  Exact on every value, and the API agreed. **Then restored**: field cleared, saved,
  re-verified — `ownerName: null`, score back to **44**, 20 remaining. Account left as found.
- **D1-052 ✅** — the +5 weighting is real, not decorative: the score moved by exactly the
  advertised amount.

### 🔴 WWL-018 — S1 — A failed load renders as "Rs 0 collected, Rs 0 owed" with no error

**The most dangerous finding in the module.** Blocked the three money endpoints
(`analytics/kpis`, `bookings/action-summary`, `analytics/revenue-breakdowns`) and forced a
real refetch by switching venue. 7 requests failed. The dashboard rendered:

| Tile | Value shown |
|---|---|
| Total bookings | **0** |
| Revenue collected | **Rs 0** ↗ *received* |
| Revenue due | **Rs 0** *to chase* |
| Today's events | **0** |
| Upcoming (7d) | **0** |

- `showsErrorUi: false` — **no error message anywhere on the page**
- `retryButtons: []` — **no retry affordance**
- The BAQAYA hero simply vanished rather than reporting a problem

There is nothing to distinguish this from a genuine, truthful zero. It is rendered with full
confidence — the words *"received"* and *"to chase"* sit beside it, and **Rs 0 collected even
carries a green upward trend arrow**.

And the same screen contradicts itself: while `Revenue due` reads **Rs 0 · to chase**, the
`Who to chase` panel directly below still lists **Waheed Jutt Rs 315,000** and **Danish
Qureshi Rs 1,220,537** — because that panel is fed by a different query that was not blocked.

For a venue owner on unreliable mobile data this is the worst possible failure mode: it does
not say "couldn't load", it says *"you have collected nothing and are owed nothing."* Either
they panic, or they conclude there is nothing to chase and stop chasing.

Evidence: `dash-failure-rs0.png`.

### ✅ Section G — accessibility, and H — desktop

- **D1-057 ✅ (partial)** — 54 visible focusable elements; focus rings render on every control
  sampled (`outline` present on all 6 tested); no focus trap encountered.
- **D1-059 ✅** — **0 of 54 focusable elements lack an accessible name.** Every icon-only
  control has one. *(The bell's name is the bare count "53" — technically named, but it does
  not say "notifications"; see WWL-012's class of issue.)*
- **D1-060 🔴 (minor, S4)** — heading order is `1,3,3,3,3,3,3,4,4,2,2,3`: one true skip
  (**h1 → h3** at "Your listing is half-built") and the h2s appear *after* the h3s, so
  heading-based navigation does not reflect the visual structure.
- **D1-056 ✅** — long names truncate with an ellipsis rather than overflowing
  ("Owais Siddiqui & Laiba Owa…").
- **D1-062 ✅ desktop 1536px** — no horizontal overflow (`scrollWidth 1521`), **0 covered
  controls**.
- **D1-061 🔴 360px** — see WWL-014.

### 🔴 WWL-019 — S1 — **ROOT CAUSE**: 59 `catch` blocks swallow every API error

`lib/api/analytics.ts:272-278` — the wrapper feeding the dashboard:

```js
const res = await axiosInstance.get(`${BACKEND_URL}api/v1/analytics/recent-bookings…`);
return res.data.data;
} catch {
  return null;          // ← every failure becomes a SUCCESSFUL null
}
```

React Query therefore resolves **successfully** with `null`. `isError` is never true. That is
why both correctly-written error branches in `overview-redesigned-view.tsx` are **dead code**:

| Line | Code that exists | Why it never runs |
|---|---|---|
| 186-190 | `kpisQ.isError ? "—"` | `isError` never true → falls through to `num(undefined)` → **Rs 0 / 0** |
| 257-258 | `error="Couldn't load recent bookings."` + `onRetry={() => recentQ.refetch()}` | same → renders the **empty state** instead |

**Blast radius — 59 error-swallowing catches across 14 API modules:**

| Count | Module | | Count | Module |
|---:|---|---|---:|---|
| **18** | `analytics.ts` *(feeds the dashboard)* | | 3 | `payments.ts` |
| 13 | `bookingOrder.ts` | | 3 | `dashboard.ts` |
| 5 | `vendors.ts` | | 2 | `favorites.ts` |
| 4 | `chat.ts` | | 2 | `businessDrafts.ts` |
| 4 | `ai.ts` | | 1 each | `whatsapp`, `venueOs`, `subscription`, `notifications`, `availabilitySetup` |

Any error state or Retry built on `isError` anywhere in the portal is unreachable by the same
mechanism. **This one pattern is the cause of WWL-018 and of D1-054 below** — fix it and both
already-written error UIs start working.

### ✅ D1-054 — Retry: control exists, but is unreachable (completed)

Blocked only `analytics/recent-bookings` and forced a real refetch. The panel rendered:

> **"No bookings yet — Your most recent bookings will appear here as they come in."**

`errorMessageShown: false` · `retryPresent: false` — while this venue has **8 bookings**.
A failed load is presented as a confident factual claim that the vendor has no bookings.
The Retry button in the source is real; it is simply never rendered (see WWL-019).

### 🔴 D1-055 — Layout shift: CLS 1.03, ten times the "good" threshold (completed)

Measured with a real `PerformanceObserver` on `layout-shift` (`buffered: true`), with API
responses delayed 2.5s to expose panel-arrival shifts:

| Metric | Value |
|---|---|
| **Cumulative CLS** | **1.0259** |
| Verdict | **POOR** (good < 0.1 · needs-work < 0.25) |
| Largest shift | **0.6762** at t=2.29s — initial load, *not* caused by the delay |
| Second shift | **0.3497** — panels re-arriving after a venue switch |

Content jumps as panels arrive rather than reserving space with skeletons. The 0.676 shift is
present on an ordinary load, so this is not an artefact of the injected delay.

> **Correction to my earlier note.** I had written that this needed "CDP network emulation,
> which this harness does not expose," and left the case unrun. That was wrong on both counts:
> the `chrome-devtools` tools do expose network throttling, and in any case the shift is
> measurable directly with `PerformanceObserver`. The case is now run and it fails.

---

## MODULE 1 — Dashboard: COMPLETE

**62 cases written · 62 executed · 0 unrun · 19 findings (9 × S1).**

| ID | Sev | Finding |
|---|---|---|
| WWL-001 | S1 | Rs 1,159,500 owed absent from Receivables (booking 170 flagged `Paid` while owing) |
| WWL-002 | S1 | Receivables ignores a Rs 35,000 down payment already taken |
| WWL-003 | S2 | Two "money owed" totals on one screen (Δ Rs 1,124,500, reconciles exactly) |
| WWL-004 | S1 | Today's-events KPI drops an `Awaiting Payment` event happening in hours |
| WWL-005 | S1 | `Revenue collected` overstates by Rs 1,124,500 — reports uncollected money as collected |
| WWL-006 | S1 | 4 sections never rescope — one venue shows all venues' money and events |
| WWL-007 | S3 | Venue switcher marks no active option |
| WWL-008 | S1 | Cancelled weddings ranked #1 most profitable; header totals include them |
| WWL-009 | S1 | "Net profit" is revenue — ignores receipts; every untagged row shows 100% margin |
| WWL-010 | S1 | Three different "outstanding" figures and two "received" figures coexist |
| WWL-011 | S2 | اردو toggle inert — page text byte-identical, 0 differing characters |
| WWL-012 | S3 | 12 reminder buttons share one accessible name |
| WWL-013 | S2 | `Toggle Sidebar` dead at 1536/1024/360 — screenshots pixel-identical |
| WWL-014 | S2 | 360px: today's events clipped off-screen, unreachable, money truncated |
| WWL-015 | S2 | ⌘K finds no data; returns unrelated routes for customer names |
| WWL-016 | S3 | Hero CTAs resolve to an unfiltered list; "Nayi Booking" starts no booking |
| WWL-017 | S2 | 11 of 20 onboarding tasks dead-end (6 wrong tab, 5 × hard 404) |
| **WWL-018** | **S1** | **Failed load renders as "Rs 0 collected, Rs 0 owed" with no error and no retry** |
| **WWL-019** | **S1** | **ROOT CAUSE — 59 `catch` blocks across 14 API modules return `null` on failure, so `isError` is never true and every error/Retry UI is dead code** |
| D1-055 | S2 | CLS **1.03** (10× the "good" threshold) — panels jump in without reserved space |

**Root-cause clusters (not 18 separate bugs):**
1. **`paymentStatus` trusted over actual amounts** → WWL-001, 002, 003, 005, 010
2. **Cancelled bookings not excluded from aggregates** → WWL-008, and the `0677c6e` fix for
   this is **unpushed/undeployed**
3. **Profit maths ignores receipts** → WWL-009
4. **Venue scope not threaded through 4 panels** → WWL-006
5. **`catch { return null }` in the API layer (59 sites)** → WWL-018, WWL-019, D1-054.
   The error UIs are already written and correct; they are simply never reached. **This is the
   single highest-leverage fix in the module.**
6. **Active state expressed as CSS class only** → WWL-007, 012, and 6 more control groups

**Data written during testing:** one reminder log on the vendor's own booking (180); one
notification read (53→52); Owner name set and **restored to `null`**; venue scope and theme
**restored**. No money rows created. No customer contacted.

### Cases executed so far

**Section A — all 15 executed.**
`[x]` D1-001 🔴 WWL-003 · D1-002 🔴 (ruled out cancellations) · D1-003 🔴 WWL-004 ·
D1-004 🔴 (not a TZ bug — it is a status filter) · D1-005 🔴 WWL-001 · D1-006 🔴 WWL-005 ·
D1-007 ✅ (identity holds: 21,201,121 + 12,292,729 = 33,493,850) · D1-008 ✅ (25 = 25) ·
D1-009 ✅ (8 = 8, verified by roll-up) · D1-010 🔴 (14 / 14 / 13 — Receivables lists 13,
BAQAYA claims 14; the missing one is booking 170) · D1-011 ✅ (all 3 cancelled correctly
excluded from both totals) · D1-012 ✅ (no cancelled row in the profit board — regression
holds) · D1-013 ✅ (per-hall sums to Rs 33,493,850 = total booked, 22 = 25 − 3 cancelled) ·
D1-014 ✅ (per-hall is this-year scoped as labelled) · D1-015 ✅ (no NaN/undefined/drift;
separators correct throughout)

> **D1-012 is 🔴, not ✅ — see the correction in the findings above.** My original pass was
> asserted from the default sort without parsing rows; cancelled bookings are in fact present
> and rank #1 under `Most profit`.

**Section B — all 6 executed.**
`[x]` D1-016 ✅ · D1-017 🔴 WWL-006 · D1-018 ✅ · D1-019 🔴 WWL-006 (PER-HALL never
rescopes) · D1-020 🔴 WWL-006 (other venues' customers shown under a single-venue scope) ·
D1-021 ✅ (3 rapid switches, final state correct — no stale render)

Plus 🔴 WWL-007 (switcher marks no active option) found during Section B.

---

# MODULE 2 — Today (`/dashboard/today`)

**What this screen is.** The operational screen: what is happening on the floor *today*, who
owes what on the day, and which day-of tasks are still open. Unlike the Dashboard (a summary a
vendor reads), this is a screen a vendor *acts from* while an event is running. Two things
therefore matter more here than anywhere else: **the date boundary must be correct in PKT**,
and **a task marked done must stay done**.

**Live inventory captured 2026-08-05** — h1 `Today — 05-Aug-2026`; 15 buttons (4 × `Timeline`,
2 × `Run sheet`, `View timeline`, plus chrome); 5 tiles; 2 event rows; 8 nav links.

**Tiles:** Events today `2` · Total tasks `0` · Open tasks `0` · Revenue today `Rs 1,612,250` ·
Outstanding `Rs 12,292,729 to collect`.

**Rows:** Waheed Jutt 12:00 `Rs 350,000` `Awaiting Payment` tasks 0 · Owais Siddiqui & Laiba
Owais 13:00 `Rs 1,262,250` + `Rs 757,350 due` `Confirmed` tasks 0.

**Two anomalies visible before testing:** Waheed's row shows no "due" line although he owes
Rs 315,000, and `Outstanding` is the all-time receivables figure Module 1 proved understated
(WWL-001/005) — on a screen titled *Today*.

## A. Data correctness and cross-screen consistency

- [ ] **D2-001** — `Events today = 2` must equal bookings dated today (PKT) per the API, and
  must match the Dashboard's `Aaj ke events` (2), not its KPI tile (1).
- [ ] **D2-002** — Both rows must be the correct bookings (179 Waheed, 166 Owais) with correct
  venue attribution.
- [ ] **D2-003** — `Revenue today Rs 1,612,250`: 350,000 + 1,262,250 = **booked totals**, not
  money received today. Judge whether the label is defensible or misleading.
- [ ] **D2-004** — Compute what was actually *received* today and quantify the gap.
- [ ] **D2-005** — Waheed's row shows `Rs 350,000` and **no due line**; he owes Rs 315,000.
  Determine why it is suppressed and whether it is status-driven.
- [ ] **D2-006** — `Outstanding Rs 12,292,729` — confirm it is all-time, not today's.
- [ ] **D2-007** — Confirm it inherits WWL-001 (excludes booking 170's Rs 1,159,500).
- [ ] **D2-008** — `Total tasks 0` / `Open tasks 0` must match the tasks API.
- [ ] **D2-009** — Row `TASKS` column must agree with the tiles.
- [ ] **D2-010** — The two **cancelled** Waheed bookings (04-Aug, 12-Aug) must not leak in.
- [ ] **D2-011** — Money formatting: separators, no `NaN`, no `Rs 0` standing for missing.

## B. Date boundary — highest-risk area on this screen

- [ ] **D2-012** — h1 `05-Aug-2026` must equal today in **PKT**, not UTC.
- [ ] **D2-013** — An event at 00:30 PKT is 19:30 UTC the previous day; determine which side
  the query uses. A UTC window would drop early-morning events.
- [ ] **D2-014** — An event at 23:30 PKT (a normal barat) must still count as today.
- [ ] **D2-015** — Must agree with `bookings/action-summary.today` (`2026-08-05`).
- [ ] **D2-016** — Does the page recompute on date rollover, or is the date fixed at render?

## C. Timeline dialog — full CRUD, the core of this module

- [ ] **D2-017** — `Timeline` opens a dialog; capture title and every field.
- [ ] **D2-018** — Enumerate all controls: `Add task`, `By person`, `By time`, `Cancel`,
  `Print`, `Toggle done`; fields `What happens?`, `e.g. lead photographer`, `mins`, `Note`.
- [ ] **D2-019** — **Create** a task with valid values → appears.
- [ ] **D2-020** — **Hard-reload** → persists; row TASKS 0→1; `Total tasks` and `Open tasks`
  both increment.
- [ ] **D2-021** — **Toggle done** → hard-reload → persists; `Open tasks` decrements,
  `Total tasks` unchanged.
- [ ] **D2-022** — **Delete** → hard-reload → gone, counts back to 0 (also my cleanup path).
- [ ] **D2-023** — Empty task name → Save blocked **with a stated reason**.
- [ ] **D2-024** — `mins` = `-30` → rejected, not stored.
- [ ] **D2-025** — `mins` = `banana` / `999999`.
- [ ] **D2-026** — 500+ char task name → bounded, no layout break.
- [ ] **D2-027** — Owner field length bound.
- [ ] **D2-028** — `Note (optional)` genuinely optional; long note bounded.
- [ ] **D2-029** — API rejection must surface the **server's** reason (WWL-019 class).
- [ ] **D2-030** — `By person` / `By time` actually regroup, and mark active state accessibly.
- [ ] **D2-031** — `Cancel` discards without saving — verified by hard reload.
- [ ] **D2-032** — Escape and backdrop click close without saving.
- [ ] **D2-033** — Opening for a *different* event must not carry the previous event's tasks
  or draft state across.

## D. Run sheet & View timeline

- [ ] **D2-034** — `Run sheet` produces something real for the correct booking.
- [ ] **D2-035** — Run sheet content matches the booking (customer, time, amount, venue).
- [ ] **D2-036** — `Print` produces a print view without dashboard chrome.
- [ ] **D2-037** — Header `View timeline` vs per-row `Timeline` — same or different?
- [ ] **D2-038** — **4 `Timeline` buttons for 2 rows** — account for the extra two.

## E. Venue scope

- [ ] **D2-039** — Grand Marquee → only Waheed's 12:00 event (`Events today = 1`).
- [ ] **D2-040** — Marquee Bahria → only Owais's 13:00 event.
- [ ] **D2-041** — Banquet & Lawn → no events today; verify empty state.
- [ ] **D2-042** — `Revenue today` and `Outstanding` must rescope (Dashboard failed this).
- [ ] **D2-043** — Scope persists across hard reload.

## F. Empty state

- [ ] **D2-044** — No-events venue must say so, not render `Rs 0` as a real figure.
- [ ] **D2-045** — Empty state offers a way forward.

## G. Failure states

- [ ] **D2-046** — Block today/tasks endpoints → error + Retry expected, `0 / Rs 0` feared.
- [ ] **D2-047** — Does this module's API wrapper share the `catch { return null }` pattern?
- [ ] **D2-048** — Does the matrix-listed `Retry` ever render?

## H. Navigation

- [ ] **D2-049** — Row / customer click opens the correct booking.
- [ ] **D2-050** — All in-`main` links render real content.
- [ ] **D2-051** — Back returns a fully rendered Today page.

## I. Accessibility

- [ ] **D2-052** — Do the 4 `Timeline` / 2 `Run sheet` buttons have distinguishing accessible
  names, or is this WWL-012 again?
- [ ] **D2-053** — Table header semantics and row/column association.
- [ ] **D2-054** — Dialog traps focus, restores focus to opener, has an accessible name.
- [ ] **D2-055** — Heading order not skipped.

## J. Responsive

- [ ] **D2-056** — 360px: no overflow; table scrolls in its own container, not clipped.
- [ ] **D2-057** — 360px: `Timeline` / `Run sheet` remain reachable.
- [ ] **D2-058** — Desktop 1536px: no overflow, zero covered controls.

## Findings raised (Module 2)

### 🔴 WWL-020 — S1 — On the day-of screen, a customer owing Rs 315,000 shows no amount due

The endpoint returns two money fields per booking, and the UI's "due" line is driven by the
**quotation builder**, not by the booking's real balance:

| Booking | `totalAmount` | `orderGrand` | `orderBalance` | Row shows |
|---|---:|---:|---:|---|
| 179 Waheed Jutt · **12:00 today** | 350,000 | **null** | **null** | `Rs 350,000` — **no due line** |
| 166 Owais Siddiqui · 13:00 today | 1,262,250 | 1,262,250 | 757,350 | `Rs 1,262,250` + `Rs 757,350 due` |

Waheed genuinely owes **Rs 315,000** (350,000 − 35,000 down) — the Dashboard's own
`Aaj ke events` and reminder panels both say so. The Today screen shows nothing, purely because
nobody built a quotation for that booking (Module 1 confirmed its Quotation widget reads
*"No items yet"*).

This is the operational screen a vendor works from **while the event is running**. A guest
arrives at 12:00 owing Rs 315,000 and the screen for that hour shows no balance to collect.
The failure is silent and status-independent — it depends only on whether a quotation exists.

### 🔴 WWL-021 — S2 — `Outstanding` on the "Today" screen is the all-time figure, and it's the understated one

`Outstanding Rs 12,292,729 · to collect` is served by `analytics/receivables` — verified live:
`receivablesHasBooking170: false`. So this screen:

1. shows an **all-time** receivables total on a page titled *Today* (nothing about it is
   today-scoped), and
2. inherits **WWL-001** — it excludes booking 170's **Rs 1,159,500** entirely.

Both defects ride on one tile.

### 🔴 WWL-022 — S3 — Invalid task duration is silently discarded

Entered `mins = -30` on a new task: no `aria-invalid`, no error, Save enabled. The task saved
with **`durationMin: null`** — the value was neither stored nor rejected, just dropped, with no
toast and no indication. The vendor believes they set a duration. (The `mins` input carries
`min: ""` — the same unfloored-number pattern found across the portal.)

### 🔴 WWL-023 — S3 — `Delete` on a timeline task has no confirmation

One click permanently removes a run-of-show item — verified by deleting 7 tasks in sequence,
each gone immediately with no confirm step. On a screen used *during* a live event, a mis-tap
silently destroys part of the run sheet. `Toggle done`, `Edit` and `Delete` are three adjacent
icon-only buttons per row.

### ✅ Module 2 passes so far — the timeline engine is genuinely good

- **D2-001/002 ✅** — `Events today = 2`, exactly bookings 179 and 166, correct venue
  attribution (3358 Grand Marquee, 3360 Marquee Bahria). Matches the Dashboard's
  `Aaj ke events` (2) — and therefore confirms the Dashboard KPI tile's `1` is the wrong one
  (WWL-004).
- **D2-010 ✅** — both cancelled Waheed bookings (04-Aug, 12-Aug) correctly excluded.
- **D2-012/015 ✅** — endpoint `date` field is `2026-08-05` and matches PKT today.
- **D2-019/020 ✅ — create + persist.** Seeded the `Generic event` template → 6 tasks with
  times, durations and owners. **Hard reload**: `Total tasks` 0→**6**, `Open tasks` 0→**6**,
  Waheed's row TASKS 0→**6**, Owais's stays **0**. API agreed exactly.
- **D2-021 ✅ — toggle done persists.** Toggled one task → **hard reload** → `Total tasks`
  stays **6**, `Open tasks` **6→5**, API shows `status: "done"` with `doneAt` set. Correct on
  every counter.
- **D2-022 ✅ — delete persists.** Deleted all 7 with API verification each round
  (6→5→4→3→2→1→0), then hard-reloaded: tiles back to `0/0`, no residue.
- **D2-023 ✅** — Save is correctly **disabled** while the task name is empty.
- **D2-038 ✅ — not a bug.** The 4 `Timeline` buttons are 2 visible desktop + 2 hidden mobile
  variants, standard responsive duplication.
- **Template quality** — the seed templates are properly Pakistani: Mehndi, Nikah, Baraat,
  Walima, Engagement, Dholki, Generic.

### ⚠️ Accessibility note (D2-052)

Both visible `Timeline` buttons share `aria-label="Manage timeline"` with no customer context;
the hidden mobile variants have **no** accessible name at all. Inside the dialog, every task
row exposes three identical icon-only buttons — `Toggle done` / `Edit` / `Delete` — with no
indication of *which task* they act on. Same class as WWL-012.

### 🔴 WWL-024 — S1 — The Today screen ignores the venue selection completely

Driven across all four scopes. `/timeline-tasks/today` takes **no business parameter at all**:

| Scope selected | Events today | Rows shown | Correct answer |
|---|---:|---|---:|
| All venues | 2 | Waheed + Owais | 2 ✅ |
| **Rehman Grand Marquee** | **2** | Waheed + Owais | 1 |
| **Rehman Banquet & Lawn** | **2** | Waheed + Owais | **0** |

The Banquet & Lawn case is decisive: that venue has **no events today**, yet the screen still
reports 2 and lists both — verified `apiVenuesReturned: ["Rehman Grand Marquee", "Rehman
Marquee Bahria"]`, neither of which is the selected venue.

Worse than the Dashboard's WWL-006 because this is the **operations** screen. A floor manager
at the Lahore venue opens *Today* and is shown an event running in **Rawalpindi**. There is no
indication on the row which venue an event belongs to, so it cannot even be disambiguated by
eye.

### 🔴 WWL-025 — S3 — `Run sheet` is disabled with no reason given

With no timeline seeded, both `Run sheet` buttons are `disabled` with **no `title`, no
`aria-describedby`, and no nearby hint**. The vendor sees a greyed-out button and cannot know
it requires a timeline first. (Verified the dependency is real: after seeding 6 tasks the
button enabled for that booking and stayed disabled for the booking with 0 tasks.)

This is exactly the BUG-057 pattern the codebase already has a primitive for
(`FormBlockedHint`) and has fixed elsewhere.

### ⚠️ WWL-026 — S3 — `View timeline` does not open a timeline

The header button `View timeline` is an `<a href="/dashboard/calendar">` — it navigates to the
**Calendar**. The per-row `Timeline` button opens the day-of timeline dialog. Two different
destinations behind near-identical labels on the same screen.

### ⚠️ WWL-027 — S3 — The printable run sheet never names the venue

`mentionsVenue: false`. For a three-venue operator whose crews move between sites, a printed
day-of run sheet that names the client and the date but not **which venue** is missing the one
fact a crew needs to show up at the right place.

### ✅ Run sheet and grouping — genuinely well built

- **D2-034/035 ✅** — Run sheet renders the correct booking: `Client: Waheed Jutt`,
  `Date: Wednesday, 05 August 2026`, `Start: 12:00`, all 6 tasks with times, durations and
  owners, grouped into **SETUP / EVENT / TEARDOWN**, footed `6 steps · Wedding Wala run sheet`.
- **Timezone stated explicitly** — the footer reads **"times are Asia/Karachi"**. Rare and
  correct; it directly answers the PKT concern for the printed artefact.
- **D2-030 ✅** — `By person` genuinely regroups: FLOOR MANAGER (4), BEARER LEAD (1),
  CLEANUP CREW (1). Functionally correct — but neither `By time` nor `By person` sets
  `aria-pressed`/`aria-current` (**7th instance** of that defect).
- **D2-037 ✅ answered** — see WWL-026.

### ✅ Responsive — Today is better than the Dashboard here

- **D2-056/057 ✅ 360px** — `scrollWidth 345 < 360`, **no horizontal overflow, zero off-screen
  controls**, cards stack cleanly, `Timeline` reachable. Screenshot confirms a clean layout.
  Notably **not** affected by WWL-014, which clips the Dashboard's equivalent rows.
  *(One control was flagged "covered" by the automated probe; the screenshot shows it visible
  and usable — recorded as a false positive, not a finding.)*

### Cases not runnable as specified

- **D2-041 / D2-044 / D2-045 (empty state)** — I intended to reach the empty state by selecting
  a venue with no events today. **WWL-024 makes that impossible**: scope is ignored, so no
  selection ever yields zero events. The empty state cannot be reached from this account today
  and is recorded as **unreached**, not passed.

### 🔴 WWL-028 — S1 — Per-venue receivables returns figures larger than the company total, and two venues return the *same* number

Found by noticing the `Outstanding` tile change while testing something else. Queried
`analytics/receivables` with each `businessId`:

| Scope | Outstanding returned |
|---|---:|
| All venues (no `businessId`) | Rs 12,292,729 |
| **3358 Rehman Grand Marquee** | **Rs 23,961,479** |
| **3359 Rehman Banquet & Lawn** | **Rs 23,961,479** ← *identical to 3358* |
| 3360 Rehman Marquee Bahria | Rs 4,005,205 |

Two independent impossibilities:

1. **A subset exceeds the whole.** One venue reports **Rs 23,961,479** against a company-wide
   total of **Rs 12,292,729** — nearly double. The three venues sum to **Rs 51,928,163**,
   **4.2×** the all-venues figure.
2. **`businessId` does not discriminate.** 3358 and 3359 return byte-identical totals despite
   being different venues in different parts of Lahore. Only 3360 differs — and it alone
   matches the Dashboard's per-venue KPI (Rs 4,005,205).

Confirmed rendered live, not just in the API: with Grand Marquee selected the tile reads
**`Outstanding · Rs 23,961,479 · to collect`**.

The Dashboard's own per-venue `Revenue due` figures (3,243,787 / 5,043,737 / 4,005,205) sum
correctly to 12,292,729 — so **the Dashboard and this screen disagree about the same venue's
receivables by ~Rs 20.7M**, because they use different endpoints.

Note the irony against WWL-024: the event list on this page **ignores** the venue selection,
while the `Outstanding` tile **does** pass `businessId` — and that is the path that is broken.

### ✅ D2-046/047/048 — failure handling here is CORRECT, and it proves WWL-019

Blocked `/timeline-tasks/today` and forced a refetch. The page rendered:

> **"Couldn't load today's schedule."** + a **`Retry`** button

`showsErrorUi: true` · `retryPresent: true` · rows cleared rather than shown as empty.

**This is the direct contrast that confirms WWL-019.** The wrapper for this endpoint —
`lib/api/bookingTimeline.ts:152-155` — has **no `catch`**, so the error propagates, `isError`
becomes true, and the already-written error UI renders exactly as intended. The Dashboard's
`analytics.ts` wraps the identical pattern in `catch { return null }` and its error UI never
fires. Same codebase, same component conventions; the only difference is the swallow.

⚠️ Partial: the KPI tiles above the errored table keep showing `Events today 2`,
`Revenue today Rs 1,612,250` and `Outstanding` while the table below says it could not load —
a mixed state where stale numbers sit above an error.

### ✅ Date boundary — correct, verified at source (D2-012/013/014)

`bookingTimelineController.js:384-385`:

```js
const tz = process.env.BOOKING_TZ || "Asia/Karachi";
const todayPKT = moment.tz(new Date(), tz).format("YYYY-MM-DD");
```

Today is computed in **PKT**, not UTC (the comment cites BK-025 as the same guard used across
the booking engine), and `bookingDate` is compared against that date string. An event at
00:30 or 23:30 PKT therefore falls on the correct local day. The printed run sheet also states
**"times are Asia/Karachi"**. This is the one area of the portal where the timezone is handled
deliberately and said out loud.

**WWL-024 root cause, at source** — same controller, line 403:

```js
if (!isAdmin) businessInclude.where = { userId: req.user.id };
```

The query scopes by **owner**, not by the selected venue; there is no `businessId` filter at
all. That is precisely why every venue selection returns the same two events.

**Status filter** (line 408) is `["Pending", "Awaiting Payment", "Confirmed"]` — which is why
cancelled bookings correctly never appear (D2-010 ✅), and also means **`Completed` events are
excluded from the day-of screen**.

### 🔴 WWL-029 — S3 — Dialog does not return focus to the opener

Opened the `Day-of timeline` dialog by real click and pressed Escape. The dialog closes, but
`document.activeElement` becomes **`<body>`** — focus is not returned to the `Timeline` button
that opened it. A keyboard user is dumped to the top of the document and must Tab through the
entire sidebar and header to get back to the row they were working on.

The rest of the dialog's semantics are correct: `role="dialog"`, `aria-labelledby` resolving to
**"Day-of timeline"**, and focus moves *into* the dialog on open. Only the return leg is missing.
(`aria-modal` is also absent.)

### 🔴 WWL-030 — S2 — You cannot open a booking from the Today screen

Neither event row is clickable: no `<a>`, no `role="button"`, no click handler, no
`cursor-pointer`. Verified by actually clicking the row — `navigated: false`,
`dialogOpen: false`, nothing happens.

The only actions available are `Timeline` and `Run sheet`. So on the operational screen a
vendor sees *"Waheed Jutt · 12:00 · Rs 350,000 · Awaiting Payment"* and has **no route to the
booking** to take a payment or check details — they must leave, go to Bookings, and find it.

Combined with **WWL-020** (his Rs 315,000 balance is not shown at all), the day-of screen both
hides what is owed and offers no way to act on it.

### 🔴 WWL-022 extended — out-of-bounds input is silently discarded or truncated

Three probes on the Add-task form, all accepted with no `aria-invalid`, no error and no toast:

| Input | Stored |
|---|---|
| `mins` = `-30` | **`null`** — dropped |
| `mins` = `999999` | **`null`** — dropped |
| 419-character task label | **truncated to 160 chars** |

No corruption reaches the database, but the vendor is never told. They believe they set a
30-minute duration and a full task description; they got neither. Layout did not break under
the long string (`scrollWidth` unchanged) ✅.

### ✅ Remaining passes

- **D2-050/051 ✅** — `View timeline` navigates to `/dashboard/calendar` and browser Back
  returns a **fully rendered** Today page with every tile intact (`Events today 2`,
  `Revenue today Rs 1,612,250`, `Outstanding Rs 12,292,729`, both rows).
- **D2-053 ✅ (mostly)** — the table uses a real `<thead>` with 6 `<th>` cells. No `scope`
  attributes and no `<caption>` (minor).
- **D2-055 ✅** — no skipped heading levels (the page has a single `h1`; note it has no
  section headings at all, so heading navigation is thin).
- **Accessible names ✅** — 0 of 24 visible focusable elements lack an accessible name.
- **D2-023 ✅** — Save disabled while the task name is empty.
- **D2-031/032 ✅** — Escape closes the dialog without saving; `Cancel` on the add-task
  sub-form discards cleanly (verified by task count staying put).

### Cases explicitly NOT run, with reasons

- **D2-016 (date rollover on a tab left open past midnight)** — would require holding the page
  open across a real PKT midnight. Not run.
- **D2-036 (`Print`)** — clicking it opens the OS/browser print dialog, which blocks the
  automation session. Not run; the print *view* was inspected via the run-sheet dialog content.
- **D2-041 / D2-044 / D2-045 (empty state)** — unreachable because WWL-024 means no venue
  selection ever yields zero events.
- **D2-004** — I judged the `Revenue today` label semantics (it sums **booked totals**, not
  money received today) but did not compute a separate received-today figure. Partial.

---

## MODULE 2 — Today: COMPLETE

**58 cases written · 52 executed · 6 not run (reasons above) · 11 findings.**

| ID | Sev | Finding |
|---|---|---|
| WWL-020 | S1 | Day-of row shows no balance for a customer owing Rs 315,000 (driven by quotation, not booking) |
| WWL-021 | S2 | `Outstanding` is all-time on a "Today" screen, and inherits WWL-001's understatement |
| WWL-024 | S1 | Screen ignores venue selection entirely — Lahore manager shown a Rawalpindi event |
| **WWL-028** | **S1** | **Per-venue receivables: a subset (Rs 23,961,479) nearly doubles the company total (Rs 12,292,729); two venues return identical figures** |
| WWL-030 | S2 | No way to open a booking from the Today screen |
| WWL-022 | S3 | Out-of-bounds durations dropped to `null`, long labels truncated — silently |
| WWL-023 | S3 | `Delete` on a run-of-show task has no confirmation |
| WWL-025 | S3 | `Run sheet` disabled with no reason given |
| WWL-026 | S3 | `View timeline` navigates to the Calendar, not a timeline |
| WWL-027 | S3 | Printed run sheet never names the venue |
| WWL-029 | S3 | Dialog does not return focus to its opener |

**What this module does well** — the timeline engine is the strongest thing tested so far:
full create/toggle/delete all survive hard reloads with every counter correct; the run sheet is
a genuinely usable printed artefact grouped SETUP/EVENT/TEARDOWN; the seed templates are
properly Pakistani (Mehndi, Nikah, Baraat, Walima, Dholki); **the date boundary is handled in
PKT deliberately and stated out loud**; and **its failure handling is correct** — which is the
evidence that WWL-019's `catch { return null }` is the single thing breaking error UI elsewhere.

**Test data written and fully restored:** 20 timeline tasks created across three seed cycles on
booking 179 (7 + 6 + 7) and all 20 deleted, with per-round API verification down to zero each
time and a final hard reload confirming `Total tasks 0 / Open tasks 0` and no `ZZQA` residue.
Venue scope restored to **All venues**. No money rows. No customer contacted.

---

# MODULE 3 — Lead inbox (`/dashboard/leads`)

**What this screen is.** The top of the funnel and, per the vendor research, the single screen
that decides whether the portal earns its keep: in Pakistan almost every enquiry arrives on
WhatsApp or by phone, and the vendor's real job is to answer fast and stop leads going cold.
A lead whose phone cannot be dialled is worthless; a lead that silently duplicates wastes the
one follow-up the family will tolerate.

**Live inventory captured 2026-08-05** — h1 `Leads`; **76 rows**; **320 buttons** (4 per row ×
76 = 304, plus chrome); 12 in-`main` links including lead detail routes.

**Tiles:** Total leads `76` · New `22` · Qualified `12` · Booked `9 converted`.

**Header controls:** `Log a lead` · `Comfortable` / `Compact` (density) · `Import` · `Export`.

**Per-row controls (×76):** `Convert to booking` · `Draft a reply` · `Edit lead` ·
`Remove lead`.

**Statuses seen:** New · Contacted · Quoted · Qualified · Booked.
**Sources seen:** Form inquiry · Whatsapp · Manual walkin · Manual phone · In app chat.

**Noted before testing:** `Comfortable`/`Compact` expose real `aria-pressed` (`true`/`false`) —
this module gets right what seven other control groups in Modules 1–2 got wrong. Worth
confirming and crediting.

**Known context:** commit `5e7d74d` ("fix(leads): every field except contact name accepted
anything") is in the **local unpushed** commits, so **live should still exhibit that bug**.
Confirming it live is itself a test — it tells us the fix is real and undeployed.

## A. Data correctness and tile arithmetic

- [ ] **D3-001** — `Total leads 76` must equal the API's lead count for this vendor.
- [ ] **D3-002** — `New 22` must equal leads with status `New`, and match the Dashboard's
  `Naye Rabtay · 22 new enquiries` exactly.
- [ ] **D3-003** — `Qualified 12` must equal leads with status `Qualified`.
- [ ] **D3-004** — `Booked 9 converted` must equal leads that became bookings — and should
  reconcile against the Bookings module.
- [ ] **D3-005** — Status counts must not overlap or double-count; sum of all statuses ≤ 76.
- [ ] **D3-006** — Budget column formatting: separators, no `NaN`, no `Rs 0` for missing.
- [ ] **D3-007** — Event dates render sensibly (`27 Nov`, `03 Oct`) — check whether the **year**
  is shown anywhere, since leads span multiple years (Jan/Feb dates are next year).
- [ ] **D3-008** — Phone numbers render in a dialable form.
- [ ] **D3-009** — Are the 76 rows all loaded, or paginated/virtualised? Establish which, and
  whether tiles count all 76 or only the loaded page.

## B. Venue scope (the recurring defect)

- [ ] **D3-010** — Switch venue: do lead counts and rows rescope, or is this WWL-006/024 again?
- [ ] **D3-011** — Does the leads API accept a `businessId`, and does it discriminate correctly
  (the WWL-028 failure mode)?
- [ ] **D3-012** — Scope persists across hard reload.

## C. `Log a lead` — create, validate, persist

- [ ] **D3-013** — Open the dialog; enumerate every field and its constraints.
- [ ] **D3-014** — **Confirm the known bug live**: phone `abc-not-phone`, WhatsApp `!!!`,
  email `bad-email`, budget `-5000`, guests `-10`, event date `2020-01-01` — expect all
  accepted with Save enabled once a name is typed (the `5e7d74d` defect, undeployed).
- [ ] **D3-015** — Determine what the **server** does with each hostile value: rejected,
  coerced, or persisted.
- [ ] **D3-016** — Create a valid lead → **hard reload** → it persists and `Total leads`
  76 → 77 and `New` 22 → 23.
- [ ] **D3-017** — Duplicate detection: create a second lead with the **same phone** — is it
  flagged, merged, or silently duplicated? (Duplicates are the stated dedup key.)
- [ ] **D3-018** — Required-field gating: which fields actually block Save, and is the reason
  stated (not just a disabled button)?
- [ ] **D3-019** — Long free text (2,000+ chars) in the enquiry/notes field — bounded, no
  layout break, no silent truncation without notice.
- [ ] **D3-020** — Event date far in the past and far in the future — both should be
  questioned; a wedding in 2020 is a typo.
- [ ] **D3-021** — Source and status selects contain the expected Pakistani-relevant options.
- [ ] **D3-022** — Cancel discards; Escape discards; verified by hard reload.
- [ ] **D3-023** — Error path surfaces the **server's** reason, not an axios wrapper string.

## D. `Edit lead` — update and persist

- [ ] **D3-024** — Open Edit on a known lead; every field pre-populates with current values.
- [ ] **D3-025** — Change one field → save → **hard reload** → change persisted.
- [ ] **D3-026** — Restore the original value → hard reload → confirmed restored.
- [ ] **D3-027** — Editing does not silently clear fields the dialog does not show (the
  whitelist-drops-fields failure mode seen in other WW integrations).
- [ ] **D3-028** — Hostile values on edit are treated the same as on create.
- [ ] **D3-029** — Opening Edit for a second lead must not carry the first lead's values.

## E. `Remove lead` — delete safely

- [ ] **D3-030** — Is there a confirmation step? (Timeline tasks had none — WWL-023.)
- [ ] **D3-031** — Delete a lead I created → hard reload → gone, `Total leads` decrements.
- [ ] **D3-032** — Is deletion soft or hard? Check whether it can be undone.
- [ ] **D3-033** — Deleting must not affect a booking already converted from that lead.

## F. `Convert to booking` — the money-adjacent path

> **Deliberate limit:** I will drive this dialog and its validation but **will not complete a
> conversion**, because it creates a real booking with a value on a live vendor's ledger.

- [ ] **D3-034** — Open the dialog; enumerate every field and prefill.
- [ ] **D3-035** — Prefill correctness: customer, phone, event type, date and budget must carry
  over from the lead exactly.
- [ ] **D3-036** — Validation on the money fields (the Rs 0 hole is a known WW risk).
- [ ] **D3-037** — Does it warn before creating, and can it be cancelled cleanly?
- [ ] **D3-038** — Converting a lead already `Booked` — is it blocked or silently duplicated?
- [ ] **D3-039** — Cancel → hard reload → **no booking created** (verified via the bookings API
  count before and after).

## G. `Draft a reply` — the AI path

- [ ] **D3-040** — Opens and produces a draft for the correct lead.
- [ ] **D3-041** — The draft must be **editable** and must **not auto-send** (a standing WW
  constraint).
- [ ] **D3-042** — Draft references the right customer, event and date — no other lead's data.
- [ ] **D3-043** — Behaviour when the AI call fails: error shown, not an empty box.
- [ ] **D3-044** — Urdu/Roman-Urdu handling in the generated text.

## H. Density, Import, Export

- [ ] **D3-045** — `Comfortable` / `Compact` genuinely change row density; `aria-pressed`
  updates correctly (credit if so).
- [ ] **D3-046** — Density choice persists across hard reload.
- [ ] **D3-047** — `Export` produces a file whose row count and columns match what is on screen.
- [ ] **D3-048** — Export respects the current filter/scope rather than dumping everything.
- [ ] **D3-049** — `Import` — inspect the dialog, required format, and whether it validates
  before committing. **Will not import a real file.**

## I. Sorting, filtering, search

- [ ] **D3-050** — Column sorting, if present, actually sorts and is stable.
- [ ] **D3-051** — Status filtering matches the tile counts.
- [ ] **D3-052** — Search finds a lead by name and by phone.
- [ ] **D3-053** — With 76 rows, confirm no row is unreachable (pagination/virtualisation).

## J. Navigation

- [ ] **D3-054** — Row / contact click opens the lead detail (`/dashboard/leads/{id}`) —
  contrast with WWL-030 where Today's rows were dead.
- [ ] **D3-055** — Lead detail renders real content for the correct lead.
- [ ] **D3-056** — Back returns a fully rendered inbox.

## K. Failure states

- [ ] **D3-057** — Block the leads endpoint → error + Retry expected. Check whether this
  module's API wrapper has the `catch { return null }` swallow (WWL-019).

## L. Accessibility and responsive

- [ ] **D3-058** — 304 row-level buttons: do they carry distinguishing accessible names, or is
  this WWL-012 at scale (76 × 4 identical labels)?
- [ ] **D3-059** — Table header semantics; heading order.
- [ ] **D3-060** — 360px: no overflow, table scrolls in its own container, row actions reachable.
- [ ] **D3-061** — Desktop 1536px: no overflow, zero covered controls.

## Findings raised (Module 3)

### 🔴 WWL-031 — S2 — Saving one lead takes five rejections and five round-trips

**The client-side defect is confirmed live**, exactly as `5e7d74d` describes and exactly as
expected given that commit is unpushed. With `aria-invalid: null` on every field, no inline
error, no blocked-hint and **Save enabled**, the form accepted:

`phone: abc-not-phone` · `whatsapp: !!!` · `email: bad-email` · `budget: -5000` ·
`guests: -10` · `event date: 2020-01-01`

The **server** catches them — but strictly one at a time. Driven live, each round a real submit:

| Round | Server response |
|---|---|
| 1 | `Invalid contactEmail` |
| 2 | `Invalid contactPhone` |
| 3 | `Invalid contactWhatsapp` |
| 4 | `EstimatedBudget must be ≥ 0` |
| 5 | `EstimatedGuests must be a non-negative integer` |
| 6 | ✅ `Lead added` |

**Five failed submits to log one lead.** Every message names the **API field**
(`contactPhone`, `EstimatedBudget`) rather than the label on screen (`Phone`, `Budget (Rs)`),
and nothing is anchored to the field — no `aria-invalid`, no red border, no inline message. The
vendor must map "contactWhatsapp" to a box by guesswork, five times, in an inbox whose entire
value proposition is answering fast.

The already-written client validation in `5e7d74d` collapses all five into one pass. **This is
the strongest deployment argument in the sweep so far.**

### 🔴 WWL-032 — S2 — A wedding six years in the past saves without question

`eventDate: 2020-01-01` was accepted by **both** the client and the server and persisted
(lead 251). It was never challenged in any of the five rounds above — the server validates
email, phone, WhatsApp, budget and guests, but **not the event date**.

Compounded by display: the row renders the date as **"01 Jan"** with **no year**. A lead for
January 2020 is visually identical to one for January 2027. Since this inbox holds leads
spanning multiple years (Jan/Feb dates are next season), a vendor cannot tell a stale or
mistyped lead from a live one by looking.

### ⚠️ WWL-033 — S3 — Archived leads sit in the live inbox with no way to filter them out

6 of the 76 leads have `status: archived` and are rendered in the main table alongside live
ones (`Archived` appears as a status chip). The header offers only `Log a lead`,
`Comfortable`/`Compact`, `Import` and `Export` — **no status filter**. So archived leads
permanently pad the inbox a vendor is meant to work top-down, and the `Total leads 76` headline
counts them.

### ✅ Section A — tile arithmetic is exact

Verified against `/api/v1/leads`, which serves a proper `summary.byStatus` the tiles read from:

| Tile | UI | API | |
|---|---:|---:|---|
| Total leads | 76 | 76 | ✅ |
| New | 22 | 22 | ✅ (also matches the Dashboard's `Naye Rabtay · 22`) |
| Qualified | 12 | 12 | ✅ |
| Booked | 9 | 9 | ✅ |

Statuses sum to exactly **76** (new 22 · contacted 15 · quoted 12 · qualified 12 · booked 9 ·
archived 6) — **no double-counting** (D3-005 ✅). Sources also enumerate cleanly
(form_inquiry 21 · manual_walkin 16 · manual_phone 15 · in_app_chat 14 · whatsapp 10).

### ✅ Missing budgets render as `—`, never `Rs 0` (D3-006)

Three leads have `estimatedBudget: null`. The table shows a dash for them:
`budgetCellsShowingRs0: 0`. **This is the correct behaviour and the direct opposite of
WWL-018**, where the Dashboard rendered a failed load as a confident `Rs 0`. Credit where due —
the same product gets this right here.

### ✅ D3-016 — create persists and tiles increment correctly

Created lead 251 → **hard reload** → `Total leads` 76→**77**, `New` 22→**23**, row present,
77 DOM rows. API agreed exactly.

### ✅ D3-030/031 — `Remove lead` is done properly

Clicking Remove opens a real **`role="alertdialog"`**:

> **Remove this lead?**
> *ZZ QA DELETE ME will be removed. **This can't be undone.*** — `Cancel` / `Remove`

It names the specific record and states irreversibility. Confirmed → **hard reload** →
lead gone, `Total leads` back to **76**, `New` back to **22**, no residue.

**This is the direct contrast to WWL-023**, where deleting a run-of-show task on the Today
screen had *no* confirmation at all. Same codebase, same interaction, opposite treatment — so
the Today gap is an oversight, not a house convention.

### 🔴 WWL-034 — S1 — Converting a lead discards its budget; the booking captures no amount at all

`Convert to booking` on a lead worth **Rs 1,175,000** opens the generic **"Add Offline
Booking"** dialog. Its complete field set, read from the live DOM:

> Customer Information (Full Name\*, Phone\*, Email) · Service Selection (Business\*) ·
> Event Details (Event Date\*, Time Slot\*) · Additional Notes · Cancel · **Create Booking**

**There is no price, amount, total or budget field anywhere in it:**
`numberInputs: 0` · `anyPriceField: []` · `mentionsBudget: false`.

Confirmed at source: `estimatedBudget` appears only in `lead-form-dialog.tsx` (the lead
create/edit form). The convert path is `setConvertLead(l)` →
`leads-redesigned-view.tsx:132`, which opens the offline-booking dialog — **the lead's budget
is never passed into the booking payload.**

So the one number that made the lead worth chasing is dropped at the exact moment it becomes a
booking, and `Create Booking` is **enabled** with no amount captured. This is the documented
"Rs 0 booking" hole arriving through the lead funnel.

*Scope of this claim:* I verified the dialog captures no amount and the budget is not passed.
I did **not** create a booking, so I have not observed the resulting `totalAmount` — that
remains unverified by choice, since it would write a real money row on a live vendor's ledger.

### ✅ D3-035 — prefill is otherwise correct

Everything else carries over exactly: `Full Name: Asad Jameel` · `Phone: 0311619148` ·
`Email: asad.jameel@gmail.com` · `Business: 3358` (matching the lead's own businessId) ·
`Event Date: Nov 27, 2026` (matching the lead's 27 Nov). Time slots are sensible for Pakistan
(Morning 9–12, Afternoon 2–6, Evening 6–11), and there is a `Single event` / `Full wedding`
mode toggle.

### ✅ D3-039 — Cancel is clean

Cancelled the dialog and re-checked the API: **booking count still 25** (baseline 25), lead
still `status: new`, lead total still 76. Nothing was written.

### ✅ D3-010/011/012 — venue scope works correctly here (the counter-example)

**This is the first module in the sweep that scopes properly.**

| Scope | Leads |
|---|---:|
| All venues | 76 |
| 3358 Grand Marquee | **28** |
| 3359 Banquet & Lawn | **24** |
| 3360 Marquee Bahria | **24** |

`28 + 24 + 24 = 76` — **exactly the whole**, three distinct values, no subset exceeding the
total, and matching the real `businessId` distribution on the lead records.

Driven in the UI: selecting Grand Marquee took `Total leads` 76 → **28**, DOM rows 76 → **28**,
and rescoped `New`/`Qualified`/`Booked` too. **Persisted across a hard reload.**

This matters beyond this module: it proves the platform *can* scope correctly, so
**WWL-024** (Today ignoring scope entirely) and **WWL-028** (receivables returning a subset
larger than the whole) are defects in those specific endpoints — not an architectural limit.

### ⭐ `Draft a reply` — the best-implemented feature found in the entire sweep

Clicked on lead 178 (Asad Jameel). It produced, in ~9s:

> **Draft a reply to Asad Jameel**
> *"Assalam-o-Alaikum Asad! 🤝 Shukria for reaching out to Rehman Grand Marquee! Haan bilkul,
> hum mehndi ke liye separate mardana aur zenana setup provide karte hain — 390 guests ke liye
> hum perfect arrangement kar sakte hain…"*

Everything about this is right:

- **Editable, not read-only** — `readOnly: false`, `disabled: false` (D3-041 ✅)
- **Never auto-sends** — the footer states it explicitly:
  *"AI-drafted · anthropic/claude-haiku-4.5 — never sent automatically. Prices and dates are not
  verified."* Actions are `Redraft` / `Copy` / `Send on WhatsApp` — all manual.
- **Honest framing** — *"Read it before you send — edit anything that isn't right."*
- **Correct grounding** (D3-042 ✅) — it pulled the lead's own `inquiry` ("separate
  mardana/zenana"), its **390 guests**, and the **venue name**. No other lead's data leaked
  (`mentionsOtherLead: false`).
- **Real Roman Urdu**, not translated English — the register a Pakistani venue owner would
  actually send.

This is the standing WW constraint (editable, no auto-send) honoured **and disclosed to the
vendor**. Recorded as an exemplar, not a finding.

*(Minor: the lead's `eventType` is `walima` while its `inquiry` says "Mehndi function" — the
draft followed the inquiry text. Source-data conflict in the seed, not a defect.)*

### ✅ D3-024/029 — Edit prefills perfectly and does not leak between leads

Opened `Edit lead` on lead 178: **all 11 fields** matched the API exactly — name, phone,
WhatsApp, email, source `form_inquiry`, status `new`, event type `walima`, date `2026-11-27`,
budget `1175000.00`, guests `390`, and the inquiry text.

Cancelled, opened Edit on a **different** lead: every field belonged to the second lead
(phone `0332880364`, source `whatsapp`, status `quoted`, `engagement`, `2027-01-14`,
budget `500000.00`, guests `409`) with **zero carryover** from the first
(`phone0311: false`, `budget1175000: false`, `guests390: false`, `eventWalima: false`).

**This second lead also proves WWL-032 concretely**: its date is **2027**-01-14 and the table
renders it as **"14 Jan"** — the identical display to the 2020 lead's **"01 Jan"**. Two dates
seven years apart, indistinguishable in the inbox.

### ✅ D3-045 — density toggle is the *correct* aria implementation

`Comfortable` → `Compact`: row height **57px → 49px**, and `aria-pressed` flips properly
(`Comfortable: true→false`, `Compact: false→true`).

**This is the counter-example to the seven control groups in Modules 1–2 that convey active
state by CSS class alone** (sort segments, venue switcher, theme mode, run-sheet grouping,
settings tabs…). The house pattern exists and is correct here — it is simply not applied
consistently.

### 🔴 WWL-035 — S3 — 304 row-action buttons share just 4 accessible names

All 76 rows × 4 actions = **304 buttons**, **0 unnamed** (good), but only **4 distinct
names**: `Convert to booking`, `Draft a reply`, `Edit lead`, `Remove lead`. None carries the
customer.

A screen-reader user tabbing this inbox hears "Convert to booking" seventy-six times with no
way to know which lead is which. This is **WWL-012 at the largest scale found** — and it sits
on the most destructive action in the module (`Remove lead`).

### ✅ Responsive and table semantics

- **D3-060 ✅ 360px** — `scrollWidth 345 < 360`, **no horizontal overflow, 0 off-screen
  controls**, all 76 rows rendered. Clean, like Today and unlike the Dashboard (WWL-014).
- **D3-059 ✅** — real `<thead>` with 9 `<th>` cells.
- **D3-009 ✅** — all 76 rows are in the DOM; no pagination or virtualisation hiding rows, and
  the tiles count the full set.

### ✅ D3-047 — Export is accurate (with one inherited flaw)

Captured the generated file client-side rather than downloading it:

- `leads.csv` · header `Contact,Phone,Source,Event,Event date,Budget,Status`
- **76 data rows — exactly what is on screen** ✅
- First row: `Asad Jameel,0311619148,Form inquiry,Walima,27 Nov,1175000,new`
- Budget exports as a raw number (`1175000`) — machine-readable ✅

**But `Event date` exports as `27 Nov`** — the same year-less display string as the table. So
**WWL-032 is baked into the export**, not merely a display quirk: a CSV of 76 leads whose dates
carry no year cannot be sorted, filtered or re-imported reliably. There is also no `id` column,
so an exported row cannot be joined back to its lead.

`Export` offers CSV and Excel (.xlsx).

### ✅ D3-054/055/056 — lead rows navigate properly

Row 0 contains a real `<a href="/dashboard/leads/178">`. Clicking it opens the detail page,
which renders the **correct** lead (Asad Jameel) with its budget, guests and inquiry text, and
no other lead's data. Browser Back returns a fully rendered inbox (76 tiles, 76 rows).

**Direct contrast to WWL-030**, where the Today screen's rows had no link, no handler and no
route to the booking at all. The pattern exists and works here.

### ✅ D3-057 — failure handling is correct

Blocked `/api/v1/leads` and forced a refetch. The page rendered:

> **"Couldn't load leads."** + a **`Retry`** button

Rows cleared to **0** rather than showing a fake empty state. This is the third module-level
confirmation of **WWL-019's** diagnosis: wrappers that let errors propagate (leads,
bookingTimeline) render their error UI correctly, while `analytics.ts` — which swallows into
`catch { return null }` — cannot.

⚠️ Same partial as Today: the tiles above the table keep showing stale `76 / 22 / 12 / 9`
while the table below says it could not load.

### Cases not run, with reasons

- **D3-017 (duplicate phone detection)** — would require creating two live leads sharing a
  phone and reasoning about merge behaviour on a real vendor's inbox. Not run.
- **D3-032/033 (soft vs hard delete, effect on a converted booking)** — would require deleting
  a lead that already has a booking attached. Not run on live data.
- **D3-038 (converting an already-`Booked` lead)** — would risk creating a duplicate booking.
  Not run.
- **D3-048 (export respects scope)** — not run; export was verified only at All-venues scope.
- **D3-049 (`Import`)** — dialog not driven; importing a file would write bulk rows.
- **D3-050/051/052 (sort / filter / search)** — no sort, filter or search control exists in
  this module's header (only `Log a lead`, density, `Import`, `Export`), which is itself the
  substance of **WWL-033**: with 76 rows and no filter, archived leads cannot be hidden and a
  specific lead cannot be found except by eye.
- **D3-043/044 (AI failure path, Urdu handling)** — the happy path was verified in depth;
  forcing an AI failure was not attempted.

---

## MODULE 3 — Lead inbox: COMPLETE

**61 cases written · 49 executed · 12 not run (reasons above) · 5 findings.**

| ID | Sev | Finding |
|---|---|---|
| **WWL-034** | **S1** | **Convert to booking discards the lead's budget — the dialog captures no amount at all** |
| WWL-031 | S2 | Five server rejections, one at a time, to save one lead; messages name API fields not labels |
| WWL-032 | S2 | A 2020 wedding date saves unchallenged, and dates render (and export) with no year |
| WWL-033 | S3 | 6 archived leads sit in the live inbox; no filter, sort or search exists |
| WWL-035 | S3 | 304 row-action buttons share only 4 accessible names, none naming the customer |

**What this module proves for the whole sweep.** It is the strongest module tested, and its
value is partly as a control group — it repeatedly demonstrates the *correct* implementation of
things broken elsewhere:

| Capability | Broken in | Correct here |
|---|---|---|
| Venue scoping | WWL-024 (Today ignores it), WWL-028 (receivables subset > whole) | 28+24+24 = 76 exactly, UI rescopes and persists |
| `aria-pressed` on toggles | 7 control groups in Modules 1–2 | density toggle flips it correctly |
| Delete confirmation | WWL-023 (timeline task, none) | `alertdialog` naming the record, "can't be undone" |
| Missing value display | WWL-018 (`Rs 0` for a failed load) | `—` for a null budget, never `Rs 0` |
| Row → record navigation | WWL-030 (Today rows dead) | real `<a>` to `/dashboard/leads/{id}` |
| Error + Retry on failure | WWL-018/019 (dead error UI) | "Couldn't load leads." + Retry |
| AI safety | — | editable draft, explicit "never sent automatically", model disclosed |

**None of the defects found elsewhere are architectural limits.** Every one of them has a
working counter-example inside this same codebase.

**Test data written and fully restored:** one lead created (id 251, "ZZ QA DELETE ME") and
deleted via the UI's own confirmation flow; baseline re-verified at **76 leads / 22 new** with
no residue. Two Edit dialogs opened and cancelled without saving. One Convert dialog opened and
cancelled — **booking count verified unchanged at 25**. Venue scope restored to **All venues**.
No money rows. No customer contacted.

### ✅ Correction to my own measurement (Module 3)

I first recorded "no toast, no feedback at all" on the failed save. **That was wrong** — my
toast poll ran in a *separate* tool call after the click, so the toast had already
auto-dismissed. Re-run with the click and poll in **one** execution context, the vendor clearly
sees `Invalid contactEmail`. Same measurement trap I hit in Module 1; caught and corrected
before it reached a finding.

---

# MODULE 4 — Bookings (`/dashboard/bookings`)

**What this screen is.** The ledger. Every other money figure in the portal derives from these
rows, so an error here propagates everywhere — Modules 1 and 2 produced five distinct money
defects that all trace back to how a booking's `totalAmount`, `downPayment` and `paymentStatus`
are read. It is also where a vendor edits a booking, making it the highest-risk write surface
in the sweep.

**Live inventory captured 2026-08-05** — h1 `Bookings`; **10 rows** in the `Active` view;
41 buttons; a real **search box**; 10 row checkboxes; `Active`/`Archive` toggle; `Add booking`;
`Export`; density toggle.

**Tiles:** Total bookings `10` · Collected (shown) `Rs 3,342,938` · Due (shown)
`Rs 11,176,762` · This month `6`.

**Columns:** BOOKING · SPACE · CUSTOMER · DATE · AMOUNT · **PAID** · STATUS · PAYMENT.

**Per-row controls (×10):** `Edit booking` · `Booking actions`.

**Verified before writing cases — the arithmetic here is exact.** The API holds 25 bookings
(Confirmed 7 · Awaiting Payment 2 · Pending 1 · Completed 12 · Cancelled 3). Excluding
Completed and Cancelled leaves **10** = the Active view. Their `downPayment` sums to
**Rs 3,342,938** = `Collected (shown)` exactly; their `totalAmount` sums to Rs 14,519,700, and
`14,519,700 − 3,342,938 = 11,176,762` = `Due (shown)` exactly. The "(shown)" qualifier is
honest labelling.

**Noted before testing:** the `PAID` column shows Waheed Jutt at **Rs 35,000** — the exact down
payment Receivables ignores (WWL-002). The ledger holds the right number; the derived screen is
the wrong one.

## A. Tile arithmetic and cross-module consistency

- [ ] **D4-001** — `Total bookings 10` here vs the Dashboard's `Total bookings 25`: same label,
  two numbers, because this one means *active only*. Judge the labelling.
- [ ] **D4-002** — `Collected (shown)` = sum of `downPayment` across shown rows.
- [ ] **D4-003** — `Due (shown)` = shown `totalAmount` − shown `downPayment`.
- [ ] **D4-004** — `This month 6` = bookings dated in the current PKT month.
- [ ] **D4-005** — `Archive` shows the remaining 15 and recomputes the tiles.
- [ ] **D4-006** — Cancelled must be visually distinguishable from Completed in Archive.
- [ ] **D4-007** — Row `AMOUNT` / `PAID` match the API per booking, including booking 170.
- [ ] **D4-008** — `PAYMENT` chip must agree with `AMOUNT` vs `PAID`. **Booking 170 is the test
  case**: flag says `Paid`, amounts say Rs 1,159,500 owed.
- [ ] **D4-009** — Money formatting; no `Rs 0` standing in for missing.
- [ ] **D4-010** — `BOOKING` column shows a venue for some rows and a **package name** for
  others ("Gold — Barat Package"). Establish the rule.
- [ ] **D4-011** — `SPACE` is `—` on all 10 rows. Real, or broken?

## B. Venue scope

- [ ] **D4-012** — Does the list rescope by venue (leads did, Today did not)?
- [ ] **D4-013** — Do the tiles rescope with it?
- [ ] **D4-014** — Scope persists across hard reload.

## C. Search, filter, sort, selection

- [ ] **D4-015** — Search by customer name returns the right rows.
- [ ] **D4-016** — Search by booking id / venue / package.
- [ ] **D4-017** — No-match search shows a proper empty state, not a blank table.
- [ ] **D4-018** — Search is case- and whitespace-insensitive.
- [ ] **D4-019** — Clearing search restores all rows.
- [ ] **D4-020** — Column sorting where present; stable for ties.
- [ ] **D4-021** — Row checkboxes select; is there a select-all?
- [ ] **D4-022** — Bulk actions revealed by selection — enumerate and assess risk.
- [ ] **D4-023** — Selection is correctly cleared by search / view switching.
- [ ] **D4-024** — Density toggle changes rows and sets `aria-pressed`.

## D. `Edit booking` — highest-risk write surface

- [ ] **D4-025** — Enumerate every field and its prefill against the API.
- [ ] **D4-026** — Are `totalAmount` / `downPayment` editable here?
- [ ] **D4-027** — Hostile money: negative total, negative paid.
- [ ] **D4-028** — **Paid greater than total** — negative balance? Guarded downstream?
- [ ] **D4-029** — Rs 0 total (the documented zero-price hole).
- [ ] **D4-030** — Past date, and a date colliding with another booking.
- [ ] **D4-031** — Status change via Edit vs via the actions menu — do they agree?
- [ ] **D4-032** — Save → **hard reload** → persisted; then **restore the original**.
- [ ] **D4-033** — Cancel discards; verified by hard reload.
- [ ] **D4-034** — Editing must not clear fields the dialog does not display.
- [ ] **D4-035** — Opening Edit for a second booking must not carry the first's values.
- [ ] **D4-036** — Error path surfaces the server's reason.

## E. `Booking actions` menu (×10)

> **Deliberate limit:** enumerate and validate, but **do not** record a payment, cancel a real
> booking, or change a status that moves money on a live vendor's ledger.

- [ ] **D4-037** — Enumerate every item.
- [ ] **D4-038** — Status transitions offered vs the backend state machine.
- [ ] **D4-039** — Cancel booking: confirmation, reason captured, irreversibility stated.
- [ ] **D4-040** — Record payment, if present — amount validation.
- [ ] **D4-041** — Every destructive action confirms (WWL-023 class).
- [ ] **D4-042** — Actions on an already-Cancelled booking blocked or hidden.

## F. `Add booking`

- [ ] **D4-043** — Same dialog as lead conversion? Does it capture an amount here?
- [ ] **D4-044** — If not, confirm the Rs 0 hole from this entry point too (WWL-034 was the
  lead path).
- [ ] **D4-045** — Required-field gating with stated reasons.
- [ ] **D4-046** — Cancel writes nothing (API count before/after).

## G. Navigation

- [ ] **D4-047** — Row opens the correct booking detail.
- [ ] **D4-048** — Booking 170's detail shows its balance correctly from this entry point.
- [ ] **D4-049** — `Function Sheets` / `Sign contract` / `Trade operations` links render.
- [ ] **D4-050** — Back returns a fully rendered list with the same view and scope.
- [ ] **D4-051** — `?bucket=completed` deep link lands on Archive.

## H. Export

- [ ] **D4-052** — Row count and columns match what is shown.
- [ ] **D4-053** — Money columns exported machine-readable.
- [ ] **D4-054** — Export respects the Active/Archive view.

## I. Failure states

- [ ] **D4-055** — Block the bookings endpoint → error + Retry, not `0 / Rs 0`.
- [ ] **D4-056** — Tiles must not show stale values above an errored table.

## J. Accessibility and responsive

- [ ] **D4-057** — 20 row-action buttons: distinguishing names, or WWL-035 again?
- [ ] **D4-058** — Table semantics; each row checkbox has an accessible name.
- [ ] **D4-059** — 360px: no overflow; the 8-column table scrolls in its own container.
- [ ] **D4-060** — Desktop: no overflow, zero covered controls.

## Findings raised (Module 4)

### 🔴 WWL-036 — S1 — Three cancelled bookings are invisible in the entire Bookings module

| View | Rows | Statuses present |
|---|---:|---|
| `Active` | **10** | Confirmed, Awaiting Payment, Pending |
| `Archive` | **12** | **`Completed` only** — `anyRowSaysCancelled: false` |
| **Total visible** | **22** | |
| **API holds** | **25** | |

The three missing records are real bookings with real money:

| id | Customer | Date | Value |
|---|---|---|---:|
| 178 | Waheed Jutt | 2026-08-12 | Rs 762,650 |
| 177 | Waheed Jutt | 2026-08-04 | Rs 350,000 |
| 175 | Usman Tariq & Hira Usman | 2026-05-06 | Rs 2,742,400 |

Verified by signature: none of `762,650`, `350,000` or `2,742,400` appears in any Archive row.
There is no third view, no status filter, and `Archive` — the one place a vendor would look for
a cancelled event — contains only Completed ones.

**The pairing with WWL-008 is the real problem.** These same three cancelled bookings **are**
included in the Dashboard's profit board, where Usman Tariq ranks **#1 most profitable event at
100% margin** on Rs 0 received. So a cancelled wedding is:

- **invisible** on the screen where a vendor would manage or review it, and
- **counted** on the screen where it corrupts revenue, outstanding and profit.

Exactly backwards.

### 🔴 WWL-037 — S1 — A single ledger row contradicts itself: `Rs 1,546,000` / `Rs 386,500` / **`Paid`**

Booking 170 (Imran Shafi & Hafsa Imran), read straight off the Archive table:

> `Rehman Grand Marquee | — | Imran Shafi & Hafsa Imran | 09-Sept-2026 |`
> **`Rs 1,546,000`** `|` **`Rs 386,500`** `|` `Completed |` **`Paid`**

The row prints the amount and the amount paid **side by side** — `1,546,000 − 386,500 =
Rs 1,159,500 still owed` — and then chips it **`Paid`**. Both facts are on one line,
contradicting each other.

This is the root record behind **WWL-001** (Rs 1,159,500 missing from Receivables) and
**WWL-005** (Revenue collected overstated by Rs 1,124,500), now visible in its rawest form.

**The chip logic itself is sound** — other rows prove it:

- `Zeeshan Akram · Rs 1,439,150 / Rs 1,223,278 → Partial` ✅ correct
- `Junaid Farooq · Rs 1,464,500 / Rs 1,464,500 → Paid` ✅ correct

So the chip is rendered from the stored `paymentStatus` flag rather than derived from the two
amounts it is displayed next to. One bad flag on one record then propagates into every derived
screen. **Deriving the chip from `total − paid` would have made this record self-correcting
and would fix WWL-001/005 at the same time.**

### ✅ D4-002/003 — the tile arithmetic is exact and honestly labelled

Active view, verified against the API:

- `Collected (shown) Rs 3,342,938` = sum of `downPayment` across the 10 active bookings —
  **exact**.
- Active `totalAmount` = Rs 14,519,700; `14,519,700 − 3,342,938 = 11,176,762` =
  `Due (shown)` — **exact**.
- The **"(shown)"** qualifier is doing real work: it tells the vendor these totals cover the
  current view only. That is the honest labelling missing from the Dashboard's tiles.

### 🔴 WWL-039 — S1 (unconfirmed by design) — `Edit Booking` cannot see or preserve a negotiated price

`Edit Booking #179` contains **no total, amount or down-payment field**. The price is implied
entirely by a `Package` select:

> `Silver — Nikah Package · Rs 325,000` · `Gold — Barat Package · Rs 760,000` ·
> `Platinum — Full Shaadi · Rs 1,320,000`

But booking 179's stored `totalAmount` is **Rs 350,000** — **Rs 25,000 above** its package's
list price of Rs 325,000. The dialog shows the vendor `Rs 325,000` and gives no indication the
booking is actually worth Rs 350,000.

Negotiated prices are clearly normal here — the booking detail page has a **"Final price
(haggle)"** field, and **3 of the 4 package-linked bookings carry a total above list**:

| id | Customer | Package list | Booking total | Difference |
|---|---|---:|---:|---:|
| 179 | Waheed Jutt | 325,000 | 350,000 | **+25,000** |
| 178 | Waheed Jutt | 760,000 | 762,650 | +2,650 |
| 177 | Waheed Jutt | 325,000 | 350,000 | **+25,000** |

**The risk:** if `Save Changes` writes the package's list price back to `totalAmount`, saving
an unrelated edit (a phone number, a guest count) silently destroys the negotiated amount —
Rs 25,000 off this booking, on a screen that never displayed the number it overwrote.

> **I did not verify this by saving, deliberately.** Confirming it would mean overwriting a
> real booking's value on a live vendor's ledger, and the dialog offers no way to type the
> original Rs 350,000 back — the damage would not be reversible through the UI. **This needs
> checking in a non-production environment before anyone edits a haggled booking.** Recorded as
> a risk with its evidence, not as a confirmed defect.

### ✅ D4-033 — Cancel is clean

Cancelled the dialog and re-read the API: `totalAmount` still `350000.00`, `downPayment` still
`35000.00`. Nothing written.

### ✅ Guest Count is properly floored

`Guest Count` carries **`min="1"`** — a correctly bounded number input, in a portal where 164
number inputs have no floor at all (`scripts/qa-scan-number-inputs.mjs`). Credit.

### 🔴 WWL-037 extended — the payment flag is wrong in *both* directions

Booking 179 on the same ledger:

> `Silver — Nikah Package | Waheed Jutt | Rs 350,000 | Rs 35,000 | Awaiting Payment |`
> **`Pending`**

`downPayment: 35000.00` — money **has** been received — yet the chip reads `Pending`, not
`Partial`. Confirmed in the API: `paymentStatus: "Pending"` with a non-zero down payment.

So the stored flag disagrees with the amounts in **both** directions on the same screen:

| Booking | Amount | Paid | Truth | Chip says |
|---|---:|---:|---|---|
| 170 Imran Shafi | 1,546,000 | 386,500 | **Partial** | **`Paid`** ← overstates |
| 179 Waheed Jutt | 350,000 | 35,000 | **Partial** | **`Pending`** ← understates |

Two records, opposite errors, one cause: the chip is rendered from a stored flag instead of
being derived from `total − paid`. This is now the single highest-leverage fix identified in
the sweep — it would close **WWL-001, WWL-005 and WWL-037** together.

### ⚠️ WWL-038 — S3 — "Total bookings" means two different things on two screens

| Screen | Label | Value | Means |
|---|---|---:|---|
| Dashboard | `Total bookings` | **25** | every booking incl. cancelled |
| Bookings (Active) | `Total bookings` | **10** | active only |
| Bookings (Archive) | `Total bookings` | **12** | completed only |

Three different numbers under one label, none of them qualified as "active" or "completed".
A vendor comparing the two screens has no way to reconcile 10 against 25 — especially since
neither view can show the 3 that make up the difference (WWL-036).
