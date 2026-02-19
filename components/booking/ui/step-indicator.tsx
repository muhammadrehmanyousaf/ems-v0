"use client"

import { Check } from "lucide-react"

interface StepIndicatorProps {
  steps: { key: string; title: string }[]
  currentStep: number
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Desktop: compact numbered circles with connecting lines */}
      <div className="hidden sm:block">
        <div className="flex items-center">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStep
            const isCurrent = idx === currentStep

            return (
              <div key={step.key + idx} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-1.5">
                  <div
                    style={isCurrent ? { boxShadow: '0 0 0 3px rgba(147, 51, 234, 0.12)' } : undefined}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors duration-300 flex-shrink-0 ${
                      isCompleted
                        ? 'bg-purple-600 text-white'
                        : isCurrent
                          ? 'bg-purple-600 text-white'
                          : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  {isCurrent && (
                    <span className="text-xs font-semibold text-neutral-800 whitespace-nowrap">
                      {step.title}
                    </span>
                  )}
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 mx-2 h-[2px] rounded-full bg-neutral-100 overflow-hidden min-w-[12px]">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all duration-400 ease-out"
                      style={{ width: isCompleted ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile: progress bar with step info */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-purple-600">
            Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
          </span>
          <span className="text-xs font-medium text-neutral-600">
            {steps[Math.min(currentStep, steps.length - 1)]?.title}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-purple-500 transition-all duration-400 ease-out"
            style={{ width: `${((Math.min(currentStep + 1, steps.length)) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
