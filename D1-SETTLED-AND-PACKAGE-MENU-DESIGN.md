# D-1 Settled · Package & Menu Builder · Detail Page Design

**Date:** 2026-08-23
**Companions:** `BOOKING-FLOW-ASSESSMENT.md` · `PK-VENUE-PRICING-RESEARCH.md` ·
`VENUE-BOOKING-ARCHITECTURE.md` · `VENDOR-REGISTRATION-AND-SCENARIOS.md` ·
`BOOKING-USE-CASES.md` · `VENDOR-PORTAL-AND-SETTINGS-REGISTRY.md`

---

# PART 1 — D-1: SETTLED

## 1.1 The decision

> **The platform RECORDS the advance. The venue collects it.**
> **Where money does move through the platform, it moves through a licensed PSP and settles
> DIRECTLY to the venue. The platform never holds venue money.**

This is not a preference. It is what the regulation permits.

## 1.2 Why — the regulatory basis

Pakistan's payments regime is the **Payment Systems and Electronic Fund Transfers Act 2007 (PEFTA)**
plus the SBP's **PSO/PSP Rules**. Three findings settle it:

| Finding | Consequence |
|---|---|
| **"A PSO/PSP cannot act as a custodian of a consumer's money or perform any banking functions."** | A marketplace that collects an advance and *holds* it until after the event is acting as custodian. Not permitted. |
| **Escrow for domestic e-commerce is permitted to EMIs** (Electronic Money Institutions), not to marketplaces or PSPs generally. | "Platform holds the advance in escrow, releases after the event" requires an **EMI licence**. |
| **PSO/PSP licence requires Rs 200,000,000 paid-up capital**, company registered under the Companies Act 2017. | Not a realistic path for this product at this stage. |

**So the model I sketched earlier — platform collects the advance, holds it against
`payoutEligibleAt`, releases post-event — is not legally available.** `payoutEligibleAt` is
excellent engineering pointed at a structure the platform can't lawfully operate.

There is a second, independent reason: **PRA eIMS**. A venue above Rs 6M/yr must issue a real-time
fiscal invoice with QR on **every advance and every final payment**. If the platform is the collector,
the platform sits inside that obligation for every venue on it. Recording keeps the obligation where
it belongs — with the venue, which already has it.

And a third, commercial one: **no surviving Pakistani platform takes a card to lock a date.**
Directories hand off to a phone call; back-office tools record what was agreed offline. The one that
tried the collect-and-hold marketplace model, Shadibox.com, is a parked domain.

## 1.3 The three payment modes that result

```
MODE 1 — RECORD           (default, ships now, no gateway needed)
  Customer pays the venue directly: cash, bank transfer, JazzCash, cheque.
  Customer uploads proof; venue confirms receipt; booking -> CONFIRMED.
  Platform revenue: VenueOS subscription + optional lead fee.

MODE 2 — COLLECT-AND-FORWARD   (opt-in, once a PSP is provisioned)
  Customer pays through a licensed PSP (PayFast / Safepay / AssanPay / PayPro).
  Funds settle DIRECT TO THE VENUE'S account, T+1. Platform never holds them.
  Platform commission is deducted by the PSP at source, or invoiced separately.

MODE 3 — PLATFORM FEE ONLY     (available immediately, low risk)
  The platform collects only its OWN fee for its OWN service — a booking fee or
  lead fee. That is the platform's revenue, not custody of anyone else's money.
  The venue's advance still flows venue-direct under Mode 1.
```

**Ship Mode 1. Add Mode 3 when there is a fee to charge. Add Mode 2 only when a PSP relationship
with direct-to-merchant settlement exists.**

## 1.4 What this settles immediately

