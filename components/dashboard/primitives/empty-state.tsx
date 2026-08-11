import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/dashboard/shared/icon"

/**
 * EmptyState — confident, useful empty states. One icon, one line, one CTA.
 *
 * ── Why the variant prop exists ──────────────────────────────────────────
 *
 * "Nothing here" has three completely different meanings, and they need three
 * different sentences and three different buttons:
 *
 *   first-run  you have never made one       → "Add your first booking"
 *   filtered   you have some, these hide them → "Clear filters"
 *   error      we could not find out          → "Try again"
 *
 * The previous version left this "to the call site via copy". In practice the
 * call sites didn't distinguish them — a vendor with 40 bookings who typed a
 * bad filter got told they had no bookings, with a CTA offering to create one.
 * Encoding it here makes the right thing the default thing.
 *
 * `error` is the only variant that changes colour: a failed load is not the
 * same event as an empty list and must not be styled like one.
 */

export type EmptyStateVariant = "first-run" | "filtered" | "error"

const VARIANT: Record<
  EmptyStateVariant,
  { icon: IconName; tile: string; role?: "status" | "alert" }
> = {
  // Light-tint icon tile: the convention is a primary-tinted plate with a
  // solid primary glyph, so an empty region still reads as part of the brand
  // rather than as a greyed-out failure.
  "first-run": { icon: "Inbox", tile: "bg-primary/10 text-primary", role: "status" },
  filtered: { icon: "Search", tile: "bg-primary/10 text-primary", role: "status" },
  error: { icon: "AlertTriangle", tile: "bg-destructive/10 text-destructive", role: "alert" },
}

export interface EmptyStateProps {
  /** Which kind of nothing this is. Drives the default icon, tint and a11y role. */
  variant?: EmptyStateVariant
  /**
   * `default` — the centred, dashed card. Correct for a page-level list.
   * `inline`  — one quiet row. Correct inside a compact sub-panel that already
   *             has its own create control a few lines above, where a 12-line
   *             card would be louder than the thing it is reporting on.
   *
   * Both carry the same icon, tone and announcement; they differ only in weight.
   */
  size?: "default" | "inline"
  /** Override the variant's default glyph. */
  icon?: IconName
  title: React.ReactNode
  description?: React.ReactNode
  /** Primary CTA (e.g. "Add booking", "Clear filters", "Try again"). */
  action?: React.ReactNode
  /** Secondary CTA (e.g. "Import"). */
  secondaryAction?: React.ReactNode
  className?: string
}

export function EmptyState({
  variant = "first-run",
  size = "default",
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const v = VARIANT[variant] ?? VARIANT["first-run"]

  if (size === "inline") {
    return (
      <div
        role={v.role}
        aria-live="polite"
        data-variant={variant}
        data-size="inline"
        className={cn("flex items-center gap-2 py-1.5 text-sm text-muted-foreground", className)}
      >
        <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full", v.tile)}>
          <Icon name={icon ?? v.icon} size={12} />
        </span>
        <span className="min-w-0">
          {title}
          {description && <span className="text-muted-foreground/80"> {description}</span>}
        </span>
        {action && <span className="ml-auto shrink-0">{action}</span>}
      </div>
    )
  }

  return (
    <div
      // Announce it: a screen reader user who filters into nothing otherwise gets
      // silence, with no clue the list changed.
      role={v.role}
      aria-live="polite"
      data-variant={variant}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/40 px-6 py-12 text-center",
        className,
      )}
    >
      <span className={cn("grid h-12 w-12 place-items-center rounded-full", v.tile)}>
        <Icon name={icon ?? v.icon} size={24} />
      </span>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}

export default EmptyState
