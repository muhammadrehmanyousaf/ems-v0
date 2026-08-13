# Wedding Wala — Vendor Portal Design Audit

Measured, not eyeballed. Every number below is `getComputedStyle` / `getBoundingClientRect`
read off the live production DOM at **1366×674** (the laptop most Pakistani vendors use)
and **360×720**.

Method: a design-system extractor walks every visible element and counts what the CSS
actually resolves to — type sizes, weights, families, radii, shadows, spacing steps, tap
target heights. Intent in the code is irrelevant; this is what ships.

---

## Baseline: the public marketing site (the bar the portal has to meet)

`https://www.weddingwala.pk/`

| axis | value |
|---|---|
| Display face | **Playfair Display** |
| Body face | **DM Sans** |
| Weights in use | 400 (×255), 500 (×47), 600 (×40) |
| Distinct type sizes | **22** |
| Distinct radii | **11** |

**What is right:** a deliberate display/body pairing. Playfair carries the wedding
register — it is the only thing on the page doing brand work, and it earns its place.

**What is already wrong here:** 22 type sizes and 11 radii is not a scale, it is an
accumulation. A disciplined system is 6–8 sizes and 2–3 radii. Every extra step is a
decision nobody made on purpose.

---

## The portal, measured — 44 modules

`getComputedStyle` across every visible element, at 1366×674.

### Typography — the finding that matters most

| | public site | vendor portal |
|---|---|---|
| Display face | **Playfair Display** | **none** |
| Body face | DM Sans | **Inter** |
| Weights | 400 · 500 · 600 | 400 · 500 · 600 (700 only on home) |

The portal uses **Inter and nothing else** — plus `Noto Nastaliq Urdu` for the اردو toggle
and `ui-monospace` for figures. Both of those are correct and should stay.

**There is no brand typography anywhere in the product.** A vendor moves from a site set in
Playfair to a dashboard set in the default UI sans of every SaaS tool made since 2018.
Nothing tells them they are still inside Wedding Wala. This is the single largest reason
the portal reads as generic: not spacing, not colour — the type has no voice.

### Type scale — actually disciplined

6–12 distinct sizes per screen. That is a real scale, and better than the public site's 22.
Do not "fix" this. The restraint is already there; it is the *character* that is missing.

### Radii — consistent

5 distinct values on 41 of 44 screens (6–7 on chat, reviews, notifications, reports).
This is a system that is holding. Leave it alone.

### Tap targets — the mobile problem

Buttons and links under 36px tall, per screen:

| module | <36px targets |
|---|---|
| Leads | **113** |
| Inventory | **111** |
| Staff | **110** |
| Calendar | **101** |
| Receipts | 82 |
| Expenses · Suppliers | 79 |
| Notifications | 65 |
| Bookings | 59 |
| Customers | 54 |
| Money | 50 |
| Venue-OS spaces | 49 |
| Reviews · Cheques | 43 |

WCAG 2.5.8 sets 24×24 as the floor; Apple and Google both publish 44. A venue owner
checking tonight's bookings on a phone, one-handed, at a shaadi, is the actual use case —
and the densest screens are the worst offenders. This is the highest-value fix in the
document because it is mechanical: raise the icon-button and row-action minimum to 40px
and the count collapses on every screen at once.

### Fold usage — where the work sits

First real content, measured at 674px:

| module | first content top |
|---|---|
| **Home** | **2346** |
| **Reviews** | **1310** |
| **Billing** | **1096** |
| **Suppliers** | **869** |
| Expenses | 701 |
| Money · Receipts | 468 · 465 |
| Bookings · Tax | 341 |
| **Leads · Customers · Inventory · Cheques** | **339 ← the healthy shape** |
| Function sheets | 321 |

Nine modules already land at ~330. That is the proof the target is reachable: it is not a
redesign, it is applying what four screens already do to the five that do not.

### Responsive — a genuine pass

At 360×720 **every route reports `scrollWidth: 345`**. No page-level horizontal scroll
anywhere. Elements flagged wide are inside their own scroll containers — the billing
table's `min-w-[520px]` is correct, a financial table should scroll rather than crush.

This is the part of the system that is already world-class. Say so and protect it.

---

## Direction

### 1. Give the product the brand's voice — one face, used with restraint

Bring **Playfair Display into the portal for page titles only**. Not body, not labels, not
buttons — the `h1` in `PageHeader`, and the figure in a KPI tile. Everything else stays
Inter, because Inter is genuinely the right choice for dense tabular data and Playfair is
not.

This is one line in the header primitive and one in the stat tile, and it is the difference
between "a dashboard" and "Wedding Wala's dashboard". It costs nothing in density and it
inherits a face the vendor has already seen on the public site.

### 2. Raise every tap target to 40px

`Button size="icon"` and the row-action buttons are the entire problem. One change to the
button variants fixes 113 targets on Leads and 110 on Staff simultaneously. Nothing else in
this document has that leverage.

### 3. Give figures their own weight

Money is the content of this product, and it currently renders at the same 400/500 as
labels. Set the numeral in KPI tiles and money columns to 600 and let `ui-monospace` do
what it is already loaded for. A vendor should be able to find "Rs 6,450,452 due" without
reading a word.

### 4. Fix the five screens that hide their own content

Home, Reviews, Billing, Suppliers, Expenses. The pattern that works on the other nine is
already in the codebase — header row, KPI strip, then content. Apply it.

### 5. What NOT to touch

- **The 360px behaviour.** It is correct. Any change here risks the sticky header.
- **The radius system.** Five values, holding across 41 screens.
- **The type scale.** 6–12 steps is disciplined; adding sizes would make it worse.
- **Inter for data.** It is the right face for tables. The gap is display, not body.

---

## Priority

| # | change | effort | reach |
|---|---|---|---|
| 1 | 40px minimum tap target | one variant file | **every screen** |
| 2 | Playfair on `h1` + KPI figure | two files | **every screen** |
| 3 | Numerals to 600 | one primitive | every money screen |
| 4 | Fold fix on the five worst | five files | the screens vendors open most |

One through three are three files and reach all 44 modules. Start there.
