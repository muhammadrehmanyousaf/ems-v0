# Vendor Registration & The Scenario Catalogue

**Date:** 2026-08-23
**Companions:** `BOOKING-FLOW-ASSESSMENT.md` · `PK-VENUE-PRICING-RESEARCH.md` ·
`VENUE-BOOKING-ARCHITECTURE.md`

**This document answers three things:**
1. What does the vendor set up, screen by screen, so that everything downstream is unambiguous?
2. How does "flat hall" work, and what happens for a venue that does **not** sell per head?
3. ~150 real scenarios — customer-side and vendor-side — each with the system's exact behaviour.

---

# PART 1 — THE ARCHITECTURAL CORRECTION

## 1.1 The mistake I made in the earlier docs

I said: add `pricingShape` to `Business`, and branch the booking flow on it.

**That is not flexible enough.** It assumes every venue fits one of four moulds. Real venues are
hybrids: a hall that sells all-inclusive per-head for weddings, flat-rate for corporate seminars,
and hall-only-with-kitchen-fee for families who insist on Hanif Rajput.

Branching on a shape enum means **new venue behaviour = new code**. That does not scale.

## 1.2 The correct model — everything is a RATE CARD LINE

> **There is no such thing as "a package" or "a menu" or "hall rent" in the data model.**
> **There is one table — `RateCardLine` — and those are just rows with different `kind` and
> `priceModel`.**

| Real-world thing | `kind` | `priceModel` | `amount` |
|---|---|---|---|
| "Hall rent Rs 3,00,000" | `space` | `flat` | 300000 |
| "Main Hall Rs 25,000 per day" | `space` | `per_day` | 25000 |
| "Gold Package Rs 2,500/head, food incl." | `bundle` | `per_head` | 2500 |
| "Menu 2 — Rs 2,250/head" | `food` | `per_head` | 2250 |
| "Hi-Tea Rs 900/head" | `food` | `per_head` | 900 |
| "Live jalebi counter Rs 15,000" | `addon` | `flat` | 15000 |
| "Live BBQ Rs 250/head" | `addon` | `per_head` | 250 |
| "Extra hour Rs 40,000/hr" | `addon` | `per_hour` | 40000 |
| "Generator surcharge (May–Sep)" | `surcharge` | `flat` + season window | 80000 |
| "Kitchen access fee (outside caterer)" | `surcharge` | `flat` | 60000 |
| "Peak December" | `surcharge` | `percent` | 15 |
| "Service charge" | `surcharge` | `percent` | 5 |
| "Punjab Sales Tax" | `tax` | `percent` | 8 |
| "Security deposit (refundable)" | `deposit` | `flat` | 100000 |
| "Negotiated discount" | `discount` | `flat` or `percent` | — |
| "F&B minimum spend Rs 8,00,000" | `minimum` | `floor` | 800000 |

**One table. One resolver. Every venue shape in Pakistan and anywhere else.**

`pricingShape` survives — but demoted to what it should always have been: **a preset that pre-fills
the rate card during registration.** A convenience, never a constraint. A venue can add any line at
any time and become a hybrid without a code change.

## 1.3 The RateCardLine schema

```js
RateCardLine {
  id, businessId, orgId

  // WHAT
  kind:         'space'|'bundle'|'food'|'service'|'addon'|'surcharge'|'discount'|'tax'|'deposit'|'minimum'
  name, nameUrdu, description
  images[]                        // pamphlet hero + gallery
  features[]                      // "Bridal room", "Valet parking", "Generator backup"
  excludes[]                      // explicit NOT-included list — the #1 trust gap

  // HOW IT IS PRICED
  priceModel:   'flat'|'per_head'|'per_hour'|'per_day'|'per_unit'|'percent'|'tiered_per_head'|'floor'
  amount:       NUMERIC(12,2)
  percentBase:  'subtotal'|'food_only'|'space_only'   // for percent lines
  tiers: [ {upToPax: 300, rate: 2800}, {upToPax: 600, rate: 2500}, {upToPax: null, rate: 2300} ]

  // PER-HEAD CONTROLS
  minGuaranteePax, guestRangeMin, guestRangeMax
  countsChildrenAt:  'full'|'half'|'free'
  staffMealRate:     NUMERIC(12,2)

  // WHAT IT CONTAINS
  includesFood:  bool             // a bundle that already covers catering
  menuId                          // the menu this bundle serves
  optionGroups[]                  // "1 main course — pick one of: Karahi | Qorma | Handi"
  serviceStyle:  'buffet'|'sit_down'|'family'|'hi_tea'|'stations'|null

  // WHEN IT APPLIES  (all nullable = always)
  appliesToSubVenueIds[], appliesToSlotTemplateIds[], appliesToEventTypes[]
  validFrom, validTo, weekdayMask, seasonWindows[]
  minLeadDays, maxLeadDays

  // HOW THE CUSTOMER MEETS IT
  selection:  'required'|'choose_one'|'optional'|'auto'
  group:      'space'|'main_offering'|'catering'|'decor'|'production'|'logistics'|'compliance'
  defaultSelected: bool
  maxQty, minQty

  // BEHAVIOUR
  isRefundable:          bool     // deposits
  isLegallyProhibited:   bool     // fireworks (PMFA 2016 s.3) — never bookable
  isTaxable:             bool
  displayOrder, isActive, deletedAt
}
```

## 1.4 The three `selection` values are the whole flexibility mechanism

| `selection` | Meaning | Renders as |
|---|---|---|
| `required` | Always charged, customer cannot remove | A line on the quote, no UI |
| `choose_one` | Customer must pick exactly one **within its `group`** | Radio cards |
| `optional` | Customer may add | Checkbox / quantity |
| `auto` | System adds when its conditions match | Line appears with an explanation |

**And this one rule resolves the entire package-vs-menu confusion:**

> **If the selected `main_offering` line has `includesFood = true`, every `catering` group line is
> rendered as a FREE CHOICE (`priceModel` ignored, amount = 0). Otherwise it is rendered as a
> PRICED CHOICE.**

One rule. No branching on venue type. Works for all five shapes below.

---

# PART 2 — THE FIVE SHAPES, WITH FULL WORKED MATH

The vendor picks one of these at registration and the system **pre-fills their rate card**. They can
edit any line afterwards, or add lines from another shape.

