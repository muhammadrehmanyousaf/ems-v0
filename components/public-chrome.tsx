"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { PageTransition } from "@/components/ui/page-transition"

/**
 * Public marketing chrome (Header + Footer) wraps every /(main)/* page
 * EXCEPT routes that own their own layout chrome — currently /user/*
 * (DashboardShell) and /(booking)/*. Those paths render the children
 * directly so the dashboard's sidebar/topbar can take the whole viewport.
 */
const HIDE_CHROME_PREFIXES = ["/user", "/dashboard"] as const
/**
 * The booking route (`/3358/booking`) is a checkout, not a page inside the
 * marketing site. It draws its own chrome — a wordmark, a way back to the
 * venue, a trust line — and the nav, the newsletter block and the footer
 * would only put 1,000px of links under a form that has to fit one screen.
 * Numeric ids only: the legacy `/booking` marketing page keeps its chrome.
 */
const HIDE_CHROME_PATTERNS = [/^\/\d+\/booking(\/|$)/] as const

export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ""
  const hide =
    HIDE_CHROME_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    HIDE_CHROME_PATTERNS.some((re) => re.test(pathname))

  if (hide) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <main className="min-h-screen w-full">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </>
  )
}
