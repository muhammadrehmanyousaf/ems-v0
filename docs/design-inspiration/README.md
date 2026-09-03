# Design Inspiration — WeddingWala Revamp

A curated moodboard + **deep design ideas**, gathered from a live headed
Playwright survey of Dribbble (Aug 2026), filtered **strictly to our platform's
surfaces**: customer venue discovery/booking, and the vendor side (dashboard,
subscriptions, bookings, Khata/finance, calendar, refunds/settlement, leads).

- Surveyed **~300 shots** across 7 targeted searches; **25 curated references**
  downloaded to [`assets/`](assets/).
- Six were opened and analyzed pixel-by-pixel; the rest are thumbnail references.

> **Usage rights — read this.** Every file in `assets/` is another designer's
> copyrighted work, saved **as an internal reference/moodboard only**. We study
> the *ideas* (layout, patterns, hierarchy) — we do **not** ship these images,
> copy them pixel-for-pixel, or reuse their assets in the product. Full
> attribution is in the table at the bottom. If any of these should not live in
> the repo, delete `assets/`; the ideas below stand on their own.

---

## The deep ideas — mapped to OUR surfaces

Each idea is tagged with the reference `[NN]` it came from and how we'd apply it
to WeddingWala. Cross-check every adoption against [../design-rules/](../design-rules/).

### 1. Customer — venue discovery & booking  `[01, 02, 04, 05]`

What the best wedding/venue apps do:
- **Full-bleed venue photography as the hero** of every card and detail — the
  venue *is* the product; let the image carry the emotion. Title + price +
  location sit in a clean panel below/over a scrim (contrast rule, file 04).
- **Category chips with icons** right under the search bar (Hotel · Hall · Farm
  · Beach · Marquee) — one-tap filtering, horizontally scrollable. `[01]`
- **Venue card = image + heart-favorite + title + location + `Rs / night` +
  rating.** Consistent, scannable, repeatable. `[01, 04]`
- **Detail page anatomy** `[01]`:
  - full-bleed hero image, floating back/favorite/share controls
  - title + price + **reviewer avatar stack** ("25+ people reviewed") + ⭐ rating
  - **"Most popular facilities" as an icon grid** (wifi, parking, party hall,
    A/C, generator, valet) — instantly scannable vs a text list
  - a **contact-person card** (coordinator) with chat + call buttons
  - **sticky "Book now"** at the bottom (thumb zone, file 06)
- **Personal greeting** "Hi, Mariam! — Inspiration for your wedding" warms the
  home screen without cost.

> **For WeddingWala:** our venue detail already has the pieces; the win is
> *presentation* — bigger imagery, a facilities icon grid, reviewer stack, and a
> sticky Book/Enquire bar. Keep the emotional register high (this is a wedding).

### 2. Vendor — subscription & pricing tiers  `[06]` ⭐ near-perfect match

ProQ is essentially our model (free listing + paid boost tiers), even in Taka:
- **Three tier cards** (Starter / Growth / Premium) side by side, **the
  recommended middle one filled in the brand color** so the eye lands there
  (Von Restorff, file 01). Others stay outlined.
- Each card: **duration toggle** (2 weeks / 4 weeks), big price, **"All Free
  features plus:" checklist with green ticks**, one CTA ("Get Started").
- A **segmented control** above (Product Boost / Vendor Profile / Homepage Slot)
  to switch what you're buying.
- Left sidebar of **pill-style nav rows** with a distinct bottom group
  (Pricing / Subscriptions / Settings / Logout).

