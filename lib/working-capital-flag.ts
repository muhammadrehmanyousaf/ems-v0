// Working-capital liability calendar (committee/Ijarah/udhaar/bank merged into a
// month-by-month bounce-risk timeline) + the season runway headline — feature
// flags (OFF by default). Venue-OS P2 · WS8. While unset no UI renders and the
// backend endpoints 404, so the live dashboard is unchanged.
//
//   NEXT_PUBLIC_WORKING_CAPITAL_ON=true         → render the liability surface
//   NEXT_PUBLIC_WORKING_CAPITAL_RUNWAY_ON=true   → also render the runway headline
//   (unset / anything else)                     → OFF (default)

const ON = process.env.NEXT_PUBLIC_WORKING_CAPITAL_ON === "true"
const RUNWAY_ON = process.env.NEXT_PUBLIC_WORKING_CAPITAL_RUNWAY_ON === "true"

/** Whether the working-capital liability surface should render. OFF by default. */
export function isWorkingCapitalOn(_businessId?: number | string | null): boolean {
  return ON
}

/** Whether the runway-headline sub-panel should render (needs >=1 season of history). OFF by default. */
export function isWorkingCapitalRunwayOn(_businessId?: number | string | null): boolean {
  return ON && RUNWAY_ON
}

export const WORKING_CAPITAL_ON = isWorkingCapitalOn()
export const WORKING_CAPITAL_RUNWAY_ON = isWorkingCapitalRunwayOn()
