"use client"

/**
 * The vendor's business limit for the screens. The reading logic (and the
 * explanation of why it is tolerant) is in lib/business-limit-parse.ts; this file
 * is only the React hook that feeds it.
 */

import { useBillingStatus } from "@/hooks/use-billing-status"
import { useMyBusinesses } from "@/hooks/use-my-businesses"
import { useUser } from "@/context/UserContext"
import { parseBusinessLimit, type BusinessLimit } from "@/lib/business-limit-parse"

export { parseBusinessLimit, limitReachedFrom, describeLimit } from "@/lib/business-limit-parse"
export type { BusinessLimit, LimitReached } from "@/lib/business-limit-parse"

/**
 * The vendor's plan limit for businesses, or `null` while it is unknown (no data
 * yet, or the API does not publish it). Shares the `["billing-status"]` query the
 * billing gate already runs, so it costs no extra request.
 */
export function useBusinessLimit(): { limit: BusinessLimit | null; owned: number; atLimit: boolean } {
  const { user } = useUser()
  const isVendor = !!(user as { isVendor?: boolean } | null)?.isVendor
  const { data: businesses } = useMyBusinesses()
  const owned = businesses?.length ?? 0
  const { data } = useBillingStatus(isVendor)
  const limit = parseBusinessLimit(data, owned)
  return { limit, owned, atLimit: !!limit && limit.used >= limit.max }
}
