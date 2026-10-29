"use client"

/**
 * Chooses the dashboard chrome by role:
 * Both vendor and admin / super-admin use the PERSISTENT champagne shell
 * for a pixel-to-pixel identical luxury layout, theme tokens, typography,
 * and unified navigation experience.
 */

import * as React from "react"
import { useUser } from "@/context/UserContext"
import { getDashboardRole, isAdminLike } from "@/lib/dashboard-role"
import { VerificationBanner } from "@/components/auth/VerificationBanner"
import { ChampagneShell } from "@/components/dashboard/layout/champagne-shell"
import { PlanBanners } from "@/components/dashboard/plans/banners/plan-banners"
import { LimitBanner } from "@/components/dashboard/plans/banners/limit-banner"

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const admin = isAdminLike(getDashboardRole(user))

  return (
    <ChampagneShell>
      {!admin && <PlanBanners />}
      {!admin && <LimitBanner />}
      <VerificationBanner />
      {children}
    </ChampagneShell>
  )
}

export default DashboardChrome
