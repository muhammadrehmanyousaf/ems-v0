import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * PageHeader — the consistent top of every dashboard screen.
 *
 * One line: title, description and actions on a shared baseline. It used to
 * stack eyebrow / title / description into 77px of vertical space that mostly
 * repeated the breadcrumb and the module panel.
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
    <div className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", className)}>
      {breadcrumb && <div className="w-full text-sm text-muted-foreground">{breadcrumb}</div>}

      {/* Measured on production: this block was 77px tall and said the same
          thing the rest of the screen was already saying. On /dashboard/money
          the fixed top bar's breadcrumb read "Dashboard / Money", the module
          panel highlighted "Receivables", the eyebrow said "MONEY" and the h1
          said "Receivables" — four statements of one fact, stacked, above a
          table where only a 36px sliver of the first row was visible.

          Title and description now share one baseline instead of three rows.
          The `eyebrow` is deliberately no longer rendered: it repeated the
          breadcrumb, which is permanently on screen in the fixed bar. The prop
          stays so no call site breaks and so the zone is still declared in
          code, but a label that is always visible two inches away does not earn
          a row of its own.

          77px -> ~32px, on every screen in the product. */}
      <h1 className="min-w-0 truncate text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {description && (
        <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{description}</p>
      )}
      {actions && <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

export default PageHeader
