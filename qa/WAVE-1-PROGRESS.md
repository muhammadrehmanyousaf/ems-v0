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

**Per-space availability** (`WWL-100`, `WWL-050`) — **CLOSED in wave 6.** See
the section below.

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

---

## Wave 6 — a booking now records the space it occupies

`WWL-100` and `WWL-050` were one defect on four surfaces, and it was not a
display bug: **a booking never recorded which hall it was in.**

Because nothing carried the answer, every surface had to guess, and each guessed
differently:

| Surface | What it did | What the vendor saw |
|---|---|---|
| Availability grid | counted bookings per **day**, client painted every free cell Booked | 7 halls × 14 days, all columns identical — the Terrace Lawn unsellable on a day only the Main Hall was taken |
| `availabilityForRange` | read `BookingSpaces` claims only | production has none: the writer sat behind `SCHEDULING_MULTI_RESOURCE`, never enabled |
| `availabilityForDate` | a third rule (`fullyCommitted`) | disagreed with both of the above |
| Bookings table + CSV | read `resource.label` | `—` on all 22 rows; an empty column in every export |

Underneath sat **two disjoint space tables**. `BusinessResource` counts capacity
for vendor types whose resource is a crew, a chair or a vehicle, and picked up a
`'hall'` kind along the way. `SubVenue` is the venue tree — Hall → Floor →
Partition, carrying capacity, gender mode, per-space slots, per-space expenses,
per-space P&L, the public "Choose your space" selector and the booking engine.
Vendors build halls in the SubVenue tree; **the booking dialog's hall picker read
`BusinessResource`**, so it was empty at every venue that has halls, nothing was
ever assigned, and the grid had nothing per-hall to show.

### What was built

**One rule.** `utils/spaceOccupancy.js` decides, `services/spaceOccupancy
Service.js` reads. Occupancy unions the `BookingSpaces` claim with a new
`BookingDetails.subVenueId` assignment, applies tree semantics on read from
`parentSubVenueId`, and takes sessions from `slotVocabulary` so a morning mehndi
and an evening walima coexist in one hall. The grid, the booking refusal, the
public selector and the assignment endpoint all resolve through it — a green
cell and a refusal cannot disagree.

Tree semantics are read from parent pointers, not the materialised `path`
column, deliberately: `String(null).startsWith(null)` is `true`, so a
path-based check silently makes every node an ancestor of every other whenever
`path` is NULL. There is a test for exactly that.

**Unassigned bookings are reported, not guessed.** Both silent answers are
wrong — painting halls Booked destroys sellable inventory (that *is* `WWL-100`),
painting them Free hides a booking. The grid gets a "No hall recorded" row with
a count per day; tapping a cell records the hall. The one exception is a venue
with a **single bookable space**, where there is nothing to be ambiguous about:
those bookings are resolved automatically, which makes the grid truthful for the
large majority of the platform with no vendor action and no data migration.

**`WWL-569` is explicitly preserved.** Reporting ambiguity is right for the
vendor, who owns the business and can resolve it. It is not right for a
customer: a stranger offered a hall that "might" be occupied is how the public
double-booking happened. So the caller states its policy — the public selector
passes `blockOnUnassigned`, the vendor grid does not. Two tests pin both halves.

### Regression discipline

- The `SCHEDULING_MULTI_RESOURCE` gate is gone, but `BookingSpaces` claims are
  written **only for an explicit pick**. Claiming on behalf of the ~3,269
  single-space venues that chose nothing would newly subject their existing
  booking patterns to the Postgres `EXCLUDE` constraint, which can only reject
  more than today. Their broad (business, date, time) guard is untouched, and
  their grid is truthful from the assignment column alone.
- `getBusinessAvailabilityBulk`'s per-hall path was also flag-gated, so **every**
  venue took the per-business rule there — one booking made the whole property
  unsellable at that slot. It is now decided by whether the venue actually has
  more than one bookable space. Single-space venues are byte-identical.
- `bookingSlotToRange` built `${date}TBarat:00.000+05:00` — an Invalid Date —
  for any non-clock `bookingTime`, so a slot-template or named-function booking
  could never have written a claim at all. Fixed via the same vocabulary.
- The migration is additive, nullable and reversible; its backfill only touches
  venues with a single bookable space. **Not run** — prod-first, the operator's.

