# Booking Use Cases — End-to-End User Journeys

**Date:** 2026-08-23
**Companions:** `BOOKING-FLOW-ASSESSMENT.md` · `PK-VENUE-PRICING-RESEARCH.md` ·
`VENUE-BOOKING-ARCHITECTURE.md` · `VENDOR-REGISTRATION-AND-SCENARIOS.md`

**What this is:** 24 complete journeys — a real person, a real venue with a real configuration,
every screen, every number, every branch. Where `VENDOR-REGISTRATION-AND-SCENARIOS.md` lists ~150
scenarios as rows, this walks the important ones end to end so the flow can be built from it
directly.

**Each use case has:** Who · What they want · How the venue is configured · The journey ·
Edge cases hit · **What breaks today**.

---

## THE VENUES USED IN THESE EXAMPLES

| Venue | City | Shape | Configuration |
|---|---|---|---|
| **Gulshan Marquee** | Lahore | 1 — all-inclusive per head | Gold Rs 2,500/head · Platinum Rs 3,800/head. Halls: Main (900 fire / 600 sit-down / 800 buffet), Lawn (open, no backup). `request` mode in peak, `instant` Mar–Sep. Advance 30%, min Rs 1L. Deposit Rs 1L. |
| **Al-Karam Hall** | Lahore | 3 — hall only | Rs 2,50,000/day. Outside caterers welcome, kitchen fee Rs 60,000. Deposit Rs 75,000. `instant`. |
| **Shaheen Banquet** | Karachi | 2 — hall + food per head | Hall Rs 3,00,000 · Menu 1 Rs 1,250/head · Menu 2 (mutton) Rs 2,250/head. Min guarantee 200. Closing midnight (Sindh). |
| **Hanif Caterers** | Lahore | 4 — caterer, no hall | Menu 1 Rs 1,250/head · Menu 2 Rs 2,250/head. Min 150. |
| **Pearl Ballroom** | Islamabad | 5 — hall + F&B minimum | Ballroom Rs 2,00,000 · F&B minimum Rs 8,00,000 · Menu A Rs 2,200/head. |

---

# PART A — THE COMMON JOURNEYS

## UC-01 — The standard wedding (the 80% case)

**Who:** Ayesha, 26, booking her own Barat. Lahore. First time booking anything online.
**Wants:** Barat, 19 Dec 2026 (Saturday), dinner, ~500 guests.
**Venue:** Gulshan Marquee — Shape 1, `request` mode (peak season).

### The journey

**1. Discovery.** Searches "marquee Lahore 500 guests December". Gulshan card shows:

```
Gulshan Marquee · DHA Phase 5
From Rs 2,500 per head          <- the UNIT is stated
600 sit-down / 800 buffet
✓ 19 Dec available
```

**2. Detail page.** Above the fold: price with its unit, capacity by service style, an inline
calendar with 19 Dec green, *"All functions conclude by 10:00 PM (Punjab law)"*, and
*"Advance Rs 1,00,000 — non-refundable, transferable to another date within 12 months"*.

CTA reads **"Request this date"**, not "Book Now", because `bookingMode = request` for peak.

**3. Date & slot.** Picks 19 Dec, Dinner (19:00–22:00). **A 15-minute hold is placed** —
`pg_advisory_xact_lock` on `(businessId, date)`. Countdown starts.

**4. Guests.** Slider at 500. Live: *"Billed for 500. This package's minimum is 200."*

**5. Space.** Main Hall vs Lawn. Lawn shows an amber flag: *"Open — no covered backup. Rain is your
risk."* She picks Main Hall. `500 ≤ 600 sit-down` ✓.

**6. Package.**

```
┌── GOLD ─────────────┐   ┌── PLATINUM ─────────┐
│ Rs 2,500 /head      │   │ Rs 3,800 /head      │
│ 200–800 · Buffet    │   │ 200–1200 · Sit-down │
│ Chicken Karahi      │   │ Mutton Qorma        │
│ Chicken Biryani     │   │ Chicken Karahi      │
│ Reshmi Seekh (live) │   │ Beef Foil Roast     │
│ Gulab Jamun         │   │ Live Jalebi         │
│ 500 = Rs 12,50,000  │   │ 500 = Rs 19,00,000  │
└─────────────────────┘   └─────────────────────┘
```

Picks **Gold**.

**7. Customise menu — FREE.** Because `Gold.includesFood = true`:

```
Your Gold package includes 1 main course — pick one:
 (•) Chicken Karahi   ( ) Chicken Qorma   ( ) Chicken Handi
 Upgrade to Mutton Qorma  +Rs 400/head   (+Rs 2,00,000)

Dessert — pick one:
 (•) Gulab Jamun   ( ) Kheer   ( ) Ice cream

✓ Complies with Punjab one-dish rule
```

**Price does not move.** She stays with Chicken Karahi.

**8. Add-ons.** Décor upgrade Rs 2,50,000 ☐ · Valet Rs 25,000 ☑ · Extra hour — *greyed out,
"would end after 10 PM"*.

**9. Requirements.** Ticks *Separate ladies section*. Types: *"My father is in a wheelchair, need a
ramp near the stage. Baraat may be 20 minutes late."*

