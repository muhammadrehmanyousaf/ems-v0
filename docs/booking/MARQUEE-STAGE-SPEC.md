# Marquee Stage — final implementation spec for `/[id]/booking`

**Repo:** `C:\Projects\ems-v0` (Next 14.2 App Router, React 18, Tailwind 3.4, framer-motion, radix, vaul, lucide, canvas-confetti — nothing new is added).
**Route:** `app/(main)/(booking)/[id]/booking/page.tsx` → `components/booking/booking-form.tsx`.
**Test venue:** business 3358, Rehman Grand Marquee (request mode, 10 % advance, 4 packages incl. a `test` one, 3 menus, one slot template, hall picker, guests 250–900).
**Status of this document:** source of truth. The shell and every step can be built in parallel from it. Where it says *verify*, the engineer confirms against the code before relying on it; where it says *owner sign-off*, the owner decides (list in §14).

The concept is **Marquee Stage** (the panel's unanimous winner) with the grafts the three judges named and a fix for every item in their "everyone missed" lists. What changed from the Marquee Stage draft, in one paragraph: the Stage photograph is a framed band with **all text on solid charcoal** (the venue's images are 480 px wide and two are not venue photographs — ivory over a photo was never going to pass contrast); the photograph is **still** (no 8-second crossfade), swapping only as information; the **phone scrolls the document** with a fixed action bar (the safer iOS path) and gets the venue photo in its header; the breadcrumb is **sentence-case 12 px text** so it fits; advisories are **inline lines bounded to two, then a "+N notes" popover**; the money block shows the venue's **starting price** before a package and a **combined total** for multi-function bookings; the request-sent screen is a **status timeline**; the multi-event, signed-out, 401, unbookable-vendor, print, hold-expiry, tablet and cramped-laptop states are designed, not listed as risks.

---

## 0. What is wrong today (the baselines, so nobody re-argues it)

