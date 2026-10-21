/**
 * Per-vendor-type "related guides" links, rendered on the /[vendor-type]/[city]
 * money pages to strengthen the informational <-> commercial internal-link silo.
 *
 * City-aware: dynamically injects relevant city cost guides and local law references.
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
    { label: "Wedding cost in Pakistan (full budget)", href: "/wedding-cost-in-pakistan" },
    { label: "One-dish law & wedding guest limits", href: "/one-dish-law-and-wedding-guest-limits-pakistan" },
    { label: "Pakistani wedding checklist & timeline", href: "/pakistani-wedding-checklist-and-timeline" },
  ],
  "bridal-makeup-artists": [
    { label: "Bridal makeup looks guide", href: "/bridal-makeup-looks-guide-pakistan" },
    { label: "Bridal makeup cost in Lahore", href: "/bridal-makeup-cost-in-lahore" },
    { label: "Bridal hairstyles guide", href: "/bridal-hairstyles-guide-pakistan" },
  ],
  caterers: [
    { label: "Wedding catering cost per head", href: "/wedding-catering-cost-in-pakistan" },
    { label: "Wedding catering menu guide", href: "/wedding-catering-menu-guide-pakistan" },
    { label: "One-dish law & menu regulations", href: "/one-dish-law-and-wedding-guest-limits-pakistan" },
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

export function getVendorTypeRelatedGuides(slug: string, citySlug?: string): GuideLink[] {
  const base = VENDOR_TYPE_RELATED_GUIDES[slug] ?? []
  const customized = [...base]

  if (slug === "wedding-venues" || slug === "caterers") {
    if (citySlug === "lahore") {
      customized.unshift(
        { label: "Wedding venue cost in Lahore (2026)", href: "/wedding-venue-cost-in-lahore" },
        { label: "Wedding cost in Lahore (budget breakdown)", href: "/wedding-cost-in-lahore" },
      )
    } else if (citySlug === "karachi") {
      customized.unshift(
        { label: "Wedding cost in Karachi (2026 rates)", href: "/wedding-cost-in-karachi" },
      )
    } else if (citySlug === "islamabad" || citySlug === "rawalpindi") {
      customized.unshift(
        { label: "Wedding cost in Islamabad (budget guide)", href: "/wedding-cost-in-islamabad" },
      )
    }
  }

  // Deduplicate by href
  const seen = new Set<string>()
  return customized.filter((item) => {
    if (seen.has(item.href)) return false
    seen.add(item.href)
    return true
  })
}
