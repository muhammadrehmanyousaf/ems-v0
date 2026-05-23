# WeddingWala Vendor OS — Master Plan & Living Spec

> **Status:** LIVING DOCUMENT. This is the single source of truth for the
> WeddingWala dashboard (vendor + admin + super-admin). Every role, module,
> gap, decision, and build phase is recorded here and updated as we ship.
> **Owner of record:** muhammadrehmanyousaf786@gmail.com
> **Last updated:** 2026-05-24
>
> **Prime directive (non-negotiable):** WeddingWala is LIVE production. Every
> change is **additive, backward-compatible, flag-gated, zero-downtime**.
> Never break a working surface. Nothing ships without a build + a flag/kill-switch.

---

## 0. The honest reality check (read this first)

The earlier brief was written as if the dashboard is "basic / a toy." It is **not**.
A full audit of the codebase (2026-05-24) shows **40+ dashboard routes already exist**:

```
admin/audit-logs  admin/disputes  admin/documents  admin/force-majeure
admin/platform-pulse  admin/vendor-queue  automation  bookings  bookings/[id]
brokers  business  businesses  businesses-overview  calendar  chat  customers
customers/[id]  drone-noc  expenses  function-sheets  generator-fuel  halal-certs
insights  inventory  leads  notifications  onboarding  packages  payments  pdcs
profile  receipts  reliability  revenue  reviews  roles  settings  staff
suppliers  tax  today  users  vendors
```

So the gap is **not** "build everything from zero." The gap is:

| Problem | Severity | Evidence |
|---|---|---|
| `/dashboard/bookings` throws "We hit an unexpected error" | 🔴 **P0** | User screenshot — booking listing crashes for a fresh vendor |
| Vendor was shown the **Admin** dashboard | 🟠 fixed `9669954` | `roleId 2` (Vendor) was treated as admin in `dashboard-role.ts` |
| `GET /api/v1/users` leaks **all users + emails** to any logged-in account | 🔴 security | Vendor token returned full user list in live audit |
| UX/polish not "world-class" — feels generic, empty states bland | 🟠 P1 | User feedback ("tatti dashboard"), screenshots |
| Several pages are real but **empty** (fresh vendor, no data) | 🟡 expected | Customers/Reviews/Notifications/Payments all render "No results" |
| **Promotion / Featured listing + super-admin approval flow** | 🟠 **missing** | No vendor→admin "promote me to homepage" workflow exists |
| Module depth vs HoneyBook/Dubsado (quotes, Smart Files, pipeline Kanban, WhatsApp template library, automation builder) | 🟡 P2 | Benchmark gap |

**Translation:** the skeleton is ~80% there. We need to (1) fix what's broken, (2) make it beautiful and deep enough that a vendor abandons their bahi-khata, and (3) add the promotion + approval loop.

---

## 1. Roles & access matrix

Backend role table (`Roles`): `1 = super admin`, `2 = Vendor`, `3 = User (customer)`.
Each `User` also carries `isVendor`, `isSuperAdmin`, `vendorType`, and a role `type` field.

> ⚠️ **Backend reality:** the entire `/api/v1/admin/*` namespace is guarded by
> `[auth(), superAdmin()]` — there is **no separate "admin" tier on the backend**.
> The frontend has an `admin` role concept (`ADMIN_ROLE_NAMES`) but nothing maps to
> it in the DB today. **Decision needed (§9-D1):** do we introduce a real mid-tier
> "Admin/Moderator" role, or collapse to super-admin only?

| Surface group | Super Admin | Admin (proposed) | Vendor | Customer |
|---|---|---|---|---|
| Vendor approval queue | ✅ | ✅ | ❌ | ❌ |
| KYC documents | ✅ | ✅ | ❌ | ❌ |
| Disputes | ✅ | ✅ | own only | own only |
| **Promotion/Featured approvals** (new) | ✅ | ✅ | request only | ❌ |
| Directory (vendors/businesses/customers) | ✅ | ✅ (read) | ❌ | ❌ |
| Revenue (platform) | ✅ | ✅ | ❌ | ❌ |
| Audit logs / Roles / Users | ✅ | ❌ | ❌ | ❌ |
| Force majeure (batch cancel) | ✅ | ❌ | ❌ | ❌ |
| Own bookings/payments/calendar/staff/etc | (n/a) | (n/a) | ✅ | ❌ |
| Customer trip-planning / favourites | ❌ | ❌ | ❌ | ✅ `/user/*` |

**Vendor sub-typing:** vendor nav is filtered by `getVendorTypeConfig(vendorType)` —
a Photographer does **not** see Generator Fuel / Halal Certs; a Marquee owner does.
This is correct and must be preserved/extended per module.

---

## 2. Competitor benchmark (what "world-class" means)

Researched 2026-05 — HoneyBook & Dubsado are the bar for service/wedding CRMs.

**HoneyBook** (the polish bar):
- **Smart Files** — proposal + contract + invoice + pay, all in ONE document the
  client signs & pays without leaving the page. *We must match this with a unified
  Quote→Contract→Token flow.*
- **Projects Board** — drag-and-drop **Kanban pipeline** (our Module 1/6 must have this).
- **Client portal via magic link** — no password. (We can do a WhatsApp magic-link.)
- **Automations** with simple yes/no branching; **AI** drafts emails, summaries, trend analysis.
- Recurring/auto-pay invoices, SMS reminders, mobile-first.

**Dubsado** (the depth bar):
- **Advanced multi-step workflows** with conditional logic (branch on package chosen,
  pause until task done, auto-update status). *Our automation engine should aim here.*
- Highly customizable **forms**: proposals, contracts, questionnaires, brochures, timelines.
- Powerful scheduler with booking fees, padding time, form attachments.

