import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * PageHeader — the consistent top of every dashboard screen.
 * Eyebrow (zone) + title + description + optional breadcrumb + actions slot.
 */
export interface PageHeaderProps {
  title: React.ReactNode
  /** Small uppercase label above the title (e.g. the IA zone "Operate"). */
  eyebrow?: string
  description?: React.ReactNode
  /** Right-aligned actions (primary button, etc.). */
  actions?: React.ReactNode
  /** Optional breadcrumb node rendered above the eyebrow. */
  breadcrumb?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0 space-y-1">
        {breadcrumb && <div className="text-sm text-muted-foreground">{breadcrumb}</div>}
        {eyebrow && (
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {eyebrow}
          </div>
        )}
        <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

export default PageHeader
