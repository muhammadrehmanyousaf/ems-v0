// EventNight console (valet, gold/cash two-person custody, incident hash-chain,
// same-night complaint apology, Clean Night Score) — feature flag (OFF by
// default). Venue-OS P2 · WS10. While unset no UI renders and the backend
// endpoints 404, so the live P1 headcount gauge is unchanged.
//
//   NEXT_PUBLIC_EVENTNIGHT_CONSOLE_ON=true   → render the console
//   (unset / anything else)                  → OFF (default)

const ON = process.env.NEXT_PUBLIC_EVENTNIGHT_CONSOLE_ON === "true"

/** Whether the EventNight console surface should render. OFF by default. */
export function isEventNightConsoleOn(_businessId?: number | string | null): boolean {
  return ON
}

export const EVENTNIGHT_CONSOLE_ON = isEventNightConsoleOn()
