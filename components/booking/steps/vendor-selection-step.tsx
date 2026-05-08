"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
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
        <h2 className="font-display italic text-[28px] sm:text-[32px] text-bridal-charcoal leading-tight">Additional Vendors</h2>
        <p className="mt-2 font-bridal text-[14px] text-bridal-text-soft">Enhance your event with services from other vendors</p>
      </div>

      <div className="rounded-md bg-bridal-cream p-4 border border-bridal-gold/45 flex items-start gap-3 shadow-[0_8px_24px_-20px_rgba(176,125,84,0.4)]">
        <Star className="w-4 h-4 mt-0.5 text-bridal-gold flex-shrink-0" />
        <p className="font-bridal text-[13px] text-bridal-charcoal/85">
          <strong className="font-display italic text-bridal-gold-dark not-italic mr-1">Optional</strong>
          — select additional vendors to complement your venue. Choose their packages in the next step.
        </p>
      </div>

      {/* Add Vendors Section */}
      <div className="space-y-4">
        <h3 className="font-bridal text-[10.5px] uppercase tracking-[0.32em] font-medium text-bridal-gold-dark">Add Vendors</h3>

        <div className="rounded-md border border-bridal-beige bg-bridal-ivory p-5">
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
            <div className="flex-1 space-y-1">
              <Label htmlFor="vendor-type" className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">Vendor Type</Label>
              <Select value={selectedVendorType || 'all'} onValueChange={setSelectedVendorType}>
                <SelectTrigger id="vendor-type" className="rounded-[4px] border-bridal-beige bg-bridal-cream h-11 font-bridal text-bridal-charcoal focus:ring-bridal-gold focus:ring-1">
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
              <Label htmlFor="vendor" className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">Vendor</Label>
              <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                <SelectTrigger id="vendor" className="rounded-[4px] border-bridal-beige bg-bridal-cream h-11 font-bridal text-bridal-charcoal focus:ring-bridal-gold focus:ring-1">
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
                className={`w-full sm:w-auto h-11 px-6 rounded-[4px] font-bridal text-[12px] uppercase tracking-[0.22em] font-medium transition-all duration-300 inline-flex items-center justify-center gap-2 ${
                  !selectedVendorId || checkingAvailability
                    ? 'bg-bridal-gold/40 text-bridal-charcoal/60 cursor-not-allowed'
                    : 'bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] hover:shadow-[0_14px_30px_-12px_rgba(176,125,84,0.7)]'
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
          <h3 className="font-bridal text-[10.5px] uppercase tracking-[0.32em] font-medium text-bridal-gold-dark">Selected Vendors</h3>
          {formData.selectedVendors.length > 0 && (
            <div className="relative w-44">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-bridal-gold" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 font-bridal text-[13px] h-10 rounded-[4px] border-bridal-beige bg-bridal-cream text-bridal-charcoal placeholder:text-bridal-text-soft focus-visible:border-bridal-gold/55 focus-visible:ring-1 focus-visible:ring-bridal-gold"
              />
            </div>
          )}
        </div>

        {formData.selectedVendors.length === 0 ? (
          <div className="rounded-md border border-dashed border-bridal-beige bg-bridal-cream p-8 text-center">
            <p className="font-display italic text-[18px] text-bridal-charcoal">No vendors selected yet</p>
            <p className="mt-1.5 font-bridal text-[12px] text-bridal-text-soft">Add vendors from the selection above</p>
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
                  className="flex items-center justify-between rounded-md border border-bridal-beige bg-bridal-ivory hover:border-bridal-gold/45 p-4 transition-colors"
                >
                  <div>
                    <p className="font-display italic text-[16px] text-bridal-charcoal">{vendor.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="bg-bridal-cream text-bridal-gold-dark border-bridal-gold/45 text-[10px] uppercase tracking-[0.18em] font-bridal font-medium px-2 py-0.5">
                        {vendor.type}
                      </Badge>
                      <span className="font-bridal text-[12px] text-bridal-gold-dark">Rs. {vendor.minimumPrice || vendor.price || 0}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVendor(vendor.id)}
                    className="h-8 w-8 rounded-full p-0 text-bridal-text-soft hover:bg-bridal-coral/15 hover:text-bridal-coral transition-colors"
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
        <Card className="border border-bridal-beige bg-bridal-cream shadow-[0_18px_40px_-32px_rgba(176,125,84,0.35)] rounded-md overflow-hidden">
          <CardHeader className="bg-bridal-ivory border-b border-bridal-beige py-4 px-5">
            <CardTitle className="flex items-center justify-between gap-2 font-display italic text-[18px] text-bridal-charcoal">
              <span className="truncate">{previewVendorDetail.name}</span>
              <Badge variant="outline" className="bg-bridal-cream text-bridal-gold-dark border-bridal-gold/45 font-bridal text-[10.5px] uppercase tracking-[0.2em] font-medium px-2.5 py-0.5">
                {previewVendorDetail.type || (previewVendorDetail as any).subBusinessType}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="col-span-1">
                <div className="relative w-full h-36 overflow-hidden rounded-xl">
                  <Image
                    src={previewVendorDetail.images?.[0] || "/placeholder.jpg"}
                    alt={previewVendorDetail.name}
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <div className="flex flex-wrap items-center gap-3 font-bridal text-[13px] text-bridal-charcoal/85">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {previewVendorDetail.location || previewVendorDetail.city}</span>
                  <span className="flex items-center gap-1 text-bridal-gold-dark"><Star className="w-3.5 h-3.5 fill-bridal-gold text-bridal-gold" /> {previewVendorDetail.rating || 0}</span>
                  <Badge variant="outline" className="text-xs">Rs. {previewVendorDetail.minimumPrice || 0}</Badge>
                </div>
                {previewVendorDetail.description && (
                  <p className="font-bridal text-[12.5px] text-bridal-text-soft line-clamp-2 leading-relaxed">{previewVendorDetail.description}</p>
                )}
                {previewVendorDetail.amenities && previewVendorDetail.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {previewVendorDetail.amenities.slice(0, 6).map((a, i) => (
                      <Badge key={i} variant="outline" className="text-[10.5px] uppercase tracking-[0.18em] font-bridal font-medium bg-bridal-ivory text-bridal-charcoal/85 border-bridal-beige px-2 py-0.5">{a}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {(previewVendorDetail as any).packages && (previewVendorDetail as any).packages.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bridal text-[10.5px] uppercase tracking-[0.32em] font-medium text-bridal-gold-dark">Packages</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {(previewVendorDetail as any).packages.map((pkg: any) => (
                    <div key={pkg.id} className="rounded-md border border-bridal-beige p-3 bg-bridal-ivory">
                      <div className="flex items-center justify-between">
                        <span className="font-display italic text-[15px] text-bridal-charcoal">{pkg.name}</span>
                        <span className="font-display italic text-[16px] text-bridal-gold-dark">Rs. {pkg.price?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPreviewVendorDetail(null)}
                className="inline-flex items-center justify-center h-10 px-5 rounded-[4px] border border-bridal-beige bg-bridal-cream hover:border-bridal-gold/55 hover:text-bridal-gold-dark text-bridal-charcoal font-bridal text-[11.5px] uppercase tracking-[0.22em] font-medium transition-colors"
              >
                Close
              </button>
              <button
                type="button"
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
                className="inline-flex items-center justify-center h-10 px-6 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[11.5px] uppercase tracking-[0.22em] font-medium shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] transition-all duration-300"
              >
                Use this vendor
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vendor Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="rounded-md bg-bridal-cream border border-bridal-beige">
          <DialogHeader>
            <DialogTitle className="font-display italic text-[22px] text-bridal-charcoal">{previewVendor?.name}</DialogTitle>
            <DialogDescription className="font-bridal text-[12px] uppercase tracking-[0.22em] text-bridal-gold-dark">
              {previewVendor?.type || previewVendor?.subBusinessType}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative w-full h-44 overflow-hidden rounded-md border border-bridal-beige">
              <Image
                src={previewVendor?.images?.[0] || "/placeholder.jpg"}
                alt={previewVendor?.name || ''}
                fill
                sizes="(min-width: 768px) 600px, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 font-bridal text-[13px] text-bridal-charcoal/85">
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-bridal-gold" /> {previewVendor?.location || previewVendor?.city}</span>
              <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-bridal-gold text-bridal-gold" /> <span className="font-display italic text-[15px] text-bridal-charcoal">{previewVendor?.rating || 0}</span></span>
              <span className="font-display italic text-[15px] text-bridal-gold-dark">Rs. {previewVendor?.minimumPrice || previewVendor?.price || 0}</span>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="inline-flex items-center justify-center h-10 px-5 rounded-[4px] border border-bridal-beige bg-bridal-cream hover:border-bridal-gold/55 hover:text-bridal-gold-dark text-bridal-charcoal font-bridal text-[11.5px] uppercase tracking-[0.22em] font-medium transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => { if (previewVendor) { setSelectedVendorId(String(previewVendor.id)); setPreviewOpen(false) } }}
                className="inline-flex items-center justify-center h-10 px-6 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[11.5px] uppercase tracking-[0.22em] font-medium shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] transition-all duration-300"
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
