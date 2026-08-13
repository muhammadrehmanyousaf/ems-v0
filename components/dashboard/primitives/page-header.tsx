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
  /**
   * View switcher for this screen — the `<TabsList>` itself, not the whole
   * `<Tabs>`. Rendered on the title's own row rather than above it.
   *
   * Measured on /dashboard/staff: the tablist sat alone on a row at top 96,
   * pushing the title to 165, the first KPI to 220 and the staff table to 385
   * — 57% of a 674px laptop viewport spent before the first crew member.
   * Sharing the title row gives back the 40px row plus its surrounding gap.
   */
  tabs?: React.ReactNode
  /** Optional breadcrumb node rendered above the eyebrow. */
  breadcrumb?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  tabs,
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
      {/**
       * Playfair for the page title — the one place the product wears the
       * brand's face.
       *
       * Measured across all 44 modules: the portal renders in Inter and nothing
       * else, while the public site is set in Playfair Display over DM Sans. A
       * vendor moves from a site with a voice to a dashboard that looks like
       * every SaaS tool built since 2018, and nothing tells them they are still
       * inside Wedding Wala.
       *
       * Restraint is the whole point. Titles only — not labels, not buttons,
       * not table cells. Inter stays everywhere else because it is genuinely
       * the better face for dense figures, and Playfair is not. The font is
       * already loaded (app/layout.tsx) and `.font-display` already exists, so
       * this costs no bytes and no density.
       */}
      <h1 className="font-display min-w-0 truncate text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {description && (
        <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{description}</p>
      )}
      {/* `ml-auto` on whichever of these comes first pushes the pair right; the
          second must not claim it again or the two separate. Tabs keep their
          own baseline (`items-center`) because a segmented control aligned on
          a text baseline sits visibly low. */}
      {/* On a phone the tablist takes its own full-width line and scrolls
          sideways within itself. Without this it would be `shrink-0` next to a
          title on a 360px screen and push the page into a horizontal scroll —
          the one thing that must never happen, because a sticky header inside
          a horizontally scrolling body detaches. From `sm` up it sits on the
          title's row as intended. */}
      {tabs && (
        <div
          className={cn(
            "order-last flex w-full items-center overflow-x-auto",
            "sm:order-none sm:ml-auto sm:w-auto sm:shrink-0 sm:self-center sm:overflow-visible",
          )}
        >
          {tabs}
        </div>
      )}
      {actions && (
        <div className={cn("flex shrink-0 items-center gap-2 ml-auto", tabs && "sm:ml-2")}>
          {actions}
        </div>
      )}
    </div>
  )
}

export default PageHeader
