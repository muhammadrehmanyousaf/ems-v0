// Procurement GRN three-way-match (PO → GRN → accept → settle) — feature flag
// (OFF by default). Venue-OS P2 · WS3. Gates the procurement panel; while unset
// no UI renders and the backend endpoints 404, so the live dashboard is unchanged.
//
//   NEXT_PUBLIC_PROCUREMENT_GRN_ON=true   → render the procurement surface
//   (unset / anything else)               → OFF (default)

const ON = process.env.NEXT_PUBLIC_PROCUREMENT_GRN_ON === "true"

/** Whether the procurement GRN surface should render. OFF by default. */
export function isProcurementGrnOn(_businessId?: number | string | null): boolean {
  return ON
}

export const PROCUREMENT_GRN_ON = isProcurementGrnOn()
