import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/dashboard/shared/icon"

/**
 * StatCard — a KPI tile. Label, value, optional delta + trend, optional icon.
 * Token-only so it re-themes with the active palette.
 *
 * Deliberately compact. Every list screen in the portal opens with a row of
 * these above its table, and at the previous size (p-4, text-2xl, 32px icon
 * chip) the strip cost ~120px before any content. Combined with the panels some
 * screens put underneath it, the actual table on Bookings began 1,307px down a
 * 900px window — a vendor opened "Bookings" and could not see one booking
 * without scrolling. These tiles are a glance, not the subject of the page, so
 * they are sized like a glance.
 */
export interface StatCardProps {
  label: string
  value: React.ReactNode
  /** e.g. "+18%" or "this week". */
  delta?: string
  trend?: "up" | "down" | "flat"
  icon?: IconName
  /** Optional click target (whole card becomes a button). */
  onClick?: () => void
  href?: string
  className?: string
  /**
   * The load behind this tile failed.
   *
   * WWL-018 / WWL-052 — with the money endpoints down, screens across the
   * portal rendered "Rs 0" with full confidence: the dashboard showed
   * "Rs 0 collected · Rs 0 owed · 0 events" with no error anywhere on the page,
   * and Rs 0 collected even carried a green upward trend arrow beside the word
   * "received". Nothing distinguished it from a vendor who genuinely has
   * nothing — which for a khata product is the worst possible confusion.
   *
   * A missing figure is not a zero. Setting this renders an em dash, drops the
   * trend arrow, and replaces the delta with "couldn't load", so the tile can
   * never assert a number it does not have.
   */
  error?: boolean
}

const TREND: Record<NonNullable<StatCardProps["trend"]>, string> = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-red-600 dark:text-red-400",
  flat: "text-muted-foreground",
}

const TREND_ICON: Record<NonNullable<StatCardProps["trend"]>, IconName> = {
  up: "TrendingUp",
  down: "TrendingDown",
  flat: "Minus",
}

export function StatCard({
  label,
  value,
  delta: deltaProp,
  trend: trendProp,
  icon,
  onClick,
  href,
  className,
  error,
}: StatCardProps) {
  // A failed load must never be able to render as a number. See `error` above.
  const shownValue = error ? "—" : value
  const delta = error ? "couldn't load" : deltaProp
  const trend = error ? undefined : trendProp
  const interactive = !!(onClick || href)
  const Wrapper: any = href ? "a" : onClick ? "button" : "div"
  return (
    <Wrapper
      {...(href ? { href } : {})}
      {...(onClick ? { onClick, type: "button" } : {})}
      className={cn(
        "group flex flex-col gap-0.5 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-colors",
        interactive &&
          "hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon && (
          <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
            <Icon name={icon} size={13} />
          </span>
        )}
      </div>
      <div
        className={cn(
          "text-xl font-semibold tracking-tight",
          error ? "text-muted-foreground" : "text-card-foreground",
        )}
        style={{ fontVariantNumeric: "tabular-nums" }}
        {...(error ? { title: "This figure could not be loaded — it is missing, not zero." } : {})}
      >
        {shownValue}
      </div>
      {delta && (
        <div className={cn("flex items-center gap-1 text-xs", trend ? TREND[trend] : "text-muted-foreground")}>
          {trend && <Icon name={TREND_ICON[trend]} size={12} />}
          {delta}
        </div>
      )}
    </Wrapper>
  )
}

export default StatCard
