import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const userId = request.cookies.get("user_id");
  const token = request.cookies.get("auth_token");
  const isAuthenticated = userId && token;

  // Protected routes that require authentication
  const protectedRoutes = [
    '/user/profile',
    '/user/bookings',
    '/user/favorites',
    '/user/notifications',
    '/user/settings',
    '/dashboard',
    '/booking',
  ];

  // Also protect dynamic vendor booking routes: /[id]/booking
  const isVendorBookingRoute = /^\/\d+\/booking/.test(pathname);

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route)) || isVendorBookingRoute;

  // If accessing a protected route without authentication, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl);
  }

  // If accessing login/register pages while authenticated, redirect to dashboard
  if ((pathname === '/login' || pathname === '/register') && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
