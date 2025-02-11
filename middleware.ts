import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if it's a dashboard route
  
  return NextResponse.next()
}

export const config = {
  matcher: "",
}

