# Backlog burn-down — progress log

Tracks what has actually been fixed against
[00-OPEN-BACKLOG.md](00-OPEN-BACKLOG.md). One row per finding, with the commit
that closed it. Nothing is marked closed without a code change behind it.

| ID | Sev | Fix | Where |
|---|---|---|---|
| `WWL-260` | S1 | Shifts & payroll no longer crashes the route: `StatusPill` can't throw on an unknown tone, `normalizeAttendanceStatus` folds the legacy `present` value, the backend transition machine accepts a legacy `from`, the model normalises + validates on write, and a migration repairs the 95 rows | `status-pill.tsx` · `lib/api/staff.ts` · `payroll-tab.tsx` · `staffHelpers.js` · `staffShift.js` · migration `20260807090000` |
| `WWL-107` | S1 | `app.use("/")` scoped to `app.get("/")` + a real terminal 404. Unmatched paths no longer answer 200 | `src/loaders/routes.js` |
| `WWL-108` | S1 | `getVendorRevenue` no longer manufactures an empty ledger from a malformed 200 | `lib/api/dashboard.ts` |
| `WWL-019` | S1 | Blanket read-swallows removed from `notifications`, `chat`, `favorites`; the callers' existing error/revert branches are reachable for the first time | `lib/api/*` · `NotificationContext` · `ChatContext` |
| `WWL-390` | S2 | A lost mark-read now reverts and says so, instead of staying read on screen and returning on the next load | `NotificationContext.tsx` |
| `WWL-400` | S3 | A failed notification load is distinguishable from an empty inbox (`loadError`), and failed actions surface (`actionError`) | `NotificationContext.tsx` |
| `WWL-095` | S1 | A failed favourites load renders "Couldn't load" + Try again, not "No favourites yet" | `app/(main)/user/favorites/page.tsx` |
| `WWL-123` | S3 | Formula injection neutralised in **every** export path — the shared `ExportMenu` (CSV *and* xlsx), the TanStack table exporter, and the four planning-tools exports, which had no escaping at all | `lib/utils/csv-escape.ts` + 7 call sites |
| `WWL-356` | S1 | A business can no longer delete a review written about it — action removed from the UI, refused by the API with a reason, and the audit snapshot is now blocking rather than best-effort | `reviewController.js` · `row-actions.tsx` · `columns.tsx` · `reviews-table.tsx` |
| `WWL-369` | S3 | Pressing Pin no longer announces "Review unpinned" | `reviews-table.tsx` |
| `WWL-078` | S1 | `Share link` no longer takes the function-sheet route down — the hooks below the `if (!sheet) return null` guard are hoisted above it | `share-link-dialog.tsx` |
| `WWL-079` | S1 | `/sign`, `/review` and `/wedding` tokens are excluded from the lowercase 301, which was mangling every case-sensitive share token in transit | `middleware.ts` |
| `WWL-080` | S1 | Closes with `WWL-079` — the customer's only signing route works, so a contract can be signed at all | (same) |
| `WWL-071` | S1 | Customer documents no longer print `(no label)` against real money — reader accepts either stored spelling, in the PDF generator, the vendor's detail view and the customer's signing page | `functionSheetPdfData.js` · `functionSheets.ts` · detail view · `/sign/[token]` |
| `WWL-081` | S1 | The composer loads either spelling and saves both, so opening it can no longer destroy the line-item descriptions on a live contract | `function-sheet-composer-view.tsx` |
| `WWL-569` | S1 | Availability folds in committed bookings that were never mapped to a space; the public page says "Check with venue" and names the count instead of showing green | `spaceBookingService.js` · `venue-space-selector.tsx` |
| `WWL-604` | S2 | "Hold a date" arrives pre-filled and valid, so it now confirms and names the date it is about to take | `hold-date-dialog.tsx` |
| `WWL-608` | S3 | A lead/hold captured in the field attaches to the resolved venue instead of nothing | `field-capture-view.tsx` · `hold-date-dialog.tsx` |
| `WWL-062` | S3 | The hold dialog's date floor is Karachi's today, not UTC's yesterday | `hold-date-dialog.tsx` |

| `WWL-597` | S2 | **Close & lock month** requires the period to be typed, and states that late bills and corrections will be refused | `period-close-view.tsx` |
| `WWL-558` | S2 | **Post rent** confirms and points back at Preview, which writes nothing | `venue-lease-view.tsx` |
| `WWL-583` | S3 | **Open drawer** confirms, naming the opening float it is about to reconcile against | `cash-float-close.tsx` |
| `WWL-609` | S2 | **Decline** confirms, names the customer and event, and says "you haven't sent them a price yet" when the quote is still an enquiry | `quotes-view.tsx` |
| — | S2 | **Accept** confirms too — it commits the venue to the customer's number | `quotes-view.tsx` |

