"use client"

import { format } from "date-fns"
import type { BookingFormData } from "@/lib/types"
import { packages, menus, menuAddons, vendors } from "@/lib/data"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface PreviewStepProps {
  formData: BookingFormData
}

export default function PreviewStep({ formData }: PreviewStepProps) {
  const selectedPackage = packages.find((p) => p.id === formData.selectedPackage)
  const selectedMenu = menus.find((m) => m.id === formData.selectedMenu)

  const selectedAddons = formData.menuAddons
    .map((addonId) => menuAddons.find((addon) => addon.id === addonId))
    .filter(Boolean)

  const selectedVendors = formData.selectedVendors
    .map((vendorId) => vendors.find((vendor) => vendor.id === vendorId))
    .filter(Boolean)

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">Booking Summary</h2>
        <p className="text-muted-foreground">Please review your booking details before submitting</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium">Personal Information</h3>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{formData.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{formData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{formData.phoneNumber}</span>
              </div>
            </div>

            <Separator className="my-4" />

            <h3 className="text-lg font-medium">Booking Details</h3>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {formData.bookingDate ? format(formData.bookingDate, "PPP") : "Not selected"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Slot:</span>
                <span className="font-medium">
                  {formData.timeSlot === "morning" && "Morning (9AM - 12PM)"}
                  {formData.timeSlot === "midday" && "Midday (12PM - 4PM)"}
                  {formData.timeSlot === "evening" && "Evening (5PM - 10PM)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Number of Guests:</span>
                <span className="font-medium">{formData.guestCount}</span>
              </div>
            </div>

            <Separator className="my-4" />

            <h3 className="text-lg font-medium">Package & Menu</h3>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Selected Package:</span>
                <span className="font-medium">
                  {selectedPackage?.name} (${selectedPackage?.price})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Selected Menu:</span>
                <span className="font-medium">
                  {selectedMenu?.name} (${selectedMenu?.price})
                </span>
              </div>

              {selectedAddons.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Menu Add-ons:</span>
                  <ul className="mt-1 space-y-1">
                    {selectedAddons.map((addon) => (
                      <li key={addon?.id} className="flex justify-between">
                        <span>{addon?.name}</span>
                        <span>${addon?.price}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {selectedVendors.length > 0 && (
              <>
                <Separator className="my-4" />
                <h3 className="text-lg font-medium">Selected Vendors</h3>
                <ul className="mt-3 space-y-2">
                  {selectedVendors.map((vendor) => (
                    <li key={vendor?.id} className="flex justify-between">
                      <div>
                        <span>{vendor?.name}</span>
                        <span className="ml-2 text-sm text-muted-foreground">({vendor?.type})</span>
                      </div>
                      <span>${vendor?.price}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <Separator className="my-4" />

            <div className="flex justify-between text-lg font-bold">
              <span>Total Price:</span>
              <span>${formData.totalPrice}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

