"use client"

import { Check } from "lucide-react"

interface StepIndicatorProps {
  steps: { key: string; title: string }[]
  currentStep: number
}

/**
 * Where you are in the booking, in the site's own language.
 *
 * This was built in zinc — grey dots, grey rules, Inter — and its own comment
 * said it "drops the bridal italic display font in favour of clean Inter
 * weights". That reads as a Stripe checkout dropped into a cream-and-gold
 * wedding site, and it sets the tone for the whole flow before a single
 * question is asked: this is a form, fill it in.
 *
 * Same structure, same semantics, bridal palette: gold for what is done, a
 * ring on where you are, beige for what is ahead. The current step's name is
 * the one piece of type that carries weight, because it is the only part a
 * person actually needs to read.
 */
export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const safeIndex = Math.min(Math.max(currentStep, 0), steps.length - 1)

  return (
    <div className="w-full">
      {/* Desktop / tablet */}
      <ol className="hidden sm:flex items-center w-full">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep
          const isCurrent = idx === currentStep

          return (
            <li
              key={step.key + idx}
              className={`flex items-center min-w-0 ${idx < steps.length - 1 ? "flex-1" : ""}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  aria-current={isCurrent ? "step" : undefined}
                  className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums transition-all duration-300
                    ${isCompleted
                      ? "bg-bridal-gold-dark text-white"
                      : isCurrent
                        ? "bg-bridal-gold-dark text-white ring-4 ring-bridal-gold/25"
                        : "border border-bridal-beige bg-white text-bridal-text-soft"
                    }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : idx + 1}
                </span>
                <span
                  className={`hidden whitespace-nowrap transition-colors md:inline
                    ${isCurrent
                      ? "font-display italic text-[15px] text-bridal-charcoal"
                      : isCompleted
                        ? "font-bridal text-[11px] uppercase tracking-[0.18em] text-bridal-gold-dark"
                        : "font-bridal text-[11px] uppercase tracking-[0.18em] text-bridal-text-soft/70"
                    }`}
                >
                  {step.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="mx-3 h-px min-w-[20px] flex-1 overflow-hidden bg-bridal-beige lg:mx-4">
                  <div
                    className="h-full bg-bridal-gold-dark transition-all duration-500 ease-out"
                    style={{ width: isCompleted ? "100%" : "0%" }}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {/* Mobile */}
      <div className="space-y-2 sm:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-bridal text-[10.5px] uppercase tracking-[0.2em] text-bridal-text-label">
            Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
          </span>
          <span className="truncate font-display italic text-[15px] text-bridal-charcoal">
            {steps[safeIndex]?.title}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-bridal-beige">
          <div
            className="h-full rounded-full bg-bridal-gold-dark transition-all duration-500 ease-out"
            style={{ width: `${((Math.min(currentStep + 1, steps.length)) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
