"use client"

import { useCallback, useRef } from "react"
import type { BookingFormData, EventBooking } from "@/lib/types"

const STORAGE_KEY = "booking_draft_v1"
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

interface DraftData {
  formData: BookingFormData
  events: EventBooking[]
  globalStep: number
  activeEventIndex: number
  venueId: string
  savedAt: number
}

export function useBookingDraft(venueId: string | null) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(
    (data: Omit<DraftData, "savedAt" | "venueId">) => {
      if (!venueId) return
      // Debounce: clear previous timer
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        try {
          const draft: DraftData = { ...data, venueId, savedAt: Date.now() }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
        } catch {
          // localStorage full or unavailable — silently ignore
        }
      }, 500)
    },
    [venueId]
  )

  const load = useCallback((): DraftData | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const draft: DraftData = JSON.parse(raw)
      // Expired?
      if (Date.now() - draft.savedAt > DRAFT_EXPIRY_MS) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }
      // Different venue?
      if (venueId && draft.venueId !== venueId) return null
      return draft
    } catch {
      return null
    }
  }, [venueId])

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  return { save, load, clear }
}