| Screenshot | What the customer sees |
|---|---|
| `desk-viewport-s2.png` | 72 px marketing nav → 110 px identity + 6-node stepper card → a cream card whose calendar runs off the fold; hall select and one slot at the right; the service-location picker starts at y≈680; Back/Continue are `lg:sticky` at the bottom of a card that continues for ~1,000 px; then the Bridal Letter and a ~900 px footer (`f-desk-s2.png` is 3,212 px tall). |
| `desk-viewport-s3…s6.png` | Every step is the same cream card; the venue is a 40 px circle; the right column is a 360 px sticky "Order summary" that shows **Rs 350,000 VENUE** before a package and **Rs 760,000 PACKAGE** after (the venue's starting price is a placeholder, not a line item). Review shows **Guests 1 guest** because `guestCount` initialises to 1. |
| `mob-viewport-s2.png` | 52 px nav → 150 px identity card → 190 px heading → a calendar with no slot, no hall, no guests, no Continue; the summary bar appears only once a price exists. |
| `venue-page-1440.png` | The page the customer came from is a full-bleed photograph with a 64 px Playfair title and "Starting from Rs 350,000". The booking page throws that away. |

The fix is a different container, not a restyle.

---

## 1. Concept in one screen

```
1440 × 900
┌────────────── STAGE 560 ───────────────┬──────────────────── DESK 880 ─────────────────────┐
│ ▓ top band 72 (solid charcoal)         │ top bar 72: Event Selection › Date & Time › …   (×) │
│   ✦ Wedding Wala        ← Back to venue│ [tabs row 48 — only when events > 1]                │
│ ┌────────────────────────────────────┐ ├──────────────────────────────────────────────────────┤
│ │                                    │ │ body 740 · overflow-y auto · pad 32/56/32           │
│ │        venue photograph            │ │   eyebrow  STEP 2 OF 6                              │
│ │        (framed band, still)        │ │   h2       When is your event?                      │
│ │                                    │ │   [control strip] [notice rail]                     │
│ └───────── gradient → charcoal ──────┘ │   [calendar 332]      [slot column 396]             │
│ ▓ BOOKING WITH                         │                                                      │
│ ▓ Rehman Grand Marquee                 │                                                      │
│ ▓ ★ 4.3 · Johar Town, Lahore · Venue   │                                                      │
│ ▓ EVENT     Baraat              ✓      │                                                      │
│ ▓ DATE      —                          │                                                      │
│ ▓ TIME      —                          │                                                      │
│ ▓ HALL      —          (7 rows × 36)   │                                                      │
│ ▓ GUESTS    —                          ├──────────────────────────────────────────────────────┤
│ ▓ PACKAGE   —                          │ action bar 88                                        │
│ ▓ MENU      —                          │ ← Back   Nothing is charged until … accepts          │
│ ▓ STARTING PRICE  from Rs 350,000      │                         [ Pick a date to continue ]  │
└────────────────────────────────────────┴──────────────────────────────────────────────────────┘
```

Three objects and nothing else: the **Stage** (venue identity + receipt + progress in one), the **Desk** (one step at a time, scrolls internally), the **action bar** (always on screen). The document does not scroll at ≥ 1024 px width and ≥ 700 px height.

---

## 2. Chrome on the booking route

### 2.1 Removal

`components/public-chrome.tsx` hides Header/Footer/PageTransition for `/user` and `/dashboard`. Add a pattern test:

```ts
const HIDE_CHROME_PATTERNS = [/^\/\d+\/booking(\/|$)/] as const   // /3358/booking only
const hide =
  HIDE_CHROME_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
  HIDE_CHROME_PATTERNS.some((re) => re.test(pathname))
```

Numeric only: `app/(main)/booking/page.tsx` (a legacy "Event Booking" marketing page that mounts `<BookingForm />` with no id) must keep its chrome — and must stop mounting the form (§14, decision 2: replace with `redirect('/venues')`).

`app/(main)/(booking)/[id]/booking/page.tsx` drops the `max-w-[1400px]` container and paddings:

```tsx
return <div className="booking-shell bg-bridal-ivory"><BookingForm /></div>
```

### 2.2 What replaces it

| Element | Where | Size | Content |
|---|---|---|---|
| Wordmark | Stage top band, left | 32 px mark + 20 px text | `/icon-mark.png` (`unoptimized`, as `components/header.tsx` does) + "Wedding Wala" Playfair italic ivory 20/24. Links to `/`. Guarded by the leave dialog (§6.7). |
| Back to venue | Stage top band, right | 36 px chip, charcoal/85 fill, ivory 12 px caps text | `← Back to venue` (at ≥ 1440: `← Back to Rehman Grand Marquee`, truncated to 220 px). Links to `/[id]`. Guarded by the leave dialog. |
| Breadcrumb | Desk top bar, left | 12 px text | §6.1 |
| Sign in | Desk top bar, right of breadcrumb | ghost 36 px | Only when `!user && !userLoading`: "Sign in" → §10.6 |
| Close | Desk top bar, right | 44 px circle, beige outline | `×` → `/[id]`, guarded by the leave dialog |
| Reassurance | Action bar, centre | 12 px sage `#3F6B43` | request mode: `Nothing is charged until {venue} accepts · You pay the venue directly`; instant mode: `You pay the venue directly · Every payment recorded` (existing rail copy) |
| Legal | Above the action bar, review step only | 11.5 px text-soft, 32 px row | existing review sentence (`By sending this request you agree…`) |

No footer, no newsletter, no nav. Phone chrome in §3.4.

---

## 3. Global layout and pixel budgets

### 3.1 Tiers

| Viewport | Layout | Stage width | Desk padding (sides) | Desk content width | Scroll owner |
|---|---|---|---|---|---|
| ≥ 1440 (`large:`) | split | 560 | 56 | w − 560 − 112 (880 → **768**) | desk body |
| 1280–1439 (`xl:`) | split | 480 | 40 | 1366 → **806**; 1280 → 720 | desk body |
| 1024–1279 (`lg:`) | split | 400 | 40 | 1024 → 544 | desk body; all in-step grids 1 column |
| 768–1023 | stacked | hero band 176 (§3.5) | 32 | w − 64 | document |
| < 768 | phone | header thumb (§3.4) | 16 | 358 | document |
| any width, **height ≤ 820** | density tier (§3.3) | | | | |
| ≥ 1024 width, **height < 700** | release valve (§3.6) | | | | document |

**Rule for every step component:** never use `sm:`/`md:`/`lg:` inside a step. Tailwind measures the viewport, not the desk. Use `xl:` (1280) and `large:` (1440) only, and design the base (no prefix) for a 544 px desk. The `@tailwindcss/container-queries` plugin is **not installed** and is not added.

### 3.2 Desktop 1440 × 900

| Region | x | y | Size | Notes |
|---|---|---|---|---|
| Root | 0 | 0 | 1440 × 900 | `flex h-screen supports-[height:100dvh]:h-[100dvh] overflow-hidden bg-bridal-ivory` |
| **Stage** | 0–560 | 0–900 | 560 × 900 | `relative overflow-hidden bg-bridal-charcoal`, `role="complementary" aria-label="Your booking"` |
| Stage top band | | 0–72 | 72 | solid charcoal; wordmark left (x 32), back chip right (x → 528) |
| Stage photo zone | | 72–420 | 348 | `<img>` object-cover; the bottom 96 px carries a gradient `rgba(44,24,16,0)→1` into the block |
| Stage bottom block | | 420–900 | 480 (1-line name) / 518 (2-line) | solid charcoal, bottom-anchored; §4 |
| **Desk** | 560–1440 | 0–900 | 880 × 900 | `flex flex-col min-w-0` |
| Desk top bar | | 0–72 | 72 | `border-b border-bridal-beige`; breadcrumb left at x 616; Sign in / Close at right |
| Tabs row | | 72–120 | 48 | only `events.length > 1 && globalStep >= 2`; `EventTabs` |
| Desk body | | 72–812 (120–812 with tabs) | **740** (692) | `flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] .bridal-scroll`, `tabIndex={0} role="region" aria-label="Booking step"`, padding 32 top / 56 sides / 32 bottom → content **768 × 676** |
| Action bar | | 812–900 | 88 | `shrink-0 border-t border-bridal-beige bg-bridal-ivory/95 backdrop-blur-sm`, padding 0 56; flex child, never sticky/fixed |

Stage bottom block (1440):

| Row | Height | Running |
|---|---|---|
| pad | 24 | 24 |
| eyebrow `BOOKING WITH` 11/14 gold | 14 | 38 |
| gap | 6 | 44 |
| name 32/38 Playfair italic ivory, 2-line clamp | 38 (76) | 82 (120) |
| gap | 6 | 88 |
| meta 13/18 ivory/80 `★ 4.3 · Johar Town, Lahore · Venue` | 18 | 106 |
| gap | 16 | 122 |
| ledger rows ≤ 7 × 36 (§4.3) | 252 | 374 |
| gap | 16 | 390 |
| money block (§4.4) | 64 (review: 82) | 454 |
| pad | 26 | **480** (2-line name **518**; review **498/536**) |

Photo zone = 900 − 72 − 480 = **348** (of which 96 fades). A photographer (4 rows) gets 456. This is a framed photograph above a charcoal ledger, and that is the intent: every character on the Stage sits on solid `#2C1810`.

### 3.3 Laptop 1366 × 768 (width tier `xl`, density tier active)

Density tier = `@media (max-height: 820px)` applied through CSS variables on `.booking-shell` (one set of numbers, not a second layout):

| Token | ≥ 821 px tall | ≤ 820 px tall |
|---|---|---|
| `--top-bar` (desk) | 72 | 64 |
| `--action-bar` | 88 | 80 |
| `--body-pad-y` | 32 | 24 |
| `--stage-band` | 72 | 64 |
| `--ledger-row` | 36 | 32 |
| `--stage-name` | 32/38 | 28/34 |
| `--cal-cell` | 44 | 40 |
| `--step-title` | 32/38 | 28/34 |
| `--heading-block` | 64 | 60 |
| Continue height | 48 | 44 |

1366 × 768 budget: Stage 480 wide; top band 64; bottom block = 20 + 14 + 4 + 34 + 4 + 18 + 12 + 224 + 12 + 56 + 20 = **418** (2-line name 452) → photo zone 768 − 64 − 418 = **286**. Desk 886: top bar 64, body **624** (580 with a 44 px tabs row), padding 24/40/24 → content **806 × 576**, action bar 80.

### 3.4 Phone 390 × 844 (document scrolls)

```
┌──────────────────────────────────────────┐
│ [photo 44] Rehman Grand Marquee    [pill]│ 64  header, sticky top-0, ivory, hairline
│            Step 2 of 6 · Date & time     │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ 2   progress line (gold-dark fill)
│ [Mehndi ✓][Baraat]                       │ 44  tabs (multi-event only, sticky under header)
│                                          │
│ body — the document scrolls              │ pad 20 / 16 / 96
│                                          │
├──────────────────────────────────────────┤
│ (←)  [ Continue to packages            ] │ 72 + env(safe-area-inset-bottom), fixed bottom-0
└──────────────────────────────────────────┘
```

- Header (64): 44 px venue thumbnail (`images[0]`, Cloudinary `c_thumb,g_auto,w_88,h_88`, radius 4; jaal fallback), name 15/20 Playfair italic truncated (`title` attr carries the full name), second line 11/14 caps `Step 2 of 6 · Date & time`; right: the **ledger pill** (h 36, blush fill, gold-dark 13 px): `Rs 76,000 ▴` once money exists, `Summary ▴` before. Tap → ledger sheet (§4.6).
- Progress line: 2 px, `width = completed / total`, transition 300 ms.
- Body: `padding: 20px 16px 96px`; step h2 26/30; every target ≥ 44 px (cells 46, slot rows 56, chips 44, inputs 48, stepper blocks 44 × 44 square).
- Action bar (72 + safe area): Back 44 px ghost circle at left (on step 1: `←` returns to the venue page via the leave dialog); Continue `h-12 flex-1` with the desktop label's short form (§6.2).
- Sheets (ledger, location picker) are `vaul` drawers (`components/ui/drawer.tsx`), 80 dvh max, internal scroll, focus-trapped, Escape/swipe closes.
- Visible area between the bars: 844 − 66 − 72 = **706 px**. Each step's phone target is ≤ 1.5 screens with the primary decision inside the first 706 px.

### 3.5 Tablet 768–1023 (stacked, document scrolls)

Hero band 176 = photo 120 (object-cover, `w_1024,h_240,c_fill`) + identity strip 56 on solid charcoal (name 18 italic ivory, meta 12, ledger pill at right). Under it the phone chrome rules apply (sticky 44 px counter bar with the breadcrumb, fixed action bar 72, ledger as a sheet). Content width w − 64; the date step uses the 1024-tier single-column composition (§7.2). Not a target viewport; it must not break, and this is enough for it not to.

### 3.6 Release valve — cramped laptops (`≥ 1024` wide and `< 700` tall)

Real 1366 × 768 laptops with a bookmarks bar and the Windows taskbar have ~640–660 px of inner height; at 125 % scaling the same panel is 1093 × 614 CSS px. Locking the shell there clips the action bar. Under `@media (min-width: 1024px) and (max-height: 699px)`:

- root → `height:auto; min-height:100dvh; overflow:visible` (document scrolls);
- Stage → `position:sticky; top:0; height:100dvh` (it stays put while the desk scrolls);
- desk body → `overflow:visible`;
- action bar → `position:sticky; bottom:0` (no ancestor has `overflow:hidden` in this mode, so sticky works).

The QA sweep runs 1366 × 640 to prove it (§13).

### 3.7 Print

`@media print { .booking-shell { height:auto; overflow:visible } .booking-stage, .booking-action-bar, .booking-top-bar { display:none } .booking-body { overflow:visible } }`. `SuccessStep` and `VendorSuccessStep` call `window.print()`; today a `100dvh overflow:hidden` shell would print one truncated page.

---

## 4. The Stage

`components/booking/shell/booking-stage.tsx` (desktop / tablet band) + `booking-ledger.tsx` (rows + money) + `ledger-sheet.tsx` (phone).

### 4.1 Photograph

- Source: `venue.images[0]` — the same image the venue page uses as its hero, so the customer sees continuity. Vendors control quality by ordering their gallery; the portal's cover-image guidance is out of scope (noted in §14).
- URL: `lib/booking/stage-image.ts` → `stageImageUrl(url, { w, h, mode })`. For Cloudinary URLs insert `c_fill,g_auto,w_{w},h_{h},q_auto:good,f_auto,dpr_auto` after `/upload/`; other hosts return the URL untouched. Sizes: 1440 tier 560 × 420; 1280 tier 480 × 360; 1024 tier 400 × 300; tablet band 1024 × 240; phone thumb 88 × 88 (`c_thumb`); sheet band 780 × 280. **No `next/image`** on the Stage (the optimiser quota is exhausted — see `header.tsx`; Cloudinary is the optimiser).
- Loading: the Stage paints solid charcoal + `.bg-mughal-jaal` at 10 % + the name the moment `venue` arrives. The image is preloaded with `new Image()`; the `<img>` is **mounted only after `onload`** with `animate-fade-in` (ends at opacity 1). A failed load never mounts an `<img>`, so nothing sits at opacity 0 for `hidden-content.cjs` to find. `decoding="async"`, `alt=""`.
- Gate: if `naturalWidth < 360` or the aspect is outside 1:2 … 3:1 → do not mount; keep the jaal panel. (The saved test images are 480 × 270; at the 1× band size 560 × 348 they upscale 1.17× — acceptable; retina softness is accepted and documented.)
- Motion: one `animate-ken-burns` (existing 20 s keyframe) on the `<img>`, `will-change: transform`, disabled under `prefers-reduced-motion`. **No timed crossfade.** The image swaps only as information: on the packages step when the selected package has `pkg.images[0]` (600 ms crossfade on two layers, the outgoing layer removed on `transitionend`); back to `images[0]` when deselected. On request-sent/success the photo zone brightens (`filter: brightness(1.08)` 600 ms) and a 1 px gold hairline draws across the top of the bottom block.

### 4.2 Contrast, by construction

All Stage text sits on solid `#2C1810`: gold `#C9956A` labels 5.9:1, ivory `#FDF8F2` 15.8:1, ivory/80 ≈ 11:1, sage `#A8C4A2` 8.5:1, coral `#E8917A` 6.2:1. The back chip over the photograph has a charcoal/85 fill (ivory on it ≥ 4.7:1 over a white photo). Nothing else is placed over the photo. The QA sweep still samples it (§13).

### 4.3 Ledger rows

`<dl aria-live="polite">` under the identity block. Rows are fixed per vendor shape at mount (no row appears or disappears mid-flow — the block must not jump):

| Row | Present when | Value | Empty |
|---|---|---|---|
| Event | `!isDirectBooking` | `events[active].eventType` (+ ` · 1 of 2` when multi) | `—` |
| Date | always | `bookingDate` → `Tue, 6 Oct 2026` | `—` |
| Time | always | `slotText()` | `—` |
| Hall | `subVenueSpaces.length ≥ 1 \|\| spaces.length > 0` | `selectedSubVenueName ?? selectedResourceName`, `Whole venue` once a slot is chosen and none picked | `—` |
| Guests | `needsGuestCount && enforceCapacity` | `guestCount` (the real number — see §14.1) | `—` if 0 |
| Package | `hasPackages` | `selectedPackageObj.name` (+ ` × 2` quantity vendors) | `—` |
| Menu | `hasMenus` | `title` (+ ` · included`) | `—` |
| Units | `sellsByUnit` | `describeUnitQty()` | `—` |

Row anatomy (36 px): label 11/14 caps tracking 0.18em gold left; value 15/20 Playfair italic ivory right, truncated with `title`; 1 px hairline ivory/12 below. Empty value = `—` ivory/45. A row for a step the customer has passed gets a 12 px ✓ before its label. Filled rows are `<button aria-label="Change date: Tue 6 Oct">` → `onJump(stepKey)`. Location and requirements are **not** Stage rows (they are in the sheet and the review echo).

`Re-choose`: when the ledger's package is no longer in the hall-scoped list (a hall change after choosing), the Package row shows the name struck through with a coral `Re-choose` tag and the row jumps to packages.

Fill feedback: value plays `ledger-fill` (opacity 0→1, translateY 4→0, 240 ms, forwards); a gold hairline under the row plays `hairline-draw` (scaleX 0→1, 300 ms, forwards). Money swaps with a 200 ms opacity cross-fade. No rolling numbers.

### 4.4 Money block

`lib/booking/breakdown.ts` — `computeBreakdown({ formData, venue, vendorsDetails, selectedPackageObj, selectedMenuObj, requirements }) → { items, subtotal, downPayment, remaining, startingPrice }`. The body is `mobile-summary-bar.tsx`'s `useMemo` lifted **verbatim** (`composeLineTotal`, `menuChargeFor`, `unitLineFor`, vendor packages, `downPayment` from `downPaymentType`). `startingPrice = Number(venue.minimumPrice) || 0` is returned separately and is **never an item**. `live-pricing-panel.tsx`'s sum (which adds an included menu twice and uses `minimumPrice` as a line) is not carried forward. This answers the base-price question: the starting price is a placeholder shown before a package; a chosen package **replaces** it; nothing is added to it.

| State | Line 1 (label 11 caps gold · value 22/26 Playfair italic ivory) | Line 2 (13/18 ivory/75) |
|---|---|---|
| Nothing priced | `STARTING PRICE` · `from Rs 350,000` | `A package sets your total` |
| Priced, request mode | `TOTAL` · `Rs 760,000` | `Advance after approval · Rs 76,000` |
| Priced, instant mode | `TOTAL` · `Rs 760,000` | `Due now · Rs 76,000 · Remaining at venue Rs 684,000` |
| Review (3 lines) | `TOTAL` · `Rs 760,000` (struck + discounted when an umbrella preview applies) | `Advance after approval · Rs 76,000` / `Remaining at venue · Rs 684,000`; deposit as a third line `Refundable deposit · Rs X (separate)` when `depositTerms` |
| Multi-event | as above for the active function | + `All functions · Rs 1,085,000` = Σ `computeBreakdown(events[i])` |
| Request sent | `ADVANCE` · `Rs 76,000` | `Not yet charged · BK-1234` |

Review totals come from `useReviewTotals()` exported by `review-step.tsx` (total, discountedTotal, discountedDown, projectedSavings, depositAmount, depositTerms) so the Stage and the review body cannot disagree.

### 4.5 Identity states

| State | Stage |
|---|---|
| Loading | charcoal + jaal; eyebrow and label skeletons (sand/20 bars); no image |
| Error / 404 / inactive | charcoal + jaal; name if known; no ledger; the desk carries the message (§10.8) |
| Request sent / success | rows lock with ✓ in a 60 ms stagger; money reads `ADVANCE … Not yet charged · BK-n`; photo brightens; gold hairline |
| Submitted tab (multi-event) viewed later | same locked state for that event |

### 4.6 Phone ledger sheet

Bottom drawer, 80 dvh max: 140 px photo band (`images[0]`, solid-charcoal caption strip 48 px under it with name + ★), then the same `<dl>` at 48 px rows, the money block, the location row (mode + address) and a `Requirements · 3 notes` row, then the legal line, then a 44 px Close. Opened by the header pill; **opens automatically once on arrival at the review step** (sessionStorage `ww-ledger-review-shown:<venueId>`), so the breakdown is never hidden on the final step.

---

## 5. Component contract

### 5.1 What the shell provides

`components/booking/shell/booking-desk.tsx` renders, in order: top bar (breadcrumb, tabs, Sign in, Close) → body scroller → action bar. Inside the body, keyed by `${activeEventIndex}-${stepKey}`:

```tsx
<StepFrame stepKey heading={stepHeading(stepKey, ctx)} direction={dir}>
  {banners}          // DraftResumeBanner / submitError / slotConflict / session banners — §10
  {stepContent}      // the step component, unchanged props
</StepFrame>
```

- **Heading** — `StepFrame` renders the eyebrow (`STEP 2 OF 6 · DATE & TIME`, 11/14 caps gold-dark) and the `<h2 tabIndex={-1}>` (32/38) from `lib/booking/step-copy.ts → stepHeading(stepKey, ctx)`. `ctx` = `{ stepIndex, stepCount, vendorTypeName, isCarRental, isBridalWear, isWeddingStationery, includedInPackage, hasMenus, venueName, eventType, unitLabel, requiresApproval }`. The map holds every title the steps render today (`Choose your package` / `Choose a vehicle` / `Choose your outfit` / `Choose a product`; `Choose your menu` / `Customise menu`; `Review your request` / `Review your booking`; `How many {unitLabel}s do you need?` …) and each step's subtitle. Copy moves; nothing is reworded except where §7 says so.
- **Body region** — the scroller (`ref` exposed as `deskBodyRef`), `data-booking-step={stepKey}` on `StepFrame`.
- **Action bar** — Back (`data-booking-action="back"`), reassurance, Continue (`data-booking-action="continue"`) with the label from §6.2; hidden on request-sent / success / bank-transfer.
- **Context** (`useBookingShell()`): `{ onJump(stepKey), openSheet(node, opts), closeSheet(), scrollBodyTo(el), tier: 'phone'|'tablet'|'desk', deskWidth, announce(text) }`.

### 5.2 What a step must not do

1. No `<h2>`/eyebrow/subtitle of its own (the frame renders them).
2. No `position: sticky` or `position: fixed` (the only sticky allowed is the optional package filter tabs, a direct child of the body scroller).
3. No `sm:`/`md:`/`lg:` classes; `xl:`/`large:` only; base layout for a 544 px desk.
4. No `IntersectionObserver`, `useInView`, `whileInView`, framer `hidden` variants, or any base `opacity-0`. Enter motion = the frame's mount animation + CSS `animate-stagger-fade-up` on list items (`animationDelay = min(i,8) × 30ms`).
5. No `window.scrollTo` / `scrollIntoView` on `window`; use `scrollBodyTo(el)`.
6. No own Back/Continue buttons (the action bar owns them); no own summary/receipt.
7. No overflow-hidden wrappers around content that may hold a sticky child.
8. Keep every input id, `aria-pressed`, `aria-label` and `data-booking-field` hook that exists today (`booking-journey.cjs` relies on `data-booking-field="guestCount"`).

### 5.3 Heights a step may assume

| Tier | Body content box | Fold budget (content that must fit without scrolling) |
|---|---|---|
| 1440 × 900 | 768 × 676 | 676 (628 with tabs) |
| 1366 × 768 | 806 × 576 | 576 (532 with tabs) |
| 1024 × 768 | 544 × 576 | 576, one column |
| Phone | 358 × (document) | primary decision within the first 706 px of the page |

---

## 6. Navigation

### 6.1 Breadcrumb (`step-breadcrumb.tsx`)

`<nav aria-label="Booking steps">` in the desk top bar. 12/16 DM Sans **sentence case** (the uppercase tracked version is ~800 px and does not fit), separators `›` beige. Built from `allDisplaySteps` / `currentDisplayStep` (booking-form L1121–1128): `Event Selection › Date & Time › Packages › Customise Menu › Your Requirements › Review` ≈ 560 px. Completed = gold-dark, clickable (`onJump`); current = charcoal, `aria-current="step"`, 2 px gold underline animating width 0→100 % 200 ms; future = text-soft `aria-disabled`. If the rendered width exceeds the available bar width (desk − 2×pad − Sign in − Close − 24), it collapses to `Step 2 of 6 · Date & Time` (the phone form). Direct-booking vendors have no Event node.

### 6.2 Continue and Back

`onJump(stepKey)`: for `event` → `setGlobalStep(1)`; otherwise `setEvents(prev => prev.map((e,i) => i === activeEventIndex ? { ...e, currentStep: eventStepOrder.findIndex(s => s.key === stepKey) } : e))` — the mechanism the slot-conflict button already uses. Backward jumps only; forward nodes are inert.

Labels are derived from `eventStepOrder[eventStep + 1]?.key` with a `Continue` fallback, so a vendor whose order skips menu or requirements never sees a wrong label:

| Current step | Valid | Invalid (disabled, beige outline, text-soft label; `aria-describedby` → the reason) |
|---|---|---|
| event | `Continue to date` (+ ` · 2 functions`) | `Pick a function to continue` |
| datetime | `Continue to {next}` | `Pick a date to continue` → `Pick a time to continue` → `Enter guests to continue` (when `needsGuestCount && guestCount <= 0`) |
| packages | `Continue to {next}` | `Choose a package to continue` (only when `hasPackages`) |
| vendors / menu / unit / requirements | `Continue to {next}` / `Review booking` | never disabled |
| review, signed in | `Send request · Rs 76,000 advance` (request) / `Pay & confirm · Rs 76,000` (instant); `Sending…` + spinner while submitting | — |
| review, signed out | `Sign in to send request` → §10.6 | — |

`{next}` = the next step's title in lower case (`date`, `packages`, `menu`, `requirements`, `quantity`, `vendors`). Phone short forms: `Continue`, `Send request · Rs 76,000`. Validity is `getIsStepValid()` unchanged; the existing toast on a forced press stays. Back: ghost, `invisible` on step 1 (desktop); on phone step 1 it returns to the venue page.

`handleNext`/`handleBack` (L1081/L1133) replace `window.scrollTo` with `deskBodyRef.current?.scrollTo({ top: 0 })`, then focus the step `<h2>` after `requestAnimationFrame`.

### 6.3 Keyboard

- `Enter` → Continue when valid, only if `document.activeElement` is not an `input`, `textarea`, `select`, `[contenteditable]` or a `button`/`a` (so Enter on a card still toggles the card). `Ctrl/Cmd+Enter` in the requirements textarea continues.
- `Escape` → closes any sheet/popover; otherwise nothing.
- Calendar: `role="grid"`, roving `tabIndex`, arrows move by day/week, `PageUp/PageDown` change month, `Home/End` first/last day of the row, `Enter/Space` pick. Slot column: arrow keys move between rows.
- No digit shortcuts.

### 6.4 URL

`history.replaceState(null, '', '?step=<key>&event=<index>')` on every change. React state is the only source of truth: on mount the params are **never** applied; the URL is corrected to the real state after the first render. Precedence with drafts: pending draft → banner (state stays at step 1, URL rewritten to `?step=event`); no draft → step 1. A hard refresh mid-flow therefore returns to step 1 (with the draft banner for signed-in customers, which is the existing behaviour).

### 6.5 Multi-event

- Tabs row (`event-tabs.tsx`, `role="tablist"`, `role="tab"`, `aria-selected`, 44 px, left-aligned) under the breadcrumb when `events.length > 1 && globalStep >= 2`; phone: 44 px row under the header, horizontal scroll.
- Switching tabs re-keys the frame (enter motion), scrolls the body to top, and the Stage reads `events[i].formData`.
- The old "Multiple events booked" banner is gone; the Event row reads `Baraat · 1 of 2` and the eyebrow reads `STEP 2 OF 6 · BARAAT`.
- Submitted tabs (§10.2) show ✓ (sage) and render that event's request-sent screen.
- The second event's fields start empty except contact and `eventType` (today's `newEvents` copies `base` before any date/package exists — verify at L1085–1098). The ledger shows `—` for that tab; nothing is pre-filled from the first function.

