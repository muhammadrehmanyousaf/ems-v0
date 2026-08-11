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
