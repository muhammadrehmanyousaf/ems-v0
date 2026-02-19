"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, X, Search, Eye, MapPin, Star, Loader2, AlertTriangle } from "lucide-react"
import type { BookingFormData, Vendor } from "@/lib/types"
import { VendorAPI } from "@/lib/api/vendors"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { VENDOR_TYPES } from "@/lib/vendor-types"
import { motion } from "framer-motion"

interface VendorSelectionStepProps {
  formData: BookingFormData
  updateFormData: (data: Partial<BookingFormData>) => void
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] } },
}

export default function VendorSelectionStep({ formData, updateFormData }: VendorSelectionStepProps) {
  const [selectedVendorType, setSelectedVendorType] = useState("")
  const [selectedVendorId, setSelectedVendorId] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [allVendors, setAllVendors] = useState<any[]>([])
  const [previewVendor, setPreviewVendor] = useState<Vendor | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewVendorDetail, setPreviewVendorDetail] = useState<Vendor | null>(null)

  useEffect(() => {
    const load = async () => {
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

  const [checkingAvailability, setCheckingAvailability] = useState(false)

  const vendorTypeOptions = Object.values(VENDOR_TYPES)
  const filteredVendors = allVendors

  const addVendor = async () => {
    if (!selectedVendorId || formData.selectedVendors.includes(selectedVendorId)) return

    // Check availability if date & time are selected
    if (formData.bookingDate && formData.timeSlot) {
      setCheckingAvailability(true)
      try {
        const result = await VendorAPI.checkDateAvailability(
          [Number(selectedVendorId)],
          typeof formData.bookingDate === 'string' ? formData.bookingDate : new Date(formData.bookingDate).toISOString(),
          formData.timeSlot
        )
        if (!result.available && result.conflicts.length > 0) {
          const names = result.conflicts.map(c => c.businessName).join(', ')
          const altSlots = result.alternativeSlots?.availableSlots || []
          toast({
            title: "Vendor Unavailable",
            description: `${names} is already booked at this time.${altSlots.length > 0 ? ` Available slots: ${altSlots.join(', ')}` : ' No alternative slots available.'}`,
            variant: "destructive",
          })
          setCheckingAvailability(false)
          return
        }
      } catch {
        // Silently proceed if check fails
      }
      setCheckingAvailability(false)
    }

    updateFormData({
      selectedVendors: [...formData.selectedVendors, selectedVendorId],
    })
    setSelectedVendorType("")
    setSelectedVendorId("")
  }

  const removeVendor = (vendorId: string | number) => {
    updateFormData({
      selectedVendors: formData.selectedVendors.filter((id) => String(id) !== String(vendorId)),
      selectedVendorPackages: [],
    })
  }

  const getVendorById = (id: string) => allVendors.find((vendor) => vendor.id == id)

  const searchFilteredVendors = formData.selectedVendors
    .map((id) => getVendorById(id))
    .filter(
      (vendor) =>
        vendor &&
        (vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.type.toLowerCase().includes(searchQuery.toLowerCase())),
    )

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-heading text-2xl font-bold text-neutral-900 sm:text-3xl">Additional Vendors</h2>
        <p className="mt-2 text-neutral-500 text-sm">Enhance your event with services from other vendors</p>
      </div>

      <div className="rounded-xl bg-gradient-to-r from-purple-50/60 via-white to-gold-50/40 p-4 border border-purple-100/40 flex items-start gap-3">
        <Star className="w-4 h-4 mt-0.5 text-gold-500 flex-shrink-0" />
        <p className="text-sm text-neutral-500">
          <strong className="text-neutral-700">Optional:</strong> Select additional vendors to complement your venue. Choose their packages in the next step.
        </p>
      </div>

      {/* Add Vendors Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider">Add Vendors</h3>

        <div className="rounded-xl border border-neutral-200/80 bg-white/60 backdrop-blur-sm p-4">
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
            <div className="flex-1 space-y-1">
              <Label htmlFor="vendor-type" className="text-xs text-neutral-500">Vendor Type</Label>
              <Select value={selectedVendorType || 'all'} onValueChange={setSelectedVendorType}>
                <SelectTrigger id="vendor-type" className="rounded-xl border-neutral-200 bg-white/80 h-10">
                  <SelectValue placeholder="Select vendor type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All vendor types</SelectItem>
                  {vendorTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-1">
              <Label htmlFor="vendor" className="text-xs text-neutral-500">Vendor</Label>
              <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                <SelectTrigger id="vendor" className="rounded-xl border-neutral-200 bg-white/80 h-10">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {filteredVendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={String(vendor.id)}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{vendor.name} (Rs. {vendor.minimumPrice || vendor.price || 0})</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewVendor(vendor); setPreviewOpen(true) }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={addVendor}
                disabled={!selectedVendorId || checkingAvailability}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  !selectedVendorId || checkingAvailability
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40'
                }`}
              >
                {checkingAvailability ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {checkingAvailability ? 'Checking...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Vendors */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider">Selected Vendors</h3>
          {formData.selectedVendors.length > 0 && (
            <div className="relative w-44">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-sm h-9 rounded-xl border-neutral-200 bg-white/80"
              />
            </div>
          )}
        </div>

        {formData.selectedVendors.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-neutral-200 p-6 text-center">
            <p className="text-neutral-400 text-sm">No vendors selected yet</p>
            <p className="mt-1 text-xs text-neutral-300">Add vendors from the selection above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(searchQuery ? searchFilteredVendors : formData.selectedVendors.map((id) => getVendorById(id))).map((vendor) => {
              if (!vendor) return null
              return (
                <motion.div
                  key={vendor.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between rounded-xl border border-neutral-200/80 bg-white/60 backdrop-blur-sm p-3"
                >
                  <div>
                    <p className="font-medium text-sm text-neutral-800">{vendor.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="bg-purple-50/60 text-purple-600 border-purple-200/60 text-[10px] px-1.5 py-0">
                        {vendor.type}
                      </Badge>
                      <span className="text-xs text-neutral-400">Rs. {vendor.minimumPrice || vendor.price || 0}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVendor(vendor.id)}
                    className="h-7 w-7 rounded-full p-0 text-neutral-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Inline Vendor Preview */}
      {previewVendorDetail && (
        <Card className="border border-neutral-200/80 shadow-md rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50/50 via-white to-gold-50/30 py-3 px-5">
            <CardTitle className="flex items-center justify-between gap-2 text-base">
              <span className="truncate">{previewVendorDetail.name}</span>
              <Badge variant="outline" className="bg-purple-50/60 text-purple-600 border-purple-200/60 text-xs">
                {previewVendorDetail.type || (previewVendorDetail as any).subBusinessType}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="col-span-1">
                <div className="relative w-full h-36 overflow-hidden rounded-xl">
                  <img src={previewVendorDetail.images?.[0] || "/placeholder.jpg"} alt={previewVendorDetail.name} className="h-full w-full object-cover" />
                </div>
              </div>
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {previewVendorDetail.location || previewVendorDetail.city}</span>
                  <span className="flex items-center gap-1 text-gold-600"><Star className="w-3.5 h-3.5 fill-current" /> {previewVendorDetail.rating || 0}</span>
                  <Badge variant="outline" className="text-xs">Rs. {previewVendorDetail.minimumPrice || (previewVendorDetail as any).starterPrice || 0}</Badge>
                </div>
                {previewVendorDetail.description && (
                  <p className="text-sm text-neutral-500 line-clamp-2">{previewVendorDetail.description}</p>
                )}
                {previewVendorDetail.amenities && previewVendorDetail.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {previewVendorDetail.amenities.slice(0, 6).map((a, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] bg-neutral-50 text-neutral-500 border-neutral-200/60">{a}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {(previewVendorDetail as any).packages && (previewVendorDetail as any).packages.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Packages</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(previewVendorDetail as any).packages.map((pkg: any) => (
                    <div key={pkg.id} className="rounded-lg border border-neutral-100 p-3 bg-neutral-50/50">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-neutral-700">{pkg.name}</span>
                        <span className="text-sm font-semibold text-purple-600">Rs. {pkg.price?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setPreviewVendorDetail(null)} className="rounded-xl text-sm h-9">
                Close
              </Button>
              <button
                onClick={() => {
                  if (previewVendorDetail) {
                    const vType = (previewVendorDetail.type || (previewVendorDetail as any).subBusinessType || '').toString()
                    setSelectedVendorType(vType || 'all')
                    setSelectedVendorId(String(previewVendorDetail.id))
                    updateFormData({
                      selectedVendors: Array.from(new Set([...formData.selectedVendors, String(previewVendorDetail.id)])),
                    })
                  }
                }}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-500/25 transition-all duration-300"
              >
                Use this vendor
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vendor Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{previewVendor?.name}</DialogTitle>
            <DialogDescription>{previewVendor?.type || previewVendor?.subBusinessType}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative w-full h-44 overflow-hidden rounded-xl">
              <img src={previewVendor?.images?.[0] || "/placeholder.jpg"} alt={previewVendor?.name || ''} className="h-full w-full object-cover" />
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-600">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {previewVendor?.location || previewVendor?.city}</span>
              <span className="flex items-center gap-1 text-gold-600"><Star className="w-3.5 h-3.5 fill-current" /> {previewVendor?.rating || 0}</span>
              <Badge variant="outline" className="text-xs">Rs. {previewVendor?.minimumPrice || previewVendor?.price || 0}</Badge>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewOpen(false)} className="rounded-xl text-sm">Close</Button>
              <button
                onClick={() => { if (previewVendor) { setSelectedVendorId(String(previewVendor.id)); setPreviewOpen(false) } }}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25 transition-all duration-300"
              >
                Select
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
