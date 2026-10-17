"use client"

/**
 * THE GATE: wraps the whole vendor console. When the access store says the viewer is locked, EVERY route renders the Wall
 * instead of the console (sidebar, shadow-shell screens and all), except the few routes that must keep working:
 * plan & billing (with receipts), the account page and the add-a-business flow. Everything else, including routes added
 * later, is behind the Wall by default: this is a deny-by-default wrapper around the layout's children, and
 * scripts/plans-wall-check.mts fails the build if a route group under app/(dashboard) is not under it.
 *
 * Nothing here decides anything: `locked` is the server's state (status or a 402), read from the access store.
 */

import * as React from "react"
import { usePathname } from "next/navigation"
import { useAccess } from "@/hooks/use-access"
import { AccessWall } from "./wall/access-wall"

/** Routes that stay open while locked (prefix match on the path). Kept short and explicit; the guard pins this list. */
export const WALL_EXEMPT_PREFIXES: readonly string[] = [
  "/dashboard/billing", // plan & billing, the checkout return, receipts (/dashboard/billing/receipt/...)
  "/dashboard/profile", // the account
  "/dashboard/business/new", // adding the first business must stay possible (the trial starts on it)
  "/staff/login", // a staff member must be able to sign in and out (the Wall appears after, from the first 402)
]

export function isWallExempt(pathname: string): boolean {
  return WALL_EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

export function AccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ""
  const { access, locked } = useAccess()
  if (locked && access && !isWallExempt(pathname)) return <AccessWall access={access} />
  return <>{children}</>
}
