# Recon — Compliance Cluster

Ground-truth audit for the visual redesign (ClickUp/Slack-style SaaS, switchable themes, Iconly icons, full mobile responsiveness, bulk import/export on every list domain).

Cluster domains: **drone-noc, halal-certs, generator-fuel, collaborations, reliability**.

Frontend root: `C:/Projects/Event Management Systen/ems-v0`
Backend root: `C:/Projects/Event Management Systen/event-planner-api`

> Cluster-wide fact: **NO bulk import dialog and NO bulk export button exists in any of these five domain folders.** Globbing `*import*`, `*export*`, `*table*`, `*-table-actions*` across all five returned zero files. All five lists are **card lists**, none use `<table>` / tanstack. All edit/create flows go through inline `react-hook-form` + `zod` dialogs defined in the same view file (no separate dialog files).

---

## 1. drone-noc

### Files
- **Main list/view:** `components/dashboard/mainScreens/drone-noc/drone-noc-view.tsx` (single file; sub-components `PermitCard`, `PermitDialog`, `ReasonDialog` are inline — no separate table component).
- **lib/api module:** `lib/api/droneNoc.ts` (note camelCase filename, not `drone-noc.ts`).
  - Exported class `DroneNocAPI`: `list(filters)`, `get(id)`, `create(body)`, `update(id, body)`, `transition(id, {to, statusReason})`, `remove(id)`, `upcoming()`.
  - Exported maps: `PERMIT_TYPE_LABELS`, `PERMIT_AUTHORITY_LABELS`, `PERMIT_STATUS_LABELS`, `PERMIT_STATUS_TONES`.
- **Backend router:** `event-planner-api/src/routes/droneNocRouter.js` (mounted at `/api/v1/drone-noc`).
- **Backend controller:** `event-planner-api/src/controllers/droneNocController.js`.
- **Model:** `event-planner-api/src/models/droneNOCPermit.js`.

### Bulk I/O
- **Import:** absent. **Export:** absent.

#### Recommended EXPORT columns
`id, businessId, bookingId, permitType, issuingAuthority, referenceNumber, droneModel, droneRegNumber, droneWeightKg, pilotName, pilotLicense, eventDescription, venueAddress, appliedDate, validFrom, validUntil, status, statusReason, renewalLeadTimeDays, feePaid, permitPhotoUrl, notes, approvedAt, rejectedAt, cancelledAt, createdAt`

#### Recommended IMPORT schema (mirrors `CreatePermitInput`)
| field | required | type |
|---|---|---|
| businessId | yes | int (positive) |
| permitType | yes | enum: single_event \| blanket_annual \| provincial_home_dept \| police_intimation |
| issuingAuthority | yes | enum: pcaa \| home_dept_pb \| home_dept_sindh \| home_dept_kpk \| home_dept_balochistan \| police_station \| other |
| referenceNumber | yes | string (max 80) |
| validFrom | yes | date (YYYY-MM-DD) |
| validUntil | yes | date (YYYY-MM-DD) |
| bookingId | no | int |
| droneModel | no | string (max 80) |
| droneRegNumber | no | string (max 60) |
| droneWeightKg | no | number (0–25) |
| pilotName | no | string (max 120) |
| pilotLicense | no | string (max 60) |
| eventDescription | no | string (max 300) |
| venueAddress | no | string (max 500) |
| appliedDate | no | date |
| renewalLeadTimeDays | no | int (0–365, default 30) |
| feePaid | no | number (PKR, 0–10,000,000) |
| permitPhotoUrl | no | string/URL (max 500) |
| notes | no | string (max 5000) |

importable = **yes**.