| Question | Answer |
|---|---|
| Stripe? | **Drop it from the venue flow.** It cannot onboard Pakistani venues. Keep the code; stop defaulting to it. |
| The hardcoded placeholder IBAN? | **Delete now.** It is a live hazard on every booking over Rs 999,999. |
| Whose bank details does the customer see? | **The venue's** — surface `VendorBankDetails`, which already exists, complete, with PK IBAN validation. |
| Bank transfer only above Rs 999,999? | **Remove the threshold.** Bank transfer becomes a first-class rail at every amount. |
| When does a booking become CONFIRMED? | When the **venue marks the advance received** — not when a gateway returns success. |
| `payoutEligibleAt`? | **Keep it.** It becomes the gate for *platform-fee* settlement and for dispute windows, not for holding venue money. |
| Does this block Phase 1? | **No.** The booking architecture is identical either way. Only *who marks the payment received* differs. |

## 1.5 The payment step, rebuilt

```
SECURE YOUR DATE                                    Rs 4,98,818

  Gulshan Marquee collects this advance directly.
  WeddingWala records it and holds your date.

┌ Bank transfer ─────────────────────────── recommended ─┐
│  Account title  GULSHAN MARQUEE (PVT) LTD              │
│  Bank           Meezan Bank, DHA Phase 5               │
│  IBAN           PK24MEZN0002345678901002      [copy]   │
│  Reference      BK-48219   <- include this   [copy]    │
│                                                        │
│  [ I've transferred — upload receipt ]                 │
│  Gulshan confirms within 2–4 working hours.            │
└────────────────────────────────────────────────────────┘

┌ Cash at the venue ─────────────────────────────────────┐
│  Reserve now, pay in person. Your date is held 7 days. │
│  [ Reserve — I'll pay cash ]                           │
└────────────────────────────────────────────────────────┘

  JazzCash / Easypaisa — coming soon
  Cheque — accepted by this venue, contact them directly
```

Honest, legal, and it works on the day it ships. Notice what it does **not** say: it never claims
the platform is holding the money, because it isn't.

## 1.6 Consequences to carry into every other doc

- `BOOKING-FLOW-ASSESSMENT.md` P0 "the money rail doesn't exist" → **resolved by not needing one.**
- Auto-confirm on payment → replaced by **venue confirms receipt**, which also fixes the
  auto-confirm problem (P0 #2) at the same time.
- The customer's protection now comes from **request-to-book + venue acceptance + the recorded
  quote + the dispute path**, not from the platform holding funds.
- `VendorBankDetails` moves from payout-only to **customer-facing**. Add a `showToCustomers`
  flag and a verification state, since it will now be displayed publicly on a booking.

---

# PART 2 — THE PACKAGE BUILDER (vendor side)

Design goals, in priority order: **1) impossible to misconfigure · 2) fast to duplicate ·
3) organised as the vendor already thinks · 4) always previewed.**

## 2.1 Layout — split view, preview always visible

```
┌───────────────── RATE CARD ─────────────────┬──── LIVE PREVIEW ────┐
│                                             │                      │
│  MAIN OFFERINGS            [+ Add]  [⇅]     │  ┌────────────────┐  │
│  ┌ ● Gold          Rs 2,500 /head  ⋮ ┐      │  │ [hero image]   │  │
│  ┌   Platinum      Rs 3,800 /head  ⋮ ┐      │  │                │  │
│  ┌   Corporate     Rs 4,00,000 flat ⋮ ┐     │  │ GOLD           │  │
│                                             │  │ Rs 2,500/head  │  │
│  CATERING                  [+ Add]          │  │ 200–800·Buffet │  │
│  ┌   (none — food is inside packages)  ┐    │  │                │  │
│                                             │  │ INCLUDES       │  │
│  ADD-ONS                   [+ Add]          │  │  Hall + AC     │  │
│  ┌   Décor upgrade  Rs 2,50,000  ⋮ ┐        │  │  Generator     │  │
│  ┌   Valet          Rs 25,000    ⋮ ┐        │  │  Bridal room   │  │
│                                             │  │                │  │
│  SURCHARGES                [+ Add]          │  │ MENU           │  │
│  ┌   Peak Dec      +15%          ⋮ ┐        │  │  Chicken Karahi│  │
│  ┌   Generator     Rs 80,000 May–Sep ⋮ ┐    │  │  Biryani       │  │
│                                             │  │  Gulab Jamun   │  │
│  TAXES & DEPOSITS          [+ Add]          │  │ ✓ one-dish ok  │  │
│  ┌   Punjab PST    8%            ⋮ ┐        │  │                │  │
│  ┌   Security dep. Rs 1,00,000   ⋮ ┐        │  │ NOT INCLUDED   │  │
│                                             │  │  Décor upgrade │  │
├─────────────────────────────────────────────┤  └────────────────┘  │
│  SIMULATE  [300] guests [19 Dec] [Dinner]   │                      │
│  Gold  = Rs 9,78,075    Platinum = 14,86,674│  [ 📱 WhatsApp PNG ] │
└─────────────────────────────────────────────┴──────────────────────┘
```

