# Growth Cluster — Redesign Recon (Ground Truth)

Audited domains: **insights, automation, promote, onboarding, reviews, dashboard (home overview)**.
Frontend root: `C:/Projects/Event Management Systen/ems-v0` · Backend root: `C:/Projects/Event Management Systen/event-planner-api`.

All six are **growth / read-mostly** surfaces. Only two of them have first-class CRUD lists where a CSV import makes sense (**automation rules**, **reviews**). The rest are computed dashboards, KYC checklists, or request forms. Reviews already ships a working CSV **export**; no domain in this cluster has an **import** dialog. The marquee importers (`import-customer-dialog`, `import-booking-dialog`) live in the *customers*/*bookings* domains and are only *linked to* from onboarding.

---

## 1. INSIGHTS  (read-only / computed — import N/A)

**List/view component**
- `components/dashboard/mainScreens/insights/insights-view.tsx` (orchestrator)
- Sub-views (each self-fetches): `revenue-breakdowns.tsx`, `monthly-pnl.tsx`, `cash-flow-forecast.tsx`, `seasonal-demand-heatmap.tsx`, `response-times.tsx`, `whatsapp-template-performance.tsx`

**lib/api module**: `lib/api/insights.ts` → `InsightsAPI.getAdvanced()` (GET `/api/v1/analytics/insights-advanced`). The sub-views use `lib/api/analytics.ts` → `AnalyticsAPI.getRevenueBreakdowns / getMonthlyPnl / getCashFlowForecast / getSeasonality / getResponseTimes` and `WhatsApp` template perf.

**Backend**: router `analyticsRouter.js` (mounted `/api/v1/analytics`). Controllers: `insightsController.js` (`getInsightsAdvanced`) + `analyticsController.js` (breakdowns, pnl, cash-flow, seasonality, response-times) + `whatsappController.js` (`getWhatsappTemplatePerformance`). All GET, all auth-guarded, vendor-scoped, **read-only**.

**Bulk import**: absent. **Bulk export**: absent (no CSV button anywhere). *Note: these are exactly the surfaces a redesign could add an "Export report (CSV/PDF)" affordance to — but no create endpoint exists, so IMPORT is N/A.*

**Interactive elements to preserve**
- 4 KPI cards (Quote acceptance, Repeat customers, Median LTV, 90-day forecast).
- `UpgradeNudge` (Business-plan gating banner — flag-gated; keep).
- Funnel-by-source `<table>` (raw HTML table, not tanstack).
- Avg-ticket 12-month bar list; 90-day forecast 3-cell grid + methodology footnote.
- No buttons/dialogs/popovers; no row actions.

**Table vs cards**: **Mixed** — Card wrappers containing one raw `<table>` (funnel) + several bar/heatmap visualizations. NOT a tanstack global-table.

**Recommended export columns** (if an export is added per sub-report):
- Funnel: `source, total, contacted, quoted, booked, lost, contactRate, quoteRate, bookingRate`
- Monthly trend: `monthLabel, monthStart, bookings, revenue, avgTicket`
- Monthly P&L: `month, revenue, bookingCount, expenses, supplierInvoices, brokerCommissions, staffPay, totalCosts, grossProfit, margin`
- Cash-flow: `monthKey, monthLabel, expectedIn, installmentCount, cumulative`

### Bulk I/O
- **Export columns**: as above (per sub-report; today none exist).
- **Import fields**: **import N/A** — fully computed/derived from bookings, leads, payments, expenses. No model to write to.

**Behaviors to preserve verbatim**
- PKR money formatting `Rs. {Math.round(n).toLocaleString('en-PK')}`; `—` for non-finite.
- Lead-source labels via `LEAD_SOURCE_LABELS` (craft/source-aware).
- Forecast "methodology" string + the italic "rough heuristic, needs 18+ months" disclaimer (compliance-flavoured, keep verbatim).
- Business-plan upgrade nudge gating.

**Migration risk**: many independent self-fetching sub-components, each with its own loading skeleton + heatmap/bar math. Restyle each card shell without touching the inner SVG/bar math. The funnel raw `<table>` should migrate to the shared DataTable only carefully (it has a totals/Conv. column with tone coloring).

---

## 2. AUTOMATION  (CRUD list — IMPORTABLE)

**List/view components**
- `components/dashboard/mainScreens/automation/automation-status-view.tsx` — built-in 5-rule engine status + per-vendor toggles.
- `components/dashboard/mainScreens/automation/automation-builder-card.tsx` — vendor-defined custom rules (the CRUD list).

**lib/api module**: `lib/api/automationRules.ts` → `AutomationRulesAPI.list / create / update / toggle / remove`. The status surface calls `axiosInstance` directly: GET `/api/v1/automation/status`, PATCH `/api/v1/automation/prefs`.

**Backend**: router `automationRouter.js` (`/api/v1/automation`). Controller `automationController.js` → `getStatus, updatePref, listRules, createRule, updateRule, deleteRule`. Model `AutomationRule`.

**Bulk import**: absent. **Bulk export**: absent.

**Interactive elements to preserve**
- Built-in surface: Engine status badge (Running/Disabled); 5 rule cards (icons per kind) each with a `Switch` (vendor toggle), Active/Inactive badge, "Disabled by ops" pill, "Delegated cron" pill. Toggles disabled when `envDisabled || delegated`.
- Builder card: new-rule form — `Input` (name), `Input type=number` (days 0–365), `Select` (before/after event), `Input` (optional message), **"Add rule"** primary button. Each existing rule row: `Switch` (enable/pause) + icon-only **Trash2** delete button. Per-row + per-toggle busy spinners.

**Table vs cards**: **Cards** (rule cards grid + a stacked row list). NOT tanstack. A redesign could move the *custom rules* list into a DataTable; the built-in 5-rule toggles should stay card-style (they're config, not data rows).

### Bulk I/O
- **Export columns** (custom rules): `id, name, triggerType, offsetDays, actionType, message, enabled, lastRunAt, createdAt`.
- **Import fields** (mirror `createRule`):
  | field | required | type |
  |---|---|---|
  | name | yes | string (≤120 chars) |
  | triggerType | yes | enum `days_before_event` \| `days_after_event` |
  | offsetDays | yes | int 0–365 |
  | actionType | no (default `notify_me`) | enum `notify_me` |
  | message | no | string (≤1000 chars) |
  | enabled | no (default true) | boolean |
  | businessId | no | int (scope to one business) |

**Behaviors to preserve verbatim**
- **Three-state precedence** (built-in rules): `enabled = !envDisabled && vendorPref`. Env kill-switch ALWAYS wins; "Disabled by ops" can't be re-enabled in UI.
- Optimistic local toggle update on prefs (avoids reload bounce).
- Backend `_sanitizeRule`: trims+slices name to 120, message to 1000, clamps offsetDays to 0–365, validates enum membership.
- **WW-151 fix**: on a full edit, only touch `enabled` when the field is actually present (don't silently re-enable a paused rule).
- Vendors-only create guard (`isVendor || isSuperAdmin`); rules scoped by `createdByUserId`.
- Custom-rule `describe()` label: `"{offsetDays} {trigger label} → notify me"`.

**Migration risk**: two visually-different surfaces on one page (config toggles vs CRUD). Don't merge them. `NEXT_PUBLIC_AUTOMATION_BUILDER` flag gates the builder card.

---

## 3. PROMOTE  (request form + status history — import N/A)

**List/view component**: `components/dashboard/mainScreens/promote/promote-view.tsx` (single file; request form + "My promotion requests" list).

**lib/api module**: `lib/api/promotions.ts` → `PromotionsAPI.getPricing / listMine / create / queue / approve / reject`. Also imports `BusinessesAPI.getUserBusinesses` from `lib/api/dashboard.ts`.

**Backend**: router `promotionRouter.js` (`/api/v1/promotions`). Controller `promotionController.js` → `getPricing, listMyPromotions, createPromotionRequest, cancelPromotionRequest, listPromotionQueue, approvePromotion, rejectPromotion`. (Admin queue endpoints guarded by `superAdminMiddleware`.)

**Bulk import**: absent. **Bulk export**: absent.

**Interactive elements to preserve**
- Request form: `Select` (business), `Select` (placement: homepage/category/city/search), window picker (3 toggle buttons 7/15/30 days, each showing indicative price), `Textarea` (note), live "Indicative price" summary, **"Request promotion"** primary button.
- "My promotion requests" list: status-badge rows (pending/approved/rejected/expired/cancelled) with placement label, business, window, quoted price, "live until {date}" / rejection reason. (No row actions in this view, though BE supports `cancel`.)

**Table vs cards**: **Cards** (form card + stacked request-row list). NOT tanstack.

### Bulk I/O
- **Export columns** (request history, if added): `id, placement, business.name, windowDays, priceQuoted, status, note, startsAt, endsAt, decidedAt, rejectionReason, createdAt`.
- **Import fields**: **import N/A** — promotions are a request/approval workflow with admin pricing + decision state; bulk-creating promotion requests makes no business sense.

**Behaviors to preserve verbatim**
- Money: `Rs {Math.round(Number(n)).toLocaleString('en-PK')}`; `—` when null.
- **Status state machine**: `pending → approved | rejected | expired | cancelled`. Each has a distinct badge tone + icon + label (e.g. "Approved · live", "Pending review"). Keep all five.
- Single-business auto-select (`if biz.length === 1`).
- Indicative-price wording + "we'll confirm before going live" (D7 no-payment disclaimer) — keep verbatim.
- `NEXT_PUBLIC_PROMOTIONS` flag (default OFF).

**Migration risk**: pricing matrix is `placement × windowDays`; the window buttons inline-look-up price from `pricing[]`. Preserve the lookup, just restyle the buttons. WW-079 vendor-cancel exists on the BE but is not yet surfaced — a redesign could add a "Withdraw" row action (additive).

---

## 4. ONBOARDING  (KYC checklist + migration nudge — import N/A here; it *links to* importers)

**List/view components**
- `components/dashboard/mainScreens/onboarding/onboarding-checklist-view.tsx` — per-business 0–100 completeness checklist.
- `components/dashboard/mainScreens/onboarding/getting-started-migration.tsx` — "Bring your business in" card that **links to** the customer/booking importers (does not contain them).

**lib/api module**: none dedicated. Checklist calls `axiosInstance.get('/api/v1/businesses/my-completeness')` directly.

**Backend**: business completeness lives on `businessRouter.js` → `businessController.js` (and/or `vendorCompletenessController.js`). The migration card just deep-links to `/dashboard/customers` and `/dashboard/bookings`.

**Bulk import**: **absent in this domain** — but `getting-started-migration.tsx` surfaces the *real* importers that live elsewhere: Customer CSV (`NEXT_PUBLIC_IMPORT`, on /dashboard/customers) and Booking CSV (`NEXT_PUBLIC_BOOKING_IMPORT`, on /dashboard/bookings). **Bulk export**: absent.

**Interactive elements to preserve**
- Checklist: per-business card with big score (0/100), tier badge (`Just started → Getting there → Solid start → Well-rounded → Polished`), "Highest-impact next moves" suggestion box, per-category `Progress` bars (Core/Visual/Commercial/Trust/Specialty/Verification), done/not-done line items with weight chips (`✓` or `+{weight}`), "Edit business profile" link.
- Migration card: dismissible (X icon-only button; persists `ww_migration_card_dismissed_v1` in localStorage); two action tiles linking to importers; renders nothing if both flags off OR dismissed.

**Table vs cards**: **Cards** (one card per business; nested category progress lists). NOT tanstack.

### Bulk I/O
- **Export columns**: N/A (checklist is a computed score view).
- **Import fields**: **import N/A** for onboarding itself. The schemas that matter (customer/booking CSV) belong to the *customers* and *bookings* domains — see those recon docs. Do not duplicate importers here; keep the deep-link tiles.

**Behaviors to preserve verbatim**
- Tier thresholds: ≥90 Polished, ≥70 Well-rounded, ≥50 Solid start, ≥25 Getting there, else Just started.
- `{remaining} pts on the table` / "Maxed out" copy.
- Category icons (ShieldCheck for verification, TrendingUp otherwise).
- Migration card dismiss persistence key `ww_migration_card_dismissed_v1`; flag-aware zero-footprint render.
- Importer flags `NEXT_PUBLIC_IMPORT`, `NEXT_PUBLIC_BOOKING_IMPORT`.

**Migration risk**: score/category/weight data is BE-driven; the UI just renders it. Safe to restyle. The migration card's localStorage dismiss + dual-flag gating must survive (don't make it always-render).

---

## 5. REVIEWS  (real tanstack table — IMPORTABLE in principle; export ALREADY EXISTS)

**List/view components**
- `components/dashboard/mainScreens/reviews/reviewsListing/reviews-listing-view.tsx` — page shell (Heading + 4 stacked panels).
- Sub-listing/table: `reviewsListing/components/reviews-table.tsx` (the tanstack GlobalTable).
- Top panels: `reviews/reputation-panel.tsx`, `reviews/automation-stats-card.tsx`, `reviews/ai-review-summary-card.tsx`.

**lib/api module**: `lib/api/dashboard.ts` → `ReviewsAPI.getAll(page, limit) / delete / togglePin / getBusinessReviews / submitReview`. Reply uses `axiosInstance.patch('/api/v1/reviews/:id/reply')` directly. Reputation/automation-stats use `AnalyticsAPI.getReputation` + `/api/v1/reviews/automation-stats`.

**Backend**: routers `reviewRouter.js` (`/api/v1/reviews`) + list via `analyticsRouter.js` GET `/api/v1/analytics/reviews`. Controllers: `reviewController.js` (`addReview, getUserReviews, getAutomationStats, setReviewAutomationDismiss, replyToReview, togglePinReview, deleteReview, uploadReviewPhotos, deleteReviewPhoto, getBusinessReviews`) + `analyticsController.js` (`getAllReviewsList`, `getReputation`). Model `Review` (`reviewModel.js`).

**Bulk import**: absent. **Bulk export**: **PRESENT** — `reviewsListing/components/reviews-table-actions.tsx` uses `exportTableToCSV(table, "reviews")` from `lib/utils/csv-export` behind an "Export" button (with a `Download` icon + `DataTableColumnView`).

**Interactive elements to preserve**
- **Table toolbar** (`reviews-table-actions.tsx`): search `Input` (filters `reviewerName`), **Export** button (CSV), column-visibility menu (`DataTableColumnView`).
- **Row actions** (`row-actions.tsx`, MoreHorizontal dropdown): View, Reply / Edit Reply, Pin (showcase) / Unpin, Delete (destructive).
- **Dialogs**: `view-dialog.tsx` (read review), `reply-dialog.tsx` (Reply/Update Reply — Textarea + star display), `ConfirmDeleteDialog` (delete confirm).
- **Reputation panel** (`reputation-panel.tsx`): "Share best review" via WhatsApp, Copy, and **download PNG** (canvas-rendered shareable card) — buttons + `navigator.clipboard` + canvas/blob download. Keep all three share actions.
- **Automation stats card** (`automation-stats-card.tsx`): Refresh button; per-row "dismiss from silent list" button (POST `/reviews/automation/:bookingId/dismiss`); "mark number not on WhatsApp" action; per-row busy state.
- **AI review summary card** (`ai-review-summary-card.tsx`): business `Select` + **Summarise** button (AI sentiment; handles "AI not configured").
- Star component, pinned-first showcase ordering.

**Table vs cards**: **Real tanstack table** — `GlobalTable` + `useDataTable` + `columns.tsx` (select checkbox, reviewerName+avatar, phone, bookingId, businessName, rating stars, createdAt, actions). This is the *one* domain in the cluster already on the shared DataTable. **Reuse the existing table-actions pattern as the export template for other domains.**

### Bulk I/O
- **Export columns** (already wired via `exportTableToCSV`; recommended explicit set): `reviewerName, email, phone, bookingId, businessName, rating, comment, vendorReply, vendorReplyDate, isPinned, createdAt`.
- **Import fields** (mirror `addReview` / `submitReview` — note this is **vendor back-fill of historical reviews**, gate carefully):
  | field | required | type |
  |---|---|---|
  | businessId | yes | int |
  | bookingId | yes | int (one review per user×business×booking) |
  | rating | yes | int 1–5 |
  | comment | no | text |
  | reviewerName | no | string (display only) |
  | createdAt | no | date (back-dated import) |

  *Caveat:* the live create endpoint gates on `booking.status === 'Completed'` and enforces one-review-per-(user,business,booking). A real importer must honor or explicitly bypass these — treat as a controlled back-fill, not the public review path.

**Behaviors to preserve verbatim**
- **Reply state**: button label flips "Reply" ↔ "Edit Reply"; success toast "Reply posted/updated".
- **Pin state machine**: `togglePin` → "Review pinned — it'll showcase first" / "Review unpinned"; pinned reviews showcase first.
- **Dedupe**: one review per (user, business, booking); BE rejects dupes.
- **Validation**: `reviewId` must be `isInt({min:1})` (WW-280 — non-numeric id raised raw PG 500); rating 1–5.
- Photo upload: EXIF-stripped, virus-scanned (WW-089), max 5 per review.
- Automation dismiss (Issue #20): vendor removes a silent booking from the review-nudge pool; restorable.
- CSV export filename `"reviews"`.

**Migration risk**: LOWEST — already on the shared DataTable + CSV export. Risk is the 3 bespoke top panels (reputation share-card canvas rendering, automation-stats dismiss flow, AI summary) — these are custom and must not be flattened into generic cards. The canvas PNG download in reputation-panel is fiddly (manual canvas drawing) — restyle the surrounding card only, leave the canvas code alone.

---

## 6. DASHBOARD (home overview)  (computed overview — import N/A)

**List/view component**: `components/dashboard/mainScreens/dashboard/dashboard-view.tsx` (role-switches to `admin-dashboard-view.tsx` for super-admin).

**Sections** (`dashboard/sections/`): `cards-section`, `charts-sections`, `revenue-split-section`, `upcoming-and-due-section`, `table-and-review-section`, `completeness-widget`, `operations-summary-section`, `needs-attention-strip`, `lead-conversion-tile`, `revenue-split-section`.
**Components** (`dashboard/components/`): `booking-area-chart`, `revenue-bar-chart`, `status-pie-chart`, `recent-booking-table`, `top-vendors-table`, `customer-reviews`, `data-card`.

**lib/api module**: `lib/api/analytics.ts` → `AnalyticsAPI.getDashboardKpis / getBookingTrends / getBookingStatusDistribution / getRevenueTrends / getRecentBookings / getReviewSummary / getTodaysBookings / getUpcomingBookings7Days` (+ super-admin: `getPlatformRevenue / getVendorPerformance / getPlatformOverview`). Also `PaymentsAPI.getVendorRevenue` from `lib/api/dashboard.ts`.

**Backend**: router `analyticsRouter.js`. Controller `analyticsController.js` (+ `operationsSummaryController.js` for the ops-summary widget, `platformPulseController.js` / `platformStatController.js` for admin). All GET, read-only.

**Bulk import**: absent. **Bulk export**: absent.

**Interactive elements to preserve**
- `PageHeader` with `DashboardDateFilter` (range: today/this_week/this_month/this_year/custom...) + **"Today's bookings"** button with count badge → opens a **`Sheet`** (today's bookings drawer).
- `CardsSection` KPI tiles; `CompletenessWidget` ("Edit profile" → `/dashboard/settings`); `OperationsSummarySection` (linked widget grid, each row a `Link`); `LeadConversionTile`; `NeedsAttentionStrip` (flag `NEXT_PUBLIC_ACTION_CENTER`, prioritized action links); `RevenueSplitSection`; `UpcomingAndDueSection`; charts (area/bar/pie); `recent-booking-table` + `customer-reviews`.
- Per-row status badges (confirmed/pending/cancelled/completed tones).

**Table vs cards**: **Mixed** — KPI cards + Recharts charts + two raw `<table>`-style components (`recent-booking-table`, `top-vendors-table`, both bespoke, not tanstack).

### Bulk I/O
- **Export columns**: N/A (an "Export overview" PDF/CSV could be added but there's no list to round-trip).
- **Import fields**: **import N/A** — pure computed overview.

**Behaviors to preserve verbatim**
- **Role switch**: super-admin → `AdminDashboardView` (dynamic import, `ssr:false`). Critical hook-count note in code: the split exists so hook counts don't differ between renders (user loads async) — do NOT inline-branch with hooks.
- Date-range filter wiring (Issue #56: range piped into recent-bookings so "Today" narrows the tile).
- `Promise.allSettled` resilient fetch — partial failures toast the failed tile names, don't blank the page.
- PKR currency via `Intl.NumberFormat('en-PK', { currency: 'PKR' })`.
- Status badge tone map (confirmed=emerald, pending=amber, cancelled=red, completed=blue).
- Flags: `NEXT_PUBLIC_ACTION_CENTER` (NeedsAttentionStrip).

**Migration risk**: HIGHEST surface-area page; many sections each with their own fetch + skeleton + Recharts. The role-switch hook-count constraint is a real footgun — keep `DashboardView` as a thin hook-free switcher. Recharts components need theme-token wiring for the user-switchable themes (chart `fill` colors are currently hard-coded in the status-distribution data). The two bespoke tables are candidates for DataTable migration but are tightly coupled to the overview layout.

---

## Cross-cluster notes for the redesign plan

- **Export pattern to standardize on**: `lib/utils/csv-export` → `exportTableToCSV(table, name)`, already used by reviews. Wire the same into automation custom-rules and any insights sub-report that gains an export. For computed/overview surfaces, an export is "render → CSV/PDF of the displayed aggregate", not a model round-trip.
- **Import makes sense in only 2 domains**: automation (custom rules) and reviews (historical back-fill, gated). insights, promote, onboarding, dashboard are **import N/A**.
- **Only reviews is on the shared tanstack DataTable.** Everything else is card/section based. The redesign's "DataTable everywhere" goal applies cleanly to automation custom-rules and (optionally) promote-request-history; the computed dashboards (insights, dashboard, onboarding) should stay card/section with restyled shells, not be forced into tables.
- **Money handling is uniform**: PKR via `toLocaleString('en-PK')` / `Intl.NumberFormat('en-PK', currency:'PKR')`. Preserve exactly.
- **Flags in play**: `NEXT_PUBLIC_AUTOMATION_BUILDER`, `NEXT_PUBLIC_PROMOTIONS`, `NEXT_PUBLIC_IMPORT`, `NEXT_PUBLIC_BOOKING_IMPORT`, `NEXT_PUBLIC_ACTION_CENTER`. Live-system rule: keep every redesign additive + flag-gated.
- **Bespoke "do-not-flatten" UI**: reputation share-card canvas PNG, AI review summary, automation-stats dismiss flow, automation 3-state ops kill-switch, dashboard role-switch + Recharts, insights heatmap/funnel.
