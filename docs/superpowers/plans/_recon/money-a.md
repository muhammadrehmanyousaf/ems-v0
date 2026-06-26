# Recon — Money cluster A: payments · receivables · receipts · pdcs

Ground-truth audit for the visual redesign (ClickUp/Slack SaaS, switchable themes,
Iconly icons, mobile responsive, bulk import/export). Every fact below is cited to a
file path. No import-*-dialog.tsx exists for ANY of these four domains.

Frontend root: `C:/Projects/Event Management Systen/ems-v0`
Backend root: `C:/Projects/Event Management Systen/event-planner-api`

---

## DOMAIN: payments

> NOTE: This screen is a **read-only computed revenue view**, NOT a CRUD list over a
> `Payment` table. It aggregates booking financials by source (offline/online). The
> rich Stripe CRUD in `lib/api/payments.ts` (`PaymentAPI`) is the customer-facing
> checkout flow and is **not** what this dashboard screen renders.

**1. Main view + sub-table**
- List/view: `components/dashboard/mainScreens/payments/payments-view.tsx`
- Table: `components/dashboard/mainScreens/payments/components/payments-table.tsx`
- Columns: `components/dashboard/mainScreens/payments/components/columns.tsx`
- Row actions: `components/dashboard/mainScreens/payments/components/row-actions.tsx`
- View dialog: `components/dashboard/mainScreens/payments/components/view-payment-dialog.tsx`
- Table actions (search + export): `components/dashboard/mainScreens/payments/components/payment-table-actions.tsx`
- nuqs filter hook (defined, not actually wired into the table here): `components/dashboard/mainScreens/payments/components/payment-table-filters.tsx`

**2. lib/api module + key functions**
- `lib/api/dashboard.ts` → class `PaymentsAPI` (NOT `lib/api/payments.ts`). The view calls
  `PaymentsAPI.getVendorRevenue()` → `GET /api/v1/payments/vendor-revenue` (returns
  `{ payments: VendorPayment[], stats: { offline, online, all } }`).
- `lib/api/payments.ts` → class `PaymentAPI` = Stripe checkout flow (createPaymentIntent,
  processDownPayment, processRemainingPayment, processFullPayment, createCheckoutSession,
  verifyCheckoutSession, getPaymentHistory, getPendingPayments). NOT consumed by this screen.
- Type: `VendorPayment` in `lib/dashboard-types.ts` (lines 70-85).

**3. Backend router + controller**
- EXISTS. Router: `src/routes/paymentRouter.js` (162 lines). Controller:
  `src/controllers/paymentController.js` (3,628 lines — large Stripe + revenue surface).
  The `vendor-revenue` endpoint is computed from `Booking` rows (no dedicated Payment list).

**4. Bulk import / export**
- IMPORT: **absent** (no import-*-dialog.tsx; and a computed revenue read makes import N/A).
- EXPORT: **present** — `exportTableToCSV(table, "payments")` from `lib/utils/csv-export.ts`,
  wired in `payment-table-actions.tsx` (the "Export" button). Util confirmed at
  `lib/utils/csv-export.ts`.

**5. Interactive inventory to preserve**
- Primary buttons: "Retry" (error state), "Export" (CSV).
- Source filter tabs (custom buttons, not a Select): `All (n)` / `Offline (n)` / `Online (n)`.
- Icon-only: row "⋮" (MoreHorizontal) dropdown → single item "View Details" (Eye).
- Column-visibility control: `DataTableColumnView` (icon-only).
- Search input: placeholder "Search Name..." filters `customerName` column.
- Dialog: `ViewPaymentDialog` (read-only Payment Details: Customer / Booking / Financials sections,
  Offline/Online badge).
- Stat cards: 4 KPI cards (Total Bookings, Total Revenue, Total Received, Total Due) + 2 source
  split cards (Offline / Online with Total/Received/Due).
- Craft-aware: PKR money via `Rs. n.toLocaleString('en-PK')`; offline vs online "bookingSource"
  is a first-class concept (Store vs Globe icons, orange vs blue).

**6. Table vs cards**
- **Real table** — TanStack via `useDataTable` + `GlobalTable` (`globalComponents/globalTable`).
  Has row selection checkboxes, pagination, column hiding. → Maps cleanly to a new DataTable.

