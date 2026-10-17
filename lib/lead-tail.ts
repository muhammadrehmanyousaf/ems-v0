/**
 * WP39 (P8 leads long tail): the small pure helpers behind the Leads screens, kept here so the list drawer, the quick view and the
 * detail page cannot drift apart, and so scripts/wp39-tail-check.mts can test them without a browser.
 *
 *   LEADS-013  a WhatsApp-only lead still has a number to call / message (callNumber / waNumber)
 *   LEADS-008  the follow-up is a Pakistan wall time end to end (followUpInputValue): the field is prefilled in Karachi time and sent as
 *              typed, no offset; the server reads an offset-less value as Karachi time too
 *   LEADS-005  an edit sends only the fields the vendor changed (changedLeadFields), so a closed lead is not sent content it cannot take
 *   LEADS-011  why a lead was lost: a short list the vendor picks from (LOST_REASONS)
 */

export interface LeadContactLike {
  contactPhone?: string | null
  contactWhatsapp?: string | null
}

const clean = (v?: string | null) => (v == null ? "" : String(v).trim())

/** The number to ring: the phone, else the WhatsApp number. "" when the lead has neither. */
export function callNumber(l: LeadContactLike | null | undefined): string {
  return clean(l?.contactPhone) || clean(l?.contactWhatsapp)
}

/** The number to message on WhatsApp: the WhatsApp number, else the phone. "" when the lead has neither. */
export function waNumber(l: LeadContactLike | null | undefined): string {
  return clean(l?.contactWhatsapp) || clean(l?.contactPhone)
}

const KARACHI = "Asia/Karachi"

/**
 * An ISO instant (or anything `Date` reads) as the value of an `<input type="datetime-local">` in KARACHI wall time
 * ("2026-12-12T10:00"). The old prefill was `String(iso).slice(0, 16)`: the UTC text, five hours early.
 */
export function followUpInputValue(iso?: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KARACHI, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "00"
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`
}

/** What the drawer sends: the typed wall time as typed (no offset), or null for an empty field. */
export function followUpPayload(typed: string): string | null {
  const v = (typed || "").trim()
  return v ? v : null
}

const NUMERIC = new Set(["estimatedBudget", "estimatedGuests", "subVenueId", "assignedToUserId", "businessId"])

function norm(field: string, v: unknown): string {
  if (v == null || v === "") return ""
  if (NUMERIC.has(field)) {
    const n = Number(v)
    return Number.isFinite(n) ? String(n) : String(v).trim()
  }
  if (field === "eventDate") return String(v).slice(0, 10)
  if (field === "contactPhone" || field === "contactWhatsapp") return String(v).replace(/[\s\-().]/g, "")
  return String(v).trim()
}

/**
 * The entries of `next` that differ from the stored lead `orig` (what the vendor actually changed). `orig` is the row as the list
 * returned it; `nextFollowUpAt` is compared in the drawer's own (Karachi wall time) form.
 */
export function changedLeadFields<T extends Record<string, unknown>>(next: T, orig: Record<string, unknown>): Partial<T> {
  const out: Partial<T> = {}
  for (const k of Object.keys(next) as (keyof T & string)[]) {
    // the drawer's one "note" box writes `inquiry`; it was prefilled from inquiry || notes
    const stored = k === "nextFollowUpAt" ? followUpInputValue(orig[k] as string | null) : k === "inquiry" ? (orig.inquiry ?? orig.notes) : orig[k]
    if (norm(k, next[k]) !== norm(k, stored)) out[k] = next[k]
  }
  return out
}

/** Why a lead was lost: the vendor picks one (it is stored as the lead's status reason and read back later). */
export const LOST_REASONS = [
  "Budget / price zyada tha",
  "Date kisi aur ne le li",
  "Doosra venue chun liya",
  "Jawab nahi aaya",
  "Shaadi cancel / taal di",
  "Other",
] as const
