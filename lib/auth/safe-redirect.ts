/**
 * Where to send someone after they sign in.
 *
 * `middleware.ts` already appends `?redirect=<path>` when it bounces a logged-out
 * visitor off a protected route, but nothing ever read it back: the login form
 * pushed "/dashboard" for a vendor and "/" for a customer, unconditionally. So a
 * customer who tapped "Book Now" on a venue, hit "Login Required", and signed in
 * landed on the HOMEPAGE with their booking intent silently dropped — they had to
 * find the venue all over again. The same dead end applied to /user/bookings,
 * /user/favorites and every other guarded route.
 *
 * Only same-origin paths are honoured. A `redirect` value is attacker-controllable
 * (it is just a query string), so anything that could leave the site is refused
 * and the caller falls back to its own default. Rejected:
 *   - absolute URLs            https://evil.example/x
 *   - protocol-relative URLs   //evil.example/x
 *   - backslash tricks         /\evil.example  ·  \/evil.example
 *   - non-path values          javascript:alert(1)
 */
const SAME_SITE_BASE = "http://same-site.invalid"

export function safeRedirect(raw: string | null | undefined): string | null {
  if (!raw) return null

  let path = raw
  try {
    path = decodeURIComponent(raw)
  } catch {
    // A malformed escape sequence is not something we should follow.
    return null
  }

  // Must be a root-relative path…
  if (!path.startsWith("/")) return null
  // …and must not be protocol-relative or backslash-smuggled into another host.
  if (/^[/\\]{2}/.test(path)) return null
  if (path.includes("\\")) return null
  // WP33 / PUBLIC-002: a TAB / LF / CR (or any control character) inside the path is stripped by the URL parser, so
  // `/\t/example.org` became `//example.org` and the post-login redirect left the site. Refuse control characters, then
  // re-validate by resolving the path against a fixed origin: anything that does not stay on it is not a same-site path.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f-\u009f]/.test(path)) return null
  let resolved: URL
  try {
    resolved = new URL(path, SAME_SITE_BASE)
  } catch {
    return null
  }
  if (resolved.origin !== SAME_SITE_BASE) return null
  const clean = resolved.pathname + resolved.search + resolved.hash
  if (clean.startsWith("//")) return null

  // Never bounce straight back to an auth screen — that loops.
  if (/^\/(login|register)(\/|\?|$)/.test(clean)) return null

  return clean
}