### Flags removed

`venue_os_v2` gated the grid on both ends, so the calendar a venue needs most
answered 404 for almost every vendor. Per the standing no-flags rule it was
debt, and behind it this entire fix would have been invisible. Ownership is
still enforced by the endpoint; a flag was never what protected it.

### Still open in this area

- **`WWL-100` follow-through is data, not code.** A multi-space venue's *past*
  bookings stay unassigned until the vendor records them — by design, because
  guessing which hall a past wedding was in would put a wrong answer on their
  calendar. The grid now names them and fixes each in one tap.
- **Not verified on live production.** Nothing here is deployed and the
  migration has not been run. The claims are backed by 28 new unit tests and the
  live evidence in `LIVE-MODULE-TEST-PLAN.md`, not by a browser session against
  weddingwala.pk.

---

## Wave 7 — the 16 open S2s, and the migration is live

Every S2 remaining in the sweep is closed. They clustered into eight pieces of
work, two of which were systemic and fixed once rather than per screen.

| Findings | What it was |
|---|---|
| `WWL-302` `303` `304` `305` | `litres > 0` applied to all four generator entry types: **Maintenance** involves no fuel and **a tank reading of 0** is the reading that stops an event mid-baraat, so neither could be saved. Meanwhile the cost guard covered deliveries only, so a consumption row saved with `costPerLitre: -99`, `runHours: -40`. The **server was already correct on all three** — the form was stricter where it should be permissive and looser where it should refuse. |
| `WWL-231` `232` `234` | Any rejection — unroutable host, HTTP 500 — rendered *"the kitchen-BOM engine isn't enabled for your account yet"*. Rows with a bad head count were silently dropped, so the cook sheet came out missing a dish with nothing saying so. At 360px the guests input and Remove were **entirely off-screen**. |
| `WWL-242` `262` | Both create dialogs were handed `businesses?.[0]?.id`, so under "All venues" a stock item or a new hire landed on whichever venue came first, with no venue field to notice it. |
| `WWL-244` `245` | 108 inventory action buttons in the DOM, **0 reachable on a phone** — and Adjust stock is the only path that changes a count. Separately the app told the vendor to *"record an adjustment movement to zero it first"* and then refused to save a stock-take of 0. |
| `WWL-274` `275` `276` | Chip counts came from the filtered query, so clicking Overdue turned `All(23)` into `All(3)`. **"Credit available" was the sum of credit *limits*** — Rs 8,800,000 against Rs 1,469,250 already drawn, 20% high, on the number a vendor uses to decide whether to place another order. |
| `WWL-113` `114` | An absolute sanity cap and nothing relative to the booking, so Rs 99,999,999 against a Rs 1,673,250 booking saved silently. And the venue switcher **lied about scope**. |
| `WWL-321` | A lapsed halal certificate could be reactivated with no new number and no new expiry — an expired certificate reading as current to an inspector. |
| `WWL-263` | Already closed by the earlier numeric/phone sweep. Verified, not redone. |

### The two systemic ones

**`WWL-114` was not a payments bug.** Venue scope is applied by the axios
interceptor, so switching venues changes every *request* and no TanStack cache
*key* — and **42 dashboard views key their queries by name alone**. Live and
offline, switching to Grand Marquee showed all 25 rows across 3 venues under its
name, with its real total a third of the figure on screen. Fixing 42 keys would
have fixed the ones somebody remembered; `VenueScopeSync` removes the
possibility instead. `removeQueries`, not `invalidateQueries` — invalidation
keeps serving the stale entry, which is the lie.

**`WWL-113` is confirmed, not refused.** Vendors do take genuine overpayments,
and a real payment that cannot be recorded makes the khata disagree with the
cash box — which is worse than the typo. The likely extra zero is named
("that is about 60× the balance — did you mean Rs X?"), and the tolerance is 1%
or Rs 1,000 so that rounding up in cash never trains anyone to tick a box
without reading it.

**`WWL-321` is enforced server-side.** A compliance state is not something a
client should be guaranteeing.

### Shipped

Both PRs are open and carry every wave: **backend #54**, **frontend #187**.

**The migration ran against live production on 2026-08-07**, with the operator's
go-ahead, in the correct prod-first order — schema before code. Verified after:

