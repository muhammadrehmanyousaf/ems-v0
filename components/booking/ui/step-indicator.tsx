"use client"

import { Check } from "lucide-react"

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  // Generate step numbers [1, 2, ..., totalSteps]
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-center gap-4">
      {steps.map((step, idx) => {
        const isCompleted = currentStep > step
        const isCurrent = currentStep === step
        return (
          <div key={step} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 shadow-sm
                ${isCompleted ? "border-rose-500 bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg"
                  : isCurrent ? "border-rose-500 bg-white text-rose-600 shadow-md"
                  : "border-neutral-300 bg-white text-neutral-400"}
              `}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : <span className="font-semibold text-sm">{step}</span>}
            </div>
            {idx < steps.length - 1 && (
              <div className={`mx-2 h-1 w-8 rounded-full transition-all duration-300
                ${currentStep > step ? "bg-gradient-to-r from-rose-500 to-pink-600" : "bg-neutral-200"}
              `}></div>
            )}
          </div>
        )
      })}
    </div>
  )
}


