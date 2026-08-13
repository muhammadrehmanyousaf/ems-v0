# Task — Reclaim the fold: one page-header pattern for every dashboard view

Raised by the vendor after seeing Expenses and Staff. Two separate problems, both
measured on the live portal at a 674px viewport (a 1366×768 laptop, the common case).

---

## Problem 1 — Duplicated primary action

`/dashboard/expenses` renders **two identical "Add expense" buttons**, measured live:

| instance | top | left |
|---|---|---|
| page header | 96 | 1333 |
| "Spending overview" card header | 164 | 1343 |

68px apart, same edge of the screen. There is no case where a vendor needs the same
action twice within one screen height — it costs a row of vertical space and makes the
page look unfinished. Keep the page-header one, drop the card one.

**Audit the rest**: any view where a create action appears in both the page header and a
card header below it.

---

## Problem 2 — The work is below the fold

Measured, viewport height **674px**:

### /dashboard/expenses
```
page title      top 101
first KPI card  top 276
expense table   top 701   ← BELOW the fold entirely
```
A vendor opens their expense ledger and sees **no expenses at all** without scrolling.

### /dashboard/staff
```
tabs row       top  96  (40px tall, alone on its own row)
page title     top 165
first KPI card top 220   ← 33% of the screen gone before any data
staff table    top 385   ← 57% gone before the first crew member
```

### The specific fix the vendor asked for
On `/dashboard/staff` the tabs **Roster | Shifts & payroll** sit alone on a row *above*
the title block (`Staff & payroll` / *Your crew, roles and pay rates.* / `Add staff`).

Move the tabs **into the title row**, aligned right, next to the primary action. That
removes a whole 40px row plus its ~29px of surrounding gap — roughly **69px, ~10% of the
viewport**, returned to content on every view that has tabs.

---

## The pattern to standardise on

One header row per page:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Staff & payroll                     [Roster | Shifts & payroll]    │
│  Your crew, roles and pay rates.                     [+ Add staff]  │
└─────────────────────────────────────────────────────────────────────┘
```

- Title + subtitle: left, stacked, subtitle at the smaller type scale already in use
- Tabs: right of the title, same row
- Primary action: far right, aligned with the subtitle line
- Exactly **one** primary action per view
- KPI cards directly beneath, then the table

Result on Staff: table moves from top 385 → roughly top 316. On Expenses, removing the
duplicate button and tightening the overview block should pull the table above 674px so
the ledger is visible on open.

---

## Scope — every dashboard view, not just these two

The vendor was explicit: *"you have to do same in all the views so they all should look
professional"*. Views with tabs and/or duplicated actions seen so far:

- `/dashboard/staff` — Roster · Shifts & payroll  ← the example given
- `/dashboard/suppliers` — A/P invoices · Suppliers
- `/dashboard/venue-os` — 7 tabs
- `/dashboard/expenses` — duplicate Add expense + Day/Month/Year/All toggle
- `/dashboard/bookings` — Active · Archive · Cancelled · All
- `/dashboard/reviews`, `/dashboard/money`, `/dashboard/receipts` — confirm header shape

Do this as a **shared page-header component** so the rule cannot drift back, not as
per-page edits.

---

## Acceptance

For each view, measured at 1366×768 and at 360px:
1. Exactly one primary action visible.
2. Tabs share the title row (they stack below it only at mobile widths).
3. The first row of real data (table row or KPI) is **above the fold** at 674px.
4. Record before/after `getBoundingClientRect().top` of the first data element.
5. No horizontal overflow at 360px (`scrollWidth === 360`).

## Status
NOT STARTED — queued behind the live UI test sweep, per the vendor's instruction that
testing finishes first. **Not to be skipped.**

---

## Problem 3 — A repeated explainer block eats the fold on all 7 Venue-OS tabs

Measured live on `/dashboard/venue-os?tab=cash`, viewport 674px:

```
page title    top  96  (42px)
intro block   top 197  (94px)   "Your venue command centre — Run tonight's event,
                                 see whether each shaadi made money, track every
                                 expense, chase cheques, and manage your halls…"
