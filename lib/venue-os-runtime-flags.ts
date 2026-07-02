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

// External-store subscription so components can REACT when the flags resolve.
// Without this, a page rendered before the async health call finished would read
// an empty `runtime` and never re-render when it populates (the flags load "late"
// on a fresh load / hard navigation, only appearing after an unrelated re-render).
const flagListeners = new Set<() => void>()
export function setRuntimeFlags(flags: Record<string, boolean> | null | undefined): void {
  const next = flags || {}
  // Only notify when something actually changed (avoids render loops).
  const keys = new Set([...Object.keys(runtime), ...Object.keys(next)])
  let changed = false
  for (const k of keys) { if ((runtime[k] === true) !== (next[k] === true)) { changed = true; break } }
  runtime = next
  if (changed) flagListeners.forEach((l) => l())
}
function subscribeRuntimeFlags(cb: () => void): () => void {
  flagListeners.add(cb)
  return () => flagListeners.delete(cb)
}

/**
 * Reactive read of a single runtime flag (env-OR handled by callers). Re-renders
 * the component when the active venue's flags resolve or change. Use this in
 * render paths that must appear as soon as the flag is known; `runtimeFlagOn` stays
 * for synchronous, non-reactive checks.
 */
export function useRuntimeFlag(key: string): boolean {
  return React.useSyncExternalStore(
    subscribeRuntimeFlags,
    () => runtime[key] === true,
    () => false,
  )
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
