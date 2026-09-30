"use client"

/**
 * Where you are, in words, in the desk top bar.
 *
 * "Event selection › Date & time › Packages › Menu › Your requirements ›
 * Review" — sentence case at 12px because the uppercase tracked version is
 * ~800px wide and does not fit beside the Close button. Completed steps are
 * links back; the current one is underlined; future ones are inert. Below
 * 1280px it collapses to "Step 2 of 6 · Date & time", which is the form the
 * phone header uses too.
 */

import { stepTitleShort, type StepCopyCtx } from "@/lib/booking/step-copy"

export interface BreadcrumbStep {
  key: string
  title: string
}

interface StepBreadcrumbProps {
  steps: BreadcrumbStep[]
  currentIndex: number
  onJump: (key: string) => void
  ctx?: Partial<StepCopyCtx>
}

export function stepCounter(steps: BreadcrumbStep[], currentIndex: number, ctx?: Partial<StepCopyCtx>): string {
  const i = Math.min(Math.max(currentIndex, 0), steps.length - 1)
  const key = steps[i]?.key === "events" ? "event" : steps[i]?.key
  return `Step ${i + 1} of ${steps.length} · ${stepTitleShort(key || "", ctx)}`
}

export default function StepBreadcrumb({ steps, currentIndex, onJump, ctx }: StepBreadcrumbProps) {
  return (
    <nav aria-label="Booking steps" className="min-w-0">
      {/* Collapsed form below xl. */}
      <p className="truncate font-bridal text-[12px] text-bridal-charcoal xl:hidden">
        {stepCounter(steps, currentIndex, ctx)}
      </p>

      <ol className="hidden items-center gap-1.5 xl:flex">
        {steps.map((s, i) => {
          const key = s.key === "events" ? "event" : s.key
          const label = stepTitleShort(key, ctx)
          const done = i < currentIndex
          const current = i === currentIndex
          return (
            <li key={s.key + i} className="flex items-center gap-1.5">
              {done ? (
                <button
                  type="button"
                  onClick={() => onJump(key)}
                  className="rounded-sm font-bridal text-[12px] text-bridal-gold-dark transition-colors hover:text-bridal-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2"
                >
                  {label}
                </button>
              ) : (
                <span
                  aria-current={current ? "step" : undefined}
                  aria-disabled={!current ? true : undefined}
                  className={`relative font-bridal text-[12px] ${current ? "text-bridal-charcoal" : "text-bridal-text-soft/80"}`}
                >
                  {label}
                  {current && (
                    <span
                      aria-hidden
                      className="absolute -bottom-1 left-0 h-[2px] w-full origin-left bg-bridal-gold-dark animate-hairline-draw"
                    />
                  )}
                </span>
              )}
              {i < steps.length - 1 && (
                <span aria-hidden className="text-bridal-beige">
                  ›
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
