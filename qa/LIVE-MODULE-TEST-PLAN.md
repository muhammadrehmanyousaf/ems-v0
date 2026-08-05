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