**Groups are collapsible and reorderable.** A hall-only venue sees CATERING empty, and that emptiness
is *informative* — it is exactly why their customers won't see a menu step.

## 2.2 The package editor — the anti-misconfiguration screen

```
GOLD                                     [ Duplicate ] [ Archive ]

PRICE ─────────────────────────────────────────────────────────
  Rs [ 2,500 ]   per  (•) head  ( ) event
                      ─────────────────────
                      ⓘ Per head × your guest count.
                        300 guests = Rs 7,50,000
                        500 guests = Rs 12,50,000     <- live, always visible

  Guests           min [ 200 ]  max [ 800 ]
  Bill at least    [ 200 ] guests even if fewer attend
  Service style    (•) Buffet  ( ) Sit-down  ( ) Hi-tea
                   ⓘ Main Hall seats 800 buffet, 600 sit-down.

FOOD ──────────────────────────────────────────────────────────
  Is food included in this price?   (•) Yes   ( ) No

  ⓘ Because food is included, customers will still choose their
    dishes — but they won't be charged twice. Turn this OFF only
    if this price is for the hall alone.        <- the whole confusion, answered inline

  Menu   ( ) Use existing  (•) Build for this package  [ Open builder → ]

INCLUDED ─────────────────────────────────────────────────────
  [x] Hall + AC   [x] Generator   [x] Bridal room   [x] Valet
  [x] Basic stage & décor         [ + add your own ]

NOT INCLUDED  (prevents most arguments) ──────────────────────
  [x] Décor upgrade  [x] Photography  [x] DJ  [ + add ]

WHEN IT APPLIES  (optional) ──────────────────────────────────
  Event types  [ Barat ×] [ Walima ×] [ + ]     empty = all
  Sittings     [ Dinner ×]                       empty = all
  Halls        [ Main Hall ×]                    empty = all
  Dates        [        ] to [        ]          empty = always

PHOTOS ───────────────────────────────────────────────────────
  [ + upload ]   drag to reorder · first is the hero
```

**Six devices that make misconfiguration hard:**

1. **The unit is a radio, never a placeholder.** No default that can be accepted blindly.
2. **Live multiplication under the price.** "300 guests = Rs 7,50,000" makes per-event/per-head
   errors visible in the same eyeful.
3. **`includesFood` explains its own consequence** in the sentence next to it.
4. **Capacity cross-check** against the selected hall's per-style capacity.
5. **The preview never leaves the screen.**
6. **The simulator at the bottom** answers the only question that matters: *would you quote this
   number on the phone?*

## 2.3 Flexibility features that make it fast

