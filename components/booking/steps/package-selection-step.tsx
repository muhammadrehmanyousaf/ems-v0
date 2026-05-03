"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Package, Clock, ChevronDown, ChevronUp, Car } from "lucide-react"
import type { BookingFormData, EventVenue, Vendor } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"

const BACKEND_STATIC = process.env.NEXT_PUBLIC_BACKEND_URL || ""
function resolveImg(src: string) {
  if (!src) return ""
  if (src.startsWith("http")) return src
  return `${BACKEND_STATIC}${src.startsWith("/") ? "" : "/"}${src}`
}

function safeStr(v: any): string {
  if (v === null || v === undefined) return ""
  if (typeof v === "object") {
    if (v.carName && v.quantity) return `${v.carName} ×${v.quantity}`
    return Object.values(v).filter(Boolean).join(" · ")
  }
  return String(v)
}

function getFlatFeatures(features: any): string[] {
  if (!features) return []
  if (Array.isArray(features)) return features.map(safeStr).filter(Boolean)
  if (typeof features === "object") {
    return Object.values(features as Record<string, any[]>).flat().map(safeStr).filter(Boolean)
  }
  return []
}

function getGroupedFeatures(features: any): { label: string; items: string[] }[] {
  if (!features || Array.isArray(features)) return []
  return Object.entries(features as Record<string, any[]>)
    .filter(([, vals]) => Array.isArray(vals) && vals.length > 0)
    .map(([key, vals]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1"),
      items: vals.map(safeStr).filter(Boolean),
    }))
}

