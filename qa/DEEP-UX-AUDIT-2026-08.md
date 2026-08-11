# Deep UX/UI maturity audit — 2026-08

**Branch:** `fix/deep-ux-maturity-audit` (frontend + backend). **Never pushed** — the user pushes.
**Method:** live production (`www.weddingwala.pk`), signed in as the real vendor
`muhammadrehmanyousaf786@gmail.com`, Playwright-driven, measured not eyeballed.

## The bar

The competitor research already settled the strategy: *"radically simpler than Eventikk —
just book & bill, mobile-first, Urdu-first, one action per screen — with the deep engines
kept INVISIBLE."* Every finding is scored against that. A screen that works but makes the
vendor think is still a defect.

## Protocol — what must be true before a module is `DONE`

A module is not done when it renders. It is done when all of the following are executed:

1. **Every interactive element driven** — each button, link, tab, field, row action, menu item.
2. **The job completes end to end** — not "the page loads" but "the vendor finishes the task".
3. **Reachability** — can the user get from where the data is *shown* to where it is *acted on*?
   (The calendar failure below is the canonical example.)
4. **Full CRUD where the module owns data** — create, read, update, delete, each verified.
5. **Hard reload after every mutation**, then re-read the value. Post-action UI state is not evidence.
6. **Two viewports** — 1440×900 and 360×640/600. Measured `scrollWidth` vs `clientWidth`,
   not "looked fine".
7. **Every dialog/sheet measured** — height vs viewport, inner scroll container present,
   primary action reachable *after scrolling*, close affordance present and pinned.
8. **Keyboard** — tab stop count, focus visible, focus order, Esc, focus return on close.
9. **Empty / loading / error / no-permission** — four different states, not one.
10. **Console + network clean** — no errors, no 4xx/5xx on the happy path.

### Evidence rules
- A measured number or it did not happen. `reachable: false` is not a finding until you have
  **scrolled the container** and re-measured — an element below the fold in a scrollable box
  is not unreachable. Two candidate findings were withdrawn this way (see Withdrawn below).
- Static grep is a *candidate*, never a finding. Drive it in the browser.

## Instrumentation

Injected via `browser_evaluate` on every screen; see the audit harness used in-session:
page overflow (`scrollWidth` vs `clientWidth`) with in-scroller filtering, per-element
bleeders, interactive targets under 24 px (WCAG 2.2 SC 2.5.8), unlabelled inputs,
focus-ring suppression, heading order and `h1` count, `img` alt, computed body font/bg,
dialog geometry + inner scroll containers + post-scroll reachability, total tab stops.

---

## Findings

Severity: **S1** blocks the job · **S2** forces a workaround · **S3** friction · **S4** polish