| Feature | Why it earns its place |
|---|---|
| **Duplicate** | "Gold Dinner" → "Gold Lunch" at a lower rate. The single biggest time-saver. |
| **Reorder (drag)** | Vendors care intensely about which package is shown first. |
| **Bulk price change** | *"Raise all packages 12%"* — annual inflation is 30–40%; they will do this. |
| **Draft vs published** | Build next season's card without exposing it. |
| **Seasonal variant** | Same package, different rate window, without duplicating content. |
| **Per-hall variant** | Gold in the Lawn priced differently from Gold in Main Hall. |
| **Archive, never delete** | Existing bookings snapshot their line; archiving must not break history. |
| **Templates by venue type** | New marquee gets Gold/Silver/Platinum pre-filled and edits from there. |
| **Import from another venue** | Multi-venue owners (Organisation) copy a whole rate card. |

## 2.4 Validation — three severities, never a silent save

| Severity | Example | Behaviour |
|---|---|---|
| 🔴 **Block** | Dinner slot ends 23:00 in Punjab · fireworks add-on · per-head with no amount | Cannot save. Statute quoted where relevant. |
| 🟠 **Warn** | `includesFood=false` and no catering lines exist · max guests exceeds hall's fire-rated capacity · package minimum above max | Saves, banner persists on the Overview gap analyser. |
| 🔵 **Suggest** | No photos · no "not included" list · no minimum guarantee on a per-head line | Quiet hint, dismissible. |

---

# PART 3 — THE MENU BUILDER (vendor side)

## 3.1 Layout — sections in service order, item library on the right

```
GOLD MENU                        Rs 2,500/head  ·  [Duplicate] [Preview]

┌── SECTIONS (drag to reorder) ──────────┬── DISH LIBRARY ──────────┐
│                                        │  Search [ karahi      ]  │
│ ▸ Welcome drink            1 item      │                          │
│ ▸ Chaat / Salad bar        4 items     │  MAIN COURSE             │
│ ▾ LIVE BBQ                 2 items     │   Chicken Karahi     [+] │
│     ⠿ Reshmi Seekh Kabab   🔥live  ⋮   │   Mutton Karahi      [+] │
│     ⠿ Chicken Tikka        🔥live  ⋮   │   Chicken Qorma      [+] │
│     [ + add dish ]                     │   Mutton Qorma  +400 [+] │
│ ▾ MAIN COURSE              1 item      │   Chicken Handi      [+] │
│     ⠿ Chicken Karahi     [salan] ⋮     │   Beef Nihari   🐄   [+] │
│     [ + let customer choose from 3 ]   │                          │
│ ▸ Rice                     1 item      │  RICE                    │
│ ▸ Bread                    1 item 🔥   │   Chicken Biryani    [+] │
│ ▸ Dessert                  1 item      │   Mutton Pulao  +350 [+] │
│ ▸ Live counters            0 items     │   Kabuli Pulao       [+] │
│ ▸ Beverages                3 items     │                          │
│                                        │  [ + create new dish ]   │
├────────────────────────────────────────┴──────────────────────────┤
│  ONE-DISH CHECK · Punjab                                          │
│  Salan 1/1 ✓   Rice 1/1 ✓   Sweet 1/1 ✓   Salad ✓  Drinks ✓      │
│  ✅ This menu complies with the Punjab one-dish rule.             │
└───────────────────────────────────────────────────────────────────┘
```

## 3.2 The dish library — the thing that makes this fast

Dishes are **entities, not strings**. Created once, reused across every menu.

```
CHICKEN KARAHI                            [ Save to library ]

  Name (English)   [ Chicken Karahi                    ]
  Name (Urdu)      [ چکن کڑاہی                          ]
  Section          [ Main course        ▾ ]
  Photo            [ + upload ]

  COUNTS AS  (for the one-dish rule) ─────────────────
    (•) Salan (main dish)   ( ) Rice   ( ) Salad
    ( ) Sweet dish          ( ) Bread  ( ) Drink  ( ) Not counted
    ⓘ Punjab permits ONE salan and ONE sweet dish per function.
      Labelling a salan as "salad" does not change what it is.   <- defeats the workaround honestly

  PRICING ────────────────────────────────────────────
    (•) Included in the menu price
    ( ) Supplement  Rs [ 400 ] per head
        ⓘ For 300 guests this adds Rs 1,20,000.

  DIETARY ────────────────────────────────────────────
    [ ] Vegetarian   [x] Contains chicken   [ ] Contains beef
    Allergens  [ dairy ×] [ nuts ×] [ + ]

  SERVICE ────────────────────────────────────────────
    [ ] Live counter / cooked in front of guests
```

