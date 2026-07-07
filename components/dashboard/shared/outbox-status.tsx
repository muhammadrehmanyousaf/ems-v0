"use client"

/**
 * Phase-3 EPIC 4 · PWA-02 — offline-outbox status pill.
 *
 * Shows the vendor what's queued while offline and confirms when it syncs. Renders
 * nothing when the feature is dark or when online with an empty queue, so it's
 * invisible in the normal (online) path. Also owns the one-time reconnect wiring
 * via initOutboxSync().
 */

import * as React from "react"
import { isOutboxEnabled, countOps, onOutboxChange } from "@/lib/outbox"
import { initOutboxSync, isFlushing, flushOutbox } from "@/lib/outbox-sync"
import { cn } from "@/lib/utils"

export function useOutboxStatus() {
  const [pending, setPending] = React.useState(0)
  const [online, setOnline] = React.useState(true)
  const [flushing, setFlushing] = React.useState(false)

  React.useEffect(() => {
    if (!isOutboxEnabled()) return
    initOutboxSync()
    let alive = true
    const refresh = async () => {
      const n = await countOps()
      if (!alive) return
      setPending(n)
      setFlushing(isFlushing())
    }
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    setOnline(typeof navigator === "undefined" ? true : navigator.onLine)
    void refresh()
    const off = onOutboxChange(refresh)
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    return () => { alive = false; off(); window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline) }
  }, [])

  return { pending, online, flushing, enabled: isOutboxEnabled() }
}

export function OutboxStatus({ className }: { className?: string }) {
  const { pending, online, flushing, enabled } = useOutboxStatus()
  if (!enabled) return null
  // Invisible in the happy path: online with nothing queued.
  if (online && pending === 0 && !flushing) return null

  const tone = !online
    ? "bg-amber-50 text-amber-800 border-amber-300"
    : flushing
      ? "bg-blue-50 text-blue-800 border-blue-300"
      : "bg-neutral-100 text-neutral-700 border-neutral-300"

  const label = !online
    ? `Offline · ${pending} queued`
    : flushing
      ? "Syncing…"
      : `${pending} to sync`

  return (
    <button
      type="button"
      onClick={() => { if (online && !flushing) void flushOutbox() }}
      title={online ? "Click to sync now" : "You're offline — changes are saved and will sync when you reconnect"}
      className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", tone, className)}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", !online ? "bg-amber-500" : flushing ? "bg-blue-500 animate-pulse" : "bg-neutral-400")} />
      {label}
    </button>
  )
}

export default OutboxStatus