| ID | Sev | Module | Finding | Evidence | Status |
|---|---|---|---|---|---|
| CAL-01 | **S1** | Calendar | Day agenda rendered bookings as dead text — a vendor could see the booking that owns their evening and had no way to open it | Clicked 13 Aug: panel showed `Danish Qureshi & Aiman Danish · 21:00 · Rs 1,877,750 · Confirmed` + 1 more; `linksInPanel: []`, `buttonsInPanel: []`. File header said "read-only" | **Fixed** `6a85a03` |
| UI-01 | **S2** | Global | Shared dialog close button commented out since Jan 2025 (`5764997`) — ~99 dialogs with no visible way out | 100 `<DialogContent>` instances, 1 file rendering its own `DialogClose`; live: `hasVisibleCloseX: false` | **Fixed** `6a85a03` |
| UI-02 | **S2** | Global | Every input 14 px → iOS Safari force-zooms the page on focus, punching the layout sideways on every form | `components/ui/input.tsx` `text-sm`; live computed `fontSize: 14px` | **Fixed** `6a85a03` |
| UI-03 | **S2** | Global | `Textarea` sets `focus-visible:outline-none` with no replacement → no focus indicator anywhere (WCAG 2.4.7) | `components/ui/textarea.tsx:12` | **Fixed** `6a85a03` |
| BK-01 | **S2** | Bookings | Offline-booking phone field was `type="text"`, no `inputMode`, no `autocomplete` → QWERTY keyboard for `03XX-XXXXXXX`; violates WCAG 2.1 SC 1.3.5 | Live: `{id:"ob-phone", type:"text", inputMode:null, autocomplete:null}` | **Fixed** `6a85a03` |
| UI-04 | **S2** | Global | `SheetContent` close is `absolute` inside a container that is itself the scroller → the only way out scrolls off-screen. Also a bare 16 px target (WCAG 2.2 SC 2.5.8 needs 24) | Live 360×600, quick-booking sheet scrolled to Save: close at `top: -127.2`. 2 of 6 `SheetContent` set `overflow-y-auto` | **Fixed** (this commit) |
| CAL-06 | **S1** | Calendar | A day cell could only *select* a day — it was a single `<button>`, so every decision made while looking at a date (sell it, close it) meant leaving for another screen and retyping that date | Structural: `calendar-redesigned-view.tsx` grid cell | **Fixed** `8dc15f4` — `+` (top right) creates a booking on that date, Ban (top left) blocks it, both on hover + keyboard focus, desktop only |
| CAL-07 | **S2** | Calendar | Blocking a date from the All-venues roll-up would have blocked **every venue** — `BlockedDatesAPI` reads a null `businessId` as "all", and the calendar defaults to null | `lib/api/dashboard.ts:1489`; WWL-490 precedent | **Fixed** `8dc15f4` — the dialog asks which venue; "all" is an explicit choice with a warning |
| CAL-08 | **S3** | Calendar | Day-agenda rows relied on whole-row-link-on-hover, invisible on a phone | — | **Fixed** `8dc15f4` — named "Open booking" / "Payments" actions under each row |
| CAL-02 | **S2** | Calendar | **Three different names and two different forms for one job.** Page header "Add booking" → dialog titled "Add Offline Booking" (English, 7 fields). Clicking a free availability slot → sheet titled "Nayi Booking" (Roman Urdu, 4 fields). Dashboard home's "Nayi Booking" button → `/dashboard/bookings`, a list | Live, all three driven | Open |
| CAL-03 | **S3** | Calendar | Roman-Urdu sheet renders while the header language toggle is on **EN** | Live: EN active, sheet reads "Naam / Rakam / Kaunsa hall?" | Open |
| CAL-04 | **S3** | Calendar | Two calendars on one page disagree — clicking 13 Aug in the availability strip left the day agenda on "Tuesday, 11 August" | Live | Open |
| CAL-05 | **S3** | Calendar | 172 tab stops on one page (112 availability cells + 38 day cells), no `role="grid"`, no roving tabindex. The ARIA APG grid pattern makes a grid *one* tab stop | Live: `totalTabStops: 172`, `gridRole: null` | Open |
| NAV-01 | **S2** | Global nav | The rail's primary action "New booking" and Home's "Nayi Booking" both link to `/dashboard/bookings` — a list, not a create flow | `nav-data.ts`; `action-overview-view.tsx:60` | Open |
| DS-01 | **S3** | Design system | `DESIGN_REVAMP_PLAN.md` declares itself source of truth and forbids purple, Inter and spin loaders. Shipped: `--primary: 263 84% 57%` (purple) is the focus-ring colour, body font is Inter, 118 files use `animate-spin` vs 52 using `Skeleton` | Live: `bodyFont: "__Inter…"`, `bodyBg: rgb(252,252,253)` (cold white — the brief forbids it) | Open |
| A11Y-01 | **S3** | Auth | `/login` has **no `h1`** — the page's main heading is an `h2` | Live: `h1Count: 0` | Open |
| A11Y-02 | **S3** | Auth | "Forgot password?" is 103.5×**18 px** — a standalone (non-inline) link under the 24 px minimum | Live measurement | Open |

---

## SLOTS — the availability model (reproduced live, customer-side)

