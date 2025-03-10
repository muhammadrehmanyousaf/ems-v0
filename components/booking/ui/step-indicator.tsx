"use client"

import { Check } from "lucide-react"

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const steps = [
    { number: 1, label: "Personal Info" },
    { number: 2, label: "Date & Time" },
    { number: 3, label: "Package" },
    { number: 4, label: "Menu" },
    { number: 5, label: "Vendors" },
    { number: 6, label: "Review" },
    { number: 7, label: "Confirmation" },
  ]

  return (
    <div className="hidden md:block">
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.number
          const isCurrent = currentStep === step.number

          return (
            <div key={step.number} className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCurrent
                      ? "border-primary bg-white text-primary"
                      : "border-muted-foreground/30 bg-white text-muted-foreground"
                }`}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : <span>{step.number}</span>}
              </div>
              <span className={`mt-2 text-xs ${isCurrent ? "font-medium text-primary" : "text-muted-foreground"}`}>
                {step.label}
              </span>

              {index < steps.length - 1 && (
                <div
                  className={`absolute left-0 top-5 h-[2px] -translate-y-1/2 ${
                    index === 0
                      ? "w-[calc(100%/6)]"
                      : index === 1
                        ? "w-[calc(100%/3)]"
                        : index === 2
                          ? "w-[calc(50%)]"
                          : index === 3
                            ? "w-[calc(2*100%/3)]"
                            : index === 4
                              ? "w-[calc(5*100%/6)]"
                              : "w-full"
                  } ${currentStep > index + 1 ? "bg-primary" : "bg-muted-foreground/30"}`}
                  style={{
                    transform: `translateX(calc(${index * (100 / (steps.length - 1))}% + 5px))`,
                    width: `calc(${100 / (steps.length - 1)}% - 10px)`,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

