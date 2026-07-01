// Hierarchical venue spaces (Hall → Floor → Partition + merge groups) — feature
// flag (OFF by default). Venue-OS venue-hierarchy. While unset, the space tree /
// merge / space-selection UI never renders and the /api/v1/venue-spaces surface
// 404s, so the legacy single-unit booking flow behaves exactly as today.
//
//   NEXT_PUBLIC_VENUE_HIERARCHY_ON=true   → render the space-hierarchy surfaces
//   (unset / anything else)               → OFF (default)

// GA'd — ON by default. Still killable: set NEXT_PUBLIC_VENUE_HIERARCHY_ON="false".
// (The customer-facing space selector additionally self-limits to venues that have
// actually built more than one space, so single-hall venues show nothing.)
const ON = process.env.NEXT_PUBLIC_VENUE_HIERARCHY_ON !== "false"

/** Whether the hierarchical-spaces surfaces should render. ON by default. */
export function isVenueHierarchyOn(_businessId?: number | string | null): boolean {
  return ON
}

export const VENUE_HIERARCHY_ON = isVenueHierarchyOn()