Reproduced on production at `/3358/booking` (Rehman Grand Marquee), Step 2 "When is your event?",
date **Thu 13 Aug 2026**. This is the "dates conflict / very confusing" report.

What a real customer is offered:

```
TIME OF DAY
  Morning        10:58 – 22:58     1 of 1 left
  Lunch event    12:00 – 16:00     1 of 1 left
  Dinner event   19:00 – 23:00     1 of 1 left
```

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| **SLOT-01** | **S1** | **Overlapping slots each carry independent capacity, so one physical space can be sold twice for the same wall-clock time.** "Morning" (10:58–22:58) *entirely contains* "Lunch event" and nearly all of "Dinner event", yet all three advertise "1 of 1 left" separately. Selling Morning does not decrement Dinner. | Computed overlap: Morning∩Lunch = **240 min**, Morning∩Dinner = **238 min**. Live, customer-facing |
| **SLOT-02** | **S1** | **Slots do not scope to the chosen space.** The picker offers `Whole venue / any hall · Main Hall · afsana · Terrace Lawn · Mardana Section · Zenana Section`. Selecting **Main Hall (id 3345)** returned a byte-identical slot list and identical counts. Five halls share three counters | Live A/B on the same page |
| **SLOT-03** | **S2** | A slot named **"Morning" running 10:58 – 22:58** — a 12-hour morning. The 10:58 start is the wall-clock time the row was created. No validation on slot label vs times, duration, or overlap | Live; matches the earlier commit `slots: "Morning 10:58-22:58 · 150 of 150 left" was three separate bugs` |
| **SLOT-04** | **S2** | **Two slot layers are live at once with no stated precedence.** `BusinessSlotTemplate.subVenueId` is nullable — NULL means business-level (legacy), non-NULL means per-space. `ENABLE_VENUE_HIERARCHY` is in `DEFAULT_ON`, so the per-space layer is **not** dark | `businessSlotTemplate.js`; `20260701210000-venueos-slot-subvenue.js`; `flagResolverService.js:20` |
| **SLOT-05** | **S2** | No database-level uniqueness on (space, date, slot). The model declares only `idx_slottemplate_business_active` and `idx_slottemplate_business_sort`, so the double-booking guard is application-level and can race | `businessSlotTemplate.js` indexes block |
| **BOOK-01** | **S3** | Vendor rating renders as the raw float **`4.333333333333333`** in the booking header | Live `/3358/booking` |

**Already in the schema:** `isActive` exists on `BusinessSlotTemplate` (plus `weekdayMask`,
`bufferAfterMinutes`, `unitGuestCapacity`, `sortOrder`, `capacity`). The "vendor decides which slot
is live" control the user asked for is **modelled but needs a vendor-facing UI** — it does not need
a new column.

**Root cause (working hypothesis, pending the forensic map):** slot templates are *named time
windows with their own counters*, not *reservations of a resource over a time range*. Capacity is
counted per template row rather than per (space × time-interval), so overlap is invisible to the
system. Two templates that describe the same hours are, to this model, two independent products.

---

### Withdrawn — measured, then disproved
Recording these so they are not "re-found" later.

- **Login form pre-filled with real credentials.** Looked like hardcoded defaults; `defaultValue`
  was `""` while `value` was populated → browser-profile autofill. Not a code defect.
- **"Email(optional)" missing a space.** `(optional)` is a separate `<span className="ml-1">`;
  spaced correctly on screen, only `innerText` concatenates it.
- **Quick-booking sheet's Save unreachable at 360×600.** `reachable: false` before scrolling,
  but the sheet is `overflow-y: auto` — after `scrollTop = scrollHeight` Save measured
  `top 495.2 / bottom 531.2` in a 600 px viewport. Reachable. (The *close* genuinely was not — UI-04.)
- **68 "bleeders" on Calendar at 360.** All inside the availability strip's legitimate horizontal
  scroller. Page overflow was `false`; real bleeder count after filtering: **0**.

---

## BOOKINGS — audited live on production, 2026-08-11

