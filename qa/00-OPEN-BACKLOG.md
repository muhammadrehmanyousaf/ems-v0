# Wedding Wala vendor portal — OPEN BACKLOG

What is left after the 44-module live-production sweep. Every item traces to a finding ID in
[LIVE-MODULE-TEST-PLAN.md](LIVE-MODULE-TEST-PLAN.md), which holds the full reproduction, the
evidence and the exact numbers for each one.

| | |
|---|---|
| Modules swept | **44 / 44** |
| Cases written | **6,066** |
| Cases driven on live production | **4,202** |
| Cases not run (deliberately — see §6) | **1,864** |
| Findings raised | **612** — `WWL-001` → `WWL-612` |
| S1 data/money wrong | **47** |
| S2 feature broken | **148** |
| S3 confusing / inaccessible | **332** |
| S4 cosmetic | **84** |

**Already fixed and merged during the sweep** — do not re-open:

| | Fix | Proof |
|---|---|---|
| PR #184 | Venue-OS scoping — 34 unanswerable `Venue #` boxes → named venue pickers, 36 panels | re-verified today: **0** raw id boxes, 5 named selects on the hub |
| PR #53 (BE) | `WWL-041` booking search 500 on every term — Postgres ENUM has no `ILIKE` | `Raza`→1, `a`→10, `conf`→7, zero 500s |
| PR #185 | 360px Today-board grid overflow (502px track in a 328px container) | re-verified at 360×740 |

Everything below was reproducible on **live production** at the moment its module was driven.
The portal ships continuously — **re-verify the finding before starting work on it**; the plan file
tells you exactly how each one was reproduced.

---

## 1. Ship-blockers — fix before anything else

### 1.1 A route the vendor cannot use at all

**`WWL-260` (S1) — `/dashboard/staff` → "Shifts & payroll" takes the whole route down.**
**Re-confirmed live today**, unchanged:

```
TypeError: Cannot read properties of undefined (reading 'cls')
```

The chain, established end to end:

| Step | Evidence |
|---|---|
| Every live shift carries `attendanceStatus: "present"` | 95 / 95, read from the API |
| The frontend union has no `present` | `lib/api/staff.ts` — six values, none of them `present` |
| The **backend** enum has no `present` either | `src/models/staffShift.js` — the same six |
| Nothing rejected the value | column is `STRING(20)`, **no enum constraint**; it arrived from a seed/import path |
| `ATTENDANCE_TONE["present"]` → `undefined` | `components/.../payroll-tab.tsx` |
| `TONE[tone].cls` throws | `components/ui/status-pill.tsx:55` |

**Cost:** Rs 57,282 owed to 33 staff is unreachable. Log shift, Mark paid, Dispute, Void, Replace,
attendance, payslip PDF, filters, leave queue — all gone. Roster still renders; `/dashboard/staff/{id}`
still renders one person at a time with no total and no way to pay.

**Fix:** two lines (default the tone lookup, `TONE[tone] ?? TONE.neutral`) + a data repair for the 95
rows + the missing DB enum constraint so it cannot recur. This is the single cheapest S1 on the list.

### 1.2 The public site sells a hall that is already sold

**`WWL-569` (S1)** — on `/wedding-venues/lahore/rehman-grand-marquee-3358`, 13 Aug 2026 shows all
five spaces green and *Available*. That date carries **two Confirmed bookings**. Reproduced
**anonymously, with no Authorization header**, on 5 / 13 / 21 / 29 Aug; the vendor's own grid agrees —
**155 of 155** August cells `AVAILABLE`. No booking is mapped to a sub-venue, so the tree-aware engine
reads an empty resource table and answers "free" for everything.

This is the one finding a customer can hit. Double-booking a shaadi is not recoverable.

### 1.3 Money that is wrong on screen

| ID | Sev | What |
|---|---|---|
| `WWL-539` | S1 | Per-event P&L renders **Rs 0** across all five lines for a wedding the table 200px above prices at **Rs 2,292,300** |
| `WWL-129` | S1 | Venue scoping inverted — **one venue shows 95% more money than all three combined** |
| `WWL-501` | S1 | The same named cancellation policy **pays out double** depending on which endpoint you ask |
| `WWL-109`/`110` | S1 | `Total billed` and `Received + Due` computed over different populations; Dashboard and Payments disagree by **Rs 1,124,500** |
| `WWL-001`/`002`/`005`/`028` | S1 | Rs 1,159,500 owed invisible on Receivables · a down payment ignored · "Revenue collected" counts uncollected money · per-venue receivables exceed the company total |
| `WWL-008`/`009` | S1 | Cancelled weddings ranked most profitable; "Net profit" is revenue |

**The headline profit number is wrong three independent ways.** `Net profit Rs 25,508,850 · 76% margin`:

| | |
|---|---|
| `WWL-541` | it is *booked* minus spent — **Rs 13,417,229 has not arrived** |
| `WWL-542` | seven functions show 100% margin because nothing is tagged — **Rs 9,702,750** with no recorded cost |
| `WWL-554` | it ignores the Money tab's **Rs 8,847,000** of fixed overheads entirely |

Booked minus *all* recorded spend is **Rs 16,661,850**.

### 1.4 Data destruction and irreversible actions

| ID | Sev | What |
|---|---|---|
| `WWL-356` | S1 | The **reviewed party can permanently hard-delete the review** |
| `WWL-081` | S1 | Opening the composer and pressing Save **destroys the line-item descriptions** |
| `WWL-078`/`079` | S1 | `Share link` crashes the function-sheet route; the site's own lowercase-URL middleware **destroys every share token** |
| `WWL-080` | S1 | No customer can ever sign a contract** — proven end to end |
| `WWL-071` | S1 | Every line item on every customer document reads `(no label)` |
| `WWL-597` | S2 | Close & lock month** — third button in a row, one click, freezes the books, no confirmation |

### 1.5 The error-swallowing root cause

**`WWL-019` (S1) — 59 `catch` blocks across 14 API modules return `null` on failure.** `isError`
is therefore never true, so every error state and every Retry button in the product is dead code.
`WWL-107`/`108` are its backend twin: the API answers **200 to every unmatched path**, so a failed
save is reported to the vendor as a success and a broken read renders as *"you have no money"*.

Fixing these two closes or de-fangs roughly **50** downstream findings. Nothing else on this list
has that leverage.

---

## 2. Systemic families — fix once, close many

Keyword-clustered from the 612; verify each member before closing it.

| # | Family | Findings | The one fix |
|---|---|---|---|
| F1 | **False success / silent failure** — a write fails, the toast says it worked | **41** — `WWL-142` `159` `312` `333` `351` `370` `416` `435` `473` `503` `556` `605` … | BE: drop the catch-all 200. FE: one mutation wrapper that checks `status: true` before toasting |
| F2 | **A11y floor** — unlabelled inputs (73+), no `h1` (8 pages), `<th>` with no `scope`, 16px hit targets | **48** — `WWL-237` `254` `270` `281` `297` `315` `331` `349` `379` `405` `423` `446` `467` `498` `522` `598` `607` … | Shared labelled `<Field>` primitive; the forms already using it score 0 unlabelled |
| F3 | **Venue scoping** — three different resolution patterns; new rows filed under the wrong venue; switchers that do nothing | **20** — `WWL-006` `024` `129` `242` `262` `293` `311` `328` `332` `350` `410` `421` `505` `610` `611` | Make `useBusinessIdField` (built in Module 36) the **only** scoping primitive, and make every create dialog send the resolved id |
| F4 | **Mobile: whole modules inert at 360px** — row actions live in a desktop-only table | **28** — `WWL-053` `086` `093` `146` `160` `244` `265` `280` `296` `377` `391` `459` `482` … | One responsive row-actions/card pattern |
| F5 | **Irreversible action, one click, no confirmation** | **23** — `WWL-453` `491` `558` `583` `589` `595` `597` `604` `609` `612` … | A shared `<DangerousAction>` confirm; the list includes Close & lock month, Post rent, Open drawer, Hold a date, Decline quote |
| F6 | **Money definitions disagree across screens** | **29** — `WWL-005` `009` `010` `109` `110` `177` `199` `202` `541` `542` `554` `555` … | One canonical revenue / received / outstanding / profit definition, computed server-side, consumed everywhere |
| F7 | **Export defects** — incl. **CSV formula injection in the shared `ExportMenu`** (`WWL-123`, security) and an unflagged personal-data export (`WWL-266`) | **19** | Fix `escapeCsv` to neutralise leading `= + - @`; it is one shared component |
| F8 | **Bad numeric input accepted** — negatives, zero-rejects, expiry six years before issue | **15** — `WWL-246` `263` `279` `303` `305` `320` `325` `340` `342` `551` `586` | Shared numeric field with min/step **and** server-side validators |
| F9 | **Errors render as empty/healthy state** | **13** — `WWL-018` `095` `108` `121` `130` `231` `259` `443` `523` | Falls out of `WWL-019` |
| F10 | **UTC where the vendor is PKT** — date defaults land on yesterday | **10** — `WWL-062` `112` `285` `300` `318` `338` `354` | One `todayInKarachi()` helper |
| F11 | **A panel asking for a primary key nobody can know** — `Event night #`, `Card IDs`, `meter #`, `production run #`, `Org #`, `partner #`, `Weather event #`, `Counterparty biz #`, `Sub-venue #` | **9 panels** — `WWL-545` `563` `592` `599` `600` … | Exactly the Module 36 pattern: replace the raw-id box with a named picker |
| F12 | **Stale component headers / three names for one screen** | **11** — `WWL-212` `239` `257` `268` `271` `317` `337` `428` `447` `481` | Mechanical rename pass |

---

## 3. Features that exist in the backend and nowhere in the UI

The API computes these and the product throws them away. Cheap wins — the hard part is already built.

