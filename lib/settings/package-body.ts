/**
 * One body builder for the package drawers, and the faithful-undo body.
 *
 * SETUP-005 - the /dashboard/packages drawer only added a key to the PATCH when
 * it was non-empty (`if (gmin > 0)`, `description: ... || undefined`,
 * `if (feats.length)`), and the server leaves an ABSENT key alone and clears only
 * on an explicit null. So emptying the guest range, the minimum guarantee, the
 * service style, the description or the features saved "Package update ho gaya"
 * and left every old value in place. The Settings hub's PackagesManager already
 * sends them as null; both screens now build the body here.
 *
 * SETUP-023 - Undo after "Remove" re-created the package from
 * {name, price, description, features, businessId}, so a per-head package came
 * back as a flat one and a 400-guest booking priced at Rs 2,500 instead of
 * Rs 1,000,000. `packageRestoreBody` carries every column.
 */

export interface PackageFormInput {
  editing: boolean
  name: string
  price: number
  businessId: number
  pricingUnit: string
  includesFood: boolean
  description: string
  guestRangeMin: string | number | null | undefined
  guestRangeMax: string | number | null | undefined
  serviceStyle: string | null | undefined
  menuId: string | number | null | undefined
  subVenueId: string | number | null | undefined
  features: string[]
  minGuarantee: string | number | null | undefined
}

const posInt = (v: unknown): number | null => {
  if (v == null || String(v).trim() === "") return null
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** The create/update body. On EDIT every optional column is sent, as null when emptied. */
export function buildPackageBody(i: PackageFormInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: i.name,
    price: i.price,
    businessId: i.businessId,
    pricingUnit: i.pricingUnit,
    includesFood: i.includesFood,
    guestRangeMin: posInt(i.guestRangeMin),
    guestRangeMax: posInt(i.guestRangeMax),
    serviceStyle: i.serviceStyle ? String(i.serviceStyle) : null,
    menuId: posInt(i.menuId),
    subVenueId: posInt(i.subVenueId),
    // A minimum guarantee only means something per head; leaving a stale one
    // behind a flat package is the incoherence the server refuses.
    minGuaranteeCount: i.pricingUnit === "per_head" ? posInt(i.minGuarantee) : null,
  }
  const desc = i.description.trim()
  if (i.editing) {
    body.description = desc || null
    body.features = i.features
  } else {
    // Create keeps its old shape (absent = column default).
    if (desc) body.description = desc
    if (i.features.length) body.features = i.features
  }
  return body
}

/** A package as the API returned it; only the columns the restore needs. */
export interface PackageLike {
  name?: string | null
  price?: number | string | null
  description?: string | null
  features?: unknown
  images?: unknown
  extras?: unknown
  looksJson?: unknown
  subVenueId?: number | null
  pricingUnit?: string | null
  minGuaranteeCount?: number | null
  includesFood?: boolean | null
  guestRangeMin?: number | null
  guestRangeMax?: number | null
  serviceStyle?: string | null
  menuId?: number | null
}

const asFeatureList = (f: unknown): string[] =>
  Array.isArray(f) ? (f as string[]) : f && typeof f === "object" ? Object.values(f as Record<string, unknown>).map(String) : []

/** The body that re-creates a removed package with every column it had. */
export function packageRestoreBody(p: PackageLike, businessId: number): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: p.name,
    price: Number(p.price) || 0,
    businessId,
    features: asFeatureList(p.features),
    subVenueId: p.subVenueId ?? null,
    pricingUnit: p.pricingUnit ?? null,
    minGuaranteeCount: p.minGuaranteeCount ?? null,
    includesFood: p.includesFood === true,
    guestRangeMin: p.guestRangeMin ?? null,
    guestRangeMax: p.guestRangeMax ?? null,
    serviceStyle: p.serviceStyle ?? null,
    menuId: p.menuId ?? null,
  }
  if (p.description) body.description = p.description
  if (Array.isArray(p.images)) body.images = p.images
  if (Array.isArray(p.extras)) body.extras = p.extras
  if (p.looksJson != null) body.looksJson = p.looksJson
  return body
}
