import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/dashboard/shared/icon"

/**
 * StatCard — a KPI tile. Label, value, optional delta + trend, optional icon.
 * Token-only so it re-themes with the active palette.
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
  delta,
  trend,
  icon,
  onClick,
  href,
  className,
}: StatCardProps) {
  const interactive = !!(onClick || href)
  const Wrapper: any = href ? "a" : onClick ? "button" : "div"
  return (
    <Wrapper
      {...(href ? { href } : {})}
      {...(onClick ? { onClick, type: "button" } : {})}
      className={cn(
        "group flex flex-col gap-1 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors",
        interactive &&
          "hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon && (
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon name={icon} size={16} />
          </span>
        )}
      </div>
      <div
        className="text-2xl font-semibold tracking-tight text-card-foreground"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
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
