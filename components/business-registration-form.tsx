"use client"

import { useState } from "react"
import { useFormContext } from "@/context/form-context"
import { BusinessTypeStep } from "./steps/business-type-step"
import { PersonalDetailsStep } from "./steps/personal-details-step"
import { BusinessDetailsStep } from "./steps/business-details-step"
import { PackagesStep } from "./steps/packages-step"
import { ContactDetailsStep } from "./steps/contact-details-step"
import { ImagesStep } from "./steps/images-step"
import { ReviewStep } from "./steps/review-step"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const steps = [
  { title: "Business Type", component: BusinessTypeStep },
  { title: "Personal Details", component: PersonalDetailsStep },
  { title: "Business Details", component: BusinessDetailsStep },
  { title: "Packages", component: PackagesStep },
  { title: "Contact Details", component: ContactDetailsStep },
  { title: "Images", component: ImagesStep },
  { title: "Review", component: ReviewStep },
]

export function BusinessRegistrationForm() {
  const { currentStep, setCurrentStep, isValid } = useFormContext()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const CurrentStepComponent = steps[currentStep].component

  const handleNext = () => {
    if (isValid(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, steps.length - 1))
    }
  }

  const handleBack = () => {
    setCurrentStep(Math.max(currentStep - 1, 0))
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/placeholder.svg" alt="Perfect Wedding Logo" width={40} height={40} />
          <span className="text-2xl font-semibold">Perfect Wedding</span>
        </Link>
        <Link href="/get-help" className="text-rose-600 text-sm hover:underline">
          Having Trouble?
          <span className="ml-1 text-rose-600">Get Help</span>
        </Link>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col md:flex-row">
          <div className="w-full md:w-1/3 p-6 hidden md:block">
            <Image
              src="https://img.freepik.com/free-vector/hospital-receptionist-pointing-man-without-mask-nurse-patient-quarantine-flat-vector-illustration_74855-11279.jpg?ga=GA1.1.851296793.1738481066&semt=ais_hybrid"
              alt="Illustration"
              width={400}
              height={400}
              className="sticky top-24"
            />
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8">
                <h1 className="text-2xl font-semibold mb-2">
                  {currentStep === 0 ? "Join Perfect Wedding" : steps[currentStep].title}
                </h1>
                {currentStep === 1 && (
                  <p className="text-gray-600">
                    Listing your business is only a few steps away. Enter your following info.
                  </p>
                )}
              </div>

              <div className="bg-white rounded-lg">
                <CurrentStepComponent />
              </div>

              {currentStep === 0 && (
                <div className="text-center mt-6">
                  <p className="text-sm text-gray-600">
                    Already a Member?{" "}
                    <Link href="/login" className="text-rose-600 hover:underline">
                      Log in
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t sticky bottom-0 bg-white z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex justify-between">
          <Button variant="outline" onClick={handleBack} className={cn(currentStep === 0 && "invisible")}>
            Back
          </Button>
          <Button
            onClick={handleNext}
            className="bg-rose-600 hover:bg-rose-700 text-white"
            disabled={!isValid(currentStep) || isSubmitting}
          >
            {currentStep === steps.length - 1 ? "Submit" : "Next"}
          </Button>
        </div>
      </footer>
    </div>
  )
}