### Interactive inventory (must survive)
- Primary action button: **"Log permit"** (`Plus` icon, top-right + empty-state CTA).
- Per-card status-dependent action buttons: **Approve** (`CheckCircle2`), **Reject** (`Ban`), **Cancel** (`XCircle`), **Resubmit** (`RefreshCw`), **Edit** (`Pencil`, ghost), **Remove** (`Trash2`, ghost, rose).
- Filter pills: type pills (All / single_event / blanket_annual / provincial_home_dept / police_intimation) with counts.
- Status `Select` dropdown (all statuses).
- Search `Input` (ref / drone / pilot / venue), 300ms debounce.
- Dialogs/sheets:
  - `PermitDialog` (add + edit, shared) — large multi-section form.
  - Approve confirm `AlertDialog`.
  - `ReasonDialog` (reject) — reason Textarea required.
  - `ReasonDialog` (cancel) — reason Textarea required.
  - Remove `AlertDialog`.
- Special UI: **Upcoming banner** (pending + expiring-soon + booking-linked, top-6 grid with countdown). **Summary cards** row (6 status counts). Per-card validity strip with day countdown + drone weight chip + venue chip.

### Behaviors to preserve verbatim
- Status state machine: `pending → approved → expiring_soon → expired`; side-tracks `rejected` and `cancelled`; `resubmit` returns rejected/cancelled → `pending`. Transitions go through `DroneNocAPI.transition`, not update.
- Reject/Cancel require a non-empty reason (`statusReason`); enforced client-side (`toast.error('Reason required')`).
- Day-countdown coloring: rose if expired, amber if `dueIn <= renewalLeadTimeDays`, else emerald.
- Money: `feePaid` PKR formatted with `Rs.` + `en-PK` locale, rounded.
- Craft-aware labels: photographer-specific PCAA / provincial Home Dept / police-intimation language; drone weight cap **25 kg** (PCAA commercial). Ref# rendered monospace; UAV reg monospace.
- Delete is soft (audit trail preserved — dialog says so).

### Migration risk notes
- Single 1330-line file with three inline dialogs; heavy zod schema. Restyle must keep the `permitSchema` enum unions intact (they drive both form and import).
- Status-dependent button visibility logic is non-trivial (which buttons render per status) — preserve exactly.
- Money/date/countdown helper fns (`fmtPKR`, `fmtDate`, `daysFromNow`) are duplicated per-domain; safe to centralize but verify locale.

---

## 2. halal-certs

### Files
- **Main list/view:** `components/dashboard/mainScreens/halal-certs/halal-certs-view.tsx` (inline `CertCard`, `CertDialog`, `RevokeDialog`, `RenewDialog`).
- **lib/api module:** `lib/api/halalCerts.ts` (camelCase).
  - Class `HalalCertAPI`: `list(filters)`, `get(id)`, `create(body)`, `update(id, body)`, `transition(id, {to, revokedReason?, newExpiryDate?, newCertNumber?})`, `remove(id)`, `expiring()`.
  - Maps: `ISSUING_AUTHORITY_LABELS`, `CERT_STATUS_LABELS`, `CERT_STATUS_TONES`.
- **Backend router:** `event-planner-api/src/routes/halalCertRouter.js` (mounted `/api/v1/halal-certs`).
- **Backend controller:** `event-planner-api/src/controllers/halalCertController.js`.
- **Model:** `event-planner-api/src/models/halalCertificate.js`.

### Bulk I/O
- **Import:** absent. **Export:** absent.

#### Recommended EXPORT columns
`id, businessId, supplierId, supplierNameSnapshot, certNumber, issuingAuthority, itemDescription, issuedDate, expiryDate, status, renewalLeadTimeDays, certPhotoUrl, notes, revokedAt, revokedReason, createdAt`

#### Recommended IMPORT schema (mirrors `CreateCertInput`)
| field | required | type |
|---|---|---|
| businessId | yes | int (positive) |
| certNumber | yes | string (max 60) |
| issuingAuthority | yes | enum: pha \| shdb_sindh \| kpk_halal \| sfa_pakistan \| sanha \| juh_india \| muis \| esma \| manual_attestation \| other |
| itemDescription | yes | string (max 300) |
| issuedDate | yes | date (YYYY-MM-DD) |
| expiryDate | yes | date (YYYY-MM-DD) |
| supplierId | no | int |
| supplierNameSnapshot | no | string (max 200) |
| renewalLeadTimeDays | no | int (0–365, default 30) |
| certPhotoUrl | no | string/URL (max 500) |
| notes | no | string (max 5000) |