tabs          top 311  (40px)
tab content   top ~371          ← 55% of the viewport gone before any venue data
```

The **same 94px paragraph renders on every one of the 7 tabs**. It is onboarding copy: a
vendor needs it once, then it is pure cost on every visit forever. On the thinner tabs
(Cash 909 chars, Accounting 750 chars) the explainer is a large fraction of the entire
page content.

**Fix**: show it only when the vendor has not used Venue-OS before (or collapse it behind
the page title), and merge the tablist into the title row per Problem 2. That returns
roughly **134px** — a fifth of the viewport — on every Venue-OS visit.

## Updated measurement table (before)

| view | viewport | first data element top | % of screen consumed |
|---|---|---|---|
| /dashboard/expenses | 674 | table **701** | **>100% — below the fold** |
| /dashboard/staff | 674 | table 385 | 57% |
| /dashboard/venue-os | 674 | tab content ~371 | 55% |

These three are the acceptance baselines to beat.

---

# IMPLEMENTATION — round 1

## Done
1. **`PageHeader` gained a `tabs` slot** (`components/dashboard/primitives/page-header.tsx`).
   The tablist now renders on the title's own row, right-aligned before the actions.
   This primitive is already used by **51 screens**, so the pattern is available
   everywhere rather than being re-implemented per page.

2. **Staff** — tablist hoisted out of its own row and into the header. It also fixed a
   real gap: the `PageHeader` lived *inside* the roster tab, so **"Shifts & payroll" had
   no title at all**. Both tabs now share one header, and "Add staff" only renders on the
   roster tab, where it applies.

3. **Expenses — duplicate killed.** `ExpenseCockpit` gained `showAddAction` (default
   `true`). `/dashboard/expenses` passes `false` because its page header already owns the
   action; `/dashboard/venue-os?tab=money` keeps it, because there the cockpit is the only
   way to add an expense. Deleting the button outright would have broken Venue-OS.

4. **Venue-OS intro is dismissible.** The 94px "Your venue command centre" card now has a
   close button and remembers the choice (`ww:venue-os-intro-dismissed`). Read in an
   effect, not during render, so the server and first client pass agree.

5. **Suppliers** — `A/P invoices | Suppliers` tablist moved into the header row.

## Correction to the original report
Automation's second "New rule" is **not** a duplicate: it lives in the table's `empty`
state, so it only appears when there are no rules. That is a legitimate discovery CTA —
the same pattern deliberately left alone in Expenses' own empty state. The automated scan
counted it because the account genuinely has zero rules. **Only Expenses had a real
duplicate.**

## Verification so far
- Typecheck: **121, the exact ratchet baseline** — no new errors.
- `next build`: **passes**.
- Before/after fold measurements: **NOT YET TAKEN** — they require a deploy, and the
  vendor has not authorised a push. Baselines to beat, measured at 674px:
  | view | first data top (before) |
  |---|---|
  | /dashboard/expenses | 701 (below the fold) |
  | /dashboard/staff | 385 |
  | /dashboard/venue-os | ~371 |

## Still to do
- Bookings (Active/Archive/Cancelled/All) — confirm whether that row is a filter bar
  rather than tabs; if tabs, move into the header.
- Reviews, Receivables, Receipts — confirm header shape matches the pattern.
- 360px check: tabs must stack below the title on narrow screens, no overflow.
- Re-measure every view after deploy and record the after numbers.

---

# IMPLEMENTATION — round 2

## Done
6. **Venue-OS explainer card REMOVED outright** (not dismissible). The vendor's call: a
   card someone closes on day one is still a card that shipped. The tab labels already say
   what each screen is, and the page header carries the line specific to the tab in view.
   Returns the full 94px on all seven tabs.

7. **Killed the doubled tab heading.** Every Venue-OS tab printed its identity twice:
   | tab | page header | Section header |
   |---|---|---|
   | today | Tonight | **Tonight** (verbatim) |
   | cash | Cash & cheques | **Cash & cheques** (verbatim) |
   | profit | Event profit | Bookings & profit |
   | money | Venue money | Money & expenses |
   | spaces | Halls & spaces | Spaces & calendar |
   | kitchen | Kitchen | Kitchen & suppliers |

   `Section` is now a pure layout wrapper and draws no heading — another ~48px per tab.
   Combined with the card: **~142px returned on every Venue-OS visit.**

8. **360px hardening of the new `tabs` slot.** The first cut was `shrink-0`, which on a
   360px screen would have pushed the page into a horizontal scroll — and a sticky header
   inside a horizontally scrolling body detaches. The tablist now takes its own full-width
   line and scrolls within itself below `sm`, and joins the title row from `sm` up.

## Checked and deliberately NOT changed
- **Bookings** — Active/Archive/Cancelled/All is a `role="group"` filter bar *inside the
  table toolbar*, not tabs above the header. It costs no extra row. Left alone.
- **Reviews, Receivables** — do not use `PageHeader`, but each renders a single `h1` with
  no tab row above it, so neither has the duplication problem. Churning working code for
  uniformity alone was not worth the regression risk.
- **Automation / Expenses empty-state CTAs** — only render when there is no data, so they
  can never be the on-screen duplicate.

## Verification
- Typecheck: **121 — the exact ratchet baseline**, no new errors.
- `next build`: **Compiled successfully**.
- Fold measurements after the change: **still NOT taken** — requires a deploy, which is
  not authorised. The before-numbers to beat remain: expenses 701, staff 385, venue-os ~371
  (viewport 674).

---

# ROUND 3 — measured every dashboard route, ranked by waste

Method: load each route in a 1366×674 frame and record where the first KPI and the first
table row actually land. Data, not pattern-guessing.

| route | first KPI | table top | note |
|---|---|---|---|
| **/dashboard (home)** | **747** | **2182** | worst in the product |
| /expenses | 276 | 701 | below the fold; duplicate action fixed this round |
| /suppliers | — | 637 | tabs moved into header this round |
| /money | 148 | 499 | |
| /receipts | 156 | 465 | |
| /staff | 220 | 385 | tabs moved into header this round |
| /bookings · /leads · /customers · /inventory | 156 | **339** | **the healthy baseline** |

**The healthy shape is h1 at 101, KPIs at 156, table at 339.** Four modules already hit it,
which means it is achievable everywhere — the others are carrying avoidable weight.

## Home is the priority, and its problem is duplication not decoration
Two cards, 544px combined, answering one question — and disagreeing (78% vs 88/100). See
**D-11** in LIVE-UI-TEST-SHEET.md. Fixing that duplication is worth more than every other
density change combined, because home is the screen every vendor lands on.

Not changed yet: choosing which completeness number is authoritative is a product
decision, and the fix should follow that decision rather than precede it.

## Audit result — the patterns are NOT widespread
- Views with a tablist: only 4 (`staff`, `suppliers`, `venue-os`, `admin/complaints`).
  Three are done; admin/complaints is admin-only, not vendor-facing.
- Section-style heading+hint duplication: only `venue-os` had it at page level (6×, fixed).
  The remaining hits are inside dialogs and sub-forms, where a heading is correct.
- Duplicate primary actions: only `/expenses` was real (fixed). Automation's second button
  is an empty-state CTA.

So the sweep is close to complete, not just started — the remaining win is concentrated in
`/dashboard` home.

---

# ROUND 4 — the home screen

## D-11 fixed at the source (backend)
The two contradictory numbers were one util fed two different queries. The per-business
endpoint omitted `menus` and `vendorType`, so real menus read as missing and the Specialty
checklist fell through. Verified on the production row: 78 → 88, matching the list
endpoint. See LIVE-UI-TEST-SHEET.md for the full trace.

## Profile completion card now opens collapsed once the listing is healthy
The card is 301px directly beneath the 243px health panel — 544px of a 674px viewport
spent on listing quality before the vendor sees a booking, an enquiry or a rupee, which is
why home's first KPI sat at 747.

Below 70 the detail earns its space: the listing is genuinely unfinished and the next-best
actions are the point. At or above 70 it opens as the headline only. The vendor can still
expand it, and an explicit choice either way is remembered — the default only applies when
they have never expressed one.

This is a default, not a removal. The health panel keeps listing as one of its four scored
factors, because it belongs in the score; what it no longer does is compete with a 301px
card saying the same thing.

## Verification
- FE typecheck: **121 — baseline**, no new errors.
- BE: 3 suites / 98 tests pass; the 16 `addMyBusiness` failures confirmed pre-existing by
  stashing the change and re-running.
- Fold measurement after: still requires a deploy.