## Wave 2 — the systemic families, swept

| Family | Findings | What was done |
|---|---|---|
| **F1** false success | `WWL-142` `159` `312` `333` `351` `370` `416` `435` `473` `492` `503` `556` `591` `605` `606` | Fixed at the **transport layer**: the axios interceptor rejects a 2xx whose envelope says `status: false`, or that carries the API banner. Every call site already had a `catch` showing an error toast — it was unreachable |
| **F2** a11y floor | `WWL-237` `254` `270` `281` `297` `315` `331` `349` `379` `405` `423` `446` `467` `498` `522` `525` `536` `548` `588` `596` `598` `603` `607` | **73 placeholder-only inputs** across 22 Venue-OS views wrapped in real `<label>`s · `Heading` renders `h1` instead of `h2`, so pages have a document heading at all · **86 `<th>`** across 20 files got `scope="col"` |
| **F3** venue scoping | `WWL-233` `570` `608` `610` `611` | `useBusinessIdField` is now the only scoping primitive on quotes, space P&L, kitchen prep, the expense dialog's space picker, field capture and the hold dialog. The quotes header names the venue |
| **F5** irreversibles | `WWL-558` `583` `597` `602` `604` `609` + Accept | Confirms that state the consequence. **Close & lock month** requires the period to be typed |
| **F8** numeric bounds | `WWL-246` `263` `279` `303` `305` `320` `325` `340` `342` `551` `586` | **49 numeric inputs** that accepted negatives got `min={0}` |
| **F10** UTC → PKT | `WWL-062` `112` `158` `165` `181` `285` `300` `318` `338` `354` | **21 call sites across 16 files** now use `todayInKarachi()` |
| **F6** money truth | `WWL-541` `542` `554` | The headline is labelled **"Booked − tagged spend"**, the margin is computed only over functions that have a cost, and a panel states the three things it is not — in the vendor's own figures |

## Wave 3 — mobile, raw ids, dead doors, hidden features

| Family / ID | Findings | What was done |
|---|---|---|
| **F4** mobile | `WWL-053` `086` `093` `122` `146` `160` `244` `265` `280` `296` `377` `391` `459` | **Both table layers** now render cards below `md`, built from the same column config, with the actions cell lifted out and given full width. `globalTable` (bookings, customers, reviews, payments…) and the primitives `DataTable`. Selection checkboxes come with it, which also closes `WWL-122` |
| **F11** raw ids | `WWL-563` `592` `599` | Two `Business #` boxes deleted (the venue was already chosen by name on the same panel) · `Meter #` → named dropdown of the meters already loaded above it · `Partner #` → named dropdown from the cap table · the rest say where the number comes from |
| **§4** dead doors | `WWL-516` `517` | Every verification item, and the only link in *"Highest-impact next moves"*, pointed at `/dashboard/business-documents` — not a route. Now `/dashboard/business/{id}/documents`. Verified by checking every internal href against the 306-route app router: **zero dead links remain** |
| **§3** hidden features | `WWL-128` | The offline/online payment split has always been computed and was rendered nowhere. Now two cards |
| Money screen | `WWL-118` `115` | A "Still owed" filter, sort by Most owed / Biggest / Event date, search that matches amounts and statuses, and stat cards that describe the rows actually on screen |

## Wave 4 — derived state, naming, engines with no UI

| ID | Sev | Fix | Where |
|---|---|---|---|
| `WWL-286` | S2 | Brokers' Overdue card counted `status === "overdue"`, a status **no production commission carries**, so it read 0 while Rs 138,750 was 36–122 days late. Now derived from `dueDate`, and the card shows the amount too | `brokers-redesigned-view.tsx` |
| `WWL-287` | S2 | Added the **Due** column. Every row carries a `dueDate` and the CSV export wrote it — the screen showed only the accrual date | `brokers-redesigned-view.tsx` |
| `WWL-288` | S2 | All / Overdue / Still owed / Paid filter with live counts. The Overdue card was inert, so there was no path from "something is late" to "which ones" short of opening the CSV | `brokers-redesigned-view.tsx` |
| `WWL-273` | S2 | Same root cause in Suppliers, where it produced a *wrong set* rather than a flat zero | `suppliers-redesigned-view.tsx` |
| `WWL-285` | S3 | `daysFromNow` counts in Karachi, not against UTC midnight | `suppliers-redesigned-view.tsx` |
| `WWL-276` `277` | S3 | The aging endpoint **ranks suppliers by what's outstanding** and the UI discarded it — now a top-six list, with the grand total the vendor had been adding up by hand | `suppliers-redesigned-view.tsx` |
| `WWL-307` `308` | S3 | Generator tank status is computed server-side and rendered nowhere. Now a per-generator panel | `generator-fuel-redesigned-view.tsx` |
| **F12** naming | 13 screens | Sidebar name vs rendered page title disagreed on **13 routes**. Venue-OS was worst: the heading said "Venue-OS" whichever tab you were on, and all seven tab labels differed from the sidebar — click *"Halls & spaces"*, land on *"Venue-OS"*, see a tab called *"Spaces"*. Three names, none matching | `venue-os/page.tsx` · `venue-os-hub-view.tsx` + 11 |
| Docblocks | — | 22 component headers claimed `/dashboard/<x>-new` routes. **Zero of them exist** | 22 files |