**10. Review.**

```
Gold Package  Rs 2,500/head x 500                Rs 12,50,000
   Menu: included · Main: Chicken Karahi
Valet parking                                    Rs     25,000
                                                 ------------
Subtotal                                         Rs 12,75,000
Peak season (19 Dec, Saturday) +15%              Rs  1,91,250
                                                 ------------
Net                                              Rs 14,66,250
Service charge 5%                                Rs     73,313
Punjab Sales Tax 8%                              Rs  1,23,165
                                                 ============
GRAND TOTAL                                      Rs 16,62,728

Advance (30%, non-refundable)                    Rs  4,98,818
Security deposit (refundable)                    Rs  1,00,000
Balance due 16 Dec                               Rs 11,63,910

Final bill adjusts to actual guests on the night:
  guaranteed 500 · up to 550 at the same rate · beyond that Rs 3,200/head
Headcount and menu lock on 12 Dec
Cancellation: 100% to 90 days · 50% to 60 · 25% to 30 · 0% under 30
              (advance transferable to a new date within 12 months)
```

**11. Submit request.** No payment. *"Request sent. Gulshan Marquee usually replies within 4 hours.
Your date is held until then."*

**12. Vendor side.** Owner gets WhatsApp + dashboard card: date, slot, hall, 500 pax, Gold,
Rs 16.6L, and **both requirements flagged unanswered**. He taps **Accept**, and must respond to the
requirements before the system will move to `AWAITING_ADVANCE`:
- Ladies section → *"Agreed, Hall partition included"*
- Wheelchair ramp → *"Agreed, ramp at stage-left"*

**13. Payment.** Ayesha gets a link: *"Gulshan accepted. Pay Rs 4,98,818 within 7 days."*
Bank transfer → **Gulshan's own verified IBAN** → uploads the receipt screenshot. Venue marks it
received. Status → **CONFIRMED**. Receipt + contract PDF + WhatsApp confirmation.

**14. To completion.** 12 Dec headcount lock (she confirms 500) · 16 Dec BEO issued to chef,
captain, decorator — carrying the wheelchair note and the late-baraat note · 17 Dec pre-event call ·
19 Dec gate counts **518** — within the 550 band, so all at Rs 2,500 · settlement adds
Rs 45,000 + tax · balance collected · 20 Dec inspection, deposit returned · review link.

### Edge cases hit
`SA1` quote · `SB19` request mode · `SC1` free menu · `SC11` overtime blocked by 10 PM ·
`SD3` within tolerance band · `SF8` lawn risk disclosed · `SG4` gate count · `SG5` settlement

### What breaks today
- Menu step would **charge again** on top of Gold
- No tax, service charge or deposit on Review
- No cancellation policy shown
- No requirements field at all
- No request mode — she'd be auto-`Confirmed` on payment
- Bank transfer only appears above Rs 999,999 and shows a **placeholder IBAN**
- Nothing after `Confirmed` — no lock, no BEO, no settlement

---

## UC-02 — Hall only, family brings their own caterer

**Who:** Tariq, 54, father of the groom. Traditionalist — always uses Hanif Rajput.
**Wants:** Walima, 400 guests, hall only.
**Venue:** Al-Karam Hall — Shape 3.

### The journey

Detail page reads **"Rs 2,50,000 per day — hall only. Outside caterers welcome (Rs 60,000 kitchen
access)."** Not a per-head number anywhere.

Steps: Date → **Hall** → Guests → **Outside caterer details** → Add-ons → Requirements → Review.

**The menu step never appears.** Al-Karam created zero `catering` rate-card lines, so the group is
empty. *Empty group = no step.* No flag, no special case.

Guests (400) is still captured — capacity check `400 ≤ 500` ✓, layout, BEO, gate — but it
**multiplies nothing**.

```
Main Hall (per day)                              Rs 2,50,000
Kitchen access fee (auto — outside caterer)      Rs    60,000
                                                 ------------
Net                                              Rs 3,10,000
Punjab Sales Tax 8%                              Rs    24,800
                                                 ============
GRAND TOTAL                                      Rs 3,34,800
Security deposit (refundable)                    Rs    75,000
```

Outside-caterer step captures: caterer name, contact, arrival time, equipment being brought.
That flows straight onto the BEO so Al-Karam's staff know who is coming through the kitchen door.

Tariq books Hanif Caterers **separately** (UC-03) — two contracts, two vendors, one event date.

### Edge cases hit
`SA19` per-head asked of a hall-only venue · `SB3` config · `SC3` no menu step · `SB17` kitchen fee

### What breaks today
The flow **forces a Menu step** on every venue. Al-Karam would either look broken or be pushed to
invent a fake menu.

---

## UC-03 — Caterer with no venue

**Who:** Tariq again, from UC-02. Also his sister's Dholki at home.
**Wants:** (a) Walima catering at Al-Karam for 400 · (b) Dholki catering at home for 80.
**Vendor:** Hanif Caterers — Shape 4.

Steps: Date → Guests → **Menu (PRICED)** → Add-ons → **Delivery address** → Requirements → Review.
**No space step** — zero `space` lines exist.

