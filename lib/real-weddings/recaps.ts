/**
 * Real wedding recap data — typed in-memory until we move to MDX or a CMS
 * (mirrors the blog/posts.ts approach). Recaps are 2:1 SEO leverage:
 *   - long-tail editorial content ("Aisha & Hamza's Lahore wedding")
 *   - photographer + planner backlinks via vendor credits
 *
 * Reference: docs/seo/00-master-seo-playbook.md §16 wedding-vertical
 *            +§7 content silos (real-weddings counts as its own silo).
 */

export interface VendorCredit {
  /** Display name. */
  name: string
  /** Vendor type — matches lib/seo/constants.VendorTypeSlug shape but as plain string for flexibility. */
  role: string
  /** External link (vendor's website / Insta) OR internal `/wedding-photographers/karachi/foo-7421` once they're on Wedding Wala. */
  url?: string
  /** City — denormalised so the credit reads cleanly even if the URL is external. */
  city?: string
}

export interface RealWedding {
  slug: string
  /** Display title — typically "<Bride> & <Groom>'s <Theme/Style> wedding in <City>". */
  title: string
  /** Couple names — used for breadcrumbs + structured data. */
  couple: string
  city: string
  region: string
  /** ISO date of the main event. */
  eventDate: string
  /** Hero / cover image used in OG, listing card, and detail hero. */
  coverImage: string
  /** 4–12 gallery images from across the functions. */
  gallery: string[]
  /** Short editorial blurb shown on the listing card (~140–180 chars). */
  excerpt: string
  /** Long-form story blocks. */
  story: StoryBlock[]
  /** Vendor credits — every vendor who worked the wedding. */
  credits: VendorCredit[]
  /** Tags for filtering + SEO co-occurrence (e.g. "outdoor", "winter", "DHA", "fusion"). */
  tags: string[]
  /** ISO timestamp this recap was published. */
  publishedAt: string
  /** Optional update date. */
  updatedAt?: string
  /** Read-through length for the listing-card label. */
  readingMinutes: number
}

export type StoryBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string; attribution: string }

// Sample stub photo URLs use the same Pexels host as the homepage hero —
// already in next.config.mjs `remotePatterns`. Will be replaced with
// commissioned photography per docs/seo/06-photography-sourcing-plan.md.

export const REAL_WEDDINGS: RealWedding[] = [
  {
    slug: "ayesha-hamza-lahore-grand-imperial",
    title: "Ayesha & Hamza's heritage wedding at The Grand Imperial, Lahore",
    couple: "Ayesha & Hamza",
    city: "Lahore",
    region: "Punjab",
    eventDate: "2026-03-15",
    coverImage:
      "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1600",
    gallery: [
      "https://images.pexels.com/photos/2253870/pexels-photo-2253870.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/1456613/pexels-photo-1456613.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/1485469/pexels-photo-1485469.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/2253839/pexels-photo-2253839.jpeg?auto=compress&cs=tinysrgb&w=1200",
      "https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=1200",
    ],
    excerpt:
      "A three-function Lahore wedding that wove a 19th-century banquet hall into a contemporary fusion celebration — mehndi, baraat, and walima.",
    publishedAt: "2026-04-02T09:00:00.000Z",
    readingMinutes: 6,
    tags: ["lahore", "winter wedding", "heritage venue", "fusion", "three-day"],
    credits: [
      { name: "The Grand Imperial", role: "Wedding Venue", city: "Lahore" },
      { name: "SQ Photography", role: "Wedding Photography", city: "Lahore" },
      { name: "Bridal by Sana", role: "Bridal Makeup", city: "Lahore" },
      { name: "Mehndi Atelier", role: "Mehndi Artist", city: "Lahore" },
      { name: "Decor Diaries", role: "Wedding Decor", city: "Lahore" },
      { name: "Spice Studio", role: "Catering", city: "Lahore" },
    ],
    story: [
      {
        type: "p",
        text: "When Ayesha and Hamza set out to plan their wedding, the brief was deceptively simple: honour both families' traditions while leaving room for the couple's own tastes. What that meant in practice was a three-function celebration spread across one of Lahore's most storied venues, paced over a long winter weekend.",
      },
      {
        type: "h2",
        text: "Mehndi night",
      },
      {
        type: "p",
        text: "The mehndi was the warmest of the three functions — both literally (Lahore in mid-March can still be cool) and emotionally. Mehndi Atelier set up under garlands of marigold and string lights, with a low-stage seating arrangement that let the bride's sisters perform without barriers. Decor Diaries leaned into a deep-rose-and-gold palette, eschewing the typical mehndi-night green for something more intimate.",
      },
      {
        type: "quote",
        text: "We wanted the mehndi to feel like a family dinner, not a stage show. The decor team understood that immediately — the lighting was warm, the seating was close, no one was performing for a crowd.",
        attribution: "Ayesha (the bride)",
      },
      {
        type: "h2",
        text: "Baraat at The Grand Imperial",
      },
      {
        type: "p",
        text: "The Grand Imperial's main hall — built in 1894 — is famously hard to dress. Decor Diaries' approach was to work with the architecture rather than against it: minimal fabric installations, white florals, and warm-toned uplighting that picked out the original woodwork. SQ Photography's team of three caught the entry, the rasm-e-mehndi, and the family portraits inside the smaller library room — a quieter setup the venue rarely opens for events.",
      },
      {
        type: "h2",
        text: "Walima",
      },
      {
        type: "p",
        text: "The walima moved to the venue's terrace garden the next evening — a gamble in March that paid off thanks to gas heaters and a backup tent on standby. Spice Studio served a 12-course Mughlai-fusion menu that dropped the typical chicken-karahi staple in favour of slow-cooked nihari and grilled fish. The night ended with a traditional doli dance and a quiet sehra exchange the bride's grandmother had been planning for years.",
      },
    ],
  },
]

export function getAllRealWeddings(): RealWedding[] {
  return [...REAL_WEDDINGS].sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : -1,
  )
}

export function getRealWedding(slug: string): RealWedding | undefined {
  return REAL_WEDDINGS.find((w) => w.slug === slug)
}
