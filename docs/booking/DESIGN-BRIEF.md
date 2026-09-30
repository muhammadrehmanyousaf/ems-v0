# Booking journey redesign — brief for the design panel

Repo: `C:\Projects\ems-v0` (Next.js 14.2 App Router, React 18, TypeScript, Tailwind, framer-motion available).
Live site: https://weddingwala.pk — a Pakistani wedding marketplace. Customers book venues and vendors.
Test venue: https://weddingwala.pk/3358/booking (Rehman Grand Marquee, Johar Town, Lahore, 4.3★).

## The owner's verdict on what exists today (verbatim)

> "i dont like the design not the layout not anything brother it is boaring its getting down to the screen making it
> unprofessional that going way more down to the vh so its not good design not good layout not world class brother
> boaring and not interactive … make this booking the worlds best of the best booking"

> "i told you to totally revamp the design the UI the UX so it look the worlds best of the best booking … you did
> increase the size the design the UI the UX is the same"

> "i am talking about the full journey the UI journey ok dont change the fields etc"

Two earlier attempts were rejected: (1) restyling the same single-column form, (2) a two-column grid with a sticky
order summary plus spacing fixes. Both were "the same thing, bigger". Do not propose either again.

## What is wrong, concretely (see the screenshots)

- The booking page renders inside the full marketing site: 72px fixed nav, then a "Bridal Letter" newsletter block,
  then a ~900px footer with ~60 links. A checkout wrapped in a homepage.
- Every step is a long cream card on a cream page. Step 2 (date & time) is ~1,400px tall; the page is 3,200px.
  The Back/Continue row is `position: sticky` at the bottom of the card.
- Nothing is visual. The venue's photographs (it has several) appear as a 40px circle in a top bar.
- No motion between steps, no feedback beyond a border colour change, no sense of progress or arrival.
- Six steps: Event selection → Date & time → Packages → Menu → Your requirements → Review (→ success /
  request-sent). On a phone every step is 5,000+px tall.

## Hard constraints (non-negotiable)

1. **Fields, steps, validation, payloads and step order do not change.** Every input that exists today must exist
   after (same names, same data). The step list is computed in `components/booking/booking-form.tsx`
   (`eventStepOrder`: keys `datetime`, `packages`, `vendors`, `menu`, `unit`, `requirements`, `review`, `success`;
   which appear depends on vendor type/config) plus the global step 1 (event selection). Multi-event bookings
   (several functions chosen in step 1, each with its own sub-flow and tabs) must keep working.
2. **Brand**: the bridal design system. Palette (Tailwind `bridal-*`): ivory #FDF8F2, cream #FFF9F4, blush #FFF0F3,
   rose #F2B5C0, gold #C9956A, gold-dark #916539, gold-deep #7E5630, mauve #8B5A72, sage #A8C4A2, coral #E8917A,
   charcoal #2C1810, beige #EDD9C3, sand #F5E6D3, text #5C3D2E, text-soft #7A5040, text-label #955E39.
   Fonts: Playfair Display italic (`font-display italic`) for headings, DM Sans (`font-bridal`) for UI text.
   Buttons: `components/bridal/bridal-button.tsx` (primary gold / ghost / outline / mauve). Gold #C9956A is only
   2.5:1 on cream — never use it for small text; text uses gold-dark.
3. **Viewports**: 1440×900 (primary desktop), 1366×768 (common laptop), 390×844 (phone). At 1440×900 every step's
   primary decision must be visible and actionable without scrolling the page. If a step has more content than fits,
   the overflow scrolls inside the step panel, never the whole document. The Continue action is always visible.
4. **Never gate visibility on an IntersectionObserver / `useInView`** — that pattern left production invisible last
   week. Entrance motion is CSS keyframes (`animate-stagger-fade-up` exists) or framer-motion `initial`/`animate` that
   runs on mount unconditionally. Nothing may end at `opacity: 0`.
5. **Accessibility**: toggles carry `aria-pressed`, inputs have labels, touch targets ≥ 44px on phone, focus rings
   visible, contrast AA.
6. **Vendor variety**: the same shell serves a marquee (calendar + hall picker + time slots + guest count + packages +
   menus + requirements), a photographer (no guests, no menu, no halls), a car rental (vehicle quantity), a per-unit
   vendor (chairs, generators). The design must look complete for a vendor with two packages and nothing else.
