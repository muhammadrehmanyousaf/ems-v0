"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Star, MapPin, Clock, Users, Package } from "lucide-react"
import type { BookingFormData, EventVenue, Vendor } from "@/lib/types"

interface PackageSelectionStepProps {
  formData: BookingFormData
  updateFormData: (data: Partial<BookingFormData>) => void
  venue: EventVenue | null
  vendorDetails?: Vendor[]
}

export default function PackageSelectionStep({ formData, updateFormData, venue, vendorDetails }: PackageSelectionStepProps) {
  const [selectedPackageId, setSelectedPackageId] = useState(formData.selectedPackage)
  const [selectedVendorPackages, setSelectedVendorPackages] = useState<string[]>(formData.selectedVendorPackages || [])

  // Determine if this is a vendor booking
  const isVendor = venue && !('menus' in venue) && ((venue as any)?.subBusinessType || (venue as any)?.type)
  const isVenueBooking = venue && 'menus' in venue && !!venue?.menus && Array.isArray(venue?.menus) && (venue?.menus?.length ?? 0) > 0

  const venuePackages = venue?.packages || []
  const vendorPackages = vendorDetails?.flatMap(vendor => vendor.packages || []) || []

  // Calculate total price
  const calculateTotalPrice = () => {
    let total = 0
    
    // Main venue/vendor package price
    if (selectedPackageId) {
      const selectedPackage = venuePackages.find(pkg => String(pkg.id) === String(selectedPackageId))
      total += selectedPackage?.price || 0
    }
    
    // Additional vendor packages
    selectedVendorPackages.forEach(pkgId => {
      const vendorPackage = vendorPackages.find(pkg => String(pkg.id) === String(pkgId))
      total += vendorPackage?.price || 0
    })
    
    return total
  }

  useEffect(() => {
    const totalPrice = calculateTotalPrice()
    updateFormData({ totalPrice })
  }, [selectedPackageId, selectedVendorPackages])

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId)
    updateFormData({ selectedPackage: packageId })
  }

  const handleVendorPackageToggle = (packageId: string) => {
    const newSelected = selectedVendorPackages.includes(packageId)
      ? selectedVendorPackages.filter(id => id !== packageId)
      : [...selectedVendorPackages, packageId]
    
    setSelectedVendorPackages(newSelected)
    updateFormData({ selectedVendorPackages: newSelected })
  }

  const getVendorForPackage = (packageId: string) => {
    return vendorDetails?.find(vendor => 
      vendor.packages?.some(pkg => String(pkg.id) === String(packageId))
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-neutral-900">
          {isVendor ? 'Select Your Package' : 'Select Packages'}
        </h2>
        <p className="text-neutral-600">
          {isVendor 
            ? 'Choose the perfect package for your event'
            : 'Select packages for your venue and additional vendors'
          }
        </p>
      </div>

      {/* Main Venue/Vendor Package Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-800">
            {isVendor ? 'Available Packages' : `${venue?.name || 'Venue'} Packages`}
          </h3>
          {isVendor && (
            <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200">
              {(venue as any)?.subBusinessType || (venue as any)?.type} Service
            </Badge>
          )}
        </div>

        {venuePackages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {venuePackages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedPackageId === String(pkg.id)
                    ? 'ring-2 ring-rose-500 bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200'
                    : 'hover:border-rose-300'
                }`}
                onClick={() => handlePackageSelect(String(pkg.id))}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    {selectedPackageId === String(pkg.id) && (
                      <Check className="h-5 w-5 text-rose-500" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-rose-600">₹{pkg.price}</div>
                </CardHeader>
                <CardContent className="pt-0">
                  {pkg.description && (
                    <p className="text-sm text-neutral-600 mb-3">{pkg.description}</p>
                  )}
                  {pkg.features && pkg.features.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-neutral-700">What's included:</h4>
                      <ul className="space-y-1">
                        {pkg.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-neutral-600">
                            <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {pkg.duration && (
                    <div className="flex items-center mt-3 text-sm text-neutral-500">
                      <Clock className="h-4 w-4 mr-1" />
                      Duration: {pkg.duration}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-neutral-300 bg-neutral-50">
            <CardContent className="p-8 text-center">
              <div className="text-neutral-500 mb-4">
                <Package className="h-12 w-12 mx-auto mb-3 text-neutral-400" />
                <h3 className="text-lg font-medium text-neutral-700 mb-2">
                  {isVendor ? 'No Packages Available' : 'No Packages Available'}
                </h3>
                <p className="text-sm text-neutral-600">
                  {isVendor 
                    ? 'This vendor currently doesn\'t have any packages defined. Please contact them directly for pricing and services.'
                    : 'This venue currently doesn\'t have any packages defined. Please contact them directly for pricing and services.'
                  }
                </p>
              </div>
              <Button 
                variant="outline" 
                className="border-neutral-300 hover:border-rose-500 hover:text-rose-600"
                onClick={() => {
                  // Auto-select a default package or proceed without selection
                  updateFormData({ selectedPackage: 'default' })
                }}
              >
                Continue Without Package
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Additional Vendor Packages (for venue bookings) */}
      {isVenueBooking && vendorPackages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-800">Additional Vendor Services</h3>
            <Badge variant="outline" className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200">
              Optional Add-ons
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendorPackages.map((pkg) => {
              const vendor = getVendorForPackage(String(pkg.id))
              return (
                <Card
                  key={pkg.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedVendorPackages.includes(String(pkg.id))
                      ? 'ring-2 ring-green-500 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                      : 'hover:border-green-300'
                  }`}
                  onClick={() => handleVendorPackageToggle(String(pkg.id))}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        {vendor && (
                          <p className="text-sm text-neutral-500 mt-1">
                            by {vendor.name}
                          </p>
                        )}
                      </div>
                      {selectedVendorPackages.includes(String(pkg.id)) && (
                        <Check className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <div className="text-2xl font-bold text-green-600">₹{pkg.price}</div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {pkg.description && (
                      <p className="text-sm text-neutral-600 mb-3">{pkg.description}</p>
                    )}
                    {pkg.features && pkg.features.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-neutral-700">Features:</h4>
                        <ul className="space-y-1">
                          {pkg.features.slice(0, 3).map((feature, index) => (
                            <li key={index} className="flex items-center text-sm text-neutral-600">
                              <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                          {pkg.features.length > 3 && (
                            <li className="text-xs text-neutral-500">
                              +{pkg.features.length - 3} more features
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Total Price Summary */}
      <Card className="bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-800">Total Amount</h3>
              <p className="text-sm text-neutral-600">
                {selectedPackageId ? 'Package selected' : 'No package selected'}
                {selectedVendorPackages.length > 0 && ` + ${selectedVendorPackages.length} additional service(s)`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-rose-600">₹{calculateTotalPrice()}</div>
              <p className="text-sm text-neutral-500">All inclusive</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border border-blue-200">
        <p className="text-sm text-blue-700">
          {isVendor 
            ? 'Select the package that best fits your event requirements. You can review all details before confirming your booking.'
            : 'Choose your venue package and optionally add services from other vendors to create your perfect event package.'
          }
        </p>
      </div>
    </div>
  )
}