**Why `countsAsMainDish` is a dropdown, not a guess:** the Act's definition is
*one salan + one rice dish + one salad + hot and cold drinks + roti/nan + one sweet dish.*
Any parser that reads dish *names* will be defeated in a week by a venue calling its second salan a
"special salad" — which is exactly the documented workaround. Making it an explicit, vendor-declared
field puts the declaration on record, which is also what protects the venue if it is ever asked.

## 3.3 Customer-choice groups

```
MAIN COURSE          (•) Fixed dish   ( ) Let the customer choose

  [ ● ] Let the customer choose  1  of these:
        ⠿ Chicken Karahi                        included
        ⠿ Chicken Qorma                         included
        ⠿ Chicken Handi                         included
        ⠿ Mutton Qorma                     +Rs 400/head
        [ + add option ]
```

This is what turns "Gold Package" into something a family can personalise **without changing the
price** — Decorium's actual model — and it is where `supplementPerHead` does its work. One menu,
one card, one price, with a priced upgrade path.

## 3.4 Menu flexibility

Duplicate menu · import sections from another menu · seasonal menus (Ramadan Aftari set) ·
per-package menus vs shared menus · Urdu-first toggle · **print/PNG export** (vendors hand printed
menu cards to families) · archive not delete.

---

# PART 4 — THE VENUE DETAIL PAGE (customer side)

This is where the whole system is judged. It must be **robust in three senses**: robust to any venue
configuration, robust on any device, and robust to a sceptical reader.

## 4.1 Above the fold — six answers, no scrolling

```
┌─────────────────────────────────────────────────────────┐
│  [ hero gallery · swipeable ]                    ♡  ⇪   │
├─────────────────────────────────────────────────────────┤
│  Gulshan Marquee                       ★ 4.6 (218)      │
│  DHA Phase 5, Lahore                                    │
│                                                         │
│  From Rs 2,500 per head        <- UNIT ALWAYS STATED    │
│  600 sit-down · 800 buffet · 900 max                    │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Your date?   [ 19 Dec 2026 ▾ ]  [ 500 guests ▾ ] │  │
│  │  ✓ Available · Dinner                             │  │
│  │  Gold from Rs 16,62,728 all-in                    │  │
│  │  [ Request this date ]                            │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ⓘ All functions conclude by 10:00 PM (Punjab law)      │
│  ⓘ Advance Rs 1,00,000 · non-refundable, transferable   │
└─────────────────────────────────────────────────────────┘
```

Six answers delivered immediately: **what it costs and per what · how many it holds · is my date
free · what's my actual all-in number · when does it have to end · what happens if I cancel.**

Every one of those is a question a Pakistani family asks on the first phone call. Answering them
before the call is the entire product.

## 4.2 The package cards — the pamphlet, rendered