```
(a) Menu 2 (mutton)  Rs 2,250 x 400              Rs 9,00,000
    Live BBQ counter  Rs 250/head x 400          Rs 1,00,000
    Crockery upgrade  Rs 120/head x 400          Rs   48,000
                                                 -----------
    Grand total (incl. PST)                      Rs 11,32,  ...

(b) 80 guests, but Hanif's minimum is 150
    Menu 1  Rs 1,250 x 150 (minimum applies)     Rs 1,87,500
    -> shown as: "Billed for 150 — this caterer's minimum.
       You could add 70 more guests at no extra cost."
```

That last line matters. A minimum presented as a **penalty** loses the booking; presented as
**headroom you've already paid for**, it doesn't.

### Edge cases hit
`SA2` under minimum · `SB4` config · `SC3` no space step · `SD19` live counter

### What breaks today
`menuBillableHeads` already floors at `minGuaranteeCount` correctly — good. But nothing **explains**
it, and there is no delivery-address step for the home event (`serviceLocationMode` exists on the
model, unused for caterers).

---

## UC-04 — The three-event wedding (umbrella)

**Who:** The Malik family. Mother is running everything.
**Wants:** Mehndi Fri 18 Dec (300, hi-tea) · Barat Sat 19 Dec (500, dinner) ·
Walima Sun 20 Dec (450, dinner). All at Gulshan.

### The journey

After the first event she is asked: *"Is this part of a wedding? Link your other functions and
unlock bundle pricing."* → creates a **WeddingUmbrella**.

```
Mehndi   18 Dec · Hi-Tea  · 300 · Gold      Rs  7,50,000
Barat    19 Dec · Dinner  · 500 · Platinum  Rs 19,00,000
Walima   20 Dec · Dinner  · 450 · Gold      Rs 11,25,000
                                            -----------
                                            Rs 37,75,000
3-event bundle tier  -8%                   -Rs  3,02,000
Peak season +15% (on discounted)            Rs  5,20,950
                                            -----------
Net                                         Rs 39,93,950
+ service charge + PST                      Rs  5,15,220
                                            ===========
                                            Rs 45,09,170
One combined advance (30%)                  Rs 13,52,751
```

**Three-day hold**: 18–20 Dec all locked at once. If any one date fails the conflict check, the
whole umbrella quote fails — not a partial booking.

The lawn is checked for setup contention: Mehndi teardown (2h) must finish before Barat setup (4h)
begins. System flags *"Barat setup starts 06:00 on 19 Dec"* on the BEO.

### Edge cases hit
`SA11` multi-event · `SC13` umbrella · `SF13` multi-day · `SB32` setup window · `SF4` contention

### What breaks today
`WeddingUmbrella` + `umbrellaBundleSnapshotJson` **exist and work** — genuinely strong. Missing: one
combined advance, three-date atomic hold, setup-contention checks.

---

## UC-05 — Comparing two venues with different pricing shapes

**Who:** Sana, 29, spreadsheet person. Shortlist of Gulshan and Al-Karam.
**Problem:** Rs 2,500/head vs Rs 2,50,000/day. **Not comparable as displayed.**

### The system's answer — normalise

```
COMPARE · 400 guests · 19 Dec · Dinner

                          Gulshan Marquee      Al-Karam Hall
Venue / package           Rs 10,00,000         Rs  2,50,000
Food                      included             NOT INCLUDED
   (Hanif Menu 1 est.)    —                    Rs  5,00,000
Kitchen access            —                    Rs    60,000
Taxes & charges           Rs  1,63,000         Rs    64,800
                          ------------         ------------
ALL-IN ESTIMATE           Rs 11,63,000         Rs  8,74,800
ALL-IN PER HEAD           Rs 2,908             Rs 2,187

Al-Karam is cheaper, but you manage the caterer yourself.
Food estimate uses Hanif Caterers Menu 1 — swap to compare.
```

**"All-in per head at your guest count"** is the only honest comparison axis across shapes. Without
it a hall-only venue looks 4× cheaper and every customer is misled.

### Edge cases hit
`SA12` cross-shape comparison

### What breaks today
Listings show a raw number with no unit. Rs 2,500 and Rs 2,50,000 sit side by side meaning entirely
different things.

---

# PART B — MONEY & NEGOTIATION

## UC-06 — Budget family, off-season, negotiating

**Who:** Rashid, teacher. Budget Rs 6,00,000 hard. 250 guests.
**Wants:** Any decent Lahore marquee.

Searches with budget filter. Gulshan in December is Rs 8.3L — over. System offers the levers:

```
Gulshan Marquee · Gold · 250 guests

  Sat 19 Dec (peak)              Rs 8,31,364    over budget
  Thu 17 Dec                     Rs 7,52,000    over budget
  Sat 14 Mar (off-season)        Rs 6,52,000    close
  Thu 12 Mar (off-season)        Rs 5,89,000    ✓ within budget
  Lunch instead of dinner, 12 Mar Rs 5,41,000   ✓

Off-season + weekday + lunch saves you Rs 2,90,364.
```

He picks Thu 12 Mar lunch. Because March is `instant` mode at Gulshan, he pays and is confirmed
immediately.