importable = **yes**.

### Interactive inventory (must survive)
- Primary action button: **"Add cert"** (`Plus`, top-right + empty-state CTA).
- Per-card buttons: **Renewal received** / **Mark pending renewal** (`RefreshCw`, toggles by status), **Revoke** (`Ban`, rose), **Edit** (`Pencil` ghost), **Remove** (`Trash2` ghost rose).
- Status filter pills (All / active / expiring_soon / expired / pending_renewal / revoked) with counts.
- Authority `Select` dropdown (all 10 authorities).
- Search `Input` (cert# / item / supplier), 300ms debounce.
- Dialogs:
  - `CertDialog` (add + edit, shared).
  - `RevokeDialog` — reason Textarea required (terminal action).
  - `RenewDialog` — dual-mode: "Mark pending renewal" (no input) vs "Renewal received" (new cert# + new expiry inputs).
  - Remove `AlertDialog`.
- Special UI: **Expiring banner** (top, amber/rose, top-6 with days-to-expiry). **Summary cards** row (5 status counts).

### Behaviors to preserve verbatim
- Status auto-computes from expiry on every read (`active → expiring_soon → expired`); **manual revoke / pending_renewal override** the auto-status. Per the view header comment, backend recomputes on read.
- Revoke is **terminal**; requires non-empty `revokedReason`.
- Renew flow: `pending_renewal → active` carries optional `newCertNumber` + `newExpiryDate` (reactivates the row).
- Countdown coloring threshold = **30 days** hard-coded in card (`dueIn <= 30` amber) — distinct from per-row `renewalLeadTimeDays` used for banner flagging.
- Craft-aware: caterer-specific; PK authorities (PHA / Sindh / KPK / HFA Federal) + international (SANHA / JUH / MUIS / ESMA) + supplier attestation. Cert# monospace.
- Soft delete (history preserved for audit).

### Migration risk notes
- `RenewDialog` is the only **dual-mode** dialog in the cluster (behavior flips on `cert.status === 'pending_renewal'`) — easy to break on restyle.
- Two different "expiring" thresholds (30d card vs `renewalLeadTimeDays` banner) — do not conflate.

---

## 3. generator-fuel

### Files
- **Main list/view:** `components/dashboard/mainScreens/generator-fuel/generator-fuel-view.tsx` (inline `EntryCard`, `EntryDialog`).
- **lib/api module:** `lib/api/generatorFuel.ts` (camelCase).
  - Class `GeneratorFuelAPI`: `list(filters)`, `tanks()`, `burnRate(filters)`, `create(body)`, `update(id, body)`, `remove(id)`. **No `transition`** (no status machine).
  - Maps: `ENTRY_TYPE_LABELS`, `FUEL_TYPE_LABELS`, `ENTRY_TYPE_TONES`.
  - Note: view's delete calls raw `axiosInstance.delete('/api/v1/generator-fuel/:id')` directly, not `GeneratorFuelAPI.remove` (cosmetic inconsistency to preserve/clean during migration).
- **Backend router:** `event-planner-api/src/routes/generatorRouter.js` (mounted `/api/v1/generator-fuel`).
- **Backend controller:** `event-planner-api/src/controllers/generatorController.js`.
- **Model:** `event-planner-api/src/models/generatorFuelLog.js`.

### Bulk I/O
- **Import:** absent. **Export:** absent.

#### Recommended EXPORT columns
`id, businessId, bookingId, generatorIdentifier, type, fuelType, litres, tankBeforeLitres, tankAfterLitres, costPerLitre, totalCost, supplierName, deliveryRef, runHours, odometerHours, loadEstimate, maintenanceNote, notes, photoUrl, occurredAt, createdAt`

#### Recommended IMPORT schema (mirrors `CreateEntryInput`)
| field | required | type |
|---|---|---|
| businessId | yes | int (positive) |
| type | yes | enum: delivery \| consumption \| tank_reading \| maintenance |
| litres | yes | number (0–50,000) |
| generatorIdentifier | no | string (max 80, default "Main") |
| fuelType | no | enum: diesel \| petrol \| lpg \| other (default diesel) |
| costPerLitre | no | number (0–5,000) — delivery only |
| totalCost | no | number (0–50,000,000) — delivery only |
| supplierName | no | string (max 160) — delivery |
| deliveryRef | no | string (max 100) — delivery |
| runHours | no | number (0–100,000) — consumption |
| odometerHours | no | number (0–1,000,000) — tank_reading/maintenance |
| loadEstimate | no | string (max 60) — consumption |
| maintenanceNote | no | string (max 500) — maintenance |
| bookingId | no | int — consumption |
| occurredAt | no | datetime (defaults to now) |
| notes | no | string (max 5000) |

importable = **yes** — but see risk note: import **must replay tank deltas in chronological order** (server auto-rolls tank level forward) and `consumption` cannot exceed current tank level.

### Interactive inventory (must survive)
- Primary action button: **"Log entry"** (`Plus`, top-right + empty-state CTA).
- Per-card button: **Remove** (`Trash2` ghost rose) — only action (entries are immutable except delete; no edit button rendered).
- Type filter pills (All / delivery / consumption / tank_reading / maintenance) with counts.
- Generator `Select` dropdown (shown only when `tanks.length > 1`).
- Date-range filters: From / To `Input[type=date]` + clear `XCircle` button.
- Dialogs:
  - `EntryDialog` (add only — **no edit dialog**) — **type-aware reshaping form**: fields appear/disappear based on selected `type` (delivery → cost/supplier/ref; consumption → runHours/loadEstimate/bookingId; tank_reading/maintenance → odometerHours; maintenance → maintenanceNote). Live delivery-cost preview block.
  - Remove `AlertDialog` (warns tank level is NOT auto-rewound on delete).
- Special UI: **Tank-status banner** (per-generator current litres + fuel type + last reading). **Summary cards** (Delivered litres+cost / Consumed litres / Entry count). Per-card **tank before → after delta strip** with signed +/− litres.

### Behaviors to preserve verbatim
- **Ledger semantics (no status machine):** every entry mutates a running tank level. Tank level **auto-rolls forward** from the latest reading per `generatorIdentifier` on create (`tankBeforeLitres → tankAfterLitres`).
- **Delete does NOT rewind the running tank level** (explicitly warned in delete dialog) — record a corrective `tank_reading` instead.
- `consumption.litres` cannot exceed current tank level (validation note in form).
- `tank_reading` semantics: `litres` field is "tank level after reading" (absolute), not a delta.
- Money: PKR (`fmtPKR`), litres (`fmtL`, en-PK). Delivery total = `totalCost` or `costPerLitre × litres`.
- Craft-aware: Pakistani load-shedding economics; PSO HSD ~Rs. 280–320/L hint; "bowser" supplier language.
- Soft delete.

### Migration risk notes
- The **type-aware reshaping form** is the trickiest UI in the cluster — conditional field blocks per `type` must be preserved exactly, plus the `useMemo` delivery-cost preview.
- This is a **ledger** domain: bulk import is order-sensitive (chronological replay) and tank-level side-effects make naive row-by-row import dangerous. Flag for special handling.
- View deletes via raw axios, not the API class — note for consistency.

---

## 4. collaborations

### Files
- **Main list/view:** `components/dashboard/mainScreens/collaborations/collaborations-view.tsx` (single component; inline send-form + two list cards, no sub-table component).
- **lib/api module:** `lib/api/collaborations.ts`.
  - Class `CollaborationsAPI`: `send(input)`, `incoming()`, `outgoing()`, `accept(id)`, `decline(id, reason?)`, `cancel(id)`.
- **Backend router:** `event-planner-api/src/routes/collaborationRouter.js` (mounted `/api/v1/collaborations`).
- **Backend controller:** `event-planner-api/src/controllers/collaborationController.js`.
- Flag-gated: `NEXT_PUBLIC_SUBCONTRACT` (shared with sub-contract ledger).

### Bulk I/O
- **Import:** absent. **Export:** absent.

#### Recommended EXPORT columns (outgoing + incoming invites)
`id, fromUserId, fromName, toUserId, toNameSnapshot, toPhone, toEmail, eventLabel, scope, agreedAmount, functionSheetId, status, declineReason, respondedAt, createdAt`

#### Recommended IMPORT schema (mirrors `SendCollabInput`)
| field | required | type |
|---|---|---|
| toContact (phone OR email) | yes | string — view splits into `toEmail` if it matches `/\S+@\S+\.\S+/`, else `toPhone` |
| toName | no | string |
| eventLabel | no | string |
| scope | no | string |
| agreedAmount | no | int (PKR, ≥ 0) |
| functionSheetId | no | int |

importable = **yes** (bulk-send invites). Note: import is "fire invites", not "load records" — each row triggers a send + match attempt; semantically a queued action, not a data load. Reasonable to support but flag the side-effect.

### Interactive inventory (must survive)
- Primary action button: **"Send invite"** (`Send` icon, in the send-invite card).
- Send-invite form inputs: Vendor name, Their phone or email *, Event, Agreed amount Rs, Scope (Textarea).
- Per-incoming-invite buttons (pending only): **Accept** (`Check`, emerald), **Decline** (`X`, rose).
- Per-outgoing-invite button (pending only): **Cancel invite** (`X`, rose).
- Special UI: **two-column layout** — "Invites to you" (incoming, `Inbox` icon) and "Invites you sent" (outgoing, `ArrowUpRight`). Status badges colored by `STATUS_TONE` (pending/accepted/declined/cancelled). "not on Wedding Wala yet" inline flag when `!toUserId`.
- No separate dialogs — the create flow is an inline card form, and accept/decline/cancel are direct button calls (no confirm dialog).

### Behaviors to preserve verbatim
- Status state machine: `pending → accepted | declined | cancelled`. Accept/decline available only to recipient on incoming pending; cancel only to sender on outgoing pending.
- Contact parsing: `isEmail()` regex routes a single contact field to `toEmail` vs `toPhone`.
- **Match semantics:** on send, backend returns `matched` boolean → toast "Invite sent + vendor notified" vs "Invite saved (vendor not on Wedding Wala yet)". Off-platform invites are saved with `toUserId = null`.
- Money: `agreedAmount` tracked, **not collected** (payment is a later layer); `fmtPKR` rounds + en-PK. Note the view passes `amount: undefined` AND `agreedAmount` (legacy field kept).
- Decline reason supported by API (`decline(id, reason)`) but the view currently calls decline without a reason — preserve the API capability even though UI omits it.
- Flag-gated by `NEXT_PUBLIC_SUBCONTRACT`.

### Migration risk notes
- Inline send-form (not a dialog) — redesign may want to move it into a sheet/dialog, but the flag-gated mount and the `matched`/off-platform toasts must survive.
- Two parallel lists (incoming/outgoing) with different action sets — keep both.
- Bridal-gold theming (`text-bridal-gold-dark`) used here — relevant for the switchable-theme work.

---

## 5. reliability

### Files
- **Main list/view:** `components/dashboard/mainScreens/reliability/reliability-view.tsx` (single component; inline `BusinessReliabilityCard`). **Read-only / computed dashboard** — no create/edit/delete.
- **lib/api module:** `lib/api/reliability.ts`.
  - Class `ReliabilityAPI`: **`getMyScores()` only** (GET). No mutations.
  - Maps: `TIER_LABELS`, `TIER_TONES`, `BADGE_LABELS`.
- **Backend controller:** `event-planner-api/src/controllers/reliabilityController.js` (`getMyReliability`).
- **Backend route:** **not a dedicated router** — registered in `event-planner-api/src/routes/businessRouter.js` at `/my-reliability` (full path `/api/v1/businesses/my-reliability`), line ~113, wired to `reliabilityController.getMyReliability`.
- Underlying score computed by BK-100.6 (search-ranking reliability engine).

### Bulk I/O
- **Import:** N/A (read-only/computed domain — score is derived from reviews, disputes, completions, verification tier; nothing to import).
- **Export:** absent today. Export is technically possible (snapshot the computed scores) but low value; **recommend skipping** unless a "download my score report" is desired.

#### Recommended EXPORT columns (if score snapshot export is built)
`businessId, name, score, tier, badges, breakdown.effectiveRating, breakdown.ratingPts, breakdown.volumePts, breakdown.verificationPts, breakdown.completionPts, breakdown.disputePts, breakdown.completenessPts, inputs.avgRating, inputs.reviewCount, inputs.disputeCount, inputs.completionCount, inputs.cancellationCount, inputs.verificationTier, inputs.medianResponseHours`

importable = **no** (computed domain).

### Interactive inventory (must survive)
- **No action buttons, no dialogs, no filters, no search.** Pure read-only dashboard.
- Per-business card: score (X / 100, bridal-gold large numeral), tier badge, earned badges row (`Award` icon), effective rating.
- **Sub-score breakdown** list with `Progress` bars (6 components: Rating quality /35, Review volume /15, Verification tier /20, Completion rate /15, Dispute-free /10, Profile completeness /5).
- **Improvement suggestions** list ("+N pts", emerald, highest-leverage-first).
- Raw-inputs footer (reviews, avg rating, disputes, completed, cancelled, verification tier, median response).
- Empty state ("No businesses yet").

### Behaviors to preserve verbatim
- Score math is **server-computed (BK-100.6)** — frontend only renders. Sub-score `max` values (35/15/20/15/10/5 = 100) are display constants in the view and MUST match backend weights; do not alter.
- Bayesian-smoothed rating wording, tier ladder `newcomer → rising → trusted → premium → elite`, badge label map, median-response formatting (`< 1h → minutes`).
- Bridal-gold accent on the score numeral.

### Migration risk notes
- Lowest-risk to restyle (no mutations, no forms) but the **sub-score max constants are load-bearing** — they encode the backend weighting; keep in sync.
- This is the natural "card → keep as cards / dashboard widget" case; do **not** migrate to a DataTable.
- No bulk I/O — exclude from the import/export rollout (export optional, import N/A).

---

## Cluster summary table

| Domain | List view | lib/api | Backend router | Controller | Import | Export | UI shape | Importable |
|---|---|---|---|---|---|---|---|---|
| drone-noc | drone-noc-view.tsx | lib/api/droneNoc.ts | droneNocRouter.js | droneNocController.js | absent | absent | cards | yes |
| halal-certs | halal-certs-view.tsx | lib/api/halalCerts.ts | halalCertRouter.js | halalCertController.js | absent | absent | cards | yes |
| generator-fuel | generator-fuel-view.tsx | lib/api/generatorFuel.ts | generatorRouter.js | generatorController.js | absent | absent | cards (ledger) | yes (order-sensitive) |
| collaborations | collaborations-view.tsx | lib/api/collaborations.ts | collaborationRouter.js | collaborationController.js | absent | absent | cards (2-col) | yes (action, not data) |
| reliability | reliability-view.tsx | lib/api/reliability.ts | businessRouter.js (/my-reliability) | reliabilityController.js | absent | absent | cards (read-only) | no (computed) |
