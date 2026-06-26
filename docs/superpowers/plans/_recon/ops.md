# Recon — Ops cluster (inventory · suppliers · staff · function-sheets)

Ground-truth audit feeding the full visual redesign (ClickUp/Slack-style SaaS, switchable themes, Iconly icons, mobile responsiveness, bulk import/export on every list domain).

Frontend root: `C:/Projects/Event Management Systen/ems-v0`
Backend root: `C:/Projects/Event Management Systen/event-planner-api`

## Cluster-wide facts (apply to all four)

- **Every domain is a CARD LIST, not a real `<table>` / tanstack global-table.** All four render `<Card>`-per-row inside `space-y-3` stacks. The reusable CSV exporter `lib/utils/csv-export.ts` (`exportTableToCSV`) is **tanstack-`Table`-coupled** — it reads `table.getAllColumns()` / `getFilteredRowModel()`, so it **cannot** be reused as-is for these card lists. Redesign must either (a) migrate each list to a `DataTable`, or (b) add a card-list-friendly CSV exporter that serializes from the in-memory array.
- **Bulk import/export status: ABSENT on all four.** The only existing import dialogs are `components/dashboard/mainScreens/customers/customersListing/components/import-customers-dialog.tsx` and `components/dashboard/mainScreens/bookings/import-bookings-dialog.tsx`; the only export button is `components/dashboard/mainScreens/bookings/export-bookings-button.tsx`. No `import-*-dialog.tsx` / `export-*-button.tsx` / `*-table-actions.tsx` exists under inventory, suppliers, staff, or function-sheets.
- **No backend bulk endpoints exist** for these four domains (grep for `bulk-import|bulkImport|/export` across the four routers returned zero). The established import pattern (see bookings) is a **single bulk POST** (e.g. `/bookings/bulk-import`) that runs the whole batch in one transaction with per-row error capture + a dry-run flag — new BE endpoints would be required for each domain that needs import.
- **Common shell**: all use `react-hook-form` + `zod` + sonner toasts + shadcn `Dialog`/`AlertDialog`/`Select`/`Form` + lucide icons (to be swapped to Iconly). All fetch the business list from `GET /api/v1/businesses/user-business` for a business picker. All money is PKR via a local `fmtPKR` (`Rs. {n.toLocaleString('en-PK')}`, integer-rounded). Numeric/decimal money fields arrive as `number | string` and are coerced with `Number()` — preserve this defensively.
- All deletes are **soft deletes**; ledgers/history preserved for audit. Preserve every "soft-deleted, history kept" assurance in dialog copy.

---

## DOMAIN: inventory

### 1. View components
- Main list view: `components/dashboard/mainScreens/inventory/inventory-view.tsx` (default export `InventoryView`). Single file; sub-components `ItemCard`, `ItemDialog`, `MovementDialog` are co-located in the same file (no separate table component).
- Layout: summary strip (3 cards) → category filter chips + low-stock toggle + search → `ItemCard` stack.

### 2. lib/api module
- `lib/api/inventory.ts`, class `InventoryAPI`.
- Functions: `listItems(filters)`, `getItem(id)`, `createItem(body)`, `updateItem(id, body)`, `removeItem(id)`, `listMovements(filters)`, `createMovement(body)`, `removeMovement(id)`.
- Helper exports: `INVENTORY_CATEGORY_LABELS`, `INVENTORY_UNIT_LABELS`, `MOVEMENT_TYPE_LABELS`, `MOVEMENT_TYPE_TONES`, `CATEGORY_TONES`.
- Endpoints: `/api/v1/inventory/items`, `/api/v1/inventory/movements`.

### 3. Backend
- Router `src/routes/inventoryRouter.js`; controller `src/controllers/inventoryController.js`. Both exist.

### 4. Bulk I/O today
- Import: **absent.** Export: **absent.**

