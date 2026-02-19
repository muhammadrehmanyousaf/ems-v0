"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Package, Clock } from "lucide-react"
import type { BookingFormData, EventVenue, Vendor } from "@/lib/types"
import { motion } from "framer-motion"

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

  const isVenueBooking = !!venue && Array.isArray((venue as any)?.menus) && ((venue as any)?.menus?.length ?? 0) > 0

  const venuePackages = venue?.packages || []
  const vendorPackages = vendorDetails?.flatMap(vendor => vendor.packages || []) || []

  const calculateTotalPrice = () => {
    let total = 0
    if (selectedPackageId) {
      const pkg = venuePackages.find(p => String(p.id) === String(selectedPackageId))
      total += Number(pkg?.price) || 0
    }
    // Add vendor package prices
    const vendorIdsWithPackages = new Set<string>()
    selectedVendorPackages.forEach(pkgId => {
      const pkg = vendorPackages.find(p => String(p.id) === String(pkgId))
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
    return vendorDetails?.find(v => v.packages?.some(p => String(p.id) === String(packageId)))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          {!isVenueBooking ? 'Choose Your Package' : 'Select Packages'}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          {!isVenueBooking ? 'Pick the package that fits your event' : 'Choose packages for your venue and vendors'}
        </p>
      </div>

      {/* Main Packages */}
      {venuePackages.length > 0 ? (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-3" variants={container} initial="hidden" animate="visible">
          {venuePackages.map((pkg, idx) => {
            const isSelected = selectedPackageId === String(pkg.id)
            return (
              <motion.div
                key={pkg.id}
                variants={item}
                whileTap={{ scale: 0.98 }}
                className={`relative cursor-pointer rounded-xl border-2 p-5 transition-all duration-200 ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50/50 shadow-sm'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
                }`}
                onClick={() => handlePackageSelect(String(pkg.id))}
              >
                {idx === 1 && venuePackages.length > 1 && (
                  <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-600 text-white rounded-full">
                    Popular
                  </span>
                )}

                {isSelected && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-3 right-3 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </motion.div>
                )}

                <div className="space-y-3">
                  <div>
                    <h4 className="text-base font-bold text-neutral-900 pr-8">{pkg.name}</h4>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      Rs. {Number(pkg.price)?.toLocaleString()}
                    </p>
                  </div>

                  {pkg.description && (
                    <p className="text-sm text-neutral-500 line-clamp-2">{pkg.description}</p>
                  )}

                  {pkg.features && pkg.features.length > 0 && (
                    <ul className="space-y-1.5 pt-2 border-t border-neutral-100">
                      {pkg.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                          <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}

                  {pkg.duration && (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <Clock className="h-3.5 w-3.5" /> {pkg.duration}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-neutral-200 p-8 text-center">
          <Package className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
          <p className="text-sm text-neutral-500 mb-1">No packages available</p>
          <p className="text-xs text-neutral-400 mb-4">Contact the {!isVenueBooking ? 'vendor' : 'venue'} for pricing.</p>
          <Button variant="outline" size="sm" onClick={() => updateFormData({ selectedPackage: 'default' })}>
            Continue Without Package
          </Button>
        </div>
      )}

      {/* Vendor Add-on Packages */}
      {isVenueBooking && vendorPackages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-700">Vendor Add-ons</h3>
            <Badge variant="outline" className="text-xs text-neutral-500">Optional</Badge>
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
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                  onClick={() => handleVendorPackageToggle(String(pkg.id))}
                >
                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                  <h4 className="text-sm font-bold text-neutral-900 pr-6">{pkg.name}</h4>
                  {vendor && <p className="text-xs text-neutral-400 mt-0.5">by {vendor.name}</p>}
                  <p className="text-lg font-bold text-green-600 mt-1">Rs. {Number(pkg.price)?.toLocaleString()}</p>
                  {pkg.features && pkg.features.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {pkg.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <Check className="h-3 w-3 text-green-500 flex-shrink-0" /> {f}
                        </li>
                      ))}
                      {pkg.features.length > 3 && <li className="text-xs text-neutral-400 pl-5">+{pkg.features.length - 3} more</li>}
                    </ul>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      )}

      {/* Total */}
      <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-700">Total</p>
            <p className="text-xs text-neutral-400">
              {selectedPackageId ? '1 package' : 'No package'}
              {selectedVendorPackages.length > 0 && ` + ${selectedVendorPackages.length} add-on(s)`}
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
          <p className="text-2xl font-bold text-purple-600">Rs. {calculateTotalPrice().toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