Then he messages: *"Can you do Rs 5,20,000?"* → **Requirements thread**, not a chat silo. Owner
opens the booking, applies a `discount` line of Rs 21,000 with reason *"repeat family"*, and the
quote **re-versions to v2** with the discount as an audited line. Rashid accepts v2.

### Edge cases hit
`SA13` cheapest options · `SB20` seasonal booking mode · `SE17` negotiated discount ·
`SC20` re-quote

### What breaks today
No off-peak alternative suggestions. No discount mechanism with audit — an owner would have to edit
the package price, which would corrupt every other booking.

---

## UC-07 — Bank transfer, the way it actually happens

**Who:** Imran, 40. Doesn't use cards. Booking Shaheen Banquet, Karachi.
**Amount due:** Rs 3,20,000 advance.

```
PAY YOUR ADVANCE                            Rs 3,20,000

Bank transfer  (recommended)
  Account title   SHAHEEN BANQUET (PVT) LTD     <- THIS venue's real account
  Bank            Meezan Bank, Gulshan Branch
  Account no      0234-5678901-002
  IBAN            PK24MEZN0002345678901002      [copy]
  Reference       BK-48219                       <- auto-reconciles

  After transferring:
    [ Upload your receipt ]  (photo or PDF)
  Shaheen Banquet confirms within 2–4 working hours.

Cash at the venue  ·  JazzCash (coming soon)  ·  Cheque
```

He transfers, uploads a screenshot. Venue dashboard: *"Payment pending verification — Rs 3,20,000,
ref BK-48219, receipt attached."* Manager matches it to the bank SMS, taps **Confirm received**.
Status → `CONFIRMED`, receipt issued, PRA fiscal invoice generated (Shaheen is SRB-registered —
Sindh, so SRB not PRA), CNIC captured (over Rs 1,000).

### Edge cases hit
`SE1` bank transfer · `SE20` fiscal invoice · `SE21` CNIC capture

### What breaks today
Bank transfer only renders **above Rs 999,999** and shows a **hardcoded placeholder IBAN**
(`0123-4567890-001`, `PK36HABB0000000123456789`) with a hardcoded WhatsApp number. No receipt
upload. No reference number. This is the single most dangerous live defect in the flow.

---

## UC-08 — Cancellation, and the advance that moves rather than dies

**Who:** The Qureshi family. Booked 19 Dec, paid Rs 4,98,818. On 25 Nov the grandfather dies.
**24 days out** — the policy slab says **0% refund**.

But Gulshan set `advanceTransferPolicy = transferable within 12 months`. So:

```
We're sorry for your loss.

Your booking is 24 days away. Under the cancellation policy you agreed on
3 Sep, the advance is not refundable at this stage.

  ( ) Postpone — hold your advance, pick a new date within 12 months
      Nothing is lost. Choose a date now or up to 40 days from today.
  ( ) Cancel — advance is forfeited
  ( ) It was a death in the immediate family
      -> force majeure review, full refund considered
```

They choose **Postpone**. `postponedAt` set, `postponedUntilAt` = +40 days, deposit stays alive, the
19 Dec slot is **released back to the calendar** (so Gulshan can resell it), and the advance sits as
a credit.

In January they pick 14 Mar. New date is off-season and **cheaper**:

```
Original (19 Dec, peak)     Rs 16,62,728
New (14 Mar, off-season)    Rs 13,20,000
Advance already paid        Rs  4,98,818
Difference                 -Rs  3,42,728  -> credited to your balance, not refunded in cash
New balance due 11 Mar      Rs  8,21,182
```

### Edge cases hit
`SE10` under-30-day cancel · `SE11` force majeure · `SE12` reschedule · `SE13` cheaper new date ·
`C10` postponement

### What breaks today
`postponedAt` / `postponedUntilAt` / `forceMajeureService` **exist and are genuinely best-in-class**.
Missing: the transfer-vs-forfeit choice, the credit ledger, and re-pricing on the new date.

---

# PART C — WHERE THE MONEY IS ACTUALLY DECIDED

## UC-09 — More guests turn up than guaranteed

**Who:** Ayesha from UC-01. Guaranteed **500**. Tolerance band 10% → **550**. Walk-in rate Rs 3,200.

**On the night the gate counts 612.**

```
SETTLEMENT · 19 Dec · Gulshan Marquee

Guaranteed                     500
Counted at the gate            612
Within tolerance (to 550)      550 @ Rs 2,500     Rs 13,75,000
Beyond tolerance                62 @ Rs 3,200     Rs  1,98,400
                                                  -----------
Food subtotal                                     Rs 15,73,400
   (originally quoted Rs 12,50,000)
Valet                                             Rs     25,000
Peak +15% · service 5% · PST 8%                   Rs  3,44,  ...
                                                  ===========
FINAL                                             Rs 20,88,  ...
Already paid                                      Rs  4,98,818
BALANCE DUE TONIGHT                               Rs 15,89,  ...
```

The venue manager and Ayesha's brother both sign the settlement on a tablet. Photo of the gate
register attached.

**Why the tolerance band matters:** without it, 612 vs 500 is a fight. With it, 550 was pre-agreed
at the normal rate and only the genuinely unplanned 62 carry the higher rate — and Ayesha saw that
rule on the Review screen in September.