| ID | What the server already returns |
|---|---|
| `WWL-306` | Generator **burn-rate engine** — live, validating, no UI at all |
| `WWL-307` | **Tank status** computed and shown nowhere |
| `WWL-295` | The **broker directory** exists in the API and nowhere in the product |
| `WWL-276` | The API ranks **who is owed the most**; the UI discards it |
| `WWL-128` | Payment **online/offline split** (11 offline / Rs 18,183,350 vs 14 online / Rs 19,165,550) rendered nowhere; `source` / `dateFrom` / `dateTo` never passed |
| `WWL-310` | Four server-side filters, none wired to a control |
| `WWL-347` | `/upcoming` permits endpoint has no consumer |
| `WWL-417` `438` `462` `344` `519` | 5 + 2 + 5 + 5 + 5 fetched fields displayed nowhere |
| `WWL-072` | The payment schedule exists, is correct, and **never reaches the customer** |

---

## 4. Screens that are unreachable or point at nothing

| ID | What |
|---|---|
| `WWL-229` (S2) | The entire screen is **unreachable in production, for every vendor** |
| `WWL-516` (S2) | The whole **Verification** category points at a page that does not exist |
| `WWL-517` (S2) | The one link in *"Highest-impact next moves"* is a **404** |
| `WWL-515` (S2) | The checklist names the fix, and the fix is on a different page |
| `WWL-230` (S3) | Empty state points at a screen that does not exist |
| `WWL-352` (S3) | The entire **Compliance rail** is empty in production |
| `WWL-528` (S2) | Four of the seven Venue-OS tabs render only a heading |
| `WWL-559` (S3) | Five of seven panels have no data at all |
| `WWL-601` (S3) | Four of seven groups fetch nothing when opened |
| `WWL-017` (S2) | 11 of 20 onboarding tasks dead-end — 6 wrong tab, 5 hard 404 |

---

## 5. Product gaps — the feature simply is not there

| ID | Gap |
|---|---|
| `WWL-433` | **No way to cancel or downgrade a plan, anywhere** |
| `WWL-436` | *"Plan & billing"* contains **no billing** |
| `WWL-288` | Brokers has **no status filter of any kind** |
| `WWL-287` | Brokers has **no Due column** |
| `WWL-289` | A commission cannot be attached to a broker or the event that earned it |
| `WWL-322` | The Halal certificate **document cannot be attached anywhere** |
| `WWL-348` | A drone permit cannot be tied to the wedding it was obtained for |
| `WWL-500` | Availability has **no calendar** |
| `WWL-494` | One date at a time, on a market that closes for weeks |
| `WWL-508` | Three cancellation presets and nothing else |
| `WWL-577` | The slot templates cannot describe a shaadi |
| `WWL-463` | Collaboration stops dead at "accepted" |
| `WWL-118` | A money table with no sorting and no money filters — the vendor cannot ask *"who owes me the most"* |
| `WWL-380` | No pagination past 100 reviews |
| `WWL-406` | 61 notifications in five days and one way to clear them |
| `WWL-011` | The اردو toggle is inert — page text byte-identical |
| `WWL-013` | `Toggle Sidebar` dead at 1536 / 1024 / 360 — screenshots pixel-identical |
| `WWL-015` | ⌘K finds no data; returns unrelated routes for customer names |

---

## 6. Coverage gaps — 1,864 cases deliberately not run

These were **not** skipped for convenience. Each was blocked by a safety rule the sweep held to:
nothing was sent to a real customer, no money row was written on the live vendor's ledger, nothing
irreversible was done to a real row, and no third party's data was probed.

| Blocked class | Examples | What unblocks it |
|---|---|---|
| **Anything that reaches a real person** | send/accept/decline a quote, WhatsApp dunning, chat, collaboration invites, contract signing, staff messaging | A seeded **test customer** + a **second vendor account** on staging |
| **Money writes on a live ledger** | create receipt / payment / expense / cheque, post rent, post depreciation, journal entries, **close a period** | A staging vendor with a disposable ledger |
| **Irreversible state transitions** | cancel a real booking, delete real rows, block dates on approved venues, stamp Compliance-Shield, mark registered | Same |
| **Multi-party / concurrency** | two vendors accepting the same quote, shared `isPending` across rows, another vendor's data | Two accounts, run in parallel |
| **Document upload paths** | certificate attach, review photos, permit files | Staging |

**TODO:** stand up a seeded staging vendor + test customer + second vendor account. That single piece
of infrastructure converts 1,864 written-but-unrun cases into runnable ones. They are already written.

---

## 7. Engineering debt observed alongside the sweep

| Item | Why it matters |
|---|---|
| **~43 feature-flag files / ~90 `NEXT_PUBLIC_*` flags, nearly all OFF** | This *is* the "portal feels empty" complaint. The flags are debt to **delete**, not to roll out behind |
| **37 `-new` routes** | Dead doors in the IA |
| **125 known TypeScript errors** in `typecheck-baseline.json` | Ratchet holds the line but `next.config.mjs` still sets `ignoreBuildErrors: true` |
| `staffShift.attendanceStatus` is `STRING(20)` with **no enum constraint** | The direct cause of `WWL-260`; the same shape exists on other columns |
| Backend catch-all returns **200 for unmatched paths** | `WWL-107` — makes every FE success check meaningless |
| `escapeCsv` in the shared `ExportMenu` does not neutralise formulas | `WWL-123` — customer-supplied names land in a spreadsheet |

---

## 8. Suggested order

**Sprint 1 — stop the bleeding (days, not weeks).**
`WWL-260` (2-line fix + data repair) · `WWL-569` (public double-booking) · `WWL-107`/`108` (backend
catch-all 200) · `WWL-019` (59 swallowing catches) · `WWL-123` (CSV injection) · `WWL-356`
(reviewed party can delete the review) · `WWL-078`/`079`/`080` (contracts can never be signed).

**Sprint 2 — make the money one number.**
F6 + `WWL-539` `541` `542` `554` `129` `109` `110` `501`. One server-side definition of revenue,
received, outstanding and profit; every screen consumes it.

**Sprint 3 — the shared primitives.**
F1 (mutation wrapper) · F3 (single scoping primitive) · F5 (`<DangerousAction>`) · F8 (numeric field)
· F10 (`todayInKarachi`). Five small components close ~110 findings between them.

**Sprint 4 — reachability and mobile.**
§4 (dead doors) + F4 (28 modules inert on a phone) + F11 (9 raw-id panels).

**Sprint 5 — surface what the backend already computes.**
§3. Nine features whose hard half is already written and shipping.

**Then:** F2 (a11y, mechanical, 48) · F7 · F12 · the 84 S4s.

---

## Appendix — all 612 findings by module

### Module 1 — Dashboard ` /dashboard `

| ID | Sev | Finding |
|---|---|---|
| `WWL-001` | S1 | Rs 1,159,500 owed is invisible on the Receivables chase screen |
| `WWL-002` | S1 | Receivables ignores a down payment already taken |
| `WWL-003` | S2 | The dashboard shows two different answers to "how much am I owed?" |
| `WWL-004` | S1 | A real event today is missing from the "Today's events" KPI |
| `WWL-005` | S1 | `Revenue collected` counts money that has not been collected |
| `WWL-006` | S1 | Four dashboard sections ignore the venue selection entirely |
| `WWL-007` | S3 | The venue switcher marks no active option |
| `WWL-008` | S1 | Cancelled weddings are ranked as the most profitable events |
| `WWL-009` | S1 | "Net profit" is revenue, not profit |
| `WWL-010` | S1 | Three different "outstanding" figures on one screen |
| `WWL-011` | S2 | The اردو language toggle does nothing |
| `WWL-012` | S3 | All 12 reminder buttons have the same accessible name |
| `WWL-013` | S2 | `Toggle Sidebar` does nothing, at any width |
| `WWL-014` | S2 | At 360px, today's events and the enquiries card are clipped off-screen |
| `WWL-015` | S2 | The ⌘K palette cannot find any data, and returns misleading matches |
| `WWL-016` | S3 | Dashboard CTAs don't do what they say |
| `WWL-017` | S2 | 11 of the 20 onboarding tasks send you where you cannot do them |
| `WWL-018` | S1 | A failed load renders as "Rs 0 collected, Rs 0 owed" with no error |
| `WWL-019` | S1 | ROOT CAUSE: 59 `catch` blocks swallow every API error |

### Module 2 — Today ` /dashboard/today `

| ID | Sev | Finding |
|---|---|---|
| `WWL-020` | S1 | On the day-of screen, a customer owing Rs 315,000 shows no amount due |
| `WWL-021` | S2 | `Outstanding` on the "Today" screen is the all-time figure, and it's the understated one |
| `WWL-022` | S3 | Invalid task duration is silently discarded |
| `WWL-023` | S3 | `Delete` on a timeline task has no confirmation |
| `WWL-024` | S1 | The Today screen ignores the venue selection completely |
| `WWL-025` | S3 | `Run sheet` is disabled with no reason given |
| `WWL-026` | S3 | `View timeline` does not open a timeline |
| `WWL-027` | S3 | The printable run sheet never names the venue |
| `WWL-028` | S1 | Per-venue receivables returns figures larger than the company total, and two venues return the *same* number |
| `WWL-029` | S3 | Dialog does not return focus to the opener |
| `WWL-030` | S2 | You cannot open a booking from the Today screen |

### Module 3 — Lead inbox ` /dashboard/leads `

| ID | Sev | Finding |
|---|---|---|
| `WWL-031` | S2 | Saving one lead takes five rejections and five round-trips |
| `WWL-032` | S2 | A wedding six years in the past saves without question |
| `WWL-033` | S3 | Archived leads sit in the live inbox with no way to filter them out |
| `WWL-034` | S1 | Converting a lead discards its budget; the booking captures no amount at all |
| `WWL-035` | S3 | 304 row-action buttons share just 4 accessible names |

### Module 4 — Bookings ` /dashboard/bookings `