Vendor `muhammadrehmanyousaf786@gmail.com` (user 3351 · 3 businesses · 11 spaces),
`/dashboard/bookings`, 1425×900 and 360×720.

### Fixed

| # | Finding | Evidence |
|---|---|---|
| **BK-A1** | **Clicking a booking row did nothing.** No link, no handler, `cursor: auto`. The only routes in were the two icon buttons at the far right of an 11-column row and the "balance due" panel — which lists only bookings that still owe money, so a **fully paid booking had no route to its own detail page anywhere on the screen**. `/dashboard/bookings/173` renders in full. | Clicked the customer cell: URL unchanged, no dialog, no drawer, no selection |
| **BK-A2** | Not a Bookings bug — **38 screens use `DataTable`, 2 pass `onRowClick`.** Fixed in the primitive as `rowHref` (a real link: keyboard, ⌘-click, screen-reader), not a third click handler | `grep -rln onRowClick` → 2 files |
| **BK-A3** | **The actions column is off-screen at ordinary laptop width.** Table is 1166px of content in a 1036px container; the "Booking actions" button's left edge is at **x = 1467** on a 1425px viewport. Reachable only by discovering the table scrolls sideways. With BK-A1 that meant a vendor could read a booking and had no visible way to act on it | `getBoundingClientRect()` at 1425×900 |
| **BK-A4** | **`onRowClick` has never been keyboard-operable** — no `tabIndex`, no role, no Enter/Space. Receipts and Receivables have rows a keyboard cannot activate at all | Read of the primitive |
| **BK-A5** | **The bucket filter never reaches the URL.** Cancelled shows 3 of 9 rows and the address bar still reads `/dashboard/bookings`; reload silently returns to Active. The file said so itself: "the in-page toggle still owns it afterwards" | Clicked all four buckets: 9 / 3 / 13 / 25 rows, `location.search` empty throughout |

### Was open — now fixed, including one I reported wrongly

| # | Finding | Why not fixed here |
|---|---|---|
| **BK-B1** | ✅ **FIXED.** Eleven columns, none sortable, no `aria-sort` anywhere. **My stated reason for not fixing it was wrong** — I said it "needs a server-backed sort". The server has accepted `sortBy` ∈ {createdAt, bookingDate, status, totalAmount, customerName} + `sortOrder` all along (`bookingController.js` `allowedSort`); the screen sent `createdAt DESC` and nothing else. Date, Customer and Amount are now sortable, server-side, and the sort is in the URL. **Paid and Balance stay unsortable on purpose**: both are computed on the client, so the server cannot order by them and sorting here would order 50 rows and misreport every row past them |
| **BK-B2** | ⚠️ **I GOT THIS WRONG, and the truth is worse.** I wrote "no hall picker anywhere, `subVenueId` not in `allowedFields`, no path UI or API". The API path exists and is mounted — `GET`/`PATCH /api/v1/bookings/:id/space` (`bookingRouter.js:61-62`). So does the client (`lib/api/bookingSpace.ts`), the dialog (`AssignSpaceDialog`), and a helper in `booking-space.ts` whose own comment calls it *"the 'Assign hall' prompt"*. I checked `updateBooking`'s `allowedFields`, found `subVenueId` missing, and concluded the capability was absent — it simply lives on its own endpoint.<br><br>**The real finding: a complete, working hall-assignment feature was reachable only through the row's ⋯ menu → "Quick view" → the sheet — and that ⋯ button sits at x = 1467 on a 1425px viewport (BK-A3).** A finished feature behind a control that was off the edge of the screen. That is why 135 of 139 booking lines carry no hall. ✅ Now also reachable directly: the `—` in the Space column is a **"Set hall"** button that opens the same dialog |
| **BK-B3** | **Selecting rows offers nothing.** The bulk bar reads exactly "2 selected · Clear". Selection does have one use — the Export menu scopes to it and says so well ("Selected → CSV", "All rows") — but the bar never mentions it, so the affordance that appears on selection is the one that does the least | Small; the honest fix is a scoped export action in the bulk bar |

### BK-C1 — the edit dialog could not show a booking's own time ✅ FIXED