```
PACKAGES                              [ Compare all ▾ ]

┌──────────────────────┐  ┌──────────────────────┐
│  [ image ]           │  │  [ image ]           │
│                      │  │              POPULAR │
│  GOLD                │  │  PLATINUM            │
│  Rs 2,500 /head      │  │  Rs 3,800 /head      │
│  ─────────────────   │  │  ─────────────────   │
│  For your 500 guests │  │  For your 500 guests │
│  Rs 12,50,000        │  │  Rs 19,00,000        │
│  ─────────────────   │  │  ─────────────────   │
│  200–800 · Buffet    │  │  200–1200 · Sit-down │
│                      │  │                      │
│  MENU                │  │  MENU                │
│  Chicken Karahi      │  │  Mutton Qorma        │
│  Chicken Biryani     │  │  Chicken Karahi      │
│  Reshmi Seekh 🔥     │  │  Beef Foil Roast 🔥  │
│  Gulab Jamun         │  │  Live Jalebi 🔥      │
│  + 6 more      [see] │  │  + 9 more      [see] │
│                      │  │                      │
│  INCLUDES            │  │  INCLUDES            │
│  ✓ Hall + AC         │  │  ✓ Everything in Gold│
│  ✓ Generator         │  │  ✓ Upgraded stage    │
│  ✓ Bridal room       │  │  ✓ Valet parking     │
│                      │  │                      │
│  NOT INCLUDED        │  │  NOT INCLUDED        │
│  ✗ Décor upgrade     │  │  ✗ Photography       │
│  ✗ Photography       │  │                      │
│                      │  │                      │
│  [ Select Gold ]     │  │  [ Select Platinum ] │
└──────────────────────┘  └──────────────────────┘
```

**Five rules the card must never break:**

1. **The unit is never separated from the number.** "Rs 2,500 /head", never "Rs 2,500".
2. **The customer's own total is shown**, computed from *their* guest count, not a generic example.
3. **"Not included" is as prominent as "included."** This is the single biggest trust gap in the
   market and the cheapest thing to fix.
4. **The menu is visible on the card**, not behind a click. It is what the family is choosing.
5. **Live items are badged.** 🔥 Live BBQ and live jalebi are genuine differentiators in this market.

## 4.3 Adapting to every configuration — the robustness table

| Venue setup | What the detail page shows |
|---|---|
| Shape 1, 3 packages | Three cards, menus visible, prices per head |
| Shape 1, **1 package** | No carousel — a single expanded panel. Never a lonely card. |
| Shape 2 (hall + food) | "Hall charges" block, then "Menus" block with prices. Two sections, clearly separate. |
| Shape 3 (hall only) | Hall charges only. **A prominent "Catering: arrange your own"** panel with the kitchen fee and a list of caterers on the platform. **No menu section at all.** |
| Shape 4 (caterer) | Menus only. No hall, no capacity — a **delivery-area** map instead. |
| Shape 5 (F&B minimum) | Hall price + *"minimum Rs 8,00,000 on food"* stated as a headline, not buried. |
| **No prices set** | "Price on request" + inquiry form. Never a Rs 0 or a blank. |
| **No photos** | Typographic card with the venue's initial. Never a broken-image icon. |
| **No menu items** | Package card shows includes/excludes only. Card layout must not collapse. |
| **Fully booked date** | Calendar shows it red + the next three free dates inline. |
| **Vacation mode** | Banner with return date; enquiries still accepted for after it. |
| **One package, no photo, no menu** | Still a complete, credible card. **This is the layout stress test.** |

## 4.4 The sticky quote bar

Present from the moment a package is selected, on every scroll position:

```
┌─────────────────────────────────────────────────────────┐
│ Gold · 500 guests · 19 Dec           Rs 16,62,728 all-in│
│ Advance Rs 4,98,818          [ See breakdown ] [ Book ] │
└─────────────────────────────────────────────────────────┘
```

**"See breakdown" opens the full line-by-line quote — including tax, service charge and deposit —
before any commitment.** Every line carries its own "why". Most venue disputes in this market are
*"why is it more than you said"*; a self-explaining quote is the cheapest prevention available.

## 4.5 Mobile is the primary target

Pakistani wedding research happens on phones, usually shared around a family WhatsApp group.

- **Package cards stack**, full-width, swipeable horizontally as an alternative
- **Quote bar is fixed bottom**, above the thumb
- **Menu sections collapse** by default, first section open
- **Share sheet exports the package as a PNG** — because the actual sharing mechanism in this market
  is a screenshot in a family group, and a designed PNG beats a mangled screenshot