### Edge cases hit
`SD4` beyond band · `SG4` gate count · `SG5` settlement · `SH12` night-of dispute prevention

### What breaks today
**None of this exists.** The booking ends at `Confirmed`. There is no actual-count capture, no
settlement, no tolerance band, no walk-in rate. The venue does this on paper and the platform never
learns the real revenue.

---

## UC-10 — Fewer guests turn up than guaranteed

**Who:** Nadia. Expected 400, guaranteed 350 on the venue's advice. **Only 280 attend** (rain).

```
Guaranteed        350
Counted           280
BILLED            350   <- the guarantee

  You are billed for your guaranteed 350 guests. This was agreed on
  22 Oct and confirmed at headcount lock on 12 Dec.
  Food for 350 was purchased and prepared.
```

The critical design decision: **this must be stated at headcount lock, not discovered at
settlement.** At T-7 the prompt reads:

```
CONFIRM YOUR FINAL COUNT                     lock closes 12 Dec

Expected      [ 400 ]
Guaranteed    [ 350 ]   <- you pay for this many even if fewer attend

  If 300 attend, you still pay for 350.
  If 380 attend, all 380 bill at the normal rate (up to 385).
  If 420 attend, 385 bill normally and 35 at Rs 3,200.

  Lower your guarantee?  [ 320 ]  — venue must approve
```

### Edge cases hit
`SD1` guarantee model · `SD2` under-attendance · `SD6` lowering after lock · `SG1` lock prompt

### What breaks today
No guarantee concept in the customer flow at all. `guaranteedPax` exists on the model, unused.

---

# PART D — WHERE THE LAW BITES

## UC-11 — The baraat is late and the clock is the law

**Who:** Ayesha's event, 19 Dec, Gulshan Marquee, Lahore.
**Situation:** At 21:15 the baraat still hasn't arrived. Dinner is unserved.

**Punjab Marriage Functions Act 2016 s.6** puts the duty to conclude by **10:00 PM** on the
**venue owner** — s.8 penalty: up to one month imprisonment and Rs 50,000–20,00,000. Not on Ayesha.

So this is not a customer-preference problem. Three places the system must have already acted:

1. **At venue config (B1):** Gulshan's Dinner slot is 19:00–22:00. A vendor trying to save
   19:00–23:00 is **blocked** with the statute quoted.
2. **At booking (SC12):** the "Extra hour" add-on was **greyed out** on Ayesha's add-ons screen,
   labelled *"would end after 10 PM — not permitted in Punjab"*.
3. **At T-2 pre-event:** the checklist item *"All ceremonies must conclude by 22:00. Confirm the
   host understands."* — acknowledged and timestamped by Ayesha's brother.

On the night, the event-night console shows a countdown and a prompt at 21:15: *"45 minutes to legal
close. Serve now."* Her requirement note — *"Baraat may be 20 minutes late"* — was already on the
BEO, so the kitchen had held plating.

**If it still overruns**, the console logs it against the booking. That log is the venue's evidence
of having warned, and the platform's evidence that it didn't sell an illegal slot.

### Edge cases hit
`SC11` slot blocked at config · `SC12` overtime refused · `SG7` overtime capped ·
`SH11` compliance acknowledgement · `I2` closing time

### What breaks today
Closing time is a **soft advisory warning shown to the customer** in `date-time-step.tsx`, and it's
flag-gated. It's pointed at the wrong party and it doesn't block anything.

---

## UC-12 — Two main dishes, one legal problem

**Who:** Farah wants Chicken Karahi **and** Mutton Qorma. Lahore.

The one-dish definition in the Act is arithmetic:
*one salan + one rice dish + one salad + hot and cold drinks + roti/nan + one sweet dish.*

Two salans = a violation, and under **s.4 and s.5 the liability falls on the host, the venue owner
AND the caterer.**

```
You've selected 2 main courses.

  Punjab law permits one main dish (salan) per function.
  Liability falls on the venue as well as on you — venues have been
  sealed and managers arrested for this in 2026.

  ( ) Keep Chicken Karahi only
  ( ) Keep Mutton Qorma only  (+Rs 400/head)
  ( ) Switch to Mutton Qorma and add Karahi as a LIVE COUNTER
      — a live station is not a served main dish. Ask the venue to confirm.
```

The third option is how venues actually navigate this, and offering it honestly — *"ask the venue to
confirm"* — is better than pretending the rule doesn't exist or that the workaround is guaranteed
safe.

**And critically, the check runs in the vendor's menu builder first.** A venue that builds a
two-salan menu is warned at build time, not at a customer's checkout.

### Edge cases hit
`SD15` two mains blocked · `SD16` relabelling defeated by `countsAsMainDish` · `I1` one-dish

### What breaks today
`oneDishPolicy` produces a soft customer-facing warning string. The menu builder has no
`countsAsMainDish`, so it cannot count anything, and relabelling a salan as "salad" defeats it
entirely.

---

## UC-13 — Fireworks

**Who:** The groom's cousin wants a *sehra* entry with fireworks and aerial firing.

**PMFA 2016 s.3** prohibits exploding crackers or explosive devices, **firing by firearms**, and
displaying fireworks.

