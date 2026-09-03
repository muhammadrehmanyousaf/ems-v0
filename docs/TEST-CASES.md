# Vendor Console — UI Test Cases (pixel-perfect)

Manual + automatable UI test cases for the champagne vendor console. Every case
is a UI observation: open the screen, look, interact, compare.

## Pixel oracle & how to run

- **Oracle:** `docs/design-samples/*.html` is the pixel source of truth; `docs/design-rules/*`
  defines the tokens (type scale, spacing, color, states). A screen "passes pixel"
  when its layout, type, spacing, color and states match its sample.
- **Instrument:** a real browser (headed). Vendor account → champagne console.
  Writes go to the **live DB** — scope every create/edit/delete to the QA venue
  **#3377** ("Zzz QA Coverage Marquee — safe to delete") and clean up.
- **Matrix (run every case across):** desktop **1440×900**, tablet **768**, mobile
  **390** · theme **light** + **dark** · state **empty / loading / error / populated**.
- **Priority:** **P1** blocker (money/data/broken) · **P2** major (visible defect) ·
  **P3** minor (cosmetic).
- **Pass = 0 console errors + 0 failed (5xx) network** on every screen (a documented
  exception: `/reviews/:id` 404 on a non-approved venue is a graceful empty state).

Result columns to fill per run: `Pass / Fail / Blocked` + evidence screenshot +
device/theme.

---

## A. Shell Contract — applies to EVERY screen (SC-*)

Run these on **each** screen before its screen-specific cases; they are the
champagne-shell invariants.

| ID | Case | Steps | Expected (pixel/behaviour) | Pri |
|----|------|-------|----------------------------|-----|
| SC-01 | Primary rail | Look at the left sidebar | Rozana group always visible; Khata + Set up open a secondary panel; active item is lit (gold text + rail); icons + labels match sample; venue chip at top with logo/initial + name + city | P2 |
| SC-02 | Top bar | Look at the header | Breadcrumb (bold crumb + sub), Search (⌘K), theme toggle (sun/moon), notification bell with unread dot; all vertically centred, right-aligned cluster | P2 |
| SC-03 | Sticky frame | Scroll the listing | Page head + toolbar/tabs + table **column-headers stay frozen**; only the list body scrolls; no double scrollbar; header doesn't overlap first row | P1 |
| SC-04 | No h-scroll | Resize 1440→768→390 | Body **never** scrolls horizontally; wide tables scroll inside their own container (`overflow-x`) | P1 |
| SC-05 | Dark mode | Click the theme toggle | **Whole page** (shell **and** content) flips dark; gold accent preserved; text light on dark ground; no light card left on a dark ground; toggle again → back to light | P1 |
| SC-06 | Responsive | View at 768 then 390 | Layout reflows; dense tables become **card lists** on mobile; filter chips wrap; nothing clipped or overlapping; buttons keep tap size ≥40px | P1 |
| SC-07 | Empty state | Open a screen with no data (QA venue) | Friendly Urdu-Roman message + relevant CTA (not a blank area, not a raw "no data"); matches sample's empty copy | P2 |
| SC-08 | Loading | Reload; watch first paint | Skeleton/spinner while fetching; no layout jump when data lands; no flash of "0" then real value | P2 |
| SC-09 | Error state | Trigger a failed fetch (offline) | Inline error banner ("Load nahi hua…") + retry; the rest of the shell stays intact (one card fails, not the page) | P1 |
| SC-10 | Drawer | Open any "Naya …" form | Drawer slides from right; scrim dims the page; title + close (×); Esc, scrim-click and "Waapas/Cancel" all close it; body scrolls if long | P2 |
| SC-11 | Confirm on delete | Click any delete/remove | An **openConfirm** dialog appears (title + message + danger-styled "Haan"); no one-click destructive delete anywhere | P1 |
| SC-12 | Venue switcher | Change venue in the top-left chip | Content re-scopes to the chosen venue (figures/rows change); selection persists on reload; Settings opens the **same** venue | P1 |
| SC-13 | Search | Type in top-bar Search / ⌘K | Content filters live; clearing restores; no full-page reload | P3 |
| SC-14 | Client nav | Click another module | Route changes **without a reload flash** (shell persists); active nav updates; back/forward work | P1 |
| SC-15 | Type & spacing | Compare headings/body to `design-rules` | Type scale, weights, uppercase-label letter-spacing, and section gaps match the tokens; headings balanced, body ~65ch | P3 |
| SC-16 | Money format | Read any Rs figure | PKR grouping (lakh/crore, e.g. `Rs 14,00,000`); tabular-nums align in columns; no `NaN`/`undefined`/`Rs 0` where a value exists | P1 |
| SC-17 | Copy | Read labels | Urdu-Roman copy correct, no lorem, no untranslated keys; ⚠ verify money-truth wording ("Mil chuka" = received, not required) | P2 |
| SC-18 | Console/network | Open devtools | 0 console errors, 0 pageerrors, 0 5xx; 4xx only where expected (documented) | P1 |

