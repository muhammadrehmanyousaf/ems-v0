"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, X, Search } from "lucide-react"
import type { BookingFormData } from "@/lib/types"
import { vendors } from "@/lib/data"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface VendorSelectionStepProps {
  formData: BookingFormData
  updateFormData: (data: Partial<BookingFormData>) => void
}

export default function VendorSelectionStep({ formData, updateFormData }: VendorSelectionStepProps) {
  const [selectedVendorType, setSelectedVendorType] = useState("")
  const [selectedVendorId, setSelectedVendorId] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

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
      // Also remove any vendor packages associated with this vendor
      selectedVendorPackages: formData.selectedVendorPackages.filter((packageId) => {
        const pkg = vendors.find((v) => v.id === vendorId)?.packages?.find((p) => p.id === packageId)
        return !pkg
      }),
    })
  }

  const getVendorById = (id: string) => {
    return vendors.find((vendor) => vendor.id === id)
  }

  // Filter vendors based on search query
  const searchFilteredVendors = formData.selectedVendors
    .map((id) => getVendorById(id))
    .filter(
      (vendor) =>
        vendor &&
        (vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.type.toLowerCase().includes(searchQuery.toLowerCase())),
    )

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-800">Select Vendors</h2>
        <p className="text-gray-600">Choose vendors for your event before selecting packages</p>
      </div>

      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-700">
          Select your preferred vendors first, then choose packages that work with them in the next step
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-base font-medium text-gray-700">Add Vendors</h3>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
              <div className="flex-1 space-y-1">
                <Label htmlFor="vendor-type" className="text-sm text-gray-600">
                  Vendor Type
                </Label>
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

              <div className="flex-1 space-y-1">
                <Label htmlFor="vendor" className="text-sm text-gray-600">
                  Vendor
                </Label>
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
                <Button
                  type="button"
                  onClick={addVendor}
                  disabled={!selectedVendorId}
                  className="w-full bg-blue-500 hover:bg-blue-600 sm:w-auto"
                  size="sm"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Vendor
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-700">Selected Vendors</h3>

            {formData.selectedVendors.length > 0 && (
              <div className="relative w-48">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-sm"
                />
              </div>
            )}
          </div>

          {formData.selectedVendors.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
              <p className="text-gray-500">No vendors selected yet</p>
              <p className="mt-1 text-sm text-gray-400">Add vendors from the selection above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(searchQuery ? searchFilteredVendors : formData.selectedVendors.map((id) => getVendorById(id))).map(
                (vendor) => {
                  if (!vendor) return null

                  return (
                    <div
                      key={vendor.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{vendor.name}</p>
                        <div className="flex items-center">
                          <Badge variant="outline" className="mr-2 bg-blue-50 text-xs text-blue-700">
                            {vendor.type.charAt(0).toUpperCase() + vendor.type.slice(1)}
                          </Badge>
                          <span className="text-sm text-gray-600">${vendor.price}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVendor(vendor.id)}
                        className="h-8 w-8 rounded-full p-0 text-gray-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                },
              )}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-600">
          Selecting vendors now will help us recommend the best packages for your event in the next step. You can always
          come back and modify your vendor selection later.
        </p>
      </div>
    </div>
  )
}
