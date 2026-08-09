import type { QueryClient } from "@tanstack/react-query"

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
export const BUSINESS_QUERY_KEYS = [
  ["biz-settings-hub"],
  ["my-businesses"],
  ["my-completeness"],
] as const

/**
 * `refetchType: "all"` rather than the default "active": the completion card
 * and the checklist are usually mounted on a DIFFERENT route, so they are
 * inactive at the moment of the save and the default would mark them stale
 * without refetching — which looks identical to the bug from the vendor's side,
 * because the stale render is what they see when they navigate back.
 */
export function invalidateBusinessData(qc: QueryClient): void {
  for (const key of BUSINESS_QUERY_KEYS) {
    qc.invalidateQueries({ queryKey: key as unknown as string[], refetchType: "all" })
  }
}

export default invalidateBusinessData
