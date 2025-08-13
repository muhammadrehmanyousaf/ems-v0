import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get authentication data from cookies (using new storage keys)
  const userId = request.cookies.get("user_id");
  const token = request.cookies.get("auth_token");
  const isAuthenticated = userId && token;

  console.log(`🔍 Middleware - Path: ${pathname}, Auth: ${isAuthenticated}, UserID: ${userId?.value}, Token: ${token ? 'present' : 'missing'}`);

  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/user/profile',
    '/user/bookings',
    '/user/favorites',
    '/user/settings'
  ];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // If accessing a protected route without authentication, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    console.log(`Middleware: Redirecting unauthenticated access to ${pathname} to /login`);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If accessing login page while authenticated, redirect to appropriate page
  if (pathname === '/login' && isAuthenticated) {
    console.log('Middleware: Redirecting authenticated user from login to home');
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}