Baseline for all examples: **19 Dec 2026 (Saturday, peak season), Dinner, 300 guests.**

## SHAPE 1 — All-inclusive per head *(the dominant Pakistani model)*

Vendor enters one thing: tiers of per-head rate, each with its dish list.

```
RateCardLine  kind=bundle  group=main_offering  selection=choose_one
  "Gold"      per_head  2,500  includesFood=true  menu=Gold Menu   range 200-800  serviceStyle=buffet
  "Platinum"  per_head  3,800  includesFood=true  menu=Plat Menu   range 200-1200 serviceStyle=sit_down
```

```
Gold  2,500 x 300                                    =  Rs  7,50,000
Peak December  +15%   (surcharge, percent)           =  Rs  1,12,500
                                                        ------------
Net                                                     Rs  8,62,500
Service charge 5%                                       Rs    43,125
Punjab Sales Tax 8%                                     Rs    72,450
                                                        ============
GRAND TOTAL                                             Rs  9,78,075
Advance 30%                                             Rs  2,93,423
Security deposit (refundable)                           Rs  1,00,000
```

**Customer steps:** Date → Guests → **Package** → *Customise menu (free)* → Add-ons → Requirements → Review
**Menu step charges?** NO.

## SHAPE 2 — Hall flat + food per head

```
RateCardLine  kind=space  group=space  selection=required
  "Main Hall - Dinner"   flat  3,00,000

RateCardLine  kind=food  group=catering  selection=choose_one
  "Menu 1"  per_head  1,250   minGuarantee 200
  "Menu 2 (mutton)"  per_head  2,250   minGuarantee 200
```

```
Main Hall (flat)                                     =  Rs  3,00,000
Menu 1  1,250 x 300                                  =  Rs  3,75,000
                                                        ------------
Net                                                     Rs  6,75,000
Peak December +15%                                      Rs  1,01,250
Service charge 5%                                       Rs    38,813
Punjab Sales Tax 8%                                     Rs    65,205
                                                        ============
GRAND TOTAL                                             Rs  8,80,268
```

**Customer steps:** Date → Guests → **Hall** → **Menu (PRICED)** → Add-ons → Requirements → Review
**Menu step charges?** YES.

**This is what your code does today — and it is the ONLY shape it can do.**

## SHAPE 3 — Hall only, customer brings a caterer

Real in Pakistan: Rs 15,000–35,000/day mid-size halls, Rs 200,000+/day premium (Lahore).
Al-Hamra and Fortress Stadium allow external caterers with a kitchen fee.

```
kind=space     group=space       selection=required   "Main Hall"          per_day  2,50,000
kind=surcharge group=logistics   selection=auto       "Kitchen access fee" flat       60,000
                                                       (auto: fires when outsideCaterer = true)
kind=deposit   group=compliance  selection=required   "Security deposit"   flat     1,00,000  refundable
```

```
Main Hall (per day)                                  =  Rs  2,50,000
Kitchen access fee (auto)                            =  Rs     60,000
                                                        ------------
Net                                                     Rs  3,10,000
Peak December +15%                                      Rs     46,500
Punjab Sales Tax 8%                                     Rs     28,520
                                                        ============
GRAND TOTAL                                             Rs  3,85,020
Security deposit (refundable, separate)                 Rs  1,00,000
```

**Customer steps:** Date → **Hall** → Guests *(capacity check only, no pricing)* →
Outside-caterer details → Add-ons → Requirements → Review
**Menu step?** **DOES NOT RENDER.** No catering-group lines exist.

> **THIS IS THE ANSWER TO "what if he doesn't do per head".**
> The menu step is not skipped by a flag. It simply has nothing to render, because the vendor
> created no `catering` lines. The step engine is data-driven: **empty group = no step.**

Guest count is still captured — for capacity, layout, the BEO and the gate — but it **multiplies
nothing**.

## SHAPE 4 — Caterer, no hall

```
kind=food  group=catering  selection=choose_one
  "Menu 1"  per_head 1,250  minGuarantee 150
  "Menu 2"  per_head 2,250  minGuarantee 150
kind=addon group=catering  selection=optional  "Live BBQ counter"  per_head 250
kind=addon group=logistics selection=optional  "Crockery upgrade"  per_head 120
```

**Customer steps:** Date → Guests → **Menu (PRICED)** → Add-ons → Delivery address → Requirements → Review
**No space step at all** — no `space` lines exist.

## SHAPE 5 — Hall rent + minimum food spend *(hotels, clubs)*

The global "F&B minimum" model. Rare in marquees, standard in hotel ballrooms.

```
kind=space    group=space     selection=required   "Ballroom"        flat  2,00,000
kind=minimum  group=catering  selection=auto       "F&B minimum"     floor 8,00,000
kind=food     group=catering  selection=choose_one "Menu A" per_head 2,200
```

```
Ballroom                                             =  Rs  2,00,000
Menu A  2,200 x 300                = 6,60,000
   F&B minimum Rs 8,00,000 applies -> shortfall       =  Rs  8,00,000
                                                        ------------
Net                                                     Rs 10,00,000
```

The `floor` model: `foodTotal = max(foodTotal, minimumAmount)`. The customer is told
plainly: *"Your menu comes to Rs 6,60,000. This venue has an Rs 8,00,000 food minimum, so
Rs 1,40,000 is added. Adding 64 more guests or upgrading your menu would use it instead of wasting
it."*

---

# PART 3 — THE VENDOR REGISTRATION WIZARD

## 3.1 What exists today

`components/VendorStepForms/newVendorRegisterationForm/venueSteps/venue-steps.tsx` — **7 steps**:

```
1 Personal · 2 Contact · 3 Business (+ spaces builder, flag-gated) ·
4 Specialty & Trust · 5 Packages · 6 Images · 7 Preview
```

**Verified problems:**

| Problem | Evidence |
|---|---|
| The package form asks **name + price + features only** | `packages.tsx:137` → `{ name: "", price: 0, features: {} }` |
| **No pricing unit anywhere.** Vendor types a rupee number with no stated basis | same |
| **No menu step at all in registration** | menus only exist in `businessSettings/redesigned/menus-manager.tsx`, post-signup |
| No booking rules, no cancellation policy, no tax setup, no slots | not in the wizard |
| Spaces builder is flag-gated OFF | `NEXT_PUBLIC_VENUE_HIERARCHY_ON` |

