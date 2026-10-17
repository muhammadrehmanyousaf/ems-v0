/**
 * WP33 / BOOKINGS-003, -005, -014 - the checks the Nayi booking drawer runs BEFORE it sends, mirroring the server's rules
 * (backend src/utils/bookingContact.js, bookingEditRules.js, the GUEST_COUNT_REQUIRED door). The server decides; these only
 * say so earlier, next to the field, in words the vendor reads. Pure functions: guarded by scripts/wp33-input-check.mts.
 */

/** Phone: 7-15 digits, an optional leading +, and the separators people type. Letters and a lone '1' are not phones. */
export function phoneIssue(raw: string): string | null {
  const s = String(raw ?? "").trim()
  if (!s) return "Phone likhein"
  const stripped = s.replace(/[\s\-().]/g, "")
  if (/[^\d+]/.test(stripped) || stripped.indexOf("+") > 0) return "Phone number sahi likhein (e.g. 0300 1234567)"
  const digits = stripped.replace(/\D/g, "")
  if (digits.length < 7 || digits.length > 15) return "Phone number sahi likhein (e.g. 0300 1234567)"
  return null
}

export function nameIssue(raw: string): string | null {
  const s = String(raw ?? "").trim()
  if (!s) return "Customer ka naam likhein"
  if (s.length > 120) return "Naam bohat lamba hai (120 se kam)"
  if (/[<>]/.test(s)) return "Naam mein < ya > nahi ho sakta"
  return null
}

export function emailIssue(raw: string): string | null {
  const s = String(raw ?? "").trim()
  if (!s) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? null : "Email sahi likhein (ya khali chhorein)"
}

/** A past day is refused (the server answers event_date_in_past). `today` is the PKT day; both are YYYY-MM-DD. */
export function dateIssue(day: string, today: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "Tareekh chunein"
  return day < today ? "Ye tareekh guzar chuki hai — aaj ya aane wali tareekh chunein" : null
}

/** The last day the date input offers: three years ahead (the calendar blocks are bounded the same way). */
export function maxBookingDay(today: string, years = 3): string {
  const [y, m, d] = today.split("-").map(Number)
  return `${y + years}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

/**
 * A per-head package or menu with no guest count (and no guarantee that bills a minimum) books at ONE head. `selected` are the
 * chosen options' data-unit / data-min values.
 */
export function guestsRequired(selected: Array<{ unit?: string | null; minGuarantee?: number | null }>, guests: number): boolean {
  if (Number.isFinite(guests) && guests > 0) return false
  return selected.some((s) => String(s.unit || "").toLowerCase() === "per_head" && !(Number(s.minGuarantee) > 0))
}

/** The server's English / code answers the Nayi booking drawer used to print raw. */
export function bookingErrorMessage(code: string | undefined | null): string | null {
  switch (code) {
    case "event_date_in_past": return "Ye tareekh guzar chuki hai — aaj ya aane wali tareekh chunein."
    case "GUEST_COUNT_REQUIRED": return "Is package ki qeemat per mehmaan hai — mehmaan ki tadaad likhein."
    case "INVALID_CONTACT": return null // the server's own sentence names the field
    default: return null
  }
}
