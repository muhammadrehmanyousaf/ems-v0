"use client"

import { format } from "date-fns"
import type { BookingFormData } from "@/lib/types"
import { bookingPackages, bookingMenus, menuAddons, vendors, vendorPackages } from "@/lib/data"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, Users, User, Clock, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PreviewStepProps {
  formData: BookingFormData
}

export default function PreviewStep({ formData }: PreviewStepProps) {
  const selectedPackage = bookingPackages.find((p) => p.id === formData.selectedPackage)
  const selectedMenu = bookingMenus.find((m) => m.id === formData.selectedMenu)

  const selectedAddons = formData.menuAddons
    .map((addonId) => menuAddons.find((addon) => addon.id === addonId))
    .filter(Boolean)

  const selectedVendors = formData.selectedVendors
    .map((vendorId) => vendors.find((vendor) => vendor.id === vendorId))
    .filter(Boolean)

  const selectedVendorPackages = formData.selectedVendorPackages
    .map((packageId) => {
      const vendorPackage = vendorPackages.find((pkg) => pkg.id === packageId)
      if (!vendorPackage) return null

      const vendor = vendors.find((v) => v.id === vendorPackage.vendorId)
      return { ...vendorPackage, vendorName: vendor?.name || "" }
    })
    .filter(Boolean)

  // Format time slot for display
  const getTimeSlotDisplay = (timeSlot: string) => {
    switch (timeSlot) {
      case "morning":
        return "Morning (9AM - 12PM)"
      case "midday":
        return "Midday (12PM - 4PM)"
      case "evening":
        return "Evening (5PM - 10PM)"
      default:
        return "Not selected"
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-800">Booking Summary</h2>
        <p className="text-gray-600">Please review your booking details before submitting</p>
      </div>

      <div className="space-y-6">
        <Card className="overflow-hidden rounded-lg border-gray-200 shadow-md">
          <div className="bg-blue-500 px-6 py-4">
            <h3 className="text-lg font-medium text-white">Personal Information</h3>
          </div>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <User className="mr-1 h-4 w-4 text-blue-500" />
                  Name
                </div>
                <p className="font-medium text-gray-800">{formData.username}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="mr-1 h-4 w-4 text-blue-500" />
                  Email
                </div>
                <p className="font-medium text-gray-800">{formData.email}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="mr-1 h-4 w-4 text-blue-500" />
                  Phone
                </div>
                <p className="font-medium text-gray-800">{formData.phoneNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-lg border-gray-200 shadow-md">
          <div className="bg-blue-500 px-6 py-4">
            <h3 className="text-lg font-medium text-white">Event Details</h3>
          </div>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarDays className="mr-1 h-4 w-4 text-blue-500" />
                  Date
                </div>
                <p className="font-medium text-gray-800">
                  {formData.bookingDate ? format(formData.bookingDate, "MMMM d, yyyy") : "Not selected"}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="mr-1 h-4 w-4 text-blue-500" />
                  Time
                </div>
                <p className="font-medium text-gray-800">{getTimeSlotDisplay(formData.timeSlot)}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="mr-1 h-4 w-4 text-blue-500" />
                  Guests
                </div>
                <p className="font-medium text-gray-800">{formData.guestCount} people</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-lg border-gray-200 shadow-md">
          <div className="bg-blue-500 px-6 py-4">
            <h3 className="text-lg font-medium text-white">Venue Package</h3>
          </div>

          <CardContent className="p-6">
            {selectedPackage ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-lg font-medium text-gray-800">{selectedPackage.name}</h4>
                    <p className="text-sm text-gray-600">{selectedPackage.description}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 text-sm px-2 py-1">${selectedPackage.price}</Badge>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h5 className="mb-2 text-sm font-medium text-gray-700">Included Facilities:</h5>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {selectedPackage.facilities.map((facility, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                        <span className="text-gray-700">{facility}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No package selected</p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-lg border-gray-200 shadow-md">
          <div className="bg-blue-500 px-6 py-4">
            <h3 className="text-lg font-medium text-white">Menu Selection</h3>
          </div>

          <CardContent className="p-6">
            {selectedMenu ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-lg font-medium text-gray-800">{selectedMenu.name}</h4>
                    <p className="text-sm text-gray-600">{selectedMenu.description}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 text-sm px-2 py-1">${selectedMenu.price}</Badge>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h5 className="mb-2 text-sm font-medium text-gray-700">Menu Items:</h5>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {selectedMenu.items.map((item, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <div className="mr-2 h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedAddons.length > 0 && (
                  <div>
                    <h5 className="mb-2 text-sm font-medium text-gray-700">Selected Add-ons:</h5>
                    <div className="space-y-2">
                      {selectedAddons.map((addon) => (
                        <div key={addon?.id} className="flex items-center justify-between rounded-md bg-blue-50 p-2">
                          <span className="text-sm text-gray-800">{addon?.name}</span>
                          <Badge className="bg-blue-100 text-blue-800 text-xs">+${addon?.price}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No menu selected</p>
            )}
          </CardContent>
        </Card>

        {selectedVendors.length > 0 && (
          <Card className="overflow-hidden rounded-lg border-gray-200 shadow-md">
            <div className="bg-blue-500 px-6 py-4">
              <h3 className="text-lg font-medium text-white">Selected Vendors</h3>
            </div>

            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {selectedVendors.map((vendor) => (
                    <div
                      key={vendor?.id}
                      className="flex justify-between rounded-md bg-gray-50 p-3 border border-gray-200"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{vendor?.name}</p>
                        <Badge variant="outline" className="mt-1 bg-blue-50 text-xs text-blue-700">
                          {vendor?.type}
                        </Badge>
                      </div>
                      <span className="font-medium text-blue-600">${vendor?.price}</span>
                    </div>
                  ))}
                </div>

                {selectedVendorPackages.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Selected Vendor Packages:</h4>
                    {selectedVendorPackages.map((pkg) => (
                      <div
                        key={pkg?.id || ''}
                        className="flex justify-between rounded-md bg-blue-50 p-3 border border-blue-100"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{pkg?.name || "Unknown Package"}</p>
                          <p className="text-xs text-gray-600">{pkg?.vendorName || "Unknown Vendor"}</p>
                        </div>
                        <span className="font-medium text-blue-600">${pkg?.price || 0}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="overflow-hidden rounded-lg border-gray-200 shadow-md">
          <div className="bg-blue-500 px-6 py-4">
            <h3 className="text-lg font-medium text-white">Pricing Summary</h3>
          </div>

          <CardContent className="p-6">
            <div className="space-y-3">
              {selectedPackage && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Venue Package ({selectedPackage.name})</span>
                  <span className="font-medium text-gray-800">${selectedPackage.price}</span>
                </div>
              )}

              {selectedMenu && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Menu ({selectedMenu.name})</span>
                  <span className="font-medium text-gray-800">${selectedMenu.price}</span>
                </div>
              )}

              {selectedAddons.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Menu Add-ons ({selectedAddons.length})</span>
                  <span className="font-medium text-gray-800">${selectedAddons.length * 100}</span>
                </div>
              )}

              {selectedVendors.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Vendors ({selectedVendors.length})</span>
                  <span className="font-medium text-gray-800">${selectedVendors.length * 300}</span>
                </div>
              )}

              {selectedVendorPackages.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Vendor Packages ({selectedVendorPackages.length})</span>
                  <span className="font-medium text-gray-800">
                    $
                    {selectedVendorPackages.reduce((total, pkg) => {
                      return total + (pkg?.price || 0)
                    }, 0)}
                  </span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-base font-medium text-gray-800">Total</span>
                <span className="text-lg font-bold text-blue-600">${formData.totalPrice}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
