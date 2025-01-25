import * as React from "react"
import { cn } from "@/lib/utils"

interface StepProps {
  title: string
  description?: string
  isActive?: boolean
  isCompleted?: boolean
}

export const Step = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & StepProps
>(({ title, description, isActive, isCompleted, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center text-center",
        isActive && "text-primary",
        isCompleted && "text-green-500",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-base font-semibold mb-2",
          isActive && "border-primary bg-primary/10",
          isCompleted && "border-green-500 bg-green-500 text-white",
          !isActive && !isCompleted && "border-gray-300 bg-gray-50"
        )}
      >
        {isCompleted ? (
          <CheckIcon className="h-5 w-5" />
        ) : (
          <span>{props["aria-label"]}</span>
        )}
      </div>
      <div className="flex flex-col items-center">
        <div className="text-base font-semibold whitespace-nowrap">{title}</div>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
      </div>
    </div>
  )
})
Step.displayName = "Step"

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  currentStep: number
  children: React.ReactNode
}

export const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ currentStep, children, className, ...props }, ref) => {
    const steps = React.Children.toArray(children)

    return (
      <div
        ref={ref}
        className={cn("relative flex flex-row items-center justify-between w-full px-16", className)}
        {...props}
      >
        {/* Steps with connecting lines */}
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            {/* Step */}
            <div className="relative flex flex-col items-center z-10">
              {React.isValidElement<React.ComponentProps<typeof Step>>(step) &&
                React.cloneElement(step, {
                  "aria-label": (index + 1).toString(),
                  isActive: currentStep === index + 1,
                  isCompleted: currentStep > index + 1,
                })}
            </div>

            {/* Connecting line (only between steps) */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <div className="h-1 bg-gray-200">
                  <div
                    className="h-1 bg-primary transition-all duration-300 ease-in-out"
                    style={{
                      width: currentStep > index + 1 ? '100%' : '0%',
                    }}
                  />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    )
  }
)
Stepper.displayName = "Stepper"

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  )
} 