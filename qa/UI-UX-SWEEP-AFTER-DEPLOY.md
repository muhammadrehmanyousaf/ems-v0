# 44-module sweep — after the design deploy

Re-run of `UI-UX-DESIGN-AUDIT.md` against production after PRs #208 and #209 shipped.
Same instrument: `getComputedStyle` / `getBoundingClientRect` on the live authenticated
DOM at **1366×674**, and **360×720 with `pointer: coarse` emulated via CDP**.

52 routes measured on desktop, 18 on mobile. Nothing here is inferred from code.

---

## 1. Brand typography — shipped and working

`h1` resolves to `__Playfair_Display_0b25ea` on **42 of 52** routes. Before the deploy it
was `__Inter_8b3a0b` on every one.

The 10 that still render in Inter:

| route | why |
|---|---|
| `/dashboard/businesses` `/claims` `/revenue` `/roles` `/users` `/vendors` | render an **"Admin only"** gate, not a page — no `PageHeader`. Correct. |
| `/dashboard/availability` | own bespoke header |
| `/dashboard/chat` | own bespoke header |
| `/dashboard/reports` | own bespoke header |
| `/dashboard/cancellation-policy` | own bespoke header |

**Finding (new, open).** Four real vendor screens bypass `PageHeader` and therefore miss
the brand face while every screen around them has it. That is more visible than having no
Playfair at all, because it now reads as a bug rather than a style. Fix is to route those
four through `PageHeader`.

## 2. Fold — the largest measured movement

"First real content below the page title", 1366×674:

| module | before | after |
|---|---|---|
| Home | 2346 | **180** |
| Reviews | 1310 | **275** |
| Billing | 1096 | **140** |
| Suppliers | 869 | **184** |
| Expenses | 701 | **176** |

Every module now lands between **130 and 386**, against a 674px viewport. The worst screen
in the product is `/dashboard/settings` at 386 and `/dashboard/reliability` at 367 — both
still comfortably above the fold.

Caveat on comparability: the old numbers used "top of the first `<table>`", which returns
a zeroed rect for a hidden table and picked up off-screen tables (`/dashboard` reports
`firstTable: 4939` under that metric today). The new metric is "first visible block in
`<main>` carrying real text, below the title". The *before* column is the audit's original
figure; treat the pairs as directional, not as arithmetic on one metric.

## 3. Money weight — works where `MoneyCell` is used

Money renders at **600** on the KPI figures and **500** in table columns, with
`font-variant-numeric: tabular-nums`, on money, receivables, receipts, payments, pdcs, tax,
suppliers, inventory, today.

**Finding (new, open).** `/dashboard/staff` renders pay as weight **400** — strings like
`Rs 1,500 / day` are composed in the component rather than passed through `MoneyCell`, so
they miss the treatment entirely. `/dashboard/reports` renders **700**, and
`/dashboard/venue-os` mixes **600 and 400** on the same screen. The primitive is right; its
adoption is uneven.

## 4. Touch targets — the fix is inert, and this is the headline

At 360×720 with `pointer: coarse` confirmed matching, on **all 18** mobile routes:

```
touch40RuleApplies: false
```

The class is applied — 51 elements on Inventory, 14 on Venue-OS, 7 on Leads — and matches
**no rule**. `::after` resolves to `content: none`, `min-height: 0px`.

Cause: the app has two Tailwind entries. `app/globals.css` serves marketing and auth;
`app/styles/dashboard-styles.css` serves the portal, and the dashboard layout never imports
`globals.css`. The rule was written in `globals.css`, so it reaches everything except the
44 modules it was written for.

Current effective under-40px counts (**pre-fix**, the number the fix has to move):

| module | interactive | <36px box | <40px effective |
|---|---|---|---|
| Calendar | 258 | 12 | **113** |
| Notifications | 84 | **64** | **66** |
| Venue-OS | 86 | 26 | **62** |
| Inventory | 141 | 6 | **58** |
| Home | 102 | 14 | **53** |
| Money | 208 | 40 | 43 |
| Bookings | 95 | 22 | 38 |
| Reviews | 60 | 25 | 27 |
| Suppliers | 68 | 16 | 20 |
| Expenses | 60 | 15 | 19 |
| Leads | 211 | 11 | 15 |
| Staff | 102 | 9 | 13 |
| Customers · Receipts · PDCs · Tax | — | 6 | 10 |
| Today · Billing | — | 5–6 | 8 |

These do not line up with the original audit's column (Leads 113, Inventory 111, Staff 110).
The original figures are not reproducible from the audit file — the selector set is not
recorded there — so I am **not** claiming an improvement on this axis. Treat the table
above as the new baseline, measured with a method that is written down.

**Notifications is now the worst screen in the product**: 64 of 84 controls under 36px, and
it is a list a vendor taps through one-handed.

## 5. Responsive — still clean

All 18 mobile routes report `scrollWidth: 360` against a 360px viewport. **No page-level
horizontal scroll anywhere.** This was the strongest part of the system before and the
design work did not damage it.

## 6. Type scale and radii — holding

5–11 distinct type sizes per screen (median 6). 3–6 distinct radii (median 5). Unchanged
and disciplined. Do not touch.

---

## Open after this sweep

1. **Touch-target rule never reaches the portal.** Fixed on branch
   `fix/touch-target-reaches-the-portal` — utility moved into `tailwind.config.ts`, which
   both entries share; verified present in all three built bundles. **Not deployed**, so
   the counts above stand until it is.
2. **Four screens bypass `PageHeader`** and miss the brand face: availability, chat,
   reports, cancellation-policy.
3. **`MoneyCell` adoption is uneven** — staff pay renders 400, reports 700, venue-os mixes.
4. **Notifications** — 64 undersized controls, the densest tap surface in the product.
