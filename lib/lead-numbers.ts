/**
 * Lead budget and guest count: which typed values are refused, in ONE place.
 *
 * Owner bug #3 (2026-10-16): the "Naya lead" drawer took Budget (Rs) "-1" and let it be submitted. The server
 * already refused a negative budget (400 INVALID_LEAD) but only AFTER the round trip, and nothing refused a
 * budget of 0 or a guest count of 0 at all. The server now refuses all of them on create
 * (backend src/utils/leadHelpers.js collectLeadFieldErrors, requirePositive) and this module mirrors that rule
 * so the form can say so before sending. scripts/lead-numbers-check.mts pins the two together.
 *
 * Empty is always fine ("unknown yet"): a lead is logged before anyone has asked about money.
 * A function returns a CODE, not a sentence: the Leads drawer words it in Roman Urdu, the redesigned dialog in English.
 */

/** Rs 50 crore, the server's typo guard (backend MAX_BUDGET). */
export const LEAD_MAX_BUDGET = 500_000_000
/** The server's cap (backend MAX_GUESTS). */
export const LEAD_MAX_GUESTS = 100_000

export type LeadNumberError = "negative" | "zero" | "not_a_number" | "too_big" | "fraction"

const blank = (raw: unknown) => raw == null || String(raw).trim() === ""

/** null when the typed budget is acceptable (including empty). */
export function leadBudgetError(raw: string | number | null | undefined): LeadNumberError | null {
  if (blank(raw)) return null
  const n = Number(String(raw).trim())
  if (!Number.isFinite(n)) return "not_a_number"
  if (n < 0) return "negative"
  if (n === 0) return "zero"
  if (n > LEAD_MAX_BUDGET) return "too_big"
  return null
}

/** null when the typed guest count is acceptable (including empty). */
export function leadGuestsError(raw: string | number | null | undefined): LeadNumberError | null {
  if (blank(raw)) return null
  const n = Number(String(raw).trim())
  if (!Number.isFinite(n)) return "not_a_number"
  if (n < 0) return "negative"
  if (!Number.isInteger(n)) return "fraction"
  if (n === 0) return "zero"
  if (n > LEAD_MAX_GUESTS) return "too_big"
  return null
}

/** English sentences (the redesigned dialog); same meaning as the server's. */
export function leadNumberMessageEn(field: "budget" | "guests", e: LeadNumberError): string {
  const what = field === "budget" ? "Budget" : "Guests"
  switch (e) {
    case "negative": return `${what} can't be negative.`
    case "zero": return field === "budget" ? "Budget must be more than Rs 0 — leave it empty if you don't know yet." : "Guests must be at least 1 — leave it empty if you don't know yet."
    case "fraction": return "Guests must be a whole number."
    case "too_big": return field === "budget" ? `Budget can't be more than Rs ${LEAD_MAX_BUDGET.toLocaleString("en-PK")}.` : `Guests can't be more than ${LEAD_MAX_GUESTS.toLocaleString("en-PK")}.`
    default: return `${what} must be a number.`
  }
}

/** Roman Urdu sentences (the Leads drawer), in the voice of the rest of that screen. */
export function leadNumberMessageUr(field: "budget" | "guests", e: LeadNumberError): string {
  switch (e) {
    case "negative": return field === "budget" ? "Budget minus mein nahi ho sakta" : "Mehmaan minus mein nahi ho sakte"
    case "zero": return field === "budget" ? "Budget Rs 0 se zyada likhein — pata na ho to khali chhor dein" : "Mehmaan kam az kam 1 likhein — pata na ho to khali chhor dein"
    case "fraction": return "Mehmaan poora number likhein"
    case "too_big": return field === "budget" ? "Budget bohat zyada hai — dobara check karein" : "Mehmaan ki tadaad bohat zyada hai — dobara check karein"
    default: return field === "budget" ? "Budget number mein likhein" : "Mehmaan number mein likhein"
  }
}
