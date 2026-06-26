import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/dashboard/shared/icon"

/**
 * EmptyState — confident, useful empty states. One icon, one line, one CTA.
 * Distinguish first-run / filtered-empty / error at the call site via copy.
 */
export interface EmptyStateProps {
  icon?: IconName
  title: React.ReactNode
  description?: React.ReactNode
  /** Primary CTA (e.g. "Add booking"). */
  action?: React.ReactNode
  /** Secondary CTA (e.g. "Import"). */
  secondaryAction?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon = "Inbox",
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/40 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon name={icon} size={24} />
      </span>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {(action || secondaryAction) && (
        <div className="flex items-center gap-2 pt-1">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}

export default EmptyState
