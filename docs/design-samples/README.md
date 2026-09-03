# Design Samples

Locked, reference-quality UI samples for the WeddingWala revamp. Open the `.html`
files directly in a browser (they are self-contained — no build, no server).

## `vendor-dashboard.html` — Vendor Console / Overview (LOCKED 2026-08-30)

The approved reference design for the vendor dashboard. **This is the visual
language every other portal screen should follow.** Built and validated against
[`../design-rules/`](../design-rules/) 01–08.

**Design language (the rules this sample sets):**
- **Modern-library aesthetic** — researched live from shadcn/ui, Tremor (Vercel),
  21st.dev, Vercel Geist. Monochrome-first, hairline borders, near-flat surfaces,
  **one** gold accent (`--accent:#B8863B`), sans-serif (Geist/Inter). No colored
  icon-tiles, no pastel blocks, no serif display, no chunky pills — restraint.
- **Sidebar:** labelled shadcn-style nav (Console/Paisa/Grow), active = subtle
  neutral bg + thin gold edge-bar + gold icon, calm neutral count badges,
  truncating venue switcher, account pinned bottom. **No inner scroll ever.**
- **KPI cards:** label / value / delta chip / note / mini **bar** sparkline
  (last bar emphasised) — Tremor style, no icon tiles.
- **Data viz:** single-hue gold area chart with hover crosshair; occupancy ring;
  emphasised endpoints. (dataviz skill.)
- **Lists:** payment-progress bars on events, subtle "today" + "urgent" edge
  stripes, dot+word status badges (colour never alone — rule 14).
- **Both themes** (warm-neutral light / near-black-espresso dark) — every text
  pair verified **WCAG AA ≥ 4.5:1** in both. 44px targets, reduced-motion safe.
- **Scrollbars** are thin, subtle and theme-aware (transparent track, rounded
  `--border-2` thumb that darkens to `--ink-4` on hover) — never the chunky
  default OS bar. This rule is shared verbatim across every screen.

**Roman-Urdu register** stays the brand voice: Khata, Wapsi, Baqaya, Mehmaan.

> Was iterated as an Artifact during the design phase; this file is the source of
> truth now. To port into the real app, map each block to the actual
> shadcn/Tremor components in `components/ui/`.

## `bookings.html` — Bookings (List + Board) — 2026-08-30

The Bookings management screen, built on the **same locked language** (identical
shell, tokens, sidebar, status badges, payment bars).

- **List view:** professional table — couple/event, date, hall, mehmaan, amount +
  baqaya, inline payment-progress bar, status badge, row menu; status **filter
  tabs** (Sab / Confirmed / Pending / Baqaya due / Enquiry / Ho gaya) with live
  counts; search + filter + pager.
- **Cards view:** responsive grid of rich booking cards — avatar + couple +
  event, status badge, date/hall/guests meta, payment-progress bar, amount,
  baqaya, and a Kholein/Jawab-dein action (enquiry cards show a quote-pending
  state). Status filter tabs apply here too.
- **Board (Kanban) view:** columns by pipeline stage (Enquiry → Pending →
  Confirmed → Baqaya due → Ho gaya), each a horizontally-scrolling column with
  count, add affordance, and cards (couple, event, date/guests, payment bar,
  amount/baqaya). Status tabs hide in Board (the board *is* grouped by status).
- View toggle (List / Cards / Board) is a segmented control; both themes AA,
  zero errors.

## `booking-detail.html` — single Booking detail — 2026-08-30

One booking's full page (Ahmed & Mariam, #712), same locked language.

- **Header:** monogram + couple + status badge + `Walima · #712 · Grand Hall`;
  actions (Message, Edit, primary **Payment record karein**); back link.
- **Stat strip:** Event (countdown, gold-highlighted) · Mehmaan · Kul package ·
  Baqaya (warn).
- **Payment (the star):** Kul / Mil-chuka / Baqaya summary, a gradient progress
  bar, and a **payment timeline** — Booking confirm → Advance → Doosri qist
  (done, green ✓) → Baqaya (due, warn, with a record-payment CTA) → Settle
  (todo). This is the WW-SETTLE advance→baqaya→settle flow made visual.
- **Package breakdown** (hall/catering/decor/sound + total), **Activity**
  timeline, and a right rail: **Customer** (Call / WhatsApp / Message +
  phone/email/city), **Event details** (dl), **Documents** (files + download),
  **Notes** (private textarea). Both themes AA, zero errors.