### 6.6 Direct-booking vendors

`isDirectBooking` (car rental, bridal wear, stationery): the existing auto-advance skips step 1; `allDisplaySteps` already omits it; the breadcrumb starts at `Date & Time`; the Stage has no Event row; step 1 Back is `invisible`.

### 6.7 Leaving

- `beforeunload` guard while `globalStep >= 2 && !requestSent[activeEventIndex]` (browser prompt on close/refresh).
- Wordmark, back chip, Close and phone step-1 Back open the existing `AlertDialog` (`components/ui/alert-dialog.tsx`): title `Leave your booking?`; body, signed in: `Your choices are saved as a draft — you can pick up where you left off.`; signed out: `Your choices will be lost.`; actions `Stay` (outline) / `Leave` (primary). No dialog on step 1 with nothing chosen.

---

## 7. Every step

Heights: 1440 × 900 unless marked **(L)** 1366 × 768. "Fold" = the body content box (676 / 576). Widths 768 / 806.

### 7.1 Event selection (`globalStep === 1`) — `event-selection-step.tsx`

| Block | 1440 | (L) |
|---|---|---|
| Heading block (eyebrow 14 + 8 + h2 38 + slack) | 64 | 60 |
| gap | 16 | 16 |
| `WEDDING FUNCTIONS` label 11 caps | 20 | 20 |
| gap | 12 | 12 |
| cards 4 × (768−36)/4 = 183 wide × 96; 8 cards = 2 rows + 12 | 204 | 180 (192 × 84) |
| gap | 24 | 24 |
| `OTHER OCCASIONS` + gap | 32 | 32 |
| 7 cards = 2 rows | 204 | 180 |
| **Total** | **576 ≤ 676** | **524 ≤ 576** |

