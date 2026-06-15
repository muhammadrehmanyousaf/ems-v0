/**
 * Per-vendor-type "related guides" links, rendered on the /[vendor-type]/[city]
 * money pages to strengthen the informational <-> commercial internal-link silo
 * (money page -> cost/how-to/inspiration guides, completing the bridge the
 * content guides already build in the other direction).
 *
 * Every href MUST be a real content-pillar route (see lib/content/pillars).
 * Keyed by the SEO vendor-type slug (see VENDOR_TYPES in constants.ts).
 */
export interface GuideLink {
  label: string
  href: string
}

export const VENDOR_TYPE_RELATED_GUIDES: Record<string, GuideLink[]> = {
  "wedding-photographers": [
    { label: "Wedding photography cost in Lahore", href: "/wedding-photography-cost-in-lahore" },
    { label: "Wedding photography cost in Karachi", href: "/wedding-photography-cost-in-karachi" },
    { label: "Pre-wedding photoshoot ideas", href: "/pre-wedding-photoshoot-ideas-pakistan" },
  ],
  "wedding-venues": [
    { label: "Wedding venue types compared", href: "/wedding-venue-types-guide-pakistan" },
    { label: "Wedding venue cost in Lahore", href: "/wedding-venue-cost-in-lahore" },
    { label: "Wedding cost in Pakistan (full budget)", href: "/wedding-cost-in-pakistan" },
  ],
  "bridal-makeup-artists": [
    { label: "Bridal makeup looks guide", href: "/bridal-makeup-looks-guide-pakistan" },
    { label: "Bridal makeup cost in Lahore", href: "/bridal-makeup-cost-in-lahore" },
    { label: "Bridal hairstyles guide", href: "/bridal-hairstyles-guide-pakistan" },
  ],
  caterers: [
    { label: "Wedding catering cost per head", href: "/wedding-catering-cost-in-pakistan" },
    { label: "Wedding catering menu guide", href: "/wedding-catering-menu-guide-pakistan" },
  ],
  "wedding-decorators": [
    { label: "Wedding decoration ideas", href: "/wedding-decoration-ideas-pakistan" },
    { label: "Wedding cost in Pakistan (full budget)", href: "/wedding-cost-in-pakistan" },
  ],
  "mehndi-artists": [
    { label: "Bridal mehndi designs guide", href: "/bridal-mehndi-designs-guide" },
    { label: "How to plan a mehndi function", href: "/how-to-plan-a-mehndi-function" },
  ],
  "bridal-wear": [
    { label: "Pakistani bridal dress guide", href: "/pakistani-bridal-dress-guide" },
    { label: "Bridal jewellery guide", href: "/bridal-jewellery-guide-pakistan" },
    { label: "Barat dress for the bride", href: "/barat-dress-for-bride" },
  ],
  "wedding-cars": [
    { label: "How to choose a wedding car", href: "/how-to-choose-a-wedding-car-in-pakistan" },
  ],
  "wedding-planners": [
    { label: "Wedding cost in Pakistan (full budget)", href: "/wedding-cost-in-pakistan" },
    { label: "Wedding checklist & timeline", href: "/pakistani-wedding-checklist-and-timeline" },
  ],
  "wedding-stationery": [
    { label: "Wedding invitation wording ideas", href: "/pakistani-wedding-invitation-wording" },
  ],
}

export function getVendorTypeRelatedGuides(slug: string): GuideLink[] {
  return VENDOR_TYPE_RELATED_GUIDES[slug] ?? []
}