---

## B. Rozana — the daily loop

### Overview — `/dashboard` (TC-OV)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| OV-01 | Greeting + date | "Assalam-o-Alaikum, <name>" + today's date, Urdu-Roman | P3 |
| OV-02 | 4 KPI tiles | Is mahine bookings / Khata aya paisa / Baqaya vasool karna / Aane wale 7 din — equal width, gap per sample, each with big number + sub + sparkline + trend badge | P2 |
| OV-03 | KPI values | Match venue-scoped API (bookings count, received, pending, upcoming); money in PKR grouping | P1 |
| OV-04 | Revenue chart | Area chart, 3M/6M/1Y toggle switches range; axis labels; endpoint dot; "Kul/Ausat/Sab se acha" summary row | P2 |
| OV-05 | Occupancy donut | % booked, Booked/Khaali din split reconciles (booked+khaali = year days) | P2 |
| OV-06 | Rating widget | With reviews → stars + count; none → "Abhi koi review nahi…" empty state (no error UI on a QA/unapproved venue) | P2 |
| OV-07 | Upcoming events | Lists venue bookings with status pills; each row clickable → booking detail | P2 |
| OV-08 | Wapsi (refunds) | "jo dena hai" — refunds owed list, or "Koi wapsi baaki nahi — sab settle" | P2 |
| OV-09 | CTAs | "Nayi booking" (gold) opens the create drawer; "Calendar" navigates to calendar | P2 |
| OV-10 | Venue scope | Switch venue → all tiles/chart/lists re-scope | P1 |

### Leads — `/dashboard/leads` (TC-LD)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| LD-01 | Pipeline tabs | Sab / Naya / Raabta / Quote / Visit / Jeeta / Khoya with correct counts; active tab lit; clicking filters the list | P2 |
| LD-02 | Sticky table | Column headers freeze; rows scroll (SC-03) | P1 |
| LD-03 | Lead row | Name, contact, event type, status pill, next-follow-up; phone shows red "Enter a valid Pakistani number…" hint on legacy 10-digit numbers — **button still enabled** (WWL-LEADFREEZE, this is intended) | P2 |
| LD-04 | Naya lead | "Naya lead" drawer: fields render; required validation; save → row appears; scope to #3377 | P1 |
| LD-05 | Convert | "Convert to booking" opens the booking flow prefilled from the lead | P2 |
| LD-06 | Detail | Click a lead → `/dashboard/leads/:id` renders ("Pipeline" detail, contact, activity, money) | P2 |
| LD-07 | Delete | Delete a lead → openConfirm → row removed | P1 |
| LD-08 | Empty | No leads → empty state + "Naya lead" CTA | P3 |

### Bookings — `/dashboard/bookings` (TC-BK)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| BK-01 | Header + count | "Saari shaadiyan aur events — N total (pehle 50 dikhaye)" | P3 |
| BK-02 | Filter chips | Sab / Confirmed / Pending / Baqaya due / Ho gaya with counts; filter the list; wrap on mobile | P2 |
| BK-03 | Sticky grid | 100+ rows, column headers frozen; row scroll; mobile → card list | P1 |
| BK-04 | Search | "Couple ya booking # dhoondein…" filters | P3 |
| BK-05 | Pagination | Pages 1..N; prev/next; count label correct | P2 |
| BK-06 | Row → detail | Click a row → `/dashboard/bookings/:id` | P2 |
| BK-07 | Export | Export button produces the list | P3 |
| BK-08 | Nayi booking | Opens the create drawer (see BK-DTL for money) | P1 |