Draft banner (§10.3) adds 64 + 16 → 656 (L: 604 → 28 px internal scroll, stated).

Card 183 × 96: 40 px icon disc (blush/55, mauve icon → gold-dark disc ivory icon when selected) left; name 15/20 Playfair italic + note 11.5/14 text-soft right; ✓ badge 20 px top-right (`animate-scale-in`); white, 1 px beige, radius 4; selected: cream fill, 1.5 px gold-dark border. `aria-pressed` kept. Vendors with ≤ 4 services: one group, 2 columns of 366 × 96. The in-body "N functions — …" box is removed; the Stage Event row and the Continue label (`Continue to date · 2 functions`) are the live answer (`aria-live` moves to the ledger).

Phone: 2 columns 171 × 88; 8 + 7 cards ≈ 900 px document (1.3 screens); the first six cards are inside 706.

States: empty → disabled label; loading → 8 skeleton cards; error → §10.8.

### 7.2 Date & time (`datetime`) — `date-time-step.tsx` (render L737–1287; logic untouched)

Everything stays: calendar, hall/space select, slot templates or Morning/Afternoon/Evening, service-location picker (4 modes + address + notes), arrangement select, guest stepper (±10, clamp to `activeLimit`), compliance / genderFit / backupPlan / comfort / belowMinimum / holdFailed / isBlocked / hold timer.

**Primary (always visible):** calendar, slot column, control strip (hall · guests · arrangement). **Disclosure:** service location (a row that opens the desk sheet). **Advisory:** the notice rail.

| Block | 1440 | (L) |
|---|---|---|
| Heading block | 64 | 60 |
| gap | 16 | 16 |
| **Control strip** — white, hairline, radius 4, 3 equal cells (256 / 269 wide) divided by hairlines; each = 10.5 caps label over a 15 px value | 64 | 60 |
| gap | 12 | 12 |
| **Notice rail** — line 1 (36 = 28 + 8 pad), budgeted | 36 | 32 |
| gap | 12 | 12 |
| **Calendar** 332 wide (7 × 44 + 6 × 4) ‖ 40 gutter ‖ **Slot column** 396 | 376 | 344 |
| **Total** | **580 ≤ 676** (96 spare = tabs 48 + a second notice line 28 + 20) | **536 ≤ 576** (40 spare = tabs 44; a second notice line then scrolls 32 px — stated) |

Calendar 376 = month header 40 (36 px ‹ › circles, `September 2026` Playfair 20 italic) + weekday row 24 (10 px caps) + 6 rows × (44 + 4) = 288 (`buildMonthGrid` always pads to 42 cells — verified L98) + legend 24 (`● limited` · `Selected: Tue 6 Oct`). (L): 36 + 22 + 264 + 22 = 344, width 304, slot column 462.

Cells: 44 px circular buttons, Playfair 15 numerals; available charcoal (hover cream); partial gold dot (+ `1 left` 9 px under the numeral when `templateDays` has counts); past text-soft/35; blocked line-through, disabled; pending text-soft/40 `cursor-wait`; selected gold-dark fill white numeral; today 1 px gold-dark ring. Hover/focus on a blocked or partial day opens a `role="tooltip"` (radix tooltip, 240 ms) with `blockReason` / `Evening booked`, linked by `aria-describedby`. Existing `aria-label`s kept. Month arrows fade the grid 160 ms; prev disabled before the current month (existing).

Slot column (396): day header 15/20 charcoal — `Today` / `Tomorrow` / `Tuesday, 6 October` (natural language) or `Pick a date to see times` text-soft — 24 → 8 → rows 396 × 56, 8 gaps: label Playfair 15 (`Day`) + `09:00 – 12:00` 12 px text-soft left; right `1 of 1 left` 11 px gold-dark, or the tag `Full` / `Blocked` / `Booked` / `On hold` / `Not offered` (existing states, 10 px caps chip, coral for the first two); selected = gold fill, charcoal text, ✓, right text `Selected`. Periods render the same rows with the period icon. 3 rows = 184 → 16 → **Location row** 56 (`Where will it happen?` 13 px + value `At the venue` / `At our home · House 42, F-7/2` 13 px charcoal + chevron; coral `Address needed` when a mode needs an address and `address.trim().length < 5`; opens the desk sheet) → 16 → hold countdown 24 (only when `isHolding` — dormant today, `createHold` is commented out at L495; keep wired). Column = 24 + 8 + 184 + 16 + 56 + 16 = 304 ≤ 376. Day with no slots: `No times offered on Tue 6 Oct` + up to three `Next free: 9 Oct · 12 Oct` chips computed from the already-loaded `templateDays` (no new API); a chip jumps the calendar.

Control strip cells (absent cells collapse; a photographer has no strip and the calendar row moves up):

| Cell | Shown when | Control |
|---|---|---|
| `HALL` | `subVenueSpaces.length ≥ 1`, else `spaces.length > 0` (mutually exclusive as today L855/L938) | the existing `<select>` (`.bridal-select`, borderless, transparent) with its options unchanged; sub-label `Whole venue / any hall` |
| `GUESTS` | `needsGuestCount && enforceCapacity` | `−` 40 px circle · number input Playfair 18 tabular (`data-booking-field="guestCount"`, `inputMode="numeric"`, `type="number"`, `max = activeLimit.max`) · `+` 40 px circle; ±10 and the typed clamp unchanged; sub-label `From 250 · venue holds 900` / `Main Hall holds 300` from `activeLimit.source` |
| `ARRANGEMENT` | `vendorTypeName === "Wedding venue" \|\| subVenueSpaces.length ≥ 1` | the existing `requestedGenderMode` `<select>`; sub-label `No preference` |

