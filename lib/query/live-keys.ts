/**
 * Notification type -> the NON-money query families it makes stale
 * (CONCURRENCY-021). The money families live in money-keys.ts; the socket
 * handler in NotificationContext used to refresh only those, so a "new lead" or
 * "new review" bell ping left the Leads / Reviews lists as they were for their
 * whole staleTime. Pure data + one function so a guard can pin it.
 */
const RULES: { test: RegExp; keys: readonly (readonly string[])[] }[] = [
  // data.kind of the in-app notice the admin queue sends: business_approved | business_rejected | business_suspended | business_request_changes
  { test: /^business_(approved|rejected|suspended|request_changes)$/, keys: [["businesses", "mine"], ["my-businesses"], ["my-completeness"], ["billing-status"]] },
  { test: /^(new_lead|lead_)/, keys: [["leads-artifact"], ["lead-detail"], ["leads"]] },
  { test: /^(new_review|review_)/, keys: [["reviews-art"], ["art-reviews"]] },
]

export function liveKeysFor(n: { type?: string | null; data?: Record<string, unknown> | null } | null | undefined): readonly (readonly string[])[] {
  if (!n) return []
  const candidates = [
    n.type,
    typeof n.data?.intendedType === "string" ? (n.data!.intendedType as string) : "",
    typeof n.data?.kind === "string" ? (n.data!.kind as string) : "",
  ]
  const out: (readonly string[])[] = []
  for (const r of RULES) {
    if (candidates.some((t) => typeof t === "string" && r.test.test(t))) out.push(...r.keys)
  }
  return out
}
