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

### New decision needed
- **D6 — Vendor SaaS model:** commission-on-booking / monthly subscription / freemium + paid
  promotion? This shapes billing, the import incentive, and which features gate behind a plan.

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