Notice rail: one line per advisory, 28 px, icon 12 + 12 px text, in this priority: `slotConflict`/`holdFailed` (rose), `selectedAvail.isBlocked` (beige, `Vendor not available this day — {reason}`), `complianceWarnings[0]` (amber, `One-dish policy applies — 1 main + 1 dessert`), guests clamp (mauve, `Guests set to 300 — Terrace Lawn holds 300`), `comfortWarning` / `belowMinimum` (mauve), `genderFit` (amber mismatch / sage fits / text-soft unknown), `backupPlan` (sage / amber), hold timer (sage). **At most two lines render inline; the rest collapse into a `+N notes` chip** that opens a radix popover listing all of them. Every collapsed advisory is also rendered visually-hidden inside the chip so screen readers get the full text. `aria-live="polite"`; slot conflict is `assertive` (§10.4).

Desk sheet (`desk-sheet.tsx`, `components/ui/sheet.tsx` right side, 480 px, full desk height, 40 % charcoal scrim, focus-trapped, Escape): header 64 (`Where will the service happen?` + `Optional — leave blank if it happens at the vendor's usual address`); body = the **unchanged** `ServiceLocationPicker` with a new `frame="sheet"` prop (drops its own card wrapper; option cards become 64 px rows; blue/emerald/amber/purple accents become cream fill + gold-dark border; ids `sl-address`, `sl-notes`, `aria-pressed`, the ≥ 5-char inline message and the Suggested chip unchanged); footer `Done` (primary h-11). Phone: the same picker in a bottom drawer.

Interactions: pick day → cell `active:scale-95` 120 ms + gold-dark fill; slot column re-renders in place; Stage Date fills. Pick slot → row morphs to gold + ✓ + `Selected`; Stage Time fills; Continue flips to gold. Hall change → existing re-fetch + guest clamp; the clamp sentence goes to the notice rail (mauve). Guests −/+ → number re-keys with a 200 ms fade.

**Phone order** (document): heading 72 → calendar 358 wide, 46 px cells, 6 px gaps (header 40 + weekdays 24 + 6 × 52 − 6 = 306 + legend 24 = 394) → 12 → Hall row 56 → 12 → slot rows 56 full width (3 = 184) → 12 → Guests row 56 (44 × 44 **square** −/+ blocks, Four Seasons) → 12 → Arrangement row 56 → 12 → Location row 56 → notices inline directly under the control they concern (28 px each). Arithmetic: calendar starts at 66 + 20 + 72 + 16 = 174 and its grid ends at 568; the hall row 580–636; the first slot row 648–704 — inside 706. Total ≈ 1,050 px ≈ 1.5 screens. On day pick: `scrollBodyTo(slotList)` (`block:'nearest'`, a method call, not an observer).

States: no date (`Pick a date to see times`); month pending (cells 40 %, cursor-wait); availability fetch error (`unknown` days stay selectable; rail line `Couldn't check availability — the venue will confirm`); blocked day; sold-out slot rows stay with tags; hold expiry (§10.7); slot conflict (§10.4).

### 7.3 Packages (`packages`) — `package-step.tsx`

| Block | 1440 | (L) |
|---|---|---|
| Heading block + gap | 80 | 76 |
| filter tabs 40 (only when > 4 packages — the live venue has 4, so none) | 0 | 0 |
| grid 2 × 378 wide (12 gap), cards 168 tall; 4 packages = 2 rows + 12 | 348 | 324 (156 tall) |
| **Total** | **428 ≤ 676** | **400 ≤ 576** |

Card 378 × 168: name 19/24 Playfair italic + badge (`Popular` gold fill charcoal text / `{Hall} package` sage — existing rule); price 22/26 Playfair italic gold-dark + unit 10 px caps (`package` / `per head` + `Rs 625,000 for 250 guests` line); guests line 11 px; one row of ≤ 4 feature chips + `+N more` (expands the card in place; `toggleExpand` unchanged); ✓ circle top-right; `aria-pressed`; selected = cream fill + gold-dark border + a 4 px gold left rule scaling `scaleY 0→1` 180 ms (`transform-origin: top`). `pkg.images[0]` → 378 × 120 image header (rows become 288; 4 packages 588 ≤ 676). Quantity stepper (car/bridal/stationery) = 48 px footer inside the selected card (`adjustQty` unchanged). Grid is 1 column below 1280.

Two packages and nothing else: one row of two cards and ivory air; the Stage carries the screen. Empty: dashed `No packages available yet` card, Continue enabled (existing rule).

Phone: cards 358 × 160 stacked, 12 gaps; 4 cards ≈ 680 + heading ≈ 1 screen.

### 7.4 Menu (`menu`) — `menu-selection-step.tsx`

| Block | 1440 | (L) |
|---|---|---|
| Heading block + gap | 80 | 76 |
| included note 44 (only `includedInPackage`) + 12 | 56 | 52 |
| rows 3 × 72 + 2 × 8, selected row expanded by a dish panel ≈ 140 | 372 | 340 (64 rows, 132 panel) |
| gap + footnote 20 | 32 | 32 |
| **Total** | **540 ≤ 676** | **500 ≤ 576** |

Row 72: `RadioGroupItem` 20 px, title 22/28 Playfair italic (`Label` kept), `6 dishes · Chicken Karahi, Beef Pulao, Daal Maash +3` 12 px preview, right `Included` sage caps or `Rs 1,800 /plate` 22 italic gold-dark, `See dishes` 12 px text button (expands without selecting). The selected row expands by default: dish sections as 2 columns (10 px caps labels, 12.5 px dish lines with `live` sage tag and `+Rs/plate` gold-dark, existing), `max-height: 168` with its own `.bridal-scroll` so three rows never leave the fold. `RadioGroup`, `handleMenuSelect` and the price maths unchanged; the framer `container/item` variants (children mount at opacity 0) are replaced by the frame's enter motion + CSS stagger.

Phone: rows 358 × 72; single-column dish panel; ≈ 600 px.

### 7.5 Requirements (`requirements`) — `requirements-step.tsx`

Accordion, one open at a time (`components/ui/collapsible.tsx`), free text always visible.

| Block | 1440 | (L) |
|---|---|---|
| Heading block + gap | 80 | 76 |
| `Quick picks` header 56 + body: 12 chips at 12.5 px, 40 px tall, 8 gaps → 3 rows 136 + 16 pad | 208 | 192 (36 px chips) |
| gap 8 + `Guests & dietary` header 56 (collapsed; sub-label previews values, `3 answered` badge) | 64 | 60 |
| gap 8 + `Setup & furniture` header 56 (collapsed) | 64 | 60 |
| gap 16 + label 24 + textarea 120 (`rows=5`) + counter 24 | 184 | 160 (textarea 100) |
| **Total** | **600 ≤ 676** | **548 ≤ 576** |

Open `Guests & dietary` (replaces the 152 chip body with: 4 number inputs 44 px in a 4-col row 68 + `No beef` row 32 + Allergies 68 + note 20 + 16 pad = 204): 600 − 152 + 204 = **652 ≤ 676** (L: 548 − 136 + 188 = 600 → 24 px scroll, stated). Open `Setup & furniture` (10 inputs in 5 cols = 2 × 68 + 8 + notes 68 + 16 = 228): **676 ≤ 676** (L: 624 → 48 px scroll, stated). Continue is pinned either way. All ids (`req-*`, `setup-*`, `req-freetext`), `inputMode="numeric"`, blank-clears-key unchanged; `showDietary` / `showSetup` simply remove rows. Chips `aria-pressed`, ✓ inside when on. Textarea: `dir="auto"`, `.font-multilingual` (§9), focus grows it to 160 px, counter turns gold-dark past 3,500.

Phone: same accordion; chips wrap; number inputs 2 per row 48 px; textarea 140; ≈ 800 px.

### 7.6 Review (`review`) — `review-step.tsx` (render L460–878)

| Block | 1440 | (L) |
|---|---|---|
| Heading block (left-aligned; no centred sparkle eyebrow) + gap | 80 | 76 |
| **Contact strip** 64: three cells `Full name · Email · Phone`, 10.5 caps label over 14 px value, `break-all` on email | 64 | 60 |
| gap | 12 | 12 |
| **Booking `<dl>`** 2 columns: header 36 + 4 rows × 44 (Vendor/Event date, Time/Guests, Hall/Package, Menu/Location); each row has `Edit ›` → `onJump` | 212 | 192 |
| gap | 12 | 12 |
| `What you've asked for` collapsible row 56 (tags, setup pills, free text verbatim, `dir="auto"`) | 56 | 52 |
| gap | 12 | 12 |
| legal sentence 32 (`By sending this request…` / instant copy) | 32 | 28 |
| **Common case** | **480 ≤ 676** | **444 ≤ 576** |
| + car-rental Pickup/Drop-off (2 × 48 + 12) | +108 | |
| + Optional add-ons: 56 px priced rows, 2 visible + `Show N more` (+ 12) | +140 | |
| + Umbrella row 56 (+ 64 preview when linked) (+ 12) | +132 | |
| + Refundable deposit note 56 (+ 12) | +68 | |
| Everything present | 928 → ~250 px internal scroll; the button and the Stage money block stay on screen | |

The charcoal Total hero block leaves the body: the Stage money block (three lines) and the button label (`Send request · Rs 76,000 advance`) carry the money; the deposit stays outside the total (A17). `contactRows` / `bookingRows` are the existing arrays plus a `stepKey` per booking row for `Edit`. Add-on rows show `+ Rs 25,000` and update the Stage total (`useReviewTotals`). Umbrella select shows the existing preview card; the Stage total strikes through to the discounted figure.

Signed-out contact strip: cells read `—` and a 12 px line under the strip says `Sign in so the venue can reach you` with a link (§10.6).

