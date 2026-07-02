"use client"

/**
 * Per-venue runtime flag resolution for the venue-OS hub.
 *
 * The venue-OS FE flags (isOrgMembershipOn, isGlEngineOn, …) are build-time
 * global env vars — they can't be turned on for one venue without exposing the
 * hub to every vendor. This module lets those flags ALSO consult a runtime map
 * fetched per active venue from `GET /venue-os/health?businessId=`, which honours
 * the backend FeatureFlagOverride (business > org > global > env). So a pilot
 * venue with per-business overrides sees the hub; everyone else does not — no
 * global flip. The flag functions read `runtimeFlagOn(KEY)` with an env-OR fallback.
 */
import * as React from "react"
import { venueOsApi } from "@/lib/api/venueOs"
import { useActiveBusinessStore } from "@/lib/store/active-business-store"
import { BusinessesAPI } from "@/lib/api/dashboard"

// Module-level store holding the ACTIVE venue's resolved flags. The hook below
// keeps it in sync; the flag functions read it synchronously during render.
let runtime: Record<string, boolean> = {}
export function runtimeFlagOn(key: string): boolean {
  return runtime[key] === true
}
export function setRuntimeFlags(flags: Record<string, boolean> | null | undefined): void {
  runtime = flags || {}
}

/**
 * Fetch + cache the venue-OS flags for the active venue (or the vendor's first
 * business when "All venues" is selected). Returns loading + the flag map, and
 * re-renders consumers when it resolves so the flag functions pick up the values.
 */
export function useVenueOsFlags(): { loading: boolean; flags: Record<string, boolean> } {
  const activeBusinessId = useActiveBusinessStore((s) => s.activeBusinessId)
  const [state, setState] = React.useState<{ loading: boolean; flags: Record<string, boolean> }>(
    { loading: true, flags: runtime },
  )

  React.useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true }))
    ;(async () => {
      let bid = activeBusinessId
      if (bid == null) {
        try {
          const list = await BusinessesAPI.getUserBusinesses()
          if (list?.length) bid = list[0].id
        } catch { /* ignore */ }
      }
      try {
        const health = await venueOsApi.health(bid)
        if (cancelled) return
        setRuntimeFlags(health?.flags)
        setState({ loading: false, flags: health?.flags || {} })
      } catch {
        if (cancelled) return
        setRuntimeFlags({})
        setState({ loading: false, flags: {} })
      }
    })()
    return () => { cancelled = true }
  }, [activeBusinessId])

  return state
}
