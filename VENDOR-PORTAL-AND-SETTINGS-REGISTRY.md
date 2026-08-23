# Vendor Portal & The Settings Registry

**Date:** 2026-08-23
**Companions:** `BOOKING-FLOW-ASSESSMENT.md` · `PK-VENUE-PRICING-RESEARCH.md` ·
`VENUE-BOOKING-ARCHITECTURE.md` · `VENDOR-REGISTRATION-AND-SCENARIOS.md` · `BOOKING-USE-CASES.md`

**The question this answers:** *Should venue registration manage all of these settings? And can
they also be managed in the portal?*

---

# PART 1 — THE ANSWER

## 1.1 Short version

| Question | Answer |
|---|---|
| Should **registration** capture everything? | **No. Emphatically no.** It would kill onboarding. |
| Should the **portal** manage everything? | **Yes. Every single setting, without exception.** |
| Is registration then a separate system? | **No.** Registration is a *guided subset* of the portal — same components, same endpoints, same validation. |

## 1.2 The rule

> **The portal is the complete system. Registration is a guided path through the minimum subset of
> it needed to become bookable. Every screen in registration is the same component the portal uses,
> rendered in wizard chrome.**

Two consequences that matter:

1. **Nothing is registration-only.** Anything a vendor sets while signing up, they can change later
   in the portal, in the same UI. No "contact support to change this."
2. **Nothing is portal-only that blocks bookings.** If a setting must exist before the venue can
   take a booking, it appears in registration — otherwise the venue goes live broken.

## 1.3 Why registration must NOT hold everything

The full settings registry in Part 4 has **147 settings**. A wizard asking for all of them would be
abandoned by nearly everyone.

Industry benchmarks from the research:

| Metric | Finding |
|---|---|
| Traditional long onboarding | **~40% abandonment**, 3–5 days minimum, often 6–8 weeks |
| Automated / progressive | abandonment **under 10%** when time-to-first-listing < 48 hours |
| Target completion rate | **85%** |
| Target time-to-activation | **under 7 days** |

The technique is **progressive profiling** — collect only what's essential at signup, gather the
rest at the moment it becomes relevant. And each stage of onboarding is a measurable drop-off point,
so friction has to be removed step by step.

**Applied here:** a marquee owner in Johar Town, on a phone, between two client calls, will not
configure a tolerance band, a walk-in rate and a lunar blackout calendar before he has seen a single
enquiry. He *will* configure them the week his first booking is confirmed — because then they matter
to him.

## 1.4 Three tiers, not two

```
TIER 1 — GET LISTED           ~8 min · 23 settings · required at signup
    Venue appears in search. Customers can enquire. No bookings yet.
                    |
TIER 2 — TAKE BOOKINGS        ~6 min · 18 settings · gates the Book Now button
    Prompted immediately after Tier 1, and again on the first enquiry.
                    |
TIER 3 — RUN IT PROPERLY      progressive · 106 settings · prompted contextually
    Never a wall. Each setting surfaces at the moment it becomes relevant.
```

**Tier 3 is prompted, never demanded.** Examples of contextual prompts:

| Trigger | Prompt |
|---|---|
| First booking confirmed | *"Set your headcount lock and tolerance band so the final bill is never a surprise."* |
| First enquiry under 100 guests | *"You've had 3 small enquiries. Add a small-function rate?"* |
| 1 September | *"Peak season starts next month. Set your December pricing."* |
| First outside-caterer request | *"Do you allow outside caterers? Set your kitchen access fee."* |
| Revenue crosses Rs 6M | *"You now need PRA registration and eIMS invoicing."* |
| Ramadan approaching | *"Switch to Aftari/Sehri slots for Ramadan?"* |
| 5 declines for the same reason | *"You've declined 5 requests as 'guest count doesn't suit'. Adjust your capacity ranges?"* |

---

# PART 2 — WHAT THE PORTAL ALREADY HAS (verified)

`components/dashboard/mainScreens/businessSettings/redesigned/` — **8 managers, 11 tabs, 3,374 lines.**
This is genuinely well built and materially ahead of the booking flow that consumes it.

