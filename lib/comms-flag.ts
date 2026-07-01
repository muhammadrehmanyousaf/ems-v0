// Multi-channel comms engine (WA→SMS→IVR ladder, 24h-window cheapest path,
// rate-as-data, cross-channel DNC) — feature flag (OFF by default). Venue-OS P2 ·
// WS6. OFF leaves the live wa.me path byte-identical and the /comms P2 routes 404.
//
//   NEXT_PUBLIC_BSP_COMMS_ON=true     → render the comms panels
//   NEXT_PUBLIC_COMMS_IVR_ON=true     → also show the IVR toggle in config
//   (unset / anything else)           → OFF (default)

const ON = process.env.NEXT_PUBLIC_BSP_COMMS_ON === "true"
const IVR_ON = process.env.NEXT_PUBLIC_COMMS_IVR_ON === "true"

/** Whether the multi-channel comms surface should render. OFF by default. */
export function isBspCommsOn(_businessId?: number | string | null): boolean {
  return ON
}

/** Whether the IVR toggle UI should show. OFF by default. */
export function isCommsIvrOn(_businessId?: number | string | null): boolean {
  return ON && IVR_ON
}

export const BSP_COMMS_ON = isBspCommsOn()
export const COMMS_IVR_ON = isCommsIvrOn()