> **For WeddingWala:** this is the template for the vendor subscription/upgrade
> screen — recommended tier in gold, feature checklist, duration toggle, one
> clear CTA. Directly reusable pattern (build it, don't copy the pixels).

### 3. Vendor — dashboard shell & the venue switcher  `[09, 10, 08]`

- **A workspace/venue switcher in the header** — a radio-select dropdown of the
  vendor's stores + "Create store". `[09]`
  > **This is the UX fix for our multi-venue businessId trap** (see
  > `../../.claude/.../ww-multi-venue-businessid-trap`): let the vendor pick
  > *which venue* they're viewing, and scope the page to it — instead of silently
  > defaulting to one business and hiding the others. The Wapsi/obligations,
  > policy, and acceptance screens should all honor this switcher.
- **Clean top-nav tabs** + generous whitespace; the Untitled UI restraint is the
  bar to hit — few colors, strong type hierarchy, one accent.
- **Gradient-stroke area charts** (blue→purple) with a soft gradient fill and
  minimal gridlines — for revenue/bookings trends. `[09]` (Tremor / shadcn chart
  can do this; see the libraries survey.)

### 4. Vendor — Khata / finance / Wapsi  `[16, 14, 15, 17, 19]`

The PayTrack/finance shots are the blueprint for money screens:
- **A row of KPI stat cards** up top: *Overdue · Due next month · Avg time to
  get paid · Owed (Wapsi total).* Label + big tabular number. `[16]`
- **Obligation/invoice list rows:** avatar + ref# + **status pill**
  (Unsent/Viewed/Unpaid → for us: Owed / Paid-by-vendor / Disputed / Settled) +
  **"in X days"** + amount, with the **selected row highlighted dark**. `[16]`
  > Directly upgrades our **Wapsi** list and refund cards.
- **"Related quick links" grid with counts** (Receipts 3 · Refunds 2 ·
  Transactions 1) for jumping around the money hub. `[16]`
- **Segmented paid/remaining progress bars** with distinct fills (solid vs
  striped) for "paid vs balance vs credit" — perfect for our deposit/balance and
  settlement states. `[16]`

> **For WeddingWala:** the Khata hub and Wapsi page get KPI cards + status-pill
> list rows + a total, all in tabular figures (file 03). This is the single
> highest-value adoption for the vendor side.

### 5. Vendor — calendar & blocked dates  `[21, 20, 22]`

- **Multi-column day/week view** — a column per venue (or per hall), a time rail
  on the left, **color-coded event blocks** (by status: confirmed / pending /
  blocked), with a **red "now" line** across the grid. `[21]`
- **Inline "Add Schedule / Add Block Time" popover** (title, date, start→end,
  save) — create without leaving the calendar. `[21]`
- **A command bar** ("Type a command or search…") + a toolbar of actions
  (Filter, Add Block Time, Manage Bookings). `[21]`
- **Hyper-minimal option** `[22]` for the mobile calendar — lots of whitespace,
  one accent, big tap targets.

> **For WeddingWala:** our Calendar + "Blocked dates" gets color-coded blocks,
> a now-line, and an inline add-block popover. Ties to the availability work.

### 6. Vendor — booking / event overview with progress  `[24, 12, 23]`

- **Personalized, emotional event header:** "Emma & Liam's Wedding — 2 days
  left." A booking is a *wedding*, not a row — name it, count down to it. `[24]`
- **A completion gauge** ("86% Completed") with **sub-metric mini-rings**
  (guests 18/20, vendors 25/25 ✓, payments 12/15, seating 17/27) — Goal-Gradient
  + Zeigarnik made visible. `[24]`
- **Budget used/remaining split bar** (Total Rs X · used · remaining). `[24]`
- **Tabs on the booking** (Overview · Budget · Tasks · Vendors · Notes) to hold
  detail without a wall of scroll. `[24]`
- **Upsell card inside the profile menu** ("Upgrade to Pro / Subscribe Now") —
  a low-pressure place for our subscription nudge. `[24]`

> **For WeddingWala:** the booking detail becomes an *event* view — countdown,
> a payment/settlement progress gauge, deposit/balance bar — warmer and more
> useful than a form. Peak–End rule (file 07) lives here.

---

## Cross-cutting patterns worth stealing (as patterns, not pixels)

1. **Status is always a pill + a word + a color** — never color alone (file 04).
2. **One accent, used sparingly, on the thing that matters** (the recommended
   tier, the primary CTA, the "now" line). Everything else is neutral.
3. **Tabular numbers everywhere money appears** (file 03).
4. **Stat cards → list → detail** is the repeating shape of every good dashboard:
   summarize, then enumerate, then drill in.
5. **Emotional warmth on the customer side, calm restraint on the vendor side.**
   Two registers, both intentional.
6. **The recommended/selected item is visually isolated** (Von Restorff), and the
   current location is always obvious (file 07).

---

## Reference catalog (attribution — internal moodboard only)

All shots © their respective authors, via Dribbble. Saved as reference; not for
production use.

| # | Category | Title | Author | File |
|---|---|---|---|---|
| 01 | wedding-booking | EverAfter – Wedding Planning & Venue Booking App | UIX Maruf Hossen | `01-wedding-booking-everafter-wedding-planning-venue.webp` |
| 02 | wedding-booking | Event Center Booking Mobile App | Kites Design | `02-wedding-booking-event-center-booking-mobile-app.webp` |
| 03 | wedding-booking | AI-Powered Wedding Planner App / AI Event Management | The DA Designs | `03-wedding-booking-ai.webp` |
| 04 | venue-marketplace | Travel & Event Venue Booking App | Sheikh Elias | `04-venue-marketplace-travel-event-venue-booking-app.webp` |
| 05 | venue-marketplace | Find Sports Venues Mobile App / Booking & Discovery | Kites Design | `05-venue-marketplace-find-sports-venues-mobile-app.webp` |
| 06 | vendor-dashboard | ProQ Vendor Dashboard: Subscriptions, Boost Packages & Slots | Tasfia Barshat | `06-vendor-dashboard-proq-vendor-dashboard-subscripti.webp` |
| 07 | vendor-dashboard | SellBoard / Vendor Dashboard for Marketplace | Valtorian | `07-vendor-dashboard-sellboard.webp` |
| 08 | vendor-dashboard | Sirius Vendor Dashboard | Olamide Oladehinde | `08-vendor-dashboard-sirius-vendor-dashboard.webp` |
| 09 | vendor-dashboard | Vendor dashboard — Untitled UI | Jordan Hughes® | `09-vendor-dashboard-vendor-dashboard.webp` |
| 10 | vendor-dashboard | Vendor analytics dashboard — Untitled UI | Jordan Hughes® | `10-vendor-dashboard-vendor-analytics-dashboard.webp` |
| 11 | booking-dashboard | Salon Booking Management Dashboard — SaaS | Nes-Lab ✪ | `11-booking-dashboard-salon-booking-management-dashboa.webp` |
| 12 | booking-dashboard | Event Booking Management Dashboard Template | Danish Riaz | `12-booking-dashboard-event-booking-management-dashboa.webp` |
| 13 | booking-dashboard | Dashboard UI Components – Hotel Booking System | Italica Studio | `13-booking-dashboard-dashboard-ui-components-hotel-bo.webp` |
| 14 | finance-ledger | Payroll & Finance Dashboard — Invoice Reports & Payment | Playworks Agency | `14-finance-ledger-payroll-finance-dashboard.webp` |
| 15 | finance-ledger | Growin - Finance Management Dashboard: Invoices | Korsa | `15-finance-ledger-growin.webp` |
| 16 | finance-ledger | Finance dashboard / Billing & Invoice / Fintech | Bhautik Domadiya | `16-finance-ledger-finance-dashboard.webp` |
| 17 | finance-ledger | Invowise – Smart Invoice & Finance Dashboard UI | Ridwan Saputra | `17-finance-ledger-invowise-smart-invoice-finance-d.webp` |
| 18 | finance-ledger | Medical Billing & Invoice Dashboard | OLAMIDE BERNARD | `18-finance-ledger-medical-billing-invoice-dashboar.webp` |
| 19 | finance-ledger | Billing & Invoice Management Dashboard | Crevio | `19-finance-ledger-billing-invoice-management-dashb.webp` |
| 20 | calendar-app | Calendar & Scheduling App - Event Management | Yefi Chlara | `20-calendar-app-calendar-scheduling-app.webp` |
| 21 | calendar-app | Appointment Scheduling Calendar | Isaac Sanchez | `21-calendar-app-appointment-scheduling-calendar.webp` |
| 22 | calendar-app | Hyper-Minimal Scheduling & Calendar App | Carlos Pessane | `22-calendar-app-hyper.webp` |
| 23 | event-crm | Orders & Tickets Management CRM System - Ticky | DreamX Company | `23-event-crm-orders-tickets-management-crm-sy.webp` |
| 24 | event-crm | Event Management SaaS Dashboard — Web App UI | Bhargav Butani | `24-event-crm-event-management-saas-dashboard.webp` |
| 25 | event-crm | Communication Hub Dashboard for B2B Event Management | Equal | `25-event-crm-communication-hub-dashboard-for-.webp` |

---

*Companion docs: the ruleset [../design-rules/](../design-rules/) and the
narrative reference [../ui-ux-design-research.md](../ui-ux-design-research.md).
Still in research mode — no product code changed. When "start" is given, these
ideas feed the Ideate → Wireframe steps.*
