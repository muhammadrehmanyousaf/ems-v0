"use client"

import { useCallback, useRef } from "react"
import type { BookingFormData, EventBooking } from "@/lib/types"

/**
 * WW-DIRECT-PAY — matches the slot hold, which is now 48h rather than 15
 * minutes (see HOLD_TTL_MS). These two have to agree: a draft that expired
 * first threw away the customer's six steps of work while the server was
 * still holding their date for them, which is the worst possible pairing.
 */
const DRAFT_EXPIRY_MS = 48 * 60 * 60 * 1000

interface DraftData {
  formData: BookingFormData
  events: EventBooking[]
  globalStep: number
  activeEventIndex: number
  venueId: string
  userId: string
  savedAt: number
}

/**
 * One draft slot per (venue, user, TAB).
 *
 * The key was `booking_draft_v1_${venueId}_${userId}` and localStorage is
 * shared across every tab of the same origin — so two tabs booking the SAME
 * venue wrote to one slot. The 500ms autosave in the second tab overwrote the
 * first tab's six steps of work, and whichever tab reloaded last restored the
 * other one's answers: guests, hall, package and menu silently swapped between
 * two bookings the customer was making side by side. Two DIFFERENT venues were
 * always fine, which is why it looked intermittent.
 *
 * `tabId` fixes it. It lives in sessionStorage, which is per-tab by definition
 * and survives a reload of that tab — so the draft still comes back on
 * refresh, which is the whole point of the feature, but never leaks sideways
 * into a sibling tab.
 *
 * Duplicating a tab copies sessionStorage, so a duplicated tab briefly shares a
 * draft with its parent. That is the one case this does not separate, and it is
 * the right trade: the alternative (a fresh id per page load) throws the draft
 * away on every refresh, which is the bug this feature exists to prevent.
 */
const TAB_KEY = "booking_draft_tab_id"

function getTabId(): string {
  try {
    let id = sessionStorage.getItem(TAB_KEY)
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID().slice(0, 8)
          : Math.random().toString(36).slice(2, 10)
      sessionStorage.setItem(TAB_KEY, id)
    }
    return id
  } catch {
    // Private mode / storage disabled — fall back to a single shared slot,
    // which is exactly the old behaviour and still better than crashing.
    return "shared"
  }
}

function getDraftKey(venueId: string, userId: string) {
  return `booking_draft_v2_${venueId}_${userId}_${getTabId()}`
}

/**
 * Drafts written before the per-tab key existed, and drafts belonging to tabs
 * that are long gone, would otherwise sit in localStorage forever — one entry
 * per venue per tab, never read again. Cleared opportunistically on load.
 */
function sweepStaleDrafts(currentKey: string) {
  try {
    const now = Date.now()
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (!k || k === currentKey) continue
      if (!k.startsWith("booking_draft_v1_") && !k.startsWith("booking_draft_v2_")) continue
      if (k.startsWith("booking_draft_v1_")) { localStorage.removeItem(k); continue }
      const raw = localStorage.getItem(k)
      if (!raw) continue
      const savedAt = Number(JSON.parse(raw)?.savedAt)
      if (!Number.isFinite(savedAt) || now - savedAt > DRAFT_EXPIRY_MS) localStorage.removeItem(k)
    }
  } catch {
    // Never let housekeeping break a booking.
  }
}

export function useBookingDraft(venueId: string | null, userId?: string | null) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(
    (data: Omit<DraftData, "savedAt" | "venueId" | "userId">) => {
      if (!venueId || !userId) return
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        try {
          const draft: DraftData = { ...data, venueId, userId, savedAt: Date.now() }
          localStorage.setItem(getDraftKey(venueId, userId), JSON.stringify(draft))
        } catch {
          // localStorage full or unavailable — silently ignore
        }
      }, 500)
    },
    [venueId, userId]
  )

  const load = useCallback((): DraftData | null => {
    if (!venueId || !userId) return null
    try {
      const key = getDraftKey(venueId, userId)
      sweepStaleDrafts(key)
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const draft: DraftData = JSON.parse(raw)
      if (Date.now() - draft.savedAt > DRAFT_EXPIRY_MS) {
        localStorage.removeItem(getDraftKey(venueId, userId))
        return null
      }
      return draft
    } catch {
      return null
    }
  }, [venueId, userId])

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!venueId || !userId) return
    try {
      localStorage.removeItem(getDraftKey(venueId, userId))
    } catch {
      // ignore
    }
  }, [venueId, userId])

  return { save, load, clear }
}
