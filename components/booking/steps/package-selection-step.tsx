"use client"

import React, { useState, useEffect } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Check, Package } from "lucide-react"
import type { BookingFormData, BookingVendor, BookingVendorPackage, EventVenue, Vendor } from "@/lib/types"
import { bookingPackages, vendors } from "@/lib/data"
import { VendorAPI } from "@/lib/api/vendors"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

interface PackageSelectionStepProps {
  formData: BookingFormData
  updateFormData: React.Dispatch<React.SetStateAction<BookingFormData>>
  venue: EventVenue | null
  vendorDetails?: Vendor[]
}

export default function PackageSelectionStep({ formData, updateFormData, venue, vendorDetails = [] }: PackageSelectionStepProps) {
  const [expandedVendorSection, setExpandedVendorSection] = useState<string[]>([])
  const [expandedVenueSection, setExpandedVenueSection] = useState<boolean>(true)
  const [selectedVendors, setSelectedVendors] = useState<BookingVendor[]>([])
  const [resolvedVendors, setResolvedVendors] = useState<Vendor[]>(vendorDetails)

  const packages = venue?.packages

  useEffect(() => {
    // Resolve selected vendors from ids stored in formData
    const resolved = formData.selectedVendors
      .map((id) => {
        // try match from provided vendorDetails first
        const vd = vendorDetails.find(v => String(v.id) === String(id))
        if (vd) return { id: String(vd.id), name: vd.name, type: vd.type || vd.subBusinessType || '', price: vd.minimumPrice || vd.price || 0 }
        const fallback = vendors.find((v) => v.id === id)
        return fallback || null
      })
      .filter(Boolean) as BookingVendor[]
    setSelectedVendors(resolved)
  }, [formData.selectedVendors, vendorDetails])

  // Ensure we have real vendor details with packages; if none passed in, fetch by id
  useEffect(() => {
    const load = async () => {
      if (vendorDetails && vendorDetails.length > 0) {
        setResolvedVendors(vendorDetails)
        return
      }
      if (formData.selectedVendors.length === 0) {
        setResolvedVendors([])
        return
      }
      const details = await Promise.all(
        formData.selectedVendors.map(async (id) => await VendorAPI.getBusinessById(id))
      )
      setResolvedVendors(details.filter(Boolean) as Vendor[])
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorDetails, formData.selectedVendors])

  const toggleVendorPackage = (pkgId: string, price: number) => {
    const exists = formData.selectedVendorPackages.includes(pkgId)
    if (exists) {
      updateFormData((prev) => ({
        ...prev,
        selectedVendorPackages: prev.selectedVendorPackages.filter((id) => id !== pkgId),
        totalPrice: Math.max(0, prev.totalPrice - price),
      }))
    } else {
      updateFormData((prev) => ({
        ...prev,
        selectedVendorPackages: [...prev.selectedVendorPackages, pkgId],
        totalPrice: prev.totalPrice + price,
      }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-800">Select Packages</h2>
        <p className="text-gray-600">Choose venue package and vendor packages</p>
      </div>

      {/* Venue Packages Section */}
      <div className="space-y-4">
        <h3 className="text-base font-medium text-gray-700">{venue ? 'Venue Package' : 'Select Package'}</h3>

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
              <RadioGroup className="space-y-4">
                 {(packages ?? []).map((pkg) => {
                  const isRecommended = pkg.id === "standard"

                  return (
                    <div
                       onClick={() => {
                        updateFormData((prev) => ({
                          ...prev,
                          selectedPackage: pkg.id,
                          totalPrice: prev.totalPrice + pkg.price,
                        }))
                      }}
                      key={pkg.id}
                      className={`relative overflow-hidden rounded-md border p-4 cursor-pointer ${formData.selectedPackage === pkg.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                        }`}
                    >
                      <div className="space-y-3">
                        {isRecommended && (
                          <span className="bg-blue-500 px-4 py-1 text-xs font-medium text-white rounded-full">
                            Recommended
                          </span>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-medium text-gray-800">{pkg.name}</span>
                           <span className="text-lg font-medium text-blue-600">₹{pkg.price}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{pkg.description}</p>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {pkg.features.slice(0, 4).map((facility: string, index: number) => (
                          <div key={index} className="flex items-center">
                            <Check className="mr-1.5 h-4 w-4 text-blue-500" />
                            <span className="text-sm text-gray-700">{facility}</span>
                          </div>
                        ))}
                        {pkg.features.length > 4 && (
                          <div className="text-sm text-blue-600">+{pkg.features.length - 4} more features</div>
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

      {/* {formData.selectedVendors.length > 0 && (
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
      )} */}

      {/* Vendor Packages Section */}
      {(formData.selectedVendors?.length ?? 0) > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-medium text-gray-700">Vendor Packages</h3>

          <Accordion
            type="multiple"
            value={expandedVendorSection}
            onValueChange={setExpandedVendorSection}
            className="space-y-3"
          >
            {resolvedVendors
              .filter(v => formData.selectedVendors.includes(String(v.id)))
              .map((vendor) => {
              const vendorPackagesList = (vendor as any).packages || []

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
                            className={`relative rounded-md border p-3 ${formData.selectedVendorPackages.includes(pkg.id)
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-blue-300"
                              }`}
                          >
                            <div className="flex items-start">
                              <Checkbox
                                id={pkg.id}
                                checked={formData.selectedVendorPackages.includes(pkg.id)}
                                onCheckedChange={() => toggleVendorPackage(pkg.id, pkg.price)}
                                className="mt-1 border-blue-500 text-blue-500"
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor={pkg.id} className="font-medium cursor-pointer text-gray-800">
                                    {pkg.name}
                                  </Label>
                                  <span className="font-medium text-blue-600">₹{pkg.price}</span>
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

    </div>
  )
}