**7. Recommended export columns**
Customer Name, Customer Phone, Customer Email, Booking ID, Business Name, Booking Date,
Booking Time, Status, Payment Status, Source (offline/online), Total Amount, Down Payment,
Received, Due. (All fields exist on `VendorPayment`.)

**8. Bulk I/O — import field schema**
- **import N/A** — payments here are a computed aggregate of bookings + Stripe; there is no
  create-payment-row endpoint to mirror. Do NOT add CSV import to this screen. (Money is logged
  via the **receipts** domain instead — see below.)

**9. Behaviors to preserve verbatim**
- Money formatting `Rs. <n>` en-PK, integer (no decimals).
- paymentStatus vocabulary + colors: Pending (amber) / Partial (blue) / Paid (green).
- offline/online source split drives both the tabs and the two summary cards; keep both.
- `due` only rendered when `> 0`.
- Time formatting: 24h `HH:MM` → 12h AM/PM via local `formatTime`.

**10. Migration risk notes**
- The two API classes share confusingly similar names (`PaymentsAPI` in dashboard.ts vs
  `PaymentAPI` in payments.ts). Do not cross-wire them during refactor.
- `payment-table-filters.tsx` uses nuqs (`useQueryState`) but the table actually filters
  client-side via the column filter — the nuqs hook is effectively dead. Don't assume it drives data.
- `GlobalTable`/`useDataTable` is the shared table primitive — restyling must go through that
  component (or its replacement) to avoid divergence across the whole dashboard.

---

## DOMAIN: receivables

> A/R aging board ("kis se paise leny hen?" / who owes me money). Read-only, computed live
> from `BookingInstallment` + `Booking`. Buckets overdue installments and rolls up per customer.

**1. Main view + sub-table**
- List/view: `components/dashboard/mainScreens/receivables/receivables-view.tsx` (single file,
  542 lines; contains inline `BucketCard` + `CustomerRow` components).
- No separate table/columns file — it's a hand-rolled expandable card/row list.

**2. lib/api module + key functions**
- `lib/api/analytics.ts` → class `AnalyticsAPI`, method `getReceivables()` →
  `GET /api/v1/analytics/receivables`. Types `ReceivablesData`, `ReceivablesCustomer`,
  `ReceivablesBucketKey` (all in analytics.ts, ~line 354 / 522).
- Read-only: list only. No create/update/delete/transition.

**3. Backend router + controller**
- NO dedicated receivables router/controller. Served by the **analytics** controller/router
  (`/api/v1/analytics/receivables`). (No `receivablesController.js` / `receivablesRouter.js`.)

**4. Bulk import / export**
- IMPORT: **absent** (and N/A — computed aging board).
- EXPORT: **present** — hand-rolled CSV builder `downloadCsv()` inside `receivables-view.tsx`
  (lines ~326-363; Blob + anchor download, toast success). Does NOT use `csv-export.ts`.

**5. Interactive inventory to preserve**
- Primary buttons: "Refresh", "Export CSV", "Try again" (error state), "Expand all", "Collapse all".
- Bucket selector strip: 6 clickable cards (All + Current / 1-30 / 31-60 / 61-90 / 90+) acting
  as filter chips (toggle).
- Search input: "Search by name, phone, or email…".
- Per-customer row: expand/collapse chevron → reveals per-booking breakdown with per-installment
  rows (label, due date, days-late, outstanding/amount).
- Icon-only per-customer actions: **WhatsApp deep-link** (wa.me, Urdu-template message),
  **Call** (`tel:`). Email shown but no mailto action button (mailto referenced in header comment only).
- Link out: per-booking `Link` to `/dashboard/bookings/{id}`.
- Special UI: **aging-bucket ledger board** (5 buckets) + collections-list with WhatsApp/Call CTAs.
  This is craft-critical PK behavior — preserve verbatim.

**6. Table vs cards**
- **Card list** (expandable rows inside a Card). Not a TanStack table. Migration choice: keep as a
  specialized aging board / grouped list — do NOT force into a flat DataTable (the per-installment
  expansion + bucket roll-up is the value).

**7. Recommended export columns** (matches current `downloadCsv` header)
Customer, Phone, Email, Outstanding (Rs), Oldest days overdue, Open installments, Bookings, Bucket.

**8. Bulk I/O — import field schema**
- **import N/A** — receivables are derived from booking installments; there is no "create a
  receivable" endpoint. No import.