## Wave 5 — the money engine, and the seams underneath it

The largest single root cause in the backlog: **five surfaces derived cash from a
flag instead of from the amount columns.**

| Family / ID | Findings | What was done |
|---|---|---|
| **Money truth** | `WWL-001` `002` `005` `037` `040` `047` `109` `110` `111` | `paymentStatus === "Paid"` credited the FULL total as received; `!== "Partial"` credited nothing. On live data they disagree on 2 bookings of 22, and those two rows **are** the entire Rs 1,124,500 by which the four money screens differed. One rule now, in `utils/bookingMoney.js` + `lib/utils/booking-money.ts`. Tests reproduce the wrong Rs 21,201,121 from the old code and the true Rs 20,076,621 from the new |
| **Counter screen** | `WWL-040` | Record Payment told a vendor to collect **Rs 350,000 from a customer who owed Rs 315,000**, with the customer at the counter. It also *hid* "Record payment" on the one booking with Rs 1,159,500 outstanding, because the stale flag said Paid |
| **Venue scoping** | `WWL-006` `129` | `?businessId` was accepted by the action summary and applied to the calendar strip **alone**. And receivables scoped-to-one-venue matched via `BookingDetails` while scoped-to-all matched only `vendorIds`, so one venue could report **95% more** than all three combined |
| **Aging** | `WWL-131` | Every aging row rendered green, including 99 days overdue: the tone test was `v.includes("0")` and every bucket name contains a zero. On the screen whose job is showing who is late, nobody was ever late |
| **Bookings list** | `WWL-036` `042` `043` `044` | `bucket=cancelled` returned the **entire** ledger (25 rows vs 10/12) because unknown values fell through to no filter. Cancelled is a real bucket now, unknown values narrow rather than widen, there is pagination, and a cancelled booking's order is locked |
| **Profit board** | `WWL-008` `009` | Rows with nothing tagged reported **100% margin**; "Most profit" therefore ranked the least-documented events highest and put a cancelled wedding at Rs 0 received on top. Margin is now `—` where there is no cost, and a **Cash position** column states what each function actually put in the account |
| **Availability** | `WWL-057` `058` `060` `061` | Two slot vocabularies with **no translation between them**: `"Mehndi"` can never equal `"18:00"`, so a held date came back fully available and a vendor's hold blocked no booking at all. Plus: a space-managed venue with unmapped bookings returned `{}` for a month containing a Rs 1,546,000 wedding |
| **Calendar** | `WWL-059` `099` `101` `103` | The subscription URL addressed the **frontend** host, so every subscription 503'd — the feed itself was always valid. The grid asked for `bucket=active`, which is defined as "hide Completed and Cancelled", so "every event on one grid" had no past. Holds now render |
| **Leads** | `WWL-031` `032` `033` `034` | Six bad fields took six submits, each naming an API field the vendor had to map to a box by guesswork. A lead's **budget was dropped at the moment it became a booking** |
| **Customers** | `WWL-088` `089` `091` `092` | The client book showed each person's **platform-wide** bookings and spend — wrong figures, and a cross-vendor disclosure. `/community-trust` answered for **any** phone number |
| **Policy** | `WWL-501` `502` | Three named templates existed twice; two had drifted, so "Aam" promised the customer Rs 611,639 while the engine returned Rs 1,223,278. Derived from one table now, with 13 tests |
| **Sheets** | `WWL-072` | Every sheet's payment schedule is correct to the rupee and reached **nobody** — gated to two PDF variants no sheet has ever reached |
| **F13** false zeros | `WWL-004` `018` `052` | A failed load rendered `Rs 0` with a **green upward arrow**. 24 money tiles across 14 screens now render `—` and "couldn't load" via a new `StatCard error` prop |

## Shared primitives built (the leverage)