**One thing already right:** `menus-manager.tsx` has an **explicit** `pricingUnit` toggle
(`per_head` / `per_event`) plus `minGuarantee`, defaulting to `per_head` — described in-code as
"the Pakistani norm". That is exactly the control `Package` is missing.

## 3.2 The proposed wizard — 12 steps, 3 phases

```
PHASE A — GET LISTED  (required, ~8 min, venue appears in search after this)
  A1  Account & identity
  A2  Venue profile
  A3  Spaces
  A4  HOW DO YOU CHARGE?          <- the fork
  A5  Rate card (pre-filled by A4)
  A6  Photos
  A7  Preview & publish            <- pamphlet preview

PHASE B — TAKE BOOKINGS  (required before the first booking, ~6 min)
  B1  Calendar & slots
  B2  Booking rules
  B3  Money & policy
  B4  Compliance

PHASE C — RUN EVENTS  (progressive, prompted later)
  C1  Menus in detail · C2 Add-ons · C3 Seasonal pricing · C4 Team · C5 Tax/eIMS
```

**Rule:** Phase A gets them listed. Phase B gates the Book Now button. Phase C is progressive.
A venue that abandons at A7 still has a live listing with an inquiry button — which is what most PK
platforms are anyway.

## 3.3 Step-by-step

### A1 — Account & identity
Name, phone, **WhatsApp** (default = phone), email, password, CNIC, NTN (optional).
→ `Business`: `ownerName`, `whatsappNumber`, `cnicNumberEncrypted`, `ntnNumber` — all EXIST.

### A2 — Venue profile
Venue name, type (Marquee / Banquet Hall / Lawn / Farmhouse / Hotel Ballroom / Community Hall /
Rooftop / Club), city, area, full address + map pin, year established, description, amenities.
→ EXISTS: `venueType`, `city`, `subArea`, `amenitiesJson`, `yearsInBusiness`.

**City is load-bearing.** It seeds the compliance pack at B4 (Punjab → 10 PM + one-dish + PRA 8%;
Karachi → midnight + SRB).

### A3 — Spaces

```
Do you have more than one bookable space?     ( ) One  ( ) Multiple

For each space:
  Name                       [ Main Hall            ]
  Type                       ( ) Hall (•) Marquee ( ) Lawn ( ) Rooftop ( ) Bridal room
  Legal / fire-rated capacity            [ 900 ]   <- hard block, never exceeded
  Comfortable seated capacity            [ 600 ]   <- what you'd honestly recommend
  Capacity by service style
      Buffet        [ 800 ]     Sit-down   [ 600 ]     Hi-tea (standing) [ 900 ]
  Gender mode         (•) Mixed ( ) Ladies only ( ) Gents only ( ) Partitioned
  Covered / open      (•) Covered ( ) Open ( ) Semi-covered
      -> if Open:  Rain backup?  ( ) Yes, [which space]  ( ) No — disclosed to customers
  Setup access needed before the slot     [ 4 ] hours
  Teardown after                          [ 2 ] hours
  Shares entrance/parking/kitchen with    [ Hall B ]     <- contention group
  Can be merged with                      [ Lawn ]       <- SpaceMergeGroup
```
→ EXISTS: `SubVenue` with `fireRatedCapacity`, `comfortCapacity`, `genderMode`, `SpaceMergeGroup`.
→ NEW: capacity-by-style matrix, setup/teardown windows, contention group, rain backup.

### A4 — HOW DO YOU CHARGE? *(the fork — new, and the most important screen in the product)*

```
   ( ) One rate per head — food and hall together
       "Rs 2,500 per head, everything included"
       Most marquees work this way.

   ( ) Hall charge + food charged per head separately
       "Rs 3,00,000 for the hall, plus Rs 1,250 per head for food"

   ( ) Hall only — customers arrange their own caterer
       "Rs 2,50,000 per day. Outside caterers welcome (kitchen fee applies)."

   ( ) I'm a caterer — I don't have a hall
       "Menu 2 — Rs 2,250 per head"

   ( ) Hall charge + a minimum food spend
       "Rs 2,00,000 hall, with a minimum Rs 8,00,000 spent on food"

   [ ] I do more than one of these  ->  builds a blended rate card
```

Then, still on A4:

```
Do you charge differently for different events?
  [x] Wedding (Barat / Walima)     [x] Mehndi        [ ] Corporate
  [x] Hi-Tea / Mayoun              [ ] Milad / Aqiqah  [ ] Soyem / Chehlum
  -> each ticked event type gets its own rate card lines
```

### A5 — Rate card *(pre-filled from A4)*

For **Shape 1**, the form the vendor sees:

```
YOUR PACKAGES

  ┌─ Package 1 ─────────────────────────────── [preview] ─┐
  │ Name                    [ Gold                      ] │
  │ Rate                    [ 2,500 ] per (•) head ( ) event   <- ALWAYS EXPLICIT
  │ Guest range             [ 200 ] to [ 800 ]             │
  │ Minimum billed guests   [ 200 ]                        │
  │ Service style           (•) Buffet ( ) Sit-down        │
  │ Food included?          (•) Yes ( ) No                 │
  │                                                        │
  │ WHAT'S INCLUDED (shown to customers)                   │
  │   [x] Hall + AC   [x] Generator   [x] Bridal room      │
  │   [x] Basic stage & décor   [x] Valet parking          │
  │   [+ add your own]                                     │
  │                                                        │
  │ WHAT'S NOT INCLUDED (prevents 80% of arguments)        │
  │   [x] Décor upgrade  [x] Photography  [x] DJ           │
  │                                                        │
  │ MENU FOR THIS PACKAGE                                  │
  │   ( ) Use an existing menu   (•) Build it now          │
  │   Main course   [ Chicken Karahi ]  [+ let customer    │
  │                                       choose from 3 ]  │
  │   Rice          [ Chicken Biryani ]                    │
  │   BBQ           [ Reshmi Seekh Kabab ] [x] live        │
  │   Dessert       [ Gulab Jamun ]                        │
  │   ✓ Complies with Punjab one-dish rule                 │
  │                                                        │
  │ Photos          [ + upload ]                           │
  └────────────────────────────────────────────────────────┘
```

