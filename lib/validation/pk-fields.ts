/**
 * Contact-field rules — Pakistani phone, email.
 *
 * These moved out of `components/dashboard/primitives/field-error.tsx`, which
 * re-exports them so every existing import keeps working. They live here for
 * two reasons: they are pure functions with no JSX, and a `.tsx` file cannot
 * be loaded by Node's native type stripping, so the property checks in
 * scripts/field-validation-check.mjs could not reach them.
 *
 * The rule these encode: validate permissively, store strictly. Someone typing
 * their own phone number is not filling in a form field, they are writing down
 * a number, and they will write it the way they always have.
 */

/**
 * Pakistani phone. Accepts every separator people really use, then insists on
 * a genuine PK number underneath.
 *
 * Mobile:   03XXXXXXXXX | +923XXXXXXXXX | 923XXXXXXXXX
 * Landline: 0 + area code + subscriber number
 */
export function validatePkPhone(
  value: string,
  { label = "Phone number", required = true }: { label?: string; required?: boolean } = {},
): string | undefined {
  const raw = (value ?? "").trim()
  if (!raw) return required ? `${label} is required.` : undefined
  const d = raw.replace(/[\s\-()./]/g, "")
  const mobile = /^(?:\+92|92|0)3\d{9}$/
  /**
   * Landlines must NOT start with 3 — that range is mobile.
   *
   * The old pattern was `\d{9,11}`, which happily matched "0300123456": a
   * mobile one digit short. It validated, saved, and then the OTP went
   * nowhere, because there is no such phone. A typo has to be caught at the
   * field, not discovered when the code fails to arrive.
   *
   * PK area codes start 2,4,5,6,7,8 or 9 (021 Karachi, 042 Lahore, 051
   * Islamabad); only mobiles start 3.
   */
  const landline = /^(?:\+92|92|0)[2456789]\d{8,10}$/
  if (mobile.test(d) || landline.test(d)) return undefined
  return `Enter a valid Pakistani number, e.g. 0300 1234567.`
}

/**
 * Email. Intentionally permissive on the local part (real addresses are
 * stranger than most regexes allow) but insists on a dot-separated domain, so
 * "notanemail" and "a@b" are caught while "x+tag@sub.domain.pk" is not.
 */
export function validateEmail(
  value: string,
  { label = "Email", required = false }: { label?: string; required?: boolean } = {},
): string | undefined {
  const v = (value ?? "").trim()
  if (!v) return required ? `${label} is required.` : undefined
  if (/\s/.test(v)) return `${label} cannot contain spaces.`
  if (!/^[^@]+@[^@.]+(\.[^@.]+)+$/.test(v)) return `Enter a valid email address, e.g. name@example.com.`
  if (v.length > 254) return `${label} is too long.`
  return undefined
}

/**
 * One canonical stored shape for a Pakistani mobile: `03XXXXXXXXX`.
 *
 * People type 0300 1234567, +92 300 1234567, 92-300-1234567 and 03001234567,
 * and every one of those is correct. Stored verbatim they become four
 * different customers, and every later lookup — dedupe, OTP delivery, "we
 * already have an account for this number" — quietly misses.
 *
 * Anything that isn't a recognisable PK mobile comes back trimmed and
 * otherwise untouched: this normalises, it never invents. Rejecting is
 * validatePkPhone's job.
 */
export function normalizePkPhone(value: string): string {
  const d = (value ?? "").trim().replace(/[\s\-()./]/g, "")
  const m = /^(?:\+92|92|0)(3\d{9})$/.exec(d)
  return m ? `0${m[1]}` : (value ?? "").trim()
}

/** Store one shape for email too — addresses are case-insensitive in practice. */
export function normalizeEmail(value: string): string {
  return (value ?? "").trim().toLowerCase()
}