| ID | Sev | Finding |
|---|---|---|
| `WWL-036` | S1 | Three cancelled bookings are invisible in the entire Bookings module |
| `WWL-037` | S1 | A single ledger row contradicts itself: `Rs 1,546,000` / `Rs 386,500` / `Paid` |
| `WWL-038` | S3 | "Total bookings" means two different things on two screens |
| `WWL-039` |  | (unconfirmed by design) — `Edit Booking` cannot see or preserve a negotiated price |
| `WWL-040` | S1 | The Record Payment dialog tells the vendor to collect the down payment twice |
| `WWL-041` | S1 | Booking search returns HTTP 500 for every term; the UI shows it as "0 bookings" |
| `WWL-042` | S1 | `bucket` is a silent fall-through: an unrecognised value returns everything |
| `WWL-043` | S2 | `limit` is ignored and `total` lies; past 100 bookings the list silently truncates |
| `WWL-044` | S2 | A cancelled booking is fully editable, `Save order` and all |
| `WWL-045` | S3 | Row selection exists and does nothing |
| `WWL-046` | S3 | The selection counter desyncs from the checkboxes on view switch |
| `WWL-047` | S1 | The payment lie is exported into the vendor's accounting file |
| `WWL-048` | S3 | The CSV export has no booking id and an Excel-hostile date column |
| `WWL-049` | S2 | The `BOOKING` column hides the venue whenever a package is attached |
| `WWL-050` | S3 | `SPACE` is a permanently dead column |
| `WWL-051` | S3 | The Active/Archive toggle has no accessible state at all |
| `WWL-052` | S2 | On load failure the money tiles print `Rs 0` instead of `—` |
| `WWL-053` | S1 | On mobile the Bookings module is completely inert — a booking cannot be opened at all |
| `WWL-054` | S3 | Table rows are not clickable on desktop either; the only way in is an icon-only kebab |
| `WWL-055` | S2 | No column sorting at all, and the default order is operationally meaningless |
| `WWL-056` | S3 | The view toggle never updates the URL, so a reload silently changes the view |

### Module 5 — Date holds ` /dashboard/holds `

| ID | Sev | Finding |
|---|---|---|
| `WWL-057` | S1 | Availability does not know about bookings at all |
| `WWL-058` | S1 | Holds and availability speak two different languages, so nothing is ever subtracted |
| `WWL-059` | S2 | A hold is invisible everywhere except its own screen |
| `WWL-060` | S2 | A date that already has a confirmed booking can be held, with no warning |
| `WWL-061` | S2 | Holds can be placed on dates that have already passed |
| `WWL-062` | S3 | The date floor is computed in UTC on a UTC+5 product |
| `WWL-063` | S2 | `Release` destroys a hold on one click: no confirm, no undo |
| `WWL-064` | S3 | A raw Postgres error is shown to the vendor as the error message |
| `WWL-065` | S3 | The 48-hour TTL is never disclosed, and the expiry line omits the year |
| `WWL-066` | S3 | Neither field in the dialog has an accessible name |
| `WWL-067` | S3 | On "All venues" the hold silently lands on the first venue |
| `WWL-068` | S3 | "Hold a date for a lead" cannot record which lead |
| `WWL-069` | S3 | Double-clicking `Release` fires two DELETEs |
| `WWL-070` | S4 | Test residue is blocking a real date on live production |

### Module 6 — Function sheets ` /dashboard/function-sheets `

| ID | Sev | Finding |
|---|---|---|
| `WWL-071` | S1 | Every line item on every customer document reads `(no label)` |
| `WWL-072` | S1 | The payment schedule exists, is correct, and never reaches the customer |
| `WWL-073` | S2 | Quotation, Service Contract and BEO are the same document with the title swapped |
| `WWL-074` | S2 | Sheets are marked `signed` with no signature recorded |
| `WWL-075` | S2 | No sheet has ever reached `invoiced` or `paid`, so 2 of the 5 PDFs are unreachable |
| `WWL-076` | S3 | 8 bookings have no function sheet at all, and nothing says so |
| `WWL-077` | S3 | Expired quotes generate silently |
| `WWL-078` | S1 | `Share link` crashes the entire function-sheet page |
| `WWL-079` | S1 | The site's own lowercase-URL middleware destroys every share token |
| `WWL-080` | S1 | No customer can ever sign a contract. End-to-end proof |
| `WWL-081` | S1 | Opening the composer and pressing Save destroys the line-item descriptions |
| `WWL-082` | S2 | The composer opens a real contract with no `?id`, and never shows which one |
| `WWL-083` | S2 | A marquee vendor is shown a photographer's operations screen |
| `WWL-084` | S2 | `New function sheet` needs only a title, and silently picks a venue |
| `WWL-085` | S3 | `pdfUrl()` is dead code with a docstring that cannot be true |
| `WWL-086` | S1 | WWL-053 repeats: Function sheets is inert on mobile |
| `WWL-087` | S3 | 51 row buttons, 3 accessible names; rows are not clickable |

### Module 7 — Customers ` /dashboard/customers `

| ID | Sev | Finding |
|---|---|---|
| `WWL-088` | S1 | The client book reports bookings and spend that are not this vendor's |
| `WWL-089` | S1 | "Lifetime revenue" counts money that was never received |
| `WWL-090` | S2 | `firstBookingAt` is not the first booking |
| `WWL-091` | S2 | The community-trust endpoint answers for any phone number |
| `WWL-092` | S3 | A failed trust lookup will be indistinguishable from "no concerns" |
| `WWL-093` | S1 | WWL-053 / WWL-086 repeat a third time: Customers is inert on mobile |
| `WWL-094` | S3 | `Add customer` writes to a different entity than the list reads |
| `WWL-095` | S1 | A failed load tells the vendor their client book is empty |
| `WWL-096` | S2 | `Import` is reachable only when you have zero customers |
| `WWL-097` | S3 | `Quick view` prints dates in US format |
| `WWL-098` | S3 | Selection is dead here too (WWL-045, third instance) |

### Module 8 — Calendar ` /dashboard/calendar `

| ID | Sev | Finding |
|---|---|---|
| `WWL-099` | S1 | The calendar subscription URL points at the wrong host, so no calendar can ever subscribe |
| `WWL-100` | S2 | The availability grid has a per-space axis carrying no per-space data |
| `WWL-101` | S2 | Cancelled bookings are invisible on the calendar, but present in the feed |
| `WWL-102` | S3 | The vendor is never told the feed URL is unauthenticated |
| `WWL-103` | S1 | "Every event on one grid" hides every completed wedding. The calendar has no past |

### Module 9 — Conversations ` /dashboard/chat `

| ID | Sev | Finding |
|---|---|---|
| `WWL-104` | S3 | The send button has no accessible name |
| `WWL-105` | S3 | No length cap on the composer, with a known 255-char precedent |
| `WWL-106` | S4 | The page title is the generic fallback |

### Module 10 — Payments ` /dashboard/payments `