**The live pamphlet preview sits beside this form.** A vendor who typed "2,500 per event" when they
meant per head sees `Rs 2,500 total for 300 guests` in the preview and fixes it in two seconds.
That is the entire justification for the pamphlet as a correctness feature.

For **Shape 3 (hall only)** the same screen shows *no menu section at all* — and consequently the
customer will never see a menu step. **This is the mechanism, not a special case.**

### A6 — Photos
Cover, gallery per space, per package. → `images` EXISTS on both Business and Package.

### A7 — Preview & publish
Full customer-eye listing + a **live quote simulator**:

```
SIMULATE A QUOTE   [ 300 ] guests · [ 19 Dec 2026 ] · [ Dinner ]

  Gold   2,500 x 300 = 7,50,000 + peak 15% + 5% svc + 8% PST  =  Rs 9,78,075
  Platinum                                                     =  Rs 14,86,674

Is this what you'd quote on the phone?   [ Yes, publish ]  [ No, let me fix it ]
```

**This single control catches almost every misconfiguration before a customer ever sees it.**

### B1 — Calendar & slots

```
Sittings you offer         [x] Lunch 12:00-16:00   [x] Dinner 19:00-22:00
                           [ ] Hi-Tea  [ ] Brunch  [ ] Aftari  [ ] Sehri

  ⚠ Punjab law: all ceremonies must conclude by 10:00 PM.
     Your Dinner slot ends 22:00. ✓ Compliant.
     Liability is on the venue: up to 1 month imprisonment + Rs 50,000–20,00,000 (PMFA 2016 s.6/s.8).

Two events on the same day?  (•) Yes  ( ) No
  Gap needed between them    [ 3 ] hours

Weekly closures              [ ] Mon [ ] Tue ...
Ramadan                      (•) Switch to Aftari + Sehri  ( ) Close  ( ) No change
Muharram (1–10)              (•) Closed  ( ) Open
Safar                        ( ) Closed  (•) Open
How far ahead can people book?      [ 18 ] months
Minimum notice                       [ 3 ] days
```
→ EXISTS: `BusinessSlotTemplate`, `BusinessRecurringBlock`, `minLeadDays`, `maxLeadDays`.
→ NEW: Ramadan profile, lunar blackouts, same-day gap rule.

### B2 — Booking rules

```
When someone books online:
  ( ) Confirm instantly once they pay the advance
  (•) I review and accept first          <- recommended default
  ( ) Enquiries only — I'll call them back

  Different rules for peak dates?  [x]
     Oct–Feb   -> ( ) instant  (•) I review first
     Mar–Sep   -> (•) instant  ( ) I review first

Site visit required before confirming?   ( ) Yes  (•) No
How long is a quote valid?               [ 30 ] days
Advance must arrive within                [ 7 ] days, else the date is released
Hold a date while they check out          [ 15 ] minutes
```
→ ALL NEW. **Default `request`** — no surviving PK platform takes a card to lock a date.

### B3 — Money & policy

```
ADVANCE          (•) Percentage [ 30 ]%   ( ) Fixed [        ]
                 Minimum advance [ 1,00,000 ]
SECURITY DEPOSIT (refundable)  [ 1,00,000 ]  returned within [ 7 ] days after inspection
BALANCE DUE      [ 3 ] days before the event
INSTALMENTS      [x] allow  -> 30% now · 40% at 60 days · 30% at 3 days

HEADCOUNT
  Final count locked        [ 7 ] days before
  Extra guests at same rate up to  [ 10 ]% over the guaranteed number
  Beyond that, per head            [ 3,200 ]
  Children under 5   (•) free      5–12  (•) half rate
  Drivers / staff meals            [ 800 ] per head

CANCELLATION
  90+ days   [100]% refund      60–89 days [ 50]%
  30–59 days [ 25]%             under 30   [  0]%
  [x] Advance can instead be transferred to a new date within [ 12 ] months
      <- the Pakistani norm; forfeiting outright is rarer than people think
  Death in the family / force majeure:  (•) full refund  ( ) transfer only

PAYMENT WE ACCEPT   [x] Cash  [x] Bank transfer  [ ] Card  [x] JazzCash/Easypaisa  [x] Cheque
  Bank account title  [                    ]
  IBAN                [                    ]   -> verified, shown ONLY on your bookings
```
→ EXISTS: `downPayment`/`downPaymentType`, `CancellationPolicy.slabs`, `forceMajeureRule`,
`BookingInstallment`, `acceptsCash`/`acceptsBankTransfer`.
→ NEW: deposit, headcount rules, tolerance band, walk-in rate, child/staff rates,
advance-transfer policy, **per-venue bank details** (kills the hardcoded placeholder IBAN).

### B4 — Compliance *(auto-seeded from city, vendor confirms)*

```
Your venue is in LAHORE. Punjab rules apply:

  ✓ All functions conclude by 10:00 PM        (PMFA 2016 s.6 — liability is YOURS)
  ✓ One dish only                              (s.4/s.5 — liability is YOURS and your caterer's)
      = 1 salan + 1 rice + 1 salad + drinks + roti/nan + 1 sweet
  ✓ No fireworks or aerial firing               (s.3) — cannot be offered as an add-on
  ✓ Punjab Sales Tax 8% on marriage halls & catering

  Legal guest cap for your venue      [ 900 ]
  Fire safety NOC   [upload]  expires [        ]
  Annual revenue over Rs 60 lakh?  ( ) Yes -> PRA registration + eIMS required  (•) No

  Prices you enter are   (•) before tax   ( ) tax included
```
→ EXISTS: `oneDishPolicy`, `eventClosingTime`, `legalGuestCap`, `requiresPermit`.
→ NEW: city rule packs, fireworks block, tax jurisdiction, eIMS enrolment, quote tax mode.

---

# PART 4 — VENDOR CONFIG → CUSTOMER STEPS (the decision matrix)

**No step is ever hardcoded.** Each is derived:

