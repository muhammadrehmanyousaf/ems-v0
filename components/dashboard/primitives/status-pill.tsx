import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/dashboard/shared/icon"

/**
 * StatusPill — the universal status atom. Always color + icon + text (never
 * color alone — colorblind-safe). Semantic colors are FIXED across all themes
 * (trust requires stability), so this uses explicit status classes, not the
 * theme accent.
 */
export type StatusTone = "success" | "warning" | "error" | "info" | "neutral"

const TONE: Record<StatusTone, { cls: string; dot: string; icon: IconName }> = {
  success: {
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20",
    dot: "bg-emerald-500",
    icon: "CheckCircle2",
  },
  warning: {
    cls: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20",
    dot: "bg-amber-500",
    icon: "Clock",
  },
  error: {
    cls: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/20",
    dot: "bg-red-500",
    icon: "AlertTriangle",
  },
  info: {
    cls: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20",
    dot: "bg-blue-500",
    icon: "Info",
  },
  neutral: {
    cls: "bg-muted text-muted-foreground ring-border",
    dot: "bg-muted-foreground/60",
    icon: "Minus",
  },
}

export interface StatusPillProps {
  tone: StatusTone
  children: React.ReactNode
  /** Show a leading dot (default) or the tone icon. */
  variant?: "dot" | "icon"
  className?: string
}

export function StatusPill({ tone, children, variant = "dot", className }: StatusPillProps) {
  const t = TONE[tone]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        t.cls,
        className,
      )}
    >
      {variant === "dot" ? (
        <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} aria-hidden="true" />
      ) : (
        <Icon name={t.icon} size={13} />
      )}
      {children}
    </span>
  )
}

export default StatusPill
