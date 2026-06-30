// AML cockpit (§21 meter + structuring guard-rail + beneficial-ownership +
// Compliance-Shield) — feature flag (OFF by default). Venue-OS P2 · WS4.
// The flag gates only the SCREENS; the four AML invariants + the structuring
// guard-rail have NO disable flag by construction (server-enforced).
//
//   NEXT_PUBLIC_AML_COCKPIT_ON=true   → render the AML cockpit
//   (unset / anything else)           → OFF (default)

const ON = process.env.NEXT_PUBLIC_AML_COCKPIT_ON === "true"

export function isAmlCockpitOn(_businessId?: number | string | null): boolean {
  return ON
}

export const AML_COCKPIT_ON = isAmlCockpitOn()