| Step | Renders when |
|---|---|
| Event type | `business.eventTypes.length > 1` |
| Date & slot | always |
| Guests | always *(pricing only if any selected line is per-head)* |
| Space | `subVenues.length > 1` |
| Service style | `distinct(serviceStyle) > 1` across eligible lines |
| **Main offering** | `any(group='main_offering' or 'space')` |
| **Menu — PRICED** | `any(group='catering', selection='choose_one')` **AND** `!chosen.includesFood` |
| **Menu — FREE choice** | `chosen.includesFood` **AND** `chosen.optionGroups.length > 0` |
| **Menu — hidden** | no `catering` lines exist *(Shape 3)* |
| Outside caterer | `outsideVendorsAllowed && !any(catering)` |
| Add-ons | `any(selection='optional')` |
| **Requirements** | **always** |
| Review | always |
| Payment | `bookingMode == 'instant'` |
| Submit request | `bookingMode == 'request'` |

Applied to the five shapes:

| | Shape 1 | Shape 2 | Shape 3 | Shape 4 | Shape 5 |
|---|---|---|---|---|---|
| Space step | if multi | if multi | **yes** | **no** | yes |
| Main offering | Package | Hall | Hall | — | Ballroom |
| Menu step | **free** | **priced** | **hidden** | **priced** | priced + floor |
| Guests affect price | yes | yes | **no** | yes | yes |

---

# PART 5 — THE UNIFIED PRICING RESOLVER

One function. Every venue. No branches on venue type.

```
resolveQuote(business, request) -> Quote

  1. ELIGIBILITY
     lines = rateCard.filter(active
              && dateWithin(validFrom, validTo) && weekdayMask matches
              && (appliesToSubVenueIds empty  || includes request.spaceId)
              && (appliesToSlotTemplateIds empty || includes request.slotId)
              && (appliesToEventTypes empty  || includes request.eventType)
              && (guestRange empty || request.pax within range)
              && leadTime OK
              && !isLegallyProhibited)

  2. BILLABLE HEADS  (per line — a line may have its own guarantee)
     adults   = pax - kidsUnder5 - kids5to12
     heads    = adults
              + kids5to12 * (countsChildrenAt=='half' ? 0.5 : countsChildrenAt=='free' ? 0 : 1)
     billable = max(heads, line.minGuaranteePax, 1)
     staffHeads billed separately at line.staffMealRate

  3. LINE AMOUNTS
     flat            -> amount
     per_day         -> amount * days
     per_hour        -> amount * hours
     per_unit        -> amount * qty
     per_head        -> amount * billable
     tiered_per_head -> tierRateFor(billable) * billable
     percent         -> deferred to step 6
     floor           -> deferred to step 5

  4. FOOD OVERRIDE  <- the one rule that ends the confusion
     if chosen main_offering.includesFood:
         every catering line -> amount 0, label "included"
         optionGroup picks   -> 0, unless MenuItem.supplementPerHead > 0
                                then supplement * billable

  5. FLOORS
     for each 'minimum' line: groupTotal = max(groupTotal, line.amount)
        -> emit an explicit "minimum spend applied" line, never a silent bump

  6. ORDERED APPLICATION   (order is contractual, not cosmetic)
     subtotal   = sum(space, bundle, food, service, addon)
     + surcharge(percent) on percentBase   [seasonal, peak-date]
     - discount
     = net
     + service charge (percent)
     + tax (percent on taxable lines only)
     = grandTotal
     deposits are listed SEPARATELY, never inside grandTotal

  7. DERIVED
     advanceDue      = policy.pct * grandTotal, floored at policy.min
     balanceDue      = grandTotal - advanceDue,  dueOn = eventDate - balanceDueDays
     headcountLockAt = eventDate - headcountLockDays
     toleranceMaxPax = ceil(guaranteed * (1 + toleranceBandPct))
     settlementRule  = "max(guaranteed, actual); beyond toleranceMaxPax at walkInRate"

  8. EXPLAIN  <- every line carries WHY
     { label, basis: "2,500/head x 300 guests", why: "Peak season 19 Dec (+15%)" }
```

**Step 8 is not decoration.** Most Pakistani venue disputes are "why is it more than you said". A
quote where every line explains itself is the cheapest dispute-prevention available.

---

# PART 6 — THE SCENARIO CATALOGUE

`[E]` handled today · `[P]` partial · `[N]` to build.

## SA — Quoting & discovery

| # | Scenario | System behaviour |
|---|---|---|
| SA1 | **"Midday, 300 guests, 19th — how much?"** | Resolve date→season+weekday, slot→Lunch, 300→tier & guarantee. Return a card **per eligible package** with full breakdown. No login. `[N]` |
| SA2 | 300 guests but package minimum is 400 | Quote shows `Rs X (billed for 400 — this package's minimum)`. Offer packages whose minimum ≤ 300. `[N]` |
| SA3 | 300 guests, venue has tiers 300/500/800 | `tiered_per_head` picks the 300 tier; show *"at 500 guests your rate drops to Rs 2,300 — total only Rs 1.6L more"* `[N]` |
| SA4 | Asks for a date the venue is closed | "Closed on Mondays. Nearest open: Tue 20th, Thu 22nd." `[E]` |
| SA5 | Asks for a blocked/booked date | Show next 3 free dates in the same week + the same weekday next week `[P]` |
| SA6 | Asks for a Muharram date | "This venue doesn't hold functions during Muharram." Offer post-Muharram dates. `[N]` |
| SA7 | Asks for a Ramadan date | Auto-switch to Aftari/Sehri slots; hide Lunch/Dinner `[N]` |
| SA8 | Asks 14 months out | Quote + *"prices valid 30 days; peak dates are re-quoted 12 months out"* `[N]` |
| SA9 | Asks for tomorrow | Blocked by `minLeadDays`, with the reason `[E]` |
| SA10 | Asks a price the venue hasn't set | `isUnpricedVendor` → inquiry dialog instead of a dead end `[E]` |
| SA11 | Wants a quote for 3 events (Mehndi/Barat/Walima) | Umbrella quote, bundle tier applied, shown per event and combined `[P]` |
| SA12 | Compares two venues | Normalised "all-in per head at your guest count" so shapes are comparable `[N]` |
| SA13 | "What's the cheapest you can do?" | Show off-peak/weekday alternatives with the delta, not a discount button `[N]` |
| SA14 | Guest count not decided yet | Slider — quote updates live; guarantee line updates with it `[N]` |
| SA15 | Asks whether tax is included | Quote states `Prices shown include/exclude PST` per `TaxProfile.quoteMode` `[N]` |
| SA16 | Wants a written quote | Versioned Quotation PDF, valid N days, WhatsApp-able `[N]` |
| SA17 | Quote expires, then they return | Auto re-quote at current rates, **diff shown against the old one** `[N]` |
| SA18 | Overseas family asks in USD | Converted display, PKR remains the contractual currency `[P]` |
| SA19 | Asks for a hall-only venue's "per head" | *"This venue charges for the hall only — food is arranged by you."* + kitchen fee `[N]` |
| SA20 | Wants only Nikah (60 guests) in a 900-cap marquee | Small-event line or minimum-spend line applies; if neither, suggest the smaller space `[N]` |