### Booking detail — `/dashboard/bookings/:id` (TC-BKD)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| BKD-01 | Header | Customer + status pill + venue + booking #; "Cancel booking" / "Payment record karein" when applicable | P2 |
| BKD-02 | **Money card** | Kul package / **Mil chuka** (paid) / **Baqaya** — read from `booking-money` (receivedOn/outstandingOn), **NOT** the `booking-status` flag; % badge; cancelled → "Baqaya Rs 0 (cancel ho chuki)" | **P1** |
| BKD-03 | Reconcile | Kul = Mil chuka + Baqaya (active); paid = Σ real receipts / recorded advance | **P1** |
| BKD-04 | Timeline | Payment history from real receipts (Advance / Qist n) with date + method | P2 |
| BKD-05 | Record payment | "Payment record karein" drawer → amount → save → **paid increments, baqaya decrements** correctly; receipt appears | **P1** |
| BKD-06 | Cancel | "Cancel booking" → confirm → status Cancelled; baqaya → 0 | P1 |
| BKD-07 | Slow-load | Detail fans out ~7 money calls — shows loading, then all figures (no perpetual spinner) | P2 |

### Calendar — `/dashboard/calendar` (TC-CAL)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| CAL-01 | Month grid | Days render; today marked; bookings/holds shown on their dates | P2 |
| CAL-02 | Nav | Prev/next month; "today" jump | P3 |
| CAL-03 | Day click | Opens the day's bookings / hold action | P2 |
| CAL-04 | Blocked/held days | Visually distinct (blocked vs slot-block, don't conflate) | P2 |

### Chat — `/dashboard/chat` (TC-CH)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| CH-01 | Inbox | Sab / Anpadhe / Leads / Bookings tabs with counts; conversation list | P2 |
| CH-02 | Socket | Socket.io connects (console "Socket connected"); no ERR_CONNECTION on the configured backend | P1 |
| CH-03 | Open thread | Click a conversation → messages + lead-detail panel + quick-reply chips | P2 |
| CH-04 | **Send** | Type in "Message likhein…" → send → message appears **live** in the thread (optimistic + persisted). ⚠ TEST ONLY against the QA-customer thread (user 3370) — never a real lead | P1 |
| CH-05 | Empty | No conversations → empty state | P3 |

### Function sheets — `/dashboard/function-sheets` + composer (TC-FS)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| FS-01 | List | Sticky list of function sheets; row → detail | P2 |
| FS-02 | Composer | `/dashboard/function-sheet-composer` renders ("Edit function sheet"); sections editable | P2 |
| FS-03 | Operations | `/dashboard/function-sheet-operations` renders ("Photography operations") | P3 |

### Customers — `/dashboard/customers` + detail (TC-CU)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| CU-01 | List | Sticky table; tiles (repeat/etc.); rows show name/email/bookings; call/WA/book icons (WA disabled when no phone) | P2 |
| CU-02 | Detail nav | Row click → `/dashboard/customers/<phone_… or email>` (never a bare numeric id — that path 404s) | P2 |
| CU-03 | Detail figures | Customer profile + booking history + ratings load; contactless (no phone+email) → graceful "figures load nahi ho sake" retry, not a crash | P3 |
| CU-04 | Nayi booking | Book button prefills the create drawer with the customer | P2 |

---

## C. Bechna & serve

### Quote requests — `/dashboard/quotes` (TC-QT)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| QT-01 | Grid | Quote request cards (`data-ww-list`) render; sticky where applicable | P2 |
| QT-02 | Respond | Open a request → respond/quote flow | P2 |
| QT-03 | Empty | No requests → empty state | P3 |

### Date holds — `/dashboard/holds` (TC-HD)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| HD-01 | List | Holds render as cards; sticky opt-in | P2 |
| HD-02 | Naya hold | "Naya hold" → date + time → "Hold lagayein" → hold created (POST `/vendor-holds`); collides correctly with a taken date | P1 |
| HD-03 | Release | Delete a hold → confirm → removed | P2 |

### Reviews — `/dashboard/reviews` (TC-RV)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| RV-01 | Grid | Review cards (`data-ww-list`); rating, comment, vendor reply | P2 |
| RV-02 | Reply | Vendor reply to a review saves | P2 |
| RV-03 | Delete guard | Any delete → openConfirm | P1 |
| RV-04 | Empty | No reviews → empty state (no error UI) | P3 |

### Field capture — `/dashboard/field` (TC-FL)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| FL-01 | Render | Field-capture UI renders; inputs work | P3 |

---

## D. Operations

### Trade ops — `/dashboard/trade-ops` (TC-TO)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| TO-01 | List/table | Rows render; header sticky where a table exists | P3 |

### Kitchen prep — `/dashboard/kitchen-prep` (TC-KP)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| KP-01 | Render | Kitchen-prep board/list renders | P3 |

### Brokers — `/dashboard/brokers` (TC-BR)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| BR-01 | List | Broker rows; sticky header | P2 |
| BR-02 | Naya broker | Create drawer (naam, agency, phone, commission % / flat) → save+edit+delete round-trip on #3377 | P1 |

---

## E. Grow

### Reports/Insights — `/dashboard/insights` (TC-IN)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| IN-01 | Charts/tiles | Reports render; figures venue-scoped; money PKR | P2 |
| IN-02 | Tax scoping | ⚠ each venue selection sends `businessId` (WWL-190) — figures differ per venue, not the group total | P1 |

### Plan & billing — `/dashboard/billing` (TC-BL)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| BL-01 | Plan | Current tier + billing rows (sticky) render | P2 |
| BL-02 | Upgrade | Upgrade CTA flow (no accidental charge in test) | P2 |

### Promote — `/dashboard/promote` (TC-PR)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| PR-01 | Render | Promote options render; toggles/CTAs work | P3 |

### Collaborations — `/dashboard/collaborations` (TC-CO)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| CO-01 | Tabs | Aane wale / Bheje hue with counts; invite/directory flow (not a simple CRUD create) | P2 |

---

## F. Khata (money) — **all P1-sensitive**

### Khata hub — `/dashboard/money` (TC-KH)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| KH-01 | Secondary panel | Aaya / Gaya / Records groups; active lit | P2 |
| KH-02 | Rows | Money rows render; sticky; totals reconcile; PKR format | P1 |

### Payments — `/dashboard/payments` (TC-PY)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| PY-01 | List | Payments (200+ rows) sticky; amounts PKR | P1 |
| PY-02 | Truth | Paid figures from receipts/booking-money, not the paymentStatus flag | P1 |

### Receipts — `/dashboard/receipts` (TC-RC)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| RC-01 | List | Receipts render; sticky; each has amount/method/date | P1 |
| RC-02 | Voided | Voided receipts excluded from "counted" money | P1 |

### Wapsi (due) — `/dashboard/receivables` (TC-RE)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| RE-01 | List | Receivables render; per-venue; totals reconcile | P1 |

### Kharche — `/dashboard/expenses` (TC-EX)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| EX-01 | List | Expenses table; category/method/date; PKR | P2 |
| EX-02 | Naya kharcha | Drawer (Amount*, Category*, Tareekh*, Kisko diya, Tafseel) → save (POST `/expenses` 201) → row appears; delete round-trip on #3377 | P1 |

### Staff & payroll — `/dashboard/staff` + detail (TC-ST)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| ST-01 | List | Sab/Mahana/Dihari/Contract tabs; KPI tiles; sticky | P2 |
| ST-02 | Naya staff | Drawer (Poora naam*, Kaam, Kism, Phone, tankhwah, WhatsApp, Status) → **rejects invalid phone** → valid save → row; edit + delete round-trip | P1 |

### Suppliers — `/dashboard/suppliers` + detail (TC-SU)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| SU-01 | List | Supplier rows; aging; sticky | P2 |
| SU-02 | Naya supplier | Create (naam, category, contact, phone, payment terms, bank) → save+edit+delete on #3377 | P1 |

### Cheque ledger (PDC) — `/dashboard/pdcs` (TC-PD)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| PD-01 | List | Cheque rows; status; PKR; sticky | P1 |
| PD-02 | Naya cheque | Create (cheque no, bank, amount, customer, note) → save+delete on #3377 | P1 |
| PD-03 | **Ownership** | A cheque can only be pointed at a booking the vendor **owns** (C6/IDOR) | **P1** |

### Tax report — `/dashboard/tax` (TC-TX)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| TX-01 | Report | Annual tax report renders; **per-venue** (businessId sent) not group total (WWL-190); PKR | P1 |

---

## G. Set up

### Business settings — `/dashboard/settings` (+ `/settings/advanced`) (TC-SET)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| SET-01 | In-shell | Renders **inside** champagne (no legacy icon-rail, no "kholein" placeholder) | P1 |
| SET-02 | Venue default | Opens on the **globally-active venue** (not always businesses[0]); "Editing N businesses" picker present; explicit `?biz=` overrides | P1 |
| SET-03 | Tabs | Profile / Capacity & pricing / Amenities / Listing content / Type-specific / Images / Packages / Menus / Bank details — all edit **inline** | P1 |
| SET-04 | Profile save | Edit name/description/city → "Save changes" → persists; "All changes saved" state | P1 |
| SET-05 | Menus tab | Menu cards (per-head price, dishes) with Add/Edit/Remove; "Add menu" drawer works | P1 |
| SET-06 | Packages tab | Package cards; add/edit/remove | P1 |
| SET-07 | Bank details | Bank fields edit + save; ⚠ verify it's the **right venue** (SET-02) | P1 |
| SET-08 | Images | Upload/reorder; size/type validation | P2 |

### Setup checklist — `/dashboard/onboarding` (TC-ON)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| ON-01 | Checklist | Steps render with done/pending state; each links to the right editor | P2 |

### Automation — `/dashboard/automation` (TC-AU)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| AU-01 | Rules | Reminder-rule toggles (T-14/T-3/T-1/T+1/lead) render with state | P2 |
| AU-02 | Naya rule | Inline "Naya rule" form → save → rule created; per-venue scoping (WWL-224); delete | P2 |

### Cancellation policy — `/dashboard/cancellation-policy` (TC-CP)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| CP-01 | Policy | Notice-window + refund rules render + editable; save persists | P1 |

### Halls & spaces — `/dashboard/spaces` (TC-SP)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| SP-01 | Tree | Space tree renders; capacity warnings; combine groups | P2 |
| SP-02 | Naya space | Drawer (naam, type, parent, seats, capacity, rent, session) → save → appears in tree; delete (`/venue-spaces/sub-venues/:id`) | P2 |

### Bookable slots — `/dashboard/slots` (TC-SL)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| SL-01 | Cards | Slot cards (Day/Midday…) with time + capacity + days + Edit/Band | P2 |
| SL-02 | Naya slot | Drawer: name, start/end, per-slot bookings, max guests, **day chips** (Pir…Itw / Sab din), buffer → "Slot banayein"; **rejects overlapping slot (409)** | P1 |

### Packages & menus — `/dashboard/packages` (TC-PK)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| PK-01 | Tabs | Packages N / Menus N tabs; cards with Edit/Copy/Delete | P2 |
| PK-02 | Naya package | Create package → save+delete on #3377 | P1 |
| PK-03 | Naya menu | Menus tab → add menu (name, per-head price, dishes) → save (POST `/menus/single-menu`) + delete | P1 |

### Venue-OS hub — `/dashboard/venue-os` (TC-VO)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| VO-01 | Health view | Single business-health view renders (no stale `?tab=` doors) | P2 |

### Inventory — `/dashboard/inventory` (TC-IV)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| IV-01 | List | Sab/category/Kam-stock tabs; KPI tiles; sticky; low-stock flag | P2 |
| IV-02 | Naya item | Drawer (naam, category, unit, stock, alert, last price, supplier, SKU) → "Item ban gaya" → row; **delete blocked while stock>0 (STOCK_NOT_ZERO 409)**; zero it then delete | P1 |
| IV-03 | Venue scope | Venue switcher re-scopes (WWL-243, businessId sent) | P2 |

### Generator fuel — `/dashboard/generator-fuel` (TC-GF)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| GF-01 | List + KPIs | Fuel-in / cost / consumed tiles; tank level; sticky log | P2 |
| GF-02 | Naya entry | **Inline** form (kism, fuel, litres*, rate, generator, date, run-hours, supplier, note) → Save → row; glyph sized correctly (1em, not oversized) | P2 |

### Halal certs — `/dashboard/halal-certs` (TC-HC)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| HC-01 | Register | Cert list; expiring flag; per-venue (WWL-328, businessId sent) | P2 |
| HC-02 | Naya certificate | Inline form → "Certificate save karein" → row; delete → confirm | P2 |

### Drone NOC — `/dashboard/drone-noc` (TC-DN)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| DN-01 | Register | Permit list; upcoming; per-venue | P2 |
| DN-02 | Naya permit | Inline form → "Permit save karein" → row; delete | P2 |

---

## H. Top bar

### Notifications — `/dashboard/notifications` (TC-NT)
| ID | Case | Expected | Pri |
|----|------|----------|-----|
| NT-01 | Feed | Notification feed (`data-ww-list`) renders; unread state; mark-read | P2 |
| NT-02 | Bell | Top-bar bell unread count matches; click opens feed | P2 |

---

## Regression anchors (run after any shell change)

- **R-01** All 42 routes render (light/dark/mobile), 0 console errors, 0 5xx.
- **R-02** Module→module nav: **0 document reloads** (client-side), shell persists.
- **R-03** Typecheck ratchet: **121 known / 0 new**.
- **R-04** Money screens read `booking-money`, never the `booking-status` flag.
- **R-05** Every destructive action gated by `openConfirm`.
- **R-06** Business-scoped screens send `businessId` on the venue switcher.

> **Known non-defects (do not file):** `/reviews/:id` 404 on a non-approved venue
> (graceful empty state); RSC-prefetch console noise in dev builds only;
> booking-detail ~14s load = 7 sequential money calls, not a hang.
