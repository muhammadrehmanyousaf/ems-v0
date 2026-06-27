# Money Cluster B — Recon (expenses · tax · brokers · billing · revenue)

Ground-truth audit for the visual redesign (ClickUp/Slack SaaS, switchable themes,
Iconly icons, full mobile responsiveness, bulk import/export on every list domain).

Frontend root: `C:/Projects/Event Management Systen/ems-v0`
Backend root: `C:/Projects/Event Management Systen/event-planner-api`

**Cluster-wide finding:** NO domain in this cluster currently has a bulk-import dialog,
bulk-export button, CSV helper, or a `*-table-actions.tsx`. Each domain folder contains
exactly ONE view file and nothing else. Import/export must be built fresh for every
importable domain. (Searched `components/dashboard/mainScreens/{expenses,tax,brokers,billing,revenue}/**` for `import-*-dialog`, `export-*-button`, `csv`, `table-actions` → zero hits.)

---

## 1. EXPENSES

**1. List/view component**
- `components/dashboard/mainScreens/expenses/expenses-view.tsx` (single file; `ExpensesView` + inline `ExpenseDialog`).
- No separate table/sub-listing component — rows are rendered inline as a `<Card>` list.

**2. lib/api module + key functions**
- `lib/api/vendorExpenses.ts` → `ExpensesAPI` class.
- Functions: `list(filters)`, `get(id)`, `create(body)`, `update(id, body)`, `remove(id)`, `pnlForBooking(bookingId)`.
- Exports display maps: `EXPENSE_CATEGORY_LABELS`, `EXPENSE_CATEGORY_TONES`, `EXPENSE_PAYMENT_METHOD_LABELS`.

