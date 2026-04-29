"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import axiosInstance from "@/lib/axiosConfig"

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
        // Enforce 15-minute hold regardless of backend expiry
        const fifteenMins = Date.now() + 15 * 60 * 1000
        const backendExpiry = data.expiresAt ? new Date(data.expiresAt).getTime() : fifteenMins
        setExpiresAt(Math.min(backendExpiry, fifteenMins))
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
