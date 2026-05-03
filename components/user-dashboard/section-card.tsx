import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

interface SectionCardProps {
  title?: ReactNode
  description?: ReactNode
  /** action slot in the header (right side) — buttons, links, dropdown */
  action?: ReactNode
  /** footer slot — usually a primary CTA or pagination */
  footer?: ReactNode
  children?: ReactNode
  className?: string
  contentClassName?: string
  /** flush=true removes default content padding (useful for tables/lists) */
  flush?: boolean
}

/**
 * Standard section card. Used everywhere in the dashboard for grouping
 * related content with a consistent header / body / footer rhythm.
 */
export function SectionCard({
  title,
  description,
  action,
  footer,
  children,
  className,
  contentClassName,
  flush = false,
}: SectionCardProps) {
  const hasHeader = !!(title || description || action)

  return (
    <Card className={cn("overflow-hidden", className)}>
      {hasHeader ? (
        <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-border/60 bg-muted/30 px-5 py-4 space-y-0">
          <div className="space-y-1 min-w-0">
            {title ? (
              <h2 className="font-display italic text-[18px] text-foreground leading-tight tracking-tight">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-[12.5px] text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </CardHeader>
      ) : null}

      <CardContent className={cn(flush ? "p-0" : "p-5", contentClassName)}>
        {children}
      </CardContent>

      {footer ? (
        <CardFooter className="border-t border-border/60 bg-muted/20 px-5 py-3">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  )
}