| | |
|---|---|
| `BookingDetails.subVenueId` | integer, nullable |
| Index + FK | present · `ON DELETE SET NULL` |
| Rows backfilled | **2** (only venues with a single bookable space) |
| `WWL-260` legacy attendance rows | **0** — the staff-route repair landed in the same run |
| Live backend / public site after | **200** / **200** |

What the live numbers show: **3,270 single-space venues and 8 multi-space**. So
`WWL-100` only ever bit those 8 — but for them it was the whole product, and the
grid is now truthful for all 3,278 either way.

### Still open

- **Nothing is deployed.** Both PRs need merging; the migration is deliberately
  ahead of the code, which is safe (every read probes for the column).
- **Not verified in a browser on live.** That is the next step once the PRs
  merge, using a QA vendor on the owner's own email so OTPs can be relayed.
- The **S3/S4 tail** (285) and the **18 product gaps** are untouched and need a
  product decision, not a fix.

---

## Wave 8 — the S3 tail, swept as families

**Every S1 and every S2 in the 612-finding sweep is now addressed.** What is
left is 281 findings: **210 S3** (confusing / inaccessible) and **71 S4**
(cosmetic). Nothing left in the backlog is "broken" or "shows the wrong
number" — those two classes are closed.

Wave 8 goes after the tail the same way waves 2–3 did: at the source, not
screen by screen.

| Findings | What it was | Where it was fixed |
|---|---|---|
| `WWL-120` `137` `153` `170` `187` + repeats | The sweep recorded "Table a11y, unchanged from Module 10 … third module … fourth … fifth" because the defect lives in two shared components. No `<caption>`, so a screen reader met an unnamed grid of numbers. Every row checkbox announced the identical **"Select row"** — ten rows, ten identical names, so nobody could tell which booking they were bulk-deleting. 16×16 hit area, under the WCAG 2.2 24×24 floor. | Both table layers + all 34 call sites |
| `WWL-116` `135` `152` `186` + repeats | A no-match search asserted a financial falsehood: a vendor with 25 payments and Rs 23.9m on the books searching `zzzqqq` was told *"No payments yet."* The screen stated a fact about the **account** when the only empty thing was a **text box**. | `DataTable` primitive + 26 screens |
| `WWL-183` | "Jazzcash", "Ibft", "Bank Transfer" — title-cased raw keys — while `EXPENSE_PAYMENT_METHOD_LABELS` had defined JazzCash / IBFT / Bank transfer all along, and Receipts already rendered them correctly. | Expenses table, card and CSV |

### Live verification this wave

`WWL-100` and `WWL-569` were both **driven on live production**, not argued
from tests:

- **Rehman Grand Marquee (3358)** — the venue from the original finding.
  13-Aug (one booking): all five halls PARTIAL, non-sellable, warning banner.
  12-Aug (no booking): all five AVAILABLE. The customer is never offered a hall
  the venue may have committed, and a clear day is not over-blocked.
- **A QA fixture with a real Hall → Floor → Partition tree** — assigning one
  booking to one leaf turned **three previously-unsellable spaces back into
  sellable inventory**: self UNAVAILABLE, ancestors PARTIAL, siblings AVAILABLE.
- The live booking form sent **`subVenueId: 3356`** through the real UI.

Live production shape, worth recording: **3,270 single-space venues, 8
multi-space.** `WWL-100` only ever bit those 8 — but for them it was the whole
product.

### Still open

The 281 S3/S4 findings are mostly per-screen from here — the systemic families
are swept. They are polish and clarity, not broken behaviour.

Plus the **18 product gaps** (features never built) which need a product
decision, and the **1,864 unrun cases** which need a seeded staging vendor.

---

## Wave 9 — the per-screen tail

Counted with the qa/ docs excluded from the source grep (scanning them made
every id look addressed, because that is where findings are *described*):

**405 of 612 addressed · 207 remaining — 0 S1, 0 S2, 145 S3, 62 S4.**

### Rendering what was already being fetched