**3. Backend router + controller**
- Router: `src/routes/vendorExpenseRouter.js` — mounted at `/api/v1/expenses` (loaders/routes.js:108).
- Controller: `src/controllers/vendorExpenseController.js`.
- Validator/helper: `src/utils/vendorExpenseValidator.js` (`validateVendorExpense`, `computePerEventPnl`, `CATEGORIES`).
- Routes: `GET /`, `GET /booking/:bookingId/pnl`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`. All `auth()`.

**4. Bulk import / export**
- Import: **absent.**
- Export: **absent.**

**5. Interactive elements to preserve**
- Primary action button: **"Log expense"** (header) + **"Log your first expense"** (empty state). Both open create dialog.
- Per-row icon-only buttons: **Edit** (Pencil), **Delete** (Trash2, destructive). `aria-label`s present.
- Dialogs/sheets:
  - `ExpenseDialog` (create + edit) — amount, category Select, spentDate, paymentMethod Select, vendorName, bookingId, subcategory, description, photoUrl. Conditional label: when category = `other` the subcategory field becomes required-styled ("What kind of expense is this? *").
  - `AlertDialog` — soft-delete confirm ("Remove this expense?").
- Category filter `Select` (top, "All categories" + 12 categories — note view list omits `salary`, see §risk).
- Summary cards: Total spent + top-4 categories by spend (tone-colored).
- `LinkedFunctionSheetBadge` (inline) when expense is tagged to a booking — must survive.
- Receipt photo external link ("View receipt").
- Special UI: none (no kanban/calendar/wizard). Money is PKR via `fmtPKR` (`Rs. {rounded}` `en-PK`).

**6. Table or cards?**
- **Card list** (most-recent-first). Migration candidate to DataTable for the redesign.

**7. RECOMMENDED export columns**
`id, amount, category, subcategory, vendorName, description, spentDate, paymentMethod, photoUrl, bookingId, booking.customerName, createdByUserId, createdAt`.

### Bulk I/O — Expenses (import IS sensible: maps to POST create)
**Export columns:** as §7 above.
**Import field schema** (mirrors `CreateExpenseInput`):
| field | required | type |
|---|---|---|
| amount | yes | number (> 0) |
| category | yes | enum (ingredients, fuel, labour, salary, electricity, rentals, repairs, marketing, brokerage, tax, supplies, transport, other) |
| spentDate | yes | date (YYYY-MM-DD) |
| subcategory | no | string (≤80) |
| vendorName | no | string (≤120) |
| description | no | string (≤2000) |
| paymentMethod | no | enum (cash, bank_transfer, cheque, jazzcash, easypaisa, raast, ibft, card, other) |
| photoUrl | no | url |
| bookingId | no | number (must be vendor-owned booking; nullable) |

**9. Behaviors to preserve verbatim**
- Money: amounts rounded for display (`Math.round`), stored as decimal; `amount > 0` validation.
- `category === 'other'` → prompt for descriptive subcategory (Issue #42); do not silently bucket as "Other".
- Delete is **soft-delete only** (audit trail survives) — confirm copy says so.
- `bookingId` ownership verified server-side (vendor must own a linked Business); per-event P&L depends on the tag. Untagged = recurring overhead.
- Category enum is **craft-aware** (mandi/diesel/labour/brokerage/FBR tax) — keep labels.

**10. Migration risk notes**
- **Enum drift:** API type + `EXPENSE_CATEGORY_LABELS` include `salary` (13 categories) but the view's local `CATEGORIES` array (used for the form/filter) OMITS `salary` (12). A DataTable/import build MUST source categories from the API constant, not the view's local array, or `salary` rows are unfilterable/unloggable via UI.
- Card → table conversion loses the rich per-row layout (tone badge + receipt link + linked-sheet badge); preserve these as cell renderers.

---

## 2. TAX (Annual Tax Report)

**1. List/view component**
- `components/dashboard/mainScreens/tax/annual-tax-report-view.tsx` (`AnnualTaxReportView` + inline `KpiCard`).
- Not a list domain — it is a computed REPORT (read-only aggregate).

**2. lib/api module + key functions**
- `lib/api/tax.ts` → `TaxReportAPI` class.
- Functions: `getAnnualReport(year, basis)`, `pdfUrl(year, basis)`, `pdfBlob(year, basis)`. No create/update/delete.

**3. Backend router + controller**
- Router: `src/routes/taxReportRouter.js` — mounted at `/api/v1/tax` (loaders/routes.js:210).
- Controller: `src/controllers/taxReportController.js` (`getAnnualReport`, `getAnnualReportPdf`).
- Routes: `GET /annual-report`, `GET /annual-report.pdf`. Both `auth()`.

**4. Bulk import / export**
- Import: **absent** (and N/A — read-only/computed).
- Export: **present in a domain-specific sense** — single-button **"Export PDF"** (blob download via `pdfBlob`). This is NOT a generic CSV/bulk export, but it is the existing export affordance and MUST survive.

**5. Interactive elements to preserve**
- Primary action: **"Export PDF"** button (Download icon, spinner while downloading; disabled when no report).
- Two control `Select`s: **Year** picker (FY label e.g. "FY 2026-27" vs calendar), **Basis** picker (Fiscal Jul–Jun / Calendar Jan–Dec).
- KPI cards: Booking revenue, Sheet revenue (paid), Total expenses, Net P&L (tone good/bad).
- Two report panels: "Expenses by category" list + "Monthly breakdown" `<table>` (Month/Revenue/Bookings/Expenses).
- FBR-submitted-invoices badge (conditional).
- Disclaimer text (review with accountant; not a filed return) — keep verbatim (compliance).
- Special UI: a real read-only `<table>` inside the Monthly panel.

**6. Table or cards?**
- KPIs are cards; Monthly breakdown is a real read-only `<table>`. Whole screen is a report, not a CRUD list.

**7. RECOMMENDED export columns** — N/A as a CSV list; the meaningful export is the existing PDF. If a CSV is ever added, the natural rows are the monthly breakdown: `monthLabel, revenue, bookingCount, expenses`, plus a category sheet `category, amount`.

### Bulk I/O — Tax
**import N/A** (read-only/computed report). Export = keep existing PDF button; optionally add CSV of monthly + category aggregates (no create endpoint to mirror).

**9. Behaviors to preserve verbatim**
- Pakistani fiscal year default (1 Jul → 30 Jun); "FY2026" = 1 Jul 2026 → 30 Jun 2027; `currentFiscalYear()` logic (month ≥ Jul → current year, else prior).
- Basis toggle changes year-label rendering (FY `YY-YY` vs plain year).
- PDF filename pattern: `annual-tax-report-{year}-{basis}.pdf`.
- Money via `fmtPKR` (`Rs. {rounded}` `en-PK`); Net P&L sign drives Profit/Loss tone.
- Compliance disclaimer must remain.

**10. Migration risk notes**
- Lowest-risk redesign (pure presentational). Keep the FY/basis selectors and PDF button wired exactly; the year-list is computed from `currentFiscalYear()` — don't hardcode.
- Do not turn this into an editable list; it has no mutations.

---

## 3. BROKERS (Broker directory + Commission ledger)

**1. List/view component**
- `components/dashboard/mainScreens/brokers/brokers-view.tsx` (2258 lines, the heaviest in the cluster).
- Top-level `BrokersView` = a `Tabs` shell with TWO tabs:
  - `CommissionsTab` (default) — per-event commission ledger.
  - `BrokersTab` — broker directory.
- Sub-components (all inline in same file): `BrokerCard`, `BrokerDialog`, `CommissionCard`, `CommissionDialog`, `PaymentDialog`, `DisputeDialog`, `VoidDialog`.

**2. lib/api module + key functions**
- `lib/api/brokers.ts` → `BrokerAPI` class.
- Broker fns: `list(filters)`, `get(id)`, `create(body)`, `update(id, body)`, `remove(id)`.
- Commission fns: `listCommissions(filters)`, `getCommission(id)`, `createCommission(body)`, `updateCommission(id, body)`, `recordPayment(id, body)`, `transitionCommission(id, body)`, `removeCommission(id)`, `outstandingSummary(filters)`.
- Display maps: `BROKER_TYPE_LABELS`, `COMMISSION_STATUS_LABELS`, `COMMISSION_PAYMENT_METHOD_LABELS`, `COMMISSION_STATUS_TONES`.
- Also calls `axiosInstance.get('/api/v1/businesses/user-business')` directly for the business picker.

**3. Backend router + controller**
- Router: `src/routes/brokerRouter.js` — mounted at `/api/v1/brokers` (loaders/routes.js:147).
- Controller: `src/controllers/brokerController.js`.
- Helpers: `src/utils/brokerHelpers.js` (`computeCommission`, `applyCommissionPayment`, `commissionStateTransition`).
- Commission routes: `/commissions/outstanding-summary`, `/commissions` (GET/POST), `/commissions/:id` (GET/PATCH/DELETE), `/commissions/:id/payment`, `/commissions/:id/transition`. Broker routes: `/` (GET/POST), `/:id` (GET/PATCH/DELETE). All `auth()`.

**4. Bulk import / export**
- Import: **absent.**
- Export: **absent.**

**5. Interactive elements to preserve**
- Tabs: **Commissions** / **Brokers** (icon + label triggers).
- **Brokers tab:**
  - Primary action: **"Add broker"**.
  - Summary cards: Active / Inactive / Types count.
  - Type filter pills (rishta, hall_broker, wedding_planner, …) + "Active only" toggle pill + debounced search `Input`.
  - `BrokerCard` per row → **Edit**, **Remove** (ghost) buttons; `tel:` phone link; CNIC/NTN display (CNIC auto-hyphenated).
  - `BrokerDialog` (add/edit) — large form: business, name, brokerType, agency, contactPerson, phone, whatsapp, address, cnic, ntn, defaultCommissionPct (≤50), defaultCommissionFlat, bankName, bankAccountNumber, jazzcash, easypaisa, notes, isActive (edit only). `Checkbox` for Active.
  - `AlertDialog` — broker soft-delete confirm.
- **Commissions tab:**
  - Primary action: **"Accrue commission"**.
  - Outstanding-by-broker banner (amber, grandTotal owed + per-broker breakdown w/ overdue counts).
  - Status filter pills (all, pending, partially_paid, paid, overdue, disputed, void) with counts + From/To date inputs + clear button.
  - `CommissionCard` per row: status badge, overdue badge / "Due in Nd" badge, math-breakdown strip (Booking × pct OR Flat = amount), paid/outstanding progress bar, dispute reason banner, `LinkedFunctionSheetBadge`, `tel:` link. Action buttons: **Record payment** (CheckCircle2), **Dispute** (AlertTriangle), **Void** (XCircle), **Remove** (Trash2, ghost).
  - `CommissionDialog` (accrue) — business, broker Select (auto-fills defaults), one-off broker name, accruedDate, dueDate, commissionType (percentage/flat), commissionPct, commissionFlat, bookingAmountSnapshot, description; **live commission preview**.
  - `PaymentDialog`, `DisputeDialog`, `VoidDialog` (status-transition dialogs), `AlertDialog` (commission delete confirm).
- Special UI: **commission ledger** with payment progress bars + **state-machine transitions** (the most complex UI in this cluster). NOT a kanban/calendar but a stateful ledger.

**6. Table or cards?**
- **Card lists** in both tabs (no `<table>`). Heaviest card layouts in the cluster.

**7. RECOMMENDED export columns**
- **Brokers:** `id, businessId, name, brokerType, agencyName, contactPerson, phoneNumber, whatsappNumber, address, cnic, ntn, defaultCommissionPct, defaultCommissionFlat, bankName, bankAccountNumber, jazzcashNumber, easypaisaNumber, notes, isActive, createdAt`.
- **Commissions:** `id, brokerId, brokerNameSnapshot, brokerTypeSnapshot, bookingId, bookingAmountSnapshot, commissionType, commissionPct, commissionFlat, commissionAmount, amountPaid, status, accruedDate, dueDate, lastPaymentVia, lastPaymentRef, fullyPaidAt, description, createdAt`.

### Bulk I/O — Brokers
**Export columns:** as §7 (separate sheets for brokers vs commissions).
**Import — Brokers** (mirrors `CreateBrokerInput`):
| field | required | type |
|---|---|---|
| businessId | yes | number (positive; vendor-owned) |
| name | yes | string (≤160) |
| brokerType | no (defaults rishta) | enum (rishta, hall_broker, wedding_planner, hotel_concierge, decor_referral, photographer_referral, caterer_referral, transport_referral, social_influencer, other) |
| agencyName | no | string (≤200) |
| contactPerson | no | string (≤120) |
| phoneNumber | no | string (≤30) |
| whatsappNumber | no | string (≤30) |
| address | no | string (≤500) |
| cnic | no | string (≤20) |
| ntn | no | string (≤20) |
| defaultCommissionPct | no | number (0–50) |
| defaultCommissionFlat | no | number (0–100,000,000) |
| bankName | no | string (≤100) |
| bankAccountNumber | no | string (≤40) |
| jazzcashNumber | no | string (≤30) |
| easypaisaNumber | no | string (≤30) |
| notes | no | string (≤5000) |
| isActive | no | boolean |

**Import — Commissions** (mirrors `CreateCommissionInput`) — viable but riskier (status/payment derived server-side; import only the accrual, never amountPaid/status):
| field | required | type |
|---|---|---|
| businessId | yes | number (positive) |
| accruedDate | yes | date |
| commissionType | yes | enum (percentage, flat) |
| brokerId | no | number (positive) |
| brokerNameSnapshot | no | string (≤160; required if no brokerId) |
| bookingId | no | number (positive) |
| dueDate | no | date |
| commissionPct | no | number (0–50; for percentage) |
| commissionFlat | no | number (0–100,000,000; for flat) |
| bookingAmountSnapshot | no | number (0–500,000,000; basis for pct) |
| description | no | string (≤5000) |

**9. Behaviors to preserve verbatim**
- **Commission state machine** (`commissionStateTransition` in brokerHelpers.js): statuses pending / partially_paid / paid / disputed / void / overdue. Transitions are validated server-side; UI must not invent illegal transitions.
- **Payment applier** (`applyCommissionPayment`): pure-function; auto-transitions to `paid` on full settlement; row-locked inside a SQL transaction (`LEDGER_PAYMENT_ROW_LOCK`, default on) to prevent double-tap lost-payment drift (WW-190). Never write amountPaid from the client.
- **Money math** (`computeCommission`): `percentage` → `bookingAmountSnapshot × commissionPct / 100`; `flat` → `commissionFlat`. pct capped 0–50. Server is source of truth for `commissionAmount`.
- **Immutability rules:** cannot DELETE a `paid` commission ("ledger immutable — move to disputed first"); cannot edit commission math on a `paid`/non-editable status; editing math that drops below already-paid is refused (WW preserves A/P integrity).
- **fullyPaidAt** stamped only on FIRST settlement (WW-152) — re-entering `paid` must not overwrite it.
- **Snapshots:** `brokerNameSnapshot` / `brokerTypeSnapshot` / `bookingAmountSnapshot` are point-in-time copies — keep them; don't re-resolve live broker name.
- Default-commission auto-fill: selecting a broker in the accrue dialog pre-fills pct/flat from broker defaults.
- Broker soft-delete preserves commission history. CNIC display auto-hyphenated (13-digit → `XXXXX-XXXXXXX-X`).
- Craft-aware broker types (rishta / hall broker / hotel concierge etc.) — keep labels.

**10. Migration risk notes**
- **Highest-risk domain in the cluster.** 2258-line file, two tabs, 7 dialogs, a state machine, a payment applier, and a live-preview calculator. Restyling must NOT alter the transition guards or which action buttons show per status (e.g. Record payment hidden on paid/void; Void hidden on paid/void; Remove hidden on paid).
- DataTable migration is non-trivial: each commission card carries a progress bar + math strip + multi-action footer; brokers carry contact + rails + default-rate columns. Consider expandable rows.
- Business picker depends on a side call to `/businesses/user-business`; preserve.
- Bulk export of commissions must respect that money fields are server-computed (export read-only snapshot values; never round-trip them as writable).

---

## 4. BILLING (Plan & subscription)

**1. List/view component**
- `components/dashboard/mainScreens/billing/billing-view.tsx` (`BillingView`, single file, ~160 lines).
- Not a CRUD list — a 3-tier PRICING GRID (Free "Khata Lite" / Pro "Business" / Premium "Growth").

**2. lib/api module + key functions**
- `lib/api/subscription.ts` → `SubscriptionAPI` class.
- Vendor fns used by this view: `getMyPlan()`, `requestUpgrade(tier)`.
- Also exports (super-admin, not used in this view): `listUpgradeRequests()`, `activate(userId, months)`, `decline(userId, reason)`.

**3. Backend router + controller**
- Router: `src/routes/subscriptionRouter.js` — mounted at `/api/v1/subscriptions` (loaders/routes.js:65).
- Controller: `src/controllers/subscriptionController.js` (`getMyPlan`, `requestUpgrade`, `listUpgradeRequests`, `activateUpgrade`, `declineUpgrade`).
- Routes: `GET /me`, `POST /request-upgrade`, plus admin `GET /admin/upgrade-requests`, `POST /admin/:userId/activate`, `POST /admin/:userId/decline`.

**4. Bulk import / export**
- Import: **absent** (and N/A — fixed 3-tier catalog, not user rows).
- Export: **absent** (and N/A).

**5. Interactive elements to preserve**
- Primary action per card: **"Upgrade to {plan}"** button (spinner while busy; disabled while another upgrade pending) → `requestUpgrade(tier)`.
- Disabled states: **"Current plan"** (current tier), **"Included below your plan"** (downgrade), **"Requested"** (pending).
- Pending-upgrade banner (amber) when `pendingUpgradeTier` set.
- "Your plan" ribbon on the current tier card.
- Tier icons (Sparkles/Star/Crown) + highlights (Check) + caps (X) lists.
- Trust copy: "We never take a cut of your bookings — ever." + "indicative" pricing note — keep verbatim (brand/legal promise).
- Special UI: none (no dialog/sheet; upgrade is a direct POST + toast).
- Flag: `NEXT_PUBLIC_BILLING` (default OFF) — feature-gated screen.

**6. Table or cards?**
- **Card grid** (3 pricing cards). Stays cards (pricing UI), do not convert to DataTable.

**7. RECOMMENDED export columns** — N/A (catalog, not data rows).

### Bulk I/O — Billing
**import N/A** (read-only catalog + single upgrade-intent action; no list of user-owned rows). Export N/A. The super-admin upgrade-requests queue (separate screen, not this view) is where any tabular export would belong, not here.

**9. Behaviors to preserve verbatim**
- No payment integration yet (D7) — upgrade only registers INTENT; team follows up. Button copy/toast must keep this expectation ("we'll review it and notify you when it's active").
- Tier ranking (`free:0, pro:1, premium:2`) drives current/downgrade/upgrade button logic.
- Money: `fmtPrice` → "Free" for 0, else `Rs {n}/mo` + "indicative" suffix.
- "Never take a cut" trust statement is load-bearing brand copy — preserve.
- Flag-gated (`NEXT_PUBLIC_BILLING`).

**10. Migration risk notes**
- Low risk; presentational. Preserve the four mutually-exclusive button states (current / downgrade / pending / upgradeable) — easy to break during a button restyle.
- This view has no bulk I/O surface to add — note explicitly in the plan so it isn't force-fitted.

---

## 5. REVENUE (Platform revenue & payouts — super-admin)

**1. List/view component**
- `components/dashboard/mainScreens/revenue/revenue-view.tsx` (`RevenueView`, single file).
- **Super-admin-only** (redirects non-`isSuperAdmin` users to `/dashboard`).
- Contains TWO real `<table>`s: "Revenue by Vendor" + "Vendor Payouts".

**2. lib/api module + key functions**
- `lib/api/analytics.ts` → `AnalyticsAPI`: `getPlatformRevenue(dateRange, start, end)`, `getRevenueTrends('this_year')`.
- `lib/api/dashboard.ts` → `PaymentsAPI.getAllPayouts({ limit })` (returns payouts + pagination + summary).
- Read-only/computed — no create/update/delete/transition from this view.

**3. Backend router + controller**
- Router: `src/routes/analyticsRouter.js` — mounted at `/api/v1/analytics` (loaders/routes.js:252). Controller: `src/controllers/analyticsController.js` (platform revenue + trends).
- Payouts served by the payments domain: `src/routes/paymentRouter.js` (`/api/v1/payments`) → `paymentController` (getAllPayouts). Payout transitions/management live in the payments domain, not here.

**4. Bulk import / export**
- Import: **absent.**
- Export: **absent.**

**5. Interactive elements to preserve**
- `DashboardDateFilter` (date-range selector incl. custom start/end) — drives revenue queries.
- KPI cards: Total Revenue, Platform Fees, Vendor Payouts, Pending Payouts (`KpiCard`, currency).
- `RevenueBarChart` (revenue trends, this_year).
- "Revenue by Vendor" `<table>`: Vendor (avatar), Type badge, Revenue, Platform Fee, Net Payout, Transactions.
- "Vendor Payouts" `<table>`: Vendor, Business, Amount, Fee, Net Payout, Status badge, Date — with a status `Select` filter (all/completed/scheduled/hold/failed). Filtering is client-side (`filteredPayouts`).
- `Heading` + `Separator` + `PageContainer` layout wrappers.
- Special UI: charts + two read-only data tables; status-color map for payout badges.

**6. Table or cards?**
- **Real `<table>`s** (two of them) + KPI cards + a bar chart. Already tabular — natural DataTable target, but the data is READ-ONLY analytics (no row mutations here).

**7. RECOMMENDED export columns**
- **Revenue by Vendor:** `vendorId, vendorName, vendorType, revenue, fees, payout, transactions`.
- **Vendor Payouts:** `id, vendor.fullName, business.name, originalAmount, platformFee, payoutAmount, status, createdAt`.

### Bulk I/O — Revenue
**import N/A** (read-only/computed analytics + payout records owned by the payments domain — no create endpoint to mirror here). Export IS sensible as CSV of the two tables (vendor-revenue rollup + payouts list) since they are already tabular; export only — never import.

**9. Behaviors to preserve verbatim**
- **Access guard:** super-admin only; non-admins redirected. Must remain after redesign.
- Money via `Intl.NumberFormat('en-PK', PKR, 0 fraction)` (`formatPKR`).
- Payout status color map (completed=emerald, scheduled=yellow, failed=red, hold=orange) + client-side status filter.
- Payout management/transitions are NOT here — do not add mutation actions to this analytics view; payouts are administered in the payments domain.
- Date-range + custom range drives both revenue + trends fetches (Promise.all); payouts fetch is resilient (`.catch` → empty).

**10. Migration risk notes**
- These tables are analytics READ models — a DataTable migration is fine, but must NOT introduce edit/delete actions (payout lifecycle is owned elsewhere). Export-only.
- Keep the super-admin redirect guard intact; it runs before render.
- Bar chart + KPI cards + date filter are shared dashboard components (`../dashboard/components/*`, `globalComponents/dashboard-date-filter`) — restyle centrally, not locally, to avoid divergence.

---

## Cluster summary table

| domain | listView | api | import | export | table/cards | importable |
|---|---|---|---|---|---|---|
| expenses | expenses/expenses-view.tsx | lib/api/vendorExpenses.ts | absent | absent | cards | yes |
| tax | tax/annual-tax-report-view.tsx | lib/api/tax.ts | absent | PDF-only (existing) | report (KPI cards + table) | no |
| brokers | brokers/brokers-view.tsx | lib/api/brokers.ts | absent | absent | cards (2 tabs) | yes |
| billing | billing/billing-view.tsx | lib/api/subscription.ts | absent | absent | card grid | no |
| revenue | revenue/revenue-view.tsx | lib/api/analytics.ts (+dashboard.ts) | absent | absent | tables | no |