- **Tap-to-call and tap-to-WhatsApp** always reachable; some families will always want the call, and
  fighting that loses the booking

## 4.6 One shared component, three surfaces

`<PackageCard>` and `<MenuCard>` render in:

1. **Vendor portal** — live preview while editing
2. **Customer detail page** — read-only, with the customer's guest count applied
3. **PNG export** — for WhatsApp, both sides

Because it is one component, the vendor's preview and the customer's view **cannot disagree**. That
property is worth more than any individual styling decision in this document.

---

# PART 5 — WHAT TO BUILD

**Phase 1a — settle the money (unblocked by D-1)**
1. Delete the hardcoded placeholder IBAN
2. Remove the Rs 999,999 bank-transfer threshold
3. Surface `VendorBankDetails` on the payment step (+ `showToCustomers`, verification state)
4. Payment reference numbers + receipt upload
5. `CONFIRMED` on **venue confirms receipt**, not on gateway success
6. Stop defaulting to Stripe for venues

**Phase 1b — the rate card**
7. `RateCardLine` + adapter over existing Package/Menu/BundledService
8. `menu.price` → `NUMERIC(12,2)`
9. `resolveQuote()`
10. Rate-card manager (evolve `packages-manager`, copy the `pricingUnit` pattern from `menus-manager`)
11. **`<PackageCard>` shared component** + live preview + quote simulator

**Phase 2 — the menu builder**
12. Dish library entity · 13. Section reorder · 14. One-dish counter ·
15. Choice groups + `supplementPerHead` · 16. `<MenuCard>` + PNG export

**Phase 3 — the detail page**
17. Config-adaptive rendering (the Part 4.3 table) · 18. Sticky quote bar with full breakdown ·
19. Mobile + share sheet

**Phase 4** — booking rules, requirements, request-to-book, settlement, BEO.

---

## Sources

**Payments & regulation**
- [First-step analysis: fintech regulation in Pakistan — Lexology](https://www.lexology.com/library/detail.aspx?g=84bbef62-a654-45f6-abd8-d0b64ef5718a) — PEFTA 2007, PSO/PSP Rules, custodian prohibition
- [Regulating Mobile Service Payments In Pakistan — Mondaq](https://www.mondaq.com/fin-tech/707688/regulating-mobile-service-payments-in-pakistan)
- [Legal advice on becoming an EMI / PSP in Pakistan — Josh and Mak](https://joshandmakinternational.com/how-to-become-an-online-payment-provider/) — Rs 200M paid-up capital
- [Pakistani Law and Online Marketplaces — Courting The Law](https://courtingthelaw.com/2021/11/03/commentary/pakistani-law-and-online-marketplaces-an-enigma/)
- [9 Best Online Payment Gateways in Pakistan 2026 — XSTAK](https://www.xstak.com/blog/payment-gateways-in-pakistan) — Safepay, JazzCash, Easypaisa, PayFast, PayPro
- [Best Payment Gateway in Pakistan 2026 — RapidGateway](https://rapidgateway.pk/resources/best-payment-gateway-pakistan) — MDR 2–2.5%, T+1 settlement
- [Top 10 Payment Gateways in Pakistan — AssanPay](https://assanpay.com/top-10-payment-gateways-in-pakistan/)
- [State Bank of Pakistan & Digital Payments — AssanPay](https://assanpay.com/state-bank-of-pakistan-digital-payments/) — Raast

**Compliance & pricing** *(carried from earlier docs)*
- [The Punjab Marriage Functions Act 2016](http://nasirlawsite.com/laws/pmfa2016.htm)
- [Decorium Luxury Marquee](https://decoriumplmarquee.com/)
- [Sum Cloud POS — PRA eIMS](https://sumcloudpos.com/banquet-hall-pos-software.html)
- [Best Marquees in Lahore: 2026 Prices & Hidden Costs](https://pakbestfinds.com/best-marquees-in-lahore/)