| Tab | Component | State |
|---|---|---|
| Profile | `profile-content-manager` (658 ln) | wired |
| Capacity & pricing | hub view | wired |
| Amenities & services | hub view (`BOOLS` list) | wired |
| Listing content | `profile-content-manager` | self-saving |
| Type-specific | `type-specific-manager` (416 ln) | self-saving |
| Images | `images-manager` (184 ln) | self-saving |
| **Packages** | `packages-manager` (277 ln) | self-saving |
| **Menus** | `menus-manager` (280 ln) | self-saving |
| **Bank details** | `bank-accounts-manager` (206 ln) | self-saving |
| Team members | → `/dashboard/staff` | linked |
| **Availability** | `availability-manager` (351 ln) | self-saving |

### Three things already right that should be preserved

**1. `menus-manager` has the explicit pricing-unit toggle.**
`per_head` / `per_event` + `minGuarantee`, defaulting to per-head, commented in-code as
*"the Pakistani norm"*. **This is precisely the control `packages-manager` is missing** — the fix is
to copy a pattern that already exists three files away, not invent one.

**2. `bank-accounts-manager` is thoughtfully built.**
`bankName`, `accountHolderName`, `accountNumber`, `iban` (with PK IBAN validation), `branchCode`,
`isActive` — backed by `VendorBankDetails`. It deliberately **excludes itself from the localStorage
draft layer**, with the reasoning written in the file: an IBAN typed off a chequebook shouldn't
survive in browser storage.

> **Correction to `BOOKING-FLOW-ASSESSMENT.md`:** I described the bank details as missing. They are
> not. `VendorBankDetails` is complete. The real issue is narrower: it exists for **payouts**
> (platform → vendor) and is **never surfaced to the customer** — `grep` for `bankAccount` in
> `components/booking/` returns nothing. The customer-facing bank-transfer screen shows a
> *platform* account, and that account is a placeholder.
>
> **Which fix is correct depends on decision D-1.** If the platform collects, the platform account
> just needs to be real. If the venue collects directly, surface `VendorBankDetails` on the booking.
> Same defect, two different fixes — do not build either until D-1 is settled.

**3. The hub has a gap analyser.**
It already tells vendors what's missing in customer language:
*"No cancellation policy — couples ask before they book"* · *"No photographs — couples choose by
looking"* · *"No advance terms set"*.

**This component is the natural home for the Tier-2 and Tier-3 prompts.** It doesn't need building —
it needs feeding.

---

# PART 3 — THE GATE MODEL

Rather than blocking registration, settings gate **capabilities**. A venue is always as usable as
its configuration allows.

| Capability | Requires | If missing |
|---|---|---|
| **Appear in search** | Tier 1 complete | Not listed |
| **Receive enquiries** | Tier 1 | — |
| **Show a price** | ≥1 priced rate-card line | *"Price on request"* + inquiry CTA (`isUnpricedVendor` — EXISTS) |
| **Show "Check availability"** | ≥1 slot template | Enquiry only |
| **Accept a booking request** | Tier 2 complete | Book button hidden, enquiry shown |
| **Accept instant bookings** | Tier 2 + advance terms + payment method | Falls back to `request` mode |
| **Quote tax-inclusive** | Tax profile set | Quote states *"excludes applicable taxes"* |
| **Bill per head** | `pricingUnit` + guarantee | Flat pricing only |
| **Settle on actual count** | tolerance band + walk-in rate | Guarantee-only settlement |
| **Issue fiscal invoices** | PRA/SRB enrolment | Plain receipt |
| **Take bookings after 22:00** | — | **Never. Hard block, no override.** (PMFA 2016 s.6) |

**Degradation is graceful everywhere except the law.** A half-configured venue is still a working
listing — it just does less. That is what keeps the 40% from walking away.

---

# PART 4 — THE SETTINGS REGISTRY

Every setting in the system. **T** = tier · **Portal tab** = where it lives permanently ·
**Status**: `E` exists · `P` partial · `N` new.

## 4.1 Identity & legal

