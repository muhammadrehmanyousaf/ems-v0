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

export function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? ""
  const hide = HIDE_CHROME_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )

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
