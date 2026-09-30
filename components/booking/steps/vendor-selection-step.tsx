"use client"

/**
 * Vendors step — "Add other vendors?"
 *
 * The shell's StepFrame renders the eyebrow, the title and the subtitle; this
 * step renders only its controls: a search input, a scrollable row of
 * category chips, the vendors already added (when any) and a grid of 88px
 * result rows. A vendor's detail and package picker open in a DeskSheet
 * (right sheet on desk, bottom drawer on phone); this step owns that state.
 *
 * Payload writes are unchanged: `selectedVendors` (ids as strings) and
 * `selectedVendorPackages` (package ids as strings, the same shape the
 * package step toggles). Removing a vendor still clears every vendor package,
 * exactly as before.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import { Plus, X, Search, MapPin, Star, Loader2, Check } from "lucide-react"
import type { BookingFormData, Vendor } from "@/lib/types"
import { VendorAPI } from "@/lib/api/vendors"
import { toast } from "@/components/ui/use-toast"
import { VENDOR_TYPES } from "@/lib/vendor-types"
import { BridalButton } from "@/components/bridal/bridal-button"
import DeskSheet from "@/components/booking/shell/desk-sheet"
import { useBookingShell } from "@/components/booking/shell/booking-shell-context"

interface VendorSelectionStepProps {
  formData: BookingFormData
  updateFormData: (data: Partial<BookingFormData>) => void
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2"

const money = (n: number) => `Rs ${Math.round(Number(n) || 0).toLocaleString("en-PK")}`
const startingPrice = (v: any) => Number(v?.minimumPrice || v?.price || 0)
const vendorTypeOf = (v: any): string => {
  const t = v?.type || v?.subBusinessType
  return Array.isArray(t) ? String(t[0] || "") : String(t || "")
}

/** 48px avatar: the vendor's first image, or their initial on sand. */
function VendorAvatar({ vendor, size = 48 }: { vendor: any; size?: number }) {
  const src = vendor?.images?.[0]
  const initial = String(vendor?.name || "?").trim().charAt(0).toUpperCase()
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-full border border-bridal-beige bg-bridal-sand"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {src ? (
        <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-display italic text-[18px] text-bridal-gold-dark">
          {initial}
        </span>
      )}
    </div>
  )
}

