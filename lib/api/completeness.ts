/**
 * Profile completeness — the vendor's own scorecard.
 *
 * One typed client for `GET /businesses/my-completeness`, shared by the
 * dashboard widget and the full checklist screen so the two can never describe
 * the same profile differently.
 */
import axiosInstance from "@/lib/axiosConfig"

export interface CompletenessItem {
  key: string
  label: string
  weight: number
  done: boolean
  /** Where the vendor goes to fix it, e.g. /dashboard/settings?tab=images. */
  href?: string | null
  /** What it costs them to leave it undone, in their language. */
  why?: string | null
}

export interface CompletenessCategory {
  key: string
  label: string
  blurb?: string
  earned: number
  max: number
  items: CompletenessItem[]
}

export interface NextBestItem {
  key: string
  label: string
  weight: number
  href: string | null
  why: string | null
  categoryLabel: string
}

/** Activation is about DOING, not filling in forms — see the backend note. */
export interface ActivationSignals {
  bookings: number
  futureConfirmed: number
  baaqiTracked: number
  shieldOn: boolean
  /** The first-booking chain. Optional so an older backend still renders. */
  leadsTotal?: number
  leadsAwaitingReply?: number
  leadsWorked?: number
  receipts?: number
  functionSheets?: number
}

export interface BusinessCompleteness {
  businessId: number
  name: string
  score: number
  categories: CompletenessCategory[]
  suggestions: string[]
  nextBest?: NextBestItem[]
  remainingCount?: number
  remainingPoints?: number
  activation?: ActivationSignals
}

export const CompletenessAPI = {
  async listMine(): Promise<BusinessCompleteness[]> {
    const res = await axiosInstance.get("/api/v1/businesses/my-completeness")
    return res.data?.data?.businesses ?? []
  },
}

/**
 * Derive `nextBest` on the client when the backend hasn't been deployed with it
 * yet. The widget is useless without next actions, and a frontend that only
 * works after a backend deploy lands is a frontend that breaks on the way
 * there. Same ordering rule as the server: richest first.
 */
export function nextBestOf(b: BusinessCompleteness, limit = 3): NextBestItem[] {
  if (b.nextBest?.length) return b.nextBest.slice(0, limit)
  return (b.categories ?? [])
    .flatMap((c) => c.items.map((i) => ({ ...i, categoryLabel: c.label })))
    .filter((i) => !i.done)
    .sort((a, b2) => b2.weight - a.weight)
    .slice(0, limit)
    .map((i) => ({
      key: i.key,
      label: i.label,
      weight: i.weight,
      href: i.href ?? null,
      why: i.why ?? null,
      categoryLabel: i.categoryLabel,
    }))
}

export function remainingOf(b: BusinessCompleteness): { count: number; points: number } {
  if (b.remainingCount != null && b.remainingPoints != null) {
    return { count: b.remainingCount, points: b.remainingPoints }
  }
  const missing = (b.categories ?? []).flatMap((c) => c.items.filter((i) => !i.done))
  return { count: missing.length, points: missing.reduce((s, i) => s + i.weight, 0) }
}
