"use client"

import { useState, useEffect } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Check, Package } from "lucide-react"
import type { BookingFormData, BookingVendor, BookingVendorPackage } from "@/lib/types"
import { bookingPackages, vendors, vendorPackages } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

interface PackageSelectionStepProps {
  formData: BookingFormData
  updateFormData: (data: Partial<BookingFormData>) => void
}

export default function PackageSelectionStep({ formData, updateFormData }: PackageSelectionStepProps) {
  const [expandedVendorSection, setExpandedVendorSection] = useState<string[]>([])
  const [expandedVenueSection, setExpandedVenueSection] = useState<boolean>(true)
  const [selectedVendors, setSelectedVendors] = useState<BookingVendor[]>([])

  // Get vendor objects for the selected vendors
  useEffect(() => {
    const vendorObjects = formData.selectedVendors
      .map((vendorId) => {
        return vendors.find((v) => v.id === vendorId)
      })
      .filter(Boolean) as BookingVendor[]

    setSelectedVendors(vendorObjects)

    // Auto-expand the first vendor section if there are selected vendors
    if (vendorObjects.length > 0 && expandedVendorSection.length === 0) {
      setExpandedVendorSection([vendorObjects[0]?.id || ""])
    }
  }, [formData.selectedVendors])

  const handlePackageSelect = (packageId: string) => {
    updateFormData({ selectedPackage: packageId })
  }

  const handleVendorSectionToggle = (vendorId: string) => {
    setExpandedVendorSection((prev) => {
      if (prev.includes(vendorId)) {
        return prev.filter((id) => id !== vendorId)
      } else {
        return [...prev, vendorId]
      }
    })
  }

  const handleVendorPackageToggle = (packageId: string) => {
    const currentPackages = [...formData.selectedVendorPackages]

    if (currentPackages.includes(packageId)) {
      updateFormData({
        selectedVendorPackages: currentPackages.filter((id) => id !== packageId),
      })
    } else {
      updateFormData({
        selectedVendorPackages: [...currentPackages, packageId],
      })
    }
  }

  // Get packages for a specific vendor
  const getVendorPackages = (vendorId: string): BookingVendorPackage[] => {
    return vendorPackages.filter((pkg) => pkg.vendorId === vendorId)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-800">Select Packages</h2>
        <p className="text-gray-600">Choose venue package and vendor packages</p>
      </div>

      {/* Venue Packages Section */}
      <div className="space-y-4">
        <h3 className="text-base font-medium text-gray-700">Venue Package</h3>

        <Accordion
          type="single"
          collapsible
          value={expandedVenueSection ? "venue-packages" : ""}
          onValueChange={(value) => setExpandedVenueSection(value === "venue-packages")}
          className="space-y-3"
        >
          <AccordionItem value="venue-packages" className="rounded-lg border border-gray-200 px-4 shadow-sm">
            <AccordionTrigger className="py-3 hover:no-underline">
              <div className="flex items-center">
                <Package className="mr-2 h-5 w-5 text-blue-500" />
                <span className="font-medium text-gray-800">Select a Venue Package</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <RadioGroup value={formData.selectedPackage} onValueChange={handlePackageSelect} className="space-y-4">
                {bookingPackages.map((pkg) => {
                  const isRecommended = pkg.id === "standard"

                  return (
                    <div
                      key={pkg.id}
                      className={`relative overflow-hidden rounded-md border p-4 ${
                        formData.selectedPackage === pkg.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      }`}
                    >
                      {isRecommended && (
                        <div className="absolute -right-8 top-3 rotate-45 bg-blue-500 px-8 py-1 text-xs font-medium text-white">
                          Recommended
                        </div>
                      )}

                      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <RadioGroupItem value={pkg.id} id={pkg.id} className="sr-only" />
                          <Label htmlFor={pkg.id} className="cursor-pointer">
                            <div className="flex flex-col">
                              <span className="text-lg font-medium text-gray-800">{pkg.name}</span>
                              <p className="mt-1 text-sm text-gray-600">{pkg.description}</p>
                            </div>
                          </Label>
                        </div>

                        <div className="mt-3 flex flex-col items-end md:mt-0">
                          <span className="text-lg font-medium text-blue-600">${pkg.price}</span>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {pkg.facilities.slice(0, 4).map((facility, index) => (
                          <div key={index} className="flex items-center">
                            <Check className="mr-1.5 h-4 w-4 text-blue-500" />
                            <span className="text-sm text-gray-700">{facility}</span>
                          </div>
                        ))}
                        {pkg.facilities.length > 4 && (
                          <div className="text-sm text-blue-600">+{pkg.facilities.length - 4} more features</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {formData.selectedVendors.length > 0 && (
        <div className="rounded-lg bg-blue-50 p-4">
          <h3 className="mb-2 text-sm font-medium text-blue-700">Selected Vendors</h3>
          <div className="flex flex-wrap gap-2">
            {selectedVendors.map((vendor) => (
              <Badge key={vendor.id} variant="outline" className="bg-white">
                {vendor.name}
              </Badge>
            ))}
          </div>
          <p className="mt-2 text-xs text-blue-600">Select packages from your vendors below</p>
        </div>
      )}

      {/* Vendor Packages Section */}
      {selectedVendors.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-700">Vendor Packages</h3>

          <Accordion
            type="multiple"
            value={expandedVendorSection}
            onValueChange={setExpandedVendorSection}
            className="space-y-3"
          >
            {selectedVendors.map((vendor) => {
              const vendorPackagesList = getVendorPackages(vendor.id)

              return (
                <AccordionItem
                  key={vendor.id}
                  value={vendor.id}
                  className="rounded-lg border border-gray-200 px-4 shadow-sm"
                >
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-800">{vendor.name}</span>
                      <Badge variant="outline" className="ml-2 bg-blue-50 text-xs text-blue-700">
                        {vendor.type}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    {vendorPackagesList && vendorPackagesList.length > 0 ? (
                      <div className="space-y-3">
                        {vendorPackagesList.map((pkg) => (
                          <div
                            key={pkg.id}
                            className={`relative rounded-md border p-3 ${
                              formData.selectedVendorPackages.includes(pkg.id)
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-blue-300"
                            }`}
                          >
                            <div className="flex items-start">
                              <Checkbox
                                id={pkg.id}
                                checked={formData.selectedVendorPackages.includes(pkg.id)}
                                onCheckedChange={() => handleVendorPackageToggle(pkg.id)}
                                className="mt-1 border-blue-500 text-blue-500"
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor={pkg.id} className="font-medium cursor-pointer text-gray-800">
                                    {pkg.name}
                                  </Label>
                                  <span className="font-medium text-blue-600">${pkg.price}</span>
                                </div>
                                <p className="text-sm text-gray-600">{pkg.description}</p>

                                <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                                  {pkg.features.slice(0, 4).map((feature, index) => (
                                    <div key={index} className="flex items-center">
                                      <Check className="mr-1 h-3 w-3 text-blue-500" />
                                      <span className="text-xs text-gray-700">{feature}</span>
                                    </div>
                                  ))}
                                  {pkg.features.length > 4 && (
                                    <div className="text-xs text-blue-600">
                                      +{pkg.features.length - 4} more features
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No packages available for this vendor.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>
      )}

      {/* Selected Vendor Packages Summary */}
      {formData.selectedVendorPackages.length > 0 && (
        <div className="rounded-lg border border-gray-200 p-4">
          <h4 className="mb-3 text-sm font-medium text-gray-700">Selected Vendor Packages:</h4>
          <div className="space-y-2">
            {formData.selectedVendorPackages.map((packageId) => {
              const vendorPackage = vendorPackages.find((pkg) => pkg.id === packageId)
              if (!vendorPackage) return null

              const vendor = vendors.find((v) => v.id === vendorPackage.vendorId)

              return (
                <div
                  key={packageId}
                  className="flex justify-between rounded-md bg-blue-50 px-3 py-2 text-sm border border-blue-100"
                >
                  <div>
                    <span className="font-medium text-gray-800">{vendorPackage.name}</span>
                    <span className="ml-2 text-xs text-gray-500">({vendor?.name})</span>
                  </div>
                  <span className="font-medium text-blue-600">${vendorPackage.price}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
