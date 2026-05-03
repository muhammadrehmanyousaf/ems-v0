import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-bridal-beige bg-bridal-cream/40 px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-bridal-blush/55 border border-bridal-beige text-bridal-mauve">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display italic text-[20px] text-bridal-charcoal">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-[13px] text-bridal-text-soft leading-relaxed">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
