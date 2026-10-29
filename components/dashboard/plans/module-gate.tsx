"use client"

/**
 * MODULE GATE: the portal side of the plan sheet. When the vendor's plan does not include the module a route belongs to
 * (lib/plan-gate.ts SCREEN_FEATURE), the screen is replaced by the "Available on <plan>" page with the upgrade action,
 * so a Free vendor cannot work inside a Basic/Pro module. The server refuses the writes as well (middlewares/moduleGate.js);
 * this is the visible half. Open while enforcement is off, while the plan loads, or if the lookup failed.
 */

import * as React from "react"
import { usePathname } from "next/navigation"
import { useFeature } from "@/context/plan-context"
import { featureForPath, type FeatureKey } from "@/lib/plan-gate"
import { PlanLockedCard } from "./plan-locked"

function Locked({ feature }: { feature: FeatureKey }) {
  const f = useFeature(feature)
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col justify-center gap-3 p-4" data-testid="module-locked" data-feature={feature}>
      <h1 className="text-xl font-semibold">{f.label}</h1>
      <PlanLockedCard feature={feature} />
    </div>
  )
}

function Gate({ feature, children }: { feature: FeatureKey; children: React.ReactNode }) {
  const f = useFeature(feature)
  return f.locked ? <Locked feature={feature} /> : <>{children}</>
}

export function ModuleGate({ children }: { children: React.ReactNode }) {
  const feature = featureForPath(usePathname())
  if (!feature) return <>{children}</>
  return <Gate feature={feature}>{children}</Gate>
}