| Finding | What changed |
|---|---|
| `WWL-140` | Receivables grows an aging band: five buckets, both counts, a proportional bar, an "As of HH:mm PKT" line off the `generatedAt` that was never surfaced, and click-to-filter. The wire also contradicted its own docstring — `buckets[].count` counted **installments** while the header comment promised customers, so the five counts summed to 51 on a board headlined 34. Both counts are now named for what they hold; `count` stays as an alias. |
| `WWL-141` | The Outstanding card drew an unconditional falling arrow. No prior period exists on the payload, so the honest render is no arrow. |
| `WWL-247` | The movement dialog offered 4 of the 9 fields the API accepts, and its own placeholder advertised two it did not have. Without `bookingId` consumption could never be attributed to an event; without `occurredAt` every movement was stamped `now()`. |
| `WWL-248` | The audit ledger was **write-only** — `listMovements` existed, `getItem` returned 30 movements, the model snapshots `stockBefore`/`stockAfter` in a transaction, and none of it rendered anywhere. Added the read side, reachable from every row and card. |
| `WWL-519` | The activation panel rendered 4 of 9 fields. The one it dropped that matters is `leadsAwaitingReply` — 22 people across three venues who asked about a wedding and heard nothing back. |
| `WWL-127` | The booking picker read `name · date`, so three options all said "Waheed Jutt" and cancelled bookings looked identical to live ones. |

### Requests

| Finding | What changed |
|---|---|
| `WWL-149` `WWL-171` | The function-sheet badge asked one booking per request — 14 round-trips for 13 rows. The endpoint takes a set now, and the FE micro-batches on a microtask: **14 requests → 1**. Parsing is a pure helper with 9 tests, because both failure modes are quiet (an empty id set must match *nothing*; a hand-built query must not build an unbounded `IN`). |
| `WWL-157` | Receipts shipped the whole ledger with no limit. Paging is **opt-in** — a default cap would have silently truncated the customer profile — and the summary is computed in SQL over the whole filtered set, so a page never moves the headline. |

### Venue scope

`WWL-204` — the report card was never venue-scoped. The client *had* been
sending `businessId` all along; the service ignored it. Scoping it surfaced a
worse bug underneath: the expense rollup's untagged branch was scoped by
`createdByUserId` alone, so **"Staff Kharcha" reported the whole group's payroll
under every single venue** — all three read Rs 4,306,800, exactly
1,433,700 + 1,495,500 + 1,377,600.

Verified on live production — all five money cards partition exactly:

| Card | 3358 | 3359 | 3360 | Sum | All-venues |
|---|---|---|---|---|---|
| `month_money` | 11,761,150 | 12,748,550 | 8,984,150 | 33,493,850 | **33,493,850** |
| `baqaya` | 4,368,287 | 5,043,737 | 4,005,205 | 13,417,229 | **13,417,229** |
| `aaj_vasooli` | 1,673,250 | 0 | 0 | 1,673,250 | **1,673,250** |
| `bookings` | 8 | 8 | 6 | 22 | **22** |
| `staff_cost` | 1,433,700 | 1,495,500 | 1,377,600 | 4,306,800 | **4,306,800** |

The `REPORT_CARDS_ENABLED` gate is removed — it answered 404 to most vendors
for a read-only projection of their own bookings.

### Money input

`WWL-126` — every money column is `NUMERIC(12,2)`, verified on the live
database, and the shared validator did not know it:

| Typed | Was stored as | Now |
|---|---|---|
| `0.001` | **0.00** — a receipt for Rs 0 | rejected |
| `100.999` | 101.00 — a number nobody entered | rejected |
| `1e5` | 100000, silently | rejected |

`1000`, `1000.5`, `.5`, `99999999.99` still accepted; commas, hex, `Infinity`,
negatives, zero and over-cap still rejected.

### Friction where it belongs

`WWL-491` Free went straight to the DELETE · `WWL-492` both writes reported
success unconditionally (the API now returns `newlyBlocked`/`deleted` and the UI
says which happened) · `WWL-507` cancellation policy saved in one click, with
nothing said about existing bookings — the confirmation now shows old → new, the
rupee delta at each window, and that accepted bookings keep their frozen
snapshot · `WWL-509` the policy cards were bare `<div onClick>`, now a radiogroup.

### Dates, a11y, mobile

`WWL-455` — three surviving UTC derivations, each one day wrong east of
Greenwich: the dashboard calendar filter returned **yesterday** for every
Pakistani vendor all day every day; the AML register silently excluded the last
day of the month it claimed to cover; supplier due dates landed a day early
before 5am.

