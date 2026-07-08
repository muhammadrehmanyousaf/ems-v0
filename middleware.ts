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
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // -----------------------------------------------------------------------
  // 1. Lowercase enforcement (L3)
  // -----------------------------------------------------------------------
  // App Router file paths are case-sensitive on Linux deployments. Any
  // request with uppercase characters is a duplicate-content risk and a
  // potential cache-key fragmentation. 301 once, cache forever.
  //
  // Skipped for: API routes (already excluded via matcher), Next.js internals.
  if (pathname !== pathname.toLowerCase()) {
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
    '/user/settings',
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