Submitting: button spinner + `Sending…`; a 24 px line `Checking availability with the venue…` above the action bar bound to `isSubmitting`. Error/conflict: §10.4–10.5.

Phone: contact as 3 × 48 rows, booking rows single column 44, sections stacked ≈ 700 px; the ledger sheet auto-opens once on arrival; Continue `Send request · Rs 76,000`.

### 7.7 Vendors (`vendors`, only `outsideVendorsAllowed !== false`) — `vendor-selection-step.tsx`

Heading 80 → search input 768 × 48 → 12 → category chips 40 → 16 → results 2 columns 378 × 88 (avatar 48, name 15, type + `from Rs` 12, `Add` ghost 36); 4 rows visible = 372 → total 568 ≤ 676 (L: 3 rows visible, scrolls). Selected vendors list above the grid when any; a vendor's package picker opens in the desk sheet. `selectedVendors` / `selectedVendorPackages` writes unchanged. Phone: stacked rows, bottom drawer. Continue never disabled.

### 7.8 Units (`unit`) — `unit-quantity-step.tsx`

Heading 80 → stepper row 120 centred (56 px −/+ circles, Playfair 64 number, `aria-label`s and floor/ceiling states unchanged) → 16 → `takes bookings of 3 or more` line 24 → ceiling line 24 → hairline → `3 generators × Rs 25,000 = Rs 75,000` Playfair 22 → total ≈ 320. The Stage Units row and money fill. Phone: circles 48.

### 7.9 Request sent (request mode) — `request-sent-screen.tsx`, rendered **inside the desk body**

Today `requestSentData` and `bankTransferData` early-return at L1153/L1170 and unmount the form; they become desk-body content so the Stage persists and locks. The action bar is hidden; the screen's own buttons act. Contents unchanged except the four-line list becomes a timeline:

| Block | 1440 |
|---|---|
| eyebrow `REQUEST SENT` 14 + 8 + h2 `Request sent to the venue` 40/44 | 62 |
| gap 12 + explainer (existing copy) 20 | 32 |
| gap 24 + **timeline** 72: three nodes with a 2 px track — `Sent ●` (gold-dark, fills on mount 300 ms) → `Venue reviews · usually within a few hours` (outlined, 1.5 s pulse) → `Confirmed` (outlined) | 96 |
| gap 24 + `What you asked for` card: header 36 + rows × 32 (Venue, Date, Guests, Advance (not yet charged), Reference `BK-1234` with copy-on-tap + `Copied` toast) | 232 |
| gap 16 + WhatsApp outline 48 (when `whatsappNumber`) | 64 |
| gap 12 + `Track this request` primary + `Back to home` outline, 48 | 60 |
| multi-event: `Continue to Baraat →` primary 48 + 12 above Track (§10.2) | (+60) |
| **Total** | **546 (606) ≤ 676** |

Stage: photo brightens, rows lock with ✓, money `ADVANCE Rs 76,000 · Not yet charged · BK-1234`. No confetti (nothing is confirmed). Phone: same stack, one column; the header pill reads `BK-1234`.

### 7.10 Success (instant mode) / bank transfer / vendor success

`SuccessStep`, `VendorSuccessStep` (the `success` step in `eventStepOrder`) and `BankTransferScreen` render in the same desk slot with their existing content; outer padding/centering removed; summary cards capped at 320 px; confetti stays (one burst on mount, skipped under reduced motion) — pay mode only; bank transfer ≈ 900 px scrolls internally. Print rules §3.7.

### 7.11 Unpriced / quote-only / inquiry-only vendors (booking-form L1231–1262)

Render inside the shell: Stage with photo + name + no ledger (`Enquiry` caption); desk body holds the existing card (title, sentence, `Ask for a price` / `Send an enquiry` button opening `VendorInquiryDialog`); no action bar. Not the bare page they get today.

---

## 8. Motion

Rules: enter-only; runs on mount unconditionally; keyframes end at opacity 1 and use `forwards`; no `AnimatePresence` exit; no observer of any kind; `prefers-reduced-motion` → every duration 0 (`motion-safe:` on classes, `useReducedMotion()` in framer).

| Moment | Mechanism | Numbers |
|---|---|---|
| Step change | `StepFrame` keyed `${activeEventIndex}-${stepKey}`; framer `initial={{opacity:0, x:16·dir}} animate={{opacity:1, x:0}}` on an **inner** div (never the scroller); `dir` = +1 forward / −1 back / 0 tab switch | 220 ms ease-out |
| Groups inside a step | CSS `animate-stagger-fade-up`, `animationDelay = min(i,8) × 30ms` | 500 ms forwards (existing) |
| Breadcrumb / progress line | underline width 0→100 %; phone line width | 200 / 300 ms |
| Day cell | `active:scale-95`, background 150 ms | 120 ms |
| Slot row | morph to gold fill + ✓ + `Selected` text swap | 150 ms |
| Card select (event/package/add-on) | ✓ badge `animate-scale-in`; 4 px gold left rule `scaleY 0→1` | 180 ms |
| Chips | fill 150 ms | |
| Ledger row fills | `ledger-fill` (opacity 0→1, translateY 4→0) + `hairline-draw` (scaleX 0→1) | 240 / 300 ms forwards |
| Money change | value span re-keyed, opacity cross-fade | 200 ms |
| Continue validity flip | background beige→gold + label cross-fade | 200 ms |
| Desk sheet / phone drawer | translateX 100 %→0 / translateY 100 %→0, scrim 40 % | 240 / 260 ms; unmount on close |
| Package image swap on the Stage | two layers, opacity cross-fade, outgoing removed on `transitionend` | 600 ms |
| Arrival (request-sent / success) | rows ✓ in 60 ms stagger; photo brightness 1→1.08; gold hairline `hairline-draw`; timeline node 1 fills | 600 ms; confetti pay-mode only |

`tailwind.config.ts` additions: keyframes `ledger-fill`, `hairline-draw`, `pop-select` (scale .94→1); animations with `forwards`. `globals.css`: `.booking-shell` height pair, density variables, release valve, print rules, `.font-multilingual`.

---

## 9. Typography, spacing, colour

**Type scale (the only sizes on the route):**

| Token | Face | Size/line | Used for |
|---|---|---|---|
| T1 | Playfair italic | 32/38 (density 28/34; phone 26/30) | Stage venue name, step title, arrival h2 (40/44) |
| T2 | Playfair italic | 22/26 | money total, package price, menu title, unit line |
| T3 | Playfair italic | 18/24 | guest number, calendar month (20) |
| T4 | Playfair italic | 15/20 | ledger values, card names, slot labels, calendar numerals |
| U1 | DM Sans | 14/20 | body, subtitles, row values |
| U2 | DM Sans | 13/18 | secondary values, strip values, meta |
| U3 | DM Sans | 12/16 | breadcrumb, notices, hints, chips |
| U4 | DM Sans caps 0.18em | 11/14 | labels (gold-dark on ivory, gold on charcoal) |
| U5 | DM Sans caps 0.18em | 10/12 | calendar weekdays, cell sub-labels (9) |

Numbers `tabular-nums` wherever money or counts appear. Nothing bold except button labels and the Stage total (DM Sans 500 max). `.font-multilingual { font-family: "DM Sans", "Noto Nastaliq Urdu", "Urdu Typesetting", "Noto Naskh Arabic", "Segoe UI", system-ui, sans-serif }` on the requirements textarea, its review echo and the ledger sheet's Requirements row, with `dir="auto"` — no webfont is added; system Urdu faces render Urdu, DM Sans renders English.

**Spacing scale:** 4 · 8 · 12 · 16 · 24 · 32 · 40 · 56. **Row heights:** 36 (ledger), 40 (calendar (L), circles), 44 (cells, inputs, chips on phone), 48 (buttons, inputs), 56 (slot rows, disclosure rows, accordion headers), 64 (control strip, contact strip), 72 (menu rows, desk top bar). **Radii:** 4 (cards, buttons, inputs, thumbs), 6 (sheets), full (cells, chips, icon buttons, stepper circles). **Hairlines:** 1 px `bridal-beige` on light; ivory/12 on charcoal. **Shadows:** none, except the existing BridalButton primary.

**Colour rules:** page ivory; desk body is the page (no card around it); cards white; selection = cream fill + gold-dark border + 4 px gold rule; hover blush/45; positive/included/reassurance sage text `#3F6B43`; scarcity/errors coral only when literally true; advisories amber (compliance) and mauve (capacity); gold `#C9956A` never as text on light surfaces (2.5:1) — as fills, rules, and as text only on charcoal (5.9:1).

---

## 10. Where everything lives

### 10.1 Multi-event tabs
Desk top bar second row (48) / phone 44 px row under the header. §6.5.

### 10.2 A submitted function while others remain — **designed, not assumed**
`isSubmitted` is never set to `true` anywhere today (grep: only `isSubmitted: false`), and `requestSentData` is a single value that replaces the whole form. The shell needs, in `booking-form.tsx`:

- `requestSent: Record<number, RequestSentData>` and `bankTransfer: Record<number, BankTransferData>` keyed by event index (replacing the two single states; state shape only — payloads untouched);
- in `handleSubmit` after success (L644/L657): set the entry for `activeEventIndex` **and** `setEvents(prev => prev.map((e,i) => i === activeEventIndex ? { ...e, isSubmitted: true } : e))`;
- render: a tab whose entry exists shows its request-sent/bank-transfer screen in the desk body (Stage locked); other tabs render their current step;
- request-sent screen gets `nextUnsubmittedEvent?: { index, eventType }` → `Continue to Baraat →` calls `setActiveEventIndex(index)`;
- `beforeunload` and the leave dialog consider only unsubmitted events.