interface PackageSelectionStepProps {
  formData: BookingFormData
  updateFormData: (data: Partial<BookingFormData>) => void
  venue: EventVenue | null
  vendorDetails?: Vendor[]
}

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function PackageSelectionStep({ formData, updateFormData, venue, vendorDetails }: PackageSelectionStepProps) {
  const [selectedPackageId, setSelectedPackageId] = useState(formData.selectedPackage)
  const [selectedVendorPackages, setSelectedVendorPackages] = useState<string[]>(formData.selectedVendorPackages || [])
  const [expandedPackages, setExpandedPackages] = useState<Set<string>>(new Set())
  const [vehicleQty, setVehicleQty] = useState<number>(formData.vehicleQuantity || 1)

  const toggleExpand = (pkgId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setExpandedPackages(prev => {
      const next = new Set(prev)
      next.has(pkgId) ? next.delete(pkgId) : next.add(pkgId)
      return next
    })
  }

  const isVenueBooking = !!venue && Array.isArray((venue as any)?.menus) && ((venue as any)?.menus?.length ?? 0) > 0
  const isCarRental = venue?.vendor?.vendorType === "Car rental"
  const isBridalWear = venue?.vendor?.vendorType === "Bridal wearing"
  const isWeddingStationery = venue?.vendor?.vendorType === "Wedding Invitations and Stationery"

  const venuePackages = venue?.packages || []
  const vendorPackages = vendorDetails?.flatMap(vendor => vendor.packages || []) || []

  const calculateTotalPrice = () => {
    let total = 0
    if (selectedPackageId) {
      const pkg = venuePackages.find(p => String(p.id) === String(selectedPackageId))
      const qty = isCarRental ? vehicleQty : 1
      total += (Number(pkg?.price) || 0) * qty
    }
    // Add vendor/service package prices
    // For car rental: service packages live in venuePackages; for venue bookings: in vendorPackages
    const vendorIdsWithPackages = new Set<string>()
    selectedVendorPackages.forEach(pkgId => {
      const pkg =
        vendorPackages.find(p => String(p.id) === String(pkgId)) ||
        venuePackages.find(p => String(p.id) === String(pkgId))
      total += Number(pkg?.price) || 0
      // Track which vendors have packages selected
      const ownerVendor = vendorDetails?.find(v => v.packages?.some(p => String(p.id) === String(pkgId)))
      if (ownerVendor) vendorIdsWithPackages.add(String(ownerVendor.id))
    })
    // Add base price for selected vendors WITHOUT a package
    if (isVenueBooking && formData.selectedVendors) {
      formData.selectedVendors.forEach((vendorId: any) => {
        if (vendorIdsWithPackages.has(String(vendorId))) return
        const detail = vendorDetails?.find(v => String(v.id) === String(vendorId))
        if (detail) total += Number((detail as any).minimumPrice || (detail as any).price || 0)
      })
    }
    return total
  }

  useEffect(() => {
    updateFormData({ totalPrice: calculateTotalPrice() })
  }, [selectedPackageId, selectedVendorPackages, vehicleQty])

  const handlePackageSelect = (packageId: string) => {
    const next = selectedPackageId === packageId ? "" : packageId
    setSelectedPackageId(next)
    setVehicleQty(1)
    updateFormData({ selectedPackage: next, vehicleQuantity: 1 })
  }

  const handleVehicleQtyChange = (delta: number, maxUnits: number) => {
    setVehicleQty(prev => {
      const next = Math.min(Math.max(1, prev + delta), maxUnits)
      updateFormData({ vehicleQuantity: next })
      return next
    })
  }

  const handleVendorPackageToggle = (packageId: string) => {
    const newSelected = selectedVendorPackages.includes(packageId)
      ? selectedVendorPackages.filter(id => id !== packageId)
      : [...selectedVendorPackages, packageId]
    setSelectedVendorPackages(newSelected)
    updateFormData({ selectedVendorPackages: newSelected })
  }

  const getVendorForPackage = (packageId: string) => {
    return vendorDetails?.find(v => v.packages?.some(p => String(p.id) === String(packageId)))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display italic text-[24px] sm:text-[28px] text-bridal-charcoal leading-tight">
          {isCarRental
            ? 'Cars & Packages'
            : isBridalWear
              ? 'Choose Your Outfit'
              : isWeddingStationery
                ? 'Choose a Product'
                : !isVenueBooking
                  ? 'Choose Your Package'
                  : 'Select Packages'}
        </h2>
        <p className="mt-1.5 text-[13.5px] text-bridal-text-soft">
          {isCarRental
            ? 'Select a vehicle, and optionally add a service package'
            : isBridalWear
              ? 'Browse available outfits and select the one that suits your occasion'
              : isWeddingStationery
                ? 'Choose a stationery product for your event'
                : !isVenueBooking
                  ? 'Pick the package that fits your event'
                  : 'Choose packages for your venue and vendors'}
        </p>
      </div>

      {/* Car Rental — split into Vehicles + Service Packages */}
      {isCarRental && (() => {
        const carPkgs = venuePackages.filter(pkg => {
          const f = !Array.isArray(pkg.features) ? (pkg.features as Record<string, string[]>) : {}
          return !!f.vehicleType?.[0]
        })
        const servicePkgs = venuePackages.filter(pkg => {
          const f = !Array.isArray(pkg.features) ? (pkg.features as Record<string, string[]>) : {}
          return !f.vehicleType?.[0]
        })
        return (
          <div className="space-y-6">
            {/* Vehicles */}
            <div className="space-y-3">
              {carPkgs.length > 0 && (
                <p className="font-bridal text-[10.5px] uppercase tracking-[0.32em] font-medium text-bridal-gold-dark">Select a Vehicle</p>
              )}
              <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" variants={container} initial="hidden" animate="visible">
                {carPkgs.length > 0 ? carPkgs.map((pkg) => {
                  const isSelected = selectedPackageId === String(pkg.id)
                  const imgs = (pkg.images ?? []).map(resolveImg)
                  const f = !Array.isArray(pkg.features) ? (pkg.features as Record<string, string[]>) : {}
                  const vehicleType = f.vehicleType?.[0]
                  const year = f.year?.[0]
                  const color = f.color?.[0]
                  const seats = f.seatingCapacity?.[0]
                  const units = f.unitsAvailable?.[0]
                  const withDriver = f.driver?.[0] === "Yes"
                  const hasAC = f.ac?.[0] === "Yes"
                  const hasDecor = f.decoration?.[0] === "Available"
                  return (
                    <motion.div
                      key={pkg.id}
                      variants={item}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handlePackageSelect(String(pkg.id))}
                      className={`relative cursor-pointer rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
                        isSelected
                          ? 'border-bridal-gold-dark bg-bridal-cream shadow-[0_14px_32px_-18px_rgba(176,125,84,0.5)] ring-1 ring-bridal-gold/40'
                          : 'border-bridal-beige bg-bridal-ivory hover:border-bridal-gold/55 hover:bg-bridal-cream'
                      }`}
                    >
                      <div className="relative aspect-video bg-bridal-ivory">
                        {imgs.length > 0 ? (
                          <Image src={imgs[0]} alt={pkg.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-blue-50">
                            <Car className="w-12 h-12 text-blue-200" />
                          </div>
                        )}
                        {vehicleType && (
                          <span className="absolute top-2 left-2 bg-bridal-gold/95 text-bridal-charcoal font-bridal text-[10px] uppercase tracking-[0.22em] font-medium px-2.5 py-1 rounded-full">
                            {vehicleType}
                          </span>
                        )}
                        {isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-bridal-gold border border-bridal-gold-dark flex items-center justify-center shadow-[0_4px_12px_-6px_rgba(176,125,84,0.55)]">
                            <Check className="w-3.5 h-3.5 text-bridal-charcoal" strokeWidth={3} />
                          </motion.div>
                        )}
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-display italic text-[18px] text-bridal-charcoal">{pkg.name}</h4>
                            {(year || color) && (
                              <p className="font-bridal text-[11.5px] text-bridal-text-soft mt-1">{[year, color].filter(Boolean).join(" · ")}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-display italic text-[22px] text-bridal-gold-dark">Rs. {Number(pkg.price)?.toLocaleString()}</p>
                            <p className="font-bridal text-[10px] uppercase tracking-[0.2em] text-bridal-text-soft">per event</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {seats && (
                            <span className="inline-flex items-center gap-1 bg-bridal-ivory text-bridal-charcoal/85 text-xs px-2 py-0.5 rounded-full border border-bridal-beige">
                              {seats} seats
                            </span>
                          )}
                          {units && (
                            <span className="inline-flex items-center gap-1 bg-bridal-sage/20 text-[#3F6B43] text-xs px-2 py-0.5 rounded-full border border-bridal-sage/45">
                              {units} available
                            </span>
                          )}
                        </div>
                        {(withDriver || hasAC || hasDecor) && (
                          <div className="flex flex-wrap gap-1 pt-1 border-t border-bridal-beige/70">
                            {withDriver && <span className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">With Driver</span>}
                            {hasAC && <span className="text-[11px] bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-full">AC</span>}
                            {hasDecor && <span className="text-[11px] bg-pink-50 text-pink-700 border border-pink-100 px-2 py-0.5 rounded-full">Decoration</span>}
                          </div>
                        )}

                        {/* Quantity stepper — shown only when this vehicle is selected */}
                        {isSelected && (() => {
                          const maxUnits = units ? parseInt(units) : 99
                          return (
                            <div
                              onClick={e => e.stopPropagation()}
                              className="flex items-center justify-between pt-3 border-t border-bridal-gold/45"
                            >
                              <span className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">How many units?</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleVehicleQtyChange(-1, maxUnits)}
                                  disabled={vehicleQty <= 1}
                                  className="w-8 h-8 rounded-full border border-bridal-beige bg-bridal-cream inline-flex items-center justify-center hover:border-bridal-gold/55 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-display italic text-[14px] text-bridal-charcoal"
                                >
                                  −
                                </button>
                                <span className="w-6 text-center font-display italic text-[16px] text-bridal-charcoal">{vehicleQty}</span>
                                <button
                                  type="button"
                                  onClick={() => handleVehicleQtyChange(+1, maxUnits)}
                                  disabled={vehicleQty >= maxUnits}
                                  className="w-8 h-8 rounded-full border border-bridal-beige bg-bridal-cream inline-flex items-center justify-center hover:border-bridal-gold/55 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-display italic text-[14px] text-bridal-charcoal"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </motion.div>
                  )
                }) : (
                  <div className="col-span-2 rounded-md border border-dashed border-bridal-beige bg-bridal-cream p-10 text-center">
                    <Car className="h-8 w-8 mx-auto mb-2 text-bridal-text-soft/70" />
                    <p className="font-bridal text-[13px] text-bridal-text-soft">No vehicles listed yet. Contact the vendor.</p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Service Packages (Barat, etc.) — separate section */}
            {servicePkgs.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-bridal text-[10.5px] uppercase tracking-[0.32em] font-medium text-bridal-gold-dark">Service Packages</p>
                  <Badge variant="outline" className="font-bridal text-[12px] text-bridal-text-soft">Optional</Badge>
                </div>
                <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-3" variants={container} initial="hidden" animate="visible">
                  {servicePkgs.map((pkg) => {
                    const isSelected = selectedVendorPackages.includes(String(pkg.id))
                    const flat = getFlatFeatures(pkg.features)
                    return (
                      <motion.div
                        key={pkg.id}
                        variants={item}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleVendorPackageToggle(String(pkg.id))}
                        className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                          isSelected
                            ? 'border-bridal-sage bg-bridal-sage/15 shadow-[0_14px_32px_-18px_rgba(63,107,67,0.4)]'
                            : 'border-bridal-beige bg-bridal-ivory hover:border-bridal-gold/55 hover:bg-bridal-cream'
                        }`}
                      >
                        {isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-bridal-sage border border-[#3F6B43] flex items-center justify-center">
                            <Check className="w-3 h-3 text-bridal-charcoal" strokeWidth={3} />
                          </motion.div>
                        )}
                        <div className="flex items-start justify-between gap-2 pr-6">
                          <h4 className="font-display italic text-[16px] text-bridal-charcoal">{pkg.name}</h4>
                          <p className="font-display italic text-[18px] text-bridal-gold-dark shrink-0">Rs. {Number(pkg.price)?.toLocaleString()}</p>
                        </div>
                        {pkg.description && (
                          <p className="font-bridal text-[12.5px] text-bridal-text-soft mt-2 leading-relaxed">{pkg.description}</p>
                        )}
                        {flat.length > 0 && (
                          <ul className="mt-2 space-y-1 pt-2 border-t border-bridal-beige/70">
                            {flat.slice(0, 3).map((f, i) => (
                              <li key={i} className="flex items-center gap-1.5 font-bridal text-[12px] text-bridal-text-soft">
                                <Check className="h-3 w-3 text-bridal-gold flex-shrink-0" />{f}
                              </li>
                            ))}
                            {flat.length > 3 && <li className="font-bridal text-[11.5px] text-bridal-text-soft pl-4">+{flat.length - 3} more</li>}
                          </ul>
                        )}
                      </motion.div>
                    )
                  })}
                </motion.div>
              </div>
            )}
          </div>
        )
      })()}

      {/* Main Packages (non-car-rental) */}
      {!isCarRental && venuePackages.length > 0 && (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-3" variants={container} initial="hidden" animate="visible">
          {venuePackages.map((pkg, idx) => {
            const isSelected = selectedPackageId === String(pkg.id)
            const imgs = (pkg as any).images?.map(resolveImg).filter(Boolean) ?? []
            return (
              <motion.div
                key={pkg.id}
                variants={item}
                whileTap={{ scale: 0.98 }}
                className={`relative cursor-pointer rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                  isSelected
                    ? 'border-bridal-gold-dark bg-bridal-cream shadow-[0_14px_32px_-18px_rgba(176,125,84,0.5)]'
                    : 'border-bridal-beige bg-bridal-ivory hover:border-bridal-gold/55 hover:bg-bridal-cream'
                }`}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return
                  handlePackageSelect(String(pkg.id))
                }}
              >
                {/* Outfit / product image for bridal wear & stationery */}
                {(isBridalWear || isWeddingStationery) && imgs.length > 0 && (
                  <div className="relative aspect-video bg-bridal-ivory">
                    <Image src={imgs[0]} alt={pkg.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                    {isSelected && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-bridal-gold border border-bridal-gold-dark flex items-center justify-center shadow-[0_4px_12px_-6px_rgba(176,125,84,0.55)]">
                        <Check className="w-3.5 h-3.5 text-bridal-charcoal" strokeWidth={3} />
                      </motion.div>
                    )}
                  </div>
                )}
                <div className="p-5 space-y-3">
                {/* Selected check */}
                {isSelected && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3 w-7 h-7 rounded-full bg-bridal-gold border border-bridal-gold-dark flex items-center justify-center shadow-[0_4px_10px_-4px_rgba(176,125,84,0.45)] z-10">
                    <Check className="w-3.5 h-3.5 text-bridal-charcoal" strokeWidth={3} />
                  </motion.div>
                )}

                  <div className="flex items-start justify-between gap-3 pr-9">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display italic text-[18px] text-bridal-charcoal leading-tight">{pkg.name}</h4>
                        {/* Inline "Popular" pill — replaces the floating badge that
                            was clipping at the top of the card. */}
                        {!isBridalWear && !isWeddingStationery && idx === 1 && venuePackages.length > 1 && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] font-semibold bg-bridal-gold/95 text-bridal-charcoal rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      {pkg.duration && (
                        <div className="flex items-center gap-1 mt-1 font-bridal text-[11.5px] text-bridal-text-soft">
                          <Clock className="h-3 w-3" /> {pkg.duration}
                        </div>
                      )}
                    </div>
                    <p className="font-display italic text-[22px] sm:text-[24px] text-bridal-gold-dark shrink-0 leading-tight">
                      Rs. {Number(pkg.price)?.toLocaleString()}
                    </p>
                  </div>

                  {pkg.description && (
                    <p className="font-bridal text-[12.5px] text-bridal-text-soft leading-relaxed">{pkg.description}</p>
                  )}

                  {(() => {
                    const flat = getFlatFeatures(pkg.features)
                    const grouped = getGroupedFeatures(pkg.features)
                    const isExpanded = expandedPackages.has(String(pkg.id))
                    const PREVIEW = 3

                    if (flat.length === 0) return null
                    return (
                      <div className="pt-2 border-t border-bridal-beige/70 space-y-2">
                        {grouped.length > 0 ? (
                          <>
                            {grouped.slice(0, isExpanded ? grouped.length : 2).map((g, gi) => (
                              <div key={gi}>
                                <p className="font-bridal text-[10px] uppercase tracking-[0.25em] font-medium text-bridal-text-label mb-1">{g.label}</p>
                                <div className="flex flex-wrap gap-1">
                                  {g.items.map((item, ii) => (
                                    <span key={ii} className="inline-flex items-center gap-0.5 text-[11px] bg-bridal-cream text-bridal-gold-dark px-2 py-0.5 rounded-full border border-bridal-gold/45 font-bridal">
                                      <Check className="w-2.5 h-2.5 shrink-0" />{item}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </>
                        ) : (
                          <ul className="space-y-1">
                            {flat.slice(0, isExpanded ? flat.length : PREVIEW).map((f, i) => (
                              <li key={i} className="flex items-start gap-1.5 font-bridal text-[12.5px] text-bridal-charcoal/85">
                                <Check className="h-3 w-3 text-bridal-gold mt-0.5 shrink-0" />{f}
                              </li>
                            ))}
                          </ul>
                        )}
                        {(grouped.length > 2 || flat.length > PREVIEW) && (
                          <button
                            type="button"
                            onClick={(e) => toggleExpand(String(pkg.id), e)}
                            className="flex items-center gap-1 font-bridal text-[11px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark hover:text-bridal-mauve mt-2"
                          >
                            {isExpanded ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />+{grouped.length > 2 ? grouped.length - 2 : flat.length - PREVIEW} more</>}
                          </button>
                        )}
                      </div>
                    )
                  })()}

                  {/* Quantity stepper for bridal wear and stationery */}
                  {(isBridalWear || isWeddingStationery) && isSelected && (
                    <div
                      onClick={e => e.stopPropagation()}
                      className="flex items-center justify-between pt-3 border-t border-bridal-gold/45"
                    >
                      <span className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">
                        {isBridalWear ? 'How many outfits?' : 'Quantity (sets)'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleVehicleQtyChange(-1, 99)}
                          disabled={vehicleQty <= 1}
                          className="w-8 h-8 rounded-full border border-bridal-beige bg-bridal-cream inline-flex items-center justify-center hover:border-bridal-gold/55 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-display italic text-[14px] text-bridal-charcoal"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-display italic text-[16px] text-bridal-charcoal">{vehicleQty}</span>
                        <button
                          type="button"
                          onClick={() => handleVehicleQtyChange(+1, 99)}
                          disabled={vehicleQty >= 99}
                          className="w-8 h-8 rounded-full border border-bridal-beige bg-bridal-cream inline-flex items-center justify-center hover:border-bridal-gold/55 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-display italic text-[14px] text-bridal-charcoal"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Empty state */}
      {venuePackages.length === 0 && (
        <div className="rounded-md border border-dashed border-bridal-beige bg-bridal-cream p-10 text-center">
          <Package className="h-8 w-8 mx-auto mb-2 text-bridal-text-soft/70" />
          <p className="font-bridal text-[13px] text-bridal-text-soft mb-1">
            {isBridalWear ? 'No outfits listed yet' : isWeddingStationery ? 'No products listed yet' : 'No packages available'}
          </p>
          <p className="font-bridal text-[11.5px] text-bridal-text-soft mb-4">
            {isBridalWear ? 'Contact the shop for available outfits.' : isWeddingStationery ? 'Contact the vendor for available products.' : `Contact the ${!isVenueBooking ? 'vendor' : 'venue'} for pricing.`}
          </p>
          <Button variant="outline" size="sm" onClick={() => updateFormData({ selectedPackage: 'default' })}>
            Continue Without {isBridalWear ? 'Outfit' : isWeddingStationery ? 'Product' : 'Package'}
          </Button>
        </div>
      )}

      {/* Vendor Add-on Packages */}
      {isVenueBooking && vendorPackages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display italic text-[18px] text-bridal-charcoal">Vendor Add-ons</h3>
            <Badge variant="outline" className="font-bridal text-[12px] text-bridal-text-soft">Optional</Badge>
          </div>
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-3" variants={container} initial="hidden" animate="visible">
            {vendorPackages.map((pkg) => {
              const vendor = getVendorForPackage(String(pkg.id))
              const isSelected = selectedVendorPackages.includes(String(pkg.id))
              return (
                <motion.div
                  key={pkg.id}
                  variants={item}
                  whileTap={{ scale: 0.98 }}
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                    isSelected
                      ? 'border-green-500 bg-green-50/50'
                      : 'border-bridal-beige bg-bridal-ivory hover:border-bridal-gold/55 hover:bg-bridal-cream'
                  }`}
                  onClick={() => handleVendorPackageToggle(String(pkg.id))}
                >
                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-bridal-sage border border-[#3F6B43] flex items-center justify-center">
                      <Check className="w-3 h-3 text-bridal-charcoal" strokeWidth={3} />
                    </motion.div>
                  )}
                  <div className="flex items-start justify-between gap-2 pr-6">
                    <div>
                      <h4 className="font-display italic text-[16px] text-bridal-charcoal">{pkg.name}</h4>
                      {vendor && <p className="font-bridal text-[11.5px] text-bridal-text-soft mt-1">by {vendor.name}</p>}
                    </div>
                    <p className="font-display italic text-[20px] text-[#3F6B43] shrink-0">Rs. {Number(pkg.price)?.toLocaleString()}</p>
                  </div>
                  {(() => {
                    const flat = getFlatFeatures(pkg.features)
                    if (flat.length === 0) return null
                    return (
                      <ul className="mt-2 space-y-1 pt-2 border-t border-bridal-beige/70">
                        {flat.slice(0, 3).map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5 font-bridal text-[12px] text-bridal-text-soft">
                            <Check className="h-3 w-3 text-bridal-gold flex-shrink-0" />{f}
                          </li>
                        ))}
                        {flat.length > 3 && <li className="font-bridal text-[11.5px] text-bridal-text-soft pl-4">+{flat.length - 3} more included</li>}
                      </ul>
                    )
                  })()}
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      )}

      {/* Total */}
      <div className="rounded-md bg-bridal-cream border border-bridal-gold/45 p-5 shadow-[0_8px_24px_-20px_rgba(176,125,84,0.45)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bridal text-[10.5px] uppercase tracking-[0.25em] font-medium text-bridal-text-label">Total</p>
            <p className="font-bridal text-[11.5px] text-bridal-text-soft">
              {isCarRental
                ? selectedPackageId ? `${vehicleQty} vehicle${vehicleQty > 1 ? 's' : ''} selected` : 'No vehicle selected'
                : isBridalWear
                  ? selectedPackageId ? `${vehicleQty} outfit${vehicleQty > 1 ? 's' : ''} selected` : 'No outfit selected'
                  : isWeddingStationery
                    ? selectedPackageId ? `${vehicleQty} set${vehicleQty > 1 ? 's' : ''} selected` : 'No product selected'
                    : selectedPackageId ? '1 package' : 'No package'
              }
              {selectedVendorPackages.length > 0 && ` + ${selectedVendorPackages.length} service package(s)`}
              {isVenueBooking && formData.selectedVendors && (() => {
                const vendorIdsWithPkgs = new Set(selectedVendorPackages.map(pkgId => {
                  const v = vendorDetails?.find(v => v.packages?.some(p => String(p.id) === String(pkgId)))
                  return v ? String(v.id) : null
                }).filter(Boolean))
                const vendorsWithoutPkgs = formData.selectedVendors.filter((id: any) => !vendorIdsWithPkgs.has(String(id)))
                return vendorsWithoutPkgs.length > 0 ? ` + ${vendorsWithoutPkgs.length} vendor(s)` : ''
              })()}
            </p>
          </div>
          <p className="font-display italic text-[28px] text-bridal-gold-dark">Rs. {calculateTotalPrice().toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
