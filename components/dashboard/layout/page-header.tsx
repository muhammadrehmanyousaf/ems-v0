import { cn } from "@/lib/utils"
import { ReactNode } from "react"

/**
 * Standard dashboard page header — clean sans-serif, weight 600, eyebrow in
 * muted-foreground, optional right-side actions slot. Matches modern CRM
 * conventions (Linear / Vercel / shadcn dashboard-01).
 *
 *   <PageHeader
 *     eyebrow="Admin · Operations"
 *     title="Dispute queue"
 *     description="Customer-opened disputes freeze pending vendor payouts..."
 *     actions={<Button>New</Button>}
 *   />
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <header className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1 min-w-0">
          {eyebrow && (
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <h1 className="text-[22px] sm:text-[24px] font-semibold tracking-tight text-foreground leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-[13.5px] text-muted-foreground max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>
        )}
      </header>
    </div>
  )
}
