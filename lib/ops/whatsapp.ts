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
