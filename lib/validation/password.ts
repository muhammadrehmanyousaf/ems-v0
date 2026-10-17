/**
 * ONE password rule for every screen that SETS a password (WP34, SETUP-001 /
 * CUSTOMER-026 / PUBLIC-006).
 *
 * This is a line-for-line mirror of the server's `src/utils/passwordPolicy.js`
 * (`check`), with the same wording, so the form refuses what the server would
 * refuse and the message is the one the server would have sent:
 *
 *   - at least 10 characters
 *   - a lowercase letter
 *   - an uppercase letter OR a digit OR a symbol
 *   - not all digits
 *   - not on the common-password short list
 *
 * It must NEVER be used to gate SIGN-IN. Accounts created under older rules
 * (6-9 characters) exist and must still be able to sign in; only the screens
 * that set a password (register, reset, change, admin create-user) use it.
 *
 * scripts/session-check.mts holds this file to the server's table.
 */

export const PASSWORD_MIN_LENGTH = 10

/** The one-line rule every setter screen prints. */
export const PASSWORD_RULE_TEXT =
  "At least 10 characters, with a lowercase letter and an uppercase letter, digit or symbol"

/** Short hint under a password field. */
export const PASSWORD_HINT = "Min 10 characters"

const COMMON = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "qwertyuiop",
  "letmeinplease",
  "iloveyou123",
  "admin12345",
  "welcome123",
  "ajoint1234",
])

export type PasswordCheck = { ok: true } | { ok: false; reason: string }

export function checkPassword(password: unknown): PasswordCheck {
  if (typeof password !== "string") return { ok: false, reason: "Password is required" }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, reason: "Password must be at least 10 characters" }
  }
  if (!/[a-z]/.test(password)) return { ok: false, reason: "Password must contain a lowercase letter" }
  if (!/[A-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { ok: false, reason: "Password must contain an uppercase letter, digit, or symbol" }
  }
  if (/^\d+$/.test(password)) return { ok: false, reason: "Password cannot be all digits" }
  if (COMMON.has(password.toLowerCase())) {
    return { ok: false, reason: "This password is too common — please choose another" }
  }
  return { ok: true }
}

/** The message to show for a password, or null when it is acceptable. */
export function passwordProblem(password: unknown): string | null {
  const r = checkPassword(password)
  return r.ok ? null : r.reason
}