## SB — Vendor configuration

| # | Scenario | System behaviour |
|---|---|---|
| SB1 | "I charge per head, all inclusive" | Shape 1 preset `[N]` |
| SB2 | "Hall separate, food per head" | Shape 2 preset `[N]` |
| SB3 | "Hall only, bring your caterer" | Shape 3 preset; **catering group stays empty → no menu step** `[N]` |
| SB4 | "I'm a caterer, no hall" | Shape 4 preset; no space step `[N]` |
| SB5 | "Hall + minimum food spend" | Shape 5 preset; `floor` line `[N]` |
| SB6 | "Per head for weddings, flat for corporate" | Both line sets, scoped by `appliesToEventTypes` `[N]` |
| SB7 | "Rate drops above 500 guests" | `tiered_per_head` `[N]` |
| SB8 | "Mutton menu costs Rs 400/head more" | ONE menu + `supplementPerHead`, not two menus `[N]` |
| SB9 | "Lunch cheaper than dinner" | Lines scoped by `appliesToSlotTemplateIds` `[N]` |
| SB10 | "Saturdays cost more" | Seasonal line, `weekdayMask` `[E]` |
| SB11 | "December +15%" | Seasonal line, date window `[E]` |
| SB12 | "14 Aug and 31 Dec are special" | Named-date seasonal rows, priority ordered `[E]` |
| SB13 | "Two halls, sometimes combined" | `SpaceMergeGroup` `[E]` |
| SB14 | "Hall B only for ladies functions" | `SubVenue.genderMode` + event-type scoping `[E]`/`[N]` |
| SB15 | "Lawn holds 800 buffet, 600 sit-down" | Capacity-by-service-style matrix `[N]` |
| SB16 | "Generator surcharge May–Sep only" | Surcharge with `seasonWindows` `[N]` |
| SB17 | "Outside caterer allowed, Rs 60k fee" | `outsideVendorsAllowed` + auto surcharge `[E]`/`[N]` |
| SB18 | "No outside décor at all" | Policy flag + disclosed in listing `[N]` |
| SB19 | "I want to approve every booking" | `bookingMode = request` `[N]` |
| SB20 | "Instant in summer, review in winter" | `bookingMode` per season `[N]` |
| SB21 | "Advance 30%, min Rs 1 lakh" | pct + floor `[P]` |
| SB22 | "Advance non-refundable but transferable" | `advanceTransferPolicy` `[N]` |
| SB23 | "Rs 1 lakh security deposit" | `deposit` line, refundable, outside grandTotal `[N]` |
| SB24 | "Final count 7 days before" | `headcountLockDays` `[N]` |
| SB25 | "10% extra guests at the same rate, then Rs 3,200" | tolerance band + walk-in rate `[N]` |
| SB26 | "Kids under 5 free, 5–12 half" | `countsChildrenAt` `[N]` |
| SB27 | "Drivers eat at Rs 800" | `staffMealRate` `[N]` |
| SB28 | "Closed Mondays" | `BusinessRecurringBlock` `[E]` |
| SB29 | "Closed all Muharram" | Lunar blackout `[N]` |
| SB30 | "Hajj — closed 3 weeks" | `vacationMode` `[E]` |
| SB31 | "Two functions a day, 3h gap" | `bufferAfterMinutes` + same-day gap `[E]`/`[N]` |
| SB32 | "Decorator needs 6h before" | `setupAccessMinutes` blocks the prior slot `[N]` |
| SB33 | "Agent brought this booking, 5%" | Broker commission `[P]` |
| SB34 | "My manager can accept, not discount" | Membership roles `[E]` |
| SB35 | "I typed 2,500 meaning per head" | **Pamphlet preview + quote simulator catch it pre-publish** `[N]` |

## SC — Booking flow

| # | Scenario | System behaviour |
|---|---|---|
| SC1 | Picks a food-inclusive package | Menu step renders as a **free** choice `[N]` |
| SC2 | Picks a hall-only package | Menu step renders **priced** `[E]` |
| SC3 | Venue has no catering lines | Menu step **does not render** `[N]` |
| SC4 | Package offers "pick 1 of 3 mains" | `optionGroups` radio, price unchanged `[N]` |
| SC5 | Upgrades chicken→mutton | `+supplementPerHead × billable`, shown as its own line `[N]` |
| SC6 | Single space venue | Space step auto-skipped `[E]` |
| SC7 | Multi-space venue | Space step with capacity per style `[P]` |
| SC8 | Guests exceed comfort but not legal cap | Warn, allow, record acknowledgement `[P]` |
| SC9 | **Guests exceed fire-rated cap** | **Hard block** — venue liability `[N]` |
| SC10 | Guests exceed `legalGuestCap` | **Hard block**, cite the rule `[N]` |
| SC11 | Slot would end after 10 PM | **Hard block** at config time, so never offered `[N]` |
| SC12 | Wants an extra hour past 10 PM | Refused with the statute + penalty range `[N]` |
| SC13 | Books Mehndi + Barat + Walima | Umbrella, bundle tier, one advance option `[P]` |
| SC14 | Adds a photographer mid-flow | Multi-vendor cart, per-business slot resolution `[E]` |
| SC15 | Hold expires mid-checkout | Advisory lock; conflict returns free alternatives `[E]` |
| SC16 | Two customers race the same slot | `pg_advisory_xact_lock` serialises `[E]` |
| SC17 | Refreshes mid-booking | Draft resume; date/slot deliberately dropped `[E]` |
| SC18 | `bookingMode = request` | No payment step → "Request sent" `[N]` |
| SC19 | Venue accepts | → `AWAITING_ADVANCE`, payment link + WhatsApp `[N]` |
| SC20 | Venue counters (different hall/price) | Quotation v2, customer accepts or declines `[N]` |
| SC21 | Venue declines | Reason + 3 alternative venues `[N]` |
| SC22 | Venue silent 48h | Auto-escalate, release hold, notify both `[P]` |
| SC23 | Customer wants a site visit first | `SiteVisit` scheduled, hold extended `[N]` |
| SC24 | Wants a tasting | `Tasting` scheduled; fee credited if booked `[N]` |