### 5. Interactive inventory to preserve
- Primary action button: **"Add item"** (`Plus`).
- Per-card buttons: **"Record movement"** (`History`), **"Edit"** (`Pencil`), **"Remove"** (`Trash2`, rose).
- Filter chips: All + 7 category chips (with counts) + **"Low stock only"** toggle. Search box (name/SKU/supplier, 300ms debounce).
- Summary cards: Items tracked / Low stock / Stock value (last-restock cost).
- Dialogs: **ItemDialog** (add/edit item — business picker, category/unit pickers, SKU, starting stock, low-stock threshold, reorder lead time, cost/unit, default supplier, notes); **MovementDialog** (type-aware field set — restock/transfer_in show supplier+cost; consumed/wastage show bookingId+reason; adjustment relabels qty to "new absolute stock"); **AlertDialog** delete confirm.
- Special UI: **immutable movement ledger** semantics (stock changes only via movement; `currentStock` field is disabled in edit mode). Per-row stock badge + low-stock amber border/badge.

### 6. List type
- **Card list** (`ItemCard`). Drives card→DataTable migration decision.

### Bulk I/O (recommended)

**importable: YES** (mirrors `createItem`).

**Export columns** (from `InventoryItem` + computed):
`id, businessName, name, category, unit, sku, currentStock, lowStockThreshold, reorderLeadTimeDays, lastRestockCostPerUnit, stockValueOnShelf (currentStock×lastRestockCostPerUnit), defaultSupplierName, lastRestockAt, notes, createdAt`.

**Import field schema** (mirror `CreateItemInput`):
| field | required | type |
|---|---|---|
| businessId | yes | int |
| name | yes | string (≤160) |
| category | no (default `ingredient`) | enum: ingredient/rental/equipment/consumable/linen/stationery/other |
| unit | no (default `piece`) | enum: piece/dozen/pair/set/kg/gram/litre/ml/metre/bottle/packet/tray/thaal/tola/box/roll/other |
| sku | no | string (≤60) |
| currentStock | no (default 0) | decimal ≥0 (sets starting stock) |
| lowStockThreshold | no (default 0) | decimal ≥0 |
| reorderLeadTimeDays | no | int 0–365 |
| lastRestockCostPerUnit | no | decimal ≥0 (PKR) |
| defaultSupplierName | no | string (≤160) |
| notes | no | string (≤5000) |

Note: movements are NOT importable (ledger integrity) — import seeds `currentStock` once at create; thereafter stock moves only via `createMovement`.

### 9. Behaviors to preserve verbatim
- **Immutable movement ledger**: running stock can ONLY change via a movement create; direct item update refuses to touch `currentStock` (field disabled in edit UI; BE enforces).
- Movement-type semantics: `restock`/`transfer_in` add; `consumed`/`wastage`/`transfer_out` subtract and **cannot exceed current stock**; `adjustment` = stock-take override to an absolute count.
- `lastRestockCostPerUnit` is re-stamped on every restock; powers "stock value on shelf".
- Craft-universal copy (caterer ingredients / decor rental fleet / photographer kit / venue consumables) + PK units (`thaal`, `tola`).

### 10. Migration risk
- Type-conditional MovementDialog field set is non-trivial — preserve the per-type form branching when restyling.
- Decimal stock with 3-dp `fmtStock` trimming; don't switch to integer.

---

## DOMAIN: suppliers

### 1. View components
- Main view: `components/dashboard/mainScreens/suppliers/suppliers-view.tsx` (default export `SuppliersView`). **Two tabs**: `InvoicesTab` (default) + `SuppliersTab`. Sub-components co-located: `SupplierCard`, `SupplierDialog`, `InvoiceCard`, `InvoiceDialog`, `PaymentDialog`, `DisputeDialog`, `VoidDialog`, `AgingPill` (this file is 2153 lines; dialogs below line ~1755 confirmed by name via the tab wiring).
- Uses `LinkedFunctionSheetBadge` (shared) on invoices with a `bookingId`.

### 2. lib/api module
- `lib/api/suppliers.ts`, class `SupplierAPI`.
- Supplier fns: `list(filters)`, `get(id)`, `create(body)`, `update(id, body)`, `remove(id)`.
- Invoice fns: `listInvoices(filters)`, `getInvoice(id)`, `createInvoice(body)`, `updateInvoice(id, body)`, `recordPayment(id, body)`, `transitionInvoice(id, body)`, `removeInvoice(id)`, `aging(filters)`.
- Helper exports: `SUPPLIER_CATEGORY_LABELS`, `INVOICE_STATUS_LABELS`, `PAYMENT_METHOD_LABELS`, `INVOICE_STATUS_TONES`.
- Endpoints: `/api/v1/suppliers`, `/api/v1/suppliers/invoices`, `.../invoices/:id/payment`, `.../invoices/:id/transition`, `/api/v1/suppliers/aging`.