**Where WeddingWala WINS (Pakistani moat HoneyBook/Dubsado can't touch):**
- **Cheque / PDC management** (post-dated cheques: bank, due date, deposit alerts, bounce recovery) — exists at `/dashboard/pdcs`.
- **Bahi-khata cash flow** — cash + EasyPaisa/JazzCash + bank + cheque + online in one ledger.
- **Multi-event Pakistani wedding** awareness: Dholki → Mehndi → Mayun → Baraat → Walima.
- **Islamic calendar** blackouts (Muharram/Ramadan/Eid) — exists in `/dashboard/calendar`.
- **Broker/referral commission** network — exists at `/dashboard/brokers`.
- **Urdu (Noto Nastaliq)** first-class.
- **Generator fuel / Halal cert / Drone NOC** compliance — Pakistani-specific, already scaffolded.

> Bar to clear: **"yaar yeh toh kamal hai"** — better than HoneyBook on polish,
> deeper than Dubsado on Pakistani workflow.

Sources: [HoneyBook](https://www.honeybook.com/), [HoneyBook client portal](https://www.honeybook.com/blog/announcing-the-new-client-portal), [HoneyBook product updates](https://www.honeybook.com/blog/product-updates-march-2026), [Dubsado vs HoneyBook (Assembly)](https://assembly.com/blog/dubsado-vs-honeybook), [Dubsado vs HoneyBook (HoneyBook)](https://www.honeybook.com/blog/dubsado-vs-honeybook).

---

## 3. Pakistani vendor pain → feature map

| Pain (bahi-khata world) | WeddingWala module | Status |
|---|---|---|
| Bookings in WhatsApp + register | Bookings CRM (M2) | exists, **crashing** |
| Double-booking same date | Calendar conflict detection (M4) | partial |
| Token/advance chaos | Advance tracker / Khata (M3) | partial |
| Post-dated cheques | PDC / cheque ledger (M3) | exists `/pdcs` |
| Staff salary/commission manual | Staff & payroll (M5) | exists `/staff` |
| Hidden costs (fuel, electricity) | Expenses + profit/event (M3) | exists `/expenses` + `/generator-fuel` |
| No peak-season insight | Analytics / Insights (M9) | exists `/insights` |
| Last-minute cancellations | Cancellation policy engine (M2) | partial |
| Multiple events/day | Time-slot booking (M2/M4) | partial |
| Islamic calendar planning | Calendar Hijri overlay (M4) | exists |
| Inflation/seasonal pricing | Pricing rules (M7) | partial |
| No source analytics | Marketing attribution (M9) | partial |
| WhatsApp is primary | WhatsApp templates (M10) | **missing/shallow** |
| Urdu-only staff | Urdu i18n | exists (EN/اردو toggle) |
| Mixed payment modes | Payments multi-mode (M3) | exists |
| Broker referral commissions | Broker network (M6) | exists `/brokers` |
| Reviews never collected | Auto review prompt (M8) | exists (cron) |
| **Wants homepage promotion** | **Featured/Promotion + admin approve** | **MISSING — design in §7** |

---

## 4. The 10 modules — status, gap, contract

> Legend: ✅ built & working · 🟡 built but shallow/empty · 🟠 partial · 🔴 broken · ⬜ missing

### M1 — Command Center Dashboard  ·  Route `/dashboard`  ·  🟡 built, polish
Already rich: hero KPIs (Total Bookings, Revenue Collected/Due, Today's Events),
Profile Completeness (62/100 + suggestions), Verification tier, Operations Summary
(Today's Floor, Open Timeline Tasks, Low-fuel generators, Money In/Out A/R-A/P,
Compliance flags), Offline/Online revenue split, Upcoming 7 days, Bookings chart,
Booking status, Recent bookings, Customer reviews.
- **Gap to world-class:** live clock + Hijri date strip; weather for outdoor events;
  animated counters; **Smart Alerts** that are *actionable* (Send reminder / Mark paid
  inline); floating Quick-Actions bar; confetti on booking-confirm micro-interaction.
- **API:** `GET /api/v1/dashboard/summary` (verify exists; today's floor + KPIs).

### M2 — Bookings CRM  ·  Route `/dashboard/bookings` (+ `/[id]`)  ·  🔴 **P0 CRASH**
- **P0:** `BookingListingView` throws → error boundary. **Must fix first** (diagnose
  the data fetch / null map; likely empty-data or a field rename post-migration).
- **Gap:** step-by-step **Booking Creation Wizard** (7 steps in brief); status
  color-coding; **conflict detection** (date + time-slot for multi-event vendors);
  booking detail = CRM timeline + payment ledger + WhatsApp link + invoice PDF;
  **cancellation/refund policy engine** auto-calculating forfeiture.
- **API:** `GET/POST /api/v1/bookings`, `GET /api/v1/bookings/:id`, conflict check
  endpoint, `POST /:id/cancel` (refund calc).

### M3 — Payments & Khata  ·  `/payments` `/pdcs` `/receipts` `/expenses`  ·  🟠 partial
- Built: offline/online revenue split, totals, payment tabs, cheque ledger route, expenses route.
- **Gap:** record payment modal with **mode = Cash/Bank/EasyPaisa/JazzCash/Cheque/Online**
  + proof photo; **cheque lifecycle** (Received→Deposited→Cleared/Bounced) + deposit
  alert 2 days prior + bounce recovery; **advance/token tracker board**; **outstanding
  A/R board** sorted by overdue; revenue analytics (by event type, by source, peak heatmap);
  expense → **profit per event**; monthly P&L.
- **API:** `POST /api/v1/payments` (mode, ref, proof), cheque CRUD, `GET .../analytics`.

### M4 — Smart Calendar  ·  `/calendar`  ·  ✅ strong
- Built: Month/Week/Day, **Hijri overlay**, upcoming Islamic dates with one-click **Block**,
  online/blocked/offline legend, right-click block/unblock, Manage Availability.
- **Gap:** Agenda list view; drag-drop reschedule w/ client notify; peak-season heatmap
  overlay from own history; team-availability overlay; weather on outdoor dates.

### M5 — Team & Staff  ·  `/staff`  ·  🟠 partial
- **Gap:** roster (role, CNIC, photo, active); salary type Fixed/Commission/Both;
  monthly payroll + payslip PDF; event assignment + workload + double-assign prevention;
  attendance + "need replacement" alert.

### M6 — Clients & Relationships  ·  `/customers` `/leads` `/brokers`  ·  🟡 built, empty
- Built: customers table, leads route, brokers route.
- **Gap:** client profile = history + LTV + referral tracking + VIP/difficult flag +
  WhatsApp link; **broker commission** ledger + leaderboard; communication log + follow-up
  reminders; **Lead pipeline Kanban** (Inquiry→Proposal→Negotiating→Won/Lost) + conversion rate.

### M7 — Packages & Pricing  ·  `/packages` `/settings?tab=packages`  ·  🟠 partial
- Built: package list in settings, type-specific tabs.
- **Gap:** package builder (per-head vs flat, includes/excludes, add-ons); **Quote
  Generator** → branded PDF → WhatsApp/email → status (Sent/Viewed/Accepted) — *this is
  HoneyBook's Smart File equivalent and a top priority*; pricing rules (peak surcharge,
  weekend premium, advance discount).

### M8 — Reviews & Reputation  ·  `/reviews`  ·  🟡 built (cron-driven)
- Built: review list, auto-prompt cron (3 days post-completion).
- **Gap:** editable WhatsApp prompt template; reputation dashboard (trend, star dist,
  keyword cloud, vs category avg); pin best reviews; **shareable review card image**.

### M9 — Analytics & BI  ·  `/insights` `/revenue` `/reliability` `/tax`  ·  🟠 partial
- Built: insights, revenue, reliability score, tax report routes.
- **Gap:** **Business Health Score 0–100** with improvement actions; seasonal demand;
  marketing attribution; (anonymized) competitor benchmark; revenue + cash-flow forecast.

### M10 — Notifications & Comms  ·  `/notifications` `/chat` `/automation`  ·  🟠 partial
- Built: notifications (tabs), chat, automation route.
- **Gap:** **WhatsApp Template Library** (Booking confirm / Payment reminder / Event-day /
  Thank you / Review request / Cancellation) — editable, one-click pre-filled WhatsApp;
  **automation builder** (Dubsado-style triggers: 7-day event reminder, 2-day cheque
  reminder, 3-day review request, 7-day lead follow-up); smart-grouped notifications.

---

## 5. NEW — Promotion / Featured Listing + Super-Admin Approval (the flow you asked for)

**Goal:** a vendor who wants homepage / category-top placement requests it; super-admin
reviews and approves/denies; approved vendors surface on the public site with a badge and
within a paid/automated window. Mirrors how `sponsored`/`Featured` already renders on
vendor cards (`VendorCard` has a `sponsored` ribbon) — we wire the *workflow* behind it.

**Vendor side** (`/dashboard/promote` — new, flag `FEATURE_PROMOTIONS`):
1. Choose placement: Homepage hero · Category top · City top · Search boost.
2. Choose window (7/15/30 days) + see price (PKR) + see current slot availability.
3. Pay (token/online) or "request invoice."
4. Submit → status **Pending review**.

**Super-admin side** (`/dashboard/admin/promotions` — new):
- Queue of promotion requests: vendor, placement, window, payment status, profile quality
  (completeness score, rating, KYC verified).
- Actions: **Approve** (sets `business.sponsored=true` + `promotionType` + `promotionEndsAt`),
  **Reject** (reason → emailed), **Schedule** (future window). Decision written to **audit log**.
- Guardrails: max N homepage slots at once; auto-expire on `promotionEndsAt`; only
  `status=approved` + KYC-verified vendors eligible.

**Public side:** homepage/listing reads `sponsored=true && now<promotionEndsAt` →
Featured ribbon + priority sort (already supported by `VendorCard` + listing sort).

**Data (additive migration):** `Businesses` add `promotionType`, `promotionStatus`
(`none|pending|approved|rejected|expired`), `promotionStartsAt`, `promotionEndsAt`,
`promotionRequestedAt`. New `PromotionRequests` table for the audit trail.
**API:** `POST /api/v1/promotions` (vendor), `GET/POST /api/v1/admin/promotions/:id/approve|reject` (super-admin, `[auth(),superAdmin()]`).

---

## 6. Cross-cutting standards (apply to every module)

- **Design language:** Bridal tokens already in `globals.css` (gold #C9956C / charcoal /
  ivory / blush). Playfair Display (display italic) for headings, Inter for UI, **Noto
  Nastaliq** for Urdu. Dark mode supported. Keep it — do **not** introduce new palettes.
- **Data tables:** search + sort + **export CSV** + column toggle + mobile card fallback.
- **States:** skeleton loaders (not spinners), helpful empty states w/ CTA, explicit error states.
- **Money:** PKR with Pakistani grouping (`1,50,000`), never bare numbers.
- **Dates:** dual — `15 Jan 2026` + `15 Rajab 1447` (Hijri util exists at `lib/hijri.ts`).
- **i18n:** every new string via i18n keys (EN + اردو).
- **PWA/offline:** calendar + today's bookings available offline (SW already present).
- **Perf:** dashboard < 2s; lazy-load heavy charts.
- **RBAC:** UI guard (`AdminGuard`/`getDashboardRole`) **and** backend guard must agree.
  *(Fix `/api/v1/users` leak — see §8.)*
- **Safety:** every module behind a `NEXT_PUBLIC_FEATURE_*` flag; default-off until verified.

---

## 7. Phased delivery plan (additive, flag-gated, in priority order)

### Phase 0 — Stop the bleeding (P0, do first)
- [x] **Fix `/dashboard/bookings` crash** — root cause: `BookingListingView` (a Client
  Component) called `searchParamsCache.get()` from `nuqs/server` (server-only) → threw on
  the client → whole page hit the error boundary. Now reads via `useSearchParams()`.
- [x] **Close `/api/v1/users` read leak** — `GET /users` and `GET /users/:id` now require
  `superAdmin()` (self-service `/profile/me` stays open). Verified no vendor flow uses them.
- [x] Fix vendor-shown-as-admin (`dashboard-role.ts`) — shipped `9669954`.
- [ ] **Follow-up (flagged):** `/api/v1/users` WRITE endpoints (`PATCH /`, `POST /`,
  `DELETE /`, `change-status`, `vendor-profile-update`) are still `auth()`-only. They appear
  admin-only by usage, but need controller-level RBAC review before guarding — don't blind-guard.

### Phase 1 — Make it world-class where it already exists (polish)
- [ ] M1 Command Center: Hijri/clock strip, actionable Smart Alerts, Quick-Actions bar, micro-interactions.
- [ ] Empty states + skeletons + CSV export pass across all tables.
- [ ] M2 Bookings: creation wizard + conflict detection + booking-detail CRM view.

### Phase 2 — Close the money & comms gaps (highest vendor value)
- [ ] M3 Khata: payment modal (all PK modes + proof), cheque lifecycle + alerts, A/R board, analytics.
- [ ] M7 Quote Generator (Smart-File equivalent) → PDF → WhatsApp → status.
- [ ] M10 WhatsApp Template Library + automation reminders.

### Phase 3 — Growth & intelligence
- [ ] **Promotion/Featured + super-admin approval** (§5).
- [ ] M9 Business Health Score + forecasting; M6 lead pipeline Kanban + broker ledger;
      M5 payroll; M8 reputation dashboard + shareable cards.

> Each item ships as its own additive PR behind a flag, build-verified, no regression.

---

## 8. Known bugs / debts (tracked)
- 🔴 `/dashboard/bookings` crashes (P0, Phase 0).
- 🔴 `GET /api/v1/users` exposes all users+emails to any auth user (Phase 0).
- 🟡 `GET /api/v1/roles` returns role list to vendors (low; filter or guard).
- 🟡 Many pages empty for fresh vendors — expected, but seed/demo data would help UX testing.
- 🟢 Vendor-as-admin mislabel — FIXED `9669954`.

## 9. Decisions (locked 2026-05-24)
- **D1 — Admin tier:** ✅ **Super-admin only.** Backend already has no admin tier; drop the
  unused `admin` concept from the frontend (`getDashboardRole` keeps name-based detection for
  forward-compat but no role maps to it). All admin surfaces stay `[auth(),superAdmin()]`.
- **D2:** Promotion pricing — flat per-window (default). (Revisit auction later.)
- **D3 — WhatsApp:** ✅ **Manual `wa.me` pre-fill** (free, ships now). One-click opens WhatsApp
  with the templated message pre-filled; vendor taps send. (Business API later if needed.)
- **D4:** Quote/Invoice PDF — TBD at M7 build time (lean to client `react-pdf` first).
- **D5 — First vendor type to perfect E2E:** ✅ **Wedding Venue / Marquee** (hardest case:
  capacity, multi-event days, fuel, halal — proves the system handles the worst case).

## 10. Change log
- 2026-05-24 — Doc created. Audited current dashboard (40+ routes). Benchmarked HoneyBook/Dubsado.
  Fixed vendor-as-admin role bug (`9669954`). Logged bookings crash + `/users` leak as P0.
- 2026-05-24 — Decisions locked (D1 super-admin-only, D3 wa.me, D5 Venue-first).
  **Phase 0 shipped & verified live:**
  · Bookings crash fixed (`2f31d7a`, FE) — nuqs server cache called from a client component.
  · `/users` + `/users/:id` read leak closed (`b1d5b03`, BE) — verified live: vendor→403, super-admin→200.
  · Flagged `/users` write endpoints for follow-up RBAC review.
  **Next:** Phase 1 (polish existing modules, Venue vendor first) + Phase 2 (Khata, Quote gen, WhatsApp).
- 2026-05-24 — **v2 deep research + gap analysis** (see §11–§14). Verdict: v1 plan was ~70%
  (a strong horizontal skeleton). Found CRITICAL missing pieces: FBR e-invoicing (legal),
  Excel import/migration (adoption), contracts/e-sign + client portal (table stakes), and
  vendor-type-specific deliverables (galleries, floor plans/BEO, kitchen sheets).

---

## 11. v2 GAP ANALYSIS — is the plan 100% complete? **Honest answer: NO (v1 was ~70%).**

Benchmarked the *vertical* leaders (not just HoneyBook/Dubsado): venues
(Tripleseat / Planning Pod / Event Temple), photography (Studio Ninja / Táve→VSCO /
Sprout / Pic-Time), catering (Caterease / Planning Pod F&B / CaterZen), plus Pakistani
tax + payments reality. v1 covered the **horizontal CRM** well but **missed the
"core deliverable" surface of each vendor type and four critical cross-cutting modules.**

### 11.1 CRITICAL gaps (must-have — legal / adoption / table-stakes)
| # | Gap | Why critical | Status in v1 |
|---|---|---|---|
| **G1** | **FBR e-invoicing** (SRO 709, 2025) — JSON → FBR/PRAL, QR code, 6-yr archive, sales-tax + withholding | **Legally mandatory** for sales-tax-registered vendors (phased Nov–Dec 2025). **No PK wedding tool does this** → killer differentiator | only a vague `/tax` route |
| **G2** | **Excel / data import & migration** (bulk import bookings, customers, payments, cheques) | The user's #1 adoption need — "Excel say jaan churwana." Vendors won't switch without their history | ⬜ missing (only `/onboarding`) |
| **G3** | **Contracts + e-signature** | Table stakes — HoneyBook/Studio Ninja/Event Temple all have e-sign | folded loosely into "quote", not a real module |
| **G4** | **Client portal (magic link)** — client signs, pays, sees timeline + gallery | Standard in every competitor; the polished surface clients judge you by | mentioned, not a module |

### 11.2 Vendor-TYPE-specific "core deliverable" surfaces (v1 was too horizontal)
Each type has a money-making surface a generic CRM can't replace:
| Vendor type | Core deliverable surface (must-have) | v1 |
|---|---|---|
| **Wedding Venue / Marquee** *(build first)* | **BEO / function-sheet** (formal: spaces, headcount, F&B, timeline, setup, payments) + **floor plan / seating chart** (stage, family tables, gents/ladies separation) + multi-hall/space inventory + deposits | partial (`/function-sheets`); floor plan ⬜ |
| **Photographer / Videographer** | **Galleries / proofing / image delivery** + shot list + album selection + (opt) print/print-store + second-shooter assignment | ⬜ missing |
| **Caterer** | **Kitchen production sheet** + recipe/ingredient costing (auto-scale by headcount) + **dietary/halal tags** + staffing ratios (waiters per N guests) | partial; kitchen sheet ⬜ |
| **Makeup / Henna artist** | Trial bookings, **kit/product inventory**, travel-to-home logistics, multi-bride/day slots | partial |
| **Car rental** | Fleet + driver assignment + **fuel/km log** + route + per-vehicle availability | exists, deepen |
| **Bridal wear** | Outfit/rental catalogue + **fitting/alteration schedule** + deposit/security | partial |
| **Stationery / Invitations** | **Design proofs** + print-run tracking + delivery schedule | partial |
| *(14 new categories)* | Generic flow today; specialty polish later | generic |

### 11.3 Other gaps
- **G5 Proposals + Questionnaires/intake forms** (distinct from quote/contract — Dubsado/Táve pattern).
- **G6 Payment-rail depth:** **Raast P2M QR** (instant, low-cost, SBP), EasyPaisa/JazzCash, gateway (AssanPay/XPay/Safepay), auto-pay + payment plans. (60%+ of PK prefers wallets over cards.)
- **G7 Day-of timeline / run sheet** shared with client + team.
- **G8 Marketplace lead funnel** — weddingwala.pk listing → inquiry → lead → quote (the discovery→ops bridge).
- **G9 Reviews → shareable marketing assets** + reputation depth.
- **G10 Vendor SaaS model** — how does the vendor pay WeddingWala? (commission vs subscription vs freemium + promotion fees) — **decision needed (D6)**.

## 12. NEW modules added by v2 (additive to the original 10)
- **M11 — Contracts & e-signature** (template library, fill from booking, client e-sign via portal/magic link, audit trail, PDF).
- **M12 — Client Portal** (magic-link, no password: view booking, pay token/balance, sign contract, see timeline + (photographer) gallery).
- **M13 — FBR e-Invoicing & Tax** (sales-tax + withholding, FBR/PRAL JSON + QR, 6-yr archive, P&L/tax reports). *Flagship Pakistani moat.*
- **M14 — Data Import / Migration** (CSV/Excel import wizard for bookings, customers, payments, cheques; column-mapping; dedupe; the "leave your register behind" onboarding).
- **M15 — Proposals & Intake Forms** (branded proposal, questionnaire to collect event details).
- **M16 — Type-specific deliverable surfaces** (Venue floor-plan/BEO · Photographer galleries · Caterer kitchen sheet · etc — per §11.2).

## 13. Competitive landscape & our moat (researched)
- **Shadiyana** (PK, raised $800K pre-seed Dec-2025, 600+ vendors, 500K downloads) = a
  **marketplace + planner**; revenue ~80% commissions + vendor subscriptions + marketing add-ons.
  It is a **discovery** layer — **not** a deep vendor operations/management system.
- **HoneyBook / Dubsado / 17hats** = horizontal service CRM (no PK tax, no cheque/khata, no Urdu, no Islamic calendar).
- **Tripleseat / Planning Pod / Event Temple** = venue BEO/floor-plan depth (Western, no PK rails).
- **Studio Ninja / Táve / Pic-Time** = photographer galleries/proofing depth.
- **WeddingWala's moat (defensible, sticky):** the **operations layer** — bahi-khata + cheque/PDC +
  **FBR e-invoicing** + multi-event Pakistani wedding + Islamic calendar + brokers + Urdu +
  fuel/halal/drone compliance + Raast/EasyPaisa/JazzCash. If a vendor runs their *whole business*
  here (not just lead-gen), they never leave. **Shadiyana owns discovery; WeddingWala should own operations.**

## 14. Revised priority (supersedes §7 ordering)
- **P0 (done):** bookings crash, `/users` leak, role bug.
- **P1 — Venue end-to-end** (decision D5): polish command center + bookings wizard + **BEO/function-sheet** + **floor-plan/seating** + Khata payments. Make ONE vendor type flawless.
- **P2 — Adoption + legal moat:** **M14 Excel import** (so they can switch) + **M13 FBR e-invoicing** (legal + unique) + **M11 contracts/e-sign**.
- **P3 — Conversion polish:** **M12 client portal** + **M15 proposals/forms** + Quote generator + WhatsApp templates + Raast/wallet payments.
- **P4 — Per-type deliverables (M16):** Photographer galleries, Caterer kitchen sheet, etc.
- **P5 — Intelligence + growth:** analytics/health score, promotion/featured + super-admin approval, reputation.

### D6 — Vendor SaaS model (LOCKED 2026-05-24): **subscription + freemium + paid promotions.**
✅ **Monthly subscription + freemium tiers + paid promotions/advertising in the marketplace.**
❌ **NO commission on bookings** — never charge the user OR the vendor per booking. Full detail in §17.

Sources: [Tripleseat](https://tripleseat.com/), [Planning Pod BEO](https://planningpod.com/banquet-event-orders), [Tripleseat Floorplans](https://floorplans.tripleseat.com/), [Studio Ninja](https://www.studioninja.co/studio-ninja/), [Planning Pod F&B](https://planningpod.com/food-and-beverage-tools), [FBR e-invoicing (Sovos)](https://sovos.com/regulatory-updates/vat/pakistan-e-invoicing-implementation-timeline-revised-again/), [FBR e-invoicing (KPMG)](https://kpmg.com/us/en/taxnewsflash/news/2025/08/pakistan-compliance-deadlines-e-invoicing.html), [Shadiyana funding (ProPakistani)](https://propakistani.pk/2025/12/09/shadiyana-raises-800000-pre-seed-to-digitize-pakistans-rs-900-billion-wedding-industry/), [Easypaisa Raast P2M](https://www.nation.com.pk/14-Jun-2024/easypaisa-enables-raast-p2m-payments-to-digitise-person-to-merchant-transactions), [PK payment gateways](https://www.xstak.com/blog/payment-gateways-in-pakistan).

---

## 15. VENUE / MARQUEE vendor — REAL Pakistani management problems (researched 2026)

The venue is the build-first type (D5). These are the *actual, current* pain points of
Pakistani marquee/marriage-hall owners — each maps to a concrete feature. This is the moat:
no Western tool (Tripleseat/Planning Pod) and no PK marketplace (Shadiyana) handles this.

| Real problem (2026) | What it means operationally | Feature in the Venue build |
|---|---|---|
| **One-Dish Policy** — provincial law: 1 main + 1 dessert; raids, **sealing, FIRs, fines, permanent closure** for violations | Every booking's menu must stay legal; owner needs proof of compliance | **Booking compliance checklist** (one-dish toggle + menu cap) with red warning + a printable compliance slip per event |
| **Guest-limit caps** (e.g. Sindh **200**, austerity drives, change without notice) | Headcount above the legal cap = penalty; caps differ by city/province & change | **Dynamic guest-limit rule by city/province** → booking validation warns/blocks when headcount exceeds the current legal cap |
| **Closing-time limits** (9pm / 10pm / 11:30pm) | Events must end by a legal hour; slots constrained | **Event end-time enforcement** + slot rules in the calendar/booking wizard |
| **Pricing volatility / inflation** — per-head jumps (~Rs500/head), won't commit to winter pricing (fuel/input uncertainty) | Rates change fast; quotes go stale; cost-linked pricing | **Fast per-head price update** + **seasonal/dynamic pricing** + **quote validity window** + cost-linked margin view |
| **Date discovery / double-booking** in dense 60–70-hall clusters | Two parties on one date/hall = disaster | **Real-time availability + conflict detection** (date AND hall AND time-slot) |
| **Multiple halls + multiple events/day** | A venue is N spaces, each separately bookable | **Multi-hall / multi-space management** — per-hall calendar, capacity, pricing |
| **Generator fuel & load-shedding** | Fuel eats margin; backup power mandatory | exists `/generator-fuel` — link fuel cost → per-event profit |
| **Security cordons / VIP protocol** (esp. Islamabad/Margalla) delay guests | Event-day disruption risk | **Event-day risk note / buffer** + day-of timeline flag |
| **Advance/token + forced cancellations** (guest-cap changes mid-plan) | Refund disputes when law changes after booking | **Cancellation/refund policy engine** + advance/token ledger + policy snapshot on contract |
| **Catering tie-in** (venue+food bundled; one-dish affects F&B) | BEO must reflect legal menu | **BEO / function-sheet** with menu lines tied to compliance |
| **Winter peak season** (Nov–Feb) | Demand + pricing spikes | **Peak-season heatmap** + seasonal pricing rules |
| **Large labor force** (setup crew, waiters) | Crew scheduling per event | Staff module + **staffing ratio** (waiters per N guests) |
| **Halal / hygiene / NOC compliance** | Inspections, fines | Compliance tracker (exists `/halal-certs`) extended to venue permits |

> **Design principle for Venue build:** the dashboard should make a hall owner feel the
> system *protects them from getting fined or double-booked* and *updates prices in 2 taps*.
> That emotional hook — "yeh system mujhe FIR aur double-booking se bachata hai" — is what
> makes them abandon the register.

Sources: [One-Dish raids/sealing (PakistanTruth)](https://www.pakistantruth.com/one-dish-policy/), [Sindh 200-guest limit (Dawn)](https://www.dawn.com/news/1983964), [Karachi one-dish + guest limit (Dawn)](https://www.dawn.com/news/1981097), [Lahore closing-time extension (Dawn)](https://www.dawn.com/news/1872648), [Pricing volatility + security cordons (Dawn)](https://www.dawn.com/news/1998854), [Rawalpindi halls sealed (Dawn)](https://www.dawn.com/news/1792563).

---

## 16. EVERY vendor type — real Pakistani problems → features (researched 2026)

"Think like a complete brain": every paid type gets its real pains mapped to features. The
generic CRM (M1–M10) is the base; the **type-specific surface (M16)** is what wins each type.

### 16.1 Photographer / Videographer
*Pricing Rs 30k–300k+; deliverables = album, cinematic video, drone, reels.*
| Real PK problem | Feature |
|---|---|
| **Edit/delivery delays** — clients chase for months; reputation killer | **Deliverable tracker**: per booking, items (RAW→edit→album→video→reels) with status + ETA + client-visible progress |
| Advance disputes, balance-on-delivery | Advance/balance ledger + "deliver on full payment" gate |
| Second-shooter / team coordination | Crew assignment per event + their rate/commission |
| Oversupply → price pressure | Quote templates + package tiers + portfolio strength on profile |
| Photo selection / proofing chaos (WhatsApp) | **Galleries + proofing + delivery** (M16) — client selects album shots in portal |
| Shot expectations vary | Shot-list / must-have-shots per event |

### 16.2 Caterer
*Oil 2,700→9,700/tin; per-head 1,000–1,500 → 2,500; waste 15–25% (worse when dishes>guests); 200 guests ≈ 14–15 waiters + 5–6 labour + 2–3 cooks.*
| Real PK problem | Feature |
|---|---|
| **Ingredient cost spikes vs fixed per-head** crush margin | **Per-head pricing tied to live ingredient cost + margin view**; reprice fast |
| Small weddings lose economies of scale | Cost-per-head calculator by guest count |
| 15–25% **food wastage** | **Kitchen production sheet** auto-scaled to final headcount (cook the right qty) |
| **Staffing**: right crew per headcount | **Staffing-ratio calculator** (auto-suggest waiters/cooks/labour for N guests) |
| One-Dish law on menu | Menu compliance toggle + halal/dietary tags |
| Last-minute headcount changes | Headcount lock date + change-order recalc |

### 16.3 Makeup Artist
*Peak (3 mo post-Eid) Rs 200k–300k/mo; off-season ~30% of that; "bride factory" overbooking; last-minute cancels tank reviews; mostly undocumented.*
| Real PK problem | Feature |
|---|---|
| **Overbooking** ("bride factory") → poor service, bad reviews | **Per-day bride cap / slot limits**; warn on overbook |
| Last-minute cancellations | No-show / cancellation policy + deposit forfeiture |
| Trials separate from event day | **Trial booking** type linked to the main booking |
| Kit/product cost untracked | **Kit/product inventory** + per-bride product cost |
| Travel to bride's home | Travel-charge add-on + logistics/address |
| Seasonal income swings | Seasonal earnings view + off-season promo nudges |

### 16.4 Henna / Mehndi Artist
*Per-hand Rs 300–50k by tier; travel Rs 500–2,000 (+out-of-city); peak Nov–Feb +50–100%; book 6–12 mo ahead; bulk/early-bird discounts; 30-min wait rule.*
| Real PK problem | Feature |
|---|---|
| Pricing by hands/design complexity | **Per-hand / per-design pricing** + complexity tiers |
| Travel & out-of-city charges | Travel add-on by distance/city |
| **Multiple events/day** (bride + family party) | Multi-slot/day scheduling + **bulk/family-party pricing** |
| Peak-season surge | Seasonal pricing (+%) Nov–Feb |
| Long lead bookings | Advance booking + early-bird discount rules |

### 16.5 Car Rental
*Rs 25k–2.5L/day; book early or miss; drivers must sync across cities; fuel/tolls extra.*
| Real PK problem | Feature |
|---|---|
| **Fleet availability / double-book** | Per-vehicle availability + conflict detection |
| **Driver coordination** across cities, on-time | Driver assignment + route + on-time check; multi-vehicle sync |
| Fuel / tolls / km extra | **Fuel + km + toll log** per trip → profit per booking |
| **Security deposit + damage** claims | Deposit + **damage-claim workflow** (photos, deduction) |
| Package vs per-day pricing | Both pricing modes |

### 16.6 Decorator / Florist
*Labour 25–35% of event price; flower/decor spoilage 15–25%; availability shifts → premium substitutes; setup = vehicle+staff-hours+tolls+load+breakdown.*
| Real PK problem | Feature |
|---|---|
| **Labour cost spirals** on last-minute changes | Setup crew scheduling + **change-order tracking** |
| Decor/flower **inventory spoilage / theft / damage** | **Decor inventory** (props, lights, furniture, fresh flowers) + loss/damage tracking |
| Flower availability + substitution at premium | Sourcing cost + substitution notes per event |
| Setup + breakdown logistics | Setup/breakdown timeline + per-event labour & profit |

### 16.7 Bridal Wear
*Notorious delivery delays; substantial security deposit w/ proportional damage deduction; long custom lead times; rental return condition.*
| Real PK problem | Feature |
|---|---|
| **Delivery/lead-time delays** | Custom-order **milestone tracker** (measure→stitch→fitting→ready) + deadline alerts |
| **Security deposit + damage** (rental) | Deposit + **damage-deduction** workflow + return condition checklist |
| Fittings / alterations | **Fitting/alteration schedule** linked to booking |
| Outfit catalogue (rent vs buy) | Outfit/rental catalogue w/ availability |

### 16.8 Stationery / Invitations
| Real PK problem | Feature |
|---|---|
| **Design proof approval** cycles (WhatsApp chaos) | Proof upload → client approve/reject + revision history |
| Print-run quantity & reprints on error | Quantity + reprint tracking |
| **Delivery before event** (hard deadline) | Delivery-deadline tracker + alert |

> The 14 newer categories (Nikahkhwan, Dhol, Qawwali, Generator, Marquee-rental, Furniture,
> Cakes, Mithai, Live-cooking, Sound, Live-streaming, Event-host) start on the generic flow;
> each gets the same pain→feature treatment when prioritised.

---

## 17. MONETIZATION MODEL (D6 locked) — subscription + freemium + promotions, **NO booking commission**

Researched B2B-SaaS monetization (freemium converts ~2–5%; tiered "good/better/best"; ads in
free tier; paid add-ons). **We never take a cut of a booking** (not from vendor, not from user) —
revenue = subscriptions + marketplace promotions + add-ons. This keeps vendors trusting us with
their real numbers (critical for the khata/FBR features to be adopted honestly).

### 17.1 Subscription tiers (freemium → good/better/best)
| Tier | Who | Includes | Gating |
|---|---|---|---|
| **Free — "Khata Lite"** | adoption hook | Core bookings + calendar + basic khata + **Excel import** + 1 business | caps (e.g. N bookings/mo), WeddingWala branding on quotes, no FBR e-invoice, no automations |
| **Pro — "Business"** | most vendors | Unlimited bookings, full khata + **cheque/PDC**, quotes + **contracts/e-sign**, WhatsApp templates, staff, analytics, branding removed | — |
| **Premium — "Growth"** | scaling / multi-hall | **FBR e-invoicing**, multi-business/multi-hall, **client portal**, automations, forecasting, priority support | — |

> The Free tier exists to get them to **import their Excel** and run daily ops here — once their
> business lives in WeddingWala, upgrading to keep cheques/FBR/contracts is natural. (Pricing
> numbers are hypotheses to validate with real vendors; structure is the deliverable.)

### 17.2 Paid promotions / advertising (à la carte, any tier) — super-admin approved (§5)
- **Homepage hero**, **category-top**, **city-top**, **search boost** (priced per 7/15/30-day window)
- **Featured badge** + priority sort on listings
- **Deal / offer broadcast** to customers (e.g. "winter package 15% off")
- **Marketplace banner ads**
- All flow through the §5 request → super-admin approve → time-boxed placement loop.

### 17.3 Add-ons
- Extra staff seats · gallery storage (photographers) · SMS/WhatsApp credits (if Business API later) · extra businesses.

### New decision needed
- **D7 — tier pricing (PKR):** validate Free caps + Pro/Premium monthly prices with real vendors
  before we hard-code them. (Structure is locked; numbers are placeholders.)

Sources: [Caterer food-cost + waste (Dawn)](https://www.dawn.com/news/746508/food-wastage-at-weddings), [Catering cost guide (Hanif Rajput)](https://hanifrajputcaterers.com/wedding-catering-cost/), [Makeup season volatility (Profit)](https://profit.pakistantoday.com.pk/2017/01/21/a-beauty-full-idea/), [Mehndi pricing/travel (NoorKada)](https://noorkada.com/mehndi-design-price/), [Car rental booking/fleet (PakWheels)](https://www.pakwheels.com/blog/how-to-choose-the-perfect-wedding-car-a-complete-checklist-for-couples/), [Bridal rental deposit/delays (TBS)](https://www.tbsnews.net/features/mode/why-not-rent-your-wedding-attire-553582), [Florist labour/spoilage (Florists' Review)](https://floristsreview.com/calculation-labor-costs-for-wedding-services/), [SaaS freemium/tiered pricing (Zuora)](https://www.zuora.com/guides/saas-pricing-models/).

---

## 18. "Will a vendor need NOTHING external?" — HONEST answer + the last-mile gaps

**Honest verdict (2026-05-24):** the plan (M1–M16 + §15–§17) makes a vendor's **internal
operations** fully self-contained — bookings, khata, cheques, staff, calendar, FBR invoicing,
contracts. ✅ But for **lead acquisition + client comms + marketing-out + financial closure**,
there is a genuine **last-mile gap** that would still send a vendor to an external app. Closing
it gets us to ~99% of real business operations inside WeddingWala (beats HoneyBook/Studio Ninja
on PK-fit, beats Shadiyana on ops). "100% external-free forever for everyone" is not an honest
promise for any software — this is the realistic, defensible target.

**Build decisions (2026-05-24):** M17 ✅ build · M18 ⏸️ later · M19 ⏳ undecided · M20 ✅ build ·
M21 ⏸️ later · M22 ✅ build · **M23 ✅ PRIORITY — game-changing, needs full detailed spec (§20).**

### 18.1 Decisive for "zero external" (build these or vendors keep other apps)
- **M17 — Vendor branded booking / "link-in-bio" page.** PK vendors' leads come from their
  Instagram/WhatsApp **bio link**. HoneyBook + Studio Ninja both ship a branded booking/inquiry
  page. Without it → Linktree / Google Forms / external, and those leads never enter our system.
  *(Ties into their existing marketplace profile — add a direct inquiry/booking funnel + shareable link.)*
- **M18 — Omnichannel lead inbox.** Unify **Instagram DM + WhatsApp + Facebook + marketplace
  inquiries + walk-ins** in one inbox (the Respond.io/Trengo/ManyChat category). This is the #1
  reason a vendor keeps 5 apps open daily. Biggest single "close the other tabs" feature.
- **M19 — Marketing / broadcast out.** WhatsApp/SMS broadcast to past clients: off-season deals,
  Eid/festival greetings, "winter package" offers. Without it → external marketing tools.

### 18.2 Financial closure (for the financially-serious vendor)
- **M20 — Income-tax / annual-return support + accountant export.** FBR e-invoicing (M13)
  covers *sales* tax; year-end *income* tax still sends them to an accountant/Excel. A clean
  export (and PK income-tax helpers) closes the loop.

### 18.3 Moat / polish (raise the ceiling toward zero-external)
- **M21 — Social publishing** — push portfolio/reviews to Instagram/FB from inside (vs Canva).
- **M22 — Data export / ownership / backup** — vendor trusts they're not locked in (adoption confidence).
- **M23 — Vendor↔vendor sub-contracting** — a venue books a photographer *through* the platform
  (otherwise WhatsApp). Network-effect moat + keeps coordination internal.

### 18.4 What we deliberately DON'T try to absorb (out of scope, honestly)
- The bank/wallet apps themselves (we integrate Raast/EasyPaisa/JazzCash, not replace them).
- Instagram/Facebook as social networks (we post to them, don't replace them).
- Hardware (cameras, generators) and physical logistics.

### Truthful summary
| Vendor need | After plan (M1–M16) | With §18 (M17–M23) |
|---|---|---|
| Run bookings/khata/cheques/staff/calendar/FBR | ✅ zero external | ✅ |
| Capture leads from their own IG/WhatsApp funnel | ❌ external | ✅ |
| One place for all client chats | ❌ external | ✅ |
| Market back to past clients | ❌ external | ✅ |
| Year-end income tax | ⚠️ accountant | ✅ export |

> **So: am I 100% sure it's complete with zero external? No — not until M17–M20 are added.**
> With them, yes for ~99% of real operations. I will not claim more than that honestly.

---

## 19. SIDEBAR MODULE MAP — common vs per-type, with craft-localized names

### 19.1 HONEST current reality (verified in `lib/vendor-type-config.ts`)
- **What a vendor ACTUALLY sees today = 8 modules + Business Settings**, identical for every type:
  Dashboard · Bookings · Customers · Calendar · Conversations · Payments · Reviews · Notifications · **Business Settings**.
- **13 routes EXIST but are NOT in the sidebar** (orphaned — built, not linked): Today, Lead inbox,
  Function sheets, Receipts, Cheque ledger (`/pdcs`), Expenses, Inventory, Staff & payroll, Suppliers,
  Brokers, Generator fuel, Halal certs, Drone NOC. → Surfacing these is low-effort, high-value.
- **Craft-localized naming is NOT implemented.** Every type shows the same labels. Only per-type
  differences today: `displayName`, `settingsTabs`, `pricingLabel`, `typeSpecificFields`, packages/menus.
- **Implementation approach (additive):** add `navLabels?: Partial<Record<NavItemKey,string>>` to
  each `VendorTypeConfig`; the sidebar already filters by `mainNavItems`, so we add a label override
  + the new keys. Urdu stays handled by the existing EN/اردو i18n toggle (`i18nKey`), separate from craft-naming.

### 19.2 COMMON modules (every vendor) — the full proposed set
Base nav (always shown), grouped:
- **MAIN:** Dashboard · Today · Bookings · Leads · Customers · Calendar · Conversations · Reviews · Notifications
- **MONEY (Khata):** Payments · Receipts · Cheque ledger · Expenses · *(Premium)* FBR Invoicing
- **BUSINESS:** Packages/Menus · Staff · Inventory · Brokers · Analytics · Promote · Business Settings
- *(Compliance modules below are type-conditional, not common.)*

### 19.3 CRAFT-LOCALIZED names (proposed — the core of your ask)
Same module, named in the vendor's language of work (label only; route unchanged):

| Module (route) | Venue/Marquee | Catering | Photographer | Decorator | Makeup | Henna | Car Rental | Bridal Wear | Stationery |
|---|---|---|---|---|---|---|---|---|---|
| Dashboard | Command Center | Command Center | Command Center | Command Center | Command Center | Command Center | Command Center | Command Center | Command Center |
| Bookings | **Events / Functions** | **Orders** | **Shoots** | **Setups** | **Appointments** | **Appointments** | **Trips** | **Orders** | **Orders** |
| Customers | Clients | Clients | Clients | Clients | **Brides** | **Brides** | Clients | Buyers | Clients |
| Calendar | Event Calendar | Event Calendar | **Shoot Calendar** | Setup Calendar | **Appointment Calendar** | Appointment Calendar | **Fleet Calendar** | Fitting Calendar | Delivery Calendar |
| Packages/Menus | Packages | **Menus** | Packages | Packages | Packages | Packages | **Fleet & Packages** | **Outfits** | **Products** |
| Inventory | Asset Store | **Kitchen & Stock** | **Gear / Equipment** | **Decor Inventory** | **Kit & Products** | Henna Stock | **Fleet** | **Stock** | Stock |
| Function sheets | **BEO / Function Sheet** | **Kitchen Sheet (BEO)** | **Shot List** | Setup Sheet | — | — | Trip Sheet | — | Proof Sheet |
| Staff | Staff & Crew | **Kitchen & Waiters** | **Team & Shooters** | Setup Crew | Team | Artists | **Drivers** | Staff | Staff |
| Payments | Payments (Khata) | Payments (Khata) | Payments (Khata) | Payments (Khata) | Payments (Khata) | Payments (Khata) | Payments (Khata) | Payments (Khata) | Payments (Khata) |

*(Conversations = "Messages", Reviews, Notifications, Promote, Analytics, Expenses, Cheque ledger, Receipts keep the same name across types.)*

### 19.4 PER-TYPE EXTRA modules (the type-specific surface — M16)
On top of the common set, each type gets its winning module(s):

| Vendor type | Extra type-specific modules |
|---|---|
| **Wedding Venue / Marquee** | **Halls / Spaces** (multi-hall) · **Floor Plan & Seating** · **BEO** · **Compliance** (one-dish/guest-cap/closing-time) · Generator Fuel |
| **Catering** | **Menus** · **Kitchen Production Sheet** · **Staffing Calculator** · **Halal/Dietary** · Generator Fuel |
| **Photographer / Videographer** | **Galleries & Proofing** · **Deliverables Tracker** · **Shot List** · Second-shooter assignment · Drone NOC |
| **Decorator** | **Decor Inventory** (props/lights) · **Setup & Breakdown** · Change-orders |
| **Makeup Artist** | **Trials** · **Kit & Products** · Per-day bride cap · Travel |
| **Henna Artist** | **Designs / Per-hand pricing** · Multi-event day · Travel · Mehndi product stock |
| **Car Rental** | **Fleet** · **Drivers & Routes** · **Fuel/KM Log** · **Deposit & Damage** |
| **Bridal Wear** | **Outfit Catalogue** · **Fittings & Alterations** · **Deposit & Damage** · Custom-order milestones |
| **Stationery** | **Design Proofs** · **Print Runs** · **Delivery Deadlines** · Digital-invite files |
| **Nikahkhwan / Dhol / Qawwali / Sound / Generator / Marquee-rental / Furniture / Cakes / Mithai / Live-cooking / Event-host / Live-streaming** | Generic flow today; same pain→feature treatment per type when prioritised |

### 19.5 ADMIN / SUPER-ADMIN sidebar (for completeness — not localized)
- **OVERVIEW:** Dashboard
- **OPERATIONS:** Vendor queue · KYC documents · Disputes · **Promotions** (approve, §5) · Bookings · Payments
- **DIRECTORY:** Vendors · Businesses · Customers
- **PLATFORM:** Revenue · *(super-only)* Audit logs · Roles · Users
- **EMERGENCY** *(super-only)*: Force majeure

## 20. M23 — Vendor↔Vendor sub-contracting / collaboration (PRIORITY — full spec TBD)
Game-changer per owner. Placeholder for the full authentic spec: a vendor (e.g. a Venue) books/refers
another WeddingWala vendor (e.g. a Photographer) *through* the platform — request, quote, accept,
shared event/BEO, split payment/commission, ratings between vendors. Network-effect moat that keeps
inter-vendor coordination inside WeddingWala instead of WhatsApp. **To be fully detailed next.**

---

## 21. BOOKING & AVAILABILITY ENGINE — granular, vendor-controlled (the heart of the system)

This is NOT a sidebar item — it is the **rules engine** under Bookings + Calendar, configured in
**Business Settings → Availability**. Every vendor controls *how they can be booked*. Real-time,
strong-consistency. Designed like a 30-year planner who has seen every Pakistani wedding go wrong.
*(Today the code has only fixed Morning/Afternoon/Evening periods + a 15-min hold + Hijri blackouts.
This §21 is the full target — additive, flag-gated.)*

### 21.1 The configurable rules (each is a per-business / per-resource setting)
| Rule | What it controls | Pakistani example |
|---|---|---|
| **Slot model** | Fixed periods (Morning/Afternoon/Evening) · custom time windows · full-day exclusive · duration-based | Venue = 2 slots/day (lunch + dinner); Makeup = 2-hour slots |
| **Slots per day** | How many bookable slots the vendor offers in a day | *"Aik din mein kitni slots?"* — venue owner sets 1, 2, or 3 |
| **Max bookings PER SLOT** (`capacity`) | 1 = exclusive · N = multiple bookings allowed in the same slot | *"Aik slot mein multiple bookings?"* — Makeup artist = 3 brides/morning; single-hall venue = 1; lawn split into 2 sections = 2 |
| **Max bookings per day** | Hard daily cap across all slots | Photographer = 1 (can't be two places) unless multiple teams |
| **Capacity / guests per slot** | Max guests the slot/hall can hold | Venue hall = 500; caterer crew limit = 1,500 |
| **Buffer (pre/post)** | Setup/teardown/cleanup/travel time blocked around a booking | Venue = 3h cleanup between lunch & dinner; Makeup = 1h travel |
| **Lead time** | Min advance notice to book | "No bookings within 2 days" |
| **Booking window** | Max advance | Mehndi/venue = up to 12 months ahead |
| **Closing time** | Legal event end hour | Venue = must end by 11:30pm (Lahore) / 10pm (Karachi) |
| **Blackouts** | Recurring (every Friday AM) · Islamic (Muharram/Ramadan auto) · one-off (maintenance) | Already partly built |
| **Overbooking / waitlist** | Allow tentative over-capacity · waitlist auto-promotes on cancel | Peak-season demand |
| **Hold/lock** | Token hold TTL (slot reserved while paying) | 15-min hold exists today |
| **Pricing rules** | Per-slot · peak/weekend surcharge · per-head vs flat · advance discount | Winter +20%, Fri/Sat premium |

### 21.2 Multi-RESOURCE model (how one vendor runs many simultaneous events)
A business owns **N bookable resources**; a booking consumes a resource for a slot; **conflict =
same resource + overlapping slot (incl. buffer)**. This is the clean way to model the slot question:
| Vendor | Resource | Multiple-per-slot achieved by |
|---|---|---|
| Venue | **Halls / Lawns / Sections** (Hall A, Hall B) | each hall booked independently → 3 halls = 3 simultaneous events |
| Car rental | **Vehicles** (10 cars) | 10 cars = 10 simultaneous trips |
| Makeup / Henna | **Artists / Teams** | 2 teams = 2 brides same morning |
| Photographer | **Crews** | 2 crews = 2 events; else 1/slot |
| Caterer | **Kitchen capacity** (max total guests/day) | capacity-based, not resource-based |

> So "multiple bookings per slot" is achievable **two ways**, both vendor-controlled: (a) raise
> `capacity` on a single resource, or (b) add more resources (halls/cars/teams). The venue owner
> chooses per hall: 1 event (exclusive) or split capacity.

### 21.3 Per-type DEFAULT booking config (vendor can override every value)
| Type | Slots/day | Per-slot capacity | Resource | Buffer | Notes |
|---|---|---|---|---|---|
| **Venue/Marquee** | 1–2 (lunch/dinner) | 1 per hall | Halls | 2–4h cleanup | closing-time + guest-cap + one-dish compliance |
| **Catering** | many | capacity by total guests/day | kitchen | prep time | headcount lock date |
| **Photographer** | 1–3 | 1 per crew | crews | travel | full-day or per-event |
| **Makeup** | 2–6 | 1 per artist (team→N) | artists | 1h travel | per-day bride cap |
| **Henna** | 2–8 | 1 per artist (team→N) | artists | travel | multi-event/day, family bulk |
| **Car rental** | many | 1 per vehicle | vehicles | return/clean | driver assignment |
| **Decorator** | 1–2 | 1 per crew | crews | setup+breakdown | |
| **Bridal wear** | many (appointments) | N per slot (fittings) | staff | — | fitting vs delivery slots |
| **Stationery** | n/a (order-based) | n/a | — | — | deadline-driven, not slotted |

### 21.4 VENUE worked example (your exact scenario)
*Faisal Marquee, Lahore — 2 halls (Shahi Hall 500, Garden Lawn 300):*
1. Owner sets **2 slots/day** (Lunch 12–4, Dinner 7–11:30 [legal close]).
2. **Capacity per slot = 1 per hall** (exclusive) → so per day the marquee can host up to **4 events**
   (2 halls × 2 slots), or owner sets Garden Lawn to split into 2 → 6 events.
3. **Buffer 3h** between lunch & dinner (cleanup) — engine auto-blocks it.
4. **Guest cap** = min(hall capacity, current legal cap e.g. 200) → warns if booking exceeds.
5. **One-dish compliance** flag per booking; **closing-time** enforced at 11:30pm.
6. Customer books Shahi Hall / Dinner / 15-Dec → **hold 15 min** → token paid → **confirmed**;
   Shahi Hall Dinner 15-Dec now unavailable to everyone, Garden Lawn still free.
7. Offline (walk-in) bookings write to the SAME calendar → no double-book between online & offline.

### 21.5 Booking STATE MACHINE (one source of truth)
`Inquiry → Quoted → Held(token pending, TTL) → Token-Paid → Confirmed → In-Progress → Completed → Reviewed`
side states: `Waitlisted · Rescheduled · Cancelled(+refund calc) · No-show · Rejected · Expired(hold lapsed)`.
Every transition: notify (WhatsApp/in-app) + audit log + calendar sync.

### 21.6 Concurrency guarantee (system perspective — no double-booking, ever)
- **Hold** writes a row with TTL; **Confirm** requires a still-valid hold.
- **DB unique constraint** on `(resourceId, slot, date)` for exclusive resources → second confirm fails cleanly.
- Capacity resources: atomic `count < capacity` check inside a transaction (strong consistency).
- Online + offline + admin bookings all pass through the same guard.

---

## 22. END-TO-END FUNCTIONAL FLOWS (every perspective)

### 22.1 Customer (couple) journey
Discover (marketplace / search / vendor's IG link-in-bio) → view profile + **real-time availability**
→ inquire / request quote → chat & negotiate → **book + pay token** (slot held) → **e-sign contract**
→ WhatsApp confirmation → automated pre-event reminders (7-day, 1-day) → event day → pay balance →
receive deliverables (photographer **gallery** / docs) → **review request** (3 days later).

### 22.2 Vendor journey
Configure profile + packages + **availability rules (§21)** → lead lands (marketplace / IG / WhatsApp /
walk-in) → respond + **quote** → negotiate → **confirm + take token** (calendar auto-blocks) → assign
**resource + staff** → manage payments (advance / cheque / installments) → **function sheet / BEO** for
event day → mark **Completed** → collect balance → **deliver** → request review → watch **analytics**.

### 22.3 System / engine flow
Availability query → compute free slots (config + existing bookings + buffers + blackouts + legal caps)
→ customer picks → **HOLD (lock, TTL)** → token payment webhook → **CONFIRM** (state transition,
consume resource, calendar write, notify) → conflict guard (unique constraint / atomic capacity) →
reminder crons → completion → review cron → analytics aggregation.

### 22.4 Super-admin flow
Vendor registers → **KYC review** → approve/reject (emailed) → monitor (platform pulse) →
**promotion requests → approve** (§5) → disputes → force-majeure (batch) → revenue/oversight.

### 22.5 Pakistani EDGE CASES (telescope-level — must all be handled)
- **Wedding postponed** → reschedule flow (move booking + buffers + notify) + policy snapshot.
- **Cancellation** → auto refund calc per vendor policy + cancellation doc.
- **Govt guest-cap / one-dish change AFTER booking** (the 200-cap reality) → renegotiation/amend flow.
- **Guest-count change** (caterer) → recalc headcount + production sheet + price; headcount lock date.
- **Multi-event package** (Mehndi + Baraat + Walima across 3 dates) → one deal, multiple linked bookings.
- **Cheque bounce** → recovery workflow + balance reopens.
- **Installments / partial payments** → schedule + reminders.
- **Double-booking attempt** (two customers, same slot) → hold/lock + unique constraint resolves.
- **Online vs offline (walk-in) clash** → shared calendar, single guard.
- **Vendor on vacation / hall under renovation** → block + waitlist.
- **No-show / late balance** → status + policy enforcement.
- **Ramadan/Muharram timing** → auto-blackout suggestion, not hard block (vendor decides).
- **Security cordon / VIP protocol** (Islamabad) → event-day risk note + buffer.

Sources: [Capacity & overbooking (BookingPress)](https://www.bookingpressplugin.com/set-and-manage-service-capacity/), [Avoid overbooking + waitlist (Regiondo)](https://pro.regiondo.com/blog/how-to-avoid-overbooking-as-a-tour-activity-provider/), [Venue rules engine: buffers/blackouts/multi-room (Skedda)](https://www.skedda.com/insights/facility-reservation-system), [Slot duration/interval/buffer (HighLevel)](https://help.gohighlevel.com/support/solutions/articles/48001155718-understanding-slot-duration-slot-interval-and-buffer-settings), [Max bookings per slot/day + lead time (FG Funnels)](https://support.fgfunnels.com/article/1408-understanding-calendar-availability-settings), [Padding between appointments (Acuity)](https://help.acuityscheduling.com/hc/en-us/articles/16676926857101-Adding-padding-between-appointments), [Hotel booking strong consistency (System Design Handbook)](https://www.systemdesignhandbook.com/guides/design-hotel-booking-system/).

---

## 23. OWNER DIRECTIVES LOG — running intake (nothing gets lost)

Every instruction the owner gives is logged here verbatim-in-spirit with a date and a pointer to
the section that captures it. **New directives get appended at the top and routed to their section.**

| # | Date | Owner directive | Captured in |
|---|---|---|---|
| 12 | 2026-05-24 | "Keep recording everything I say in the file — I'll keep telling you more." | This log (§23) — intake process established |
| 11 | 2026-05-24 | Booking control: vendor controls **slots per day** and whether **multiple bookings allowed per slot** (real-time system) | §21.1–§21.4 (slots/day, max-per-slot, multi-resource, venue example) |
| 10 | 2026-05-24 | Go fullllll deep again — every perspective (user / vendor-mgmt / system / flows), nothing missing, Pakistan-specific | §21 (engine) + §22 (flows + PK edge cases) |
| 9 | 2026-05-24 | Tell me sidebar modules + craft-localized names per vendor type; common + per-type lists | §19 (module map + localization table) |
| 8 | 2026-05-24 | M23 vendor↔vendor sub-contracting = "game changing", do in full detail + authenticity | §20 (placeholder — full spec pending) |
| 7 | 2026-05-24 | Monetization: monthly **subscription + freemium + paid promotions/ads**; **NO booking commission** (not from user, not from vendor) | §17 (D6 locked) |
| 6 | 2026-05-24 | Research EVERY vendor type's real PK problems — think like a complete brain | §16 (all-type pain→feature library) |
| 5 | 2026-05-24 | Is the plan truly complete / zero-external? Answer honestly | §18 (honest verdict + M17–M23 last-mile) |
| 4 | 2026-05-24 | Research real PK **venue** management problems | §15 (one-dish, guest-cap, closing-time, etc.) |
| 3 | 2026-05-24 | Deep-dive + internet comparison; is the plan enough? | §11–§14 (gap analysis, new modules, moat, priorities) |
| 2 | 2026-05-24 | Build a serious master file: roles → per-role dashboards/modules, world-class research | This whole document |
| 1 | 2026-05-24 | Vendors must abandon Excel/registers; manage their ENTIRE business here; super-admin approval for homepage promotion | §0–§10, §5 (promotion flow) |

> **How I use this:** when you send a new requirement, I (a) append it here, (b) write the detail in
> the right section (or a new one), (c) commit + push so it's permanent. You can keep sending — none of it slips.

---

## 24. COMPLETE SCENARIO LIBRARY — every vendor, every situation (telescope-level)

Exhaustive enumeration of what a Pakistani wedding vendor faces, end-to-end. Each scenario → how the
system handles it → module/section. Marked: ✅ exists · 🟠 partial · ⬜ to build. *(This is the
"nothing missing" checklist; we build against it.)*

### 24.1 Lead & discovery
| Scenario | System handling | Ref |
|---|---|---|
| Customer finds vendor via marketplace search/category/city | Public listing + filters → inquiry | ✅ |
| Found via vendor's own IG/WhatsApp **link-in-bio** | Vendor booking/inquiry page → lead in dashboard | ⬜ M17 |
| Walk-in / phone inquiry | Manual lead + offline booking entry | 🟠 leads/offline |
| Referral by past customer / **broker** | Lead tagged w/ referrer → broker commission | 🟠 M6 |
| Repeat customer returns | Client profile + history + LTV surfaced | 🟠 M6 |
| Inquiry but no booking (cold lead) | Lead pipeline + follow-up reminder (7-day) | 🟠 M6/M10 |
| Comparing multiple vendors | Quote + fast response + portfolio strength | 🟠 |
| Spam / fake / abusive inquiry | Mark spam / block; rate-limit | ⬜ |
| Inquiry in Urdu / Roman Urdu | Urdu i18n + chat | ✅ toggle |
| Last-minute inquiry (event in 2–3 days) | Lead-time rule may block; "rush" flag | 🟠 §21 |
| Inquiry for booked/blocked date | Show unavailable + **waitlist** offer | 🟠 §21 |
| Inquiry on Muharram/Ramadan date | Soft warning (vendor decides) | ✅ calendar |

### 24.2 Quote & negotiation
| Scenario | Handling | Ref |
|---|---|---|
| Standard package quote | Pick package → branded quote PDF → WhatsApp | ⬜ M7 |
| Custom quote (bespoke event) | Build line items + add-ons → quote | ⬜ M7 |
| Per-head vs flat pricing | Both modes (caterer per-head, venue flat) | 🟠 |
| Discount: early-bird / bulk / off-season | Pricing rules engine | ⬜ M7/§21 |
| Peak-season / weekend surcharge | Auto surcharge rule | ⬜ §21 |
| Multi-event package (Mehndi+Baraat+Walima) | One deal, linked bookings, bundled price | ⬜ §22.5 |
| Quote expired / revised | Quote status + versioning | ⬜ M7 |
| Customer wants installments | Payment plan on quote | ⬜ M3 |

### 24.3 Booking & confirmation
| Scenario | Handling | Ref |
|---|---|---|
| Single-event booking | Wizard → hold → token → confirm | 🟠 M2 |
| Multiple events same day (different resources) | Multi-resource (halls/cars/teams) | ⬜ §21.2 |
| Multiple bookings same slot (capacity) | `maxBookingsPerSlot` per vendor | ⬜ §21.1 |
| Vendor sets slots/day | Availability config | ⬜ §21.1 |
| Token/advance to hold | 15-min hold + token payment | ✅ hold |
| Hold expired (didn't pay) | Auto-release, slot reopens | ✅ |
| Double-booking attempt (2 customers) | Lock + unique constraint | 🟠 §21.6 |
| Online vs walk-in clash | Shared calendar, single guard | 🟠 §21.6 |
| Tentative / pencil booking | Tentative status (no token) | ⬜ |
| Trust booking (regular, no token) | Vendor override | ⬜ |
| Booking 12 months ahead | Booking-window rule | ⬜ §21 |
| Contract required before confirm | E-sign gate | ⬜ M11 |

### 24.4 Payments & Khata
| Scenario | Handling | Ref |
|---|---|---|
| Cash / Bank / EasyPaisa / JazzCash / Raast / cheque / online | Multi-mode record + proof photo | 🟠 M3/G6 |
| Advance + balance + installments | Payment schedule + reminders | 🟠 M3 |
| Balance on event day / after (credit) | A/R tracking | 🟠 M3 |
| **Post-dated cheque** lifecycle | Received→Deposited→Cleared/Bounced + alert | ✅ /pdcs |
| Cheque **bounce** → recovery | Recovery workflow, balance reopens | ⬜ M3 |
| Overpayment / refund | Refund + ledger adjust | ⬜ M3 |
| Third-party payer (bride's father) | Payer field | 🟠 |
| Overseas family remittance | Note + online/bank | 🟠 |
| Broker commission deduction | Auto-deduct + broker ledger | ⬜ M6 |
| **FBR sales-tax e-invoice** | JSON→FBR/PRAL + QR | ⬜ M13 |
| Withholding tax | Tax line on invoice | ⬜ M13 |
| Outstanding receivables board | Sorted by overdue | 🟠 M3 |

### 24.5 Event execution (day-of)
| Scenario | Handling | Ref |
|---|---|---|
| Function sheet / **BEO** for the event | Generated from booking | 🟠 function-sheets |
| Staff assignment + attendance | Assign + present/absent | 🟠 M5 |
| Staff no-show → replacement | "Need replacement" alert | ⬜ M5 |
| Resource (hall/car/artist) assignment | From multi-resource pool | ⬜ §21.2 |
| Setup → service → teardown timeline | Day-of run sheet | ⬜ G7 |
| Guest count changes on the day | Recalc (caterer production + price) | ⬜ §22.5 |
| Power outage → generator | Generator/fuel log | ✅ /generator-fuel |
| Security cordon / VIP delay (Isb) | Event-day risk note + buffer | ⬜ §15 |
| Event overruns closing time | Closing-time warning | ⬜ §21 |
| Equipment failure (camera/sound) | Incident note | ⬜ |
| Last-minute add-on on the day | Add line + recalc balance | ⬜ |

### 24.6 Post-event & delivery
| Scenario | Handling | Ref |
|---|---|---|
| Mark complete + collect balance | Status + A/R close | 🟠 |
| **Deliverables** (photos/video/album) | Tracker + **gallery** delivery | ⬜ M16 |
| Delivery delay | ETA + client-visible status | ⬜ M16 |
| Review request (3-day auto) | WhatsApp prompt cron | ✅ |
| Negative review → vendor response | Reply + dispute if false | 🟠 M8 |
| Damage claim (car/outfit/decor) | Deposit deduction workflow | ⬜ M16 |
| Security deposit return | Return on clean inspection | ⬜ M16 |
| Repeat/referral nudge | Post-event campaign | ⬜ M19 |

### 24.7 Cancellation / reschedule / change
| Scenario | Handling | Ref |
|---|---|---|
| Customer cancels (in/out of policy) | Auto refund calc per policy + doc | ⬜ M2 |
| Vendor cancels (force majeure) | Batch cancel + notify | ✅ admin |
| **Reschedule / postpone** | Move booking + buffers + notify | ⬜ §22.5 |
| Package up/downgrade | Recalc + amend contract | ⬜ |
| **Govt guest-cap / one-dish change after booking** | Amend/renegotiate flow | ⬜ §22.5 |
| Partial cancel (1 of multi-event) | Cancel sub-booking | ⬜ |
| No-show (customer) | Status + forfeiture | ⬜ |

### 24.8 Business management (back-office)
| Scenario | Handling | Ref |
|---|---|---|
| Price update (inflation) in 2 taps | Fast repricing | ⬜ §15 |
| Seasonal pricing (winter peak) | Pricing rules | ⬜ §21 |
| Add resources (halls/cars/artists) | Resource manager | ⬜ §21.2 |
| Staff payroll (salary/commission) | Payroll + payslip | ⬜ M5 |
| Expense + **profit per event** | Expense + P&L | 🟠 /expenses |
| Cash-flow forecast | From confirmed + schedules | ⬜ M9 |
| Supplier management | Supplier ledger | 🟠 /suppliers |
| Inventory + maintenance | Stock/fleet/kit + service | 🟠 /inventory |
| Multi-branch / multi-business | Multi-business switcher | 🟠 businesses-overview |
| Income-tax / accountant export | Year-end export | ⬜ M20 |
| Business Health Score | 0–100 + actions | ⬜ M9 |

### 24.9 Marketing & growth
| Scenario | Handling | Ref |
|---|---|---|
| Request **homepage/category promotion** → super-admin approve | Promotion flow | ⬜ §5 |
| Featured badge + priority sort | Sponsored placement | 🟠 card supports |
| Deal/offer broadcast to customers | Campaign | ⬜ M19 |
| Off-season demand generation | Past-client broadcast | ⬜ M19 |
| Portfolio/reviews → social share | Shareable assets | ⬜ M21 |
| Vacation mode | Block + listing note | ✅ BK-048 |

### 24.10 Compliance & legal (Pakistan)
| Scenario | Handling | Ref |
|---|---|---|
| One-dish policy per booking | Compliance checklist + slip | ⬜ §15 |
| Guest-cap (200) by city/province | Dynamic validation | ⬜ §15 |
| Closing-time enforcement | Slot rule | ⬜ §21 |
| Halal cert / hygiene | Compliance tracker | ✅ /halal-certs |
| Drone NOC | Permit tracker | ✅ /drone-noc |
| FBR e-invoicing (legal) | M13 | ⬜ M13 |
| KYC / CNIC verification | KYC docs + tiers | ✅ admin |
| Contract e-sign legality (ETO 2002) | Valid e-sign | ⬜ M11 |

### 24.11 Account / system / access
| Scenario | Handling | Ref |
|---|---|---|
| Onboarding: **import Excel/register** | Import wizard | ⬜ M14 |
| Owner + staff users w/ permissions | Roles/seats | 🟠 |
| Subscription tier limits + upgrade | Plan gating + billing | ⬜ §17 |
| Data export / backup / ownership | Export everywhere | ⬜ M22 |
| Notifications: in-app / WhatsApp / push | Multi-channel | 🟠 |
| Offline / PWA (poor signal) | SW + offline calendar | ✅ |
| Urdu / English toggle | i18n | ✅ |
| Mobile vs desktop | Responsive + mobile nav | 🟠 |

### 24.12 Customer (couple) side
| Scenario | Handling | Ref |
|---|---|---|
| Browse / favourite / compare vendors | Marketplace + compare | ✅ |
| Plan whole wedding (many vendors) | Trip/wedding planner | 🟠 /wedding |
| Inquire / chat / quote | Inbox | 🟠 |
| Book + pay token + sign | Booking + portal | 🟠 M12 |
| View timeline + gallery | Client portal | ⬜ M12 |
| Leave review | Public review | ✅ |

### 24.13 Per-vendor-type UNIQUE scenarios
| Type | Signature scenarios |
|---|---|
| **Venue** | multi-hall simultaneous events · one-dish raid risk · guest-cap law · seating chart · BEO · valet/parking · generator |
| **Catering** | headcount lock · kitchen production scaling · 15–25% waste control · staffing ratio · food tasting · dietary/halal |
| **Photographer** | 2 events/day (crews) · second shooter · RAW→edit→album pipeline · gallery proofing · drone NOC · reels |
| **Makeup** | bride-factory cap · trial vs event day · kit/product cost · travel · multi-bride morning |
| **Henna** | per-hand pricing · family-party bulk · multi-event/day · travel · cone product sales |
| **Car rental** | fleet availability · driver+route sync · fuel/km/toll · deposit+damage · multi-vehicle convoy |
| **Decorator** | setup+breakdown labour · decor inventory damage/theft · flower spoilage/substitution · theme |
| **Bridal wear** | fitting/alteration milestones · rental deposit+damage · custom lead-time · groom/family outfits |
| **Stationery** | design proof cycles · print-run qty · hard delivery deadline · digital invite files · bid/favour boxes |

### 24.14 Vendor↔Vendor (M23 — full spec in §20 pending)
| Scenario | Handling | Ref |
|---|---|---|
| Venue refers/books a photographer via platform | Sub-contract request → quote → accept | ⬜ M23 |
| Commission split between vendors | Split ledger | ⬜ M23 |
| Shared event / BEO across vendors | Shared event view | ⬜ M23 |
| Inter-vendor rating | Vendor-to-vendor reviews | ⬜ M23 |

> **Coverage status:** the lifecycle + back-office + compliance + per-type scenarios are now
> enumerated. Many are ⬜/🟠 — that's the honest build backlog. If you spot ANY scenario missing,
> tell me and it gets added here. This is the "nothing missing" master checklist.
