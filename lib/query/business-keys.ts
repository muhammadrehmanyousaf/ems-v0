import type { QueryClient } from "@tanstack/react-query"
import { pushLive } from "@/lib/seo/push-live"

/**
 * Every cache that holds the signed-in vendor's business record.
 *
 * `GET /businesses/user-business` is fetched under THREE different query keys
 * across the dashboard — `biz-settings-hub` (Settings), `my-businesses`
 * (fourteen screens: Leads, Staff, Suppliers, Function sheets, Promote,
 * Inventory, Reports, …) and `my-completeness` (the two profile-completion
 * cards and the onboarding checklist). One record, three caches.
 *
 * Settings invalidated only its own. So a vendor who renamed their venue, or
 * added the WhatsApp number the checklist had just told them to add, saw the
 * new value on the screen they typed it into and the OLD one everywhere else
 * until they reloaded the browser — including on the checklist that sent them
 * there, which went on asking for the thing they had just done.
 *
 * That is "updating a field doesn't update until refresh" and "nothing is
 * mapped until reload": not a save failure, a cache-fan-out failure. Every
 * mutation that touches a business calls this instead of naming one key, so a
 * fourth reader added tomorrow is covered by adding it here once.
 */
/**
 * THE key for `GET /businesses/user-business`. Read through `useMyBusinesses()`
 * (or `BusinessContext`), never by naming a key of your own — see the hook for
 * what five competing keys cost.
 */
export const businessListKey = ["businesses", "mine"] as const

export const BUSINESS_QUERY_KEYS = [
  businessListKey,
  // `my-completeness` is a DIFFERENT endpoint (GET /businesses/my-completeness)
  // that derives from the same record, so it has to be invalidated alongside it.
  ["my-completeness"],
  // SETUP-009 - the Setup checklist reads its own key (`onboarding-completeness`,
  // the same /my-completeness payload under the 10-minute global staleTime). It
  // was not in this list, so a vendor who saved the description the checklist
  // told them to write came back to an item that was still unticked until F5.
  ["onboarding-completeness"],
  // Retired keys. Nothing reads these since the business list was collapsed onto
  // `businessListKey`; invalidating a cache with no readers is a no-op, and they
  // stay listed so a call site that is reintroduced by mistake is still covered.
  ["biz-settings-hub"],
  ["my-businesses"],
] as const

/**
 * `refetchType: "all"` rather than the default "active": the completion card
 * and the checklist are usually mounted on a DIFFERENT route, so they are
 * inactive at the moment of the save and the default would mark them stale
 * without refetching — which looks identical to the bug from the vendor's side,
 * because the stale render is what they see when they navigate back.
 */
export function invalidateBusinessData(qc: QueryClient, businessId?: number | string | null): void {
  for (const key of BUSINESS_QUERY_KEYS) {
    qc.invalidateQueries({ queryKey: key as unknown as string[], refetchType: "all" })
  }
  // SETUP-026 - the public listing reads the backend through a 1-hour ISR window.
  // A save that changes what couples see (price, description, capacities,
  // amenities, listing content) now drops this vendor's cache entry like the
  // photo and video saves already did. Best effort and silent by design.
  if (businessId != null) void pushLive(businessId)
}

export default invalidateBusinessData