### 3. Backend
- Router `src/routes/supplierRouter.js`; controller `src/controllers/supplierController.js`. Both exist.

### 4. Bulk I/O today
- Import: **absent.** Export: **absent.**

### 5. Interactive inventory to preserve
- Tabs: **"A/P invoices"** (`Receipt`), **"Suppliers"** (`Truck`).
- Suppliers tab: primary **"Add supplier"**; per-card **Edit** / **Remove**; category chips (only non-empty shown) + **"Active only"** toggle; search (name/contact/NTN/phone). Summary: Active / Inactive / Categories.
- Invoices tab: primary **"Log invoice"**; **A/P aging mini-dashboard** (5 `AgingPill`s: Current / 0-7d / 8-30d / 31-60d / 60d+, with grand-total banner); status filter chips (all/received/partially_paid/paid/overdue/disputed/void/draft with counts) + From/To date range. Per-`InvoiceCard`: progress bar (paid/total %), overdue/"due in Nd" badges, **"Record payment"** (`CheckCircle2`), **"Dispute"** (`AlertTriangle`), **"Void"** (`XCircle`), **"Remove"**.
- Dialogs: **SupplierDialog** (identity + FBR NTN/STRN + bank/JazzCash/Easypaisa/Raast + credit terms + isActive); **InvoiceDialog** (supplier picker auto-fills name snapshot + due-date from payment terms; subtotal+tax→total preview); **PaymentDialog** (amount/method/ref/date); **DisputeDialog**; **VoidDialog**; delete `AlertDialog`.

### 6. List type
- **Card lists** in both tabs (`SupplierCard`, `InvoiceCard`).

### Bulk I/O (recommended)

**importable: YES for suppliers** (mirror `createSupplier`). Invoices: import is plausible but lower-priority (money + status state machine); recommend **suppliers-only import** initially.

**Export columns — suppliers** (from `Supplier` + computed outstanding):
`id, businessName, name, category, contactPerson, phoneNumber, whatsappNumber, address, ntn, strn, defaultPaymentTermsDays, creditLimit, bankName, bankAccountNumber, jazzcashNumber, easypaisaNumber, raastId, isActive, outstanding (from get/aging), notes, createdAt`.

**Export columns — invoices** (from `SupplierInvoice`):
`id, supplierNameSnapshot, supplierCategorySnapshot, invoiceNumber, invoiceDate, dueDate, subtotal, taxAmount, totalAmount, amountPaid, outstanding (total−paid), status, lastPaymentAt, lastPaymentVia, lastPaymentRef, bookingId, description`.

**Import field schema — suppliers** (mirror `CreateSupplierInput`):
| field | required | type |
|---|---|---|
| businessId | yes | int |
| name | yes | string (≤200) |
| category | no (default `meat`) | enum (20: meat/produce/atta_grains/dairy/oil_ghee/spices/frozen_seafood/bakery_sweets/flowers/decor_materials/linen_uniforms/equipment_rental/generator_rental/vehicle_rental/brokerage/utilities/transport_fuel/stationery/professional_services/other) |
| contactPerson | no | string (≤120) |
| phoneNumber | no | string (≤30) |
| whatsappNumber | no | string (≤30) |
| address | no | string (≤500) |
| ntn | no | string (≤20) |
| strn | no | string (≤20) |
| defaultPaymentTermsDays | no (default 0) | int 0–365 |
| creditLimit | no | decimal ≥0 (PKR) |
| bankName | no | string (≤100) |
| bankAccountNumber | no | string (≤40) |
| jazzcashNumber | no | string (≤30) |
| easypaisaNumber | no | string (≤30) |
| raastId | no | string (≤50) |
| notes | no | string (≤5000) |
| isActive | no (default true) | bool |

