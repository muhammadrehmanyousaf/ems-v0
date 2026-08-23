# Venue Booking Architecture — Registration to Completion

**Date:** 2026-08-23
**Status:** Research + architecture. Nothing here is implemented yet.
**Companions:** `BOOKING-FLOW-ASSESSMENT.md` (what's wrong today) ·
`PK-VENUE-PRICING-RESEARCH.md` (per-head / package / menu) ·
`VENDOR-REGISTRATION-AND-SCENARIOS.md` (registration wizard + ~150 worked scenarios)

> ### SUPERSEDED IN ONE PLACE — read this first
>
> This document proposes `Business.pricingShape` as an **enum the booking flow branches on**.
> `VENDOR-REGISTRATION-AND-SCENARIOS.md` **Part 1** supersedes that: branching on a shape enum
> means *new venue behaviour = new code*, which does not scale to hybrid venues.
>
> **The correct model is a single `RateCardLine` table.** "Package", "menu", "hall rent",
> "surcharge", "tax" and "deposit" are all rows differing only by `kind` and `priceModel`.
> `pricingShape` survives, demoted to a **registration preset that pre-fills the rate card** — a
> convenience, never a structural constraint.
>
> Everything else in this document stands. Where it says "branch on `pricingShape`", read
> "derive from which rate-card groups are non-empty".

**Goal:** one system flexible enough that *any* Pakistani venue — a 200-guest community hall, a
1,200-guest luxury marquee, an open lawn, a hotel ballroom, a caterer with no hall — can configure
it to match exactly how they already sell, and *any* customer gets a quote they can trust and an
event that runs the way they agreed.

**Design rule that produced this document:**

> **The venue owner sets the rules. The system enforces them. The customer sees them before paying.**
>
> Anything a venue does differently from another venue is **configuration**, never a code branch.
> Anything the law requires is a **hard block**, never a warning.
> Anything the customer can't be told in advance gets a **free-text field** and a human.

---

# PART 0 — THE NINE FACTS THAT CONSTRAIN EVERYTHING

Every design decision below traces to one of these. They are established in the research docs and
Part 1.

| # | Fact | Consequence for the architecture |
|---|---|---|
| **F1** | "Per plate" = "per head". The **menu sets the rate**. A **package bundles** hall + food + extras at one headline rate. | `Package` needs `pricingUnit`, `includesFood`. |
| **F2** | Venues sell in **four different shapes** (all-inclusive per head / hall + food / hall only / caterer only). | `Business.pricingShape` drives which booking steps render. |
| **F3** | **Punjab Marriage Functions Act 2016 s.6** puts the 10 PM duty on the **hall owner**, s.4/s.5 puts one-dish on **owner AND caterer**. Penalty: up to 1 month imprisonment + **Rs 50,000–2,000,000** fine. | Compliance is a **hard block on the venue's config**, not a customer-facing warning. |
| **F4** | Billing is **`max(guaranteed, actual)`**, counted on the night. Guarantee ≈ 80–85% of expected; overset ≈ +5%; over-guarantee tolerance ≈ +10–15% at the same rate. | The booking is **not final at payment**. It has a **settlement phase**. |
| **F5** | **No surviving PK platform takes a card to lock a date.** Directories hand off to a phone call; back-office tools record what was agreed offline. The one that tried the marketplace model (Shadibox) is a parked domain. | **Request-to-book must exist** and probably be the default. |
| **F6** | Peak = Oct–Feb, booked 8–12 months out. Muharram, Safar and Ramadan are widely avoided, compressing the season. | Lead-time, seasonal pricing and **lunar-calendar-aware** blackout config are core, not optional. |
| **F7** | Service style (**buffet vs table service**) changes staff ratio (1:20–30 vs 1:16–20), usable capacity, layout and price. | Service style is a **first-class booking dimension**, not a note. |
| **F8** | **Advance is usually non-refundable** — but is very often **transferred to a new date** rather than forfeited. | Refund engine needs an **adjustment / credit-to-new-date** path, not just refund-or-forfeit. |
| **F9** | The customer's real questions are never in your form. ("Can we bring our own mithai?" "My khala is diabetic." "Baraat will be late.") | A **free-text intent field** at every stage, threaded to the venue, is a required feature. |

---

# PART 1 — RESEARCH FOUNDATION

## 1.1 The law (authoritative — this is a hard constraint, not a preference)

**Punjab Marriage Functions Act 2016 (XXIX of 2016)**

| Section | Provision |
|---|---|
| **Definition** | *"One dish" means one salan, one rice dish, one salad, hot and cold drinks, roti, nan and one sweet dish.* |
| **s.3** | Prohibits exploding crackers / explosive devices, **firing by firearms**, and displaying fireworks. |
| **s.4** | The host shall not serve edibles **except one dish**. |
| **s.5** | The **owner / manager / operator of the public place, or a caterer**, shall not serve except as s.4 allows. |
| **s.6** | The **owner / manager / operator shall ensure conclusion of all ceremonies on or before 10:00 PM.** |
| **s.8** | Contravention of s.3/4/5/6 → simple imprisonment up to **one month** + fine **not less than Rs 50,000, not more than Rs 2,000,000**. |

**Read s.5 and s.6 again.** The criminal liability sits on the **venue owner**, not the customer.
This is why compliance must be enforced in the venue's configuration and in the slot engine — a
venue that lets a customer book a 9 PM dinner slot is the party that gets fined and sealed.

**Enforcement is live:** May 2026 raids in Islamabad sealed marquees, imposed heavy fines, and
arrested hall managers. December 2025 saw a Punjab crackdown on loudspeakers alongside one-dish.
Islamabad separately bans wedding ceremonies after 10 PM. Karachi venue T&Cs commonly say "premises
vacated by 12:00 AM" (different province, different rule — **this must be per-city config**).

**Tax:** Punjab (PRA) raised marriage halls / catering / event management from **5% → 8%**.
Registration threshold **Rs 6M/yr**. PRA **eIMS requires a real-time fiscal invoice on every advance
AND every final payment**, with QR code, plus **CNIC capture on payments over Rs 1,000** (Amanat
Scheme). Sindh (SRB) and ICT/FBR are separate regimes. Federal Budget 2025-26 reporting puts GST on
commercial event services at **18%**.

## 1.2 Service styles — the dimension the system is missing entirely

| Style | Staff ratio | Notes |
|---|---|---|
| **Sit-down / table service** | 1 : 16–20 | Formal. Elders stay seated. Higher labour cost. Needs more floor space per guest. |
| **Buffet** | 1 : 20–30 | Cheaper, fewer staff. Needs counter run + queue space. Flexible seating (sofa sets + chairs). |
| **Family style / sharing platters** | ~1 : 15 | Platters to each table. |
| **Live counters / stations** | per counter | BBQ, jalebi, golgappa, pan, chinese wok, coffee. Priced per counter or per head. |
| **Hi-tea** | 1 : 25+ | Lighter, common for Mayoun / Dholki / corporate. |

In Pakistan, full-service caterers normally **include staff in the per-head rate**. So service style
is not a separate line item for most venues — but it **must be recorded**, because it determines
usable capacity, the BEO, and what the customer is entitled to complain about.

## 1.3 Guest count mechanics (F4, in detail)

```
expectedPax        what the family thinks will come
guaranteedPax      what they commit to PAY for      (industry norm: 80-85% of expected)
oversetPax         extra covers laid                (industry norm: +5% over guarantee)
toleranceBand      extra guests billed at SAME rate (industry norm: +10-15% over guarantee)
actualPax          counted on the night at the gate

BILL = max(guaranteedPax, actualPax) x rate
       ... but any actualPax beyond (guaranteedPax x (1 + toleranceBand)) may bill at a
       HIGHER walk-in rate, because the kitchen had to improvise.
```

Headcount lock deadline is real and contractual — Decorium: *"Final increases in guest headcount or
adjustments to the selected menu must be officially submitted at least 7 days before the event
date."*

## 1.4 The event vocabulary this market actually uses

**Wedding chain:** Mangni/Engagement · Dholki · Mayoun/Ubtan · Mehndi (Rasm-e-Hina) · Nikah ·
Barat · Rukhsati · Walima · Reception · Chauthi
**Non-wedding (marquees do all of these):** Aqiqah · Milad/Naat · Qawwali night · Birthday ·
Corporate dinner · Seminar · Conference · Exhibition · Iftar dinner · Sehri · Soyem / Chehlum
(funeral gatherings — a real and regular revenue line for halls)

**Sittings:** Brunch · Lunch · Hi-Tea · Dinner · **Aftari** (Ramadan) · **Sehri** (Ramadan)

---

# PART 2 — THE DOMAIN MODEL

```
Organisation (venue group / owner company)
 └── Business (a venue, or a caterer, or a service vendor)
      ├── pricingShape                          <- NEW. F2. drives the whole flow
      ├── serviceStyles[]                       <- NEW. F7
      ├── ComplianceProfile                     <- city rules: closing time, one-dish, caps
      ├── TaxProfile                            <- PRA / SRB / FBR, inclusive-or-exclusive
      ├── SubVenue[] (hall / lawn / rooftop)    <- EXISTS (genderMode, fireRatedCapacity)
      │    └── SpaceMergeGroup                  <- EXISTS (two halls combined)
      ├── SlotTemplate[] (lunch/dinner/aftari)  <- EXISTS (capacity, buffer, weekdayMask)
      ├── Resource[] (crew, vehicles, lanes)    <- EXISTS
      ├── Package[]                             <- EXISTS, needs pricingUnit/includesFood/menuId
      │    └── PackageOption[]                  <- NEW. "pick 1 of 3 main courses"
      ├── Menu[]                                <- EXISTS, needs section rebuild
      │    └── MenuItem[]                       <- NEW. section, isLive, countsAsMainDish, supplement
      ├── AddOn[] (BusinessBundledService)      <- EXISTS (mandatory / included / priceModel)
      ├── SeasonalPricing[]                     <- EXISTS (multiplier, date range, weekdayMask)
      ├── RecurringBlock[] / CapacityOverride[] <- EXISTS
      ├── CancellationPolicy (slabs)            <- EXISTS (partialRefundPct, forceMajeureRule)
      └── BookingRules                          <- NEW. instant vs request, hold TTL, quote validity

Inquiry                                          <- NEW. the real front door (F5)
 └── SiteVisit / Tasting                         <- NEW
      └── Quotation (versioned)                  <- NEW. orderStage exists, unused
           └── Booking                            <- EXISTS
                ├── BookingDetails[] (per business/hall/package/menu)   <- EXISTS
                ├── GuestCountRecord (expected/guaranteed/actual/lock)  <- PARTIAL
                ├── ChangeRequest[]                                     <- EXISTS
                ├── Payment[] / Installment[] / Receipt[]               <- EXISTS
                ├── BEO (generated)                                     <- service exists
                ├── Settlement (final reconcile)                        <- NEW
                ├── DepositReturn / DamageClaim                         <- NEW
                └── Review / Dispute                                    <- EXISTS
```

**The through-line:** `Inquiry → Quotation(v1..vN) → Booking → Settlement → Completion`.
A Pakistani venue booking is **a negotiated document that gets revised**, not a transaction that
gets confirmed. MarqSuite models exactly this and lists **"versions"** among its booking fields.

---

# PART 3 — VENUE REGISTRATION & CONFIGURATION

Everything a venue owner must be able to set. `EXISTS` = already in the schema. `NEW` = to build.

## 3.1 Step 1 — Identity & legal

| Field | Status |
|---|---|
| Business name, slug, description, owner name/bio | EXISTS |
| City, subArea, address, map pin | EXISTS |
| NTN, CNIC (encrypted), address proof + verification timestamps | EXISTS |
| WhatsApp number *(the real channel)* | EXISTS |
| `providesTaxInvoice`, verification tier, completeness score | EXISTS |
| **Tax jurisdiction** (Punjab PRA / Sindh SRB / ICT FBR / KP) | **NEW** |
| **PRA/SRB registration number + eIMS enrolment** | **NEW** |
| **Above Rs 6M threshold?** → triggers fiscal-invoice obligation | **NEW** |

## 3.2 Step 2 — THE PRICING SHAPE QUESTION (asked before anything else)

```
How do you charge?

 ( ) Everything included, one rate per head    -> all_inclusive_per_head
     e.g. "Rs 2,500/head — food + hall together"

 ( ) Hall charge separate, food per head       -> hall_plus_per_head
     e.g. "Rs 3,00,000 hall + Rs 1,250/head food"

 ( ) Hall only — customers bring their caterer -> hall_only
     e.g. "Rs 3,00,000 + Rs 60,000 kitchen access"

 ( ) I'm a caterer, I don't have a hall        -> menu_only
     e.g. "Menu 2 — Rs 2,250/head"
```

**This single answer decides:** which booking steps render · whether the menu carries a price ·
what the Review breakdown looks like · what the pamphlet shows. Everything downstream branches here
and **nowhere else**.

## 3.3 Step 3 — Spaces (SubVenue tree) — EXISTS, extend

| Field | Status |
|---|---|
| Name, kind (hall / lawn / rooftop / bridal room / parking), tree via `parentSubVenueId` | EXISTS |
| `fireRatedCapacity` (legal) vs `comfortCapacity` (seated comfort) | EXISTS |
| `genderMode` — **mixed / ladies-only / gents-only / partitioned** | EXISTS |
| `basePricePkr`, `bookingMode`, `isDefault`, `displayOrder` | EXISTS |
| SpaceMergeGroup — two halls sold as one for large events | EXISTS |
| **Capacity BY SERVICE STYLE** — a hall seats 600 sit-down but 800 buffet | **NEW** |
| **Capacity BY SEATING LAYOUT** — round-10 / sofa / theatre / mixed | **NEW** |
| **Rain backup?** open lawn with no covered alternative is a disclosed risk | **NEW** (`backupArrangement` exists as free text) |
| **Setup access window** — decorator needs N hours before the slot | **NEW** |
| **Teardown window** | **NEW** |
| **Shares entrance / parking / kitchen with which other spaces** (contention) | **NEW** |

## 3.4 Step 4 — Slots & calendar — EXISTS, extend

| Field | Status |
|---|---|
| SlotTemplate: label, start/end, `capacity`, `bufferAfterMinutes`, `unitGuestCapacity`, `weekdayMask`, `subVenueId` | EXISTS |
| SeasonalPricing: date range + `multiplier` + `weekdayMask` + priority | EXISTS |
| RecurringBlock, CapacityOverride, blocked dates, `vacationMode` | EXISTS |
| `minLeadDays` / `maxLeadDays` | EXISTS |
| **Ramadan mode** — auto-swap slot set to Aftari/Sehri, suppress daytime | **NEW** |
| **Lunar-calendar blackouts** — Muharram 1–10, Safar, shift yearly | **NEW** |
| **Named peak dates** — 14 Aug, 25 Dec, 31 Dec, Eid ±3 days | **NEW** |
| **Turnaround rule** — lunch must end 4 PM if a dinner is booked same day | **NEW** |
| **Multi-day booking** — Mehndi Fri + Barat Sat + Walima Sun as one contract | **NEW** |

## 3.5 Step 5 — Packages — EXISTS, needs the three fields

| Field | Status |
|---|---|
| name, description, `price`, `features` JSON, `images` JSON, `extras` JSONB, `capacity`, `subVenueId`, `looksJson` | EXISTS |
| **`pricingUnit`** `per_event` \| `per_head` | **NEW — blocker** |
| **`minGuaranteeCount`** | **NEW — blocker** |
| **`includesFood`** — kills the double-charge | **NEW — blocker** |
| **`menuId`** — the menu this package bundles | **NEW** |
| **`guestRangeMin` / `guestRangeMax`** — Decorium sells "200–500", "300–800" | **NEW** |
| **`serviceStyle`** — this package is buffet, that one is sit-down | **NEW** |
| **`PackageOption[]`** — "1 main course, pick one of: Karahi / Qorma / Handi" | **NEW** |
| **`validFrom` / `validTo`** — seasonal package | **NEW** |

## 3.6 Step 6 — Menus — EXISTS, needs rebuild

Current `menu.data` = `{ starters, mainCourse, drinks, desserts }`. Too Western, too coarse.

**Real section order:**
`welcome drink → chaat/salad bar → soup → live BBQ → main course → rice → bread (live naan) →
raita/salad → dessert → live counters → beverages`

**Per-item fields:**

```js
{
  section: 'main_course',
  name: 'Mutton Qorma',
  nameUrdu: 'مٹن قورمہ',
  isLive: false,              // live counter / live cooking
  countsAsMainDish: true,     // <- one-dish arithmetic (s.4)
  countsAsSweetDish: false,   // <- one-dish arithmetic
  supplementPerHead: 400,     // swap upcharge; Liberty Castle's 1600-vs-1200 as ONE menu
  isVegetarian: false,
  containsBeef: true,         // real preference dimension in PK
  allergens: ['nuts','dairy'],
  image: null
}
```

**`menu.price` is `FLOAT` — migrate to `NUMERIC(12,2)`.** PA-009 moved every other money column
because "FLOAT corrupts on aggregation"; this is the one multiplied by up to 1,200 heads.

**One-dish check runs in the builder**, warning the vendor while they build — not the customer at
checkout. The Act's definition is arithmetic: 1 salan + 1 rice + 1 salad + drinks + roti/nan +
1 sweet.

## 3.7 Step 7 — Service & staffing — MOSTLY NEW

| Field | Status |
|---|---|
| `provideWaiter`, `providePlate`, `provideSeatingArrangement`, `provideSoundSystem`, `provideDecorationItem`, `provideFoodTesting` | EXISTS (booleans) |
| **`serviceStyles[]` offered** — buffet / sit-down / family / hi-tea / live-stations | **NEW** |
| **Staff ratio per style** (1:20 buffet, 1:16 sit-down) | **NEW** |
| **Crockery grade tiers** | **NEW** |
| **Kids policy** — under-5 free, 5–12 half rate | **NEW** |
| **Staff / driver meal rate** — a real, separate, cheaper rate in PK | **NEW** |
| **Vendor crew meals** — photographer, DJ, decorator team eat too | **NEW** |

## 3.8 Step 8 — Add-ons & surcharges — EXISTS (BusinessBundledService), extend

`priceModel`, `priceAmount`, `mandatory`, `included`, `category`, `constraintsJson` all EXIST.
Add these as seeded categories:

Décor upgrade · Stage · Lighting/LED · Sound/DJ · **Generator surcharge (seasonal, May–Sep)** ·
Valet/parking · Extra hours · **Kitchen access fee (outside caterer)** · Live counters ·
Bridal room upgrade · Photography · Fireworks *(must be hard-blocked — s.3)* · Cold storage /
chiller truck · Security guards · Nikah registrar · Ambulance/medic standby

| Field | Status |
|---|---|
| **`seasonalWindow`** — generator surcharge only May–Sep | **NEW** |
| **`isLegallyProhibited`** — fireworks/aerial firing, never bookable | **NEW** |

## 3.9 Step 9 — Booking rules — MOSTLY NEW

| Setting | Status |
|---|---|
| **`bookingMode`** — `instant` \| `request` \| `inquiry_only`, **overridable per date/slot** | **NEW** |
| **`requiresSiteVisit`** before confirmation | **NEW** |
| **`quoteValidityDays`** — price expires (F6: 8–12 month lead + 30–40% inflation) | **NEW** |
| **`advanceDueWithinDays`** — else auto-release the date | **NEW** |
| Hold TTL (15 min today) | EXISTS |
| `downPayment` + `downPaymentType` (% or fixed) | EXISTS |
| **Instalment schedule template** | PARTIAL (`BookingInstallment` exists) |
| **`securityDepositPkr`** (refundable, separate from advance) | **NEW** |
| **`headcountLockDays`** — default 7 | **NEW** |
| **`toleranceBandPct`** — +10–15% at same rate | **NEW** |
| **`oversetPct`** — +5% covers laid | **NEW** |
| **`walkInRatePerHead`** — rate beyond the tolerance band | **NEW** |
| CancellationPolicy slabs + `forceMajeureRule` | EXISTS |
| **`advanceTransferPolicy`** — F8: forfeit vs credit-to-new-date | **NEW** |
| `outsideVendorsAllowed`, `outsideVendorFee` | EXISTS |
| `acceptsCash`, `acceptsBankTransfer` | EXISTS |
| **Venue bank account details (per venue, verified)** | **NEW — the hardcoded IBAN must die** |

## 3.10 Step 10 — Compliance profile — PARTIAL

| Setting | Status |
|---|---|
| `oneDishPolicy`, `eventClosingTime`, `legalGuestCap`, `requiresPermit`, `permitChecklistUrl` | EXISTS |
| **City rule pack** — auto-seed closing time + one-dish from city (Punjab 10 PM, Karachi midnight) | **NEW** |
| **Fireworks / aerial firing — hard block (s.3)** | **NEW** |
| **Loudspeaker / sound limit** | **NEW** |
| **Fire safety NOC + expiry** | PARTIAL (`venue-compliance` migration exists) |
| **Parking bylaw compliance** | **NEW** |

## 3.11 Step 11 — The pamphlet preview (build once, use three places)

`package.images` and `package.features` already exist and are **never rendered as a preview**.

A vendor who sees their package as a card **immediately catches "Rs 3,500 per event" when they meant
per head**. Today there is no surface where that mistake becomes visible before a customer is billed
by it. This is a correctness feature.

```
+------------------------------------------+
|  [ hero image ]                          |
|  GOLD PACKAGE                            |
|  Rs 3,500 / per head        <- the UNIT  |
|  200 - 800 guests | Buffet               |
|                                          |
|  INCLUDES                                |
|   Hall + AC + generator backup           |
|   Standard stage & decor                 |
|   Bridal room · Valet parking            |
|                                          |
|  MENU (included)                         |
|   Main:    Chicken Karahi                |
|   Rice:    Chicken Biryani               |
|   BBQ:     Reshmi Seekh Kabab (live)     |
|   Dessert: Gulab Jamun                   |
|   [ compliant with one-dish rule ]       |
|                                          |
|  NOT INCLUDED                            |
|   Decor upgrade      from Rs 2,50,000    |
|   Generator surcharge (May-Sep)          |
|                                          |
|  Advance Rs 1,00,000 - non-refundable    |
|  + 8% PST                                |
+------------------------------------------+
```

Three surfaces, **one component**, so the vendor's preview and the customer's view can never
disagree: (1) vendor dashboard live preview, (2) customer package step, (3) **PNG export for
WhatsApp** — how vendors actually distribute these, and a free acquisition loop.

---

# PART 4 — DISCOVERY → DETAIL PAGE → BOOK NOW

## 4.1 The detail page must answer, above the fold

1. **Price, with its unit stated** — "From Rs 2,500 **per head**" or "Rs 3,00,000 **hall charge**"
2. **Capacity, by service style** — "600 sit-down / 800 buffet"
3. **Is my date free?** — inline calendar, not a form submit
4. **What's included vs extra** — the single biggest trust gap in this market
5. **Advance and whether it's refundable** — before any button is pressed
6. **Closing time** — "all functions conclude by 10:00 PM (Punjab law)"
7. **The CTA that matches the venue's `bookingMode`**

## 4.2 The CTA is not always "Book Now"

| `bookingMode` | Button | What happens |
|---|---|---|
| `instant` | **Book Now** | hold → quote → pay advance → Confirmed |
| `request` | **Request this date** | hold → venue accepts/declines/counters → then pay |
| `inquiry_only` | **Check availability** | inquiry only; venue calls back |

Default new venues to `request`. **F5**: no PK platform that survives takes a card to lock a date.
Let venues opt *up* to instant for off-season weekdays where they have the least leverage.

---

# PART 5 — THE BOOKING FLOW

## 5.1 The adaptive step engine

Steps are **derived from config**, never hardcoded. Pseudocode:

```
steps = ['event_type', 'date_slot', 'guests']

if venue.subVenues.length > 1        -> + 'space'
if venue.serviceStyles.length > 1    -> + 'service_style'
if pricingShape != 'menu_only'       -> + 'package'
if pricingShape == 'hall_only'       -> + 'outside_caterer_details'
if !selectedPackage.includesFood     -> + 'menu'          (CHARGES)
else if package.hasOptions           -> + 'menu_customise' (FREE)
if venue.addOns.any(!included)       -> + 'addons'
always                               -> + 'requirements'   (the free-text step, Part 8)
always                               -> + 'review'
if bookingMode == 'instant'          -> + 'payment'
else                                 -> + 'submit_request'
```

Today's flow is fixed at `Event → Date → Vendors → Packages → Menu → Review`
(`booking-form.tsx:668-689`). That is one venue's shape imposed on all venues.

## 5.2 The state machine

```
                    INQUIRY
                       |
              (site visit / tasting)
                       |
                  QUOTATION v1 ---- revise ----> v2 ... vN
                       |                              |
                  (customer accepts)                  |
                       |                              |
                  TENTATIVE  <--- hold expires ---> RELEASED
                       |
        instant? ------+------ request?
           |                      |
           |               PENDING_VENDOR --- decline --> DECLINED
           |                      |         --- counter --> QUOTATION vN+1
           |                (venue accepts)
           |                      |
           +-------> AWAITING_ADVANCE
                          |
                  (advance received / recorded)
                          |
                      CONFIRMED
                          |
              +-----------+-----------+
              |           |           |
        CHANGE_REQ    POSTPONED   CANCELLED
              |           |           |
              +-----------+           +--> REFUND / FORFEIT / CREDIT_TO_NEW_DATE
                          |
                   HEADCOUNT_LOCKED   (T-7 days)
                          |
                    BEO_ISSUED        (T-3 days)
                          |
                     EVENT_DAY
                          |
                  ACTUAL_COUNT_RECORDED
                          |
                     SETTLEMENT       (max(guaranteed, actual))
                          |
                  BALANCE_COLLECTED
                          |
                  DEPOSIT_INSPECTION
                          |
                      COMPLETED
                          |
                    REVIEW / DISPUTE
```

**Today's machine is `Pending → Awaiting Payment → Confirmed → Cancelled → Completed`.** Everything
between CONFIRMED and COMPLETED — the part where the money is actually determined — does not exist.

## 5.3 The quote breakdown the customer must see before paying

```
Hall charge (Main Hall, Dinner)                        Rs   3,00,000
Gold Package  Rs 2,500/head x 520 billable              Rs 13,00,000
   (520 = max(500 expected, 520 guaranteed))
   Menu: included
   Upgrade Mutton Qorma  +Rs 400/head x 520             Rs   2,08,000
Add-ons
   Decor upgrade                                        Rs   2,50,000
   Generator surcharge (May-Sep)                        Rs      80,000
   Valet parking                                        Rs      25,000
                                                        -------------
Subtotal                                                Rs 20,63,000
Seasonal (Dec peak, x1.15)                              Rs   3,09,450
Discount (negotiated)                                  -Rs   1,00,000
                                                        -------------
Net                                                     Rs 22,72,450
Service charge 5%                                       Rs   1,13,622
Punjab Sales Tax 8%                                     Rs   1,90,886
                                                        =============
GRAND TOTAL                                             Rs 25,76,958

Advance due now (non-refundable)                        Rs   5,00,000
Security deposit (refundable after inspection)          Rs   1,00,000
Balance due 2026-12-08 (3 days before event)            Rs 20,76,958

Final bill adjusts to actual headcount on the night:
  guaranteed 520 | up to 598 at the same rate | beyond that Rs 3,200/head
Headcount + menu locked on 2026-12-04
Cancellation: 100% refund up to 90 days out | 50% to 30 days | advance forfeited under 30 days
              (or transferable to a new date within 12 months)
```

**Nothing below "Net" exists in the code today.** That gap — not race conditions — is what produces
disputes.

---

# PART 6 — POST-BOOKING LIFECYCLE TO COMPLETION

| Phase | Trigger | What must happen | Status |
|---|---|---|---|
| Confirmation | advance received | Receipt (+ PRA fiscal invoice if enrolled). Contract PDF. WhatsApp confirm. | PARTIAL |
| Planning | ongoing | Change requests, add-on additions, décor sign-off, tasting | EXISTS |
| Payment schedule | instalment dates | Reminders, PDC tracking, partial receipts | PARTIAL |
| **Headcount lock** | **T-7** | Customer confirms final count + menu. After this, changes cost money. | **NEW** |
| **BEO issue** | **T-3** | Generate + distribute to chef, captain, decorator, security | service exists, not wired |
| **Pre-event call** | **T-2** | Weather check (open lawn), generator, guest count sanity, contact person | **NEW** |
| Event day | — | Setup window, gate counting, live issue log | **NEW** |
| **Actual count** | during event | Gate register / token count / table count → recorded | **NEW** |
| **Settlement** | end of event | `max(guaranteed, actual)` × rate + extras consumed − paid = balance | **NEW** |
| Balance collection | end / next day | Cash, bank, cheque. Final fiscal invoice. | PARTIAL |
| **Deposit inspection** | T+1 | Damage check, deduction with photos, return within 7 days | **NEW** |
| Payout | `payoutEligibleAt` | Gated on `bookingDate + dispute window` | EXISTS |
| Review | T+1 | Token-auth public review link | EXISTS |
| Dispute | within window | Evidence, resolution | EXISTS |
| Completion | balance 0 + deposit returned + no open dispute | | PARTIAL |

---

# PART 7 — THE EDGE CASE CATALOGUE

Every case: what it is, and how the architecture answers it.
`[E]` already handled · `[P]` partially · `[N]` new.

## A. Pricing & money

| # | Case | Answer |
|---|---|---|
| A1 | Per-head vs flat vs hybrid | `Business.pricingShape` + `Package.pricingUnit` `[N]` |
| A2 | Fewer guests attend than guaranteed | Bill `max(guaranteed, actual)` `[N]` |
| A3 | More guests than guaranteed, within tolerance | Same rate up to `toleranceBandPct` `[N]` |
| A4 | Far more guests than guaranteed | `walkInRatePerHead` beyond the band `[N]` |
| A5 | Count drops after lock | Guarantee still bills. Show it at lock time. `[N]` |
| A6 | Count rises after lock | Venue may accept at walk-in rate or refuse (capacity) `[N]` |
| A7 | Kids | `under5Free`, `child5to12RatePct` `[N]` |
| A8 | Drivers / domestic staff | Separate cheaper `staffMealRate` — standard in PK `[N]` |
| A9 | Vendor crew meals (photographer, DJ, decor team) | `crewMealCount` on the BEO `[N]` |
| A10 | Menu upgrade (chicken→mutton) | `MenuItem.supplementPerHead`, not a second menu `[N]` |
| A11 | Seasonal multiplier | `BusinessSeasonalPricing` `[E]` |
| A12 | Day-of-week pricing | `weekdayMask` on seasonal rows `[E]` |
| A13 | Named peak dates (14 Aug, 31 Dec, Eid) | Seasonal row, priority ordering `[E]` |
| A14 | Owner grants a negotiated discount | Quotation-level `discount` + reason + audit `[N]` |
| A15 | Price rises between quote and confirm | `quoteValidityDays` + explicit re-quote `[N]` |
| A16 | Tax inclusive vs exclusive quoting | `TaxProfile.quoteMode` `[N]` |
| A17 | Security deposit ≠ advance | Separate line, refundable, own ledger `[N]` |
| A18 | Damage deducted from deposit | `DamageClaim` with photos `[N]` |
| A19 | Cancellation slabs by days-to-event | `CancellationPolicy.slabs` `[E]` |
| A20 | **Advance transferred to a new date, not refunded** | `advanceTransferPolicy` + credit ledger `[N]` — **the PK norm** |
| A21 | Multi-event bundle discount | WeddingUmbrella tiers `[E]` |
| A22 | Diaspora pays in USD/GBP | `DiasporaPayment` model exists `[P]` |
| A23 | Post-dated cheque | `pdcService` exists `[P]` |
| A24 | Instalments | `BookingInstallment` `[E]` |
| A25 | Cash settlement on the night | `confirm-cash` `[E]`, needs settlement wiring `[P]` |
| A26 | Overtime past the slot | Add-on, **capped by legal closing time** `[N]` |
| A27 | Generator surcharge only in summer | Add-on with `seasonalWindow` `[N]` |
| A28 | Kitchen access fee for outside caterer | `outsideVendorFee` `[E]` |
| A29 | Minimum spend floor (not min guests) | `minimumSpendPkr` `[N]` |
| A30 | Tasting cost, credited if booked | `provideFoodTesting` `[P]` → needs a fee + credit rule `[N]` |
| A31 | Rounding of `rate × heads` | Round at line level, `NUMERIC(12,2)` throughout `[P]` |
| A32 | Platform fee vs venue payout | `platformFeeSnapshot` `[E]` |

## B. Capacity, space, layout

| # | Case | Answer |
|---|---|---|
| B1 | Multi-hall venue | SubVenue tree `[E]` |
| B2 | Two halls merged for one big event | SpaceMergeGroup `[E]` |
| B3 | Lawn + hall combined | SpaceMergeGroup `[E]` |
| B4 | Legal cap vs fire-rated vs comfort | Three capacity fields, min() wins `[E]` |
| B5 | **Capacity differs by service style** | Capacity matrix per style `[N]` |
| B6 | Capacity differs by seating layout | Capacity matrix per layout `[N]` |
| B7 | **Ladies-only / partitioned section (parda)** | `SubVenue.genderMode` `[E]` — surface it in booking `[N]` |
| B8 | Separate ladies entrance | Space attribute `[N]` |
| B9 | Stage / gaddi placement + size | BEO layout `[N]` |
| B10 | Dance floor | Add-on + layout `[N]` |
| B11 | Kids play area | Add-on `[N]` |
| B12 | Parking capacity vs guest count | `carParkingCapacity` `[E]` — warn when guests/3 > parking `[N]` |
| B13 | Wheelchair / elderly access | Amenity flag `[P]` |
| B14 | **Open lawn, no rain backup** | `backupArrangement` `[P]` → structured + disclosed `[N]` |
| B15 | Two functions same day (lunch + dinner) | SlotTemplate + `bufferAfterMinutes` `[E]` |
| B16 | Decorator needs 6h setup before slot | `setupAccessMinutes` blocks the prior slot `[N]` |
| B17 | Teardown overruns into next slot | `teardownMinutes` `[N]` |
| B18 | Adjacent halls: noise bleed, shared entrance, parking contention | Contention groups `[N]` |
| B19 | Guest overflow beyond fire-rated cap | **Hard block** — legal liability `[N]` |

## C. Time, date, calendar

| # | Case | Answer |
|---|---|---|
| C1 | Lunch / hi-tea / dinner / aftari / sehri | SlotTemplate `[E]` |
| C2 | **10 PM legal close (Punjab s.6)** | **Hard block** on slot config + overtime add-on `[N]` |
| C3 | Lunch must conclude by 4 PM | Slot end constraint `[N]` |
| C4 | **Ramadan** — no daytime, aftari/sehri only | Ramadan slot profile, lunar-aware `[N]` |
| C5 | **Muharram / Safar avoidance** | Lunar blackout, recomputed yearly `[N]` |
| C6 | Peak Oct–Feb | Seasonal pricing `[E]` |
| C7 | Min / max lead time | `minLeadDays`/`maxLeadDays` `[E]` |
| C8 | Same-day booking | Allowed today `[E]` |
| C9 | Hold expiry mid-checkout | 15-min DateHold + advisory lock `[E]` |
| C10 | **Postponement (death in family)** | `postponedAt`/`postponedUntilAt` `[E]` — best-in-class |
| C11 | Reschedule; new date unavailable | `rescheduleService` `[E]` |
| C12 | Lunar dates shift each Gregorian year | Blackout rules stored lunar, resolved per year `[N]` |
| C13 | Strike / political shutdown / curfew | Force-majeure path `[E]` |
| C14 | Rukhsati runs past midnight | Illegal in Punjab — block, log, disclose `[N]` |
| C15 | Multi-day (Mehndi + Barat + Walima) | WeddingUmbrella `[E]` |
| C16 | Venue in vacation mode | `vacationMode` `[E]` |

## D. Food & menu

| # | Case | Answer |
|---|---|---|
| D1 | **Buffet vs sit-down vs family vs hi-tea vs live stations** | `serviceStyle` on package + booking `[N]` |
| D2 | **One-dish arithmetic (s.4)** | `countsAsMainDish` / `countsAsSweetDish` in builder `[N]` |
| D3 | Dish substitution within a tier | `PackageOption` `[N]` |
| D4 | Allergies | `MenuItem.allergens` + booking-level note `[N]` |
| D5 | Vegetarian / Jain guests | `isVegetarian` + `vegetarianCount` `[N]` |
| D6 | No-beef preference | `containsBeef` flag `[N]` |
| D7 | Halal | Assumed default; certificate on profile `[N]` |
| D8 | Kids menu | Menu variant + child rate `[N]` |
| D9 | Staff / driver meals | Separate rate + count `[N]` |
| D10 | Live counters | Add-ons `[E]` |
| D11 | Tasting before booking | `provideFoodTesting` `[P]` → schedulable `[N]` |
| D12 | Menu change deadline | `headcountLockDays` covers menu too `[N]` |
| D13 | Leftover food ownership | T&C clause, disclosed `[N]` |
| D14 | Outside caterer + kitchen access | `outsideVendorsAllowed` + fee `[E]` |
| D15 | Family brings own mithai / cake | Policy flag + free-text `[N]` |
| D16 | Water / soft drink brand | Menu item detail `[N]` |
| D17 | Service ratio promised | Per style, on the BEO `[N]` |
| D18 | Crockery grade | Package attribute `[N]` |

## E. Venue control

| # | Case | Answer |
|---|---|---|
| E1 | **Accept / decline a request** | `PENDING_VENDOR` state `[N]` |
| E2 | **Counter-offer** (different date or price) | Quotation vN+1 `[N]` |
| E3 | Blackout dates | `blockDate` `[E]` |
| E4 | Recurring closure (every Monday) | `BusinessRecurringBlock` `[E]` |
| E5 | Vacation mode | `[E]` |
| E6 | Capacity override for one date | `BusinessCapacityOverride` `[E]` |
| E7 | Offline / walk-in booking entry | `offline-booking-dialog` `[E]` |
| E8 | Bulk import historical bookings | `bulkImportBookings` `[E]` |
| E9 | Broker / agent commission | `broker`, `brokerCommission` models `[P]` |
| E10 | Quote expiry | `quoteValidityDays` `[N]` |
| E11 | Require site visit before confirm | `requiresSiteVisit` `[N]` |
| E12 | Advance not paid in N days → release | `advanceDueWithinDays` + job `[N]` |
| E13 | Instant-book only off-season | `bookingMode` per date/slot `[N]` |
| E14 | Team member roles | Memberships + `venueOsScope` `[E]` |
| E15 | Venue wants cash off-platform | Record-mode booking makes this legitimate `[N]` |
| E16 | Venue edits price after bookings exist | Snapshots protect existing bookings `[E]` |

## F. Customer satisfaction

| # | Case | Answer |
|---|---|---|
| F1 | **"I need to discuss something not in your form"** | **Free-text intent field — Part 8** `[N]` |
| F2 | Site visit scheduling | `SiteVisit` entity `[N]` |
| F3 | Tasting scheduling | `Tasting` entity `[N]` |
| F4 | Quotation PDF | Versioned quote doc `[N]` |
| F5 | Contract e-sign | `[N]` |
| F6 | What's included vs not | Pamphlet + quote breakdown `[N]` |
| F7 | Cancellation policy before payment | Snapshot exists `[E]`, never rendered `[N]` |
| F8 | Receipt per payment | Partial `[P]` |
| F9 | Change request | `BookingChangeRequest` `[E]` |
| F10 | Dispute | `BookingDispute` `[E]` |
| F11 | Review after event | Token review `[E]` |
| F12 | Vendor response SLA | Ack escalation exists `[P]` |
| F13 | **WhatsApp thread** | `whatsappNumber` exists, no integration `[N]` |
| F14 | Reminders (payment, lock, event day) | Outbox exists `[P]` |
| F15 | Day-of contact person + phone | BEO field `[N]` |
| F16 | Customer sees running balance | `[N]` |

## G. Operations / day-of

| # | Case | Answer |
|---|---|---|
| G1 | BEO generation + distribution | `beoService` exists, not wired `[P]` |
| G2 | Final headcount confirmation | `[N]` |
| G3 | Setup timeline | `[N]` |
| G4 | Gate counting / tokens | `[N]` |
| G5 | Actual count reconciliation | `[N]` |
| G6 | Final settlement invoice | `[N]` |
| G7 | Damage inspection with photos | Milestone photos exist `[P]` |
| G8 | Deposit return within 7 days | `[N]` |
| G9 | Staff assignment | `businessTeamMember` `[P]` |
| G10 | Generator / power readiness | Pre-event checklist `[N]` |
| G11 | Weather contingency call (open lawn) | Pre-event checklist `[N]` |
| G12 | Live issue log during event | `eventNightConsoleService` exists `[P]` |

## H. Failure & dispute

| # | Case | Answer |
|---|---|---|
| H1 | Double booking | Advisory lock + capacity engine `[E]` — solid |
| H2 | Venue cancels | `vendorCancelService`, 100% refund `[E]` |
| H3 | Venue partially cancels one line | `vendorPartialCancelService` `[E]` |
| H4 | Customer cancels | Policy slabs `[E]` |
| H5 | Customer no-show | Guarantee still bills `[N]` |
| H6 | Force majeure (flood, curfew, death) | `forceMajeureService` `[E]` |
| H7 | **Venue sealed by authorities** | Force majeure + relocation offer `[N]` |
| H8 | Payment fails / partial | Payment status machine `[E]` |
| H9 | Chargeback | `[N]` |
| H10 | Hold squatting | Quota + captcha `[E]` |
| H11 | Payment leakage off-platform | Record-mode legitimises it `[N]` |
| H12 | Damage dispute | `DamageClaim` + evidence `[N]` |
| H13 | Food quality complaint | Dispute + evidence `[E]` |
| H14 | Guest injury / liability | Insurance flag `[P]`, T&C `[N]` |
| H15 | Vendor unreachable before event | Ack escalation `[P]` |

## I. Compliance

| # | Case | Answer |
|---|---|---|
| I1 | One dish (s.4/s.5) | Menu-builder arithmetic + block `[N]` |
| I2 | 10 PM close (s.6) | Slot config hard block `[N]` |
| I3 | **Fireworks / aerial firing (s.3)** | Never bookable as an add-on `[N]` |
| I4 | Loudspeaker limits | Compliance rule `[N]` |
| I5 | Legal guest cap | `legalGuestCap` `[E]` → block, not warn `[N]` |
| I6 | Fire safety NOC + expiry | venue-compliance migration `[P]` |
| I7 | **PRA eIMS fiscal invoice on every advance + final** | `fbrProvider` exists `[P]` |
| I8 | CNIC capture over Rs 1,000 | `[N]` |
| I9 | Province differs (PRA 8% / SRB / ICT) | `TaxProfile` per jurisdiction `[N]` |

## J. Multi-event & diaspora

| # | Case | Answer |
|---|---|---|
| J1 | Wedding umbrella | `WeddingUmbrella` `[E]` — best-in-class |
| J2 | Different venue per event | Umbrella spans businesses `[E]` |
| J3 | One advance covering several events | `[N]` |
| J4 | Shared guest list across events | `guestListService` `[P]` |
| J5 | Overseas payer, local attendees | `diasporaPaymentModel` `[P]` |
| J6 | Local relative is the decision-maker | Proxy contact on booking `[N]` |
| J7 | Remote site visit (video) | `SiteVisit.mode = video` `[N]` |
| J8 | Timezone-aware comms | `[N]` |

---

# PART 8 — THE "TELL US ANYTHING" SYSTEM

**Verified gap:** there is **no free-text field anywhere in the customer booking flow.** Zero
`<Textarea>` in any step. `bookingDetails.specialRequests` is machine-generated from car-rental
quantity notes (`booking-form.tsx:388`), and `booking.additionalRequests` exists on the model but is
**never populated by the UI**.

No form will ever cover this market. Real messages a venue gets:

> *"Baraat will be late, around 9, please hold dinner"* · *"My khala is diabetic, need sugar-free
> kheer"* · *"We're bringing our own mithai from Rehmat-e-Shereen"* · *"Ladies section must be fully
> parda"* · *"Dulha is arriving on a horse, need the front gate clear"* · *"Nikah will happen at the
> venue, arrange a maulvi"* · *"My father uses a wheelchair"* · *"20 guests coming from Dubai, need
> hotel recommendations"* · *"Please no beef in any dish"*

## Design

**Three capture points, one thread:**

1. **Inquiry** — "What do you want to discuss?" (before any price exists)
2. **Requirements step** — a required step before Review, structured prompts + open box
3. **Post-booking** — "Add a note for the venue" any time until the event

**The Requirements step:**

```
Anything we should know?                            [ required step, may be left blank ]

Quick picks (tap any that apply)
 [ ] Separate ladies section / parda    [ ] Wheelchair or elderly access
 [ ] Nikah at the venue                 [ ] Baraat entry with dhol
 [ ] Bringing our own mithai/cake       [ ] Dietary restrictions
 [ ] Guests arriving from abroad        [ ] Special stage requirement
 [ ] Timing concern                     [ ] Photography restrictions

Dietary details
 Vegetarian guests: [   ]   No-beef: [ ]   Allergies: [____________________]
 Kids under 5: [   ]   Kids 5-12: [   ]   Drivers/staff needing meals: [   ]

Tell the venue anything else, in your own words
 +------------------------------------------------------------------+
 |                                                                  |
 |                                                                  |
 +------------------------------------------------------------------+
 Urdu or English, both fine.
```

## Data model

```js
BookingRequirement {
  bookingId | inquiryId | quotationId,
  source:    'inquiry' | 'booking_flow' | 'post_booking',
  tags:      ['parda','nikah_onsite','own_mithai'],   // the quick picks
  dietary:   { vegetarianCount, noBeef, allergies[], kidsUnder5, kids5to12, staffMeals },
  freeText:  '...',                                   // verbatim, never parsed
  language:  'ur' | 'en' | 'mixed',
  status:    'open' | 'acknowledged' | 'agreed' | 'declined' | 'quoted',
  vendorResponse: '...',
  priceImpactPkr: 0,                                  // if it becomes a chargeable add-on
  createdAt, respondedAt
}
```

## Rules that make it work rather than rot

1. **Verbatim, never parsed.** Tags assist routing; the text is never auto-interpreted.
2. **Every requirement needs a vendor response before the booking can reach CONFIRMED.**
   An unanswered requirement is an unresolved expectation — the exact thing that becomes a dispute.
3. **It flows onto the BEO.** The chef must see "sugar-free kheer for 1"; the captain must see
   "baraat late, hold dinner till 9:15".
4. **If it costs money, it becomes an add-on with a price**, and the customer re-approves.
5. **Urdu is first-class.** Store UTF-8, never transliterate, never machine-translate.
6. **It is the dispute record.** "You never told us" vs "we told you on 3 Nov" — settled by the
   thread.

---

# PART 9 — GAP ANALYSIS AGAINST THE CURRENT CODE

## 9.1 Already strong — do not rebuild

DateHold + `pg_advisory_xact_lock` concurrency · per-business slot resolution for mixed carts ·
`slotTemplateSnapshotJson` and every other snapshot · WeddingUmbrella · postpone-without-cancel ·
SubVenue tree with `genderMode` + `fireRatedCapacity` · SpaceMergeGroup · SeasonalPricing ·
CapacityOverride · RecurringBlock · CancellationPolicy slabs + force majeure · BusinessBundledService
with `mandatory`/`included` · change requests · disputes · token reviews · `payoutEligibleAt` ·
soft-delete + status history · honest scaffolds.

**The configuration layer is far more complete than the booking flow that consumes it.** A large
part of this work is *surfacing what already exists*, not building new.

## 9.2 The blockers, in order

| # | Gap | Why first |
|---|---|---|
| 1 | `Package.pricingUnit` / `minGuaranteeCount` / `includesFood` | Dominant selling shape is inexpressible; package+menu double-charges |
| 2 | `menu.price` FLOAT → NUMERIC(12,2) | Money bug, multiplied by up to 1,200 |
| 3 | `Business.pricingShape` | Nothing else can branch correctly without it |
| 4 | Adaptive step engine | Steps are hardcoded to one venue's shape |
| 5 | Tax + service charge + deposit in the quote | Biggest dispute source |
| 6 | Cancellation policy rendered pre-payment | Snapshot exists, never shown |
| 7 | Requirements / free-text system | No textarea exists anywhere |
| 8 | Request-to-book + accept/decline/counter | F5 — the market's actual behaviour |
| 9 | Settlement phase (`max(guaranteed, actual)`) | Booking currently "ends" at payment |
| 10 | Real per-venue bank details + receipt upload | Hardcoded placeholder IBAN is live |
| 11 | Compliance as hard blocks (s.3/s.4/s.6) | Criminal liability sits on the venue |
| 12 | Service style as a booking dimension | Changes capacity, staffing, price |

---

# PART 10 — BUILD SEQUENCE

**Phase 1 — Make pricing truthful (no new screens)**
1. `Package.pricingUnit` / `minGuaranteeCount` / `includesFood` / `menuId` / guest range — additive, defaults preserve behaviour
2. `menu.price` → `NUMERIC(12,2)`
3. `Business.pricingShape`, backfilled by inspecting each venue's existing data
4. Gate the Menu step on `!includesFood`; make it free when food is included
5. Tax + service charge + security deposit in the quote breakdown
6. Render the cancellation policy snapshot before payment

**Phase 2 — Make the venue's rules real**
7. Adaptive step engine driven by config
8. Compliance hard blocks: 10 PM (s.6), one-dish (s.4/s.5), fireworks (s.3), legal cap
9. Service style + capacity matrix
10. Menu builder rebuild with PK sections + one-dish arithmetic + `supplementPerHead`
11. Pamphlet renderer (vendor preview / customer view / PNG export)

**Phase 3 — Make the flow match the market**
12. Requirements + free-text system, threaded and required-to-resolve
13. Inquiry → Site visit → Quotation (versioned) → Booking
14. `bookingMode`: instant / request / inquiry-only, per date & slot
15. Accept / decline / counter-offer
16. Real per-venue bank details, receipt upload, remove the hardcoded IBAN

**Phase 4 — Close the loop to completion**
17. Headcount lock (T-7) with the guarantee shown plainly
18. BEO generation + distribution (service exists)
19. Actual-count capture + settlement `max(guaranteed, actual)`
20. Deposit inspection, damage claim, return
21. PRA/SRB/FBR fiscal invoicing on advance + final
22. WhatsApp as a real channel

**Phase 5 — Depth**
23. Advance-transfer-to-new-date credit ledger
24. Lunar-aware blackouts (Muharram, Safar, Ramadan slot profiles)
25. Kids / staff / crew meal rates
26. Contention groups (shared entrance, parking, kitchen)
27. Diaspora: currency, proxy decision-maker, video site visit

---

# PART 11 — OPEN QUESTIONS FOR THE PRODUCT OWNER

1. **Collect or record the advance?** (See `BOOKING-FLOW-ASSESSMENT.md` D-1.) Collecting pulls the
   platform inside the PRA fiscal-invoice obligation. Recording matches every surviving PK product.
2. **Default `bookingMode` for new venues** — `request` is the safe answer; `instant` is the
   growth answer.
3. **Is the platform the merchant of record, or a booking layer over the venue's own account?**
4. **Marketplace or venue back-office?** The repo is currently building both. Booking-flow answers
   differ.
5. **Which city rule packs ship first?** Punjab (10 PM, one-dish, PRA 8%) is the largest market and
   the strictest.

---

## Sources

**Law & compliance**
- [The Punjab Marriage Functions Act 2016 — Nasir Law Site](http://nasirlawsite.com/laws/pmfa2016.htm)
- [The Punjab Marriage Functions Act 2016 — Punjab Laws](http://punjablaws.gov.pk/laws/2647.html)
- [The Punjab Marriage Functions Act 2016 — LGCD Punjab (PDF)](https://lgcd.punjab.gov.pk/system/files/The%20Punjab%20Marriage%20Functions%20ACT%202016.pdf)
- [Wedding ceremonies: fireworks, dowry declared illegal in Punjab — DAWN](https://www.dawn.com/news/1252238)
- [One-dish menu permitted; ceremony after 10pm banned in Islamabad — Business Recorder](https://www.brecorder.com/news/40178872/one-dish-menu-permitted-wedding-ceremony-after-10pm-banned-in-islamabad)
- [One-Dish Policy: Islamabad Wedding Hall Crackdown 2026](https://www.pakistantruth.com/one-dish-policy/)
- [Maryam Nawaz cracks down on loudspeakers, one-dish rule](https://asiasamachar.com/2025/12/08/maryam-nawaz-cracks-down-on-loudspeakers-one-dish-rule-for-weddings/)
- [Punjab Sales Tax on Services rates 2026-27](https://conseric.pk/punjab-sales-tax-on-services/)
- [Sum Cloud POS — PRA eIMS, Amanat Scheme, fiscal invoicing](https://sumcloudpos.com/banquet-hall-pos-software.html)

**Pricing & operations**
- [Decorium Luxury Marquee — packages, deposit, headcount deadline, timings](https://decoriumplmarquee.com/)
- [Best Marquees in Lahore: 2026 Prices & Hidden Costs](https://pakbestfinds.com/best-marquees-in-lahore/)
- [Hanif Rajput — Lahore menus](https://hanifrajputcaterers.com/hanif-rajput-lahore-menu/)
- [Darbar Caterers — menus](https://www.darbarcater.com/menu.html)
- [Arranging a wedding in Pakistan 2025 — Neemopani](https://neemopani.com/arranging-a-wedding-in-pakistan-2025/)
- [Hamara Venue — Elite Marquee Lahore](https://hamaravenue.com/elite-marquee/dha-phase-8-ex-park-view-block-f-gate-lahore/wedding-marquee)

**Service styles & guest count**
- [DAWAT — Sit-Down or Buffet for a Pakistani wedding](https://www.dawatpakistan.com/ideal-dinner-setup-for-your-wedding/)
- [Cvent — Banquet Service Ratios](https://www.cvent.com/en/blog/events/banquet-service-ratios)
- [Banquet Staffing Ratios Guideline](https://www.linkedin.com/pulse/banquet-staffing-ratios-guideline-gajanan-shirke)
- [WedMeGood — calculating your minimum guarantee](https://www.wedmegood.com/blog/quick-ways-to-calculate-your-minimum-guarantee-to-caterers/)
- [Banquet management pricing — F&B clauses through 2026](https://www.meeting-event.com/banquet-management-pricing-the-fb-clauses-that-defend-your-margin-through-2026)

**Systems & competitors**
- [MarqSuite — Venue booking software, Pakistan](https://marquee-management-qzrb.vercel.app/)
- [iTech Marquee / Banquet Management System](https://banquetsoftware.pk/)
- [Tripleseat — wedding venue management, BEO, guest portal](https://tripleseat.com/industries/wedding-venues/)
- [Planning Pod — Banquet Event Orders](https://planningpod.com/blog/banquet-event-orders-how-to-create-and-use-a-beo)
- [Event Temple — crafting the ideal BEO](https://www.eventtemple.com/blog/crafting-the-ideal-banquet-event-order)
- [Shadiyana — Wedding Venues Pakistan](https://www.shadiyana.pk/list/wedding-venues)

**Season & culture**
- [Wedding season ends amid fewer bookings — Express Tribune](https://tribune.com.pk/story/2613234/wedding-season-ends-amid-fewer-bookings)
- [Pakistani Wedding Checklist & Timeline — Wedding Wala](https://www.weddingwala.pk/pakistani-wedding-checklist-and-timeline)
- [All Pakistani wedding events explained — HSY Gazette](https://theworldofhsy.com/blogs/hsy-gazette/all-the-pakistani-wedding-events-explained)
- [Marriage in Pakistan — Wikipedia](https://en.wikipedia.org/wiki/Marriage_in_Pakistan)