| Setting | T | Portal tab | Default | Status |
|---|---|---|---|---|
| Owner name, phone, email, password | 1 | Profile | — | E |
| WhatsApp number | 1 | Profile | = phone | E |
| CNIC (encrypted) | 1 | Profile | — | E |
| NTN | 3 | Profile | null | E |
| Address proof + verification | 3 | Profile | — | E |
| Verification tier | 3 | Profile (read-only) | unverified | E |
| **Tax jurisdiction** (PRA/SRB/ICT/KP) | 2 | Compliance | from city | **N** |
| **PRA/SRB reg. no. + eIMS enrolment** | 3 | Compliance | null | **N** |
| **Above Rs 6M threshold** | 3 | Compliance | false | **N** |

## 4.2 Venue profile

| Setting | T | Portal tab | Default | Status |
|---|---|---|---|---|
| Venue name, slug, description | 1 | Profile | — | E |
| Venue type | 1 | Profile | — | E |
| City, subArea, address, map pin | 1 | Profile | — | E |
| Brand logo | 3 | Profile | null | E |
| Amenities | 2 | Amenities | [] | E |
| Parking capacity | 2 | Capacity | null | E |
| Languages, awards, press, references | 3 | Listing content | [] | E |
| Years in business, weddings completed | 3 | Listing content | null | E |
| `vacationMode` + dates + message | 3 | Availability | off | E |

## 4.3 Spaces

| Setting | T | Portal tab | Default | Status |
|---|---|---|---|---|
| Space name, kind, tree position | 1 | Spaces | one default | E |
| `fireRatedCapacity` (legal) | 1 | Spaces | — | E |
| `comfortCapacity` | 1 | Spaces | — | E |
| **Capacity by service style** | 3 | Spaces | = comfort | **N** |
| **Capacity by seating layout** | 3 | Spaces | = comfort | **N** |
| `genderMode` | 2 | Spaces | mixed | E |
| `basePricePkr` | 2 | Spaces | null | E |
| **Covered / open / semi** | 2 | Spaces | covered | **N** |
| **Rain backup space** | 2 | Spaces | null | **N** |
| **Setup access minutes** | 3 | Spaces | 0 | **N** |
| **Teardown minutes** | 3 | Spaces | 0 | **N** |
| **Contention group** | 3 | Spaces | null | **N** |
| Merge group | 3 | Spaces | null | E |

## 4.4 Rate card *(the core — see `VENDOR-REGISTRATION-AND-SCENARIOS.md` Part 1)*

| Setting | T | Portal tab | Default | Status |
|---|---|---|---|---|
| **`pricingShape` preset** | 1 | Rate card | — | **N** |
| Line: name, description, images, features | 1 | Rate card | — | E (Package) |
| **Line: `kind`** | 1 | Rate card | — | **N** |
| **Line: `priceModel`** | 1 | Rate card | — | **N** (menus have it) |
| Line: `amount` | 1 | Rate card | — | E |
| **Line: `minGuaranteePax`** | 2 | Rate card | null | P (menus only) |
| **Line: guest range min/max** | 2 | Rate card | null | **N** |
| **Line: `tiers[]`** (volume pricing) | 3 | Rate card | [] | **N** |
| **Line: `includesFood`** | 1 | Rate card | false | **N** |
| **Line: `menuId`** | 2 | Rate card | null | **N** |
| **Line: `optionGroups[]`** | 3 | Rate card | [] | **N** |
| **Line: `serviceStyle`** | 2 | Rate card | null | **N** |
| **Line: `excludes[]`** (not-included) | 2 | Rate card | [] | **N** |
| **Line: `selection` / `group`** | 1 | Rate card | derived | **N** |
| **Line: `appliesToEventTypes[]`** | 3 | Rate card | all | **N** |
| **Line: `appliesToSlotTemplateIds[]`** | 3 | Rate card | all | **N** |
| **Line: `appliesToSubVenueIds[]`** | 3 | Rate card | all | E (Package) |
| **Line: valid from/to, weekdayMask** | 3 | Rate card | always | P |
| **Line: `isLegallyProhibited`** | — | *system* | false | **N** |
| `minimumPrice` (from-price) | 1 | Capacity & pricing | — | E |

## 4.5 Menus

