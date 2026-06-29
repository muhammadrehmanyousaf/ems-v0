"use client"

/**
 * Calendar — redesigned (Track C, bespoke). A clean month grid + day agenda,
 * wired to the real /api/v1/bookings. Read-only; original calendar untouched.
 * Route /dashboard/calendar-new. Token-only so it themes with the palette.
 */

import * as React from "react"
import { useFetchData } from "@/hooks/use-fetch-data"
import type { BookingData, BookingStatus } from "@/lib/dashboard-types"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell } from "@/components/dashboard/primitives/money-cell"
import { EmptyState } from "@/components/dashboard/primitives/empty-state"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { OfflineBookingDialog } from "@/components/dashboard/mainScreens/bookings/bookingListing/components/offline-booking-dialog"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

const tone = (s: BookingStatus): StatusTone =>
  s === "Confirmed" ? "success" : s === "Completed" ? "info" : s === "Cancelled" ? "error" : "warning"

// status -> a dot color class (fixed semantic, theme-independent)
const dot = (s: BookingStatus) =>
  s === "Confirmed" ? "bg-emerald-500" : s === "Completed" ? "bg-blue-500" : s === "Cancelled" ? "bg-red-500" : "bg-amber-500"

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const parseYmd = (s?: string) => {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

export function CalendarRedesignedView() {
  // Anchor month (start at current month). Date.now is fine in the browser.
  const now = new Date()
  const [cursor, setCursor] = React.useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [selected, setSelected] = React.useState<string>(ymd(now))
  const [createOpen, setCreateOpen] = React.useState(false)

  const { data, isLoading, refetch } = useFetchData({
    endpoint: "/api/v1/bookings",
    queryKey: ["calendar-redesigned"],
    Params: { page: 1, limit: 200, sortBy: "bookingDate", sortOrder: "ASC", bucket: "active" },
  })
  const bookings: BookingData[] = data?.data?.data ?? []

  // Group bookings by YYYY-MM-DD
  const byDay = React.useMemo(() => {
    const m = new Map<string, BookingData[]>()
    for (const b of bookings) {
      const d = parseYmd(b.bookingDate)
      if (!d) continue
      const key = ymd(d)
      if (!m.has(key)) m.set(key, [])
      m.get(key)!.push(b)
    }
    return m
  }, [bookings])

  // Build the 6x7 grid for the cursor month.
  const grid = React.useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const start = new Date(first)
    start.setDate(1 - first.getDay()) // back up to Sunday
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [cursor])

  const todayKey = ymd(now)
  const selectedBookings = byDay.get(selected) ?? []
  const monthEvents = bookings.filter((b) => {
    const d = parseYmd(b.bookingDate)
    return d && d.getMonth() === cursor.getMonth() && d.getFullYear() === cursor.getFullYear()
  })

  const goMonth = (delta: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
  const goToday = () => {
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelected(todayKey)
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Operate"
        title="Calendar"
        description="Every event on one grid — redesigned, wired to live bookings."
        actions={<Button onClick={() => setCreateOpen(true)}><Icon name="Plus" size={16} className="mr-1.5" /> Add booking</Button>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Month grid */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border p-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</h2>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{monthEvents.length} events</span>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={goToday}>Today</Button>
              <button onClick={() => goMonth(-1)} aria-label="Previous month" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent">
                <Icon name="ChevronLeft" size={16} />
              </button>
              <button onClick={() => goMonth(1)} aria-label="Next month" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent">
                <Icon name="ChevronRight" size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-border">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {grid.map((d, i) => {
              const key = ymd(d)
              const inMonth = d.getMonth() === cursor.getMonth()
              const events = byDay.get(key) ?? []
              const isToday = key === todayKey
              const isSelected = key === selected
              return (
                <button
                  key={i}
                  onClick={() => setSelected(key)}
                  className={cn(
                    "min-h-[84px] border-b border-r border-border/60 p-1.5 text-left align-top transition-colors last:border-r-0",
                    !inMonth && "bg-muted/30 text-muted-foreground",
                    isSelected ? "bg-primary/5 ring-1 ring-inset ring-primary/40" : "hover:bg-muted/40",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "grid h-6 w-6 place-items-center rounded-full text-xs",
                        isToday && "bg-primary font-semibold text-primary-foreground",
                        !isToday && inMonth && "text-foreground",
                      )}
                    >
                      {d.getDate()}
                    </span>
                    {events.length > 0 && <span className="text-[10px] font-medium text-muted-foreground">{events.length}</span>}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {events.slice(0, 2).map((b) => (
                      <div key={b.id} className="flex items-center gap-1 truncate text-[10px]">
                        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot(b.status))} />
                        <span className="truncate text-foreground/80">{b.customerName || "Booking"}</span>
                      </div>
                    ))}
                    {events.length > 2 && <div className="text-[10px] text-muted-foreground">+{events.length - 2} more</div>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Day agenda */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Icon name="Calendar" size={16} className="text-primary" />
            <h3 className="text-sm font-semibold">
              {parseYmd(selected)?.toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" }) ?? "Selected day"}
            </h3>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}
            </div>
          ) : selectedBookings.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-8" icon="Calendar" title="Nothing scheduled" description="No events on this day." />
          ) : (
            <div className="space-y-2">
              {selectedBookings.map((b) => (
                <div key={b.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{b.customerName || "Booking"}</div>
                      <div className="text-xs text-muted-foreground">{b.bookingTime || "All day"}</div>
                    </div>
                    <MoneyCell amount={num(b.totalAmount)} className="text-sm font-medium" />
                  </div>
                  <div className="mt-2"><StatusPill tone={tone(b.status)}>{b.status}</StatusPill></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <OfflineBookingDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => refetch()}
        initialDate={parseYmd(selected) ?? undefined}
      />
    </div>
  )
}

export default CalendarRedesignedView
