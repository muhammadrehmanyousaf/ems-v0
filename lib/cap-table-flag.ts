// Partner cap-table (equity register + profit distribution) — feature flag (OFF
// by default). Venue-OS P2 · WS2. Read-only over the GL net; posts nothing. While
// unset no UI renders and the backend endpoints 404.
//
//   NEXT_PUBLIC_CAP_TABLE_ON=true   → render the cap-table panel
//   (unset / anything else)         → OFF (default)

const ON = process.env.NEXT_PUBLIC_CAP_TABLE_ON === "true"

/** Whether the partner cap-table surface should render. OFF by default. */
export function isCapTableOn(_businessId?: number | string | null): boolean {
  return ON
}

export const CAP_TABLE_ON = isCapTableOn()
