/**
 * Per-vendor-type editorial imagery for the location pages (hero feature,
 * inspiration gallery, CTA backdrop). Category-gated so a page only shows
 * imagery that actually fits it — photographers get bridal/wedding shots,
 * caterers would get food, etc. Types without imagery fall back to the
 * text-only (image-free) hero, so this is safe to roll out incrementally.
 *
 * Images are self-hosted under /public/images/seo (free-licensed Unsplash /
 * Pexels for now; replace with owned/licensed photography for production).
 * Decorative only — never presented as a specific vendor's own work.
 */

export interface LocationImagery {
  hero?: string
  heroAlt?: string
  gallery?: { src: string; alt: string }[]
  cta?: string
}

const IMAGERY: Record<string, LocationImagery> = {
  "wedding-photographers": {
    hero: "/images/seo/hero.jpg",
    heroAlt: "Pakistani bride in a red bridal lehenga with gold jewellery at a Lahore wedding",
    gallery: [
      { src: "/images/seo/g1.jpg", alt: "Red and gold floral wedding stage decor in Lahore" },
      { src: "/images/seo/v2.jpg", alt: "Bridal portrait in red and gold lehenga" },
      { src: "/images/seo/g3.jpg", alt: "Elegant haldi and mehndi ceremony decor" },
      { src: "/images/seo/g4.jpg", alt: "Intricate bridal mehndi henna on the bride's hands" },
      { src: "/images/seo/v4.jpg", alt: "Pakistani bride photographed on her wedding day" },
      { src: "/images/seo/g2.jpg", alt: "Grand wedding stage with floral draping" },
    ],
    cta: "/images/seo/g1.jpg",
  },
}

export function getLocationImagery(slug: string): LocationImagery {
  return IMAGERY[slug] ?? {}
}
