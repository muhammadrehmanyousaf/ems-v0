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