export default function VendorSelectionStep({ formData, updateFormData }: VendorSelectionStepProps) {
  const { tier, announce } = useBookingShell()
  const [selectedVendorType, setSelectedVendorType] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [allVendors, setAllVendors] = useState<any[]>([])
  const [loadingVendors, setLoadingVendors] = useState(true)
  // The vendor open in the sheet (row tap / "Packages"), and its full record.
  const [sheetVendor, setSheetVendor] = useState<Vendor | null>(null)
  const [previewVendorDetail, setPreviewVendorDetail] = useState<Vendor | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  // Every vendor this step has ever seen, by id. A selected vendor must keep
  // rendering after the category filter moves to a list that no longer holds
  // it, so lookups fall back to this cache rather than the current page.
  const knownVendors = useRef<Map<string, any>>(new Map())
  const remember = (list: any[]) => {
    list.forEach((v) => {
      if (v && v.id != null) knownVendors.current.set(String(v.id), v)
    })
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoadingVendors(true)
      let data: any[]
      if (selectedVendorType && selectedVendorType !== "all") {
        data = await VendorAPI.getBusinessesByVendorType(selectedVendorType)
        if (!data || data.length === 0) {
          const all = await VendorAPI.getAllBusinesses()
          const typeLower = selectedVendorType.toLowerCase()
          data = all.filter((v) => (v.type || "").toLowerCase() === typeLower)
        }
      } else {
        data = await VendorAPI.getAllBusinesses()
      }
      if (cancelled) return
      remember(data)
      setAllVendors(data)
      setLoadingVendors(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [selectedVendorType])

  useEffect(() => {
    let cancelled = false
    const fetchDetail = async (id: string) => {
      const detail = await VendorAPI.getBusinessById(id)
      if (detail && !cancelled) {
        remember([detail])
        setPreviewVendorDetail(detail)
      }
    }
    if (sheetVendor?.id) {
      fetchDetail(String(sheetVendor.id))
    } else {
      setPreviewVendorDetail(null)
    }
    return () => {
      cancelled = true
    }
  }, [sheetVendor])

  const vendorTypeOptions = Object.values(VENDOR_TYPES)
  const selectedIds = formData.selectedVendors.map(String)

  const getVendorById = (id: string | number) =>
    allVendors.find((vendor) => vendor.id == id) ?? knownVendors.current.get(String(id))

  const addVendor = async (vendorId: string) => {
    if (!vendorId || selectedIds.includes(vendorId)) return

    // Check availability if date & time are selected
    if (formData.bookingDate && formData.timeSlot) {
      setCheckingAvailability(true)
      try {
        const result = await VendorAPI.checkDateAvailability(
          [Number(vendorId)],
          typeof formData.bookingDate === "string" ? formData.bookingDate : new Date(formData.bookingDate).toISOString(),
          formData.timeSlot,
        )
        if (!result.available && result.conflicts.length > 0) {
          const names = result.conflicts.map((c) => c.businessName).join(", ")
          const altSlots = result.alternativeSlots?.availableSlots || []
          toast({
            title: "Vendor Unavailable",
            description: `${names} is already booked at this time.${altSlots.length > 0 ? ` Available slots: ${altSlots.join(", ")}` : " No alternative slots available."}`,
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
      selectedVendors: [...formData.selectedVendors, vendorId],
    })
    const v = getVendorById(vendorId)
    if (v?.name) announce(`${v.name} added`)
  }

  const removeVendor = (vendorId: string | number) => {
    updateFormData({
      selectedVendors: formData.selectedVendors.filter((id) => String(id) !== String(vendorId)),
      selectedVendorPackages: [],
    })
  }

  // Same write the package step performs when a vendor package is toggled.
  const toggleVendorPackage = (packageId: string) => {
    const current = (formData.selectedVendorPackages || []).map(String)
    const next = current.includes(packageId) ? current.filter((id) => id !== packageId) : [...current, packageId]
    updateFormData({ selectedVendorPackages: next })
  }

  const query = searchQuery.trim().toLowerCase()
  const selectedKey = selectedIds.join(",")
  const results = useMemo(
    () =>
      allVendors.filter((vendor) => {
        if (!vendor || selectedIds.includes(String(vendor.id))) return false
        if (!query) return true
        return (
          String(vendor.name || "").toLowerCase().includes(query) ||
          vendorTypeOf(vendor).toLowerCase().includes(query)
        )
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allVendors, selectedKey, query],
  )

  const selectedVendors = selectedIds.map((id) => getVendorById(id)).filter(Boolean) as any[]
  const selectedPackageIds = (formData.selectedVendorPackages || []).map(String)
  const packageCountFor = (vendor: any) =>
    selectedPackageIds.filter((pid) => (vendor?.packages || []).some((p: any) => String(p.id) === pid)).length

  const sheetOpen = sheetVendor !== null
  const sheetDetail: any = previewVendorDetail ?? sheetVendor
  const sheetIsSelected = sheetVendor ? selectedIds.includes(String(sheetVendor.id)) : false
  const sheetPackages: any[] = Array.isArray(sheetDetail?.packages) ? sheetDetail.packages : []

  const chipH = tier === "phone" ? "h-11" : "h-10"
  const chipBase = `inline-flex ${chipH} shrink-0 items-center whitespace-nowrap rounded-full border px-4 font-bridal text-[12px] leading-[16px] transition-colors duration-150 ${FOCUS_RING}`
  const chipOn = "border-bridal-gold-dark bg-bridal-cream text-bridal-charcoal"
  const chipOff = "border-bridal-beige bg-white text-bridal-text hover:bg-bridal-blush/45 hover:border-bridal-gold-dark"

  const ghostBtn = `inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-[4px] border border-bridal-beige bg-white px-4 font-bridal text-[12px] font-medium uppercase tracking-[0.18em] text-bridal-gold-dark transition-colors duration-150 hover:border-bridal-gold-dark hover:bg-bridal-blush/45 disabled:cursor-not-allowed disabled:opacity-50 xl:h-9 ${FOCUS_RING}`

  return (
    // Rhythm (§7.7): search 48 → 12 → chips 40 → 16 → [added list → 16 →] results.
    <div>
      {/* Search — 48px */}
      <div className="relative">
        <label htmlFor="vendor" className="sr-only">
          Search vendors
        </label>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-bridal-gold-dark" aria-hidden />
        <input
          id="vendor"
          type="search"
          autoComplete="off"
          placeholder="Search by name or service"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`h-12 w-full rounded-[4px] border border-bridal-beige bg-white pl-11 pr-4 font-bridal text-[14px] leading-[20px] text-bridal-charcoal placeholder:text-bridal-text-soft transition-colors duration-150 hover:border-bridal-gold-dark ${FOCUS_RING}`}
        />
      </div>

      {/* Category chips — one 40px row (44 on phone), scrolls sideways */}
      <div
        id="vendor-type"
        role="group"
        aria-label="Vendor type"
        className="hide-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 py-0.5"
      >
        <button
          type="button"
          aria-pressed={!selectedVendorType || selectedVendorType === "all"}
          onClick={() => setSelectedVendorType("")}
          className={`${chipBase} ${!selectedVendorType || selectedVendorType === "all" ? chipOn : chipOff}`}
        >
          All vendors
        </button>
        {vendorTypeOptions.map((type) => {
          const on = selectedVendorType === type
          return (
            <button
              key={type}
              type="button"
              aria-pressed={on}
              onClick={() => setSelectedVendorType(on ? "" : type)}
              className={`${chipBase} ${on ? chipOn : chipOff}`}
            >
              {type}
            </button>
          )
        })}
      </div>

      {/* Selected vendors — above the results, only when any */}
      {selectedVendors.length > 0 && (
        <section aria-label="Selected vendors" className="mt-4">
          <p className="font-bridal text-[11px] font-medium uppercase leading-[14px] tracking-[0.18em] text-bridal-gold-dark">
            Added · <span className="tabular-nums">{selectedVendors.length}</span>
          </p>
          <ul className="mt-2 space-y-2">
            {selectedVendors.map((vendor, i) => {
              const pkgCount = packageCountFor(vendor)
              return (
                <li
                  key={vendor.id}
                  className="animate-stagger-fade-up relative flex min-h-[56px] items-center gap-3 rounded-[4px] border border-bridal-gold-dark bg-bridal-cream py-1.5 pl-4 pr-2"
                  style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                >
                  {/* 4px gold left rule — selection mark (§9); a real element, not a shadow */}
                  <span aria-hidden className="absolute inset-y-0 left-0 w-1 rounded-l-[4px] bg-bridal-gold" />
                  <VendorAvatar vendor={vendor} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display italic text-[15px] leading-[20px] text-bridal-charcoal">{vendor.name}</p>
                    <p className="truncate font-bridal text-[12px] leading-[16px] text-bridal-text-soft">
                      {vendorTypeOf(vendor)}
                      {pkgCount > 0 && (
                        <span className="text-[#3F6B43]">
                          {" "}· <span className="tabular-nums">{pkgCount}</span> {pkgCount === 1 ? "package" : "packages"}
                        </span>
                      )}
                    </p>
                  </div>
                  <button type="button" onClick={() => setSheetVendor(vendor)} className={ghostBtn}>
                    Packages
                  </button>
                  <button
                    type="button"
                    onClick={() => removeVendor(vendor.id)}
                    aria-label={`Remove ${vendor.name}`}
                    className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-bridal-text-soft transition-colors duration-150 hover:bg-bridal-coral/15 hover:text-bridal-coral xl:h-9 xl:w-9 ${FOCUS_RING}`}
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Results — 88px rows, 1 column at base, 2 at xl */}
      <div className="mt-4" data-booking-vendor-results={results.length}>
        {loadingVendors ? (
          <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2" aria-busy="true" aria-label="Loading vendors">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex h-[88px] items-center gap-3 rounded-[4px] border border-bridal-beige bg-white px-4">
                <div className="h-12 w-12 animate-pulse rounded-full bg-bridal-sand" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-2/3 animate-pulse rounded bg-bridal-sand" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-bridal-sand" />
                </div>
              </li>
            ))}
          </ul>
        ) : results.length === 0 ? (
          <div className="rounded-[4px] border border-dashed border-bridal-beige bg-white px-4 py-8 text-center">
            <p className="font-display italic text-[18px] leading-[24px] text-bridal-charcoal">
              {query ? "No vendors match that search" : "No vendors in this category yet"}
            </p>
            <p className="mt-1 font-bridal text-[13px] leading-[18px] text-bridal-text-soft">
              {query ? "Try another name or service." : "Try another category, or continue without one."}
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2" aria-label="Vendors">
            {results.map((vendor, i) => {
              const from = startingPrice(vendor)
              return (
                <li
                  key={vendor.id}
                  className="animate-stagger-fade-up flex h-[88px] items-center gap-3 rounded-[4px] border border-bridal-beige bg-white pl-4 pr-3 transition-colors duration-150 hover:bg-bridal-blush/45"
                  style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => setSheetVendor(vendor)}
                    aria-label={`View ${vendor.name}`}
                    className={`flex min-w-0 flex-1 items-center gap-3 rounded-[4px] py-2 text-left ${FOCUS_RING}`}
                  >
                    <VendorAvatar vendor={vendor} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display italic text-[15px] leading-[20px] text-bridal-charcoal">
                        {vendor.name}
                      </span>
                      <span className="mt-0.5 block truncate font-bridal text-[12px] leading-[16px] text-bridal-text-soft">
                        {vendorTypeOf(vendor)}
                        {from > 0 && (
                          <>
                            {" "}· from <span className="tabular-nums text-bridal-gold-dark">{money(from)}</span>
                          </>
                        )}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addVendor(String(vendor.id))}
                    disabled={checkingAvailability}
                    aria-label={`Add ${vendor.name}`}
                    className={ghostBtn}
                  >
                    {checkingAvailability ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
                    Add
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Vendor detail + package picker — DeskSheet (right on desk, drawer on phone) */}
      <DeskSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) setSheetVendor(null)
        }}
        title={sheetDetail?.name || "Vendor"}
        description={[vendorTypeOf(sheetDetail), sheetDetail?.location || sheetDetail?.city].filter(Boolean).join(" · ") || undefined}
        footer={
          sheetIsSelected ? (
            <div className="flex w-full gap-2">
              <BridalButton
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  if (sheetVendor) removeVendor(sheetVendor.id)
                }}
              >
                Remove
              </BridalButton>
              <BridalButton type="button" variant="primary" size="md" block onClick={() => setSheetVendor(null)}>
                Done
              </BridalButton>
            </div>
          ) : (
            <BridalButton
              type="button"
              variant="primary"
              size="md"
              block
              loading={checkingAvailability}
              onClick={() => {
                if (sheetVendor) addVendor(String(sheetVendor.id))
              }}
            >
              {checkingAvailability ? "Checking availability" : `Add ${sheetDetail?.name || "vendor"}`}
            </BridalButton>
          )
        }
      >
        {sheetDetail && (
          <div className="space-y-4">
            <div className="relative h-40 w-full overflow-hidden rounded-[4px] border border-bridal-beige bg-bridal-sand">
              <Image
                src={sheetDetail.images?.[0] || "/placeholder.jpg"}
                alt={sheetDetail.name || ""}
                fill
                sizes="480px"
                className="object-cover"
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-bridal text-[13px] leading-[18px] text-bridal-text">
              {(sheetDetail.location || sheetDetail.city) && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-bridal-gold-dark" aria-hidden />
                  {sheetDetail.location || sheetDetail.city}
                </span>
              )}
              {Number(sheetDetail.rating || 0) > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-bridal-gold text-bridal-gold" aria-hidden />
                  <span className="tabular-nums">{Number(sheetDetail.rating || 0).toFixed(1)}</span>
                </span>
              )}
              {startingPrice(sheetDetail) > 0 && (
                <span className="font-display italic text-[15px] leading-[20px] tabular-nums text-bridal-gold-dark">
                  from {money(startingPrice(sheetDetail))}
                </span>
              )}
            </div>

            {sheetDetail.description && (
              <p className="line-clamp-3 font-bridal text-[13px] leading-[18px] text-bridal-text-soft">{sheetDetail.description}</p>
            )}

            {Array.isArray(sheetDetail.amenities) && sheetDetail.amenities.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label="Amenities">
                {sheetDetail.amenities.slice(0, 6).map((a: string, i: number) => (
                  <li
                    key={i}
                    className="rounded-full border border-bridal-beige bg-white px-2.5 py-1 font-bridal text-[11px] leading-[14px] text-bridal-text"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-bridal-beige pt-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-bridal text-[11px] font-medium uppercase leading-[14px] tracking-[0.18em] text-bridal-gold-dark">
                  Packages
                </p>
                {!sheetIsSelected && sheetPackages.length > 0 && (
                  <p className="font-bridal text-[12px] leading-[16px] text-bridal-text-soft">Add the vendor to choose</p>
                )}
              </div>

              {previewVendorDetail === null ? (
                <p className="mt-3 flex items-center gap-2 font-bridal text-[13px] leading-[18px] text-bridal-text-soft">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Loading packages
                </p>
              ) : sheetPackages.length === 0 ? (
                <p className="mt-3 font-bridal text-[13px] leading-[18px] text-bridal-text-soft">
                  No packages listed — the vendor will quote after you send the request.
                </p>
              ) : (
                <ul className="mt-3 space-y-2" aria-label={`${sheetDetail.name} packages`}>
                  {sheetPackages.map((pkg: any, i: number) => {
                    const pid = String(pkg.id)
                    const on = selectedPackageIds.includes(pid)
                    return (
                      <li key={pid} className="animate-stagger-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                        <button
                          type="button"
                          disabled={!sheetIsSelected}
                          aria-pressed={on}
                          onClick={() => toggleVendorPackage(pid)}
                          className={`relative flex min-h-[56px] w-full items-center gap-3 rounded-[4px] border px-4 py-2 text-left transition-colors duration-150 disabled:cursor-not-allowed ${
                            on
                              ? "border-bridal-gold-dark bg-bridal-cream"
                              : "border-bridal-beige bg-white hover:bg-bridal-blush/45 disabled:hover:bg-white"
                          } ${FOCUS_RING}`}
                        >
                          {/* 4px gold left rule, scaleY 0→1 on select (§8 card select) */}
                          <span
                            aria-hidden
                            className={`absolute inset-y-0 left-0 w-1 origin-top rounded-l-[4px] bg-bridal-gold transition-transform duration-200 ease-out ${
                              on ? "scale-y-100" : "scale-y-0"
                            }`}
                          />
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-150 ${
                              on
                                ? "animate-pop-select border-bridal-gold-dark bg-bridal-gold-dark text-bridal-ivory"
                                : "border-bridal-beige bg-white"
                            }`}
                            aria-hidden
                          >
                            {on && <Check className="h-3 w-3" strokeWidth={3} />}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-display italic text-[15px] leading-[20px] text-bridal-charcoal">
                            {pkg.name}
                          </span>
                          <span className="shrink-0 font-display italic text-[15px] leading-[20px] tabular-nums text-bridal-gold-dark">
                            {money(pkg.price)}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </DeskSheet>
    </div>
  )
}
