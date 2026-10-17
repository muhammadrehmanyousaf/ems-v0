import { safeRedirect } from "@/lib/auth/safe-redirect"

/**
 * WP36 / PUBLIC-037 - the login URL that brings the visitor BACK to where they were.
 *
 * Twenty-odd "please sign in" handlers (Book now, Add to plan, Save, Message, Review ...) pushed a bare "/login", so a
 * visitor who signed in landed on the home page and had to find the vendor all over again. `/login` already honours
 * `?redirect=<same-origin path>` (safeRedirect); the handlers just never sent it. Pass `returnTo` to name another page;
 * by default it is the current path and query. An unsafe or auth-screen target falls back to the plain "/login".
 */
export function loginUrl(returnTo?: string): string {
  const here = typeof window !== "undefined" ? window.location.pathname + window.location.search : ""
  const safe = safeRedirect(returnTo ?? here)
  return safe ? `/login?redirect=${encodeURIComponent(safe)}` : "/login"
}