**9. Behaviors to preserve verbatim**
- Bucket keys + labels: `current` / `days_1_30` / `days_31_60` / `days_61_90` / `days_90_plus`.
- Bucket tone colors: emerald / blue / amber / orange / rose (escalating severity).
- PK phone → wa.me normaliser (`waLink`): strips non-digits, `0xxxx`→`92xxxx`, bare `3xxxxxxxxx`
  (len 10)→`92…`; Urdu/roman greeting template ("Assalam-o-Alaikum … outstanding balance hai …").
  This is a load-bearing localization detail — keep exactly.
- Money `Rs <n>` en-PK rounded.
- "Nothing owed — you're all clear" empty/all-clear state.
- Grand-outstanding headline color escalates by oldest-overdue (>60 rose, >30 amber, else gold).

**10. Migration risk notes**
- CSV export is bespoke inline (not the shared util) — if standardizing on `csv-export.ts`, keep
  the same column set + the en-PK rounding or numbers will shift.
- Heavy use of `bridal-gold-dark` / `bridal-cream` theme tokens; theme-switching must remap these.
- The expand/collapse `Set<string>` keys on `email||phone||name` — preserve identity logic or
  expansion breaks.

---

## DOMAIN: receipts

> Payment-receipt ledger ("payments that already LANDED"): cash + JazzCash + Easypaisa + Raast +
> IBFT + bank_transfer + other. Full CRUD. Sibling to the PDC ledger.

**1. Main view + sub-table**
- List/view: `components/dashboard/mainScreens/receipts/receipts-ledger-view.tsx` (829 lines;
  contains inline `ReceiptDialog` create/edit form + the list).
- No separate table file — card list.

**2. lib/api module + key functions**
- `lib/api/paymentReceipts.ts` → class `ReceiptsAPI`: `list(filters)`, `get(id)`, `create(body)`,
  `update(id, body)`, `remove(id)` (soft delete). Endpoints under `/api/v1/receipts`.
- Helpers exported: `RECEIPT_METHOD_LABELS`, `RECEIPT_METHOD_TONES`, `RECEIPT_METHODS_NEEDING_REF`.
- Types: `PaymentReceipt`, `ReceiptMethod`, `CreateReceiptInput`, `UpdateReceiptInput`, `ReceiptSummary`.

**3. Backend router + controller**
- EXISTS. Router: `src/routes/paymentReceiptRouter.js` (21 lines). Controller:
  `src/controllers/paymentReceiptController.js` (314 lines). Validator:
  `src/utils/paymentReceiptValidator.js` (`validatePaymentReceipt`, `METHODS`,
  `METHODS_REQUIRING_TXN_REF`, `MAX_AMOUNT = 50,000,000`).

**4. Bulk import / export**
- IMPORT: **absent** (no import-*-dialog.tsx). → **importable: YES** (create endpoint exists).
- EXPORT: **absent** (no export button / no csv-export usage in the view).

**5. Interactive inventory to preserve**
- Primary button: "Log a receipt" (+ "Log your first receipt" in empty state).
- Method filter: `Select` (All methods + cash/jazzcash/easypaisa/raast/ibft/bank_transfer/other).
- Per-row icon-only actions: **Edit** (Pencil), **Delete** (Trash2, destructive).
- Dialog: `ReceiptDialog` (create/edit) — method Select, amount, date received, conditional
  Transaction reference (only for digital methods), Customer ID (standalone only), Booking Select
  (dropdown of PENDING bookings, fetched live), photo URL, notes.
- AlertDialog: delete confirmation ("Remove this receipt?" — soft-delete copy).
- Summary cards: 6 (Total received + Cash/JazzCash/Easypaisa/Raast/IBidget). Method tone badges.
- Inline: `LinkedFunctionSheetBadge` per booking; "View receipt photo →" external link.

**6. Table vs cards**
- **Card list** (one Card per receipt). Migration: could go to DataTable, but the per-method badge +
  photo link + linked-function-sheet badge are rich; a DataTable with an expand or detail column works.

**7. Recommended export columns**
Receipt ID, Method, Amount (Rs), Received Date, Transaction Ref, Customer Name, Customer Phone,
Booking ID, Booking Date, Notes, Photo URL, Created At.

