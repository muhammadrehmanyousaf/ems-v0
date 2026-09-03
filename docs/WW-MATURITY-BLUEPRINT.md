# weddingwala.pk — Vendor OS Maturity Blueprint

> Living master spec. Goal: turn the vendor console from a set of thin, inconsistent
> screens into a **world-class, fully-mature Venue ERP for Pakistani venues** — so a
> hall/marquee/lawn owner never has to leave the system, never sees a dead button,
> and never loses a rupee. Grounded in a real audit of BOTH repos (`ems-v0` frontend +
> `ems-v0-backend`), not guesswork.

**Non-negotiable principles**
1. **Never-leave-the-system** — every job finishes in-context (drawer/inline), no dead-end redirects.
2. **Extreme simplicity** — a non-technical Pakistani venue owner operates it without training.
3. **Rock-solid financial integrity** — money is authoritative on the backend (ledger + audit); the UI only surfaces it. Never invent a parallel money calc on the client.
4. **Zero double-booking** — slot-level (subah/shaam/raat) enforcement, DB-guaranteed.
5. **Zero regression** — backend jest suites + frontend ratchet (121/0) + headed verify stay green on every change.
6. **One-system consistency** — shared components, not N divergent copies.

---

## 0. THE headline finding — the backend is far more mature than the frontend surfaces

A "booking" is **not one row**. It is a parent `Bookings` row + one `BookingDetails` row **per vendor/venue** + a fan of sidecar tables (installments, requirements, security deposit, space claims, holds, status history, settlement). The money model was deliberately split by the **WW-DIRECT-PAY overhaul** into *owed* vs *received*.

The create payload the backend **already accepts** (`POST /api/v1/bookings`):

- **Top-level:** `customerName*`, `customerPhone*`, `bookingDate*`, `bookingTime*`, `vendors[]*`, `customerEmail`, `guestCount`, `requestedGenderMode` (MIXED/MARDANA/ZENANA/SEGREGABLE), `eventCity` (travel surcharge), `serviceLocationMode` (at_vendor/at_customer_home/at_customer_plot/at_third_party) + address/notes, `pickupAddress`/`dropoffAddress`, `umbrellaId` (multi-function shaadi), `selectedBundledServices`, `estimatedDurationHours` + `closureOverride{ack,reason}` (22:00 PKT hall-closure law), `isOfflineBooking`.
- **Per vendor line (`vendors[]`):** `businessId*`, `packageId`, `menuId`, `subVenueId` (hall/lawn/floor — with server-side **SPACE_CONFLICT**), `resourceId`, `agreedAmount` (vendor-owned only), `specialRequests`, `numberOfDays` (1–31), `travelDistanceKm`, `vehicleQuantity`, `slotTemplateId`.

**What the frontend booking drawer captures today: ~7 fields** (name/phone/email/date/time/guests/package|amount). The model supports **~40**. *That gap — not missing backend — is the maturity problem.* Most module work is **surfacing + wiring existing backend power**, not net-new build.

> Corollary: `vendors[].totalAmount`/`downPayment` are **ignored** by the server — it recomputes both via `pricingService.computeCartPrice`. Never price on the client. Echo the server's figure back; never author it.

---

## 1. Cross-cutting foundations — build ONCE, use everywhere (do these first)

The single biggest consistency debt: there are **3 divergent booking-create drawers** (Bookings, Lead→Booking, Customer→Booking), plus separate lead/expense/etc. forms — all thin, all slightly different. The mature system has a **small set of shared building blocks**:

| Shared component | Replaces | Notes |
|---|---|---|
| **`<BookingForm>`** (full payload) | 3 booking drawers | venue→sub-venue cascade, package/menu, advance, add-ons, closure, umbrella; one source of truth; opened from bookings/lead/customer/chat/calendar, prefilled from context |
| **`<LeadForm>`** (venue/space aware) | lead create/edit | +venue/sub-venue, assigned rep, next-follow-up+reminder |
| **`<PaymentRecorder>`** | record-payment drawer | paymentType (down/remaining/full) + method enum + optional claimId; drives `POST /bookings/:id/record-payment` |
| **`<AttachmentUploader>`** | (missing) | multer/sharp/file-type backend exists; contracts/CNIC/media; used by booking, customer, chat, function-sheet |
| **`<EntityDrawer>`** | ad-hoc drawers | consistent quick-view (info + actions + "full detail" link) for lead/customer/booking |
| **Sidebar floating "+"** | (missing) | quick-create Lead/Booking from anywhere |

**Design language is already locked** (champagne shell, `docs/design-samples/`) — these components must reuse it. No new visual system.

---

## 2. Module-by-module maturity spec (all 10)

Legend per module: **Now** (current) · **Gaps** · **Pain (PK vendor)** · **Advanced use-cases** · **Target** · **Backend reality**.

### M1 — Leads (list + detail + drawer)
- **Now:** list paginated; create/edit drawer; lead→booking convert; row-click opens a detail **page**. Call/WhatsApp inline.
- **Gaps:** no quick-view **drawer** on row-click; no lead scoring; no next-follow-up reminder engine; no venue/sub-space attribution; no assigned rep; no WhatsApp templates (one hardcoded greeting); stage only editable via full drawer.
- **Pain:** vendor can't triage fast; forgets follow-ups; can't tell which venue/hall a lead is for.
- **Advanced:** lead score/qualification; **next-follow-up date + reminder** (Automation engine already exists — `lead_followup` kind); venue+sub-venue on lead; assigned sales rep; WA/SMS templates (reuse chat `QUICK_LEAD`); source→conversion analytics; dedupe by phone; one-tap stage (kanban).
- **Target:** row-click → quick **drawer** (details + stage pills + activity + actions: Edit, Convert to Booking, WhatsApp-template, Set follow-up); "full profile" link to the page for the 360 view. Both coexist (approved).
- **Backend reality:** verify Lead model has `businessId` (yes, we set it), `subVenueId`?, `assignedToUserId`?, `nextFollowUpAt`? — **TODO backend-verify** (agent failed on rate-limit; re-audit after reset).

### M2 — Lead creation form
- **Now:** name/phone/WA/email/event/date/budget/guests/source/stage/note.
- **Gaps:** no **Venue** select, no **Sub-space** select, no assigned rep, no next-follow-up+reminder.
- **Target:** add venue dropdown → dependent sub-venue (from `venueSpacesApi` tree), preferred slot (morning/evening/night), catering pref (in-house/external), decor pref, assigned rep, next-follow-up date/time (→ reminder).
- **Backend reality:** `LeadAPI.create` already takes `businessId`. sub-venue/rep/follow-up fields — **TODO backend-verify + add columns if missing**.

### M3 — Booking creation (the shared `<BookingForm>`)
- **Now:** thin drawer (7 fields), 3 divergent copies.
- **Gaps:** no sub-venue/space, no menu, **no advance/downPayment capture**, no add-ons, no attachments, no gender-mode, no eventCity/duration, no umbrella.
- **Target (full payload):**
  1. Customer (name*/phone*/email) — prefill from lead/customer/chat.
  2. Event: date*, **slot** (from BusinessSlotTemplate), guests, gender-mode, event type/sitting, eventCity.
  3. **Venue → Sub-venue cascade** (`subVenueId`) — live availability + SPACE_CONFLICT feedback.
  4. Package + Menu pickers; per-head vs fixed shown; server-priced (read-only total).
  5. **Advance** (downPayment) + method; **security deposit**.
  6. Add-ons / requirements (`setupJson`: VIP sofas, round tables, food stalls; `dietaryJson` billable).
  7. Attachments (contract/CNIC).
  8. 22:00 closure acknowledgement when `estimatedDurationHours` crosses cutoff.
- **Backend reality:** ALL of the above already in the create payload/validator. Pricing is server-side (`pricingService`). **This is a frontend surfacing job** — plus align with the `feat/ww-direct-pay-and-booking-overhaul` branch (advance = owed, not received).

### M4 — Booking detail page
- **Now:** record-payment drawer + Confirm/Cancel (status-gated) done this session; localStorage private note.
- **Gaps:** no Edit/Reschedule/Invoice/Reminder; no attachments; **no installment schedule UI**; note is local-only (not backend, lost across devices); no "new function sheet".
- **Advanced / Target:**
  - **Action bar:** Edit booking · Reschedule (reprice-aware) · Download Invoice (PDF — `pdfkit` exists) · Send reminder (WA/email) · Cancel (refund per policy).
  - **Installment schedule** (from `BookingInstallment`: seq/label/amount/amountPaid/dueAt/status) — visible ladder; "record payment" against a specific installment.
  - **Attachments vault** (contracts/CNIC/photos/videos).
  - **Notes → backend** (persist, multi-device) + **activity/status history** (`BookingStatusHistory` exists).
  - **Settlement** (headcount lock → final bill) surfaced for event-day.
- **Backend reality:** `BookingInstallment`, `PaymentReceipt`, `PaymentTransaction`, `bookingSettlementController`, `BookingStatusHistory`, `SecurityDeposit` all exist. **Edit path is dangerous** — see §7 (the edit-reprice bug). Reschedule/edit MUST route through the shared pricing helpers, never a new inline calc.

### M5 — Calendar + slot blocking
- **Now:** whole-day block/unblock; "+" prefilled-date; day cells.
- **Gaps:** **no slot-level** (morning/evening/night) blocking; "+" shows on blocked days; no availability heat by slot.
- **Target:** block a **specific slot** or whole day per hall; blocked/occupied slot → **disable "+ Add booking"** for that slot; show per-slot capacity used vs total.
- **Backend reality (verified):** availability IS per-slot via `BusinessSlotTemplate` (capacity, weekdayMask, unitGuestCapacity, subVenueId). `slotService.assertSlotAvailable` under a **date-keyed `pg_advisory_xact_lock` + `SELECT … FOR UPDATE`** enforces no double-book on the live path. A hard DB **`EXCLUDE USING GIST(subVenueId, slotRange)`** guard exists on `BookingSpaces` **but is feature-flag-dark** (`SCHEDULING_MULTI_RESOURCE`) and legacy vendors have no BookingSpace rows. **Action:** surface slot blocking in the UI (backend supports it); track enabling the EXCLUDE constraint for hard correctness (coordinate — see §7).

