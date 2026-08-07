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