| ID | Sev | Finding |
|---|---|---|
| `WWL-107` | S1 | the backend answers 200 to every unmatched path, so a failed save is reported to the vendor as a success |
| `WWL-108` | S1 | the same catch-all turns a broken read into "you have no money" |
| `WWL-109` | S1 | `Total billed` and `Received + Due` are computed over different populations |
| `WWL-110` | S1 | the Dashboard and Payments disagree about outstanding money by Rs 1,124,500 |
| `WWL-111` | S2 | a Cancelled booking shows a red "Pending" pill and Rs 0 due |
| `WWL-112` | S2 | for the first 5 hours of every Pakistani day the receipt dialog defaults to yesterday and refuses today |
| `WWL-113` | S2 | no over-payment guard |
| `WWL-114` | S2 | offline, the venue switcher lies about scope |
| `WWL-115` | S3 | Stat cards ignore the search filter. Filtering to `Bahria` shows 7 rows while the headline stays at Rs 37,348,900 / 25 payments. The cards read `stats`, the table reads `payments`. On a money screen the headline then … |
| `WWL-116` | S3 | Wrong empty state on a no-match search. A vendor with 25 payments searching `zzzzqqqq` is told *"No payments yet — Payments against your bookings will appear here as they come in."* Same defect family as the Customers… |
| `WWL-117` | S3 | Notes over 1000 chars block Save silently, with a false explanation. `errs.notes` gates `canSave`, but the Notes field renders no `FieldError` and `touch("notes")` is never called, so no message can ever appear. At 10… |
| `WWL-118` | S3 | A money table with no sorting and no money filters. Zero sortable headers (no buttons, no `aria-sort`), no status filter, no date-range filter, and search does not match amounts (`1411500` → 0 rows) or statuses (`Paid… |
| `WWL-119` | S3 | Every row is a navigational dead end. `<tr>` with no `onRowClick`, no links, no buttons, `tabIndex -1`, `cursor: auto`. From a payment you cannot reach the booking, the customer, or its receipts. |
| `WWL-120` | S3 | Table a11y. All row checkboxes carry the identical accessible name "Select row" — a screen-reader user hears it 10 times with nothing to distinguish the rows. 0 of 8 `<th>` have `scope`, and there is no `<caption>`. C… |
| `WWL-121` | S3 | Stat cards assert Rs 0 during the error state. With the table correctly showing *"Couldn't load payments."*, the four headline cards read Rs 0 / Rs 0 / Rs 0 / 0. `isLoading` is false and `stats` is undefined, so `num(… |
| `WWL-122` | S3 | Mobile cards drop the labels and the Total. At 360px the cards show two unlabelled money figures — Rizwan reads *"Rs 0 \\| Rs 2,596,400"* — and `totalAmount` is omitted entirely; a Paid row shows a single bare number.… |
| `WWL-123` | S3 | CSV export is not neutralised against formula injection. `escapeCsv` is RFC-4180 correct for quotes, commas and newlines but does nothing about a leading `=`, `+`, `-` or `@`. `customerName` is customer-supplied. This… |
| `WWL-124` | S4 | Button says "Record payment"; the dialog it opens says "Record a receipt". |
| `WWL-125` | S4 | The ref-required error names the internal key, not the label the vendor just picked: *"required for ibft"* and *"for bank transfer"* rather than *"Bank IBFT"* / *"Bank transfer"*. |
| `WWL-126` | S4 | Amount accepts `1e5` (→ 100,000), `100.999` and `0.001` with no warning; `step="0.01"` is unenforced and `DECIMAL(10,2)` rounds silently. |
| `WWL-127` | S3 | The booking picker cannot be used reliably. Options show only `name · date`: three entries read "Waheed Jutt", distinguished only by date. No venue, no outstanding balance, no status — and cancelled bookings are liste… |
| `WWL-128` | S3 | The endpoint's whole documented purpose is dead in the UI. `stats.offline` and `stats.online` are computed on every response (live: 11 offline / Rs 18,183,350 vs 14 online / Rs 19,165,550) and rendered nowhere; `sourc… |

### Module 11 — Receivables ` /dashboard/receivables `

| ID | Sev | Finding |
|---|---|---|
| `WWL-129` | S1 | venue scoping is inverted: one venue shows 95% more money than all three combined |
| `WWL-130` | S1 | the error state is unreachable, so a dead endpoint reads as "Nothing outstanding" |
| `WWL-131` | S2 | the entire aging column renders green, including 99 days overdue |
| `WWL-132` | S2 | a third of the WhatsApp reminders point at invalid numbers |
| `WWL-133` | S3 | every dunning message calls the customer `sahab` |
| `WWL-134` | S3 | Stat cards ignore the search filter. Filtering 34 rows down to 1 — or to 0 — leaves the headline at Rs 23,961,479 / 34 customers in every case. The WWL-115 pattern, on a second money screen. |
| `WWL-135` | S3 | A no-match search asserts a financial falsehood. Searching `zzzqqq` with Rs 23.9m on the books renders *"Nothing outstanding — When customers have pending payments, their aging will show here."* Worse than the Payment… |
| `WWL-136` | S3 | CSV drops the Aging column and mangles `+92` phones. The export header is `Customer,Phone,Bookings,Open installments,Days overdue,Outstanding` — the Aging bucket, the one classification this board exists to produce, i… |
| `WWL-137` | S3 | Table a11y, unchanged from Module 10. 0 of 9 `<th>` carry `scope`, no `<caption>`, and all 34 row checkboxes share the identical accessible name *"Select row"*. |
| `WWL-138` | S3 | No next action from a debtor row. Rows are not clickable; there is no link to the customer, the booking or its installments, and no way to record a payment — the obvious follow-up once a customer pays. The only action… |
| `WWL-139` | S4 | Aging labels read "Days 1 30", "Days 31 60", "Days 90 plus" — `cap()` merely upper-cases and swaps underscores for spaces instead of rendering a readable range. |
| `WWL-140` | S4 | The five bucket totals and `generatedAt` are computed on every response and surfaced nowhere. No staleness disclosure, no bucket summary bar. Also `buckets[].count` totals 51 — it counts *installments*, matching `inst… |
| `WWL-141` | S4 | The `Outstanding` card carries an unconditional `trend="down"` arrow regardless of whether debt rose or fell. |

### Module 12 — Receipts ` /dashboard/receipts `

| ID | Sev | Finding |
|---|---|---|
| `WWL-142` | S2 | every CRUD verb on the money ledger reports success on failure |
| `WWL-143` | S3 | validation errors leak between dialog sessions |
| `WWL-144` | S3 | a misallocated receipt can never be reallocated |
| `WWL-145` | S3 | the delete confirmation identifies the receipt only by its amount |
| `WWL-146` | S3 | receipts are create-only on a phone |
| `WWL-147` | S3 | The money headlines flash `Rs 0` on every load. Unlike Payments and Receivables, the Receipts cards have no `isLoading` guard — `value={formatPkr(total)}` with `total` computed from an empty array. Sampled at 120ms in… |
| `WWL-148` | S3 | Future-dated receipts are counted as money received. Four rows are dated after today, Rs 1,386,175 in total (Rs 720,480 within the Banquet & Lawn view), and because the sort is `receivedDate DESC` they land at the top… |
| `WWL-149` | S3 | N+1 on the Event column. Rendering 13 rows fired 14 separate `function-sheets` requests across 7 distinct `bookingId`s — one round-trip per booking purely to label a column. There is no batch endpoint in play. On a le… |
| `WWL-150` | S3 | The API's method breakdown is discarded. Every response carries `summary.byMethod` — live: cash 6,314,023 · JazzCash 5,558,585 · bank_transfer 3,175,730 · Easypaisa 2,990,946 · Raast 2,002,337 · other 1,159,500 — and … |
| `WWL-151` | S3 | Stat cards ignore the search filter — third consecutive money module. Filtering 13 rows to 2, or to 0, leaves the headline at Rs 7,704,813 / Rs 458,460 every time. |
| `WWL-152` | S3 | A no-match search presents a populated ledger as empty onboarding. Searching `zzzqqq` renders *"No receipts yet — Record cash, JazzCash, Easypaisa and bank payments so every rupee is accounted for."* plus a `Record re… |
| `WWL-153` | S3 | Table a11y, unchanged for the third module. 0 of 8 `<th>` carry `scope`, no `<caption>`, all 13 row checkboxes named *"Select row"*. |
| `WWL-154` | S4 | `This month` delta renders "1 receipts" — `${thisMonth.length} receipts` with no singular form. |
| `WWL-155` | S4 | CSV omits the Event column that is shown on screen — the same export/screen parity gap as Receivables' missing Aging column (WWL-136). |
| `WWL-156` | S4 | The confirm says *"This can't be undone"* while the model is `paranoid: true`, so `destroy()` only sets `deletedAt`. True from the UI, false in the database — and telling a panicking vendor the row is gone forever whe… |
| `WWL-157` | S3 | No pagination and no limit. `PaymentReceipt.findAll` has no `limit` and the client has no paging, so the entire ledger ships on every load and `total` / `thisMonthTotal` / `cashTotal` are summed in the browser. Fine a… |
| `WWL-158` | S3 | A receipt dated today opens natively invalid for editing. Receipt 179 is legitimately dated 2026-08-06; the edit dialog seeds `value="2026-08-06"` while `max="2026-08-05"` (the UTC date). Measured: `validity.rangeOver… |

### Module 13 — Cheque ledger ` /dashboard/pdcs `

| ID | Sev | Finding |
|---|---|---|
| `WWL-159` | S2 | four write verbs, four false successes |
| `WWL-160` | S2 | the entire cheque lifecycle is desktop-only |
| `WWL-161` | S2 | a mis-marked cheque cannot be corrected |
| `WWL-162` | S2 | a cheque ledger that shows almost no money |
| `WWL-163` | S3 | Duplicate cheque numbers are accepted silently. I entered `513309` — which already exists in this same ledger as a held Rs 687,690 cheque — and got no error, no warning, and an enabled Save. The same physical cheque c… |
| `WWL-164` | S3 | WWL-117 recurs verbatim. Notes at 1001 characters silently disables Save with no field error and the hint *"Add a cheque number, a bank name, an amount above 0 and a cheque date to save."* — while all four of those ar… |
| `WWL-165` | S3 | WWL-112 recurs in two more places. The cheque date seeds to `2026-08-05` (the UTC date) while it is 6 Aug in Pakistan; and in the transition dialog the deposit date both defaults to and is capped at `2026-08-05`, so b… |
| `WWL-166` | S3 | The transition dialog never validates its own target status. `canSave` checks `options.length > 0` but never `options.includes(to)`, so an out-of-range value submits happily — I captured `{"to":""}` with the toast *"C… |
| `WWL-167` | S3 | Four of eleven cheques have `amount = 0.00` — including both cleared ones (964999, 132166) and two bounced ones. The create form requires an amount above zero, so these entered through a path that does not apply that … |
| `WWL-168` | S3 | Cards ignore the search filter — fourth consecutive money module. `Total cheques 5` / `Bounced 2` stay frozen while the table filters to 1 row or 0. |
| `WWL-169` | S3 | No-match empty state presents a populated ledger as onboarding. *"No cheques logged — Track every post-dated cheque so you know exactly what's clearing and when."* plus a Log a cheque button, for a vendor with 5 chequ… |
| `WWL-170` | S3 | Table a11y, fourth module unchanged. 0 of 9 `<th>` carry `scope`, no `<caption>`, all row checkboxes named *"Select row"*. |
| `WWL-171` | S3 | N+1 on the Event column — 10 `function-sheets` requests to render 5 rows, exactly as in Receipts (WWL-149). Same shared badge component. |
| `WWL-172` | S4 | CSV omits the Event column shown on screen — third module with this export/screen parity gap (WWL-136, WWL-155). It does correctly include Status, which is the improvement Receivables' export needed. |
| `WWL-173` | S4 | The cheque-number field silently strips non-digits (`ABC123XYZ` → `123`), then reports *"looks too short"*. A vendor typing a serial with a letter prefix sees characters vanish with no explanation of why. |
| `WWL-174` | S4 | The success toast interpolates the raw status: *"Cheque marked deposited"* rather than the capitalised label shown everywhere else. |

### Module 14 — Expenses ` /dashboard/expenses `

| ID | Sev | Finding |
|---|---|---|
| `WWL-175` | S2 | future-dated expenses are permanently uneditable, silently |
| `WWL-176` | S2 | the spending cockpit never refreshes after a mutation |
| `WWL-177` | S2 | two contradictory definitions of "fixed overhead", Rs 219,500 apart, on one panel |
| `WWL-178` | S2 | mobile clips the per-event profit column with no way to reach it |
| `WWL-179` | S3 | The entire expense ledger is fetched twice on every load. Confirmed live: two identical `GET /api/v1/expenses?businessId=3359` requests, one for the table's query key and one for the cockpit's. 165 rows shipped twice. |
| `WWL-180` | S3 | WWL-117, third recurrence. A note of 1001 characters silently disables Save with no field error and the false hint *"Add an amount above 0 and the date it was spent to save."* — while both are valid. The Paid to field… |
| `WWL-181` | S3 | WWL-112, fifth instance. `spentDate` defaults to and is capped at `2026-08-05` (the UTC date) while it is 6 Aug in Pakistan. Setting today's PKT date is accepted by the JS validator but flagged by the native `max` — t… |
| `WWL-182` | S3 | The delete confirm names only the amount — *"This Rs 46,400 entry will be removed."* No category, payee, date or event, on a 55-row ledger. WWL-145 repeated; the cheque ledger (WWL-... D13-081) shows how to do it prop… |
| `WWL-183` | S3 | The Pakistani payment rails are mis-labelled in this module. The selects and table render "Jazzcash", "Ibft", "Bank Transfer" — title-cased raw keys — where `EXPENSE_PAYMENT_METHOD_LABELS` already defines `JazzCash`, … |
| `WWL-184` | S3 | The import dialog offers no template or column reference. *"Upload or paste a CSV/TSV"* with no sample, no header list and no download link — the vendor has to guess the schema. (The dialog's safety design is otherwis… |
| `WWL-185` | S3 | Cards ignore the search filter — fifth consecutive money module. `Spent · month` stayed at Rs 745,200 while the ledger filtered from 55 rows to 5, to 0, and back. |
| `WWL-186` | S3 | No-match empty state presents a populated ledger as onboarding — *"No expenses logged — Track fuel, salaries, rentals and supplies to see your true per-event profit."* plus an Add expense button. WWL-152 pattern, four… |
| `WWL-187` | S3 | Table a11y, fifth module unchanged. 0 of 10 `<th>` carry `scope`, no `<caption>`, all row checkboxes named *"Select row"*. |
| `WWL-188` | S4 | CSV omits Space and Event, both visible columns, and any vendor-defined custom-field columns. Header is `Category,Paid to,Note,Method,Date,Amount`. Fourth module with an export/screen parity gap. |

### Module 15 — Tax report ` /dashboard/tax `

| ID | Sev | Finding |
|---|---|---|
| `WWL-189` | S2 | `Export PDF` is a dead button, and it is the only way out of this screen |
| `WWL-190` | S2 | the tax report silently ignores the venue switcher |
| `WWL-191` | S2 | the year you actually file is unreachable |
| `WWL-192` | S3 | The report never states its own period. The API returns `period.label: "Fiscal 2026-27 (1 Jul 2026 – 30 Jun 2027)"` on every response and the screen renders none of it — no heading, no subtitle, no range. The only clu… |
| `WWL-193` | S3 | The revenue basis is correct but undisclosed. Verified exactly: the report counts Confirmed + Completed only — 7 + 3 bookings summing to Rs 14,349,700, matching to the rupee. It therefore excludes Rs 4,619,650 of `Pen… |
| `WWL-194` | S3 | `FBR submitted: Rs 0` is unexplained and will always read zero. The FBR/PRA adapter is a noop pending a PRA sandbox token, so the card is structurally Rs 0. No tooltip, no "not configured" state — a vendor reading it … |
| `WWL-195` | S3 | The monthly table has no Net column, so per-month profitability — the reason to break a year into months — must be done by hand. There is also no drill-through from a month to its bookings or expenses, and no `basis` … |
| `WWL-196` | S3 | Table a11y, sixth module unchanged. 0 of 4 `<th>` carry `scope` and there is no `<caption>`. |
| `WWL-197` | S4 | Mobile month cards run two money figures together, unlabelled — `Rs 2,903,650Rs 2,718,100` with no separator and no indication which is revenue and which is expenses. The WWL-122 pattern. |
| `WWL-198` | S4 | Three labels for one screen: sidebar "Tax report", breadcrumb "Tax", heading "Tax & P&L". |

### Module 16 — Reports ` /dashboard/reports `

| ID | Sev | Finding |
|---|---|---|
| `WWL-199` | S2 | "this month's earnings" counts this month and every month after it |
| `WWL-200` | S2 | the WWL-110 split has a mechanism: two valuations of the same bookings |
| `WWL-201` | S2 | "Aaj Ki Vasooli" is not today's collections |
| `WWL-202` | S2 | the profit and staff-cost cards ignore the Expenses module entirely |
| `WWL-203` | S2 | a server failure is reported as "the feature is switched off" |
| `WWL-204` | S3 | Not venue-scoped, and the share misattributes the figures. `/report-cards` is absent from `BUSINESS_SCOPED_PREFIXES` — the second module after Tax (WWL-190). Worse, the vendor name in both share paths comes from `useB… |
| `WWL-205` | S3 | The share targets are 14×14 px. Measured at 360×740 on the screen whose entire purpose is sharing from a phone. That is below WCAG 2.2's 24×24 floor and far below the 44/48px touch guidance. |
| `WWL-206` | S3 | Share links have no `aria-label` — the accessible name falls back to `title="Share on WhatsApp"`, and all eight are identical, so a screen-reader user cannot tell which card each one shares. The WWL-104 family. |
| `WWL-207` | S4 | The bookings query carries a silent `limit: 5000` with no indication when it truncates. |
| `WWL-208` | S4 | Sidebar says "Reports", the heading says "Report Cards". |

### Module 17 — Trade operations ` /dashboard/trade-ops `

| ID | Sev | Finding |
|---|---|---|
| `WWL-209` | S2 | three screens auto-load an arbitrary contract, and one of them can sign it |
| `WWL-210` | S2 | unsaved work is discarded silently, and the UI knows it |
| `WWL-211` | S2 | save rebuilds the whole JSON column from the registry |
| `WWL-212` | S2 | two different screens are both called "Trade operations", and the hub is missing a trade |
| `WWL-213` | S3 | The entire surface is empty in production. I fetched all 17 function sheets and checked all 9 trade columns on each: not one is populated. A 9-trade / 30-section / 134-column editor, and nothing in the product writes … |
| `WWL-214` | S3 | A load failure is indistinguishable from having no sheets. `if (isError \\|\\| !sheet)` renders *"No function sheet — Create a function sheet first to plan its operations."* with no Retry. A vendor holding 17 sheets w… |
| `WWL-215` | S3 | Every load fetches twice. Observed on the network: `function-sheets` (list) and `function-sheets/77` (detail) each fired two times for a single page load. |
| `WWL-216` | S3 | No validation on any of the 134 columns, and every cell serialises as a string — `setCell` stores `e.target.value` verbatim, so a `type="number"` column round-trips as `"350"`, not `350`. Confirmed in source; the capt… |
| `WWL-217` | S4 | Inconsistent label casing across the registry, visible when switching trades: sentence case in some trades (*"Setup item list"*, *"Run of show"*, *"Menu plan"*) and Title Case in others (*"Outfits by Function"*, *"Fit… |
| `WWL-218` | S4 | Four names for one screen: `<title>` "Trade operations hub", `<h1>` "Trade operations", breadcrumb "Trade Ops", sidebar "Trade operations". |

### Module 18 — Automation ` /dashboard/automation `

| ID | Sev | Finding |
|---|---|---|
| `WWL-219` | S2 | a false "Reminder paused", on the surface that governs customer messaging |
| `WWL-220` | S3 | The "no-code rule builder" can express exactly two rules. The API returns `triggerTypes: ["days_before_event","days_after_event"]` and `actionTypes: ["notify_me"]` — 2 × 1. And the single action notifies the vendor, n… |
| `WWL-221` | S3 | No validation on the offset. `-5` and `9999` are both accepted with no error and Save enabled — *"−5 days before event"* and *"9999 days before event"* (≈27 years) are both createable rules. Only the rule name gates s… |
| `WWL-222` | S3 | A sixth built-in was added without its icon. `lead_followup_due` exists on the backend but is absent from `RULE_ICON`, so it falls back to the identical glyph used by T-14 — byte-identical 964-character SVGs, against … |
| `WWL-223` | S3 | Internal engineering language in vendor-facing UI. The T+1 row reads *"Handled by reviewRequestService (BK-100.7); surfaced here for visibility"* and carries a "Delegated cron" badge. A marquee owner in Lahore has no … |
| `WWL-224` | S3 | Not venue-scoped — `/api/v1/automation` is missing from `BUSINESS_SCOPED_PREFIXES`, the third path after Tax (WWL-190) and Reports (WWL-204), even though `AutomationRule.businessId` exists on the model. |
| `WWL-225` | S3 | Every load fetches twice — `/automation/status` and `/automation/rules` each fired two times for one page load. Third module with this (WWL-179, WWL-215). |
| `WWL-226` | S4 | `Last run` uses the browser locale, not `en-PK`: `toLocaleDateString(undefined, …)`. Every other module pins the Pakistani format. |
| `WWL-227` | S4 | Custom-rule switches carry a generic `aria-label="Enabled"` — identical on every row — where the built-in switches get it right with per-rule names (*"Toggle T-14 days reminder"*). |
| `WWL-228` | S4 | 1 of 23 focusable controls at 360px has no visible focus indicator. |

### Module 19 — Kitchen prep ` /dashboard/kitchen-prep `

| ID | Sev | Finding |
|---|---|---|
| `WWL-229` | S2 | the entire screen is unreachable in production, for every vendor. |
| `WWL-230` | S3 | the empty state points at a screen that does not exist |
| `WWL-231` | S2 | any network failure is reported as "feature not enabled" |
| `WWL-232` | S2 | unusable at 360px: three of the five controls are off-screen |
| `WWL-233` | S2 | the default venue scope produces a 500 |
| `WWL-234` | S2 | rows are silently discarded |
| `WWL-235` | S3 | the printed head count silently excludes unmatched dishes |
| `WWL-236` | S3 | the validation error takes about a second, and appears in the corner |
| `WWL-237` | S3 | the form has no accessible names |
| `WWL-238` | S4 | Remove on the last row is a silent no-op |
| `WWL-239` | S4 | two different descriptions for the same page |
| `WWL-240` | S4 | no sanity ceiling on a head count |
| `WWL-241` | S3 | switching venue does not reset the builder |

### Module 20 — Inventory ` /dashboard/inventory `

| ID | Sev | Finding |
|---|---|---|
| `WWL-242` | S2 | a new item is filed under the wrong venue |
| `WWL-243` | S2 | the venue switcher does nothing, and there is no venue column anywhere |
| `WWL-244` | S2 | on a phone, no stock can be changed at all |
| `WWL-245` | S2 | the app's own corrective instruction cannot be followed |
| `WWL-246` | S2 | all four numeric fields still accept negatives on live production |
| `WWL-247` | S3 | the movement dialog discards most of the ledger |
| `WWL-248` | S3 | the audit ledger is write-only |
| `WWL-249` | S3 | stat cards ignore the search |
| `WWL-250` | S3 | wrong empty state on a stock book of 36 items |
| `WWL-251` | S3 | search cannot find a supplier the data already carries |
| `WWL-252` | S3 | the delete confirm promises an action that always fails |
| `WWL-253` | S3 | a movement the server will refuse is submittable |
| `WWL-254` | S3 | the accessibility gaps |
| `WWL-255` | S4 | one field, three renderings |
| `WWL-256` | S4 | photographer copy on a marquee operator's stock book |
| `WWL-257` | S4 | the component describes a screen that no longer exists |
| `WWL-258` | S4 | two dead affordances |
| `WWL-259` | S3 | on a failed load the header asserts an empty, healthy stock book |

### Module 21 — Staff & payroll ` /dashboard/staff `

| ID | Sev | Finding |
|---|---|---|
| `WWL-260` | S1 | the Shifts & payroll tab takes the whole route down |
| `WWL-261` | S3 | the error page asks for a reference it never shows |
| `WWL-262` | S2 | a new hire is filed under the wrong venue |
| `WWL-263` | S2 | a negative day-rate and a non-numeric phone both go out |
| `WWL-264` | S3 | the create dialog cannot set the two things the roster shows |
| `WWL-265` | S3 | nothing on a staff row can be done from a phone |
| `WWL-266` | S3 | the staff export is an unflagged personal-data export |
| `WWL-267` | S3 | the payroll view cannot be linked, and a reload always lands on Roster |
| `WWL-268` | S4 | three names for one screen |
| `WWL-269` | S4 | the member page and the roster disagree on formatting |
| `WWL-270` | S3 | the same three accessibility gaps |
| `WWL-271` | S4 | the component describes a screen that no longer exists |
| `WWL-272` | S3 | the roster's cache key omits the scope it is filtered by |

### Module 22 — Suppliers ` /dashboard/suppliers `

| ID | Sev | Finding |
|---|---|---|
| `WWL-273` | S2 | the Overdue filter shows the bills that aren't late and hides the ones that are |
| `WWL-274` | S2 | selecting a status chip zeroes every other count |
| `WWL-275` | S2 | "Credit available" is the sum of credit limits, not what is available |
| `WWL-276` | S3 | the API ranks who is owed the most and the UI throws it away |
| `WWL-277` | S3 | five aging cards and no total |
| `WWL-278` | S3 | the delete confirm names nothing |
| `WWL-279` | S3 | an overpayment is submittable |
| `WWL-280` | S3 | no row actions on a phone |
| `WWL-281` | S3 | the same three accessibility gaps |
| `WWL-282` | S3 | the A/P view cannot be linked |
| `WWL-283` | S4 | three names, and the wrong trade again |
| `WWL-284` | S4 | four invoices are dated in the future |
| `WWL-285` | S4 | the overdue day-count is UTC, the vendor is PKT |

### Module 23 — Brokers ` /dashboard/brokers `

| ID | Sev | Finding |
|---|---|---|
| `WWL-286` | S2 | the Overdue card reads 0 while Rs 138,750 is up to 122 days late |
| `WWL-287` | S2 | there is no Due column |
| `WWL-288` | S2 | no status filter of any kind |
| `WWL-289` | S2 | a commission cannot be attached to a broker or to the event that earned it |
| `WWL-290` | S3 | the disabled-Save hint names the wrong fields |
| `WWL-291` | S3 | a raw JavaScript error is shown to the vendor |
| `WWL-292` | S3 | the two dialogs on one screen disagree about failure |
| `WWL-293` | S3 | a new commission is filed under the wrong venue |
| `WWL-294` | S3 | Rs 0 paid is coloured as a success |
| `WWL-295` | S3 | the broker directory exists in the API and nowhere in the product |
| `WWL-296` | S3 | no row actions on a phone |
| `WWL-297` | S3 | the same three accessibility gaps |
| `WWL-298` | S4 | two rows render a blank Event cell |
| `WWL-299` | S4 | the headline includes money not yet earned |
| `WWL-300` | S4 | the payment-date default is UTC, not PKT |
| `WWL-301` | S4 | three names again |

### Module 24 — Generator fuel ` /dashboard/generator-fuel `

| ID | Sev | Finding |
|---|---|---|
| `WWL-302` | S2 | a maintenance entry cannot be recorded at all |
| `WWL-303` | S2 | a tank reading of zero cannot be recorded |
| `WWL-304` | S3 | one hint for four different blocks, and it is wrong for three of them |
| `WWL-305` | S2 | a negative cost per litre and negative run hours save without objection |
| `WWL-306` | S2 | the burn-rate engine is live, validating, and has no UI |
| `WWL-307` | S2 | tank status is computed and shown nowhere |
| `WWL-308` | S3 | the tank balance is on every row and in no column |
| `WWL-309` | S3 | the screen recomputes totals it is handed, and omits the one that matters |
| `WWL-310` | S3 | four server-side filters, none wired to a control |
| `WWL-311` | S3 | a new entry is filed under the wrong venue |
| `WWL-312` | S3 | false success on a write that never arrived |
| `WWL-313` | S3 | cost per litre and supplier are captured, exported, and never displayed |
| `WWL-314` | S3 | a null litres would render as `0` |
| `WWL-315` | S3 | no label is associated with its field |
| `WWL-316` | S4 | the remove confirm names nothing |
| `WWL-317` | S4 | four names for one screen |
| `WWL-318` | S4 | the date default is UTC, not PKT |
| `WWL-319` | S4 | Export renders with zero rows |

### Module 25 — Halal certs ` /dashboard/halal-certs `

| ID | Sev | Finding |
|---|---|---|
| `WWL-320` | S2 | an expiry date six years before the issue date saves without objection |
| `WWL-321` | S2 | a certificate can be reactivated with no new number and no new expiry |
| `WWL-322` | S2 | the certificate document cannot be attached anywhere |
| `WWL-323` | S3 | the register is empty while the venue buys meat from three suppliers |
| `WWL-324` | S3 | supplier is a free text box beside a supplier relation that can never be filled |
| `WWL-325` | S3 | a negative renewal lead time is transmitted |
| `WWL-326` | S3 | one hint for four fields |
| `WWL-327` | S3 | Revoke enforces its reason with an error toast, not a disabled button |
| `WWL-328` | S3 | the venue switcher does nothing on this screen |
| `WWL-329` | S3 | dates are exported as display strings, not dates |
| `WWL-330` | S3 | the expiring banner shows six and hides the rest |
| `WWL-331` | S3 | no label is associated with its field |
| `WWL-332` | S3 | a new certificate is filed under the wrong venue |
| `WWL-333` | S3 | false success on a write that never arrived |
| `WWL-334` | S4 | the expiry column is formatted `en-GB` |
| `WWL-335` | S4 | two different failures share one card |
| `WWL-336` | S4 | an authority key and its label disagree |
| `WWL-337` | S4 | four names for one screen |
| `WWL-338` | S4 | the issued-date default is UTC, not PKT |

### Module 26 — Drone NOC ` /dashboard/drone-noc `

| ID | Sev | Finding |
|---|---|---|
| `WWL-339` | S2 | the applicant can approve their own PCAA permit |
| `WWL-340` | S2 | a permit that expires six years before it becomes valid |
| `WWL-341` | S2 | a PCAA permit saves with no pilot, no licence and no drone registration |
| `WWL-342` | S3 | a negative fee, counted in a card that also counts refused applications |
| `WWL-343` | S3 | one card for two different problems |
| `WWL-344` | S3 | five captured fields are displayed nowhere |
| `WWL-345` | S3 | an approved permit stays editable |
| `WWL-346` | S3 | Reject and Cancel enforce their reason with a toast, not a disabled button |
| `WWL-347` | S3 | the `/upcoming` endpoint has no consumer here |
| `WWL-348` | S3 | a permit cannot be tied to the wedding it was obtained for |
| `WWL-349` | S3 | no label is associated with its field |
| `WWL-350` | S3 | a new permit is filed under the wrong venue |
| `WWL-351` | S3 | false success on a write that never arrived |
| `WWL-352` | S3 | the entire Compliance rail is empty in production |
| `WWL-353` | S4 | the breadcrumb mangles the acronym |
| `WWL-354` | S4 | the valid-from default is UTC, not PKT |
| `WWL-355` | S4 | the pilot licence is captured but not exported |

### Module 27 — Reviews ` /dashboard/reviews `

| ID | Sev | Finding |
|---|---|---|
| `WWL-356` | S1 | the reviewed party can permanently erase the review |
| `WWL-357` | S2 | the reviews export has an empty Rating column |
| `WWL-358` | S2 | "nudge them on WhatsApp", with no WhatsApp button on any row |
| `WWL-359` | S2 | the AI summary reports an average rating that is not this venue's |
| `WWL-360` | S2 | the vendor is benchmarked against their own other venues |
| `WWL-361` | S2 | a reply is permanent after thirty minutes, and nothing on screen says so |
| `WWL-362` | S2 | switching venue changes nothing until a full reload |
| `WWL-363` | S3 | every booking id renders with two hashes |
| `WWL-364` | S3 | three surfaces on one page, three different opinions of which venue you are on |
| `WWL-365` | S3 | dismissing a customer produces a response rate that contradicts its own numbers |
| `WWL-366` | S3 | the box labelled "Search Review" cannot search a review |
| `WWL-367` | S3 | "below your category average", on a sample the vendor is never shown |
| `WWL-368` | S3 | the table cannot answer any question a reviews screen is opened to answer |
| `WWL-369` | S3 | pressing "Pin" says "Review unpinned" |
| `WWL-370` | S3 | every write on this screen reports success without checking |
| `WWL-371` | S3 | the AI report renders as raw markdown |
| `WWL-372` | S3 | the View dialog has no name, and no way to close it |
| `WWL-373` | S3 | a reply dated before the review it answers, printed side by side |
| `WWL-374` | S3 | the reply box has no limit, against a server that has one |
| `WWL-375` | S3 | review photos are uploadable and invisible to the vendor |
| `WWL-376` | S3 | three of the four surfaces fail invisibly, and one of them lies |
| `WWL-377` | S3 | Export and the column menu vanish above phone width |
| `WWL-378` | S3 | `0092…` normalises to `92092…` |
| `WWL-379` | S3 | the accessibility floor across the page |
| `WWL-380` | S3 | pagination past 100 reviews does not exist |
| `WWL-381` | S3 | a selection column with nothing to select for |
| `WWL-382` | S3 | the delete confirm identifies the wrong thing |
| `WWL-383` | S3 | the keyword tally cannot tell praise from complaint |
| `WWL-384` | S4 | every review is timestamped 05:00 am |
| `WWL-385` | S4 | the trend chart has no scale |
| `WWL-386` | S4 | the shareable PNG will clip a long venue name |
| `WWL-387` | S4 | two "response rates" on one page, 100% and 73% |

### Module 28 — Notifications ` /dashboard/notifications `

| ID | Sev | Finding |
|---|---|---|
| `WWL-388` | S2 | 85% of the feed is labelled "SYSTEM" |
| `WWL-389` | S2 | the filter tabs report that notifications do not exist while they do |
| `WWL-390` | S2 | a lost mark-read is invisible to the client, forever |
| `WWL-391` | S2 | a notification cannot be deleted on a phone |
| `WWL-392` | S2 | after "Mark all read", Load more brings back unread rows under a badge that says zero |
| `WWL-393` | S3 | the row tells you about a lead and cannot take you to it |
| `WWL-394` | S3 | marking a notification read is mouse-only |
| `WWL-395` | S3 | the WW-280 fix was applied to one router and not its sibling |
| `WWL-396` | S3 | nothing in this module ever confirms or reports |
| `WWL-397` | S3 | the notification sound is a 404 |
| `WWL-398` | S3 | a filtered view cannot be linked, bookmarked or restored |
| `WWL-399` | S3 | 52 of 61 notifications match no filter at all |
| `WWL-400` | S3 | every failure in this module is invisible, and one of them lies |
| `WWL-401` | S3 | the refresh that exists is wired to nothing |
| `WWL-402` | S3 | the server offers a cheaper, more correct query and the client declines it |
| `WWL-403` | S3 | the delete's optimistic window shows a count that contradicts the rows |
| `WWL-404` | S3 | no notification carries a timestamp |
| `WWL-405` | S3 | the accessibility floor |
| `WWL-406` | S4 | 61 notifications in five days, and only one way to clear them |
| `WWL-407` | S4 | one of the four booking labels is a different part of speech |

### Module 29 — Promote ` /dashboard/promote `

| ID | Sev | Finding |
|---|---|---|
| `WWL-408` | S2 | the fix for "no way to retract" shipped without the button |
| `WWL-409` | S2 | the "Active" card counts promotions that finished |
| `WWL-410` | S2 | only the first venue can ever be promoted |
| `WWL-411` | S2 | one click sends the paid request twice |
| `WWL-412` | S3 | the price is presented as firm and the code calls it a placeholder |
| `WWL-413` | S3 | two clicks from the dashboard to a filed Rs 5,000 request |
| `WWL-414` | S3 | the blocked-state hint can never appear |
| `WWL-415` | S3 | the note is silently truncated |
| `WWL-416` | S3 | false success on a write that never arrived |
| `WWL-417` | S3 | five fields are fetched and none is displayed |
| `WWL-418` | S3 | "Quoted (total)" sums rejections and cancellations |
| `WWL-419` | S3 | nothing on this screen says whether a placement worked |
| `WWL-420` | S3 | approval flips `sponsored: true` with no money recorded anywhere |
| `WWL-421` | S3 | the venue switcher does nothing here, and the dialog ignores it too |
| `WWL-422` | S3 | both decisions notify as type `system` |
| `WWL-423` | S3 | the accessibility floor |
| `WWL-424` | S3 | a refusal and a finished placement look the same |
| `WWL-425` | S3 | a network failure surfaces axios's own English |
| `WWL-426` | S4 | the 400s leak internal field names |
| `WWL-427` | S4 | Export renders over an empty register |
| `WWL-428` | S4 | the component's own header describes a different screen |
| `WWL-429` | S4 | 36px controls in the dialog at 360px |

### Module 30 — Plan & billing ` /dashboard/billing `

| ID | Sev | Finding |
|---|---|---|
| `WWL-430` | S2 | the plan cards describe a product that does not exist |
| `WWL-431` | S2 | the expiry signal the API added for the client is thrown away |
| `WWL-432` | S2 | one click files a Rs 2,500/mo intent, and a flaky network files it twice |
| `WWL-433` | S2 | there is no way to cancel or downgrade, anywhere |
| `WWL-434` | S3 | the prices are placeholders and the page does not say so |
| `WWL-435` | S3 | false success on a write that never arrived |
| `WWL-436` | S3 | "Plan & billing" contains no billing |
| `WWL-437` | S3 | the pending pill names the tier differently from the card beside it |
| `WWL-438` | S3 | two fetched fields are never rendered |
| `WWL-439` | S3 | a declined upgrade leaves no trace |
| `WWL-440` | S3 | a pending request can be silently overwritten |
| `WWL-441` | S3 | "Included below your plan" contradicts the card it sits on |
| `WWL-442` | S3 | the "Switch" label is unreachable |
| `WWL-443` | S3 | a failed fetch renders as an empty catalog |
| `WWL-444` | S3 | the two paid tiers state no limits at all |
| `WWL-445` | S3 | four names, and two different sections |
| `WWL-446` | S3 | the accessibility floor |
| `WWL-447` | S4 | the component's header describes a different screen |
| `WWL-448` | S4 | no tax line on a priced page, in a product with an FBR engine |
| `WWL-449` | S4 | comparing the cheapest and dearest tier on a phone costs 2.1 screens |

### Module 31 — Collaborations ` /dashboard/collaborations `

| ID | Sev | Finding |
|---|---|---|
| `WWL-450` | S2 | "Invite sent" for an invite nobody will ever see |
| `WWL-451` | S2 | one click, two invites, two notifications |
| `WWL-452` | S2 | the decline reason cannot be given |
| `WWL-453` | S2 | the two consequential actions have no confirmation, and one blocks all the others |
| `WWL-454` | S3 | two lines of copy in one dialog state different rules |
| `WWL-455` | S3 | three invalid amounts, three silent outcomes, no message |
| `WWL-456` | S3 | the email field is a text box |
| `WWL-457` | S3 | a raw Postgres error is returned to the client |
| `WWL-458` | S3 | the withdrawn invitee is never told |
| `WWL-459` | S3 | nothing can be actioned on a phone |
| `WWL-460` | S3 | the stat cards add up two different things |
| `WWL-461` | S3 | two of the four trend indicators are hard-coded |
| `WWL-462` | S3 | five captured fields are displayed nowhere, and one field means three things |
| `WWL-463` | S3 | "accepted" is where the feature stops |
| `WWL-464` | S3 | an invite with no amount reads as Rs 0 |
| `WWL-465` | S3 | one failed direction hides the other |
| `WWL-466` | S3 | the direction is not in the URL, and the search survives the switch |
| `WWL-467` | S3 | the accessibility floor |
| `WWL-468` | S4 | `cap()` is applied to a free-text field, and the date format drifts |
| `WWL-469` | S4 | two different exports share one filename |
| `WWL-470` | S4 | the fourth stale Track-C header in a row |
| `WWL-471` | S4 | the density toggle disappears at 360px |

### Module 32 — Business Settings ` /dashboard/settings `

| ID | Sev | Finding |
|---|---|---|
| `WWL-472` | S2 | one amenity toggle rewrites eight fields the vendor never touched |
| `WWL-473` | S2 | the save bar reports success for a save that never happened |
| `WWL-474` | S3 | the Cancellation-policy route lands on the wrong tab |
| `WWL-475` | S3 | the tab and the business are readable from the URL and never written back |
| `WWL-476` | S3 | what this account's listings actually contain |
| `WWL-477` | S3 | City is free text, and the logo is a URL |
| `WWL-478` | S3 | the same ten amenities for every vendor type |
| `WWL-479` | S3 | the packages and menus contradict the venue they belong to |
| `WWL-480` | S3 | two labelling conventions in one hub |
| `WWL-481` | S3 | a column name and a label that have both drifted |
| `WWL-482` | S3 | the eleven-tab rail scrolls five screens wide on a phone |
| `WWL-483` | S3 | the hub has no unload guard, and Bank details does |
| `WWL-484` | S3 | switching tab is silent, switching business asks |
| `WWL-485` | S4 | the fifth stale Track-C header |
| `WWL-486` | S4 | `TourLauncherCard` is imported by the hub and rendered by the page |
| `WWL-487` | S4 | the remove button is 32px |

### Module 33 — Availability ` /dashboard/settings?tab=availability `

| ID | Sev | Finding |
|---|---|---|
| `WWL-488` | S2 | every venue is blocked today, and two of the rows look like residue of a fixed bug |
| `WWL-489` | S2 | the same date can be blocked twice, and Free is keyed by date |
| `WWL-490` | S3 | a date six years in the past can be blocked |
| `WWL-491` | S3 | Free has no confirmation |
| `WWL-492` | S3 | both writes report success and change nothing |
| `WWL-493` | S3 | one click, two DELETEs |
| `WWL-494` | S3 | one date at a time, on a market that closes for weeks |
| `WWL-495` | S3 | the list is unbounded and the month filter is never used |
| `WWL-496` | S3 | freeing one date disables every Free button |
| `WWL-497` | S3 | a blocked date has no provenance |
| `WWL-498` | S3 | the visible label and the accessible name disagree |
| `WWL-499` | S3 | the failure toast is axios's own string |
| `WWL-500` | S4 | availability has no calendar |

### Module 34 — Cancellation policy ` /dashboard/cancellation-policy `

| ID | Sev | Finding |
|---|---|---|
| `WWL-501` | S1 | the same named policy pays out double, depending on which endpoint you ask |
| `WWL-502` | S2 | the page says no policy is set; the engine is applying one |
| `WWL-503` | S2 | a failed save is completely silent |
| `WWL-504` | S2 | the exposure flag reads OK on an unaccepted policy worth Rs 1.2 million |
| `WWL-505` | S3 | only the first venue can have a policy |
| `WWL-506` | S3 | the deposit the vendor is committing to is invisible here |
| `WWL-507` | S3 | no confirmation, and no word about existing bookings |
| `WWL-508` | S3 | three presets, and nothing else |
| `WWL-509` | S3 | choosing a policy is mouse-only |
| `WWL-510` | S3 | one click, two POSTs, on a versioned resource |
| `WWL-511` | S3 | the dispute pack's money is evidenced by two unproofed receipts |
| `WWL-512` | S3 | the module fires no toasts at all |
| `WWL-513` | S3 | Roman Urdu with no language marking |
| `WWL-514` | S4 | there are two cancellation-policy fields and they do not know about each other |

### Module 35 — Setup checklist ` /dashboard/onboarding `

| ID | Sev | Finding |
|---|---|---|
| `WWL-515` | S2 | the checklist names the fix, and the fix is on a different page |
| `WWL-516` | S2 | the entire Verification category points at a page that does not exist |
| `WWL-517` | S2 | the one link in "Highest-impact next moves" is a 404 |
| `WWL-518` | S3 | the highest-impact block is the one place you cannot click through from |
| `WWL-519` | S3 | five activation fields are fetched and shown nowhere, including the most actionable |
| `WWL-520` | S3 | the panel says activation matters and the score ignores it |
| `WWL-521` | S3 | 3359 and 3360 are scored identically, down to the suggestion list |
| `WWL-522` | S3 | the progress bars carry no accessible value |
| `WWL-523` | S3 | a failed fetch reads as "no businesses" |
| `WWL-524` | S3 | the page's own promise is unsubstantiated on the page |
| `WWL-525` | S3 | there is no `h1` on the page |
| `WWL-526` | S4 | two different params open the same tab |

### Module 36 — Tonight ` /dashboard/venue-os?tab=today `

| ID | Sev | Finding |
|---|---|---|
| `WWL-527` | S2 | CORRECTED, then re-raised (S2) |
| `WWL-528` | S2 | four of the seven Venue-OS tabs render only a heading |
| `WWL-529` | S2 | a Completed booking dated five weeks in the future, still 75% unpaid |
| `WWL-530` | S3 | the sidebar and the tabs disagree on all seven names |
| `WWL-531` | S3 | the money on screen does not add up to the money in the card |
| `WWL-532` | S3 | Pending and Awaiting-Payment bookings are listed as events the venue is committed to |
| `WWL-533` | S3 | the vendor is the customer on a live booking |
| `WWL-534` | S3 | nothing on this screen can be acted on |
| `WWL-535` | S3 | no row says which hall the event is in |
| `WWL-536` | S3 | no `h1` on the page |
| `WWL-537` | S3 | "Events today: 0" on a day when all three venues are blocked |
| `WWL-538` | S4 | row dates carry no year |

### Module 37 — Event profit ` /dashboard/venue-os?tab=profit `

| ID | Sev | Finding |
|---|---|---|
| `WWL-539` | S1 | two engines, one screen, Rs 2,292,300 apart |
| `WWL-540` | S2 | Menu re-cost cannot work, and says so in the server's words |
| `WWL-541` | S2 | Rs 25,508,850 "net profit" includes Rs 13,417,229 nobody has paid |
| `WWL-542` | S2 | seven weddings at 100% margin |
| `WWL-543` | S2 | the Management / Tax (declared) toggle cannot be told apart |
| `WWL-544` | S3 | 22 rows, 0 links |
| `WWL-545` | S3 | "Card IDs · e.g. 12, 14, 19" |
| `WWL-546` | S3 | letters enable the button and fire a request |
| `WWL-547` | S3 | the sort is not in the URL |
| `WWL-548` | S3 | the page has no `h1` |
| `WWL-549` | S3 | table headers carry no `scope` |
| `WWL-550` | S3 | a Rs 0 bill is rejected as a missing field |
| `WWL-551` | S3 | a negative bill computes a negative tax |
| `WWL-552` | S3 | the calculator never offers the amounts sitting above it |
| `WWL-553` | S4 | unconfirmed bookings are counted as "Booked" |

### Module 38 — Venue money ` /dashboard/venue-os?tab=money `

| ID | Sev | Finding |
|---|---|---|
| `WWL-554` | S2 | Rs 8,847,000 of real spending is invisible to per-event profit |
| `WWL-555` | S2 | the FIXED badge and the Fixed-overheads tile contradict each other |
| `WWL-556` | S2 | "Save expense" on an empty form does nothing, silently |
| `WWL-557` | S2 | the tariff estimator instructs the vendor to do something the product cannot do |
| `WWL-558` | S2 | Post writes to the live ledger with no confirmation and no warning |
| `WWL-559` | S3 | five of seven panels have no data at all |
| `WWL-560` | S3 | a malformed period 500s with an internal function name |
| `WWL-561` | S3 | the depreciation dry-run response omits `dryRun` |
| `WWL-562` | S3 | the range is not in the URL |
| `WWL-563` | S3 | `meter #` is the last raw-id box on the tab |
| `WWL-564` | S3 | three period fields, two different controls |
| `WWL-565` | S3 | the Add-expense form marks nothing required |
| `WWL-566` | S4 | two fields ship pre-filled |
| `WWL-567` | S4 | the booking picker is inconsistent with the Profit tab |
| `WWL-568` | S3 | the category percentages are cut off at 360px |

### Module 39 — Halls & spaces ` /dashboard/venue-os?tab=spaces `

| ID | Sev | Finding |
|---|---|---|
| `WWL-569` | S1 | the public page offers a hall that is already booked |
| `WWL-570` | S2 | the panel the hint promises is not on the page |
| `WWL-571` | S2 | per-space P&L computes the cost and then discards it |
| `WWL-572` | S2 | the availability grid 500s with raw Postgres text |
| `WWL-573` | S3 | nothing in the "tree" is nested |
| `WWL-574` | S3 | `path` is populated for some nodes and not others |
| `WWL-575` | S3 | the calendar opens blank |
| `WWL-576` | S3 | the calendar's only signal is colour |
| `WWL-577` | S3 | the slot templates cannot describe a shaadi |
| `WWL-578` | S4 | a live listed venue has a space called "afsana" |

### Module 40 — Cash & cheques ` /dashboard/venue-os?tab=cash `

| ID | Sev | Finding |
|---|---|---|
| `WWL-579` | S2 | the cheque drawer asks the wrong question, four times |
| `WWL-580` | S2 | there is a real Rs 695,700 cheque, and nothing on this tab can see it |
| `WWL-581` | S2 | the widest window cannot reach the cheque |
| `WWL-582` | S2 | a mistyped month gives a false all-clear on the bounce-risk screen |
| `WWL-583` | S3 | "Open drawer" opens a real galla on one click |
| `WWL-584` | S3 | one tab, one concept, two controls |
| `WWL-585` | S3 | a reversed range behaves differently on two screens |
| `WWL-586` | S3 | a negative window is accepted |
| `WWL-587` | S3 | the cheque table would name a booking id, not a customer |
| `WWL-588` | S4 | no `h1` on the page |

### Module 41 — Kitchen & suppliers ` /dashboard/venue-os?tab=kitchen `

| ID | Sev | Finding |
|---|---|---|
| `WWL-589` | S2 | the purchase-order form is pre-loaded and one click from firing |
| `WWL-590` | S2 | the over-billing check clears lines it never checked |
| `WWL-591` | S2 | the GRN step defaults to "no discrepancy" |
| `WWL-592` | S3 | `production run #` is a raw id with no source |
| `WWL-593` | S3 | every input on the tab is placeholder-only |
| `WWL-594` | S3 | the supplier-udhaar panel has no supplier field |
| `WWL-595` | S3 | Accept and Settle post to the ledger with no confirmation |
| `WWL-596` | S4 | no `h1` on the page |

### Module 42 — Accounting ` /dashboard/venue-os?tab=advanced `

| ID | Sev | Finding |
|---|---|---|
| `WWL-597` | S2 | three buttons in a row, and the third locks the books |
| `WWL-598` | S3 | 35 unlabelled inputs across 28 views |
| `WWL-599` | S3 | seven raw-id boxes survive here |
| `WWL-600` | S3 | force majeure asks for a hand-typed pairing syntax |
| `WWL-601` | S3 | four of seven groups fetch nothing when opened |
| `WWL-602` | S3 | "Mark registered" asserts a regulatory status in one click |
| `WWL-603` | S4 | no `h1` on the page |

### Module 43 — Field capture ` /dashboard/field `

| ID | Sev | Finding |
|---|---|---|
| `WWL-604` | S2 | "Hold a date" holds a date on an untouched form |
| `WWL-605` | S2 | the other three dialogs are silent dead ends |
| `WWL-606` | S2 | the success toast does not check what came back |
| `WWL-607` | S3 | 28 fields, 28 unlabelled, 0 required |
| `WWL-608` | S3 | a lead captured at an expo attaches to no venue |

### Module 44 — Quote requests ` /dashboard/quotes `

| ID | Sev | Finding |
|---|---|---|
| `WWL-609` | S2 | Decline ends a live sales conversation with no confirmation |
| `WWL-610` | S3 | a third scoping pattern |
| `WWL-611` | S3 | the screen never says which venue's quotes these are |
| `WWL-612` | S3 | `Decline` is offered before a price ever exists |

