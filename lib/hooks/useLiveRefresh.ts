"use client"

import { useEffect, useRef } from "react"

/** The window event NotificationContext fires when a money notification arrives. */
export const MONEY_NOTIFICATION_EVENT = "ww:money-notification"

/**
 * Re-run `refresh` when a money notification arrives over the socket, and every
 * `pollMs` while the tab is visible (CUSTOMER-036). The customer booking pages
 * load with axios into local state, not react-query, so the socket-driven
 * invalidateMoney() never reached them: "UNPAID / NOW DUE Rs 10,000" with a live
 * Pay button stayed on screen after the venue had recorded the advance.
 */
export function useLiveRefresh(refresh: () => void, enabled: boolean, pollMs = 60_000) {
  const ref = useRef(refresh)
  ref.current = refresh
  useEffect(() => {
    if (!enabled) return
    const onEvent = () => ref.current()
    window.addEventListener(MONEY_NOTIFICATION_EVENT, onEvent)
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") ref.current()
    }, pollMs)
    return () => {
      window.removeEventListener(MONEY_NOTIFICATION_EVENT, onEvent)
      window.clearInterval(id)
    }
  }, [enabled, pollMs])
}