7. **No new heavy dependencies.** framer-motion, lucide-react, canvas-confetti, Tailwind are already present.
8. **The marketing chrome MAY be removed or reduced on the booking route** (Airbnb `/book`, Shopify checkout, Stripe
   Checkout all do this: logo, a way back to the venue, a trust line, nothing else). `components/public-chrome.tsx`
   decides which routes get Header + Footer.

## Files that exist today

- Route: `app/(main)/(booking)/[id]/booking/page.tsx`, layout `app/(main)/(booking)/layout.tsx` (wraps in PublicChrome).
- Shell: `components/booking/booking-form.tsx` (1,626 lines: state, step order, validation, submit, render tree at ~L1274+).
- Top bar: `components/booking/ui/booking-rail.tsx` (venue identity + step list). Tabs: `components/booking/ui/event-tabs.tsx`.
- Summary: `components/booking/ui/live-pricing-panel.tsx` (desktop) and `components/booking/ui/mobile-summary-bar.tsx`.
- Steps: `components/booking/steps/event-selection-step.tsx`, `components/booking/steps-v2/date-time-step.tsx`
  (1,287 lines; calendar, hall/space selects, slot templates or Morning/Afternoon/Evening periods, service-location
  picker `components/booking/service-location-picker.tsx`, arrangement select, guest stepper, warnings),
  `components/booking/steps-v2/package-step.tsx`, `components/booking/steps/menu-selection-step.tsx`,
  `components/booking/steps/requirements-step.tsx`, `components/booking/steps-v2/review-step.tsx`,
  `components/booking/steps/success-step.tsx`, `components/booking/steps/request-sent-screen.tsx`,
  `components/booking/steps/bank-transfer-screen.tsx`, `components/booking/steps/vendor-selection-step.tsx`,
  `components/booking/steps/unit-quantity-step.tsx`, `components/booking/steps/vendor-success-step.tsx`.
- Tokens: `tailwind.config.ts` (bridal palette, keyframes), `app/globals.css` (`.bridal-select`, `.bridal-input`,
  `.bg-bridal-hero`, `.bg-mughal-jaal`, `.bridal-scroll`).
- Header (for the logo mark): `components/header.tsx`.

## Screenshots of today (read these — they are what the owner is reacting to)

Folder: `C:\Users\ADMIN\AppData\Local\Temp\claude\c--Projects\a0226b59-ee03-4f7c-93a5-dfb54c68d8c2\scratchpad\booking\`
- Viewport crops (exactly what a customer sees on arrival): `baseline\desk-viewport-s1.png` … `s6.png` (1440×900),
  `baseline\mob-viewport-s1.png` … `s6.png` (390×844).
- Full pages: `f-desk-s1.png` … `f-desk-s6.png`, `f-mob-s1.png` … `f-mob-s6.png`.
- The venue page a customer comes from: `baseline\venue-page-1440.png`, `baseline\venue-page-1440-scrolled.png`.

## Test venue data (live, business 3358)

Wedding venue. Several photographs. Sub-venue hall picker present ("Whole venue / any hall" + halls). Slot
templates: one slot "Day 09:00–12:00 (1 of 1 left)". Guests: from 250, venue holds 900, stepper ±10. Packages:
Gold — Barat Package Rs 760,000 (250–500 guests, food included, 5 features), Silver — Nikah Package Rs 325,000
(Popular, 4 features), Platinum — Full Shaadi Rs 1,320,000 (5 features). Menus: Standard Desi (6 dishes), Gold
(9 dishes), Platinum (11 dishes) — "Included" when the package covers food. Booking mode: request (the venue
approves first, nothing is charged; advance is 10% = Rs 76,000 on Gold). Compliance note: one-dish policy.

## What "world's best" means here

Study the real things, not adjectives. Use WebSearch/WebFetch to look at: Airbnb's booking page (`/book/stays`),
Booking.com's checkout, Calendly's scheduling page, Resy / OpenTable reservation flows, Stripe Checkout, Shopify
checkout, Aman Resorts / Four Seasons / Mandarin Oriental reservation flows, Peerspace, Eventbrite checkout, Zola /
The Knot vendor enquiry, Apple Store appointment booking, Typeform-style one-question flows, and Dribbble / Mobbin
"booking flow", "event booking", "hotel checkout", "reservation" shots. Extract *specific* patterns: chrome, layout
proportions, how the calendar and time slots are presented, how the summary/receipt behaves, step navigation,
transitions, selection feedback, empty states, phone adaptation. Cite what you took from where.

The owner is judging by eye: does it feel like a product from a serious company, does it fit the screen, does it
respond when touched, does it look designed rather than assembled.
