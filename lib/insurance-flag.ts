// Insurance + weather tracking (policy register, expiry sweep, claim ROI) —
// feature flag (OFF by default). Venue-OS P2 · WS9. While unset no UI renders and
// the backend endpoints 404.
//
//   NEXT_PUBLIC_INSURANCE_TRACKING_ON=true   → render the Safety & Risk panel
//   NEXT_PUBLIC_INSURANCE_CLAIM_ON=true       → also show the claim workflow
//   (unset / anything else)                  → OFF (default)

const ON = process.env.NEXT_PUBLIC_INSURANCE_TRACKING_ON === "true"
const CLAIM_ON = process.env.NEXT_PUBLIC_INSURANCE_CLAIM_ON === "true"

/** Whether the insurance-tracking surface should render. OFF by default. */
export function isInsuranceTrackingOn(_businessId?: number | string | null): boolean {
  return ON
}

/** Whether the claim workflow UI should show. OFF by default. */
export function isInsuranceClaimOn(_businessId?: number | string | null): boolean {
  return ON && CLAIM_ON
}

export const INSURANCE_TRACKING_ON = isInsuranceTrackingOn()
export const INSURANCE_CLAIM_ON = isInsuranceClaimOn()
