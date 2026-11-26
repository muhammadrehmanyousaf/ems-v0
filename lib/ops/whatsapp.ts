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
  return `https://wa.me/${n ?? ""}?text=${encodeURIComponent(text.slice(0, 3800))}`
}

/**
 * Direct WhatsApp Web deep-link that skips the wa.me landing page and opens straight
 * into the agent's already-logged-in web.whatsapp.com session with the message pre-filled.
 * If no phone is given, opens web.whatsapp.com/send?text=... so the agent can pick any open chat.
 */
export function waWebLink(phone: string | null | undefined, text: string): string {
  const n = toWaNumber(phone)
  const clean = text.slice(0, 3800)
  return n
    ? `https://web.whatsapp.com/send?phone=${n}&text=${encodeURIComponent(clean)}`
    : `https://web.whatsapp.com/send?text=${encodeURIComponent(clean)}`
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

/* ---------------------------- P9: Media / Menus / Area Share & Confirmed Client Handover ---------------------------- */

export function vendorMediaMenusMessage(p: {
  clientName?: string | null
  vendor: {
    name: string
    city?: string | null
    subArea?: string | null
    address?: string | null
    googleMapsUrl?: string | null
    minimumPrice?: string | number | null
    maxCapacity?: number | null
    minCapacity?: number | null
    images?: string[]
    videos?: string[]
  }
  packages?: { name: string; price?: number | null; pricingUnit?: string | null; features?: string[] }[]
  menus?: { title: string; price?: number | null; pricingUnit?: string | null; minGuaranteeCount?: number | null; items?: string[] }[]
  pageUrl?: string | null
  include?: { rates?: boolean; menus?: boolean; photos?: boolean; videos?: boolean; map?: boolean }
}): string {
  const inc = { rates: true, menus: true, photos: true, videos: true, map: true, ...(p.include || {}) }
  const v = p.vendor
  const sections: string[] = []
  const loc = [v.subArea, v.city].filter(Boolean).join(", ")
  const cap = v.maxCapacity && v.maxCapacity > 1 ? `${v.minCapacity ? `${v.minCapacity}-` : "Up to "}${v.maxCapacity} guests` : null
  sections.push(`${hi(p.clientName)}\n\nHere are complete details for *${v.name}*${loc ? ` (${loc})` : ""}${cap ? ` · ${cap}` : ""}:`)

  if (p.pageUrl) {
    sections.push(`*Full Gallery & Profile:*\n${p.pageUrl}`)
  }

  if (inc.rates && (v.minimumPrice || (p.packages && p.packages.length))) {
    const pkgLines: string[] = []
    if (v.minimumPrice && Number(v.minimumPrice) > 0) {
      pkgLines.push(`• Starting from Rs ${Number(v.minimumPrice).toLocaleString("en-PK")}`)
    }
    for (const pkg of (p.packages || []).slice(0, 5)) {
      const unit = pkg.pricingUnit === "per_head" ? "/head" : "/event"
      const priceStr = pkg.price ? ` — Rs ${Number(pkg.price).toLocaleString("en-PK")} ${unit}` : ""
      const feat = pkg.features?.length ? ` (${pkg.features.slice(0, 4).join(", ")})` : ""
      pkgLines.push(`• *${pkg.name}*${priceStr}${feat}`)
    }
    if (pkgLines.length) sections.push(`*Packages & Rates:*\n${pkgLines.join("\n")}`)
  }

  if (inc.menus && p.menus && p.menus.length > 0) {
    const mLines = p.menus.slice(0, 5).map((m) => {
      const price = m.price ? ` — Rs ${Number(m.price).toLocaleString("en-PK")}${m.pricingUnit === "per_event" ? "/event" : "/head"}` : ""
      const minG = m.minGuaranteeCount ? ` (Min ${m.minGuaranteeCount})` : ""
      const dishes = m.items?.length ? `\n  Dishes: ${m.items.slice(0, 12).join(", ")}${m.items.length > 12 ? "..." : ""}` : ""
      return `• *${m.title}*${price}${minG}${dishes}`
    })
    sections.push(`*Food Menus:*\n${mLines.join("\n")}`)
  }

  if (inc.photos && v.images && v.images.length > 0) {
    const photoLinks = v.images.slice(0, 5).map((u, i) => `${i + 1}. ${u}`)
    sections.push(`*Venue Photos (${Math.min(5, v.images.length)} of ${v.images.length}):*\n${photoLinks.join("\n")}`)
  }

  if (inc.videos && v.videos && v.videos.length > 0) {
    const vidLinks = v.videos.slice(0, 3).map((u, i) => `${i + 1}. ${u}`)
    sections.push(`*Venue Videos:*\n${vidLinks.join("\n")}`)
  }

  if (inc.map && (v.googleMapsUrl || v.address)) {
    const mapParts = [v.address, v.googleMapsUrl].filter(Boolean)
    sections.push(`*Location:*\n${mapParts.join("\n")}`)
  }

  sections.push("Let us know if you would like us to confirm your date availability or book a hall visit.")
  return sections.join("\n\n")
}

export function relatedVenuesMessage(p: {
  clientName?: string | null
  areaLabel: string
  venues: { id: number; name: string; city: string | null; subArea?: string | null; vendorType: string | null; maxCapacity?: number | null; minimumPrice?: string | number | null; perHeadFromPkr?: string | number | null }[]
  origin: string
  href: (v: { id: number; name: string; city: string | null; vendorType: string | null }) => string | undefined
}): string {
  const lines = p.venues.slice(0, 6).map((v, i) => {
    const facts = [
      [v.subArea, v.city].filter(Boolean).join(", "),
      v.maxCapacity && v.maxCapacity > 1 ? `up to ${v.maxCapacity} guests` : null,
      v.perHeadFromPkr && Number(v.perHeadFromPkr) > 0
        ? `from Rs ${Number(v.perHeadFromPkr).toLocaleString("en-PK")}/head`
        : v.minimumPrice && Number(v.minimumPrice) > 0
          ? `from Rs ${Number(v.minimumPrice).toLocaleString("en-PK")}`
          : null,
    ].filter(Boolean).join(" · ")
    const link = p.href(v)
    return `${i + 1}. *${v.name}*${facts ? ` (${facts})` : ""}${link ? `\n   ${p.origin}${link}` : ""}`
  })
  return `${hi(p.clientName)}\n\nHere are top matching venues in *${p.areaLabel}*:\n\n${lines.join("\n\n")}\n\nReply with the venue names you like best and we will confirm free dates and best rates for you.`
}

/** Team A / Booking Desk -> Vendor WhatsApp Web handover message with confirmed couple details. */
export function vendorConfirmedClientMessage(p: {
  vendorName?: string | null
  kind?: "booking" | "visit" | "availability"
  bookingId?: number | null
  clientName: string
  clientPhone?: string | null
  eventType?: string | null
  eventDate?: string | null
  timeSlot?: string | null
  guests?: number | null
  agreedTotalPkr?: string | number | null
  perHeadPkr?: string | number | null
  tokenAmountPkr?: string | number | null
  visitAt?: string | null
  notes?: string | null
}): string {
  const heading =
    p.kind === "booking"
      ? `*CONFIRMED CLIENT BOOKING${p.bookingId ? ` #${p.bookingId}` : ""} — WEDDING WALA*`
      : p.kind === "visit"
        ? "*CLIENT SITE VISIT CONFIRMED — WEDDING WALA*"
        : "*CLIENT DETAILS — WEDDING WALA*"
  const rows = [
    `*Venue:* ${p.vendorName || "Venue Partner"}`,
    `*Client Name:* ${p.clientName}`,
    p.clientPhone ? `*Client Contact:* ${p.clientPhone}` : null,
    p.eventType ? `*Function:* ${p.eventType}` : null,
    p.eventDate ? `*Event Date:* ${p.eventDate}${p.timeSlot ? ` (${p.timeSlot})` : ""}` : null,
    p.guests ? `*Expected Guests:* ${p.guests}` : null,
    p.agreedTotalPkr && Number(p.agreedTotalPkr) > 0 ? `*Agreed Total:* Rs ${Number(p.agreedTotalPkr).toLocaleString("en-PK")}` : null,
    p.perHeadPkr && Number(p.perHeadPkr) > 0 ? `*Per Head Rate:* Rs ${Number(p.perHeadPkr).toLocaleString("en-PK")}` : null,
    p.tokenAmountPkr && Number(p.tokenAmountPkr) > 0 ? `*Advance / Token:* Rs ${Number(p.tokenAmountPkr).toLocaleString("en-PK")}` : null,
    p.visitAt ? `*Visit Date & Time:* ${p.visitAt}` : null,
    p.notes ? `*Notes / Instructions:* ${p.notes}` : null,
  ].filter(Boolean)
  return `Assalam o alaikum,\n\n${heading}\n\n${rows.join("\n")}\n\nPlease coordinate directly with the family and confirm arrangements from your side. JazakAllah!`
}