Opened Edit on booking #173 (Ahmed Raza, **19:00** in the database). The
required **"Time Slot \*"** field rendered **completely blank**.

The list was the three legacy periods and nothing else, so a Radix `Select`
holding `19:00` matched no item and displayed nothing.

**Measured on production: 60 of 129 live bookings — 47% — cannot be represented
by that control.** 13:00 (8), 19:00 (8), 12:00 (6), 21:00 (4), 20:00 (3),
18:30 (1), 00:00 (2), plus **ten distinct free-text ranges** — `06:00 PM – 11:00 PM`,
`07:00 PM – 12:00 AM`, `08:00 PM – 01:00 AM` and so on — which three clock values
cannot express at all.

**Corrected mid-investigation.** My first reading came from the *hidden* native
`<select>` Radix renders for form compatibility, which falls back to its first
option and reported `09:00` / "Morning (9 AM – 12 PM)". I was about to report
that Save silently reschedules the event to 9 AM. It does not: the payload sends
React state, which holds the real `19:00`. **Nothing was being corrupted on
save.**

The real damage is narrower and still worth fixing: a required field looks unset
on a booking that is perfectly fine, and the obvious response to a blank required
field is to pick something — which is what actually moves the event. The UI was
inviting the mistake rather than making it.

Fixed by always offering the booking's current time as an option, labelled
through the shared vocabulary. It was also the **twelfth** private copy of the
slot list, with a third punctuation again ("Morning  (9 AM – 12 PM)", double
space, en-dash).

**Still open:** the dialog offers only the legacy three plus whatever the booking
already has — it does not read the vendor's own slot templates the way the
booking funnel does. A vendor with 10:58 / 12:00 / 19:00 slots still cannot pick
one here. That needs the update endpoint to accept `slotTemplateId`, which it
does not.

### Verified correct — no action

- **Search**: 25 → 2 on "Ahmed", 0 on "zzzqqq", restores on clear. The no-match state correctly says *"No matches for …"* with a Clear button rather than the false *"No bookings yet"*.
- **Export**: respects selection, offers Selected and All-rows variants in both CSV and Excel, and shows the count.
- **Filters**: all four buckets return distinct, correct row counts.
- **360px**: table swaps to a card list, no page-level horizontal scroll, **zero** tap targets under the WCAG 2.2 24px minimum.

### Withdrawn — measured, then disproved

- **"The two money panels disagree."** They do not. The top cards are scoped to the active filter and follow it — All gives 25 / Rs 20,117,621 collected, which matches the Receivables panel's "across all events" figure exactly. Not a finding.
- **"The actions button is invisible."** First measured `width: 0, offsetParent: null` — but the viewport had dropped to 572px, where the desktop table is deliberately not rendered at all. Re-measured at 1425px: the button is real and rendered, just off-screen (BK-A3). The artefact was mine.

## THE SYSTEMIC FINDING — measured across the whole portal, 2026-08-11

Bookings was not a bad module. It was a normal one.

Swept every screen that renders the shared `DataTable`:

| | count |
|---|---|
| screens using `DataTable` | **38** |
| passing row navigation to it (`rowHref` / `onRowClick`) | **4** |
| declaring **any** sortable column | **2** |

**Two of thirty-eight lists in this product can be ordered.** Not by date, not
by amount, not by who owes most, not by when someone last booked. That covers
Payments, Expenses, Staff, Suppliers, Inventory, Function sheets, Disputes,
Revenue, Tax, PDCs, Brokers, Customers, Collaborations, Audit logs — the
operational spine of the vendor portal.

### Stated precisely, because the two numbers are not equally strong

The **sorting** number is unambiguous: a column is sortable or it is not, and 36
screens have no sortable column.

The **navigation** number measures use of the *primitive's* row-navigation
props. It is not the same as "the row is unreachable" — Customers, for one,
carries its own "Open detail" icon in an actions column, so the destination
exists and works. What those screens share is a **half-clickable row**: one
small target at the end, the other 95% of the row inert. That is arguably worse
than a fully dead row, because it teaches that rows are not clickable and then
makes one of them the exception.

