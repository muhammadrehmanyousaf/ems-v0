/**
 * The guided tour of the vendor portal.
 *
 * Written as a route through the product a hall owner actually walks — take an
 * enquiry, turn it into a booking, collect the money, run the night — rather
 * than a tour of the navigation. Nobody needs to be told what a sidebar is;
 * they need to be told where the money they are owed is listed.
 *
 * Each step points at a `data-tour` attribute. A step whose target is missing
 * is skipped rather than shown against an empty rectangle: the rail does not
 * render for admins, the completion card disappears at 100%, and on a phone the
 * rail is replaced by the bottom bar. A tour that breaks when the UI legitimately
 * differs is worse than no tour.
 */

export interface TourStep {
  id: string
  /** CSS selector for the element to spotlight. */
  target: string
  title: string
  body: string
  /** Navigate here first; the step waits for the target to appear. */
  route?: string
  placement?: "auto" | "right" | "bottom" | "left" | "top"
  /** Skip on small screens (e.g. the desktop-only rail). */
  desktopOnly?: boolean
}

export const TOUR_VERSION = "v1"
export const TOUR_SEEN_KEY = `ww:tour:${TOUR_VERSION}:seen`

export const TOUR_STEPS: TourStep[] = [
  {
    id: "rail",
    target: 'nav[aria-label="Modules"]',
    route: "/dashboard",
    title: "Everything lives in this strip",
    body:
      "Eight sections, always in the same place, never moving. Whatever you are doing, this is how you get somewhere else.",
    placement: "right",
    desktopOnly: true,
  },
  {
    id: "switcher",
    target: '[data-tour="business-switcher"]',
    title: "Switch between your venues",
    body:
      "Every number on every screen follows this. Pick one hall to see only its bookings and money, or All venues for the combined picture.",
    placement: "right",
    desktopOnly: true,
  },
  {
    id: "completion",
    target: '[data-tour="profile-completion"]',
    route: "/dashboard",
    title: "Finish your listing here",
    body:
      "This is what families see before they call you. It stays on this screen until it is done, and every item takes you straight to the field that fixes it.",
    placement: "bottom",
  },
  {
    id: "leads",
    target: '[data-tour="page-root"]',
    route: "/dashboard/leads",
    title: "Enquiries — every one, in one place",
    body:
      "WhatsApp, phone, walk-in and website enquiries all land here so none is forgotten. Reply, quote, and convert the good ones into bookings.",
    placement: "auto",
  },
  {
    id: "bookings",
    target: '[data-tour="page-root"]',
    route: "/dashboard/bookings",
    title: "Bookings — your confirmed events",
    body:
      "Every event with what is booked, what has been paid and what is still owed. Open one to see its full order, contract and payment history.",
    placement: "auto",
  },
  {
    id: "money",
    target: '[data-tour="page-root"]',
    route: "/dashboard/money",
    title: "Khata — the money side",
    body:
      "Who still owes you, what came in, receipts as proof, cheques waiting to clear and everything going out. Record a payment here and your dashboard updates with it.",
    placement: "auto",
  },
  {
    id: "calendar",
    target: '[data-tour="page-root"]',
    route: "/dashboard/calendar",
    title: "Calendar — dates you cannot double-book",
    body:
      "Every confirmed event on one grid. Blocked dates and Islamic-date blackouts sit underneath so you never take a booking you cannot honour.",
    placement: "auto",
  },
  {
    id: "settings",
    target: '[data-tour="page-root"]',
    route: "/dashboard/settings",
    title: "Set up — your listing and your terms",
    body:
      "Photos, pricing, packages, capacity, cancellation policy and payout account. You can restart this tour from here any time.",
    placement: "auto",
  },
]