`WWL-007` venue switcher items are `menuitemradio` with `aria-checked` ·
`WWL-522` progress bars carry their value · `WWL-523` a failed fetch no longer
tells a vendor who owns three venues that they own none · `WWL-205`/`WWL-206`
14px share targets grown to 44px and each named · `WWL-471` density now applies
to the mobile card list, so the control that was "missing" is no longer a
control that does nothing.

`WWL-521` needs no code change: two venues scoring identically is the checklist
being right — both have zero photographs, no advance terms, no cancellation
policy.

---

## Final waves — 608 / 612 closed

The last stretch worked module by module. What follows is the shape of what was
found, not a re-listing of every id; the commit that closed each one names it.

### The recurring cause

More than half of these were not missing code. They were **a control that was
never wired to an engine the backend already had**:

- `/generator-fuel/burn-rate` — live, validating, precise domain refusals, and
  **no caller anywhere in the product** (`WWL-306`).
- `/drone-noc/upcoming` — live, documented as "booking-linked windows", **no
  consumer** (`WWL-347`).
- `bookingId` and `brokerId` on commissions, `bookingId` on permits,
  `supplierId` on halal certs, `defaultSubVenueId` on staff — every one accepted
  by its validator, **none reachable from any form** (`WWL-289`, `WWL-348`,
  `WWL-324`, `WWL-264`).
- `?businessId=` read by `listCerts` and the drone-NOC list handler, **never
  sent by the client**, so the venue switcher did nothing on either screen
  (`WWL-328`).
- `lowStockOnly=true`, the fuel log's `type`/`from`/`to`/`generatorIdentifier`,
  the blocked-dates `month` filter, `minGuaranteeCount` on menus — all
  implemented server-side, none of them reachable (`WWL-258`, `WWL-310`,
  `WWL-495`, `WWL-479`).

### The second cause: a screen asserting what it cannot know

- Inventory read **"Low / out of stock 0 — all good"** during an outage
  (`WWL-259`).
- The Today board read **"Events today: 0"** on a day all three venues were
  blocked (`WWL-537`), and listed a Pending Rs 2.6m booking as an event the
  venue was committed to (`WWL-532`).
- The dispute evidence pack flagged **OK** over Rs 1,223,278 of receipts with no
  proof on either (`WWL-511`).
- "FBR submitted: Rs 0" on a noop adapter that files nothing, which reads as
  "you have filed nothing" (`WWL-194`).
- Commission and collaboration headlines summing money not yet accrued, money
  owed *to* the vendor with money owed *by* them, and declined rows
  (`WWL-299`, `WWL-460`).

### Corrections to the sweep itself

Three findings were partly wrong and are recorded as such rather than
implemented as written:

- **`WWL-479`** reads `Package.capacity` as a guest count. Its own model comment
  (BK-017) defines it as a per-slot **concurrent-booking cap**. Validating
  packages against the venue's guest range would have written the misreading
  into the product. The menu half — `minGuaranteeCount`, a real guest count, in
  no editor at all — is real and fixed.
- **`WWL-322`** names the column `documentUrl`; it is `certPhotoUrl`, and
  `halalCertHelpers` has accepted it since it was written.
- **`WWL-229`** says nothing creates a recipe. True of the UI — and the live DB
  holds **8 RecipeBoms whose ingredients reference item ids 1–3 in a
  `CateringItems` table with zero rows.** The seeded recipes are themselves
  unresolvable. See the open list below.

### Still open — 4, all product decisions

| ID | Why code cannot close it |
|---|---|
| `WWL-229` | Needs a CateringItem master (no CRUD endpoint exists) **and** a recipe editor. The 8 seeded BOMs point at an empty ingredient table, so the data is broken too. |
| `WWL-420` | Promotion approval records no money anywhere. Needs a payment rail and a decision on how placements are invoiced. |
| `WWL-436` | "Plan & billing" holds no invoice, method or payment. Same rail, same decision (D7). |
| `WWL-352` | Three compliance registers, live and empty on all three venues. The screens now prompt with the vendor's own supplier names; filling them is the vendor's act. |

`WWL-323` is closed by that prompt — the register knows the 18 suppliers the
account buys from and now names the uncertified ones instead of offering a
generic "add a certificate".
