# Recon — Admin cluster (admin/*, roles, users)

Audit date: 2026-06-26. Frontend root `C:/Projects/Event Management Systen/ems-v0`, backend root `C:/Projects/Event Management Systen/event-planner-api`. All paths below are repo-relative unless noted.

Scope note: the eight admin sub-domains do NOT live under one folder. Three (platform-pulse, promotions, subscriptions) are under `components/dashboard/mainScreens/admin/`; the other five (audit-logs, disputes, documents, force-majeure, vendor-queue) are flat in `components/admin/`. All eight are routed under `app/(dashboard)/dashboard/admin/<slug>/page.tsx`. `roles` and `users` are standard tanstack-table listings under `components/dashboard/mainScreens/`.

Shared infra observed:
- tanstack `useDataTable` + `GlobalTable` at `components/dashboard/globalComponents/globalTable/` (used by roles + users).
- CSV export util `lib/utils/csv-export.ts` → `exportTableToCSV(table, filename)` (visible+non-`select`/`actions` columns, filtered rows). Already wired into roles + users toolbars.
- Existing import-dialog pattern (NOT in this cluster, but the template to mirror): `components/dashboard/mainScreens/customers/customersListing/components/import-customers-dialog.tsx` and `components/dashboard/mainScreens/bookings/import-bookings-dialog.tsx`. Both: paste/upload CSV → column-map → preview → loop create endpoint (customers) or POST bulk endpoint (bookings). Dedupe by unique phone (customers), per-row error summary.
- Admin gate: `components/admin/AdminGuard.tsx` (`requireSuperAdmin` prop). Page chrome via `components/dashboard/layout/page-header.tsx` `<PageHeader eyebrow/title/description>` (the 5 flat admin pages) OR `<Heading>` + `<Separator>` (pulse/promotions/subscriptions/roles/users).
- Money handling: PKR, `en-PK` locale, `Rs`/`Rs.`/PKR-currency formatters, `tabular-nums`. `formatPKR`/`fmtPKR` appear per-component (force-majeure, disputes, promotions, platform-pulse) — not centralized.

---

## DOMAIN: admin / audit-logs

