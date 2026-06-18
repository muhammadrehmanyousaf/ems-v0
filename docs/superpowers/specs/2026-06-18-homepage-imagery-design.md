# Homepage Imagery — Culturally-Appropriate, Self-Hosted

**Date:** 2026-06-18
**Status:** Approved (design)

## Goal
Replace the homepage's hot-linked, generic (and at least one culturally-inappropriate)
stock images with hand-curated, **modest, Pakistani-audience-appropriate**, professional
images that match the bridal-gold/cream UI — self-hosted in the repo so they never 404.

## Decisions (agreed with owner)
- **Source:** real stock from Pexels (free for commercial use), **downloaded into the repo**
  (not hot-linked). Owner previews/curation is mandatory.
- **Scope:** editorial sections **and** vendor-showcase placeholders.
- **Cultural guardrail (hard rule):** NO kissing / couple-intimacy / immodest dress /
  alcohol. Bias to unambiguously modest subjects.

## Current state (what we're changing)
- **24 hard-coded Pexels URLs** in 2 files:
  - `components/homepage/hero-section.tsx` → `heroImages[]` (7 rotating backgrounds)
  - `components/homepage/monetization-sections.tsx` → 17 total:
    - PremiumPartnersStrip (6: photography, venue, bridal-makeup, henna, decor, catering)
    - SponsoredSpotlight (1 full-bleed)
    - CitySpotlights (4: Lahore, Karachi, Islamabad, Faisalabad)
    - FeaturedVenueShowcase (2)
    - BridalLookbook (4)
- Vendor showcases fall back to a single `/public/placeholder.jpg`.
- `real-weddings.tsx` is data-driven (no static images) — out of scope.
- Pexels has a history of 404s here (see `WW-290` code comment).

## Approach
1. **Curate + download** modest images into `/public/images/home/{hero,partners,cities,venues,lookbook,spotlight}/`.
   Safe subject list: mehndi/henna art, bridal jewellery & dupatta, floral & stage décor,
   venues/halls, embroidery/fabric, food styling, detail shots, modest *solo* bridal portraits.
   Avoid couples-intimacy entirely.
2. **Re-wire** the 24 `src` strings in the two component files to local `/images/home/…` paths.
   Same data shape — only the URL strings change. Additive, no layout change.
3. **Vendor placeholders:** add modest per-category placeholders under
   `/public/images/placeholders/` + a `vendorTypePlaceholder(type)` helper used as the
   image fallback, replacing the single generic `placeholder.jpg`.
4. **Provenance:** `public/images/home/credits.md` recording each Pexels source ID + license note.
5. **Verification:** re-screenshot the rendered homepage top-to-bottom; confirm every image
   loads, is modest, and matches the bridal-gold aesthetic. Specifically locate & remove the
   existing inappropriate shot.

## Constraints
- Live production: additive, backward-compatible, zero layout/logic risk.
- Keep the existing Pexels `remotePattern` in `next.config` (other code may use it).
- Commit locally; **do not push** until owner says so.

## Out of scope
- Real vendor data (separate follow-up task).
- `real-weddings.tsx` (data-driven).
