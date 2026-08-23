# How Pakistani Wedding Venues Actually Price & Sell — Deep Research

**Date:** 2026-08-23
**Purpose:** Settle the "per plate vs package vs menu" question, and define the data model +
vendor-onboarding UI that matches how real marquee owners sell.
**Companions:** `BOOKING-FLOW-ASSESSMENT.md` (what's wrong today) ·
`VENUE-BOOKING-ARCHITECTURE.md` (registration → completion, full edge-case catalogue)

---

## PART 1 — THE ONE INSIGHT THAT RESOLVES THE CONFUSION

> **"Per plate", "per head", "per person", "per cover", and "per pax" are all the SAME thing.**
> **The MENU is what sets that per-head rate.**
> **A PACKAGE is a pre-bundled combination sold at one headline number.**
>
> **They are not two parallel choices. A package CONTAINS a menu.**

Everything below is evidence for that sentence, and what it means for the schema.

---

## PART 2 — THE THREE PRICE COMPONENTS

Every Pakistani venue quote decomposes into exactly three things. Venues differ only in **which
ones they bundle**.

### A. Venue / hall charge — FLAT per event

Charged for the room, the date, the slot. Independent of guest count.

Real examples:
- Elite Marquee, DHA Phase 8 Lahore — **PKR 300,000 flat hall charge**
- Kitchen access fee when you bring an outside caterer — **PKR 50,000–100,000**
  (DHA Phase 8: PKR 60,000–80,000)

Some venues set this to **zero** and recover it inside the per-head rate. That is a pricing
*choice*, not a different model.

### B. Food — PER HEAD (this is "per plate")

The rate is a function of **which menu tier** the customer picks.

Real examples (2026):

| Venue / caterer | Menu tier | Per head |
|---|---|---|
| Hanif Rajput (Lahore) | Menu 1 — Chicken Qorma/Karahi, Chicken Biryani/Pullao, Salad+Raita, live Naan, Sweet, Drinks, Water | **Rs 1,250** (food only) |
| Hanif Rajput (Lahore) | Menu 2 — **Mutton** Qorma/Karahi + same accompaniments | **Rs 2,250** (food only) |
| Darbar Caterers | "Choice 2" — Chicken Biryani/Pullao, Chicken Karahi, Beef Haleem, Chicken Kofta, live Chicken Wonton + sides + desserts | **Rs 871** |
| Liberty Castle (Lahore) | **mutton** dishes | **Rs 1,600** |
| Liberty Castle (Lahore) | other options | **Rs 1,200** |
| The Grand Marquee (Lahore) | with theme, DJ, lighting, catering | **Rs 1,100** |
| Luxe Marquee (Lahore) | — | **Rs 1,200** |

Note **Liberty Castle**: same hall, two rates, and the *only* difference is mutton vs chicken.
**The menu is the price.**

### C. Extras / add-ons — flat, per-head, or per-item

- Décor / stage: **PKR 100,000–600,000+** ("almost always a paid add-on, not part of base price")
- Décor packages (stage + LEDs + florals): **PKR 250,000–450,000**
- Generator / fuel surcharge (May–Sep): **PKR 40,000–120,000 per event** — "now a standard line item"
- Valet / parking: **PKR 15,000–40,000**
- Live counters (jalebi, golgappa, pan, coffee, ice cream): per head or per counter
- Photo + video: **PKR 50,000–200,000+ per day**
- Extra hours, chiller trucks (summer), crockery grade upgrade, service ratio upgrade

---

## PART 3 — WHAT A "PACKAGE" ACTUALLY IS

**A package = A + B + C pre-bundled, sold at ONE headline rate.**

That headline rate is **usually per-head**, sometimes flat.

### The definitive real-world example — Decorium Luxury Marquee, Islamabad

| Package | Rate | Guest range | Menu contents |
|---|---|---|---|
| **Rasm-e-Hina** | **From Rs 2,250 / per head** | 200–500 | 1 Main Course, Live BBQ & Chaat Stations, 2 Desserts (Live Jalebi & Suji Halwa) |
| **Standard Multi-Dish** | **From Rs 2,850 / per head** | 300–800 | Chicken Biryani/Pulao, Chicken Karahi, Reshmi Seekh Kababs, 2 Sweet Dishes |
| **Premium Multi-Dish** | **From Rs 4,050 / per head** | up to 1,200 | Mutton Qorma, Chicken Karahi, Live Beef Foil Roast, Complete Salad & Sweet Bar |

Read that table carefully. Every row is:

```
package name  +  per-head rate  +  guest range  +  a dish list
```

The dish list **IS** the menu. The package **IS** the per-head rate. They are one object, and the
per-head rate is attached to it. Decorium also throws in *"complimentary additions such as upgraded
stage lighting themes or premium bridal room refreshments"* — that is component C folded in.

### So there are exactly four selling shapes in this market

| # | Shape | How it's quoted | Example |
|---|---|---|---|
| **1** | **All-inclusive per head** (DOMINANT) | "Rs 3,500/head, everything included" | Decorium, most marquees |
| **2** | **Hall flat + food per head** | "Rs 300,000 hall + Rs 1,250/head food" | Elite Marquee + outside caterer |
| **3** | **Hall flat only** (bring your own caterer) | "Rs 300,000 + Rs 60,000 kitchen access" | Al-Hamra, Fortress Stadium |
| **4** | **Menu-only** (caterer, no venue) | "Menu 2 — Rs 2,250/head" | Hanif Rajput, Darbar |

**Your platform must support all four.** Today it supports #2 and #4 only.

---

## PART 4 — WHAT THE CODE DOES TODAY (AND WHY IT'S WRONG)

### The models

`ems-v0-backend/src/models/package.js`
```js
price:      DataTypes.DECIMAL(12,2)   // NO pricingUnit. NO minGuaranteeCount.
features:   DataTypes.JSON
images:     DataTypes.JSON            // <- images already exist
extras:     DataTypes.JSONB
capacity:   DataTypes.INTEGER
subVenueId: DataTypes.INTEGER
```

`ems-v0-backend/src/models/menu.js`
```js
price:             DataTypes.FLOAT    // <- money as FLOAT, violates PA-009
pricingUnit:       'per_event' | 'per_head'
minGuaranteeCount: INTEGER
data:              DataTypes.JSON     // { starters, mainCourse, drinks, desserts }
```

### The math

`ems-v0/components/booking/steps-v2/review-step.tsx:102-107`
```ts
const pkgPrice  = Number(selectedPackageObj?.price) || 0
const qty       = isCarRental || isBridalWear || isWeddingStationery ? vehicleQuantity : 1
const menuPrice = menuChargeFor(selectedMenuObj, formData.guestCount)
const baseTotal = pkgPrice * qty + menuPrice
```

For a **venue**, `qty === 1`. So:

```
total = packagePrice (FLAT)  +  menuPrice (per head x guests)
```

### The three problems

**Problem 1 — Shape #1 (the dominant model) is inexpressible.**
A venue selling "Gold Package Rs 3,500/head all-inclusive" has no way to say it. Their options are:
- put the rate in the **menu** (loses the package's images, features, capacity, subVenue binding), or
- set `package.price = 3500 x expectedGuests` as a flat number — which silently becomes wrong the
  moment the guest count changes.

Expect vendors to do the second one. Then a 500-guest quote gets served to a 300-guest booking.

**Problem 2 — Package + Menu double-charges.**
The flow presents **Packages** and **Menu** as two sequential steps
(`booking-form.tsx:676-679`), and the math **adds them**. A vendor who sets up
"Gold Package Rs 2,500/head (food included)" *and* a menu at Rs 1,250/head gets a customer billed
**Rs 3,750/head**. Nothing in the UI warns either party.

**Problem 3 — `menu.price` is a FLOAT.**
PA-009 migrated every money column to `NUMERIC(12,2)` specifically because "FLOAT corrupts on
aggregation". `menu.price` was missed — and it is the one value that gets multiplied by a guest
count of up to 1,200.

---

## PART 5 — THE PROPOSED MODEL

### 5.1 Make the venue declare its selling shape

Add to `Business` (venue):

```js
pricingShape: ENUM(
  'all_inclusive_per_head',  // shape 1 — package rate x guests, food included
  'hall_plus_per_head',      // shape 2 — flat hall + per-head food
  'hall_only',               // shape 3 — flat hall, outside caterer
  'menu_only'                // shape 4 — caterer, no venue
)
```

This one field drives the whole booking UI: which steps appear, whether Menu is a *price* or just a
*choice*, and what the Review breakdown looks like.

### 5.2 Give Package a pricing unit — mirror Menu exactly

```js
// Package
pricingUnit:       'per_event' | 'per_head'   // default 'per_event' = today's behaviour
minGuaranteeCount: INTEGER                    // min billable pax
includesFood:      BOOLEAN                    // <- kills the double-charge
menuId:            INTEGER                    // the menu this package bundles (nullable)
```

`includesFood = true` -> the Menu step becomes a **choice, not a charge**. The customer still picks
their dishes; the price does not move. This is exactly Decorium's model.

### 5.3 Fix the money type

```
menu.price: FLOAT -> NUMERIC(12,2)   // PA-009 parity
```

### 5.4 The corrected total

```
lineTotal =
      hallCharge                                   (flat, may be 0)
    + packageRate x billableHeads                  (if package.pricingUnit = per_head)
    + packageRate                                  (if per_event)
    + menuRate x billableHeads                     (ONLY if !package.includesFood)
    + SUM(addOns)                                  (flat / per-head / per-item)
    - discount
    = subtotal
    + serviceCharge%                               (venue-configured)
    + salesTax%                                    (PRA 8% Punjab / SRB Sindh / FBR ICT)
    = grandTotal
    + securityDeposit                              (refundable, shown separately)

billableHeads = max(guestCount, minGuaranteeCount, 1)
```

`billableHeads` already exists correctly in `lib/pricing/menu.ts` — reuse it verbatim for packages.

### 5.5 Minimum guarantee is not optional in this market

Every real venue has one. Decorium's packages carry guest ranges (200–500, 300–800, up to 1,200) —
the lower bound **is** the minimum guarantee. The booking model already has `guaranteedPax` and
`expectedPax` (Phase-1 SPINE); they just aren't wired to the customer flow.

**Final settlement rule:** `bill = max(guaranteed, actual counted on the night)`.
Decorium's term: *"Final increases in guest headcount or adjustments to the selected menu must be
officially submitted at least 7 days before the event date."*

So the booking needs a **headcount lock deadline** (`headcountLockAt`), defaulting to
`bookingDate - 7 days`.

---

## PART 6 — HOW REAL MARQUEE MENUS ARE STRUCTURED

The current `menu.data` shape is Western and too coarse:

```js
{ starters, mainCourse, drinks, desserts }
```

Real Pakistani wedding menus have these sections, roughly in service order:

| Section | Typical items |
|---|---|
| **Welcome drink** | Fresh lime, Mint margarita, Kashmiri chai |
| **Chaat / Salad bar** | Fruit chaat, Dahi bhalay, Channa chaat, Russian salad, green salad, raita |
| **Soup** | Chicken corn, Hot & sour |
| **Live BBQ** | Seekh kabab, Malai boti, Chicken tikka, Reshmi kabab, Behari boti, Fish |
| **Main course** | Chicken Karahi, Chicken/Mutton Qorma, Nihari, Haleem, Kofta, Handi |
| **Rice** | Chicken Biryani, Mutton Pulao, Kabuli Pulao |
| **Bread** | Live Naan, Roghni Naan, Kulcha, Tandoori Roti |
| **Dessert** | Kheer, Gulab Jamun, Firni, Shahi Tukray, Ice cream, **Live Jalebi**, Suji Halwa |
| **Live counters** | Jalebi, Golgappa, Pan, Coffee, Ice cream, Chinese wok |
| **Beverages** | Soft drinks, Mineral water, Green tea / Kehwa |

### The one-dish law changes the shape of the builder

Punjab / ICT restrict a wedding to **one main course + one dessert**. Enforcement is live: a series
of late-night raids in **May 2026** sealed several high-profile Islamabad marquees, with heavy fines
and hall managers arrested.

Venues route around it by reclassifying dishes as "salad" or "snacks" — which is precisely why the
menu builder needs **explicit sections**. The compliance checker can then count only
`mainCourse.length` and `dessert.length`, and warn the vendor at build time rather than warning the
customer at booking time.

The system already has `oneDishPolicy` on `businessModel` and surfaces it as an advisory warning in
`date-time-step.tsx`. Push it **upstream into the menu builder**.

### Per-item fields the builder needs

```js
{
  section: 'main_course',
  name: 'Mutton Qorma',
  nameUrdu: 'مٹن قورمہ',        // optional, real vendors want it
  isLive: false,                  // live counter / live cooking
  countsAsMainDish: true,         // one-dish law arithmetic
  supplementPerHead: 0,           // e.g. +Rs 400/head to swap chicken -> mutton
  image: null
}
```

`supplementPerHead` is how Liberty Castle's "Rs 1,600 mutton / Rs 1,200 other" is expressed as
**one menu with a swap**, instead of two duplicate menus.

---

## PART 7 — THE VENDOR-SIDE "PAMPHLET" VIEW

The request: when a venue owner builds a package or a menu, they should see a **visual pamphlet
preview** — because that is the artefact they actually hand to customers today (a printed
card / WhatsApp image).

This is the right instinct, and it is also the **cheapest correctness mechanism you have**: a vendor
who can see their package rendered as a pamphlet will notice "Rs 3,500 per event" when they meant
"per head".

### Package pamphlet — what it must render

```
+------------------------------------------+
|  [ hero image from package.images ]      |
|                                          |
|  GOLD PACKAGE                            |
|  Rs 3,500 / per head          <- unit!   |
|  200 – 800 guests                        |
|                                          |
|  INCLUDES                                |
|   - Hall + AC + generator backup         |
|   - Standard stage & décor               |
|   - Bridal room                          |
|   - Valet parking                        |
|                                          |
|  MENU (included)                         |
|   Main:    Chicken Karahi                |
|   Rice:    Chicken Biryani               |
|   BBQ:     Reshmi Seekh Kabab (live)     |
|   Dessert: Gulab Jamun                   |
|                                          |
|  NOT INCLUDED                            |
|   - Décor upgrade   from Rs 250,000      |
|   - Generator surcharge (May–Sep)        |
|                                          |
|  Advance Rs 100,000 · non-refundable     |
|  + 8% PST                                |
+------------------------------------------+
```

`package.images` (JSON) and `package.features` (JSON) already exist. `package.extras` (JSONB) can
carry the "not included" list. The missing pieces are `pricingUnit`, `minGuaranteeCount`,
`includesFood`, and the renderer itself.

### Menu pamphlet — what it must render

Two-column card, sections in service order, live items badged, per-head rate large at the top,
one-dish compliance badge (green "compliant" / amber "2 main dishes — may violate Punjab one-dish
rule").

### Where it belongs

- **Vendor dashboard** — live preview beside the form while editing (`components/dashboard/mainScreens/businessSettings/`)
- **Customer package step** — the same component, read-only
- **Shareable image** — render to PNG for WhatsApp. This is how vendors will actually distribute it,
  and it is a genuine acquisition loop.

Build it **once** as a shared component and use it in all three places, so the vendor's preview and
the customer's view can never disagree.

---

## PART 8 — HOW THE COMPETITION TAKES BOOKINGS

| Platform | Model | Booking mechanism |
|---|---|---|
| **Shadiyana.pk** | Marketplace, 600+ verified vendors, 500k+ app downloads | "Check availability", talk to venue managers, advance deposit + balance before event; **refund terms per venue** |
| **Hamara Venue** | Directory + venue software | *"Confirm Availability Via Call"* — **no online booking at all**. Call / WhatsApp. |
| **EventsBooking.pk** | Directory, flat prices | Confirmation *"via email or WhatsApp once payment received"* |
| **Shadibox.com** | — | **Dead. Domain parked for sale.** |
| **Shadikart** | Vendor promotion only | Contact vendor for inquiry/booking |
| **MarqSuite** | Venue back-office (PK) | **Inquiries pipeline -> convert to Booking.** Collections in cash / bank / **JazzCash / Easypaisa / cheque** |
| **Sum Cloud POS** | Venue POS, PRA eIMS integrated | Advance + multiple instalments, final settlement invoice on event day, PRA fiscal invoice per receipt |
| **iTech / Nizi / SolutionsPlayer** | Venue back-office | Per head / per item / per serving menus, tentative vs confirmed bookings |

### The pattern

**Every Pakistani venue booking product is either a directory that hands off to a phone call, or a
back-office that records what the venue already agreed offline. Not one takes a card payment to
lock a date.** The one that tried the marketplace model (Shadibox) is a parked domain.

MarqSuite's booking record is instructive — it is exactly the shape this codebase needs:

> *"line items, venue rent, packages, discounts, guest count, event type, balance due, versions,
> and printable documents"*

Note **versions** and **printable documents**. A Pakistani venue booking is a **negotiated document
that gets revised**, not a transaction that gets confirmed. `orderStage` and `orderTotalsJson` in
`bookingModel.js` are already reaching for this.

---

## PART 9 — TAX & COMPLIANCE FACTS

| Item | Detail |
|---|---|
| **Punjab (PRA)** | Marriage halls, marquees, catering, event management raised **5% -> 8%** |
| **PRA registration threshold** | Rs 6M+ annual revenue |
| **PRA eIMS** | **Real-time fiscal invoice on every advance AND final payment**; QR code on invoice; monthly return |
| **Amanat Scheme** | CNIC capture on payments over **Rs 1,000** |
| **Federal GST** | Budget 2025-26 revised to **18%** on commercial event services (reported) |
| **Sindh (SRB)** | Separate regime and rate |
| **ICT / Islamabad** | Federal; FBR POS integration |
| **One-dish rule** | 1 main course + 1 dessert (Punjab, ICT). **Enforced** — May 2026 raids, marquees sealed, managers arrested |
| **Event curfew** | Weddings banned after **10pm** in Islamabad; Karachi venues commonly "vacate by 12:00 AM" |
| **Loudspeaker rules** | Dec 2025 Punjab crackdown alongside one-dish |

**Implication:** a platform that collects the advance inherits the PRA e-invoicing obligation for
that advance. A platform that only *records* an advance the venue collected does not.
That is a second, very concrete reason to settle the Part 5 question in `BOOKING-FLOW-ASSESSMENT.md`.

---

## PART 10 — SEASON, LEAD TIME, DEPOSITS

| | |
|---|---|
| **Peak season** | Oct–Jan. Book **8–12 months** ahead |
| **Shoulder** | 4–6 months |
| **Off-peak** | May–Aug, 2–3 months, **highest negotiation leverage** |
| **Typical advance** | **50%** at booking is the common figure; fixed-amount advances (Rs 50,000 / Rs 100,000) also common |
| **Advance timing** | Often within 7 days of booking |
| **Balance due** | 3 days to 2 weeks before the event |
| **Refundability** | Usually **non-refundable**; some partial |
| **2026 inflation** | Prices up **30–40% vs 2024** (food, fuel, labour) |
| **Day-of-week** | Thursday walima vs Saturday can save **PKR 5–8 lakh** on 600 guests |

`businessSeasonalPricing` and `dayOfWeek` pricing already exist in the schema — this is the demand
signal that justifies wiring them into the customer quote.

---

## PART 11 — RECOMMENDED SEQUENCE

1. **Add `Package.pricingUnit` + `minGuaranteeCount` + `includesFood`.** Default
   `per_event` / `null` / `false` so every existing package behaves byte-identically. Unblocks the
   dominant selling shape.
2. **Migrate `menu.price` FLOAT -> NUMERIC(12,2).** PA-009 parity.
3. **Gate the Menu step on `!package.includesFood`.** Kills the double-charge.
4. **Build the shared pamphlet renderer.** Vendor preview + customer view + PNG export.
5. **Rebuild the menu builder around real PK sections** with `countsAsMainDish` and
   `supplementPerHead`; move the one-dish check into it.
6. **Add tax + service charge + security deposit to the Review breakdown.** Even reading
   "+ 8% PST (Rs 24,000)" changes the dispute rate.
7. **Show the cancellation policy on the Review step**, from the snapshot that is already captured.
8. **Add the Inquiry -> Quotation -> Booking pipeline** and let venues choose instant-book vs
   request-to-book per listing.
9. **Fix the bank-transfer screen** — real per-venue account details, in-app receipt upload,
   remove the hardcoded IBAN.
10. **`headcountLockAt`**, default `bookingDate - 7 days`, and final settlement on
    `max(guaranteed, actual)`.

---

## PART 12 — PLAIN-LANGUAGE SUMMARY (the answer to "I am really confused")

This section restates Parts 1–7 in the shortest possible form. If you read nothing else, read this.

### 12.1 The one sentence

> **"Per plate" = "per head" = "per person" = "per pax" = "per cover". Same word.**
> **The MENU is what sets that per-head rate.**
> **A PACKAGE is a pre-bundled combination sold at one headline number.**
> **They are NOT two parallel choices — a package CONTAINS a menu.**

### 12.2 The proof, in two examples

**Liberty Castle, Lahore** — same hall, two rates:

- Rs 1,600 / head — mutton dishes
- Rs 1,200 / head — other options

Nothing changed but the food. **The menu is the price.**

**Decorium Marquee, Islamabad** — three "packages":

| Package | Rate | Guests | What is in it |
|---|---|---|---|
| Rasm-e-Hina | **Rs 2,250 / per head** | 200–500 | 1 main course, live BBQ & chaat, 2 desserts (live jalebi, suji halwa) |
| Standard | **Rs 2,850 / per head** | 300–800 | Chicken biryani, chicken karahi, reshmi seekh, 2 sweets |
| Premium | **Rs 4,050 / per head** | up to 1,200 | Mutton qorma, chicken karahi, live beef foil roast, full salad & sweet bar |

Every row is `package name + per-head rate + guest range + a dish list`. The dish list **is** the
menu. The package **is** the per-head rate. One object, not two.

### 12.3 So — "if a user wants per plate, do we show the package AND the menu?"

**It depends on one flag, and only one:** does the package include food?

| Situation | Show Package step? | Show Menu step? | Does the menu add to the price? |
|---|---|---|---|
| Package is all-inclusive per head (`includesFood = true`) | Yes | Yes — **as a choice** | **NO.** Price already includes it. Customer is just picking dishes. |
| Package is hall/venue only (`includesFood = false`) | Yes | Yes — **as a charge** | **YES.** `menuRate x billableHeads` is added. |
| Venue sells hall only, outside caterer | Yes (hall) | No | n/a — customer brings their own caterer |
| Caterer with no venue | No | Yes — **as a charge** | **YES** |

That is the whole answer. One boolean on `Package` removes the ambiguity permanently.

### 12.4 "And what if he selects a package?"

If the package's `pricingUnit = 'per_head'`:

```
packageRate x max(guestCount, package.minGuaranteeCount, 1)
```

If `pricingUnit = 'per_event'` (a flat hall charge):

```
packageRate            // guest count does not touch it
```

Then, and only then, if `includesFood = false`, add the menu on top.

### 12.5 What the code does today, and why it is wrong

`components/booking/steps-v2/review-step.tsx:102-107`

```ts
const pkgPrice  = Number(selectedPackageObj?.price) || 0
const qty       = isCarRental || isBridalWear || isWeddingStationery ? vehicleQuantity : 1
const menuPrice = menuChargeFor(selectedMenuObj, formData.guestCount)
const baseTotal = pkgPrice * qty + menuPrice
```

For a venue `qty === 1`, and `Package` has **no `pricingUnit`** (only `Menu` has one). So today:

```
total = package price (FLAT, per event)  +  menu price (per head x guests)
```

**Consequence 1 — the dominant Pakistani model cannot be entered at all.**
A venue selling "Gold Package Rs 3,500/head all-inclusive" has no field for it. They will either
bury the rate in the menu (losing the package's images, features, capacity, sub-venue binding), or
type `package.price = 3500 x 500 = 1,750,000` as a flat number — which becomes wrong the moment the
guest count changes.

**Consequence 2 — Package + Menu silently double-charges.**
The flow shows **Packages** then **Menu** as separate sequential steps
(`booking-form.tsx:676-679`) and the math **adds them**. A vendor who configures
"Gold Package Rs 2,500/head (food included)" *and* a Rs 1,250/head menu produces a customer bill of
**Rs 3,750/head**. Nothing in the UI warns the vendor or the customer.

**Consequence 3 — `menu.price` is `DataTypes.FLOAT`.**
PA-009 migrated every money column to `NUMERIC(12,2)` because "FLOAT corrupts on aggregation".
This one was missed, and it is the single value multiplied by a head count of up to 1,200.

### 12.6 The minimal fix

Give `Package` the three fields `Menu` already has:

```js
pricingUnit:       'per_event' | 'per_head'   // default 'per_event' = today's behaviour, zero risk
minGuaranteeCount: INTEGER
includesFood:      BOOLEAN                    // <- this one kills the double-charge
```

When `includesFood = true`, the Menu step becomes a **choice, not a charge**: the customer still
picks their dishes, the price does not move. That is exactly the Decorium model.

Then add `Business.pricingShape` so the UI knows which of the four real selling shapes this venue
uses (see Part 3), and which steps to render.

### 12.7 Why the pamphlet preview is a correctness feature, not decoration

`package.images` (JSON) and `package.features` (JSON) **already exist on the model** and are never
rendered as a preview.

A vendor who sees their package rendered as a card will **immediately** catch "Rs 3,500 per event"
when they meant "per head". Right now there is no surface where that mistake becomes visible before
a customer is billed by it.

Build it once, use it in three places:

1. **Vendor dashboard** — live preview beside the form while editing
2. **Customer package step** — the same component, read-only
3. **PNG export for WhatsApp** — how vendors actually distribute these today, and a free
   acquisition loop

Because it is one component, the vendor's preview and the customer's view can never disagree.

### 12.8 Why the menu builder needs rebuilding

Current `menu.data` shape:

```js
{ starters, mainCourse, drinks, desserts }
```

Too Western, too coarse. Real Pakistani wedding menus run in this service order:

```
welcome drink -> chaat / salad bar -> soup -> LIVE BBQ -> main course
  -> rice -> LIVE naan -> dessert -> LIVE counters (jalebi, golgappa, pan) -> beverages
```

And each item needs `countsAsMainDish` so the **one-dish check runs inside the builder** — warning
the vendor while they build, instead of warning the customer at booking time. Enforcement is real:
May 2026 raids sealed Islamabad marquees, with fines and hall managers arrested.

`supplementPerHead` on an item is how Liberty Castle's "Rs 1,600 mutton / Rs 1,200 other" becomes
**one menu with a swap** rather than two near-duplicate menus.

---

### 12.9 A real visit to a marquee (drop the jargon)

Ali needs a Barat for 500 guests in December. He visits a marquee in Johar Town. The manager slides
a **printed card** across the table:

```
GOLD          Rs 2,500 per head
  Chicken Karahi, Chicken Biryani, Seekh Kabab (live),
  Salad, Raita, Live Naan, Gulab Jamun, Soft Drinks
  Hall + AC + generator + basic stage + bridal room

PLATINUM      Rs 3,800 per head
  Mutton Qorma, Chicken Karahi, Beef Foil Roast (live),
  Chicken Biryani, Chaat counter, Live Jalebi + Ice cream
  Hall + AC + generator + upgraded stage + bridal room + valet
```

Ali points at Gold. Manager writes `500 x 2,500 = Rs 12,50,000`. Advance Rs 2,00,000. Done.

**Ali made ONE choice.** He did not pick a package and then separately pick a menu.

**A "package" is just a row on that card.** Three things stuck together:

- a **name** (Gold)
- a **rate** (Rs 2,500 per head)
- a **list of what you get** (dishes + hall facilities)

That list of dishes **is the menu**. It lives *inside* the package. It is not a second purchase.

So asking the customer to "pick a Package" and then "pick a Menu" is, in Ali's world, asking him to
choose Gold and then choose the food again. There is no second choice — Gold already said the food.

### 12.10 The one case where there genuinely ARE two things

Some venues do no food at all. They rent the hall; you bring Hanif Rajput:

```
Hall charge:        Rs 3,00,000   (flat — same for 200 or 800 guests)
Kitchen access fee: Rs   60,000   (flat)
Caterer's Menu 2:   Rs 2,250/head x 500  =  Rs 11,25,000
```

Two things — but they are **"hall rent" and "food"**, from **two different businesses**.
Not "package" and "menu".

### 12.11 What breaks today — with real numbers

`review-step.tsx:107` — `const baseTotal = pkgPrice * qty + menuPrice`  (`qty = 1` for venues)

The Johar Town owner registers. He sees a "Packages" form and a "Menu" form, so he fills in both.

**Way 1 — he types the per-head rate into both fields:**

```
Package "Gold — Rs 2,500":   2,500 x 1     =  Rs      2,500   <- treated as FLAT
Menu    "Gold — Rs 2,500/head": 2,500 x 500 =  Rs 12,50,000
TOTAL                                       =  Rs 12,52,500
```

Ali is overcharged Rs 2,500. Annoying, survivable.

**Way 2 — he pre-multiplies the package because there is no per-head option:**

```
Package "Gold" (2,500 x 500 typed as flat): 12,50,000 x 1  =  Rs 12,50,000
Menu    "Gold — Rs 2,500/head":              2,500 x 500   =  Rs 12,50,000
TOTAL                                                      =  Rs 25,00,000
```

**Exactly double.** And when Ali later drops to 300 guests, the package half stays frozen at
Rs 12,50,000, because the model has no idea it was ever per-head.

This is not hypothetical. It is what happens the first week a real marquee signs up.

**Root cause:** `package.js` has `price` and nothing else. `menu.js` has `price` **and**
`pricingUnit`. So the code assumes a package is always flat — true only for the hall-rent case,
false for how most marquees actually sell.

### 12.12 What the vendor should be asked at registration

One question, before any package or menu form appears:

```
How do you charge?

  ( ) Everything included, one rate per head
      e.g. Rs 2,500/head — food + hall together

  ( ) Hall charge separate, food per head
      e.g. Rs 3,00,000 hall + Rs 1,250/head food

  ( ) Hall only — customers bring their own caterer

  ( ) I'm a caterer, I don't have a hall
```

This is `Business.pricingShape`. It decides which steps the customer sees and whether the menu
carries a price.

**If he picked option 1** (most marquees) the customer flow is:

```
Step: Choose your package
  +--------------------------+  +--------------------------+
  |  GOLD                    |  |  PLATINUM                |
  |  Rs 2,500 /head          |  |  Rs 3,800 /head          |
  |  ---------------------   |  |  ---------------------   |
  |  Chicken Karahi          |  |  Mutton Qorma            |
  |  Chicken Biryani         |  |  Chicken Karahi          |
  |  Seekh Kabab (live)      |  |  Beef Foil Roast (live)  |
  |  Gulab Jamun             |  |  Live Jalebi + Ice cream |
  |  ---------------------   |  |  ---------------------   |
  |  500 guests = 12,50,000  |  |  500 guests = 19,00,000  |
  +--------------------------+  +--------------------------+

Step: Customise your menu     <- choices only, price does NOT move
Step: Review
```

**If he picked option 2:**

```
Step: Hall          -> Main Hall, Rs 3,00,000 flat
Step: Choose menu   -> Menu 1 Rs 1,250/head  |  Menu 2 Rs 2,250/head (mutton)
Step: Review        -> 3,00,000 + (1,250 x 500) = Rs 9,25,000
```

Same screens that already exist. What changes is **which appear, and whether the menu adds money.**

### 12.13 "If I choose a package, do I still need the menu step?" — the precise answer

**You do not charge for a menu again. But do not delete the step.** There are three outcomes:

**Outcome 1 — package includes food -> menu step stays, and it is FREE.**

Ali picked Gold (food included). He still must tell the venue *which* dishes. Real marquees offer
choices inside a tier:

```
Gold includes 1 main course - pick one:
  ( ) Chicken Karahi   ( ) Chicken Qorma   ( ) Chicken Handi

Gold includes 1 dessert - pick one:
  ( ) Gulab Jamun      ( ) Kheer           ( ) Ice cream
```

Price does not move. It is a **choice, not a charge**. Label the step
**"Customise your menu"**, not "Menu".

**Outcome 2 — package includes food, customer wants an upgrade -> charge only the DIFFERENCE.**

Very common. Gold has chicken; Ali wants mutton:

```
Main course:  Chicken Karahi            (included)
Upgrade to:   Mutton Qorma   +Rs 400/head   ->  +Rs 2,00,000
```

That is the `supplementPerHead` field from Part 6 — **not** a second full menu price, just the
delta. This is precisely how Liberty Castle's "Rs 1,600 mutton / Rs 1,200 other" should be modelled:
one menu with a swap, not two near-duplicate menus.

**Outcome 3 — package is hall-only -> menu step charges in full.**

Rs 3,00,000 hall + Menu 2 at Rs 2,250/head. Two real purchases, both add up.

| Package type | Show menu step? | Does it add money? |
|---|---|---|
| Includes food | **Yes** — as choices | **No** (except upgrades) |
| Hall / venue only | **Yes** | **Yes, in full** |

**The step almost always shows. What changes is whether it adds to the total** — and that is exactly
what the `includesFood` boolean controls.

**Why keeping the step matters:** if you delete it when food is included, the kitchen has no idea
what to cook. The booking says "Gold Package, 500 guests" and the chef still has to phone Ali to ask
chicken or mutton — pushing the work back to WhatsApp, which is the thing this platform exists to
replace.

---

## PART 13 — OPEN DECISIONS (discussion log)

Nothing below is decided yet. Recorded so it is not lost between sessions.

### RESOLVED — "If I pick a package, do I still need the menu step?"

**Yes, keep the step. No, it does not charge again** (unless the package is hall-only, or the
customer takes a paid upgrade). Full reasoning and the three outcomes in **12.13**.
Controlled by one boolean: `Package.includesFood`.

### D-1. Does the platform COLLECT the advance, or RECORD one the venue collected?

The largest fork. Everything else sits downstream of it.

- **Collect** -> needs a working PK payment rail (Stripe cannot serve PK venues), and the platform
  inherits the **PRA e-invoicing obligation** on that advance (real-time fiscal invoice, QR, CNIC
  capture over Rs 1,000).
- **Record** -> no gateway needed, matches every surviving PK competitor, and "Confirmed" comes to
  mean "venue marked the advance received".

Note: the one PK platform that tried the collect-the-payment marketplace model (**Shadibox.com**)
is now a **parked domain for sale**.

### D-2. Instant-book vs request-to-book — per listing?

Expectation: venues will want **request-to-book for peak dates** (Oct–Jan, booked 8–12 months out)
and **instant-book for off-season weekdays** (May–Aug), where they have the least leverage and the
most empty slots.

### D-3. Is the customer-facing quote all-in, or explicitly "starting from"?

If all-in, the Review step needs service charge + PST/GST + security deposit + surcharges.
If "starting from", the Review step must **say so in words** — because a quoted Rs 3,500/head
becoming ~Rs 4,230/head after GST and service charge is **PKR 365,000** on 500 guests, and that is
the number that produces the dispute.

### D-4. Build order — which first?

1. Migration + wiring for `Package.pricingUnit` / `minGuaranteeCount` / `includesFood`
   (additive, defaults to current behaviour, low risk), **or**
2. The shared pamphlet component (package + menu + PNG export), **or**
3. Settle D-1 first, since it redefines what "Confirmed" means.

### D-5. Awaiting input

Real menu examples from actual PK venue owners — needed to fix the section vocabulary and the item
fields before the builder is designed. Requested; not yet received.

---

## Sources

- [Decorium Luxury Marquee, Islamabad](https://decoriumplmarquee.com/) — package/menu/per-head structure, deposit and headcount terms
- [Best Marquees in Lahore: 2026 Prices & Hidden Costs Guide](https://pakbestfinds.com/best-marquees-in-lahore/) — hidden costs, GST, generator surcharge, kitchen access fee, lead times
- [Hanif Rajput Caterers — Lahore Menu](https://hanifrajputcaterers.com/hanif-rajput-lahore-menu/) — Menu 1 / Menu 2 per-head tiers
- [Darbar Caterers — Menu](https://www.darbarcater.com/menu.html) — "Choice 2" per-head menu
- [Arranging a wedding in Pakistan 2025 — Neemopani](https://neemopani.com/arranging-a-wedding-in-pakistan-2025/) — booking sequence, décor/photo costs, negotiation levers
- [MarqSuite — Venue booking software, Pakistan](https://marquee-management-qzrb.vercel.app/) — inquiry pipeline, booking record shape, payment rails
- [Sum Cloud POS — Banquet Hall POS Software](https://sumcloudpos.com/banquet-hall-pos-software.html) — PRA eIMS, instalments, hall/area model
- [iTech Marquee / Banquet Management System](https://banquetsoftware.pk/) — per head / per item / per serving menus
- [Hamara Venue — Elite Marquee Lahore](https://hamaravenue.com/elite-marquee/dha-phase-8-ex-park-view-block-f-gate-lahore/wedding-marquee) — flat hall charge, call-to-confirm
- [Shadiyana — Wedding Venues Pakistan](https://www.shadiyana.pk/list/wedding-venues) — marketplace model
- [EventsBooking.pk](https://www.eventsbooking.pk/) — flat pricing, WhatsApp confirmation
- [One-Dish Policy: Islamabad Wedding Hall Crackdown 2026](https://www.pakistantruth.com/one-dish-policy/) — May 2026 raids
- [One-dish menu permitted; wedding ceremony after 10pm banned in Islamabad — Business Recorder](https://www.brecorder.com/news/40178872/one-dish-menu-permitted-wedding-ceremony-after-10pm-banned-in-islamabad)
- [Food packages served despite one-dish policy — DAWN](https://www.dawn.com/news/1719497)
- [Maryam Nawaz cracks down on loudspeakers, one-dish rule](https://asiasamachar.com/2025/12/08/maryam-nawaz-cracks-down-on-loudspeakers-one-dish-rule-for-weddings/)
- [Punjab Sales Tax on Services rates 2026-27](https://conseric.pk/punjab-sales-tax-on-services/)
- [Marriage halls, marquees allowed to pay ST at 5 percent in Punjab — Business Recorder](https://fp.brecorder.com/2019/09/20190908516324/)
- [Best Wedding Menu ideas in Pakistan — Cuisine.com.pk](https://cuisine.com.pk/wedding-menu/)