## SD — Guest count, menu, dietary

| # | Scenario | System behaviour |
|---|---|---|
| SD1 | Expects 500, guarantees 400 | Both stored; bill `max(400, actual)` `[N]` |
| SD2 | 350 turn up against a 400 guarantee | Bill 400. Shown at lock time so it isn't a surprise. `[N]` |
| SD3 | 430 against a 400 guarantee, band 10% | All 430 at the same rate `[N]` |
| SD4 | 480 against 400, band 10% | 440 at normal rate, 40 at walk-in rate `[N]` |
| SD5 | Wants to raise the count after lock | Venue accepts (capacity + kitchen) or refuses; walk-in rate applies `[N]` |
| SD6 | Wants to lower after lock | Guarantee holds. Stated plainly at lock. `[N]` |
| SD7 | 40 kids under 5 | Free per `countsChildrenAt` `[N]` |
| SD8 | 30 kids 5–12 | Half rate `[N]` |
| SD9 | 25 drivers/staff | `staffMealRate` line `[N]` |
| SD10 | Photographer + DJ + decor crew eat | `crewMealCount` on the BEO `[N]` |
| SD11 | 15 vegetarian guests | `vegetarianCount` → BEO, separate prep `[N]` |
| SD12 | "No beef in anything" | `containsBeef` filter blocks non-compliant items `[N]` |
| SD13 | Nut allergy | `allergens` + a hard-flagged BEO note `[N]` |
| SD14 | Diabetic guest, sugar-free dessert | Requirements free-text → BEO `[N]` |
| SD15 | Wants 2 main courses in Punjab | **Blocked** — one-dish. Explained with the definition. `[N]` |
| SD16 | "Call the second main a salad" | Builder counts by `countsAsMainDish`, not by label `[N]` |
| SD17 | Brings their own mithai | Policy flag; corkage-style fee if the venue sets one `[N]` |
| SD18 | Brings their own cake | Cake-cutting fee line if configured `[N]` |
| SD19 | Wants a live jalebi counter | Optional add-on `[E]` |
| SD20 | Wants buffet not sit-down | Service style choice; capacity + staff ratio recompute `[N]` |
| SD21 | Wants a tasting before locking the menu | `provideFoodTesting` → schedulable `[P]` |
| SD22 | Changes menu 3 days before | Past lock — venue may refuse or charge `[N]` |

## SE — Money

| # | Scenario | System behaviour |
|---|---|---|
| SE1 | Pays advance by bank transfer | **Real venue IBAN**, receipt upload, venue marks received `[N]` |
| SE2 | Pays cash at the venue | `confirm-cash` → `cash_reserved` until the venue confirms `[E]` |
| SE3 | Pays by JazzCash | Blocked honestly — adapter unprovisioned `[P]` |
| SE4 | Pays by card | Stripe cannot serve PK venues — see assessment D-1 `[P]` |
| SE5 | Post-dated cheque | `pdcService`; booking confirms on clearance `[P]` |
| SE6 | Wants 3 instalments | `BookingInstallment` schedule `[E]` |
| SE7 | Misses an instalment | Reminder → grace → configurable auto-cancel `[P]` |
| SE8 | Advance not paid in 7 days | Auto-release + notify both `[N]` |
| SE9 | Cancels 100 days out | 100% refund per slab `[E]` |
| SE10 | Cancels 20 days out | 0% — **but offer transfer to a new date** `[N]` |
| SE11 | Death in the family | Force majeure → full refund or postpone `[E]` |
| SE12 | Wants to move the date, not cancel | Reschedule; advance carries; re-price if the new date is peak `[P]` |
| SE13 | New date is cheaper | Credit the difference to the balance, never refund cash `[N]` |
| SE14 | New date is dearer | Difference added to the balance `[N]` |
| SE15 | Venue cancels | 100% refund + clawback + alternatives `[E]` |
| SE16 | Venue sealed by authorities | Force majeure + relocation offer `[N]` |
| SE17 | Negotiated discount | Quotation-level discount + reason + audit `[N]` |
| SE18 | Wants the deposit back | Inspection → deduct with photos → return in 7 days `[N]` |
| SE19 | Damage dispute | `DamageClaim` with evidence, dispute path `[N]` |
| SE20 | Wants a tax invoice | PRA/SRB/FBR fiscal invoice with QR `[P]` |
| SE21 | Pays over Rs 1,000, CNIC required | Amanat Scheme capture `[N]` |
| SE22 | Overseas payer, local attendees | Diaspora payment + proxy contact `[P]` |
| SE23 | Venue wants cash off-platform | Record-mode makes this legitimate and visible `[N]` |
| SE24 | Wants the running balance | Customer ledger view `[N]` |

## SF — Calendar, capacity, conflicts

| # | Scenario | System behaviour |
|---|---|---|
| SF1 | Two bookings, same hall, same slot | Advisory lock + conflict check `[E]` |
| SF2 | Lunch + dinner same day | Slot templates + buffer `[E]` |
| SF3 | Lunch overruns past 4 PM | Turnaround rule warns/blocks `[N]` |
| SF4 | Adjacent halls, shared entrance | Contention group warns the venue `[N]` |
| SF5 | Merged halls booked, single hall requested | Merge group marks children unavailable `[E]` |
| SF6 | Decorator setup collides with the prior slot | `setupAccessMinutes` blocks it `[N]` |
| SF7 | Open lawn, rain forecast | Pre-event weather check + backup disclosure `[P]` |
| SF8 | Open lawn with no backup | Disclosed at booking, acknowledged `[N]` |
| SF9 | Guests exceed parking | Warn when `pax/3 > carParkingCapacity` `[N]` |
| SF10 | Venue blocks a date after a booking exists | Existing booking protected; block is forward-only `[E]` |
| SF11 | Venue lowers capacity after a booking | `slotTemplateSnapshotJson` protects it `[E]` |
| SF12 | Venue raises price after a booking | Snapshot protects it `[E]` |
| SF13 | Multi-day (Fri/Sat/Sun) | Umbrella + per-day lines `[P]` |
| SF14 | Rukhsati past midnight | Blocked in Punjab; disclosed `[N]` |
| SF15 | Strike / curfew on the day | Force majeure `[E]` |