| Setting | T | Portal tab | Default | Status |
|---|---|---|---|---|
| Menu title, price | 2 | Menus | — | E |
| **`pricingUnit`** | 2 | Menus | per_head | **E** ✓ |
| `minGuaranteeCount` | 2 | Menus | null | E |
| **Sections (PK order)** | 2 | Menus | seeded | **N** |
| **Item: name, nameUrdu, image** | 2 | Menus | — | **N** |
| **Item: `isLive`** | 3 | Menus | false | **N** |
| **Item: `countsAsMainDish` / `countsAsSweetDish`** | 2 | Menus | inferred | **N** |
| **Item: `supplementPerHead`** | 3 | Menus | 0 | **N** |
| **Item: `isVegetarian`, `containsBeef`, `allergens[]`** | 3 | Menus | — | **N** |
| **One-dish compliance check** | — | *system* | on in PB/ICT | **N** |

## 4.6 Calendar & slots

| Setting | T | Portal tab | Default | Status |
|---|---|---|---|---|
| Slot templates (label, times, capacity) | 2 | Availability | Lunch+Dinner | E |
| `bufferAfterMinutes` | 2 | Availability | 0 | E |
| `unitGuestCapacity` | 3 | Availability | null | E |
| `weekdayMask` | 3 | Availability | all | E |
| `minLeadDays` / `maxLeadDays` | 2 | Availability | 1 / 540 | E |
| Blocked dates | 3 | Availability | [] | E |
| Recurring blocks | 3 | Availability | [] | E |
| Capacity overrides | 3 | Availability | [] | E |
| Seasonal pricing (multiplier, window) | 3 | Rate card | [] | E |
| **Ramadan slot profile** | 3 | Availability | off | **N** |
| **Lunar blackouts (Muharram/Safar)** | 3 | Availability | off | **N** |
| **Named peak dates** | 3 | Rate card | [] | **N** |
| **Same-day gap rule** | 3 | Availability | = buffer | **N** |

## 4.7 Booking rules

| Setting | T | Portal tab | Default | Status |
|---|---|---|---|---|
| **`bookingMode`** instant/request/inquiry | 2 | Booking rules | **request** | **N** |
| **`bookingMode` per season/date** | 3 | Booking rules | inherit | **N** |
| **`requiresSiteVisit`** | 3 | Booking rules | false | **N** |
| **`quoteValidityDays`** | 3 | Booking rules | 30 | **N** |
| **`advanceDueWithinDays`** | 2 | Booking rules | 7 | **N** |
| Hold TTL | 3 | Booking rules | 15 min | E |
| **`headcountLockDays`** | 3 | Booking rules | 7 | **N** |
| **`toleranceBandPct`** | 3 | Booking rules | 10 | **N** |
| **`oversetPct`** | 3 | Booking rules | 5 | **N** |
| **`walkInRatePerHead`** | 3 | Booking rules | = rate | **N** |
| **`minimumSpendPkr`** | 3 | Rate card | null | **N** |
| `outsideVendorsAllowed` / fee | 3 | Amenities | true / 0 | E |
| **Auto-decline rules** | 3 | Booking rules | none | **N** |

## 4.8 Money & policy

| Setting | T | Portal tab | Default | Status |
|---|---|---|---|---|
| `downPayment` + `downPaymentType` | 2 | Capacity & pricing | 30% | E |
| **Minimum advance floor** | 3 | Money | null | **N** |
| **`securityDepositPkr` + return days** | 3 | Money | 0 / 7 | **N** |
| **Balance due days before** | 2 | Money | 3 | **N** |
| Instalment schedule | 3 | Money | off | P |
| Cancellation slabs | 2 | Money | platform default | E |
| `forceMajeureRule` | 3 | Money | full refund | E |
| **`advanceTransferPolicy`** | 2 | Money | transferable 12mo | **N** |
| `acceptsCash` / `acceptsBankTransfer` | 2 | Money | true / true | E |
| **Accepts JazzCash / cheque / card** | 3 | Money | false | P |
| Bank details (payout) | 2 | Bank details | — | **E** ✓ |
| **Bank details shown to customer** | 2 | Bank details | *pending D-1* | **N** |
| **Tax quote mode** (incl/excl) | 2 | Compliance | exclusive | **N** |
| **Service charge %** | 3 | Money | 0 | **N** |
| **Child rates (u5 / 5-12)** | 3 | Money | full / full | **N** |
| **`staffMealRate`** | 3 | Money | null | **N** |

