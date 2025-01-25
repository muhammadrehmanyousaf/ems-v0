import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if it's a dashboard route
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    // Check for authentication
    const isAuthenticated = request.cookies.get("isAuthenticated")
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/vendor/login", request.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: "/dashboard/:path*",
}

