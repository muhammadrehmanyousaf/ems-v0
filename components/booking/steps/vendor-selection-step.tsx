"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, X, Search } from "lucide-react"
import type { BookingFormData, Vendor } from "@/lib/types"
import { VendorAPI } from "@/lib/api/vendors"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { VENDOR_TYPES } from "@/lib/vendor-types"
import { Eye, MapPin, Star } from "lucide-react"

interface VendorSelectionStepProps {
  formData: BookingFormData
  updateFormData: (data: Partial<BookingFormData>) => void
}

export default function VendorSelectionStep({ formData, updateFormData }: VendorSelectionStepProps) {
  const [selectedVendorType, setSelectedVendorType] = useState("")
  const [selectedVendorId, setSelectedVendorId] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [allVendors, setAllVendors] = useState<any[]>([])
  const [previewVendor, setPreviewVendor] = useState<Vendor | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewVendorDetail, setPreviewVendorDetail] = useState<Vendor | null>(null)

  // Load vendors from API by selected type, fallback to all if no type selected
  useEffect(() => {
    const load = async () => {
      // If a specific type is chosen, try API by type first; fallback to all + local filter if empty
      if (selectedVendorType && selectedVendorType !== 'all') {
        let data = await VendorAPI.getBusinessesByVendorType(selectedVendorType)
        if (!data || data.length === 0) {
          const all = await VendorAPI.getAllBusinesses()
          const typeLower = selectedVendorType.toLowerCase()
          data = all.filter((v) => (v.type || '').toLowerCase() === typeLower)
        }
        setAllVendors(data)
      } else {
        const all = await VendorAPI.getAllBusinesses()
        setAllVendors(all)
      }
    }
    load()
  }, [selectedVendorType])

  // Fetch detailed vendor (with packages) when a vendor is selected or preview is triggered
  useEffect(() => {
    const fetchDetail = async (id: string) => {
      const detail = await VendorAPI.getBusinessById(id)
      if (detail) setPreviewVendorDetail(detail)
    }
    if (previewVendor?.id) {
      fetchDetail(String(previewVendor.id))
    } else if (selectedVendorId) {
      fetchDetail(String(selectedVendorId))
    } else {
      setPreviewVendorDetail(null)
    }
  }, [previewVendor, selectedVendorId])

  const vendorTypeOptions = Object.values(VENDOR_TYPES)

  const filteredVendors = allVendors

  const addVendor = () => {
    if (selectedVendorId && !formData.selectedVendors.includes(selectedVendorId)) {
      updateFormData({
        selectedVendors: [...formData.selectedVendors, selectedVendorId],
      })
      setSelectedVendorType("")
      setSelectedVendorId("")
    }
  }

  const removeVendor = (vendorId: string | number) => {
    updateFormData({
      selectedVendors: formData.selectedVendors.filter((id) => String(id) !== String(vendorId)),
      // Clear selected vendor packages to avoid orphan selections
      selectedVendorPackages: [],
    })
  }

  const getVendorById = (id: string) => allVendors.find((vendor) => vendor.id == id)

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
                <Select value={selectedVendorType || 'all'} onValueChange={setSelectedVendorType}>
                  <SelectTrigger id="vendor-type">
                    <SelectValue placeholder="Select vendor type" />
                   </SelectTrigger>
                    <SelectContent>
                     <SelectItem value="all">All vendor types</SelectItem>
                     {vendorTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-1">
                <Label htmlFor="vendor" className="text-sm text-gray-600">
                  Vendor
                </Label>
                <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                  <SelectTrigger id="vendor">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                   <SelectContent>
                     {filteredVendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={String(vendor.id)}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate">{vendor.name} (₹{vendor.minimumPrice || vendor.price || 0})</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewVendor(vendor); setPreviewOpen(true) }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
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
                            {vendor.type}
                          </Badge>
                          <span className="text-sm text-gray-600">₹{vendor.minimumPrice || vendor.price || 0}</span>
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

      {/* Inline Vendor Preview (detailed, below the selectors) */}
      {previewVendorDetail && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="truncate">{previewVendorDetail.name}</span>
              <Badge variant="outline">{previewVendorDetail.type || (previewVendorDetail as any).subBusinessType}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="col-span-1 sm:col-span-1">
                <div className="relative w-full h-40 overflow-hidden rounded-md">
                  <img src={previewVendorDetail.images?.[0] || "/placeholder.jpg"} alt={previewVendorDetail.name} className="h-full w-full object-cover" />
                </div>
              </div>
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {previewVendorDetail.location || previewVendorDetail.city}</span>
                  <span className="flex items-center gap-1 text-yellow-600"><Star className="w-4 h-4 fill-current" /> {previewVendorDetail.rating || 0}</span>
                  <Badge variant="outline">₹{previewVendorDetail.minimumPrice || (previewVendorDetail as any).starterPrice || 0}</Badge>
                </div>
                {previewVendorDetail.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">{previewVendorDetail.description}</p>
                )}
                {previewVendorDetail.amenities && previewVendorDetail.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {previewVendorDetail.amenities.slice(0, 8).map((a, i) => (
                      <Badge key={i} variant="outline" className="text-[11px]">{a}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {(previewVendorDetail as any).packages && (previewVendorDetail as any).packages.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-800">Packages</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(previewVendorDetail as any).packages.map((pkg: any) => (
                    <div key={pkg.id} className="rounded-md border border-gray-200 p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-800">{pkg.name}</div>
                        <div className="text-blue-600 font-semibold">₹{pkg.price}</div>
                      </div>
                      {pkg.features && pkg.features.length > 0 && (
                        <ul className="mt-2 space-y-1 text-sm text-gray-600 list-disc list-inside">
                          {pkg.features.slice(0, 5).map((f: string, idx: number) => (
                            <li key={idx}>{f}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewVendorDetail(null)}>Hide Preview</Button>
              <Button onClick={() => {
                if (previewVendorDetail) {
                  // Ensure type filter shows this vendor
                  const vType = (previewVendorDetail.type || (previewVendorDetail as any).subBusinessType || '').toString()
                  setSelectedVendorType(vType || 'all')
                  setSelectedVendorId(String(previewVendorDetail.id))
                  // Immediately add
                  updateFormData({
                    selectedVendors: Array.from(new Set([...
                      formData.selectedVendors,
                      String(previewVendorDetail.id)
                    ])),
                  })
                }
              }}>Use this vendor</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vendor Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewVendor?.name}</DialogTitle>
            <DialogDescription>{previewVendor?.type || previewVendor?.subBusinessType}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative w-full h-48 overflow-hidden rounded-md">
              <img src={previewVendor?.images?.[0] || "/placeholder.jpg"} alt={previewVendor?.name || ''} className="h-full w-full object-cover" />
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {previewVendor?.location || previewVendor?.city}</span>
              <span className="flex items-center gap-1 text-yellow-600"><Star className="w-4 h-4 fill-current" /> {previewVendor?.rating || 0}</span>
              <Badge variant="outline">₹{previewVendor?.minimumPrice || previewVendor?.price || 0}</Badge>
            </div>
            {previewVendor?.amenities && previewVendor.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {previewVendor.amenities.slice(0, 8).map((a, i) => (
                  <Badge key={i} variant="outline" className="text-[11px]">{a}</Badge>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
              <Button onClick={() => { if (previewVendor) { setSelectedVendorId(String(previewVendor.id)); setPreviewOpen(false) } }}>Select</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-600">
          Selecting vendors now will help us recommend the best packages for your event in the next step. You can always
          come back and modify your vendor selection later.
        </p>
      </div>
    </div>
  )
}
