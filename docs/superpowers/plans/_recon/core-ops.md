# Recon — Core Ops Cluster (bookings · leads · calendar · today · customers)

Ground-truth audit for the visual-redesign plan. Every fact below is cited to a file path. Paths are relative to the frontend root `C:/Projects/Event Management Systen/ems-v0` unless prefixed with `BE:` (backend root `C:/Projects/Event Management Systen/event-planner-api`).

Shared infrastructure observed:
- Real tables use `components/dashboard/globalComponents/globalTable/global-table.tsx` (`GlobalTable`) + `use-data-table.tsx` (tanstack) + tanstack `ColumnDef[]` in a `columns.tsx`.
- Generic CSV export helper: `lib/utils/csv-export.ts` → `exportTableToCSV(table, filename)` (exports the **current page's** tanstack rows only).
- Money convention everywhere: PKR, formatted `Rs. {n.toLocaleString('en-PK')}`; CSV export prepends a UTF-8 BOM for Excel/Urdu.

---

## DOMAIN: bookings

### 1. Main view + sub-listing components
- List/view entry: `components/dashboard/mainScreens/bookings/bookingListing/booking-listing-view.tsx` (heading craft-localized via `lib/vendor-type-config.ts`; URL-driven `?view=table|pipeline` and `?bucket=active|completed`).
- Table: `components/dashboard/mainScreens/bookings/bookingListing/components/booking-table.tsx` (real tanstack `GlobalTable`).
- Columns: `.../components/columns.tsx`.
- Kanban alt-view: `components/dashboard/mainScreens/bookings/pipeline/pipeline-view.tsx`.
- Detail page view: `.../bookingListing/booking-detail-view.tsx`.

### 2. lib/api module + key functions
- Primary: data fetched via `hooks/use-fetch-data.ts` against raw endpoint `GET /api/v1/bookings` (vendor) or `/api/v1/bookings/admin/bookings` (admin); list response shape `{ data: { data: BookingData[], filters: { total } } }`.
- Class module: `lib/api/bookings.ts` (`BookingAPI`) — installments (`getInstallments`), change-requests (`getChangeRequests`/`createChangeRequest`/`approve`/`decline`/`cancel`/`initiateTopUp`), `getDispute`/`openDispute`, `postpone`, `openNoShowReport`, `getHistory`, `getWithAvailability`.
- Bulk import lives in `lib/api/dashboard.ts` (`BookingsAPI.bulkImport`, `BusinessesAPI.getUserBusinesses`). Mutations also issued inline via `axiosInstance` in `row-actions.tsx` (cancel `PATCH /:id/cancel` + `DELETE /:id/cancel-pending`, complete `PATCH /:id {status}`).

### 3. Backend router + controller (exists?)
- YES. Router `BE:src/routes/bookingRouter.js`; controller `BE:src/controllers/bookingController.js`. Bulk import route confirmed: `POST /bulk-import` → `bookingController.bulkImportBookings` (rate-limited 3/60min).

### 4. Bulk IMPORT / EXPORT present?
- IMPORT: **present** — `components/dashboard/mainScreens/bookings/import-bookings-dialog.tsx` (flag-gated `NEXT_PUBLIC_BOOKING_IMPORT=1`; dry-run, column-map, single bulk POST).
- EXPORT: **present** (two paths): full server-paginated CSV `components/dashboard/mainScreens/bookings/export-bookings-button.tsx` (paginates `/api/v1/bookings`, soft-cap 5,000, honours bucket); plus a page-only `exportTableToCSV` button inside `.../components/booking-table-actions.tsx`.

### 5. Interactive elements to preserve
- Header buttons: **Import history** (flag), **Export CSV**, view toggle **Table / Pipeline**, bucket toggle **Active / Archive**.
- Table actions toolbar (`booking-table-actions.tsx`): search, **Add Booking**, **Export**, column-view popover.
- Row actions menu (`row-actions.tsx`, icon-only `MoreHorizontal` trigger): **Quick view**, **Open detail page**, **Edit Booking**, **Record Payment**, **Record refund**, **Mark as Completed**, **Cancel Booking** (each gated by status/payment — see §9).
- Dialogs/sheets: `booking-detail-sheet.tsx`, `edit-booking-dialog.tsx`, `record-payment-dialog.tsx`, `record-refund-dialog.tsx`, `offline-booking-dialog.tsx`, cancel `AlertDialog`. Filters: `booking-table-filters.tsx`. Special UI: `event-weather-chip.tsx`, **pipeline kanban** (`pipeline/pipeline-view.tsx`).

### 6. Table or cards?
- **Real table** (tanstack `GlobalTable`). Pipeline view is a kanban (cards-in-columns). DataTable migration applies to the table path.

### Bulk I/O
- **Export columns** (from `export-bookings-button.tsx` HEADERS): Booking ID, Customer Name, Phone, Email, Event Date, Event Time, Status, Payment Status, Total Amount (Rs), Down Payment (Rs), Guest Count, Event City, Source, Notes, Created At.
- **Import field schema** (from `import-bookings-dialog.tsx` + bulk endpoint):
  | field | required | type |
  |---|---|---|
  | businessId (batch-level picker, not per-row) | yes | int |
  | customerName | yes | string |
  | customerPhone | yes | string |
  | bookingDate | yes | date (YYYY-MM-DD) |
  | totalAmount | yes | number (Rs) |
  | customerEmail | no | email |
  | bookingTime | no | time (HH:MM) |
  | downPayment | no | number (Rs) |
  | paymentStatus | no | enum (Paid/Partial/Pending) |
  | guestCount | no | int |
  | eventCity | no | string |
  | notes | no | string |
  - Importable: **yes**. Max 200 rows/batch; dry-run default ON.

### 9. Behaviors to preserve verbatim
- Status state machine (`columns.tsx` statusColors / `row-actions.tsx` gates): statuses = **Awaiting Payment, Pending, Confirmed, Completed, Cancelled**; payment = **Pending, Partial, Paid**. Action gates: `canEdit` = (Confirmed|Pending|Awaiting Payment) AND paymentStatus≠Paid; `canCancel` = Pending|Confirmed|Awaiting Payment; `canRecordPayment` = paymentStatus≠Paid AND status∉{Cancelled,Awaiting Payment}; `canRefund` = paymentStatus∈{Partial,Paid} AND status≠Cancelled; `canComplete` = Confirmed AND Paid. Awaiting-Payment cancels hit `/cancel-pending`, all others `/cancel`.
- Money: vendor-scoped totals computed by summing `bookingDetails[].totalAmount`/`downPayment`, falling back to top-level `totalAmount`/`downPayment`; Paid/Due derived from paymentStatus. Keep PKR + en-PK formatting.
- Bucket semantics: `active` hides Completed+Cancelled; `completed` = archive.
- Imported bookings forced to status=Completed, paymentStatus=Paid (default), bookingSource=offline; bypass past-date/lead-time checks; write installments.
- Craft-aware labels: heading + empty-state noun localized ("Shoots"/"Fittings") via `getVendorTypeConfig(...).navLabels.Bookings`.
- react-query invalidation matches any queryKey[0] containing `/bookings` — keep if reworking data layer.

### 10. Migration risk notes
- Two parallel export mechanisms (page-only vs server-paginated) — unify carefully; the toolbar `Export` only dumps the current page.
- Source-of-truth for the booking total is nested (`bookingDetails[]`), not the flat `totalAmount`; any new cell renderer must replicate the sum-with-fallback logic or money will display wrong.
- Online vs offline distinction drives drag-drop reschedule eligibility on the calendar (see calendar §9); the redesign must keep `bookingSource` visible/available.
- Pipeline kanban is a wholly separate layout; redesign needs a DataTable skin AND a kanban skin.

---

## DOMAIN: leads

### 1. Main view + sub-listing
- Entry/toggle: `components/dashboard/mainScreens/leads/leads-view.tsx` (`?view=inbox|pipeline`).
- Inbox (default): `components/dashboard/mainScreens/leads/leads-inbox-view.tsx` — **card list**, funnel pills, source chips, search, bulk bar, all dialogs inline.
- Pipeline kanban: `components/dashboard/mainScreens/leads/leads-pipeline-view.tsx`.

### 2. lib/api module + key functions
- `lib/api/leads.ts` (`LeadAPI`): `list`, `get`, `create`, `update` (content only), `transition` (status), `linkBooking`, `bulkTransition`, `bulkDelete`, `sendWhatsapp`, `remove` (soft delete), `conversionAnalytics`. Also exports label/tone maps (`LEAD_STATUS_LABELS`, `LEAD_SOURCE_LABELS`, `LEAD_EVENT_TYPE_LABELS`, `LEAD_STATUS_TONES`).

### 3. Backend router + controller (exists?)
- YES. Router `BE:src/routes/leadRouter.js`; controller `BE:src/controllers/leadController.js`. BE state machine reference: `BE:src/utils/leadHelpers.js`.

### 4. Bulk IMPORT / EXPORT present?
- IMPORT: **absent** (no `import-leads-dialog.tsx`).
- EXPORT: **absent** (no export button / csv usage; conversion analytics is on-screen only).
- Note: `bulkTransition` + `bulkDelete` exist (write-side bulk), but no CSV in/out.

### 5. Interactive elements to preserve
- Header: **Log a lead** button; **Inbox / Pipeline** toggle.
- Collapsible **Conversion analytics** card (per-source funnel + revenue, "top channel" badge).
- Funnel **status pills** (7, clickable filters), **source filter chips**, search input.
- Bulk bar (`BulkActionsBar`): select-all, **Move to…** select + **Apply**, **Delete**, **Cancel**.
- Per-card (`LeadCard`): dynamic **status transition** buttons (next-state), **Convert to booking** (qualified/quoted only), **WhatsApp**, **Remove**, `LinkedFunctionSheetBadge`.
- Dialogs: **Send WhatsApp** (`Dialog`, with `AiSuggestButton` "AI draft reply"), **convert-to-booking** (reuses `offline-booking-dialog.tsx`), **delete confirm** (`AlertDialog`), **Add lead** (`AddLeadDialog`, vendor-type-adaptive labels).

### 6. Table or cards?
- **Card list** (not a tanstack table). Migration is card→card restyle (or optional DataTable adoption) — NOT a table-skin swap.

### Bulk I/O
- **Recommended export columns** (from `Lead` interface in `lib/api/leads.ts`): id, businessId/business.name, source, status, contactName, contactPhone, contactWhatsapp, contactEmail, eventType, eventDate, estimatedGuests, estimatedBudget, inquiry, notes, assignedTo.fullName, bookingId, respondedAt, lastActivityAt, createdAt.
- **Recommended import field schema** (mirror `CreateLeadInput` / `createSchema`):
  | field | required | type |
  |---|---|---|
  | businessId (batch picker) | yes | int |
  | source | yes | enum (whatsapp/form_inquiry/manual_phone/manual_walkin/other) |
  | contactPhone | yes | string (phone, regex `/^[+\d\s\-().]{4,30}$/`) |
  | contactName | no | string |
  | contactWhatsapp | no | string |
  | contactEmail | no | email |
  | eventType | no | enum (mehndi/nikah/baraat/walima/engagement/dholki/other) |
  | eventDate | no | date |
  | estimatedGuests | no | int |
  | estimatedBudget | no | number (PKR) |
  | inquiry | no | string |
  | notes | no | string |
  - Importable: **yes** (create endpoint exists; would need a new bulk route or per-row loop). At least one of name/phone/WhatsApp/email required; phone effectively required.

### 9. Behaviors to preserve verbatim
- Status state machine (`NEXT_STATUS` in `leads-inbox-view.tsx`, mirror of `BE:leadHelpers.js`): new→[contacted,qualified,lost,archived]; contacted→[qualified,quoted,lost,archived]; qualified→[new,contacted,quoted,lost,archived]; quoted→[contacted,qualified,booked,lost,archived]; booked/lost/archived = terminal. Status writes MUST route through `/transition` (server-enforced), never raw PATCH.
- Convert-to-booking: `linkBooking` sets `bookingId` + status=booked atomically; surfaced only for qualified/quoted not-yet-linked.
- Delete = soft-delete (recoverable; audit retained).
- WhatsApp send is best-effort; `provider==='noop'` ⇒ logged-only, show amber warning banner.
- Validation: phone regex above; email regex; budget ≤ 500,000,000; guests ≤ 100,000.
- Vendor-type-adaptive Add-Lead labels (`LEAD_VENDOR_LABELS`): e.g. Photographer hides guests + relabels "Shoot date".
- Money: `fmtPKR` → `Rs. …` en-PK; conversion rate = booked/total ×100.

### 10. Migration risk notes
- Heavy single-file component (~1,600 lines) with many inline sub-components (`BulkActionsBar`, `LeadCard`, `AddLeadDialog`) — restyle must not fracture state wiring.
- Bridal-gold hard-coded utility classes (`accent-bridal-gold-dark`, `ring-bridal-gold/40`, `bg-bridal-gold`) — these are the theme hooks to re-route for user-switchable themes.
- Status tone maps are duplicated as Tailwind class strings (`LEAD_STATUS_TONES`); theming needs these tokenized.

---

## DOMAIN: calendar

### 1. Main view + sub-components
- Entry: `components/dashboard/mainScreens/calendar/calendar-view.tsx` (thin shell: Heading + `MainCalendar` + `CalendarFeedCard`).
- Orchestrator: `components/dashboard/mainScreens/calendar/components/main-calendar.tsx`.
- Sub-views: `month-view.tsx`, `week-calendar.tsx`, `day-view.tsx`, `agenda-view.tsx`, `toolbar.tsx`, `islamic-events-strip.tsx`, `add-booking-dialog.tsx`, `block-date-dialog.tsx`, `availability-drawer.tsx`.

### 2. lib/api module + key functions
- No single dedicated module; pulls from several:
  - Bookings: inline `GET /api/v1/bookings`; reschedule `POST /api/v1/bookings/:id/vendor-reschedule`.
  - Blocked dates: `lib/api/dashboard.ts` (`BlockedDatesAPI.getAll/block/unblock`).
  - Availability/slots/recurring blocks: `lib/api/businessAvailability.ts` (`BusinessAvailabilityAPI.getBulkAvailability/listRecurringBlocks/createRecurringBlock/deleteRecurringBlock/setVacationMode/setCompliance`; plus `SlotTemplatesAPI`, `CapacityOverridesAPI`).
  - Team overlay (agenda): `lib/api/staff.ts` (`StaffAPI.teamCalendar`).

### 3. Backend router + controller (exists?)
- YES (composite). Bookings `BE:src/routes/bookingRouter.js`. Availability/slots/recurring-blocks `BE:src/routes/vendorSlotRouter.js` + `BE:src/controllers/vendorSlotController.js`. iCal feed `BE:src/routes/calendarFeedRouter.js` + `BE:src/controllers/calendarFeedController.js`. Blocked dates handled within business/booking routers.

### 4. Bulk IMPORT / EXPORT present?
- IMPORT: **absent** (calendar consumes bookings; bookings have their own importer).
- EXPORT: **partial / non-CSV** — `CalendarFeedCard` exposes an iCal/ICS subscription feed (`BE:calendarFeedRouter.js`). No CSV export of calendar.

### 5. Interactive elements to preserve
- Toolbar: prev/next/today nav, **Month/Week/Day/Agenda** mode switch, per-business slot picker (`<Building2>` select, multi-business only).
- Cell interactions: click → add-booking / event dialog (`onOpenCellDialog`), right-click/long-press → block-date toggle, drag-drop reschedule (flag `NEXT_PUBLIC_CALENDAR_DND=1`, offline bookings only).
- `IslamicEventsStrip`: upcoming Hijri events with 1-click block.
- Per-cell slot-availability chips ("Lunch 2/3 · Dinner 1/3"), blocked + recurring-blocked overlays with tooltips.
- Dialogs: `AddBookingDialog`, `OfflineBookingDialog` (date-prefilled), `BlockDateDialog`, `availability-drawer.tsx`.
- `CalendarFeedCard` (iCal subscription).

### 6. Table or cards?
- **Neither** — bespoke **calendar grid** (month/week/day) + **agenda list**. Special UI; not a DataTable candidate. Agenda view is the closest to a list.

### Bulk I/O
- **import N/A** for the calendar surface itself (it is a visualization over bookings + availability; bookings import covers data ingest).
- Export = iCal feed only (keep). No CSV schema recommended.
- Importable: **no** (read/visualize + availability-management surface).

### 9. Behaviors to preserve verbatim
- Drag-drop reschedule restricted to `bookingSource==='offline'`; online bookings toast "reschedule via customer / change request" (never call vendor-reschedule for them).
- `weekdayMask` convention Mon=1…Sun=64 (`WEEKDAY_BITS`); recurring-block materialization probes at noon-local to dodge UTC drift.
- Bulk availability backend caps at 60 days; auto-picks first business with active slot templates.
- Blocked-date block returns full refreshed month list (adopt as state for instant affordance).
- Asia/Karachi timezone semantics for availability.

### 10. Migration risk notes
- Largest behavioral surface; four distinct sub-view layouts each need re-skinning consistently.
- Many silent-fail effects (per-business loops) — restyle must not alter the resilient catch/{} patterns.
- Date math + UTC-drift workarounds are fragile; do not "tidy" the noon-probe logic.
- Hard-coded `bridal-*` and tone classes appear across sub-views; theming touches many files.

---

## DOMAIN: today

### 1. Main view + sub-components
- Single file: `components/dashboard/mainScreens/today/today-view.tsx` (contains `TodayView`, `EventCard`, `AddTaskDialog`, `SeedTemplateDialog` inline). **Card list of events, each embedding a grouped task ledger.**

### 2. lib/api module + key functions
- `lib/api/bookingTimeline.ts` (`BookingTimelineAPI`): `today` (GET `/timeline-tasks/today`), `list`, `create`, `seedFromTemplate`, `update`, `setStatus`, `remove` (soft delete). Also `TeamMembersAPI.list` (assignee dropdown), label/tone maps (`CATEGORY_LABELS`, `CATEGORY_TONES`, `STATUS_LABELS`, `TIMELINE_EVENT_KIND_LABELS`).

### 3. Backend router + controller (exists?)
- YES. Router `BE:src/routes/bookingTimelineRouter.js`; controller `BE:src/controllers/bookingTimelineController.js`. Endpoints: by-booking `/api/v1/bookings/:bookingId/timeline(+/from-template)` and per-task `/api/v1/timeline-tasks/:id(+/status)` + `/timeline-tasks/today`.

### 4. Bulk IMPORT / EXPORT present?
- IMPORT: **absent**.
- EXPORT: **absent**.

### 5. Interactive elements to preserve
- Header: today's date (Asia/Karachi) + active-event count.
- Per `EventCard`: customer name/phone (`tel:` link), booking time/venue/amount, progress counter, **Seed template** (empty only), **Add task**.
- Per task row: status **toggle button** (icon-only, cycles pending→in_progress→done), **Mark skipped** (icon), **Edit** (icon), **Delete** (icon); status pills.
- Dialogs: `AddTaskDialog` (label/category/time/duration/assignee/notes; assignee = team Select or free-text), `SeedTemplateDialog` (event-kind + anchor time), delete `AlertDialog`.

### 6. Table or cards?
- **Card list** (events) containing grouped task rows (Setup/Event/Teardown). Not a tanstack table.

### Bulk I/O
- **import N/A** (computed/day-of operational view, derived from bookings + their timelines).
- Importable: **no** (read-of-today + per-task CRUD; not a bulk-ingest domain). Tasks are seeded from templates, not CSV.

### 9. Behaviors to preserve verbatim
- Task status cycle on tap: pending→in_progress→done→pending (`skipped` only via explicit secondary action).
- Done tasks hide Edit + Delete (audit trail); skipped tasks dim to 60% opacity.
- Soft-delete only (row kept for audit).
- 44px-minimum tap targets, mobile-first (floor-manager-on-phone use case) — explicitly required.
- Categories fixed: setup / event / teardown. Event kinds craft-specific (mehndi/nikah/baraat/walima/engagement/dholki/generic) with Pakistani-wedding templates.
- Money `fmtPKR` en-PK; time normalized to HH:MM.

### 10. Migration risk notes
- Deeply nested status-color logic per row (bg + border + pill + strikethrough); theming must token all four.
- Mobile-first / large-tap-target requirement is load-bearing — redesign cannot shrink controls.
- Dynamic `import('@/lib/api/teamMembers')` for the assignee dropdown — keep lazy boundary.

---

## DOMAIN: customers

### 1. Main view + sub-listing
- Entry: `components/dashboard/mainScreens/customers/customersListing/customers-view.tsx`.
- Table: `.../components/customers-table.tsx` (real tanstack `GlobalTable`; fetches up to 100 client-side, paginates locally).
- Columns: `.../components/columns.tsx`. Detail page: `components/dashboard/mainScreens/customers/customer-detail-view.tsx` (Customer 360 + `customer-timeline.tsx`, `customer-trust-card.tsx`, `community-trust-panel.tsx`).

### 2. lib/api module + key functions
- `lib/api/dashboard.ts` (`CustomersAPI.getAll(page, limit)` → `{ customers }`). Create offline customer via inline `axiosInstance.post('/api/v1/offlineCustomers', {name,phoneno,email,address})` in `creations-buttons.tsx`. Rating: `rate-customer-dialog.tsx`.

### 3. Backend router + controller (exists?)
- YES. Router `BE:src/routes/offlinecustomerRouter.js`; controller `BE:src/controllers/offlineCustomrController.js` (note misspelled filename "Customr"). Create requires `req.user.isVendor`; requires name+phoneno+address.

### 4. Bulk IMPORT / EXPORT present?
- IMPORT: **present** — `.../components/import-customers-dialog.tsx` (flag-gated `NEXT_PUBLIC_IMPORT=1`; per-row loop POST `/offlineCustomers`, dedupe via "exist" message → counted as skipped).
- EXPORT: **present** (two, both page-scoped DOM/table scrapes): a DOM-table-scraping button in `creations-buttons.tsx`, plus `exportTableToCSV` in `.../components/customers-table-actions.tsx`. **No server-paginated export** (unlike bookings).

### 5. Interactive elements to preserve
- Header `CreationsButtons`: **Export** (DOM scrape), **Import** (flag), **Add New** (offline-customer dialog).
- Table actions (`customers-table-actions.tsx`): name search input, **Export**, column-view popover.
- Row actions (`row-actions.tsx`): **View** (opens `ViewCustomerDialog`) + name links to Customer 360 (`/dashboard/customers/[id]`).
- Dialogs: **Add Offline Customer** (name/phone/email/address), `ImportCustomersDialog`, `ViewCustomerDialog`, `rate-customer-dialog.tsx`.

### 6. Table or cards?
- **Real table** (tanstack `GlobalTable`). Clean DataTable migration candidate.

### Bulk I/O
- **Export columns** (from `creations-buttons.tsx` headers + `CustomersType`/columns): Name, Phone, Email, Address. Table also surfaces: Total Bookings (`total_booking`), Last Booking (`last_booking`). Recommend export = Name, Phone, Email, Address, Total Bookings, Last Booking.
- **Import field schema** (from `import-customers-dialog.tsx` + create endpoint):
  | field | required | type |
  |---|---|---|
  | name | yes | string |
  | phoneno | yes | string (phone) |
  | email | no | email |
  | address | no* | string (BE requires non-empty; importer defaults to "—") |
  - Importable: **yes** (per-row POST `/offlineCustomers`; dedupe is server-side on phone).

### 9. Behaviors to preserve verbatim
- Dedupe: server enforces uniqueness on normalized phone (`offlineCustomrController.js` line ~459 normalizes `phoneno` via `regexp_replace`+right-10 match); importer treats "exist" error as **skipped** (not failed). Keep this skip-vs-fail distinction in import summary.
- Create requires name + phoneno + address (address importer-defaults to "—" when unmapped); vendor-only.
- Customer `_id` is either the email or `offline_<N>` — both valid Customer-360 route identifiers; preserve link encoding (`encodeURIComponent`).
- Money/bookings counts: `total_booking` badge + `last_booking` date.

### 10. Migration risk notes
- Customers export is a **DOM-table scrape** (`document.querySelectorAll('table tbody tr')` slicing cells 1–5) — extremely fragile; ANY table-markup change in the redesign (DataTable swap, column reorder, virtualization) silently breaks it. Replace with a data-driven export before/while restyling.
- Two divergent export implementations + flag-gated import — consolidate.
- Client-side pagination over a 100-row fetch (no server paging) — large vendors get truncated lists; note for DataTable migration.
- Backend controller filename is misspelled (`offlineCustomrController.js`) — do not "fix" import paths blindly.