## 4.9 Service & staffing

| Setting | T | Portal tab | Default | Status |
|---|---|---|---|---|
| `provideWaiter`, `providePlate`, `provideSeatingArrangement`, `provideSoundSystem`, `provideDecorationItem`, `provideFoodTesting` | 2 | Amenities | false | E |
| **`serviceStyles[]` offered** | 2 | Amenities | [buffet] | **N** |
| **Staff ratio per style** | 3 | Amenities | 1:20 / 1:16 | **N** |
| **Crockery grade tiers** | 3 | Rate card | null | **N** |
| `travelToClientHome` + policy | 3 | Amenities | false | E |

## 4.10 Compliance

| Setting | T | Portal tab | Default | Status |
|---|---|---|---|---|
| **City rule pack** | 2 | Compliance | from city | **N** |
| `eventClosingTime` | 2 | Compliance | 22:00 (PB/ICT) | E |
| `oneDishPolicy` | 2 | Compliance | true (PB/ICT) | E |
| `legalGuestCap` | 2 | Compliance | null | E |
| **Fireworks block (s.3)** | — | *system* | always on | **N** |
| **Loudspeaker limit** | 3 | Compliance | null | **N** |
| Fire safety NOC + expiry | 3 | Compliance | null | P |
| `requiresPermit` + checklist URL | 3 | Compliance | false | E |
| **CNIC capture over Rs 1,000** | 3 | Compliance | on if PRA | **N** |

## 4.11 Team & operations

| Setting | T | Portal tab | Default | Status |
|---|---|---|---|---|
| Team members + roles | 3 | Team | owner only | E |
| **Day-of contact person** | 3 | Team | owner | **N** |
| **BEO distribution list** | 3 | Team | owner | **N** |
| Broker/agent + commission | 3 | Team | none | P |
| **Notification prefs (WhatsApp/email/SMS)** | 3 | Profile | WhatsApp | P |
| **Response-time SLA target** | 3 | Booking rules | 4h | **N** |

**Totals:** Tier 1 = 23 · Tier 2 = 18 · Tier 3 = 106 · **147 settings**
Existing `E` = 61 · Partial `P` = 11 · New `N` = 75

---

# PART 5 — PROPOSED PORTAL INFORMATION ARCHITECTURE

Current 11 tabs grow to 13, regrouped so the new settings have obvious homes:

```
VENUE PORTAL
├── Overview            <- gap analyser + Tier-2/3 prompts + this month's numbers
├── Profile             <- identity, contact, description, logo, notifications
├── Spaces              <- halls, capacities by style, gender mode, setup/teardown   [PROMOTE]
├── Rate card           <- packages, hall charges, add-ons, surcharges, seasonal     [NEW - replaces "Packages"]
├── Menus               <- sections, items, one-dish check, supplements
├── Availability        <- slots, blocks, lead times, Ramadan, lunar blackouts
├── Booking rules       <- instant/request, quote validity, headcount, tolerance     [NEW]
├── Money & policy      <- advance, deposit, instalments, cancellation, child rates  [NEW]
├── Compliance          <- city pack, closing time, one-dish, NOC, tax               [NEW]
├── Bank details        <- payout accounts (+ customer-facing, pending D-1)
├── Amenities           <- services provided, service styles, outside vendors
├── Images
└── Team                <- members, roles, day-of contact, BEO list
```

**Every registration screen maps to exactly one of these tabs and reuses its component.**

| Registration step | Portal tab it borrows from |
|---|---|
| A1 Account & identity | Profile |
| A2 Venue profile | Profile |
| A3 Spaces | Spaces |
| A4 How do you charge? | Rate card |
| A5 Rate card | Rate card |
| A6 Photos | Images |
| A7 Preview & publish | Overview |
| B1 Calendar & slots | Availability |
| B2 Booking rules | Booking rules |
| B3 Money & policy | Money & policy |
| B4 Compliance | Compliance |

One component, two chromes. **The wizard cannot drift from the portal because there is nothing to
drift from.**

---

# PART 6 — HOW THIS MAKES THE BOOKING FLOW ROBUST

The flow's robustness is not a property of the flow. It is a property of **every setting having a
safe default and a graceful degradation**.

