/**
 * One way to END a browser session (WP34: SETUP-035, BOOKINGS-075, MONEY-069,
 * CUSTOMER-060, SETUP-036/039).
 *
 * The defect: a 401 mid-session ran `localStorage.clear(); location = "/login"`.
 * That left the auth COOKIES (user_id, auth_token, session_expiry, auth_jti,
 * user_data) behind, and middleware.ts treats those cookies as "signed in", so it
 * bounced /login straight back to /dashboard, where the SPA (no token in storage)
 * 401'd again or rendered nothing: a permanently blank page that only clearing
 * cookies by hand could fix. `localStorage.clear()` also threw away things that are
 * not the session at all: the theme, the cookie-consent choice, and the customer's
 * half-filled booking draft.
 *
 * Everything that ends a session (the Sign-out button, the 401 handler, the cookie
 * safety net in ProtectedRoutes, the /login page when it is told the session ended)
 * goes through `clearAuthStorage()`, so they all remove the SAME keys, in storage
 * AND in cookies, and the per-user active-venue scope with them.
 */

import Cookies from "js-cookie"
import { useActiveBusinessStore } from "@/lib/store/active-business-store"

/** Every key that identifies a signed-in browser (localStorage AND cookie). */
export const AUTH_KEYS = [
  "user_id",
  "auth_token",
  "user_data",
  "session_expiry",
  "auth_jti",
  "auth_flags",
  "ww_role", // WP36: the role hint middleware.ts reads (customer | vendor)
] as const

/** The persisted active-venue store belongs to the account that picked it. */
export const ACTIVE_BUSINESS_KEY = "ww-active-business"

/**
 * Remove the session from this browser. Touches ONLY auth keys, the active-venue
 * scope and the legacy cookie copies; theme, consent and unsent drafts survive.
 * Safe to call repeatedly and when storage is unavailable.
 */
export function clearAuthStorage(): void {
  if (typeof window === "undefined") return
  for (const key of AUTH_KEYS) {
    try { window.localStorage.removeItem(key) } catch { /* storage blocked */ }
    try { Cookies.remove(key, { path: "/" }) } catch { /* ignore */ }
    try { Cookies.remove(key) } catch { /* ignore */ }
  }
  // SETUP-039: vendor A's venue id must not survive into vendor B's session.
  try { useActiveBusinessStore.getState().setActiveBusinessId(null) } catch { /* ignore */ }
  try { window.localStorage.removeItem(ACTIVE_BUSINESS_KEY) } catch { /* ignore */ }
}

/** Is there any trace of a session (storage or cookie)? */
export function hasAuthTrace(): boolean {
  if (typeof window === "undefined") return false
  try {
    if (window.localStorage.getItem("auth_token")) return true
  } catch { /* ignore */ }
  try {
    return !!Cookies.get("auth_token")
  } catch {
    return false
  }
}

/**
 * `/login?redirect=<where the person was>&reason=expired`.
 * `redirect` is the parameter middleware.ts and LoginForm already use; the login
 * form runs it through safeRedirect(), so this stays a same-origin path.
 */
export function expiredLoginUrl(returnTo?: string | null): string {
  const params = new URLSearchParams()
  const back = returnTo || ""
  // never loop back to an auth screen
  const sameOriginPath = back.startsWith("/") && !/^[/\\]{2}/.test(back) && !back.includes("\\")
  if (sameOriginPath && !/^\/(login|register)(\/|\?|$)/.test(back)) params.set("redirect", back)
  params.set("reason", "expired")
  return `/login?${params.toString()}`
}

let ending = false

/**
 * The session is over (the server answered 401 to a request that carried a token,
 * or the browser holds a half-session). Clear it everywhere and go to /login with
 * a way back. Idempotent: ten parallel requests that all 401 navigate once.
 */
export function endSessionAndGoToLogin(): void {
  if (typeof window === "undefined" || ending) return
  ending = true
  const here = `${window.location.pathname}${window.location.search}`
  clearAuthStorage()
  try {
    window.dispatchEvent(new CustomEvent("userLogout"))
  } catch { /* ignore */ }
  window.location.assign(expiredLoginUrl(here))
}

/** Test seam: the guard script resets the latch between cases. */
export function _resetEndingForTests(): void {
  ending = false
}
