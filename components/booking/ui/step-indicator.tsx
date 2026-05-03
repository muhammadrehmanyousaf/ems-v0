"use client"

import { Check } from "lucide-react"

interface StepIndicatorProps {
  steps: { key: string; title: string }[]
  currentStep: number
}

/**
 * Stripe-grade step indicator. Numbered circles, persistent labels on md+,
 * thin rule connectors that fill as steps complete. Drops the bridal italic
 * display font in favor of clean Inter weights.
 */
export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
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
                  className={`relative flex w-7 h-7 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums shrink-0 transition-all
                    ${isCompleted
                      ? "bg-zinc-900 text-white"
                      : isCurrent
                        ? "bg-zinc-900 text-white ring-4 ring-zinc-900/10"
                        : "bg-white text-zinc-500 border border-zinc-200"
                    }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> : idx + 1}
                </span>
                <span
                  className={`text-[13px] font-medium whitespace-nowrap transition-colors hidden md:inline
                    ${isCurrent ? "text-zinc-900" : isCompleted ? "text-zinc-700" : "text-zinc-400"}`}
                >
                  {step.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 mx-3 lg:mx-4 h-px bg-zinc-200 overflow-hidden min-w-[20px]">
                  <div
                    className="h-full bg-zinc-900 transition-all duration-500 ease-out"
                    style={{ width: isCompleted ? "100%" : "0%" }}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {/* Mobile */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.14em] font-medium text-zinc-500">
            Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
          </span>
          <span className="text-[13px] font-semibold text-zinc-900">
            {steps[Math.min(currentStep, steps.length - 1)]?.title}
          </span>
        </div>
        <div className="h-1 rounded-full bg-zinc-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all duration-500 ease-out"
            style={{ width: `${((Math.min(currentStep + 1, steps.length)) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
