import type { ReactNode } from "react"
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface KpiCardProps {
  label: string
  value: ReactNode
  caption?: ReactNode
  /** numeric % change vs prior period */
  delta?: number
  /** "up" / "down" / "flat" — auto-derived from delta if absent */
  trend?: "up" | "down" | "flat"
  icon?: ReactNode
  /** when true, an "up" trend is bad (e.g., overdue) and gets a coral colour. */
  invertTrendColor?: boolean
  isLoading?: boolean
  className?: string
}

export function KpiCard({
  label,
  value,
  caption,
  delta,
  trend,
  icon,
  invertTrendColor = false,
  isLoading = false,
  className,
}: KpiCardProps) {
  const resolvedTrend: KpiCardProps["trend"] =
    trend ??
    (typeof delta === "number"
      ? delta > 0
        ? "up"
        : delta < 0
          ? "down"
          : "flat"
      : undefined)

  const goodIsUp = !invertTrendColor
  const trendTone =
    resolvedTrend === "up"
      ? goodIsUp
        ? "text-[#3F6B43] bg-bridal-sage/15 border-bridal-sage/35"
        : "text-bridal-coral bg-bridal-coral/12 border-bridal-coral/35"
      : resolvedTrend === "down"
        ? goodIsUp
          ? "text-bridal-coral bg-bridal-coral/12 border-bridal-coral/35"
          : "text-[#3F6B43] bg-bridal-sage/15 border-bridal-sage/35"
        : "text-muted-foreground bg-muted border-border"

  const TrendIcon =
    resolvedTrend === "up"
      ? ArrowUpRight
      : resolvedTrend === "down"
        ? ArrowDownRight
        : Minus

  return (
    <Card className={cn("relative overflow-hidden p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-bridal-text-label">
          {label}
        </p>
        {icon ? (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-bridal-cream border border-bridal-beige text-bridal-gold-dark">
            {icon}
          </span>
        ) : null}
      </div>

      <div className="mt-3.5">
        {isLoading ? (
          <Skeleton className="h-9 w-32" />
        ) : (
          <p className="font-display italic text-[34px] leading-none text-bridal-charcoal tabular-nums">
            {value}
          </p>
        )}
      </div>

      {(caption || typeof delta === "number") && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] text-bridal-text-soft">
          {typeof delta === "number" && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10.5px] font-medium tabular-nums",
                trendTone,
              )}
            >
              <TrendIcon className="size-3" />
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)}%
            </span>
          )}
          {caption ? <span className="truncate">{caption}</span> : null}
        </div>
      )}
    </Card>
  )
}
