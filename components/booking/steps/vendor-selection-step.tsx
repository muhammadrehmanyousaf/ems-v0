"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import type { BookingFormData } from "@/lib/types"
import { vendors } from "@/lib/data"

interface VendorSelectionStepProps {
  formData: BookingFormData
  updateFormData: (data: Partial<BookingFormData>) => void
}

export default function VendorSelectionStep({ formData, updateFormData }: VendorSelectionStepProps) {
  const [selectedVendorType, setSelectedVendorType] = useState("")
  const [selectedVendorId, setSelectedVendorId] = useState("")

  const vendorTypes = Array.from(new Set(vendors.map((vendor) => vendor.type)))

  const filteredVendors = vendors.filter((vendor) => vendor.type === selectedVendorType)

  const addVendor = () => {
    if (selectedVendorId && !formData.selectedVendors.includes(selectedVendorId)) {
      updateFormData({
        selectedVendors: [...formData.selectedVendors, selectedVendorId],
      })
      setSelectedVendorType("")
      setSelectedVendorId("")
    }
  }

  const removeVendor = (vendorId: string) => {
    updateFormData({
      selectedVendors: formData.selectedVendors.filter((id) => id !== vendorId),
    })
  }

  const getVendorById = (id: string) => {
    return vendors.find((vendor) => vendor.id === id)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">Select Vendors</h2>
        <p className="text-muted-foreground">Choose additional vendors for your event</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
            <div className="flex-1 space-y-2">
              <Label htmlFor="vendor-type">Vendor Type</Label>
              <Select value={selectedVendorType} onValueChange={setSelectedVendorType}>
                <SelectTrigger id="vendor-type">
                  <SelectValue placeholder="Select vendor type" />
                </SelectTrigger>
                <SelectContent>
                  {vendorTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Select value={selectedVendorId} onValueChange={setSelectedVendorId} disabled={!selectedVendorType}>
                <SelectTrigger id="vendor">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {filteredVendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name} (${vendor.price})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button type="button" onClick={addVendor} disabled={!selectedVendorId} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Selected Vendors</h3>
          {formData.selectedVendors.length === 0 ? (
            <p className="text-muted-foreground">No vendors selected</p>
          ) : (
            <div className="space-y-3">
              {formData.selectedVendors.map((vendorId) => {
                const vendor = getVendorById(vendorId)
                if (!vendor) return null

                return (
                  <div key={vendorId} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {vendor.type.charAt(0).toUpperCase() + vendor.type.slice(1)} • ${vendor.price}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeVendor(vendorId)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