*Verify* `handleSubmit` posts one booking per active event (it reads `events[activeEventIndex].formData` — L310) and that `clearDraft()` on success does not wipe the other functions' drafts.

### 10.3 Draft resume banner
First child of the desk body on step 1 (`DraftResumeBanner`, 64 px row, existing logic and `key`). URL precedence §6.4.

### 10.4 Slot conflict (CJ-010)
Rose block, first child of the desk body on whichever step the customer is on (`role="alert" aria-live="assertive"`): message, `Still free on this date:` chips, `Change date or time` (existing handler → datetime). Also mirrored as the first notice-rail line on the date step. Cleared by `handleBack` (existing).

### 10.5 Submit error
Rose banner, first child of the body, focused on appearance (`tabIndex=-1`), existing message/hint/`Dismiss and try again`. If the response status is **401**: title `Your session has expired`, body `Sign in again — your choices are kept on this device`, button `Sign in` → §10.6 (stash first).

### 10.6 Signed-out customers
`getUser()` returns `user = null`; booking-form does not gate on it (it only hides the umbrella picker). The API call goes through `axiosInstance` and will fail without a session. The shell:

- Desk top bar: `Sign in` ghost link when `!user && !userLoading`.
- Review: contact cells `—` + `Sign in so the venue can reach you`; Continue label `Sign in to send request`.
- On that press (or the 401 button): write `sessionStorage['ww-booking-guest:<venueId>'] = { formData, events, globalStep, activeEventIndex, requirements, savedAt }`, then `router.push('/login?next=/<id>/booking')` (*verify* the sign-in path in `components/header.tsx`).
- On mount with `user` present and a stash: restore through the same `DraftResumeBanner` path (title `Welcome back — continue your booking`), then delete the stash.
- `isStepValid`, payloads and `handleSubmit` are unchanged; whether anonymous submission should work at all is §14.3.

### 10.7 Hold expiry
The watcher (L231–253) resets `currentStep` to 0 and clears the date on expiry (dormant today, kept). The shell reacts through state: the ledger Date/Time rows revert to `—`, the breadcrumb jumps to Date & Time, the frame re-enters with `dir = −1`, and the notice rail shows a rose line `Your slot hold expired — pick a date again` in addition to the existing toast.

### 10.8 Venue not bookable
- Fetch 404 / missing business: Stage jaal + no name; desk body card `This vendor isn't on Wedding Wala any more` + `Browse venues` (primary → `/venues`); no action bar.
- Inactive / paused vendor: same card, `{name} isn't taking bookings right now` (*verify* the field on the business row — `isActive` / `status` — in `lib/types.ts`).
- Other errors: the existing `Something went wrong` + `Refresh page` card inside the desk.
- Mode change mid-session: on entering review the shell re-fetches `GET api/v1/businesses/{id}` (same call as mount, same setter); `requiresVendorApproval(venue)` is read at render, so the button label, reassurance and Stage copy follow; if the venue became unbookable, the not-bookable card replaces the review body.

### 10.9 Compliance and advisories
Date step notice rail (§7.2). The one-dish sentence is repeated as the menu step's subtitle when present (existing copy).

### 10.10 Long and bilingual names
Stage name clamps to 2 lines (the block reserves 76 px); phone header truncates to one line with `title`; the back chip drops the name below 1440; the breadcrumb collapses to the counter when it does not fit (§6.1).

### 10.11 Images that never arrive
Charcoal + jaal + name is the designed resting state, not an error. LCP is the Stage `<img>` once mounted; `fetchpriority="high"` on it. Server-side `<link rel="preload">` from `page.tsx` would need a server fetch of the business and is Phase 2 (§14).

