import * as React from "react"
import { cn } from "@/lib/utils"

/** Base shimmer block. Token-based so it works in light + dark. */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />
}

/** Table loading state — header + N shimmer rows. */
export function TableSkeleton({
  rows = 6,
  cols = 5,
  className,
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="flex gap-4 border-b border-border px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBlock key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-border/60 px-4 py-3.5 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBlock key={c} className={cn("h-3 flex-1", c === 0 && "max-w-[120px]")} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Card grid loading state. */
export function CardSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-border bg-card p-4">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-6 w-28" />
          <SkeletonBlock className="h-3 w-12" />
        </div>
      ))}
    </div>
  )
}

/** Detail / drawer loading state. */
export function DetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <SkeletonBlock className="h-6 w-48" />
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-3/4" />
      <div className="grid grid-cols-2 gap-4 pt-2">
        <SkeletonBlock className="h-20" />
        <SkeletonBlock className="h-20" />
      </div>
    </div>
  )
}