**8. Bulk I/O — import field schema** (mirror `CreateReceiptInput` + validator)
| field | required | type |
|---|---|---|
| method | yes | enum: cash · jazzcash · easypaisa · raast · ibft · bank_transfer · other |
| amount | yes | number > 0, ≤ 50,000,000 (rounded to integer) |
| receivedDate | yes | date YYYY-MM-DD |
| transactionRef | conditional | string ≤120 — REQUIRED when method ∈ {jazzcash,easypaisa,raast,ibft,bank_transfer}; ignored/nulled for cash |
| bookingId | conditional* | integer — at least one of {bookingId, customerUserId} required |
| customerUserId | conditional* | integer > 0 — derived from booking when bookingId present |
| photoUrl | no | url string ≤500 |
| notes | no | string ≤2000 |

\* Cross-field rule: a row is valid if it has a `bookingId` (BE derives customer) OR a positive
`customerUserId`. Import must enforce this per row.

**9. Behaviors to preserve verbatim**
- Per-method txn-ref requirement (digital methods require ref; cash never stores a ref — BE nulls it).
- Amount cap `MAX_AMOUNT = 50,000,000` ("Rs. 5 crore" guardrail) + positive + rounded to integer.
- Soft-delete only (audit trail survives) — keep the AlertDialog copy intent.
- customerUserId auto-derived from booking when bookingId supplied (Issue #41); booking dropdown
  scoped to `paymentStatus=Pending` active bookings (Issue #50).
- Method labels/tones exactly: Cash(emerald), JazzCash(rose), Easypaisa(amber), Raast(purple),
  IBFT(blue), Bank transfer(sky), Other(neutral).
- Summary cards load FULL set (filter only narrows the list, never the summary breakdown).

**10. Migration risk notes**
- Create/edit form is a long Zod-validated react-hook-form with cross-field `.refine()`s — restyle
  the chrome, do NOT alter the schema/refines (they mirror BE validator + Issue #41/#50).
- Booking dropdown does a live `import('@/lib/axiosConfig')` dynamic fetch on open — preserve.
- `LinkedFunctionSheetBadge` is a shared component dependency.

---

## DOMAIN: pdcs (post-dated cheques)

> Post-dated-cheque ledger. Vendors hold dozens of PDCs; this replaces the paper register.
> Full CRUD + a **status state machine** routed through a dedicated `/transition` endpoint.

**1. Main view + sub-table**
- List/view: `components/dashboard/mainScreens/pdcs/pdc-ledger-view.tsx` (947 lines; contains
  inline `PdcDialog` (create/edit), `TransitionDialog`, and the list).
- No separate table file — card list.

**2. lib/api module + key functions**
- `lib/api/postDatedCheques.ts` → class `PdcAPI`: `list(filters)`, `get(id)`, `create(body)`,
  `update(id, body)` (content edits only), `transition(id, {to, depositDate?, bounceReason?})`,
  `remove(id)` (soft delete). Endpoints under `/api/v1/pdcs`.
- Helpers: `PDC_STATUS_LABELS`, `PDC_STATUS_TONES`. Types: `PostDatedCheque`, `PdcStatus`,
  `CreatePdcInput`, `UpdatePdcInput`, `TransitionPdcInput`, `PdcSummary`.

**3. Backend router + controller**
- EXISTS. Router: `src/routes/pdcRouter.js` (38 lines). Controller:
  `src/controllers/pdcController.js` (481 lines). State machine:
  `src/utils/pdcStatusTransition.js` (`pdcStatusTransition`, `STATUSES`, `TERMINAL`,
  `VALID_TRANSITIONS`).

**4. Bulk import / export**
- IMPORT: **absent** (no import-*-dialog.tsx). → **importable: YES** (create endpoint exists).
- EXPORT: **absent** (no export button / no csv-export usage in the view).

**5. Interactive inventory to preserve**
- Primary button: "Log a cheque" (+ "Log your first cheque" empty state).
- Status filter: `Select` (All / Held / Awaiting clearance / Cleared / Bounced / Cancelled).
- Per-row icon-only: **Edit** (Pencil, non-terminal only), **Delete** (Trash2, destructive).
- Per-row **transition action buttons** (state-dependent):
  - held → "Mark deposited"
  - deposited → "Cleared" (emerald) / "Bounced" (rose)
  - any non-terminal → "Cancel"
- Dialogs: `PdcDialog` (create/edit form), `TransitionDialog` (collects depositDate when→deposited,
  bounceReason when→bounced; informational copy for cleared/cancelled).
- AlertDialog: delete confirmation (soft-delete copy, references PKR 489-F legal note).
- Summary cards: 4 (Currently held / Awaiting clearance / Cleared lifetime / Bounced lifetime).
- Due-date badge on held cheques: "Due in N d" / "Due today" / "N d overdue" (amber/rose).
- Inline `LinkedFunctionSheetBadge` per booking.

**6. Table vs cards**
- **Card list**, custom-sorted (held→deposited→bounced→cleared→cancelled, then by days-until face
  date). Migration: the per-row state-machine action buttons + due countdown are the value — a
  DataTable would need an actions column rich enough to host them; a status-grouped card/kanban
  also fits. Preserve the lifecycle affordances.

**7. Recommended export columns**
PDC ID, Cheque Number, Bank Name, Branch Code, Amount (Rs), Cheque Date (face), Deposit Date,
Status, Bounce Reason, Customer Name, Customer Phone, Booking ID, Notes, Created At.

**8. Bulk I/O — import field schema** (mirror `CreatePdcInput` + controller validation)
| field | required | type |
|---|---|---|
| chequeNumber | yes | string, regex `^\d{4,20}$` (4-20 digits), clipped to 20 |
| bankName | yes | string 2-120 |
| amount | yes | number > 0 (positive; stored DECIMAL) |
| chequeDate | yes | date YYYY-MM-DD (cheque face date) |
| branchCode | no | string ≤20 |
| bookingId | conditional* | integer — at least one of {bookingId, customerUserId} required |
| customerUserId | conditional* | integer > 0 — derived from booking when bookingId present |
| notes | no | string ≤2000 |

\* Same cross-field rule as receipts. Status is NOT importable — every new PDC starts `held`
and only moves via the `/transition` state machine. Do NOT accept `status`, `depositDate`,
or `bounceReason` on import.

**9. Behaviors to preserve verbatim (CRITICAL — state machine)**
- Lifecycle: `held → deposited → cleared`; `deposited → bounced`; any non-terminal → `cancelled`.
  Terminal = {cleared, bounced, cancelled} (cannot transition; same-state = idempotent no-op).
- Guardrails: depositDate REQUIRED when →deposited; depositDate must be ≥ chequeDate
  (`deposit_before_cheque_date` reject); bounceReason REQUIRED when →bounced.
- Status writes ONLY via `/transition` (never via update). Content `update` blocked once terminal
  (`TERMINAL_STATE`).
- chequeNumber regex `^\d{4,20}$`; bank name required; customerUserId derived from booking (Issue #41).
- Soft-delete only (audit trail). PKR 489-F legal note on bounced cheques — keep the copy.
- Status labels/tones exactly: Held(amber), Deposited="Deposited (awaiting clearance)"(blue),
  Cleared(emerald), Bounced(rose), Cancelled(neutral).
- Edit hidden for terminal rows; transition button set is status-dependent.

**10. Migration risk notes**
- The state machine is the highest-risk surface: the per-row action buttons map 1:1 to legal
  transitions. Any redesign must keep the exact button-set-per-status logic or vendors will be
  offered illegal transitions (BE will 400, but UX breaks).
- TransitionDialog conditionally renders depositDate vs bounceReason inputs — both must survive.
- Create vs Edit use different Zod schemas (`createSchema` has the customerUserId cross-field
  refine; `editSchema` omits customerUserId). Preserve both.
- Custom multi-key sort (status order + days-until) — preserve or the "due soonest first" UX is lost.

---

## Cross-cluster notes for the redesign

- **Theme tokens**: all four lean on `bridal-gold-dark` / `bridal-cream` + a fixed semantic palette
  (amber/blue/emerald/rose/sky/purple/neutral). Switchable themes must remap the brand tokens AND
  keep the *semantic* status/method colors legible across themes.
- **Money**: universally `Rs. <int>` `toLocaleString('en-PK')`, rounded, no decimals. Keep.
- **Icons**: currently all `lucide-react`. Iconly swap is mechanical but touches every file.
- **Mobile**: receivables / receipts / pdcs are already card-first (vendor-on-the-floor intent);
  payments is the only TanStack table (its toolbar export+column-view is `hidden lg:flex`).
- **Bulk I/O reality check**: only **receipts** and **pdcs** are importable (real create endpoints +
  validators). **payments** and **receivables** are computed/read-only → import N/A; export only.
- **Shared primitives**: `GlobalTable`/`useDataTable`, `lib/utils/csv-export.ts`,
  `LinkedFunctionSheetBadge`, `DataTableColumnView` — restyle centrally.
