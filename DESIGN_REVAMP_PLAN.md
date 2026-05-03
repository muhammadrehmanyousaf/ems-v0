# Bridal-Grade Design Revamp — Master Plan

> Source of truth for the redesign. Every change must respect this brief.
> Brief reference: `Pakistani Wedding Platform — Light, Luxurious & Unforgettable`
> Budget framing: PKR 4 Billion · bridal-grade · Pakistani shaadi aesthetic

---

## North-Star Rules (do not violate)

- **No cold white (`#FFFFFF`)**, no blue, no neon, no harsh grays, no purple gradients in the new design surfaces. Existing `purple-*` Tailwind palette stays for backward compatibility but new components must not reach for it.
- **Backgrounds**: ivory parchment (`#FDF8F2`), cream (`#FFF9F4`), or blush rose (`#FFF0F3`). Sections alternate ivory ↔ blush like layers of tissue paper.
- **Cards**: cream `#FFF9F4` + 1px border `#EDD9C3`. Hover: gold border at 60% opacity + 2px upward shift over 250ms.
- **Buttons**: `4px` radius, champagne gold bg + charcoal text for primary. Ghost variant: rose border + mauve text.
- **Type**: Display = Playfair Display Italic 400. Body/UI = DM Sans 300/400. Caps labels = DM Sans 500, 2–3px letter-spacing, color `#C9956A`.
- **Motion**: 60ms stagger fade-up at 500ms ease-out. Hover transitions 250ms. Floating petals 12s loop. **Forbidden**: spin animations, slide carousels, jarring transitions.
- **Cultural identity**: Mughal jaal pattern at 5% opacity on hero backgrounds. Floral SVG dividers between major sections. Faint paper grain (3% noise) on ivory.
- **Functionality is sacred**: zero behavior changes. Routes, state, validation, API calls, button handlers — all preserved. Only visual surfaces change.
- **No skipped buttons**: every CTA, every secondary action, every icon button gets the bridal treatment. No element left in the old style on a redesigned screen.

### Quality Bar (the 4-billion test)

Every screen must clear all of these before being marked done:

- **R1 — Fully responsive, every breakpoint, no exceptions.** Mobile 360px, mobile 414px, tablet 768/1024, laptop 1280/1440, desktop 1680/1920+. Test at *each* breakpoint — nothing overflows, nothing breaks the grid, nothing requires horizontal scroll on phones, nothing pushes the layout off-canvas. Touch targets ≥ 44px. Text never gets cut off, buttons never overflow, images never warp. Use `clamp()` and responsive Tailwind utilities — not viewport-pinned magic numbers.
- **R2 — Layout discipline.** Consistent spacing scale (4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96). Vertical rhythm aligned. Optical balance. No off-by-1 alignment, no orphaned text below buttons, no unintended margin collapse, no random text-only `<div>` clusters. Cards in a grid have equal heights. Forms have their fields baseline-aligned. Section padding is generous and consistent — luxury breathes.
- **R3 — Bridal grade.** Refined, not kitsch. Soft, never sterile. Warm, never cold. Restrained gold (it's an accent, not a flood). The screen should look like it belongs in a Vogue Bridal editorial — high-budget, considered, hand-crafted. If a section feels generic or templated, it isn't done.
- **R4 — Inspiration: world-class wedding sites.** Reference points to live up to: Vogue Bridal, Brides.com editorial, The Knot's polished card grids, Zola's clear flow, MagicHour's cinematic photography use, WeddingWire's vendor depth, Indian/Pakistani houses like Zara Shahjahan, Sana Safinaz, Élan Bridal, and Pinterest's most-saved Pakistani shaadi boards. Editorial photography. Generous breath. Restrained palette. Italic display type. *No* templated SaaS aesthetic, no generic shadcn-stock look, no cookie-cutter landing-page feel.
- **R5 — A11y baseline.** Color contrast ≥ WCAG AA on body text. Every interactive element has a visible focus ring (gold). Form fields have proper `<label>` associations. Buttons announce loading state.
- **R6 — Don't break what works.** After every chunk: smoke-check the affected route. If a previously working flow regresses, stop and fix before moving on.

---

## Color Tokens (Tailwind extension)

| Token | Hex | Usage |
| --- | --- | --- |
| `bridal-ivory` | `#FDF8F2` | Page background, never pure white |
| `bridal-cream` | `#FFF9F4` | Card backgrounds |
| `bridal-blush` | `#FFF0F3` | Alternating section bg, testimonial bg |
| `bridal-rose` | `#F2B5C0` | Soft accents, ghost buttons, badge bg |
| `bridal-gold` | `#C9956A` | Primary CTAs, borders, hover, label text |
| `bridal-gold-dark` | `#B07D54` | Button hover state |
| `bridal-mauve` | `#8B5A72` | Bold headings, section titles, ghost text |
| `bridal-sage` | `#A8C4A2` | Subtle success states (mehndi reference) |
| `bridal-coral` | `#E8917A` | Badges, tags, highlights |
| `bridal-charcoal` | `#2C1810` | Headlines (deep warm charcoal — never black) |
| `bridal-beige` | `#EDD9C3` | Borders, dividers (warm — no cold gray) |
| `bridal-sand` | `#F5E6D3` | Subtle gradients, top-bar background |
| `bridal-text` | `#5C3D2E` | Body copy |
| `bridal-text-soft` | `#7A5040` | Secondary text |
| `bridal-text-label` | `#A0694A` | Label/hint text |

---

## Typography Scale

| Role | Font | Weight | Size | Letter-spacing |
| --- | --- | --- | --- | --- |
| H1 (display) | Playfair Display Italic | 400 | 52px | normal |
| H2 (section) | Playfair Display Italic | 400 | 34px | normal |
| H3 (card) | Playfair Display | 400 | 22px | normal |
| Body | DM Sans | 400 | 16px | normal |
| Body small | DM Sans | 300 | 14px | normal |
| Label / caps | DM Sans | 500 | 11px | 2–3px tracking, uppercase, gold |

---

## Forbidden (do not introduce)

- Roboto, Inter, Arial, Poppins as the primary UI font (Inter stays around only for fallback while we transition).
- Pure white backgrounds, hard gray borders, blue/teal accents, purple gradients on new components.
- Spin loaders, slide-in carousels, harsh hover scale > 1.03.
- Generic stock icons. Where possible, lean on Lucide line icons but tinted gold.

---

## Phased Rollout (small chunks — each must remain shippable)

### Phase 0 — Foundation (token layer + reusable primitives)
- **0.1** Add bridal palette to `tailwind.config.ts` *(additive, doesn't replace existing tokens)*.
- **0.2** Swap Inter → DM Sans in `app/layout.tsx` (Playfair Display already wired).
- **0.3** Add bridal CSS utilities + custom keyframes (`petal-fall`, `paper-grain`, jaal pattern) to `app/globals.css`.
- **0.4** Create `components/bridal/`:
  - `bridal-button.tsx` (primary gold + ghost rose variants)
  - `bridal-input.tsx` (cream bg, gold focus border, label-floating)
  - `bridal-card.tsx` (cream card + soft gold hover border)
  - `floral-divider.tsx` (gold floral SVG between sections)
  - `floating-petals.tsx` (CSS-keyframe rose petals over hero backgrounds)
  - `mughal-jaal.tsx` (lattice SVG at 5% opacity)
  - `bridal-label.tsx` (DM Sans caps, gold)
  - `bridal-badge.tsx` (rose / gold / coral variants)

### Phase 1 — Auth screens *(START HERE)*
- **1.1** Login page (`app/(auth)/login/page.tsx` + `components/login-form.tsx`)
- **1.2** Register page (`app/(auth)/register/page.tsx` + `components/user-registration-form.tsx`)
- **1.3** Forgot Password (`app/(auth)/forgot-password/page.tsx` if exists, otherwise scope locator)
- **1.4** Reset Password (`app/(auth)/reset-password/page.tsx`)
- **1.5** Business Registration intro (`app/(auth)/business-registration/page.tsx`)
- **1.6** Auth layout — shared bridal frame with floating petals + jaal pattern

### Phase 2 — Hero + Homepage
- **2.1** `components/homepage/hero-section.tsx` — ivory gradient, playfair italic H1, gold + ghost CTAs, floating petals, jaal pattern, gold badge above headline.
- **2.2** Stats band (blush rose) with rose divider lines.
- **2.3** `components/homepage/featured-categories.tsx` — 6 vendor categories, custom line SVGs, sage hover.
- **2.4** `FeaturedVendorsShowcase`, `FeaturedPhotographers`, `BentoGridSection`, `EditorialAlternatingSection`, `EditorialGallerySection`, `RealWeddings`, `WeddingTips`, `TestimonialBand`, `PlanningTools`.
- **2.5** Footer redesign (cream bg, gold logo, rose social icons).

### Phase 3 — Listing pages
- **3.1** `/vendors`, `/photographers`, `/venues`, `/decor`, `/catering`, `/makeup-artists`, `/henna-artists`, `/bridal-wear`, `/car-rental`, `/wedding-stationery` — `VendorSearch` shell + `VendorCard`.
- **3.2** Search page `/search`.
- **3.3** Pagination, filters sidebar, active-filter chips.

### Phase 4 — Vendor detail
- **4.1** `VendorDetails.tsx` (desktop) — hero, gallery, package cards, menu cards, reviews, calendar, action bar.
- **4.2** `VendorDetailsMobile.tsx` — bottom-sheet booking, sticky CTA bar.
- **4.3** Chat drawer skin.

### Phase 5 — Booking flow
- **5.1** Multi-step booking wizard (date → vendor → package → confirm/pay).
- **5.2** Live pricing panel + cancellation policy.
- **5.3** Payment success / bank-transfer screens.

### Phase 6 — User dashboard
- **6.1** Profile, bookings, favorites, payments, reviews, settings, notifications.
- **6.2** Header avatar dropdown, notification dropdown, chat drawer.

### Phase 7 — Vendor / admin dashboard
- **7.1** Sidebar, top-bar, dashboard cards.
- **7.2** Listings (bookings, vendors, customers, payments).
- **7.3** Business settings tabs (basic info, packages, menus, calendar, type-specific).
- **7.4** Vendor onboarding multi-step forms (per-type variants).

### Phase 8 — Global chrome
- **8.1** Public site header + sticky behavior.
- **8.2** Modals, toasts (sonner), alert dialogs, command palette popovers, date-pickers.
- **8.3** Form primitives — re-skin `components/ui/*` (Input, Select, Checkbox, Slider, Tabs, Dialog) with bridal tokens.

### Phase 9 — Decorative pass
- **9.1** Floral SVG dividers between every major section across the site.
- **9.2** Floating petals on hero + auth screens.
- **9.3** Mughal jaal background watermark on key pages.
- **9.4** Paper grain texture overlay (3% opacity, tileable PNG or CSS noise).

---

## Working Agreement

1. **Small chunks**: ship one component or one screen at a time. Verify by hand before moving on.
2. **Functionality first**: never edit a handler, validator, API call, or route without the user's explicit OK. Visual swap only.
3. **No regressions**: hard-refresh test after each chunk. If the page that was working stops working, stop and fix before moving on.
4. **Single source of truth**: this file. Update phase status here as we ship.
5. **No skipped buttons**: every interactive element on a redesigned screen must use the bridal primitives. Old purple/blue/gray buttons left over on a redesigned screen = incomplete.
6. **Responsive at the same time as the desktop pass.** Don't ship a screen that "works on desktop only" and promise a mobile pass later. Both at once or it isn't done. Test 360 / 768 / 1280 / 1440 / 1920 minimum.
7. **Layout discipline as a checklist.** Before marking any screen done, mentally run through R2 above: spacing scale, vertical rhythm, equal-height cards, baseline alignment, generous section padding. If anything is "almost right", it isn't done.
8. **Editorial reference.** Each screen should be designable as a side-by-side with a Vogue Bridal / Pinterest Pakistani shaadi reference. If the screen looks like a generic SaaS template — go back.

---

## Phase Status

| Phase | Status | Notes |
| --- | --- | --- |
| 0 — Foundation | ✅ done | Tokens + DM Sans + jaal/grain CSS + bridal primitives (Button, Input, Field, Card, Crown, Title, Badge, FloralDivider, FloatingPetals) |
| 1 — Auth | ✅ done | 1.1 Login ✅ · 1.2 Register ✅ · 1.3 Forgot ✅ · 1.4 Reset ✅ · 1.5 Business reg shell ✅ (inner step forms deferred to Phase 7) · 1.6 Shared `<AuthShell>` ✅ (login/register/forgot/reset all dedupe through it) |
| 2 — Hero + Homepage | ✅ done | All sections bridal-grade. Hero (height tightened) · Featured Categories (single-line carousel) · FeaturedVendorsShowcase ✅ · EditorialGallerySection ✅ · BentoGridSection ✅ · EditorialAlternatingSection ✅ · TestimonialBand ✅ · RealWeddings ✅ · WeddingTips ✅ · PlanningTools ✅ · Footer ✅ · Public header + mega menu ✅ · 12 new monetization/content sections ✅ · 20-section homepage composition ✅ |
| 3 — Listing pages | ⏳ next | /vendors, /photographers, /venues, /search — VendorSearch + VendorCard pass |
| 3 — Listing pages | ⏳ queued | |
| 4 — Vendor detail | ⏳ queued | |
| 5 — Booking flow | ⏳ queued | |
| 6 — User dashboard | ⏳ queued | |
| 7 — Vendor/admin dashboard | ⏳ queued | |
| 8 — Global chrome | ⏳ queued | |
| 9 — Decorative pass | ⏳ queued | Final polish across the site |

> Mark as ✅ done · 🟡 in progress · ⏳ queued · ❌ blocked.