| Primitive | Closes | What it guarantees |
|---|---|---|
| `lib/api/assert-ok.ts` | F1 — 41 false-success findings | A 2xx that carries `status: false`, the API banner, or no envelope at all now throws instead of reaching a success toast. `errorMessage()` prefers the server's words over axios's English |
| `components/dashboard/primitives/dangerous-action.tsx` | F5 — 23 one-click irreversibles | Wraps the trigger, states the consequence in the vendor's terms, and can require the vendor to type a word for the truly unundoable (period close, journal posting) |
| `components/dashboard/primitives/labelled-field.tsx` | F2 + F8 — 63 findings | Every input gets a real `<label for>`, required marked in the accessible tree, errors with `role="alert"`; number fields default to `min=0` so a negative day-rate can't be typed |
| `lib/utils/pk-date.ts` | F10 — 10 findings | `todayInKarachi()` and friends. For the first five hours of every Pakistani day, `toISOString().slice(0,10)` returns yesterday — which is how a receipt dialog came to refuse today's date at 2am |
| `utils/bookingMoney.js` + `lib/utils/booking-money.ts` | 9 money findings | Received is the amount column; outstanding is arithmetic on the two amounts; the flag is a label *about* that arithmetic and never an input to it. Both sides of the wire share one rule, pinned to the live figures by 19 tests |
| `utils/slotVocabulary.js` | `WWL-058` + the long-standing RP-14 | The translation between named slots (Mehndi, Baraat, Evening) and clock slots (09:00, 14:00, 18:00) that never existed. Ambiguous function names hold the whole day: over-blocking a hold the vendor placed on purpose costs an enquiry; under-blocking costs two baraats in one hall |
| `StatCard error` prop | F13 — 24 tiles | A missing figure cannot render as a number. Em dash, no trend arrow, "couldn't load" |

## Notes

- The four planning-tools exports (`budget`, `checklist`, `guest-list`,
  `timeline`) were joining raw cells with `,` and no quoting whatsoever, so any
  guest name containing a comma corrupted the file. Fixed alongside the
  injection, since it is the same line of code.
- `bookingOrder.ts`, `ai.ts`, `businessDrafts.ts`, `availabilitySetup.ts` and
  `venueOs.ts` also contain `catch → return null`, but those are **narrow and
  correct**: they swallow one specific status (a 404 feature-probe, a 503
  AI-unavailable) and rethrow everything else. Left alone deliberately.
- `ChatAPI.getTotalUnread` stays soft. It is fired-and-forgotten from four call
  sites as a badge count; making it throw would produce unhandled rejections for
  no user-visible benefit. It logs now instead of failing silently.

---

## What is deliberately still open

Everything below needs per-screen work or a product decision; no shared
primitive reaches it. It is the honest remainder, not a hidden backlog.

**Product gaps — the feature is not there** (§5 of the backlog, ~18):
no way to cancel or downgrade a plan (`WWL-433`) · "Plan & billing" contains no
billing (`WWL-436`) · Availability has no calendar (`WWL-500`) · a commission
cannot be attached to a broker or its event (`WWL-289`) · the Halal certificate
document cannot be attached anywhere (`WWL-322`) · a drone permit cannot be tied
to its wedding (`WWL-348`) · collaboration stops at "accepted" (`WWL-463`) · the
اردو toggle is inert (`WWL-011`) · `Toggle Sidebar` is dead (`WWL-013`) · ⌘K
finds no data (`WWL-015`).

These are the ones that need a decision rather than a fix. Each is a screen to
design, not a defect to correct, and guessing at what the feature should be is
the wrong way to spend the trust the rest of this work has earned.

**Documents that are still the same document** (`WWL-073`, `WWL-075`): the
Service Contract and the BEO now differ from the Quotation by more than a title
— the contract carries the payment schedule and a signature block — but the BEO
still has no guest timings, no menu, no setup instructions and no kitchen notes.
It is an operations document that contains no operations. That is a content
design job.

**Per-space availability** (`WWL-100`): the halls × days grid renders 98 cells
whose columns are all identical, because bookings carry no space assignment
(`WWL-050`). One booking marks the whole property unavailable, so the vendor
cannot sell the Terrace Lawn on a day the Main Hall is taken. A matrix that
implies a granularity the data does not have is worse than no matrix; fixing it
means assigning spaces at booking time, which is a flow change.

**Backend engines with no UI** (§3, remaining): the broker directory
(`WWL-295`), four server-side filters wired to nothing (`WWL-310`), the
`/upcoming` permits endpoint (`WWL-347`), and five groups of
fetched-but-unrendered fields. (`WWL-276`, `WWL-277`, `WWL-306`–`308` closed in
wave 4.)

**Unreachable screens** (§4 remainder): `WWL-229` (unreachable for every
vendor), `WWL-528` (four Venue-OS tabs render only a heading), `WWL-352` (the
Compliance rail is empty in production), `WWL-559`, `WWL-601`, `WWL-017`
(11 of 20 onboarding tasks dead-end).

**The rest of the S3/S4 tail** — copy fixes, stale component headers, tone and
formatting drift. Individually cheap, collectively a long list; each is one row
in [00-OPEN-BACKLOG.md](00-OPEN-BACKLOG.md) with a reproduction.

**The 1,864 unrun cases** still need a seeded staging vendor, a test customer and
a second vendor account. That infrastructure is unchanged by this work.