### Why this is the real answer to "it doesn't look mature"

It is not ten thousand separate bugs. It is a small number of patterns, each
absent from most screens:

- a row that opens its record
- a column header that orders the list
- a filter that survives a reload
- an actions column that is on the screen

Every one of those was **already supported by the code** — `onRowClick` shipped
in the primitive, the Bookings API accepted `sortBy`, the hall-assignment
endpoint was mounted and working — and simply not reached. The gap between
"built" and "reachable" is where this product loses.

### Sorting rollout — the per-screen call

| Screen | Mode | Why |
|---|---|---|
| Bookings | **server** | paged at 50/page; API already accepted `sortBy` |
| Leads | client | `listLeads` returns ≤500 rows in one call, paged locally |
| Customers, Payments, Expenses, Staff, Function sheets, Inventory, Receivables | client | each fetches its whole list in one call, no page/limit param |

Each screen was checked individually rather than swept. One rule applied to all
of them would have made half these lists sort the 25 rows on screen and
misreport everything past them — the failure that makes a vendor stop believing
a number.

**Receivables deserves its own line.** Heading: *"Who owes you, and how
overdue."* Rs 13,862,229 outstanding across 14 customers, 15 open installments —
and not one column was sortable. The entire purpose of the screen is deciding
who to chase, and it could not be ordered by amount owed or by days overdue.

### Verified live on production, 2026-08-11

`/dashboard/venue-os?tab=spaces` selects **Halls & spaces** and renders the
**"Booking slots per space"** editor. That is the destination the calendar's
empty state now points at (SLOTS step 9) — it used to say "Add them in
Settings → Availability", which is a blocked-dates editor with no slot control
in it. The branch itself cannot be verified until it deploys, but the target of
that link is confirmed real.

### Fixed so far

| Screen | Row opens record | Sorting |
|---|---|---|
| Bookings | ✅ | ✅ server-side (API already supported it) |
| Leads | ✅ | ✅ client-side (list is fully loaded) |
| Customers | ✅ | ✅ client-side |

### Not yet done, and why not blanket-applied

Only **8 detail routes exist** under `/dashboard` (`bookings`, `business`,
`customers`, `function-sheets`, `leads`, `staff`, `suppliers`, `vendors`).
Wiring `rowHref` on a screen with no detail page would manufacture exactly the
dead doors this codebase already has too many of, so each remaining screen needs
its destination confirmed first rather than a sweep.

## Module status board

`⬜ not started · 🔵 in progress · ✅ done to protocol`

| # | Module | Route | Status |
|---|---|---|---|
| 0 | Login / auth | `/login` | 🔵 partial (a11y logged, flows not yet driven) |
| 1 | Calendar | `/dashboard/calendar` | 🔵 5 findings, 1 fixed |
| 2 | Bookings | `/dashboard/bookings` | ⬜ |
| 3 | Lead inbox | `/dashboard/leads` | ⬜ |
| 4 | Dashboard home | `/dashboard` | ⬜ |
| 5 | Date holds | `/dashboard/holds` | ⬜ |
| 6 | Function sheets | `/dashboard/function-sheets` | ⬜ |
| 7 | Customers | `/dashboard/customers` | ⬜ |
| 8 | Conversations | `/dashboard/chat` | ⬜ |
| 9 | Khata / Money | `/dashboard/money` | ⬜ |
| 10 | Receipts · Receivables · Cheques · Expenses | | ⬜ |
| 11 | Venue-OS (13 doors, ~55 views) | `/dashboard/venue-os` | ⬜ |
| 12 | Settings / Set up | `/dashboard/settings` | ⬜ |
| … | remaining ~68 vendor + admin modules | | ⬜ |

**Honest position: 1 of ~80 modules is partially through the protocol.** This is a long
campaign, not a single pass. Nothing here is browser-verified *as fixed* — the fixes land on
production only when this branch is deployed, which is the user's call.