This is not an add-on with a warning. `RateCardLine.isLegallyProhibited = true` means the line
**cannot be created by the vendor, cannot be selected by the customer, and does not render.** If a
customer types it into Requirements free-text, the venue's response template says no, and that
refusal is recorded.

### Edge cases hit
`I3` fireworks · `F1` free-text routing

---

# PART E — THE HUMAN EDGE CASES

## UC-14 — The requirements that no form will ever have

**Who:** Mrs Siddiqui, booking her son's Walima. 450 guests.

Her Requirements step:

```
Quick picks
 [x] Separate ladies section / parda    [x] Wheelchair or elderly access
 [x] Nikah at the venue                 [x] Dietary restrictions
 [x] Guests arriving from abroad

Dietary
 Vegetarian guests: [ 12 ]   No-beef: [x]   Allergies: [ peanuts - 1 child ]
 Kids under 5: [ 18 ]   Kids 5-12: [ 22 ]   Drivers/staff needing meals: [ 30 ]

In your own words
 ┌──────────────────────────────────────────────────────────────┐
 │ Meri saas diabetic hain, unke liye sugar-free kheer chahiye. │
 │ We are bringing mithai from Rehmat-e-Shereen ourselves.      │
 │ Ladies section ko fully parda chahiye, koi waiter andar nahi │
 │ jaye - female staff only. 20 guests Dubai se aa rahe hain.   │
 └──────────────────────────────────────────────────────────────┘
```

**What the system does with it:**

| Input | Effect |
|---|---|
| 18 kids under 5 | **free** → billable heads drop by 18 |
| 22 kids 5–12 | **half rate** → −11 billable heads |
| 30 drivers/staff | `staffMealRate` Rs 800 → separate Rs 24,000 line |
| No beef | Beef Foil Roast **filtered out** of the Platinum option list |
| Peanut allergy | Hard-flagged BEO item, red |
| 12 vegetarian | Separate prep count on the BEO |
| Sugar-free kheer | Free-text → routed to the chef section of the BEO |
| Own mithai | Policy check — Gulshan allows it, no corkage. Recorded. |
| Full parda, female staff only | **Priced requirement** — Gulshan responds *"Agreed, +Rs 35,000 for 4 female service staff"* → becomes an add-on line, Mrs Siddiqui re-approves |
| 20 from Dubai | Non-actionable, but on the BEO so the front desk expects them |

**Nothing moves to `CONFIRMED` until every requirement has a vendor response.** An unanswered
requirement is an unresolved expectation, which is precisely what becomes a dispute in month three.

The billable-head arithmetic here is not trivial:

```
Stated guests            450
  less kids under 5      -18   (free)
  less half of 5-12      -11   (22 at half)
                        ----
Billable heads           421
Guaranteed               400   -> bills at max(400, 421) = 421
Staff meals               30 @ Rs 800 = Rs 24,000 (separate line)
```

### Edge cases hit
`F1` free-text · `SD7`–`SD14` dietary and child rates · `SH5` dispute prevention

### What breaks today
**There is no free-text field anywhere in the booking flow.** Zero `<Textarea>` in any step.
`specialRequests` is machine-generated from car-rental quantity notes. `additionalRequests` exists on
the model and is never populated. No child rates, no staff meals, no dietary capture.

---

## UC-15 — Ladies-only function

**Who:** A Mayoun for 150, strictly ladies-only.
**Venue:** Gulshan's Hall B, configured `genderMode = ladies_only`.

Filtering by "ladies only" surfaces Hall B. The booking captures female-staff-only as a requirement
(UC-14). The BEO carries a hard instruction: *"No male staff past the partition after 18:00.
Male service to the corridor only."* Gate/security brief includes it.

`SubVenue.genderMode` **already exists** — it is simply never surfaced in search or booking.

---

## UC-16 — Overseas family booking from Dubai

**Who:** Bilal in Dubai booking his sister's Barat in Lahore. His uncle Nadeem is on the ground.

Journey differences:
- **Proxy contact** — Nadeem is `onSiteDecisionMaker`, gets every WhatsApp, can approve change
  requests up to a limit Bilal sets
- **Site visit by video** — `SiteVisit.mode = video`, scheduled for 19:00 PKT / 18:00 GST
- **Currency** — quote shown in AED alongside PKR; **PKR is contractual**
- **Payment** — international bank transfer, longer clearance, so `advanceDueWithinDays` extended to
  14 by the venue
- **Timezone** — reminders sent at sensible GST hours, not 3 AM

### What breaks today
`diasporaPaymentModel` exists; none of the proxy, video-visit, timezone or dual-currency handling
does.

---

## UC-17 — Small Nikah in a big marquee

**Who:** A 60-guest Nikah. Gulshan's smallest hall seats 200.

```
60 guests · Gulshan Marquee

  Gold package minimum is 200 guests.
  Booking at 60 would bill you for 200 (Rs 5,00,000).

  Better options:
  ( ) Hall C small-function rate — Rs 1,80,000 flat, up to 80 guests
  ( ) Book Gold at the 200 minimum — you'd have 140 unused covers
  ( ) See smaller venues nearby
```

