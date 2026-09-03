"use client"

/**
 * Chooses the dashboard chrome by role:
 *  - vendor (and while the user is still loading): the PERSISTENT champagne
 *    shell — stays mounted across route changes, so navigating swaps only the
 *    page content (no per-route rebuild flash). Artifact screens render their
 *    content-only shadow inside it; React pages (settings hub) render directly.
 *  - admin / super-admin: the classic sidebar chrome (unchanged).
 */

import * as React from "react"
import { useUser } from "@/context/UserContext"
import { getDashboardRole, isAdminLike } from "@/lib/dashboard-role"
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar"
import { ModuleRail } from "@/components/dashboard/layout/module-rail"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import Header from "@/components/dashboard/layout/header"
import { VerificationBanner } from "@/components/auth/VerificationBanner"
import { MobileBottomNav } from "@/components/dashboard/layout/mobile-bottom-nav"
import { ChampagneShell } from "@/components/dashboard/layout/champagne-shell"

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const admin = isAdminLike(getDashboardRole(user))

  if (!admin) {
    return (
      <ChampagneShell>
        <VerificationBanner />
        {children}
      </ChampagneShell>
    )
  }

  // Classic chrome — admin / super-admin.
  return (
    <SidebarProvider className="h-dvh min-h-0 overflow-hidden">
      <ModuleRail />
      <AppSidebar />
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
        <Header />
        <div
          data-tour="page-root"
          data-dashboard-scroll=""
          style={{ paddingBottom: "var(--ww-mobile-nav, 0px)" }}
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-clip"
        >
          <div className="px-4 pt-4 md:px-6">
            <VerificationBanner />
          </div>
          {children}
        </div>
        <MobileBottomNav />
      </SidebarInset>
    </SidebarProvider>
  )
}

export default DashboardChrome