## SG — Day-of & settlement

| # | Scenario | System behaviour |
|---|---|---|
| SG1 | T-7 headcount lock | Prompt; guarantee consequences shown plainly `[N]` |
| SG2 | T-3 BEO issued | Generated + sent to chef/captain/decorator `[P]` |
| SG3 | T-2 pre-event check | Weather, generator, count, contact person `[N]` |
| SG4 | Gate counting on the night | Token/register/manual entry `[N]` |
| SG5 | Actual differs from guarantee | Settlement `max(guaranteed, actual)` `[N]` |
| SG6 | Extra live counter added on the night | Added to settlement, signed by the host `[N]` |
| SG7 | Event runs 45 min over | Overtime line — **capped at the legal closing time** `[N]` |
| SG8 | Balance collected at the end | Receipt + final fiscal invoice `[P]` |
| SG9 | T+1 damage inspection | Photos, deduction, deposit return `[N]` |
| SG10 | Leftover food | Ownership per T&C, disclosed upfront `[N]` |
| SG11 | Payout to the venue | Gated on `payoutEligibleAt` `[E]` |
| SG12 | Review request | Token-auth public link `[E]` |

## SH — Failure & dispute

| # | Scenario | System behaviour |
|---|---|---|
| SH1 | Customer no-show | Guarantee bills; advance applied `[N]` |
| SH2 | Venue delivers a different hall | Dispute + evidence `[E]` |
| SH3 | Food quality complaint | Dispute + evidence `[E]` |
| SH4 | "You never told us about the generator fee" | Quote line-item history settles it `[N]` |
| SH5 | "We asked for a ladies section" | Requirements thread settles it `[N]` |
| SH6 | Guest injury | Insurance flag + T&C `[P]` |
| SH7 | Venue unreachable pre-event | Ack escalation `[P]` |
| SH8 | Double-booked by venue staff offline | Offline bookings hit the same conflict engine `[E]` |
| SH9 | Fake booking / squatting | Hold quota + captcha `[E]` |
| SH10 | Chargeback | Evidence pack from quote + receipts `[N]` |
| SH11 | Government raid mid-event (one-dish) | Compliance acknowledgement recorded pre-event `[N]` |
| SH12 | Vendor demands more on the night | Locked quote + signed BEO as the reference `[N]` |

---

# PART 7 — WHAT TO BUILD, IN ORDER

**Phase 1 — Truthful pricing (no new screens)**
1. `RateCardLine` table + migrate existing `Package`/`Menu`/`BusinessBundledService` rows into it
   *(both keep working through a view/adapter — nothing breaks)*
2. `menu.price` FLOAT → `NUMERIC(12,2)`
3. `resolveQuote()` — one resolver, replacing `pkgPrice * qty + menuPrice`
4. The `includesFood` rule → menu becomes free or priced
5. Tax + service charge + deposit on the Review step
6. Cancellation policy rendered before payment

**Phase 2 — Vendor control**
7. A4 "How do you charge?" + rate-card presets
8. A5 rate-card editor with **explicit per-head/per-event toggle**
9. Pamphlet preview + **quote simulator at A7**
10. B1–B4: slots, booking rules, money, compliance
11. Compliance hard blocks (s.3 / s.4 / s.6 / legal cap)

**Phase 3 — Flow flexibility**
12. Adaptive step engine driven by rate-card groups
13. Requirements / free-text system
14. Inquiry → Site visit → Quotation (versioned) → Booking
15. Request-to-book: accept / decline / counter
16. Per-venue bank details + receipt upload

**Phase 4 — To completion**
17. Headcount lock · 18. BEO · 19. Actual count + settlement ·
20. Deposit inspection · 21. Fiscal invoicing · 22. WhatsApp

---

## Sources

- [The Punjab Marriage Functions Act 2016](http://nasirlawsite.com/laws/pmfa2016.htm) · [Punjab Laws](http://punjablaws.gov.pk/laws/2647.html)
- [Decorium Luxury Marquee — per-head packages, deposit, headcount deadline](https://decoriumplmarquee.com/)
- [Best Marquees in Lahore: 2026 Prices & Hidden Costs](https://pakbestfinds.com/best-marquees-in-lahore/)
- [Lahore Shadi Hall / Marriage Hall rates — hall-rent-only pricing](https://lahorecafe.org/business/lahore-shadi-hall-rates-lahore-marriage-hall-rates-price-pearl-continental/)
- [Karachi Banquet Hall Price List 2025 — Evento Race](https://www.eventorace.com/blog/venues/karachi-banquet-hall-prices-2025)
- [Aiwan-e-Iqbal Complex — published hall booking rates](https://aic.gov.pk/reservation-rates/)
- [Event Venue: Rental Fee Pricing 2026 — BusinessDojo](https://dojobusiness.com/blogs/news/event-venue-pricing-guide)
- [Decoding Wedding Venue Costs — rental vs per-person vs F&B minimum](https://csevenues.com/decoding-wedding-venue-costs/)
- [All-Inclusive Wedding Venue Cost Breakdown 2026](https://villasanjuliette.com/blog/all-inclusive-wedding-venue-cost-breakdown/)
- [DAWAT — Sit-Down or Buffet for a Pakistani wedding](https://www.dawatpakistan.com/ideal-dinner-setup-for-your-wedding/)
- [Cvent — Banquet Service Ratios](https://www.cvent.com/en/blog/events/banquet-service-ratios)
- [WedMeGood — calculating your minimum guarantee](https://www.wedmegood.com/blog/quick-ways-to-calculate-your-minimum-guarantee-to-caterers/)
- [MarqSuite — PK venue software: inquiry pipeline, booking versions](https://marquee-management-qzrb.vercel.app/)
- [Sum Cloud POS — PRA eIMS, Amanat Scheme](https://sumcloudpos.com/banquet-hall-pos-software.html)
- [Tripleseat — BEO, guest portal, proposals](https://tripleseat.com/industries/wedding-venues/)