A venue that configures a **small-function flat line** captures this booking. One that doesn't,
loses it — and the system should tell them so in their dashboard: *"You declined 14 enquiries under
100 guests this quarter. Consider a small-function rate."*

### Edge cases hit
`SA20` small event in a large venue · `SB6` per-event-type pricing

---

## UC-18 — Corporate dinner in a wedding marquee

**Who:** A pharma company. 200 guests, seminar + dinner, projector, stage, Tuesday.

Gulshan configured `appliesToEventTypes = [Corporate]` lines: **flat Rs 4,00,000** including AV,
theatre seating for the seminar hour then round tables — a completely different shape from their
wedding per-head model.

The event-type step branches the entire rate card. **Same venue, same halls, different commercial
model** — impossible with a single `pricingShape` enum, trivial with rate-card lines scoped by
event type.

### Edge cases hit
`SB6` hybrid venue — **the reason `pricingShape` was demoted to a preset**

---

## UC-19 — Soyem (funeral gathering)

**Who:** A family needing a hall for Soyem, day after tomorrow, ~250 people, simple food.

This is real, regular marquee revenue and it is **nothing like a wedding**:

- **Urgency** — 2 days out, so `minLeadDays` must be waivable per event type
- **Tone** — no décor upsell, no packages carousel, no "make it special" copy
- **Simple catering** — plain rice, one salan, water. Often free or at cost.
- **No advance in practice** — many venues waive it entirely for Soyem
- **Booking mode** — always `request`, always a phone call

Config: an event type with its own rate card, its own lead time, its own advance rule
(`advancePct = 0`), and a UI theme that suppresses celebratory language.

**A system that cannot book a Soyem cannot serve a Pakistani marquee.** Most software ignores this
entirely.

### Edge cases hit
`SB6` event-type rate cards · `SA9` lead-time waiver

---

# PART F — WHEN THINGS GO WRONG

## UC-20 — The venue declines

**Who:** Zainab requests 19 Dec at Gulshan. Owner already has a tentative hold from a repeat family.

He taps **Decline** and must pick a reason:

```
Decline this request
  ( ) Date no longer available
  (•) Held for another enquiry
  ( ) Guest count doesn't suit this venue
  ( ) Outside our service area
  Message (optional): "Sorry, 19 Dec is likely going. 20 Dec is open
                       and I can hold it for you today."
```

Zainab gets: the reason, the venue's message, **the venue's own alternative dates**, and **three
comparable venues free on 19 Dec**. Her hold is released instantly.

**A decline must never be a dead end.** It is the moment the platform earns its fee — by having the
next option ready.

### Edge cases hit
`SC21` decline with alternatives

---

## UC-21 — The venue counter-offers

Same request. Instead of declining, the owner counters:

```
Counter-offer to Zainab
  Original: 19 Dec, Main Hall, Gold, 500 pax     Rs 16,62,728
  Counter:  20 Dec, Main Hall, Gold, 500 pax     Rs 15,44,000
            (20 Dec is Sunday — no Saturday premium)
  Message: "Saturday is nearly gone. Sunday saves you Rs 1.18 lakh
            and I'll include valet free."
```

This creates **Quotation v2**. Zainab sees a side-by-side diff of v1 and v2 and accepts or declines.
Every version is retained — that history is the dispute record.

### Edge cases hit
`SC20` counter-offer · `SA17` quote versioning

### What breaks today
No quotation entity, no versions, no counter mechanism. `orderStage` on `bookingModel` is reaching
for this and is unused.

---

## UC-22 — Rain on an open lawn

**Who:** A Mehndi booked on Gulshan's Lawn — `covered = open`, `rainBackup = none`.

**At booking:** amber disclosure, explicitly acknowledged, stored with a timestamp:
*"This is an open lawn with no covered alternative. In case of rain the event proceeds as-is.
Gulshan Marquee is not liable for weather."*

**At T-2:** pre-event check pulls the forecast. 70% rain →

```
⚠ Rain forecast for 18 Dec (70%)

Your event is on the open Lawn with no covered backup.
  ( ) Proceed as planned
  ( ) Ask Gulshan about moving to Main Hall  — availability + price difference
  ( ) Add a waterproof canopy  Rs 1,20,000  (48h notice required)
```

`getBookingWeather` **already exists** in the controller. It is not wired to a pre-event checklist or
to the space's backup configuration.

### Edge cases hit
`SF7` weather · `SF8` no-backup disclosure

---

## UC-23 — Damage and the deposit

**Who:** Post-event. Rs 1,00,000 deposit held. A chair set and a wall panel damaged during the dhol.

```
DEPOSIT INSPECTION · 20 Dec, 11:00
Inspected by: Gulshan ops + host's brother (present)

  Deposit held                            Rs 1,00,000
  Damaged: 6 banquet chairs   @ 3,500     Rs    21,000   [3 photos]
  Damaged: wall panel, hall left          Rs    18,000   [2 photos]
                                          -----------
  Deducted                                Rs    39,000
  RETURNED                                Rs    61,000    -> by 27 Dec

  [ Accept ]   [ Dispute this ]
```

Disputing opens a `BookingDispute` with the photos already attached as evidence. Deposit return is
held pending resolution, and the venue's payout is gated by `payoutEligibleAt` — which already
exists and already works.

