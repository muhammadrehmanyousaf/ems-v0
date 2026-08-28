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

function getDraftKey(venueId: string, userId: string) {
  return `booking_draft_v1_${venueId}_${userId}`
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
      const raw = localStorage.getItem(getDraftKey(venueId, userId))
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
