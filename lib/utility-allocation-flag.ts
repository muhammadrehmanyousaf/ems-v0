// Utility apportionment (shared GRID/GAS/WATER bill split across events via the
// cascade basis) + udhaar-markup baseline — feature flag (OFF by default).
// Venue-OS P2 · WS7-B/C. While unset no UI renders and the backend endpoints
// 404, so the live dashboard is unchanged.
//
//   NEXT_PUBLIC_ENABLE_UTILITY_ALLOCATION=true   → render the utility surface
//   (unset / anything else)                      → OFF (default)

const ON = process.env.NEXT_PUBLIC_ENABLE_UTILITY_ALLOCATION === "true"

/** Whether the utility-allocation surface should render. OFF by default. */
export function isUtilityAllocationOn(_businessId?: number | string | null): boolean {
  return ON
}

export const UTILITY_ALLOCATION_ON = isUtilityAllocationOn()