### 9. Behaviors to preserve verbatim
- **Invoice state machine**: `draft → received → partially_paid → paid` + `disputed` / `void` / `overdue`. Payments route ONLY through `/invoices/:id/payment` (the BE payment applier mutates `amountPaid` + auto-transitions to `paid` on full settlement — "amountPaid and status can never drift"); direct status changes only via `/transition`.
- **Money handling**: total = subtotal + taxAmount (computed); progress = paid/total; outstanding = max(0, total−paid). **Paid invoices cannot be removed.**
- **Overdue** is derived client-side: not paid/void AND dueDate < today; "due in Nd" badge when 0–7d out.
- **supplierNameSnapshot / supplierCategorySnapshot** are immutable snapshots captured at invoice time (so a renamed/retired supplier doesn't rewrite history) — supports one-off ad-hoc suppliers without a directory row.
- FBR NTN + STRN capture is load-bearing (input-tax credit / tax-season paper trail) — keep labels + mono styling.
- Due-date auto-fills from supplier `defaultPaymentTermsDays`.

### 10. Migration risk
- This is the **largest file** in the cluster (2153 lines, 2 tabs, ~8 dialogs); high surface area. The aging dashboard + progress bars + per-status conditional action buttons must all survive.
- Per-invoice action visibility is status-gated (pay/dispute/void/remove each have show conditions) — preserve the exact gating.

---

## DOMAIN: staff

### 1. View components
- Main view: `components/dashboard/mainScreens/staff/staff-view.tsx` (default export `StaffView`). **Two tabs**: `RosterTab` (default) + `ShiftsTab`. Sub-components co-located: `MemberCard`, `MemberDialog`, `ShiftCard`, `ShiftDialog`, `PayDialog`, `DisputeDialog`, `VoidDialog`, `ReplaceDialog` (file is 2639 lines).
- Embeds shared/portal components: `StaffLoginControl`, `StaffLeaveQueue` (flag-gated), `LinkedFunctionSheetBadge`.

### 2. lib/api module
- `lib/api/staff.ts`, class `StaffAPI`.
- Member fns: `listMembers(filters)`, `getMember(id)`, `createMember(body)`, `updateMember(id, body)`, `removeMember(id)`.
- Login/portal fns: `enableLogin`, `resetLogin`, `disableLogin`, `listLeaveRequests`, `approveLeave`, `rejectLeave` (flag-gated by `STAFF_LOGINS_ENABLED`).
- Shift fns: `listShifts(filters)`, `getShift(id)`, `openPayslipPdf(id)`, `createShift(body)`, `updateShift(id, body)`, `transitionShift(id, body)`, `markAttendance(id, body)`, `removeShift(id)`, `teamCalendar(filters)`, `payrollSummary(filters)`.
- Helper exports: `STAFF_ROLE_LABELS` (21 roles), `EMPLOYMENT_TYPE_LABELS`, `PAYMENT_STATUS_LABELS`, `PAYMENT_METHOD_LABELS`, `ATTENDANCE_STATUS_LABELS`, `*_TONES`.
- Endpoints under `/api/v1/staff/members`, `/api/v1/staff/shifts` (+ `/transition`, `/attendance`, `/payslip-pdf`, `/payroll-summary`, `/team-calendar`), `/api/v1/staff/leave`.

### 3. Backend
- Router `src/routes/staffRouter.js`; controllers `src/controllers/staffController.js` + `src/controllers/staffPortalController.js`. All exist.

### 4. Bulk I/O today
- Import: **absent.** Export: **absent.** (Note: per-shift **payslip PDF** export exists via `openPayslipPdf` — a single-row PDF, not a list export.)

### 5. Interactive inventory to preserve
- Tabs: **"Roster"** (`Users`), **"Shifts & payroll"** (`Receipt`).
- Roster: primary **"Add staff"**; role chips (non-empty) + **"Active only"** toggle; search (name/phone/NIC); summary Active/Inactive/Roles. Per-`MemberCard`: **Edit**, **Remove**, and **`StaffLoginControl`** (enable/reset/disable self-serve login — flag-gated). `StaffLeaveQueue` banner.
- Shifts: primary **"Log shift"**; **"Rs. X to pay out" amber floor banner** (pending + partial-balance, with dispute total); status chips (all/pending/partial/paid/disputed/void) + From/To date range. Per-`ShiftCard`: pay-breakdown strip (Base / +OT / +Bonus / −Deduction / **Gross** chip), payment-status action buttons (mark paid/dispute/void via `NEXT_STATUS_OPTIONS`), **attendance action row** (check in / worked / absent / excused / **Replaced** dialog via `NEXT_ATTENDANCE_OPTIONS`), thumbprint indicator, check-in/out times, "covered by" replacement line, payslip-PDF.
- Dialogs: **MemberDialog** (name/role/employment-type/CNIC[auto-format]/phones[masked]/dihari-or-salary/wallet+bank/emergency contact/CNIC address/notes/isActive); **ShiftDialog** (member picker + snapshot fallback, booking link, dihariRate, OT hrs×rate, bonus, deduction+reason); **PayDialog** (paidAmount/paidVia/paymentRef/receiptPhotoUrl/`thumbprintCaptured` checkbox); **DisputeDialog**; **VoidDialog**; **ReplaceDialog** (assign replacement name/phone/role/rate); delete `AlertDialog`.

### 6. List type
- **Card lists** in both tabs (`MemberCard`, `ShiftCard`).

### Bulk I/O (recommended)

**importable: YES for roster members** (mirror `createMember`). Shifts: import = lower priority (computed pay + dual state machines + snapshots) — recommend **roster-only import** initially. A `teamCalendar` overlay already exists; a kanban/calendar view is a redesign opportunity but not required.

**Export columns — members** (from `StaffMember`):
`id, businessName, fullName, role, employmentType, nicDisplay, phoneNumber, whatsappNumber, defaultDihariRate, monthlySalary, jazzcashNumber, easypaisaNumber, bankName, bankAccountNumber, emergencyContactName, emergencyContactPhone, cnicAddress, isActive, joinedDate, notes`.

**Export columns — shifts/payroll** (from `StaffShift`):
`id, staffNameSnapshot, roleSnapshot, shiftDate, dihariRate, overtimeHours, overtimeRate, bonusAmount, deductionAmount, deductionReason, grossPayable, netPayable, paymentStatus, paidAmount, paidVia, paymentRef, thumbprintCaptured, attendanceStatus, checkInAt, checkOutAt, bookingId`.

**Import field schema — members** (mirror `CreateMemberInput`):
| field | required | type |
|---|---|---|
| businessId | yes | int |
| fullName | yes | string (≤160) |
| role | no (default `waiter`) | enum (21: waiter/cook_helper/lead_cook/cleaner/parking_valet/dhol_player/qari/imam/decorator/florist/lighting_tech/security/driver/photographer/videographer/manager/bagpiper/stage_host/dj/sound_tech/other) |
| employmentType | no (default `casual_dihari`) | enum: permanent_monthly/casual_dihari/contract |
| nicNumber | no | string (digits+dashes, ≤20; CNIC auto-normalised) |
| phoneNumber | no | string (≤30; PK phone mask) |
| whatsappNumber | no | string (≤30) |
| defaultDihariRate | no | decimal 0–100000 (PKR/shift; casual) |
| monthlySalary | no | decimal 0–5000000 (PKR; permanent) |
| jazzcashNumber | no | string (≤30) |
| easypaisaNumber | no | string (≤30) |
| bankName | no | string (≤100) |
| bankAccountNumber | no | string (≤40) |
| emergencyContactName | no | string (≤120) |
| emergencyContactPhone | no | string (≤30) |
| cnicAddress | no | string (≤300) |
| notes | no | string (≤5000) |
| isActive | no (default true) | bool |

### 9. Behaviors to preserve verbatim
- **Two orthogonal state machines**: (a) **payment** `pending/partial/paid/disputed/void` (`NEXT_STATUS_OPTIONS` map) — `partial` is a first-class state, "Mark paid" records balance; **paid shifts cannot be removed** (move to disputed first). (b) **attendance** `scheduled/checked_in/completed/absent/excused/replaced` (`NEXT_ATTENDANCE_OPTIONS`, mirrors BE `VALID_ATTENDANCE_TRANSITIONS`); `replaced` goes through ReplaceDialog not a plain button.
- **Pay math is server-computed** (`computeShiftPay` → `grossPayable`/`netPayable` authoritative); FE only previews. Base + OT(hrs×rate) + bonus − deduction = gross; net snapshot is the payout figure.
- **Append-only ledger**: each shift snapshots `staffNameSnapshot` + `roleSnapshot` + pay math (record stays auditable even if member edited/retired).
- **PK-specific**: CNIC `formatCnic` auto-normalise + `inputMode=numeric`; all phone/wallet fields run through `formatPkPhone`/`filterPhoneInput` (Issue #37 — strips non-digits live); `dihari` (per-event casual) vocabulary; **thumbprintCaptured** (illiterate-labour wage-dispute proof); emergency contact + CNIC address for tax/dispute; JazzCash/Easypaisa/Raast wallet rails.
- Floor banner math: `outstandingTotal ?? pendingTotal` (degrades gracefully against older BE).

### 10. Migration risk
- **Highest-complexity domain**: dual state machines + computed money + flag-gated portal sub-components (`StaffLoginControl`, `StaffLeaveQueue`) + partial-payment edge cases. Don't collapse payment + attendance into one status. Phone/CNIC masking onChange handlers must survive the input restyle.
- `partialTotal`/`outstandingTotal` optional fields → keep the `??` fallbacks.

---

## DOMAIN: function-sheets

### 1. View components
- Main list view: `components/dashboard/mainScreens/function-sheets/function-sheets-view.tsx` (default export `FunctionSheetsView`, with co-located `SheetCard`).
- Detail view: `components/dashboard/mainScreens/function-sheets/function-sheet-detail-view.tsx`.
- **Composer (wizard-like multi-section editor)**: `function-sheet-composer.tsx`.
- **~16 craft-specific sub-card editors** (the special UI): `beo-run-sheet-card.tsx`, `kitchen-sheet-card.tsx`, `bridal-fitting-card.tsx`, `decorator-setup-card.tsx`, `car-rental-card.tsx`, `henna-schedule-card.tsx`, `stationery-card.tsx`, `makeup-card.tsx`, `deliverables-card.tsx`, `photography-card.tsx`, `subcontract-card.tsx`.
- Dialogs/widgets: `sign-dialog.tsx` + `signature-pad.tsx`, `send-whatsapp-dialog.tsx`, `share-link-dialog.tsx`, `activity-dialog.tsx`, `fbr-submit-dialog.tsx`.

### 2. lib/api module
- `lib/api/functionSheets.ts`, class `FunctionSheetAPI`.
- Functions: `list(filters)`, `get(id)`, `create(body)`, `update(id, body)`, `transition(id, body)`, `remove(id)`, `pdfBlob(id, variant)`, `pdfUrl(id, variant)`, `issueShareToken(id, days)`, `revokeShareToken(id)`, `submitFbr(id, body)`, `linkedFinancials(id)`, `auditLog(id, limit)`, `sendWhatsapp(id, body)`.
- Helpers: `STATE_LABELS`, `PDF_VARIANT_LABELS`, `STATE_TONES`, `variantsAvailable(state)`.
- Endpoint base: `/api/v1/function-sheets` (+ `/:id/transition`, `/pdf`, `/share-token`, `/fbr-submit`, `/linked-financials`, `/audit-log`, `/send-whatsapp`).

### 3. Backend
- Router `src/routes/functionSheetRouter.js` (+ `publicFunctionSheetRouter.js` for customer-share token); controller `src/controllers/functionSheetController.js`. All exist.

### 4. Bulk I/O today
- Import: **absent.** Export: **absent** as a list export — but **rich single-row PDF export already exists** (`pdfBlob`/`pdfUrl` for Quote/Contract/BEO/Invoice/Receipt variants, state-gated by `variantsAvailable`), plus WhatsApp send + customer share link. These are NOT bulk/CSV and must be preserved as-is.

### 5. Interactive inventory to preserve
- Primary: **"New function sheet"** → opens composer.
- **9-pill state summary** (clickable filter, draft…cancelled, with counts) + grand-total banner.
- Filters: All chip + Booking # input + Event from/to dates (+ deep-link `?state=`).
- Per-`SheetCard`: title link → detail route; state + #id badges; lifecycle timeline chips (quote sent / vendor+customer signed / both signed / invoiced / paid / share-link-live / FBR status / line-item count). Actions: **PDF dropdown** (preview/download/WhatsApp per available variant), forward-only **transition** buttons (`NEXT_STATES`), **Edit** (non-terminal/non-paid), **"Sign as vendor"** / **"Sign as customer"** (signature pad), **"Share link"/"Manage share link"**, **"Submit to FBR"/"FBR re-submit"** (invoiced/paid only), **"Activity"** (audit log), **"Cancel"**, **"Remove"**.
- Dialogs/special: `FunctionSheetComposer` (the wizard — line items, terms, payment schedule + the 16 craft JSON sub-cards), `SignDialog`+`SignaturePad` (canvas signature capture), `SendWhatsappDialog`, `ShareLinkDialog`, `ActivityDialog`, `FbrSubmitDialog`, cancel + delete `AlertDialog`s.

### 6. List type
- **Card list** (`SheetCard`).

### Bulk I/O (recommended)

**importable: NO (import N/A).** Function sheets are a stateful, morphing legal document (state machine + signatures + PDFs + FBR e-invoicing + per-craft JSON payloads + linked financials). They are authored in the composer, not bulk-loaded. A CSV-row cannot represent the document. **Do not build import.**

**Export columns (list/CSV) — recommended** (metadata roll-up only, NOT the craft JSON or PDFs):
`id, title, state, customerName, customerPhone, customerEmail, eventDate, validUntil, bookingId, businessName, subtotal, discountAmount, taxAmount, grandTotal, lineItemCount, sentAt, signedAt, invoicedAt, paidAt, fbrInvoiceNumber, fbrSubmissionStatus, shareTokenLive(bool), createdAt`.
Keep the existing per-sheet **PDF variant export** (Quote/Contract/BEO/Invoice/Receipt) untouched — that is the real "export" for this domain; CSV is only a portfolio/accounting roll-up.

### 9. Behaviors to preserve verbatim
- **Morphing-document state machine** (forward-only happy path `NEXT_STATES`): `draft → quote_sent → contract_pending → signed → beo_ready → invoiced → paid → archived`, plus `cancelled` (terminal). One row changes "face" (Quote→Contract→BEO→Invoice→Receipt) as state advances.
- **PDF variant gating** (`variantsAvailable` mirrors BE `VARIANT_MIN_STATE`): quote≥draft, contract≥contract_pending, beo≥beo_ready, invoice≥invoiced, receipt≥paid; cancelled → quote only (historical).
- **Edit only on non-terminal & non-paid**; **cancel** is terminal; delete is soft (kept for legal/tax audit). Paid-sheet cancellation warning copy (force-majeure refund-and-void).
- **Signatures** (`signaturesJson.vendor/customer.signedAt`), **share-token** lifecycle (issue rotates + kills previous link; revoke flags dead, re-issuable; expiry clamp 1–365d), **FBR** provider-agnostic submit (stamps snapshot for replay when `no_provider`), **audit log** append-only.
- **16 craft-aware JSON payloads** (`kitchenSheetJson`, `hennaJson`, `makeupJson`, `photographyJson`, `stationeryJson`, `carRentalJson`, `decoratorSetupJson`, `bridalWearJson`, `deliverablesJson`, `subcontractsJson`, `beoJson`) — each with its own PK-specific vocabulary (per-hand henna pricing, per-head kitchen quantities, bridal fitting milestones, photography family-groups, etc.). Money math: grandTotal = subtotal − discount + tax.

### 10. Migration risk
- **By far the most UI-dense domain** (composer wizard + 16 craft sub-cards + signature canvas + 6 dialogs + PDF/WhatsApp/share/FBR/audit). The signature-pad canvas and the per-craft card editors are the trickiest to restyle without breaking their JSON contracts. Treat the composer as a multi-step wizard in the new design system.
- Deep-link `?state=` seeding + `useSearchParams` must be preserved.
- This domain anchors the cross-feature `linkedFinancials` P&L — other domains (suppliers/staff/inventory) surface a `LinkedFunctionSheetBadge` keyed on `bookingId`; keep that shared badge working.