## `leads.html` — Leads / enquiry pipeline — 2026-08-30

The Leads (Puchh-gichh) screen, same **List / Cards / Board** pattern as
`bookings.html` (identical shell, tabs, table, board, cards CSS + JS).

- **Pipeline stages** (the kanban columns & filter tabs): Naya → Raabta hua →
  Quote bheja → Visit tay → Jeeta, plus Khoya (lost, a filter tab not a column).
  Coloured stage dots: grey → blue → amber → gold → green, red for lost.
- **List:** Lead (name + phone), event/guests, kab (date wanted), budget, source
  (WhatsApp/Instagram/Referral/Website with a coloured dot), stage badge, aakhri
  raabta, row menu; **HOT** flame on high-value leads.
- **Cards:** rich lead cards with stage badge, meta, source, budget, and a
  context action (Jawab dein / Follow-up / Kholein / Booking kholein / Dobara try).
- **Board:** the sales pipeline as columns of lead cards.
- Status filter tabs apply to List + Cards; both themes AA, zero errors.
- **Card view has real action buttons** — Call + WhatsApp icon buttons + a
  stage-aware primary (Jawab dein / Quote bhejein / Follow-up / Visit kholein);
  Jeeta → Booking kholein, Khoya → Dobara raabta.

## `lead-detail.html` — single Lead detail — 2026-08-30

One lead's full page (Tariq Shah, a hot referral), same locked language.

- **Header:** monogram + name + stage badge + a **HOT** flag; actions
  (Call, WhatsApp, primary Quote bhejein); back link.
- **Stat strip:** Stage (gold-highlighted) · Event · Shaadi kab · Budget.
- **Pipeline stepper (the star):** a horizontal Naya → Raabta hua → Quote →
  Visit → Jeeta stepper — done steps filled gold with a check, the current step
  ringed, future steps muted — plus a gold **"Agla kadam"** next-step nudge.
- **Kya chahiye** (requirement dl), **Baat-cheet** (conversation timeline), and a
  right rail: **Customer** (Call/WhatsApp/Message + phone/email/city), **Lead
  info** (source/created/assigned/value/priority), **Quick actions** (Quote
  bhejein / Visit schedule / Booking mein badlein / Lost mark), **Notes**.
  Both themes AA, zero errors.

## `calendar.html` — Calendar (Month / Week / Agenda) — 2026-08-30

The events calendar, same locked language, driven by one `EVENTS` array so all
three views + the rail stay in sync. Same shell/tokens/sidebar; view toggle is
the segmented control, type-filter tabs double as the legend.

- **Event-type colour system:** one class per qism drives chips/blocks/rows via
  CSS vars — Walima (gold), Barat (blue), Mehndi (green), Nikah (violet, a new
  `--violet` token added + AA-verified in both themes), Hold (muted/dashed).
- **Month view (hero):** 6-week grid, Roman-Urdu day names (Itwar / Peer /
  Mangal / Budh / Jumeraat / Juma / Hafta), today cell gold-washed with a filled
  date chip, out-of-month days de-emphasised, click any day to drive the rail,
  chips truncate cleanly (`minmax(0,1fr)` tracks), "+N aur" overflow.
- **Per-day tools:** every cell reveals **＋** and **block** icons on hover/focus
  — ＋ opens a popover (**Nayi booking / Naya lead / Date block karein**), the
  block icon toggles the date closed. A blocked date shows a diagonal-hatch fill +
  a **Band** chip, and the rail shows a "Yeh din block hai" banner with **Unblock**
  (one date ships pre-blocked as a demo).
- **Right rail:** selected-day agenda (defaults to Aaj) with type-coloured item
  bars, **per-event action buttons** (Kholein / Edit, plus WhatsApp for weddings),
  a **"<Month> — ek nazar"** summary (kul functions / confirmed·due / kul mehmaan
  / sab se busy din, all computed), and an event-type legend with counts.
- **Week view:** a proper time-grid (2 PM–midnight × 7 days), events as
  hour-spanning coloured blocks, today column + weekend tint.
- **Agenda view:** upcoming events grouped by date with an **AAJ** chip, per-type
  icon tiles, start→end times, hall/mehmaan meta, and status badges.
