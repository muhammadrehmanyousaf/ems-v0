/**
 * Per-vendor-type editorial imagery for the location pages (hero feature,
 * inspiration gallery, CTA backdrop). Category-gated so a page only shows
 * imagery that actually fits it — photographers get bridal shots, caterers get
 * table settings, venues get halls.
 *
 * Images are self-hosted under /public/images (free-licensed Unsplash / Pexels
 * for now; replace with owned/licensed photography for production).
 * Decorative only — never presented as a specific vendor's own work, and the
 * alt text describes what is actually in the frame rather than claiming the
 * photograph was taken in whichever city's page it happens to appear on.
 *
 * Only `wedding-photographers` was ever filled in. Every other city page fell
 * through to the text-only hero — so /wedding-venues/lahore, the highest
 * commercial-intent URL on the site, opened on a paragraph floating in an empty
 * gradient. The rest of the categories are now covered, and a generic fallback
 * means no city page can render an empty hero again.
 */

export interface LocationImagery {
  hero?: string
  heroAlt?: string
  gallery?: { src: string; alt: string }[]
  cta?: string
}

// ── Shared frames ─────────────────────────────────────────────────────────
// Named by what they SHOW, not by where they are filed, so a venue shot filed
// under /cities/lahore can honestly be reused on Karachi.
const VENUE_STAGE = {
  src: "/images/home/cities/lahore.jpg",
  alt: "Floral wedding stage with chandeliers and a draped backdrop, set for a barat",
}
const VENUE_TABLE = {
  src: "/images/home/cities/karachi.jpg",
  alt: "Banquet table laid with menu cards, napkins and glassware for a wedding reception",
}
const VENUE_ENTRANCE = {
  src: "/images/home/cities/islamabad.jpg",
  alt: "Floral entrance walkway with draped fabric leading into an outdoor wedding",
}
const VENUE_EVENING = {
  src: "/images/home/cities/faisalabad.jpg",
  alt: "Decorated wedding venue set up for an evening function",
}

const BRIDE_PORTRAIT = {
  src: "/images/seo/v1.jpg",
  alt: "Pakistani bride in a red and gold bridal lehenga with her dupatta drawn overhead",
}
const BRIDE_PORTRAIT_2 = { src: "/images/seo/v2.jpg", alt: "Bridal portrait in a red and gold lehenga" }
const BRIDE_DAY = { src: "/images/seo/v4.jpg", alt: "Pakistani bride photographed on her wedding day" }
const STAGE_DECOR = { src: "/images/seo/g1.jpg", alt: "Red and gold floral wedding stage decor" }
const STAGE_DRAPE = { src: "/images/seo/g2.jpg", alt: "Grand wedding stage with floral draping" }
const MEHNDI_DECOR = { src: "/images/seo/g3.jpg", alt: "Haldi and mehndi ceremony decor" }
const HENNA_HANDS = { src: "/images/seo/g4.jpg", alt: "Intricate bridal mehndi henna on the bride's hands" }

const IMAGERY: Record<string, LocationImagery> = {
  "wedding-photographers": {
    hero: "/images/seo/hero.jpg",
    heroAlt: "Pakistani bride in a red bridal lehenga with gold jewellery",
    gallery: [STAGE_DECOR, BRIDE_PORTRAIT_2, MEHNDI_DECOR, HENNA_HANDS, BRIDE_DAY, STAGE_DRAPE],
    cta: STAGE_DECOR.src,
  },
  "wedding-venues": {
    hero: VENUE_STAGE.src,
    heroAlt: VENUE_STAGE.alt,
    gallery: [VENUE_STAGE, VENUE_TABLE, VENUE_ENTRANCE, STAGE_DECOR, STAGE_DRAPE, VENUE_EVENING],
    cta: VENUE_ENTRANCE.src,
  },
  "wedding-decorators": {
    hero: VENUE_ENTRANCE.src,
    heroAlt: VENUE_ENTRANCE.alt,
    gallery: [STAGE_DECOR, STAGE_DRAPE, VENUE_STAGE, VENUE_ENTRANCE, MEHNDI_DECOR, VENUE_TABLE],
    cta: STAGE_DECOR.src,
  },
  caterers: {
    hero: VENUE_TABLE.src,
    heroAlt: VENUE_TABLE.alt,
    gallery: [VENUE_TABLE, VENUE_STAGE, VENUE_EVENING, STAGE_DRAPE, VENUE_ENTRANCE, STAGE_DECOR],
    cta: VENUE_TABLE.src,
  },
  "bridal-makeup-artists": {
    hero: BRIDE_PORTRAIT.src,
    heroAlt: BRIDE_PORTRAIT.alt,
    gallery: [BRIDE_PORTRAIT, BRIDE_PORTRAIT_2, BRIDE_DAY, HENNA_HANDS, STAGE_DECOR, MEHNDI_DECOR],
    cta: BRIDE_PORTRAIT_2.src,
  },
  "mehndi-artists": {
    hero: HENNA_HANDS.src,
    heroAlt: HENNA_HANDS.alt,
    gallery: [HENNA_HANDS, MEHNDI_DECOR, BRIDE_PORTRAIT_2, STAGE_DECOR, BRIDE_DAY, STAGE_DRAPE],
    cta: MEHNDI_DECOR.src,
  },
  "bridal-wear": {
    hero: BRIDE_PORTRAIT_2.src,
    heroAlt: BRIDE_PORTRAIT_2.alt,
    gallery: [BRIDE_PORTRAIT_2, BRIDE_PORTRAIT, BRIDE_DAY, HENNA_HANDS, STAGE_DECOR, MEHNDI_DECOR],
    cta: BRIDE_PORTRAIT.src,
  },
}

/**
 * Fallback hero for any category not listed above.
 *
 * A wedding scene is relevant to every vendor category on this marketplace, and
 * an unfilled hero does not read as restraint — it reads as a page that failed
 * to load. The gallery stays empty for these types on purpose: an inspiration
 * strip of generic photos under a category it does not depict would be padding.
 */
const GENERIC_HERO = VENUE_STAGE

export function getLocationImagery(slug: string): LocationImagery {
  const specific = IMAGERY[slug]
  if (specific?.hero) return specific
  return { ...(specific ?? {}), hero: GENERIC_HERO.src, heroAlt: GENERIC_HERO.alt }
}