1. **List/view component**: `components/admin/AuditLogTable.tsx`. No sub-table component — renders a raw `<table>` inline. Page: `app/(dashboard)/dashboard/admin/audit-logs/page.tsx` (`requireSuperAdmin`, eyebrow "Super admin · Forensics", title "Audit log").
2. **lib/api module**: `lib/api/adminQueue.ts` → `listAuditLogs(filters)` (filters: `targetType, targetId, actorUserId, action, limit, offset`). Returns `{ count, logs: AuditLog[] }`. `AuditLog` = `{ id, actorUserId, targetType, targetId, action, before, after, ipHash, userAgent, at }`.
3. **Backend**: router `src/routes/adminRouter.js` `GET /api/v1/admin/audit-logs` → controller `adminVendorQueueController.listAuditLogs` (`src/controllers/adminVendorQueueController.js`). Super-admin gated.
4. **Bulk I/O present?**: Import — absent (read-only forensic log; N/A). Export — absent.
5. **Interactive elements**: Filter `Select` (Target type: ``/user/business/bank/document/session/twoFactor/draft`), `Input` (Action free-text), "Apply" button (icon `Filter`). Per-row `<details>` "View" disclosure showing `before`/`after` JSON diff. No dialogs.
6. **Table or cards?**: Real raw `<table>` (NOT tanstack). Columns: When · Actor · Action · Target · Diff.
7. **Recommended export columns**: `at` (When), `actorUserId` (Actor), `action`, `targetType`, `targetId`, `before` (JSON), `after` (JSON), `ipHash`, `userAgent`.
8. **Recommended import schema**: import N/A (immutable system-generated audit trail; never user-writable).
9. **Behaviors to preserve**: read-only; diff disclosure must keep JSON `before/after`; filters drive refetch via `useEffect([targetType, action])`. Super-admin only.
10. **Migration risk**: raw `<table>` not tanstack → if migrating to a DataTable, the JSON-diff disclosure cell needs a custom cell renderer; filtering is server-side (not column filters), so it does NOT fit the `exportTableToCSV(table,…)` helper without restructuring. Keep server-side filter params.

---

## DOMAIN: admin / disputes

1. **List/view component**: `components/admin/DisputesTable.tsx` (inline `<table>`). Resolve dialog: `components/admin/ResolveDisputeDialog.tsx`. Customer-side card reference (palette mirror): `components/bookings/dispute-card.tsx`. Page: `app/(dashboard)/dashboard/admin/disputes/page.tsx` (eyebrow "Admin · Operations").
2. **lib/api module**: `lib/api/disputes.ts` → `listAdminDisputes({status,bookingId,page,limit})` returns `{ rows, count, page, limit }`; `resolveDispute(disputeId,{resolution,notes})` returns `{ dispute, restoredPayoutCount }`. Status enum `DisputeStatus = open | resolved_refund | resolved_release | resolved_dismissed | resolved_forfeit`; resolution enum `refund | release | dismissed | forfeit`.
3. **Backend**: `src/routes/disputeRouter.js` + admin routes; controller `src/controllers/disputeController.js`. (FE calls `GET /api/v1/admin/disputes`, `POST /api/v1/admin/disputes/:id/resolve`.)
4. **Bulk I/O present?**: Import — absent (N/A, disputes are customer-opened, not admin-created). Export — absent.
5. **Interactive elements**: Status `Tabs` (Open/Resolved/All). Per-row "Resolve" button (icon `Gavel`, open rows only). Prev/Next pagination buttons (`ChevronLeft/Right`). `ResolveDisputeDialog`: 4 radio resolution options (Refund customer / Release to vendor / Dismiss / Confirm vendor no-show denial) + optional notes `Textarea` (max 1000) + Cancel/Confirm (Confirm is `destructive` variant for refund|forfeit). Reason title-tooltip on truncated reason cell.
6. **Table or cards?**: Real raw `<table>` (NOT tanstack), 20/page server-paginated. Columns: Booking · Customer · Opened · Reason · Status · Days since event · Actions.
7. **Recommended export columns**: `bookingId`, `booking.bookingDate`, `booking.totalAmount`, `booking.customerName`, `booking.customerEmail`, `openedByRole`, `openedAt`, `reason`, `status`, `resolvedAt`, resolution notes.
8. **Recommended import schema**: import N/A (disputes are an outcome of customer action; never bulk-loaded).
9. **Behaviors to preserve VERBATIM**: STATE MACHINE — `resolveDispute` semantics are load-bearing and documented in `ResolveDisputeDialog`: `release`/`dismissed` un-freeze (restore to `scheduled`) pending vendor payouts; `refund` leaves payouts frozen (admin runs `processRefund` separately); `forfeit` (BK-039) records admin-confirmed customer no-show so the refund engine refuses later customer claims. Toast surfaces `restoredPayoutCount`. Status labels/variants mirror customer `DisputeCard`. Money = `Rs` en-PK.
10. **Migration risk**: raw `<table>`; STATUS_LABEL/STATUS_VARIANT maps must survive; resolution help-text is policy copy (do not paraphrase). Confirm button variant flips by resolution — preserve.

---

## DOMAIN: admin / documents (KYC review queue)

1. **List/view component**: `components/admin/DocumentQueueTable.tsx` (card list `<ul>`, not a table). Inline action dialog inside same file. Page: `app/(dashboard)/dashboard/admin/documents/page.tsx` (eyebrow "Admin · Compliance", title "KYC document review").
2. **lib/api module**: `lib/api/adminQueue.ts` → `listDocumentQueue(status,limit,offset)` → `{ count, documents: VendorDocument[] }`; `approveDocument(id,notes?)`, `rejectDocument(id,notes?)`, `requestChangesDocument(id,notes)`. Types + labels from `lib/api/vendorDocuments.ts` (`VendorDocumentType`, `DOCUMENT_TYPE_LABELS`, `DOCUMENT_STATUS_LABELS`).
3. **Backend**: `src/routes/adminRouter.js` `GET /api/v1/admin/documents`, `POST /documents/:id/{approve,reject,request-changes}` → `adminVendorQueueController` (`approveDocument` etc.); validators `vendorDocumentValidator.reviewDocumentValidations`. Vendor-side upload router `src/routes/vendorDocumentRouter.js` + `vendorDocumentController.js`.
4. **Bulk I/O present?**: Import — absent (N/A; documents are file uploads with hashes, not CSV-importable). Export — absent.
5. **Interactive elements**: Status `Tabs` (Pending review/Approved/Rejected/Changes requested). Per-row: `KycStatusPill`, "View file" external link (`ExternalLink`), and on pending rows three buttons Approve (`CheckCircle2`)/Changes (`MessageSquareWarning`)/Reject (`XCircle`, destructive). Confirmation `Dialog` with notes `Textarea` (notes REQUIRED for request_changes). 
6. **Table or cards?**: **Card list** (`<ul><li>` rows). Candidate for DataTable migration or keep as cards.
7. **Recommended export columns**: `id`, `businessId`, `type` (via DOCUMENT_TYPE_LABELS), `status`, `createdAt` (submitted), `reviewedAt`, `reviewerUserId`, `reviewerNotes`, `fileUrl`, `fileHash`.
8. **Recommended import schema**: import N/A (file + hash artifacts; reviewed not created in bulk).
9. **Behaviors to preserve**: state machine `pending → approved | rejected | request_changes`; request_changes REQUIRES a note (client-validated). Approving bumps vendor verification tier (server). `fileUrl` resolution: relative URL prefixed with `BACKEND_URL`. Notes recorded in audit log.
10. **Migration risk**: card→table conversion loses the inline file-preview affordance unless preserved; `KycStatusPill` and DOCUMENT_*_LABELS are craft-aware (CNIC/NTN/halal_cert) — keep.

---

## DOMAIN: admin / force-majeure (batch-cancel)

1. **List/view component**: `components/admin/ForceMajeureForm.tsx` (NOT a list — a wizard/form with dry-run → commit). Page: `app/(dashboard)/dashboard/admin/force-majeure/page.tsx` (`requireSuperAdmin`, `width="narrow"`, eyebrow "Super admin · Emergency").
2. **lib/api module**: `lib/api/forceMajeure.ts` → `ForceMajeureAPI.run({bookingDateFrom,bookingDateTo,reason,dryRun})`. Returns union `ForceMajeureDryRunResult { dryRun:true, count, sampleIds[] }` | `ForceMajeureCommitResult { dryRun:false, total, succeeded, failed, skipped, totalRefunded, results[] }`.
3. **Backend**: `src/routes/adminRouter.js` `POST /api/v1/admin/force-majeure-cancel` → `src/controllers/forceMajeureController.js` `runBatch`. Super-admin gated.
4. **Bulk I/O present?**: Import — absent / N/A (this IS a bulk mutation tool, not data ingestion). Export — absent (commit result table could be exported but currently not).
5. **Interactive elements**: Date `Input`s From/To, Reason `Textarea` (max 500, ≥5 chars). "Preview affected bookings" button (`Search`, runs dry-run). "Commit batch" button (`AlertTriangle`, destructive, disabled until preview returns count>0). Dry-run preview `Card` (count + sample IDs). Commit result `Card` (Cancelled/Skipped/Failed/Refunded tiles + failed-details `<details>`). `AlertDialog` confirm-commit (echoes affected count, "Yes, cancel N bookings"). High-stakes warning banner Card.
6. **Table or cards?**: Neither — a stateful form/wizard with result cards. (Special UI: dry-run → confirm → commit wizard.)
7. **Recommended export columns**: N/A for a form. If exporting commit results: `bookingId`, `ok`, `code`, `error`, `skipped`, `totalRefunded`.
8. **Recommended import schema**: import N/A.
9. **Behaviors to preserve VERBATIM**: VALIDATION — both dates required, From ≤ To, reason ≥5 chars (audit trail). MANDATORY dry-run before commit (UX contract). 100% refund overrides per-vendor cancellation policy + retains ZERO platform fee; claws back completed vendor payouts; audit-logs every action; dispatches customer+vendor notifications via outbox. Confirm AlertDialog cannot be skipped. Money en-PK PKR with lakh shorthand. "cannot be undone in bulk" copy.
10. **Migration risk**: This is the highest-stakes screen in the cluster. The two-shape API union, the disabled-until-preview gating, and the AlertDialog must all survive a restyle. Do not collapse dry-run/commit into one click. Amber/emerald/red status cards are semantic, not decorative.

---

## DOMAIN: admin / platform-pulse

1. **List/view component**: `components/dashboard/mainScreens/admin/platform-pulse-view.tsx` (default export `PlatformPulseView`). Page: `app/(dashboard)/dashboard/admin/platform-pulse/page.tsx` (`<Heading>` "Platform pulse").
2. **lib/api module**: NONE — calls `axiosInstance.get('/api/v1/admin/platform-pulse')` directly (no dedicated lib/api module). Response shape `Pulse` (vendors/bookings/moneyIn/functionSheets/compliance, `generatedAt`).
3. **Backend**: `src/routes/adminRouter.js` `GET /api/v1/admin/platform-pulse` → `src/controllers/platformPulseController.js` `getPlatformPulse`. Super-admin gated. (Related: `platformStatController.js`/`platformStatRoute.js`.)
4. **Bulk I/O present?**: Import — N/A. Export — absent.
5. **Interactive elements**: single "Refresh" button (`RefreshCw`/`Loader2`). No dialogs, no rows. Six metric `Section` cards (Vendors, Bookings, Money in, Function sheets, Compliance gaps) each with `Row` key/value badges (tone good/bad/warn).
6. **Table or cards?**: **Cards / metric grid** (read-only dashboard). NOT a list.
7. **Recommended export columns**: N/A (computed snapshot). If a "download snapshot" is desired: flatten `generatedAt` + each metric path to a 2-col key/value CSV.
8. **Recommended import schema**: **import N/A** (read-only computed platform metrics).
9. **Behaviors to preserve**: poll-on-mount + manual refresh; tone thresholds (e.g. openDisputes>0 → bad, cancelled7d>0 → warn); PKR lakh formatter `fmtPKR` (≥100000 → "Rs. X.XL"). functionSheets is a dynamic `Record<state,count>` (unknown keys).
10. **Migration risk**: low; pure presentational. Tone color semantics are meaningful (theme switching must keep good/bad/warn legible in all themes). No API module to retarget — direct axios call.

---

## DOMAIN: admin / promotions (featured-listing review queue)

1. **List/view component**: `components/dashboard/mainScreens/admin/promotions/admin-promotions-view.tsx` (default export `AdminPromotionsView`). Page: `app/(dashboard)/dashboard/admin/promotions/page.tsx` (`<Heading>` "Promotions").
2. **lib/api module**: `lib/api/promotions.ts` → `PromotionsAPI.queue(status)`, `.approve(id, startsAt?)`, `.reject(id, reason)` (admin); plus vendor-side `.getPricing/.listMine/.create`. Row type `PromotionRequestRow` (placement/windowDays/priceQuoted/status/note/business/requestedBy). `PLACEMENT_LABEL` map. Status `pending|approved|rejected|expired|cancelled`.
3. **Backend**: `src/routes/promotionRouter.js` → `src/controllers/promotionController.js`. Admin endpoints `GET /api/v1/promotions/admin/queue`, `POST /promotions/admin/:id/approve`, `/reject`.
4. **Bulk I/O present?**: Import — absent (N/A; requests are vendor-initiated). Export — absent.
5. **Interactive elements**: Status `Select` filter (Pending/Approved/Approved/Rejected/All). Per pending-row: Approve button (`Check`), Reject button (`X`) which reveals inline reject-reason `Input` + "Confirm reject" button. No modal dialog — inline expand pattern. Megaphone header icon. Shows quality signals (city, rating★, requester).
6. **Table or cards?**: **Card list** (`<div>` rows). Candidate for DataTable migration.
7. **Recommended export columns**: `id`, `businessId`, `business.name`, `placement` (via PLACEMENT_LABEL), `windowDays`, `priceQuoted`, `status`, `business.city`, `business.rating`, `requestedBy.fullName/email`, `createdAt`, `startsAt`, `endsAt`, `rejectionReason`, `note`.
8. **Recommended import schema**: import N/A (admin reviews, does not bulk-create promotion requests). If ever needed it would mirror vendor `PromotionsAPI.create`: `{businessId:int req, placement:enum req, windowDays:int req, note:string opt}`.
9. **Behaviors to preserve**: approve flips business `sponsored` for the window (sets `endsAt`); reject reason is sent to vendor as notification (and required to be meaningful). Status tone map. Pricing is indicative/placeholder. PKR rounding.
10. **Migration risk**: inline reject-reason expand (not a dialog) — if migrating to a table, must rehome the reason input into a row-action dialog. Placement labels craft-aware (homepage/category/city/search).

---

## DOMAIN: admin / subscriptions (plan-upgrade queue)

1. **List/view component**: `components/dashboard/mainScreens/admin/subscriptions/admin-subscriptions-view.tsx` (default export `AdminSubscriptionsView`). Page: `app/(dashboard)/dashboard/admin/subscriptions/page.tsx` (`<Heading>` "Plan upgrades").
2. **lib/api module**: `lib/api/subscription.ts` → `SubscriptionAPI.listUpgradeRequests()`, `.activate(userId, months?)`, `.decline(userId, reason?)` (admin); plus `.getMyPlan/.requestUpgrade` (vendor). Row type `UpgradeRequestRow` (`subscriptionTier`, `pendingUpgradeTier`, vendor identity). Tiers `free|pro|premium` labelled `Khata Lite|Business|Growth` (`TIER_LABEL`).
3. **Backend**: `src/routes/subscriptionRouter.js` → `src/controllers/subscriptionController.js`. Admin endpoints `GET /api/v1/subscriptions/admin/upgrade-requests`, `POST /subscriptions/admin/:userId/activate`, `/decline`.
4. **Bulk I/O present?**: Import — absent (N/A). Export — absent.
5. **Interactive elements**: Per-row Activate button (`Check`), Decline button (`X`) revealing inline reason `Input` + "Confirm". CreditCard header icon. No modal dialog — inline expand. Tier→tier badge transition display.
6. **Table or cards?**: **Card list** (`<div>` rows). Candidate for DataTable migration.
7. **Recommended export columns**: `id` (userId), `fullName`, `email`, `phoneNumber`, `vendorType`, `subscriptionTier` (current), `pendingUpgradeTier` (requested), `upgradeRequestedAt`.
8. **Recommended import schema**: import N/A (offline settlement, human-actioned; no bulk activation).
9. **Behaviors to preserve VERBATIM**: OFFLINE settlement model — "confirm payment offline, then activate" (no card flow). Activate sets tier + notifies vendor; decline clears pending + notifies with reason. Craft tier labels (Khata Lite/Business/Growth) must map exactly to free/pro/premium enum.
10. **Migration risk**: inline reason expand (not dialog) same as promotions. Tier label localization is brand copy. `activate(userId, months?)` — months param exists but UI never passes it; preserve API signature.

---

## DOMAIN: roles

1. **List/view component**: `components/dashboard/mainScreens/roles/rolesListing/roles-listing-view.tsx` → table `components/dashboard/mainScreens/roles/rolesListing/components/roles-table.tsx`. Columns `.../components/columns.tsx`; toolbar `.../components/roles-table-actions.tsx`; row menu `.../components/row-actions.tsx`. Page: `app/(dashboard)/dashboard/.../roles` view.
2. **lib/api module**: `lib/api/dashboard.ts` → `RolesAPI` → `.getAll()`, `.getById(id)`, `.create({name,description?,type?})`, `.update(id,{name?,description?,type?})`, `.delete(id)`. Endpoints `GET/POST/PATCH /api/v1/roles`, `DELETE /api/v1/roles?roleId=`.
3. **Backend**: `src/routes/roleRouter.js` → `src/controllers/roleController.js`. Validators `roleValidator.createRoleValidations/updateRoleValidations`. Super-admin gated for mutations; `getAllRoles`/`getRoleById` are `auth()`.
4. **Bulk I/O present?**: Import — ABSENT. Export — PRESENT: `roles-table-actions.tsx` line 28 `exportTableToCSV(table, "roles")` (Download icon, lg+ only). 
5. **Interactive elements**: "Add New" primary button (`Plus`) in view header opens `CreateRoleDialog`. Search `Input` (filters `name` column). Export button. `DataTableColumnView` (column visibility popover). Row `DropdownMenu` (`MoreHorizontal`) → Edit / Delete. Dialogs: `CreateRoleDialog` (name req + description), `EditRoleDialog` (name + description), `ConfirmDeleteDialog` (shared, `components/dashboard/globalComponents/confirm-delete-dialog`). Status: per-row Users count badge.
6. **Table or cards?**: **Real tanstack table** (`useDataTable` + `GlobalTable`). Columns: select · Title(name) · Description · Type(badge) · Users(count) · Date · actions.
7. **Recommended export columns**: `id`, `name`, `description`, `type`, `users.length` (user count), `createdAt`. (Current export emits visible columns automatically.)
8. **Recommended import schema** (mirror `RolesAPI.create`): `{ name: string (required), description: string (optional), type: string (optional, default "general") }`. Dedupe by name (case-insensitive). NOTE: `super admin` role is filtered out of assignable lists — importer must not create/duplicate it.
9. **Behaviors to preserve**: create requires name; `type` defaults to "general" in UI; Users count column; "super admin" exclusion in user-assignment dialogs; delete uses shared confirm dialog with role-name interpolation.
10. **Migration risk**: low — already on tanstack + global table + CSV export. Adding an import dialog is purely additive (loop `RolesAPI.create`). `Role` type has both `name` and legacy `title` (columns coalesce `name || title`) — keep coalescing.

---

## DOMAIN: users

1. **List/view component**: `components/dashboard/mainScreens/users/usersListing/user-listing-view.tsx` → table `.../usersListing/components/user-table.tsx`. Columns `.../components/columns.tsx`; toolbar `.../components/user-table-actions.tsx`; row menu `.../components/row-actions.tsx`.
2. **lib/api module**: `lib/api/dashboard.ts` → `UsersAPI` → `.getAll()` (reads `data.results`), `.getById`, `.changeStatus(id,active)`, `.delete(id)`, `.updateProfile`, `.getMyProfile`. Create + edit (with roleIds) call `axiosInstance` directly: `POST /api/v1/users`, `PATCH /api/v1/users?id=`. Role options from `RolesAPI.getAll()`.
3. **Backend**: `src/routes/userRouter.js` → `src/controllers/userController.js` (`createUser`, `updateUser`, `changeUserStatus`, `deleteUser`, `getUsers`). All admin reads/mutations super-admin gated (`GET /`, `POST /`, `PATCH /`, `PATCH /change-status`, `DELETE /`). Self-service (`/profile/me`, `/profile`, `/change-password`) open to owner.
4. **Bulk I/O present?**: Import — ABSENT. Export — PRESENT: `user-table-actions.tsx` line 29 `exportTableToCSV(table, "users")`.
5. **Interactive elements**: "Add New" primary button (`Plus`) opens `CreateUserDialog`. Search `Input` (filters `fullName`). Export button. `DataTableColumnView`. Row `DropdownMenu` (`MoreHorizontal`) → Edit / Delete. **Per-row status `Switch`** (active toggle → `UsersAPI.changeStatus`, optimistic with rollback). Dialogs: `CreateUserDialog` (fullName, email, phone, password ≥6, role chip-toggles), `EditUserDialog` (fullName, email, phone, role chip-toggles — pre-selects current roles), shared `ConfirmDeleteDialog`. Avatar fallback initials; role badges; "No role" badge.
6. **Table or cards?**: **Real tanstack table** (`useDataTable` + `GlobalTable`). Columns: select · Full Name(+email+avatar) · Phone Number · Role(badges) · Status(switch) · Date · actions.
7. **Recommended export columns**: `id`, `fullName`, `email`, `phoneNumber`, `roles` (comma-joined names), `active` (status), `isVendor`, `createdAt`. (Avatar/Status-switch columns won't serialize cleanly — add explicit export-safe accessors.)
8. **Recommended import schema** (mirror `createUser` body `{fullName,email,phoneNumber,password,roleIds}`):
   - `fullName` — required, string
   - `email` — required, string (unique; dedupe key)
   - `phoneNumber` — optional, string (PK format `+92…`)
   - `password` — required, string (≥6 chars; or generate + force-reset)
   - `roles` — optional, string (comma-separated role names → resolve to roleIds via RolesAPI; "super admin" forbidden)
   Dedupe by email. NOTE: backend hashes password (bcrypt) on create.
9. **Behaviors to preserve VERBATIM**: status switch optimistic toggle + rollback + toast; password min 6; roleIds only replaced on edit when EXPLICITLY sent (absent roleIds leaves roles untouched — see userController comment); "super admin" excluded from assignable roles in both dialogs; `changeStatus` uses query params `?id=&active=`; `delete` uses `?id=`.
10. **Migration risk**: medium-low. Already tanstack + CSV export. The Status `Switch` is an inline mutating cell — must survive restyle/theme. Import dialog should reuse `import-customers-dialog.tsx` pattern but add role-name→roleId resolution + password handling (security-sensitive). Avatar + status-switch columns are non-serializable for the generic CSV helper — export needs dedicated accessors.

---

## Cross-cluster summary table

| Domain | listView path | api | import | export | table/cards | importable |
|---|---|---|---|---|---|---|
| admin/audit-logs | components/admin/AuditLogTable.tsx | lib/api/adminQueue.ts | absent | absent | raw table | no |
| admin/disputes | components/admin/DisputesTable.tsx | lib/api/disputes.ts | absent | absent | raw table | no |
| admin/documents | components/admin/DocumentQueueTable.tsx | lib/api/adminQueue.ts (+vendorDocuments.ts) | absent | absent | cards | no |
| admin/force-majeure | components/admin/ForceMajeureForm.tsx | lib/api/forceMajeure.ts | absent | absent | form/wizard | no |
| admin/platform-pulse | components/dashboard/mainScreens/admin/platform-pulse-view.tsx | (direct axios, no module) | absent | absent | cards | no |
| admin/promotions | components/dashboard/mainScreens/admin/promotions/admin-promotions-view.tsx | lib/api/promotions.ts | absent | absent | cards | no |
| admin/subscriptions | components/dashboard/mainScreens/admin/subscriptions/admin-subscriptions-view.tsx | lib/api/subscription.ts | absent | absent | cards | no |
| roles | components/dashboard/mainScreens/roles/rolesListing/roles-listing-view.tsx | lib/api/dashboard.ts (RolesAPI) | absent | present | table | yes |
| users | components/dashboard/mainScreens/users/usersListing/user-listing-view.tsx | lib/api/dashboard.ts (UsersAPI) | absent | present | table | yes |