| Failure mode | Why it can't happen |
|---|---|
| Venue configured a package with no unit | `priceModel` is a required radio; the pamphlet preview and quote simulator show the result before publish |
| Venue set per-head but no minimum | Defaults to 1; guarantee is simply not enforced |
| Venue has no tax profile | Quote says *"excludes applicable taxes"* rather than silently under-quoting |
| Venue has no cancellation policy | Platform default applies, snapshotted onto the booking |
| Venue has no tolerance band | Settlement bills `max(guaranteed, actual)` — the safe reading |
| Venue has no slots | Listing shows enquiry-only, not a broken calendar |
| Venue has no bank details | Cash and request-mode still work |
| Venue set a 23:00 slot in Punjab | **Blocked at save**, with the statute and penalty quoted |
| Venue built a two-salan menu | Flagged in the builder, before any customer sees it |
| Venue never set a walk-in rate | Extra guests bill at the normal rate |
| Venue never set child rates | Children bill as adults — matches current behaviour |
| Customer needs something unlisted | Requirements free-text, and it blocks `CONFIRMED` until answered |

**The pattern:** every unset setting resolves to the **conservative** reading — the one that
under-promises to the customer and over-protects the venue's legal position. Nothing is ever
undefined at quote time.

---

# PART 7 — WHAT THIS CHANGES ABOUT THE BUILD ORDER

Because the portal is the system and registration is a view of it, **build portal-first**:

**Phase 1 — Rate card in the portal**
1. `RateCardLine` table + adapter so existing `Package` / `Menu` / `BundledService` keep working
2. `menu.price` → `NUMERIC(12,2)`
3. **Rate card manager** in the portal *(evolve `packages-manager`, copying the `pricingUnit`
   pattern that already works in `menus-manager`)*
4. `resolveQuote()` replacing `pkgPrice * qty + menuPrice`
5. Pamphlet preview + quote simulator in the portal
6. Tax, service charge, deposit, cancellation policy on the customer Review step

**Phase 2 — The three new portal tabs**
7. Booking rules · 8. Money & policy · 9. Compliance (with hard blocks)
10. Promote Spaces out of the flag-gated registration builder into a full tab

**Phase 3 — Registration re-cut**
11. Re-cut the wizard as Tier 1 + Tier 2, reusing every portal component
12. A4 "How do you charge?" + rate-card presets
13. Feed the existing gap analyser with Tier-2/Tier-3 prompts

**Phase 4 — The booking flow**
14. Adaptive step engine · 15. Requirements free-text · 16. Request-to-book ·
17. Settlement · 18. BEO

**Note the ordering.** The booking flow is Phase 4, not Phase 1 — because a flow that adapts to
venue configuration is untestable until venues can actually express those configurations. Building
the flow first would mean building it against config that doesn't exist yet.

---

## Sources

- [Progressive Profiling 101: Right User Info at the Right Time — Descope](https://www.descope.com/learn/post/progressive-profiling)
- [Progressive Profiling for Frictionless Digital Onboarding — SSOJet](https://ssojet.com/ciam-qna/progressive-profiling-frictionless-digital-onboarding)
- [Marketplace Vendor Onboarding: The Guide To Scaling Your Platform — Appscrip](https://appscrip.com/blog/marketplace-vendor-onboarding/)
- [Marketplace Seller Onboarding: Process & Automation — CS-Cart](https://www.cs-cart.com/blog/marketplace-seller-onboarding/)
- [5 Steps to Successful Vendor Onboarding for Marketplaces — Markko](https://meetmarkko.com/knowledge/5-steps-to-successful-vendor-onboarding-for-marketplaces/)
- [Streamlining vendor onboarding to reduce drop-off — Zigpoll](https://www.zigpoll.com/content/how-can-we-streamline-the-vendor-onboarding-process-in-our-woocommerce-marketplace-to-increase-efficiency-and-reduce-dropoff-rates)
- [The Punjab Marriage Functions Act 2016](http://nasirlawsite.com/laws/pmfa2016.htm)
- [Sum Cloud POS — PRA eIMS thresholds and obligations](https://sumcloudpos.com/banquet-hall-pos-software.html)
