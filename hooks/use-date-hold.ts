"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import axiosInstance from "@/lib/axiosConfig"

/**
 * Used only when the server's response carries no `expiresAt`. Mirrors
 * HOLD_TTL_MS in bookingController — the hold now has to outlive a VENDOR
 * checking their phone, not a customer typing a card number, because nobody
 * pays until the vendor has accepted.
 */
const DEFAULT_HOLD_MS = 48 * 60 * 60 * 1000

interface UseDateHoldReturn {
  holdId: number | null
  timeRemaining: number // seconds
  isHolding: boolean
  holdFailed: boolean
  holdFailedUntil: Date | null
  createHold: (businessId: number, date: string, time: string) => Promise<void>
  releaseHold: () => Promise<void>
}

export function useDateHold(): UseDateHoldReturn {
  const [holdId, setHoldId] = useState<number | null>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const [holdFailed, setHoldFailed] = useState(false)
  const [holdFailedUntil, setHoldFailedUntil] = useState<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) {
      setTimeRemaining(0)
      return
    }

    const tick = () => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      setTimeRemaining(remaining)
      if (remaining <= 0) {
        setHoldId(null)
        setExpiresAt(null)
        setIsHolding(false)
      }
    }

    tick()
    intervalRef.current = setInterval(tick, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [expiresAt])

  const createHold = useCallback(async (businessId: number, date: string, time: string) => {
    // Reset failed state on new attempt
    setHoldFailed(false)
    setHoldFailedUntil(null)
    try {
      // Release existing hold first
      if (holdId) {
        try {
          await axiosInstance.delete(`/api/v1/bookings/hold/${holdId}`)
        } catch {
          // ignore
        }
      }

      const response = await axiosInstance.post("/api/v1/bookings/hold", {
        businessId,
        holdDate: date,
        holdTime: time,
      })

      const data = response.data?.data
      if (data?.holdId) {
        setHoldId(data.holdId)
        setHoldFailed(false)
        setHoldFailedUntil(null)
        /**
         * WW-DIRECT-PAY — trust the server's expiry instead of re-clamping it.
         *
         * This took `Math.min(serverExpiry, now + 15min)`, so the hold could
         * only ever be SHORTER than the server said, never longer. Raising the
         * TTL on the backend therefore changed nothing at all here — the client
         * quietly enforced the old 15 minutes on top of it, and a customer
         * would watch the timer run out while the server still held their slot.
         *
         * The server is the only thing that actually reserves the date, so its
         * `expiresAt` is the fact and this is a display of it. The fallback is
         * used only when the response omits the field.
         */
        const fallback = Date.now() + DEFAULT_HOLD_MS
        const backendExpiry = data.expiresAt ? new Date(data.expiresAt).getTime() : fallback
        setExpiresAt(Number.isFinite(backendExpiry) ? backendExpiry : fallback)
        setIsHolding(true)
      }
    } catch (error: any) {
      if (error?.response?.status === 409) {
        // Slot is held by another user
        setHoldFailed(true)
        const heldUntil = error.response.data?.data?.heldUntil
        setHoldFailedUntil(heldUntil ? new Date(heldUntil) : null)
      }
      // Other errors — not critical, proceed without hold
    }
  }, [holdId])

  const releaseHold = useCallback(async () => {
    if (!holdId) return
    try {
      await axiosInstance.delete(`/api/v1/bookings/hold/${holdId}`)
    } catch {
      // ignore
    }
    setHoldId(null)
    setExpiresAt(null)
    setIsHolding(false)
    setTimeRemaining(0)
  }, [holdId])

  // Auto-release on unmount
  useEffect(() => {
    return () => {
      if (holdId) {
        axiosInstance.delete(`/api/v1/bookings/hold/${holdId}`).catch(() => {})
      }
    }
  }, [holdId])

  return { holdId, timeRemaining, isHolding, holdFailed, holdFailedUntil, createHold, releaseHold }
}
