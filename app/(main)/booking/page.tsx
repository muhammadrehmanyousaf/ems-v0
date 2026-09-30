import { redirect } from "next/navigation"

/**
 * `/booking` with no venue used to mount the whole booking form inside the
 * marketing chrome, where it had nothing to book and rendered its error card.
 * Nothing links here (grep: no `href="/booking"` anywhere). A person who types
 * it wants to book something; the venues list is where that starts.
 */
export default function LegacyBookingPage() {
  redirect("/venues")
}
