// Ops Portal P6 — FE API client for the vendor workspace: find any vendor, open their page, correct anything, put them live or off (/api/v1/ops/directory).
// Every call needs an ops permission server-side; what a screen hides is a convenience, never the boundary.
import api from "@/lib/axiosConfig"
import type { EditableDetails, SheetData } from "@/lib/api/ops-onboarding"

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p
  return res.data.data
}
const BASE = "/api/v1/ops/directory"

export type VendorSource = "registered" | "imported" | "portal"
export interface VendorRow {
  id: number; name: string; vendorType: string | null; city: string | null; subArea: string | null; ownerName: string | null; phone: string | null
  phoneIsPlaceholder?: boolean
  live: boolean; status: string; source: VendorSource; packages: number; menus: number; minimumPrice: number | null; maxCapacity: number | null; completenessScore: number | null
}
export interface ProspectHit { id: number; name: string; vendorType: string | null; city: string | null; area: string | null; status: string; phone: string | null }
export interface VendorSearch { q: string; total: number; page: number; pageSize: number; rows: VendorRow[]; prospects: ProspectHit[]; hint?: string }
export interface VendorSearchQuery { q?: string; type?: string; live?: "live" | "notlive" | ""; page?: number; pageSize?: number }

export type PricingUnit = "per_head" | "per_event" | null
export interface PackageView { id: number; name: string; description: string; price: number | null; pricingUnit: PricingUnit; minGuaranteeCount: number | null; includesFood: boolean; capacity: number | null; features: string[] }
export interface MenuView { id: number; title: string; price: number | null; pricingUnit: PricingUnit; minGuaranteeCount: number | null; items: string[] }
export interface HistoryRow { id: number | string; at: string; action: string; actorName: string | null; before: unknown; after: unknown }
export interface VendorPage {
  vendor: VendorRow & { slug: string | null; images: number; email: string | null; emailIsPlaceholder?: boolean; claimed: boolean }
  live: { live: boolean; canTakeLive: boolean; gaps: string[]; status: string }
  packages: PackageView[]
  menus: MenuView[]
  portal: { onboardMode: "new" | "takeover"; onboardedAt: string; prospectId: number | null } | null
  history: HistoryRow[]
}
export interface PackageBody { name?: string; price?: number | string; description?: string; features?: string[] | string; pricingUnit?: PricingUnit | ""; minGuaranteeCount?: number | string | null; includesFood?: boolean; capacity?: number | string | null }
export interface MenuBody { title?: string; price?: number | string; pricingUnit?: PricingUnit | ""; minGuaranteeCount?: number | string | null; items?: string[] }

export const directoryApi = {
  search: (query: VendorSearchQuery) => unwrap<VendorSearch>(api.get(BASE, { params: query })),
  get: (id: number) => unwrap<VendorPage>(api.get(`${BASE}/${id}`)),
  details: (id: number) => unwrap<EditableDetails>(api.get(`${BASE}/${id}/details`)),
  edit: (id: number, changes: SheetData) => unwrap<{ changed: string[]; completenessScore: number | null }>(api.patch(`${BASE}/${id}`, changes)),
  savePackage: (id: number, body: PackageBody, packageId?: number) =>
    unwrap<PackageView>(packageId ? api.patch(`${BASE}/${id}/packages/${packageId}`, body) : api.post(`${BASE}/${id}/packages`, body)),
  deletePackage: (id: number, packageId: number) => unwrap<{ id: number }>(api.delete(`${BASE}/${id}/packages/${packageId}`)),
  saveMenu: (id: number, body: MenuBody, menuId?: number) => unwrap<MenuView>(menuId ? api.patch(`${BASE}/${id}/menus/${menuId}`, body) : api.post(`${BASE}/${id}/menus`, body)),
  deleteMenu: (id: number, menuId: number) => unwrap<{ id: number }>(api.delete(`${BASE}/${id}/menus/${menuId}`)),
  setLive: (id: number, live: boolean) => unwrap<{ id: number; live: boolean }>(api.post(`${BASE}/${id}/live`, { live })),
}
