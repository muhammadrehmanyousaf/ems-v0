/**
 * One breakdown for the whole booking shell.
 *
 * This is the arithmetic `MobileSummaryBar` carried in a `useMemo`, lifted
 * verbatim so the Stage ledger, the phone sheet and the action-bar label all
 * read the same figures. `composeLineTotal` is the ONE place a package and a
 * menu are added together (WW-PKG-UNIT), so an included menu can never be
 * charged twice by a summary that adds them itself.
 *
 * `startingPrice` is the venue's `minimumPrice`. It is returned on its own and
 * is NEVER an item: it is a placeholder shown before a package is chosen, and a
 * chosen package replaces it rather than adding to it.
 */

import type { BookingFormData, EventVenue, Vendor } from "@/lib/types"
import { menuChargeFor, menuIsPerHead, menuBillableHeads } from "@/lib/pricing/menu"
import { composeLineTotal, packageIsPerHead, packageBillableHeads } from "@/lib/pricing/package"
import { readUnitConfig, sellsByTheUnit, unitLineFor, describeUnitQty } from "@/lib/pricing/per-unit"

export interface BreakdownItem {
  label: string
  amount: number
  kind: "package" | "menu" | "unit" | "vendor"
}

export interface Breakdown {
  items: BreakdownItem[]
  subtotal: number
  downPayment: number
  remaining: number
  startingPrice: number
  /** True once anything is actually priced (a package, a menu, a unit line, a vendor package). */
  priced: boolean
}

export function computeBreakdown({
  formData,
  venue,
  vendorsDetails = [],
  selectedPackageObj,
  selectedMenuObj,
}: {
  formData: BookingFormData
  venue: EventVenue | null
  vendorsDetails?: Vendor[]
  selectedPackageObj?: any
  selectedMenuObj?: any
}): Breakdown {
  const items: BreakdownItem[] = []
  const isCarRental = venue?.vendor?.vendorType === "Car rental"
  const isBridalWear = venue?.vendor?.vendorType === "Bridal wearing"
  const isWeddingStationery = venue?.vendor?.vendorType === "Wedding Invitations and Stationery"
  const vehicleQty = isCarRental || isBridalWear || isWeddingStationery ? formData.vehicleQuantity || 1 : 1

  const menuRaw = menuChargeFor(selectedMenuObj, formData.guestCount)
  const line = composeLineTotal({
    pkg: selectedPackageObj,
    guestCount: formData.guestCount,
    qty: vehicleQty,
    menuCharge: menuRaw,
  })

  if (selectedPackageObj) {
    const pkgPerHead = packageIsPerHead(selectedPackageObj)
    const pkgHeads = packageBillableHeads(selectedPackageObj, formData.guestCount)
    items.push({
      kind: "package",
      label: pkgPerHead
        ? `${selectedPackageObj.name} ×${pkgHeads}`
        : vehicleQty > 1
          ? `${selectedPackageObj.name} ×${vehicleQty}`
          : selectedPackageObj.name,
      amount: line.packageCharge,
    })
  }
  if (selectedMenuObj) {
    const perHead = menuIsPerHead(selectedMenuObj)
    const heads = menuBillableHeads(selectedMenuObj, formData.guestCount)
    const baseLabel = selectedMenuObj.title || selectedMenuObj.name
    items.push({
      kind: "menu",
      label: line.menuIncluded ? `${baseLabel} — included` : perHead ? `${baseLabel} ×${heads}` : baseLabel,
      amount: line.menuCharge,
    })
  }
  if (!selectedPackageObj && !selectedMenuObj && venue) {
    const cfg = readUnitConfig(venue as any)
    if (cfg && sellsByTheUnit(venue as any)) {
      const ul = unitLineFor(cfg, formData.vehicleQuantity || cfg.minUnitQty || 1)
      items.push({ kind: "unit", label: describeUnitQty(ul.unitLabel, ul.billedQty), amount: ul.total })
    }
  }
  if (formData.selectedVendorPackages?.length) {
    formData.selectedVendorPackages.forEach((pkgId) => {
      const owner = vendorsDetails.find((v) => (v.packages || []).some((p: any) => String(p.id) === String(pkgId)))
      const pkg = owner?.packages?.find((p: any) => String(p.id) === String(pkgId))
      if (owner && pkg) items.push({ kind: "vendor", label: `${owner.name} — ${pkg.name}`, amount: Number(pkg.price) || 0 })
    })
  }

  const subtotal = items.reduce((s, i) => s + i.amount, 0)
  let downPayment = 0
  if (venue) {
    const dpType = (venue.downPaymentType || "").toLowerCase()
    const dpValue = Number(venue.downPayment) || 0
    downPayment = dpType === "percentage" || dpType === "percent" ? Math.round(subtotal * (dpValue / 100)) : dpValue
  }
  const startingPrice = Number((venue as any)?.minimumPrice) || 0
  return {
    items,
    subtotal,
    downPayment,
    remaining: Math.max(0, subtotal - downPayment),
    startingPrice,
    priced: subtotal > 0,
  }
}

/** "Rs 760,000" — the same Intl call the review step uses, with the symbol normalised. */
export const formatPKR = (n: number) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 })
    .format(Number(n) || 0)
    .replace(/^(PKR|Rs\.?)[\s ]?/, "Rs ")
