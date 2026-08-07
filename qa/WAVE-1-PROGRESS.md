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

## Shared primitives built (the leverage)

| Primitive | Closes | What it guarantees |
|---|---|---|
| `lib/api/assert-ok.ts` | F1 — 41 false-success findings | A 2xx that carries `status: false`, the API banner, or no envelope at all now throws instead of reaching a success toast. `errorMessage()` prefers the server's words over axios's English |
| `components/dashboard/primitives/dangerous-action.tsx` | F5 — 23 one-click irreversibles | Wraps the trigger, states the consequence in the vendor's terms, and can require the vendor to type a word for the truly unundoable (period close, journal posting) |
| `components/dashboard/primitives/labelled-field.tsx` | F2 + F8 — 63 findings | Every input gets a real `<label for>`, required marked in the accessible tree, errors with `role="alert"`; number fields default to `min=0` so a negative day-rate can't be typed |
| `lib/utils/pk-date.ts` | F10 — 10 findings | `todayInKarachi()` and friends. For the first five hours of every Pakistani day, `toISOString().slice(0,10)` returns yesterday — which is how a receipt dialog came to refuse today's date at 2am |

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

**Backend engines with no UI** (§3, ~8): generator burn-rate (`WWL-306`), tank
status (`WWL-307`), the broker directory (`WWL-295`), the supplier
who-is-owed-most ranking (`WWL-276`), four server-side filters wired to nothing
(`WWL-310`), the `/upcoming` permits endpoint (`WWL-347`), and five groups of
fetched-but-unrendered fields.

**Unreachable screens** (§4 remainder): `WWL-229` (unreachable for every
vendor), `WWL-528` (four Venue-OS tabs render only a heading), `WWL-352` (the
Compliance rail is empty in production), `WWL-559`, `WWL-601`, `WWL-017`
(11 of 20 onboarding tasks dead-end).

**The rest of the S3/S4 tail** — copy fixes, stale component headers, tone and
formatting drift. Individually cheap, collectively a long list; each is one row
in [00-OPEN-BACKLOG.md](00-OPEN-BACKLOG.md) with a reproduction.

**The 1,864 unrun cases** still need a seeded staging vendor, a test customer and
a second vendor account. That infrastructure is unchanged by this work.
