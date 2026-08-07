import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Middleware order (top → bottom):
 *   1. URL canonicalization (L3 lowercase enforcement) — 301 redirect
 *      anything with uppercase in the pathname to the lowercase equivalent.
 *      Reference: docs/seo/03-url-conventions-LOCKED.md §L3.
 *   2. Auth gate — protect dashboard / user / booking routes; bounce
 *      authenticated users away from /login + /register.
 *
 * Canonical host (L1 apex) and trailing-slash (L2 none) are handled at the
 * CDN / next.config layer, not here — keeps middleware fast and cacheable.
 */
/**
 * Paths whose trailing segment is a case-sensitive secret, not content.
 * The §L3 lowercase rule MUST NOT touch these — see WWL-079.
 *
 *   /sign/<token>    — customer contract signing (43-char base64url)
 *   /review/<token>  — review invitation
 *   /wedding/<token> — shared wedding plan
 *
 * Anything added here must be a non-indexable, token-bearing route.
 */
const CASE_SENSITIVE_PATHS = /^\/(sign|review|wedding)\/[^/]+/;

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // -----------------------------------------------------------------------
  // 1. Lowercase enforcement (L3)
  // -----------------------------------------------------------------------
  // App Router file paths are case-sensitive on Linux deployments. Any
  // request with uppercase characters is a duplicate-content risk and a
  // potential cache-key fragmentation. 301 once, cache forever.
  //
  // Skipped for: API routes (already excluded via matcher), Next.js internals,
  // and any path whose segment IS a case-sensitive secret (see below).
  //
  // WWL-079 (S1) — this rule silently destroyed every customer share link.
  // `/sign/<token>` carries a 43-character base64url token; lowercasing it
  // mangles every uppercase character, so the 301 landed the customer on
  // "Link not found — double-check the URL or ask the vendor to resend", and
  // resending produced another link that died the same way. No customer could
  // ever open a contract, which is WWL-080. Same shape for the review-invite
  // and wedding-share tokens.
  //
  // These paths are not indexable content, so they were never what §L3 was for.
  if (!CASE_SENSITIVE_PATHS.test(pathname) && pathname !== pathname.toLowerCase()) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.toLowerCase();
    return NextResponse.redirect(url, 301);
  }

  // -----------------------------------------------------------------------
  // 2. Auth gate
  // -----------------------------------------------------------------------
  const userId = request.cookies.get("user_id");
  const token = request.cookies.get("auth_token");
  const isAuthenticated = userId && token;

  const protectedRoutes = [
    '/user/profile',
    '/user/bookings',
    '/user/favorites',
    '/user/notifications',
    '/user/quotes',
    '/user/settings',
    // Complaints are read via /complaints/mine, which is 401 without a token —
    // an unauthenticated visitor would otherwise land on a screen that can only
    // fail. Raising a complaint stays public at /complaints.
    '/user/complaints',
    // Shaadi Plan — the whole multi-event cart surface is customer-scoped.
    '/user/plan',
    '/dashboard',
    '/booking',
  ];

  // Dynamic vendor booking routes: /[id]/booking
  const isVendorBookingRoute = /^\/\d+\/booking/.test(pathname);

  const isProtectedRoute =
    protectedRoutes.some((route) => pathname.startsWith(route)) || isVendorBookingRoute;

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if ((pathname === '/login' || pathname === '/register') && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // WW-ADDBIZ — /business-registration is a SIGNUP flow: it posts to
  // create-business-with-vendor, which creates a User as well as a Business and
  // answers "User already exists" to anyone who already has an account. A
  // signed-in vendor wanting a second venue would fill the entire multi-step form
  // and hit that wall. Send them to the add-business flow instead, which attaches
  // the business to the account they are already in.
  //
  // `?continue=1` is an explicit escape hatch so this can never become a redirect
  // loop with the add-business screen (whose own fallback links back here).
  if (
    pathname === '/business-registration' &&
    isAuthenticated &&
    request.nextUrl.searchParams.get('continue') !== '1'
  ) {
    return NextResponse.redirect(new URL('/dashboard/business/new', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