- Month nav (‹ › + **Aaj**) shifts month or week; type tabs filter across all
  views. Both themes verified **WCAG AA** (incl. the new violet), zero errors.

## `khata.html` — Khata / Wapsi ledger — 2026-08-30

The money screen (Paisa section), same locked language. Every booking's paisa —
kya **aya**, kya **baqaya**, kya **wapsi** — as a cashbook ledger.

- **Summary tiles (4):** Kul aya (is saal) · Baqaya · Wapsi pending · Is mahine
  aya — each with a coloured edge-stripe + dot and an up/down delta.
- **Filter tabs:** Sab / Aya / Baqaya / Wapsi / Settled (coloured dots + counts).
- **Ledger table:** Taareekh · Kis ka (couple + booking #) · Kis liye (purpose
  tag: Advance / Doosri qist / Booking fee / Settle / Baqaya / Wapsi) · Tareeqa
  (Bank / EasyPaisa / Cash, iconed) · Raqam (**green +** received, **red −**
  wapsi, **warn** expected-due, with a baqaya sub-line) · Status · a **Record**
  CTA on due rows / row menu otherwise. This is the WW-SETTLE
  advance→qist→settle→wapsi flow as a running khata.
- **Right rail:** **Is mahine ka hisaab** (net big number, a stacked in/out bar,
  Advance / Qist·Settle / Booking-fee / Wapsi breakdown → Net aamdani); **Baqaya —
  sab se zyada** (top outstanding, "aaj due" stamp, "Sab ko yaad dilayein");
  **Wapsi — jaldi karein** (refund queue with urgency stamps + "Wapsi process
  karein"). Sidebar Wapsi badge is warn-tinted. Both themes AA, zero errors.

## `reports.html` — Reports / analytics — 2026-08-30

The analytics screen (Grow section), same locked language. Charts are
hand-built SVG/CSS (no library — CSP-safe) and follow the **dataviz** skill.

- **KPI row (4):** Kul kamaai · Kul bookings · Auosat deal · Occupancy — each with
  a mini **bar sparkline** (last bar gold-emphasised) + up/down delta.
- **Kamaai ka trend (hero):** single-hue **gold area chart**, y-grid in lakhs,
  emphasised end-point, and a **hover crosshair + tooltip** (month + Rs) on a
  transparent hit-rect; touch-draggable too.
- **Function ki qism:** horizontal bars in the suite categorical hues (Walima
  gold / Barat blue / Mehndi green / Nikah violet) with direct count + % labels.
- **Log kahan se aaye:** an SVG **donut** (WhatsApp / Referral / Instagram /
  Website — leads.html source hues) + a legend with counts and %; centre = total.
- **Har mahine occupancy:** 12 monthly bars, current month gold + %-labelled.
- **Halls ki kaarkardagi:** table with coloured dots + inline occupancy mini-bars.
- Colour is **never alone** — every categorical mark carries a direct label /
  legend value (the secondary encoding the dataviz rule requires for the suite's
  close green/blue hues, kept for cross-screen consistency). Both themes AA,
  zero page errors.

## `chat.html` — Chat / inbox (WhatsApp-style) — 2026-08-30

The messaging screen (Console section), same locked language. A full-height
**three-pane** inbox, driven by a `CONVS` array so conversations switch live.

- **Conversation list:** search + filter tabs (Sab / Anpadhe / Leads / Bookings),
  rows with avatar + **source dot** (WhatsApp green / Instagram violet / Referral
  gold / Website blue), name, time, last-message preview (with a read-tick or a
  "likh rahe hain…" typing state), gold unread badge, and a booking/lead **context
  chip**. Active row = gold edge-bar.
- **Thread:** header (name + presence + call / WhatsApp / more), messages with a
  day separator, **in** (surface, left) / **out** (gold-wash, right) bubbles with
  timestamps + **read ticks**, a document bubble, an animated **typing** bubble,
  quick-reply template chips, and a composer (attach / input / template / send).
- **Context rail:** big avatar + phone/city + call/WhatsApp/profile, a
  **booking-or-lead detail** card (hall/date/guests/baqaya, or event/budget),
  context **Foran karein** actions (booking → Payment record / Booking kholein /
  Invoice; lead → Quote bhejein / Booking banayein / Call), and shared files.
- Clicking a conversation swaps thread + rail + quick-replies together; filter
  tabs re-filter the list. Both themes AA, zero page errors.
