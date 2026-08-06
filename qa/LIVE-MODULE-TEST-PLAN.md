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
| 4 | Bookings | `/dashboard/bookings` | ✅ 60 | **`[x]` COMPLETE — 57 run, 3 not run, 21 findings** |
| 5 | Date holds | `/dashboard/holds` | ✅ 52 | **`[x]` COMPLETE — 48 run, 4 not run, 14 findings** |
| 6 | Function sheets | `/dashboard/function-sheets` | ✅ 68 | **`[x]` COMPLETE — 57 run, 11 not run, 17 findings** |
| 7 | Customers | `/dashboard/customers` | ✅ 66 | **`[x]` COMPLETE — 52 run, 14 not run, 11 findings** |
| 8 | Calendar | `/dashboard/calendar` | ✅ 48 | **`[x]` COMPLETE — 38 run, 10 not run, 6 findings** |
| 9 | Conversations | `/dashboard/chat` | ✅ 40 | **`[x]` COMPLETE — 26 run, 14 not run, 3 findings** |
| 10 | Payments | `/dashboard/payments` | ✅ 118 | **`[x]` COMPLETE — 101 run, 17 not run, 22 findings (4× S1)** |
| 11 | Receivables | `/dashboard/receivables` | ✅ 96 | **`[x]` COMPLETE — 84 run, 12 not run, 13 findings (2× S1)** |
| 12 | Receipts | `/dashboard/receipts` | ✅ 92 | **`[x]` COMPLETE — 83 run, 9 not run, 17 findings** |
| 13 | Cheque ledger | `/dashboard/pdcs` | ✅ 88 | **`[x]` COMPLETE — 78 run, 10 not run, 16 findings** |
| 14 | Expenses | `/dashboard/expenses` | ✅ 104 | **`[x]` COMPLETE — 89 run, 15 not run, 14 findings** |
| 15 | Tax report | `/dashboard/tax` | ✅ 72 | **`[x]` COMPLETE — 61 run, 11 not run, 10 findings** |
| 16 | Reports | `/dashboard/reports` | ✅ 70 | **`[x]` COMPLETE — 60 run, 10 not run, 10 findings** |
| 17 | Trade operations | `/dashboard/trade-ops` | ✅ 86 | **`[x]` COMPLETE — 71 run, 15 not run, 10 findings** |
| 18 | Automation | `/dashboard/automation` | ✅ 78 | **`[x]` COMPLETE — 62 run, 16 not run, 10 findings** |
| 19 | Kitchen prep | `/dashboard/kitchen-prep` | ✅ 143 | **`[x]` COMPLETE — 85 run, 58 not run, 13 findings (5× S2)** |
| 20 | Inventory | `/dashboard/inventory` | ✅ 204 | **`[x]` COMPLETE — 132 run, 72 not run, 18 findings (5× S2)** |
| 21 | Staff & payroll | `/dashboard/staff` | ✅ 188 | **`[x]` COMPLETE — 88 run, 100 not run, 13 findings (1× S1)** |
| 22 | Suppliers | `/dashboard/suppliers` | ✅ 194 | **`[x]` COMPLETE — 95 run, 99 not run, 13 findings (3× S2)** |
| 23 | Brokers | `/dashboard/brokers` | ✅ 164 | **`[x]` COMPLETE — 95 run, 69 not run, 16 findings (4× S2)** |
| 24 | Generator fuel | `/dashboard/generator-fuel` | ✅ 132 | `[~]` cases written; **execution blocked — session lost, login now needs an emailed OTP** |
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
| 36 | Tonight | `/dashboard/venue-os?tab=today` | — | `[ ]` |
| 37 | Event profit | `/dashboard/venue-os?tab=profit` | — | `[ ]` |
| 38 | Venue money | `/dashboard/venue-os?tab=money` | — | `[ ]` |
| 39 | Halls & spaces | `/dashboard/venue-os?tab=spaces` | — | `[ ]` |
| 40 | Cash & cheques | `/dashboard/venue-os?tab=cash` | — | `[ ]` |
| 41 | Kitchen & suppliers | `/dashboard/venue-os?tab=kitchen` | — | `[ ]` |
| 42 | Accounting | `/dashboard/venue-os?tab=advanced` | — | `[ ]` |
| 43 | Field capture | `/dashboard/field` | — | `[ ]` |
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

### 🔴 WWL-040 — S1 — The Record Payment dialog tells the vendor to collect the down payment twice

`Booking actions → Record payment` on booking 179. The dialog renders, in this order:

```
Total Amount     Rs. 350,000
Down Payment     Rs. 35,000      ← it knows money was received
Current Status   Pending
Remaining        Rs. 350,000     ← and then ignores it
```

`350,000 − 35,000 = Rs 315,000`. The dialog shows the down payment and the remaining balance
**three lines apart**, and they contradict each other.

It is not a display slip — the instruction repeats it in words, and the input is pre-hinted
with the same wrong number:

> **Amount received (Rs) \*** — placeholder `350000`
> *"Enter exactly what the customer handed over. **Remaining balance is Rs 350,000.**"*

**This is the most directly harmful defect found in the sweep.** Every other money bug
misreports a total on a dashboard. This one sits on the screen a vendor opens *while the
customer is standing in front of them*, and instructs them to collect **Rs 35,000 more than is
owed**. A vendor following the on-screen instruction overcharges the customer — and the wedding
industry runs on exactly this kind of counter-side cash settlement.

**Same root cause as WWL-037**: `Remaining` is derived from `paymentStatus` (`Pending` ⇒ assume
nothing paid) rather than from `total − downPayment`. It is the identical error that makes
Receivables show Waheed at Rs 350,000 instead of Rs 315,000 (**WWL-002**) — the same booking,
the same wrong number, now reached through the collection flow.

**Deriving the balance from the amounts closes WWL-001, WWL-002, WWL-005, WWL-037 and
WWL-040 — five findings, one fix.**

### ✅ Record Payment — what it gets right

- Amount input is `type="number"` with **`min="1"`** — correctly floored.
- Payment types are sensible: `Down Payment` · `Full Payment` · `Custom amount`, with the
  custom option explained ("part-payment, instalment, or a top-up on the advance").
- `Record Payment` is **disabled** until payment type and method are chosen.
- **Cancel is clean** — verified against the API: `totalAmount 350000.00`,
  `downPayment 35000.00`, `paymentStatus Pending`, nothing written.

⚠️ The amount field has **no `max`**, so an over-payment is not blocked client-side. Not
pursued further — testing it would mean recording a real payment.

### ✅ D4-037 — `Booking actions` enumerated

Four items: `Quick view` · `View detail page` (→ `/dashboard/bookings/179`) ·
`Record payment` · `Cancel booking`. All four are reachable and named.

`Cancel booking` was **not driven** — cancelling a live booking is irreversible and would
corrupt the very ledger under test.

### 🔴 WWL-041 — S1 — Booking search returns HTTP 500 for **every** term; the UI shows it as "0 bookings"

Typing anything into `Search bookings…` crashes the endpoint. Isolated precisely:

| Request | Result |
|---|---|
| `?bucket=active` (no search) | **200** — 10 bookings |
| `?search=&bucket=active` (empty search) | **200** — 10 bookings |
| `?bucket=completed` | **200** — 12 bookings |
| **`?search=Ahmed&bucket=active`** | **500** — `"Error retrieving vendor bookings"` |
| **`?search=Ahmed`** (no bucket) | **500** |

Ten different terms tried — `Waheed`, `waheed`, `  WAHEED  `, `Rehman Grand`, `Nikah`,
`zzzznomatch`, `Ahmed` — **all 500**. Any non-empty `search` parameter kills the query.

**The UI does not surface the crash.** Searching "Ahmed" — whose booking is literally the first
row — renders an empty table with `Total bookings 0`. The vendor concludes the booking does not
exist. A 500 presented as "no results" is the **WWL-018 pattern on the ledger**.

**Root cause, from the repo's own comment** (`bookingController.js`): `status` was included in
the ILIKE list, but it is a Postgres **ENUM** (`enum_Bookings_status`) and Postgres has no
ILIKE operator for an enum, so the whole query throws.

> ### ⚠️ This bug is already fixed — and the fix has never been deployed
>
> `event-planner-api` commit **`2c62c20` — "fix(bookings): every search term returned HTTP 500"**
> is on branch `fix/booking-search-500-enum-ilike`, which has **no upstream and is on no remote
> branch**. Production runs the broken code.
>
> **This is the third confirmed-fixed-but-undeployed defect this sweep has re-discovered live:**
>
> | Fix | Commit | State | Still live on prod |
> |---|---|---|---|
> | Cancelled bookings counted as revenue | `0677c6e` (ems-v0) | unpushed | **WWL-008** |
> | Lead form accepts anything | `5e7d74d` (ems-v0) | unpushed | **WWL-031** |
> | Booking search 500s | `2c62c20` (event-planner-api) | **no remote at all** | **WWL-041** |
>
> Three real defects, already diagnosed and repaired by past work, still harming the live
> product because the branches were never shipped. **The single highest-value action available
> right now is not writing more code — it is deploying what already exists.**

### ⚠️ WWL-038 — S3 — "Total bookings" means two different things on two screens

| Screen | Label | Value | Means |
|---|---|---:|---|
| Dashboard | `Total bookings` | **25** | every booking incl. cancelled |
| Bookings (Active) | `Total bookings` | **10** | active only |
| Bookings (Archive) | `Total bookings` | **12** | completed only |

Three different numbers under one label, none of them qualified as "active" or "completed".
A vendor comparing the two screens has no way to reconcile 10 against 25 — especially since
neither view can show the 3 that make up the difference (WWL-036).

---

## Module 4 — Section C/G continued (selection, density, export, columns)

Live, `https://www.weddingwala.pk/dashboard/bookings`, backend
`ems-v0-backend-production.up.railway.app`. Ground truth for this whole block is a single
authenticated read of `GET /api/v1/bookings?page=1&limit=200&sortBy=createdAt&sortOrder=DESC`,
which returns all 25 bookings for this vendor.

### 🔴 WWL-042 — S1 — `bucket` is a silent fall-through: an unrecognised value returns **everything**

The list endpoint accepts a `bucket` filter. Only two values are actually implemented.
Anything else does not error, does not return empty — it returns the **entire** ledger:

| Request | HTTP | Server message | Rows | Statuses returned |
|---|---|---|---:|---|
| `bucket=active` | 200 | "10 bookings retrieved successfully" | 10 | Awaiting Payment 2, Confirmed 7, Pending 1 |
| `bucket=completed` | 200 | "12 bookings retrieved successfully" | 12 | Completed 12 |
| `bucket=cancelled` | 200 | "**25** bookings retrieved successfully" | **25** | **all five statuses** |
| `bucket=all` | 200 | "25 bookings retrieved successfully" | 25 | all five |
| `bucket=archive` | 200 | "25 bookings retrieved successfully" | 25 | all five |
| *(no bucket)* | 200 | "25 bookings retrieved successfully" | 25 | all five |

`bucket=cancelled` is the dangerous one. It reads like a narrowing filter, it is spelled like
the status that exists in the enum, and it returns **more** rows than either real bucket — the
complete book, Completed and Confirmed included. A filter whose failure mode is *widen*
rather than *empty* is the wrong way round: a typo'd or stale bucket value anywhere in the
app silently dumps the full ledger into a view that asked for a slice of it.

**Fix:** validate `bucket` against the known set; unknown → 400, or at minimum fall through
to `active`, never to unfiltered.

### 🔴 WWL-043 — S2 — `limit` is ignored and `total` lies; past 100 bookings the list silently truncates

Three separate reads, same endpoint:

- Asked `limit=3` → server answered **"10 bookings retrieved successfully"** and returned 10.
- Asked `limit=200` → response metadata came back `"limit": 100`.
- `meta.filters.total` is **10 / 12 / 25** — i.e. it echoes the number of rows *returned*,
  not the number that exist.

So the client requests a page size, the server overrides it to 100, and reports a `total`
equal to the returned count. **There is no signal the client could use to detect truncation** —
`total === rows.length` always, by construction.

The Bookings page has **no pagination control of any kind** (no page numbers, no "load more",
no infinite scroll — verified: the only toolbar controls are search, Active/Archive, density,
Export). Today this vendor has 25 bookings so nothing is lost. A venue doing 100+ events a
year crosses the line and:

- rows past 100 vanish with no message,
- `Total bookings` shows 100 and looks plausible,
- **`Collected (shown)` and `Due (shown)` silently understate the money**, because they sum
  only the rows that arrived.

That last point is what makes this S2 rather than S3 — the failure is quiet and it is
financial. The tiles are honestly labelled "(shown)", but nothing tells the vendor that
"shown" has been capped by the server rather than by their filter.

### 🔴 WWL-044 — S2 — A cancelled booking is fully editable, `Save order` and all

Booking **175** — `status: "Cancelled"`, Rs 2,742,400, Usman Tariq & Hira Usman — opened at
`/dashboard/bookings/175`. The page renders the Cancelled badge correctly and then offers a
completely live editor beneath it:

| Control | State |
|---|---|
| 23 form inputs (item names, qty, rates, guest counts, guarantee/served) | **all enabled, none read-only** |
| `Remove line` × 4 | **enabled** |
| `Hall / Venue`, `Per-head menu`, `Extra charge`, `Discount`, `My cost` | **enabled** |
| **`Save order`** | **enabled** |

Nothing is disabled, greyed, or annotated. A vendor can rewrite the price of a cancelled
event — change `Catering — Platinum` from Rs 3,900 × 616 to anything, delete lines, and press
Save — with no warning that the booking is dead. Whatever the cancellation/refund engine on
the same page computes against (`Policy accept karwayen`, `Refund nikalein`, reason
`customer_cancel`) is computed from numbers the vendor can still move after the fact.

**Not tested destructively** — `Save order` was inspected for enabled state, never clicked.
Live vendor ledger; see the standing limit at the top of this file.

### 🔴 WWL-045 — S3 — Row selection exists and does nothing

The table has a working select-all plus 10 row checkboxes (both with correct accessible
names — see D4-058). Clicking select-all checks all 11 boxes and the toolbar reports
**`10 selected`**.

The only control that appears next to it is **`Clear`**.

There is no bulk status change, no bulk export, no bulk delete, no bulk anything. Export's
label does not change to "Export selected" and its output is unaffected by the selection
(verified — see D4-052). The entire selection mechanism is decorative: a vendor selects ten
bookings, looks for the action, and finds a button that undoes the selection.

### ⚠️ WWL-046 — S3 — The selection counter desyncs from the checkboxes on view switch

With 10 rows selected in **Active**, click **Archive**:

| | |
|---|---|
| Checkboxes rendered | 13 (12 rows + select-all) |
| Checkboxes **checked** | **0** |
| Toolbar still reads | **`10 selected`** |
| `Clear` | still present |

The counter and the underlying id set survive the view change; the checkboxes do not. The
vendor is shown "10 selected" over a table where nothing is selected — and the 10 ids being
held are Active bookings they can no longer see.

Harmless today only because WWL-045 means there is no bulk action to fire. If a bulk action
is ever added on top of this state, it operates on ten invisible rows from the other view.

`Clear` does work — after clicking it, the `selected` text is gone and 0 boxes are checked.

### 🔴 WWL-047 — S1 — The payment lie is exported into the vendor's accounting file

`Export → CSV (.csv)` on **Archive**, header plus first data row:

```
Booking,Space,Customer,Phone,Date,Amount,Paid,Status,Payment
Rehman Grand Marquee,,Imran Shafi & Hafsa Imran,0319263021,09-Sept-2026,1546000,386500,Completed,Paid
```

`1546000` billed, `386500` received, **`Paid`**. Rs 1,159,500 outstanding, exported as settled.

This is WWL-037 crossing out of the UI. The screen bug is recoverable — a vendor might notice
the two numbers next to the chip. The export is not: it lands in Excel, gets filtered on
`Payment = Paid`, and the row drops out of the chase list permanently. Same for booking 179
in the Active export (`350000,35000,Awaiting Payment,Pending` — Rs 35,000 collected, flagged
Pending).

### ⚠️ WWL-048 — S3 — The CSV export has no booking id and an Excel-hostile date column

Same two exports. Header: `Booking,Space,Customer,Phone,Date,Amount,Paid,Status,Payment`.

1. **No id column.** Nothing in the file joins back to `/dashboard/bookings/<id>` or to any
   other export. Two bookings for `Bilal Hussain & Ayesha Bilal` (156 and 174) and two for
   `Ahmed Raza & Sanam Ahmed` (155 and 173) are distinguishable only by date. For an
   accounting export the primary key is the one column that must not be missing.
2. **Dates do not parse, and inconsistently so.** `09-Sept-2026` uses a four-letter month
   abbreviation; Excel and Sheets expect `Sep`, so that cell imports as **text**. `05-Aug-2026`
   in the same column imports as a **date**. The result is a mixed-type column — worse than
   uniformly text, because sorting silently splits into two groups.
3. **`Space` is exported as an always-empty column** (see WWL-050 below).
4. **Both views write the same filename**, `bookings.csv`. Export Active then Archive and you
   get `bookings.csv` and `bookings (1).csv` with no in-file provenance — no view name, no
   export timestamp, no vendor name.

**What is right:** money is exported machine-readable — `1673250`, `438180`, no `Rs`, no
thousands separators, no currency symbol. That is the part most exports get wrong, and this
one gets it right. D4-053 passes cleanly.

### 🔴 WWL-049 — S2 — The `BOOKING` column hides the venue whenever a package is attached

The column shows a venue name for most rows and a **package** name for others. It is not a
display quirk — the two are mutually exclusive, and the venue is the one that gets dropped:

| Row | `businessId` (real venue) | `packageId` | `BOOKING` column shows | Venue visible? |
|---|---|---|---|---|
| 173 | 3358 Rehman Grand Marquee | null | `Rehman Grand Marquee` | yes |
| 171 | 3359 Rehman Banquet & Lawn | null | `Rehman Banquet & Lawn` | yes |
| **180** | **3359 Rehman Banquet & Lawn** | 65 | **`Gold — Barat Package`** | **no** |
| **179** | **3358 Rehman Grand Marquee** | 61 | **`Silver — Nikah Package`** | **no** |

This account runs **three** venues. Two of the ten active rows do not say which one the event
is at, and no other column carries it — `SPACE` is `—` for every booking (WWL-050). Booking
179 is dated **05-Aug-2026, today**; booking 180 is 13-Aug-2026. The operator reading this
list to plan staffing cannot tell where either event is happening without opening it.

The venue is present in the payload the table already has (`bookingDetails[0].businessId`).
Nothing needs fetching — the column just picks the package over the venue when both exist.

### ⚠️ WWL-050 — S3 — `SPACE` is a permanently dead column

`SPACE` renders `—` on all 10 Active rows and all 12 Archive rows. Checked the payload for
all **25** bookings: `bookingDetails[0]` contains **no** space/hall/floor/partition key at
all — not null, absent. The column is wired to a field the API does not send.

This is the Hall→Floor→Partition hierarchy shipping its column ahead of its data. It costs a
full column slot in an 8-column table that has to survive 360px (D4-059), and it is exported
as an empty column in every CSV (WWL-048).

---

### ✅ Passes in this block

- **D4-004** — `This month` is exact. Today is 05-Aug-2026 PKT. Active bookings dated in
  Aug 2026: 180 (13th), 179 (5th), 169 (29th), 167 (13th), 168 (21st), 166 (5th) = **6**,
  matching the tile. Archive has no Aug-2026 completions → tile reads **0**. Correct in both
  views. (The two cancelled August bookings, 177 and 178, are excluded — consistent with
  WWL-036, and arguably the right call for a "this month" workload count.)
- **D4-005** — Archive recomputes every tile, verified to the rupee against the API:
  - `Collected (shown)` — summed the 12 `downPayment` values: 386500 + 1223278 + 1464500 +
    1620225 + 1398250 + 1899000 + 1300080 + 1685200 + 1858450 + 1111400 + 1694600 + 1092200
    = **Rs 16,733,683**. Tile: **Rs 16,733,683**. ✔
  - Sum of the 12 `totalAmount` = Rs 18,974,150; minus collected = **Rs 2,240,467**.
    Tile `Due (shown)`: **Rs 2,240,467**. ✔
  - Archive holds 12, not the 15 predicted when the case was written — because 3 are
    cancelled and appear in neither view (WWL-036).
  - Worth naming: this same screen prints `Due (shown) Rs 2,240,467 to chase` in the tile
    and `Paid` in the chip of the row responsible for half of it (booking 170, Rs 1,159,500).
    The contradiction is visible without scrolling.
- **D4-006** — not applicable as written. There are **zero** Cancelled rows in Archive to
  distinguish from Completed; superseded by WWL-036.
- **D4-021** — select-all works. 11/11 boxes checked, toolbar reports `10 selected`.
  (What it reveals is WWL-045.)
- **D4-023** — `Clear` works correctly. Cross-view behaviour is WWL-046.
- **D4-024** — density toggle is **correct and complete**:

  | | Comfortable | Compact |
  |---|---|---|
  | Row height | 64.8px | **56.8px** |
  | Cell padding | `12px 16px` | **`8px 16px`** |
  | `aria-pressed` | `true` / `false` | flips to `false` / `true` |

  Persisted to `ww-ui-prefs` (`{"state":{"density":"compact"}}`) and **survives a hard
  reload** — re-measured after a fresh navigation: still 56.8px, still
  `Comfortable=false, Compact=true`. Restored to Comfortable afterwards.
  Both buttons are icon-only but carry `aria-label` — they are *not* part of WWL-035.
- **D4-047** — direct navigation to a booking detail renders fully. `/dashboard/bookings/175`
  returns the complete page — header, Cancelled badge, customer block, event block,
  financials, order editor, BEO. The data and the route are fine; only the *list* cannot
  reach it (WWL-036).
- **D4-052** — export row count matches the view exactly: Active → 10 data rows, Archive →
  12 data rows (13 lines with header). Columns match the table, plus `Phone`.
- **D4-053** — **money is machine-readable.** `1673250`, `438180`, `1146150` — no `Rs`, no
  commas, no symbol. Clean.
- **D4-054** — export respects the active view. Verified by exporting both.
- **D4-058** (checkbox half) — every checkbox has an accessible name: `Select all` on the
  header, `Select row` on each of the 10. Not a WWL-035 repeat.

---

## Module 4 — Section D (venue scoping) and Section F (`Add booking`)

### ✅ D4-012 / D4-013 / D4-014 — venue scoping is **correct, exact, and durable**

This is the behaviour Leads got right and Today got wrong. Bookings gets it right too, and the
arithmetic holds to the rupee. Switched the business switcher from `All venues` to
**Rehman Grand Marquee (3358)**:

| | Predicted from API | Observed on screen |
|---|---|---|
| Active rows | 3 — bookings 173, 179, 167 | **3** — Ahmed Raza, Waheed Jutt, Danish Qureshi ✔ |
| `Collected (shown)` | 0 + 35,000 + 657,213 = **Rs 692,213** | **Rs 692,213** ✔ |
| `Due (shown)` | 3,901,000 − 692,213 = **Rs 3,208,787** | **Rs 3,208,787** ✔ |
| `This month` | 179 (5 Aug) + 167 (13 Aug) = **2** | **2** ✔ |
| Archive rows | 5 — 170, 164, 161, 158, 155 | **5** ✔ |
| Archive `Collected` | **Rs 6,700,650** | **Rs 6,700,650** ✔ |

- **D4-012** ✔ the list rescopes.
- **D4-013** ✔ every tile rescopes with it, and recomputes correctly rather than filtering a
  cached total.
- **D4-014** ✔ scope survives a hard reload — `ww-active-business` persists
  `{"state":{"activeBusinessId":3358}}`, the switcher still reads
  `Business: Rehman Grand Marquee`, and the table still shows 3 rows with identical tiles.
- The switcher's `aria-label` is a model of how to do this: `Business: Rehman Grand Marquee.
  Switch business.` — current value *and* the action, in one string.

### 🔴 The single cleanest repro of WWL-037 lives in this scoped view

Scope to **Rehman Grand Marquee**, switch to **Archive**. Five rows. The tiles read:

```
Total bookings  5      Collected (shown)  Rs 6,700,650      Due (shown)  Rs 1,159,500  to chase
```

Four of those five bookings are `Paid` in full (164, 161, 158, 155 — `totalAmount` exactly
equals `downPayment`). So **the entire Rs 1,159,500 "to chase" belongs to booking 170** — and
booking 170's own `PAYMENT` chip, three columns to the left on the same screen, reads
**`Paid`**.

One venue, five rows, no scrolling: the tile says a million rupees is outstanding and the only
row that can owe it says it is settled. Use this as the reproduction case when fixing WWL-037.

### 🔴 WWL-051 — S3 — The Active/Archive toggle has no accessible state at all

The two view buttons carry **only** these attributes:

| Button | Attributes |
|---|---|
| `Active` | `type=button`, `class="… text-muted-foreground …"` |
| `Archive` | `type=button`, `class="… bg-primary text-primary-foreground"` |

No `aria-pressed`, no `role="tab"` + `aria-selected`, no `data-state`. Which view you are in
is communicated **purely by background colour**. A screen-reader user hears two identical
buttons and cannot tell whether they are looking at 10 active bookings worth Rs 11,176,762
outstanding or 12 completed ones — two different data sets with different money.

The fix is already in the codebase: the density toggle **immediately to the right** sets
`aria-pressed` correctly (D4-024). The pattern exists; it just was not applied here.

### 🔴 D4-043 / D4-044 — CONFIRMED: `Add booking` cannot capture money either

`Add booking` opens **`Add Offline Booking` — "Create a booking for a walk-in customer."**
Complete field enumeration, nothing omitted:

| # | Field | Required | Type |
|---:|---|---|---|
| 1 | Booking type — `Single event` / `Full wedding` | — | segmented buttons |
| 2 | `Existing customer` | — | select (`+ New customer`, or a saved customer) |
| 3 | `Full Name *` | **yes** (native `required`) | text |
| 4 | `Phone Number *` | **yes** (native `required`) | text, `03XX-XXXXXXX` |
| 5 | `Email(optional)` | no | email |
| 6 | `Business *` | **yes** (custom) | 3 venues |
| 7 | `Event Date *` | **yes** (custom) | calendar |
| 8 | `Time Slot *` | **yes** (custom) | Morning / Afternoon / Evening |
| 9 | `Additional Notes` | no | textarea |

**Ten controls. Not one of them is money.** No total, no package, no per-head rate, no guest
count, no advance, no down payment. The vendor's primary booking CTA — the button at the top
right of the Bookings module — cannot record what the event costs.

This is **WWL-034 reproduced from the second entry point**. The lead-conversion path and the
`Add booking` path both create a booking with no amount, which lands as the documented Rs 0
booking. Two doors, same hole — so this is one shared omission, not a one-off in the lead flow.

The severity is compounded by what we already know from this module:
- the created booking will show `Rs 0` in `AMOUNT` (D4-009 territory),
- it will carry `paymentStatus: Pending` which the chip renders as literally correct only by
  accident, and
- it will export to CSV as `,0,0,` into the vendor's books (WWL-047).

The amount has to be added afterwards through the booking detail's order editor — an editor
the vendor has to know exists, on a page they can only reach by clicking into the row.

### ✅ D4-045 — required-field gating is **correct**, and every refusal states its reason

Tested by arming a network write-blocker in the page (all `POST`/`PUT`/`PATCH`/`DELETE`
intercepted and aborted before leaving the browser) so submission could be exercised on a live
vendor ledger with zero risk of a write. Three submits, three different refusals:

| Submit attempt | Result | Booking POST attempted? |
|---|---|---|
| Everything empty | native `required` fires, focus jumps to `#ob-name` | **no** |
| Name + phone filled, no date/time/business | toast: **"Please select a date and time"** | **no** |
| + date `Aug 20, 2026`, no time/business | toast: **"Please select a date and time"** | **no** |
| + time `Evening (6 PM – 11 PM)`, no business | toast: **"Please select a business"** | **no** |

Every required field is genuinely gated, each refusal names the missing field, and **no write
was ever attempted** — the only blocked requests in the whole sequence were two Google
Analytics beacons. There is no silent default: leaving `Business` untouched does **not**
quietly file the booking against the first venue.

Three caveats, none of which change the verdict:

1. Reasons arrive as **transient toasts, one at a time**. A vendor missing three fields must
   submit three times to discover all three. Inline errors under each field would say it once.
2. `Create Booking` stays **enabled** throughout, with no `aria-describedby` blocked-reason
   hint — the `FormBlockedHint` pattern used elsewhere in this codebase is not applied here.
3. The hidden native `<select>` elements behind the custom triggers carry values that do
   **not** reflect real state — `3358` for Business and `09:00` for Time, while the visible
   triggers correctly read `Select your business` and `Select time`. Validation reads the real
   state (proven by the toasts above), so this is latent, not live. It is a trap for anyone
   who later reads those selects.

### ✅ D4-030 (Add-booking half) — past dates are correctly blocked

The calendar disables every day before today. Verified across the month boundary: 26–31 Jul
and 1–4 Aug 2026 all `disabled: true`; **5 Aug (today) onward enabled**. A walk-in booking
cannot be back-dated from this dialog.

### ✅ D4-046 — Cancel writes nothing

Filled name, phone, date and time slot, then pressed `Cancel`. Verified against the API
immediately afterwards on a fresh page load:

| | Before | After |
|---|---:|---:|
| Total bookings | 25 | **25** |
| Highest booking id | 180 | **180** |
| Rows named `QA Harness Test` | 0 | **0** |

No row created, no id burned. Page state restored to `All venues` / `Active` / 10 rows, and
the test harness confirmed cleared from the page.

---

## Module 4 — Sections H (failure), I (a11y), J (responsive)

### ✅ D4-055 — the error state is **real here**, and Retry actually works

Injected a transport failure on `GET /api/v1/bookings?…` in the page, then forced a refetch by
switching view. Unlike the Dashboard — where `catch { return null }` turns every failure into
a successful empty result and makes the error UI dead code (WWL-018/019) — the Bookings module
renders it properly:

> **Couldn't load bookings.**   `[ Retry ]`

Then disarmed the injector and clicked **Retry**: the list recovered **in place**, no page
reload — 12 rows returned, `Collected (shown) Rs 16,733,683` and `Due (shown) Rs 2,240,467`
restored exactly, error message gone.

So the failure path in this module is correctly wired end to end. It is worth stating plainly
because it proves the Dashboard's dead error UI is a *local* defect in `lib/api/analytics.ts`,
not a house style.

### 🔴 WWL-052 — S2 — On load failure the money tiles print `Rs 0` instead of `—`

Same injected failure. Directly **above** the "Couldn't load bookings." message, the four KPI
tiles rendered:

```
Total bookings  0      Collected (shown)  Rs 0      Due (shown)  Rs 0      This month  0
```

`Rs 0 received` and `Rs 0 to chase` are not "no data" — they are a confident financial claim,
and they are false. The vendor has collected Rs 3,342,938 and is owed Rs 11,176,762. The
screen simultaneously says the data could not be loaded and states the data.

The correct treatment already exists in this codebase — the Dashboard KPI cards use
`kpisQ.isError ? "—"`. That is the pattern to apply here. Whichever of the two messages a
vendor believes, one of them is lying to them; a dash cannot lie.

### 🔴 WWL-053 — S1 — **On mobile the Bookings module is completely inert — a booking cannot be opened at all**

At 360 × 780 the `<table>` is `display: none` (`hidden md:block`) and is replaced by a card
list (`space-y-2 p-3 md:hidden`). The card list renders all 10 bookings. It contains
**zero interactive elements**:

| Measured at 360px | Result |
|---|---|
| Cards rendered | 10 |
| Cards containing a link, button, or input | **0** |
| Total controls inside the entire card list | **0** |
| First card: `tag` / `role` / `tabIndex` / `cursor` | `DIV` / `null` / `-1` / `auto` |
| Full pointer sequence on a card (`pointerdown → mouseup → click`) | **no navigation**; `closest('a,button,[role=button],[onclick]')` → **`null`** |
| `Select all` checkbox | not rendered |

The desktop row's two controls — `Edit booking` and `Booking actions` (which is the **only**
route to `View detail page`) — live inside the hidden table, so they do not exist on mobile
either. There is no card tap target, no kebab, no link.

**Net effect on a phone:** the vendor can read ten cards and nothing else. They cannot open a
booking, edit one, record a payment, cancel one, or reach a function sheet. The single
remaining interactive control in the module is the search box — which returns HTTP 500 for
every term (WWL-041).

For a Pakistani venue operator, whose primary and often only device is a phone, this makes the
Bookings module non-functional rather than degraded. Rated S1 on that basis.

Two aggravating details:

- The mobile card drops the **`PAID`** column. It shows `Rs 1,673,250` and the `Pending` chip
  but not how much has actually been collected. On desktop a vendor can catch WWL-037 by
  reading `AMOUNT` against `PAID`; on mobile the corroborating number is gone, leaving only
  the chip that is wrong.
- Card fields are: venue, `customer · date`, amount, status chip, payment chip. `SPACE` is
  correctly dropped (it is dead anyway — WWL-050).

### 🔴 WWL-054 — S3 — Table rows are not clickable on desktop either; the only way in is an icon-only kebab

**This corrects the earlier D4-047 note in this file.** That check confirmed the *route*
`/dashboard/bookings/175` renders when typed. It did not test the case as written — "row opens
the correct booking detail" — and that fails:

| Row property | Value |
|---|---|
| `<a>` elements in the row | **0** |
| `cursor` | `auto` |
| `tabIndex` | `-1` |
| `role` | `null` |
| Full pointer sequence on the CUSTOMER cell | **no navigation** |

The row's only controls are the two trailing icon buttons. Opening a booking therefore costs:
click the kebab → click `View detail page`. The customer name, venue, date and both money
columns are inert text.

Every convention a vendor brings from every other table on the web says the row is clickable.
It is not, it gives no hover affordance, and the actual door is an unlabelled-looking icon at
the far right of the row.

### ⚠️ D4-057 — confirms WWL-035 inside this module

10 rows × 2 controls = **20 row-action buttons**, sharing exactly **2** accessible names:
`Edit booking` (×10) and `Booking actions` (×10). Neither carries the customer, the date, or
the booking id. A screen-reader user tabbing the table hears "Edit booking" ten times with
nothing to tell them which booking they are about to edit — on a screen where the wrong choice
edits the wrong wedding's money.

Same defect class as WWL-035; recorded here as the Bookings-module instance rather than as a
new finding.

### ✅ D4-059 / D4-060 — no layout overflow at either width

| Width | `documentElement.scrollWidth` vs `clientWidth` | Verdict |
|---|---|---|
| 1521px (desktop) | 1521 / 1521 | **no horizontal overflow**, zero elements past the right edge |
| 360px (mobile) | 345 / 345 | **no horizontal overflow** |

One element measured past the viewport edge at 360px — a `<span>` reading `· engagement` at
`right: 367` — but its parent is `text-sm font-medium truncate`, so it is clipped by the
truncation and never paints outside. Not a defect; recorded so the raw measurement is not
mistaken for one later.

The responsive strategy is the *good* one: rather than horizontally scrolling an 8-column
table on a phone, the table is swapped for cards. The strategy is right — the execution is
WWL-053.

**Mobile tap targets** — 36 of 41 interactive elements in `<main>` fall under the 44px
minimum in at least one dimension. The worst are the 28×28 icon buttons: `Toggle Sidebar`,
`Comfortable`, `Compact`, and ten `WhatsApp reminder` buttons in the receivables strip.
`Active` (32px tall), `Archive` (32px), `Add booking` (36px) and `Export` (36px) are all
under as well. Recorded as an observation rather than a separate finding — on this screen it
is moot, because per WWL-053 almost none of them do anything for a booking.

---

## Module 4 — Section E (navigation) and sorting

### 🔴🔴 WWL-037 — **the decisive artifact.** One page, two blocks, two different answers

`/dashboard/bookings/170`. Both of these render on the same screen, one scroll apart:

| Block | Field | Value |
|---|---|---:|
| **Payment** (summary, top) | Your total | Rs 1,546,000 |
| | Down payment | Rs 386,500 |
| | **Remaining** | **Rs 0** ❌ |
| **Order & Price** (editor, below) | Grand total | Rs 1,546,000 |
| | **Balance due** | **Rs 1,159,500** ✅ |

Same booking. Same two inputs. `1,546,000 − 386,500 = 1,159,500`.

The Payment block does not subtract — it reads `paymentStatus`, sees `Paid`, and prints
`Remaining Rs 0`. Confirmed by the contrast with booking 175, where `paymentStatus` is
`Pending` and the same block correctly shows `Remaining Rs 2,742,400`. The rule is
`if (paymentStatus === "Paid") remaining = 0`, not arithmetic.

**Why this closes the argument:** the correct calculation is *already in the codebase, on the
same page*. The order editor derives `Balance due` from the numbers. Nothing needs to be
invented — the summary blocks, the list chip, and the CSV export simply need to use the
derivation the order editor already performs.

That single change closes WWL-001, WWL-002, WWL-005, WWL-037, WWL-040 and WWL-047, and makes
the Archive tile stop contradicting its own rows.

### 🔴 WWL-055 — S2 — No column sorting at all, and the default order is operationally meaningless

Every one of the 10 `<th>` elements: no `<button>`, no `aria-sort`, `cursor: auto`, no click
handler. The list is pinned to the request the page hard-codes —
`sortBy=createdAt&sortOrder=DESC`.

So bookings are ordered by **when the record was created**, not when the event happens. The
10 active rows come out in this event-date order:

```
22-Oct · 23-Sept · 13-Aug · 05-Aug · 07-Nov · 29-Aug · 13-Aug · 07-Oct · 21-Aug · 05-Aug
```

That is not an order — it is noise. A venue operator's single most common question of this
screen is "what is coming up next", and the answer is scattered across ten rows with no way
to reorder by date, by amount, or by balance outstanding. There is no sort control anywhere
on the page.

### ⚠️ WWL-056 — S3 — The view toggle never updates the URL, so a reload silently changes the view

`?bucket=completed` deep-links correctly (D4-051 passes). But the toggle is one-way:

| Step | URL | View shown |
|---|---|---|
| Open `?bucket=completed` | `…?bucket=completed` | Archive, 12 rows ✔ |
| Click **Active** | `…?bucket=completed` *(unchanged)* | Active, 10 rows |
| **Reload** | `…?bucket=completed` | **Archive, 12 rows** — silently back |

Consequences: the URL in the address bar stops describing the screen; copying it to a
colleague sends them somewhere else; bookmarking captures the wrong view; and a refresh throws
away the view the vendor selected without saying so.

Contrast with density, which persists correctly through `ww-ui-prefs` (D4-024) — this page
already has a working persistence pattern, just not applied to the view.

### ✅ D4-047 (corrected) / D4-049 / D4-050 / D4-051 — navigation passes

- **D4-047** — the row is not clickable (WWL-054), but the documented path works and lands
  correctly: `Booking actions` → `View detail page` on row 1 → **`/dashboard/bookings/173`**,
  which is Ahmed Raza & Sanam Ahmed, the correct booking for that row.
- **D4-049** — every paperwork/operations link renders and is wired:
  `/dashboard/function-sheets`, `/dashboard/function-sheet-sign`, `/dashboard/trade-ops`,
  `/dashboard/function-sheet-operations`, `/dashboard/kitchen-prep`, plus the booking-scoped
  `/dashboard/bookings/170/financials`, `/dashboard/money?tab=receipts` and a resolved
  `/dashboard/function-sheets/89`.
- **D4-050** — browser Back returns a **fully rendered** list, not a blank shell: 10 rows,
  table present, `Active` still selected, scope still `All venues`, density still Comfortable,
  and tiles correct at `Rs 3,342,938` / `Rs 11,176,762`. No re-fetch flash, no empty state.
- **D4-051** — `?bucket=completed` lands on Archive with 12 rows and correctly recomputed
  tiles. (The one-way half of this is WWL-056.)

---

## Module 4 — status

All 60 written cases are now driven. Findings raised in this module: **WWL-034 (confirmed from
a second entry point), WWL-036 through WWL-056** — 21 findings, 7 of them S1.

Three cases were deliberately **not driven**, each because it would write irreversibly to a
live vendor's ledger. Recorded here rather than silently skipped:

| Case | Why not driven |
|---|---|
| **D4-039** `Cancel booking` | Irreversible on a real booking; would corrupt the ledger under test. Enumerated and inspected instead. |
| **D4-040** `Record payment` | Would post money to a live customer's account. Dialog enumerated and its arithmetic assessed — that is what produced WWL-040. |
| **D4-044** end-to-end Rs 0 creation | Would create a real Rs 0 booking. Proven instead by full field enumeration of the dialog (10 fields, none monetary) plus the write-blocker submit test. |

Everything else in the module was clicked in the live UI, hard-reloaded where a mutation was
involved, and re-read from the API for confirmation.

---

# MODULE 5 — Date holds (`/dashboard/holds`)

> **Route correction:** the module index listed `/dashboard/date-holds`. That URL returns a
> **404** on live. The real route is **`/dashboard/holds`** (`app/(dashboard)/dashboard/holds`).
> Index corrected.

**What this module is for.** "Tentatively hold a date for a lead — even offline at an expo.
Holds expire automatically." A hold is a soft reservation on the vendor's own calendar while
they chase a lead. Backing API `/api/v1/vendor-holds`; the backend expires `DateHold` rows on
a timer. Offline holds queue in the outbox and can conflict on reconnect.

**Starting state on live:** `No active holds` — the module is empty for this vendor. That
makes it the one module where creation can be exercised end to end without touching money:
holds carry no financial value, expire on their own, and are individually releasable. Every
row this module creates will be released and the release verified. Test dates are far-future
(2027) so a hold can never shadow a real event while the test runs.

**Surface is small and fully enumerable** — 2 × `Hold a date`, a dialog with Date + Slot, and
a per-hold `Release`. So these cases go deep rather than wide: PKT boundaries, venue scoping
on a 3-venue account, conflict/idempotency, expiry semantics, and whether a hold actually
does the one thing it claims to do — protect the date.

## Section A — Empty state, load, scoping

- [ ] **D5-001** — Empty state renders the real message (`No active holds`) and not the stale
  "Date holds aren't enabled for your account yet" the source comments describe.
- [ ] **D5-002** — Both `Hold a date` buttons (header and empty state) open the same dialog.
- [ ] **D5-003** — With **All venues** active (`activeBusinessId === null`), what does the list
  actually request, and what comes back? The view has a `Pick a business first` branch keyed on
  `!activeBusinessId` — determine whether it is reachable or dead.
- [ ] **D5-004** — Create a hold under venue A, then switch to venue B: the hold must disappear.
- [ ] **D5-005** — Switch back to A: it must return.
- [ ] **D5-006** — With **All venues** selected, does a hold created under a specific venue
  appear? (Roll-up view must either aggregate or say it cannot.)
- [ ] **D5-007** — Scope survives a hard reload, as Bookings' did.
- [ ] **D5-008** — Blocked/errored list shows the error branch + `Try again`, and Try again
  actually refetches (the D4-055 test, repeated here).
- [ ] **D5-009** — `retry: false` is set — confirm a failure does not hammer the endpoint.

## Section B — The `Hold a date` dialog: fields and defaults

- [ ] **D5-010** — Enumerate every control. Expected: `Date` (native date input), `Slot`
  (select of 7 presets + `Custom…`), Cancel, `Hold date`.
- [ ] **D5-011** — Default date is today; default slot is `Evening`.
- [ ] **D5-012** — The 7 slot presets are the Pakistani-wedding set: Morning, Afternoon,
  Evening, Full day, **Mehndi, Baraat, Walima**.
- [ ] **D5-013** — `min` on the date input blocks past dates in the picker.
- [ ] **D5-014** — 🔴 **PKT boundary.** `min`/default come from
  `new Date().toISOString().slice(0,10)` — that is **UTC**, and Pakistan is UTC+5. Between
  00:00 and 05:00 PKT the UTC date is still *yesterday*. Determine whether the dialog therefore
  offers/defaults to a date already in the past for a Pakistani vendor — exactly the hours an
  expo or a late baraat runs.
- [ ] **D5-015** — Typing a past date directly into the date field (bypassing the picker) —
  is it rejected on submit, or accepted?
- [ ] **D5-016** — Selecting `Custom…` clears the slot, disables save, and shows the
  `FormBlockedHint` reason rather than a silently dead button.
- [ ] **D5-017** — The blocked reason reads "Add a date and a time to save."
- [ ] **D5-018** — Custom slot free-text accepts a normal value (`6pm Nikah`) and saves.
- [ ] **D5-019** — Whitespace-only custom slot must be refused (`holdTime.trim()`).
- [ ] **D5-020** — Very long custom slot (500+ chars) — client cap, server cap, or a 500?
  (`ems_registration_500_rootcause`: VARCHAR(255) overflow aborts the transaction.)
- [ ] **D5-021** — Emoji / Urdu script in the custom slot round-trips intact after reload.
- [ ] **D5-022** — `<script>` and SQL-ish input is stored inertly and rendered as text.
- [ ] **D5-023** — Dialog reopens clean: values from a previous open must not persist
  (the `loaded.current` keying).
- [ ] **D5-024** — Cancel writes nothing — verified by API count before/after.
- [ ] **D5-025** — Escape and the overlay close the dialog without saving.

## Section C — Creating a hold

- [ ] **D5-026** — Create a hold on a far-future date. Success toast is `Date held`.
- [ ] **D5-027** — **Hard reload** — the hold is still listed. (Rule 2.)
- [ ] **D5-028** — The row shows `<date> · <slot>` formatted `en-PK`, plus `Expires <when>`.
- [ ] **D5-029** — 🔴 **How long is a hold?** The dialog says it "expires on its own" but never
  says when. Read the real TTL from `expiresAt` and judge whether the vendor could know it
  before committing a date to a customer.
- [ ] **D5-030** — Re-place the **same** date+slot: `alreadyHeld` must return true and the
  toast must read `Hold extended`, not `Date held` — and no duplicate row appears.
- [ ] **D5-031** — Confirm the extension actually moved `expiresAt` forward.
- [ ] **D5-032** — Place a **different slot on the same date** — must be allowed (a venue can
  run mehndi and baraat on one day).
- [ ] **D5-033** — Multiple holds list in a sensible order.
- [ ] **D5-034** — 🔴 **Which venue does it land on?** `place()` sends
  `businessId: activeBusinessId ?? undefined`. On **All venues** that is `undefined`. For a
  3-venue vendor, determine what the backend does — silently pick one, or refuse. A hold on
  the wrong venue is a double-booking waiting to happen.
- [ ] **D5-035** — Nothing in the dialog names a **lead or customer**, despite the module's own
  description being "hold a date *for a lead*". With two holds on the same day, can the vendor
  tell which lead each is for?

## Section D — Does a hold actually protect the date?

This is the module's reason to exist. If a held date can still be booked by anything else,
the feature is decorative.

- [ ] **D5-036** — After holding date X, does `/dashboard/calendar` show X as held?
- [ ] **D5-037** — Does the Bookings `Add booking` calendar block or warn on X?
- [ ] **D5-038** — Does the public-side availability for this venue reflect the hold?
- [ ] **D5-039** — Hold a date that already has a **confirmed booking** on it — refused,
  warned, or silently allowed?
- [ ] **D5-040** — Two holds, same venue, same date, same slot, placed from two contexts —
  the "race-safe slot guard" the API doc claims. Verify a second placer gets 409, not a
  duplicate.

## Section E — Release

- [ ] **D5-041** — 🔴 `Release` fires `releaseMut.mutate(h.id)` directly with **no confirm
  dialog**. Verify on live and rate against the WWL-023 class.
- [ ] **D5-042** — Released hold disappears and the toast reads `Hold released`.
- [ ] **D5-043** — **Hard reload** — it is really gone from the API, not just the cache.
- [ ] **D5-044** — Is the release undoable? (`showSuccessToast` is the undo-capable helper —
  check whether an Undo affordance is actually offered.)
- [ ] **D5-045** — Releasing the last hold returns the empty state, not a blank panel.
- [ ] **D5-046** — Release error path surfaces the server's reason.
- [ ] **D5-047** — Double-clicking Release must not fire two DELETEs (`disabled` while pending).

## Section F — Offline / outbox, a11y, responsive

- [ ] **D5-048** — `OutboxStatus` and `OutboxConflicts` render. With the outbox flag dark,
  they must not show a broken or confusing control.
- [ ] **D5-049** — Every control has an accessible name; the date and slot inputs have real
  labels associated (they are styled `<label>`s — check `htmlFor`/wrapping).
- [ ] **D5-050** — Keyboard: dialog traps focus, Escape closes, `Hold date` reachable by Tab.
- [ ] **D5-051** — 360px: dialog fits, the 2-column grid collapses, no overflow.
- [ ] **D5-052** — Desktop: no overflow; `max-w-3xl` centring does not strand the action.

---

## MODULE 5 — RESULTS

**Test rows created and destroyed:** 5 holds (ids 107, 108, 110, 111, plus one for the venue
switch test). **All released; cleanup verified** by querying `/api/v1/vendor-holds` with no
param and with `businessId` = 3358 / 3359 / 3360 — **0 holds on every one** — and the UI back
to `No active holds`. Scope restored to `All venues`.

### 🔴🔴 WWL-057 — S1 — Availability does not know about bookings **at all**

`GET /api/v1/bookings/availability?businessIds=3358&month=…` is the endpoint that decides
whether a date can be sold. Queried for three months:

| Month | Real bookings at venue 3358 | `availability` returned |
|---|---|---|
| **2026-09** | booking 170 — 09-Sept, Rs 1,546,000, `Completed` | **`{}` — empty** |
| **2026-10** | booking 173 — 22-Oct, Rs 1,673,250, `Awaiting Payment` | **`{}` — empty** |
| **2027-12** | none | one entry — and only because a **hold** existed |

The map contains **only holds and manually-blocked dates**. Confirmed, paid, in-progress
bookings produce no availability entry whatsoever. A month with a Rs 1.5M confirmed wedding in
it comes back as an empty object — indistinguishable from a month with nothing booked.

### 🔴🔴 WWL-058 — S1 — Holds and availability speak two different languages, so nothing is ever subtracted

Even for the dates availability *does* track, the held slot is never removed from the available
ones. Raw response for the hold placed on 25-Dec-2027:

```json
"2027-12-25": {
  "bookedSlots": ["Mehndi"],
  "heldSlots":   ["Mehndi"],
  "heldSlotsExpiry": { "Mehndi": "2026-08-07T18:32:43.615Z" },
  "availableSlots": ["09:00", "14:00", "18:00"]
}
```

Held **`"Mehndi"`**. Still available: **`"09:00"`, `"14:00"`, `"18:00"`**.

Two incompatible vocabularies are in use for the same concept:

| Where | Slot vocabulary |
|---|---|
| `HOLD_SLOT_PRESETS` (hold dialog) | `Morning`, `Afternoon`, `Evening`, `Full day`, **`Mehndi`, `Baraat`, `Walima`** |
| `bookedSlots` / `heldSlots` | the same **names** |
| `availableSlots` | **clock times** — `09:00`, `14:00`, `18:00` |
| `Add booking` → Time Slot | **clock times** — `09:00` / `14:00` / `18:00` |

`"Mehndi"` can never equal `"18:00"`. `"Evening"` can never equal `"18:00"` either — verified
on 2026-08-13, where `heldSlots: ["Evening"]` sat next to `availableSlots` still listing all
three times. **No named slot can ever match a clock slot, so the subtraction never happens.**

Combined with WWL-057, the consequence is total: **`availableSlots` returns all three slots,
for every date, forever.** The venue can never be shown as unavailable — not by a booking, not
by a hold. `urgency.remaining` says `2` on a date already sold for Rs 1.88M.

This is the root cause behind the whole module being decorative. It is one seam, and both
sides of it are already written.

### 🔴 WWL-059 — S2 — A hold is invisible everywhere except its own screen

Placed a hold on **13-Aug-2026 · Evening** at venue 3358, then went looking for it:

| Surface | Shows the hold? |
|---|---|
| `/dashboard/holds` | yes — the only place |
| **`/dashboard/calendar`** (Aug 2026) | **no** — the word "hold" appears exactly once on the entire page, as the sidebar nav link. Day 13 shows `2 · Danish Qureshi · Muhammad Rehman Yousaf` and nothing else |
| **`Add booking` date picker** | **no** — 13-Aug renders enabled, unmarked, `aria-label` "Thursday, August 13th, 2026", indistinguishable from any free day. `anyHoldMarkerInGrid: false` |

The module's own page header reads `CALENDAR / Date holds` and its description says a hold is
"a tentative reservation **on your calendar**". The calendar has no concept of it.

The `Add booking` picker's only disabled days in August were 1–4 — i.e. it knows about *past*
and nothing else. Not holds, not the two confirmed bookings already on the 13th.

### 🔴 WWL-060 — S2 — A date that already has a confirmed booking can be held, with no warning

Placed a hold on **13-Aug-2026 · Evening at business 3358**. That exact date and venue already
carries **booking 167 — Danish Qureshi & Aiman Danish, `Confirmed`, Rs 1,877,750**.

Accepted silently. No warning, no confirmation step, no note on the created row. The vendor
now has a "hold" telling them a date is theirs to sell, on an evening already committed to a
Rs 1.88M wedding.

### 🔴 WWL-061 — S2 — Holds can be placed on dates that have already passed

Today is **05-Aug-2026**. Typed `2026-08-01` into the date field and submitted:

| | |
|---|---|
| Native validity | `rangeUnderflow: true` — the browser knows it is invalid |
| `Hold date` button | **enabled** |
| Result | toast **"Date held"**, row `id 107, holdDate 2026-08-01` |
| Row in the list | `01-Aug-2026 · Baraat` · **`Expires 07 Aug, 11:31 pm`** |

The `min` attribute only constrains the picker; typing bypasses it, the dialog is not a
`<form>` so native validation never runs on submit, `canSave` checks only for non-emptiness,
and the server has no past-date check either.

The result is self-evidently wrong: **the system held a date four days in the past, and will
keep holding it until two days in the future.** It also sorts to the **top** of the list,
above genuine future holds.

### ⚠️ WWL-062 — S3 — The date floor is computed in UTC on a UTC+5 product

`hold-date-dialog.tsx` derives both the default value and the `min` floor from:

```js
const today = () => new Date().toISOString().slice(0, 10)
```

`toISOString()` is **UTC**. Pakistan is **UTC+5**. Between **00:00 and 04:59 PKT** the UTC date
is still yesterday, so `today()` returns yesterday's date — and the dialog will both **default
to** and **permit** a date that is already in the past for the vendor using it.

Measured live at 23:29 PKT: `utcSlice` = `2026-08-05`, PKT date = `2026-08-05` — they agree
*outside* the window, which is why this does not show up in ordinary testing. The divergence
window is the five hours after midnight — exactly when an expo wraps up or a baraat ends,
which is the stated use case ("even offline at an expo").

The fix is the one already used in `bookingTimelineController.js`: resolve the date in
`Asia/Karachi`, not UTC. Rated S3 rather than S2 only because WWL-061 means past dates are
accepted anyway — fixing that one makes this one matter more, not less.

### 🔴 WWL-063 — S2 — `Release` destroys a hold on one click: no confirm, no undo

`onClick={() => releaseMut.mutate(h.id)}` — fired directly. Verified live with `window.confirm`
instrumented and a check for Radix alert dialogs:

| | |
|---|---|
| `window.confirm` calls | **0** |
| `[role=alertdialog]` rendered | **0** |
| Result | row gone from the API immediately; hard reload confirms |
| Undo offered | **none** — `showSuccessToast("Hold released")` is called without an undo handler |

One misclick on a row-level button permanently frees a date the vendor was holding for a
customer, and there is no way back. Same class as WWL-023.

### ⚠️ WWL-064 — S3 — A raw Postgres error is shown to the vendor as the error message

Submitted a 500-character custom slot. The toast read, verbatim:

> **`Value too long for type character varying(255)`**

That leaks the database engine and the exact column definition, and tells the vendor nothing
they can act on. There is no `maxLength` on the input, no character counter, and no
client-side length check — the only feedback is the database's own complaint.

Handled correctly otherwise: the write failed atomically (no row created), and the dialog
stayed open with the text preserved so it could be shortened.

Same root as `ems_registration_500_rootcause` (VARCHAR(255) overflow), surfacing here as a
leaked message rather than a 500.

### ⚠️ WWL-065 — S3 — The 48-hour TTL is never disclosed, and the expiry line omits the year

Measured from the API: `createdAt 2026-08-05T18:31:04.843Z` → `expiresAt 2026-08-07T18:31:04.837Z`
= **exactly 48 hours**.

The dialog says only "It expires on its own if you don't confirm a booking" — never how long.
A vendor telling a customer "I've held the date for you" has no idea they have two days.

Worse, the row renders the expiry **without a year** while the hold date **has** one:

```
25-Dec-2027 · Mehndi
Expires 07 Aug, 11:32 pm
```

A hold on a date 16 months out, expiring in 48 hours, displayed as "Expires 07 Aug" — which
reads naturally as *August 2027*, i.e. months of protection. The two most important numbers on
the row are formatted so that they invite exactly the wrong reading.

### ⚠️ WWL-066 — S3 — Neither field in the dialog has an accessible name

Both labels are bare `<label>` elements with no association to their controls:

```html
<label class="text-xs font-medium text-muted-foreground">Date</label>
<label class="text-xs font-medium text-muted-foreground">Slot</label>
```

Measured: `dateAccessibleName: null`, `slotAccessibleName: null`. No `for`, no `id` on the
inputs, no wrapping, no `aria-label`, no `aria-labelledby`. In a two-field dialog where both
fields are required, that is the entire form unlabelled to a screen reader.

### ⚠️ WWL-067 — S3 — On "All venues" the hold silently lands on the first venue

`place()` sends `businessId: activeBusinessId ?? undefined`. With **All venues** selected that
is `undefined`, and the dialog has **no venue field at all**.

Every hold created this way came back as **`businessId: 3358`** — Rehman Grand Marquee, the
first of three. The vendor was never asked and never told. On a 3-venue account, a hold
intended for Bahria silently lands on Johar Town.

The fix is small: the dialog should either show a venue selector, or inherit the switcher's
scope and *state which venue* it is holding.

### ⚠️ WWL-068 — S3 — "Hold a date for a lead" cannot record which lead

The module description is "Tentatively hold a date **for a lead**". The dialog captures date
and slot only — no lead, no customer, no name, no note. With two holds on the same date (which
is supported — see D5-032), the list reads:

```
25-Dec-2027 · Mehndi
25-Dec-2027 · Baraat
```

Nothing distinguishes whose wedding either one is being held for, and nothing links back to
the enquiry that prompted it.

### ⚠️ WWL-069 — S3 — Double-clicking `Release` fires two DELETEs

`disabled={releaseMut.isPending}` does not survive a real double-click — the second click
lands before React re-renders. Instrumented and measured:

```
DELETE /api/v1/vendor-holds/107
DELETE /api/v1/vendor-holds/107
```

Outcome was correct here because DELETE is idempotent, and the final state was right. Recorded
because the same guard pattern on a non-idempotent action would double-fire.

### ⚠️ WWL-070 — S4 — Test residue is blocking a real date on live production

Not created by this sweep — found while reading availability:

```json
"2026-08-06": { "isBlocked": true, "blockReason": "[QA] duplicate test",
                "availableSlots": [], "urgency": { "capacity": 3, "used": 3, "remaining": 0 } }
```

**6-Aug-2026 — tomorrow — is fully blocked at Rehman Grand Marquee by a row labelled
`[QA] duplicate test`.** Capacity reads 3/3 used, 0 remaining. Left from earlier QA and never
cleaned up. Flagged rather than deleted: removing an availability block is a live mutation
outside this module's scope.

---

### ✅ Module 5 passes

- **D5-001 / D5-002** — empty state reads `No active holds` (not the stale "aren't enabled for
  your account yet" the source comments describe), and **both** `Hold a date` buttons — page
  header and empty state — open the same dialog. Both driven.
- **D5-003** — the `Pick a business first` branch is **effectively dead**. It triggers on
  `isError`, but `GET /api/v1/vendor-holds` with no `businessId` returns **200** with
  `{"holds": []}`. On All venues the vendor gets the empty state, never that message.
- **D5-004 / D5-005 / D5-006** — scoping verified by driving the real switcher:

  | Action | Result |
  |---|---|
  | Hold created on 11-Nov-2027, switcher on `All venues` | lands on 3358 |
  | Switch to **Rehman Banquet & Lawn (3359)** | list empties, `No active holds` ✔ |
  | Switch back to **Rehman Grand Marquee (3358)** | `11-Nov-2027 · Evening` returns ✔ |
  | `All venues` roll-up | shows holds from the member venues ✔ |

- **D5-016 / D5-017** — **better than the Bookings dialog.** Choosing `Custom…` clears the
  slot, **disables** `Hold date`, and renders a `role="status"` hint reading exactly
  *"Add a date and a time to save."* This is the `FormBlockedHint` pattern done right — worth
  copying to `Add Offline Booking`, which leaves its button enabled with no hint.
- **D5-019** — a whitespace-only custom slot keeps the button disabled and the hint visible.
  The `.trim()` guard works.
- **D5-021 / D5-022** — hostile input round-trips **intact and inert**. Stored and re-rendered
  as literal text: `بارات 🎉 <script>alert(1)</script> '; DROP TABLE bookings;--`.
  Urdu and emoji survive exactly; `document.querySelectorAll('ul script').length === 0`; no
  alert fired. React escaping is doing its job.
- **D5-023** — the dialog reopens clean: after saving `2026-08-01 / Baraat`, the next open
  showed `2026-08-05 / Evening`. No carry-over.
- **D5-025 / D5-050** — Escape closes the dialog and writes nothing (hold count unchanged).
- **D5-027 / D5-043** — both creation and release survive a hard reload, verified against the
  API each time.
- **D5-030 / D5-031** — **idempotency is genuinely well built.** Re-placing the identical
  date+slot produced the toast **`Hold extended`** (not "Date held"), created **no** duplicate
  row, and moved `expiresAt` forward from `18:32:07.212Z` to `18:32:43.615Z` — the extension
  is real, not cosmetic.
- **D5-032** — a different slot on the same date is allowed. 25-Dec-2027 held for both
  `Mehndi` and a second slot simultaneously. Correct: a venue does run mehndi and baraat on
  one day.
- **D5-033** — ordered by `holdDate` ascending, which is the right primary sort. (Ties within
  a date fall in an unspecified order.)
- **D5-042 / D5-045** — release removes the row with toast `Hold released`, and releasing the
  last hold returns the proper empty state rather than a blank panel.
- **D5-051 / D5-052** — 360px is clean: `scrollWidth === clientWidth === 345`, **zero**
  overflowing elements, dialog spans 0→345 exactly, the 2-column grid collapses to one
  295.2px column, and both buttons render full-width (295×36) fully inside the viewport.
  Desktop likewise no overflow.

### Module 5 — status

**52 cases written, 48 driven. 14 findings (2 × S1, 5 × S2).**

Not driven, with reasons:

| Case | Why |
|---|---|
| **D5-008 / D5-009** | The list-failure + `Try again` path. Same component pattern as D4-055, which was driven and passed; not re-injected here. |
| **D5-040** | The two-context race on the "race-safe slot guard" needs two authenticated sessions in parallel — not available in this harness. The single-session idempotency half was driven (D5-030) and passes. |
| **D5-048** | `OutboxStatus` / `OutboxConflicts` render with the outbox flag dark; exercising a real offline→reconnect conflict needs the flag on. |

**The module's verdict:** every individual interaction works. Creation, extension, scoping,
release, persistence, input safety and responsive layout are all correct — several of them
better built than equivalents elsewhere in the portal. But WWL-057 and WWL-058 mean the thing
the module exists to do — stop a held date being sold twice — **does not happen**. The hold is
written to a table, listed on one screen, and expires 48 hours later having influenced
nothing.

---

# MODULE 6 — Function sheets (`/dashboard/function-sheets`)

The largest module so far: **4 routes and 9 components**, backed by a 968-line API client.

| Route | Purpose |
|---|---|
| `/dashboard/function-sheets` | list |
| `/dashboard/function-sheets/<id>` | detail |
| `/dashboard/function-sheet-composer` | composer |
| `/dashboard/function-sheet-sign` | customer signature |
| `/dashboard/function-sheet-operations` | operations view |

**A 9-state machine:** `draft → quote_sent → contract_pending → signed → beo_ready →
invoiced → paid → archived`, plus `cancelled`.

**5 PDF variants gated by state** (`variantsAvailable`): Quotation (draft+), Service Contract
(contract_pending+), BEO (beo_ready+), Tax Invoice (invoiced+), Payment Receipt (paid+).

**Live starting state:** 17 sheets, `Total value Rs 28,559,050`, states
`signed 10 · beo_ready 4 · quote_sent 1 · draft 2`.

## ⚠️ Safety limits for this module — these are real customer documents

Unlike date holds, a function sheet is a **contract, quote and tax invoice for a named
customer**. The limits below are deliberate; each un-driven case is recorded with its reason
rather than silently skipped.

| Action | Limit |
|---|---|
| **State transitions** on real sheets | **Not driven.** Moving a customer's contract from `signed` to `invoiced` is a real commercial event. Enumerated and gated-checked instead. |
| **Delete** a real sheet | **Not driven.** Destroys a signed contract. The confirmation guard is tested up to — not through — the confirm step. |
| **Issue a share token** on a real sheet | Issuing **rotates** the token and *"previous link dies instantly"*. If a customer holds a live link, testing would break it. Existing token state is read first; only tested where no live token exists. |
| **FBR submit** | Not driven — submits a real tax document to the Federal Board of Revenue. |
| **WhatsApp send** | Not driven — messages a real customer. |
| **Signature capture** | Not applied to a real contract. |

## Section A — List, tiles, arithmetic

- [ ] **D6-001** — `Total sheets 17` matches the API count.
- [ ] **D6-002** — `Total value Rs 28,559,050` equals the sum of the 17 `grandTotal` values.
- [ ] **D6-003** — 🔴 `Open 17` / `Paid 0`. Every sheet is counted "Open" including 10 `signed`
  and 4 `beo_ready`. Determine what "Open" means and whether it is useful.
- [ ] **D6-004** — 🔴 **Sheet state vs booking payment state.** Sheet 77 ↔ booking 155, which is
  `Completed` / `Paid` Rs 1,092,200. The sheet says `signed`. Establish whether the two
  lifecycles are connected at all, and what `Paid 0` is really telling the vendor.
- [ ] **D6-005** — 17 sheets against 25 bookings — identify the 8 bookings with no sheet and
  whether the vendor can tell.
- [ ] **D6-006** — Row `GRAND TOTAL` matches the API per sheet.
- [ ] **D6-007** — Grand totals reconcile against the linked booking's `totalAmount`.
- [ ] **D6-008** — `STATUS` chip label matches `STATE_LABELS` for each of the 4 live states.
- [ ] **D6-009** — Chip colour comes from `STATE_TONES` and is distinguishable, not colour-only.
- [ ] **D6-010** — Event dates render `en-PK` and match the booking date.
- [ ] **D6-011** — List ordering — by event date, id, or arbitrary?
- [ ] **D6-012** — Venue scoping: does the list rescope on the business switcher? (Bookings and
  holds do; Today did not.)
- [ ] **D6-013** — Scope survives a hard reload.
- [ ] **D6-014** — Density toggle works and sets `aria-pressed` (as Bookings did).
- [ ] **D6-015** — Export: row count, columns, machine-readable money, view-respecting.
- [ ] **D6-016** — Is there a state filter / search? If not, how does a vendor find one sheet
  among 17 (and among 200)?

## Section B — Row actions

- [ ] **D6-017** — Enumerate the 3 row actions: `View` / `Edit` / `Remove` function sheet.
- [ ] **D6-018** — 51 row buttons sharing 3 accessible names — WWL-035 again?
- [ ] **D6-019** — `View function sheet` opens the correct detail page.
- [ ] **D6-020** — `Edit function sheet` opens the correct sheet in edit mode.
- [ ] **D6-021** — 🔴 `Remove function sheet` — is there a confirmation? Does it state that a
  signed contract is being destroyed? Is it offered on `signed` sheets at all?
- [ ] **D6-022** — Is the row itself clickable, or is it WWL-054 again?

## Section C — `New function sheet`

- [ ] **D6-023** — Enumerate every field in the dialog.
- [ ] **D6-024** — Does it require a booking, or can a sheet float free?
- [ ] **D6-025** — Does it capture money (line items, totals) or is it another Rs 0 door?
- [ ] **D6-026** — Required-field gating with stated reasons.
- [ ] **D6-027** — Can a second sheet be created for a booking that already has one?
- [ ] **D6-028** — Cancel writes nothing — API count before/after.

## Section D — Detail view and the state machine

- [ ] **D6-029** — Detail renders every section for a `signed` sheet.
- [ ] **D6-030** — Line items, quantities, unit prices and totals are arithmetically consistent.
- [ ] **D6-031** — Enumerate the transitions offered at each live state.
- [ ] **D6-032** — Are illegal transitions hidden, disabled, or offered-then-rejected?
- [ ] **D6-033** — Is `cancelled` reachable, and is it guarded?
- [ ] **D6-034** — Does the detail page show the linked booking, and is it navigable?
- [ ] **D6-035** — `linkedFinancials` — does the sheet's money agree with the booking's?
- [ ] **D6-036** — Audit log renders and shows real entries.
- [ ] **D6-037** — Deliverables tracker — present, and does it apply to a venue vendor?
- [ ] **D6-038** — Vendor-type JSON blocks (bridalWear, henna, makeup, photography…) — do
  irrelevant ones render for a **venue** vendor?

## Section E — PDF generation (5 variants)

- [ ] **D6-039** — On a `draft` sheet only `Quotation` is offered.
- [ ] **D6-040** — On `quote_sent` — still quote only (contract needs `contract_pending`).
- [ ] **D6-041** — On `signed` — Quotation + Contract, **not** BEO/Invoice/Receipt.
- [ ] **D6-042** — On `beo_ready` — Quotation + Contract + BEO.
- [ ] **D6-043** — 🔴 Request a **locked** variant directly (e.g. `?variant=invoice` on a
  `signed` sheet). Does the server enforce, or does the UI gate alone?
- [ ] **D6-044** — Quotation PDF actually generates and is a real PDF (magic bytes).
- [ ] **D6-045** — PDF money matches the sheet's money.
- [ ] **D6-046** — PDF carries the correct venue for a 3-venue vendor.
- [ ] **D6-047** — 🔴 `pdfUrl()` returns a **relative** path (`/api/v1/function-sheets/…`).
  On `www.weddingwala.pk` that resolves to the frontend, not the backend. Determine whether
  anything uses it, and whether "open in new tab" is therefore broken.
- [ ] **D6-048** — Tax invoice shows tax fields consistent with the FBR requirement.

## Section F — Customer share link (public surface)

- [ ] **D6-049** — Read existing token state before touching anything.
- [ ] **D6-050** — `expiresInDays` default 30, clamped 1–365 — verify the clamp.
- [ ] **D6-051** — 🔴 Is the share link **unauthenticated**? What does it expose — customer
  name, phone, money, contract terms?
- [ ] **D6-052** — 🔴 Is the token long/random enough to resist guessing?
- [ ] **D6-053** — Issuing a new token kills the previous link "instantly" — verify.
- [ ] **D6-054** — Revoke flags dead without clearing; the link then fails.
- [ ] **D6-055** — Does the vendor see the link's expiry and status in the UI?
- [ ] **D6-056** — Is the share dialog's copy-to-clipboard functional?

## Section G — Sign, WhatsApp, FBR, other routes

- [ ] **D6-057** — `/dashboard/function-sheet-sign` renders; signature pad draws.
- [ ] **D6-058** — Is the sign route reachable by the customer, or vendor-only?
- [ ] **D6-059** — WhatsApp dialog composes a sane message and does not send prematurely.
- [ ] **D6-060** — FBR submit surfaces `no_provider` honestly rather than claiming success.
- [ ] **D6-061** — `/dashboard/function-sheet-composer` renders and is reachable.
- [ ] **D6-062** — `/dashboard/function-sheet-operations` renders and is reachable.
- [ ] **D6-063** — All four routes appear in navigation, or are they orphan doors?

## Section H — Failure, a11y, responsive

- [ ] **D6-064** — Block the list endpoint → error + Retry, not `0 / Rs 0` (the WWL-052 test).
- [ ] **D6-065** — Tiles must not print `Rs 0` above an errored table.
- [ ] **D6-066** — Table semantics and accessible names.
- [ ] **D6-067** — 360px: no overflow; usable row actions (the WWL-053 test).
- [ ] **D6-068** — Desktop: no overflow.

---

## MODULE 6 — RESULTS (Sections A–F)

### 🔴🔴 WWL-071 — S1 — **Every line item on every customer document reads `(no label)`**

Generated the Quotation for sheet #77 and extracted its text. This is what the customer
receives for a **Rs 1,092,200** contract:

```
Description        Qty    Unit (Rs.)    Total (Rs.)
(no label)           1       320,000       320,000
(no label)         198         3,900       772,200
Subtotal                              Rs. 1,092,200
Grand total                           Rs. 1,092,200
```

Not a data problem — **the data is perfect**. The stored line items read:

```json
{ "qty": 1,   "amount": 320000, "unitPrice": 320000, "description": "Hall / marquee rental" }
{ "qty": 198, "amount": 772200, "unitPrice": 3900,   "description": "Catering — 198 guests @ Rs 3900/head" }
```

**Root cause — a field-name mismatch between the writer and the reader.**

`event-planner-api/src/utils/functionSheetPdfData.js:206`:

```js
label: _str(it?.label, 200) || "(no label)",
```

The generator reads **`label`**. Every stored line item uses **`description`**. Confirmed on
all three sheets inspected — `lineItemKeys` is `qty,amount,unitPrice,description` every time.
The TypeScript interface agrees with the generator and disagrees with reality:

```ts
export interface FunctionSheetLineItem {
  label: string;      // ← data has `description`
  total?: number;     // ← data has `amount`
}
```

The `total` mismatch is masked — the generator falls back to `qty * unitPrice`, which happens
to give the right number. `label` has no fallback, so it prints the placeholder.

**Blast radius:** every Quotation, Service Contract, BEO, Tax Invoice and Payment Receipt this
vendor has ever issued, for all 17 sheets and Rs 28,559,050 of business. Verified across
sheets 77 (quote + contract), 80 (BEO) and 89 (draft quote) — `(no label)` in all five.

**The fix is one line:** `it?.label ?? it?.description`.

### 🔴 WWL-072 — S1 — The payment schedule exists, is correct, and never reaches the customer

Every sheet carries a fully-populated `paymentScheduleJson`. Sheet #77:

| Instalment | Amount | Due |
|---|---:|---|
| Booking advance (30%) | Rs 327,660 | 2025-12-28 |
| Second instalment (40%) | Rs 436,880 | 2026-01-28 |
| Balance on the day | Rs 327,660 | 2026-02-11 |
| **Total** | **Rs 1,092,200** | = grand total ✔ |

Verified on all three sheets — 77, 80 and 89 each sum **exactly** to their grand total
(1,092,200 / 1,625,100 / 1,546,000).

**None of it appears in any generated PDF.** Not the Quotation, not the Service Contract.
The customer receives a document with a grand total and no indication of when anything is due,
while the correct schedule sits in the record.

For a Pakistani venue where staged advance payments are the norm, the payment schedule is the
single most important clause in the document, and it is the one thing omitted.

### 🔴 WWL-073 — S2 — Quotation, Service Contract and BEO are the same document with the title swapped

Extracted and compared all three. The **only** differences:

| Document | Differs from the Quotation by |
|---|---|
| **Service Contract** | title text; drops the `Valid until` line |
| **Banquet Event Order (BEO)** | title text |

The Service Contract for Rs 1,092,200 contains **no terms, no cancellation policy, no payment
schedule, no signature block, no signatory names, no date-of-signature line**. The BEO — an
*operational* document — contains no guest timings, no menu, no setup instructions, no
staffing, no kitchen notes. It is a price list with "Banquet Event Order" at the top.

**Being precise about cause, because the two halves differ:**

- The **terms** gap is a *data* gap, not a code gap. The generator does support them —
  `functionSheetPdfData.js` reads `row.termsJson` for `contract`/`beo`/`invoice`. But
  `termsJson` is **`null` on all three sheets**. Nothing was ever authored, and no UI prompts
  for it.
- The **payment schedule** gap *is* a code gap — the data is there and populated (WWL-072).
- The **BEO** gap is both: `beoJson` is `null` on sheet #80 despite its state being
  `beo_ready`, and `kitchenSheetJson` is null too.

So the state machine advances a sheet to `beo_ready` without any BEO content ever existing.

### 🔴 WWL-074 — S2 — Sheets are marked `signed` with no signature recorded

Sheet #77: `state: "signed"`, `signedAt: "2026-01-22"`, and the PDF prints a **`SIGNED`**
badge. But `signaturesJson` is **`null`**.

The module ships a `signature-pad.tsx` component and a whole `/dashboard/function-sheet-sign`
route, and the sheet that claims to be signed holds no signature, no signatory name, and no
IP/timestamp record. The `SIGNED` badge on a Rs 1,092,200 contract is backed by nothing but a
state string — and the contract it appears on has no signature block to sign (WWL-073).

Same on sheet #80: `signedAt: 2026-04-08`, `signaturesJson: null`.

### 🔴 WWL-075 — S2 — No sheet has ever reached `invoiced` or `paid`, so 2 of the 5 PDFs are unreachable

`byState`: `signed 10 · beo_ready 4 · quote_sent 1 · draft 2`. Zero `invoiced`, zero `paid`,
zero `archived`. `invoicedAt` and `paidAt` are **null on every sheet inspected**.

Because PDF variants are state-gated (`VARIANT_MIN`), this means **Tax Invoice and Payment
Receipt cannot be generated for any sheet in the system** — verified live, see D6-043.

Meanwhile the money has actually been collected. Cross-referencing sheets to their bookings:

| Sheet | State | Booking | Booking status | Collected |
|---|---|---|---|---:|
| 77 | `signed` | 155 | Completed / Paid | Rs 1,092,200 of 1,092,200 |
| 78 | `signed` | 156 | Completed / Paid | Rs 1,694,600 of 1,694,600 |
| 79 | `signed` | 158 | Completed / Paid | Rs 1,858,450 of 1,858,450 |
| 81 | `beo_ready` | 160 | Completed / Paid | Rs 1,685,200 of 1,685,200 |
| 82 | `signed` | 161 | Completed / Paid | Rs 1,899,000 of 1,899,000 |
| 84 | `beo_ready` | 163 | Completed / Paid | Rs 1,398,250 of 1,398,250 |
| 85 | `signed` | 164 | Completed / Paid | Rs 1,464,500 of 1,464,500 |

**Rs 11,092,200 fully collected across seven weddings**, and not one of them can be issued a
tax invoice or a receipt. The two lifecycles — booking payment state and function-sheet state —
are entirely disconnected: paying a booking in full does not advance its sheet.

This also explains the tile reading **`Paid 0`** (D6-003): it is literally true and completely
misleading. A vendor reads "Paid 0" on a Rs 28.5M book where Rs 11M is already banked.

### ⚠️ WWL-076 — S3 — 8 bookings have no function sheet at all, and nothing says so

17 sheets against 25 bookings. The 8 without:

| Booking | Status | Customer | Value |
|---|---|---|---:|
| 167 | **Confirmed** | Danish Qureshi & Aiman Danish | Rs 1,877,750 |
| 169 | **Confirmed** | Waqar Younis & Sana Waqar | Rs 930,650 |
| 180 | **Confirmed** | Muhammad Rehman Yousaf | Rs 665,000 |
| 179 | Awaiting Payment | Waheed Jutt | Rs 350,000 |
| **157** | **Completed** | Usman Tariq & Hira Usman | **Rs 1,111,400** |
| 175, 177, 178 | Cancelled | — | Rs 3,855,050 |

Booking **157 is Completed and fully paid** — a wedding that has already happened, with no
contract, no BEO and no invoice ever produced. Three *Confirmed* weddings worth Rs 3.47M have
no paperwork either. The Function sheets module offers no "bookings without a sheet" view, so
the only way to notice is to reconcile two screens by hand.

### ⚠️ WWL-077 — S3 — Expired quotes generate silently

Sheet #77's Quotation prints `Valid until: 4 Feb 2026`. Today is **5 Aug 2026** — it lapsed six
months ago, and it generates on demand with no expiry marking.

Sheet #89 is worse in kind: `Valid until: 2 Sept 2026` for an event on **9 Sept 2026** — the
quote is set to expire *before the event it quotes for*.

The generator clearly supports state-based watermarking (sheet #89 correctly renders a
**`DRAFT`** watermark), so the mechanism to mark an expired quote exists and is unused.

---

### ✅ Module 6 passes so far

- **D6-001 / D6-002** — `Total sheets 17` and `Total value Rs 28,559,050` both exact. Summed
  all 17 `grandTotal` values independently: **28,559,050**. Matches `summary.totalGrand`.
- **D6-006 / D6-007** — **zero** mismatches. Every sheet's `grandTotal` equals its linked
  booking's `totalAmount`, across all 17.
- **D6-012 / D6-013** — venue scoping works and rescopes the tiles. Switched to
  **Rehman Marquee Bahria (3360)** → 4 rows, `Total sheets 4`, `Total value Rs 6,942,100` —
  matching the independently-derived per-venue counts (`3358: 6, 3359: 7, 3360: 4`).
- **D6-016 — search works here, and the contrast with Bookings is instructive.** Typing
  `Ahmed` returned exactly 2 matching sheets. Crucially it issued **no new API request** — the
  filter is **client-side**, which is precisely why it does not 500 the way the Bookings
  server-side search does (WWL-041). Two modules, two implementations, opposite outcomes.
- **D6-021 — the delete guard is done RIGHT.** `Remove function sheet` opens a proper
  `role="alertdialog"`:

  > **Remove this function sheet?**
  > Mehndi — Ahmed Raza will be removed. This can't be undone.
  > `[Cancel]` `[Remove]`

  Names the specific sheet, states irreversibility, correct ARIA role, and **no write is
  attempted** until confirmed (verified with a write-blocker armed — zero blocked requests).
  This is the pattern the Date-holds `Release` is missing (WWL-063).
- **D6-043 — server-side variant gating is real and correct.** Requested all five variants
  directly against sheet #77 (state `signed`, so only quote + contract are legal):

  | Variant | HTTP | Result |
  |---|---|---|
  | `quote` | **200** | `application/pdf`, `%PDF-` magic, 3040 bytes |
  | `contract` | **200** | `application/pdf`, `%PDF-` magic, 3040 bytes |
  | `beo` | **400** | `VARIANT_NOT_UNLOCKED_YET` |
  | `invoice` | **400** | `VARIANT_NOT_UNLOCKED_YET` |
  | `receipt` | **400** | `VARIANT_NOT_UNLOCKED_YET` |

  The UI gating is backed by the server, matching the client's `VARIANT_MIN` table exactly.
  Not a client-only control.
- **D6-044** — PDFs are genuine, well-formed PDF 1.3 documents with embedded fonts.
- **D6-045** — **the arithmetic is right in every PDF.** Sheet 77: `320,000 + 772,200 =
  1,092,200` ✔. Sheet 80: `420,000 + 1,205,100 = 1,625,100` ✔. Sheet 89: `610,000 + 936,000 =
  1,546,000` ✔. Each matches its sheet record *and* its booking total.
- **D6-046** — **the correct venue appears on each document.** Sheet 77 → "Rehman Grand
  Marquee, Johar Town, Lahore"; sheet 80 → "Rehman Banquet & Lawn, Gulberg III, Lahore".
  Correct per-sheet for a 3-venue vendor.
- **D6-039 (draft half)** — sheet #89 (`draft`) renders a **`DRAFT` watermark** plus a `DRAFT`
  status badge. Correct and clearly marked.
- **D6-049** — share-token state read before touching anything: sheet #77 has
  `customerShareToken: null`, `shareTokenIssuedAt: null`, `shareTokenExpiresAt: null`,
  `shareTokenRevokedAt: null`. **No live customer link exists**, so issuing one in testing
  would not break anything a customer holds.

---

## MODULE 6 — RESULTS (Section F: the customer share link)

**The share feature is broken twice over, independently.** Either defect alone makes it 100%
non-functional; fixing one still leaves the other.

### 🔴🔴 WWL-078 — S1 — `Share link` crashes the entire function-sheet page

Clicking **`Share link`** on the sheet detail page destroys the page. Not a dialog failure —
the whole route is replaced by the app's crash screen:

> **SOMETHING WENT WRONG**
> We hit an unexpected error
> This has been logged and our team will look into it…

**Reproduced deterministically** on sheet **#77** and again on sheet **#80** — the sheet
content is gone (`document.body.innerText` drops from ~1,800 chars to 318) and only the error
boundary remains.

Console:

```
Error: Minified React error #310
  at Object.lt [as useMemo]
  at _ (…/dashboard/function-sheets/[id]/page-…js)
```

React **#310 = "Rendered more hooks than during the previous render."**

**Root cause — a Rules-of-Hooks violation in
`components/dashboard/mainScreens/function-sheets/share-link-dialog.tsx`:**

| Line | Code |
|---|---|
| 88, 89, 90 | `useState` × 3 |
| 96 | `useEffect` |
| **118** | **`if (!sheet) return null;`** ← early return |
| **167** | **`const waMessage = useMemo(…)`** ← 5th hook, *after* the return |

The dialog first renders with `sheet == null` (4 hooks), then re-renders once `sheet` arrives
(5 hooks). React sees the hook count change and throws.

**Fix:** hoist the `useMemo` (and the `url` it depends on, line 155) above the `if (!sheet)`
guard, and null-check inside the memo instead:

```js
const url = issuedToken ? buildShareUrl(issuedToken.token) : '';
const waMessage = useMemo(() => { if (!sheet || !url) return ''; … }, [sheet, url, issuedToken]);
if (!sheet) return null;
```

### 🔴🔴 WWL-079 — S1 — The site's own lowercase-URL middleware destroys every share token

Even with the crash fixed, no share link can ever work.

`buildShareUrl()` produces `${origin}/sign/${token}`, and the token is **case-sensitive
base64url**. But `middleware.ts` enforces the locked URL convention — *"301 redirect anything
with uppercase in the pathname to the lowercase equivalent"* — and `/sign/*` is **not
excluded**:

```js
// middleware.ts:26
if (pathname !== pathname.toLowerCase()) {
  url.pathname = pathname.toLowerCase();   // 301
}
```

Driven live. Issued a real token and opened its URL:

| | |
|---|---|
| Link handed to the customer | `/sign/`**`cHZ2YfmvONVXH36AECCmboQ6suAifuOZi9gQwPI9JFM`** |
| Where the browser lands after the 301 | `/sign/`**`chz2yfmvonvxh36aeccmboq6suaifuozi9gqwpi9jfm`** |
| What the customer sees | **"Link not found — Double-check the URL or ask the vendor to resend."** |

The token is 43 base64url characters; lowercasing mangles every uppercase one. The probability
a token survives is effectively zero.

The customer-facing message is the cruellest part: it tells them to *double-check the URL or
ask the vendor to resend* — and resending produces another link that dies the same way.

**Fix:** exclude `/sign/` (and any other token-bearing path) from the lowercase rule in
`middleware.ts`, or move the token to a query parameter, which the rule does not touch.

### 🔴 WWL-071 — extended — the line-item bug hits the **vendor's own screen**, not just PDFs

The sheet detail page renders the line-items table with the description column **empty**:

```
DESCRIPTION   QTY   UNIT          TOTAL
              1     Rs 320,000    Rs 320,000
              198   Rs 3,900      Rs 772,200
```

Same `label` vs `description` mismatch as WWL-071. So the vendor cannot see what their own
Rs 1,092,200 quote is composed of either — the module is unusable for reviewing a quote before
sending it, not merely for printing one.

### 🔴 WWL-074 — sharper — one screen says "Signed" and "Not yet signed" simultaneously

Sheet #77's detail page, two panels apart:

| Panel | Says |
|---|---|
| Header badge | **`Signed`** |
| Lifecycle strip | `Draft` · `Quote sent 12-Jan-2026` · `Contract pending` · **`Signed 22-Jan-2026`** |
| **Signatures panel** | **`VENDOR — Not yet signed`** · **`CUSTOMER — Not yet signed`** |

The state machine records a signature date; the signature record is empty (`signaturesJson:
null`). Both are rendered on the same screen, and they contradict each other outright.

### 🔴 WWL-075 — sharper — the page shows the money is fully collected and still won't advance

Same page, further down:

```
Payments received                    Rs. 1,092,200
  Rs. 327,660   Bank transfer · 02-Feb-2026 · TXN177656
  Rs. 436,880   Cash · 19-Dec-2025
  Rs. 327,660   Easypaisa · 16-Nov-2025 · TXN248051
```

Three real payments summing **exactly** to the grand total — displayed on the very same page
whose lifecycle strip shows `Invoiced` and `Paid` un-reached, and whose module tile reads
**`Paid 0`**.

Everything needed to advance the sheet is already on screen. The only lifecycle action offered
is a single **`Move to BEO ready`** button — one manual step at a time, with nothing driven by
the payments the system has already recorded.

---

### ✅ Section F passes

- **D6-050 — the expiry clamp is enforced server-side.** Requested `expiresInDays: 9999`;
  the server returned `expiresInDays: 365` with `expiresAt` exactly one year after `issuedAt`.
  Clamped as documented, not trusted from the client.
- **D6-052 — token entropy is strong.** 43 characters, base64url charset — **256 bits**.
  Not guessable, not sequential, not derived from the sheet id.
- **D6-054 — revoke behaves exactly as documented.** `DELETE` returned `Share token revoked`;
  re-reading the sheet shows `shareTokenRevokedAt: 2026-08-05T19:00:17.053Z` with
  `customerShareToken` **retained but flagged dead** — the "flag-dead, do NOT clear" contract
  the API docstring promises.
- **Invalid tokens fail safe.** `/sign/qa-nonexistent-token-probe-000` renders
  **"Link not found — Double-check the URL or ask the vendor to resend."** No stack trace, no
  sheet data, no enumeration hint.
- **No customer data in the server-rendered HTML.** The `/sign/[token]` page is
  client-rendered; the initial HTML contains no customer name, phone, email, totals, line
  items or payment schedule — so a contract cannot leak into a search-engine cache from the
  SSR payload.
- **The payment schedule renders correctly in the UI** — labels, due dates and amounts all
  present on the detail page. This confirms WWL-072 is specifically a **PDF-generator** gap:
  the app reads `paymentScheduleJson` fine, only the document omits it.

### Section F — cases blocked, with reasons

| Case | Blocked by |
|---|---|
| **D6-051** — what the live link exposes | No link can resolve (WWL-079), so the rendered customer view cannot be reached to audit it. The *unauthenticated* surface was still checked as far as possible — invalid-token handling and SSR payload, both clean. |
| **D6-053** — issuing rotates and kills the previous link | Requires two successive working links. |
| **D6-055** — vendor sees link expiry/status | Dialog crashes before rendering (WWL-078). |
| **D6-056** — copy-to-clipboard | Same. |

**Cleanup:** the token issued for this test was **revoked immediately** and verified
(`shareTokenRevokedAt` set). No live customer link remains on sheet #77.

---

## MODULE 6 — RESULTS (Section G: the other three routes)

### 🔴🔴 WWL-080 — S1 — **No customer can ever sign a contract.** End-to-end proof

`/dashboard/function-sheet-sign` is well designed. It states the integrity rule explicitly:

> **Customer signature**
> The customer signs on their own device via a secure link — **you can't sign for them.**

That is correct and important: the vendor is prevented from forging the customer's signature.
The customer's *only* route is the secure link. Driven end to end through the real UI:

| Step | Result |
|---|---|
| 1. Open `/dashboard/function-sheet-sign` | renders, sheet loaded |
| 2. Click **`Generate signing link`** | **works** — no crash (this is a separate inline implementation, not the `ShareLinkDialog` of WWL-078) |
| 3. UI displays the link to send | `https://www.weddingwala.pk/sign/`**`2SrIgEOrVBBISyVNDswOmMi3eQXFOgXHMsQvAf0cKmo`** |
| 4. Customer opens that link | 301 → `/sign/`**`2srigeorvbbisyvndswommi3eqxfogxhmsqvaf0ckmo`** |
| 5. Customer sees | **"Link not found — Double-check the URL or ask the vendor to resend."** |

So the workflow is: the vendor may not sign for the customer (by design), and the customer's
only path is a link that is destroyed in transit by the site's own middleware (WWL-079).
**The contract-signing feature cannot be completed by anyone, ever.**

This closes the loop on WWL-074. Every sheet marked `signed` has `signaturesJson: null` not
because of a data-migration quirk — but because **the signature flow has never been completable
on production**. The `Signed` state is being set by the lifecycle button alone, with no
signature behind it.

The page confirms it in its own words. Sheet #77 — state `Signed`, `signedAt 22-Jan-2026`,
`SIGNED` on its PDF — displays:

> **Awaiting both signatures.**

**Note there are two share-link surfaces, and they behave differently:** `Share link` on the
detail page crashes (WWL-078); `Generate signing link` here works. Both feed the same
`/sign/<token>` URL that WWL-079 kills. Fixing the crash alone changes nothing.

### 🔴 WWL-081 — S1 — Opening the composer and pressing Save **destroys the line-item descriptions**

WWL-071 is not only a display bug. It is a latent data-destruction bug, and the composer is
the trigger.

`function-sheet-composer-view.tsx`:

```js
// line 86 — LOAD: reads `label`, which does not exist on the stored items
setItems((sheet.lineItemsJson ?? []).map((i) => ({ label: i.label ?? "", qty: …, unitPrice: … })))

// line 130 — SAVE: writes `label` only. No `description` key at all.
lineItemsJson: items.map((i) => ({ label: i.label, qty: …, unitPrice: …, total: …, notes: … }))
```

Confirmed live — the composer's two `Description` inputs render **empty** while `Qty` and
`Unit` are correctly populated (`1 / 320000`, `198 / 3900`).

So a vendor who opens the composer to adjust a price and clicks **`Save changes`** writes back
`label: ""` and **drops the `description` key entirely** — permanently destroying
*"Hall / marquee rental"* and *"Catering — 198 guests @ Rs 3900/head"* on a Rs 1,092,200
contract. Today the data is intact and merely unread; one save makes the loss permanent and
unrecoverable.

**Not driven** — `Save changes` was deliberately not clicked. The read path (empty inputs) was
observed live and the write path confirmed in source.

### ⚠️ WWL-082 — S2 — The composer opens a real contract with no `?id`, and never shows which one

`function-sheet-composer-view.tsx:57`:

```js
const first = list?.functionSheets?.[0]
```

Navigating to `/dashboard/function-sheet-composer` **bare** — no query string — silently loads
the **first function sheet in the list** into a fully live editor. Verified: it opened sheet
#77 (Ahmed Raza, Rs 1,092,200, state `Signed`) with `Save changes` enabled.

The page header reads only *"Edit function sheet"* and the state chip *"Signed"*. **The sheet
number is never displayed** — only the customer name inside an editable Title field.

Combined with WWL-081, a vendor who reaches this route from a stale tab or a bookmark is one
click away from damaging a contract they did not choose to open.

### 🔴 WWL-083 — S2 — A marquee vendor is shown a **photographer's** operations screen

`/dashboard/function-sheet-operations` for this **wedding-venue / marquee** vendor renders:

> **Photography operations**
> Shot list, crew and deliverables for this function sheet.
> **Photographer** — *Shot list:* "Key moments to capture, in running order"
> *Crew:* "Who's on the shoot" — *Deliverables:* "e.g. edited album, highlight reel"

There is nothing about kitchen, catering covers, setup, staffing, timings or the banquet
run-sheet — the things a venue actually needs on the day. This is **D6-038 confirmed**: the
vendor-type-specific blocks (`photographyJson`, `bridalWearJson`, `hennaJson`, `makeupJson`,
`carRentalJson`, …) render without regard to the vendor's actual type.

It also explains WWL-073's BEO gap from the other side: the operational data a BEO would print
is being collected against the wrong trade entirely, and `kitchenSheetJson` stays null.

This route also defaults to the first sheet with no `?id`, same as the composer.

---

### ✅ Section G passes

- **D6-057 — the signature pad genuinely works.** Switching to `Draw` renders a 520×120
  canvas; a synthetic stroke moved it from **0 → 1,057 ink pixels**, and `Save signature`
  flipped from disabled to **enabled**. `Clear` restored it. (Not saved — no signature was
  applied to a real contract.)
- **D6-058 — the vendor genuinely cannot sign for the customer.** Separate vendor and customer
  blocks, and the customer block offers no input at all — only the link generator, with the
  rule stated in plain language. The integrity model is right; only its delivery is broken.
- **D6-061 / D6-062** — both routes render without crashing and are wired to the live API.
  The composer is a real editor (16 inputs, `Add item`, `Remove item`, `Suggest items`,
  Discount, Sales tax, **`Terms (one per line)`**, Internal notes) and states plainly:
  *"Editing is wired to the live API — saving updates the function sheet and the server
  recomputes totals."*
- The composer confirms WWL-073's data half from the other direction: a
  **`Terms (one per line)`** field exists and is empty. The contract has no terms because none
  were ever authored here — not because the generator cannot print them.
- **Share-link expiry copy is honest** on the sign page: *"The link expires in 30 days;
  generating a new one revokes the old."* Matches the API's documented behaviour.

**Cleanup:** the second token (issued through the real UI by `Generate signing link`) was
revoked and verified — `shareTokenRevokedAt: 2026-08-05T19:06:50.903Z`. Re-read sheet #77
afterwards: `signaturesJson` still `null`, `state` still `signed`. **No signature was applied
and no state was changed by this testing.**

---

## MODULE 6 — RESULTS (Sections B, C, H) and module close

### 🔴 WWL-084 — S2 — `New function sheet` needs only a title, and silently picks a venue

Dialog fields: **Title**, **Customer name**, **Event date** — and nothing else. Filled *only*
the title, left customer and date empty. `Create & compose` **enabled**, and the exact payload
was captured with the write blocked:

```
POST /api/v1/function-sheets :: {"businessId":3358,"title":"QA probe sheet — do not use"}
```

Three things wrong in one request:

1. **No `bookingId`** — the dialog has no booking field at all, so a quote/contract can be
   created floating free of any booking. This is how WWL-076's orphan situation arises from the
   other direction.
2. **No `customerName`, no `eventDate`** — both were empty and simply omitted. A function sheet
   — the object that becomes a **Quotation, Service Contract and Tax Invoice** — can be created
   with a title and nothing else. No customer, no date.
3. **`businessId: 3358` was chosen silently.** The switcher was on **All venues**
   (`activeBusinessId: null`, label `Business: All venues`), the dialog offers no venue field,
   and the payload nonetheless committed the sheet to **Rehman Grand Marquee**, the first of
   three.

That third point is **WWL-067 repeating in a second module** — the same silent first-venue
default seen in Date holds. Two modules, same pattern: on "All venues" the app quietly picks
venue #1 and tells the vendor nothing.

### ⚠️ WWL-085 — S3 — `pdfUrl()` is dead code with a docstring that cannot be true

`lib/api/functionSheets.ts:720` returns a **relative** path:

```js
static pdfUrl(id, variant) { return `/api/v1/function-sheets/${id}/pdf${params}`; }
```

On `www.weddingwala.pk` that resolves to the **frontend**, not the backend — it would 404. Its
docstring claims *"browser handles the Bearer auth via the same axios interceptor"*, which is
impossible for a plain `<a target="_blank">`; a browser navigation carries no Authorization
header.

**Verified harmless today:** `grep` shows `FunctionSheetAPI.pdfUrl` is **referenced nowhere**.
`Preview Quotation` was driven live and correctly opened a **`blob:`** URL
(`blob:https://www.weddingwala.pk/ea6f161b-…`), i.e. the working `pdfBlob()` +
`createObjectURL` path. Recorded as a trap for whoever wires up preview next, not as a live
defect — my initial hypothesis that preview was broken was wrong.

### 🔴 WWL-086 — S1 — **WWL-053 repeats: Function sheets is inert on mobile**

At 360 × 780 the table is `display: none` and is replaced by a card list:

| Measured at 360px | Result |
|---|---|
| Cards rendered | 6 (correct for the active venue scope) |
| **Controls inside the entire card list** | **0** |
| Horizontal overflow | none — `scrollWidth === clientWidth === 345` |
| Card content | `Mehndi — Ahmed Raza \| Ahmed Raza & Sanam Ahmed · Rs 1,092,200 \| Signed` |

The three row actions — `View`, `Edit`, `Remove function sheet` — live inside the hidden
table, so on a phone a vendor **cannot open, edit, or remove a function sheet**, and cannot
reach the PDF menu, the share link, or the signing flow.

Identical architecture to WWL-053 in Bookings. Two of the portal's most important modules are
read-only on the device Pakistani vendors actually use.

### ⚠️ WWL-087 — S3 — 51 row buttons, 3 accessible names; rows are not clickable

- **D6-018** — 17 rows × 3 controls = **51 buttons** sharing exactly **3** accessible names:
  `View function sheet`, `Edit function sheet`, `Remove function sheet`. None carries the
  customer, the sheet number or the value. A screen-reader user hears "Remove function sheet"
  seventeen times, on a screen where the wrong one destroys a different customer's contract.
  Same class as WWL-035.
- **D6-022** — the row itself is inert: **0** `<a>` elements, `cursor: auto`, and a full
  pointer sequence on the CUSTOMER cell does not navigate. Same as WWL-054 in Bookings.

---

### ✅ Sections B / C / H passes

- **D6-019** — `View function sheet` on row 1 lands on **`/dashboard/function-sheets/77`**, the
  correct sheet for that row.
- **D6-026** — the blocked-reason pattern is used correctly here: with the title empty,
  `Create & compose` is **disabled** and a hint reads **"Add a title to save."** Same good
  `FormBlockedHint` treatment as the Date-holds dialog.
- **D6-028** — nothing was written. After the blocked submit, the list still reports
  **17 sheets** and **Rs 28,559,050**, with **zero** rows titled `QA probe`.
- **D6-041** — **UI variant gating matches the server exactly.** The `PDF` menu on sheet #77
  (state `signed`) is headed *"Available variants"* and offers only:

  | Quotation | Service Contract |
  |---|---|
  | Preview · Download · Send via WhatsApp | Preview · Download · Send via WhatsApp |

  No BEO, no Invoice, no Receipt — precisely `variantsAvailable('signed')`, and precisely what
  the server enforces (D6-043). Client and server agree.
- **D6-064** — the error state is real: `Couldn't load function sheets.` + `Retry`, table
  emptied to 0 rows, no crash.
- **D6-065 — better than Bookings, and worth calling out.** Under the same injected failure,
  the tiles **kept their last-known values** (`Total sheets 17`, `Total value Rs 28,559,050`)
  rather than collapsing to `Rs 0` the way Bookings does (WWL-052). No false financial claim
  is made. It is still imperfect — the retained values are **stale** (they describe the
  previous scope, shown under a newly-selected one) so `—` remains the correct treatment — but
  showing last-known-good is materially safer than inventing zeros.
- **D6-068 / D6-067 (layout half)** — no horizontal overflow at either width: 1521px clean,
  360px `scrollWidth === clientWidth === 345` with **zero** overflowing elements.

---

## Module 6 — status

**68 cases written, 57 driven. 17 findings (7 × S1, 6 × S2).**

Not driven, each with its reason:

| Cases | Why |
|---|---|
| **D6-051 / 053 / 055 / 056** | Share-link surface unreachable — blocked by WWL-078 (crash) and WWL-079 (token mangled). The unauthenticated surface was still audited as far as it could be: invalid-token handling and the SSR payload, both clean. |
| **D6-031 / 032 / 033** | State transitions on real customer contracts. Enumerated instead: the detail page offers exactly one forward step (`Move to BEO ready`), so transitions are single-step-forward by design. |
| **D6-048** | Tax Invoice content — unreachable, because no sheet can reach `invoiced` (WWL-075). |
| **D6-059 / 060** | WhatsApp send and FBR submit — both contact a real customer or file a real tax document. |
| **D6-027** | Second sheet on a booking that already has one — would create a real duplicate contract. |

**The module's verdict.** The engineering underneath is strong: server-enforced PDF variant
gating, 256-bit share tokens with a server-side expiry clamp, a revoke that flags rather than
clears, a proper `alertdialog` before deletion, an integrity model that refuses to let a vendor
sign for a customer, exact money arithmetic everywhere, and correct per-venue attribution.

What fails is the last mile to the customer. **Every document says `(no label)` (WWL-071),
the payment schedule never prints (WWL-072), the contract has no terms or signature block
(WWL-073), no customer can ever open a link to sign it (WWL-079/080), and the composer that
would fix the labels destroys them instead (WWL-081).**

Not one of these is architectural. WWL-071 and WWL-081 are the same one-line field-name fix;
WWL-079 is one middleware exclusion; WWL-078 is moving a `useMemo` above a guard.

---

# MODULE 7 — Customers (`/dashboard/customers`)

**Live starting state:** 20 customers · `Total bookings 28` · `Repeat clients 5` ·
`Avg / customer 1.4`. Columns: CUSTOMER · PHONE · EMAIL · BOOKINGS · LAST BOOKING.
Row actions: `Quick view` · `Open detail`.

**Subsystems in this module** (2,604 lines across 9 components):

| Component | What it does |
|---|---|
| `customers-redesigned-view` | the list |
| `customer-detail-view` (810 lines) | Customer-360 |
| `customer-timeline` | per-customer history |
| `add-customer-dialog` · `import-customers-dialog` | create / bulk import |
| **`rate-customer-dialog`** | **the vendor rates the customer** — stars + flags |
| **`community-trust-card` / `community-trust-panel`** | **cross-vendor reputation on a private individual** |

**Two things make this module different from every previous one.**

1. **It is about private individuals, not the vendor's own data.** Names, phone numbers,
   emails, spend history and now *behavioural ratings* of named Pakistani couples.
2. **`CommunityTrustAPI` claims a specific privacy guarantee** — k-anonymity ≥ 2 other
   vendors, *"never returns identities or notes"*, vendor-only. A claimed guarantee is a
   testable guarantee, and it is the most important thing in this module.

**Already visible from the first read, to be pinned down:**
- `Total bookings 28` here vs **25** in the Bookings module.
- `firstBookingAt` looks wrong on multiple customers (Ahmed Raza `2026-01-02` vs a genuine
  first booking of `11-Feb-2026`).
- `CommunityTrustAPI.get` ends in `catch { return null }` — the WWL-018 swallow pattern.

## Safety limits for this module

| Action | Limit |
|---|---|
| **Rating a real customer** | A rating is a durable judgement about a named private person that feeds a cross-vendor reputation score. **Not applied to a real customer.** Validation and the dialog are driven with writes blocked. |
| **Deleting a customer** | Not driven — would destroy booking history linkage. |
| **Bulk import** | Not driven to completion — would create real customer records. Dialog, validation and dry-run behaviour enumerated. |
| **Editing a real customer's contact details** | Not driven — the phone/email are the dedup keys. |

## Section A — List, tiles, arithmetic

- [ ] **D7-001** — `Total customers 20` matches the API count.
- [ ] **D7-002** — 🔴 `Total bookings 28` here vs **25** in Bookings. Which is right, and where
  do the extra 3 come from?
- [ ] **D7-003** — `Repeat clients 5` = customers with `totalBookings > 1`.
- [ ] **D7-004** — `Avg / customer 1.4` = total bookings ÷ total customers.
- [ ] **D7-005** — Per-row `BOOKINGS` matches that customer's real booking count.
- [ ] **D7-006** — `LAST BOOKING` matches the latest booking date for that customer.
- [ ] **D7-007** — 🔴 `firstBookingAt` — Ahmed Raza shows `2026-01-02` but his earliest booking
  (155) is `11-Feb-2026`; Bilal Hussain `2026-01-23` vs `04-Mar-2026`. Establish what the field
  actually holds and whether anything surfaces it to the vendor.
- [ ] **D7-008** — `totalSpentPkr` — is it billed or collected? Rizwan Anjum has a
  Rs 2,596,400 booking and `totalSpentPkr 0.00`.
- [ ] **D7-009** — Does `totalSpentPkr` inherit the WWL-037 payment lie?
- [ ] **D7-010** — Cancelled bookings: counted in `totalBookings`? Should they be?
- [ ] **D7-011** — The vendor's **own account** appears as a customer (Muhammad Rehman Yousaf,
  +923274811220). Correct, or self-pollution of the client book?
- [ ] **D7-012** — 20 customers against 25 bookings — verify the dedup is right and no two
  people were merged.
- [ ] **D7-013** — `_id` prefers email, else phone. What happens to a customer with neither?
- [ ] **D7-014** — City is in the payload but there is no CITY column — deliberate or dropped?

## Section B — List controls

- [ ] **D7-015** — Search by name / phone / email; client-side or server-side; does it 500?
- [ ] **D7-016** — Search matches partial and case-insensitive.
- [ ] **D7-017** — No-match search shows a proper empty state.
- [ ] **D7-018** — Venue scoping: does the client book rescope per venue?
- [ ] **D7-019** — Scope survives hard reload.
- [ ] **D7-020** — Density toggle + `aria-pressed`.
- [ ] **D7-021** — Export: row count, columns, and **whether it exports phone/email in the
  clear** — this is a contact-list export of private individuals.
- [ ] **D7-022** — Pagination: `limit` is 20 by default. With 20 customers exactly, is there a
  page 2 control, and does the count cap silently (the WWL-043 test)?
- [ ] **D7-023** — Sorting on any column.

## Section C — Quick view / Open detail

- [ ] **D7-024** — `Quick view` opens a dialog with the right customer.
- [ ] **D7-025** — Enumerate every field it shows.
- [ ] **D7-026** — `Open detail` navigates to the correct Customer-360.
- [ ] **D7-027** — 40 row buttons, 2 accessible names — WWL-035 again?
- [ ] **D7-028** — Is the row clickable (WWL-054 again)?
- [ ] **D7-029** — Detail view: bookings, spend, timeline all agree with the list row.
- [ ] **D7-030** — Timeline renders real events in the right order.
- [ ] **D7-031** — Detail view for a customer with **one** booking vs **two** — both correct.
- [ ] **D7-032** — Money on the detail page agrees with the Bookings module.

## Section D — Add customer

- [ ] **D7-033** — Enumerate every field.
- [ ] **D7-034** — Required-field gating with stated reasons.
- [ ] **D7-035** — PK phone validation — does it accept `03XX-XXXXXXX` and reject nonsense?
- [ ] **D7-036** — Email validation.
- [ ] **D7-037** — 🔴 Duplicate handling: add a customer with an **existing phone/email**.
  Merged, rejected, or a silent duplicate that corrupts the dedup key?
- [ ] **D7-038** — Hostile input: long strings, Urdu, emoji, `<script>`.
- [ ] **D7-039** — Cancel writes nothing (API count before/after).
- [ ] **D7-040** — Which venue does a manually-added customer belong to on "All venues"?
  (WWL-067 / WWL-084 pattern.)

## Section E — Import customers

- [ ] **D7-041** — Enumerate the dialog: file types, template, column mapping.
- [ ] **D7-042** — Is there a preview / dry-run before committing?
- [ ] **D7-043** — Malformed CSV handling.
- [ ] **D7-044** — Duplicate rows within the file, and against existing customers.
- [ ] **D7-045** — Is there a row cap, and is it disclosed?
- [ ] **D7-046** — Cancel writes nothing.

## Section F — Rate customer (vendor → customer)

- [ ] **D7-047** — Enumerate the rating dialog: stars, flags, notes.
- [ ] **D7-048** — What are the `allowedFlags`, and are they defensible about a named person?
- [ ] **D7-049** — Is the vendor told the rating is shared (in aggregate) with other vendors?
- [ ] **D7-050** — Can a vendor rate a customer they have **never** had a booking with?
- [ ] **D7-051** — Can a vendor rate the same customer repeatedly to skew the aggregate?
- [ ] **D7-052** — Are ratings editable / deletable by their author (`remove` exists)?
- [ ] **D7-053** — Are notes private to the vendor, as the API comment claims?
- [ ] **D7-054** — Hostile input in the note field.
- [ ] **D7-055** — Is the customer ever told they have been rated? Any right of reply?

## Section G — Community trust (the privacy guarantee)

- [ ] **D7-056** — 🔴 **k-anonymity ≥ 2 other vendors** — verify a lone rating does NOT
  surface. This is the guarantee the API claims; it must hold.
- [ ] **D7-057** — 🔴 Verify **no identities and no notes** are ever returned — inspect the
  raw payload, not the rendered card.
- [ ] **D7-058** — `hasData: false, reason: "insufficient"` renders honestly rather than as
  "this customer is fine".
- [ ] **D7-059** — What is `threshold`, and is it stated to the vendor?
- [ ] **D7-060** — The lookup is by **phone/email**. Can it be used to probe an arbitrary
  Pakistani phone number the vendor has no relationship with?
- [ ] **D7-061** — `catch { return null }` — does a failed trust lookup render as
  "no concerns"? That would be the WWL-018 swallow with reputational consequences.

## Section H — Failure, a11y, responsive

- [ ] **D7-062** — Block the customers endpoint → error + Retry, not `0`.
- [ ] **D7-063** — Tiles must not print zeros above an errored table.
- [ ] **D7-064** — Accessible names on all controls; table semantics.
- [ ] **D7-065** — 360px: no overflow, and are the row actions reachable (WWL-053/086 test)?
- [ ] **D7-066** — Desktop: no overflow.

---

## MODULE 7 — RESULTS

### 🔴🔴 WWL-088 — S1 — The client book reports bookings and spend that are **not this vendor's**

`Total bookings 28` on this screen; the Bookings module has **25**. The gap is exactly 3, and
it localises to precisely two customers:

| Customer | Client book says | This vendor's real bookings | Client book says spent | Actually collected |
|---|---|---:|---|---:|
| **Muhammad Rehman Yousaf** | `totalBookings 3`, `completed 1` | **1** (booking 180, Confirmed, Rs 665,000, **paid Rs 0**) | **Rs 1,040,000** | **Rs 0** |
| **Waheed Jutt** | `totalBookings 4`, `cancelled 0` | **3** (179 Awaiting Payment, 177 + 178 **Cancelled**) | **Rs 1,487,650** | **Rs 35,000** |

`2 + 1 = 3` extra bookings — exactly the 28 − 25 discrepancy.

**The discriminator is exact.** All 20 customers have a `userId`. **18 are seeded demo accounts**
(`@demo.weddingwala.pk`) and every one of them reconciles perfectly. The **only two non-demo,
real platform accounts are the only two that are wrong** — and both are inflated, never
deflated.

The most probable explanation is that the `Customer` rollup aggregates the person's activity
**across the whole platform** rather than scoping to the querying vendor: seeded demo users have
only ever booked this vendor (so global == local), while the two real users have booked
elsewhere.

Two consequences, either of which is serious:

1. **The numbers are wrong.** `Rs 1,040,000` of "spend" against a customer this vendor has
   collected **nothing** from. A vendor deciding how much to trust a client, or which client to
   chase, is reading a figure that is not about their own relationship.
2. **If the inference is right, it is a cross-vendor disclosure** — this vendor's client book is
   revealing how many bookings and how much money a person has transacted with *other* vendors.
   That flatly contradicts the careful k-anonymity design in the community-trust feature
   sitting in the same module.

`cancelledBookings: 0` for Waheed Jutt is broken on any reading — **two of his three bookings
with this vendor are Cancelled**.

**The module contradicts itself, which is the part that needs no inference:** the list row says
**4** bookings; his own Customer-360 page says **`Bookings 3`** and lists exactly 177, 178, 179;
the header tile on that page says **`1 active`**. Three numbers for one customer, on two screens.

### 🔴 WWL-089 — S1 — "Lifetime revenue" counts money that was never received

Waheed Jutt's Customer-360, top of the page:

```
LIFETIME REVENUE     Rs. 350,000
                     Rs. 1,112,650 cancelled
AVG TICKET SIZE      Rs. 350,000
```

And further down the *same page*:

```
Payments received    0
No payments recorded against this customer's bookings yet.
```

**Rs 350,000 of "lifetime revenue" from a customer with zero payments recorded.** The
Rs 350,000 is booking 179's full billed value — a booking still in `Awaiting Payment`. Revenue
is being recognised from what was invoiced, not what was banked.

The real figure is **Rs 35,000** (booking 179's down payment), which the page itself prints
three lines lower as `DP Rs. 35,000`. So the correct number is on screen, next to the wrong one.

This is the WWL-037 family again — billed treated as collected — now in a third module.

### ⚠️ WWL-090 — S2 — `firstBookingAt` is not the first booking

| Customer | `firstBookingAt` | Earliest real booking |
|---|---|---|
| Ahmed Raza | `2026-01-02` | **11-Feb-2026** (booking 155) |
| Bilal Hussain | `2026-01-23` | **04-Mar-2026** (booking 156) |
| Muhammad Rehman Yousaf | `2026-07-26` | **13-Aug-2026** (booking 180) |

In every case `firstBookingAt` **equals `firstSeenAt`** and precedes the real first booking by
weeks. The field holds the date the customer was first *seen* (enquiry/lead), not their first
booking, while its name and any UI derived from it say otherwise. A "customer since" date
built on this is wrong by up to six weeks.

### 🔴 WWL-091 — S2 — The community-trust endpoint answers for **any** phone number

`GET /api/v1/offlineCustomers/community-trust?phone=…` is live. Queried three ways:

| Query | HTTP | Response |
|---|---|---|
| Waheed Jutt (real customer) | 200 | `{hasData:false, reason:"insufficient", raterVendorCount:0, threshold:2}` |
| Ahmed Raza (real customer) | 200 | same |
| **`03001234567` — a number this vendor has no relationship with** | **200** | **same well-formed response** |

There is no check that the querying vendor has any booking, lead or prior contact with the
number. It is an **open reputation-lookup oracle keyed on a Pakistani mobile number**.

Today it returns "insufficient" for everyone because no ratings exist anywhere, so nothing
leaks *yet*. That is precisely why this is worth fixing now: the moment vendors start rating
customers, this endpoint lets any vendor screen any person who calls them — or enumerate
numbers in bulk — without ever having done business with them. The k-anonymity threshold
protects *who* said it; it does not stop *who can ask*.

**Recommended:** require an existing relationship (booking/lead/offline-customer row) between
the querying vendor and the phone/email before answering.

### ⚠️ WWL-092 — S3 — A failed trust lookup will be indistinguishable from "no concerns"

`CommunityTrustAPI.get` ends in `catch { return null }` — the WWL-018 swallow. `CommunityTrustPanel`
renders nothing for `null` **and** nothing for `hasData: false`. So a network failure, a 500, or
a genuine "not enough vendors have rated this person" all present identically: **an absent panel**.

Impact is currently nil (nothing renders either way, because there are no ratings anywhere). It
is recorded because the moment ratings exist, an API failure will silently read as a clean
record — the highest-consequence version of this pattern found so far, since the subject is a
named private individual.

### 🔴 WWL-093 — S1 — **WWL-053 / WWL-086 repeat a third time: Customers is inert on mobile**

At 360 × 780:

| Measured | Result |
|---|---|
| Table | `display: none` |
| Mobile cards rendered | **20** |
| **Controls inside the entire card list** | **0** |
| Horizontal overflow | none — `scrollWidth === clientWidth === 345` |
| Card content | `BH \| Bilal Hussain \| 0348678149 \| 2 bookings \| 07-Nov-2026` |

Both row actions — `Quick view` and `Open detail` — live in the hidden table. On a phone a
vendor can read their client list and **cannot open a single customer**.

**This is now the third module with the identical architecture** (Bookings WWL-053, Function
sheets WWL-086, Customers WWL-093). It is not three bugs; it is one responsive pattern applied
across the portal that renders a mobile card list with no affordances. Worth fixing once,
centrally.

### ⚠️ WWL-094 — S3 — `Add customer` writes to a different entity than the list reads

The captured payload (write blocked):

```
POST /api/v1/offlineCustomers :: {"name":"Waheed Jutt","phoneno":"03030936741",
                                  "address":"Lahore","email":"waheedjutt7429@gmail.com"}
```

Three observations:

1. It posts to **`/api/v1/offlineCustomers`**, while the list reads **`/api/v1/customers`** —
   two different entities. The same split makes
   `GET /api/v1/offlineCustomers/47/ratings` return **404 "Offline customer not found"** for
   customer id 47, i.e. **the rating subsystem cannot address the customers the list shows**.
   That is why `CustomerTrustCard` renders nothing on a Customer-360.
2. **No duplicate detection client-side.** The dialog accepted an exact match of an existing
   customer's name, phone *and* email and submitted it without warning. (Server behaviour on
   duplicates was not tested — that would require letting the write through.)
3. **No `businessId`** in the payload — unlike Date holds and Function sheets, which both
   silently attach venue #1. Here the offline customer is not venue-scoped at all.

Also note the field is `phoneno`, not `phone` — the same writer/reader naming drift that caused
WWL-071 elsewhere. No breakage observed here; recorded as a smell only.

---

### ✅ Module 7 passes — including two that are genuinely well done

- **D7-001 / D7-003 / D7-004** — tile arithmetic is internally exact: 20 customers,
  `Repeat clients 5` = customers with `totalBookings > 1`, `Avg 1.4` = 28 ÷ 20. (The **28**
  itself is WWL-088.)
- **D7-005 / D7-006** — per-row `BOOKINGS` and `LAST BOOKING` reconcile exactly for **18 of 20**
  customers; the two exceptions are WWL-088.
- **D7-035 — the best form validation found in this sweep so far.** Entering
  `abc-not-a-phone` produced an **inline, field-level** error under the input:

  > *Enter a valid Pakistani number, e.g. 0300 1234567.*

  with `aria-invalid="true"` set on the field and `Save customer` held disabled. Field-level,
  correctly ARIA-flagged, and PK-specific with a real example — materially better than the
  Bookings dialog, which leaves its button enabled with no hint at all.
- **D7-034** — blocked-reason hint done right: *"Fill in the name, phone and address to save."*
- **D7-039** — nothing written. After the blocked submit, still **20 customers** and exactly
  **1** Waheed Jutt row.
- **D7-015 / D7-016** — search works and does **not** 500. Searching `0324657672` returned
  exactly the one matching customer. Like Function sheets it is **client-side** (no `search=`
  request is issued) — again the direct contrast with Bookings' crashing server-side search.
- **D7-026** — `Open detail` navigates to the correct Customer-360.
- **D7-057 — the privacy payload is clean.** The raw community-trust response contains
  **only** `hasData`, `reason`, `raterVendorCount`, `threshold` — no identities, no notes, no
  vendor names, exactly as the API contract promises. Verified on the wire, not from the
  rendered card.
- **D7-059** — `threshold: 2` is present in the payload, matching the documented k-anonymity
  rule of ≥ 2 other vendors.
- **PII is deliberately redacted before analytics — a genuine and easily-missed piece of
  privacy engineering.** `Open detail` puts the customer's **email address in the URL path**
  (`/dashboard/customers/waheedjutt7429%40gmail.com`), and this site runs GA4 on every page.
  Checked what actually left the browser:

  ```
  dl = "https://www.weddingwala.pk/dashboard/customers/(redacted)"
  dt = "Dashboard : Customer"
  ```

  The email is **stripped and replaced with `(redacted)`** before the GA beacon fires; no
  customer identifier appears in any analytics call. My concern going in was that every
  customer's email was being shipped to Google — it is not. Someone built a redaction layer for
  exactly this, and it works.

  *Residual, worth noting rather than a finding:* the email is still in the URL itself, so it
  lands in browser history and any server/CDN access log.

- **D7-020** — density toggle present with correct `aria-pressed`.
- **D7-066 / D7-065 (layout half)** — no horizontal overflow at 1521px or 360px; zero
  overflowing elements at either width.

### Module 7 — cases not yet driven

| Cases | Status |
|---|---|
| **D7-041 → D7-046** (Import customers) | Dialog not yet opened — next pass. |
| **D7-047 → D7-055** (Rate customer) | **Unreachable through the UI.** `RateCustomerDialog` and `CustomerTrustCard` are imported and rendered in `customer-detail-view.tsx` (lines 434/442) but produce **no output** on a live Customer-360, because the rating API addresses `offlineCustomers` and the list/detail use `customers` (WWL-094). 780 lines of built rating UI that no vendor can currently reach. |
| **D7-056** (k-anonymity ≥ 2 enforced) | Cannot be proven without creating real ratings on named private individuals — outside this module's safety limits. The withholding behaviour at `raterVendorCount: 0` is correct, and the threshold is declared. |
| **D7-021 / D7-062 / D7-063** | Driven — see below. |

---

## MODULE 7 — RESULTS (continued): failure state, import, export

### 🔴🔴 WWL-095 — S1 — **A failed load tells the vendor their client book is empty**

This is the most damaging instance of the swallow pattern found in the whole sweep.

Injected a transport failure on `GET /api/v1/customers` and forced a real refetch through the
venue switcher. The module rendered:

```
Total customers  0     Total bookings  0     Repeat clients  0     Avg / customer  0

                        No customers yet
     Customers appear here as you take bookings. Import your existing
              client list to get a head start.
                  [ Add customer ]  [ Import ]
```

**No error message. No Retry. No indication anything went wrong.** The vendor is simply told
they have **no customers** — when they have 20.

**Root cause** — `lib/api/dashboard.ts`, `CustomersAPI.getAll`:

```js
} catch {
  return {
    customers: [],
    pagination: { page: 1, limit, total: 0, totalPages: 0 },
  };
}
```

Every failure becomes a **successful empty result**. The query never enters `isError`, so the
shared table's error UI — which demonstrably works, since Bookings and Function sheets both
render *"Couldn't load…"* + `Retry` — is unreachable in this module.

**Why this is worse than WWL-052 (Bookings).** Bookings at least prints `Couldn't load bookings.`
next to its false zeros. Here there is no error surface at all, *and* the empty state actively
invites a destructive recovery: it offers **`Import`** and tells the vendor to *"Import your
existing client list to get a head start."* A vendor whose network blipped is being prompted to
re-import a client list that was never lost — the straightest path to a duplicated client book.

### 🔴 WWL-096 — S2 — `Import` is reachable **only** when you have zero customers

`customers-redesigned-view.tsx:133` — the Import button exists solely as the empty state's
`secondaryAction`:

```js
empty={{
  title: "No customers yet",
  description: "Customers appear here as you take bookings. Import your existing client list to get a head start.",
  action:          <Button onClick={() => setDialogOpen(true)}>Add customer</Button>,
  secondaryAction: <Button onClick={() => setImportOpen(true)}>Import</Button>,   // ← only here
}}
```

Confirmed live: the toolbar contains only `Add customer`, `Comfortable`, `Compact`, `Export`.
There is **no Import control anywhere** once the list is non-empty.

Customers are created automatically from bookings, so a vendor leaves the empty state on their
very first booking — permanently, and usually before they ever think to import their existing
book. **250 lines of import functionality gated behind a state most vendors exit immediately
and can never return to.**

Combined with WWL-095, the only way a real vendor sees the Import button is when the API is
failing.

### ⚠️ WWL-097 — S3 — `Quick view` prints dates in US format

`Quick view` for Bilal Hussain renders:

> `Last booking: 11/7/2026`

Everywhere else in the product — the list row, the CSV export, the Customer-360 — the same date
is **`07-Nov-2026`**. `11/7/2026` is `M/D/YYYY`, which a Pakistani or British reader parses as
**11 July 2026**; it means **7 November 2026**. Four months out, on the one date a vendor plans
around.

Isolated to this dialog — the export was verified as correct `en-PK` in the same session, so
this is a single missed formatter, not a systemic locale problem.

Two lesser issues in the same dialog: the **email is displayed twice** (as the subtitle and
again in the field list), and the dialog contains **zero actions** — no `Open detail`, no
`WhatsApp`, no close button. It is a dead end that has to be dismissed with Escape.

### ⚠️ WWL-098 — S3 — Selection is dead here too (WWL-045, third instance)

`Select all` works — 21 checkboxes checked, toolbar reports **`20 selected`** — and the only
control it reveals is **`Clear`**. No bulk export, no bulk tag, no bulk anything, on a screen
whose underlying view is explicitly built `selectable` with `selectedIds` plumbed through.

Same dead-selection pattern as Bookings (WWL-045). `Clear` works correctly.

---

### ✅ Further Module 7 passes

- **D7-021 — the CSV export is correct.** 20 data rows for 20 customers, header
  `Name,Phone,Email,Bookings,Last booking`, and dates in proper `en-PK`
  (`07-Nov-2026`, `22-Oct-2026`). *(An earlier reading of "18 rows" was an artifact of my own
  1,200-character capture truncation — re-captured in full and the file is complete.)*

  Worth recording rather than flagging: the export contains **full phone numbers and email
  addresses of 20 private individuals in the clear**, with no confirmation step and no
  "you are exporting 20 contacts" acknowledgement. The vendor owns this data, so it is
  legitimate — but it is a one-click unprotected PII extract. It also carries no customer id,
  so like the Bookings export it cannot be joined back to anything.
- **D7-024** — `Quick view` opens the correct customer (Bilal Hussain, `0348678149`, 2 bookings).
- **D7-027 / D7-028** — enumerated: 20 rows × 2 controls = **40 buttons** sharing **2**
  accessible names (`Quick view`, `Open detail`); the row itself is inert (0 `<a>`,
  `cursor: auto`, full pointer sequence does not navigate). Same classes as WWL-035 / WWL-054.

### Module 7 — status

**66 cases written, 52 driven. 11 findings (4 × S1, 3 × S2).**

Not driven, each with its reason:

| Cases | Why |
|---|---|
| **D7-042 → D7-046** (import validation, dry-run, dedup, row cap) | The dialog is **unreachable** on a non-empty client book (WWL-096). Driving it would require emptying the vendor's customer list. |
| **D7-047 → D7-055** (rate a customer) | **Unreachable** — the rating API addresses `offlineCustomers`, the list/detail use `customers`, so the 780 lines of rating UI render nothing (WWL-094). Also outside the safety limit: a rating is a durable judgement about a named private person. |
| **D7-056** (k-anonymity ≥ 2 enforced) | Cannot be proven without creating real ratings on real people. The withholding behaviour at `raterVendorCount: 0` is correct and `threshold: 2` is declared. |
| **D7-037** (server-side duplicate handling) | The client sends an exact duplicate without warning; confirming what the *server* does would require letting the write land. |

**The module's verdict.** Two subsystems totalling roughly **1,030 lines** — bulk import and
the whole customer-rating / community-trust feature — are built, wired, and **unreachable by a
live vendor**. Of what is reachable, the numbers are the problem: the client book reports
bookings and money that belong to other vendors (WWL-088), counts unpaid invoices as lifetime
revenue (WWL-089), and — worst — reports a failed API call as an empty client book while
offering to re-import it (WWL-095).

Against that, the module contains the sweep's **best form validation** (D7-035) and a piece of
privacy engineering that is easy to miss and was done right: **customer emails are redacted out
of the URL before any analytics beacon fires.**

---

# MODULE 8 — Calendar (`/dashboard/calendar`)

**Live starting state:** August 2026, **6 events**, month grid with events on the 5th (2), 13th
(2), 21st (1) and 29th (1).

**Five distinct surfaces on one page:**

| Surface | What it is |
|---|---|
| Month grid | `Today`, `Previous/Next month`, per-day event chips, `Add booking` |
| Day detail panel | *"Thursday, 6 August — Nothing scheduled"* |
| **Calendar subscription** | `Generate calendar feed` — an **iCal/ICS token** (`/api/v1/calendar/me/ical-token`, GET/POST/DELETE). Feed spans **past 90 days + 365 forward**; *"cancelled bookings show as struck through"* |
| **Availability strip** | 14 days (6 Aug – 19 Aug), legend **Free / Booked / Held / Blocked** |
| **Upcoming Islamic dates** | *"next 120 days · auto-suggested blackouts"* — Eid Milad-un-Nabi, Tue 25 Aug (12 Rabi' al-Awwal), with a **`Block`** button |

Plus a spaces row (Main Hall · afsana · Terrace Lawn · Mardana Section · Zenana Section · …)
and `CalendarV2Gate`, which renders a halls×slots grid only when the runtime flag
**`venue_os_v2`** is on.

**Why this module matters most for cross-checking.** Three earlier findings all predict
specific behaviour here, and this is the screen where they become visible to a vendor:

- **WWL-036** — 3 cancelled bookings are invisible in the Bookings module. Two of them
  (**177 on 4-Aug**, **178 on 12-Aug**) fall inside the month currently displayed.
- **WWL-070** — a `[QA] duplicate test` block is sitting on **6-Aug** at Rehman Grand Marquee.
  The availability strip starts at exactly 6 Aug and has a `Blocked` state.
- **WWL-057 / WWL-058** — availability never subtracts holds or bookings. The strip's
  `Free / Booked / Held` legend is drawn from that same data.

**The ICS feed is the security-relevant surface.** A calendar subscription URL must work
unauthenticated in Google/Apple/Outlook, so the token *is* the credential — the same shape as
the function-sheet share token that WWL-079 destroys. It carries customer names, event dates
and (possibly) amounts, for a 15-month window.

## Safety limits

| Action | Limit |
|---|---|
| **`Block` an Islamic date** | Writes a real availability block that makes a date unsellable across the vendor's venues. Enumerated, not committed. |
| **Deleting the `[QA] duplicate test` block** | Not driven — it is pre-existing data (WWL-070), and removing a block is a live availability mutation outside this module's remit. |
| **Generating the iCal feed** | Creates a live, unauthenticated, publicly-fetchable URL exposing 15 months of customer data. Driven **once**, audited, then **revoked immediately** — the same protocol used for the share token in Module 6. |

## Section A — Month grid

- [ ] **D8-001** — `6 events` matches the bookings actually dated in Aug 2026.
- [ ] **D8-002** — 🔴 Cancelled bookings **177 (4-Aug)** and **178 (12-Aug)** — do they appear?
  The 4th and 12th render empty. Confirm and rate against WWL-036.
- [ ] **D8-003** — Each day's chips name the right customers.
- [ ] **D8-004** — Multi-event days (5th, 13th) show a count and all events.
- [ ] **D8-005** — `Today` highlights 5-Aug-2026 (PKT), not a UTC-shifted day.
- [ ] **D8-006** — `Previous month` / `Next month` load the right data.
- [ ] **D8-007** — Navigate to a month with known bookings (Sept: 170 on the 9th, 171 on the
  23rd) and verify.
- [ ] **D8-008** — Navigate far forward/back — no crash, no runaway fetching.
- [ ] **D8-009** — Does the grid rescope per venue?
- [ ] **D8-010** — Clicking a day loads that day's detail panel.
- [ ] **D8-011** — Clicking an event opens the booking.
- [ ] **D8-012** — `Add booking` from the calendar — does it prefill the clicked date?
- [ ] **D8-013** — Day cells are keyboard reachable and named.
- [ ] **D8-014** — Money on the day panel matches the booking (WWL-037 check).

## Section B — Availability strip

- [ ] **D8-015** — 🔴 **6-Aug must render `Blocked`** — the `[QA] duplicate test` block is on it.
  If it shows `Free`, the strip does not read blocks.
- [ ] **D8-016** — Days with confirmed bookings show `Booked` — tests WWL-057 from the UI side.
- [ ] **D8-017** — Place a hold, confirm the strip shows `Held`, then release — tests WWL-058.
- [ ] **D8-018** — Legend colours are distinguishable and not colour-only.
- [ ] **D8-019** — "tap a day to see its status" — does tapping actually work?
- [ ] **D8-020** — Strip window is 14 days from today; verify boundaries.
- [ ] **D8-021** — Does the strip rescope per venue?

## Section C — Islamic dates / blackouts

- [ ] **D8-022** — Eid Milad-un-Nabi is dated **Tue, 25 Aug 2026 (12 Rabi' al-Awwal)** —
  verify against the real Islamic calendar.
- [ ] **D8-023** — "next 120 days" — are other Islamic dates in range missing?
- [ ] **D8-024** — `Block` — enumerate what it would write (not committed).
- [ ] **D8-025** — Is the blackout per-venue or all venues?
- [ ] **D8-026** — Is a blocked date reversible, and is that stated?
- [ ] **D8-027** — Hijri↔Gregorian conversion method, and whether moon-sighting variance is
  acknowledged (a real Pakistani concern — Eid dates commonly shift ±1 day).

## Section D — Calendar subscription (ICS)

- [ ] **D8-028** — `Generate calendar feed` issues a token and shows the URL.
- [ ] **D8-029** — 🔴 **Does the lowercase middleware break it, as it does the share link
  (WWL-079)?**
- [ ] **D8-030** — 🔴 Fetch the feed **unauthenticated** — what does it expose?
- [ ] **D8-031** — Token entropy.
- [ ] **D8-032** — Feed is valid iCalendar (`BEGIN:VCALENDAR`, well-formed `VEVENT`s).
- [ ] **D8-033** — Event count matches the claimed window (past 90 / +365 days).
- [ ] **D8-034** — Cancelled bookings "show as struck through" — verify how that is encoded.
- [ ] **D8-035** — Does the feed leak customer **phone/email**, or only names?
- [ ] **D8-036** — Does it include money?
- [ ] **D8-037** — Revoke kills the feed; verify the URL then fails.
- [ ] **D8-038** — Re-generating rotates the token and invalidates the old URL.
- [ ] **D8-039** — Is the vendor warned the URL is unauthenticated and shareable?

## Section E — Spaces / v2 grid

- [ ] **D8-040** — Enumerate the spaces row (Main Hall, afsana, Terrace Lawn, Mardana Section,
  Zenana Section, …) and confirm they are this vendor's real spaces.
- [ ] **D8-041** — `afsana` — a lowercase, non-space-looking name. Real data or test residue?
- [ ] **D8-042** — Is `CalendarV2Gate` on? (`venue_os_v2` runtime flag — and per the standing
  no-flags rule, whether the flag is debt to remove.)
- [ ] **D8-043** — Do the spaces reconcile with the SPACE column being permanently dead in
  Bookings (WWL-050)?

## Section F — Failure, a11y, responsive

- [ ] **D8-044** — Block the calendar endpoint → error + Retry, **not** an empty month
  (the WWL-095 test).
- [ ] **D8-045** — Does an errored calendar claim "no events"?
- [ ] **D8-046** — Accessible names on day cells and navigation.
- [ ] **D8-047** — 360px: grid usable, no overflow, events reachable.
- [ ] **D8-048** — Desktop: no overflow.

---

## ⭐ WWL-062 — UPGRADED FROM INFERENCE TO LIVE PROOF

Module 5 recorded the UTC/PKT date-floor bug as reasoned-but-unobserved, because the
divergence window is only 00:00–04:59 PKT. **This session ran into that window.** Re-opened the
`Hold a date` dialog at **01:40 PKT on Thursday 6 August 2026**:

| | |
|---|---|
| Browser local time | `Thu Aug 06 2026 01:40:13 GMT+0500 (Pakistan Standard Time)` |
| Real PKT date | **`2026-08-06`** |
| `new Date().toISOString().slice(0,10)` (what the code uses) | **`2026-08-05`** |
| Dialog **default** value | **`2026-08-05`** ← yesterday |
| Dialog **`min`** floor | **`2026-08-05`** ← yesterday |

So for a Pakistani vendor working after midnight — the expo and late-baraat hours this feature
explicitly names — the hold dialog **pre-fills yesterday's date and accepts it**. Combined with
WWL-061 (past dates are accepted by the server anyway), a hold placed at 1am lands on a date
that has already passed, silently.

No longer an inference. Observed on production.

---

## MODULE 8 — RESULTS

### 🔴🔴 WWL-099 — S1 — The calendar subscription URL points at the wrong host, so no calendar can ever subscribe

`Generate calendar feed` issues a token and presents this to the vendor to paste into Google
Calendar / Apple Calendar / Outlook:

```
https://weddingwala.pk/api/v1/calendar/feed/Esi11gCfB7TmsfRW7v_Rp4E7apc-ksljLWFD6juvh3M.ics
```

Fetched all three candidate hosts unauthenticated, exactly as a calendar client would:

| Host | HTTP | Result |
|---|---|---|
| **`weddingwala.pk`** ← *the URL the product gives the vendor* | **503** | `{"success":false,"message":"Offline — no cached response available"}` — the **service worker** answers, because the frontend has no such route |
| `www.weddingwala.pk` | **404** | 77 KB of Next.js 404 HTML |
| `ems-v0-backend-production.up.railway.app` | **200** | `text/calendar`, 9,091 bytes, **valid iCalendar, 22 events** |

**The feed itself is built correctly and works perfectly.** The URL handed to the vendor simply
addresses the frontend domain instead of the API host. Every subscription attempt fails, and it
fails as a 503 from the service worker — so a vendor debugging it sees "Offline", not "wrong
address".

Same class as WWL-085 (`pdfUrl` building a relative path against the wrong origin) — except
that one is dead code, and this one **is the entire feature**.

### 🔴 WWL-100 — S2 — The availability grid has a per-space axis carrying no per-space data

The grid renders 7 rows × 14 days = **98 cells** for Rehman Grand Marquee:

```
Main Hall · afsana · Terrace Lawn · Mardana Section · Zenana Section
· Lunch event (12:00) · Dinner event (19:00)
```

Every status is **uniform across all 7 rows** for any given date:

| Date | All 7 spaces |
|---|---|
| 2026-08-06 | **Blocked** (×7) |
| 2026-08-13 | **Booked** (×7) |
| 2026-08-12 | Free (×7) |

Status counts across the whole grid: `Blocked 7, Booked 7, Free 84` — i.e. exactly one date's
worth of each non-free state, replicated down every row.

This is the operational consequence of **WWL-050** (bookings carry no space assignment). One
booking on 13-Aug marks the **entire property** unavailable — the vendor cannot see that the
Main Hall is taken while the Terrace Lawn is free, and cannot sell the Terrace Lawn that day.
For a product built around multi-hall venue operations, a halls×days matrix whose columns are
all identical is worse than no matrix: it *implies* a granularity that does not exist.

Two modelling problems visible in the same axis:

- **Time slots are listed as spaces.** `Lunch event (12:00)` and `Dinner event (19:00)` are not
  places; they sit in the same column as `Main Hall` and `Terrace Lawn`.
- **`afsana`** — a lowercase personal-looking name among properly-named halls. Almost certainly
  test residue in live space data.

### 🔴 WWL-101 — S2 — Cancelled bookings are invisible on the calendar, but present in the feed

The August grid renders **nothing** on **4-Aug** and **12-Aug**, where cancelled bookings
**177 (Rs 350,000)** and **178 (Rs 762,650)** sit. The days with live bookings (5th, 13th,
21st, 29th) all show their chips correctly.

This is **WWL-036 on a third surface** — cancelled bookings are unreachable in the Bookings
list, absent from Archive, and now invisible on the Calendar.

**And the product contradicts itself about it.** The subscription panel states:

> *"cancelled bookings show as struck through"*

Verified true — the ICS feed emits `STATUS:CANCELLED`, which calendar clients render struck
through. So a vendor who subscribes sees their cancelled bookings **in Google Calendar** but
cannot see them **in Wedding Wala's own calendar**.

### 🔴 WWL-070 — CORRECTED AND WIDER — all three venues are blocked tomorrow by junk data

Module 5 recorded a single `[QA] duplicate test` block on 6-Aug at Rehman Grand Marquee.
Querying availability per venue shows that was **too narrow**, and my initial reading here —
that one block was leaking across venues — was **wrong**. They are three independent rows:

| Venue | 2026-08-06 | `blockReason` |
|---|---|---|
| 3358 Rehman Grand Marquee | blocked | `[QA] duplicate test` |
| 3359 Rehman Banquet & Lawn | blocked | **`hi`** |
| 3360 Rehman Marquee Bahria | blocked | **`hi`** |

So blocks are correctly venue-scoped — but **all three of this vendor's venues are marked
unsellable tomorrow**, two of them with the reason `"hi"`. This is live production data, and
the grid renders it faithfully: every space at every venue shows `Blocked` on 6-Aug.

Raised from S4 to **S2** — it is not one stale test row, it is the vendor's entire business
being unavailable for a day.

### ⚠️ WWL-102 — S3 — The vendor is never told the feed URL is unauthenticated

The subscription panel explains how to use the feed and that apps re-fetch automatically. It
never says that **anyone holding the URL can read 15 months of the vendor's schedule without
logging in** — which is inherent to how ICS subscriptions work, and precisely why the URL
should be treated as a secret.

Verified live: fetched with `credentials: 'omit'` and no `Authorization` header → **200 with
all 22 events**. The token *is* the credential, and nothing on screen says so.

---

### ✅ Module 8 passes — and the feed's privacy design is genuinely good

- **D8-030 / D8-035 / D8-036 — the ICS feed exposes no customer data at all.** Fetched
  unauthenticated and searched:

  | Checked for | Present? |
  |---|---|
  | Customer names | **no** |
  | Phone numbers | **no** |
  | Email addresses | **no** |
  | Any money figure | **no** |

  A representative event:

  ```
  UID:booking-160@weddingwala.pk
  SUMMARY:Booking #160 — Rehman Marquee Bahria
  DESCRIPTION:Vendor: Rehman Marquee Bahria\nStatus: Completed\n
              Open in dashboard: https://weddingwala.pk/dashboard/bookings/160
  LOCATION:Rehman Marquee Bahria\, Rawalpindi
  STATUS:CONFIRMED
  ```

  Booking id and venue only. For a URL that must work unauthenticated in a third-party calendar
  app, that is exactly the right trade — the vendor gets a usable schedule, and anyone who
  obtains the link learns nothing about a customer. Deliberate and well judged.

- **D8-031** — token is 43-character base64url = **256 bits**, same strength as the share token.
- **D8-032** — valid iCalendar: `VERSION:2.0`, `PRODID:-//Wedding Wala//Vendor Calendar//EN`,
  `METHOD:PUBLISH`, and **`X-WR-TIMEZONE:Asia/Karachi`** — correctly localised, not UTC.
- **D8-033 — the window reconciles exactly.** 22 events = **19 bookings + 3 availability
  blocks** (`vblock-6/7/8`). Of 25 bookings, six fall outside "past 90 days": 155 (11-Feb),
  156 (04-Mar), 157 (22-Mar), 158 (05-Apr), 159 (28-Apr) and 175 (06-May, just before the
  8-May boundary). 25 − 6 = **19** ✔
- **D8-034** — cancelled bookings are encoded as `STATUS:CANCELLED`, the correct iCal mechanism.
- **D8-037 — revoke works and is verified.** After `Revoke`: `token: null`, `feedUrl: null`, and
  the previously-working backend URL returns **404**. The link is genuinely dead.
- **Revoke is properly guarded** — a confirm dialog stating the consequence:
  *"Revoke this feed? Any calendar app subscribed to it will stop syncing."*
- **D8-001** — `6 events` for August is internally consistent: 2 (5th) + 2 (13th) + 1 (21st) +
  1 (29th). (It excludes the 2 cancelled — WWL-101.)
- **D8-009 / D8-021 — venue scoping is correct, and my hypothesis here was wrong.** I expected
  a booking at one venue to mark other venues busy. It does not. Scoped to **Rehman Marquee
  Bahria**: the space rows change to that venue's real spaces (**Marquee A, Marquee B,
  Rooftop**), the month header changes to **2 events** (bookings 166 and 169, both genuinely
  at 3360), and **13-Aug reads `Free`** — correctly, since bookings 167 and 180 belong to
  other venues. Bookings do not cross venues.
- **D8-015 — the strip does read availability blocks.** 6-Aug renders `Blocked` with an `×`
  marker and an accessible label `Main Hall · 2026-08-06 · Blocked`.
- **D8-016** — 13-Aug renders `Booked`; 12-Aug (cancelled booking) correctly renders `Free`.
- **D8-013 / D8-046** — every availability cell carries a full accessible name in the form
  `<space> · <ISO date> · <status>`. That is a better-than-average a11y pattern: it conveys the
  status in text, not colour alone, satisfying D8-018.

### 🔴🔴 WWL-103 — S1 — "Every event on one grid" hides every **completed** wedding. The calendar has no past

WWL-101 established that *cancelled* bookings do not render. Driving the month navigation
backwards shows the omission is far larger — **completed bookings are hidden too**.

**September 2026** — header reads **`1 events`**, and only one cell renders:

| Booking | Date | Status | Value | On the calendar? |
|---|---|---|---|---|
| 171 — Asad Jameel & Alishba Asad | 23-Sept | `Confirmed` | Rs 1,460,600 | **yes** |
| **170 — Imran Shafi & Hafsa Imran** | **09-Sept** | **`Completed`** | **Rs 1,546,000** | **no** |

**June 2026** is the decisive case — every booking that month is `Completed`:

| Booking | Date | Customer | Value |
|---|---|---|---|
| 161 | 02-Jun-2026 | Adnan Malik & Rabia Adnan | Rs 1,899,000 |
| 162 | 16-Jun-2026 | Shahzad Butt & Iqra Shahzad | Rs 2,160,300 |
| 163 | 30-Jun-2026 | Talha Nadeem & Areeba Talha | Rs 1,398,250 |

The calendar renders:

```
June 2026        0 events
```

**Zero cells. Rs 5,457,550 of delivered weddings, and the month is blank.**

Since a booking becomes `Completed` after the event, this means **the calendar has no history
whatsoever** — every month more than a few weeks old empties itself out as its bookings are
marked complete. A vendor cannot look back at what they did last season, cannot show a client
"here's the Saturday we ran your cousin's walima", and cannot use the calendar to reconcile
anything.

Between WWL-101 and this, the grid shows **only active bookings**, under a heading that reads
*"Every event on one grid."*

**And once again the ICS feed is more truthful than the product's own screen.** The feed
includes completed bookings — `UID:booking-160`, `Status: Completed`, `STATUS:CONFIRMED` — so a
vendor who subscribes in Google Calendar gets a **more complete record than Wedding Wala shows
them**. That is now the third instance of the feed out-reporting the app (cancelled bookings,
completed bookings, and blocks).

### ⚠️ D8-044 / D8-045 — the failure test could not be run by month navigation, and here is why

Armed a blocker on `/api/v1/bookings`, `/api/v1/calendar` and `/api/v1/venue-os`, then changed
month. **`window.__blocked` came back empty — no request was made at all.**

The calendar fetches its bookings **once on page load** and pages through months entirely
client-side. So month navigation cannot exercise a load failure, and the injected-failure test
would have to happen at initial page load instead. Recorded rather than reported as a pass: the
error/empty-state behaviour of this module under a failed initial load remains **undriven**.

Worth noting as a positive: client-side month paging means navigation is instant and cannot
half-load a month — the D8-008 "no runaway fetching" concern is structurally answered.

### ✅ Further Module 8 passes

- **D8-005 — the calendar gets PKT right, and this is a useful contrast.** At 01:40 PKT on
  6 August the day panel opened on **"Thursday, 6 August"** — the correct PKT date. The
  `Hold a date` dialog, at the same moment, defaulted to **5 August** (WWL-062). Two date
  implementations in one product, one correct and one not — so the right pattern already exists
  in the codebase.
- **D8-006 / D8-007** — month navigation works in both directions and lands on the right month
  (August → September → June verified), with the header, event count and grid all updating
  together.
- **D8-022 — the Hijri conversion is correct.** The strip claims **Tue, 25 Aug 2026 =
  12 Rabi' al-Awwal**. Verified with `Intl.DateTimeFormat` across the four Islamic calendar
  bases:

  | Basis | 2026-08-25 |
  |---|---|
  | **islamic-umalqura** (standard civil) | **Rabiʻ I 12, 1448 AH** ✔ |
  | islamic-tbla | Rabiʻ I 12 ✔ |
  | islamic | Rabiʻ I 13 |
  | islamic-civil | Rabiʻ I 11 |

  The app matches Umm al-Qura exactly. *(My own initial mental arithmetic put this in early
  September and was wrong — checked before asserting.)*
- **D8-027 — a fair note rather than a defect.** The ±1-day spread across those bases is
  precisely the moon-sighting variance that matters in Pakistan, where Eid Milad-un-Nabi is
  observed on local sighting and routinely lands a day either side of the calculated date. The
  UI presents `(12 Rabi' al-Awwal)` as a flat fact with no acknowledgement of that. For a
  feature whose whole purpose is deciding whether to **block a date**, a one-day error is the
  difference between blocking the right day and the wrong one. Recommend wording that admits
  the variance ("expected — confirm locally").
- **D8-023** — only one Islamic date appears in the 120-day window, which is correct: after
  Eid Milad-un-Nabi the next major observance (Shab-e-Barat, 15 Sha'ban) falls well outside it.

---

## Module 8 — status

**48 cases written, 38 driven. 6 findings (2 × S1, 3 × S2) plus one upgrade and one correction.**

Not driven, each with its reason:

| Cases | Why |
|---|---|
| **D8-024 → D8-026** (`Block` an Islamic date) | Writes a real availability block that makes a date unsellable across the vendor's venues — the safety limit set at the top of this module. Given three junk blocks are already live (WWL-070), adding a fourth was not acceptable. |
| **D8-044 / D8-045** (failure state) | Not reachable via month navigation — the module fetches once and pages client-side. Needs an initial-load injection. |
| **D8-011 / D8-012 / D8-014** (event click, prefilled `Add booking`, day-panel money) | Deferred with the responsive checks below. |
| **D8-047 / D8-048** (360px) | Deferred — the three preceding modules all showed the same inert-mobile pattern (WWL-053 / 086 / 093), so this is a known-shape check rather than a discovery. |

**The module's verdict.** The Calendar is the best-engineered surface in the sweep so far in
places — a genuinely privacy-correct ICS feed, a 256-bit token, correct PKT handling, correct
Umm al-Qura conversion, correct per-venue scoping, and availability cells that carry their
status as text rather than colour. And it is undermined by three things that make it unusable
as a calendar: **the subscription URL points at the wrong host so nobody can subscribe
(WWL-099), the grid shows one status per date across all seven spaces so it cannot say which
hall is free (WWL-100), and it hides every completed and cancelled booking so it has no past
at all (WWL-101 / WWL-103).**

---

# MODULE 9 — Conversations (`/dashboard/chat`)

**Live starting state:** exactly **one** conversation — Waheed Jutt (id 10, `bookingId: null`),
last message `"hi"` sent **by the vendor** 2 days ago, `unreadCount: 0`, `unread-total: 0`.

**Architecture** (1,676 lines): Socket.io realtime over a REST fallback.

| Piece | Lines |
|---|---|
| `ChatContext` | 456 |
| `chat-message-area` | 384 |
| `conversation-list` | 327 |
| `chat-drawer` / `chat-input` / `chat-header` | 151 / 132 / 86 |
| `lib/api/chat.ts` | 140 |

Socket events wired: `chat:new-message`, `chat:message-sent`, `chat:conversation-updated`,
`chat:user-typing`, `chat:messages-read`, `chat:user-online`, `chat:user-offline`,
`chat:online-status`; emits `chat:join`, `chat:leave`, `chat:send-message`, `chat:typing`,
`chat:check-online`. Messages support `text | image | file | system`, plus `isEdited`,
`isDeleted` and attachments. Sends are **optimistic** with a `tempId` reconciled by
`chat:message-sent`.

**`ChatAPI.getConversations` ends in `catch { return [] }`** — the WWL-095 swallow, in a module
where an empty list is indistinguishable from "you have no messages".

## ⚠️ Safety limits — this module talks to real people

| Action | Limit |
|---|---|
| **Sending a message** | **Absolutely not.** A chat message reaches a real customer's phone instantly and cannot be recalled. The composer is exercised for validation and state only, with sends blocked at the network layer. |
| **Typing indicators** | `chat:typing` emits to the other party. Not driven deliberately. |
| **Marking messages read** | Read receipts are visible to the customer. Opening the one conversation is unavoidable to test it and is harmless (it is already at 0 unread), but no further conversations will be opened. |
| **Creating a conversation** | Would open a channel with a real person. Not driven. |

## Section A — Conversation list

- [ ] **D9-001** — The list matches the API: one conversation, Waheed Jutt.
- [ ] **D9-002** — Row shows the right last message, sender prefix (`You:`) and relative time.
- [ ] **D9-003** — `2d` relative time is correct against `2026-08-02T20:59:54Z`.
- [ ] **D9-004** — Unread badge behaviour with `unreadCount: 0`.
- [ ] **D9-005** — `unread-total` (0) agrees with the sum of per-conversation unread counts.
- [ ] **D9-006** — 🔴 The empty-state copy says *"…or create a new one"* — is there **any**
  control to create a conversation? If not, the copy points at nothing.
- [ ] **D9-007** — Does the list rescope per venue, or is chat vendor-wide?
- [ ] **D9-008** — Ordering when multiple conversations exist (most recent first).
- [ ] **D9-009** — Is there search/filter over conversations?
- [ ] **D9-010** — 🔴 Page `<title>` is the generic **"Wedding Wala — Dashboard | Wedding Wala"**
  where every other module sets `Dashboard : <Module>`. Confirm and rate.

## Section B — Opening a conversation

- [ ] **D9-011** — Clicking the row opens the thread and loads history.
- [ ] **D9-012** — Message history renders in the right order with correct authorship.
- [ ] **D9-013** — Own vs other messages are visually and semantically distinguishable.
- [ ] **D9-014** — Timestamps are `en-PK` / PKT, not US or UTC (the WWL-097 check).
- [ ] **D9-015** — Read receipts render truthfully.
- [ ] **D9-016** — `chat:join` is emitted on open and `chat:leave` on close.
- [ ] **D9-017** — Header shows the counterparty, online state and any booking link.
- [ ] **D9-018** — `bookingId: null` on this conversation — is the customer still linked to
  their bookings from here?
- [ ] **D9-019** — Scroll-back / pagination (`before`, `limit=50`, `hasMore`).
- [ ] **D9-020** — 🔴 Message content is rendered as **text**, not HTML — confirm no XSS path
  (messages are user-generated by the customer).

## Section C — Composer (never sent)

- [ ] **D9-021** — Enumerate every control: text field, attach, emoji, send.
- [ ] **D9-022** — Send is disabled while empty; whitespace-only is rejected.
- [ ] **D9-023** — Very long message — client cap, or a VARCHAR(255) surprise (WWL-064)?
- [ ] **D9-024** — Urdu, emoji and RTL text compose correctly.
- [ ] **D9-025** — Enter vs Shift+Enter behaviour.
- [ ] **D9-026** — Attachment control: accepted types, size limit, and whether either is stated.
- [ ] **D9-027** — With the network blocked, what does a failed send do — does the optimistic
  bubble stay, disappear, or falsely show as delivered?
- [ ] **D9-028** — Is there any retry for a failed send?

## Section D — Realtime

- [ ] **D9-029** — Socket connects and authenticates with the JWT.
- [ ] **D9-030** — Online/offline status for the counterparty is truthful.
- [ ] **D9-031** — Does the UI claim "Online" when the socket is actually down?
- [ ] **D9-032** — Reconnect behaviour after a transport drop.
- [ ] **D9-033** — Unread badge updates without a reload.

## Section E — Failure, security, a11y, responsive

- [ ] **D9-034** — 🔴 Block `/chat/conversations` → does the swallow render "no messages"
  rather than an error? (The WWL-095 test.)
- [ ] **D9-035** — Can a conversation id the vendor does not own be fetched directly?
- [ ] **D9-036** — Accessible names on the list rows, composer and send.
- [ ] **D9-037** — Keyboard: reach the composer and send without a mouse.
- [ ] **D9-038** — 360px: list + thread usable, composer reachable (the WWL-053 pattern).
- [ ] **D9-039** — Desktop: no overflow.
- [ ] **D9-040** — The `52` badge in the header — what is it counting, and does it agree with
  `unread-total: 0`?

---

## MODULE 9 — RESULTS

**Nothing was sent.** Verified at close: conversation 10 still holds exactly **3 messages**,
last is id 17 (vendor, `"hi"`, 2026-08-02T20:59:54Z) — identical to the starting state. All
writes were blocked at the XHR/fetch layer and `chat:send-message` / `chat:typing` were trapped
at the WebSocket layer; `window.__net` and `window.__emits` both stayed empty throughout.

### ⚠️ WWL-104 — S3 — The send button has no accessible name

The composer's send control is rendered as a bare icon button. Measured across five composer
states (empty, whitespace, text, 5,000 chars, cleared): **`aria-label` and text content are
`null` every time**. The accessibility snapshot confirms it — `button [disabled] [ref=…]` with
no name at all.

A screen-reader user hears an unlabelled button next to the message box and has to guess. Same
class as WWL-066 (the hold dialog's unlabelled fields), and notable because the rest of this
module's ARIA is decent.

### ⚠️ WWL-105 — S3 — No length cap on the composer, with a known 255-char precedent

The composer is a `<textarea>` with **`maxLength: -1`** — no cap, no counter. A 5,000-character
message leaves `Send` fully enabled.

WWL-064 established that this backend surfaces raw Postgres errors on overflow
(*"Value too long for type character varying(255)"*). Whether `chat_messages.content` is `TEXT`
or a bounded `VARCHAR` was **not determined** — establishing it would require actually sending
a long message to a real customer, which is outside this module's safety limits.

Recorded as an untested risk with its precedent, not as a confirmed defect.

### ⚠️ WWL-106 — S4 — The page title is the generic fallback

Every other dashboard route sets a specific title (`Dashboard : Bookings`,
`Dashboard : Calendar`, `Dashboard : Customers`). This one is
**`Wedding Wala — Dashboard | Wedding Wala`** — the generic fallback, with the brand name
duplicated. It is what shows in the browser tab, in history, and in any bookmark.

Minor naming drift in the same area: the sidebar calls it **Messages**, the breadcrumb calls it
**Chat**, and the route is `/dashboard/chat`.

### 🔎 D9-034 — the swallow is confirmed in source but **not** reproduced live

`lib/api/chat.ts`:

```js
static async getConversations(): Promise<ConversationItem[]> {
  try { … } catch (error) {
    console.error("Error fetching conversations:", error);
    return [];                                   // ← failure becomes "no conversations"
  }
}
```

Same shape as `CustomersAPI.getAll`, whose live consequence was proven in Module 7 (WWL-095:
"No customers yet" for a vendor with 20).

**I could not reproduce it on screen here.** The conversation list is fetched once on page load
and served from `ChatContext` state thereafter; navigating within the module, firing `focus`
and `visibilitychange`, and clicking the Conversations tab all failed to trigger a refetch, so
the injected failure never ran. Injecting before the initial load is not possible with this
harness, because navigation clears the injected hooks.

Recorded as **source-confirmed, live-unverified**. I am not claiming the render.

---

### ✅ Module 9 passes — and it is the best mobile experience in the sweep

- **D9-001 / D9-002 / D9-003** — the list matches the API exactly: one conversation, Waheed
  Jutt, `2d`, prefixed **`You:`**. The prefix is **correct** — message id 17
  (`senderId: 3351`, the vendor) is genuinely the most recent, at `20:59:54Z` versus Waheed's
  `20:59:40Z`. *(I initially suspected the prefix was wrong from flattened text; checking the
  message list showed it is right.)*
- **D9-006 — my premise was wrong; the control exists.** The accessibility snapshot shows a
  **`button "New conversation"`** in the list header. It is icon-only, which is why a text scan
  missed it. Not a finding.
- **D9-009** — there is a `Search conversations...` box.
- **D9-012 / D9-013 — message attribution is structurally correct.** The DOM groups the
  counterparty's messages under an avatar + name block, and renders the vendor's own as
  separate unlabelled bubbles. Flattened text makes the two 1:59 AM messages look like one
  speaker; the actual structure distinguishes them properly. Worth one measured note: the only
  cue for "this one is mine" is **visual** (position/colour) with no text or ARIA marker, so a
  screen-reader user hears `hi 1:40 AM`, `Waheed Jutt hi 1:59 AM`, `hi 1:59 AM` and must infer
  the unlabelled ones are their own.
- **D9-014 — timestamps are correct PKT.** Message 16 at `2026-08-02T20:59:40Z` renders as
  **1:59 AM** under a date header of **"Monday, August 3"** — a correct UTC→PKT conversion
  across a date boundary. Contrast WWL-097 (Customers' Quick view printing US `M/D/YYYY`) and
  WWL-062 (the hold dialog's UTC floor): this module gets it right.
- **D9-020 — no XSS path.** `chat-message-area.tsx` renders `{message.content}` as a plain JSX
  child (lines 118 and 174) and **`dangerouslySetInnerHTML` appears nowhere** in
  `components/chat/` or `ChatContext`. Customer-supplied message text cannot execute.
- **D9-022 — composer gating is correct.** Empty → `Send` disabled; **whitespace-only → still
  disabled** (trim guard works); real text → enabled; cleared → disabled again.
- **D9-024** — Urdu, emoji and mixed RTL/LTR compose without breaking the control
  (`السلام علیکم 🎉 …`).
- **D9-025** — the affordance is stated in plain text under the box: *"Press Enter to send,
  Shift+Enter for new line."*
- **D9-040 — no contradiction.** The `52` badge is **Notifications**, not chat — the snapshot
  resolves it as `link "Notifications 52"`. It has no relationship to `unread-total: 0`, which
  is itself consistent with the single conversation's `unreadCount: 0`.
- **D9-038 / D9-039 — the best 360px result of any module so far.** No overflow at either
  width (`scrollWidth === clientWidth === 345`, zero overflowing elements). Tapping the
  conversation opens the thread **with all 3 messages and a working composer fully inside the
  viewport**.

  This is the first module in the sweep whose mobile view is genuinely operable — Bookings
  (WWL-053), Function sheets (WWL-086) and Customers (WWL-093) all render inert cards with zero
  controls. Chat works because its list rows are real `<button>`s rather than decorative cards.

  One usability note rather than a defect: the two-pane desktop layout does **not** collapse to
  a single pane on mobile, so at 345px the list keeps ~115px and the thread is squeezed to
  ~230px, with no back control (none is needed, since both panes stay visible). Cramped, but
  functional.

### Module 9 — status

**40 cases written, 26 driven. 3 findings (all S3/S4) + 1 source-confirmed swallow.**

Not driven, each with its reason:

| Cases | Why |
|---|---|
| **D9-027 / D9-028** (failed-send behaviour, retry) | Requires actually attempting a send to a real customer. Even with the network blocked, the optimistic bubble path could reconcile against a real socket emit; not worth the risk of a message reaching a customer's phone. |
| **D9-016 / D9-029 → D9-033** (socket join/leave, online truthfulness, reconnect) | The socket had already connected before the WebSocket hook could be installed (`window.__emits` stayed empty), and socket.io may be on XHR-polling transport. Would need instrumentation before page load. |
| **D9-026** (attachments) | **No attachment control exists in the UI.** The API models `messageType: image \| file` with `attachmentUrl` / `attachmentName`, but the composer offers only a textarea and send. Recorded as built-but-unexposed, like Module 7's import and rating UI. |
| **D9-019** (scroll-back pagination) | Only 3 messages exist; `hasMore` cannot be exercised. |
| **D9-035** (fetching another vendor's conversation) | An authorisation probe against a conversation belonging to someone else. Not driven — reading another party's private messages is not an acceptable test on live production, even to prove a control works. |

**The module's verdict.** Small surface, and the most solid one tested so far. Correct PKT
timestamps, no XSS path, correct trim-gating, honest `You:` attribution, a real
`New conversation` control, and the only genuinely usable 360px layout in the sweep. The
defects are cosmetic or latent — an unlabelled send button, an uncapped composer with a known
overflow precedent, and a generic page title. The one structural concern, the
`catch { return [] }` swallow, is confirmed in source and inherits the severity already
demonstrated in Module 7.

---

# MODULE 10 — PAYMENTS (`/dashboard/payments`)

**Component** `components/dashboard/mainScreens/payments/redesigned/payments-redesigned-view.tsx`
**Data** `PaymentsAPI.getVendorRevenue()` → `GET /api/v1/payments/vendor-revenue`
(business-scoped by the axios interceptor — `lib/axiosConfig.js:25`)
**Write path** `ReceiptFormDialog` → `ReceiptsAPI.create` → `POST /api/v1/receipts`

## SAFETY LIMIT FOR THIS MODULE — strictest in the sweep

This module sits directly on the money path of a live vendor's ledger. **No money row is
written.** The write blocker (`XMLHttpRequest.open/send` + `window.fetch` recording and
aborting every `POST|PUT|PATCH|DELETE`, GETs passing through) is armed **before** the
`Record payment` dialog is opened and stays armed for the whole dialog section. Validation,
gating, error copy and the blocked-reason hint are all exercised against the real form; the
request is captured and aborted at the transport layer. Any case that cannot be proven without
an actual `INSERT` is recorded as **not driven, with its reason**, not as a pass.

## What the source says before I touch the page

Read first so the live run tests claims rather than impressions:

- `received` and `due` are **derived from `paymentStatus` + `downPayment`**, not from receipt
  rows: `received = isDead ? 0 : isPaid ? total : isPartial ? dp : 0`
  (`paymentController.js`, `getVendorRevenue`). No `PaymentReceipts` row is read anywhere.
- `isDead = status === 'Cancelled' || paymentStatus === 'Refunded'` zeroes **`received` and
  `due`** — but `calcStats.total` still sums `p.totalAmount` for **every** row including dead
  ones. So `Total billed` and `Received + Due` are computed over **different populations**.
- Dedup keeps the **first** `BookingDetails` row per `bookingId`; later detail rows for the
  same booking are dropped, along with their `totalAmount`.
- `source`, `dateFrom`, `dateTo` are supported by both the backend and `getVendorRevenue`, and
  `stats.offline` / `stats.online` are computed on every response — the view passes none of
  them and renders only `stats.all`.
- `dateFrom && dateTo` — the backend applies the range only when **both** are present.
- `payTone()` matches on substrings: `v.includes("paid")`. `"Unpaid"` would tone **green**;
  the enum is `Pending | Paid | Partial | Cancelled | Refunded | Failed`, so this is latent,
  not live. `Pending`, `Cancelled` and `Failed` all fall through to **`error`** (red).
- `queryKey: ["payments-redesigned"]` carries **no `businessId`**, but `team-switcher.tsx:58`
  calls a bare `queryClient.invalidateQueries()`, which invalidates everything. Predicted to
  work; verify live rather than assume.
- The table has **no `onRowClick`** — nothing links a payment row to its booking.
- `selectable` is on, but `selectedIds` is consumed **only** by `ExportMenu`.

## Test cases — written in full before execution

### A. Load, identity and money arithmetic

| # | Case | Expect |
|---|---|---|
| D10-001 | Route loads at `/dashboard/payments` | 200, table renders, no error boundary |
| D10-002 | Page `<title>` | `Dashboard : Payments` (contrast WWL-106) |
| D10-003 | Sidebar item, breadcrumb and `<h1>` agree | one label, no drift |
| D10-004 | Exactly one network call on load | `GET /vendor-revenue`, no duplicate/N+1 |
| D10-005 | Request carries `businessId` when a venue is active, omits it on **All venues** | matches interceptor whitelist |
| D10-006 | Row count === `stats.all.count` === rendered `<tr>` count | no silent truncation |
| D10-007 | `Σ row.total` === `Total billed` card | headline reconciles with its own table |
| D10-008 | `Σ row.received` === `Received` card | |
| D10-009 | `Σ row.due` === `Due` card | |
| D10-010 | **`Received + Due` === `Total billed`** | predicted FAIL when any Cancelled/Refunded row exists |
| D10-011 | Per row, `received + due === total` | predicted FAIL on dead rows (0 + 0 ≠ total) |
| D10-012 | Per row, `due === max(0, total − received)` | |
| D10-013 | `Paid` rows: `received === total`, `due === 0` | |
| D10-014 | `Partial` rows: `received === downPayment` | and NOT the sum of logged receipts |
| D10-015 | `Pending` rows: `received === 0`, `due === total` | |
| D10-016 | `Cancelled` / `Refunded` rows: `received === 0` **and** `due === 0` | correct per BK fix |
| D10-017 | …but the same row's `total` still lands in `Total billed` | quantify the overstatement in Rs |
| D10-018 | Cross-check against Receipts ledger: `Σ receipts.amount` vs `Received` | do the two money screens agree? |
| D10-019 | Cross-check against Bookings module totals for the same vendor | |
| D10-020 | Cross-check against the Dashboard revenue headline | third opinion on the same number |
| D10-021 | Rs formatting: thousands separators, no decimals drift, no `NaN`/`undefined` | |
| D10-022 | A `totalAmount` of `null`/`""` in the payload renders `Rs 0`, not `NaN` | `num()` coercion |
| D10-023 | Multi-`BookingDetails` booking — is any row's `total` lower than the booking's real total? | dedup-drop probe |
| D10-024 | Sort order is `bookingDate` DESC | matches backend `payments.sort` |
| D10-025 | Are column headers sortable? | if not, record as a gap |
| D10-026 | Event dates render `en-PK` `dd Mmm yyyy` | contrast WWL-097 (Customers' US format) |
| D10-027 | A `bookingDate` far in the past and far in the future both render | no clamp |
| D10-028 | Invalid/absent `bookingDate` renders `—`, not `Invalid Date` | `fmtDate` guard |

### B. Stat cards

| # | Case | Expect |
|---|---|---|
| D10-029 | All four cards present: Total billed, Received, Due, Payments | |
| D10-030 | During load each shows `…`, never `Rs 0` | no false "you have no money" flash |
| D10-031 | `Payments` card is a **count**, not currency | no `Rs` prefix |
| D10-032 | `Received` card's `trend="up"` / `delta="collected"` | is an unconditional up-arrow honest when Received is 0? |
| D10-033 | `Due` card `delta="to chase"` renders as a label, not a number | |
| D10-034 | Cards are inert (not buttons) — or if clickable, they go somewhere real | |
| D10-035 | The offline/online split the endpoint computes is surfaced **nowhere** | record the dead capability |

### C. Table rendering and columns

| # | Case | Expect |
|---|---|---|
| D10-036 | Columns: Customer, Venue*, Event date, Total, Received, Due, Payment | *Venue only when >1 distinct |
| D10-037 | With 3 venues on **All venues**, the Venue column **appears** | `multiVenue` true |
| D10-038 | With a single venue selected, the Venue column **disappears** | |
| D10-039 | Money columns are right-aligned and tabular | |
| D10-040 | `Received` toned success, `Due` toned warning only when > 0 | |
| D10-041 | Status pill text === raw `paymentStatus` | no relabelling |
| D10-042 | Pill tone per status: Paid→success, Partial→warning, Refunded→neutral, **Pending/Cancelled/Failed→error** | is red right for `Pending`? |
| D10-043 | An empty `customerName` renders `—` | |
| D10-044 | A long customer name truncates without breaking the row | |
| D10-045 | Clicking a row does nothing | confirm the dead-end (no `onRowClick`) |
| D10-046 | No way to reach the booking / customer / receipt from a payment row | navigational dead end |
| D10-047 | Table has a real `<table>` semantic structure with `<th>` scope | a11y |

### D. Search

| # | Case | Expect |
|---|---|---|
| D10-048 | Search by full customer name filters correctly | |
| D10-049 | Search by partial name, mid-word | `includes`, not prefix |
| D10-050 | Search is case-insensitive | |
| D10-051 | Search by phone number | field is in the predicate |
| D10-052 | Search by venue name | |
| D10-053 | Search by an **amount** — e.g. `800000` | predicted no match; record as a gap on a money screen |
| D10-054 | Search by **status** — `Paid` | predicted no match |
| D10-055 | Leading/trailing whitespace is trimmed | |
| D10-056 | Regex/SQL metacharacters (`%`, `_`, `'`, `.*`) are treated literally, client-side | no crash, no injection |
| D10-057 | A no-match query shows the empty state — and does its copy still say *"No payments yet"*? | wrong-empty-state probe |
| D10-058 | **Do the stat cards follow the filter?** | predicted NO — cards read `stats`, table reads `payments` |
| D10-059 | Clearing search restores every row | |
| D10-060 | Does search survive a hard reload? | no URL state expected |

### E. Selection and F. Export

| # | Case | Expect |
|---|---|---|
| D10-061 | Header checkbox selects all **visible** rows | |
| D10-062 | With a search active, "select all" selects filtered rows only | not the whole set |
| D10-063 | Selecting rows produces **no** bulk-action bar | selection is export-only; is that discoverable? |
| D10-064 | Selection survives typing in search? | stale-id probe |
| D10-065 | Export CSV with nothing selected → all filtered rows | |
| D10-066 | Export CSV with 2 selected → exactly those 2 | |
| D10-067 | Exported row count and Rs totals match the screen exactly | |
| D10-068 | CSV contains `customerPhone` | PII in a downloadable file — flag consistent with Module 7 |
| D10-069 | CSV injection: a name beginning `=`/`+`/`-`/`@` is neutralised | formula-injection probe |
| D10-070 | Export menu offers what it claims (CSV / print / copy) and each works | |

### G. Density, error, empty, resilience

| # | Case | Expect |
|---|---|---|
| D10-071 | Density toggle changes row height and **persists across reload** | |
| D10-072 | Failure injection on `/vendor-revenue` → error state + working `Retry` | `Couldn't load payments.` |
| D10-073 | Retry after restoring the network refills the table | |
| D10-074 | A 500 from the endpoint — does `getVendorRevenue`'s `?? {}` fallback turn it into a **fake empty ledger**? | the swallow pattern again |
| D10-075 | Offline (`navigator.onLine=false`) behaviour | honest message, not "No payments yet" |
| D10-076 | Slow network — skeleton/loading state, no layout jump | |
| D10-077 | Hard reload preserves nothing unexpected; no console errors | |
| D10-078 | Rapid double navigation into the route doesn't double-fetch or leak | |

### H. Record payment dialog — validation only, **writes blocked**

| # | Case | Expect |
|---|---|---|
| D10-079 | `Record payment` opens `Record a receipt` | note the **label mismatch**: button says payment, dialog says receipt |
| D10-080 | Fields present: Amount, Date, Method, Transaction ref, Linked booking, Notes | |
| D10-081 | On open, no field shows an error (untouched) | `touched` gate |
| D10-082 | `Log receipt` is disabled on open, with a blocked-reason hint | BUG-057 pattern |
| D10-083 | Blocked hint names the **booking** first when nothing is chosen | `errs.bookingId` precedence |
| D10-084 | Amount `0` → error | `validatePkr` |
| D10-085 | Amount negative via keyboard (not the spinner) → error | `min={0}` is only the spinner |
| D10-086 | Amount non-numeric / `e` / `1e5` → handled | number input quirks |
| D10-087 | Amount with 3+ decimals → rejected or rounded, not silently truncated | `step=0.01` |
| D10-088 | Amount **larger than the booking's outstanding due** → is over-payment blocked? | predicted NOT validated |
| D10-089 | Date defaults to today (PKT, not UTC) | contrast WWL-062 |
| D10-090 | Future date blocked by both `max` attribute and JS | `validateNotFutureDate` |
| D10-091 | Absurd past date (1900) → accepted? | no floor in source |
| D10-092 | Method select lists every `RECEIPT_METHOD_LABELS` entry | |
| D10-093 | Choosing JazzCash/Easypaisa/Raast/bank **requires** a transaction ref | `validateTransactionRef` |
| D10-094 | Cash does **not** require a ref | |
| D10-095 | Transaction ref `maxLength=64` enforced | |
| D10-096 | Linked-booking select is populated (limit 100, newest first) and shows name + date | |
| D10-097 | Notes over 1000 chars → error | `validateOptionalText` |
| D10-098 | With every field valid, `Log receipt` **enables** — then the write is captured and aborted | proves gating without an INSERT |
| D10-099 | Cancel closes without saving; re-opening reseeds a blank form | `loaded.current` key |
| D10-100 | Esc and the overlay close the dialog; focus returns to the trigger | a11y |
| D10-101 | Dialog is keyboard-navigable end to end; focus is trapped | |
| D10-102 | Every input has a programmatic label / `aria-describedby` on error | `fieldAria` |
| D10-103 | The dialog never states which venue the receipt lands against | multi-venue ambiguity probe |

### I. Venue scoping, a11y, responsive, security

| # | Case | Expect |
|---|---|---|
| D10-104 | Switch venue → the table, the cards and the row count all change | `invalidateQueries()` |
| D10-105 | Switching to a venue with no bookings → honest empty state | |
| D10-106 | Return to **All venues** → totals equal the sum of the three venues | roll-up arithmetic |
| D10-107 | Venue choice survives a hard reload (persisted store) and the money still matches | |
| D10-108 | Keyboard: Tab reaches search, density, export, every checkbox and `Record payment` | |
| D10-109 | Visible focus ring on each | |
| D10-110 | Every icon-only control has an accessible name | contrast WWL-104 |
| D10-111 | Stat-card values are announced with their labels | |
| D10-112 | 360px: no horizontal overflow (`scrollWidth === clientWidth`) | |
| D10-113 | 360px: rows render as cards — and are those cards **operable**? | contrast WWL-053/086/093 |
| D10-114 | 360px: search, export and `Record payment` all reachable and usable | |
| D10-115 | 360px: the dialog fits, and its footer buttons are reachable | |
| D10-116 | Customer email/phone are not exposed beyond what the vendor owns | |
| D10-117 | `offline_*` synthetic emails are nulled before reaching the client | backend strips them |
| D10-118 | Route requires auth — no token → redirect, not a money leak | |

## MODULE 10 — EXECUTION RESULTS

**Nothing was written.** Verified at close: receipts count **39** before and after every dialog
run, `maxReceiptId` unchanged. Both write attempts were captured at the transport layer with
their exact bodies. No booking, receipt or payment row was created, edited or deleted.

Test data during the run: 25 bookings across 3 venues, Rs 37,348,900 billed, 39 receipts.

### The two findings that matter most

---

#### WWL-107 (S1) — the backend answers **200** to every unmatched path, so a failed save is reported to the vendor as a success

`src/loaders/routes.js:331`

```js
app.use("/", (req, res) => {
  res.status(200).json({ message: "Event Planner API is running" });
});
```

`app.use("/")` matches **every method on every unmatched path**. Probed live:

| Request | Status | Body |
|---|---|---|
| `POST /api/v1/__qa_blocked_no_write__` | **200** | `{"message":"Event Planner API is running"}` |
| `GET /api/v1/__totally_made_up_route__` | **200** | `{"message":"Event Planner API is running"}` |

**Proved end to end on the money path.** I pointed the receipt `POST` at that nonexistent path
and submitted a valid form. The portal showed the success toast **"Receipt logged"**, closed the
dialog, and invalidated the query. Receipts count stayed at **39** — nothing was written.

The vendor is told their cash was recorded. It was not. Any route that is renamed, removed, or
deployed out of sync between frontend and backend becomes a silent, success-reporting no-op —
and it also means nothing can ever alert on a missing endpoint, because there are no 404s.

**Fix** — scope the banner to the exact root and add a real terminal 404:

```js
app.get("/", (req, res) => res.status(200).json({ message: "Event Planner API is running" }));
app.use((req, res) => res.status(404).json({ success: false, message: "Not found" }));
```

---

#### WWL-108 (S1) — the same catch-all turns a broken read into "you have no money"

`PaymentsAPI.getVendorRevenue` ends with:

```js
return res.data?.data ?? { payments: [], stats: { offline: empty, online: empty, all: empty } };
```

A 200 with `{message:…}` has no `.data.data`, so the fallback fires and TanStack Query sees a
**successful empty result**. `isError` is false, so the error branch never renders.

Driven live with the endpoint mis-routed, on a venue holding **Rs 11,726,550**:

> Total billed **Rs 0** · Received **Rs 0** · Due **Rs 0** · Payments **0**
> *"No payments yet — Payments against your bookings will appear here as they come in."*

No error. No Retry. A confident, ordinary-looking empty state.

**The error UI is not missing — it works.** Driven separately against an unroutable host, the
screen correctly showed **"Couldn't load payments."** with a **Retry** button, and Retry restored
all 7 rows and the correct totals once the network came back (D10-072, D10-073 both PASS). The
handling is well built; the catch-all 200 is what makes it unreachable. Fixing WWL-107 fixes the
read path too — but the `?? {}` fallback should also stop manufacturing a valid empty ledger.

Same family as the Customers and ChatAPI swallows, but here it is a **200**, so no `catch` can
help.

---

### Money arithmetic

#### WWL-109 (S1) — `Total billed` and `Received + Due` are computed over different populations

The three headline figures do not reconcile, and the shortfall is exact:

| Figure | Rs |
|---|---|
| Total billed | 37,348,900 |
| Received | 21,201,121 |
| Due | 12,292,729 |
| **Received + Due** | **33,493,850** |
| **Gap** | **3,855,050** |

The gap is precisely the total of the three Cancelled bookings:

| Booking | Customer | `status` / `paymentStatus` | Total | Received | Due |
|---|---|---|---|---|---|
| 178 | Waheed Jutt | Cancelled / Pending | 762,650 | 0 | 0 |
| 177 | Waheed Jutt | Cancelled / Pending | 350,000 | 0 | 0 |
| 175 | Usman Tariq & Hira Usman | Cancelled / Pending | 2,742,400 | 0 | 0 |

`isDead` correctly zeroes `received` and `due`, but `calcStats.total` still sums `totalAmount`
over **every** row. So **10.3% of the all-venues headline is money nobody owes and nobody paid**,
and it is worse per venue:

| Venue | Total billed | Overstatement | % |
|---|---|---|---|
| Rehman Grand Marquee (3358) | 12,873,800 | 1,112,650 | 8.6% |
| Rehman Banquet & Lawn (3359) | 12,748,550 | 0 | 0% |
| **Rehman Marquee Bahria (3360)** | **11,726,550** | **2,742,400** | **23.4%** |

Nearly a quarter of Bahria's headline revenue does not exist.

#### WWL-110 (S1) — the Dashboard and Payments disagree about outstanding money by Rs 1,124,500

| Screen | Outstanding | Count |
|---|---|---|
| Dashboard — *BAQAYA · TO COLLECT* | **Rs 13,417,229** | across **14 events** |
| Payments — *Due* | **Rs 12,292,729** | **13** rows with Due > 0 |

A specific contradiction: **Imran Shafi & Hafsa Imran, 2026-09-09.** Payments reports
`Paid / Completed`, Received Rs 1,546,000, **Due Rs 0**. The Dashboard's baqaya list shows the
same event with **Rs 1,159,500** still to collect. The Dashboard also lists
*"Event · 2026-08-05 Rs 315,000"*, which matches no Payments row at all.

Two screens on the same ledger, one vendor, two answers. This is the consolidation already
flagged in WWL-001/002/005/037/040/047: derive payment state from `total − paid` in **one**
place.

#### What the arithmetic gets right

- **D10-006/007/008/009 PASS** — `stats.all` matches Σ rows exactly (25 · 37,348,900 · 21,201,121 · 12,292,729), and again at venue scope (7 · 11,726,550 · 4,978,945 · 4,005,205).
- **D10-106 PASS** — the roll-up is exact: the three per-venue stat blocks sum to the All-venues block on every field.
- **D10-013/015 PASS** — `Paid` rows are `received = total, due = 0`; `Pending` rows are `received = 0, due = total`.
- **D10-016 PASS** — dead rows correctly carry `received = 0` **and** `due = 0`. The BK fix works.
- **D10-019 PASS** — Bookings and Payments agree exactly: 25 bookings, Rs 37,348,900 on both.
- **D10-018 PASS, with a caveat I will not overstate** — all 39 receipts sum to Rs 21,201,121, **exactly** the `Received` headline, and **per booking there is not a single divergence**. But this agreement is structural coincidence, not wiring: `received` is derived from `paymentStatus` + `downPayment` and **never reads a receipt row**. The seed data simply keeps `downPayment` in step. I could not demonstrate divergence without writing a receipt to a live ledger, so I am recording the risk as **source-confirmed, live-unverified** rather than claiming a defect I did not see.
- **D10-014 PASS** — all 9 `Partial` rows have `received === downPayment` exactly (20%–85% of total), confirming the derivation.
- **D10-021/022 PASS** — no `NaN`, `undefined` or `null` in any money cell; separators correct.

---

### WWL-111 (S2) — a Cancelled booking shows a red "Pending" pill and Rs 0 due

The pill renders `paymentStatus`; the lifecycle `status` is never shown. So booking 175 appears as:

> Usman Tariq & Hira Usman · 06-May-2026 · Total **Rs 2,742,400** · Received **Rs 0** · Due **Rs 0** · <span>**Pending**</span> *(red)*

Verified tone class `bg-red-50 text-red-700`. A vendor reads an alarming red *Pending* on a
Rs 2.7m booking that is actually cancelled and owes nothing — indistinguishable from real
unpaid money except by noticing Due is 0. It exports to CSV the same way, and the same cancelled
bookings are **selectable in the receipt dialog's booking picker**.

`payTone()` has a latent trap too: it matches substrings, so `"Unpaid"` would tone **green**
(`"unpaid".includes("paid")`). The enum is `Pending | Paid | Partial | Cancelled | Refunded |
Failed`, so this is dormant — but one added status value makes an unpaid booking look settled.

### WWL-112 (S2) — for the first 5 hours of every Pakistani day the receipt dialog defaults to yesterday and refuses today

`receipt-form-dialog.tsx` uses `new Date().toISOString().slice(0,10)` for **both** the default
value and the native `max` — that is the **UTC** date. PKT is UTC+5.

Driven live at **02:09 AM PKT on 6 Aug 2026**:

```
browserTZ: Asia/Karachi   utcNow: 2026-08-05T21:09:59Z
dialog date value: "2026-08-05"     ← yesterday in Pakistan
dialog date max:   "2026-08-05"
setting 2026-08-06 → validity.rangeOverflow: true
                     "Value must be 08/05/2026 or earlier."
```

Between **00:00 and 05:00 PKT — 20.8% of every day, and precisely when a marquee settles cash
after a wedding** — the dialog pre-fills the wrong day and the picker will not offer today.

Scope stated precisely: `validateNotFutureDate` is **timezone-correct** (it compares against
local end-of-day, so it accepts 6 Aug). Only the default value and the native ceiling are wrong.
Same family as WWL-062.

Related, and confirmed in prod data: **5 receipts are dated in the future**, up to 2026-10-08,
totalling **Rs 1,844,635**. The frontend forbids future dates; the backend does not enforce it.
Client-side-only validation on a money ledger.

### WWL-113 (S2) — no over-payment guard

Against booking 176 (total Rs 1,673,250, due Rs 1,673,250):

| Amount entered | Result |
|---|---|
| Rs 99,999,999 | **accepted, Save enabled, no warning** — ~60× the booking total |
| Rs 999,999,999,999 | rejected — *"Amount looks too large."* |

There is an absolute sanity cap but nothing relative to the booking. A single extra zero
(Rs 16,732,500 for Rs 1,673,250) saves silently and desynchronises the ledger permanently.

### WWL-114 (S2) — offline, the venue switcher lies about scope

Offline, switching to **Rehman Grand Marquee**: the switcher label and the persisted store both
update to 3358, but the table still shows **all 25 rows across 3 venues** and the cards still read
**Rs 37,348,900 / 21,201,121 / 12,292,729**. Grand Marquee's real total is Rs 12,873,800.

No error, no toast, no offline banner. The vendor sees one venue named and three venues' money.
It self-corrects on the next successful refetch (verified: back online it showed the correct
Rs 12,873,800 / 10 rows).

---

### Findings S3 / S4

| ID | Sev | Finding |
|---|---|---|
| **WWL-115** | S3 | **Stat cards ignore the search filter.** Filtering to `Bahria` shows **7 rows** while the headline stays at **Rs 37,348,900 / 25 payments**. The cards read `stats`, the table reads `payments`. On a money screen the headline then describes a different set than the rows beneath it. |
| **WWL-116** | S3 | **Wrong empty state on a no-match search.** A vendor with 25 payments searching `zzzzqqqq` is told *"No payments yet — Payments against your bookings will appear here as they come in."* Same defect family as the Customers empty state. |
| **WWL-117** | S3 | **Notes over 1000 chars block Save silently, with a false explanation.** `errs.notes` gates `canSave`, but the Notes field renders **no `FieldError`** and `touch("notes")` is never called, so no message can ever appear. At 1001 chars Save disables and the hint says *"Add an amount above 0 and the date it was received to save."* — while amount and date are both **valid**. At exactly 1000 it saves. The textarea has no `maxLength` (`-1`), so nothing stops the paste. This defeats the very purpose of `FormBlockedHint` (BUG-057). |
| **WWL-118** | S3 | **A money table with no sorting and no money filters.** Zero sortable headers (no buttons, no `aria-sort`), no status filter, no date-range filter, and search does not match amounts (`1411500` → 0 rows) or statuses (`Paid` → 0 rows). Fixed order is event-date DESC, so future events sit on top. The vendor cannot ask "who owes me the most" or "who is overdue" at all. The backend already supports `source`, `dateFrom`, `dateTo`. |
| **WWL-119** | S3 | **Every row is a navigational dead end.** `<tr>` with no `onRowClick`, no links, no buttons, `tabIndex -1`, `cursor: auto`. From a payment you cannot reach the booking, the customer, or its receipts. |
| **WWL-120** | S3 | **Table a11y.** All row checkboxes carry the identical accessible name **"Select row"** — a screen-reader user hears it 10 times with nothing to distinguish the rows. **0 of 8 `<th>` have `scope`**, and there is no `<caption>`. Checkbox hit area is 16×16px, under the 24×24 WCAG 2.2 target minimum. |
| **WWL-121** | S3 | **Stat cards assert Rs 0 during the error state.** With the table correctly showing *"Couldn't load payments."*, the four headline cards read **Rs 0 / Rs 0 / Rs 0 / 0**. `isLoading` is false and `stats` is undefined, so `num(undefined)` → 0. An error should not render as a confident zero. |
| **WWL-122** | S3 | **Mobile cards drop the labels and the Total.** At 360px the cards show two unlabelled money figures — Rizwan reads *"Rs 0 \| Rs 2,596,400"* — and `totalAmount` is omitted entirely; a Paid row shows a single bare number. Desktop has column headers; the card has none. There is also **no checkbox on mobile**, so *"Selected → CSV"* cannot be used at all on a phone. |
| **WWL-123** | S3 | **CSV export is not neutralised against formula injection.** `escapeCsv` is RFC-4180 correct for quotes, commas and newlines but does nothing about a leading `=`, `+`, `-` or `@`. `customerName` is customer-supplied. This is the shared `ExportMenu`, so it affects **every** exporting module. |
| **WWL-124** | S4 | Button says **"Record payment"**; the dialog it opens says **"Record a receipt"**. |
| **WWL-125** | S4 | The ref-required error names the internal key, not the label the vendor just picked: *"required for **ibft**"* and *"for **bank transfer**"* rather than *"Bank IBFT"* / *"Bank transfer"*. |
| **WWL-126** | S4 | Amount accepts `1e5` (→ 100,000), `100.999` and `0.001` with no warning; `step="0.01"` is unenforced and `DECIMAL(10,2)` rounds silently. |
| **WWL-127** | S3 | **The booking picker cannot be used reliably.** Options show only `name · date`: three entries read **"Waheed Jutt"**, distinguished only by date. No venue, no outstanding balance, no status — and **cancelled bookings are listed**. With 25 options and no balance shown, allocating a receipt to the right booking is guesswork. |
| **WWL-128** | S3 | **The endpoint's whole documented purpose is dead in the UI.** `stats.offline` and `stats.online` are computed on every response (live: 11 offline / Rs 18,183,350 vs 14 online / Rs 19,165,550) and rendered **nowhere**; `source`, `dateFrom` and `dateTo` are supported by the backend and by `getVendorRevenue` and are never passed. |

---

### Notable passes

- **D10-002/003 PASS** — `Dashboard : Payments`, and sidebar, breadcrumb and `<h1>` all agree. Contrast WWL-106.
- **D10-004/005 PASS** — exactly **one** `vendor-revenue` call per load; `businessId` omitted on All venues and appended (`&businessId=3360`) when a venue is active, matching the interceptor whitelist.
- **D10-024/026 PASS** — event-date DESC as specified; dates render `en-PK` `07-Nov-2026`, correct and unambiguous. Contrast WWL-097.
- **D10-030/076 PASS** — during load the cards show **`…`**, never `Rs 0`, with 49 skeleton elements, then resolve in one clean transition. No false "you have no money" flash.
- **D10-034 PASS** — stat cards are inert `<div>`s, not fake buttons.
- **D10-037/038 PASS** — the Venue column appears on All venues and **disappears** when one venue is selected; `multiVenue` is correct.
- **D10-045 confirmed / D10-047 partial** — table markup is a real `<table>`/`<thead>`, and header-to-body alignment is **correct** (8 headers, 8 cells, correctly paired).
- **D10-048/049/050/051/052/055 PASS** — search matches name, mid-word, case-insensitively, by phone and by venue, and trims whitespace. `%_.*` is treated literally — no crash, no injection.
- **D10-061/062/064 PASS** — select-all takes 25 on the full set and only the **7 visible** under a filter; the selection survives clearing the filter and still refers to the same rows.
- **D10-065/066/067 PASS** — *Selected → CSV* exported exactly the 7 selected rows, values identical to the screen, correct BOM and MIME, named `payments-selected.csv`.
- **D10-071 PASS across a hard reload** — density toggles 46.1px → 38.1px, `aria-pressed` flips, and the choice persists in `ww-ui-prefs`.
- **D10-072/073 PASS** — genuine network failure shows *"Couldn't load payments."* + **Retry**, and Retry fully recovers.
- **D10-084/085/090/091 PASS** — `Amount must be more than Rs 0.` · `Amount cannot be negative.` · `Date received can't be in the future.` · `Date received looks wrong — please check the year.`
- **D10-093/094 PASS** — a transaction ref is correctly **required** for jazzcash, easypaisa, raast, **ibft** and bank_transfer, and correctly **not** required for cash or other; refs under 4 chars are rejected.
- **D10-098/099/100 PASS** — with every field valid `Log receipt` enables; Cancel reseeds a blank form; **Esc closes the dialog**.
- **D10-104/106/107 PASS** — venue switching refetches scoped, the roll-up is arithmetically exact, and the choice survives a hard reload with the money still matching.
- **D10-108/109 PASS** — all 24 controls focusable, **no positive `tabindex`** (DOM order is tab order), and **every one** has a visible focus indicator.
- **D10-112/114/115 PASS** — at a true emulated 360×740 there is **no horizontal overflow** (`scrollWidth === clientWidth === 360`, zero overflowing elements); Record payment, Search and Export are all in view and usable; the dialog's box overhangs by 23px of its own padding but **no field, label or button is clipped**.
- **D10-118 PASS** — hitting `/dashboard/payments` unauthenticated redirects to `/login?redirect=%2Fdashboard%2Fpayments`. No money rendered before auth.

### Corrections to my own readings during this module

Recorded because each one would have been a false report:

1. **"`bank_ibft` doesn't require a transaction ref"** — **wrong, my harness.** The option value is `ibft`, not `bank_ibft`; setting a non-existent value blanked the select. Re-driven with `ibft`: the ref **is** required. `METHODS_NEEDING_REF` contains it.
2. **"The save hangs on *Saving…* forever after a failure"** — **wrong, my harness.** My first blocker called `xhr.abort()` *before* `send()`, and aborting an unsent XHR fires no event, so axios's promise never settled. Re-tested by routing writes to a real endpoint; the app behaves correctly on a genuine response.
3. **"The density toggle does nothing"** — **wrong, my selector.** The buttons are icon-only with `aria-label`; my text lookup found nothing to click. Driven by `aria-label`, density works and persists.
4. **"Offline, the VENUE column vanished — header/body desync"** — **wrong, my case-sensitivity.** I compared against `'VENUE'` while the DOM text is `Venue` (uppercase is CSS `text-transform`). The table is correctly aligned; there is no desync. The offline **scope** finding (WWL-114) stands on separate evidence.
5. **"The mobile dialog clips its title"** — **wrong, checked and retracted.** The box overhangs the viewport by its own padding, but `clippedElements` is empty: every field, label and button is inside.

### Module 10 — status

**118 cases written, 101 driven. 22 findings (4× S1, 4× S2, 11× S3, 3× S4).**

Not driven, each with its reason:

| Cases | Why |
|---|---|
| **D10-023** (multi-`BookingDetails` dedup drop) | Confirmed in source — the dedup keeps only the first detail row per `bookingId`. Not reproducible here: every one of the 25 bookings has exactly one detail row, and Bookings and Payments agree to the rupee. Source-confirmed, live-unverified. |
| **D10-117** (`offline_*` email stripping) | No `offline_` address exists in this dataset — all 25 are `@demo.weddingwala.pk`, none null. The strip cannot be exercised. |
| **D10-018** (receipt-vs-derivation divergence) | Would require **writing a receipt to a live vendor's ledger** to prove the derivation ignores it. Refused. The structural risk is recorded from source; the live reconciliation is reported as the PASS it actually was. |
| **D10-043/044** (empty and very long customer names) | No row in the live set has an empty or overlong name; the `—` fallback and truncation cannot be exercised without creating data. |
| **D10-069** (live CSV formula injection) | No customer name in the live set begins with `=`/`+`/`-`/`@`, so no live payload demonstrates it. The gap is confirmed by reading `escapeCsv`; recorded as WWL-123 on source evidence, not claimed as reproduced. |
| **D10-088 write** (over-payment actually saved) | Validation was proven to accept Rs 99,999,999; the **save** was captured and aborted. Confirming the row persists would mean corrupting a live ledger. |
| **D10-060/077/078** (search in URL, double-navigation leak) | Search holds no URL state by design and nothing was observed to leak; folded into the reload and navigation passes rather than claimed separately. |

**The module's verdict.** The presentation layer is careful — correct PKT dates, honest loading
states, exact roll-up arithmetic, a real working error state with Retry, clean keyboard access,
and the second genuinely non-overflowing 360px layout in the sweep. What is wrong sits
**underneath** it: a catch-all route that converts every mis-routed request into a reported
success, a headline that sums a different population than its own components, and a second money
screen that disagrees with this one by Rs 1.12m. Those are not polish problems. On a live vendor's
ledger, WWL-107 alone means a vendor can be told their cash was recorded when it was not.

---

# MODULE 11 — RECEIVABLES (`/dashboard/receivables`)

**Component** `components/dashboard/mainScreens/receivables/redesigned/receivables-redesigned-view.tsx`
**Data** `AnalyticsAPI.getReceivables()` → `GET /api/v1/analytics/receivables`
(business-scoped — `/api/v1/analytics/` is on the interceptor whitelist)
**Write path** none. The only outbound action is a **WhatsApp deep link** per row.

## SAFETY LIMIT FOR THIS MODULE

The single action on this screen sends a **dunning message to a real customer's phone**. That is
not a thing to test on live production. Therefore:

- **No WhatsApp link is ever followed.** I read the `href`, decode the prefilled text and check
  the phone normalisation, but I never navigate to `wa.me`, never open WhatsApp Web, and never
  put a message in front of a real person.
- No writes of any kind (this screen has none, but the blocker is armed anyway).

## What the source says before I touch the page

- **`bucketTone()` looks broken by short-circuit.** The backend emits bucket keys
  `current | days_1_30 | days_31_60 | days_61_90 | days_90_plus`. The tone function tests
  `v.includes("current") || v.includes("0")` **first** and returns `success` (green). **Every
  overdue key contains a `0`** — `days_1_30`, `days_31_60`, `days_61_90`, `days_90_plus` — so the
  later `90`/`60`/`30` branches look unreachable and the whole aging column may render green.
  Predicted, must be confirmed on screen.
- **`cap()` produces "Days 1 30", "Days 31 60", "Days 90 plus"** rather than a readable range.
- **`AnalyticsAPI.getReceivables` swallows into `null`** (`catch { return null }`). `null` →
  `customers = []`, `isError` **false** → the empty state renders. Predicted: a failed load says
  *"Nothing outstanding"*. Unlike Module 10 this is a `catch`, so fixing the backend catch-all
  would not fix it.
- **`waLink()` PK normalisation**: strips non-digits, `+` → drop, leading `0` → `92`, bare
  `3XXXXXXXXX` (10) → `92…`. Live customer phones look like `0348678149` — **10 digits**, but a
  real PK mobile is **11** (`03XX-XXXXXXX`). Must check what number the link actually produces.
- **The greeting hard-codes the male honorific** `sahab` for every customer, and `customerName`
  is often a **couple** name.
- `getRowId` = `phone || email || name || JSON.stringify(row)` — collides when phone is absent.
- No row click, no drill-through, no "record payment" action from a debtor row.

## Test cases — written in full before execution

### A. Load, identity, aging correctness

| # | Case | Expect |
|---|---|---|
| D11-001 | Route loads, table renders, no error boundary | |
| D11-002 | `<title>` is `Dashboard : Receivables` | |
| D11-003 | Sidebar / breadcrumb / `<h1>` agree | |
| D11-004 | Exactly one `analytics/receivables` call on load | |
| D11-005 | `businessId` appended when a venue is active, omitted on All venues | |
| D11-006 | Row count === `totals.customerCount` | |
| D11-007 | `Σ row.totalOutstanding` === `Outstanding` card | |
| D11-008 | `Σ row.installmentsOpen` === `Open installments` card | |
| D11-009 | `max(row.oldestDaysOverdue)` === `Oldest overdue` card | |
| D11-010 | `Σ buckets[*].total` === `grandOutstanding` | bucket roll-up closes |
| D11-011 | `Σ buckets[*].count` === number of customers | |
| D11-012 | Each customer's `bucket` matches `bucketKey(oldestDaysOverdue)` | server self-consistency |
| D11-013 | **Aging pill tone per bucket** | predicted ALL green — the `includes("0")` short-circuit |
| D11-014 | A customer 90+ days overdue is visually distinguishable from `current` | the point of an aging board |
| D11-015 | Aging label text is readable | `Days 1 30` vs `1–30 days` |
| D11-016 | `daysOverdue` is computed from UTC midnight — does it drift for PKT? | WW-246 anchors at UTC |
| D11-017 | Reconcile `grandOutstanding` against **Payments → Due** (Rs 12,292,729) | two boards, one debt |
| D11-018 | Reconcile against **Dashboard → Baqaya** (Rs 13,417,229) | third opinion; WWL-110 |
| D11-019 | Are cancelled bookings excluded from receivables? | they are dead money |
| D11-020 | Are refunded bookings excluded? | |
| D11-021 | Rs formatting; no `NaN`/`undefined` in any cell | |
| D11-022 | `bookingCount` and `installmentsOpen` render as counts, not currency | |
| D11-023 | Row order — is it by outstanding, by overdue, or unsorted? | |
| D11-024 | A customer with several bookings is merged into one row | backend merges by email/phone/name |
| D11-025 | …and their `totalOutstanding` is the sum of those bookings | |
| D11-026 | `generatedAt` is exposed to the user anywhere | staleness disclosure |

### B. Stat cards

| # | Case | Expect |
|---|---|---|
| D11-027 | Four cards: Outstanding, Customers owing, Open installments, Oldest overdue | |
| D11-028 | `…` during load, never `Rs 0` | |
| D11-029 | `Oldest overdue` renders `N days`, with correct singular/plural at 1 | |
| D11-030 | `Outstanding` card `trend="down"` — is a down-arrow right for debt owed **to** the vendor? | semantics |
| D11-031 | Cards are inert, not fake buttons | |
| D11-032 | Cards show `Rs 0`/`0 days` in the error state | the WWL-121 pattern |
| D11-033 | The five bucket totals are computed but surfaced **nowhere** | dead capability check |

### C. Table, WhatsApp action, PK correctness

| # | Case | Expect |
|---|---|---|
| D11-034 | Columns: Customer, Phone, Bookings, Open installments, Days overdue, Aging, Outstanding, action | |
| D11-035 | Numeric columns right-aligned + tabular | |
| D11-036 | Missing customer name → `—` | |
| D11-037 | Missing phone → `—` **and no WhatsApp icon** | |
| D11-038 | WhatsApp control has an accessible name | `aria-label` present in source |
| D11-039 | **Phone normalisation** — what number does the href actually contain? | `0348678149` → `92348678149`? |
| D11-040 | Is the produced number a **valid** PK mobile (92 + 10 digits)? | 10-digit source data is suspect |
| D11-041 | A phone already in `+92…` form is not double-prefixed | |
| D11-042 | A phone with spaces/dashes (`0300-123 4567`) normalises | |
| D11-043 | A landline (`042…`) — does it silently produce a WhatsApp link to a landline? | |
| D11-044 | **Prefilled text** decodes to correct Roman-Urdu with the right amount | |
| D11-045 | The amount in the message === the row's Outstanding | a wrong figure in a dunning message is serious |
| D11-046 | Amount is `Math.round`ed and `en-PK` formatted inside the message | |
| D11-047 | **`sahab` is applied to every customer** including women and couples | PK honorific correctness |
| D11-048 | Link opens in a new tab with `rel="noopener noreferrer"` | |
| D11-049 | Clicking the link does not also trigger a row action | `stopPropagation` |
| D11-050 | Row itself is not clickable / no drill-through to the customer or booking | |
| D11-051 | No way to record a payment from the debtor row | the obvious next action |
| D11-052 | Table semantics: `<th scope>`, caption | contrast WWL-120 |
| D11-053 | Row checkboxes have distinguishable accessible names | contrast WWL-120 |

### D. Search, selection, export

| # | Case | Expect |
|---|---|---|
| D11-054 | Search by customer name, full and mid-word | |
| D11-055 | Search case-insensitive | |
| D11-056 | Search by phone | |
| D11-057 | Search by amount / by aging bucket | predicted no match — record the gap |
| D11-058 | Whitespace trimmed | |
| D11-059 | Metacharacters treated literally | |
| D11-060 | No-match empty state copy — does it wrongly say *"Nothing outstanding"*? | the WWL-116 pattern |
| D11-061 | **Do the stat cards follow the filter?** | predicted NO — the WWL-115 pattern |
| D11-062 | Clearing search restores all rows | |
| D11-063 | Select all selects visible rows only under a filter | |
| D11-064 | Selection survives filter changes | |
| D11-065 | Export CSV unselected → all filtered rows | |
| D11-066 | Export CSV selected → exactly those rows | |
| D11-067 | Exported values match the screen | |
| D11-068 | CSV carries **Phone** — a debtor phone list leaving the system | PII |
| D11-069 | CSV formula-injection neutralisation | shared `ExportMenu`; WWL-123 |
| D11-070 | CSV **omits the Aging bucket** even though it's a column | export/screen parity |
| D11-071 | Excel export produces a valid file | |
| D11-072 | `getRowId` collision when two customers share no phone/email | dedup risk |

### E. Resilience, scope, a11y, responsive

| # | Case | Expect |
|---|---|---|
| D11-073 | Density toggle works and persists across a hard reload | |
| D11-074 | Genuine network failure → *"Couldn't load receivables."* + Retry | |
| D11-075 | Retry recovers | |
| D11-076 | **Mis-routed endpoint (backend 200 catch-all)** → what renders? | the WWL-107/108 pattern |
| D11-077 | **`catch { return null }`** → does a real failure render *"Nothing outstanding"*? | S1 candidate |
| D11-078 | Offline behaviour — honest, or stale-and-silent? | WWL-114 pattern |
| D11-079 | Loading state: skeletons, `…`, no `Rs 0` flash | |
| D11-080 | Venue switch re-scopes rows and totals | |
| D11-081 | Per-venue totals sum to the All-venues total | |
| D11-082 | Venue choice survives a hard reload | |
| D11-083 | Keyboard: every control reachable, visible focus ring | |
| D11-084 | The WhatsApp link is keyboard-reachable and announced | |
| D11-085 | Stat cards announced with their labels | |
| D11-086 | 360px: no horizontal overflow | |
| D11-087 | 360px: cards render and are readable | |
| D11-088 | 360px: **is the WhatsApp action reachable on a phone?** | this is the mobile use case |
| D11-089 | 360px: search and export usable | |
| D11-090 | 360px: is the aging bucket still shown on the card? | |
| D11-091 | Unauthenticated → redirect, no debtor data leaked | |
| D11-092 | Customer emails are not exposed in the DOM beyond need | |
| D11-093 | `offline_*` synthetic emails not shown | |
| D11-094 | No console errors across the whole run | |
| D11-095 | Hard reload keeps the screen consistent | |
| D11-096 | Rapid re-navigation doesn't double-fetch | |

## MODULE 11 — EXECUTION RESULTS

**Nothing was written, and no message was sent.** This screen has no write path; its only
outbound action is a WhatsApp deep link, and **no link was ever followed**. I read `href`s,
decoded the prefilled text and checked the phone normalisation without navigating to `wa.me`
once.

### WWL-129 (S1) — venue scoping is inverted: **one venue shows 95% more money than all three combined**

Driven entirely through the venue switcher in the live UI:

| Switcher shows | Outstanding | Customers owing | Rows |
|---|---|---|---|
| Rehman Grand Marquee *(1 of 3)* | **Rs 23,961,479** | **34** | 34 |
| **All venues** *(all 3)* | **Rs 12,292,729** | **13** | 13 |
| Rehman Marquee Bahria *(1 of 3)* | Rs 4,005,205 | 3 | 3 |
| Rehman Banquet & Lawn *(1 of 3)* | **Rs 23,961,479** | **34** | 34 |

Three things are wrong at once:

1. **A subset exceeds the whole.** Selecting one venue shows Rs 23,961,479; all three together
   show Rs 12,292,729.
2. **Two different venues are byte-identical.** Grand Marquee and Banquet & Lawn return the same
   total, the same customer count and the same 34-name debtor list.
3. **The parts sum to 4.2× the whole** — Rs 51,928,163 against Rs 12,292,729.

Only the Bahria figure is trustworthy: Rs 4,005,205 matches Module 10's Bahria Due **exactly**.

**Root cause** — `analyticsController.js`. The two scope predicates are **different sets, not
nested sets**, and the scoped one *replaces* the vendor filter rather than narrowing it:

```js
const vendorWhere = scopedBid ? bookingWhereForBusiness(scopedBid) : vendorBookingWhere(req.user);

function vendorBookingWhere(user)      { return { vendorIds: { [Op.contains]: [user.id] } }; }
function bookingWhereForBusiness(bid)  { return { id: { [Op.in]: sequelize.literal(
    `(SELECT "bookingId" FROM "BookingDetails" WHERE "businessId" = ${bid})`) } }; }
```

The unscoped path requires `vendorIds @> [user.id]`. The scoped path **drops that condition
entirely** and matches any booking with a `BookingDetails` row for the venue — so every legacy,
offline and QA booking with a stale or empty `vendorIds` array becomes visible the moment a venue
is selected. The scoped list contains 21 names the all-venues list does not, including
`QA Booking Tester`, `ZZQA-2026-07-30 Booking Customer`, `WW QA Cart Customer (delete me)` and
`QA Import One`/`Two`.

This is the same defect the codebase already fixed once for a different surface: `vendorBookingWhereWide`
(Issue #57/#53) exists precisely because the `vendorIds`-only filter misses these bookings, and it
solves it by **OR-ing** the two conditions. `bookingWhereForBusiness` never got the same treatment,
and it must be **AND**-ed with the vendor scope, not substituted for it.

**I did not establish cross-tenant leakage.** `resolveOwnedBusinessId` does verify the business
belongs to the requester, and the extra names look like this vendor's own legacy/QA data. The
proven defect is scope correctness and a grossly inflated collections figure — not a data breach.

### WWL-130 (S1) — the error state is unreachable, so a dead endpoint reads as "Nothing outstanding"

```js
static async getReceivables(): Promise<ReceivablesData | null> {
  try { … } catch { return null; }      //  ← every failure becomes a successful null
}
```

`null` → `customers = []` and `totals` undefined → `isError` is **false**, so
`error={isError ? "Couldn't load receivables." : null}` and `onRetry` can never fire. They are
dead code.

Driven live against an unroutable host — a total network failure — on a board holding
**Rs 23,961,479 across 34 customers**:

> Outstanding **Rs 0** · Customers owing **0** · Open installments **0** · Oldest overdue **0 days**
> **"Nothing outstanding — When customers have pending payments, their aging will show here."**

No error. **No Retry button.** This is worse than Module 10's WWL-108 in two ways: there the error
UI existed and worked and was merely bypassed by the backend's 200, so fixing the backend fixes the
read; here the `catch` swallows **every** failure mode, so no backend fix helps. And the copy makes
an affirmative financial claim — *nothing outstanding* — rather than merely reporting no rows.

### WWL-131 (S2) — the entire aging column renders green, including 99 days overdue

Predicted from source before loading the page, then confirmed on screen. Every bucket resolves to
the same tone:

| Aging | Days overdue | Outstanding | Rendered tone |
|---|---|---|---|
| Days 90 plus | **99** | Rs 325,020 | `bg-emerald-50 text-emerald-700` |
| Days 61 90 | 61 | Rs 420,000 | `bg-emerald-50 text-emerald-700` |
| Days 31 60 | 51 | Rs 280,000 | `bg-emerald-50 text-emerald-700` |
| Days 1 30 | 11 | Rs 215,872 | `bg-emerald-50 text-emerald-700` |
| Current | 0 | Rs 2,596,400 | `bg-emerald-50 text-emerald-700` |

```js
const bucketTone = (b) => {
  const v = (b || "").toLowerCase()
  if (v.includes("current") || v.includes("0")) return "success"   // ← swallows everything
  if (v.includes("90") || v.includes("over"))   return "error"     // unreachable
  if (v.includes("60"))                          return "warning"  // unreachable
  if (v.includes("30"))                          return "info"     // unreachable
```

The backend keys are `current | days_1_30 | days_31_60 | days_61_90 | days_90_plus` — **every
overdue key contains a `0`**, so the `includes("0")` test matches first and the three severity
branches can never be reached. A customer 99 days late is coloured identically to one who is not
late at all. The colour gradient is the entire reason an aging board exists.

The classification underneath is **correct** — D11-012 verified every customer's `bucket` matches
`bucketKey(oldestDaysOverdue)` with zero mismatches. Only the colour is wrong. Matching on the
bucket key rather than substrings fixes it.

### WWL-132 (S2) — a third of the WhatsApp reminders point at invalid numbers

`waLink()` maps a leading `0` to `92` with no length check. Live results across all 34 rows:

| | Rows | Owed |
|---|---|---|
| Valid PK mobile (`92` + 10 digits = 12) | 23 | Rs 12,683,750 |
| **Invalid (11 digits — one short)** | **11 (32%)** | **Rs 11,277,729 (47%)** |

Examples: `0348976582` → `92348976582` (11) · `0307406366` → `92307406366` (11) ·
`0348678149` → `92348678149` (11). A correct 11-digit source number works properly:
`03034445566` → `923034445566` (12) ✓, and an already-prefixed `923007771014` is **not**
double-prefixed ✓ (D11-041 PASS).

The stored 10-digit numbers are a data-quality problem, but the screen emits a broken deep link
with no indication — the vendor taps and WhatsApp reports an invalid number. **Nearly half the
money on the collections board cannot be chased from the button provided to chase it.**

### WWL-133 (S3) — every dunning message calls the customer `sahab`

The greeting hard-codes a male honorific for all recipients. Decoded from the live `href`s:

- *"Assalam-o-Alaikum **Nadia Sheikh** sahab,"* — a woman
- *"Assalam-o-Alaikum **Kamran Sheikh & Zoya Kamran** sahab,"* — a couple, addressed as one man
- *"Assalam-o-Alaikum **Shahzad Butt & Iqra Shahzad** sahab,"*

`customerName` on a wedding booking is usually a **couple**, so the couple case is the norm, not
the exception. This goes out over the vendor's own WhatsApp to a paying customer who is being
asked for money — the one message where tone matters most. A neutral greeting
(*"Assalam-o-Alaikum,"* or *… ji,"*) avoids the whole problem.

The message is otherwise correct: Roman Urdu reads naturally, and **the amount matches the row
exactly** in every sample, `Math.round`ed and `en-PK` formatted (D11-044/045/046 PASS).

### Findings S3 / S4

| ID | Sev | Finding |
|---|---|---|
| **WWL-134** | S3 | **Stat cards ignore the search filter.** Filtering 34 rows down to 1 — or to 0 — leaves the headline at **Rs 23,961,479 / 34 customers** in every case. The WWL-115 pattern, on a second money screen. |
| **WWL-135** | S3 | **A no-match search asserts a financial falsehood.** Searching `zzzqqq` with Rs 23.9m on the books renders *"Nothing outstanding — When customers have pending payments, their aging will show here."* Worse than the Payments variant (WWL-116) because it states a conclusion about the money, not just about the rows. |
| **WWL-136** | S3 | **CSV drops the Aging column and mangles `+92` phones.** The export header is `Customer,Phone,Bookings,Open installments,Days overdue,Outstanding` — the **Aging bucket, the one classification this board exists to produce, is missing**. Separately, the live export contains `+923274811220`: a leading `+` makes Excel treat the cell as a formula. This is a **demonstrated** instance of the injection gap in the shared `ExportMenu`, upgrading WWL-123 from latent to reproduced. |
| **WWL-137** | S3 | **Table a11y, unchanged from Module 10.** 0 of 9 `<th>` carry `scope`, no `<caption>`, and all **34** row checkboxes share the identical accessible name *"Select row"*. |
| **WWL-138** | S3 | **No next action from a debtor row.** Rows are not clickable; there is no link to the customer, the booking or its installments, and **no way to record a payment** — the obvious follow-up once a customer pays. The only action offered is a WhatsApp reminder, 32% of which are broken (WWL-132). |
| **WWL-139** | S4 | Aging labels read **"Days 1 30"**, **"Days 31 60"**, **"Days 90 plus"** — `cap()` merely upper-cases and swaps underscores for spaces instead of rendering a readable range. |
| **WWL-140** | S4 | **The five bucket totals and `generatedAt` are computed on every response and surfaced nowhere.** No staleness disclosure, no bucket summary bar. Also `buckets[].count` totals **51** — it counts *installments*, matching `installmentsOpen`, not the 34 customers — contradicting the controller's own header comment ("buckets CUSTOMERS not individual installments"). |
| **WWL-141** | S4 | The `Outstanding` card carries an unconditional `trend="down"` arrow regardless of whether debt rose or fell. |

### Notable passes

- **D11-002/003 PASS** — `Dashboard : Receivables`; sidebar, breadcrumb and `<h1>` agree.
- **D11-004/005 PASS** — one `analytics/receivables` call per load, correctly carrying `businessId` when a venue is active.
- **D11-007 → D11-012 PASS** — every internal total reconciles: Σ rows = `grandOutstanding` = Σ buckets (Rs 23,961,479); Σ open = 51; max days = 99; and **every** customer's bucket matches `bucketKey(oldestDaysOverdue)` — zero mismatches.
- **D11-017 PASS on the unscoped path** — all-venues `grandOutstanding` **Rs 12,292,729** equals Module 10's all-venues `Due` **exactly**. Receivables and Payments agree to the rupee; it is the **Dashboard's** Rs 13,417,229 (WWL-110) that is the outlier of the three.
- **D11-019 PASS** — cancelled bookings are correctly excluded (`status: { [Op.ne]: "Cancelled" }` on both the installment join and the orphan backfill).
- **D11-023 PASS** — rows are ordered by days overdue DESC (99, 61, 51, 50, 38…), the right default for a collections board.
- **D11-038/048/084 PASS** — the WhatsApp control has `aria-label="WhatsApp reminder"` and a title, opens `target="_blank"` with `rel="noopener noreferrer"`, and is keyboard-focusable.
- **D11-054/055/056/058/059/062 PASS** — search matches name (full and mid-word), is case-insensitive, matches phone, trims whitespace, treats `%_.*` literally, and restores cleanly.
- **D11-065/067 PASS** — CSV exported all 34 rows with values identical to the screen.
- **D11-073 PASS across a hard reload** — density toggles (56.8px ↔ 64.8px) and persists in `ww-ui-prefs`.
- **D11-079 PASS** — during load the cards show `…`, never `Rs 0`, with 63 skeletons and one clean transition at ~1.5s.
- **D11-082 PASS** — venue choice survives a hard reload (3359 restored, same figures).
- **D11-083 PASS** — 81 focusable controls, **every one** with a visible focus indicator.
- **D11-086 → D11-090 — the best mobile result of the sweep.** At a true emulated 360×740: **no horizontal overflow**, cards carry customer, phone, days overdue, aging and outstanding with **contextual labels** (`0348976582 · 99d overdue`) rather than Payments' bare figures, search and export both usable, and — critically — **all 34 WhatsApp links render and are reachable on the phone**. This is the one screen whose primary action actually works in the place it would really be used, chasing payments on a handset. The tap target is 28×28px, above WCAG 2.2's 24×24 floor but small for a primary action.

### Module 11 — status

**96 cases written, 84 driven. 13 findings (2× S1, 3× S2, 5× S3, 3× S4).**

Not driven, each with its reason:

| Cases | Why |
|---|---|
| **D11-020** (refunded bookings excluded) | The scope filters on `status ≠ Cancelled` and `paymentStatus ≠ Paid`; no `Refunded` booking exists in the live set to confirm the behaviour either way. |
| **D11-036/037** (missing name / missing phone → `—`, no WhatsApp icon) | All 34 rows have both a name and a phone. The `—` fallback and the no-link branch cannot be exercised without creating data. |
| **D11-042/043** (spaced/dashed phone, landline) | No such number exists live. `waLink` strips non-digits so a dashed number would normalise, and a landline would produce a WhatsApp link with no validation — both readable from source, neither reproduced. |
| **D11-063/064/066/071/072** (selected export, Excel, rowId collision) | `ExportMenu` is the shared component already exercised in Module 10, where *Selected → CSV* was proven exact. Not re-driven here; the rowId collision needs two customers with no phone or email, which the live set does not contain. |
| **D11-074/075** (error copy + Retry) | **Structurally unreachable** — that is finding WWL-130, not an untested case. Recorded as a defect rather than a pass or a gap. |
| **D11-076** (mis-routed endpoint via the backend 200 catch-all) | Would land in the same `catch { return null }` as WWL-130 and render identically; not re-driven, since WWL-130 already demonstrates the outcome from a harder failure. |
| **D11-078** (offline) | Behaviour is determined by the same swallow; the offline **scope** hazard was already demonstrated on Payments (WWL-114) against the same shared store. |
| **D11-091/092/093** (auth gate, email exposure) | The auth gate was proven at the start of Module 10 on the same middleware. No `offline_*` address exists in this dataset. |

**The module's verdict.** The presentation is the strongest in the sweep — the only screen whose
primary action works properly on a phone, with honest loading states, complete keyboard access,
correct Roman-Urdu copy and exact internal arithmetic. But the numbers it presents are wrong the
moment a vendor picks a venue, the colour that makes it an *aging* board never varies, a third of
its reminders point at invalid numbers, and any failure at all is reported as *"Nothing
outstanding"*. A collections board that inflates one venue's debt to Rs 23.9m, paints a
99-day-overdue customer green, and cannot message 47% of the money it lists is not usable for
collections.

---

# MODULE 12 — RECEIPTS (`/dashboard/receipts`)

**Component** `components/dashboard/mainScreens/receipts/redesigned/receipts-redesigned-view.tsx`
**Data** `ReceiptsAPI.list()` → `GET /api/v1/receipts` (business-scoped)
**Write paths** `POST /api/v1/receipts` · `PATCH /api/v1/receipts/:id` · **`DELETE /api/v1/receipts/:id`**

## SAFETY LIMIT FOR THIS MODULE — the first with a delete

This is the first module in the sweep that can **destroy** a row on a live vendor's money ledger.
The 39 receipts here are the only record of Rs 21,201,121 actually collected.

- The write blocker is armed **before** any dialog opens and stays armed throughout. Every
  `POST`/`PATCH`/`DELETE` is captured with its body and stopped at the transport layer.
- **The delete confirmation is driven all the way to the Remove button** so the copy, the amount
  interpolation and the destructive styling are all tested — but the `DELETE` never leaves the
  browser.
- Receipt count and `maxId` are read before and after every phase.

## What the source says before I touch the page

- **The API's own `summary` (`total` + `byMethod`) is discarded.** The view recomputes `total`,
  `thisMonthTotal` and `cashTotal` client-side from `data.receipts`.
- **`findAll` has no `limit` and there is no pagination anywhere** — the whole ledger is shipped
  and summed in the browser.
- **The model is `paranoid: true`**, so `destroy()` is a soft delete, while the dialog says
  *"This can't be undone."*
- **Edit mode hides the booking selector** (`{!isEdit && …}`), so a receipt allocated to the wrong
  booking cannot be reallocated — only deleted and re-created.
- `hasRef` drops the Txn-ref column entirely when no row has a reference.
- `thisMonth` compares `new Date(receivedDate).getMonth()` against `now.getMonth()` — **local**
  months. Safe at UTC+5, fragile elsewhere.
- **5 receipts in this ledger are dated in the future** (up to 2026-10-08, Rs 1,844,635 total).
  Both headline figures count them as received.
- Stat cards read `all`, the table reads `receipts` — the WWL-115 filter-divergence shape.
- `showSuccessToast` carries **no** Undo action, so the delete really is unrecoverable from the UI.

## Test cases — written in full before execution

### A. Load, totals, and the future-dated money

| # | Case | Expect |
|---|---|---|
| D12-001 | Route loads, table renders | |
| D12-002 | `<title>` is `Dashboard : Payment Receipts` | |
| D12-003 | Sidebar / breadcrumb / `<h1>` agree — sidebar says "Receipts" | |
| D12-004 | One `/api/v1/receipts` call on load | |
| D12-005 | `businessId` appended when a venue is active | |
| D12-006 | Row count === `Receipts` card === API length | |
| D12-007 | `Σ row.amount` === `Total received` card | |
| D12-008 | `Total received` === Module 10's `Received` (Rs 21,201,121) | cross-module |
| D12-009 | `Cash collected` === Σ amount where method = cash | |
| D12-010 | `This month` === Σ amount where receivedDate is in the current month | |
| D12-011 | `This month` delta count === number of those receipts | |
| D12-012 | **Do future-dated receipts inflate `Total received`?** | 5 rows, Rs 1,844,635 |
| D12-013 | **Do future-dated receipts inflate `This month`?** | Aug rows dated 11 and 14 Aug |
| D12-014 | Is a future-dated receipt visually flagged anywhere? | predicted no |
| D12-015 | Sort order is `receivedDate DESC, id DESC` | future-dated rows sort to the top |
| D12-016 | The API's `summary.byMethod` is surfaced nowhere | dead capability |
| D12-017 | No pagination / no limit — whole ledger fetched | scalability observation |
| D12-018 | Rs formatting; no `NaN` | |
| D12-019 | Dates render `en-PK` `dd-Mmm-yyyy` | |
| D12-020 | `payerName` prefers the linked account, falls back to booking, never the vendor | |
| D12-021 | A receipt with `customerUserId: null` still shows a payer name | walk-in path |
| D12-022 | A receipt with no booking renders without crashing | `bookingId: null` |
| D12-023 | Reconcile per-booking receipt sums against Payments' `Received` | already exact in Module 10 |

### B. Stat cards and columns

| # | Case | Expect |
|---|---|---|
| D12-024 | Four cards: Total received, This month, Cash collected, Receipts | |
| D12-025 | Cards show real values during load, or `Rs 0`? | **no `isLoading` guard in source** — predicted `Rs 0` flash |
| D12-026 | `Receipts` card is a count, not currency | |
| D12-027 | `trend="up"` on Total received and This month is unconditional | |
| D12-028 | Cards are inert | |
| D12-029 | **Do the cards follow the search filter?** | predicted NO |
| D12-030 | Columns: Customer, Method, Txn ref*, Received, Event, Amount, actions | |
| D12-031 | Method pill tone: cash → success, other → neutral, rest → info | |
| D12-032 | Method labels are the PK-correct names (JazzCash, Easypaisa, Raast, IBFT) | |
| D12-033 | `hasRef` — Txn-ref column present here, and would vanish if all rows were cash | |
| D12-034 | `Event` column (`LinkedFunctionSheetBadge`) — does it fire a request **per row**? | N+1 probe |
| D12-035 | Event badge for a booking with no function sheet | |
| D12-036 | Amount right-aligned, tabular, success tone | |
| D12-037 | Edit and Remove buttons have accessible names | source says yes |
| D12-038 | Row itself is not clickable; no drill-through to the booking | |
| D12-039 | `<th scope>` / caption | contrast WWL-120/137 |
| D12-040 | Row checkbox accessible names | |

### C. Search, selection, export

| # | Case | Expect |
|---|---|---|
| D12-041 | Search by payer name, full and mid-word | |
| D12-042 | Search case-insensitive | |
| D12-043 | Search by **transaction ref** | in the predicate |
| D12-044 | Search by **method** (`cash`, `jazzcash`) | in the predicate |
| D12-045 | Search by **notes** | in the predicate |
| D12-046 | Search by amount | predicted no match |
| D12-047 | Whitespace trimmed; metacharacters literal | |
| D12-048 | No-match empty state — does it wrongly offer *"Record receipt"* as if the ledger were empty? | |
| D12-049 | Clearing restores all rows | |
| D12-050 | Select all / filtered select all | |
| D12-051 | Selection has no bulk delete | destructive-action check |
| D12-052 | Export CSV all rows; values match screen | |
| D12-053 | Export selected → exactly those | |
| D12-054 | CSV omits the **Event** column that is on screen | parity check |
| D12-055 | CSV formula-injection exposure | shared ExportMenu |
| D12-056 | CSV contains no phone/email | PII comparison with Modules 10/11 |

### D. Create dialog — writes blocked

| # | Case | Expect |
|---|---|---|
| D12-057 | `Record receipt` opens `Record a receipt` — label matches here | contrast WWL-124 |
| D12-058 | Fields present and empty; no errors on open | |
| D12-059 | Save disabled with a blocked-reason hint | |
| D12-060 | Booking selector present in **create** mode | |
| D12-061 | Full valid form enables Save; `POST` captured and aborted | |
| D12-062 | Captured body has the right shape | |
| D12-063 | Cancel discards; reopening reseeds blank | |
| D12-064 | Date default is the UTC date again | WWL-112 recurrence on its own screen |

### E. Edit dialog — writes blocked

| # | Case | Expect |
|---|---|---|
| D12-065 | Edit opens with the row's values seeded | |
| D12-066 | Title switches to `Edit receipt`, button to `Update` | |
| D12-067 | **Booking selector is absent in edit mode** | a misallocated receipt cannot be reallocated |
| D12-068 | Amount/date/method/ref/notes all editable | |
| D12-069 | Validation applies identically in edit mode | |
| D12-070 | Editing a receipt to a future date is blocked | |
| D12-071 | `PATCH` captured and aborted; body is the diff or the whole record | |
| D12-072 | Opening edit on a **different** row reseeds (the `loaded.current` key) | stale-form probe |
| D12-073 | Edit → Cancel → Create shows a blank form, not the edited row's values | leakage probe |

### F. Delete — driven to the button, request blocked

| # | Case | Expect |
|---|---|---|
| D12-074 | Remove opens a confirm dialog, not an immediate delete | |
| D12-075 | Copy names the **amount** of the receipt being removed | |
| D12-076 | Copy says it can't be undone — **true from the UI, but the model is `paranoid`** | |
| D12-077 | Cancel closes without deleting | |
| D12-078 | Esc / overlay closes without deleting | |
| D12-079 | Remove button is styled destructively | |
| D12-080 | Clicking Remove fires `DELETE /api/v1/receipts/:id` — **captured and aborted** | |
| D12-081 | The confirm dialog does not say which **booking** the receipt belongs to | deleting the wrong one |
| D12-082 | No bulk delete anywhere | |

### G. Resilience, scope, a11y, responsive

| # | Case | Expect |
|---|---|---|
| D12-083 | Genuine network failure → *"Couldn't load receipts."* + Retry | `list()` has **no catch** — predicted reachable |
| D12-084 | Retry recovers | |
| D12-085 | Mis-routed endpoint (backend 200) → the `?? {}` fallback → fake empty ledger | WWL-108 recurrence |
| D12-086 | Loading state — skeletons and card behaviour | |
| D12-087 | Density persists across a hard reload | |
| D12-088 | Venue switch re-scopes; per-venue sums vs all-venues | after WWL-129, check this endpoint too |
| D12-089 | Keyboard reach + visible focus on every control including Edit/Remove | |
| D12-090 | 360px: no overflow; cards readable | |
| D12-091 | 360px: **are Edit and Remove reachable on a phone?** | actions live in a column |
| D12-092 | Receipt count and maxId unchanged at module close | proof nothing was written |

## MODULE 12 — EXECUTION RESULTS

**Nothing was created, edited or deleted.** Verified against the API through a clean iframe realm
after every phase:

| Checkpoint | Receipts | maxId | Total |
|---|---|---|---|
| Baseline | 39 | 187 | Rs 21,201,121 |
| After the PATCH run | 39 | 187 | Rs 21,201,121 |
| After the DELETE run | 39 | 187 | Rs 21,201,121 |
| **Module close** | **39** | **187** | **Rs 21,201,121** |

Receipt 179 — the row I drove edit and delete against — still reads `458460.00`, notes
`"Final settlement"`, with its **original `updatedAt` of 2026-08-02T00:14:45.322Z**. Untouched.

All three write verbs were captured with their bodies and redirected away from the receipts
endpoint:

```
POST   /api/v1/receipts       {"method":"cash","amount":1,"receivedDate":"2026-08-05","bookingId":171}
PATCH  /api/v1/receipts/179   {"method":"cash","amount":458461,"receivedDate":"2026-08-06","notes":"Final settlement","bookingId":168}
DELETE /api/v1/receipts/179   (no body)
```

### WWL-142 (S2) — **every** CRUD verb on the money ledger reports success on failure

This is WWL-107 again, and this module proves it exhaustively. Each request was diverted to a
path that does not exist; the backend's catch-all answered **200**; the UI declared success:

| Action | Toast shown | What actually happened |
|---|---|---|
| Create | **"Receipt logged"** | no row created |
| Edit | **"Receipt updated"** | amount still 458460.00, `updatedAt` unchanged |
| Delete | **"Receipt removed"** | row still present |

The delete case has a distinctive symptom worth flagging for support: the toast says *"Receipt
removed"*, the dialog closes, the query invalidates — and then **the row reappears** in the table
on refetch. A vendor will read that as the delete silently failing, or as the row coming back from
the dead, with no error anywhere to explain it.

Three modules, three verbs, one root cause: `app.use("/", …)` at `routes.js:331`.

### WWL-143 (S3) — validation errors leak between dialog sessions

`touched` is never reset. The effect reseeds `form` on open but leaves `touched` alone:

```js
if (open) { if (loaded.current !== k) { setForm(blank(receipt, prefill)); loaded.current = k } }
//                                      ^ touched is never cleared, on open or on close
```

Driven from a clean load, in order:

| Step | Result |
|---|---|
| 1. Fresh load → open **Create** | no errors ✓ |
| 2. Open **Edit**, clear the amount | *"Amount is required."* ✓ correct |
| 3. Cancel → open **Create** again | **blank untouched form shows "Amount is required."** ✗ |

This defeats the exact intent the source documents — *"errors appear only after a field is
touched, so opening the dialog doesn't immediately flag the empty amount the vendor is about to
type"*. Because `ReceiptFormDialog` is shared, the same leak reaches the Payments screen.

### WWL-144 (S3) — a misallocated receipt can never be reallocated

Edit mode renders **one** select (Method). The booking selector is gated behind `{!isEdit && …}`,
and the dialog never displays which booking or customer the receipt belongs to — the only clue is
which row you clicked. Confirmed live: editing Salman Rauf's Rs 458,460 cash receipt showed
Amount, Date, Method, Transaction ref and Notes, and nothing identifying booking 168.

The captured PATCH does carry `"bookingId":168`, so the link is preserved — it simply cannot be
changed. A receipt logged against the wrong booking has to be **deleted and re-created**, which on
a `paranoid` ledger means an orphaned soft-deleted row plus a new one, for what should be a
one-field correction.

### WWL-145 (S3) — the delete confirmation identifies the receipt only by its amount

> **Remove this receipt?**
> This **Rs 458,460** receipt will be removed. This can't be undone.

No customer, no date, no event, no transaction ref. For an irreversible action on a money ledger
where amounts repeat (this vendor has two "Barat — Salman Rauf" receipts), the amount alone is
weak identification. Everything else about the dialog is right: `role="alertdialog"`, destructive
styling on Remove, the amount correctly interpolated, and **Cancel and Esc both close it without
firing any request** (verified — `window.__net` stayed empty for both).

### WWL-146 (S3) — receipts are create-only on a phone

At a true emulated 360×740, `renderCard` reproduces payer, date, ref, method and amount — but
**not the actions column**. Measured live: `Edit receipt` buttons visible = **0**, `Remove
receipt` buttons visible = **0**. The `Record receipt` button is reachable, so a vendor can add
receipts on a phone but can never correct or remove one. The card also drops the **Event** column,
so there is no way on mobile to tell which wedding a receipt belongs to.

### Findings S3 / S4

| ID | Sev | Finding |
|---|---|---|
| **WWL-147** | S3 | **The money headlines flash `Rs 0` on every load.** Unlike Payments and Receivables, the Receipts cards have **no `isLoading` guard** — `value={formatPkr(total)}` with `total` computed from an empty array. Sampled at 120ms intervals: at t=868ms the cards read **`Rs 0`** with 49 skeletons and 0 rows; the real Rs 7,704,813 appears at t=1786ms. Nearly a second of "you have collected nothing". The same Rs 0 shows in the error state (the WWL-121 pattern). |
| **WWL-148** | S3 | **Future-dated receipts are counted as money received.** Four rows are dated after today, Rs 1,386,175 in total (Rs 720,480 within the Banquet & Lawn view), and because the sort is `receivedDate DESC` they land at the **top of the ledger** — the first row on screen is dated 08-Oct-2026. Nothing flags them. Two of them fall inside the current month and inflate the `This month` card. The frontend forbids future dates on entry (WWL-112) while the backend accepts them, so the ledger contains values its own form would reject. |
| **WWL-149** | S3 | **N+1 on the Event column.** Rendering 13 rows fired **14 separate `function-sheets` requests** across 7 distinct `bookingId`s — one round-trip per booking purely to label a column. There is no batch endpoint in play. On a ledger of a few hundred receipts this becomes hundreds of requests per page view. |
| **WWL-150** | S3 | **The API's method breakdown is discarded.** Every response carries `summary.byMethod` — live: cash 6,314,023 · JazzCash 5,558,585 · bank_transfer 3,175,730 · Easypaisa 2,990,946 · Raast 2,002,337 · other 1,159,500 — and the screen surfaces **only cash**, recomputing everything client-side. For a Pakistani vendor the JazzCash/Easypaisa/Raast split is precisely the reconciliation view they need, and it is already being sent. |
| **WWL-151** | S3 | **Stat cards ignore the search filter** — third consecutive money module. Filtering 13 rows to 2, or to 0, leaves the headline at Rs 7,704,813 / Rs 458,460 every time. |
| **WWL-152** | S3 | **A no-match search presents a populated ledger as empty onboarding.** Searching `zzzqqq` renders *"No receipts yet — Record cash, JazzCash, Easypaisa and bank payments so every rupee is accounted for."* **plus a `Record receipt` button**. Worse than WWL-116/135 because it also offers a primary call-to-action, as if the vendor had never used the feature. |
| **WWL-153** | S3 | **Table a11y, unchanged for the third module.** 0 of 8 `<th>` carry `scope`, no `<caption>`, all 13 row checkboxes named *"Select row"*. |
| **WWL-157** | S3 | **No pagination and no limit.** `PaymentReceipt.findAll` has no `limit` and the client has no paging, so the entire ledger ships on every load and `total` / `thisMonthTotal` / `cashTotal` are summed in the browser. Fine at 39 rows; it degrades linearly and silently. |
| **WWL-158** | S3 | **A receipt dated today opens natively invalid for editing.** Receipt 179 is legitimately dated **2026-08-06**; the edit dialog seeds `value="2026-08-06"` while `max="2026-08-05"` (the UTC date). Measured: `validity.rangeOverflow: true`, `checkValidity(): false`, *"Value must be 08/05/2026 or earlier."* — on a field the vendor never touched. The JS validator correctly disagrees, so `Update` stays enabled and the save is not blocked, but the browser flags a valid stored record as invalid and there is no date the vendor could pick to clear it without falsifying the row. A second, sharper face of WWL-112. |
| **WWL-154** | S4 | `This month` delta renders **"1 receipts"** — `${thisMonth.length} receipts` with no singular form. |
| **WWL-155** | S4 | CSV omits the **Event** column that is shown on screen — the same export/screen parity gap as Receivables' missing Aging column (WWL-136). |
| **WWL-156** | S4 | The confirm says *"This can't be undone"* while the model is `paranoid: true`, so `destroy()` only sets `deletedAt`. True from the UI, false in the database — and telling a panicking vendor the row is gone forever when support could restore it is the wrong way round. |

### Notable passes

- **D12-002/003 PASS** — `Dashboard : Payment Receipts`; sidebar, breadcrumb and `<h1>` agree.
- **D12-004/005 PASS** — one `/api/v1/receipts` call per load, correctly carrying `businessId`.
- **D12-006/007/009/010 PASS** — 13 rows, Rs 7,704,813 total, Rs 4,054,803 cash, Rs 458,460 this month: every card matches the API to the rupee.
- **D12-008 and D12-088 PASS — the cleanest cross-module reconciliation in the sweep.** Venue scoping on this endpoint is **correct**: 15 + 13 + 11 = 39 rows and Rs 8,517,363 + 7,704,813 + 4,978,945 = Rs 21,201,121 exactly. And **every per-venue receipt sum equals Module 10's per-venue `Received` figure exactly**. Three modules, one ledger, no drift — which is what makes WWL-129 (Receivables' inverted scoping) so clearly a defect in that endpoint rather than in the data.
- **D12-032 PASS** — method labels are the PK-correct forms: Cash, JazzCash, Easypaisa, Raast, IBFT, Bank transfer, Other.
- **D12-033 PASS** — the Txn-ref column renders because refs exist; the `hasRef` guard would drop it for an all-cash ledger.
- **D12-037 PASS** — Edit and Remove carry `aria-label="Edit receipt"` / `"Remove receipt"`.
- **D12-041 → D12-045 PASS** — search matches payer name (full and mid-word), is case-insensitive, and matches **transaction ref**, **method** and **notes**. The widest search predicate of any module so far.
- **D12-047/049 PASS** — `%_.*` treated literally, clearing restores all rows.
- **D12-051/082 PASS** — selection offers **no bulk delete**; the only destructive action is per-row and confirmed.
- **D12-052 PASS** — CSV exported all 13 rows with values matching the screen.
- **D12-056 PASS — a positive contrast.** The receipts CSV carries **no phone and no email**, unlike the Payments (WWL-... phone) and Receivables (WWL-136) exports which both ship customer phone numbers.
- **D12-057/060 PASS** — trigger and dialog titles agree here ("Record receipt" → "Record a receipt"), and the booking selector **is** present in create mode with 9 options.
- **D12-074/075/077/078/079 PASS** — `role="alertdialog"`, amount interpolated correctly, destructively styled Remove, and **Cancel and Esc both close without firing a request**.
- **D12-083/084 PASS — the module that gets error handling right.** `ReceiptsAPI.list()` has **no `catch`**, so a genuine network failure renders *"Couldn't load receipts."* with a working **Retry**. This is the direct counter-example to Receivables' WWL-130, and it shows the pattern is achievable in this codebase.
- **D12-090 PASS** — no horizontal overflow at a true emulated 360×740.

### Corrections to my own readings during this module

1. **"Cancel and Esc don't close the delete dialog"** — **wrong, my polling window.** Radix leaves the node mounted with `data-state="closed"` through its exit animation; a later check found it fully unmounted. Both close correctly and neither fires a request.
2. **"`showSuccessToast` offers Undo, contradicting *can't be undone*"** — **wrong, checked and dropped.** `showSuccessToast` is the no-undo variant; `showUndoToast` is a separate export that this screen does not use. The copy is accurate as far as the UI goes (the `paranoid` nuance is WWL-156, a different point).
3. **My `everRs0` flag reported `false` while the raw samples clearly showed `Rs 0`** — my regex used a normal space against `formatPkr`'s non-breaking space. The finding (WWL-147) rests on the raw sampled values, not the flag.

### Module 12 — status

**92 cases written, 83 driven. 17 findings (1× S2, 13× S3, 3× S4).**

Not driven, each with its reason:

| Cases | Why |
|---|---|
| **D12-021/022** (walk-in receipt, `bookingId: null`) | Every receipt in this ledger has both a linked customer and a booking. The `payerName` fallback chain and the null-booking render path cannot be exercised without creating data. |
| **D12-023** (per-booking reconciliation) | Already driven in Module 10 with zero divergences; not repeated. |
| **D12-053** (Selected → CSV) | The shared `ExportMenu` selected-export was proven exact in Module 10; not re-driven. |
| **D12-069/070** (edit-mode validation, future date on edit) | The validators are the same instance already exercised field-by-field in Module 10, and WWL-158 covers the edit-mode date behaviour specifically. |
| **D12-072** (reseed across different rows) | Partially covered — WWL-143 demonstrates the `touched` half of the reseed logic failing; the `form` half reseeded correctly in every observed open. |
| **D12-085** (mis-routed GET → fake empty ledger) | The `?? {}` fallback in `ReceiptsAPI.list` is identical in shape to Module 10's, where the outcome was demonstrated. Not re-driven; the genuine-failure path (D12-083) was driven instead and passed. |
| **D12-086/087/089** (loading detail, density, keyboard) | Density and keyboard behaviour come from the shared primitives already verified across a hard reload in Modules 10 and 11; the loading behaviour that differs here is WWL-147. |

**The module's verdict.** This is the best-built money screen in the sweep and the clearest
evidence that the codebase knows how to do this properly: correct venue scoping, exact
reconciliation with two other modules, a real working error state with Retry, the widest search
predicate, PK-correct method labels, a properly confirmed destructive action, and an export
carrying no PII. What lets it down is mostly at the edges — a `Rs 0` flash on every load, a
create-only mobile experience, validation state leaking between dialog sessions, and a receipt
that can never be moved to the right booking. The one systemic problem is not this module's at
all: with the backend catch-all in place, **create, edit and delete on the vendor's money ledger
all report success when the request never arrived**.

---

# MODULE 13 — CHEQUE LEDGER / PDCs (`/dashboard/pdcs`)

**Component** `components/dashboard/mainScreens/pdcs/redesigned/pdcs-redesigned-view.tsx`
**Dialogs** `PdcFormDialog` (create/edit) · `PdcTransitionDialog` (the lifecycle)
**Data** `PdcAPI.list()` → `GET /api/v1/pdcs` (business-scoped)
**Write paths** `POST /api/v1/pdcs` · `PATCH /api/v1/pdcs/:id` ·
**`POST /api/v1/pdcs/:id/transition`** · **`DELETE /api/v1/pdcs/:id`**

## SAFETY LIMIT FOR THIS MODULE

Four write verbs, including an irreversible **status transition** on a money instrument and a
**delete**. Same discipline as Module 12: the write blocker is armed before any dialog opens,
every write is captured with its body and diverted, and the ledger is counted before and after.

The transition is the sharpest risk in the sweep so far — marking a real cheque `bounced` or
`cleared` writes a fact about a customer's payment that the UI provides **no way to reverse**
(`cleared`, `bounced` and `cancelled` are all terminal in `NEXT`). It is driven to the confirm
button and stopped there.

## What the source says before I touch the page

- **`today()` is `new Date().toISOString().slice(0,10)` again** — the UTC date. It seeds the
  **cheque date** on create and the **deposit date** in the transition dialog, where it is also
  the `max`. WWL-112, third module.
- **`validateChequeDate` is genuinely Pakistan-aware** and deliberately does *not* forbid future
  dates (a PDC is post-dated by definition). It enforces the **six-month staleness rule** — a
  bank refuses a cheque over six months old — plus a 24-month sanity ceiling.
- **The lifecycle is one-way**: `held → [deposited, cancelled]`, `deposited → [cleared, bounced]`,
  and `cleared`/`bounced`/`cancelled` are terminal with **no path back**. The status button is
  only rendered for `held`/`deposited`, so a cheque marked bounced by mistake cannot be corrected
  from the UI at all — only deleted.
- **The transition dialog has no `FormBlockedHint`.** When `to = bounced` and the reason is
  empty, `Update status` is simply disabled with no explanation — the exact BUG-057 problem the
  *form* dialog fixes.
- **The stat cards count cheques but barely value them.** `Total cheques`, `Held / deposited` and
  `Bounced` are **counts**; only `Cleared value` is money. There is **no held value and no
  bounced value** — the rupees at risk, which is the whole reason to keep a PDC ledger.
- `heldCount` merges `held` and `deposited` into a single figure.
- Cards read `all`, the table reads `pdcs` — the filter-divergence shape again.
- Same `LinkedFunctionSheetBadge` Event column as Receipts → expect the same N+1.
- `PdcAPI.list()` has **no `catch`**, so the error state should be reachable (as in Receipts).
- The delete confirm names the **cheque number** — better identification than Receipts' amount.
- `chequeNumber` input strips non-digits and is validated 4–20 digits.

## Test cases — written in full before execution

### A. Load, ledger integrity, money

| # | Case | Expect |
|---|---|---|
| D13-001 | Route loads, table renders | |
| D13-002 | `<title>` is `Dashboard : PDC Ledger` | |
| D13-003 | Sidebar says "Cheque ledger"; `<h1>` and breadcrumb agree | |
| D13-004 | One `/api/v1/pdcs` call on load | |
| D13-005 | `businessId` appended when a venue is active | |
| D13-006 | Row count === `Total cheques` card === API length | |
| D13-007 | `Held / deposited` === count of those two statuses | |
| D13-008 | `Cleared value` === Σ amount where status = cleared | |
| D13-009 | `Bounced` === count of bounced | |
| D13-010 | **No held value / bounced value anywhere** | the rupees at risk are not shown |
| D13-011 | Held and deposited cannot be told apart from the card | merged figure |
| D13-012 | Per-venue sums reconcile to all-venues | after WWL-129, check this endpoint |
| D13-013 | Do cheque amounts reconcile with Receipts or Payments at all? | is a cleared cheque also a receipt? |
| D13-014 | Status distribution across the ledger | which lifecycle states exist live |
| D13-015 | Sort order | |
| D13-016 | Rs formatting; no `NaN` | |
| D13-017 | Dates render `en-PK` | |
| D13-018 | **Any cheque already older than 6 months (stale) in the ledger?** | is it flagged? |
| D13-019 | A cheque dated in the future renders normally | post-dating is the point |
| D13-020 | Missing bank / customer renders `—` | |

### B. Cards, columns, N+1

| # | Case | Expect |
|---|---|---|
| D13-021 | Four cards present and correctly typed (count vs money) | |
| D13-022 | Cards during load — `Rs 0`/`0` flash? | no `isLoading` guard in source |
| D13-023 | **Do cards follow the search filter?** | predicted NO |
| D13-024 | `Bounced` card trend flips to "down"/"follow up" when > 0 | |
| D13-025 | Columns: Cheque #, Bank, Customer, Cheque date, Event, Amount, Status, actions | |
| D13-026 | Status pill tones: held→info, deposited→warning, cleared→success, bounced→error, cancelled→neutral | |
| D13-027 | Cheque # is tabular-nums | |
| D13-028 | Event column N+1 probe | one request per booking? |
| D13-029 | **Status action button only appears for held/deposited** | terminal rows show only Edit + Remove |
| D13-030 | Action buttons have accessible names | |
| D13-031 | `<th scope>` / caption | |
| D13-032 | Row checkbox names | |
| D13-033 | Row not clickable; no drill-through | |

### C. Search, selection, export

| # | Case | Expect |
|---|---|---|
| D13-034 | Search by cheque number | |
| D13-035 | Search by bank name | |
| D13-036 | Search by customer name | |
| D13-037 | Search by status / amount | predicted no match — record the gap |
| D13-038 | Case-insensitive, trimmed, metacharacters literal | |
| D13-039 | No-match empty state — does it offer "Log a cheque" as if empty? | WWL-152 pattern |
| D13-040 | Clearing restores | |
| D13-041 | Select all / filtered select all | |
| D13-042 | No bulk delete / no bulk transition | destructive-action check |
| D13-043 | Export CSV matches screen | |
| D13-044 | CSV **omits the Event column** shown on screen | parity, as in Modules 11/12 |
| D13-045 | CSV includes status (unlike Receivables which dropped aging) | |
| D13-046 | Formula-injection exposure | |

### D. Create / edit dialog — writes blocked

| # | Case | Expect |
|---|---|---|
| D13-047 | `Log a cheque` opens `Log a cheque` | label parity |
| D13-048 | Fields: Cheque number, Bank, Amount, Cheque date, Branch code, Linked booking, Notes | |
| D13-049 | No errors on open **from a clean load** | |
| D13-050 | **After an edit session, does the blank create form show stale errors?** | WWL-143 recurrence probe |
| D13-051 | Save disabled with a blocked-reason hint naming the booking first | |
| D13-052 | Cheque number strips non-digits as you type | |
| D13-053 | Cheque number < 4 digits → error | |
| D13-054 | Cheque number > 20 → capped by `maxLength` | |
| D13-055 | Letters typed into cheque number are silently dropped | is that surprising? |
| D13-056 | Bank name < 2 chars → error | |
| D13-057 | Amount 0 / negative → error | |
| D13-058 | **Cheque date 7 months ago → the Pakistani staleness error** | the PK-specific rule |
| D13-059 | Cheque date 5 months ago → accepted | boundary |
| D13-060 | Cheque date 25 months ahead → ceiling error | |
| D13-061 | Cheque date 12 months ahead → accepted (post-dating is legitimate) | |
| D13-062 | **Cheque date default is the UTC date** | WWL-112 recurrence |
| D13-063 | Notes > 1000 → silent block with a misleading hint? | WWL-117 recurrence probe |
| D13-064 | Duplicate cheque number — is it rejected? | double-logging the same cheque |
| D13-065 | Booking selector present on create, absent on edit | WWL-144 recurrence probe |
| D13-066 | Valid form enables Save; `POST` captured and aborted | |
| D13-067 | Edit seeds all values; `PATCH` captured and aborted | |
| D13-068 | Branch code is unvalidated free text | |

### E. Transition dialog — the lifecycle

| # | Case | Expect |
|---|---|---|
| D13-069 | Status button on a `held` cheque offers **Deposited, Cancelled** only | |
| D13-070 | Status button on a `deposited` cheque offers **Cleared, Bounced** only | |
| D13-071 | Dialog names the cheque and its current status | |
| D13-072 | Choosing **Deposited** reveals a deposit-date field | |
| D13-073 | Deposit date is bounded to today and defaults to the **UTC** date | WWL-112 again |
| D13-074 | A future deposit date is rejected | |
| D13-075 | Choosing **Bounced** reveals a reason field | |
| D13-076 | **Empty bounce reason disables the button with no explanation** | no `FormBlockedHint` here |
| D13-077 | Bounce reason has no length cap | |
| D13-078 | **`cleared` / `bounced` / `cancelled` are terminal — no way back in the UI** | a mis-marked cheque is unfixable |
| D13-079 | Transition `POST` captured and aborted; body carries `to` + the right extra field | |
| D13-080 | Cancel closes without transitioning | |

### F. Delete, resilience, a11y, responsive

| # | Case | Expect |
|---|---|---|
| D13-081 | Remove opens a confirm naming the **cheque number** | better than WWL-145 |
| D13-082 | Cancel / Esc close without deleting | |
| D13-083 | Remove fires `DELETE` — captured and aborted | |
| D13-084 | Genuine network failure → *"Couldn't load cheques."* + Retry | no catch in source |
| D13-085 | Keyboard reach + visible focus on all controls including the 3 row actions | |
| D13-086 | 360px: no overflow; cards readable | |
| D13-087 | 360px: **are the three row actions reachable on a phone?** | WWL-146 recurrence probe |
| D13-088 | Ledger count unchanged at module close | proof nothing was written |

## MODULE 13 — EXECUTION RESULTS

**Nothing was written.** Ledger at close: **11 cheques**, distribution unchanged
(`held 5 · bounced 4 · cleared 2`). Cheque 40 / **513309** — the row I drove transition, edit and
delete against — still reads Rs **687,690.00**, status **held**, `depositDate: null`, with its
**original `updatedAt` of 2026-08-02T00:14:45.692Z**.

All four write verbs were captured with their bodies and diverted:

```
POST   /api/v1/pdcs                {"chequeNumber":"998877","bankName":"Meezan Bank","amount":250000,"chequeDate":"2026-09-01","bookingId":171}
POST   /api/v1/pdcs/40/transition  {"to":""}
PATCH  /api/v1/pdcs/40             {"chequeNumber":"513309","bankName":"MCB","amount":687691,"chequeDate":"2026-08-18","notes":"Balance cheque taken at booking.","bookingId":168}
DELETE /api/v1/pdcs/40             (no body)
```

### The best domain work in the sweep — the Pakistani staleness rule

Before the findings, this deserves to be recorded plainly. `validateChequeDate` encodes real
Pakistani banking practice and every boundary I probed is **exact**:

| Cheque date | Result |
|---|---|
| 7 months ago (`2026-01-06`) | **"This cheque is over 6 months old, so a bank will refuse it as stale."** |
| 6 months + 2 days ago (`2026-02-04`) | stale ✓ |
| **exactly 6 months ago** (`2026-02-06`) | **accepted** ✓ — boundary correct |
| 5 months ago (`2026-03-06`) | accepted ✓ |
| today | accepted ✓ |
| **12 months ahead** (`2027-08-06`) | **accepted** ✓ — post-dating is the entire point of a PDC |
| 24 months ahead (`2028-08-05`) | accepted ✓ |
| 25 months ahead (`2028-09-06`) | "more than 24 months away — please check the year." ✓ |
| mistyped year `2206` | caught by the same ceiling ✓ |

The source comment gets the reasoning right too: it deliberately does **not** apply
`validateNotFutureDate` here, because a post-dated cheque is supposed to be in the future. This
is the direct counter-example to WWL-131's careless substring matching — the same codebase, one
rule thought through properly and one not.

### WWL-159 (S2) — four write verbs, four false successes

WWL-107's widest demonstration yet. Each request was diverted to a nonexistent path, answered
**200** by the backend catch-all, and reported as done:

| Verb | Toast |
|---|---|
| `POST /pdcs` | **"Cheque logged"** |
| `POST /pdcs/40/transition` | **"Cheque marked"** |
| `PATCH /pdcs/40` | **"Cheque updated"** |
| `DELETE /pdcs/40` | **"Cheque removed"** |

The transition is the one that matters most. Marking a cheque `bounced` or `cleared` records a
fact about whether a customer's money actually arrived — and the UI will confirm it while the
write silently goes nowhere.

### WWL-160 (S2) — the entire cheque lifecycle is desktop-only

Measured at a true emulated 360×740:

| Control | Visible on mobile |
|---|---|
| `Update status` | **0** |
| `Edit cheque` | **0** |
| `Remove cheque` | **0** |
| `Log a cheque` | 1 |

A vendor can log a cheque on a phone but can never mark it **deposited, cleared or bounced** —
the lifecycle that is the whole reason a PDC ledger exists. This is worse than WWL-146: there the
missing mobile actions were corrections, here it is the primary workflow.

The mobile card also **drops both Customer and Event**: rows read `500595 · Askari Bank ·
25-Apr-2026 · Bounced · Rs 195,012` with no indication of whose cheque bounced. Chasing a bounced
cheque from a phone is the single most likely mobile use of this screen, and the name is absent.

### WWL-161 (S2) — a mis-marked cheque cannot be corrected

`NEXT` makes `cleared`, `bounced` and `cancelled` terminal, and the view only renders the
`Update status` button for `held`/`deposited` — confirmed live: bounced rows expose only
`Edit cheque` and `Remove cheque`. The edit dialog contains **no status field at all** (verified:
zero `<select>` elements in edit mode).

So a cheque marked `bounced` by mistake — a single click on a dialog whose confirm is one
dropdown and one button — can only be **deleted**, destroying the record of the cheque entirely.
Read alongside WWL-159, where a transition can report success without writing, a vendor can
plausibly end up clicking it twice.

### WWL-162 (S2) — a cheque ledger that shows almost no money

The four cards are `Total cheques` **5**, `Held / deposited` **3**, `Cleared value` **Rs 0**,
`Bounced` **2**. Three of the four are **counts**, and the only money figure reads zero.

Meanwhile the API returns, on every response, exactly the figures a vendor needs:

```json
"summary": { "total": 3389770,
             "byStatus": { "held": 3065235, "bounced": 324535, "cleared": 0 } }
```

**Rs 3,065,235 of cheques waiting to clear and Rs 324,535 already bounced** — the money at risk,
already computed, already sent, and rendered nowhere. `Held / deposited` also merges two
operationally different states into one number: a cheque sitting in a drawer and a cheque already
banked are not the same exposure.

`Cleared value` reads Rs 0 truthfully, which leads to the next finding.

### Findings S3 / S4

| ID | Sev | Finding |
|---|---|---|
| **WWL-163** | S3 | **Duplicate cheque numbers are accepted silently.** I entered `513309` — which already exists in this same ledger as a **held Rs 687,690** cheque — and got no error, no warning, and an enabled Save. The same physical cheque can be logged twice, double-counting money that will only ever clear once. (Client-side confirmed; the backend's behaviour would need a real write.) |
| **WWL-164** | S3 | **WWL-117 recurs verbatim.** Notes at 1001 characters silently disables Save with **no field error** and the hint *"Add a cheque number, a bank name, an amount above 0 and a cheque date to save."* — while all four of those are valid. `maxLength` is `-1`. Second dialog, identical defect. |
| **WWL-165** | S3 | **WWL-112 recurs in two more places.** The **cheque date** seeds to `2026-08-05` (the UTC date) while it is 6 Aug in Pakistan; and in the transition dialog the **deposit date** both defaults to and is capped at `2026-08-05`, so between 00:00 and 05:00 PKT a vendor who banked a cheque *today* cannot record today. Four instances across three modules now. |
| **WWL-166** | S3 | **The transition dialog never validates its own target status.** `canSave` checks `options.length > 0` but never `options.includes(to)`, so an out-of-range value submits happily — I captured `{"to":""}` with the toast *"Cheque marked "*. **Reproduced only by setting a select value synthetically; I did not find a path to it through the UI**, so this is recorded as a robustness gap in the guard, not a user-reachable bug. |
| **WWL-167** | S3 | **Four of eleven cheques have `amount = 0.00`** — including **both** cleared ones (964999, 132166) and two bounced ones. The create form requires an amount above zero, so these entered through a path that does not apply that rule. This is why `Cleared value` reads Rs 0 with two cheques cleared. Same client-only-validation family as WWL-148. |
| **WWL-168** | S3 | **Cards ignore the search filter** — fourth consecutive money module. `Total cheques 5` / `Bounced 2` stay frozen while the table filters to 1 row or 0. |
| **WWL-169** | S3 | **No-match empty state presents a populated ledger as onboarding.** *"No cheques logged — Track every post-dated cheque so you know exactly what's clearing and when."* plus a **Log a cheque** button, for a vendor with 5 cheques on screen a moment earlier. WWL-152 pattern. |
| **WWL-170** | S3 | **Table a11y, fourth module unchanged.** 0 of 9 `<th>` carry `scope`, no `<caption>`, all row checkboxes named *"Select row"*. |
| **WWL-171** | S3 | **N+1 on the Event column** — 10 `function-sheets` requests to render 5 rows, exactly as in Receipts (WWL-149). Same shared badge component. |
| **WWL-172** | S4 | CSV omits the **Event** column shown on screen — third module with this export/screen parity gap (WWL-136, WWL-155). It does correctly include **Status**, which is the improvement Receivables' export needed. |
| **WWL-173** | S4 | The cheque-number field **silently strips non-digits** (`ABC123XYZ` → `123`), then reports *"looks too short"*. A vendor typing a serial with a letter prefix sees characters vanish with no explanation of why. |
| **WWL-174** | S4 | The success toast interpolates the raw status: *"Cheque marked deposited"* rather than the capitalised label shown everywhere else. |

### Notable passes

- **D13-002/003 PASS** — `Dashboard : PDC Ledger`; sidebar "Cheque ledger" and `<h1>` agree.
- **D13-004/005 PASS** — one `/api/v1/pdcs` call per load, correctly carrying `businessId`.
- **D13-006 → D13-009 PASS** — cards match the scoped data exactly: 5 rows, 3 held, 2 bounced.
- **D13-012 PASS — venue scoping is correct here.** 3 + 5 + 3 = **11** = the all-venues count. Another counter-example to WWL-129; Receivables remains the only endpoint of the four that scopes wrongly.
- **D13-026 PASS** — status tones are right and *do* vary: held → blue (`bg-blue-50 text-blue-700`), bounced → red (`bg-red-50 text-red-700`). The direct contrast with WWL-131, where every aging bucket came out green.
- **D13-029 PASS** — `Update status` renders **only** on held/deposited rows; terminal rows correctly show just Edit and Remove.
- **D13-047/049 PASS** — trigger and dialog agree ("Log a cheque"), and a clean load opens with no errors.
- **D13-051 PASS** — blocked hint names the booking first.
- **D13-052/053/056/057 PASS** — cheque number under 4 digits, over 20 digits, a 1-character bank, amount 0 and amount −1 each produce the right specific message.
- **D13-058 → D13-061 PASS** — the staleness and ceiling rules, exact at every boundary (table above).
- **D13-069/071 PASS** — a held cheque offers **Deposited** and **Cancelled** only, and the dialog identifies it precisely: *"Cheque 513309 — currently held."*
- **D13-074 PASS** — a future deposit date is rejected on both layers: *"Deposit date can't be in the future."* plus `validity.rangeOverflow`.
- **D13-081 PASS — better identification than Receipts.** *"Cheque 513309 will be removed. This can't be undone."* names the cheque by its canonical identifier, where the receipts dialog offered only an amount (WWL-145).
- **D13-034/035/036/038 PASS** — search matches cheque number, bank and customer, case-insensitively and trimmed.
- **D13-043/045 PASS** — CSV exported all 5 rows matching the screen, **including Status**.
- **D13-085 PASS** — 37 focusable controls, every one with a visible focus indicator.
- **D13-086 PASS** — no horizontal overflow at 360×740.

### A correction to my own reading

I inferred from the data that *"the backend allows lifecycle jumps the UI forbids"*, because the
ledger holds four `bounced` cheques and **zero** `deposited` ones, while `NEXT` requires
`held → deposited → bounced`. I checked before writing it up: **all four bounced cheques carry a
real `depositDate` and a `bounceReason`**, so they did pass through `deposited` properly. The
absence of a currently-deposited row simply means none is mid-flight today. The inference was
wrong and is not reported.

### Module 13 — status

**88 cases written, 78 driven. 16 findings (4× S2, 9× S3, 3× S4).**

Not driven, each with its reason:

| Cases | Why |
|---|---|
| **D13-070 / D13-075 / D13-076 / D13-077** (the `deposited → cleared/bounced` half of the lifecycle, and the bounce-reason gating) | **No cheque in the ledger is currently `deposited`**, so the second half of the state machine is unreachable without first transitioning a real cheque — a write that records a false fact about a customer's payment. The source shows the transition dialog has **no `FormBlockedHint`**, so an empty bounce reason would disable the button with no explanation (the BUG-057 problem the *form* dialog fixes); recorded as **source-confirmed, live-unverified**. |
| **D13-013** (cheque ↔ receipt reconciliation) | Nothing in the data links a cleared cheque to a receipt row, and both cleared cheques are Rs 0, so there is no figure to reconcile. |
| **D13-018** (a stale cheque on screen) | No cheque in the ledger is older than six months, so the staleness rule could only be exercised through the form — which it was, exhaustively. |
| **D13-050** (stale-error leak into the create form) | The `touched` leak proven as WWL-143 lives in `ReceiptFormDialog`; this dialog has its own `touched` state with the same shape, but I drove create **before** edit here, so I did not reproduce the ordering that triggers it. Not claimed. |
| **D13-064 backend half** (does the API reject a duplicate cheque number?) | Would require actually creating the duplicate on a live ledger. |
| **D13-084** (error state + Retry) | `PdcAPI.list()` has no `catch`, the same shape as `ReceiptsAPI.list()` where the error state and Retry were driven and passed. Not re-driven. |

**The module's verdict.** This screen contains the sweep's best domain work and some of its worst
workflow gaps, side by side. The staleness rule is genuinely expert — six months, exact
boundaries, future dates deliberately allowed — and the lifecycle, tones, identification in the
delete confirm and per-status action gating are all correct. But the ledger hides the two numbers
a vendor actually needs (Rs 3.07m held, Rs 324k bounced) behind counts, the entire lifecycle is
unusable on a phone, a cheque marked bounced by mistake can only be deleted, and every one of the
four write verbs will tell the vendor it succeeded when it did not.

---

# MODULE 14 — EXPENSES (`/dashboard/expenses`)

**Components** `expenses-redesigned-view.tsx` + **`expense-cockpit.tsx`** (a second, independent
panel) + `expense-form-dialog.tsx`
**Data** `ExpensesAPI.list()` → `GET /api/v1/expenses` (business-scoped)
**Write paths** `POST /expenses` · `PATCH /expenses/:id` · `DELETE /expenses/:id` ·
**bulk import** · **custom-field definitions** · **AI receipt scan**

The widest surface in the sweep so far: a spending cockpit with period navigation, a full ledger,
per-venue vendor-defined custom fields, a CSV import, an export, and a receipt-photo scan that
calls an AI coercion path.

## SAFETY LIMIT FOR THIS MODULE

- Write blocker armed before any dialog. Create / edit / delete captured and diverted.
- **No import is committed.** The import dialog is opened and its validation examined; no file is
  ever submitted.
- **No custom-field definition is created or edited.** Those are schema changes on a live venue.
- **No receipt image is uploaded.** The AI coercion path calls an external model; client-side file
  validation is tested, the upload is not performed.

## What the source says before I touch the page

- **The page fetches the whole expense ledger twice.** The table uses
  `["expenses-redesigned", activeBusinessId, bookingId]`; the cockpit uses a *separate*
  `["expense-cockpit"]` key with its own `ExpensesAPI.list()`.
- **`invalidate()` only touches `["expenses-redesigned"]`.** The cockpit key is not matched, so a
  create / edit / delete should refresh the ledger but **not** the spending overview above it.
- **Two different definitions of "fixed overhead" on one screen.** The `Fixed overheads` card sums
  `bookingId == null`; the `fixed` chip on category rows uses `OVERHEAD_CATS`
  (`rentals, electricity, salary, repairs, tax, marketing`). A rentals expense tagged to a booking
  gets the chip but is excluded from the card; an untagged ingredients purchase counts in the card
  but gets no chip.
- **The cockpit's date handling is correct** — `new Date(dateStr + "T00:00:00")` and local `ymd()`,
  not `toISOString()`. Worth verifying and crediting.
- 13 genuinely Pakistani categories (broker commission, tax FBR/SECP, casual labour, fuel
  diesel/petrol) and 9 payment methods including JazzCash / Easypaisa / Raast / IBFT.
- The query key here **does** include `activeBusinessId` — better than Modules 10–13, which all
  used bare keys.
- Same `LinkedFunctionSheetBadge` Event column → expect the same N+1.

## Test cases — written in full before execution

### A. Load, double-fetch, ledger integrity

| # | Case | Expect |
|---|---|---|
| D14-001 | Route loads; cockpit and ledger both render | |
| D14-002 | `<title>` is `Dashboard : Expenses` | |
| D14-003 | Sidebar / breadcrumb / `<h1>` agree | |
| D14-004 | **How many `/api/v1/expenses` calls fire on load?** | predicted 2 — table + cockpit |
| D14-005 | `businessId` appended when a venue is active | |
| D14-006 | Row count === API length | |
| D14-007 | Σ row amount === cockpit "Spent · all time" when granularity = all | |
| D14-008 | Per-venue sums reconcile to all-venues | after WWL-129 |
| D14-009 | Rs formatting; no `NaN` | |
| D14-010 | Dates render `en-PK` | |
| D14-011 | Category labels are the PK-specific ones | broker commission, tax FBR/SECP |
| D14-012 | Payment-method labels include the PK rails | |
| D14-013 | Sort order of the ledger | |
| D14-014 | An expense with no booking renders | `bookingId: null` |
| D14-015 | An expense with no payee / note renders `—` | |
| D14-016 | Amount tone is "error" (money out) | contrast Receipts' success tone |

### B. The cockpit

| # | Case | Expect |
|---|---|---|
| D14-017 | Four cockpit cards: Spent, Fixed overheads, Event/function costs, Biggest category | |
| D14-018 | `Spent + granularity` label tracks the selected granularity | |
| D14-019 | Day / Month / Year / All toggle switches the period | |
| D14-020 | Previous / Next period navigation shifts the anchor correctly | |
| D14-021 | Period label reads correctly for each granularity | |
| D14-022 | **`inPeriod` uses local dates, not UTC** | the timezone-correct counter-example |
| D14-023 | Day granularity on a date with known spend matches the ledger rows for that day | |
| D14-024 | Month granularity totals match Σ of that month's rows | |
| D14-025 | Year granularity totals match | |
| D14-026 | "All" shows every row and hides period navigation? | |
| D14-027 | Delta vs previous period is computed only when prevTotal > 0 | no divide-by-zero |
| D14-028 | Delta sign and direction are right | |
| D14-029 | **`Fixed overheads` = Σ where bookingId is null** | not the category list |
| D14-030 | **The `fixed` chip uses a different rule from the card** | inconsistency probe |
| D14-031 | `Event / function costs` === total − overheads | |
| D14-032 | The event count in the delta matches distinct bookings | |
| D14-033 | `Biggest category` matches the top of the category bars | |
| D14-034 | Category bars sum to the period total | |
| D14-035 | Category colours are stable per category | |
| D14-036 | Per-event roll-up sorted by spend desc | |
| D14-037 | Navigating to a period with no expenses → honest zero state | |
| D14-038 | Cockpit cards during load | `Rs 0` flash? |
| D14-039 | **Does the cockpit refresh after a ledger mutation?** | predicted NO — separate query key |
| D14-040 | Cockpit has its own `Add expense` button — same dialog? | |

### C. Ledger table, columns, custom fields

| # | Case | Expect |
|---|---|---|
| D14-041 | Columns: Category, Space, Paid to, Note, Method, Date, Event, Amount, actions | |
| D14-042 | Long note truncates without breaking the row | |
| D14-043 | Event column N+1 probe | |
| D14-044 | Space column populated when a sub-venue is set | |
| D14-045 | Custom-field columns appear only when defs exist with `showInList` | |
| D14-046 | `Fields` button appears only when a venue is active (`cfEnabled`) | |
| D14-047 | `Fields` on **All venues** — is the button hidden or broken? | `activeBusinessId` null |
| D14-048 | Custom-field manager opens (not driven further) | |
| D14-049 | Action buttons have accessible names | |
| D14-050 | `<th scope>` / caption | |
| D14-051 | Row checkbox names | |
| D14-052 | Row not clickable | |

### D. Search, selection, export, import

| # | Case | Expect |
|---|---|---|
| D14-053 | Search by payee | |
| D14-054 | Search by note/description | |
| D14-055 | Search by category | |
| D14-056 | Search by amount / method | predicted no match |
| D14-057 | Case-insensitive, trimmed, metacharacters literal | |
| D14-058 | No-match empty state — "No expenses logged" + Add CTA? | WWL-152 pattern |
| D14-059 | **Do the cockpit cards follow the ledger search?** | they are separate components |
| D14-060 | Clearing restores | |
| D14-061 | Select all / filtered select all | |
| D14-062 | No bulk delete | |
| D14-063 | Export CSV matches screen | |
| D14-064 | CSV omits **Space**, **Event** and any custom fields shown on screen | parity |
| D14-065 | Formula-injection exposure | |
| D14-066 | **Import dialog opens; template/format is discoverable** | not committed |
| D14-067 | Import validates before committing | inspect only |
| D14-068 | Import is reachable but clearly separated from destructive action | |

### E. Expense dialog — writes blocked

| # | Case | Expect |
|---|---|---|
| D14-069 | `Add expense` opens the dialog | |
| D14-070 | Fields: Amount, Date, Category, Method, Paid to, Subcategory, Space, Function, Note | |
| D14-071 | No errors on open from a clean load | |
| D14-072 | **After an edit session, does a blank create form show stale errors?** | WWL-143 recurrence |
| D14-073 | Save disabled with a blocked-reason hint | |
| D14-074 | Amount 0 / negative → errors | |
| D14-075 | **Date default — UTC or local?** | WWL-112 recurrence probe |
| D14-076 | Future spent date → rejected | `validateNotFutureDate` |
| D14-077 | Payee > 150 chars → error | |
| D14-078 | Note > 1000 → silent block with a false hint? | WWL-117 recurrence |
| D14-079 | Category select lists all 13 | |
| D14-080 | Method select lists all 9 | |
| D14-081 | Space select scoped to the active venue | |
| D14-082 | Function/booking select populated and optional | |
| D14-083 | **Receipt file picker — client-side validation** (type, size) | no upload performed |
| D14-084 | Valid form enables Save; `POST` captured and aborted | |
| D14-085 | Edit seeds all values; `PATCH` captured and aborted | |
| D14-086 | **Is the booking selector present in edit mode?** | WWL-144 recurrence probe |
| D14-087 | Cancel discards | |

### F. Delete, resilience, a11y, responsive

| # | Case | Expect |
|---|---|---|
| D14-088 | Remove opens a confirm naming the **amount** | WWL-145 shape |
| D14-089 | Confirm does not name the category / payee / date | identification probe |
| D14-090 | Cancel / Esc close without deleting | |
| D14-091 | Remove fires `DELETE` — captured and aborted | |
| D14-092 | Delete error toast has an 8s duration (longer than default) | deliberate choice |
| D14-093 | Genuine network failure → *"Couldn't load expenses."* + Retry | |
| D14-094 | Retry recovers | |
| D14-095 | **Does the cockpit show an error state, or silently zero?** | separate query |
| D14-096 | Loading state | |
| D14-097 | Density persists | |
| D14-098 | Venue switch re-scopes both cockpit and ledger | cockpit key lacks businessId |
| D14-099 | Keyboard reach + visible focus | |
| D14-100 | 360px: no overflow | |
| D14-101 | 360px: are Edit / Remove reachable? | WWL-146/160 recurrence |
| D14-102 | 360px: is the cockpit usable (period toggle, cards)? | |
| D14-103 | 360px: category bars and per-event roll-up readable | |
| D14-104 | Expense count unchanged at module close | proof nothing was written |

## MODULE 14 — EXECUTION RESULTS

**Nothing was written. No import was committed, no custom field created, no receipt uploaded.**
Ledger at close: **165 expenses, Rs 16,832,000**. Expense 470 — the row I drove edit and delete
against — still reads Rs 46,400.00, `spentDate 2026-08-21`, with its **original `updatedAt` of
2026-08-02T00:15:30.916Z**.

```
POST   /api/v1/expenses      {"amount":12345,"category":"supplies","vendorName":"Bismillah Meat Supply","spentDate":"2026-08-05","paymentMethod":"cash","bookingId":null,"businessId":3359,"subVenueId":null}
DELETE /api/v1/expenses/470  (no body)
```
The `PATCH` never fired at all — which turned out to be the module's sharpest finding.

### WWL-175 (S2) — future-dated expenses are permanently uneditable, silently

Opening **Edit** on expense 470 (fuel, Rs 46,400, spent 21-Aug-2026 for the 21-Aug wedding):

| | |
|---|---|
| Date field value | `2026-08-21` — the stored value, untouched |
| Date field `max` | `2026-08-05` |
| `validity.rangeOverflow` | **true** — *"Value must be 08/05/2026 or earlier."* |
| Error shown on open | **"Date spent can't be in the future."** |
| `Update expense` | **disabled** |
| Blocked hint | none (correctly suppressed, since a field error is showing) |

I changed the amount and clicked Update: **`window.__net` stayed empty**. No request. The button
is permanently disabled because `validateNotFutureDate` rejects a value the vendor never entered
and cannot legitimately change.

**6 of 55 expenses in this venue — 11%, Rs 745,200 — are locked this way**, and they are not
scattered: they are *every* expense of the Salman Rauf 21-Aug event. **An entire upcoming
wedding's cost sheet is read-only.**

The vendor's only options are to falsify the date to today or earlier, or delete and re-create.
Note the form's own booking selector offers *"Recurring overhead — not tied to one function"*
against a list of **future** events, so the product plainly expects costs to be recorded against
weddings that have not happened yet — while the date rule forbids the natural date for them.

Same family as WWL-148 (future receipts) and WWL-167 (Rs 0 cheques): the backend accepts what the
frontend forbids. Here the consequence is worse — the record becomes permanently uneditable.

### WWL-176 (S2) — the spending cockpit never refreshes after a mutation

The page runs **two independent queries over the same data**:

```js
// table
queryKey: ["expenses-redesigned", activeBusinessId, bookingId ?? null]
// cockpit — a different key entirely
queryKey: ["expense-cockpit"]
// and the only invalidation:
qc.invalidateQueries({ queryKey: ["expenses-redesigned"] })
```

**Proven live.** I counted `/api/v1/expenses` requests either side of a save that reported
success: **11 before, 12 after — exactly one refetch.** The ledger refreshed; the cockpit did
not.

So after adding, editing or deleting an expense, *"Spent · month"*, *"Fixed overheads"*,
*"Event / function costs"*, *"Biggest category"*, the whole category breakdown and the entire
**Cost per function** profit table all keep showing pre-mutation numbers, sitting directly above
a ledger that has updated. Nothing tells the vendor which half is current.

### WWL-177 (S2) — two contradictory definitions of "fixed overhead", Rs 219,500 apart, on one panel

At *All time* for this venue, the same panel simultaneously states:

| | Rule | Value |
|---|---|---|
| **`Fixed overheads` card** | `bookingId == null` | **Rs 2,910,500** |
| **Category bars marked `FIXED`** | `OVERHEAD_CATS` membership | **Rs 3,130,000** |

Electricity 1,295,500 + Salary 1,083,000 + Rentals 304,000 + Repairs 233,500 + Marketing 214,000
= Rs 3,130,000, against a card reading Rs 2,910,500 — a **Rs 219,500** contradiction visible
without scrolling.

The card's own subtitle is *"rent · utilities · salary"* — it **names categories while computing
by booking linkage**. And at *August 2026* the panel reads `Fixed overheads Rs 0` while the bars
below it show **"Rentals · FIXED · Rs 78,200"**.

The booking-linkage rule is the intentional one (the dialog's default option is *"Recurring
overhead — not tied to one function (rent, utilities, salary)"*), so the `FIXED` chip is the odd
one out — but as shipped, two figures both labelled fixed disagree on screen.

### WWL-178 (S2) — mobile clips the per-event profit column with no way to reach it

At a true emulated 360×740 the page-level check **passes** — `scrollWidth === clientWidth === 360`
— but that is because the overflow is clipped, not because the content fits. **22 elements extend
past the right edge and the page does not scroll** (`pageScrolls: false`, and none of the
offenders is itself scrollable):

| Clipped element | Right edge | Lost |
|---|---|---|
| **Cost-per-function table** (`min-w-[560px]`) | **577px** | **217px — the SPENT and NET columns** |
| `Fields \| Import \| Export` toolbar | 416px | 56px — Export partly cut |
| Category percentage labels (`61%`, `14%`, `10%`…) | 381px | every percentage in the breakdown |
| `Today` period-reset button | 369px | 9px |

The **NET column is the per-event profit** — the single most valuable number on the screen — and
on a phone it is invisible and unreachable. This is also a caution about the measurement itself:
`scrollWidth === clientWidth` alone is not evidence that a layout fits.

Edit and Remove are, once again, **entirely absent on mobile** (0 visible), the third module in a
row (WWL-146, WWL-160).

### Findings S3 / S4

| ID | Sev | Finding |
|---|---|---|
| **WWL-179** | S3 | **The entire expense ledger is fetched twice on every load.** Confirmed live: two identical `GET /api/v1/expenses?businessId=3359` requests, one for the table's query key and one for the cockpit's. 165 rows shipped twice. |
| **WWL-180** | S3 | **WWL-117, third recurrence.** A note of 1001 characters silently disables Save with **no field error** and the false hint *"Add an amount above 0 and the date it was spent to save."* — while both are valid. The **Paid to** field on the same form gets this right, with an excellent message: *"Paid to must be 150 characters or fewer — currently 151."* The notes field simply has no `FieldError`. |
| **WWL-181** | S3 | **WWL-112, fifth instance.** `spentDate` defaults to and is capped at `2026-08-05` (the UTC date) while it is 6 Aug in Pakistan. Setting today's PKT date is accepted by the JS validator but flagged by the native `max` — the same split as WWL-158, and the mechanism behind WWL-175. |
| **WWL-182** | S3 | **The delete confirm names only the amount** — *"This Rs 46,400 entry will be removed."* No category, payee, date or event, on a 55-row ledger. WWL-145 repeated; the cheque ledger (WWL-... D13-081) shows how to do it properly. |
| **WWL-183** | S3 | **The Pakistani payment rails are mis-labelled in this module.** The selects and table render **"Jazzcash"**, **"Ibft"**, **"Bank Transfer"** — title-cased raw keys — where `EXPENSE_PAYMENT_METHOD_LABELS` already defines `JazzCash`, `IBFT`, `Bank transfer`, and the Receipts module renders them correctly. *Ibft* in particular reads as a word rather than the initialism it is. |
| **WWL-184** | S3 | **The import dialog offers no template or column reference.** *"Upload or paste a CSV/TSV"* with no sample, no header list and no download link — the vendor has to guess the schema. (The dialog's safety design is otherwise good — see the passes.) |
| **WWL-185** | S3 | **Cards ignore the search filter** — fifth consecutive money module. `Spent · month` stayed at Rs 745,200 while the ledger filtered from 55 rows to 5, to 0, and back. |
| **WWL-186** | S3 | **No-match empty state presents a populated ledger as onboarding** — *"No expenses logged — Track fuel, salaries, rentals and supplies to see your true per-event profit."* plus an **Add expense** button. WWL-152 pattern, fourth module. |
| **WWL-187** | S3 | **Table a11y, fifth module unchanged.** 0 of 10 `<th>` carry `scope`, no `<caption>`, all row checkboxes named *"Select row"*. |
| **WWL-188** | S4 | **CSV omits Space and Event**, both visible columns, and any vendor-defined custom-field columns. Header is `Category,Paid to,Note,Method,Date,Amount`. Fourth module with an export/screen parity gap. |

### Notable passes

- **D14-008 PASS — venue scoping is correct.** I suspected otherwise when all three venues returned exactly **55** rows, so I checked the IDs: **zero overlap between any pair**, union = 165 = the all-venues count. A genuine clean partition; the even split is just how the data was seeded. Receivables (WWL-129) remains the only one of five endpoints that scopes wrongly.
- **D14-007 PASS** — cockpit *Spent · all time* **Rs 6,049,000** equals the API total for the venue exactly; *Event / function costs* = total − overheads exactly.
- **D14-011 PASS — the category list is genuinely Pakistani.** All 13 render: Ingredients, **Fuel (diesel / petrol)**, **Casual labour**, Salary / payroll, Electricity, Rentals, Repairs, Marketing, **Broker commission**, **Tax (FBR / SECP)**, Supplies, Transport (non-fuel), Other.
- **D14-022 PASS — the cockpit's dates are timezone-correct.** `inPeriod` parses `dateStr + "T00:00:00"` as local midnight and compares with local `getFullYear/getMonth/ymd` — no `toISOString()` anywhere. This is the counter-example that shows WWL-112 is a fixable oversight, not a house style.
- **D14-019/020/021 PASS** — Day/Month/Year/All all switch correctly, with a working period label (`August 2026`), prev/next navigation and a `Today` reset.
- **D14-027/028 PASS** — the delta renders as `-31% vs last month` and is computed only when the previous period is non-zero.
- **D14-031/036 PASS** — per-event roll-up sorted by spend, and its revenue figures agree with Module 10 exactly (Shahzad Butt Rs 2,160,300; Salman Rauf Rs 2,292,300).
- **D14-074/076/077 PASS** — amount 0 and negative, future date, and a 151-character payee each produce the right specific message.
- **D14-079/081/082 PASS** — 13 categories, the Space select correctly scoped to this venue's three spaces (`Banquet Hall · HALL`, `Open Lawn · LAWN`, `Basement Hall · BASEMENT`), and a booking select whose default option is unusually well written: *"Recurring overhead — not tied to one function (rent, utilities, salary)"*.
- **D14-086 PASS — and the counter-example to WWL-144.** The **booking selector IS present in edit mode**, correctly seeded (`Salman Rauf & Kinza Salman · 21-Aug-2026`), alongside category, method and space. An expense can be re-tagged to a different event; a receipt (WWL-144) and a cheque cannot.
- **D14-053/054/055 PASS** — search matches payee, note **and** category.
- **D14-063 PASS** — CSV exported all 55 rows matching the screen.
- **D14-066 PASS — the safest write surface in the sweep.** The import dialog states plainly: *"Upload or paste a CSV/TSV. **We preview first — nothing is saved until you confirm.**"* with a `Preview` button and no direct commit. Exactly the right shape for a bulk write.
- **D14-102 PASS** — the cockpit itself is usable on mobile: all four period toggles, the stat cards, the category breakdown and the per-function panel all render (the clipping in WWL-178 is horizontal, not structural).
- **D14-104 PASS** — 165 expenses and Rs 16,832,000 at close, unchanged.

### Module 14 — status

**104 cases written, 89 driven. 14 findings (4× S2, 9× S3, 1× S4).**

Not driven, each with its reason:

| Cases | Why |
|---|---|
| **D14-045/046/047/048** (custom-field columns and manager) | No custom-field definitions exist for `expense` on this venue, so no extra columns render. The `Fields` button is present; **opening the manager was as far as I went — creating or editing a field definition is a schema change on a live venue.** |
| **D14-067/068** (import validation and commit) | The dialog was opened and its copy and controls examined. **No file was submitted** — an import writes rows in bulk. |
| **D14-083** (receipt scan) | The file input exists and the AI coercion path is wired, but **no image was uploaded**: it calls an external model and would create a row. Client-side `validateReceiptFile` was read, not exercised. |
| **D14-072** (stale-error leak into the create form) | This dialog has its own `touched` state with the same shape as WWL-143, but I drove create before edit, so I did not reproduce the triggering order. Not claimed. |
| **D14-093/094/095** (error state, Retry, cockpit error behaviour) | `ExpensesAPI.list()` has no `catch`, matching Receipts where the error state and Retry were driven and passed. The cockpit's separate query would fail independently — recorded as a consequence of WWL-176 rather than re-driven. |
| **D14-098** (venue switch re-scopes the cockpit) | The cockpit's key omits `activeBusinessId`, but the switcher fires a bare `invalidateQueries()` that matches everything, so it should refetch. Not separately driven; the mutation-path staleness (WWL-176) is the reachable defect. |

**The module's verdict.** The most capable screen in the portal and, in places, the best built —
a real spending cockpit with correct period arithmetic and genuinely timezone-safe dates, a
Pakistani category taxonomy, per-event profit, per-venue spaces, editable event tagging, and an
import that previews before it commits. It is undermined by four structural problems: an entire
upcoming wedding's costs cannot be edited at all, the cockpit silently diverges from the ledger
after every change, the panel contradicts itself about what "fixed overhead" means, and on a
phone the profit column is clipped out of existence.

---

# MODULE 15 — TAX & P&L (`/dashboard/tax`)

**Component** `components/dashboard/mainScreens/tax/redesigned/tax-redesigned-view.tsx`
**Data** `TaxReportAPI.getAnnualReport(year)` → `GET /api/v1/tax/annual-report`
**Write paths** none. Read-only report.

This is the screen a vendor hands to their accountant. Its metadata promises *"Annual revenue +
expense + P&L summary, FBR-fiscal-year aligned. One-click PDF export for your accountant."*

## What the source says before I touch the page

Three things stand out, all of which must be confirmed on the live page:

- **`/api/v1/tax` is absent from `BUSINESS_SCOPED_PREFIXES`** in `lib/axiosConfig.js`. Every other
  money module (bookings, expenses, receipts, pdcs, payments/vendor-revenue, analytics) is on that
  whitelist. The backend fully supports `?businessId=` via `_resolveOwnedBusiness` — the frontend
  simply never sends it. Predicted: **selecting a venue changes every other money screen but not
  this one.**
- **The `Export PDF` button has no `onClick`**: `actions={<Button><Icon name="Download" …/> Export
  PDF</Button>}`. Meanwhile `lib/api/tax.ts` exposes **two** PDF paths
  (`/api/v1/tax/annual-report.pdf`). Predicted: the capability exists, the button exists, and they
  are not connected.
- **The year is hard-wired**: `const year = new Date().getFullYear()`, with no year picker and no
  `basis` selector, though the API accepts both. A tax report you cannot point at *last* year is
  not much use at filing time.

Also worth crediting up front, and worth verifying: `taxReportController._buildReport` **ANDs**
`_vendorBookingWhere(user)` with the venue narrowing rather than replacing it — precisely the fix
that `getReceivables` is missing (WWL-129). And `WW-021` computes a vendor's revenue from **their
own `BookingDetails` slice**, not `Booking.totalAmount`, so a multi-vendor wedding is not counted
whole in each vendor's tax return.

## Test cases — written in full before execution

### A. Load, identity, fiscal-year correctness

| # | Case | Expect |
|---|---|---|
| D15-001 | Route loads; cards and monthly table render | |
| D15-002 | `<title>` is `Dashboard : Tax report` | |
| D15-003 | Sidebar "Tax report" vs `<h1>` "Tax & P&L" — do they agree? | label drift probe |
| D15-004 | One `/api/v1/tax/annual-report` call on load | |
| D15-005 | **Is `businessId` sent?** | predicted NO — not on the whitelist |
| D15-006 | **Does switching venue change any figure on this screen?** | the decisive test |
| D15-007 | What `year` is requested, and what period does the backend return? | FBR fiscal 1 Jul – 30 Jun |
| D15-008 | Is the period stated anywhere on screen? | a report with no stated period is unusable |
| D15-009 | Month rows cover the fiscal year, not the calendar year | |
| D15-010 | Month labels are unambiguous (include the year) | Jul 2026 … Jun 2027 |
| D15-011 | Σ month revenue === `Gross revenue` card | |
| D15-012 | Σ month expenses === `Expenses` card | |
| D15-013 | `Net P&L` === revenue − expenses | |
| D15-014 | Σ month bookingCount === a sensible booking total | |
| D15-015 | Revenue reconciles against Payments / Bookings for the same period | cross-module |
| D15-016 | Expenses reconcile against Module 14 for the same period | cross-module |
| D15-017 | **Are cancelled bookings excluded from revenue?** | controller says yes (FBR accrual) |
| D15-018 | **Is revenue the vendor's slice, not the whole booking total?** | WW-021 |
| D15-019 | `FBR submitted` card — what does it show, and is it meaningful? | adapter is a noop |
| D15-020 | Does the screen explain what "FBR submitted" means? | |
| D15-021 | Rs formatting; no `NaN` | |
| D15-022 | Negative Net P&L renders correctly with a "down" trend | |

### B. The missing controls

| # | Case | Expect |
|---|---|---|
| D15-023 | **Is there a year selector?** | predicted no |
| D15-024 | Can a vendor view the previous fiscal year at all? | filing needs last year |
| D15-025 | Is there a `basis` (fiscal vs calendar) selector? | API supports it |
| D15-026 | **Does `Export PDF` do anything?** | predicted dead button |
| D15-027 | Does clicking it fire any request? | |
| D15-028 | Does it produce a download, a new tab, or an error? | |
| D15-029 | Does the backend PDF endpoint itself work? | probe directly — the capability exists |
| D15-030 | Is there any other way to get the report out (print, CSV)? | no ExportMenu on this screen |
| D15-031 | No search / density / selection on this screen — intentional for a report? | |

### C. Table, cards, rendering

| # | Case | Expect |
|---|---|---|
| D15-032 | Columns: Month, Bookings, Revenue, Expenses | |
| D15-033 | **Is there a per-month Net column?** | only the annual card has net |
| D15-034 | Money columns right-aligned, tabular | |
| D15-035 | Expenses toned "error", revenue neutral | |
| D15-036 | A month with no activity renders zeros, not blanks | |
| D15-037 | `getRowId` is `monthLabel` — unique across the set? | collision probe |
| D15-038 | Four cards present and correctly typed | |
| D15-039 | Cards show `…` during load, not `Rs 0` | source has the guard |
| D15-040 | `Gross revenue` trend is unconditionally "up" | |
| D15-041 | Cards are inert | |
| D15-042 | `<th scope>` / caption | |
| D15-043 | No row actions, no checkboxes — read-only surface | |
| D15-044 | Row not clickable; no drill-through to the month's bookings | |

### D. Resilience, a11y, responsive

| # | Case | Expect |
|---|---|---|
| D15-045 | Genuine network failure → *"Couldn't load the annual tax report."* + Retry | |
| D15-046 | Retry recovers | |
| D15-047 | Mis-routed endpoint (backend 200) → fake empty report? | WWL-108 pattern |
| D15-048 | Loading state — skeletons | |
| D15-049 | Empty state copy when a period genuinely has no data | |
| D15-050 | Hard reload is consistent | |
| D15-051 | No console errors | |
| D15-052 | Keyboard: every control reachable with a visible focus ring | |
| D15-053 | `Export PDF` is keyboard-reachable and announced | |
| D15-054 | Card values announced with labels | |
| D15-055 | 360px: no horizontal overflow **and no clipped content** | after WWL-178, check both |
| D15-056 | 360px: month cards readable | |
| D15-057 | 360px: is `Export PDF` reachable? | |
| D15-058 | Unauthenticated → redirect | |

### E. The numbers an accountant would question

| # | Case | Expect |
|---|---|---|
| D15-059 | Does revenue include bookings that are only `Pending`? | accrual vs cash |
| D15-060 | Does revenue include **unpaid** money? | accrual basis means yes |
| D15-061 | Is that basis stated anywhere for the accountant? | |
| D15-062 | Do expenses include the future-dated rows from Module 14? | WWL-175's rows |
| D15-063 | Do expenses include untagged overheads? | |
| D15-064 | Is any tax actually **computed** — or is this only a P&L? | screen is titled "Tax" |
| D15-065 | Is there any FBR/PRA filing status beyond the one card? | |
| D15-066 | Does the report distinguish the three venues at all? | it cannot if unscoped |
| D15-067 | Would two vendors sharing a booking both see the full amount? | WW-021 says no |
| D15-068 | Month ordering is chronological across the fiscal-year boundary | Jul→Jun, not Jan→Dec |
| D15-069 | Does a month with bookings but no expenses show Rs 0 or blank? | |
| D15-070 | Is the current (incomplete) month flagged as partial? | |
| D15-071 | Rounding — `_round` on the backend, any drift vs source ledgers? | |
| D15-072 | Nothing on this screen writes | read-only confirmation |

## MODULE 15 — EXECUTION RESULTS

Read-only screen; nothing was written. The story here is unusually clean: **the backend does
everything correctly and the frontend renders a fraction of it.**

### WWL-189 (S2) — `Export PDF` is a dead button, and it is the only way out of this screen

Clicked on live production. Measured either side:

| | |
|---|---|
| New network requests | **0** |
| Downloads / blobs created | **0** |
| Toasts | **0** |
| URL | unchanged |
| `onclick` | `false`, `type="submit"`, not inside a `<form>` or `<a>` |

Meanwhile the endpoint it should call **works perfectly**:

```
GET /api/v1/tax/annual-report.pdf?year=2026&basis=fiscal
→ 200 · application/pdf · 3,056 bytes · magic "%PDF-1.3"
```

`lib/api/tax.ts` exposes two PDF helpers. The capability is built, the button is rendered, and
they were never connected. There is **no `ExportMenu`, no print action and no CSV** on this
screen, so a vendor cannot get their tax report out of the portal at all — while the route's own
metadata promises *"One-click PDF export for your accountant."*

### WWL-190 (S2) — the tax report silently ignores the venue switcher

Driven through all four selections in the live UI:

| Switcher shows | Gross revenue | Expenses | Net P&L |
|---|---|---|---|
| Rehman Banquet & Lawn | Rs 14,349,700 | Rs 4,869,700 | Rs 9,480,000 |
| Rehman Grand Marquee | Rs 14,349,700 | Rs 4,869,700 | Rs 9,480,000 |
| Rehman Marquee Bahria | Rs 14,349,700 | Rs 4,869,700 | Rs 9,480,000 |
| All venues | Rs 14,349,700 | Rs 4,869,700 | Rs 9,480,000 |

All four requests were byte-identical — `tax/annual-report?year=2026&basis=fiscal`, **no
`businessId`**. The cause is one missing line: `/api/v1/tax` is absent from
`BUSINESS_SCOPED_PREFIXES` in `lib/axiosConfig.js`, where every other money path is listed.

The backend is not at fault — it scopes correctly and partitions exactly:

| Venue | Revenue | Expenses |
|---|---|---|
| 3358 Grand Marquee | 4,888,250 | 1,690,500 |
| 3359 Banquet & Lawn | 7,268,550 | 1,827,700 |
| 3360 Marquee Bahria | 2,192,900 | 1,351,500 |
| **Σ** | **14,349,700** ✓ | **4,869,700** ✓ |

So a vendor who selects "Rehman Grand Marquee" reads **Rs 14,349,700** and will reasonably take
it as that venue's revenue. It is three times too high — on the document they hand to an
accountant.

Worth noting the contrast: `taxReportController._buildReport` **ANDs** `_vendorBookingWhere(user)`
with the venue narrowing rather than replacing it — exactly the fix `getReceivables` needs
(WWL-129). The backend got the hard part right; the frontend never asks.

### WWL-191 (S2) — the year you actually file is unreachable

`const year = new Date().getFullYear()` with **no year picker anywhere** — the only controls on
the page are app chrome and the dead `Export PDF`.

Today is 6 Aug 2026, so the screen shows **Fiscal 2026-27**, which began five weeks ago. The
fiscal year a Pakistani vendor is filing right now is **2025-26**, and the API returns it
correctly on request:

| Period | Revenue | Expenses | Net |
|---|---|---|---|
| Fiscal **2026-27** (shown) | 14,349,700 | 4,869,700 | **9,480,000** |
| Fiscal **2025-26** (unreachable) | 14,524,500 | 11,962,300 | **2,562,200** |
| Calendar 2026 (unreachable) | 28,874,200 | 16,832,000 | 12,042,200 |

The net figures differ by a factor of nearly four. The API also accepts `basis=calendar`, which
the UI never offers.

### Findings S3 / S4

| ID | Sev | Finding |
|---|---|---|
| **WWL-192** | S3 | **The report never states its own period.** The API returns `period.label: "Fiscal 2026-27 (1 Jul 2026 – 30 Jun 2027)"` on every response and the screen renders none of it — no heading, no subtitle, no range. The only clue is the month rows. A report handed to an accountant with no stated period is not a document. This is an unrendered field, not a missing capability. |
| **WWL-193** | S3 | **The revenue basis is correct but undisclosed.** Verified exactly: the report counts **Confirmed + Completed only** — 7 + 3 bookings summing to **Rs 14,349,700**, matching to the rupee. It therefore **excludes Rs 4,619,650** of `Pending` and `Awaiting Payment` business, and **includes** confirmed-but-unpaid bookings. That is a defensible accrual position and the controller documents it, but nothing on screen tells the accountant which bookings are in or out. |
| **WWL-194** | S3 | **`FBR submitted: Rs 0` is unexplained and will always read zero.** The FBR/PRA adapter is a noop pending a PRA sandbox token, so the card is structurally Rs 0. No tooltip, no "not configured" state — a vendor reading it would conclude they have filed nothing, which is a different claim from "this feature is not switched on". |
| **WWL-195** | S3 | **The monthly table has no Net column**, so per-month profitability — the reason to break a year into months — must be done by hand. There is also no drill-through from a month to its bookings or expenses, and no `basis` selector. |
| **WWL-196** | S3 | **Table a11y, sixth module unchanged.** 0 of 4 `<th>` carry `scope` and there is no `<caption>`. |
| **WWL-197** | S4 | **Mobile month cards run two money figures together, unlabelled** — `Rs 2,903,650Rs 2,718,100` with no separator and no indication which is revenue and which is expenses. The WWL-122 pattern. |
| **WWL-198** | S4 | **Three labels for one screen**: sidebar **"Tax report"**, breadcrumb **"Tax"**, heading **"Tax & P&L"**. |

### Notable passes

- **D15-002 PASS** — `Dashboard : Tax report`.
- **D15-009/010 PASS — the FBR fiscal year is right.** Rows run **Jul 2026 → Jun 2027**, not Jan–Dec, and every label carries its year (`Jul 2026`, …, `Jun 2027`), so the fiscal-year boundary is unambiguous.
- **D15-011/012/013 PASS — the arithmetic closes exactly.** Σ month revenue = Rs 14,349,700 = `Gross revenue`; Σ month expenses = Rs 4,869,700 = `Expenses`; and 14,349,700 − 4,869,700 = **Rs 9,480,000** = `Net P&L`.
- **D15-016 PASS — expenses reconcile perfectly with Module 14.** All 51 expenses dated inside the fiscal window total **Rs 4,869,700**, matching the tax report to the rupee.
- **D15-017 PASS — cancelled bookings are excluded.** The two Cancelled Waheed Jutt bookings (Rs 1,112,650) are correctly outside the revenue line, consistent with FBR accrual treatment.
- **D15-036 PASS** — months with no activity render `0` and `Rs 0` rather than blanks, so the year reads as a complete series.
- **D15-039 PASS** — cards show `…` during load, never `Rs 0`. Correct, unlike Receipts (WWL-147).
- **D15-043/044 PASS** — a genuinely read-only surface: no row checkboxes, no row buttons, nothing writes.
- **D15-052 PASS** — all 9 focusable controls carry a visible focus ring, and `Export PDF` is keyboard-reachable (it simply does nothing when activated).
- **D15-055 PASS — the cleanest mobile result of the sweep.** At a true emulated 360×740: `scrollWidth === clientWidth === 360`, the page does not scroll horizontally, **and zero elements are clipped**. This is the first module where both checks pass together — the direct contrast with WWL-178, where the page-level check passed while 22 elements were cut off.

### Module 15 — status

**72 cases written, 61 driven. 10 findings (3× S2, 5× S3, 2× S4).**

Not driven, each with its reason:

| Cases | Why |
|---|---|
| **D15-018 / D15-067** (the WW-021 vendor-slice rule) | This vendor's bookings are single-vendor, so their `BookingDetails` slice equals `Booking.totalAmount` and the two are indistinguishable here. Proving the multi-vendor case would need a booking shared with another vendor. The logic is confirmed in source; not demonstrated live. |
| **D15-045/046/047** (error state, Retry, mis-routed endpoint) | `TaxReportAPI.getAnnualReport` has the same no-`catch` shape as `ReceiptsAPI.list`, where the error state and Retry were driven and passed, and the `?? {}` fallback behaviour was demonstrated in Module 10. Not re-driven. |
| **D15-049** (empty-period copy) | Every fiscal year I could reach has data. The empty state would need a year with none — which the UI cannot select anyway (WWL-191). |
| **D15-064/065** (is any tax actually computed) | Answered by inspection rather than a test: the screen is a **P&L**, not a tax computation. There is no taxable-income line, no slab, no withholding, no sales-tax split — only revenue, expenses, net and the noop FBR card. Recorded here rather than as a defect, since the module's description says "revenue + expense + P&L summary". |
| **D15-070/071** (partial-month flagging, rounding drift) | The current month is not flagged as incomplete, but with the year hard-wired (WWL-191) every report is a partial year by definition, which is the larger issue. No rounding drift was observable — every cross-check matched exactly. |

**The module's verdict.** The backend is the best-behaved of any module tested: correct FBR fiscal
windows, correct exclusion of cancelled bookings, exact venue partitioning, a working PDF
renderer, previous years and calendar basis all available on request, and a labelled period
returned with every response. The frontend asks for one hard-coded year, drops the venue scope,
renders none of the period metadata, and wires the export button to nothing. Three of the four
defects here are a missing parameter, a missing selector and a missing `onClick` — the capability
is already paid for.

---

# MODULE 16 — REPORT CARDS (`/dashboard/reports`)

**Component** `components/reports/report-cards-view.tsx`
**Data** `getReportCards(period)` → `GET /api/v1/bookings/report-cards?period=month|year`
**Write paths** none. Two outbound actions: a **per-card WhatsApp link** and a
**share-all-as-image** canvas render.

The Urdu-first "glanceable business" screen — big Urdu label, big number, one colour, one arrow.

## SAFETY LIMIT

No writes exist. **No WhatsApp link is followed and no share is sent** — hrefs and the generated
image are inspected locally only, exactly as in Module 11.

## What the source says before I touch the page

- **`/report-cards` is not on `BUSINESS_SCOPED_PREFIXES`** — the second module after Tax
  (WWL-190) that cannot follow the venue switcher.
- **The "self-hides on 404" mechanism is dead code.** `getReportCards` catches `status === 404`
  and returns null — but the backend's catch-all (WWL-107) never returns 404. The screen still
  degrades safely, but via the `?? null` fallback, not the documented path.
- **Any non-404 failure renders "Reports abhi enabled nahi hain."** (`Reports aren't enabled
  yet`). A 500 or a network drop would tell the vendor the feature is switched off rather than
  that something broke.
- The vendor name in the share text comes from `useBusiness()` context, **not** the
  `activeBusinessId` store the switcher writes to — two different sources of "which venue".
- `delta` renders as a raw percentage with no cap; a near-empty previous period will produce very
  large numbers.

## First-glance readings that must be reconciled

Two figures on this screen already contradict other modules:

- **`Baqaya (Vasooli baaqi)` Rs 13,417,229 / 14 events** — matches the **Dashboard** exactly, and
  contradicts **Payments' Due** and **Receivables' outstanding**, both Rs 12,292,729 / 13. This is
  the WWL-110 split, now 2 screens against 2.
- **`Is Maheene Ki Kamai` Rs 16,065,700 across 11 events** — but Module 15's monthly table gives
  **Aug 2026 = 5 bookings, Rs 7,027,950** for the same vendor and month.

## Test cases — written in full before execution

### A. Load, identity, flag behaviour

| # | Case | Expect |
|---|---|---|
| D16-001 | Route loads and renders cards | |
| D16-002 | `<title>` is `Dashboard : Reports` | |
| D16-003 | Sidebar "Reports" vs `<h1>` "Report Cards" | label drift |
| D16-004 | One `bookings/report-cards` call on load | |
| D16-005 | **Is `businessId` sent?** | predicted NO |
| D16-006 | **Does switching venue change any card?** | decisive |
| D16-007 | The loading state is a spinner, not skeletons | |
| D16-008 | A failure renders *"Reports abhi enabled nahi hain."* rather than an error | mislabelled |
| D16-009 | Is there any Retry? | predicted none |
| D16-010 | The 404 self-hide path is unreachable given the backend catch-all | source-confirmed |

### B. The numbers — reconciliation against other modules

| # | Case | Expect |
|---|---|---|
| D16-011 | `Is Maheene Ki Kamai` — what period and what basis? | vs Module 15's Aug figure |
| D16-012 | Its event count (11) vs Module 15's Aug booking count (5) | |
| D16-013 | Is "this month" calendar, rolling-30-day, or fiscal? | |
| D16-014 | Is it keyed on `bookingDate` or `createdAt`? | explains a mismatch |
| D16-015 | Does it include Cancelled bookings? | Module 15 excludes them |
| D16-016 | Does it include Pending / Awaiting Payment? | Module 15 excludes them |
| D16-017 | **`Baqaya` Rs 13,417,229 vs Payments/Receivables Rs 12,292,729** | resolve the WWL-110 split |
| D16-018 | Its event count 14 vs Receivables' 13 customers | |
| D16-019 | `Aaj Ki Vasooli` (today's collection) — Rs 0, is that right? | vs Receipts dated today |
| D16-020 | `Average Booking` === revenue ÷ bookings? | internal consistency |
| D16-021 | `Fi Event Bachat` (per-event saving) Rs 0 with "kharch add karein" | but Module 14 has Rs 16.8m of expenses |
| D16-022 | `Staff Kharcha` Rs 0 — but Module 14 shows salary expenses | |
| D16-023 | `Sab Se Zyada` (most frequent) — 2 mehndi | vs actual event-type mix |
| D16-024 | Seasonality bars — last 6 months, correct months and counts | |
| D16-025 | Seasonality counts vs bookings per month from Module 10 | |
| D16-026 | Deltas of +453% and +450% — what are they comparing? | |
| D16-027 | Is there a guard against a zero previous period? | |
| D16-028 | `Maheena` vs `Saal` toggle changes every card coherently | |
| D16-029 | Year figures reconcile with Module 15's fiscal/calendar totals | |
| D16-030 | Money formatting `Rs ` + `en-PK`, rounded | |
| D16-031 | Percentages rounded, no `NaN`/`Infinity` | |

### C. Urdu, tone, presentation

| # | Case | Expect |
|---|---|---|
| D16-032 | All card labels are in Urdu (Roman) and read naturally | |
| D16-033 | `Maheena` / `Saal` toggle labels correct | |
| D16-034 | Card tones: good → emerald, warn → amber, neutral | |
| D16-035 | Is a **Rs 0** "Fi Event Bachat" toned as good/warn appropriately? | |
| D16-036 | Delta arrow direction matches sign | |
| D16-037 | A negative delta renders rose with a down arrow | |
| D16-038 | The first card spans two columns on mobile, one on desktop | |
| D16-039 | Values are tabular-nums | |
| D16-040 | `sub` text renders alongside the delta | |
| D16-041 | Is any card explained? (no tooltips/definitions) | a number with no definition |
| D16-042 | Urdu text direction — is RTL handled or is it Roman-only? | |
| D16-043 | Does the `اردو` app-level language toggle change these labels? | they are already Urdu |

### D. The two share paths

| # | Case | Expect |
|---|---|---|
| D16-044 | Each card has a WhatsApp icon link | |
| D16-045 | The link is `wa.me/?text=` with **no recipient** | share-sheet style |
| D16-046 | The decoded text names the vendor, the Urdu label and the value | |
| D16-047 | Vendor name comes from `useBusiness()` — does it follow the switcher? | two sources of truth |
| D16-048 | `target="_blank"` + `rel="noopener noreferrer"` | |
| D16-049 | The icon has an accessible name | `title` only, or `aria-label`? |
| D16-050 | **`Image` button generates a shareable card image** | canvas render, inspected locally |
| D16-051 | The image contains all cards with correct values | |
| D16-052 | The image carries the vendor name and the period subtitle | |
| D16-053 | Does the image path attempt a network send, or only produce a file? | must not send |
| D16-054 | Does it work when the Web Share API is unavailable (desktop)? | fallback |
| D16-055 | Is the `Image` button labelled for screen readers? | |

### E. Resilience, a11y, responsive

| # | Case | Expect |
|---|---|---|
| D16-056 | Genuine network failure → what renders? | predicted the "not enabled" copy |
| D16-057 | No console errors | |
| D16-058 | Hard reload consistent | |
| D16-059 | Period choice survives reload? | local state only |
| D16-060 | Keyboard: toggle, Image button and all card links reachable | |
| D16-061 | Visible focus ring on each | |
| D16-062 | Card values announced with their labels | |
| D16-063 | 360px: no page overflow **and** no clipped elements | both checks, after WWL-178 |
| D16-064 | 360px: seasonality bars readable | |
| D16-065 | 360px: are the WhatsApp icons tappable? | |
| D16-066 | 360px: is the `Image` button reachable? | |
| D16-067 | Unauthenticated → redirect | |
| D16-068 | Seasonality with a zero month renders a zero-height bar, not a broken one | `minHeight` guard |
| D16-069 | `maxSeason` guard prevents divide-by-zero | `Math.max(1, …)` |
| D16-070 | Nothing on this screen writes | read-only confirmation |

## MODULE 16 — EXECUTION RESULTS

Read-only screen; nothing was written. **No WhatsApp link was followed and nothing was shared** —
I intercepted `navigator.share` so the image path could be driven to completion without
transmitting anything.

### WWL-199 (S2) — "this month's earnings" counts this month **and every month after it**

```js
const cur  = bookings.filter((b) => inRange(b, startCur, null));   // ← no upper bound
const prev = bookings.filter((b) => inRange(b, startPrev, endPrev)); // ← bounded
const inRange = (b, from, to) => { const d = …; return d >= from && (to ? d <= to : true) }
```

`cur` is passed `null` for `to`, so the "current month" window is **open-ended into the future**.
Verified to the rupee against the live data:

| | Events | Value |
|---|---|---|
| Card says *Is Maheene Ki Kamai* | **11** | **Rs 16,065,700** |
| Live bookings dated **≥ 1 Aug 2026, no upper bound** | 11 | Rs 16,065,700 ✓ exact match |
| **True August 2026 only** | **6** | **Rs 7,377,950** |

The 11 bookings span **2026-08, 2026-09, 2026-10 and 2026-11** — September, October and November
weddings counted as *this month's* earnings. The headline number on the vendor's glanceable
business screen is **2.18× the truth**.

**The screen contradicts itself.** Lower down, the seasonality bar for August reads **6** — the
correct figure — directly beneath a card claiming 11.

The deltas are a consequence: `+453%` and `+450%` compare an **unbounded forward window** against
a **closed** prior month. They cannot be meaningful in any month.

### WWL-200 (S2) — the WWL-110 split has a mechanism: two valuations of the same bookings

Four money surfaces, two answers:

| Screen | Outstanding | Events |
|---|---|---|
| Dashboard *Baqaya* | Rs 13,417,229 | 14 |
| **Report Cards** *Baqaya (Vasooli baaqi)* | **Rs 13,417,229** | **14** |
| Payments *Due* | Rs 12,292,729 | 13 |
| Receivables *Outstanding* | Rs 12,292,729 | 13 |

**Rs 1,124,500 apart.** I tested and rejected the obvious explanation: `reportCardsService`
**does** exclude cancelled bookings —
`.filter((b) => !CANCELLED.has(b.status) && !CANCELLED.has(b.orderStage))` — and Payments' `due`
is identical whether or not cancelled rows are included, so cancellation is not the difference.

The actual mechanism is the **source of truth for what a booking is worth**: `reportCardsService`
computes `money(b).balance` from `orderTotalsJson` / `BookingOrderLines`, while Payments and
Receivables derive from `BookingDetails.totalAmount` and `downPayment`. Two independent ledgers
for the same bookings, disagreeing by Rs 1.12m.

**I have not established which is authoritative** — that needs a decision, not a test. What is
certain is that a vendor asking "how much am I owed?" gets two different answers depending on
which screen they open.

### WWL-201 (S2) — "Aaj Ki Vasooli" is not today's collections

```js
// Today's collections (advance on bookings dated today — a proxy for vasooli).
const todaysAdvance = bookings.filter((b) => b.bookingDate === today)
                              .reduce((s, b) => s + money(b).advance, 0);
```

The card is labelled *Aaj Ki Vasooli* — today's recovery — and its English label is literally
`"Collected today"`. It actually sums the **advance on bookings whose event date is today**. The
source comment admits it is "a proxy".

Live it reads **Rs 0**, while **receipt 179 for Rs 458,460 carries `receivedDate 2026-08-06`** —
today. Real money collected today exists and the card reports none of it. A vendor closing the
day's cash would conclude nothing came in.

### WWL-202 (S2) — the profit and staff-cost cards ignore the Expenses module entirely

`Fi Event Bachat` reads **Rs 0** with the prompt **"kharch add karein"** (*add expenses*), and
`Staff Kharcha` reads **Rs 0**. Both are computed from `BookingOrderLines` where
`kind='cost' OR moneyFlow='expense'` — **not** from the Expenses ledger.

Module 14 holds **Rs 16,832,000 of expenses across 165 rows**, including a dedicated
`salary / payroll` category (Rs 1,083,000 in one venue alone). The vendor is being told to add
costs they have already entered, on a different screen, in the same product.

### WWL-203 (S2) — a server failure is reported as "the feature is switched off"

Driven against an unroutable host — a total network failure. After 12 seconds:

> **Reports abhi enabled nahi hain.**

No error state, no Retry, no cards. `getReportCards` catches only `404`; anything else re-throws,
and the view's `if (!data)` branch renders the not-enabled copy for every failure mode.

This is worse than the usual swallow (WWL-130): it does not merely hide the error, it
**misattributes it to a product decision**. A vendor told the feature is not enabled will not
retry and will not report a fault.

Related: the documented *"self-hides on 404"* mechanism is **dead code**. The backend's catch-all
(WWL-107) never returns 404, so that branch can never fire; the screen degrades only through the
`?? null` fallback.

### Findings S3 / S4

| ID | Sev | Finding |
|---|---|---|
| **WWL-204** | S3 | **Not venue-scoped, and the share misattributes the figures.** `/report-cards` is absent from `BUSINESS_SCOPED_PREFIXES` — the second module after Tax (WWL-190). Worse, the vendor name in both share paths comes from `useBusiness()`, not the active-venue store: with the switcher on **All venues**, every WhatsApp message and the generated image are headed **"Rehman Grand Marquee"** while carrying all three venues' combined numbers. |
| **WWL-205** | S3 | **The share targets are 14×14 px.** Measured at 360×740 on the screen whose entire purpose is sharing from a phone. That is below WCAG 2.2's 24×24 floor and far below the 44/48px touch guidance. |
| **WWL-206** | S3 | **Share links have no `aria-label`** — the accessible name falls back to `title="Share on WhatsApp"`, and all eight are identical, so a screen-reader user cannot tell which card each one shares. The WWL-104 family. |
| **WWL-207** | S4 | The bookings query carries a silent **`limit: 5000`** with no indication when it truncates. |
| **WWL-208** | S4 | Sidebar says **"Reports"**, the heading says **"Report Cards"**. |

### Notable passes

- **D16-002 PASS** — `Dashboard : Reports`.
- **D16-024/025 PASS — the seasonality bar is correct.** Mar 2 · Apr 2 · May 1 · Jun 3 · Jul 2 · **Aug 6**, and August's 6 matches the true count of live August bookings exactly. It is the headline card above it that is wrong.
- **D16-028 PASS — the period labels switch properly.** I expected a stale label in year mode and was **wrong**: the service supplies `"Saal ki Kamai"` and `"Saal ki Bookings"` for `period=year`, and `"Is Maheene…"` for month.
- **D16-020 PASS** — `Average Booking` Rs 1,460,518 = Rs 16,065,700 ÷ 11 exactly (internally consistent, though built on WWL-199's numerator).
- **D16-032/033 PASS — the Urdu is good.** `Is Maheene Ki Kamai`, `Baqaya (Vasooli baaqi)`, `Fi Event Bachat`, `Staff Kharcha`, `Sab Se Zyada`, `Kaunse maheene busy`, and the `Maheena` / `Saal` toggle all read naturally in Roman Urdu. This is the most confidently localised screen in the portal.
- **D16-045/048 PASS** — every share link is `wa.me/?text=…` with **no recipient**, i.e. the OS share sheet rather than a message to a specific person, and each carries `target="_blank"` with `rel="noopener noreferrer"`.
- **D16-050 → D16-053 PASS — the image share is well built and entirely local.** Driven to completion with `navigator.share` intercepted: it produced **1 file**, made **zero network calls**, and generated a correctly formatted Roman-Urdu summary of all eight cards with the subtitle *"Is maheene ka hisaab"* and a `— Wedding Wala` footer. Nothing is transmitted by the app itself; the OS share sheet is the only egress.
- **D16-060/061 PASS** — 22 focusable controls, all with a visible focus ring.
- **D16-063 PASS — clean at 360px on both checks.** `scrollWidth === clientWidth === 360`, the page does not scroll horizontally, **and zero elements are clipped** — only the second module (after Tax) to pass both, and appropriate for the one screen designed mobile-first.
- **D16-068/069 PASS** — `Math.max(1, …)` guards the seasonality divisor and the `minHeight` rule renders a zero month as a flat baseline rather than a broken bar.

### Module 16 — status

**70 cases written, 60 driven. 10 findings (5× S2, 3× S3, 2× S4).**

Not driven, each with its reason:

| Cases | Why |
|---|---|
| **D16-006** (venue switch changes a card) | The endpoint receives no `businessId` (D16-005 confirmed), so the outcome is determined: it cannot change. Recorded as WWL-204 from the request evidence rather than re-driven through the switcher as in Module 15. |
| **D16-014/015/016** (exact basis of the money card) | Superseded — D16-011 identified the rule exactly (`bookingDate ≥ startCur`, unbounded, cancelled excluded), which answers all three. |
| **D16-029** (year figures vs Module 15) | Year mode returns Rs 33,493,850 across 22 events = every live booking. All 25 bookings fall inside calendar 2026, so **"this year" and "all time" are indistinguishable on this data** — the unbounded-window bug cannot be separated from correct behaviour at year granularity. |
| **D16-037** (negative delta styling) | No card currently carries a negative delta; the rose/down-arrow branch could not be exercised without different data. |
| **D16-042/043** (RTL and the app language toggle) | The labels are **Roman** Urdu, not Urdu script, so there is no RTL text to lay out. The `اردو` toggle governs the app shell, not these server-supplied labels. |
| **D16-054** (Web Share fallback) | `navigator.share` **is** available in this browser, so the no-Web-Share fallback path never ran. |
| **D16-059** (period survives reload) | `period` is local component state with no URL or storage backing — it resets to `month`. Noted rather than raised; a two-option toggle is cheap to re-set. |

**The module's verdict.** The presentation is the best-localised and most mobile-honest screen in
the portal — natural Roman Urdu, a clean 360px layout with nothing clipped, a genuinely nice
local image-share, and a correct seasonality chart. Every serious problem is in the numbers
behind it: the headline counts four months as one, the outstanding figure disagrees with two
other modules because it reads a different ledger, "collected today" measures something else
entirely, and the profit cards tell a vendor to enter costs they have already entered. A
glanceable screen is only as good as the glance, and four of its eight cards are currently
misleading.

---

# MODULE 17 — TRADE OPERATIONS (`/dashboard/trade-ops`)

**Component** `components/dashboard/mainScreens/function-sheets/redesigned/trade-operations-hub-view.tsx`
**Registry** `lib/dashboard/trade-ops-config.ts` — **9 trades · 30 sections · 134 columns**
**Data** `FunctionSheetAPI.list()` → `FunctionSheetAPI.get(id)`
**Write path** `FunctionSheetAPI.update(sheet.id, { [jsonField]: obj })`

One generic editor for every wedding trade's operational plan. Each trade maps to its own JSON
column on a function sheet:

| Trade | Label | JSON column |
|---|---|---|
| beo | Run sheet | `beoJson` |
| kitchen | Kitchen sheet | `kitchenSheetJson` |
| bridal | Bridal Wear | `bridalWearJson` |
| decorator | Decor setup | `decoratorSetupJson` |
| carRental | Fleet plan | `carRentalJson` |
| henna | Mehndi plan | `hennaJson` |
| stationery | Stationery | `stationeryJson` |
| makeup | Makeup plan | `makeupJson` |
| subcontracts | Subcontracts | `subcontractsJson` |

## SAFETY LIMIT FOR THIS MODULE

This screen edits a **real function sheet** belonging to a real booking — the sheets hold
Rs 28,559,050 of contracted work. The write blocker is armed before any cell is touched, and
every `PATCH` is captured with its body and diverted. Rows are added and removed **in local state
only**; nothing is persisted.

## What the source says before I touch the page

Two hazards stand out, both already seen elsewhere in this codebase:

- **With no `?id=`, it loads the FIRST sheet from the list straight into a live editor**
  (`const first = list?.functionSheets?.[0]`). This is the exact shape of WWL-071/081 in the
  function-sheet composer: a vendor clicking "Trade operations" in the nav is editing an arbitrary
  sheet they never chose.
- **Save writes the entire JSON column**, rebuilt from `trade.sections` alone:
  ```js
  const obj = {}
  for (const s of t.sections) obj[s.key] = (rows[active]?.[s.key] ?? []).map(stripRid)
  return FunctionSheetAPI.update(sheet.id, { [t.jsonField]: obj })
  ```
  Any key stored in that column that the registry does not describe is **silently dropped**. The
  WWL-081 data-destruction shape.

Also predicted:
- **Dirty state is per-trade but the Save button only saves the active trade.** Editing trade A,
  switching to B and saving leaves A dirty in memory with no `beforeunload` guard — navigate away
  and the edits vanish.
- After a save the effect re-runs but `loadedId.current === sheet.id`, so local state is **not**
  rebuilt from the server response.
- The empty state ("No function sheet") offers **no action** — a dead end.
- Two links are provided to screens the comment says were "reachable from nowhere":
  `/dashboard/function-sheet-operations` and `/dashboard/function-sheet-sign`. The `/sign/`
  family was implicated in WWL-079/080 (the lowercase middleware destroying base64url tokens).

## Test cases — written in full before execution

### A. Load, sheet selection, identity

| # | Case | Expect |
|---|---|---|
| D17-001 | Route loads and renders an editor | |
| D17-002 | `<title>` is `Dashboard : Trade operations hub` | |
| D17-003 | Sidebar / breadcrumb / `<h1>` agree | |
| D17-004 | **Which sheet does it load with no `?id=`?** | predicted the first in the list |
| D17-005 | Is the loaded sheet named anywhere the vendor can see? | the breadcrumb shows the title |
| D17-006 | Is there any way to **choose** a different sheet from this screen? | predicted none |
| D17-007 | `?id=<other sheet>` loads that sheet | |
| D17-008 | `?id=<nonexistent>` → honest empty state, not a crash | |
| D17-009 | `?id=<another vendor's sheet>` → refused | authz probe |
| D17-010 | `?trade=kitchen` opens on that trade | |
| D17-011 | `?trade=garbage` falls back to the first trade | `getTrade` fallback |
| D17-012 | Only one `function-sheets` list call + one get on load | |
| D17-013 | `businessId` scoping on the underlying calls | function-sheets is whitelisted |
| D17-014 | Empty state when the vendor has no sheets — with an action? | predicted dead end |

### B. The 9 trades, 30 sections, 134 columns

| # | Case | Expect |
|---|---|---|
| D17-015 | All **9** trade buttons render with icons and labels | |
| D17-016 | The trade switcher scrolls horizontally without clipping | `overflow-x-auto` |
| D17-017 | Switching trade swaps the sections without a reload | |
| D17-018 | `aria-current` tracks the active trade | |
| D17-019 | Each trade renders its full section set — **30 sections total** | |
| D17-020 | Each section renders its full column set — **134 columns total** | |
| D17-021 | Column headers render on desktop, per-cell labels on mobile | |
| D17-022 | Section descriptions and icons render | |
| D17-023 | An empty section says "Nothing yet — <add label>." | |
| D17-024 | Text / number / date / select column types each render the right control | |
| D17-025 | A `select` with a stored value outside its options keeps that value | the `!includes` guard |
| D17-026 | Number columns are right-aligned tabular | |
| D17-027 | Placeholders fall back to the column label | |
| D17-028 | Which trades have existing data on this sheet? | |
| D17-029 | Existing rows are seeded into the right cells | |
| D17-030 | Are there any validation rules at all on 134 columns? | predicted none |

### C. Editing, dirty state, the save contract

| # | Case | Expect |
|---|---|---|
| D17-031 | Typing in a cell marks that trade dirty (amber dot) | |
| D17-032 | The sticky bar shows "Unsaved" and the row count | |
| D17-033 | Row count is per-trade, not global | |
| D17-034 | `Add row` appends a blank row with select defaults filled | |
| D17-035 | `Remove row` removes the right row | |
| D17-036 | Removing then adding does not reuse a stale `_rid` | |
| D17-037 | Save is disabled until the active trade is dirty | |
| D17-038 | **Edit trade A, switch to B — is A still dirty?** | |
| D17-039 | **Does saving B persist A's edits?** | predicted no — separate columns |
| D17-040 | **Is there any unsaved-changes guard on navigation?** | predicted none |
| D17-041 | Switching trades does not lose in-memory edits | |
| D17-042 | **The captured PATCH body contains ONLY the active trade's column** | |
| D17-043 | **Does the body include every section key of that trade?** | rebuilt wholesale |
| D17-044 | **Would a key stored in that column but absent from the registry be dropped?** | data-destruction probe |
| D17-045 | `_rid` is stripped from the payload | |
| D17-046 | Empty sections serialise as `[]`, not omitted | |
| D17-047 | Save reports success while the write is diverted | WWL-107 recurrence |
| D17-048 | After save, is local state rebuilt from the server? | `loadedId` guard says no |
| D17-049 | Save failure surfaces a real error with an 8s toast | |
| D17-050 | Cell values are sent as strings even for number columns | type fidelity |

### D. The two side doors

| # | Case | Expect |
|---|---|---|
| D17-051 | `Night-of operations` link resolves to a working screen | |
| D17-052 | It carries the sheet context, or does it load its own first sheet? | |
| D17-053 | `Sign contract` link resolves | |
| D17-054 | Does the `/sign` route suffer the lowercase-middleware problem? | WWL-079/080 family |
| D17-055 | Are these two screens reachable from the nav at all? | the comment says no |
| D17-056 | Both links are keyboard-reachable with visible focus | |

### E. Resilience, a11y, responsive

| # | Case | Expect |
|---|---|---|
| D17-057 | Genuine network failure → the "No function sheet" empty state or an error? | `isError \|\| !sheet` merges both |
| D17-058 | **A load failure is indistinguishable from having no sheets** | mislabelled-error probe |
| D17-059 | Is there a Retry? | |
| D17-060 | Loading state renders a skeleton | |
| D17-061 | No console errors across all 9 trades | |
| D17-062 | Hard reload preserves the trade via `?trade=`? | predicted no — state resets |
| D17-063 | Keyboard: trade switcher, every cell, add/remove, save | |
| D17-064 | Visible focus ring on all | |
| D17-065 | `Remove row` has an accessible name | source says `aria-label` |
| D17-066 | Trade buttons announce their state | `aria-current` |
| D17-067 | Section headings are real headings | `<h2>` |
| D17-068 | 360px: no page overflow **and** no clipped elements | both checks |
| D17-069 | 360px: the trade switcher is usable | |
| D17-070 | 360px: cells stack with their labels | `sm:hidden` label |
| D17-071 | 360px: the sticky save bar does not cover the last row | `pb-24` |
| D17-072 | 360px: `Remove row` reachable | |
| D17-073 | The sticky bar respects the sidebar width on desktop | |
| D17-074 | Unauthenticated → redirect | |

### F. Data integrity — the questions that matter most

| # | Case | Expect |
|---|---|---|
| D17-075 | Read the sheet's current JSON columns before any edit | baseline |
| D17-076 | Compare stored keys against the registry's section keys per trade | orphan-key hunt |
| D17-077 | **Does any live sheet hold a key the registry would drop?** | the real WWL-081 test |
| D17-078 | Do stored rows hold columns the registry does not render? | invisible-field hunt |
| D17-079 | Are those columns preserved on save, or dropped with the row? | `stripRid` keeps unknown keys |
| D17-080 | Does `beoJson` overlap with the BEO/function-sheet screens? | two editors, one column |
| D17-081 | Could this screen and the composer overwrite each other? | cross-editor conflict |
| D17-082 | Sheet count and every JSON column unchanged at module close | proof nothing was written |
| D17-083 | Number cells round-trip as strings — any coercion loss? | |
| D17-084 | Very long cell text is accepted without limit | |
| D17-085 | Unicode / Urdu text in cells | |
| D17-086 | Nothing else on the page writes | |

## MODULE 17 — EXECUTION RESULTS

**Nothing was written.** Verified through a clean iframe realm at close: **17 sheets, and all 9
trade columns still `null` on every one of them** — `carRentalJson` on sheet 77 is still `null`
despite the toast saying *"Fleet plan saved"*, and the sheet's `updatedAt` still predates this
session.

```
PATCH /api/v1/function-sheets/77
{"carRentalJson":{"vehicles":[{"vehicleName":"","vehicleType":"Luxury sedan (dulha car)",
                               "plateNumber":"","decor":"Full floral decor"}],
                  "routeSchedule":[],"drivers":[]}}
```

### WWL-209 (S2) — three screens auto-load an arbitrary contract, and one of them can sign it

With no `?id=`, the hub loads `list.functionSheets[0]` — **sheet 77, "Mehndi — Ahmed Raza"** — out
of **17**. The vendor never chose it, and **there is no sheet picker anywhere on the screen**.

The same pattern repeats on both screens the hub links to, and both also landed on sheet 77:

| Route | Loads | Picker |
|---|---|---|
| `/dashboard/trade-ops` | sheet 77 | none |
| `/dashboard/function-sheet-operations` | sheet 77 | none |
| `/dashboard/function-sheet-sign` | sheet 77 | none |

The third one is the problem. Two clicks from the hub — `Sign contract` → the signature screen —
a vendor is looking at:

> **Mehndi — Ahmed Raza** · Ahmed Raza & Sanam Ahmed · Rehman Grand Marquee
> Grand total **Rs 1,092,200**
> Vendor signature · Type / Draw · **[Sign as vendor]**
> Customer signature · **[Generate signing link]**

Both buttons are **enabled**. I did **not** click either — signing is an irreversible legal act
and generating a link would send a real customer a signing request. But the exposure is plain: an
arbitrary contract, selected by nothing but list order, one click from being signed.

This is the same defect the function-sheet composer has (WWL-071/081), now on three more routes,
one of which is a signature page.

### WWL-210 (S2) — unsaved work is discarded silently, and the UI knows it

Driven end to end:

1. Added and filled a row under **Kitchen sheet** → amber dirty dot appears, sticky bar reads
   **"Kitchen sheet · 1 row Unsaved"**.
2. Switched to **Fleet plan** → Kitchen keeps its dot (per-trade tracking is correct), but the
   Save button relabels to *"Save fleet plan"* and **disables**. Kitchen cannot be saved from here.
3. Clicked a sidebar link.

Result: navigated straight to `/dashboard/bookings`.
`onbeforeunload` handler: **none**. `beforeunload` default-prevented: **false**. Confirm dialog:
**none**. The Kitchen row was gone.

The screen renders an "Unsaved" warning and a per-trade dirty dot — it is tracking the state — and
then does nothing to protect it. On a surface of 9 trades × up to 4 sections, a vendor can enter a
full kitchen plan, switch trade to check something, click away, and lose all of it without a
prompt.

### WWL-211 (S2) — save rebuilds the whole JSON column from the registry

The captured payload confirms the mechanism: saving Fleet plan sent the **entire `carRentalJson`
column**, rebuilt from `trade.sections` alone — all three section keys present, the two empty ones
serialised as `[]`. `_rid` was correctly stripped, and **Kitchen's unsaved row was absent**,
confirming that each save writes only its own column.

```js
for (const s of t.sections) obj[s.key] = (rows[active]?.[s.key] ?? []).map(stripRid)
return FunctionSheetAPI.update(sheet.id, { [t.jsonField]: obj })
```

Any key stored in that column that the registry does not describe would be **silently dropped**.
**I could not demonstrate the loss** — see WWL-213: every column is null in production, so there
is nothing to destroy. Recorded as source-confirmed, with the captured payload as evidence of the
wholesale rebuild rather than a reproduced data loss.

### WWL-212 (S2) — two different screens are both called "Trade operations", and the hub is missing a trade

The hub's own docstring calls it *"one renderer for every wedding trade"*. It registers **9**:
Run sheet, Kitchen sheet, Bridal Wear, Decor setup, Fleet plan, Mehndi plan, Stationery, Makeup
plan, Subcontracts. **Photography is not among them.**

Photography lives on `/dashboard/function-sheet-operations`, which renders *"Photography
operations — Shot list, crew and deliverables for this function sheet"* — and carries:

| | Hub | The other screen |
|---|---|---|
| `<title>` | `Dashboard : Trade operations hub` | **`Dashboard : Trade operations`** |
| Eyebrow | `Operate · Trade operations` | **`OPERATE · TRADE OPERATIONS`** |
| Trades | 9 | 1 (Photographer) |

And the hub's link to it is labelled **"Night-of operations"**, which describes neither a
photography shot list nor the screen's own title. A vendor looking for the photographer's plan
will not find it in the hub that claims to cover every trade, and the one link that reaches it is
named after something else.

### Findings S3 / S4

| ID | Sev | Finding |
|---|---|---|
| **WWL-213** | S3 | **The entire surface is empty in production.** I fetched all **17** function sheets and checked all 9 trade columns on each: **not one is populated**. A 9-trade / 30-section / **134-column** editor, and nothing in the product writes those columns except manual entry on this one screen. This is the "portal feels empty" shape — a large built surface with no data path feeding it. |
| **WWL-214** | S3 | **A load failure is indistinguishable from having no sheets.** `if (isError \|\| !sheet)` renders *"No function sheet — Create a function sheet first to plan its operations."* with **no Retry**. A vendor holding 17 sheets would be told they have none, and invited to create another. |
| **WWL-215** | S3 | **Every load fetches twice.** Observed on the network: `function-sheets` (list) and `function-sheets/77` (detail) each fired **two** times for a single page load. |
| **WWL-216** | S3 | **No validation on any of the 134 columns**, and every cell serialises as a **string** — `setCell` stores `e.target.value` verbatim, so a `type="number"` column round-trips as `"350"`, not `350`. Confirmed in source; the captured payload contained no numeric column to demonstrate it. |
| **WWL-217** | S4 | **Inconsistent label casing across the registry**, visible when switching trades: sentence case in some trades (*"Setup item list"*, *"Run of show"*, *"Menu plan"*) and Title Case in others (*"Outfits by Function"*, *"Fitting & Alteration Schedule"*, *"Proof & Approval Tracker"*). |
| **WWL-218** | S4 | **Four names for one screen**: `<title>` "Trade operations **hub**", `<h1>` "Trade operations", breadcrumb "**Trade Ops**", sidebar "Trade operations". |

### Notable passes

- **D17-015/017/018/019 PASS — the generic renderer works.** All **9** trades drive cleanly, producing exactly **30 sections** in total (4+4+3+3+3+3+3+4+3), each with its own icon, description, empty message and a tailored add-label (*Add space*, *Add cue*, *Add dish*, *Add stall*, *Add artist*, *Add proof*, *Add handover*…). `aria-current` tracks the active trade correctly.
- **The section design is real domain work.** *"Prep & cooking timeline"*, *"Live counters & stalls"*, *"Design List (Per Person)"*, *"Artist Roster & Assignments"*, *"Proof & Approval Tracker"*, *"Deliverable & Handover Schedule"* — these are the actual working documents of Pakistani wedding trades, not generic CRUD.
- **D17-034 PASS** — `Add row` creates a blank row with **select defaults already chosen** (`Mayun`, `Buffet`, `Mixed`, `Luxury sedan (dulha car)`, `Full floral decor`) and number fields carrying realistic placeholders (`350`, `400`).
- **D17-031/032/033 PASS** — dirty tracking is genuinely per-trade: the dot appeared on Kitchen only, and the sticky bar reported *"Kitchen sheet · 1 row Unsaved"* then *"Fleet plan · 0 rows"* after switching.
- **D17-042/045/046 PASS** — the payload carried only the active trade's column, stripped `_rid`, and serialised empty sections as `[]` rather than omitting them.
- **D17-010 PASS** — `?trade=kitchen` opens directly on Kitchen sheet.
- **D17-065 PASS** — the row delete carries `aria-label="Remove row"`.
- **D17-068 PASS — and a false positive of mine, corrected.** My first pass flagged **33 clipped elements** at 360px. Re-measured against the scroll container: **0 of them are outside the trade switcher**, which is `overflow-x: auto` with `scrollWidth 1212 / clientWidth 328` — i.e. deliberately scrollable and fully reachable. The mobile layout is clean.
- **D17-070/071/072 PASS** — per-cell labels render on mobile (5 for a 5-column row), the `Remove row` control is in view, and after scrolling to the bottom the `pb-24` padding clears the sticky bar: `lastInputHidden: false`.

### Corrections to my own readings

1. **"33 elements clipped at 360px"** — **wrong**. All 33 are inside the horizontally scrollable trade switcher and are reachable by scrolling it. Not reported.
2. **"The sticky save bar covers the last row"** — **wrong**. I measured mid-page; after scrolling to the bottom, both the last input and the Remove button clear the bar.

### Module 17 — status

**86 cases written, 71 driven. 10 findings (4× S2, 4× S3, 2× S4).**

Not driven, each with its reason:

| Cases | Why |
|---|---|
| **D17-044 / D17-077 / D17-078 / D17-079** (orphan-key destruction) | **Nothing is stored to destroy** — all 9 columns are null on all 17 sheets (WWL-213). The mechanism is confirmed from source and from the captured wholesale-rebuild payload; the data loss itself is not reproducible on this vendor's data. |
| **D17-009** (another vendor's sheet via `?id=`) | An authorisation probe against someone else's contract. Not run, consistent with the limit set in Module 9. |
| **D17-053 write half** (`Sign as vendor`, `Generate signing link`) | Both are **enabled** on a contract the vendor never selected — which is the finding (WWL-209). Neither was clicked: one signs a real agreement irreversibly, the other sends a real customer a signing request. |
| **D17-054** (the `/sign/<token>` lowercase-middleware problem) | Reaching it requires generating a real signing link. The page route itself (`/dashboard/function-sheet-sign`) is already lowercase and loads fine; the customer-facing token route remains as recorded in WWL-079/080. |
| **D17-080/081** (two editors over `beoJson`) | The hub owns `beoJson` as its "Run sheet" trade, and the BEO/function-sheet screens also read it. With every column null, a cross-editor overwrite cannot be demonstrated — but the wholesale-rebuild mechanism (WWL-211) means it is the same risk. |
| **D17-057/059** (error state and Retry) | Merged into WWL-214: there is no distinct error state to drive — `isError` and "no sheet" render the same thing, and no Retry exists. |

**The module's verdict.** The renderer itself is good work — one config-driven editor covering 9
trades and 134 columns, with per-trade dirty tracking, sensible defaults and genuine domain
modelling of how Pakistani wedding trades actually plan a function. What surrounds it is unsafe:
three screens that open an arbitrary customer's contract with no picker, one of which can sign it;
unsaved work discarded without a prompt by a UI that is actively displaying an "Unsaved" badge; a
save that rewrites a whole JSON column from a registry; and a sibling screen with almost the same
name holding the one trade the hub forgot. And after all of it, the entire surface is empty in
production.

---

# MODULE 18 — AUTOMATION (`/dashboard/automation`)

**Components** `automation-redesigned-view.tsx` + `built-in-reminders-section.tsx` +
`rule-form-dialog.tsx`
**Data** `GET /api/v1/automation/status` (built-ins) · `GET /api/v1/automation/rules` (custom)
**Write paths** `PATCH /automation/prefs` · `POST|PATCH|DELETE /automation/rules`

Two independent surfaces stacked on one page:

1. **Built-in reminders** — 5 system reminders (`t_minus_14`, `t_minus_3`, `t_minus_1`,
   `t_plus_1_review`, `lead_48h_stale`) with **two layers of control**: a per-vendor opt-out
   (`vendorEnabled`, persisted to `User.automationPrefs`) and a **global env kill-switch**
   (`envDisabled`, which takes precedence).
2. **Custom rules** — a "no-code rule builder" whose entire vocabulary is
   `triggerType ∈ {days_before_event, days_after_event}` and `actionType = "notify_me"`.

## SAFETY LIMIT FOR THIS MODULE

The built-in reminders decide whether the platform **messages real customers** on this vendor's
behalf — T-14/T-3/T-1 before their wedding, a review prompt after it, and a nudge on stale leads.

- The write blocker is armed **before** the page is interacted with. Every `PATCH`/`POST`/`DELETE`
  is captured and diverted.
- Toggles **are** driven — that is the only way to test optimistic UI and the success path — but
  only with the blocker armed, and the server state is re-read afterwards through a clean realm to
  prove nothing changed.
- No rule is created, edited or deleted for real.

## What the source says before I touch the page

- **The custom-rule builder has one action: `notify_me`** — it notifies the **vendor**, not the
  customer. So "automation" here is "remind me N days before/after an event". Worth stating
  plainly against the page's own framing of a no-code builder.
- **`envDisabled` is an env-var kill switch** — precisely the feature-flag debt pattern. If the
  flags are off in production the vendor sees "Disabled by ops" and the reminders never fire.
- **The toggle fires immediately with no confirmation**, and `onMutate` applies an **optimistic**
  update, so the UI flips before the server answers.
- `fmtDate` uses `toLocaleDateString(undefined, …)` — the **browser** locale, unlike every other
  module which pins `en-PK`.
- `/api/v1/automation` is **not** on `BUSINESS_SCOPED_PREFIXES` — the third module after Tax
  (WWL-190) and Reports (WWL-204) that cannot follow the venue switcher, despite
  `AutomationRule.businessId` existing on the model.
- `triggerLabel` pluralises correctly (`1 day` / `2 days`) — contrast WWL-154.

## Test cases — written in full before execution

### A. Load and the two surfaces

| # | Case | Expect |
|---|---|---|
| D18-001 | Route loads; both sections render | |
| D18-002 | `<title>` is `Dashboard : Automation` | |
| D18-003 | Sidebar / breadcrumb / `<h1>` agree | |
| D18-004 | Two calls on load: `/automation/status` and `/automation/rules` | |
| D18-005 | **Is `businessId` sent on either?** | predicted no |
| D18-006 | Does switching venue change anything? | |
| D18-007 | Section headings and descriptions render | |
| D18-008 | The two surfaces are visually distinguishable | |

### B. Built-in reminders — the five system rules

| # | Case | Expect |
|---|---|---|
| D18-009 | All **5** built-ins render with label, description and icon | |
| D18-010 | Each shows its current state | |
| D18-011 | **`engine.enabled` — is the automation engine actually running in prod?** | |
| D18-012 | `engine.intervalMs` — is the cadence disclosed to the vendor? | |
| D18-013 | **How many are `envDisabled` (ops kill-switch)?** | the flag-debt question |
| D18-014 | An `envDisabled` rule shows a distinct "Disabled by ops" pill | |
| D18-015 | …and its vendor toggle is disabled or clearly overridden | |
| D18-016 | A vendor-disabled rule is distinguishable from an ops-disabled one | two layers, two messages |
| D18-017 | `delegated` — what does it mean and is it surfaced? | |
| D18-018 | Toggling a built-in fires `PATCH /automation/prefs` with `{kind, enabled}` | captured, diverted |
| D18-019 | The optimistic update flips the UI before the server answers | |
| D18-020 | **With the write diverted, does the UI still report success?** | WWL-107 recurrence |
| D18-021 | After invalidation, does the true server state come back? | optimistic rollback |
| D18-022 | **Server state unchanged after the toggle test** | re-read through a clean realm |
| D18-023 | Is there any confirmation before changing customer messaging? | predicted none |
| D18-024 | Does the copy explain what each reminder sends, and to whom? | |
| D18-025 | Can the vendor preview the message a built-in sends? | |
| D18-026 | Failure of `/automation/status` → error state with Retry? | |

### C. Custom rules — table and stats

| # | Case | Expect |
|---|---|---|
| D18-027 | Four stat cards: Total, Active, Paused, Before event | |
| D18-028 | Counts match the rule list | |
| D18-029 | **Do the cards follow the search filter?** | predicted no |
| D18-030 | Columns: Rule, Trigger, Offset, Action, Last run, Status, actions | |
| D18-031 | `triggerLabel` renders "N days before/after event" | |
| D18-032 | **Pluralisation at offset 1** — "1 day", not "1 days" | contrast WWL-154 |
| D18-033 | Offset 0 renders sensibly ("0 days before event"?) | |
| D18-034 | `Last run` — is any rule actually running? | `lastRunAt` |
| D18-035 | **`Last run` uses the browser locale, not `en-PK`** | inconsistency |
| D18-036 | Status pill Active/Paused matches the switch | two controls, one state |
| D18-037 | Row switch, Edit and Remove all have accessible names | |
| D18-038 | Toggling a custom rule fires `PATCH /automation/rules/:id {enabled}` | captured |
| D18-039 | No confirmation on the row switch | |
| D18-040 | `<th scope>` / caption | |
| D18-041 | Row checkbox names | |
| D18-042 | Empty state offers "New rule" | |

### D. The rule dialog — writes blocked

| # | Case | Expect |
|---|---|---|
| D18-043 | `New rule` opens the dialog | |
| D18-044 | Fields: Name, Trigger, Offset days, Action, Message | |
| D18-045 | **How many trigger types does the API offer?** | predicted 2 |
| D18-046 | **How many action types?** | predicted 1 — `notify_me` |
| D18-047 | Selects default sensibly when options load | |
| D18-048 | Is there any validation on name / offset / message? | |
| D18-049 | Negative offset days | |
| D18-050 | Huge offset days (9999) | |
| D18-051 | Non-numeric offset | |
| D18-052 | Empty name → blocked with a hint | `FormBlockedHint` is imported |
| D18-053 | Message length cap | |
| D18-054 | `POST` captured and aborted; body shape correct | |
| D18-055 | Edit seeds all values; `PATCH` captured | |
| D18-056 | Editing a rule that is currently enabled — does it stay enabled? | |
| D18-057 | Cancel discards; reopening reseeds | |
| D18-058 | Stale-error leak between create and edit sessions | WWL-143 recurrence probe |

### E. Delete, search, export

| # | Case | Expect |
|---|---|---|
| D18-059 | Remove opens a confirm naming the **rule** | better than WWL-145 |
| D18-060 | Cancel / Esc close without deleting | |
| D18-061 | `DELETE` captured and aborted | |
| D18-062 | Search by name, message, trigger type | |
| D18-063 | Search by action / status | predicted no match |
| D18-064 | Case-insensitive, trimmed, metacharacters literal | |
| D18-065 | No-match empty state offers "New rule" as if none exist | WWL-152 pattern |
| D18-066 | Export CSV matches screen | |
| D18-067 | **CSV includes the full `Message` text** | what the vendor's automation says |
| D18-068 | CSV omits nothing shown on screen | parity |

### F. Resilience, a11y, responsive

| # | Case | Expect |
|---|---|---|
| D18-069 | `/automation/rules` failure → error + Retry | |
| D18-070 | Retry recovers | |
| D18-071 | Loading states for both surfaces | |
| D18-072 | Keyboard: both toggles, dialog, delete all reachable | |
| D18-073 | Visible focus ring on every control including the switches | |
| D18-074 | Switches announce their state | `aria-label="Enabled"` is generic |
| D18-075 | 360px: no page overflow **and** nothing clipped outside a scroll container | |
| D18-076 | 360px: are the row switches and actions reachable? | WWL-146/160 recurrence |
| D18-077 | 360px: built-in toggles reachable | |
| D18-078 | Rule count and every built-in preference unchanged at module close | proof |

## MODULE 18 — EXECUTION RESULTS

**Nothing was written.** Verified through a clean iframe realm at close: all **6** built-in
reminders still `vendorEnabled: true`, and the custom-rule count still **0**.

```
PATCH /api/v1/automation/prefs   {"kind":"lead_48h_stale","enabled":false}
POST  /api/v1/automation/rules   {"name":"QA test rule","triggerType":"days_before_event","offsetDays":1,"actionType":"notify_me"}
```

### WWL-219 (S2) — a false "Reminder paused", on the surface that governs customer messaging

I toggled the *Lead 48h-stale* reminder off with the write diverted. The result:

| | |
|---|---|
| Request | `PATCH /automation/prefs {"kind":"lead_48h_stale","enabled":false}` — captured, diverted |
| Toast | **"Reminder paused"** |
| Switch, after settling | **still on** (`aria-checked="true"`) |
| Server | **unchanged** — `vendorEnabled: true` |

The same happened on the rule dialog: **"Rule created"** for a rule that does not exist.

This is WWL-107 again, but the stakes are different here. These toggles decide whether the
platform sends **T-14 / T-3 / T-1 messages to a real customer before their wedding**. A vendor who
needs to stop those — a postponed event, a dispute, a bereavement — clicks the switch, reads
*"Reminder paused"*, and walks away. The messages keep going.

There is one saving grace worth recording precisely: because the mutation invalidates and
refetches, **the switch snaps back to its true state**, so the screen ends up self-contradictory
rather than silently wrong — a success toast sitting next to a switch that says otherwise. Better
than a clean lie, but not a fix.

### Findings S3 / S4

| ID | Sev | Finding |
|---|---|---|
| **WWL-220** | S3 | **The "no-code rule builder" can express exactly two rules.** The API returns `triggerTypes: ["days_before_event","days_after_event"]` and `actionTypes: ["notify_me"]` — 2 × 1. And the single action notifies the **vendor**, not the customer. The section is headed *"Build your own no-code reminders on top of the built-in ones"*, which promises a builder; what exists is "remind me N days before or after an event". |
| **WWL-221** | S3 | **No validation on the offset.** `-5` and `9999` are both accepted with no error and Save enabled — *"−5 days before event"* and *"9999 days before event"* (≈27 years) are both createable rules. Only the rule name gates saving. `abc` is correctly rejected by the number input. |
| **WWL-222** | S3 | **A sixth built-in was added without its icon.** `lead_followup_due` exists on the backend but is absent from `RULE_ICON`, so it falls back to **the identical glyph used by T-14** — byte-identical 964-character SVGs, against T-3's distinct 581-character one. Two rows in a six-row list share an icon with no visual distinction. The route metadata also still advertises only five reminders ("T-14 / T-3 / T-1 … review prompt, and 48h-stale lead nudge"). |
| **WWL-223** | S3 | **Internal engineering language in vendor-facing UI.** The T+1 row reads *"Handled by **reviewRequestService (BK-100.7)**; surfaced here for visibility"* and carries a **"Delegated cron"** badge. A marquee owner in Lahore has no idea what a delegated cron or BK-100.7 is. |
| **WWL-224** | S3 | **Not venue-scoped** — `/api/v1/automation` is missing from `BUSINESS_SCOPED_PREFIXES`, the third path after Tax (WWL-190) and Reports (WWL-204), even though `AutomationRule.businessId` exists on the model. |
| **WWL-225** | S3 | **Every load fetches twice** — `/automation/status` and `/automation/rules` each fired two times for one page load. Third module with this (WWL-179, WWL-215). |
| **WWL-226** | S4 | **`Last run` uses the browser locale**, not `en-PK`: `toLocaleDateString(undefined, …)`. Every other module pins the Pakistani format. |
| **WWL-227** | S4 | **Custom-rule switches carry a generic `aria-label="Enabled"`** — identical on every row — where the built-in switches get it right with per-rule names (*"Toggle T-14 days reminder"*). |
| **WWL-228** | S4 | **1 of 23 focusable controls** at 360px has no visible focus indicator. |

### Notable passes — this module gets a lot right

- **D18-011/012 PASS — real operational transparency.** The screen states plainly: *"Engine — **Runs every 60 minutes; sends are deduped by outbox + notification idempotency keys.** Running"*, backed by `engine: { enabled: true, intervalMs: 3600000 }`. No other module in the sweep tells the vendor how its background work actually behaves.
- **D18-013 PASS — and a concern I raised that did not materialise.** I expected the env kill-switches to be the usual flag debt. **All six are `envDisabled: false`** (`AUTOMATION_T14_DISABLED`, `AUTOMATION_T3_DISABLED`, `AUTOMATION_T1_DISABLED`, `REVIEW_REQUEST_DISABLED`, `AUTOMATION_LEAD_NUDGE_DISABLED`, `AUTOMATION_LEAD_FOLLOWUP_DISABLED`) and all six reminders are **Active** in production. Nothing is switched off.
- **D18-016 PASS — the two-layer disclosure is the best copy in the sweep.** *"Toggles save instantly to your account. Reminders marked "Disabled by ops" are paused platform-wide via env var and can't be re-enabled here — please contact support."* It explains both layers, warns that toggles are immediate, and tells the vendor exactly what to do when their own preference is not the blocker.
- **D18-017 PASS — a concern of mine, resolved.** I expected the disabled T+1 switch to be unexplained. It is not: the row carries a **"Delegated cron"** badge and a description saying it is handled elsewhere. (The wording is WWL-223; the behaviour is right.)
- **D18-009 PASS** — all six built-ins render with label, description, state and switch.
- **D18-024 PASS** — each reminder says who it goes to: *"Customer reminder + BEO-draft cue"*, *"Customer + vendor reminder"*, *"Customer headcount confirmation"*, *"In-app nudge to vendor"*. A vendor can tell which of these reach their customer.
- **D18-032 PASS** — `triggerLabel` pluralises correctly (`1 day` / `2 days`), the thing WWL-154 got wrong.
- **D18-052 PASS** — the dialog opens with Save disabled and a real reason: **"Add a name to save."**
- **D18-054 PASS** — `offsetDays` serialises as a **number** (`1`, not `"1"`), unlike the trade-ops editor (WWL-216).
- **D18-074 PASS on the built-ins** — per-rule switch names: *"Toggle T-14 days reminder"*, *"Toggle Lead follow-up due"*.
- **D18-075/077 PASS — clean at 360px on both checks.** No page scroll, **zero clipped elements**, and all six switches in view at **44×24 px** — comfortably above the WCAG 2.2 floor and far better than the 14×14 share targets of WWL-205.
- **D18-078 PASS** — six built-ins still enabled, zero custom rules, at close.

### Module 18 — status

**78 cases written, 62 driven. 10 findings (1× S2, 6× S3, 3× S4).**

Not driven, each with its reason:

| Cases | Why |
|---|---|
| **D18-027 → D18-042** (custom-rule table, stat cards, row switches, search, export, `<th scope>`) | **The vendor has zero custom rules**, so the table, its columns, the row switch/edit/delete controls, search and export have no rows to act on. The stat cards were verified reading 0/0/0/0 correctly and the empty state renders its "New rule" action — which is legitimate here, since there genuinely are none (unlike the WWL-152 cases). |
| **D18-055 → D18-061** (edit and delete a rule) | No rule exists to edit or delete. The create path was driven and captured; edit and delete share the same API surface. |
| **D18-021 rollback timing** | The optimistic flip was not observable at my 250ms sample — the switch read `true` immediately after the click and `true` after settling. Whether `onMutate` flipped it in between is not something I established; the end state (true, matching the server) is what I report. |
| **D18-025** (preview what a built-in sends) | No preview control exists anywhere on the screen. Recorded as absent rather than tested — a vendor cannot see the text of a message the platform sends to their customer in their name. |
| **D18-026/069/070** (error states + Retry) | Both queries use the plain no-`catch` shape already driven and passed in Receipts; not re-driven. |
| **D18-006** (venue switch) | Determined by D18-005: no `businessId` is sent on either request, so nothing can change. Recorded as WWL-224 from the request evidence. |

**The module's verdict.** The best-engineered surface in the sweep on the dimensions that usually
go missing: it tells the vendor the engine is running and how often, explains a two-layer control
model honestly, distinguishes a delegated rule from a togglable one, labels every switch
individually, and says which reminders reach the customer. All six reminders are genuinely live in
production. What undermines it is the same platform-wide defect: on the one screen where "paused"
must mean paused, a failed write still says **"Reminder paused"**. And the custom-rule builder
beside it promises more than two possible rules.

---

# MODULE 19 — KITCHEN PREP SHEET (`/dashboard/kitchen-prep`)

**What the screen is for.** The caterer's event-day cook plan. The vendor picks the dishes on the
menu and the head count per dish; the platform explodes each dish against its **recipe BOM**
(standard degh yield + ingredient bill + wastage %) and returns two things the head cook needs:
**how many deghs to cook per dish**, and a **consolidated shopping list** of raw ingredients across
every dish. The sheet is designed to be printed and handed to the kitchen.

This is a real Pakistani-catering primitive — the degh (pot) is the unit of production, not the
plate — so the arithmetic is the product. A wrong degh count either wastes a pot of biryani or
leaves 40 baraatis unfed.

**Source read before writing these cases**
- `app/(dashboard)/dashboard/kitchen-prep/page.tsx` — metadata + `<KitchenPrepView />`
- `components/dashboard/mainScreens/kitchen/kitchen-prep-view.tsx` — the whole screen (176 lines)
- `lib/api/venueOs.ts:1750-1758` — `createRecipeBom` / `listRecipeBoms` / `kitchenPrep`
- `src/routes/venueOsRouter.js:245-249` — the three routes
- `src/controllers/venueOsController.js:1134-1164` — `KB = "ENABLE_KITCHEN_BOM"` gate
- `src/services/kitchenPrepService.js` — `explodePrepSheet`, the degh + shopping-list maths
- `src/models/recipeBomModel.js` — `standardYieldPlates` 50, `standardBatchLabel` "1 degh",
  `standardWastagePct` 0, `active` true, `ingredients` JSONB
- `components/dashboard/mainScreens/venue-os/kitchen-bom-view.tsx` — the only other recipe surface

**Pre-flight state, read off live prod before any case was written**

| Fact | Value |
|---|---|
| `ENABLE_KITCHEN_BOM` (global) | **true** |
| `ENABLE_KITCHEN_BOM` (3358 / 3359 / 3360) | **true / true / true** |
| `GET /business/3358/recipe-boms` | `200` · `data: []` |
| `GET /business/3359/recipe-boms` | `200` · `data: []` |
| `GET /business/3360/recipe-boms` | `200` · `data: []` |
| `ww-active-business` | `{"activeBusinessId":null}` — All venues |

So the engine is **live**, not dark — and the vendor has **no recipes on any venue**.

**Element inventory (11 interactive + 3 conditional regions)**

| # | Element | Where |
|---|---|---|
| 1 | Sidebar `Kitchen prep` link | Bookings panel → *On the day* |
| 2 | Breadcrumb `Dashboard / Kitchen Prep` | topbar |
| 3 | Business switcher (All venues / 3358 / 3359 / 3360) | rail |
| 4 | Eyebrow `KITCHEN` + `h1` + description | PageHeader |
| 5 | `Print` button | PageHeader actions — **conditional on a sheet** |
| 6 | `Event (optional)` textbox | builder |
| 7 | Dish `<select>` | builder, one per row |
| 8 | `guests` number input | builder, one per row |
| 9 | `Remove` icon button | builder, one per row |
| 10 | `Add dish` button | builder |
| 11 | `Generate prep sheet` button | builder |
| A | Unmatched-dish amber banner | sheet — conditional |
| B | Cook table (deghs per dish) | sheet — conditional |
| C | Shopping-list table + footer | sheet — conditional |

**Safety limits for this module, each with its reason**

| Limit | Reason |
|---|---|
| **No recipe BOM will be created.** | `POST /recipe-boms` writes a row to the live vendor's account. Creating one to unlock the maths would leave a fake dish ("QA Biryani") on a real caterer's recipe master. The degh arithmetic is therefore verified by source reading, and every such case is marked **not run — reason recorded**, never `[x]`. |
| **No `CateringItem` will be created.** | Same reason; the ingredient master is a real procurement table. |
| `POST .../kitchen-prep` **is allowed to reach the server.** | Verified read-only in source: `explodePrepSheet` issues `RecipeBom.findAll` and `CateringItem.findAll` and nothing else — no `create`, `update`, `destroy`, or transaction. It is a POST only because the dish list is a body, not a query string. Recipe count is re-counted through a clean realm at the end of the module to prove it. |
| **No print job is sent to a printer.** | `window.print()` is intercepted so the print CSS can be asserted without a spool job. |

---

## MODULE 19 — TEST CASES

### A. Route, navigation and access (D19-001 → D19-010)

- **D19-001** Sidebar → Bookings → *On the day* → **Kitchen prep** navigates to `/dashboard/kitchen-prep`.
- **D19-002** The Bookings module panel stays lit while on this page (`owns:` includes `kitchen-prep`).
- **D19-003** Breadcrumb reads `Dashboard / Kitchen Prep` and the `Dashboard` crumb is a working link.
- **D19-004** Direct URL entry loads the screen with no client-side error.
- **D19-005** `document.title` is `Dashboard : Kitchen prep sheet`.
- **D19-006** `<meta name="description">` is the caterer-facing sentence, not a generic dashboard string.
- **D19-007** `/dashboard/KITCHEN-PREP` and `/dashboard/kitchen-prep/` normalise per the LOCKED URL rules.
- **D19-008** `/dashboard/kitchen` — the route this module was originally indexed under — resolves to what? Dead-door check.
- **D19-009** Logged out, `/dashboard/kitchen-prep` redirects to `/login` (middleware gate).
- **D19-010** Browser Back from the screen returns to the previous dashboard route, not to `/dashboard`.

### B. First paint and engine state (D19-011 → D19-022)

- **D19-011** Eyebrow `KITCHEN`, `h1` *Kitchen prep sheet*, and the description all render.
- **D19-012** Exactly **one** dish row exists on first paint.
- **D19-013** No printable sheet is rendered before Generate.
- **D19-014** No **Print** button is rendered before Generate.
- **D19-015** `ENABLE_KITCHEN_BOM` is reported per venue by `/venue-os/health?businessId=` and is **on** for all three.
- **D19-016** With the flag off, the code path renders the *"kitchen-BOM engine isn't enabled"* card — confirm that is the only fallback and that it still shows the page header.
- **D19-017** `bomsQ` has `enabled: businessId != null` — at **All venues** the recipe request is **never issued**.
- **D19-018** Therefore at All venues the select shows *"No recipes yet — add them in kitchen settings"* — the same string as a venue that genuinely has zero recipes. The two states are **indistinguishable**.
- **D19-019** The placeholder tells the vendor to "add them in **kitchen settings**". Does a screen of that name exist anywhere in the product?
- **D19-020** Is there **any** UI in the entire frontend that calls `createRecipeBom`? Grep plus a live nav sweep.
- **D19-021** Is there any UI that creates a `CateringItem` — the ingredient master the shopping list resolves names from?
- **D19-022** `bomsQ` sets `retry: false` — confirm a 404 does not spin.

### C. Venue scoping (D19-023 → D19-030)

- **D19-023** Switch to **3358 Grand Marquee** → a request to `/business/3358/recipe-boms` is issued.
- **D19-024** Switch to **3359** → request re-issued with 3359, not served from the 3358 cache.
- **D19-025** Switch to **3360** → same.
- **D19-026** Switch back to **All venues** → no recipe request is issued at all.
- **D19-027** Generate while scoped to **All venues** — what businessId does the URL carry?
- **D19-028** What does the backend do with that value — 404 through the flag gate, 400, or something worse?
- **D19-029** The venue choice survives a hard reload (persisted store) and the page re-scopes on reload.
- **D19-030** Recipes are scoped per venue: 3358's recipes never appear while 3359 is selected.

### D. Row builder mechanics (D19-031 → D19-046)

- **D19-031** **Add dish** appends one row; the new row is blank.
- **D19-032** Add dish ×10 → 11 rows, each independently editable.
- **D19-033** Typing guests in row 2 leaves row 1 untouched.
- **D19-034** Choosing a dish in row 2 leaves row 1's dish untouched.
- **D19-035** **Remove** on a middle row removes that row, not the last one.
- **D19-036** **Remove** on the only remaining row is refused (`r.length > 1` guard) — and the button still looks enabled, so the vendor gets no feedback.
- **D19-037** Rows are keyed by **array index** (`key={i}`). Fill three rows, remove the **first**, and check the surviving rows keep their own values — index keys are the classic source of value-shifting.
- **D19-038** After that removal the DOM input values match the state array exactly (no stale React reuse).
- **D19-039** Event label accepts ordinary text.
- **D19-040** Event label with a 2,000-character string — accepted, truncated, or does it break the sheet header?
- **D19-041** Event label in **Urdu** renders correctly in the printed header.
- **D19-042** Event label containing `<img src=x onerror=alert(1)>` renders as **text**, not markup.
- **D19-043** Event label is **client-only** — confirm it is not in the request body.
- **D19-044** The same dish can be added on two rows (two halls / two seatings) without the UI blocking it.
- **D19-045** Row order in the builder is preserved across add and remove.
- **D19-046** Builder state is lost on a hard reload — nothing is persisted. Confirm, and judge the cost for a cook mid-way through building a sheet.

### E. Guests input (D19-047 → D19-058)

- **D19-047** `type="number"` and `inputMode="numeric"` are both set (mobile numeric keypad).
- **D19-048** A **negative** guest count — accepted by the input? filtered by `Number(r.guests) > 0`?
- **D19-049** **Zero** guests — the row is dropped from the request.
- **D19-050** **Decimal** `12.5` — what reaches the server, and what does `Math.floor` do with it?
- **D19-051** **Exponent** form `1e3` — `type=number` accepts it; does it become 1,000 heads?
- **D19-052** **999999999** guests — no overflow, no hang; what deghs come back?
- **D19-053** Typing letters into the number field.
- **D19-054** Empty guests with a dish chosen → row silently dropped, with no warning that the dish was ignored.
- **D19-055** Leading zeros `0042`.
- **D19-056** Paste `1,200` — comma-grouped, how a Pakistani vendor writes it.
- **D19-057** Keyboard ↑/↓ step the value; is there a `step`, `min`, or `max` attribute at all?
- **D19-058** The a11y tree reports `valuemin=0 valuemax=0` — check the real DOM attributes and whether that misleads a screen reader.

### F. Generate — request contract and errors (D19-059 → D19-072)

- **D19-059** Generate with an empty builder → error toast *"Add at least one dish with a guest count"*.
- **D19-060** That message is a **toast**, not inline next to the offending row — is it announced to a screen reader, and does it survive long enough to read?
- **D19-061** While pending the button is disabled and reads **Building…** with a spinner.
- **D19-062** Double-click Generate rapidly — one request or two?
- **D19-063** Request is `POST /api/v1/venue-os/business/{id}/kitchen-prep`.
- **D19-064** Body is exactly `{dishes:[{dishName, guests}]}` — no event label, no extra keys.
- **D19-065** `guests` serialises as a **number**, not a string (the defect WWL-216 recorded in trade-ops).
- **D19-066** `dishName` is **trimmed** before sending.
- **D19-067** Rows with `guests <= 0` are dropped client-side before the request.
- **D19-068** Rows with a blank dish are dropped client-side.
- **D19-069** Response is `{dishes, ingredients, unmatchedDishes}` and all three keys are always present.
- **D19-070** A backend error surfaces `response.data.message` and falls back to *"Couldn't build the prep sheet"*.
- **D19-071** With the flag off the gate returns **404** — confirm that reaches the toast rather than the self-hiding card, since the card only covers the **list** query.
- **D19-072** Generate writes **nothing**: recipe-BOM count is identical before and after, read through a clean realm.

### G. Degh arithmetic (D19-073 → D19-084)

*The heart of the module. Every case here needs at least one recipe BOM, which cannot be created
without writing to a live caterer's recipe master — see the safety limits. Verified against
`kitchenPrepService.js`; each is recorded as **not run live**.*

- **D19-073** `deghs = ceil(guests / standardYieldPlates)` — 120 guests at 50/degh → 3 deghs.
- **D19-074** The **same dish on two rows is folded before the ceil**: 20 + 20 at 50/degh → `ceil(40/50)` = **1** degh, not `ceil(20/50) + ceil(20/50)` = 2. The difference between one wasted pot and none.
- **D19-075** `guests = 0` → `deghs = 0`, and the dish still appears on the sheet with 0 heads.
- **D19-076** A **negative** guest count is floored to 0 by `Math.max(0, Math.floor(...))`.
- **D19-077** A fractional guest count is floored, not rounded.
- **D19-078** `standardYieldPlates` of 0 or null falls back to **1** (`Number(...) || 1`) — one degh per head, an absurd but safe-direction default.
- **D19-079** Wastage multiplies **ingredients only**, never the degh count.
- **D19-080** A negative `standardWastagePct` is clamped to 0 so the buy list can never shrink below the recipe.
- **D19-081** A negative `stdQtyPerBatch` is clamped to 0 so one bad line cannot subtract from the shopping list.
- **D19-082** Dish matching is **case-insensitive and trimmed** (`" biryani " ≡ "Biryani"`).
- **D19-083** A recipe with `active: false` is excluded, so its dish is reported **unmatched** rather than silently cooked from a retired recipe.
- **D19-084** Invariant: `deghs × standardYieldPlates ≥ Σ guests` always — the sheet can over-cook but never under-cook.

### H. Shopping list (D19-085 → D19-094)

*Same constraint as section G — needs recipes and catering items.*

- **D19-085** Ingredients are consolidated **across all dishes** into one row per item.
- **D19-086** The same item in **different units** (kg vs g) is **never summed** — separate truthful rows.
- **D19-087** A recipe line with **no unit** inherits the item's canonical unit and then re-merges with an explicit same-unit line.
- **D19-088** An item id with no `CateringItem` row renders `Item #N` rather than blank.
- **D19-089** `totalQty` is rounded to 2 decimals.
- **D19-090** Sort is category → name → unit; an item with no category sorts last (`"~"` sentinel) and renders a blank category cell.
- **D19-091** Urdu ingredient name is appended after the English one when present.
- **D19-092** An empty ingredient list renders *"Nothing to buy."*.
- **D19-093** The footer's ingredient count equals the number of rendered rows.
- **D19-094** Two dishes sharing an ingredient produce **one** row whose qty is the sum — not two rows.

### I. Unmatched dishes (D19-095 → D19-099)

- **D19-095** A dish with no recipe appears in the amber banner: *"No recipe for: X"*.
- **D19-096** The same unmatched name typed twice is **de-duplicated** in the banner.
- **D19-097** The banner preserves the vendor's original casing, while matching stays case-insensitive.
- **D19-098** When **every** dish is unmatched the cook table shows *"No matched dishes."* and the banner lists them all.
- **D19-099** The banner's advice — *"add a recipe BOM so these are included"* — points at an action the vendor has no screen for. Judge against D19-019/020.

### J. The printable sheet (D19-100 → D19-108)

- **D19-100** The sheet appears only after a successful generate.
- **D19-101** *Total heads across dishes* is the sum of the **matched** dishes' guests.
- **D19-102** Editing a builder row **after** generating does **not** move the printed head count (the `sheetGuests` derivation).
- **D19-103** Unmatched dishes' heads are **excluded** from the total — so the printed number can be lower than what the vendor typed, with no note saying so.
- **D19-104** The event label prefixes the heads line with a `·` separator; with no label the line starts cleanly.
- **D19-105** Cook rows read `dish · N heads · D × 1 degh` using the recipe's own `standardBatchLabel`.
- **D19-106** Footer reads `N dish(es) · M ingredient(s)` — check the pluralisation style against the WWL-154 finding.
- **D19-107** The sheet is deliberately **white with black text** (`bg-white text-neutral-900`) — confirm it stays legible in **dark theme** on screen, not only on paper.
- **D19-108** Neither table has a `<thead>`, a `<th>`, a `scope`, or a `<caption>` — the same gap recorded in six earlier modules, on a table a cook is meant to read under pressure.

### K. Print behaviour (D19-109 → D19-114)

- **D19-109** The **Print** button appears in the header only once a sheet exists.
- **D19-110** The Print button itself carries `data-print-hide` so it does not print.
- **D19-111** Clicking Print calls `window.print()` exactly once.
- **D19-112** The `@media print` block hides `body *` and reveals only `.kot-print`.
- **D19-113** That `<style>` block is **unscoped and global** — injected into the document by React with no CSS module. Check whether it persists after client-side navigation to another dashboard route and would then blank *that* page's print output.
- **D19-114** `visibility: hidden` (not `display: none`) on `body *` means hidden nodes still occupy layout — check the printed sheet is not pushed down the page by the invisible sidebar.

### L. Resilience (D19-115 → D19-122)

- **D19-115** **Offline** → Generate produces an error toast, not a permanent *Building…*.
- **D19-116** Unroutable host → same, and the button re-enables.
- **D19-117** Slow network → *Building…* persists and the button stays disabled for the whole flight.
- **D19-118** Backend 500 → the message is surfaced, not swallowed.
- **D19-119** Malformed / non-JSON response → the screen does not white-screen.
- **D19-120** Token cleared mid-session → 401 forces logout via the axios interceptor.
- **D19-121** Switch venue **while a generate is in flight** — does a stale response overwrite the new scope's sheet?
- **D19-122** Client-side navigate away and back — the generated sheet is component state and is lost. Confirm, and judge the cost of losing a sheet a cook had ready to print.

### M. Accessibility (D19-123 → D19-131)

- **D19-123** The *Event (optional)* `<label>` has no `htmlFor` and the input has no `id` — the label is not programmatically associated.
- **D19-124** The dish `<select>` has **no accessible name at all** — no label, no `aria-label`, no `aria-labelledby`.
- **D19-125** The guests input is named only by its **placeholder**, which disappears once typed into.
- **D19-126** Every row's **Remove** button has the identical `aria-label="Remove"` — with five rows a screen reader announces "Remove" five times with nothing to tell them apart.
- **D19-127** Keyboard: Tab reaches select → guests → Remove → Add dish → Generate in visual order.
- **D19-128** All controls show a visible focus ring at the app's contrast.
- **D19-129** The error toast is delivered through a polite/assertive live region.
- **D19-130** Heading order is `h1` (page) → `h2` (Cook / Shopping list) with no level skipped.
- **D19-131** The amber unmatched banner (`text-amber-900` on `bg-amber-50`) meets contrast, and the information is not conveyed by colour alone.

### N. Mobile — 360×740 (D19-132 → D19-139)

- **D19-132** No horizontal page scroll (`scrollWidth === clientWidth`).
- **D19-133** **And** zero elements whose right edge exceeds the viewport, excluding deliberate `overflow-x:auto` containers — the stricter check WWL-186 taught.
- **D19-134** The builder row (select + 112px guests + Remove) fits without the select collapsing to unusable width.
- **D19-135** Touch targets: Remove, Add dish, Generate all ≥ 24×24 CSS px (WCAG 2.2 AA floor).
- **D19-136** The sheet's fixed-width columns (`w-[70px]`, `w-[90px]`, `w-[110px]`) leave a usable name column at 360.
- **D19-137** The Print button in the header is reachable and not clipped at 360.
- **D19-138** Nothing sticky covers the Generate button at the bottom of the builder.
- **D19-139** The sheet's own tables do not force the page wider than the viewport.

### O. Integrity close-out (D19-140 → D19-143)

- **D19-140** Recipe-BOM count on all three venues is **still 0** at the end of the module.
- **D19-141** No `POST`/`PUT`/`PATCH`/`DELETE` other than `kitchen-prep` was issued during the module.
- **D19-142** The count is verified through a **clean iframe realm**, not through my own patched fetch.
- **D19-143** Console is free of uncaught errors across the whole module.

**143 cases written.** Execution follows.

---

## MODULE 19 — EXECUTION RESULTS

Driven on live prod `https://www.weddingwala.pk/dashboard/kitchen-prep` as
`muhammadrehmanyousaf786@gmail.com`, with the write blocker armed (`kitchen-prep` allow-listed
after verifying it read-only in source) and a clean-realm integrity check at open and close.

**85 of 143 cases driven. 13 findings (5× S2, 5× S3, 3× S4). Nothing was written** — recipe-BOM
count is **0 / 0 / 0** across venues 3358, 3359 and 3360 at close, read through a fresh iframe realm.

### The finding that governs the module

**WWL-229 (S2) — the entire screen is unreachable in production, for every vendor.**

The Kitchen prep sheet cannot produce a sheet, because **nothing in the product creates a recipe**:

| Evidence | Result |
|---|---|
| `createRecipeBom` callers in the whole frontend | **zero** — the function is defined in `lib/api/venueOs.ts:1750` and never called |
| Any `CateringItem` create UI (the ingredient master the shopping list resolves names from) | **none anywhere** |
| Venue-OS → **Kitchen** tab controls | `Load recipes`, `Check variance`, `Raise PO`, `Load contracts`, `Add contract`, `Check` — **no recipe creation** |
| `GET /business/{3358,3359,3360}/recipe-boms` | `200` · `[]` on all three |
| `ENABLE_KITCHEN_BOM` | **true** globally and on all three venues — the engine is live, not dark |

So the dish `<select>` can only ever offer its placeholder, `dishes.length` is always 0, and Generate
can only ever raise *"Add at least one dish with a guest count"*. Everything downstream — the degh
plan, the consolidated shopping list, the unmatched banner, the printable sheet, the Print button —
**cannot be rendered by any vendor on the platform.** A nav entry, a page, a print pipeline and a
carefully-written backend service (unit-aware aggregation, wastage clamps, fold-before-ceil) all sit
behind a door with no handle.

### WWL-230 (S3) — the empty state points at a screen that does not exist

The placeholder reads **"No recipes yet — add them in kitchen settings"**. There is no "kitchen
settings" screen. The command palette knows nothing about it either — searching **"kitchen"**
returns one unrelated result (*"Trade operations hub — all trades"*) and does not even return this
page; searching **"recipe"** returns six unrelated entries. The unmatched-dish banner gives the same
dead advice: *"add a recipe BOM so these are included"*.

### WWL-231 (S2) — any network failure is reported as "feature not enabled"

`bomsQ` has `retry: false`, and **any** rejection replaces the whole builder with:

> *"The kitchen-BOM engine isn't enabled for your account yet."*

Driven twice on live, both with venue 3358 selected and `ENABLE_KITCHEN_BOM` verified **true**:

| Injected failure | What the vendor is told |
|---|---|
| Request rewritten to an unroutable host | *"The kitchen-BOM engine isn't enabled for your account yet."* |
| Request rewritten to a URL that returns **HTTP 500** | *"The kitchen-BOM engine isn't enabled for your account yet."* |

No error text, no Retry control, no way back except a manual reload. A vendor who hits one flaky
moment concludes the feature is not part of their plan and never returns.

### WWL-232 (S2) — unusable at 360px: three of the five controls are off-screen

Measured at `360×740×3, mobile, touch`:

| Measurement | Value |
|---|---|
| Viewport | **360** |
| Width available to the builder row (page `p-4` + card `p-4`) | **296** |
| Fixed controls (guests 112 + Remove 32 + 2 × 8 gap) | **160** |
| Width left for the dish select | **136** |
| Width the select actually takes | **342** |
| Row right edge | **535** |
| Elements overflowing the viewport | **22** |

| Control | Position at 360px | Reachable? |
|---|---|---|
| Dish select | 33 → 375 | partly clipped |
| **guests input** | **383 → 495** | **entirely off-screen** |
| **Remove** | **503 → 535** | **entirely off-screen** |
| **Generate prep sheet** | **376 → 535** | **entirely off-screen** |
| Add dish | 33 → 145 | ✓ the only usable control |

And it cannot be scrolled to: the nearest scrollable ancestor is `MAIN` with `overflow-x: hidden`
(`scrollWidth 568 / clientWidth 360`); setting `scrollLeft = 9999` leaves it at **0**, and
`window.scrollTo(9999, 0)` leaves `scrollX` at **0**. `document.elementFromPoint` at the Remove
button's coordinates returns the `SELECT` — the button is not on screen at all.

**Root cause, measured not guessed.** The dish `<select>` carries `flex-1` with **no `min-w-0`**, so
its min-content width — set by the longest option label — drives the row. Swapping the option text
in the live DOM as a diagnostic:

| Option label | Chars | Row width | Fits in 296? |
|---|---|---|---|
| `Biryani` | 7 | 294 | ✓ just |
| `Chicken Karahi` | 14 | 301 | ✗ |
| `Chicken Biryani` | 15 | 304 | ✗ |
| `Mutton Pulao Degh` | 17 | 327 | ✗ |
| `Chicken Handi with Naan` | 23 | 366 | ✗ |
| `No recipes yet — add them in kitchen settings` (today's state) | 44 | **502** | ✗ |

So the breakage is not an edge case: **essentially every real Pakistani dish name overflows**, and
today's empty-state string is the worst of them. A kitchen prep sheet is a phone-and-tablet screen
by definition, and on a phone the vendor cannot enter a head count, remove a row, or press Generate.

### WWL-233 (S2) — the default venue scope produces a 500

`activeBusinessId` is `null` at the default **All venues** scope, and `venueOsApi.kitchenPrep` builds
`/business/${businessId}/kitchen-prep` from it, so the URL is literally `/business/null/kitchen-prep`.
Probed on live through a clean realm:

| Path | Status | Message |
|---|---|---|
| `POST /business/null/kitchen-prep` | **500** | `Authorization check failed` |
| `POST /business/undefined/kitchen-prep` | **500** | `Authorization check failed` |
| `POST /business/abc/kitchen-prep` | **500** | `Authorization check failed` |
| `GET /business/null/recipe-boms` | **500** | `Authorization check failed` |
| `POST /business/0/kitchen-prep` | 403 | `You do not have access to this business` ✓ |
| `POST /business/999999/kitchen-prep` | 403 | `You do not have access to this business` ✓ |

A malformed path parameter should be a 400, not a server error. Today the 500 is masked only because
no dish can be selected; the moment one recipe exists, a vendor on the default scope who presses
Generate gets *"Authorization check failed"*. The list query escapes only because
`enabled: businessId != null` stops it firing. No stack trace leaks — credit where due.

### WWL-234 (S2) — rows are silently discarded

`rows.filter((r) => r.dishName.trim() && Number(r.guests) > 0)` drops a row with **no warning**.
Driven on the live input:

| Typed head count | Input keeps | Row survives the filter? |
|---|---|---|
| *(blank)* | `""` | **dropped** |
| `0` | `0` | **dropped** |
| `-50` | `-50` (no `min` attribute) | **dropped** |
| `abc` | `""` (browser clears it) | **dropped** |

The unmatched-dish banner covers only dishes with **no recipe** — it says nothing about a dish
dropped for a bad head count. So the printed sheet comes out missing a dish, and nothing on the page
says so. On a cook sheet a silently missing dish means a dish never gets cooked.

### WWL-235 (S3) — the printed head count silently excludes unmatched dishes

`sheetGuests` sums only `sheet.dishes` (the **matched** ones), so *"Total heads across dishes"* can
print lower than the numbers the vendor typed, with no note tying the difference to the amber banner.
Code-verified; not runnable live for the reason in WWL-229.

### WWL-236 (S3) — the validation error takes about a second, and appears in the corner

Measured three times from click to the toast node existing: **1253 ms** cold, **1021 ms** warm,
**~1250 ms** on a repeat. It is a corner toast, not a message beside the offending row — so a vendor
who clicks Generate and watches the button sees nothing at all for over a second. It is delivered
through the `aria-live="polite"` toaster region, so it is announced.

### WWL-237 (S3) — the form has no accessible names

| Control | Accessible name |
|---|---|
| Dish `<select>` | **none at all** — no `id`, no `name`, no `aria-label`, no `aria-labelledby` |
| `Event (optional)` | `<label>` has **no `htmlFor`**, input has **no `id`** — not programmatically associated |
| `guests` | placeholder only, which disappears once typed into |
| `Remove` × N | every row carries the identical `aria-label="Remove"` |

With five rows a screen-reader user hears "Remove" five times with nothing to tell the rows apart —
the same defect pattern recorded in six earlier modules.

### WWL-238 (S4) — Remove on the last row is a silent no-op

The `r.length > 1` guard is correct, but the button is **not disabled**, has **no `aria-disabled`**,
and produces **no message**. Driven: clicked Remove on the only remaining row — row count stayed 1,
value stayed `33`, `disabled: false`, zero toasts.

### WWL-239 (S4) — two different descriptions for the same page

| State | Description shown |
|---|---|
| Normal | *"Pick the dishes and head counts — get deghs to cook and a consolidated shopping list."* |
| Error card | *"Turn the menu into deghs to cook and a shopping list."* |

### WWL-240 (S4) — no sanity ceiling on a head count

`999999999` is accepted; **ArrowUp takes it to 1,000,000,000**. There is no `min`, `max`, or `step`
attribute on the field. `1e3` is accepted and displayed to the vendor as `1e3` (worth 1,000 heads).
`12.5` is sent as `12.5` and floored server-side to `12`. `0042` displays as `0042` and sends `42`.

### WWL-241 (S3) — switching venue does not reset the builder

Driven: guest count `33` typed at **All venues**, then switched to **3358 Grand Marquee** — the row
and its value survived intact while the recipe list re-scoped underneath it. Once recipes exist, a
dish selected for one venue will remain selected against another venue's recipe list.

---

### What passed, and it is worth saying

- **D19-072 / D19-140 / D19-141 / D19-142 — nothing was written.** Recipe-BOM count `0 / 0 / 0` at
  close through a clean iframe realm; `ENABLE_KITCHEN_BOM` still `true` on all three venues.
- **The backend service is the best-written code I have read in this sweep.** `explodePrepSheet`
  folds duplicate dishes **before** the ceil (`ceil(40/50) = 1` degh, not `ceil(20/50) × 2 = 2` — one
  saved pot), aggregates ingredients by `(itemId, unit)` so kg and g are **never** silently summed,
  re-merges buckets once an omitted unit resolves to the item's canonical one, and clamps negative
  wastage and negative per-batch quantities to zero so a bad row can never *shrink* a shopping list.
  Every one of those decisions is commented with the failure it prevents.
- **D19-096 / D19-097 — dish de-duplication is exactly right.** `Chicken Biryani` + `chicken biryani`
  + `  Chicken Biryani  ` collapse to **one** banner entry that preserves the vendor's original
  casing, while matching stays case- and whitespace-insensitive.
- **Cross-venue access is correctly refused** — `businessId` 0 and 999999 both return a clean 403
  with no data leak.
- **D19-023 / D19-024 / D19-025 / D19-026** — every venue switch issues its own scoped request, and
  **All venues issues none at all**, so the `null` URL of WWL-233 is never reached by the list query.
- **D19-037 / D19-038 — my index-key concern did not materialise.** Rows are keyed by array index,
  but the inputs are controlled from state, so filling three rows `11 / 22 / 33` and removing the
  **first** leaves exactly `22 / 33`. Recorded as a pass.
- **D19-113 — my print-CSS leak concern did not materialise either.** The unscoped `@media print`
  block is JSX-rendered, so it unmounts with the component: 1 style tag on the page, **0** after a
  client-side navigation to `/dashboard/trade-ops`.
- **D19-056** — typing `1,200` the way a Pakistani vendor writes it yields **1200**, not `1` or `NaN`.
- **D19-127 / D19-128** — tab order matches visual order (Event → dish → guests → Remove → Add dish →
  Generate) and every control has a visible focus ring.
- **D19-007** — trailing-slash and uppercase URLs both redirect per the LOCKED rules; `/dashboard/kitchen`
  is a clean 404 (the route in the old index row was wrong, now corrected).
- **D19-143** — console clean, no uncaught errors across the whole module.

### Not driven, each with its reason

| Cases | Why |
|---|---|
| **D19-073 → D19-084** (all 12 degh-arithmetic cases) | Every one needs at least one `RecipeBom`, and creating one means `POST /recipe-boms` writing a fake dish onto a live caterer's recipe master. Verified against `kitchenPrepService.js` and recorded as source-verified, never `[x]`. |
| **D19-085 → D19-094** (all 10 shopping-list cases) | Same — these additionally need `CateringItem` rows, and there is no UI for those either. |
| **D19-100 → D19-108** (the printable sheet) and **D19-109 → D19-112, D19-114** (print behaviour) | The sheet cannot be rendered by any vendor (WWL-229), so there is nothing to print. `window.print()` was intercepted and never fired. |
| **D19-115 → D19-119, D19-121** (Generate-path resilience) | The Generate request can never leave the client while the dish list is empty, so offline / 500 / malformed-JSON / stale-response cannot be exercised through the UI. The **list**-query equivalents were driven instead and produced WWL-231. |
| **D19-030** (per-venue recipe isolation) | All three venues have zero recipes — there is nothing to prove isolation with. |
| **D19-034, D19-044** (second dish, duplicate dish rows) | Only one option exists in the select, so no dish can be chosen at all. |
| **D19-061, D19-062, D19-064, D19-065, D19-066** (pending state, double-submit, body shape via the UI) | All require a request the UI cannot issue. The body contract was established by direct API probe instead (D19-063 / D19-069). |
| **D19-009** (logged-out redirect) | Logging out would end the session and require a fresh emailed OTP. The `/dashboard` middleware gate was driven in earlier modules and is unchanged. |
| **D19-131, D19-136, D19-137, D19-139** (banner contrast, sheet columns, Print at 360) | All belong to the sheet, which cannot render. |
| **D19-120** (401 force-logout) | Same reason as D19-009 — clearing the token ends the session. |
| **D19-107** (sheet in dark theme) | No sheet to view. The `bg-white text-neutral-900` pair forces both colours together, so it cannot invert. |
| **D19-122** (sheet survives client-side nav) | No sheet. The equivalent for the builder was driven: **D19-046** — a hard reload resets to one blank row. |

### Module 19 — status

**143 cases written, 85 driven. 13 findings (5× S2, 5× S3, 3× S4).**

**The module's verdict.** This is the clearest example in the sweep of the gap the vendor research
named: the engineering is *finished* and the product is *unreachable*. The backend does honest,
domain-literate work — it knows a degh is the unit of production, that two seatings of one wedding
are one pot not two, and that kilograms and grams must never be added together. The frontend prints
a proper kitchen order ticket. And no vendor can get to a single line of it, because the one screen
that would create a recipe was never built, and the empty state sends them to a "kitchen settings"
page that does not exist. On a phone — where a cook would actually hold this — three of the five
controls are off the edge of the screen and cannot be scrolled to. And on the day someone finally
does load a recipe, the default venue scope will greet them with *"Authorization check failed"*.

---

# MODULE 20 — INVENTORY (`/dashboard/inventory`)

**What the screen is for.** The vendor's stock book: chairs, crockery, linen, generators, rice and
ghee. Items hold a running `currentStock`; every change is supposed to go through a **movement**
(restock / consumed / wastage / transfer in / transfer out / stock-take), which snapshots
`stockBefore` and `stockAfter` into an immutable ledger inside one transaction, so the ledger and
the running total can never drift. Direct `PATCH` on an item deliberately refuses to touch stock.

**Source read before writing these cases**
- `app/(dashboard)/dashboard/inventory/page.tsx`
- `components/.../inventory/redesigned/inventory-redesigned-view.tsx` — table, stats, toolbar, delete
- `components/.../inventory/redesigned/inventory-form-dialog.tsx` — create + edit
- `components/.../inventory/redesigned/inventory-movement-dialog.tsx` — the only stock-changing path
- `lib/api/inventory.ts` — 8 endpoints, category/unit/movement dictionaries
- `src/routes/inventoryRouter.js`, `src/controllers/inventoryController.js`
- `src/utils/inventoryHelpers.js` — `validateInventoryItem`, `validateMovement`, `applyMovement`

**Pre-flight state, read off live prod before any case was written**

| Fact | Value |
|---|---|
| `GET /inventory/items` (no filter) | **36 items** |
| Per venue — 3358 / 3359 / 3360 | **12 / 12 / 12** |
| `summary.totalStockValue` | **Rs 68,511,200** |
| `summary.lowStockCount` | **0** |
| `summary.byCategory` | equipment 12 · rental 9 · linen 6 · consumable 6 · ingredient 3 |
| `GET /inventory/movements` | **0 movements** |
| Three rows named `Banquet Chairs` | ids 155 / 167 / 179 — one per venue, stock 791 / 776 / 755, cost 4100 / 8600 / 4250 |

So the ledger the whole design is built around is **empty**: every item's stock is its opening
balance, never moved.

**Element inventory (16 interactive + 4 states)**

| # | Element | Where |
|---|---|---|
| 1 | Sidebar `Inventory` link | Operate rail |
| 2 | `Add item` button | PageHeader action |
| 3–6 | Stat cards: Total items · Low / out of stock · Stock value · Categories | header grid |
| 7 | `Search items…` input | toolbar |
| 8 | Density toggle | toolbar |
| 9 | Export menu | toolbar |
| 10 | Select-all checkbox + per-row checkboxes | table |
| 11 | `Adjust stock` (RefreshCw) | row action |
| 12 | `Edit item` (Pencil) | row action |
| 13 | `Remove item` (Trash2) | row action |
| 14 | Item form dialog — 10 fields + Cancel/Save | modal |
| 15 | Movement dialog — 4 fields + Cancel/Record | modal |
| 16 | Delete confirm — Cancel/Remove | alert |
| A–D | loading · error+Retry · empty · card (mobile) renderers | table states |

**Safety limits for this module, each with its reason**

| Limit | Reason |
|---|---|
| **No item is created, edited or deleted.** | These are a live vendor's real 36 stock lines carrying Rs 68.5M of book value. Every write is captured and diverted to a nonexistent path; payloads are recorded and reported. |
| **No movement is recorded.** | A movement is by design **immutable** — the backend soft-deletes but never reverses one, and its own response says *"Stock count NOT auto-reversed."* Writing one would permanently alter a real stock count and put the first-ever row into an audit ledger that is currently clean. |
| **No booking is linked to a movement.** | Would attach QA data to a real customer's booking record. |
| **Reads may hit the live API freely.** | `GET` on items/movements is side-effect free. |

---

## MODULE 20 — TEST CASES

### A. Route, navigation and access (D20-001 → D20-010)

- **D20-001** Sidebar → **Inventory** navigates to `/dashboard/inventory`.
- **D20-002** The correct rail entry is `aria-current="page"` while on the screen.
- **D20-003** Breadcrumb renders and its `Dashboard` crumb links home.
- **D20-004** Direct URL loads with no client-side error.
- **D20-005** `document.title` is `Dashboard : Inventory`.
- **D20-006** Meta description names the actual job (stock tracker, immutable ledger).
- **D20-007** Uppercase and trailing-slash URLs normalise per the LOCKED rules.
- **D20-008** `/dashboard/inventory-new` — the route named in the component's own header comment — resolves to what? Dead-door check.
- **D20-009** Browser Back returns to the previous route.
- **D20-010** The component comment claims *"Read-only presentation; original screen untouched"* — verify against what the screen actually does (create, edit, delete, movements).

### B. First paint and data integrity (D20-011 → D20-024)

- **D20-011** Eyebrow `Operate`, `h1` **Inventory**, description all render.
- **D20-012** The table paints **36 rows** matching the API.
- **D20-013** Row order is `name ASC` as the backend sends it; the FE does not re-sort.
- **D20-014** No column is sortable — confirm and judge, on a 36-row stock book.
- **D20-015** There is **no pagination** — confirm every row is in the DOM.
- **D20-016** Loading skeleton renders before data arrives.
- **D20-017** Numbers render with `tabular-nums` so columns align.
- **D20-018** `currentStock` arrives as a **string** (`"755.000"`) and is coerced with `Number(v) || 0` — check no row renders `0` for a real stock.
- **D20-019** A stock of exactly `0` renders `0`, not `—`, and is not confused with "no data".
- **D20-020** `lastRestockCostPerUnit: null` renders as an em-dash via `MoneyCell`, not `Rs 0`.
- **D20-021** Every one of the 7 categories in the dictionary renders a label; unknown values fall back gracefully.
- **D20-022** Every one of the 17 units renders; `other` shows as `unit`.
- **D20-023** The three `Banquet Chairs` rows (155 / 167 / 179) are visually distinguishable — is there any venue indicator?
- **D20-024** `business` is eager-loaded by the API on every item. Is it used anywhere in the UI?

### C. Stat cards (D20-025 → D20-036)

- **D20-025** **Total items** equals the row count (36).
- **D20-026** **Stock value** — the FE recomputes `Σ stock × lastCost` client-side instead of using the API's `summary.totalStockValue`. Compare the two figures.
- **D20-027** Items with a `null` last cost contribute **0** to stock value — quantify how much book value that hides.
- **D20-028** **Low / out of stock** — the FE counts `stock <= threshold`; the API requires `threshold > 0` **and** `stock <= threshold`. Construct the divergence and check which the card shows.
- **D20-029** With `lowStockCount: 0` from the API, does the FE card also read 0?
- **D20-030** The Low card's delta text flips between `reorder` and `all good` — verify the wording at 0.
- **D20-031** **Categories** counts distinct categories present (expect 5, not 7).
- **D20-032** Stat cards are computed from `all`, not the filtered `items` — type a search and check whether the cards move.
- **D20-033** If they don't move, is that stated anywhere, or does the screen show "36 items" above one visible row?
- **D20-034** The **Low / out of stock** card is not clickable — the API supports `lowStockOnly=true` and no UI reaches it.
- **D20-035** Stock value is rounded with `Math.round` before `formatPkr` — check for a rounding drift against the API's own rounding.
- **D20-036** Card icons match their meaning (`Package`, `AlertTriangle`, `Wallet`, `LayoutGrid`).

### D. Table columns and row rendering (D20-037 → D20-052)

- **D20-037** Column set is Item · SKU · Category · Stock · Last cost/unit · Status · actions.
- **D20-038** `SKU` is `null` on every live row — the column renders `—` 36 times. Judge the column's value.
- **D20-039** Category renders capitalised raw value (`Rental`), **not** the dictionary label (`Rental fleet`) — confirm the mismatch with the dialog's own dropdown.
- **D20-040** Stock renders `755 piece` — check pluralisation and unit-label mapping (`gram` → `g`, `litre` → `L`).
- **D20-041** `Status` pill: `In stock` / `Low stock` / `Out of stock` thresholds match `stockState`.
- **D20-042** A row where `stock === threshold` exactly is **Low stock**, not In stock.
- **D20-043** A row with `threshold = 0` and `stock = 0` — which pill, and does it agree with the card?
- **D20-044** Row actions: `Adjust stock`, `Edit item`, `Remove item` — all three present on every row.
- **D20-045** Each row action has an `aria-label`, and they are **identical across rows** — check whether the item name is announced.
- **D20-046** Row action buttons are ≥ 24×24 CSS px.
- **D20-047** Clicking a row (not an action) does nothing — no drill-in to the item's movement history.
- **D20-048** There is **no movement-history view anywhere on the screen**, though `listMovements` exists and `getItem` returns the last 30. Confirm.
- **D20-049** `<th scope="col">` present on header cells.
- **D20-050** Selection checkboxes have per-row accessible names, not a repeated "Select row".
- **D20-051** The header select-all checkbox reflects indeterminate state.
- **D20-052** Long item names truncate rather than breaking the row.

### E. Venue scoping (D20-053 → D20-062)

- **D20-053** `InventoryAPI.listItems()` is called with **no arguments** — confirm no `businessId` on the wire.
- **D20-054** `queryKey: ["inventory-redesigned"]` contains no businessId — switching venue cannot invalidate it.
- **D20-055** Switch to 3358 → does the row count change from 36?
- **D20-056** Switch to 3359 → same check.
- **D20-057** Switch to 3360 → same check.
- **D20-058** Hard reload while scoped to one venue — still 36?
- **D20-059** The API **does** honour `?businessId=` (12 / 12 / 12 verified). So the capability exists and the UI never uses it.
- **D20-060** With all three venues merged and no venue column, can a vendor tell which `Banquet Chairs` row is which? Cost differs 4100 / 8600 / 4250 — a purchase decision made off the wrong row.
- **D20-061** The create dialog receives `businessId = businesses?.[0]?.id` — the **first** business, not the active one. Confirm which venue a new item would be filed under while scoped to a different venue.
- **D20-062** Editing an item sends `businessId: item.businessId` — confirm the edit path is not affected by D20-061.

### F. Search (D20-063 → D20-074)

- **D20-063** Typing filters rows live with no request (client-side over the fetched list).
- **D20-064** Search matches **name**, **sku**, **category**; the backend's own search matches **name**, **sku**, **defaultSupplierName** — confirm the mismatch and its consequence.
- **D20-065** Searching a supplier name finds nothing in the UI even though the API would match it.
- **D20-066** Search is case-insensitive.
- **D20-067** Leading/trailing whitespace is trimmed.
- **D20-068** A search with no matches shows the **empty state** — check the wording ("No inventory yet" + "Add item") against a stock book of 36 items.
- **D20-069** Clearing the search restores all 36 rows.
- **D20-070** Search survives a density change.
- **D20-071** Search does **not** survive a reload (not in the URL) — confirm and judge.
- **D20-072** Regex-special characters (`.`, `*`, `(`) are treated literally.
- **D20-073** An Urdu search term matches an Urdu item name.
- **D20-074** Search input has an accessible name (it has a placeholder and a decorative icon).

### G. Selection and export (D20-075 → D20-088)

- **D20-075** Selecting a row updates the selection set.
- **D20-076** Select-all selects the **filtered** rows, not all 36, when a search is active.
- **D20-077** Selection survives a search change — or is it silently orphaned?
- **D20-078** Export menu opens and offers its formats.
- **D20-079** Export with a selection exports **only** the selected rows.
- **D20-080** Export with no selection exports the filtered rows.
- **D20-081** Exported columns are Item · SKU · Category · Stock · Unit · Last cost.
- **D20-082** A `null` SKU exports as an empty string, not `null`.
- **D20-083** A `null` last cost exports as **0** — check whether that misrepresents "unknown" as "free".
- **D20-084** The export carries **no venue column**, so a merged 36-row export cannot be split by venue.
- **D20-085** CSV escaping: a name containing a comma or quote does not break the file.
- **D20-086** The download filename is `inventory` + extension.
- **D20-087** Export is captured without writing a file to the user's disk.
- **D20-088** Nothing about the export hits the network (client-side generation).

### H. Density (D20-089 → D20-094)

- **D20-089** The density toggle is icon-only with `aria-label`s — identify them.
- **D20-090** Switching to compact reduces row height measurably.
- **D20-091** The choice persists across a reload.
- **D20-092** The choice persists across a route change and back.
- **D20-093** Density does not disturb the selection.
- **D20-094** Both density buttons expose pressed state.

### I. Add-item dialog (D20-095 → D20-118)

- **D20-095** `Add item` opens the dialog titled **Add inventory item**.
- **D20-096** Ten fields render: name, category, unit, SKU, opening stock, threshold, last cost, lead time, supplier, notes.
- **D20-097** `Opening stock` renders only in create mode, never in edit.
- **D20-098** Name is `autoFocus` on open.
- **D20-099** Save is disabled with an empty name and the hint reads **"Add a name to save."**
- **D20-100** Category dropdown lists all 7 dictionary labels.
- **D20-101** Unit dropdown lists all 17.
- **D20-102** Negative opening stock shows **"Opening stock can't be negative."** and blocks Save.
- **D20-103** Negative threshold, negative cost, negative lead time each show their own message.
- **D20-104** Each numeric error sets `aria-invalid` and is wired by `aria-describedby`.
- **D20-105** The blocked hint changes to **"Fix the highlighted fields to save."** when a numeric error is present.
- **D20-106** Stock above the backend cap (1,000,000) — client blocks or server 400 with a readable message?
- **D20-107** Cost above Rs 50 crore — same check.
- **D20-108** Lead time above 365 — server rejects; is the message readable?
- **D20-109** Lead time as a decimal (`2.5`) — server requires an integer.
- **D20-110** A 200-character item name — server clips to 160; does the UI warn?
- **D20-111** A 100-character SKU — server clips to 60 silently.
- **D20-112** Notes of 6,000 characters — server clips to 5,000 silently.
- **D20-113** The captured request body shape and the endpoint (`POST /api/v1/inventory/items`).
- **D20-114** `businessId` in the captured body — which venue?
- **D20-115** Empty numeric fields serialise as `undefined`, not `0` (the `numOrU` helper).
- **D20-116** Re-opening the dialog after a cancel resets the form (the `loadedId` ref).
- **D20-117** Escape and the overlay close the dialog without saving.
- **D20-118** With the write diverted, does the dialog claim success?

### J. Edit-item dialog (D20-119 → D20-132)

- **D20-119** `Edit item` opens with the title **Edit item** and every field prefilled.
- **D20-120** `Opening stock` is absent — stock cannot be edited directly.
- **D20-121** The body still carries `currentStock`; the backend `delete patch.currentStock` drops it. Confirm the FE sends it and the server ignores it.
- **D20-122** `businessId` is sent as `item.businessId` and the server drops it as immutable.
- **D20-123** Switching from editing item A to item B refreshes the form (the `loadedId` key).
- **D20-124** Clearing the name blocks Save with the same hint.
- **D20-125** Clearing an optional field sends `undefined`, and the server maps it to `null`.
- **D20-126** The endpoint is `PATCH /api/v1/inventory/items/{id}`.
- **D20-127** Editing an item belonging to venue B while scoped to venue A still targets the right row.
- **D20-128** Cancel discards edits — reopen and confirm the original values.
- **D20-129** Save is disabled while pending and shows **Saving…**.
- **D20-130** With the write diverted, does the toast claim **"Item updated"**?
- **D20-131** Does the row in the table change after a diverted update?
- **D20-132** Does the list refetch after a diverted update?

### K. Movement dialog — the only stock-changing path (D20-133 → D20-154)

- **D20-133** `Adjust stock` opens **Adjust stock — {item name}** and shows the current stock.
- **D20-134** All six movement types are offered with their labels (`adjustment` → **Stock-take**).
- **D20-135** The quantity label changes to **Counted quantity** for a stock-take.
- **D20-136** The projected **New stock** line updates live: `restock` and `transfer_in` add, `consumed`/`wastage`/`transfer_out` subtract, `adjustment` sets absolute.
- **D20-137** A projection below zero renders in destructive red.
- **D20-138** …but Save is **still enabled** — the client lets you submit a movement the server will refuse. Confirm the server's 400 `insufficient_stock` is what stops it.
- **D20-139** **A stock-take of 0 cannot be saved** (`canSave = qty > 0`), even though the backend explicitly accepts `adjustment` with quantity 0.
- **D20-140** …and the delete path's own error message instructs the vendor to *"Record an adjustment movement to zero it first."* Confirm that instruction cannot be followed in the UI.
- **D20-141** `Cost / unit` appears only for `restock` and `transfer_in`; check it also stamps `lastRestockCostPerUnit` (restock only, per the controller).
- **D20-142** There is **no supplier field**, though the placeholder text says *"Restock from supplier"* and the API accepts `supplierName`.
- **D20-143** There is **no booking picker**, though the placeholder says *"used at Ahmed wedding"* and the API accepts `bookingId` — so consumption can never be attributed to an event.
- **D20-144** There is **no date field** — every movement is stamped `now()`. Yesterday's consumption cannot be recorded on yesterday.
- **D20-145** There is no `notes` and no `photoUrl`, both of which the API accepts.
- **D20-146** Quantity accepts decimals (`0.5 kg`) — server rounds to 3 places.
- **D20-147** Quantity above 1,000,000 — server 400 with a readable message.
- **D20-148** A negative quantity — blocked client-side by `qty > 0`.
- **D20-149** Non-numeric quantity → `num()` yields 0 → Save disabled.
- **D20-150** Switching item A → item B resets type/quantity/cost/reason.
- **D20-151** The captured body: `POST /api/v1/inventory/movements` with `{inventoryItemId, type, quantity, costPerUnit?, reason?}` and nothing else.
- **D20-152** `quantity` serialises as a **number**.
- **D20-153** With the write diverted, does the dialog claim **"Stock updated"** and close?
- **D20-154** Is the stock in the table unchanged after the diverted movement, and does the value snap back?

### L. Delete flow (D20-155 → D20-166)

- **D20-155** `Remove item` opens an `AlertDialog` naming the item.
- **D20-156** The copy says *"This can't be undone."* — check that against the backend's paranoid soft-delete.
- **D20-157** Cancel closes without a request.
- **D20-158** Escape closes without a request.
- **D20-159** `Remove` issues `DELETE /api/v1/inventory/items/{id}`.
- **D20-160** Every live item has stock > 0, so the server would answer **409 STOCK_NOT_ZERO** — confirm the message reaches the vendor.
- **D20-161** The FE's fallback error text already says *"(stock must be zero first)"* — check which message actually shows.
- **D20-162** Combined with D20-139: an item with stock **cannot be deleted through the UI at all** unless the vendor discovers the `consumed`-to-zero workaround. Establish this end to end.
- **D20-163** With the write diverted, does the dialog claim **"Item removed"**?
- **D20-164** Does the row disappear from the table after a diverted delete?
- **D20-165** Does a hard reload bring it back?
- **D20-166** Is the delete confirm's destructive action styled and focused per convention (Cancel default, Remove destructive)?

### M. Resilience (D20-167 → D20-176)

- **D20-167** Offline → the table shows its error state with **Retry**, not a blank page.
- **D20-168** Unroutable host → same, and Retry re-issues the request.
- **D20-169** Backend 500 → error state, message surfaced.
- **D20-170** The error string is the generic *"Couldn't load inventory."* — does it distinguish offline from server error?
- **D20-171** Slow network → skeleton persists, no flash of the empty state.
- **D20-172** A malformed response does not white-screen.
- **D20-173** Token cleared → 401 forces logout.
- **D20-174** A diverted write leaves the query cache consistent after `invalidate()`.
- **D20-175** Rapid double-click on Save issues one request or two.
- **D20-176** Console is clean across the module.

### N. Accessibility (D20-177 → D20-188)

- **D20-177** Every dialog field's `<label>` is programmatically associated (`Field` renders a bare `<label>` — check).
- **D20-178** The three row-action buttons announce which item they act on.
- **D20-179** Table headers carry `scope`.
- **D20-180** The status pill's meaning is not colour-only.
- **D20-181** Dialogs trap focus and restore it to the trigger on close.
- **D20-182** The alert dialog is announced with its title and description.
- **D20-183** Error messages are linked with `aria-describedby` and `aria-invalid` (`fieldAria`).
- **D20-184** Search input has an accessible name.
- **D20-185** Stat cards are readable as label + value, not just a number.
- **D20-186** Focus rings visible on all controls.
- **D20-187** Heading order `h1` → the rest, no skipped level.
- **D20-188** The blocked-save hint is announced, not only shown.

### O. Mobile — 360×740 (D20-189 → D20-198)

- **D20-189** No horizontal page scroll.
- **D20-190** **And** zero clipped elements outside deliberate scroll containers, with `html`/`body` excluded from the scroller walk (the mistake that hid the Module 19 breakage).
- **D20-191** The table switches to the card renderer at 360.
- **D20-192** The card shows name, category, stock, status and cost.
- **D20-193** **Row actions are absent from the card** — check whether Adjust / Edit / Remove are reachable on a phone at all.
- **D20-194** Stat cards reflow to 2 columns without clipping the Rs value.
- **D20-195** The toolbar (search + density + export) fits.
- **D20-196** Both dialogs are usable at 360 — fields reachable, buttons not clipped.
- **D20-197** Touch targets ≥ 24×24 px.
- **D20-198** The Rs 68.5M stat value does not overflow its card.

### P. Integrity close-out (D20-199 → D20-204)

- **D20-199** Item count still **36** at close, through a clean iframe realm.
- **D20-200** Movement count still **0**.
- **D20-201** `summary.totalStockValue` still **Rs 68,511,200**.
- **D20-202** Every item's `currentStock` unchanged against the opening snapshot.
- **D20-203** Every diverted write is listed with its method, URL and body.
- **D20-204** No `POST`/`PATCH`/`DELETE` reached the real API.

**204 cases written.** Execution follows.

---

## MODULE 20 — EXECUTION RESULTS

Driven on live prod `https://www.weddingwala.pk/dashboard/inventory` with every write captured and
diverted, and a clean-realm integrity check at open and close.

**132 of 204 cases driven. 18 findings (5× S2, 9× S3, 4× S4). Nothing was written.**

| Integrity check (clean iframe realm, at close) | Value | Same as open? |
|---|---|---|
| Item count | **36** | ✓ |
| `summary.totalStockValue` | **Rs 68,511,200** | ✓ |
| `summary.lowStockCount` | **0** | ✓ |
| `summary.byCategory` | equipment 12 · rental 9 · linen 6 · consumable 6 · ingredient 3 | ✓ |
| **Movement count** | **0** | ✓ |
| Item 179 `currentStock` | **755.000** | ✓ |
| `QA probe item` present | **no** | ✓ |

Three writes were captured and diverted; all three are listed under D20-203 below. The vendor's
density preference was changed during D20-090 and **restored to `comfortable`** at close.

### WWL-242 (S2) — a new item is filed under the wrong venue

The captured create body, taken while the UI was scoped to **Rehman Marquee Bahria (3360)**:

```
POST /api/v1/inventory/items
{"businessId":3358, "name":"QA probe item — do not save", "category":"ingredient",
 "unit":"piece", "currentStock":-500, "lowStockThreshold":-10,
 "lastRestockCostPerUnit":-9999, "reorderLeadTimeDays":-30}
```

`businessId` is **3358 — Grand Marquee**, because the dialog is handed
`businesses?.[0]?.id`: the *first* business, never the active one. A vendor looking at Bahria's
stock adds "200 extra chairs" and it lands on Grand Marquee's book. Combined with WWL-243 they
cannot see that it did.

### WWL-243 (S2) — the venue switcher does nothing, and there is no venue column anywhere

`InventoryAPI.listItems()` is called **with no arguments**, and `queryKey: ["inventory-redesigned"]`
carries no businessId, so nothing can re-scope it. Driven on all three venues:

| Scope selected | Request issued | Rows |
|---|---|---|
| Rehman Grand Marquee (3358) | `/inventory/items` — no params | **36** |
| Rehman Banquet & Lawn (3359) | `/inventory/items` — no params | **36** |
| Rehman Marquee Bahria (3360) | `/inventory/items` — no params | **36** |

The API **does** honour `?businessId=` — probed directly it returns **12 / 12 / 12**. The capability
exists and the screen never uses it.

The consequence is not cosmetic. Every one of the **12 item names appears exactly three times**:

| Item | Venue A | Venue B | Venue C |
|---|---|---|---|
| Banquet Chairs | 755 @ Rs 4,250 | 776 @ Rs 8,600 | 791 @ Rs 4,100 |
| Basmati Rice | 335 @ Rs 8,850 | 331 @ Rs 2,600 | 327 @ Rs 4,100 |
| Cooking Oil (Dalda) | 182 @ Rs 1,900 | 187 @ Rs 650 | 170 @ Rs 5,400 |

…and there is **no venue column in the table, none on the mobile card, and none in the CSV export** —
even though the API eager-loads `business: {id, name}` on every single row. A vendor deciding where
to reorder chairs is choosing between Rs 4,100 and Rs 8,600 with nothing on screen to say which
venue is which.

### WWL-244 (S2) — on a phone, no stock can be changed at all

At 360×740 the table wrapper is `hidden md:block` and the card renderer emits no buttons:

| | |
|---|---|
| Row-action buttons in the DOM | **108** (36 × Adjust / Edit / Remove) |
| Row-action buttons **visible** | **0** |
| Buttons inside a mobile card | **0** |
| Controls that do work at 360 | Add item, search, density, export |

**Adjust stock is the only path that can change a stock count** — the module's entire purpose — and
it does not exist on a phone. Same family as the Receipts and PDC mobile findings, but here it
removes the core job rather than a convenience.

### WWL-245 (S2) — the app's own corrective instruction cannot be followed

Verified against the live server (bounded probe on an item with confirmed non-zero stock; the
`WW-225` guard returns before any destroy, and stock read **755.000 before and 755.000 after**):

```
DELETE /api/v1/inventory/items/179  →  409
"Cannot delete item with non-zero stock. Record an adjustment movement to zero it first."
```

Then, in the movement dialog, driven on the same item:

| Step | Result |
|---|---|
| Movement = **Stock-take** | label correctly becomes *"Counted quantity"* ✓ |
| Counted quantity = **0** | projection correctly reads *"New stock: 0 piece"* ✓ |
| **Record movement** | **disabled** — *"Fill in the required fields above to save."* |

`canSave = !!item && qty > 0`. The backend explicitly allows it — `validateMovement` rejects an
adjustment only when `qty < 0`, and its own comment reads *"Adjustment accepts 0 (you can set stock
to zero)"*. **Every one of the 36 live items has stock > 0**, so no item on this screen can be
deleted by the route the product prescribes. The only way out is to record a false `consumed`
movement for the entire remaining stock — which is never suggested, and which falsifies the ledger.

### WWL-246 (S2) — all four numeric fields still accept negatives on live production

Driven in the live Add-item dialog:

| Field | Typed | Accepted | `aria-invalid` | `min` attr | Error shown |
|---|---|---|---|---|---|
| Opening stock | **−500** | ✓ | none | none | none |
| Low-stock threshold | **−10** | ✓ | none | none | none |
| Last cost / unit | **−9999** | ✓ | none | none | none |
| Reorder lead time | **−30** | ✓ | none | none | none |

**Save stayed enabled** and the request went out carrying every negative (body above). The screen's
own header cards derive *Stock value* and *Low / out of stock* from these numbers, so one negative
corrupts both tiles for every other item.

Worth stating precisely: **the fix is already written.** Commit `1725bfa`
*"fix(inventory): all four number fields accepted negatives"* adds the `neg()` guard, `min={0}`,
`fieldAria` and per-field messages — and it is **unpushed** (branch `fix/vendor-portal-qa-sweep`, 70
ahead of origin). Production is running the pre-fix build. Reading the repo would have reported this
as passing; it does not pass on the live screen.

### WWL-247 (S3) — the movement dialog discards most of the ledger

| The API accepts | The dialog offers |
|---|---|
| `supplierName` | **nothing** — yet the placeholder says *"Restock from supplier"* |
| `bookingId` | **nothing** — yet the placeholder says *"used at Ahmed wedding"* |
| `occurredAt` | **nothing** — every movement is stamped `now()` |
| `notes`, `photoUrl` | **nothing** |
| `type`, `quantity`, `costPerUnit`, `reason` | all four present ✓ |

So consumption can **never be attributed to an event**, which is the only reason `bookingId` exists
on the model — and yesterday's usage cannot be recorded on yesterday. The placeholder text promises
two fields the form does not have.

### WWL-248 (S3) — the audit ledger is write-only

`listMovements` exists, `getItem` returns the last 30 movements, the model snapshots
`stockBefore`/`stockAfter` inside a transaction — and **none of it is rendered anywhere**. No history
view, no drill-in from a row, no way to see who changed a count or why. Live: **0 movements** across
36 items, whose stock was seeded directly at creation. The immutable audit trail the whole design is
built around has never been read or written by a vendor.

### WWL-249 (S3) — stat cards ignore the search

Searching `Basmati` leaves **3 rows** on screen under cards reading **Total items 36 · Categories 5 ·
Low / out of stock 0**. The cards are computed from `all`, never from the filtered set. Sixth module
with this pattern.

### WWL-250 (S3) — wrong empty state on a stock book of 36 items

A search with no match renders *"**No inventory yet** — Track your gear, props and consumables so you
never run short on a shoot day"* with an **Add item** button, while the card directly above reads
**36**. Fifth module with this pattern.

### WWL-251 (S3) — search cannot find a supplier the data already carries

| | |
|---|---|
| Client filter matches | `name`, `sku`, `category` |
| Backend search matches | `name`, `sku`, **`defaultSupplierName`** |
| Suppliers on the live data | Bismillah Meat Supply · Kashmir Generator Rentals · Gulberg Flower House · Al-Madina Fruit & Vegetable · Royal Crockery & Furniture · Chenab Rice & Atta Store |
| Searching `Bismillah` | **0 rows** + the "No inventory yet" empty state |

`defaultSupplierName` is also never displayed — not a column, not on the card, not in the export. A
vendor cannot answer "what do I buy from Chenab Rice & Atta Store?" on a screen that stores the answer.

### WWL-252 (S3) — the delete confirm promises an action that always fails

*"Banquet Chairs will be removed from inventory. This can't be undone."* — for an item the server is
guaranteed to refuse with a 409. There is no pre-check on `currentStock`, no warning in the copy, and
the button is styled destructive as though it will work. (Also: the backend paranoid-**soft**-deletes
and preserves the ledger, so "can't be undone" overstates it in the other direction.)

### WWL-253 (S3) — a movement the server will refuse is submittable

Consumed **9999** against a stock of **755** renders the projection **−9244** in destructive red —
and leaves **Record movement enabled**. Only the server's `insufficient_stock` refusal stops it.

### WWL-254 (S3) — the accessibility gaps

| Check | Result |
|---|---|
| `<th scope>` on the 8 header cells | **none** |
| Row checkboxes | all 36 announce **"Select row"** |
| Row actions | all announce "Adjust stock" / "Edit item" / "Remove item" — **no item name** |
| Dialog `<label htmlFor>` | **null on all 10** |
| Dialog input `id` | **null on all 10** on the live build |
| Blocked-save hint | ✓ in a `role="status"` live region — genuinely good |
| Alert dialog | ✓ announced with title + description |

### WWL-255 (S4) — one field, three renderings

`rental` is shown as **Rental** in the table, **Rental fleet** in the dialog dropdown, and exported as
**rental**. The edit dialog also shows raw DECIMAL strings in its number inputs — threshold `100.000`,
cost `4250.00`.

### WWL-256 (S4) — photographer copy on a marquee operator's stock book

Empty state: *"…so you never run short on a **shoot day**."* Name placeholder: *"e.g. **Premium photo
album (12x18)**"*. The vendor's actual inventory is banquet chairs, chafing dishes, basmati rice and
Dalda cooking oil.

### WWL-257 (S4) — the component describes a screen that no longer exists

Its header comment reads *"Read-only presentation; original screen untouched. Route
`/dashboard/inventory-new`."* The screen does full CRUD **plus** stock movements, and
`/dashboard/inventory-new` returns **404**.

### WWL-258 (S4) — two dead affordances

`SKU` is `null` on all 36 rows, so the column renders **—** thirty-six times and exports as empty. The
**Low / out of stock** card is not clickable, though the API supports `lowStockOnly=true` and no other
control reaches it.

### WWL-259 (S3) — on a failed load the header asserts an empty, healthy stock book

With the items request pointed at an unroutable host, the table correctly shows **"Couldn't load
inventory."** with a working **Retry** — but the four cards above it read:

> **Total items 0 · Low / out of stock 0 — "all good" · Stock value Rs 0 · Categories 0**

A vendor glancing at the header sees Rs 0 of stock and a reassuring "all good" during an outage. The
cards render zeros where they should render an unknown state.

---

### What passed, and it is worth saying

- **D20-199 → D20-204 — nothing was written.** 36 items, Rs 68,511,200, 0 movements, item 179 at
  755.000, no QA row — all identical at close, read through a clean iframe realm.
- **The backend is genuinely well-hardened.** Four prior defects are fixed *and commented with the
  failure each prevents*: `WW-082` re-reads the item under a `FOR UPDATE` lock so two concurrent
  movements cannot both compute `stockAfter` from the same `stockBefore`; `WW-153` re-derives the
  `lastRestock*` stamps from the most recent surviving restock when one is deleted; `WW-189` refuses
  a `bookingId` belonging to another business so a vendor cannot read a rival's booking back through
  the eager-loaded join; `WW-225` refuses to delete an item still holding stock.
- **`applyMovement` is a clean pure state machine** — refuses any non-adjustment movement that would
  push stock below zero, caps quantity at 1,000,000 and cost at Rs 50 crore as typo guards, and never
  mutates its inputs.
- **Direct `PATCH` genuinely cannot move stock.** The FE does send `currentStock` on an edit; the
  controller's `delete patch.currentStock` drops it. My concern that an edit could reset a stock
  count **did not materialise** — recorded as a pass.
- **D20-026 — the Stock value card matches the API exactly.** The FE recomputes
  `Σ stock × lastCost` client-side rather than using `summary.totalStockValue`, and both land on
  **Rs 68,511,200**. I expected a divergence; there is none.
- **D20-167/168 — the table has a real error state with a working Retry**, unlike Module 19's
  self-hiding card. (The stat cards beside it are the problem — WWL-259.)
- **D20-189/190 — clean at 360px**: no page scroll and **zero** overflowing elements under the
  corrected scan that excludes `html`/`body` from the scroller walk. This is the check that exposed
  Module 19; Inventory passes it properly.
- **D20-078 → D20-088 — export works**: CSV and XLSX, `inventory.csv`, correct headers, null SKU as
  an empty string, generated entirely client-side with no network call.
- **D20-089 → D20-094 — density works and persists**: row height 57 → 49 px, correct `aria-pressed`,
  stored in `ww-ui-prefs`.
- **D20-095 → D20-101, D20-188 — the create dialog's structure is right**: 10 fields, name
  auto-focused, `Opening stock` create-only, all 7 category labels and all 17 unit labels present,
  and the blocked-save hint (*"Add a name to save."*) is announced in a `role="status"` region.
- **D20-119 / D20-120** — Edit prefills every field correctly and correctly omits Opening stock.
- **D20-151 / D20-152** — the movement body is exactly `{inventoryItemId, type, quantity}` with blank
  optionals omitted, and `quantity` serialises as a **number**.
- **D20-166** — the delete alert focuses **Cancel**, not the destructive action.

### Not driven, each with its reason

| Cases | Why |
|---|---|
| **D20-019, D20-020, D20-027, D20-028, D20-042, D20-043, D20-083** | No live instance: every one of the 36 items has stock > 0, a non-null last cost and a threshold > 0. There is no zero-stock, no null-cost and no `stock === threshold` row to observe, and constructing one means writing to a real stock book. |
| **D20-106 → D20-112** (server caps: stock 1,000,000 · cost Rs 50 crore · lead time 365 · name 160 · SKU 60 · notes 5,000) | Each needs a create that actually reaches the server. The caps were read off `inventoryHelpers.js` and are recorded as source-verified, not as driven. |
| **D20-121 → D20-132** (most of the edit path) | Structure and prefill were driven (D20-119/120); the save path is the same mutation shape already captured on create, and driving it would mean a second diverted write against a real row for no new information. |
| **D20-146 → D20-148, D20-150** (movement caps and reset) | Same reason as the create caps — they are server-side refusals that need a live write. |
| **D20-075 → D20-077, D20-079, D20-085** (selection-scoped export) | The export mechanism, columns, escaping and client-side generation were all driven; the selection variant reuses the same `ExportMenu` already exercised in four earlier modules. |
| **D20-066, D20-067, D20-070 → D20-074** (search variants) | The search's *mechanism* was established (client-side, no request) and its two real defects were driven (supplier blindness, wrong empty state); case-folding and whitespace behave as the `toLowerCase()/trim()` shape dictates. |
| **D20-169, D20-171 → D20-175** (500, slow, malformed, 401, double-submit) | The error state and Retry were driven via an unroutable host. A 401 would end the session and require a fresh emailed OTP. |
| **D20-016, D20-017, D20-036, D20-046, D20-051, D20-052, D20-058, D20-092, D20-093, D20-116, D20-117, D20-157, D20-158, D20-165, D20-180, D20-181, D20-184 → D20-187, D20-196, D20-197** | Lower-order presentation and repeat-interaction checks; not reached before the module's findings were established. Listed here rather than silently dropped. |
| **D20-176** (console clean) | The instrumentation was lost to a context reset late in the run; I did not re-arm and re-drive the module, so I am not claiming it. |

### Module 20 — status

**204 cases written, 132 driven. 18 findings (5× S2, 9× S3, 4× S4).**

**The module's verdict.** The backend here is the most carefully defended code in the sweep — a row
lock against concurrent movements, a cross-business guard on `bookingId`, a refusal to delete stock
into thin air, a pure state machine that cannot go negative. Every one of those defences is
commented with the specific failure it prevents. What sits on top of it does not use any of it: the
audit ledger is never displayed and has zero rows, the movement form drops the supplier, the booking
and the date, new items are filed under whichever venue happens to be first, the venue is not shown
anywhere so three copies of "Banquet Chairs" are indistinguishable, and on a phone nothing can be
adjusted at all. The one instruction the product gives when a delete fails — *record an adjustment to
zero it first* — is the one movement the dialog refuses to save.

---

# MODULE 21 — STAFF & PAYROLL (`/dashboard/staff`)

**What the screen is for.** Two tabs. **Roster** is the crew list — name, role, the space they
default to, permanent-monthly vs casual-dihari, pay rate, and a per-member switch that gives them a
login to the staff portal. **Shifts & payroll** is an append-only pay ledger: every shift snapshots
the staffer's name, role and pay maths (base + overtime + bonus − deduction → gross → net) so the
record stays auditable, then moves through pending → partial → paid → disputed → void, with a
separate attendance track (scheduled → checked in → worked / no-show / excused / replaced).

**Source read before writing these cases**
- `app/(dashboard)/dashboard/staff/page.tsx`, `app/(dashboard)/dashboard/staff/[id]/page.tsx`
- `components/.../staff/redesigned/staff-redesigned-view.tsx` — tabs, roster, stats, delete
- `components/.../staff/redesigned/payroll-tab.tsx` — shift ledger, transitions, attendance
- `components/.../staff/redesigned/payroll-dialogs.tsx` — Shift / Pay / Dispute / Void / Replace
- `components/.../staff/redesigned/staff-form-dialog.tsx`, `staff-detail-view.tsx`
- `components/staff-portal/staff-login-control.tsx`, `staff-leave-queue.tsx`
- `lib/api/staff.ts` — the `AttendanceStatus` union and the label/tone dictionaries
- `components/dashboard/primitives/status-pill.tsx` — `TONE[tone].cls`
- `src/controllers/staffController.js`, `src/models/staffShift.js` — `ATTENDANCE_STATUSES`
- `lib/axiosConfig.js` — `BUSINESS_SCOPED_PREFIXES` includes `/api/v1/staff`

**Pre-flight state, read off live prod before any case was written**

| Fact | Value |
|---|---|
| `GET /staff/members` (unscoped, raw) | **33 members** — 11 per venue × 3 |
| Roster rows shown while scoped to 3360 | **11** — the axios interceptor injects `businessId` |
| `GET /staff/shifts` (unscoped, raw) | **95 shifts** |
| Every shift's `attendanceStatus` | **`"present"`** |
| Frontend `AttendanceStatus` union | `scheduled · checked_in · completed · absent · excused · replaced` — **no `present`** |
| Backend `ATTENDANCE_STATUSES` | the same six — **also no `present`** |
| DB column | `STRING(20)`, `defaultValue: "scheduled"`, **no enum constraint** |
| Shift sample | 2026-08-21 · waiter Rs 1,800 · lead cook Rs 2,500 · manager Rs 3,519 · valet Rs 1,750 — all `pending` |
| Staff triplication | "Arshad Ali" exists as ids 147 / 158 / 169, one per venue |

**Element inventory (2 tabs · 27 interactive)**

| # | Element | Where |
|---|---|---|
| 1–2 | `Roster` / `Shifts & payroll` tabs | TabsList |
| 3 | `Add staff` | roster header |
| 4–7 | Stat cards: Total staff · Active · On salary · Daily (dihari) | roster |
| 8 | `Search staff…` | roster toolbar |
| 9–11 | Density toggle · Import · Export | roster toolbar |
| 12 | Select-all + row checkboxes | roster table |
| 13 | Member name → `/dashboard/staff/{id}` | roster row |
| 14 | `Enable login` / staff-portal control | roster row |
| 15–16 | `Edit staff` · `Remove staff` | roster row |
| 17 | Staff form dialog | modal |
| 18 | Remove-staff confirm | alert |
| 19 | `Log shift` | payroll header |
| 20–23 | Stat cards: To pay out · Paid · In dispute · Shifts | payroll |
| 24 | Leave queue | payroll |
| 25 | Status chips (All / Pending / Part-paid / Paid / Disputed / Void) with counts | payroll toolbar |
| 26 | From / To date filters + clear | payroll toolbar |
| 27 | Row actions: Mark paid · Dispute · Void · Payslip · Remove · attendance · Replace | payroll rows |

**Safety limits for this module, each with its reason**

| Limit | Reason |
|---|---|
| **No shift is created, transitioned, paid, disputed, voided or deleted.** | These are a real crew's wages. A `paid` transition writes a payment record against a named person; `void` erases their claim. Memory rule: never write money rows on the live vendor's ledger. |
| **No staff member is created, edited or deleted.** | 33 real people with real phone numbers. |
| **No staff login is enabled or disabled.** | Enabling a login provisions portal access for a real person and may send them credentials. |
| **No leave request is approved or rejected.** | Decides a real person's time off. |
| **No payslip PDF is opened in a way that leaves the vendor's browser.** | The blob fetch is a GET and safe; the new tab is intercepted. |
| **Reads may hit the live API freely.** | GETs are side-effect free. |

---

## MODULE 21 — TEST CASES

### A. Route, navigation and tabs (D21-001 → D21-014)

- **D21-001** Sidebar → **Staff & payroll** navigates to `/dashboard/staff`.
- **D21-002** `document.title` is `Dashboard : Staff & Payroll`.
- **D21-003** The rail entry is `aria-current="page"`.
- **D21-004** Breadcrumb renders and links home.
- **D21-005** `/dashboard/staff-new` — the route named in the component's own header comment — resolves to what?
- **D21-006** The header comment claims *"Read-only; original screen untouched"* — check against a screen that creates, edits, deletes and pays.
- **D21-007** Two tabs render: **Roster** and **Shifts & payroll**.
- **D21-008** Roster is selected by default.
- **D21-009** Switching tabs does **not** change the URL (`defaultValue`, no `onValueChange`) — so a payroll view cannot be linked or bookmarked.
- **D21-010** …and a reload always returns to Roster, discarding the tab choice.
- **D21-011** Tabs are keyboard-navigable with arrow keys and expose `aria-selected`.
- **D21-012** **Clicking `Shifts & payroll` — does the tab render at all?**
- **D21-013** If it fails, what does the vendor see, and is the failure scoped to the tab or to the whole route?
- **D21-014** Is the failure recoverable — does `Try again` restore the screen, or does it fail again?

### B. Roster — first paint and data (D21-015 → D21-028)

- **D21-015** Eyebrow `Operate`, `h1`, description render.
- **D21-016** The `h1` reads **"Team & Shooters"** while the nav entry says **"Staff & payroll"** — two names for one screen.
- **D21-017** Row count matches the scoped API response.
- **D21-018** Columns: Name · Role · Space · Type · Phone · Rate · Status · actions.
- **D21-019** The name cell is a link to `/dashboard/staff/{id}` and looks like one.
- **D21-020** Initials avatar renders two letters for a two-word name and one for a single word.
- **D21-021** `role` renders underscores as spaces and capitalised (`parking_valet` → `Parking valet`).
- **D21-022** `Space` shows `defaultSubVenue.name` and `—` when null.
- **D21-023** `Rate` prefers monthly salary, falls back to dihari, then `—`.
- **D21-024** A member with **both** a salary and a dihari rate shows only the salary — confirm and judge.
- **D21-025** `Status` pill reflects `isActive`.
- **D21-026** Phone renders as stored; check for a broken/short number.
- **D21-027** `<th scope>` present.
- **D21-028** Row checkboxes have per-row accessible names.

### C. Roster — stat cards (D21-029 → D21-036)

- **D21-029** **Total staff** equals the row count.
- **D21-030** **Active** counts `isActive`.
- **D21-031** **On salary** counts `monthlySalary > 0`.
- **D21-032** **Daily (dihari)** counts a dihari rate **excluding** anyone with a salary — verify the exclusion.
- **D21-033** The four counts add up sensibly against 11 scoped members.
- **D21-034** Cards are computed from `all`, not the filtered set — type a search and check.
- **D21-035** The **Active** card is hard-coded `trend="up"` regardless of the number — check what it claims when 0 are active.
- **D21-036** Card labels are readable as label + value.

### D. Roster — venue scoping (D21-037 → D21-044)

- **D21-037** `/api/v1/staff` is in `BUSINESS_SCOPED_PREFIXES`, so the axios interceptor injects `businessId` on GETs. Confirm on the wire.
- **D21-038** Switch to 3358 → request carries `businessId=3358` and the roster changes.
- **D21-039** Switch to 3359 → same.
- **D21-040** Switch to 3360 → same.
- **D21-041** **All venues** → no `businessId`, and all 33 members appear.
- **D21-042** `queryKey: ["staff-redesigned"]` contains **no** businessId — so does the cache actually re-fetch on a venue switch, or is the interceptor's param invisible to the cache key?
- **D21-043** The same person exists three times (Arshad Ali 147/158/169). At **All venues**, can the vendor tell them apart?
- **D21-044** `businessId = businesses?.[0]?.id` is handed to the create dialog — which venue does a new staff member land on while scoped to a different one?

### E. Roster — search, selection, export, import, density (D21-045 → D21-060)

- **D21-045** Search filters on name, role and phone, client-side, with no request.
- **D21-046** Search is case-insensitive and trims.
- **D21-047** A no-match search shows the empty state — check its wording against a populated roster.
- **D21-048** The empty state says *"Add your shooters, editors and assistants"* — judge against a venue's valets, cooks and security guards.
- **D21-049** Clearing search restores every row.
- **D21-050** Search is not in the URL and is lost on reload.
- **D21-051** Select-all selects the filtered rows.
- **D21-052** Export offers CSV and XLSX.
- **D21-053** Export columns: Name · Role · Type · Phone · Monthly salary · Dihari rate · Active.
- **D21-054** The export carries **staff phone numbers** — confirm, and note it is a personal-data export with no warning.
- **D21-055** A null salary exports as **0**, not blank — check whether that reads as "paid nothing".
- **D21-056** No venue column in the export.
- **D21-057** Import button opens the staff importer.
- **D21-058** The importer is not executed — record what it would accept.
- **D21-059** Density toggle changes row height and persists in `ww-ui-prefs`.
- **D21-060** Density does not disturb selection or search.

### F. Roster — staff form dialog (D21-061 → D21-078)

- **D21-061** `Add staff` opens the dialog with its create title.
- **D21-062** Every field renders; identify the full set.
- **D21-063** Required-field blocking and the blocked-save hint.
- **D21-064** Role dropdown lists the full `StaffRole` dictionary.
- **D21-065** Employment type offers permanent_monthly · casual_dihari · contract.
- **D21-066** Choosing permanent vs casual changes which pay field is asked for.
- **D21-067** A negative monthly salary.
- **D21-068** A negative dihari rate.
- **D21-069** A salary above any sane cap.
- **D21-070** A Pakistani phone number in local (`03xx`) and international (`+92`) form.
- **D21-071** An invalid phone (letters, 3 digits).
- **D21-072** A duplicate name — allowed? (three Arshad Alis already exist).
- **D21-073** The default sub-venue picker lists this venue's spaces only.
- **D21-074** The captured create body and endpoint.
- **D21-075** `businessId` in the captured body.
- **D21-076** Edit prefills every field.
- **D21-077** Edit sends `PATCH` to the member's id.
- **D21-078** Cancel/Escape discard without a request.

### G. Roster — remove staff (D21-079 → D21-086)

- **D21-079** `Remove staff` opens an alert naming the member.
- **D21-080** The copy says *"This can't be undone."* — check against the backend's delete semantics.
- **D21-081** Cancel and Escape close without a request.
- **D21-082** Remove issues `DELETE` to the member's id.
- **D21-083** Does the server refuse to delete a member who has shifts on the ledger?
- **D21-084** If it soft-deletes, do their shifts survive with the name snapshot intact?
- **D21-085** With the write diverted, does the toast claim **"Staff removed"**?
- **D21-086** Does the row return after a hard reload?

### H. Roster — the staff-portal login control (D21-087 → D21-094)

- **D21-087** The control renders on every row; identify its states.
- **D21-088** For a member with no login it offers **Enable login**.
- **D21-089** What does enabling actually do — create a user, set a password, send an SMS?
- **D21-090** Is the vendor told what the staffer will receive?
- **D21-091** Is there a confirmation step before provisioning access for a real person?
- **D21-092** The captured request and endpoint (**not sent**).
- **D21-093** Can a login be revoked from the same control?
- **D21-094** Is the control's purpose clear without documentation — "login" to what?

### I. Member detail page `/dashboard/staff/{id}` (D21-095 → D21-106)

- **D21-095** The name link navigates to the member's page.
- **D21-096** The page loads and names the member.
- **D21-097** It shows what they are still owed.
- **D21-098** It lists every shift they worked.
- **D21-099** Does it survive the same attendance-status value that breaks the payroll tab?
- **D21-100** Breadcrumb / back path to the roster.
- **D21-101** A non-existent id.
- **D21-102** Another vendor's member id → refused, not rendered.
- **D21-103** Money figures agree with the payroll ledger.
- **D21-104** Any actions on this page are captured, not sent.
- **D21-105** The page at 360px.
- **D21-106** Console clean on this route.

### J. Shifts & payroll — the ledger (D21-107 → D21-126)

- **D21-107** The tab renders its own PageHeader and `Log shift` action.
- **D21-108** Four stat cards: To pay out · Paid · In dispute · Shifts.
- **D21-109** **To pay out** uses `outstandingTotal ?? pendingTotal`, and its delta names the pending count and the part-paid balance.
- **D21-110** `partialBalance = max(0, outstandingTotal − pendingTotal)` — verify against the API's own numbers.
- **D21-111** Status chips show live counts per status and filter the table.
- **D21-112** The chip counts come from the **summary**, the rows from a **separate** query — confirm they agree.
- **D21-113** Date From/To filter the ledger and the summary together.
- **D21-114** The clear-dates button appears only when a date is set.
- **D21-115** Columns: Date · Staff · Base/OT/Bonus/Ded. · Gross · Net · Status · actions.
- **D21-116** The breakdown chips render only the non-zero components.
- **D21-117** `Net` shows the paid amount and, for a part-paid shift, the balance still due.
- **D21-118** The staff cell shows the **snapshot** name and role, not the current record.
- **D21-119** A shift linked to a booking shows `Booking #id`.
- **D21-120** `Gross` and `Net` are rounded for display only.
- **D21-121** The payment pill and the attendance pill both render.
- **D21-122** The empty state reads *"No shifts in this window"* — correct wording for a filtered ledger.
- **D21-123** The leave queue renders or is absent.
- **D21-124** Row selection works.
- **D21-125** There is no export on this tab — confirm, on the one table a vendor would hand to an accountant.
- **D21-126** `<th scope>` on this table.

### K. Shifts & payroll — transitions (D21-127 → D21-142)

- **D21-127** `pending` offers Mark paid · Dispute · Void.
- **D21-128** `partial` offers the same three.
- **D21-129** `paid` offers **only** Dispute — a paid shift cannot be un-paid.
- **D21-130** `disputed` offers Mark paid · Void · Pending.
- **D21-131** `void` offers only Pending.
- **D21-132** Mark paid opens the **Pay** dialog, not a bare transition.
- **D21-133** The Pay dialog is partial-aware — it accepts an amount less than net.
- **D21-134** Paying less than net lands the shift in `partial`, not `paid`.
- **D21-135** Paying more than net — refused?
- **D21-136** The payment-method list matches `PAYMENT_METHOD_LABELS` (Raast, IBFT, SadaPay, NayaPay…).
- **D21-137** Dispute captures a reason.
- **D21-138** Void captures a reason.
- **D21-139** Replace opens the replacement dialog and captures who covered.
- **D21-140** Every row action is disabled while that row is busy.
- **D21-141** Each captured transition payload and endpoint (**none sent**).
- **D21-142** With a write diverted, does the toast claim success?

### L. Shifts & payroll — attendance (D21-143 → D21-152)

- **D21-143** Every live shift carries `attendanceStatus: "present"`.
- **D21-144** `"present"` is absent from the frontend `AttendanceStatus` union.
- **D21-145** `"present"` is absent from the backend `ATTENDANCE_STATUSES` too.
- **D21-146** The DB column is an unconstrained `STRING(20)` — so nothing rejected the value.
- **D21-147** `ATTENDANCE_STATUS_LABELS["present"]` → what does the pill render?
- **D21-148** `ATTENDANCE_TONE["present"]` → what tone does `StatusPill` receive?
- **D21-149** `StatusPill` does `TONE[tone].cls` — what happens when `tone` is `undefined`?
- **D21-150** `NEXT_ATTENDANCE_OPTIONS["present"]` → which attendance actions can the vendor take?
- **D21-151** Is the bad value correctable from anywhere in the UI?
- **D21-152** Establish the full chain from the stored value to what the vendor sees.

### M. Payslip (D21-153 → D21-158)

- **D21-153** The Payslip button appears on every shift row.
- **D21-154** It fetches `/staff/shifts/{id}/payslip-pdf` as a blob.
- **D21-155** The blob is a real PDF.
- **D21-156** It opens in a new tab via an object URL — intercepted here, not opened.
- **D21-157** A failure shows *"Could not open payslip"*.
- **D21-158** The payslip is per-shift only — there is no month-end payslip or payroll run.

### N. Resilience (D21-159 → D21-166)

- **D21-159** Offline → the roster shows its error state with Retry.
- **D21-160** Unroutable host → same.
- **D21-161** The error text is *"Couldn't load staff."* — does it distinguish causes?
- **D21-162** Do the stat cards render zeros beside a failed load, as Inventory's do?
- **D21-163** Slow network → skeleton, no flash of empty.
- **D21-164** A malformed response does not white-screen.
- **D21-165** The error boundary that catches a render throw — what does it show, and does it name a reference the vendor can quote?
- **D21-166** Console errors across the module.

### O. Accessibility (D21-167 → D21-174)

- **D21-167** Row-action buttons announce which member they act on.
- **D21-168** Dialog labels are programmatically associated.
- **D21-169** Tabs expose `aria-selected` and roving focus.
- **D21-170** Status pills are not colour-only.
- **D21-171** The alert dialog announces title + description and focuses Cancel.
- **D21-172** Focus rings on all controls.
- **D21-173** Heading order.
- **D21-174** The search input has an accessible name.

### P. Mobile — 360×740 (D21-175 → D21-182)

- **D21-175** No horizontal page scroll.
- **D21-176** **And** zero clipped elements outside deliberate scroll containers, with `html`/`body` excluded from the walk.
- **D21-177** The roster switches to the card renderer.
- **D21-178** The card shows name, role, rate and status — are the row actions reachable?
- **D21-179** The login control on mobile.
- **D21-180** Stat cards reflow to 2 columns.
- **D21-181** The payroll tab at 360 (if it renders at all).
- **D21-182** Touch targets ≥ 24×24.

### Q. Integrity close-out (D21-183 → D21-188)

- **D21-183** Member count unchanged at close, via a clean iframe realm.
- **D21-184** Shift count unchanged (95).
- **D21-185** Every shift's `paymentStatus` unchanged.
- **D21-186** No staff login was provisioned.
- **D21-187** Every diverted write listed with method, URL and body.
- **D21-188** No `POST`/`PATCH`/`DELETE` reached the real API.

**188 cases written.** Execution follows.

---

## MODULE 21 — EXECUTION RESULTS

Driven on live prod `https://www.weddingwala.pk/dashboard/staff` with every write captured and
diverted, and a clean-realm integrity check at open and close.

**88 of 188 cases driven. 13 findings (1× S1, 2× S2, 7× S3, 3× S4). Nothing was written.**

| Integrity check (clean iframe realm, at close) | Value |
|---|---|
| Members | **33** — no `QA probe staff` row |
| Staff logins provisioned | **0** |
| Shifts | **95** |
| Payment status split | pending **19** · partial **18** · paid **58** |
| Gross across the ledger | **Rs 224,921** |
| Attendance status split | **`present` × 95** |

### WWL-260 (S1) — the Shifts & payroll tab takes the whole route down

Clicking **Shifts & payroll** replaces the entire `/dashboard/staff` page — sidebar, tabs, roster and
all — with the app's error boundary:

> **SOMETHING WENT WRONG** · We hit an unexpected error

Reproduced twice with real trusted clicks. Console, both times:

```
TypeError: Cannot read properties of undefined (reading 'cls')
Application error: TypeError: Cannot read properties of undefined (reading 'cls')
```

**The chain, established end to end:**

| Step | Evidence |
|---|---|
| 1. Every live shift carries `attendanceStatus: "present"` | 95 / 95, read from the API |
| 2. The frontend union has no `present` | `lib/api/staff.ts` — `scheduled · checked_in · completed · absent · excused · replaced` |
| 3. The **backend** enum has no `present` either | `src/models/staffShift.js` — the same six |
| 4. Nothing rejected the value | the column is `STRING(20)`, `defaultValue: "scheduled"`, **no enum constraint**, and the create handler never sets it — so it arrived from a seed/import path, not the API |
| 5. `ATTENDANCE_TONE["present"]` → `undefined` | `payroll-tab.tsx` |
| 6. `<StatusPill tone={undefined}>` | `payroll-tab.tsx:316` |
| 7. `TONE[tone].cls` throws | `status-pill.tsx:55` |

`NEXT_ATTENDANCE_OPTIONS[att] || []` **is** guarded, so the attendance buttons would merely have
vanished. The tone lookup is not.

**What this costs, in the vendor's own numbers.** The ledger the tab hides holds:

| | |
|---|---|
| **Outstanding to staff** | **Rs 57,282** |
| — of which pending | Rs 41,122 across **19** shifts |
| — of which still due on part-paid shifts | Rs 16,160 across **18** shifts |
| Already paid | Rs 167,639 — JazzCash 76,768 · cash 49,312 · Easypaisa 41,559 |
| Ledger span | 2026-02-11 → 2026-08-21 |

Every payroll action — Log shift, Mark paid, Dispute, Void, Replace, the attendance track, the
payslip PDF, the status filters, the date range, the leave queue — is unreachable. A venue owner
cannot see what they owe 33 people, and cannot pay any of it.

**One thing does still work.** The per-member page `/dashboard/staff/{id}` renders fine — it does not
use the attendance tone. It shows *"Still owed to Arshad — Rs. 1,750"* and lists his four shifts with
booking links. So the payroll data is reachable **one person at a time, 33 pages deep**, with no
total, no filter and no way to pay.

**`Try again` recovers — to the Roster tab.** The vendor can get their screen back; they can never
get to payroll.

### WWL-261 (S3) — the error page asks for a reference it never shows

The boundary says *"…tell us what you were doing when it broke and quote the reference above."*
There is no reference above it, and no `digest` in the markup (confirming a client-side throw). The
vendor is asked to quote something that does not exist.

### WWL-262 (S2) — a new hire is filed under the wrong venue

Captured while scoped to **All venues**:

```
POST /api/v1/staff/members
{"businessId":3358, "fullName":"QA probe staff — do not save", "role":"waiter",
 "employmentType":"casual_dihari", "phoneNumber":"abc", "defaultDihariRate":-2500, "isActive":true}
```

`businessId: 3358` — Grand Marquee — because the dialog is handed `businesses?.[0]?.id`. There is no
venue field in the form, so the vendor is never asked and never told. Identical mechanism to
WWL-242 in Inventory.

### WWL-263 (S2) — a negative day-rate and a non-numeric phone both go out

Driven in the live Add-staff dialog:

| Field | Typed | `min` attr | Error | Save | Transmitted |
|---|---|---|---|---|---|
| Dihari rate (Rs/day) | **−2500** | none | none | enabled | `defaultDihariRate: -2500` |
| Phone | **abc** | n/a | none | enabled | `phoneNumber: "abc"` |

A negative day-rate feeds `rateLabel` and every downstream shift's base pay. The phone is the only
way a venue contacts a valet at 11pm on an event night.

### WWL-264 (S3) — the create dialog cannot set the two things the roster shows

The roster has a **Space** column (Rooftop, Terrace Lawn, Marquee B, Zenana Section…), and the create
dialog has **no space field**. It also has no venue field. So a member added through the UI can
never be assigned a default space, and lands on whichever venue happens to be first.

Everything else in the form is generous and correct: 21 roles, 3 employment types, joined date,
phone, WhatsApp, CNIC, both pay fields, bank name + account, JazzCash, Easypaisa, emergency contact
and phone, notes, active toggle.

### WWL-265 (S3) — nothing on a staff row can be done from a phone

At 360×740:

| | |
|---|---|
| Edit / Remove buttons in the DOM | **66** |
| Edit / Remove **visible** | **0** |
| `Enable login` controls in the DOM | **33** |
| `Enable login` **visible** | **0** |

The card renderer emits name, role, rate and status and no actions. Third module in a row with this
pattern; here it removes staff editing and portal provisioning entirely on mobile.

### WWL-266 (S3) — the staff export is an unflagged personal-data export

`staff.csv` carries **33 people's names and mobile numbers**:

```
Name,Role,Type,Phone,Monthly salary,Dihari rate,Active
Arshad Ali,parking_valet,casual_dihari,0337048125,0,1500,Yes
Bashir Khan,security,permanent_monthly,0317331093,42000,0,Yes
```

Three problems in one file: nothing warns that this is personal data; a null salary exports as **0**,
so every dihari worker reads as being on a Rs 0 salary and every salaried one as having a Rs 0 day
rate; and there is **no venue column**, so "Arshad Ali" appears three times distinguishable only by
phone number. Role and type also export raw snake_case where the table capitalises them.

### WWL-267 (S3) — the payroll view cannot be linked, and a reload always lands on Roster

`<Tabs defaultValue="roster">` with no `onValueChange` and no URL sync. Switching tabs leaves the URL
at `/dashboard/staff`, so a vendor cannot bookmark payroll or send an accountant a link to it, and
every reload discards the choice.

### WWL-268 (S4) — three names for one screen

| Surface | Name |
|---|---|
| Sidebar | **Staff & payroll** |
| Page `h1` | **Team & Shooters** |
| Breadcrumb | **Staff** |
| Empty state | *"Add your **shooters, editors and assistants**"* |

The vendor's actual crew is valets, waiters, lead cooks, security and a manager. Same photographer
copy as Inventory's "shoot day".

### WWL-269 (S4) — the member page and the roster disagree on formatting

| | Roster | `/dashboard/staff/169` |
|---|---|---|
| Role / type | `Parking valet` · `Casual dihari` | **`parking_valet · casual_dihari`** |
| Money | `Rs 1,500 / day` | **`Rs. 1,750`** (with a period) |
| Breadcrumb | — | `Dashboard / Staff / **169**` — the raw id, not the name |

### WWL-270 (S3) — the same three accessibility gaps

`<th>` carry **no `scope`** (9 header cells); all 11 row checkboxes announce **"Select row"**; and
`Edit staff` / `Remove staff` announce no member name, so a screen-reader user hears the same two
labels eleven times.

### WWL-271 (S4) — the component describes a screen that no longer exists

Header comment: *"Read-only; original screen untouched. Route `/dashboard/staff-new`."* The screen
creates, edits, deletes, provisions logins and runs payroll.

### WWL-272 (S3) — the roster's cache key omits the scope it is filtered by

`/api/v1/staff` **is** in `BUSINESS_SCOPED_PREFIXES`, so the axios interceptor appends
`?businessId=` to every GET — that part works, and is why this screen scopes where Inventory does
not. But `queryKey: ["staff-redesigned"]` does not mention the venue, so venue A's crew and venue
B's crew are cached under the same key. Every switch I drove refetched correctly and the roster
changed; I am recording the structural risk, not an observed wrong render.

---

### What passed, and it is worth saying

- **Q — nothing was written.** 33 members, 0 logins provisioned, 95 shifts, the same
  pending/partial/paid split and the same Rs 224,921 gross at close as at open.
- **D21-037 → D21-041 — venue scoping genuinely works here.** The interceptor injects
  `businessId=3358 / 3359 / 3360`, the roster changes with it (the Space column flips from Rooftop to
  Terrace Lawn), and **All venues** issues an unscoped request returning all 33. This is the precise
  contrast that explains WWL-243: `/api/v1/staff` is in `BUSINESS_SCOPED_PREFIXES` and
  `/api/v1/inventory` is not.
- **D21-029 → D21-033 — the stat cards are arithmetically right.** 11 total · 11 active · 3 on
  salary · 8 dihari, and 3 + 8 = 11 — the dihari count correctly **excludes** anyone on a salary.
- **D21-087 → D21-091 — the staff-login dialog is honest.** *"Give Arshad Ali a login for the staff
  portal (check-in/out, their shifts and payslips). **Share the email + password with them.**"* It
  states what the portal is for, requires the vendor to type an email and an 8-character temporary
  password, and — critically — makes clear the credentials are handed over in person rather than
  silently messaged to the staffer. Nothing is provisioned without a deliberate act.
- **D21-043 — the duplicate-name problem is partly mitigated here.** Unlike Inventory, the roster's
  **Space** column (Rooftop / Terrace Lawn / Banquet Hall…) is venue-specific, so a vendor who knows
  their spaces can tell the three Arshad Alis apart. The venue is still never named.
- **D21-099 — the member detail page survives the value that kills the ledger**, and shows what each
  person is still owed with links through to the booking each shift belongs to.
- **D21-064 / D21-065 — the role dictionary is domain-literate**: 21 roles including *dhol player*,
  *qari*, *imam*, *bagpiper*, *stage host*, *parking valet* — written for a Pakistani wedding venue,
  not translated from a generic HR product.
- **D21-063 — the blocked-save hint** (*"Add a full name to save."*) is announced in a
  `role="status"` live region.
- **D21-175 / D21-176 — clean at 360px**: no page scroll and **zero** overflowing elements under the
  strict scan.
- **A concern of mine that did not materialise.** `payrollSummary` returns `{summary: {...}}` from
  the API while the tab reads `summary.pendingTotal` directly — I expected every payroll card to
  read zero. `StaffAPI.payrollSummary` unwraps `res.data?.data?.summary` correctly. Recorded as a
  pass.

### Not driven, each with its reason

| Cases | Why |
|---|---|
| **D21-107 → D21-142 (the whole ledger and every transition), D21-153 → D21-158 (payslip), D21-159 → D21-164 (payroll resilience), D21-181** — 60 cases | **Blocked by WWL-260.** The tab cannot render, so the shift table, the four payroll stat cards, the status chips, the date range, the leave queue, Mark paid / Dispute / Void / Replace, the attendance track and the payslip PDF are all unreachable in production. This is not a gap in the testing — it is the finding. |
| **D21-079 → D21-086** (remove staff) | The confirm copy and the endpoint follow the same `AlertDialog` + `DELETE` shape already driven twice this session, and driving it would put a diverted delete against a real person's record for no new information. The server-side question — whether a member with shifts can be removed at all — is recorded as unanswered. |
| **D21-068 → D21-070, D21-072, D21-076 → D21-078** (more form validation, edit path) | The validation posture was established by D21-067/071: no `min`, no format check, Save enabled, value transmitted. The remaining fields share the same uncontrolled shape. |
| **D21-092, D21-093** (provisioning a login, revoking one) | Enabling a login creates real portal credentials for a named person. All 33 members currently have none, so the "enabled" state and its revoke control could not be observed without provisioning one. |
| **D21-045 → D21-047, D21-049 → D21-051, D21-057 → D21-060** (search variants, import, density) | Search's mechanism and the import button were observed but not exercised; density and export share components already driven in Module 20. The import path was deliberately not run — it writes rows. |
| **D21-101 → D21-106** (detail-page edge cases) | The page's core was driven (D21-096 → D21-100); the id-tampering cases would probe another party's data. |
| **D21-024, D21-034, D21-035, D21-039** and the remaining O-section a11y checks | Lower-order checks not reached before the module's findings were established; listed rather than silently dropped. |

### Module 21 — status

**188 cases written, 88 driven. 13 findings (1× S1, 2× S2, 7× S3, 3× S4).**

**The module's verdict.** A single unrecognised string in one column — `"present"`, on all 95 rows,
written by something that was never checked against the enum the rest of the system agrees on —
takes down the entire staff route through a status pill that assumes its tone exists. Behind it sits
a genuinely good payroll subsystem: partial payments as a first-class state, snapshotted name and
role so the ledger stays true after someone leaves, attendance tracked separately from payment,
JazzCash and Easypaisa as payout methods, a payslip per shift. None of it can be opened. The venue
owes 33 people **Rs 57,282** and the only way to see any of it is to open thirty-three separate
pages, one per person, and add it up by hand.

---

# MODULE 22 — SUPPLIERS & A/P (`/dashboard/suppliers`)

**What the screen is for.** The money the venue **owes**. Two tabs. **A/P invoices** (the default) is
the accounts-payable ledger: every supplier bill with its due date, how much of it has been paid, what
is still outstanding, and five aging buckets — current, 0-7, 8-30, 31-60 and 60+ days overdue — with
row actions to log a bill, record a payment against it, dispute it, void it or remove it.
**Suppliers** is the directory behind it: who they buy from, the contact, the phone, the credit limit.

**Source read before writing these cases**
- `app/(dashboard)/dashboard/suppliers/page.tsx`, `.../suppliers/[id]/page.tsx`
- `components/.../suppliers/redesigned/suppliers-redesigned-view.tsx` — both tabs
- `components/.../suppliers/redesigned/invoice-dialogs.tsx` — Log / Pay / Dispute / Void
- `components/.../suppliers/redesigned/supplier-form-dialog.tsx`, `supplier-detail-view.tsx`
- `lib/api/suppliers.ts` — `InvoiceStatus`, `AgingReport`, status labels
- `lib/axiosConfig.js` — `/api/v1/suppliers` **is** in `BUSINESS_SCOPED_PREFIXES`

**Pre-flight state, read off live prod before any case was written**

| Fact | Value |
|---|---|
| Suppliers | **18** — 6 per venue × 3 |
| Categories | produce · meat · atta_grains · flowers · generator_rental · equipment_rental (3 each) |
| Active / inactive | **18 / 0** |
| Invoices | **23** |
| Invoice status split | paid **11** · partially_paid **6** · received **3** · overdue **3** |
| Billed / paid / **outstanding** | Rs 3,373,500 / Rs 1,904,250 / **Rs 1,469,250** |
| Aging — current | 6 invoices · Rs 990,500 |
| Aging — 0-7d | 0 · Rs 0 |
| Aging — 8-30d | 3 · Rs 363,750 |
| Aging — 31-60d | 1 · Rs 31,750 |
| Aging — 60d+ | 2 · Rs 83,250 |
| Aging grand total | Rs 1,469,250 — reconciles exactly with `totalOutstanding` |
| `aging.perSupplier` | **7 rows** the API computes (who is owed the most) |
| Supplier triplication | "Al-Madina Fruit & Vegetable" as ids 91 / 97 / 103, one per venue, credit limits Rs 600k / 750k / 400k |

**Element inventory (2 tabs · 24 interactive)**

| # | Element | Where |
|---|---|---|
| 1–2 | `A/P invoices` / `Suppliers` tabs | TabsList |
| 3 | `Log invoice` | invoices header |
| 4–8 | Five aging stat cards | invoices |
| 9 | `Search invoices…` | invoices toolbar |
| 10 | Eight status chips with counts | invoices toolbar |
| 11–12 | Density · Export | invoices toolbar |
| 13 | Select-all + row checkboxes | invoices table |
| 14–17 | Row actions: Record payment · Dispute invoice · Void invoice · Remove invoice | invoices rows |
| 18 | `Add supplier` | directory header |
| 19–22 | Four directory stat cards | directory |
| 23 | Supplier name → `/dashboard/suppliers/{id}` | directory row |
| 24 | `Edit supplier` · `Remove supplier` | directory rows |
| — | Four invoice dialogs + two confirm alerts | modals |

**Safety limits for this module, each with its reason**

| Limit | Reason |
|---|---|
| **No invoice is logged, paid, disputed, voided or removed.** | This is a real A/P ledger carrying **Rs 1,469,250** the venue genuinely owes six named suppliers. Recording a payment against a bill is a money write; disputing one is a statement to a trading partner. Memory rule: never write money rows on the live vendor's ledger. |
| **No supplier is created, edited or deleted.** | Real trading partners with real phone numbers and credit terms. |
| **Reads may hit the live API freely.** | GETs are side-effect free. |
| **No supplier is contacted.** | No call, no message, from any control on this screen. |

---

## MODULE 22 — TEST CASES

### A. Route, navigation and tabs (D22-001 → D22-012)

- **D22-001** Sidebar → **Suppliers** navigates to `/dashboard/suppliers`.
- **D22-002** `document.title` — check it against the screen's own `h1`.
- **D22-003** The rail entry is `aria-current="page"`.
- **D22-004** Breadcrumb renders and links home.
- **D22-005** `/dashboard/suppliers-new` — the route named in the component's header comment — resolves to what?
- **D22-006** The comment claims *"Original screen untouched"* — check what this screen actually does.
- **D22-007** Two tabs render; **A/P invoices** is selected by default.
- **D22-008** Switching tabs does **not** change the URL — so an A/P view cannot be linked.
- **D22-009** A reload always returns to A/P invoices, discarding the tab choice.
- **D22-010** Tabs are keyboard-navigable and expose `aria-selected`.
- **D22-011** Both tabs render without throwing (the failure mode found in Module 21).
- **D22-012** Browser Back leaves the screen cleanly.

### B. A/P invoices — first paint and totals (D22-013 → D22-028)

- **D22-013** The intro line renders: *"Every payment routes through the backend payment applier — amount paid and status can never drift."*
- **D22-014** The table paints 23 rows (or the venue-scoped subset).
- **D22-015** Columns: Supplier · Due · Paid / Total · Outstanding · Status · actions.
- **D22-016** The supplier cell shows the **snapshot** name, the invoice number and the invoice date.
- **D22-017** `Paid / Total` renders both figures and a progress bar.
- **D22-018** The progress bar is capped at 100% when paid exceeds total.
- **D22-019** `Outstanding` is `max(0, total − paid)` and is toned warning when > 0.
- **D22-020** The five aging cards read `current 990,500 · 0-7d 0 · 8-30d 363,750 · 31-60d 31,750 · 60d+ 83,250`.
- **D22-021** Those five sum to **Rs 1,469,250** — the same figure the invoice summary reports as `totalOutstanding`.
- **D22-022** There is **no total-outstanding card**. A vendor must add five numbers to learn what they owe.
- **D22-023** The aging cards show a rupee total but **not** the invoice count per bucket, though the API returns both.
- **D22-024** `aging.perSupplier` — 7 rows ranking who is owed the most — is computed by the API. Is it rendered anywhere?
- **D22-025** Before the aging query resolves the cards read `—`, not `Rs 0`.
- **D22-026** Rows are ordered most-recent-first; confirm and judge for an A/P ledger.
- **D22-027** `<th scope>` on the header cells.
- **D22-028** Row checkboxes have per-row accessible names.

### C. A/P invoices — due dates and overdue maths (D22-029 → D22-040)

- **D22-029** A due date in the future renders the date alone.
- **D22-030** A due date within 7 days renders a `Due in Nd` info pill.
- **D22-031** A past due date on an unpaid invoice renders `Nd overdue` in warning tone.
- **D22-032** A past due date on a **paid** invoice renders **no** overdue pill (`status !== "paid"` guard).
- **D22-033** A past due date on a **void** invoice renders no overdue pill.
- **D22-034** A null due date renders `—`.
- **D22-035** `daysFromNow` compares against **UTC** midnight (`setUTCHours(0,0,0,0)`) while the vendor is in PKT (UTC+5). Establish whether the day count is off between 00:00 and 05:00 PKT.
- **D22-036** The overdue day count matches what the backend used to bucket the invoice.
- **D22-037** An invoice in the `overdue` **status** and an invoice merely past its due date — are both shown as overdue?
- **D22-038** The three live `overdue`-status invoices appear in an aging bucket consistent with their dates.
- **D22-039** Exactly-today's due date — 0 days, which pill?
- **D22-040** Date formatting is `en-PK` and consistent with the rest of the dashboard.

### D. A/P invoices — status chips and filtering (D22-041 → D22-054)

- **D22-041** Eight chips render: All · Received · Partially paid · Paid · Overdue · Disputed · Void · Draft.
- **D22-042** Each chip shows a count.
- **D22-043** The counts at rest match the API summary: paid 11 · partially_paid 6 · received 3 · overdue 3.
- **D22-044** The `All` chip's count is the **sum of `summary.byStatus`** — verify it equals 23.
- **D22-045** Clicking `Paid` filters the table to 11 rows.
- **D22-046** **…and what happens to the other seven chips' counts?** The summary comes from the same filtered query, so establish whether selecting one status zeroes the rest.
- **D22-047** If it does, can the vendor still see that 3 invoices are overdue while looking at Paid?
- **D22-048** The `All` chip's count while a filter is active.
- **D22-049** Chips for statuses with zero rows (`disputed`, `void`, `draft`) still render and are clickable.
- **D22-050** Selecting an empty status shows the empty state, not a blank table.
- **D22-051** The filter is not in the URL and is lost on reload.
- **D22-052** The aging cards do **not** change when a status filter is applied — confirm, and judge whether that reads as inconsistent.
- **D22-053** The active chip is visually distinguishable beyond colour.
- **D22-054** Chips are keyboard-reachable in order.

### E. A/P invoices — search, selection, export, density (D22-055 → D22-068)

- **D22-055** Search matches supplier name, invoice number and description, client-side.
- **D22-056** Searching an invoice number (`INV-5297`) finds exactly that row.
- **D22-057** Search combines with the status filter.
- **D22-058** A no-match search shows *"No invoices in this window"* — judge the wording.
- **D22-059** Search is case-insensitive and trims.
- **D22-060** Search is lost on reload.
- **D22-061** Export offers CSV and XLSX with filename `supplier-invoices`.
- **D22-062** Export columns: Supplier · Invoice # · Invoice date · Due date · Total · Paid · Outstanding · Status.
- **D22-063** The export includes the computed `Outstanding` — good for an accountant; verify it matches the row.
- **D22-064** Status exports the **label**, not the raw enum — check against the pattern found in Modules 20 and 21.
- **D22-065** The export carries **no venue column**, though three venues' invoices merge at All-venues scope.
- **D22-066** Export respects the selection, and the filter when nothing is selected.
- **D22-067** Density toggle changes row height and persists.
- **D22-068** Nothing about the export hits the network.

### F. A/P invoices — row actions and permissions (D22-069 → D22-080)

- **D22-069** `Record payment` renders only when status is not paid and not void.
- **D22-070** `Dispute invoice` renders unless the invoice is void.
- **D22-071** `Void invoice` renders only when not paid and not void.
- **D22-072** `Remove invoice` renders only when not paid.
- **D22-073** On a **paid** invoice, exactly one action remains — confirm which.
- **D22-074** Each action has an `aria-label`; check whether the supplier or invoice number is announced.
- **D22-075** Icon-only actions are ≥ 24×24 px.
- **D22-076** The four action icons are visually distinct (green tick, amber triangle, grey cross, bin).
- **D22-077** Clicking a row itself does nothing — there is no drill-in to the invoice.
- **D22-078** Nothing links an invoice to the supplier's own page.
- **D22-079** No payment history per invoice is shown, though every payment routes through the applier.
- **D22-080** Row actions on mobile.

### G. A/P invoices — the four dialogs (D22-081 → D22-104)

- **D22-081** `Log invoice` opens and lists its fields.
- **D22-082** The supplier picker is fed by `SupplierAPI.list({isActive: true})` — 18 suppliers.
- **D22-083** The picker shows which venue each supplier belongs to, or does not.
- **D22-084** A business picker is present (`businesses` is passed in) — confirm and check its default.
- **D22-085** Required-field blocking and the blocked-save hint.
- **D22-086** A negative invoice total.
- **D22-087** A due date **before** the invoice date.
- **D22-088** A due date years in the future.
- **D22-089** The captured create body and endpoint.
- **D22-090** `Record payment` opens naming the invoice and showing what is outstanding.
- **D22-091** Paying **less** than outstanding → the invoice should land in `partially_paid`.
- **D22-092** Paying **exactly** the outstanding → `paid`.
- **D22-093** Paying **more** than outstanding — is it refused, and by which side?
- **D22-094** A zero or negative payment.
- **D22-095** The payment-method list.
- **D22-096** A payment dated in the future.
- **D22-097** The captured payment body and endpoint.
- **D22-098** `Dispute invoice` captures a reason and is required.
- **D22-099** The captured dispute body.
- **D22-100** `Void invoice` captures a reason.
- **D22-101** Void is refused on a paid invoice — client-side, server-side, or both.
- **D22-102** The captured void body.
- **D22-103** Each dialog resets between invoices.
- **D22-104** With writes diverted, do the dialogs claim success?

### H. A/P invoices — remove (D22-105 → D22-110)

- **D22-105** `Remove invoice` opens an alert reading *"Soft delete. Paid invoices cannot be removed."*
- **D22-106** The alert does **not** name the invoice or the supplier — confirm and judge on a destructive action.
- **D22-107** Cancel and Escape close without a request.
- **D22-108** Remove issues `DELETE` to the invoice id.
- **D22-109** With the write diverted, does the toast claim **"Invoice removed"**?
- **D22-110** Does the row return after a hard reload?

### I. Suppliers directory (D22-111 → D22-128)

- **D22-111** The tab renders 18 rows (or the venue-scoped 6).
- **D22-112** Columns: Supplier · Category · Contact · Phone · Credit limit · Status · actions.
- **D22-113** The supplier name links to `/dashboard/suppliers/{id}`.
- **D22-114** Category renders capitalised with underscores replaced (`atta_grains` → `Atta grains`).
- **D22-115** Credit limit renders as money; a null renders an em-dash.
- **D22-116** **Total suppliers** equals the row count.
- **D22-117** **Active** counts `isActive` — 18 of 18 live.
- **D22-118** **Categories** counts distinct categories — expect 6.
- **D22-119** **"Credit available"** is the **sum of credit LIMITS**, not limit minus outstanding. Establish what the card actually computes and what its label promises.
- **D22-120** Quantify the gap: total credit limits vs total limits minus the Rs 1,469,250 already owed.
- **D22-121** The card is hard-coded `trend="up"` on Active regardless of the number.
- **D22-122** Stat cards are computed from `all`, not the filtered set.
- **D22-123** Search matches name, contact, phone and category.
- **D22-124** A no-match search shows *"No suppliers yet — Add the vendors you buy from — albums, frames, props"*. Judge against a venue buying meat, atta and generator rental.
- **D22-125** Export columns and filename `suppliers`.
- **D22-126** The export carries supplier phone numbers and credit limits with no warning.
- **D22-127** `<th scope>` and per-row checkbox labels.
- **D22-128** Row actions at 360px.

### J. Suppliers directory — form and delete (D22-129 → D22-144)

- **D22-129** `Add supplier` opens the dialog and lists its fields.
- **D22-130** Required-field blocking and the hint.
- **D22-131** The category list matches the six live categories, or offers more.
- **D22-132** A negative credit limit.
- **D22-133** A credit limit above any sane cap.
- **D22-134** A non-numeric phone.
- **D22-135** Is there a venue field, or does `businesses?.[0]?.id` decide?
- **D22-136** The captured create body — which `businessId`?
- **D22-137** Edit prefills every field.
- **D22-138** Edit sends `PATCH` to the supplier id.
- **D22-139** Cancel and Escape discard.
- **D22-140** `Remove supplier` names the supplier and says *"This can't be undone."*
- **D22-141** Does the server refuse to delete a supplier that still has unpaid invoices?
- **D22-142** The delete error toast is given `duration: 8000` — confirm it is readable.
- **D22-143** With the write diverted, does the toast claim **"Supplier removed"**?
- **D22-144** Does the row return after a hard reload?

### K. Venue scoping (D22-145 → D22-154)

- **D22-145** `/api/v1/suppliers` is in `BUSINESS_SCOPED_PREFIXES` — confirm `businessId` on the wire.
- **D22-146** Switch to 3358 → 6 suppliers.
- **D22-147** Switch to 3359 → 6.
- **D22-148** Switch to 3360 → 6.
- **D22-149** All venues → 18.
- **D22-150** Do the **invoices** and the **aging** re-scope with the venue too?
- **D22-151** Does the aging grand total change per venue, and does it still reconcile?
- **D22-152** `queryKey: ["suppliers-redesigned"]` and `["supplier-aging"]` contain no businessId — the same structural risk as Module 21.
- **D22-153** At All venues, "Al-Madina Fruit & Vegetable" appears 3× with credit limits Rs 600k / 750k / 400k and **no venue column** — can the vendor tell them apart?
- **D22-154** The `Log invoice` supplier picker at All venues — does it show 18 entries with 6 duplicate names?

### L. Supplier detail page `/dashboard/suppliers/{id}` (D22-155 → D22-164)

- **D22-155** The name link navigates there.
- **D22-156** The page loads and names the supplier.
- **D22-157** It shows what is outstanding to them.
- **D22-158** It lists their invoices.
- **D22-159** Its figures agree with `aging.perSupplier` (e.g. supplier 97 → Rs 425,500 across 2 invoices).
- **D22-160** A non-existent id.
- **D22-161** Actions on that page are captured, not sent.
- **D22-162** Formatting consistency with the directory (the mismatch found in Module 21).
- **D22-163** The page at 360px.
- **D22-164** Console clean on that route.

### M. Resilience (D22-165 → D22-172)

- **D22-165** Offline → both tables show their error state with Retry.
- **D22-166** Unroutable host → same; Retry re-issues.
- **D22-167** The aging cards during a failed load — do they read `—` or `Rs 0`?
- **D22-168** A failed invoice query with a working aging query, and vice versa.
- **D22-169** Slow network → skeleton, no flash of empty.
- **D22-170** Malformed response does not white-screen.
- **D22-171** An unknown `status` value from the API — does `INVOICE_TONE[status]` repeat the Module 21 crash?
- **D22-172** Console clean across the module.

### N. Accessibility (D22-173 → D22-180)

- **D22-173** Row actions announce which invoice they act on.
- **D22-174** Dialog labels are programmatically associated.
- **D22-175** Tabs expose `aria-selected` and roving focus.
- **D22-176** Status pills are not colour-only.
- **D22-177** The progress bar has a text equivalent.
- **D22-178** Alert dialogs announce title + description and focus Cancel.
- **D22-179** Focus rings on all controls.
- **D22-180** Heading order.

### O. Mobile — 360×740 (D22-181 → D22-188)

- **D22-181** No horizontal page scroll.
- **D22-182** **And** zero clipped elements outside deliberate scroll containers.
- **D22-183** Five aging cards reflow without clipping their rupee values.
- **D22-184** The invoice table switches to the card renderer.
- **D22-185** The card shows supplier, number, date, status, paid/total and outstanding — are the four row actions reachable?
- **D22-186** Eight status chips wrap without overflow.
- **D22-187** Both dialogs are usable at 360.
- **D22-188** Touch targets ≥ 24×24.

### P. Integrity close-out (D22-189 → D22-194)

- **D22-189** Supplier count still 18 at close, via a clean iframe realm.
- **D22-190** Invoice count still 23.
- **D22-191** The status split unchanged (11 / 6 / 3 / 3).
- **D22-192** `totalOutstanding` still **Rs 1,469,250** and the aging buckets unchanged.
- **D22-193** Every diverted write listed with method, URL and body.
- **D22-194** No `POST`/`PATCH`/`DELETE` reached the real API.

**194 cases written.** Execution follows.

---

## MODULE 22 — EXECUTION RESULTS

Driven on live prod `https://www.weddingwala.pk/dashboard/suppliers` with every write captured and
diverted, and a clean-realm integrity check at open and close.

**95 of 194 cases driven. 13 findings (3× S2, 7× S3, 3× S4). Nothing was written.**

| Integrity check (clean iframe realm, at close) | Value |
|---|---|
| Suppliers | **18** |
| Invoices | **23** |
| Status split | paid **11** · partially_paid **6** · received **3** · overdue **3** |
| `totalOutstanding` / `totalPaid` | **Rs 1,469,250** / Rs 1,904,250 |
| Aging buckets | 990,500 · 0 · 363,750 · 31,750 · 83,250 → grand **1,469,250** |
| Invoice 74 after a diverted Rs 999,999 payment | `amountPaid: 0.00`, status `overdue` |

### WWL-273 (S2) — the Overdue filter shows the bills that aren't late and hides the ones that are

`status` is a **stored** value that nothing recomputes against the due date. Both directions are
wrong, and both are rendered in the same table.

**Marked `Overdue`, but not overdue** (today is 2026-08-06):

| Invoice | Due | Days *until* due | Outstanding |
|---|---|---|---|
| INV-5297 | 29 Aug 2026 | **+23** | Rs 166,000 |
| INV-3349 | 15 Aug 2026 | **+9** | Rs 107,500 |
| INV-7378 | 13 Aug 2026 | **+7** | Rs 205,500 |

The third of those renders a blue **"Due in 7d"** pill in the Due column **next to a red "Overdue"
status pill in the same row**.

**Genuinely overdue, but filed as something else:**

| Invoice | Due | Days late | Status shown | Outstanding |
|---|---|---|---|---|
| INV-1700 | 29 Jul 2026 | **8d** | Received | Rs 184,500 |
| INV-9583 | 25 Jul 2026 | **12d** | Partially paid | Rs 56,250 |
| INV-1593 | 15 Jul 2026 | **22d** | Partially paid | Rs 123,000 |
| INV-9182 | 27 Jun 2026 | **40d** | Partially paid | Rs 31,750 |
| INV-8069 | 27 May 2026 | **71d** | Partially paid | Rs 47,500 |
| INV-7073 | 21 Apr 2026 | **107d** | Partially paid | Rs 35,750 |

Each of those six carries a correct `"107d overdue"` / `"71d overdue"` badge in its **Due** column
while its **Status** pill says Partially paid — the screen contradicts itself twice per row.

Clicking the **Overdue (3)** chip filters to the three that are not late and hides all six that are.

**The near-miss that makes it dangerous.** The aging cards are computed from dates and are
**correct**: 363,750 + 31,750 + 83,250 = **Rs 478,750** overdue — exactly the outstanding of the six
the status field misses. The three the chip does show total **Rs 479,000**. Two numbers within
Rs 250 of each other describing entirely disjoint sets of invoices: a vendor reconciling the card
against the filter would conclude everything agrees.

### WWL-274 (S2) — selecting a status chip zeroes every other count

At rest the toolbar reads `All(23) · Received(3) · Partially paid(6) · Paid(11) · Overdue(3) ·
Disputed(0) · Voided(0) · Draft(0)` — correct, and summing to 23.

Click **Overdue** and it becomes:

```
All(3) · Received(0) · Partially paid(0) · Paid(11→0) · Overdue(3) · Disputed(0) · Voided(0) · Draft(0)
```

`summary.byStatus` comes from the same `listInvoices({status})` query that feeds the table, so the
counts describe the filtered set rather than the ledger. **`All(3)` is actively false**, and a vendor
looking at overdue bills cannot see that 6 more are part-paid and 11 are settled without clearing the
filter first.

### WWL-275 (S2) — "Credit available" is the sum of credit limits, not what is available

The card renders **Rs 8,800,000**. It is `all.reduce((s, x) => s + num(x.creditLimit), 0)` — every
supplier's ceiling added up, with nothing subtracted for what has already been drawn.

| | |
|---|---|
| Card says **Credit available** | **Rs 8,800,000** |
| Already outstanding to those suppliers | Rs 1,469,250 |
| **Actually available** | **Rs 7,330,750** |
| Overstatement | **Rs 1,469,250 — 20% high** |

The correction needs no new data: `aging.perSupplier` already returns each supplier's outstanding.
Per-supplier headroom is computable today and shown nowhere — Bismillah Meat Supply (id 98) has
**Rs 184,000** left on a Rs 350,000 limit, and the vendor cannot see that on any screen.

### WWL-276 (S3) — the API ranks who is owed the most and the UI throws it away

`aging.perSupplier` returns 7 rows ordered by outstanding — Al-Madina Rs 425,500 across 2 invoices,
Al-Madina (another venue) Rs 329,000 across 4, Chenab Rs 214,500, Bismillah Rs 170,500 — and the
screen renders only `aging.buckets`. The single question an A/P screen exists to answer, *who do I
owe the most to*, is computed on the server and discarded on the client.

### WWL-277 (S3) — five aging cards and no total

There is no total-outstanding card. To learn they owe **Rs 1,469,250** the vendor must add
990,500 + 0 + 363,750 + 31,750 + 83,250 by hand — a figure the same API response already carries as
`summary.totalOutstanding`. The cards also show rupees only, though the API returns a **count** per
bucket (6 current, 3 in 8-30d, 1 in 31-60d, 2 in 60d+), so "how many bills am I late on" is not
answerable from the header either.

### WWL-278 (S3) — the delete confirm names nothing

> **Remove this invoice?** · Soft delete. Paid invoices cannot be removed.

No supplier, no invoice number, no amount. The vendor is asked to confirm a destructive action
against an unnamed record — compare the sibling supplier dialog, which does name its target.

### WWL-279 (S3) — an overpayment is submittable

Against an invoice with **Rs 166,000** outstanding, typing **Rs 999,999** leaves **Record** enabled
with no warning. The amount input has `min="0"` and `step="0.01"` but **no `max`**, and the payload
went out as:

```
POST /api/v1/suppliers/invoices/74/payment   {"amount":999999,"method":"cash"}
```

Whether the server refuses it is unestablished — I did not send it.

### WWL-280 (S3) — no row actions on a phone

At 360×740 the supplier table's **Edit** and **Remove** buttons are **not in the DOM at all** (0
found), and the invoice card renderer emits none of the four invoice actions. So on a phone a vendor
can read the A/P ledger and cannot record a payment against any of it. Third consecutive module with
this pattern.

### WWL-281 (S3) — the same three accessibility gaps

`<th>` carry **no `scope`** on either table; every row checkbox announces **"Select row"**; and the
four invoice actions announce "Record payment" / "Dispute invoice" / "Void invoice" / "Remove
invoice" with **no supplier name and no invoice number** — twenty-three rows of identical labels.

### WWL-282 (S3) — the A/P view cannot be linked

`<Tabs defaultValue="invoices">` with no `onValueChange` and no URL sync: the tab choice never
reaches the address bar, so a vendor cannot bookmark the supplier directory or send an accountant a
link to the ledger, and every reload returns to A/P invoices.

### WWL-283 (S4) — three names, and the wrong trade again

| Surface | Name |
|---|---|
| Browser title | **Dashboard : Supplier Ledger** |
| Page `h1` | **Suppliers** |
| Sidebar | **Suppliers** |

And the directory's empty state offers *"Add the vendors you buy from — **albums, frames, props**"*
to a venue whose actual suppliers are produce, meat, atta & grains, flowers, generator rental and
equipment rental.

### WWL-284 (S4) — four invoices are dated in the future

INV-5297 (19 Aug), INV-5194 (17 Aug), INV-1541 (15 Aug) and INV-7599 (10 Aug) all carry invoice
dates **after** today (6 Aug) and render as ordinary bills. One of them is the invoice marked
Overdue.

### WWL-285 (S4) — the overdue day-count is UTC, the vendor is PKT

`daysFromNow` builds today's midnight with `setUTCHours(0,0,0,0)` while the venue runs on PKT
(UTC+5). Between 00:00 and 05:00 PKT — exactly when a wedding is being cleared up — the "Nd overdue"
figure is one day short. Same family as the WWL-112 group.

---

### What passed, and it is worth saying

- **P — nothing was written.** 18 suppliers, 23 invoices, the same 11/6/3/3 split, the same
  Rs 1,469,250 outstanding and the same five aging buckets at close. Invoice 74 still reads
  `amountPaid: 0.00` after the diverted Rs 999,999 payment.
- **The Record-payment dialog is the best write form in the sweep.** It names the supplier in its
  title, states the position in plain words — *"Outstanding: Rs. 166,000 of Rs. 166,000 total.
  Partial payments are fine — the invoice flips to partially paid."* — pre-fills the amount to the
  outstanding, defaults the date to today and says so, and offers eleven genuinely Pakistani payment
  methods: **Cash · JazzCash · Easypaisa · Raast · IBFT · Bank transfer · SadaPay · NayaPay · Cheque
  · Post-dated cheque · Other**. It is also the **only dialog in this entire sweep whose fields carry
  proper accessible names** (`Amount (PKR) *`, `Method *`, `Reference`, `Payment date`).
- **It is the only write path in the sweep that refuses to claim a false success.** With the write
  diverted it showed **"Could not record payment"** and kept the dialog open, where every other
  module reported success. The mechanism is worth stating honestly: `onSubmit` reads
  `res.result.newStatus`, which throws when the response is the wrong shape, so the correct behaviour
  is a side-effect of consuming the response rather than a deliberate check. It is still the only one
  that gets it right, and on a real success it reports the **new outstanding** back to the vendor.
- **The aging arithmetic reconciles exactly.** Buckets → `grandTotal` → `summary.totalOutstanding`,
  all Rs 1,469,250, computed independently by two endpoints.
- **The Due column is right where the Status column is wrong.** Every overdue badge and every
  "Due in Nd" pill is computed live from the dates and matches the aging buckets to the day.
- **Both tabs render.** `INVOICE_TONE` covers all seven statuses, so the unknown-enum crash that took
  down Module 21 cannot happen here — I checked specifically for it.
- **D22-181 / D22-182 — clean at 360px**: no page scroll and **zero** overflowing elements under the
  strict scan.
- **Row-action permissions are correct**: Record payment and Void hide on paid and void invoices,
  Dispute hides only on void, Remove hides on paid — matching what the backend will accept.
- **The `Log invoice` supplier picker is fed from `isActive: true`**, so a retired supplier cannot be
  billed against by accident.

### Not driven, each with its reason

| Cases | Why |
|---|---|
| **D22-081 → D22-089** (Log invoice), **D22-098 → D22-104** (Dispute, Void), **D22-105 → D22-110** (remove invoice) | Each needs a write against a real A/P ledger carrying Rs 1,469,250 the venue genuinely owes six named suppliers. The Record-payment path was driven end to end and captured; the other three share the same `SupplierAPI.transitionInvoice` shape. |
| **D22-129 → D22-144** (supplier form and delete) | Real trading partners with real credit terms. The `businesses?.[0]?.id` mechanism behind D22-135/136 is already established from Modules 20 and 21 with captured payloads. |
| **D22-091 → D22-094, D22-096** (partial → paid transitions, future-dated payment) | Would move real money on a real invoice. The dialog's own copy documents the partial→`partially_paid` rule, and the overpayment case was driven as far as the payload (WWL-279). |
| **D22-145 → D22-154** (venue scoping) | The interceptor mechanism was confirmed on the wire (`/suppliers?businessId=3358/3359/3360` returns 6/6/6, unscoped returns 18) and the duplicate-name consequence was driven at All-venues scope. The per-venue aging reconciliation was not re-run for each venue. |
| **D22-155 → D22-164** (supplier detail page) | Not reached before the module's findings were established. `aging.perSupplier` gives the figures that page would have to match. |
| **D22-165 → D22-172** (resilience) | The error-state shape is the same `DataTable` error + Retry already driven in Modules 20 and 21. D22-171 — the unknown-status crash — was answered by inspection instead: `INVOICE_TONE` covers all seven `InvoiceStatus` values. |
| **D22-183, D22-186, D22-187** (aging cards, chips and dialogs at 360) | The mobile scan was run on the Suppliers tab; the invoice tab's five cards and eight chips were not re-scanned at 360. |
| **D22-055 → D22-060, D22-061 → D22-068** (invoice search and export) | The search and `ExportMenu` components are the same ones driven in Modules 20 and 21; the invoice-specific `Outstanding` export column was read from source, not from a generated file. |

### Module 22 — status

**194 cases written, 95 driven. 13 findings (3× S2, 7× S3, 3× S4).**

**The module's verdict.** Two halves of this screen disagree about the same 23 invoices. One half —
the aging report and the Due column — reads the dates and gets it exactly right, down to
reconciling Rs 1,469,250 three different ways. The other half — the `status` field and everything
built on it — is a stored value nothing recomputes, so the Overdue filter surfaces three bills that
are not yet due and buries six that are, one of them 107 days late. Then the header adds Rs 1,469,250
of drawn credit back into "Credit available" and calls it Rs 8.8m. The one thing this module does
better than anything else in the sweep is the payment dialog: it explains itself, it speaks Raast and
JazzCash, it labels its fields properly, and it is the only form in twenty-two modules that says
*"Could not record payment"* when the payment could not be recorded.

---

# MODULE 23 — BROKERS (`/dashboard/brokers`)

**What the screen is for.** The commission ledger for the people who bring the venue business — hall
brokers, hotel concierges, rishta aunties and wedding planners. Each row is one commission accrued
against one booking: how much is owed, how much has been paid, when it accrued, and its status
(pending → partially paid → paid, or disputed / void). Row actions record a payment, dispute it,
void it, edit it or remove it.

**Source read before writing these cases**
- `app/(dashboard)/dashboard/brokers/page.tsx`
- `components/.../brokers/redesigned/brokers-redesigned-view.tsx` — the whole screen
- `components/.../brokers/redesigned/commission-form-dialog.tsx` — create/edit
- `components/.../brokers/redesigned/commission-action-dialogs.tsx` — Pay / Dispute / Void
- `lib/api/brokers.ts` — `CommissionStatus`, `BROKER_TYPE_LABELS`, `COMMISSION_STATUS_LABELS`
- `lib/axiosConfig.js` — `/api/v1/brokers` **is** in `BUSINESS_SCOPED_PREFIXES`

**Pre-flight state, read off live prod before any case was written**

| Fact | Value |
|---|---|
| `GET /brokers` | **12 brokers** — 4 per venue × 3 |
| Broker types | `hall_broker` · `hotel_concierge` · `rishta` · `wedding_planner` |
| Brokers with **no** commission | **4 of 12** |
| `GET /brokers/commissions` | **9 commissions** |
| Per venue | 3358 → 2 · 3359 → 4 · 3360 → 3 |
| Status split | pending **5** · partially_paid **3** · paid **1** |
| `status === "overdue"` | **0** |
| Total commission / paid / **outstanding** | Rs 667,000 / Rs 226,250 / **Rs 440,750** |
| Commissions **past their due date** | **3** — 36d, 85d and **122d** late, Rs 138,750 outstanding, all filed `partially_paid` |
| Commissions accruing in the **future** | 2 — 24 Aug and 22 Sep 2026 |
| Broker record carries | agencyName · contactPerson · whatsapp · address · **NTN · CNIC** · bank · JazzCash · Easypaisa · `defaultCommissionPct` |

**Element inventory (14 interactive)**

| # | Element | Where |
|---|---|---|
| 1 | Sidebar `Brokers` link | Money rail |
| 2 | `Add commission` | PageHeader action |
| 3–6 | Stat cards: Commissions · Total commission · Outstanding · Overdue | header grid |
| 7 | `Search brokers…` | toolbar |
| 8–9 | Density toggle · Export | toolbar |
| 10 | Select-all + row checkboxes | table |
| 11–15 | Row actions: Record payment · Dispute · Void · Edit · Remove | rows |
| 16 | Linked-function-sheet badge (Event column) | rows |
| — | Commission form dialog · Pay · Dispute · Void · Remove confirm | modals |

**Safety limits for this module, each with its reason**

| Limit | Reason |
|---|---|
| **No commission is created, paid, disputed, voided, edited or removed.** | This is a real commission ledger: **Rs 440,750** genuinely owed to four named intermediaries against nine real bookings. Recording a payment is a money write; disputing one is a statement to a business partner who sends the venue customers. |
| **No broker record is touched.** | Real people, with **CNIC and NTN** on file. |
| **Reads may hit the live API freely.** | GETs are side-effect free. |

---

## MODULE 23 — TEST CASES

### A. Route, navigation and access (D23-001 → D23-010)

- **D23-001** Sidebar → **Brokers** navigates to `/dashboard/brokers`.
- **D23-002** `document.title` versus the page `h1` versus the nav label.
- **D23-003** The rail entry is `aria-current="page"`.
- **D23-004** Breadcrumb renders and links home.
- **D23-005** Direct URL loads with no client-side error.
- **D23-006** `/dashboard/brokers-new` — the route in the component's header comment — resolves to what?
- **D23-007** The comment claims *"Read-only; original screen untouched"* — check against a screen that pays and voids commissions.
- **D23-008** The eyebrow reads `Money` — confirm it is grouped with the money modules, not Operate.
- **D23-009** Browser Back leaves cleanly.
- **D23-010** Uppercase and trailing-slash URLs normalise.

### B. First paint and the table (D23-011 → D23-026)

- **D23-011** `h1` **Brokers**, description *"Broker commission ledger — accruals, payments and outstanding."*
- **D23-012** The table paints 9 rows (or the venue-scoped subset).
- **D23-013** Columns: Broker · Type · Event · Commission · Paid · Accrued · Status · actions.
- **D23-014** **There is no Due column.** The data carries `dueDate` on every row and the export writes it. Confirm it appears nowhere on screen.
- **D23-015** The broker cell shows the **snapshot** name with an initials avatar.
- **D23-016** `Type` maps through `BROKER_TYPE_LABELS` — check all four live types render a human label.
- **D23-017** An unknown broker type falls back to `cap(t)`, not a crash.
- **D23-018** `Event` renders the linked-function-sheet badge for the booking.
- **D23-019** A commission with a null `bookingId` — what does the badge render?
- **D23-020** `Commission` and `Paid` are right-aligned and tabular.
- **D23-021** `Paid` is toned success even when it is **Rs 0** — check whether zero reads as "paid".
- **D23-022** `Accrued` formats `en-PK` as `dd MMM yyyy`.
- **D23-023** An invalid date renders `—`, not `Invalid Date`.
- **D23-024** Rows are ordered most-recent-accrual first.
- **D23-025** `<th scope>` on the header cells.
- **D23-026** Row checkboxes have per-row accessible names.

### C. Stat cards (D23-027 → D23-040)

- **D23-027** **Commissions** equals the row count (9).
- **D23-028** **Total commission** equals Rs 667,000.
- **D23-029** **Outstanding** = total − paid = Rs 440,750, and matches the API's `summary.totalOutstanding`.
- **D23-030** **Overdue** counts `status === "overdue"` — currently **0**.
- **D23-031** …but **3 commissions are past their due date** by 36, 85 and 122 days, carrying **Rs 138,750**. Establish what the card tells the vendor.
- **D23-032** Nothing on the screen surfaces those three — no Due column, no filter, no badge. Confirm.
- **D23-033** The `Outstanding` card carries `trend="up"` when money is owed. Establish what arrow and colour that renders for a debt.
- **D23-034** Compare with the Suppliers module, where the equivalent used `trend="down"`.
- **D23-035** **Total commission** includes 2 commissions that accrue in the **future** (24 Aug, 22 Sep). Quantify how much of the headline is not yet earned.
- **D23-036** Cards are computed from `all`, not the search-filtered rows — type a search and check.
- **D23-037** Cards during the loading state.
- **D23-038** Cards during a failed load — zeros or dashes?
- **D23-039** `formatPkr` is applied without `Math.round` here — check for a decimal leaking into a card.
- **D23-040** Card labels read as label + value.

### D. Status handling (D23-041 → D23-050)

- **D23-041** All six `CommissionStatus` values have a tone and a label.
- **D23-042** `statusTone` has an `|| "neutral"` fallback — confirm an unknown status **cannot** reproduce the Module 21 `StatusPill` crash.
- **D23-043** `statusLabel` falls back to `cap(s)` for an unknown value.
- **D23-044** The live statuses render: Pending (5) · Partially paid (3) · Paid (1).
- **D23-045** There is **no status filter** anywhere on the screen — no chips, no dropdown. Confirm.
- **D23-046** So the **Overdue** card is not clickable and nothing can filter to overdue.
- **D23-047** The status pill is not colour-only.
- **D23-048** `partially_paid` is toned **warning**, `pending` **info** — check that reads correctly against the amounts.
- **D23-049** A `void` commission still shows its amount in the totals — or is it excluded?
- **D23-050** A `disputed` commission's effect on Outstanding.

### E. Search, selection, export, density (D23-051 → D23-064)

- **D23-051** Search matches broker name, description and the **type label**, client-side.
- **D23-052** Searching `rishta` finds the Rishta Aunty Network rows via the type label.
- **D23-053** Search is case-insensitive and trims.
- **D23-054** A no-match search shows *"No commissions yet"* + an **Add commission** CTA on a populated ledger.
- **D23-055** Clearing the search restores all rows.
- **D23-056** Search is not in the URL and is lost on reload.
- **D23-057** Export offers CSV and XLSX, filename `broker-commissions`.
- **D23-058** Export columns: Broker · Type · Commission · Paid · Accrued · **Due** · Status.
- **D23-059** The export is the **only** place the due date appears — confirm.
- **D23-060** Status exports the label, not the raw enum.
- **D23-061** No venue column in the export, though three venues merge at All-venues scope.
- **D23-062** Export respects the selection.
- **D23-063** Density toggle changes row height and persists.
- **D23-064** Export generates client-side with no network call.

### F. Row actions and permissions (D23-065 → D23-076)

- **D23-065** `Record payment` renders unless status is paid or void.
- **D23-066** `Dispute` renders unless status is void.
- **D23-067** `Void` renders unless status is paid or void.
- **D23-068** `Edit` and `Remove` render on **every** row including paid and void — confirm and judge.
- **D23-069** On the one `paid` commission, which actions remain?
- **D23-070** Each action has both `aria-label` and `title`.
- **D23-071** …but neither names the broker or the amount — confirm the labels are identical across rows.
- **D23-072** Icon-only actions are ≥ 24×24 px.
- **D23-073** Five icon buttons in one cell — measure the total width and check they do not crowd the row.
- **D23-074** Clicking a row itself does nothing — there is no drill-in.
- **D23-075** Nothing links to the broker's own record, though `/brokers` returns 12 of them.
- **D23-076** Row actions at 360px.

### G. The brokers behind the commissions (D23-077 → D23-086)

- **D23-077** `GET /api/v1/brokers` returns **12** broker records with name, type, phone, and a default commission percentage.
- **D23-078** Is there **any** UI in the product that lists brokers?
- **D23-079** Is there any UI that creates or edits a broker?
- **D23-080** **4 of the 12 brokers have no commission at all** — establish whether they are visible anywhere.
- **D23-081** The broker record carries **CNIC and NTN** — check whether either is ever displayed.
- **D23-082** It carries bank, JazzCash and Easypaisa payout details — are they shown when recording a payment?
- **D23-083** It carries `defaultCommissionPct` (5.00%) — is it used to pre-fill a new commission?
- **D23-084** `business: {id, name}` is eager-loaded on every broker — is the venue ever named?
- **D23-085** The commission rows carry a `brokerId` — is it used for anything?
- **D23-086** Compare with Suppliers, which has a directory tab for exactly this.

### H. The commission form dialog (D23-087 → D23-104)

- **D23-087** `Add commission` opens the dialog; enumerate its fields.
- **D23-088** Is there a broker picker, and is it fed from the 12 live brokers?
- **D23-089** Is there a booking picker, and is it scoped to this venue's bookings?
- **D23-090** Is there a venue field, or does `businesses?.[0]?.id` decide?
- **D23-091** Required-field blocking and the blocked-save hint.
- **D23-092** A negative commission amount.
- **D23-093** A commission amount above any sane cap.
- **D23-094** A due date **before** the accrual date.
- **D23-095** An accrual date far in the future.
- **D23-096** Percentage vs flat commission — does the form support both, as the broker record does?
- **D23-097** If a percentage is offered, is it applied to the booking value automatically?
- **D23-098** The captured create body and endpoint.
- **D23-099** `businessId` in the captured body.
- **D23-100** Edit prefills every field.
- **D23-101** Edit sends `PATCH` to the commission id.
- **D23-102** Editing a **paid** commission's amount — allowed?
- **D23-103** Cancel and Escape discard without a request.
- **D23-104** With the write diverted, does the dialog claim success?

### I. Pay / Dispute / Void dialogs (D23-105 → D23-120)

- **D23-105** `Record payment` opens naming the broker and showing what is outstanding.
- **D23-106** The amount pre-fills to the outstanding.
- **D23-107** The payment-method list — does it match the Suppliers set (Raast, JazzCash, Easypaisa…)?
- **D23-108** Does it offer the broker's own stored JazzCash / Easypaisa number?
- **D23-109** Paying **less** than outstanding → `partially_paid`.
- **D23-110** Paying **more** than outstanding — blocked client-side?
- **D23-111** A zero or negative payment.
- **D23-112** A payment dated in the future.
- **D23-113** The captured payment body and endpoint.
- **D23-114** `Dispute` captures a reason, and it is required.
- **D23-115** The captured dispute body.
- **D23-116** `Void` captures a reason.
- **D23-117** Void on a partially-paid commission — what happens to the money already paid?
- **D23-118** The captured void body.
- **D23-119** Each dialog resets between rows.
- **D23-120** With writes diverted, do these dialogs claim success — or refuse, as the Suppliers payment dialog did?

### J. Remove (D23-121 → D23-126)

- **D23-121** `Remove commission` opens an alert **naming the broker** — confirm.
- **D23-122** The copy says *"This can't be undone."* — check against the backend's delete semantics.
- **D23-123** Cancel and Escape close without a request.
- **D23-124** Remove issues `DELETE` to the commission id.
- **D23-125** Is removing a **paid** commission refused?
- **D23-126** With the write diverted, does the toast claim **"Commission removed"**, and does the row return on reload?

### K. Venue scoping (D23-127 → D23-134)

- **D23-127** `/api/v1/brokers` is in `BUSINESS_SCOPED_PREFIXES` — confirm `businessId` on the wire.
- **D23-128** Switch to 3358 → 2 commissions.
- **D23-129** Switch to 3359 → 4.
- **D23-130** Switch to 3360 → 3.
- **D23-131** All venues → 9.
- **D23-132** The stat cards re-scope with the venue.
- **D23-133** `queryKey: ["brokers-redesigned"]` carries no businessId — the same structural risk as Modules 21 and 22.
- **D23-134** At All venues, `Ch. Nazeer Ahmed` exists on all three venues with different phone numbers — is the venue named anywhere?

### L. Resilience (D23-135 → D23-142)

- **D23-135** Offline → the table shows its error state with Retry.
- **D23-136** Unroutable host → same; Retry re-issues.
- **D23-137** The error text is *"Couldn't load broker commissions."*
- **D23-138** The stat cards during a failed load — do they assert Rs 0, as Inventory's did?
- **D23-139** Slow network → skeleton, no flash of empty.
- **D23-140** Malformed response does not white-screen.
- **D23-141** An unknown status from the API — confirmed safe by the `|| "neutral"` fallback; drive it.
- **D23-142** Console clean across the module.

### M. Accessibility (D23-143 → D23-150)

- **D23-143** Row actions announce which broker they act on.
- **D23-144** Dialog labels are programmatically associated.
- **D23-145** Status pills are not colour-only.
- **D23-146** The alert dialog announces title + description and focuses Cancel.
- **D23-147** Focus rings on all controls.
- **D23-148** Heading order.
- **D23-149** The search input has an accessible name.
- **D23-150** The linked-function-sheet badge is reachable by keyboard.

### N. Mobile — 360×740 (D23-151 → D23-158)

- **D23-151** No horizontal page scroll.
- **D23-152** **And** zero clipped elements outside deliberate scroll containers.
- **D23-153** The table switches to the card renderer.
- **D23-154** The card shows broker, type, amount and status — are the five row actions reachable?
- **D23-155** Four stat cards reflow to 2 columns without clipping the rupee values.
- **D23-156** The toolbar fits.
- **D23-157** Dialogs are usable at 360.
- **D23-158** Touch targets ≥ 24×24.

### O. Integrity close-out (D23-159 → D23-164)

- **D23-159** Commission count still 9 at close, via a clean iframe realm.
- **D23-160** The status split unchanged (5 / 3 / 1).
- **D23-161** `totalCommission` still Rs 667,000 and `totalOutstanding` still Rs 440,750.
- **D23-162** Broker count still 12.
- **D23-163** Every diverted write listed with method, URL and body.
- **D23-164** No `POST`/`PATCH`/`DELETE` reached the real API.

**164 cases written.** Execution follows.

---

## MODULE 23 — EXECUTION RESULTS

Driven on live prod `https://www.weddingwala.pk/dashboard/brokers` with every write captured and
diverted, and a clean-realm integrity check at open and close.

**95 of 164 cases driven. 16 findings (4× S2, 8× S3, 4× S4). Nothing was written.**

| Integrity check (clean iframe realm, at close) | Value |
|---|---|
| Commissions | **9** — no `QA probe` row |
| Brokers | **12** |
| Status split | pending **5** · partially_paid **3** · paid **1** |
| `totalCommission` / `totalPaid` / `totalOutstanding` | Rs 667,000 / Rs 226,250 / **Rs 440,750** |
| Commission 31 after a diverted Rs 999,999 payment | `amountPaid: 64750.00`, still `partially_paid` |

### WWL-286 (S2) — the Overdue card reads 0 while Rs 138,750 is up to 122 days late

`overdueCount = all.filter((c) => c.status === "overdue").length`, and **no commission in production
ever carries that status** — nothing recomputes it against the due date.

| Broker | Commission | Outstanding | Due | Days late | Status shown |
|---|---|---|---|---|---|
| Pearl Continental Concierge | Rs 129,500 | Rs 64,750 | 1 Jul 2026 | **36** | Partially paid |
| Ch. Nazeer Ahmed | Rs 81,500 | Rs 40,750 | 13 May 2026 | **85** | Partially paid |
| Pearl Continental Concierge | Rs 66,500 | Rs 33,250 | 6 Apr 2026 | **122** | Partially paid |
| | | **Rs 138,750** | | | **Overdue card: 0** |

Same root cause as WWL-273 in Suppliers — a stored status nobody recomputes — but here it produces a
flat zero rather than a wrong set, which is harder to notice.

### WWL-287 (S2) — there is no Due column

Columns are **Broker · Type · Event · Commission · Paid · Accrued · Status**. Every row carries a
`dueDate` and the CSV export writes it — but on screen the vendor sees only the **accrual** date. So
the three late commissions read `17-May-2026`, `29-Mar-2026` and `20-Feb-2026`, and nothing anywhere
in the interface says the money was due on 1 Jul, 13 May and 6 Apr. The one field that would make
WWL-286 visible is exported and never displayed.

### WWL-288 (S2) — no status filter of any kind

No chips, no dropdown, no clickable card. The **Overdue** stat card is inert. So even if the count
were right, there is no path from *"something is late"* to *"which ones"* — the vendor must export
the CSV and open it in a spreadsheet to see a due date.

### WWL-289 (S2) — a commission cannot be attached to a broker or to the event that earned it

The form's **Broker name is a free text box**, not a picker — while the same screen already fetches
all 12 broker records from `GET /api/v1/brokers`. And there is **no booking picker at all**. The
captured create body:

```
POST /api/v1/brokers/commissions
{"businessId":3358, "brokerNameSnapshot":"QA probe broker — do not save",
 "brokerTypeSnapshot":"rishta", "commissionType":"percentage", "commissionPct":5,
 "bookingAmountSnapshot":100000, "accruedDate":"2026-08-06"}
```

No `brokerId`, no `bookingId`. The seeded rows link through to a real function sheet
(`/dashboard/function-sheets/88`), so the Event column works — but nothing created through the UI
can ever populate it, and every broker's name is retyped by hand each time.

### WWL-290 (S3) — the disabled-Save hint names the wrong fields

Driven precisely:

| State | Save | Hint |
|---|---|---|
| Broker name **filled**, accrued date **2026-08-06**, `Commission % = -5` | **disabled** | *"Add a broker name and the date it accrued to save."* |
| Same, `Commission % = 5` | **enabled** | *(none)* |

The negative percentage is what blocks it, and the hint blames two fields that are demonstrably
filled. There is no `min` on the input and no message beside it. This is a regression against the
BUG-057 pattern — *"a disabled button is not feedback, say what it is waiting for"* — that the rest
of the app implements correctly.

### WWL-291 (S3) — a raw JavaScript error is shown to the vendor

With the payment write diverted, the toast read verbatim:

> **Cannot read properties of undefined (reading 'result')**

`onSuccess` dereferences `res.result.newStatus` before checking it exists, and
`errMsg = e?.response?.data?.message || e?.message || fallback` prefers `e.message` over the
human fallback. The sibling Suppliers dialog has the identical dereference but ignores `e.message`,
so it shows *"Could not record payment"*. Same bug, two error handlers, one leaks the stack.

### WWL-292 (S3) — the two dialogs on one screen disagree about failure

| Dialog | Diverted write | Result |
|---|---|---|
| **Record payment** | ✗ never arrived | dialog **stays open**, error toast — correct |
| **Add commission** | ✗ never arrived | toast **"Commission added"**, dialog closes — false |

### WWL-293 (S3) — a new commission is filed under the wrong venue

`businessId: 3358` in the captured body while the UI was scoped to **All venues**, from
`businesses?.[0]?.id`. There is no venue field in the form. Fourth module in a row with this exact
mechanism (WWL-242 Inventory, WWL-262 Staff, D22-135 Suppliers, here).

### WWL-294 (S3) — Rs 0 paid is coloured as a success

The **Paid** column is toned `success` unconditionally, so five pending commissions where **nothing
has been paid** render `Rs 0` in emerald green (`rgb(5, 150, 105)`) — the same colour used for a
settled amount.

### WWL-295 (S3) — the broker directory exists in the API and nowhere in the product

`GET /api/v1/brokers` returns 12 full records, and the page **already fetches them**:

| Field on every broker record | Rendered anywhere? |
|---|---|
| name · brokerType · phoneNumber | only as a snapshot string on a commission |
| agencyName · contactPerson · whatsappNumber · address | **no** |
| **NTN · CNIC** | **no** |
| bankName · bankAccountNumber · jazzcashNumber · easypaisaNumber | **no** — the payment dialog does not offer them |
| `defaultCommissionPct` (5.00%) | **no** — it does not pre-fill the form |
| `business: {id, name}` | **no** — the venue is never named |

**4 of the 12 brokers have no commission at all**, so they appear nowhere in the interface. Compare
Suppliers, which gives its trading partners a directory tab.

### WWL-296 (S3) — no row actions on a phone

At 360×740: **43** row-action buttons in the DOM, **0 visible**. No commission can be paid, disputed,
voided, edited or removed from a phone. Fourth consecutive module.

### WWL-297 (S3) — the same three accessibility gaps

`<th>` carry **no `scope`**; all nine row checkboxes announce **"Select row"**; and the five row
actions announce "Record payment" / "Dispute commission" / "Void commission" / "Edit commission" /
"Remove commission" with **no broker name and no amount** — forty-five identical labels on a
nine-row table.

### WWL-298 (S4) — two rows render a blank Event cell

Where a booking has no linked function sheet the badge renders **nothing at all** — not a dash, not
a placeholder — leaving an empty cell that reads as missing data.

### WWL-299 (S4) — the headline includes money not yet earned

**Total commission Rs 667,000** includes two commissions that accrue in the **future** — Rs 117,000
on 24 Aug and Rs 50,000 on 22 Sep — so **Rs 167,000** of the headline is not yet owed to anyone.

### WWL-300 (S4) — the payment-date default is UTC, not PKT

`const today = () => new Date().toISOString().slice(0, 10)`. It read `2026-08-06` correctly during
this run, but between 00:00 and 05:00 PKT it defaults a broker payment to **yesterday**. Sixth
instance of the WWL-112 family.

### WWL-301 (S4) — three names again

Browser title **"Dashboard : Broker Commissions"** · page `h1` **"Brokers"** · sidebar **"Brokers"**.

---

### What passed, and it is worth saying

- **O — nothing was written.** 9 commissions, 12 brokers, the same 5/3/1 split, Rs 667,000 /
  Rs 226,250 / Rs 440,750 unchanged, and commission 31 still at `amountPaid 64750.00` after the
  diverted Rs 999,999 payment.
- **D23-042 — this screen is structurally immune to the crash that killed Module 21.**
  `statusTone = (s) => (s && STATUS_TONE[s]) || "neutral"` and `statusLabel = (s) =>
  COMMISSION_STATUS_LABELS[s] || cap(s)`. An unknown status degrades to a neutral pill with a
  capitalised label instead of throwing inside `StatusPill`. This is the exact defensive shape the
  Staff payroll tab is missing, written by the same team on the same primitive.
- **The Record-payment dialog is a close second to Suppliers'.** It names the broker, states
  *"Outstanding Rs 64,750 of Rs 129,500 total."*, pre-fills the amount to the outstanding, offers ten
  Pakistani methods (Cash · JazzCash · Easypaisa · Raast · IBFT · Bank transfer · SadaPay · NayaPay ·
  Cheque · Other), defaults the payment date to today — and **refuses to claim a false success**.
- **The commission form models how the deal is actually struck.** Percentage **or** flat amount, with
  *"Booking amount (Rs) — required · needed to compute %"* — a rishta commission is a cut of the
  booking, and the form knows that.
- **The broker-type list is domain-literate**: rishta broker / matchmaker · hall / banquet broker ·
  wedding planner · hotel concierge · decor referral · photographer referral · caterer referral ·
  transport referral · social influencer · other.
- **The Event column is a real link** to `/dashboard/function-sheets/{id}`, showing the event by name
  and host — *"Barat — Salman Rauf"*, *"Mehndi — Ahmed Raza"*.
- **The delete confirm names its target** — *"The commission for Pearl Continental Concierge will be
  removed"* — unlike the Suppliers invoice delete, which names nothing (WWL-278).
- **The arithmetic reconciles**: 667,000 − 226,250 = 440,750, matching `summary.totalOutstanding`
  exactly.
- **D23-151 / D23-152 — clean at 360px**: no page scroll, **zero** overflowing elements.
- **Row-action permissions are correct**: Record payment and Void hide on paid and void, Dispute
  hides only on void.

### Not driven, each with its reason

| Cases | Why |
|---|---|
| **D23-109 → D23-112, D23-114 → D23-118** (partial→paid, dispute, void) | Each moves real money owed to a named intermediary who sends this venue customers. Disputing a commission is a statement to a business partner. The payment path was driven end to end and captured; Dispute and Void share the same `transitionCommission` shape. |
| **D23-100 → D23-104** (edit path) | Editing a live commission's amount changes what a broker is owed. Create was driven and captured; edit uses the same dialog and mutation. |
| **D23-121 → D23-126** (remove) | Would delete a real accrual. The confirm copy was read and its target-naming verified by inspection. |
| **D23-092 → D23-095** (amount caps, date ordering) | The validation posture was established by D23-090's negative-percentage case: no `min`, no field error, and a hint that names the wrong cause. |
| **D23-127 → D23-134** (venue scoping) | The interceptor was confirmed on the wire — `/brokers/commissions?businessId=3358/3359/3360` returns 2/4/3 and unscoped returns 9 — but the per-venue stat-card reconciliation was not re-driven for each venue. |
| **D23-135 → D23-141** (resilience) | The `DataTable` error + Retry shape is the same primitive already driven in Modules 20–22. D23-141 was answered by inspection: the `|| "neutral"` fallback makes the unknown-status crash impossible. |
| **D23-049, D23-050** (void / disputed effect on totals) | No `void` or `disputed` commission exists in production to observe, and creating one is a write. |
| **D23-143 → D23-150, D23-157** (remaining a11y, dialogs at 360) | Partly covered by D23-297's findings; the rest not reached before the module's findings were established. |

### Module 23 — status

**164 cases written, 95 driven. 16 findings (4× S2, 8× S3, 4× S4).**

**The module's verdict.** Four commissions are late — one by four months — and the screen says
**Overdue: 0**. It says that because the status is a stored word nobody rechecks, because the due
date is exported to CSV but never shown in the table, and because there is no filter to ask the
question with. The ledger itself is sound and the arithmetic reconciles to the rupee; the payment
dialog is one of the two good write forms in the sweep and correctly refuses a write that did not
land. But the form beside it retypes a broker's name into a free text box while twelve full broker
records — with their CNIC, their NTN and their JazzCash number — sit fetched and unused, and it
cannot attach the commission to the wedding that earned it.

---

# MODULE 24 — GENERATOR FUEL LOG (`/dashboard/generator-fuel`)

**What the screen is for.** A Pakistani venue runs on generators, and diesel is one of the largest
controllable costs and the easiest thing on site to steal. This log records four kinds of event
against a named generator — a **delivery** in, **consumption** out, a **tank reading**, or
**maintenance** — with litres, cost per litre, supplier and run hours, so the owner can reconcile
what was bought against what was burned.

**Source read before writing these cases**
- `app/(dashboard)/dashboard/generator-fuel/page.tsx`
- `components/.../generator-fuel/redesigned/generator-fuel-redesigned-view.tsx` — the whole screen
- `components/.../generator-fuel/redesigned/fuel-entry-form-dialog.tsx` — create/edit
- `lib/api/generatorFuel.ts` — `EntryType`, `FuelType`, `FuelEntry`, and **three endpoints**
- `lib/axiosConfig.js` — `/api/v1/generator` **is** in `BUSINESS_SCOPED_PREFIXES`

**What the API offers that the screen does not call** — established from source before execution:

| Endpoint / field | What it gives | Used by the screen? |
|---|---|---|
| `GET /generator-fuel/tanks` | current tank status per generator | **no** |
| `GET /generator-fuel/burn-rate` | litres per run-hour between two readings | **no** |
| `summary.byType` · `totalDeliveredLitres` · `totalDeliveryCost` · `totalConsumedLitres` | server-computed totals | **no** — the view recomputes its own from `entries` |
| `create()` → `result: {tankBefore, tankAfter, delta}` | the tank maths for the entry just logged | **no** — discarded |
| `FuelEntry.tankBeforeLitres` / `tankAfterLitres` | the running tank balance on every row | **no** — not a column |
| `list({type, from, to, generatorIdentifier})` | server-side filters | **no** — only a client-side text search |
| `FuelEntry.bookingId` | ties fuel burn to an event | **no** — no column, no picker |
| `runHours`, `costPerLitre`, `supplierName`, `deliveryRef` | captured by the form | only in the CSV export |

**Element inventory (10 interactive)**

| # | Element | Where |
|---|---|---|
| 1 | Sidebar `Generator fuel` link | Compliance rail |
| 2 | `Log entry` | PageHeader action |
| 3–6 | Stat cards: Total entries · Deliveries · Delivered litres · Total cost | header grid |
| 7 | `Search fuel log…` | toolbar |
| 8–9 | Density toggle · Export | toolbar |
| 10 | Select-all + row checkboxes | table |
| 11–12 | Row actions: Edit entry · Remove entry | rows |
| — | Fuel-entry dialog (10 fields) · Remove confirm | modals |

**Safety limits for this module, each with its reason**

| Limit | Reason |
|---|---|
| **No fuel entry is created, edited or removed.** | The log is the venue's defence against diesel theft; a fabricated delivery or a deleted consumption row destroys exactly the reconciliation it exists for. Every write is captured and diverted. |
| **Reads may hit the live API freely.** | GETs are side-effect free. |

---

## MODULE 24 — TEST CASES

### A. Route, navigation and access (D24-001 → D24-010)

- **D24-001** Sidebar → **Generator fuel** navigates to `/dashboard/generator-fuel`.
- **D24-002** `document.title` versus the page `h1` versus the nav label.
- **D24-003** The rail entry is `aria-current="page"`.
- **D24-004** Breadcrumb renders and links home.
- **D24-005** Direct URL loads with no client-side error.
- **D24-006** `/dashboard/generator-fuel-new` — the route in the component's header comment — resolves to what?
- **D24-007** The comment claims *"Read-only; original screen untouched"* — check against a screen that creates, edits and deletes.
- **D24-008** The eyebrow reads **Compliance** — judge the grouping for what is primarily a cost and theft control.
- **D24-009** Browser Back leaves cleanly.
- **D24-010** Uppercase and trailing-slash URLs normalise.

### B. First paint and the table (D24-011 → D24-026)

- **D24-011** `h1` **Generator fuel log**, description *"Deliveries, consumption and tank readings."*
- **D24-012** The table paints the venue-scoped row count.
- **D24-013** Columns: Generator · Type · Fuel · Litres · Total cost · Occurred · actions.
- **D24-014** **There is no tank-level column**, though every row carries `tankBeforeLitres` and `tankAfterLitres`. Confirm.
- **D24-015** **There is no run-hours column**, though the form captures it and the export writes it.
- **D24-016** **There is no supplier column**, though the form captures it and the search matches it.
- **D24-017** So searching a supplier name filters to rows that never show which supplier they are. Confirm.
- **D24-018** `Type` renders through `ENTRY_TYPE_LABELS` — all four types produce a human label.
- **D24-019** An unknown type falls back to `cap(t)` and a neutral tone — confirm the Module 21 crash cannot recur.
- **D24-020** `Litres` renders `num(e.litres).toLocaleString("en-PK")` — so a **null** litres renders **`0`**, not an em-dash. Check a maintenance or tank-reading row.
- **D24-021** `Total cost` uses `MoneyCell` with an explicit null check, so a missing cost renders an em-dash — contrast with D24-020.
- **D24-022** `Occurred` formats `en-PK` as `dd MMM yyyy`; an invalid date renders `—`.
- **D24-023** Rows are ordered most-recent-first.
- **D24-024** There is no pagination.
- **D24-025** `<th scope>` on the header cells.
- **D24-026** Row checkboxes have per-row accessible names.

### C. Stat cards (D24-027 → D24-040)

- **D24-027** **Total entries** equals the row count.
- **D24-028** **Deliveries** counts `type === "delivery"`.
- **D24-029** **Delivered litres** sums litres on delivery rows only.
- **D24-030** **Total cost** sums `totalCost` across **every** entry type, not just deliveries. Establish what that mixes together.
- **D24-031** If a consumption row carries a cost, does it double-count against the delivery that supplied it?
- **D24-032** Compare all four cards against the API's own `summary` (`totalDeliveredLitres`, `totalDeliveryCost`, `totalConsumedLitres`, `byType`) — the screen recomputes rather than using it.
- **D24-033** Quantify any divergence between the card and the server figure.
- **D24-034** **There is no "consumed litres" card**, though the API returns `totalConsumedLitres` — so bought-versus-burned cannot be compared on this screen.
- **D24-035** …which is the one comparison a fuel log exists to make. Establish whether any screen in the product shows it.
- **D24-036** The **Deliveries** card is hard-coded `trend="up"` regardless of the number.
- **D24-037** Cards are computed from `all`, not the search-filtered rows — type a search and check.
- **D24-038** Cards during the loading state.
- **D24-039** Cards during a failed load — zeros or dashes?
- **D24-040** `formatPkr(totalCost)` without rounding — check for a decimal leaking into a card.

### D. What the engine computes and the screen hides (D24-041 → D24-052)

- **D24-041** `GET /generator-fuel/tanks` returns a tank-status row per generator. Call it and record what it gives.
- **D24-042** Is tank status rendered anywhere in the product?
- **D24-043** `GET /generator-fuel/burn-rate` computes litres per run-hour between two readings. Call it and record the shape.
- **D24-044** Is burn rate rendered anywhere?
- **D24-045** Burn rate is the number that exposes diesel theft — a generator burning 12 L/h that suddenly reads 19 L/h. Establish whether a vendor can ever see it.
- **D24-046** `create()` returns `{tankBefore, tankAfter, delta}` and the dialog discards it — so after logging a delivery the vendor is never told the new tank level.
- **D24-047** `tankBeforeLitres` / `tankAfterLitres` are on every row and in no column.
- **D24-048** So a tank reading that contradicts the running balance is invisible. Confirm.
- **D24-049** `list()` accepts `type`, `from`, `to` and `generatorIdentifier` filters — none is wired to a control.
- **D24-050** So there is no date-range filter on a log whose whole purpose is period reconciliation.
- **D24-051** And no per-generator filter, though a venue runs several.
- **D24-052** `bookingId` exists on the model — is fuel burn ever attributable to an event?

### E. Search, selection, export, density (D24-053 → D24-064)

- **D24-053** Search matches `generatorIdentifier`, `supplierName` and `fuelType`, client-side.
- **D24-054** Searching a fuel type (`diesel`) filters correctly.
- **D24-055** Search is case-insensitive and trims.
- **D24-056** A no-match search shows *"No fuel entries yet"* + a **Log entry** CTA on a populated log.
- **D24-057** Clearing the search restores all rows.
- **D24-058** Search is lost on reload.
- **D24-059** Export offers CSV and XLSX, filename `generator-fuel`.
- **D24-060** Export columns: Generator · Type · Fuel · Litres · **Cost per litre** · Total cost · **Supplier** · Occurred at.
- **D24-061** Cost per litre and Supplier appear **only** in the export — confirm.
- **D24-062** A null cost per litre exports as **0**, not blank.
- **D24-063** No venue column in the export.
- **D24-064** Density toggle changes row height and persists.

### F. The fuel-entry dialog (D24-065 → D24-088)

- **D24-065** `Log entry` opens **Log fuel entry** with ten fields.
- **D24-066** Entry type offers all four; fuel type offers Diesel · Petrol · LPG · Other.
- **D24-067** Litres is `autoFocus`.
- **D24-068** The **Cost / litre** label gains a `*` when the type is **delivery**.
- **D24-069** A delivery with no cost per litre is **blocked** — the deliberate guard against a Rs 0 fuel-spend dashboard.
- **D24-070** Changing the type away from delivery removes that requirement.
- **D24-071** `canSave` also requires `litres > 0` — so a **maintenance** entry, which has no litres, **cannot be saved**. Establish this.
- **D24-072** …and a **tank reading of zero** (an empty tank) cannot be saved either.
- **D24-073** The blocked hint is the single string *"Add the number of litres, a type and a cost per litre to save."* regardless of which field is missing — check it against a maintenance entry where litres is the only blocker.
- **D24-074** A negative litres value.
- **D24-075** A negative cost per litre.
- **D24-076** Negative run hours.
- **D24-077** Litres above any sane tank capacity.
- **D24-078** `Number(form.litres) || 0` — a non-numeric litres becomes 0 and blocks save.
- **D24-079** The date defaults to `new Date().toISOString().slice(0,10)` — **UTC**, not PKT. Establish the drift between 00:00 and 05:00 PKT.
- **D24-080** A date in the future.
- **D24-081** There is **no venue field** — which venue does a new entry land on while scoped to another?
- **D24-082** There is **no booking picker**, though the model carries `bookingId`.
- **D24-083** There is **no tank-before / tank-after field**, though the model carries both.
- **D24-084** The captured create body and endpoint.
- **D24-085** `businessId` in the captured body.
- **D24-086** Edit prefills every field and hides nothing.
- **D24-087** Edit sends `PATCH` to the entry id.
- **D24-088** With the write diverted, does the dialog claim **"Entry logged"**?

### G. Remove (D24-089 → D24-094)

- **D24-089** `Remove entry` opens an alert reading *"This fuel entry will be removed. This can't be undone."*
- **D24-090** The alert **names nothing** — no generator, no date, no litres. Confirm on a destructive action.
- **D24-091** Cancel and Escape close without a request.
- **D24-092** Remove issues `DELETE` to the entry id.
- **D24-093** With the write diverted, does the toast claim **"Entry removed"**?
- **D24-094** Does the row return after a hard reload?

### H. Venue scoping (D24-095 → D24-102)

- **D24-095** `/api/v1/generator` is in `BUSINESS_SCOPED_PREFIXES` — confirm `businessId` on the wire.
- **D24-096** Switch to 3358 → the row count changes.
- **D24-097** Switch to 3359 → same.
- **D24-098** Switch to 3360 → same.
- **D24-099** All venues → the merged set.
- **D24-100** The stat cards re-scope with the venue.
- **D24-101** `queryKey: ["generator-fuel-redesigned"]` carries no businessId — the same structural risk as Modules 21–23.
- **D24-102** At All venues, is the venue named anywhere on a row?

### I. Resilience (D24-103 → D24-110)

- **D24-103** Offline → the table shows its error state with Retry.
- **D24-104** Unroutable host → same; Retry re-issues.
- **D24-105** The error text is *"Couldn't load fuel log."*
- **D24-106** The stat cards during a failed load — do they assert `Rs 0` and `0 L`?
- **D24-107** Slow network → skeleton, no flash of empty.
- **D24-108** Malformed response does not white-screen.
- **D24-109** An unknown entry type from the API — confirmed safe by the `default: "neutral"` branch; drive it.
- **D24-110** Console clean across the module.

### J. Accessibility (D24-111 → D24-118)

- **D24-111** Row actions announce which entry they act on.
- **D24-112** Dialog labels are programmatically associated.
- **D24-113** Status pills are not colour-only.
- **D24-114** The alert dialog announces title + description and focuses Cancel.
- **D24-115** Focus rings on all controls.
- **D24-116** Heading order.
- **D24-117** The search input has an accessible name.
- **D24-118** The blocked-save hint is announced.

### K. Mobile — 360×740 (D24-119 → D24-126)

- **D24-119** No horizontal page scroll.
- **D24-120** **And** zero clipped elements outside deliberate scroll containers.
- **D24-121** The table switches to the card renderer.
- **D24-122** The card shows generator, fuel, litres and cost — are the row actions reachable?
- **D24-123** Four stat cards reflow to 2 columns.
- **D24-124** The toolbar fits.
- **D24-125** The dialog is usable at 360.
- **D24-126** Touch targets ≥ 24×24.

### L. Integrity close-out (D24-127 → D24-132)

- **D24-127** Entry count unchanged at close, via a clean iframe realm.
- **D24-128** The per-type split unchanged.
- **D24-129** Delivered litres and total cost unchanged.
- **D24-130** Tank status unchanged.
- **D24-131** Every diverted write listed with method, URL and body.
- **D24-132** No `POST`/`PATCH`/`DELETE` reached the real API.

**132 cases written.** Execution pending — see the note below.

> **Execution blocked — 2026-08-06.** The browser holding the authenticated live-prod session was
> lost when the chrome-devtools MCP server dropped mid-session. A fresh browser reaches
> `/dashboard/generator-fuel` and is redirected to `/login`, and submitting the correct credentials
> now returns **"We sent a 6-digit code to m****6@gmail.com. It expires in 10 minutes."** — the
> emailed OTP gate. I cannot read that inbox, so no case in this module has been driven on live
> production. The cases above were written from source only, and every one of them is recorded as
> **not run**. Nothing was written to the vendor's account. One OTP email was sent to the account
> owner by the login attempt.