### Edge cases hit
`SE18` deposit return · `SE19` damage dispute · `H12`

---

## UC-24 — Two families race the same peak Saturday

**Who:** Ayesha and Hina both open 19 Dec at Gulshan within the same minute.

```
T+0.0s  Ayesha picks 19 Dec Dinner  -> DateHold created, TTL 15 min
T+0.4s  Hina picks 19 Dec Dinner    -> pg_advisory_xact_lock blocks,
                                       reads the hold, returns:
        "This date is being booked by someone else right now.
         We'll tell you within 15 minutes if it frees up.
         Free at Gulshan: 17 Dec, 20 Dec, 26 Dec"
         [ Notify me if 19 Dec frees up ]

T+9m    Ayesha submits her request   -> hold converts to a booking request
T+9m    Hina notified: "19 Dec has been requested by another family.
                        Gulshan hasn't accepted yet — you can request it
                        as a backup." [ Request as backup ]

T+3h    Gulshan accepts Ayesha       -> Hina: "19 Dec is taken.
                                        Here are 3 venues free that day."
```

**Backup requests** are a real product opportunity: peak Saturdays get multiple families, and the
venue should be able to see a queue rather than losing everyone but the first.

### Edge cases hit
`SC15` hold expiry · `SC16` race · `SA5` alternatives

### What breaks today
The concurrency guard is **already excellent** — advisory lock, `FOR UPDATE`, quota, captcha, with
12/12 real double-bookings documented before the WW-299 fix. What's missing is the *experience*
around losing the race: notify-me, backup queue, alternative venues.

---

# SUMMARY — WHAT THESE 24 CASES DEMAND

| Capability | Cases | Status |
|---|---|---|
| Rate-card resolver with `includesFood` | 01, 02, 03, 18 | **NEW** |
| Menu step: free / priced / hidden | 01, 02, 03 | **NEW** |
| Tax + service + deposit on Review | all | **NEW** |
| Cancellation policy shown pre-payment | 01, 08 | **NEW** |
| Requirements free-text, response-gated | 01, 14, 15 | **NEW** |
| Request-to-book, accept / decline / counter | 01, 20, 21 | **NEW** |
| Quotation versioning | 06, 21 | **NEW** |
| Per-venue bank details + receipt upload | 07 | **NEW** |
| Guarantee, tolerance band, walk-in rate | 09, 10 | **NEW** |
| Headcount lock with consequences shown | 09, 10 | **NEW** |
| Actual count + settlement | 09, 10 | **NEW** |
| Compliance as hard blocks (s.3/4/6) | 11, 12, 13 | **NEW** |
| Child / staff / crew meal rates | 14 | **NEW** |
| Event-type-scoped rate cards | 17, 18, 19 | **NEW** |
| Cross-shape "all-in per head" comparison | 05 | **NEW** |
| Advance transfer credit ledger | 08 | **NEW** |
| Deposit inspection + damage claim | 23 | **NEW** |
| Weather check wired to backup config | 22 | **PARTIAL** — `getBookingWeather` exists |
| Umbrella multi-event | 04 | **PARTIAL** — works, needs combined advance |
| Postponement | 08 | **EXISTS** — best-in-class |
| Concurrency / double-booking guard | 24 | **EXISTS** — excellent |
| `genderMode` ladies-only | 15 | **EXISTS** — never surfaced |
| Payout gating | 23 | **EXISTS** |

---

## Sources

- [The Punjab Marriage Functions Act 2016](http://nasirlawsite.com/laws/pmfa2016.htm) — s.3 fireworks, s.4/s.5 one dish, s.6 10 PM, s.8 penalties
- [Decorium Luxury Marquee](https://decoriumplmarquee.com/) — per-head packages, non-refundable advance, 7-day headcount deadline
- [Best Marquees in Lahore: 2026 Prices & Hidden Costs](https://pakbestfinds.com/best-marquees-in-lahore/) — GST, generator surcharge, kitchen access fee
- [Karachi Banquet Hall Price List 2025 — Evento Race](https://www.eventorace.com/blog/venues/karachi-banquet-hall-prices-2025) — minimum guests, peak premiums
- [Lahore Marriage Hall rates](https://lahorecafe.org/business/lahore-shadi-hall-rates-lahore-marriage-hall-rates-price-pearl-continental/) — hall-rent-only pricing
- [WedMeGood — minimum guarantee](https://www.wedmegood.com/blog/quick-ways-to-calculate-your-minimum-guarantee-to-caterers/) — 80–85% guarantee norm
- [Banquet management pricing — F&B clauses 2026](https://www.meeting-event.com/banquet-management-pricing-the-fb-clauses-that-defend-your-margin-through-2026) — overset and tolerance bands
- [Cvent — Banquet Service Ratios](https://www.cvent.com/en/blog/events/banquet-service-ratios) — staffing by service style
- [One-Dish Policy: Islamabad Crackdown 2026](https://www.pakistantruth.com/one-dish-policy/) — sealing, arrests
- [MarqSuite](https://marquee-management-qzrb.vercel.app/) — inquiry pipeline, booking versions
- [Tripleseat](https://tripleseat.com/industries/wedding-venues/) — BEO, guest portal, proposals
