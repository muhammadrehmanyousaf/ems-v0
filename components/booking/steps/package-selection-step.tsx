"use client"

import { useState } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Check } from "lucide-react"
import type { BookingFormData } from "@/lib/types"
import { packages } from "@/lib/data"

interface PackageSelectionStepProps {
  formData: BookingFormData
  updateFormData: (data: Partial<BookingFormData>) => void
}

export default function PackageSelectionStep({ formData, updateFormData }: PackageSelectionStepProps) {
  const [expandedPackage, setExpandedPackage] = useState<string | null>(null)

  const handlePackageSelect = (packageId: string) => {
    updateFormData({ selectedPackage: packageId })
    setExpandedPackage(packageId)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">Select a Package</h2>
        <p className="text-muted-foreground">Choose from our carefully curated venue packages</p>
      </div>

      <RadioGroup value={formData.selectedPackage} onValueChange={handlePackageSelect} className="space-y-4">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative rounded-lg border p-4 transition-all hover:border-primary ${
              formData.selectedPackage === pkg.id ? "border-primary bg-primary/5" : ""
            }`}
          >
            <div className="flex items-start">
              <RadioGroupItem value={pkg.id} id={pkg.id} className="mt-1" />
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor={pkg.id} className="text-lg font-medium cursor-pointer">
                    {pkg.name}
                  </Label>
                  <span className="font-bold text-lg">${pkg.price}</span>
                </div>
                <p className="mt-1 text-muted-foreground">{pkg.description}</p>

                <Accordion
                  type="single"
                  collapsible
                  value={expandedPackage === pkg.id ? "facilities" : ""}
                  onValueChange={() => {
                    setExpandedPackage(expandedPackage === pkg.id ? null : pkg.id)
                  }}
                  className="mt-2"
                >
                  <AccordionItem value="facilities" className="border-none">
                    <AccordionTrigger className="py-2 text-sm font-medium text-primary">
                      View all facilities
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                        {pkg.facilities.map((facility, index) => (
                          <li key={index} className="flex items-start">
                            <Check className="mr-2 h-5 w-5 text-green-500 shrink-0" />
                            <span>{facility}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