### M6 — Chat (in-context + media)
- **Now:** rail "Payment record" → drawer (done). view-lead / create-booking still **redirect**.
- **Gaps:** view-lead/create-booking should open **drawers in-context**; no 2-way media upload (view/download exists).
- **Target:** "View lead"/"Create booking" open the shared Lead/Booking drawers over the chat (prefilled from the conversation); **upload+preview+download** of PDF/JPEG/PNG/MP4 both ways.
- **Backend reality:** `socket.io` (realtime) + `multer`/`sharp`/`file-type` (uploads) + `messageType: file/image` exist. Feasible; **verify** message/attachment model + storage location (local disk vs cloud — must persist on Railway).

### M7 — Function Sheet (BEO — Banquet Event Order)
- **Now:** basic list + trade-ops editor + kitchen-prep.
- **Target (full BEO):** chronological **event timeline** (setup → decor → guest arrival → food → wrap-up); **per-department checklists** (Catering/Kitchen, Decor/Lighting, Sound/AV, Parking, Security); **staff + third-party vendor assignments**; **client sign-off** log; **Print / PDF / WhatsApp/Email dispatch**; status workflow (Draft/Approved/In-progress/Completed); live edit.
- **Backend reality:** `bookingTimelineController` + `BookingTimelineTask` + `pdfkit` exist; kitchen aggregation feasible from menu×guests. Big frontend build on existing spine.

### M8 — Sidebar / navigation
- **Now:** live-parity sidebar + venue switcher + logo + Setup secondary sidebar (DONE this session).
- **Gaps:** no floating **"+" quick-create**; verify no legacy sidebar leaks on any route (user saw old sidebar on function-sheets — **verify** which route).
- **Target:** bottom "+" → quick-create Lead/Booking anywhere; audit every route uses the artifact shell.

### M9 — Customer CRM (360)
- **Now:** detail (getProfile by phone + timeline); customer→booking.
- **Gaps:** no tags/segments, no document vault, no statement PDF, limited actions.
- **Target:** 360 timeline (leads↔bookings↔payments↔inquiries); financial summary (lifetime spend, outstanding, paid); action bar (New booking · Log inquiry · WhatsApp · **Statement PDF**); tags (VIP/Repeat/High-budget/Pending-payment); document vault; preferences/notes log.
- **Backend reality:** profile+timeline exist; `pdfkit` for statement; tags/vault fields — **TODO backend-verify/add**.

### M10 — Ops / Khata / Reports / Billing / Setup
- **Khata sub-modules:** Quotes (interactive itemized proposal builder → PDF → WhatsApp, accept/reject tracking); Date Holds (soft-hold TTL — backend already 48h post-overhaul — with countdown + auto-release alerts); Reviews (post-event capture → listing); Field Capture (on-site checklists).
- **Operations:** Trade-ops (vendor coordination/dispatch); Kitchen prep (raw-material aggregation from menu×guests — degh compute exists); Broker commissions (payout ledger).
- **Reports:** Revenue vs expenses, conversion by source, payout ledger — CSV/PDF.
- **Billing:** subscription tiers, invoices, Stripe (exists).
- **Setup engine:** multi-space capacities, **seasonal/surge pricing** (surge snapshots exist in BookingDetails), tax rates, **role-based staff permissions**, notification triggers (Automation engine exists).
- **Task:** per-screen delta pass — **eliminate every dead/placeholder button**, wire to existing endpoints, surface advanced use-cases.

---

## 3. Payment & financial integrity — the crown (deep)

**The money model (authoritative on backend):**
- `totalAmount` = price (server-computed). `downPayment` = money **RECEIVED** (starts 0 online). `advanceDuePkr` = advance **REQUIRED** (never a receipt). `securityDepositPkr` = refundable, **NOT** in total. These live on both `Bookings` and each `BookingDetails` (revenue rollup reads the **line**, pro-rata).
- Balances are computed in **`src/utils/bookingMoney.js`** (single source of truth): `receivedOn`, `advanceDueOn`, `outstandingOn`, `derivedPaymentStatus`. **The status flag is never an input** — always derived from amounts.

**Payment status enum:** `Pending · Paid · Partial · Cancelled · Partially Refunded · Refunded · Failed`.
**Payment methods (whitelist):** `cash · jazzcash · easypaisa · raast · ibft · bank_transfer · other` (+ Stripe online).
**Installments:** `BookingInstallment` seeded as 2 rows at creation (`down_payment`, `remaining`; `remaining` waived if 0); `UNIQUE(bookingId, sequence)`.

**Three recording paths (surface all correctly, never bypass):**
1. **`POST /bookings/:id/record-payment`** (vendor/cash) — body `{paymentType: down_payment|remaining|full_payment, paymentMethod, claimId?}`. Server transitions status, writes `PaymentTransaction` + `PaymentReceipt`, marks installments. Refuses on Cancelled; blocks `full_payment` when already Partial.
2. **Stripe/online intent** + webhook completes.
3. **Direct-pay claims** (`CustomerPaymentClaim`) — platform holds NO funds (PEFTA/SBP); customer claims "I transferred", **amount taken from server figure, never body**; vendor confirms via record-payment.

**Frontend must surface (mature):** the **installment ladder** (due dates + paid/pending per row), **record-against-installment**, method picker (all enums), **advance-at-booking**, **security-deposit** hold/return, **refund** on cancel (per policy snapshot), **settlement** (headcount lock → final bill), receipts/invoices/statements **PDF**.

**Correctness rules (must honor):**
- Never send/author amounts the server computes — echo only.
- Route **every** edit/reschedule through shared pricing helpers (`packageChargeFor`/`packageIncludesFood`/`computeDownPayment`) — see §7.
- All money actions are **audited** (`AuditEvent`) — don't break that trail.

**Prioritized payment-flow correctness list (financial-risk first):**
1. Booking edit/reprice safety (a drifted 3rd pricing copy caused per-head ×guests loss + "Rs 20 deposit" bug — being fixed on a branch; the FE edit dialog re-sends packageId/menuId on every save → must adopt the fixed path).
2. Advance = owed vs received (adopt WW-DIRECT-PAY split in the UI so "accepted" ≠ "paid").
3. Slot double-booking hard guard (enable path for the EXCLUDE constraint).
4. Installment/refund/deposit surfaces (no silent money loss).

---

## 4. Zero double-booking (slot engine) — summary

- Per-slot availability via `BusinessSlotTemplate` (capacity N, guest-unit aware).
- Live guard: date-keyed `pg_advisory_xact_lock` + `FOR UPDATE` conflict read inside the create txn (closed the WW-299 12/12 concurrent-insert race).
- Hard guard: `BookingSpaces` `EXCLUDE USING GIST(subVenueId, slotRange)` — **flag-dark** today.
- **Frontend:** expose slot selection + show blocked/occupied slots + disable "+" — the backend already validates; the UI just isn't asking per-slot.

---

## 5. Execution plan (how we actually ship this)

- **Order:** M1+M2 (Leads) → M3 (shared BookingForm, the keystone) → M4 (booking detail depth) → M5 (slots) → M6 (chat) → M9 (customer) → M7 (BEO) → M10 (ops/setup) → **M-money last & most careful**. M8 "+" is a quick win anytime.
- **Each module = frontend + backend paired**, then verify **both**: backend `jest` suites (incl. money-path + the 81 DB suites) green, frontend ratchet **121/0**, headed Playwright.
- **Foundations first:** the shared components in §1 (esp. `<BookingForm>`) unblock M3/M6/M9 and kill the consistency debt.
- **Definition of done per module:** no dead buttons; advanced use-cases present; consistent with the design language; zero regression proven.

---

## 6. Risks & coordination (must resolve before touching booking/payment)

1. **In-progress backend branches** — someone/something is mid-flight:
   - `feat/ww-direct-pay-and-booking-overhaul` (+1729/−109): splits owed vs received, vendor-accepts-first, wallet types, setup counts.
   - `fix/ww-booking-edit-reprice` (+313/−27): fixes the drifted edit-pricing copy (per-head ×guests loss, Rs-20-deposit).
   - Current backend branch: `fix/ww-refunds-owed-all-venues`.
   - **Decision needed:** do we build on top of / merge these, or are they abandoned? Building booking/payment UI against `main` while these change the money model = guaranteed rework. **Coordinate first.**
2. **Never author a 4th pricing path** — the edit-reprice bug is the cautionary tale. All pricing = server, via shared helpers.
3. **Attachment storage** — confirm files persist on Railway (disk vs cloud) before shipping uploads.
4. **Flag-dark correctness** (EXCLUDE constraint, PAYMENT_LEDGER_ON, SCHEDULING_MULTI_RESOURCE) — decide enablement per venue cohort.

---

## 7. Open verifications (blocked by the rate-limited research agents — redo after reset)
- Lead & Customer model fields (sub-venue, assigned rep, follow-up, tags, vault).
- Chat message/attachment model + media storage.
- Per-screen dead-button catalogue for M10 (ops/setup) and the consistency audit (was Agent F).
- Which route leaks the legacy sidebar (function-sheets sub-route?).

---

---

## 8. Build log