### 10.12 Analytics
Fire `booking_step_view { step, event_index, vendor_type }` and `booking_submit { mode }` on the existing `window.dataLayer` if present; add no scripts (GA already costs two-thirds of the route's blocking time).

---

## 11. Accessibility checklist

- [ ] Stage `role="complementary" aria-label="Your booking"`; photo `alt=""`; ledger `<dl aria-live="polite">`; filled rows are buttons with `aria-label="Change {row}: {value}"`.
- [ ] Desk body `role="region" aria-label="Booking step" tabIndex=0`; step `<h2 tabIndex=-1>` focused after each transition (rAF); the ledger's live region stays polite so it does not talk over the heading.
- [ ] Breadcrumb `nav aria-label="Booking steps"`, `aria-current="step"`, future nodes `aria-disabled`; tabs `role=tablist/tab aria-selected`.
- [ ] Every toggle keeps `aria-pressed` (event cards, packages, slot rows, chips, location modes, add-ons); menus keep `RadioGroup`; selects stay native; inputs keep ids/labels; guest input keeps `inputMode="numeric"` and `data-booking-field`.
- [ ] Calendar `role="grid"`, roving tabindex, full-date `aria-label`s, disabled semantics, tooltip via `aria-describedby`.
- [ ] Continue: `disabled` + visible reason + `aria-describedby` pointing at the reason; the forced-press toast stays.
- [ ] Live regions: ledger polite; slot conflict assertive; submit error focused; notice rail polite with collapsed advisories visually hidden inside the `+N notes` chip.
- [ ] Sheets/drawers: `role="dialog"`, focus trap, Escape, focus returns to the opener; leave dialog is an `AlertDialog`.
- [ ] Focus ring `focus-visible:ring-2 ring-bridal-gold-dark ring-offset-2 ring-offset-bridal-ivory` on ivory; `ring-bridal-gold ring-offset-bridal-charcoal` on the Stage.
- [ ] Contrast: all Stage text on solid charcoal (gold 5.9:1, ivory 15.8:1); gold-dark/text-soft/text-label on ivory ≥ 4.5:1; gold only as fill on light surfaces; disabled Continue label ≥ 3:1.
- [ ] Touch: every phone target ≥ 44 px (cells 46, rows 56, chips 44, stepper 44 × 44, inputs 48); action bar clears `env(safe-area-inset-bottom)`.
- [ ] `dir="auto"` + `.font-multilingual` on the requirements textarea and its echoes.
- [ ] Reduced motion honoured on every keyframe, framer transition and confetti.

---

## 12. Implementation map

### 12.1 New files

| File | Responsibility |
|---|---|
| `components/booking/shell/booking-stage.tsx` | Stage (desktop) and hero band (tablet): top band (wordmark, back chip), photo layers (Cloudinary URL, preload-then-mount, gate, Ken Burns, package-image swap), identity block, `<BookingLedger/>`, locked/enquiry/loading variants |
| `components/booking/shell/booking-ledger.tsx` | `<dl>` rows from vendor shape + `activeFormData`, `Re-choose`, fill animations, click-to-jump, money block (all states incl. multi-event sum) |
| `components/booking/shell/ledger-sheet.tsx` | phone drawer: photo band, rows, money, location + requirements rows, legal, auto-open on review |
| `components/booking/shell/booking-desk.tsx` | top bar (breadcrumb, tabs, Sign in, Close), body scroller (`deskBodyRef`), action bar slot, sheet portal, `useBookingShell()` context |
| `components/booking/shell/step-frame.tsx` | eyebrow + h2 from `step-copy`, enter motion on an inner div, `data-booking-step`, focus + announce |
| `components/booking/shell/step-breadcrumb.tsx` | sentence-case breadcrumb with collapse rule; phone counter + progress line |
| `components/booking/shell/action-bar.tsx` | Back / reassurance / Continue with labels, reasons, `aria-describedby`, submitting line; phone variant |
| `components/booking/shell/desk-sheet.tsx` | right sheet (desktop) / drawer (phone) wrapper over `components/ui/sheet.tsx` + `drawer.tsx` |
| `components/booking/shell/notice-rail.tsx` | bounded advisory lines + `+N notes` popover (radix), priority order, visually-hidden copies |
| `components/booking/shell/phone-header.tsx` | 64 px header: thumb, name/counter, ledger pill, progress line |
| `components/booking/shell/leave-dialog.tsx` | `AlertDialog` + `beforeunload` hook |
| `lib/booking/breakdown.ts` | `computeBreakdown()` lifted from `mobile-summary-bar.tsx`; `startingPrice` separate |
| `lib/booking/step-copy.ts` | `stepHeading(stepKey, ctx)` — every title/subtitle/eyebrow; `continueLabel(nextKey, …)`; `disabledReason(stepKey, form)` |
| `lib/booking/stage-image.ts` | `stageImageUrl()` Cloudinary transforms + gate helper |
| `lib/booking/guest-stash.ts` | sessionStorage stash/restore for signed-out customers |

### 12.2 Edits

| File | Change |
|---|---|
| `components/public-chrome.tsx` | add `HIDE_CHROME_PATTERNS` (§2.1) |
| `app/(main)/(booking)/[id]/booking/page.tsx` | drop container/padding; `.booking-shell` wrapper |
| `app/(main)/booking/page.tsx` | `redirect('/venues')` (§14.2); grep for links to `/booking` first |
| `components/booking/booking-form.tsx` | render tree L1274–1626 → `<BookingStage/>` + `<BookingDesk/>`; early returns L1153/L1170 become desk content keyed by event (§10.2); `requestSent`/`bankTransfer` maps + `isSubmitted: true`; `onJump`; `window.scrollTo` → `deskBodyRef`; URL mirror; `?next` stash/restore; 401 handling; venue re-fetch on review; not-bookable branch; unpriced branch inside the shell; loading/error inside the shell; drop `BookingTopBar`, `LivePricingPanel`, `MobileSummaryBar`, the multi-event banner, the sticky footer. `eventStepOrder`, `getIsStepValid`, `handleSubmit`'s payload, `useBookingDraft` untouched. |
| `components/booking/steps-v2/date-time-step.tsx` | render L737–1287 → control strip, notice-rail feed, 44 px calendar + tooltip + `Next free` chips, slot column with natural-language header and `Selected` morph, location row + desk sheet, phone order; remove its h2; no `lg:`; all hooks/handlers/ids unchanged |
| `components/booking/service-location-picker.tsx` | `frame?: 'card' \| 'sheet'` prop; bridal accents; fields unchanged |
| `components/booking/steps/event-selection-step.tsx` | 183 × 96 horizontal cards, 4 columns (`xl:`/`large:`), remove heading + summary box |
| `components/booking/steps-v2/package-step.tsx` | 168 px cards in a 2-col grid at ≥ 1280 (base 1 col), image header, filter tabs > 4, gold rule; remove heading; no `lg:` |
| `components/booking/steps/menu-selection-step.tsx` | 72 px rows + capped dish panel; CSS stagger instead of framer hidden variants; remove heading |
| `components/booking/steps/requirements-step.tsx` | accordion with preview headers and counts; textarea `dir="auto"` + `.font-multilingual`; remove heading and framer hidden variants |
| `components/booking/steps-v2/review-step.tsx` | left-aligned; contact strip; 2-col `<dl>` with `Edit` (`onEdit(stepKey)` prop); add-ons rows; Total block removed; export `useReviewTotals()`; signed-out contact copy; `dir="auto"` echo |
| `components/booking/steps/request-sent-screen.tsx` | timeline, copy-on-tap reference, `nextUnsubmittedEvent` prop; outer padding removed |
| `components/booking/steps/success-step.tsx`, `vendor-success-step.tsx`, `bank-transfer-screen.tsx` | outer padding/centering removed; cards capped; confetti unchanged |
| `components/booking/steps/vendor-selection-step.tsx`, `unit-quantity-step.tsx` | remove headings; 2-col results / centred stepper; sheet for vendor packages |
| `components/booking/ui/event-tabs.tsx` | `role=tablist/tab`, 44 px, left-aligned; sage ✓ for `isSubmitted` |
| `components/booking/ui/booking-rail.tsx`, `live-pricing-panel.tsx`, `mobile-summary-bar.tsx` | **delete** after the shell ships (only `booking-form.tsx` imports them — verified); the breakdown maths moves to `lib/booking/breakdown.ts` first |
| `tailwind.config.ts` | keyframes `ledger-fill`, `hairline-draw`, `pop-select` (+ animations, `forwards`) |
| `app/globals.css` | `.booking-shell` (height pair, density variables, release valve), print rules, `.font-multilingual`, motion-safe guards |
| `scripts/qa/booking-journey.cjs` | extend per §13 (new viewports, assertions, vendor types) |

### 12.3 Order of work and parallel lanes

1. **Lane A (shell):** `public-chrome`, `page.tsx`, `breakdown.ts`, `step-copy.ts`, `stage-image.ts`, then `booking-stage` / `booking-ledger` / `booking-desk` / `step-frame` / `action-bar` / `step-breadcrumb` / `desk-sheet` / `notice-rail` / `phone-header` / `ledger-sheet` / `leave-dialog`, then the `booking-form.tsx` render swap and the §10 states.
2. **Lane B (date step):** `date-time-step.tsx` + `service-location-picker.tsx` against the contract in §5 and the budgets in §7.2, using a stub frame with a 768 × 676 box until Lane A lands.
3. **Lane C (other steps):** event, packages, menu, requirements, review (+ `useReviewTotals`), request-sent, success, vendors, unit — each against §5 and its §7 table.
4. **Lane D (QA):** extend `booking-journey.cjs`; run it against Lane A + B + C on localhost.

Lanes B and C need only §5 and their §7 entry; Lane A needs everything else.

---

## 13. Verification checklist (headed Playwright on localhost, per the repo's verify-by-looking rule)

Viewports: **1440 × 900, 1366 × 768, 1366 × 640 (release valve), 1024 × 768, 768 × 1024, 390 × 844.** Vendors: 3358 (marquee), a photographer, a car rental, a per-unit vendor, an unpriced vendor, plus a two-function booking on 3358.

For every step of every vendor at every viewport:
- [ ] `document.scrollingElement.scrollHeight === window.innerHeight` at ≥ 1024 wide and ≥ 700 tall (the document does not scroll); on phone/tablet/valve the page scrolls and the action bar's rect is inside the viewport.
- [ ] `[data-booking-action="continue"]` rect is inside the viewport; on review the Stage money block (or the phone pill) is visible in the same frame.
- [ ] The primary control (cards / calendar + first slot row / package cards / menu rows / textarea / booking rows) is inside the viewport on arrival.
- [ ] Every input id from §7 exists in the DOM (`req-*`, `setup-*`, `req-freetext`, `sl-address`, `sl-notes`, the hall/arrangement selects, `data-booking-field="guestCount"`).
- [ ] No horizontal overflow (`document.documentElement.scrollWidth === innerWidth`).
- [ ] `scripts/qa/hidden-content.cjs` reports zero — nothing rests at opacity 0.
- [ ] Screenshot every step; a person looks at them.

Specific checks:
- [ ] Stage text contrast measured with the live-contrast method on the ledger region and the back chip over the brightest venue image available (expect ≥ 4.5:1 for 11 px labels, ≥ 3:1 for the 32 px name).
- [ ] Breadcrumb fits at 1366 with the real step titles; collapses to the counter at 1024.
- [ ] Multi-event: submit function 1 → request-sent with `Continue to Baraat →`; tab 1 shows ✓ and its locked screen; tab 2 completes and submits; `All functions` total is the sum.
- [ ] Signed-out: review shows the sign-in door; the stash restores after sign-in; a forced 401 shows the session banner.
- [ ] Draft banner precedence over `?step=`; hard refresh mid-flow returns to step 1 with the banner.
- [ ] Leave dialog on Close/back chip/wordmark at step ≥ 2; `beforeunload` prompt on tab close.
- [ ] Hall change after choosing a package flags `Re-choose`.
- [ ] Package with images swaps the Stage photograph and restores it on deselect.
- [ ] iPhone (real device): guest input and requirements textarea with the keyboard open — the action bar and the focused field are both reachable; the ledger sheet opens once on review.
- [ ] Print preview on the success screen shows the summary, not a clipped shell.
- [ ] `tsc` baseline stays at 0; the three retired files are deleted, not orphaned.

---

## 14. Decisions for the owner (the design works either way; the default is recommended)

1. **Guest count default.** `guestCount` initialises to `1` (booking-form L62, and per-event at L1094). The strip, ledger and review will show the real number, so an untouched booking reads `1` against `From 250` with the mauve below-minimum note. **Recommended:** initialise to `venue.minCapacity` when `needsGuestCount && enforceCapacity` — a one-line default that changes what an untouched payload sends, hence sign-off.
2. **`/booking` marketing page.** `app/(main)/booking/page.tsx` mounts `BookingForm` with no venue inside the marketing chrome and would render the new shell under the 72 px header. **Recommended:** replace with `redirect('/venues')` after confirming no inbound links.
3. **Anonymous booking.** Today a signed-out customer can walk to review and the submit fails at the API. **Recommended:** keep the API as is and show the sign-in door (§10.6). If anonymous submission is meant to work, a contact-details form would be a new field set and is out of this spec.
4. **Cover-image quality.** The Stage upscales sub-1200 px covers by up to ~1.2×. **Recommended (Phase 2, portal):** warn vendors when the first gallery image is under 1200 px wide or not landscape.
5. **Server-side image preload (Phase 2).** `page.tsx` could fetch the business server-side to emit `<link rel="preload">` for the Stage image; skipped now because public pages are ISR-cached and the client fetch already exists.

---

## Appendix A — data hooks kept for QA

`[data-booking-step="<key>"]` on the frame · `[data-booking-action="continue"|"back"]` · `[data-booking-field="guestCount"]` · `[data-booking-ledger-row="<row>"]` (new) · `[data-booking-money]` (new).

## Appendix B — copy table

| Key | Copy |
|---|---|
| Stage eyebrow | `BOOKING WITH` |
| Money empty | `STARTING PRICE · from Rs {minimumPrice}` / `A package sets your total` |
| Money request | `TOTAL · Rs {subtotal}` / `Advance after approval · Rs {downPayment}` |
| Money instant | `TOTAL · Rs {subtotal}` / `Due now · Rs {downPayment} · Remaining at venue Rs {remaining}` |
| Money sent | `ADVANCE · Rs {downPayment}` / `Not yet charged · BK-{id}` |
| Reassurance request | `Nothing is charged until {venue} accepts · You pay the venue directly` |
| Reassurance instant | `You pay the venue directly · Every payment recorded` |
| Continue reasons | `Pick a function to continue` · `Pick a date to continue` · `Pick a time to continue` · `Enter guests to continue` · `Choose a package to continue` |
| Slot header | `Today` / `Tomorrow` / `{Weekday}, {d} {Month}` / `Pick a date to see times` |
| No slots | `No times offered on {Tue 6 Oct}` + `Next free: {d} {Mon}` chips |
| Location row | `Where will it happen?` · `At the venue` / `{mode} · {address}` / `Address needed` |
| Leave dialog | `Leave your booking?` · `Your choices are saved as a draft — you can pick up where you left off.` / `Your choices will be lost.` · `Stay` / `Leave` |
| Session banner | `Your session has expired` · `Sign in again — your choices are kept on this device` · `Sign in` |
| Signed-out review | `Sign in so the venue can reach you` · `Sign in to send request` |
| Not bookable | `This vendor isn't on Wedding Wala any more` / `{name} isn't taking bookings right now` · `Browse venues` |
| Timeline | `Sent` · `Venue reviews · usually within a few hours` · `Confirmed` |
| Hold expired | `Your slot hold expired — pick a date again` |
| Re-choose | `Re-choose` |
