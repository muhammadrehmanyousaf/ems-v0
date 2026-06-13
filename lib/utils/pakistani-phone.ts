/**
 * Issue #10 — single source of truth for Pakistani mobile-number
 * validation across every form in the system.
 *
 * Before this util, every vendor-type form and the customer booking
 * form embedded its own copy of `/^3\d{9}$/` (10 digits, no leading
 * zero). That rejected the human-friendly `0301...` format that
 * Pakistani users actually type, and produced inconsistent error
 * messages site-wide.
 *
 * This module accepts BOTH formats so vendors can paste whatever they
 * have on a business card:
 *
 *   "0301-1234567" → normalises to "3011234567"
 *   "+92 301 123 4567" → normalises to "3011234567"
 *   "3011234567" → already canonical
 *
 * Network rules: the first digit after the country code must be 3
 * (mobile prefix); landlines (2, 4, 5, …) are outside scope today.
 *
 * Storage convention: canonical 10-digit string (no leading 0, no
 * country code) so the existing DB rows don't need a backfill. The
 * UI separately shows the +92 prefix for clarity.
 */

const CANONICAL_LEN = 10;

/**
 * Strip everything except the digits, drop a leading 92 (country code)
 * or a leading 0 (national trunk), then trim to 10. Caller still has
 * to validate before persisting — this just normalises.
 */
export function normalizePakistaniPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  let digits = String(raw).replace(/\D/g, "");
  if (digits.startsWith("92") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  return digits.slice(0, CANONICAL_LEN);
}

/**
 * True iff the input — after normalisation — is a valid Pakistani
 * mobile number. Accepts the four common write-styles documented above.
 */
export function isValidPakistaniPhone(raw: string | null | undefined): boolean {
  const n = normalizePakistaniPhone(raw);
  return /^3\d{9}$/.test(n);
}

/**
 * One-line vendor-facing error message. Match the existing tone used in
 * business-registration-form.tsx so we don't introduce a new wording.
 */
export const PHONE_VALIDATION_MESSAGE =
  "Enter a 10- or 11-digit Pakistani mobile (e.g. 3001234567 or 03001234567).";
