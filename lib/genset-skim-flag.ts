// Genset-skim measurement (tank-dip vs hour-meter recon + self-calibrating skim
// band) — feature flag (OFF by default). Venue-OS P2 · WS7-A. While unset no UI
// renders and the backend endpoints 404, so the live generator flows are unchanged.
//
//   NEXT_PUBLIC_ENABLE_GENSET_SKIM=true   → render the genset-skim surface
//   (unset / anything else)               → OFF (default)

const ON = process.env.NEXT_PUBLIC_ENABLE_GENSET_SKIM === "true"

/** Whether the genset-skim surface should render. OFF by default. */
export function isGensetSkimOn(_businessId?: number | string | null): boolean {
  return ON
}

export const GENSET_SKIM_ON = isGensetSkimOn()
