// Ops Portal — click-to-chat links and the messages staff send from THEIR OWN WhatsApp (no provider, nothing is sent automatically).
// wa.me opens the agent's WhatsApp with the text ready; the agent reads it and presses send.

/** A Pakistani number in any common spelling -> digits wa.me wants (923001234567), or null when it is not usable. */
export function toWaNumber(phone: string | null | undefined): string | null {
  const d = String(phone ?? "").replace(/\D/g, "")
  if (d.length === 10 && d.startsWith("3")) return `92${d}`
  if (d.length === 11 && d.startsWith("03")) return `92${d.slice(1)}`
  if (d.length === 12 && d.startsWith("92")) return d
  if (d.length === 13 && d.startsWith("0092")) return d.slice(2)
  return null
}

export function waLink(phone: string | null | undefined, text: string): string {
  const n = toWaNumber(phone)
  return `https://wa.me/${n ?? ""}?text=${encodeURIComponent(text)}`
}

const hi = (name: string | null | undefined) => `Assalam o alaikum${name ? ` ${name}` : ""},`

export function signInMessage(p: { ownerName?: string | null; businessName: string; url: string; hours: number }): string {
  return `${hi(p.ownerName)}\n\nYour ${p.businessName} page on Wedding Wala is ready. Please open this link to choose your own password and sign in:\n${p.url}\n\nThe link works once and expires in ${p.hours} hours. Please do not share it with anyone.`
}

export function consentMessage(p: { ownerName?: string | null; businessName: string; city?: string | null }): string {
  return `${hi(p.ownerName)}\n\nAs we discussed, we are listing ${p.businessName}${p.city ? ` in ${p.city}` : ""} on Wedding Wala (weddingwala.pk) so couples can find and contact you. It is free to start.\n\nPlease reply YES to confirm you agree to have your business listed. If you do not, reply NO and we will remove it immediately.`
}

export function uploadMessage(p: { ownerName?: string | null; businessName: string; url: string; hours: number }): string {
  return `${hi(p.ownerName)}\n\nPlease add your best photos and videos of ${p.businessName} here, straight from your phone:\n${p.url}\n\nThe link is for you only and expires in ${p.hours} hours.`
}

/* ------------------------------------ the client desk ------------------------------------ */

export interface ShortlistVenue { id: number; name: string; city: string | null; vendorType: string | null; maxCapacity?: number | null; perHeadFromPkr?: string | number | null }

/** The message an agent sends from their own WhatsApp with the shortlisted venues (names, the page link, capacity and per-head price when known). */
export function shortlistMessage(p: { clientName?: string | null; venues: ShortlistVenue[]; origin: string; href: (v: ShortlistVenue) => string | undefined }): string {
  const lines = p.venues.map((v, i) => {
    const facts = [v.city, v.maxCapacity && v.maxCapacity > 1 ? `up to ${v.maxCapacity} guests` : null, v.perHeadFromPkr && Number(v.perHeadFromPkr) > 0 ? `from Rs ${Number(v.perHeadFromPkr).toLocaleString("en-PK")} per head` : null].filter(Boolean).join(", ")
    const link = p.href(v)
    return `${i + 1}. ${v.name}${facts ? ` (${facts})` : ""}${link ? `\n   ${p.origin}${link}` : ""}`
  })
  return `${hi(p.clientName)}\n\nThank you for contacting Wedding Wala. Here are the venues we shortlisted for you:\n\n${lines.join("\n")}\n\nWe are confirming dates and prices with each venue and will update you shortly.`
}

/** Ready WhatsApp message after Team A finishes checking availability & quotes. */
export function checkedResultsMessage(p: {
  clientName?: string | null
  items: {
    name: string
    availability: "available" | "unavailable" | "no_answer" | "pending"
    checkedForDate?: string | null
    quotedPricePkr?: string | number | null
    perHeadPkr?: string | number | null
    tokenAmountPkr?: string | number | null
    altSuggestion?: string | null
    note?: string | null
    link?: string
  }[]
  origin: string
}): string {
  const avail = p.items.filter((i) => i.availability === "available")
  if (!avail.length) {
    const alts = p.items.map((i) => i.altSuggestion).filter(Boolean)
    return `${hi(p.clientName)}\n\nWe called the shortlisted venue(s) for your event date, and unfortunately they are booked on that day.${alts.length ? `\n\nSuggested options:\n- ${alts.join("\n- ")}` : ""}\n\nWould you like us to check another date or suggest similar venues in your budget?`
  }
  const lines = avail.map((v, idx) => {
    const parts = [
      v.checkedForDate ? `Date free: ${v.checkedForDate}` : "Date confirmed FREE",
      v.quotedPricePkr && Number(v.quotedPricePkr) > 0 ? `Package: Rs ${Number(v.quotedPricePkr).toLocaleString("en-PK")}` : null,
      v.perHeadPkr && Number(v.perHeadPkr) > 0 ? `Per head: Rs ${Number(v.perHeadPkr).toLocaleString("en-PK")}` : null,
      v.tokenAmountPkr && Number(v.tokenAmountPkr) > 0 ? `Advance token: Rs ${Number(v.tokenAmountPkr).toLocaleString("en-PK")}` : null,
    ].filter(Boolean)
    return `${idx + 1}. *${v.name}*\n   ${parts.join(" · ")}${v.note ? `\n   Note: ${v.note}` : ""}${v.link ? `\n   ${p.origin}${v.link}` : ""}`
  })
  return `${hi(p.clientName)}\n\nGood news! We confirmed availability with the venue team:\n\n${lines.join("\n\n")}\n\nPlease let us know which time suits you for a hall visit or if you would like us to lock the booking.`
}
