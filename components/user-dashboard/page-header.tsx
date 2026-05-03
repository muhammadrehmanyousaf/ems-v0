import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  /** small caps label above the title — e.g. "My account · Bookings" */
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** action cluster on the right — buttons, filters, etc. */
  actions?: ReactNode
  className?: string
}

/**
 * Editorial page header — Playfair italic title, caps eyebrow,
 * action cluster on the right that wraps gracefully on small screens.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className="space-y-2 min-w-0">
        {eyebrow ? (
          <p className="inline-flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.28em] text-bridal-gold-dark">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display italic text-[28px] sm:text-[34px] leading-[1.1] tracking-tight text-bridal-charcoal">
          {title}
        </h1>
        {description ? (
          <p className="text-[13.5px] text-bridal-text-soft max-w-2xl leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  )
}
