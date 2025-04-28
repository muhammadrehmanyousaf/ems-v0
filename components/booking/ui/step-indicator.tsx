"use client"

import { Check } from "lucide-react"

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const steps = [
    { number: 1, label: "Date & Time" },
    { number: 2, label: "Vendors" },
    { number: 3, label: "Packages" },
    { number: 4, label: "Menu" },
    { number: 5, label: "Review" },
  ]

  return (
    <div className="hidden md:block">
      <div className="relative flex justify-between">
        {steps.map((step) => {
          const isCompleted = currentStep > step.number
          const isCurrent = currentStep === step.number

          return (
            <div key={step.number} className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                  isCompleted
                    ? "border-blue-500 bg-blue-500 text-white"
                    : isCurrent
                      ? "border-blue-500 bg-white text-blue-500"
                      : "border-gray-300 bg-white text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">{step.number}</span>
                )}
              </div>
              <span
                className={`mt-1 hidden text-xs font-medium md:block ${
                  isCurrent ? "text-blue-500" : isCompleted ? "text-gray-700" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="relative mt-4">
        <div className="absolute h-1 w-full rounded-full bg-gray-200"></div>
        <div
          className="absolute h-1 rounded-full bg-blue-500"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        ></div>
      </div>
    </div>
  )
}