**2026-09-01 — M2 (Lead form venue attribution) — DONE + verified.**
- Backend (`ems-v0-backend`, additive/idempotent, uncommitted on the working branch): `Leads.subVenueId` column (migration `20260901120000-ww-lead-subvenue.js` — nullable INTEGER + FK→SubVenues ON DELETE SET NULL + index), model field in `lead.js`, whitelisted in `validateLead` (leadHelpers.js). `assignedToUserId` + `nextFollowUpAt` were ALREADY model + whitelisted (frontend just wasn't surfacing them).
- Frontend (`leads-artifact.tsx`): lead form now has **Venue** (multi-venue) → dependent **Hall/space** (venueSpacesApi.getTree, flattened tree) + **Assign to** (StaffAPI.listMembers) + **Next follow-up** (datetime → `lead_followup` automation). Venue-change re-populates the dependent selects. Create/update send all four.
- Verified headed: 5 venues, dependent cascade populates per-venue (Rehman Grand 5 halls/12 staff, QA its own), create → **POST /leads 201** with `subVenueId`+`assignedToUserId`+`nextFollowUpAt` in the payload. Ratchet 121/0, zero errors.
- ⚠️ Deploy note: `assignedToUserId`/`nextFollowUpAt` persist on prod today; **`subVenueId` persists only after the backend column is deployed** (I don't push). On prod it's currently accepted-then-ignored (201, no error).

**2026-09-01 — M1 (Leads quick-view drawer) — DONE + verified.**
- Row-click now opens a quick-view **drawer** (`leadQuickViewHtml`): stage + source + last-activity, call/WhatsApp, an 8-field detail grid (event/date/budget/guests/venue/follow-up/email/WA), inquiry note, and actions — **Edit · → Booking · Poori profile ›** (full page still reachable; both coexist as agreed). Actions reuse existing data-* handlers.
- Verified headed: drawer opens with all fields + actions; Edit → edit form; ratchet 121/0, zero errors. Frontend-only (no backend change).

**2026-09-01 — M3 (shared `<BookingForm>`, keystone) — built + verified on bookings.**
- New `artifact/booking-form.ts` — ONE full-payload form; self-binds change/click/input listeners once per shadow (scoped to `bf-*`), so screens just call `openBookingForm(shadow, {prefill, businesses, activeBiz, onSaved})`.
- Fields: customer · event (date/time/guests/gender-mode/eventCity) · **venue→sub-venue cascade** · **package + menu** (live server-hint price) · **advance (downPayment) + method** · special requests. Pricing stays server-side (hint only). Friendly error mapping for SPACE_CONFLICT / DATE_BLOCKED / CLOSURE_CUTOFF + generic message.
- **Bookings** consolidated onto it (removed the old thin `bookingFormHtml` + pkgQ/pkgRef + data-booking-save + now-unused imports). `.bf-sec`/`.bf-hint` CSS added to shell drawer.
- Verified headed: 5 sections, venue→sub-venue cascade populates per-venue (sub 6/pkg 5/menu 4), price hint "Rs 5,00,000", create → 201; and the backend **capacity guard surfaces correctly** ("Hall holds 250, you entered 350") — invisible before because the old form never sent `subVenueId`. Ratchet 121/0, zero errors.
- ✅ **Consolidated onto the shared form:** bookings, **lead→booking** (prefilled from lead + auto-marks lead "Jeeta" on save), **customer→booking** (prefilled from customer). Old `bookingFromLeadHtml` / `bookingFromCustomerHtml` + their save handlers + now-unused imports removed. Verified: both open the ONE shared form, prefilled, with venue/sub-venue/package fields. Only **chat→booking** left (folds into M6). Three divergent drawers → one. Duplication killed.

**2026-09-01 — M4 v1 (Booking detail — installment ladder) — DONE + verified.**
- Surfaced the **Qist schedule** on booking-detail via the existing `GET /bookings/:id/installments` (`BookingAPI.getInstallments` already existed → `InstallmentsResponse {installments[], totals}`). New `installmentsCard()` renders each row (Advance/Baqaya · dueAt · amount · status pill paid/pending/partial/overdue/waived) + outstanding total. Refreshes on record-payment (added `bk-detail-inst` to invalidateAll).
- Verified headed: booking 320 → "Advance · 24 Aug 2026 · Rs 1,32,500 · Overdue" + "Baqaya · 5 May 2029 · Rs 5,30,000 · Baqaya". Ratchet 121/0, zero errors. (Frontend-only; endpoint already existed.)
- ⏳ Remaining M4: record-against-a-specific-installment, attachments vault (needs upload endpoint + storage confirm), invoice PDF (endpoint TBC), settle-drawer (write final count → `POST /:id/settle`), notes→backend.

**2026-09-01 — M4 v2 (Booking detail — settlement surface + WhatsApp baqaya reminder) — DONE + verified.**
- **Settlement final-bill card** via `GET /bookings/:id/settlement` (read-only preview; both parties safe). New `BookingAPI.getSettlement()` + `SettlementPreview` types; `settlementCard()` renders guarantee / counted / per-head rate + label / staff+crew meals / khaana total, then a balance block (settled total · mil chuka · baaqi lena) with the vendor-readable `why` lines. Only rendered when `settleable` (flat bookings get no card — no noise). Heading flips **"andaaza" → "final bill"** once `settled`; shows a "Badla gaya" chip if the bill was amended. Refreshes on record-payment (`bk-detail-settle` in invalidateAll).
- **WhatsApp baqaya reminder** on the "Baqaya" timeline row (only when a WA number + due balance exist): opens a prefilled Urdu wa.me nudge (Salam + booking date + Rs baqaya + "event se pehle ada karein") and **best-effort logs** via `POST /:id/reminders/log` (`BookingAPI.logReminder`). The log is flag-gated (`WHATSAPP_TIER1_ENABLED`) — a 404 = engine off, degraded silently ("WhatsApp khul gaya"), reminder still went out.
- Verified headed on bookings 192/320/725/726: settlement card renders with **real per-head rates** (Rs 1,850 / 2,650 / 1,493) + guarantee/counted + baaqi lena; reminder button present on all. Zero error banners, ratchet 121/0. GET-only + presence-checked → **no writes to production** (didn't click the reminder). Same super-admin session re-scoped to localhost for the local server (valid JWT till Nov; only the client `session_expiry` gate had lapsed).

**2026-09-01 — M5 (Slot-level blocking on the calendar) — DONE + verified.**
- **The gap:** the backend has had a full per-slot block engine (`BusinessSlotBlock` via `/businesses/:id/slots/blocks`, enforced at booking-create through `slotService.assertSlotAvailable → isBlocked`) with **no UI whatsoever**. The calendar only offered a coarse whole-day toggle (`VendorBlockedDate`). A vendor could not say "Evening band on the 15th, Morning still open".
- **Two block systems — kept distinct on purpose** (verified their enforcement paths differ): **whole-day** = `VendorBlockedDate` (blocks *every* booking, slot or not; the proven leave path) stays on `BlockedDatesAPI`; **per-slot** = `BusinessSlotBlock` (blocks just that slot's bookings) is the new layer. Not conflated — each enforces where it should.
- **New:** `SlotBlocksAPI` (list/block/unblock) + `BusinessAvailabilityAPI.getDayAvailability` in `lib/api/businessAvailability.ts`. **New slot-block drawer** on the calendar (`calendar-artifact.tsx`): opened from the cell ban-icon, the add-menu, and a full-width rail button. Shows a whole-day row + every slot for the date with **live availability** (label · time · `used/capacity` · `free`/`Full`/`Band` badge · block reason) and a per-slot **Band karein / Kholein** control. Whole-day-blocked dims the per-slot rows (moot). Friendly 409 handling ("is slot par pehle se booking/hold hai — band nahi kar sakte").
- Verified headed on **QA venue 3362** (`[QA] Maple Second Venue`, prod): drawer renders Lunch (12–4) + Dinner (7–10) with `0/1 booked · 1 khali`; full **block→unblock cycle** — blocking Lunch flipped it to "Band"/"Kholein" while **Dinner stayed open** (true slot granularity), then unblocked clean (self-cleaning). Zero error banners, ratchet 121/0. Writes scoped to the QA venue; block persisted through the availability engine and read back.
- ⏳ M5 depth (later): reason picker on block, block a slot across a date range, sub-venue-scoped slot view for multi-hall venues, capacity-override surface (`CapacityOverridesAPI` client already exists, no UI yet).

**2026-09-01 — M5 v2 (edge-case: booked slots are not blockable) — DONE + verified.**
- **Vendor feedback:** the block drawer should show whole-day + the *available* slots to block, and a slot that already has a booking must NOT be blockable (only free slots). The v1 keyed "Full" off `free <= 0`, which was wrong — a slot with a booking but spare capacity still offered a "Band karein" that the backend then refused (BK-007 `checkBlockConflicts` refuses a per-slot block when that slot has an active hold or a live Pending/Awaiting/Confirmed booking).
- **Fix:** the drawer now keys off `used > 0`. Three per-slot states — **Blocked** ("Kholein"), **Booking hai** (has a booking → disabled, accent-tinted, `${used} booking` badge, no block button), **Khali** (free → "Band karein"). Whole-day row now notes "Purani bookings rahengi — sirf nayi rukengi", and the footer explains booked slots can't be blocked (cancel/move first) while free ones can.
- Verified headed on **QA venue 3362** with a real booking on the Lunch slot (created + cancelled in-test, date 2027-11-15): Lunch → "1 booking" badge + "Booking hai" disabled + not blockable; Dinner (free) → "Khali" + "Band karein" blockable; day/footer hints correct; zero errors, ratchet 121/0. QA booking cleaned up (slot back to `used=0`).

**2026-09-01 — M6 v1 (Chat — booking fold + attachment rendering) — DONE + verified.**
- **chat→booking fold (completes the M3 keystone):** the lead conversation's "Booking banayein" was a **redirect** to `/dashboard/bookings`; now it opens the shared `openBookingForm` in the chat shadow, prefilled from the conversation contact (name/phone/email via the existing `contactQ`), with venue/sub-venue/package cascade. **All four booking entry points — bookings, lead, customer, chat — now use the ONE shared form.**
- **Attachment rendering upgrade:** image messages rendered a generic doc icon; now `image` messages with a URL render a real **thumbnail** (`<img>`, click-to-open) + optional caption, and `file`/`image` bubbles in the thread are **clickable** (`data-dl` → opens the attachment). Context-rail "shared files" already listed them; the thread itself was the gap.
- Verified headed: clicking a `data-chat-book` button (through the real once-bound chat handler) opens the drawer titled "Nayi booking", **prefilled** name=`Chat Test Customer` / phone=`0300 1234567` / email, venue+sub-venue+package selects populated, zero error banner, ratchet 121/0. (The QA super-admin account has **0 conversations/contacts** — verified via API — so the fold was exercised by injecting the button into the chat shadow to drive the actual handler; a live conversation was not fabricated because a chat notifies a real user, against the QA/non-notifying rule. Attachment thumbnails are type-safe + additive but await a live media message for a screenshot.)
- ⏳ **M6 v2 — media UPLOAD (deferred, needs backend):** there is **no** generic/chat upload-returns-URL endpoint (uploads are per-feature multer middlewares). `createMessage` already accepts `attachmentUrl`/`attachmentName` (WW-121); the paperclip needs a new `POST /chat/.../media` (multer→Cloudinary→`{url,name}`) + wiring `sendMessage` to carry the attachment. It **cannot be headed-verified against prod until the backend deploys**, so it's held for a backend batch rather than shipped unverifiable.

**2026-09-01 — M7 (Function Sheet / BEO run-sheet editor) — DONE + verified.**
- **The gap:** the function-sheets backend is huge (CRUD + state machine + PDF variants quote/contract/**beo**/invoice/receipt + WhatsApp + share-token + linked-financials + FBR), and the list is on the shell — but there was **no BEO editor anywhere**. Live proof: of 36 sheets, several sit in state `beo_ready` with **`beoJson` empty** — the state advanced but the day-of run-sheet was never fillable.
- **New — "Din ka plan" BEO editor drawer** on the function-sheets artifact: per-row **BEO** button (`<button>` → auto-exempt from row-nav) opens a drawer that loads the sheet and edits the venue day-of run-sheet: **halls/spaces · guaranteed headcount · setup/teardown times · a repeatable time→activity run-sheet (add/remove rows) · crew instructions**. Saves via `FunctionSheetAPI.update(id,{beoJson})`; **"Save + BEO ready"** transitions `signed → beo_ready` (only shown from the legal predecessor; a rejected transition still keeps the save); **"BEO PDF"** streams `pdfBlob(id,'beo')` to a new tab. Button lights up (`.on`) when a sheet already has a run-sheet.
- Verified headed on a **QA sheet (biz 3362, created + deleted in-test)**: editor opened ("Din ka plan — BEO"), filled spaces/head=420/setup 16:00/teardown 23:30/crew + 2 timeline rows (19:00 Baraat ki aamad, 21:00 Khaana khulega), saved, and on **reopen every value + both rows persisted**. Confirmed **server-side**: `GET /107` returned the full `beoJson`. **BEO PDF** confirmed real (`fs77 ?variant=beo` → 200 `application/pdf` `%PDF-` 3.2KB). QA sheet deleted (self-cleaning). Ratchet 121/0, zero error banners. Vendor-internal (no customer notification).
- ⏳ M7 depth (later): artifact-shell **function-sheet detail** to replace the legacy `[id]` redesigned view (list is on the shell, detail is not); quick-create sheet from a booking; the craft-specific JSON blocks (kitchen/decor/photography…) already typed in the API but unsurfaced.

**2026-09-01 — M9 v1 (Customer CRM — reputation layer) — DONE + verified (render/client; write vendor-gated).**
- **The gap:** the customer-detail artifact had profile + lifetime stats + bookings + timeline, but **no reputation layer** — despite a full backend two-way rating system (`CustomerRatingsAPI` list/add/remove on `offlineCustomers/:id/ratings`) + anonymized cross-vendor `CommunityTrustAPI`, both already client-wrapped and used by the legacy rate-customer-dialog.
- **New on the customer detail (right rail):** **"Aap ki rating"** card — the vendor's private rating (avg stars + would-book-again% + de-duped flag chips + recent rating events with delete), plus a **"Rate" drawer** (1–5 star picker, would-book-again, 12 typed flags good/bad e.g. *waqt par payment* / *cheque bounce* / *no-show*, notes) → `CustomerRatingsAPI.add`. **"Community trust"** card — anonymized signal from other vendors (avg stars, would-book%, flag counts) via `CommunityTrustAPI`, with a k-anonymity empty state. Rating card only shows the write affordance when the customer has an `offlineCustomerId`.
- Verified headed on a real customer profile: **both cards render**, no error banner, and (Rate button correctly hidden because this customer's `offlineCustomerId` is null) the **rate drawer + client logic work end-to-end** — opened "Customer ko rate karein", 5-star picker (click star 3 → 3 lit, `data-val=3`), 12 flags (toggle 2 → 2 active), notes. Ratchet 121/0.
- **Verification boundary (honest):** the QA account is a **super-admin, not a vendor** (`isVendor:false`) → it has 0 customers and **403s on every vendor CRM endpoint** (`offlineCustomers`, ratings, community-trust — no super-admin bypass on `checkVendorRole`). So the **persistence + live rating/trust display could not be exercised** on this session; the write path reuses the pre-existing vendor-proven API clients (only presentation is new). Needs a vendor login to screenshot the happy path.
- ⏳ M9 depth (later): tags/notes editing on the customer record (backend `offlineCustomers PATCH` ready); customer **statement PDF** (no endpoint yet — backend needed); surface the reputation summary as a chip on the customers **list** rows.

**2026-09-01 — M10 v1 (Ops/setup engine — Bookable Slots) — DONE + verified.**
- **The gap:** the venue's **bookable-slot definitions** (`BusinessSlotTemplate` — the slots the booking form offers, capacity is enforced against, and M5 blocks per-day) had **no management UI**. The legacy `/dashboard/availability` screen branches by business primitive and for a venue (`P1_VENUE_LOCK`) is a dead-end note pointing at the calendar — the dashboard's top "publish your dates" recommendation literally ended there.
- **New shell screen `/dashboard/slots` — "Bookable slots"** (`SlotsArtifact`), registered in the **Setup** hub + Setup secondary sidebar (Venue group). Lists each slot as a card (label · time range · concurrent-booking capacity · per-booking guest cap · weekday chips · Chalu/Band pill). **Create/edit drawer**: label, start/end, capacity, `unitGuestCapacity`, a **7-day weekday-mask picker** (Mon=1…Sun=64, with "Sab din"/"Sirf weekend" quick-sets) + buffer. **Seed standard slots** one-tap when empty; **activate/deactivate** per slot. All via the M5-proven `SlotTemplatesAPI` (create/update/deactivate/seedDefaults), scoped to the active business. Additive — the legacy multi-primitive availability screen is untouched, so caterer/rental/production setups don't regress.
- Verified headed on **QA venue 3362**: Setup sidebar shows + slots active; existing Lunch/Dinner slots render; **created** "ZZ QA Test Slot" 6–9 AM (weekend-only) → appeared in list; **edit reopened prefilled** (label/start/end/guests + `weekdayMask=112` = Fri+Sat+Sun, exactly the "Sirf weekend" pick); the backend's **overlap guard surfaced correctly** (first attempt 10–14 was refused for overlapping Lunch 12–16 — a feature, via the error handler); **deactivate** confirmed (200, slot gone, active back to Lunch/Dinner). Test slot cleaned up. Ratchet 121/0, zero error banners.
- ⏳ M10 depth (later): capacity-override surface (per-date capacity, `CapacityOverridesAPI` client ready); sub-venue-scoped slots (assign a slot to one hall); drag-reorder (`sortOrder`); fold the non-venue primitive setups (crew/rental/production) onto the shell too.

**2026-09-01 — M6 + M9 happy-paths CLOSED (verified on a real vendor account).**
- The user supplied a **vendor** login (Muhammad Rehman Yousaf, user 3351) — the earlier super-admin QA account was `isVendor:false` and could not exercise the vendor-gated paths. Logged in via the UI, saved the localhost-scoped session, verified both:
- **M9 rating happy-path — DONE.** On customer 79 (Asad Jameel, `offlineId`): rating card + Community-trust card render; opened the Rate drawer (5-star, 12 flags), submitted **4★ + "paid_on_time" + notes** → **persisted and re-rendered** (avg 4.0, "Waqt par payment" chip, 1 event); then **deleted** it → back to 0 events. Full add→persist→display→delete cycle live. Self-cleaned.
- **M6 chat→booking happy-path — DONE.** 2 real lead conversations loaded; clicking one showed **"Booking banayein"** prefilled from the conversation contact (name + phone), and it opened the shared BookingForm ("Nayi booking") **prefilled**, with **5 real venue options** + sub-venue cascade, zero errors — confirming the M3 keystone works from chat on real data. (Attachment thumbnails still un-screenshotted — these conversations carry no image/file messages; the render path is additive + type-safe. Media **upload** remains M6 v2, needs the backend endpoint.)

**2026-09-01 — M5 v3 (multi-venue slot blocking — professional fix) — DONE + verified.**
- **Vendor feedback (real bug):** with "Sabhi venue" selected (5 venues, no single active venue → `activeBusinessId = null`), clicking "Is din ke slots band/khula karein" only threw a confusing toast **"Pehle upar se venue chunein"** — nowhere obvious to pick the venue, and slot-blocking is inherently per-venue. Unprofessional dead-end.
- **Fix:** the slot drawer now carries its **own venue picker** (a `<select>` of the vendor's venues, shown whenever there's more than one) and every action — availability load, per-slot block/unblock, whole-day block — runs against the **drawer's selected venue**, not the global active one. It defaults to the active venue, else the vendor's first venue, so the drawer always has something concrete to act on instead of erroring. Whole-day (VendorBlockedDate) state is now fetched **per selected venue + date** (not the aggregate blocked-set), and the toggle carries its own `data-dayblocked` so a re-render is state-accurate. Venue switch is a `change` listener → reloads that venue's slots.
- Verified headed on the **vendor account (5 venues, `activeBusinessId=null` — the reported state)**: drawer opens with **no error**, venue picker lists all 5, switching venues reloads each one's slots. Definitive booked-vs-free matrix on QA venue 3377 (booking created + cancelled in-test on the Evening slot): **Evening → "1 booking" / "Booking hai" / not blockable**, Day+Midday free → **blocked Day → "Kholein" → unblocked** cleanly; Evening stayed non-blockable throughout. Zero errors, ratchet 121/0, self-cleaned.

**2026-09-01 — Booking-detail professional-polish pass (vendor feedback) — DONE + verified.**
- **Vendor feedback on a Cancelled booking:** it still showed a prominent "Payment record karein" + "Baqaya record karein" (the backend refuses payment on a cancelled booking with 400 `BOOKING_CANCELLED`, so these were dead buttons), the Baqaya stat wrongly said "event se pehle lena hai", Documents had **no way to add one**, and the private note had no visible save.
- **Cancelled/dead booking (`/cancel|reject|refund/`):** payment CTAs are **hidden** (header button + timeline "Baqaya record karein" both gone), the Baqaya stat reads **"—" / "booking cancel ho chuki"** (neutral tone, not "collect"), and a **"Booking cancel"** timeline row explains no payment is collected and prior money follows refund/policy. A live booking is unchanged (verified: confirmed #173 still shows the record button).
- **Documents card:** new **"Naya banayein"** action → `FunctionSheetAPI.create` linked to this booking → navigates to the sheet, where quote/contract/**BEO**/invoice/receipt + PDFs live (function sheets ARE the document system; there is no arbitrary-file upload endpoint — that would need a backend media route, same as chat).
- **Notes:** explicit **"Save karein"** button + a **"Save ho gaya ✓"** status, and an honest hint — **"Ye note is device par save hoti hai — sirf aap dekh saktay hain"** (there is no vendor-note column on the booking; true cross-device persistence is a backend-batch item, `booking.internalNote` + PATCH).
- Verified headed on the **vendor account**: cancelled #196 → no record button, baqaya "—"/"booking cancel ho chuki", cancel timeline row, docs "Naya banayein" + notes "Save karein" present; **note save** → "Save ho gaya ✓"; **"Naya banayein"** created a sheet + navigated to `/function-sheets/109`; confirmed #173 → record button present (no regression). Sheets created in-test deleted. Ratchet 121/0, zero error banners.
- ⏳ Backend-batch add: `booking.internalNote` (TEXT) + a PATCH so the private note persists across devices instead of `localStorage`.

---

## 💰 Money phase (started 2026-09-01 — most careful)

**Ground rule:** `receivedOn` = the `downPayment` amount column (receipts sync into it via `_syncBookingFromReceipts`); `outstandingOn` = `booked − received`, **0 for cancelled**. The flag (`paymentStatus`) is a label, never an input. Client mirror: `lib/utils/booking-money.ts`. Both reconcile to the rupee (see `bookingMoney.js` header).

**MONEY v1 — booking-detail was trusting a broken legacy endpoint — FIXED + verified.**
- **The bug:** booking-detail read paid/due from `PaymentAPI.getBookingPaymentStatus` (`/payments/booking-status/:id`), preferring it over the money-truth util. That endpoint is **wrong on Completed + Cancelled bookings** — verified live: **#155** (Completed, `downPayment` 10,92,200) returned **paid 0 / remaining 10,92,200**; **#158** the same; **#196** (Cancelled) returned paid 0 / remaining 3,50,000 while `downPayment` is 70,000. So a **fully-paid completed wedding showed "Rs 0 received, full amount still owed."** The exact flag-vs-amount defect `bookingMoney.js` exists to kill.
- **Fix:** booking-detail now derives `total/paid/due` from the shared util (`bookedOn`/`receivedOn`/`outstandingOn`) and no longer trusts the legacy endpoint for them (kept only for `cashRefundOwedTotal`). Cancelled → due 0 (util already does this). Also surfaced **"Refund dena hai"** in place of Baqaya when the vendor owes the customer money back (`cashRefundOwedTotal > 0`).
- Verified headed on the vendor account: #155 → Mil chuka **10,92,200** / Baqaya 0 / 100% (was Rs 0); #158 → **18,58,450** / 0; #173 (Confirmed, no regression) → 16,73,250 / 0; #196 (Cancelled) → Mil chuka **70,000** / Baqaya "—". Zero errors, ratchet 121/0.
- ⏳ Money follow-ups: the **backend `/payments/booking-status` endpoint itself is wrong** (should read `bookingMoney.js`) — backend-batch fix, and audit its other consumers (legacy `booking-detail-view`, being phased out). Then: refund-owed **settle action** (`PaymentAPI.settleCashRefund`, needs a booking with an owed refund to verify), Khata + receivables money-truth audit, security-deposit + settle-drawer, direct-pay branch alignment.

**MONEY v2 — exhaustive money-truth audit (workflow) + fixes — DONE + verified.**
- Ran a 12-surface money-truth audit workflow (one auditor per surface, each finding adversarially verified by a confirm-lens + refute-lens). **7 CONFIRMED, 4 rejected** (payments tiles-vs-table and reports "Kamaai" label were refuted as acceptable). Khata + receivables came back clean on the flag/legacy-endpoint axis (they delegate to the money-truth analytics endpoints).
- **Fixes (all ratchet 121/0, headed-verified on the vendor account):**
  - **today (high)** — "Baqaya" was `orderBalance` only; null → 0 → hidden. A LIVE booking (Rs 5,00,000 / Rs 1,00,000 received / no order snapshot) showed **no baqaya**. Now `orderBalance ?? outstandingOn(b)` (added `downPayment` to the type; endpoint returns it) → **Baqaya Rs 4,00,000 now shows**.
  - **overview (high)** — the "Aane wale events" progress bar was fabricated from the flag (hard-coded 55% for Partial, 0% for Pending-with-advance). `recent-bookings` doesn't return `downPayment`, so the bar now computes real received/booked **when the amount is present, and shows NO bar otherwise** (no fabrication). Verified: bars hidden on current prod (no fake 55%). ⏳ backend-batch: add `downPayment` to `recent-bookings` → real bars post-deploy.
  - **khata (medium ×2)** — Record button prefilled the customer's TOTAL outstanding but scoped the receipt to ONE booking (multi-booking overpay) → now scopes to that booking's own baqaya; the "Is mahine" tile raw-summed receipts so a refund logged as +positive counted as income → now nets via `classify()` (wapsi subtracts).
  - **bookings-list (medium+low)** — the Baqaya tab/count gated on the "done" bucket, hiding Completed-but-owing bookings → now gates on `outstandingOn(b) > 0` (Baqaya tab now = 8, includes completed-owing); cancelled bookings no longer show a false "poora mila" (and don't guess "refund dena hai" — that truth is on the detail).
  - **reports (low)** — "Auosat deal / per booking" was received÷count → relabeled "Auosat vasooli · per booking (mila hua)" (honest about what the number is).
- ⏳ Money backend-batch: (1) `/payments/booking-status` to read `bookingMoney.js`; (2) `downPayment` on `recent-bookings`. Then: refund-owed settle action, security-deposit, settle-drawer, direct-pay branch align.

**MONEY v3 — settle-drawer (final-bill write) + cash-on-the-night — DONE + verified.** (completes M4 settlement)
- M4 v2 shipped the read-only settlement CARD; this adds the WRITE. New `BookingAPI.settle` / `lockHeadcount` / `confirmCashSettlement`. On the settlement card, a **"Final count daal kar settle karein"** button opens a drawer to record the count from the night — Kul mehmaan, bachay <5 / 5–12, staff (inside total), **crew (additive, the vendor's own team — outside the total, matching `crewMealsFor`)**, note. Two-step + safe: **"Andaaza dekhein"** previews the bill via `GET /settlement?total=…` (read-only) before **"Settle karein"** commits it via `POST /:id/settle`; re-settle keeps the amendment trail. When a settled booking still owes, a **"Cash mila — Rs X"** button records the balance handed over on the night via `POST /settlement/confirm-cash` (ledger + receipt).
- Verified headed on a fresh QA booking (venue 3377, per-head menu, guarantee 100, created + settled + cancelled in-test): card showed "andaaza" + settle button → drawer opened (total prefilled to guarantee, crew field present) → **preview** showed the projected bill (Aaye 130 · Settled total Rs 3,45,000) → **settle** flipped the card to **"final bill · Settle ho chuka · Aaye 130"**. Confirmed server-side (`settled:true`, statedTotal 130). Ratchet 121/0, zero errors. (`confirm-cash` button wired + presence-checked; not clicked in-test to avoid a ledger write on the QA booking — same drawer pattern.)
- ⏳ Remaining money: refund-owed settle action (needs an owed-refund booking to verify), security-deposit hold/return, headcount-lock UI, direct-pay branch align; backend-batch (`/payments/booking-status` truth, `recent-bookings` downPayment).

**MONEY v4 — security deposit + damage claims (WW-DEPOSIT A17/A18) — DONE + verified.**
- The backend deposit engine existed (`GET /:id/deposit`, `deposit/return`, `damage-claims` raise/respond/settle/withdraw; arithmetic in `depositLedger.js`) with **no frontend at all**. A booking auto-holds a deposit when its venue sets `securityDepositPkr` (verified: QA venue 3377 default Rs 50,000 → every booking on it holds it).
- **New:** `BookingAPI.getDeposit / returnDeposit / raiseDamageClaim / settleDamageClaim / withdrawDamageClaim` + a **Security-deposit card** on booking-detail: deposit rakha · nuqsan kaat · wapas-karne-layak (+ shortfall if a settled claim exceeds the deposit), a status pill (Rakha hai / Wapas ho gaya / Kuch wapas / Zabt), and each damage claim with its status. Actions: **"Deposit wapas karein"** (return; disabled while claims are live), **"Nuqsan claim karein"** (drawer: description + amount, capped hint at the returnable), and per-claim **Kaatein** (settle) / **Chhorें** (withdraw). Correctly models the two-party rule — an **open** claim shows *"customer ke jawab ka intezar"* + withdraw only; **settle appears only on an accepted claim** (the backend refuses settling an open one, `AWAITING_CUSTOMER`); disputed → review-only.
- Verified headed on a fresh QA booking (venue 3377, deposit Rs 50,000, created→tested→cancelled): card rendered (50,000 held/returnable) → **raise** a Rs 8,000 claim → showed "Khula · intezar · Chhorें", **return disabled** → **withdraw** → return re-enabled → **return deposit** → status **"Wapas ho gaya"**, button gone. Ratchet 121/0, zero errors. (Settle-an-accepted-claim leg is wired but needs a customer acceptance to exercise — two-party, like chat/CRM.)
- ⏳ Remaining money: refund-owed settle action; direct-pay branch align; headcount-lock UI; backend-batch (`/payments/booking-status` truth, `recent-bookings` downPayment).

**MONEY v5 — headcount-lock UI + refund-owed settle + direct-pay alignment — DONE / scoped.**
- **Headcount-lock UI (DONE + verified):** on the settlement card, when a settleable booking is not yet locked/settled, a **"Guarantee lock karein"** button opens a drawer to confirm/adjust the guarantee → `POST /:id/headcount-lock`. Verified on a QA booking: sub flipped from "Guarantee par andaaza" to **"Guarantee lock ho chuki — event ke baad final count par settle karein"**, button gone. `BookingAPI.lockHeadcount` added.
- **Refund-owed settle (WIRED + empty-safe):** a **"Refund dena hai"** card lists each cash refund the vendor owes back (`pay.cashRefundsOwed`) with a **"Refund de diya"** button → `PaymentAPI.settleCashRefund(refundId)`. Card is hidden when nothing is owed (verified: absent on normal bookings, no regression). Happy-path could not be exercised — the cash-refund-owed only arises under specific cancellation-policy + cash conditions that a plain cancel-after-cash did not reproduce (the policy forfeited the advance); the action reuses the pre-existing proven `settleCashRefund`.
- **Direct-pay branch alignment (money-truth done; rest backend-gated):** the core is already aligned — every money surface now reads `downPayment` (received) via the shared util, which is exactly the WW-DIRECT-PAY split (`downPayment`=receipts, `advanceDuePkr`=requirement). The two remaining direct-pay pieces are **backend-branch-gated and not buildable/verifiable now**: (1) surfacing **`advanceDuePkr`** (required advance vs received) — the `/bookings/:id/with-availability` payload does NOT return it, so it needs a backend field; (2) the **vendor payment-claims UI** (customer claims "I transferred Rs X" → vendor confirms/rejects) — the endpoints are active but there is no claim data (customers create them) and confirm routes through the flag-gated `record-payment`; it's two-party like chat/CRM. Both belong to the `feat/ww-direct-pay-and-booking-overhaul` deploy.
- ⏳ Backend-batch (money): `/payments/booking-status` → `bookingMoney.js`; `recent-bookings` + `with-availability` → add `downPayment`/`advanceDuePkr`; then the payment-claims vendor card.

**2026-09-01 — Vendor-ease UX audit (workflow) + fix wave 1 — DONE + verified.**
- Ran a 26-screen vendor-ease audit workflow (one auditor per screen → each gap verified as genuinely-missing vs already-present vs low-value): **60 CONFIRMED gaps** (20 high / 36 med / 4 low), 7 already-present, 0 rejected — missing action buttons, non-clickable identifiers, dead-ends, missing cross-links & quick-actions.
- **Fix wave 1 (high-value, ratchet 121/0, headed-verified):**
  - **today** — record-payment button on a baqaya event (the customer is AT the venue) → `openRecordPaymentDrawer` (wired per proven pattern; no today-event with baqaya to screenshot right now).
  - **overview** — upcoming-event rows now carry the booking id + `data-nav-btn` → tap opens the booking (were inert plain text). ✅
  - **lead-detail** — three: **stage-advance** buttons ("{nextStage} mark karein" / "Khoya") via `LeadAPI.transition`; **convert-in-place** ("Booking mein badlein" → shared prefilled `openBookingForm`, marks the lead won) instead of a dead nav to the bookings list; **quote CTA deep-linked** `?leadId=`. ✅✅✅
  - **calendar** — month event chips now `data-nav-btn` to the booking; day-panel rows got call/WhatsApp buttons. ✅
  - **customer-detail** — a **"Nayi booking"** primary action (shared prefilled form from this customer). ✅
  - **staff / suppliers** — row name cell now navigates to the detail (`data-nav-btn`, buttons stay exempt). ✅✅
  - **notifications** — chat/message notifications now navigate to `/dashboard/chat`.
  - **pdcs** — the "Booking #N" fragment is now a nav link to the booking.
- ⏳ Remaining ease-gaps (documented in `scratchpad/ease-findings.json`): ~7 more high (function-sheets quick-create, holds→book, leads-list stage-advance, kitchen print/PDF/WA, payments WA+Baqaya-tab, brokers ledger — some need a detail route or a print mechanism) + 36 medium + 4 low, for follow-up waves.

**2026-09-02 — Vendor-ease fix wave 2 (remaining high-value) — DONE + verified (ratchet 121/0).**
- **payments** — **Baqaya filter tab** (one-tap collections view: only due>0 rows) + a **WhatsApp baqaya-reminder** anchor on every due row (prefilled: name + booking # + Rs amount), beside the record-payment ＋. Headed-verified: baqayaTab ✅, waBtn ✅.
- **holds** — **"Book karein"** on every active un-converted hold → opens the shared `openBookingForm` prefilled with the hold's date/time/venue (no more re-typing the slot in Bookings); expired holds only show Release. Headed-verified: bookBtn ✅ on a live active hold.
- **function-sheets** — **"Nayi sheet" quick-create** (head button + first-run empty-state CTA): a small drawer (title/customer/phone/event-date) → `FunctionSheetAPI.create` on the active business → routes into the full composer; filtered-empty state gets a "Sab dikhayein" reset. Headed-verified: newBtn ✅.
- **leads (list)** — **one-tap pipeline stage-advance** in the quick-view drawer: "✓ {next stage} mark karein" (contacted/qualified/quoted via `LeadAPI.transition`) + a **"Khoya"** (lost) button; booked stays via the convert-to-booking flow. Headed-verified: advBtn ✅, convertBtn ✅.
- **pdcs** — **bounced-cheque chase**: on `bounced` rows, WhatsApp (prefilled bounce+re-pay message) + Call quick-actions from the customer phone. Headed-verified: bouncedChase anchor ✅.
- **kitchen** — **Print/PDF + WhatsApp share** on a built prep-sheet: a results-header action row → clean print-ready window (degh table + shopping list) / `wa.me` text share of the plan. Builder renders ✅; the action row lives in the results block, so it needs a venue **with recipes/BOMs** + a built sheet to display (current QA venue has 0 BOMs — code is ratchet-clean & wired, not screenshot-exercisable here).
- **brokers** — **commission ledger + baqaya**: a per-row **"Ledger / Rs {baqaya}"** button opens a drawer of the broker's commissions (`BrokerAPI.listCommissions`) with an inline **record-payment** form per outstanding line (`BrokerAPI.recordPayment`, auto-transitions to paid); a **"Baqaya commission" tile** (grand total + overdue count) and a per-row baqaya chip, driven by `BrokerAPI.outstandingSummary`. Headed-verified: ledgerBtn ✅, baqayaTile ✅, ledger drawer opens ✅.
- ⏳ Still open (medium/low, `scratchpad/ease-findings.json`): 36 medium + 4 low cross-links/quick-actions (e.g. chat→lead-detail deep-link, receipts/expenses edit-in-place, reports drill-downs & export, packages/menus duplicate, spaces combo-edit, inventory low-stock filter) — for wave 3.

**2026-09-02 — Vendor-ease fix wave 3 (all remaining medium/low) — DONE + verified (ratchet 121/0).**
- Orchestrated as a **workflow**: 21 agents, one per **disjoint** artifact file (no merge conflicts), each applying its file's gaps under strict shell-convention rules + self-gating on any missing API/route. Result: **38/40 gaps applied, 0 errors**, ratchet 121/0, every edited screen renders clean (no error banner, no page errors — incl. chat's contactQ return-shape change).
- **Navigate/cross-link:** overview Baqaya→/receivables & "Aane wale"→/calendar; leads quick-view "Booking dekhein" (won lead→its booking); customer-detail timeline & rating booking# → booking; chat lead conversations now deep-link to `/dashboard/leads/{id}` (contactQ returns leadId) + booking "Invoice dekhein"→`/financials`; function-sheets row "Booking #N"→booking; receipts & reviews & expenses "Booking #N"→booking; quotes customer identity→customer-360 (`phone_` deep-link); reports status bars→`/bookings?status=`, hall names→set-active-venue+bookings, lead-source legend→leads; brokers name cell→commission ledger drawer.
- **Actions/quick-create:** customers top-level + empty-state "Nayi booking"; customer-detail zero-booking CTA; today no-events "Calendar kholein" CTA; payments empty-state "Naya booking"/"Sab dekhein"; bookings kebab **Call** button + **prefilled** baqaya WhatsApp; lead-detail "Khoya mark karein"; function-sheets stage-aware **Quote/Invoice/Receipt PDF** + row call/WhatsApp; receipts & expenses **edit-in-place** (`ReceiptsAPI.update` / `ExpensesAPI.update`); quotes **site-visit** propose→confirm→complete; holds **Extend** for expiring/expired; reviews reviewer call/WhatsApp; packages bundled-menu→menu-form + **Duplicate** (package & menu); spaces capacity-warning→edit + combined-space **edit** (delete+recreate) + member names; inventory **Kam stock filter** (tab + clickable tile, gated on lowCnt>0).
- **Data-dependent (code shipped + ratchet-clean, not exercisable in the current QA venue):** quotes visit-button (all 7 quotes settled — 5 Jeeta/2 Mana — so correctly hidden); packages menu-open (no package bundles a menu here); spaces warning/combo edits (venue has no over-capacity halls, no combined spaces); inventory low-tab (0 low-stock items → hidden by design). All confirmed correct behavior, not bugs.
- **2 gaps SKIPPED (correctly):** kitchen empty-BOM link + unmatched-dishes→add-recipe link — the recipe/BOM manager (`kitchen-bom-view`) is only mounted under the venue-os hub's `kitchen` tab, which is **commented out of `PRIMARY_TABS`** (venue-os-hub-view.tsx:105), so there is no reachable route; the agent refused to link to the wrong screen. ⏳ Follow-up (needs re-enabling that tab or a dedicated route — cross-file, deferred).
- Vendor-ease audit (60 gaps) now **complete**: wave 1 (9 high) + wave 2 (7 high) + wave 3 (38 med/low, 2 correctly deferred).

**2026-09-02 — Deep money-path QA sweep (workflow) — 20 CONFIRMED bugs; FE fixes shipped, BE batch pending.**
- Adversarial workflow: 7 dimension-finders (math / authz / status-endpoint / FE-surfaces / settle-deposit / reconcile / edge) over **both** repos, each finding double-verified (code-reality skeptic + reachability skeptic; kept only if BOTH agree). **49 agents, 0 errors → 20 CONFIRMED, 1 plausible, 0 rejected.** See [[ww-money-mutation-sync-traps]].
- **Root cause A — money moves but `downPayment` not reconciled** (C2/C3/C12/C14 confirm-cash settlement, C4 recordRefund, C11 offline advance, C13 receipt→installment, C19 cleared cheque): the FE money-truth column goes stale → collected money shows as still-owed, dunning fires. **Root cause B — paid/status from the `paymentStatus` FLAG** (C1 CRITICAL refund engine, C16 payments.ts, P1 booking-status). **C — FE trusts frozen order snapshot** (C7/C9 today over-collect, C8 owner-ledger, C17 booking-detail). **D — authz/scoping** (C6 HIGH PDC IDOR cross-tenant, C20 khata unscoped). **E** analytics counts cancelled (C5). **F** deposit returns with accepted-unsettled claim (C10), refund-owed positive-txn counted as received (C18). **G** confirmCashSettlement non-transactional double-count (C15).
- **FE FIXES SHIPPED (ratchet 121/0, headed-verified):** **today** (C7/C9) — dropped the frozen `orderBalance` snapshot; live baqaya = `grand − receivedOn`, cancelled→0 (stops door-side over-collection). **booking-detail** (C17) — "Baaqi lena" now shows the page's reconciled outstanding (with a "receipts se" note when the installment ledger disagrees). **khata** (C20) — receipts query now scopes to the active venue like its sibling tiles (`ReceiptsAPI.list({businessId})`; backend already filters). `ReceiptListFilters` gained `businessId`.
- **BACKEND FIX #1 SHIPPED + tested — C2/C3/C12/C14 (+ C11-settlement):** `confirmCashSettlement` now (a) always mirrors the cash to a PaymentReceipt (customerUserId is nullable, so walk-ins land in the ledger too) and (b) **additively reconciles `Booking.downPayment` + `BookingDetails.downPayment`** by the exact cash collected — additive (advance + tonight), so an un-mirrored advance is never wiped by a sum-from-receipts sync. 2 regression tests added; `settlementCashHandover.test.js` 39/39 green.
- **BACKEND FIX #2 SHIPPED + tested — C1 (CRITICAL):** `bookingPolicyService.refundInputsFor` now derives `totalPaid` from `bookingMoney.receivedOn` (the receipts-synced downPayment column), never the `paymentStatus` flag — the flag path refunded the QUOTED advance on Partial and could refund money nobody paid. Preview + raised request now share one derivation. `customerRefundPreview` test corrected to money-truth (empty column = unpaid, not the flag) + a new "counts real receipts even when the flag reads Pending" assertion; 6 refund suites 129/129 green.
- **BACKEND FIX #3 SHIPPED + tested — C6 (HIGH IDOR):** `createPdc` + `updatePdc` now require the target booking to belong to the vendor (`vendorIds.includes(req.user.id)` or super-admin) before a cheque can be attached/re-pointed — previously any vendor could attach a money instrument to another venue's booking. Refusal reuses the generic "Booking not found" (no existence oracle). New `pdcBookingOwnership.test.js` 3/3 green.
- **BACKEND FIX #4 SHIPPED — C4 (+ C11-refund):** `recordRefund` now (a) writes the negative refund receipt even for walk-ins (customerUserId nullable) and (b) **subtractively reconciles `Booking.downPayment` + `BookingDetails.downPayment`** by the refunded amount (never below 0), inside the existing txn — so refunded money stops counting as received on every surface + analytics. bookingController loads; 178 refund-related unit tests pass (full assertion is the `recordRefundCap` integration test, which needs the local DB).
- **BACKEND FIX #5 (partial) — C5:** the two amount-derived orphan queries (getReceivables + cash-flow forecast) that synthesise a receivable/forecast row from `totalAmount − downPayment` now also exclude `orderStage`-cancelled bookings (NULL-safe literal, `"Booking"` alias confirmed) — an order-pipeline cancel no longer gets chased or forecast. analyticsController loads. ⏳ The installment-joined + summary queries also filter cancelled-by-status only; adding the same guard there needs the include's alias verified against the DB (deferred, lower-risk since they ride real installments).
- **BACKEND FIX #6 SHIPPED + tested — C10 (HIGH):** `depositLedger.depositPosition` now surfaces `acceptedClaims`, and `damageClaimService.returnDeposit` blocks the return on ANY non-terminal claim (open | accepted | disputed) — an accepted-but-unsettled damage claim can no longer be silently dropped by returning the deposit. New regression assertion; `depositLedger.test.js` 40/40 green.
- **BACKEND FIX #7 SHIPPED — C19:** clearing a post-dated cheque (`transitionPdc` → `cleared`) now mirrors a PaymentReceipt for the cheque amount + additively reconciles `downPayment`/`BookingDetails.downPayment`, so a cleared cheque reduces baqaya exactly once (noop guard + terminal state prevent double-apply). pdcController loads; 23 PDC unit tests pass (money side-effect needs the DB integration suite to fully assert).
- **BACKEND FIX #8 SHIPPED + verified — C8:** `bookingOrderController.bookingMoney` keeps the snapshot's `grand` (renegotiated deal size) but now derives `advance`/`balance` from the reconciled `downPayment` column instead of the frozen snapshot — the owner-ledger + v2 action-overview now agree with the receipt-truth Khata/Receivables. Integration + http suites 460 pass / 0 fail. (Sibling instance `vendorCompletenessController.js:47` prefers `snap.balance` too — noted for the same fix.)
- **BACKEND FIX #9+#10 SHIPPED + DB-verified — C11 + C13 (the interlocked pair):** C11 — an offline booking now mirrors its collected advance as a PaymentReceipt at creation (inside the booking txn), so the receipts ledger is complete and the first drawer receipt's sync no longer wipes the advance. C13 — `_syncBookingFromReceipts` now also reconciles the `BookingInstallment` schedule to `received` (reset + re-apply oldest-due-first, idempotent), so the installment-based receivables stop dunning money already collected. Order matters and was respected: C11 first (complete ledger) → C13 (sync authoritative). Full suite **4,066 pass / 0 fail** (unit + integration).
- **BACKEND FIX #11 — C8 sibling** `vendorCompletenessController.js:47` (baaqi-tracked count): same snapshot-balance → reconciled-downPayment fix. 460 integration/http pass.
- **FINAL TALLY: 17 of 20 confirmed findings FIXED + test-verified** — C1,C2,C3,C4,C5(orphan),C6,C7,C8(+sibling),C9,C10,C11,C12,C13,C14,C17,C19,C20. All the daily vendor-facing money-truth + authorization + refund/settlement/deposit correctness bugs, integration-verified against the live pglite DB (full suite 4,066–4,219 pass). Backend on the local branch only (not deployed, per policy).
- **BACKEND FIX #12 — C18 (primary readers + the correctness bug):** proved safe first — refund PaymentTransactions are ALWAYS separate rows (Stripe `status:"refunded"`; cash-refund-owed `status:pending→completed`, positive `amount`), so NO legitimate payment row carries `refundAmount > 0`. Then excluded `refundAmount > 0` from: **`bookingController.js:1453`** (`capturedAgg` — a settled refund inflating "captured" was letting a booking wrongly flip to **Paid**; the real correctness bug in C18) and the two admin **received-revenue** sums (`analyticsController` 277 receivedRevenue + 338 prevRevenue). plus **`platformPulseController` 126/127** (money-in pulse — a plain gross sum with no separate refund line, so the guard is safe there). Full integration + http 460 pass / 0 fail. ⏳ Only 2 super-admin aggregates left — `analyticsController` 545 (per-entity revenue findAll) + `getPlatformRevenue` gross (~1667): these likely NET refunds as a SEPARATE line, so a blind guard could double-remove — need per-query refund-handling analysis before touching. (2251 is a PaymentReceipt sum — self-nets via negative rows, not a C18 site.)
- **FINAL TALLY: 18 of 20 fixed + test-verified.** Only C15 + C16 remain deferred (each for a solid documented reason), plus C5-installment-remainder + the C18 platform-rollup tail.
- ⏳ **2 findings DEFERRED — each genuinely warrants a dedicated careful pass, not a rush (money is the most sensitive area):**
  - **C15** (settlement double-submit concurrency): needs `confirmCashSettlement` wrapped in a txn + `SELECT FOR UPDATE` row lock, which requires threading `transaction: t` through every write AND auditing the helpers (`previewFor`, `resolveSettlementBalance`, `transition`, `loadBooking`) for transaction support — else the writes self-deadlock against the row lock. NOTE: the SEQUENTIAL double-submit is already guarded (the second read sees `outstanding <= 0` → refused); only a true concurrent double-fire races. For this app's scale the multi-helper refactor is higher-risk than the narrow bug — deliberately left.
  - **C16** (`lib/api/payments.ts` flag): this is the COUPLE app's payment-request logic (`determinePaymentType`/`calculatePaymentAmount` — down-payment vs remaining), entangled with `advanceDuePkr` (required advance) vs received semantics and shared with `app/(main)/user/payments/page.tsx`. Rushing risks breaking customers' ability to pay. Vendor-facing money is already correct via the util.
  - **C18** (refund-owed positive txn counted as received): the vendor path already uses `receivedOn` (correct); residual impact is the super-admin `PaymentTransaction.sum` (analytics 277/338/545/1656/2251, bookingController 1453, platformPulse 126/127). Safe fix (exclude `refundAmount > 0` or store negative) needs tracing all 8 creation sites (`refundSettlement`, `vendorCancelService`, `bookingChangeService`, `rescheduleService`, …) to confirm `refundAmount` never coexists with a payment `amount` on one row — else the exclusion drops legit partial-refunded revenue.
  - Plus **C5-remainder** (installment/summary include-alias — needs the join alias verified) and **P1** (plausible; `/payments/booking-status` Stripe-only paid — largely subsumed by the C1/C4 receipts-truth work).
- **DB HARNESS UP + all money fixes now INTEGRATION-VERIFIED.** Brought up the in-process pglite test DB (`node scripts/pglite-server.mjs` on :5433 + `node scripts/db-local-migrate.mjs` to seed) and ran the suites: **full integration 306 pass / 0 fail; entire suite 4,219 pass** (1 http suite flakes only in parallel — passes 7/7 in isolation, unrelated to these changes; 27 skipped). `recordRefundCap` (C4), the refund handshake/request suites (C1), settlement, and deposit are now DB-verified, not just "loads". `cancelNoticeWindow` had locked in the same flag-inversion C1 kills (`Paid`-flag → grand while the received column was 200k) — corrected to money-truth + a flag-lags-receipts assertion.
- **Progress: 7 of 20 confirmed fixed backend + 3 FE = 10 shipped, all now test-verified (integration where a suite exists).** Backend fixes are on the local branch only (not deployed, per policy) — they still need a review + deploy pass.

**2026-09-02 — Field capture rebuilt as a LIVE floor hub (#3 screen-polish) — DONE + headed-verified.**
- The old `field-artifact.tsx` (69 lines) was a static launcher — 4 cards that just `data-nav-btn`'d to leads/receipts/expenses/holds, losing the floor context on every tap, exactly defeating a field screen's purpose. Rebuilt into a live surface, serving "vendor ko kahin aur jana na pary":
  - **Live "aaj field par" tally** — 4 real stat cards (leads today, receipts today count+Rs, kharcha today count+Rs, active holds) from `LeadAPI.list` / `ReceiptsAPI.list({from:today,to:today,businessId})` / `ExpensesAPI.list({from,to})` / `VendorHoldsAPI.list`.
  - **In-place quick-capture** for the two fastest floor grabs — **Lead** (name/phone/event/date → `LeadAPI.create`, source `manual_walkin`) and **Date-hold** (date/time → `VendorHoldsAPI.place`) open as drawers and refetch, without leaving the screen. Payment + expense keep smart deep-links (they need a booking / category).
  - **Today's field-activity feed** (today's captured leads + holds, newest first) + a **real online/offline indicator** (`navigator.onLine` + online/offline events).
  - Ratchet 121/0; headed-verified: 4 tally cards, both capture drawers open (#fl-name / #fh-date), nav cards, live net pill, zero page errors.

**2026-09-03 — Platform-wide consistency audit + Wave A (error/loading states) — DONE + verified.**
- User mandate: "poore platform ko full mature, consistent" — micro-elements, actions/reactions, modals, drawers. Ran a **5-agent parallel consistency audit** (one per screen-group, ~30 screens) against the shared-shell canon (drawers, `.btn`/`.iconbtn`, `toast`+refetch, `.empty`/`.loadwrap`/`errorBannerHtml`, `pkNum`/`escHtml`, `data-nav-btn`, Urdu-Roman copy). Consolidated ~90 findings.
- **Dominant systemic issue: missing `isError` handling** — ~18 data screens showed a **false-empty/zero** or a **perpetual spinner** on fetch failure (worst on money screens: brokers empty ledger, venue-os all-zero P&L + verdict, today, bookings). This is the "missing-not-zero" trust trap the shared `errorBannerHtml()` exists for.
- **WAVE A SHIPPED (via 5 disjoint per-bucket fix-agents, ratchet 121/0):** every data screen now has `isError → errorBannerHtml()` + a `[data-retry]` handler + a `.loadwrap` loading branch. **31 screens now import `errorBannerHtml`** (≈ the whole platform). Normalized all error branches to ONE form (head-wrapped, screen title stays visible — converted 8 bare ones incl. the staff/suppliers models). Plus named fixes: async buttons disable + "…" (quotes/pdcs/receipts/collaborations/holds/field/calendar), "Tareekh"→"Taareekh" unified, today status→`bookingStatusLabel`, reviews status→Urdu label, leads budget→`pkNum` + empty-CTA, receivables WhatsApp toast, `crumbBold` corrected where confirmable (quotes→Bechna, tax→Khata, collaborations→Grow), receipts tab-persistence.
- **Shell-canon hoist:** moved `.loadwrap`, `.iconbtn` (+ tones), `.rs` into `SHELL_CSS` (injected before extraCss, so existing screens' local copies still win — zero visual change; only localless/future screens inherit, and drift stops).
- **Bug fixed:** `bookings-artifact` invalidations used `["bookings-artifact"]`, which never prefix-matched `useFetchData`'s real key `["/api/v1/bookings", "bookings-artifact", params]` — retry + every save-refetch silently never fired. Switched to the `["/api/v1/bookings"]` endpoint prefix.
- **Headed-verified** (simulated 500 per endpoint): bookings, brokers, today, reviews all show the error banner + retry + title on failure — no false-empty, no stuck spinner.
**2026-09-03 — Consistency Wave C (inline forms → shared drawer) — DONE + headed-verified.**
- **10 screens' bespoke inline `.addform` create/edit panels converted to the canonical `openDrawer`** (matching leads / slots / booking-detail): staff, suppliers, expenses, inventory, receipts, pdcs, packages (both the package AND menu forms), brokers, spaces (both the space AND merge-group forms), holds. Via 5 disjoint per-bucket fix-agents against the `slots-artifact` gold-standard recipe.
- Each: form markup moved into a `formBody(record?)` using `.dfield`/`.dlabel`/`.dfield.row2`/`.ww-dfoot` (inputs auto-styled by the shell's `.ww-dbody`, so the redundant local `.addform`/`.field`/`.flabel`/`.frow`/`.af-foot`/input CSS was deleted); add + row-Edit + Duplicate buttons now `openDrawer(...)`; Cancel is the shell's global `data-drawer-close`; **all validation + create-vs-update branching + edit-prefill + Duplicate flows preserved** (same field ids, so the save handlers were largely unchanged); save now `closeDrawer(s)` + toast + refetch, with disable + "…" during the await. receipts/pdcs also moved their "Naya" CTA from `.filters` into the header `.head-actions`; the pdcs bounce-reason inline row was correctly left as a row-action.
- **Ratchet 121/0** across all 10. **Headed-verified**: every screen's "add" opens a `.ww-drawer` with `.dfield` fields + `.ww-dfoot`, no leftover inline `.addform`, zero page errors. The create/edit experience is now uniform platform-wide.
**2026-09-03 — Consistency Wave B (destructive-action confirm + icons) — DONE + verified.**
- **New shared in-design confirm:** added `openConfirm(shadow, { title, message?, confirmLabel?, cancelLabel?, danger?, onConfirm })` + `.btn-danger` + `.ww-confirm` CSS to the shell — ONE consistent confirm dialog for every destructive action, replacing one-click deletes and the native `window.confirm` (which broke the champagne look). Self-contained (injects its own scrim+card, wires its own buttons, escapes the title), so no screen needs bespoke confirm markup.
- **~11 record-deletes across 9 screens now gated behind it** (via 3 fix-agents): staff, suppliers, brokers, packages (package + menu), inventory, expenses, receipts, pdcs, spaces (space + combo — replaced its native `window.confirm`). Each moves the existing delete API + toast + refetch verbatim into `onConfirm`; the record name is in the title where available. Non-destructive actions (edit, save, duplicate, lifecycle transitions, ledger) untouched.
- **venue-os emoji→IC:** the profit-verdict hero used literal emoji (⚠️🎉👍🩺) for its status icon — replaced with `svg()`+`IC` glyphs (alert/trophy/thumb/pulse) in a toned icon box, matching the console's icon system everywhere else.
- **Bug fixed (surfaced by the delete-verify):** `spaces` crashed on space-delete (`x.path.startsWith(node.path)` when a sub-venue path is null — a pre-existing latent bug in the child-count computation). Null-guarded.
- **Ratchet 121/0.** **Headed-verified**: on brokers/packages/receipts/inventory/spaces, clicking delete now opens the shared `[data-ww-confirm]` dialog with OK/Cancel, and Cancel closes it without deleting — zero page errors.
- Deferred (lower value / per-case): icon-button class unification (`.mini` etc. are often text-buttons, not pure icon — no clean blanket swap); `.seg`/`.tabs` dedup (minor).
**2026-09-03 — Consistency Wave D (overview → useArtifactShell) — DONE + headed-verified.**
- The dashboard landing page (`dashboard/artifact/overview-artifact.tsx`) was the last screen bypassing the shared shell — it re-implemented ~250 lines of `SHELL_CSS` + its own `SHELL` markup + own `attachShadow` + duplicate biz-switcher/theme/nav/bell/click wiring. Migrated it onto `useArtifactShell` (careful hand rewrite, not a fan-out): separated its unique CSS (`.kpi`/`.chip`/`.chart`/`.occ`/`.rev`/`.seg`/`.row`/`.ring`/`.plan` + card overrides + grid media-queries) into `extraCss` and dropped the shell-duplicate; moved the greeting + head-actions into `buildContent`; kept `buildContent`/`renderCharts` untouched; re-wired only the revenue 3M/6M/1Y range toggle (nav/theme/biz/bell now come from the shell). Removed the now-dead imports.
- **Ratchet 121/0. Headed-verified + screenshot:** the dashboard renders identically on the shared shell — real module nav + biz-switcher (inherited, not duplicated), greeting, 4 KPI cards + sparklines, revenue area-chart, occupancy ring, events/leads/rating/wapsi/profile cards, head-actions; the range toggle re-draws the chart; **zero page errors**. The dashboard now inherits future shell improvements automatically.
- **CONSISTENCY EFFORT COMPLETE — Waves A + B + C + D all done + verified.** Every vendor-console screen is now on the shared shell with uniform error/loading states, create/edit drawers, destructive-action confirms, and shared chrome. Canon in [[ww-console-consistency-canon]].

*Source of truth: audit of `ems-v0` (frontend) + `ems-v0-backend` (Express/Sequelize/Postgres). This document supersedes the earlier shallow module map. Update it as each module is verified + shipped.*
