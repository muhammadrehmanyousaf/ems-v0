"use client"

/**
 * WWL-114 — the venue switcher must never leave another venue's data on screen.
 *
 * Venue scope is applied by the axios interceptor: any request to a
 * business-scoped prefix picks up `?businessId=` from the active-business
 * store. So switching venues changes every REQUEST — but it does not change any
 * TanStack cache KEY, and 42 dashboard views key their queries by name alone
 * (`["payments-redesigned"]`, `["customers-redesigned"]`, …).
 *
 * The result, driven live and offline: switching to Rehman Grand Marquee
 * updated the switcher label and the persisted store, while the table still
 * showed all 25 rows across 3 venues and the cards still read Rs 37,348,900 —
 * that venue's real total is Rs 12,873,800. No error, no toast, no banner. One
 * venue named, three venues' money. It self-corrected only when a refetch
 * happened to succeed.
 *
 * Fixing 42 query keys one at a time would fix the ones anybody remembered.
 * This removes the possibility instead: when the active venue changes, cached
 * results for venue-scoped data are dropped, so the next paint is a loading
 * state and never the previous venue's figures. Offline, that becomes an honest
 * error rather than a confident wrong number.
 *
 * `removeQueries` rather than `invalidateQueries` on purpose — invalidation
 * refetches but keeps serving the stale entry meanwhile, which is precisely the
 * lie being fixed.
 *
 * The allowlist below is data that genuinely is not venue-scoped; dropping it
 * would only cost a refetch of things that never differ by venue.
 */

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useActiveBusinessId } from "@/lib/store/active-business-store"

/** Query-key prefixes that are the same whichever venue is selected. */
const VENUE_AGNOSTIC = new Set([
  "my-businesses",
  "user",
  "profile",
  "me",
  "notifications",
  "chat",
  "conversations",
  "vendor-types",
  "cities",
])

export function VenueScopeSync(): null {
  const qc = useQueryClient()
  const activeBusinessId = useActiveBusinessId()
  // Skip the first run: mounting is not a venue change, and dropping the cache
  // on every page load would refetch the whole dashboard for no reason.
  const previous = React.useRef<number | null | undefined>(undefined)

  React.useEffect(() => {
    const prev = previous.current
    previous.current = activeBusinessId
    if (prev === undefined || prev === activeBusinessId) return

    qc.removeQueries({
      predicate: (query) => {
        const head = query.queryKey?.[0]
        if (typeof head !== "string") return true
        return !VENUE_AGNOSTIC.has(head)
      },
    })
  }, [activeBusinessId, qc])

  return null
}

export default VenueScopeSync
