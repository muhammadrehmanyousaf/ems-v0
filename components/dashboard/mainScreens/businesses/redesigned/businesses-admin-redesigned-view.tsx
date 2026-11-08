"use client"

/**
 * Businesses (Admin) — Advanced Enterprise Command Center.
 * - New on top by default (server-side `sort=newest`)
 * - Multi-facet filter bar: City, Vendor Type, Status, Verification Tier, Live Search
 * - Bulk actions: Bulk Approve, Bulk Suspend, Bulk Restore, Bulk Delete, Bulk Export
 * - 1-Click row actions: Quick status transition, 360° Inspection Drawer, Call, WhatsApp
 * Route: /dashboard/businesses
 */

import * as React from "react"
import Link from "next/link"
import { errorMessage } from "@/lib/utils/api-error"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { BusinessesAPI, type ApiBusiness } from "@/lib/api/dashboard"
import { AdminBusinessAPI } from "@/lib/api/admin-business"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell, formatPkr } from "@/components/dashboard/primitives/money-cell"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon, Spinner } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { BusinessDetailDrawer } from "@/components/dashboard/admin/businesses/BusinessDetailDrawer"
import { AssignToBusinessModal } from "@/components/dashboard/admin/assignment/AssignToBusinessModal"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)

const getBizPhone = (b: ApiBusiness): string | null => {
  const anyB = b as any
  return anyB.contactPhone || anyB.phone || anyB.vendor?.phoneNumber || null
}

const label = (v: unknown): string => {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string" && x.trim()).join(", ")
  if (typeof v === "string") return v
  if (typeof v === "number") return String(v)
  return ""
}

const cap = (s?: unknown) => {
  const t = label(s).trim()
  return t ? t[0].toUpperCase() + t.slice(1).replace(/_/g, " ") : "—"
}

const fmtDate = (d?: string | null) => {
  if (!d) return "—"
  const t = new Date(d)
  return isNaN(t.getTime())
    ? "—"
    : t.toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })
}

const initials = (name?: string | null) =>
  (name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")

const CITIES_LIST = [
  "All Cities",
  "Islamabad",
  "Rawalpindi",
  "Lahore",
  "Karachi",
  "Peshawar",
  "Multan",
  "Faisalabad",
  "Gujranwala",
  "Sialkot",
  "Abbottabad",
]

const VENDOR_TYPES_LIST = [
  "All Types",
  "Venue",
  "Photographer",
  "Catering",
  "Bridal Wear",
  "Decor & Stage",
  "Makeup Artist",
  "Car Rental",
]

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First (Default)" },
  { value: "oldest", label: "Oldest First" },
  { value: "name", label: "Name: A to Z" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
]

export function BusinessesAdminRedesignedView() {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [selectedCity, setSelectedCity] = React.useState("All Cities")
  const [selectedType, setSelectedType] = React.useState("All Types")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "approved" | "submitted" | "suspended">("all")
  const [tierFilter, setTierFilter] = React.useState<"all" | "1" | "2" | "3">("all")
  // Default to newest so new businesses/venues are always on top!
  const [sortOrder, setSortOrder] = React.useState("newest")

  // Drawer & Modals state
  const [selectedBusinessId, setSelectedBusinessId] = React.useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [assignTargetBusiness, setAssignTargetBusiness] = React.useState<ApiBusiness | null>(null)

  // Selection & Bulk actions
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [deleting, setDeleting] = React.useState<ApiBusiness | null>(null)
  const [bulkDeleting, setBulkDeleting] = React.useState(false)

  const invalidate = () => qc.invalidateQueries({ queryKey: ["businesses-admin-redesigned"] })

  // Delete mutation
  const removeMut = useMutation({
    mutationFn: (id: number) => BusinessesAPI.delete(id),
    onSuccess: () => {
      showSuccessToast("Business removed")
      setDeleting(null)
      invalidate()
    },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't remove business")),
  })

  // Quick single-status update mutation
  const singleStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "approved" | "suspended" | "submitted" }) => {
      return AdminBusinessAPI.bulkUpdateStatus([id], status)
    },
    onSuccess: (_, vars) => {
      showSuccessToast(`Business marked as ${vars.status}`)
      invalidate()
    },
    onError: (e: any) => toast.error(errorMessage(e, "Status change failed")),
  })

  // Bulk status update mutation
  const bulkStatusMut = useMutation({
    mutationFn: async (status: "approved" | "suspended" | "submitted") => {
      const ids = Array.from(selected).map(Number).filter(Number.isFinite)
      if (ids.length === 0) throw new Error("No businesses selected")
      return AdminBusinessAPI.bulkUpdateStatus(ids, status)
    },
    onSuccess: (res, status) => {
      showSuccessToast(`${res.updatedCount || selected.size} businesses updated to ${status}`)
      setSelected(new Set())
      invalidate()
    },
    onError: (e: any) => toast.error(errorMessage(e, "Bulk update failed")),
  })

  // Bulk delete mutation
  const bulkDeleteMut = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selected).map(Number).filter(Number.isFinite)
      for (const id of ids) {
        await BusinessesAPI.delete(id).catch((err) =>
          console.warn(`Failed to delete business #${id}:`, err?.message)
        )
      }
    },
    onSuccess: () => {
      showSuccessToast(`${selected.size} businesses removed`)
      setSelected(new Set())
      setBulkDeleting(false)
      invalidate()
    },
    onError: (e: any) => toast.error(errorMessage(e, "Bulk delete failed")),
  })

  const PAGE_SIZE = 25
  const [page, setPage] = React.useState(1)

  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch, selectedCity, selectedType, statusFilter, tierFilter, sortOrder])

  // Queries backend with sort=newest and city
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["businesses-admin-redesigned", page, debouncedSearch, sortOrder, selectedCity],
    queryFn: () =>
      BusinessesAPI.getAll(
        page,
        PAGE_SIZE,
        debouncedSearch,
        sortOrder,
        selectedCity !== "All Cities" ? selectedCity : undefined,
      ),
    placeholderData: (prev) => prev,
  })

  const all: ApiBusiness[] =
    (data as { businesses?: ApiBusiness[] } | undefined)?.businesses ??
    (data as { data?: ApiBusiness[] } | undefined)?.data ??
    []
  const total = data?.pagination?.total ?? 0
  const totalPages = Math.max(data?.pagination?.totalPages ?? 1, 1)

  // Client facet filtering
  const filteredBusinesses = React.useMemo(() => {
    let list = all
    const q = debouncedSearch.toLowerCase()
    if (q) {
      list = list.filter((b) =>
        [b.name, b.city, b.subArea, b.subBusinessType, String(b.id)].some((v) =>
          label(v).toLowerCase().includes(q),
        ),
      )
    }

    if (selectedCity !== "All Cities") {
      const c = selectedCity.toLowerCase()
      list = list.filter((b) => (b.city || "").toLowerCase() === c)
    }

    if (selectedType !== "All Types") {
      const t = selectedType.toLowerCase()
      list = list.filter((b) => {
        const typeStr = label(b.subBusinessType || "").toLowerCase()
        return typeStr.includes(t)
      })
    }

    if (statusFilter !== "all") {
      list = list.filter((b) => {
        const s = (b.status || "submitted").toLowerCase()
        if (statusFilter === "approved") return s === "approved"
        if (statusFilter === "submitted") return s === "submitted" || s === "draft"
        if (statusFilter === "suspended") return s === "suspended" || s === "rejected"
        return true
      })
    }

    if (tierFilter !== "all") {
      const reqTier = parseInt(tierFilter, 10)
      list = list.filter((b) => {
        const tier = "verificationTier" in b ? Number(b.verificationTier) : 0
        return tier >= reqTier
      })
    }

    return list
  }, [all, debouncedSearch, selectedCity, selectedType, statusFilter, tierFilter])

  const citiesCount = new Set(all.map((b) => (b.city ?? "").trim().toLowerCase()).filter(Boolean)).size
  const withPricing = all.filter((b) => num(b.minimumPrice) > 0).length
  const capped = all.filter((b) => num(b.maxCapacity) > 0)
  const avgCapacity = capped.length
    ? Math.round(capped.reduce((s, b) => s + num(b.maxCapacity), 0) / capped.length)
    : 0

  const open360Drawer = (businessId: number) => {
    setSelectedBusinessId(businessId)
    setDrawerOpen(true)
  }

  const columns: Column<ApiBusiness>[] = [
    {
      key: "name",
      header: "Business & Profile",
      render: (b) => {
        const citySlug = (b.city || "pakistan").toLowerCase().replace(/\s+/g, "-")
        const bizSlug = ((("slug" in b && b.slug) ? String(b.slug) : b.name) || "venue")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
        const publicUrl = `/wedding-venues/${citySlug}/${bizSlug}-${b.id}`

        return (
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
              {initials(b.name)}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    open360Drawer(b.id)
                  }}
                  className="font-semibold text-sm hover:text-primary transition-colors text-left truncate max-w-xs"
                >
                  {b.name || "—"}
                </button>
                <span className="text-xs text-muted-foreground font-mono">#{b.id}</span>
                <Link
                  href={publicUrl}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  title="View Public Page"
                >
                  <Icon name="ExternalLink" size={12} />
                </Link>
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {b.subArea ? `${b.subArea}, ` : ""}
                {b.city || "Pakistan"}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      key: "city",
      header: "City",
      render: (b) =>
        b.city ? (
          <StatusPill tone="neutral">{cap(b.city)}</StatusPill>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "type",
      header: "Type",
      render: (b) =>
        label(b.subBusinessType) ? (
          <StatusPill tone="neutral">{cap(b.subBusinessType)}</StatusPill>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "capacity",
      header: "Capacity",
      align: "right",
      cellClassName: "tabular-nums",
      render: (b) => (num(b.maxCapacity) > 0 ? num(b.maxCapacity).toLocaleString("en-PK") : "—"),
    },
    {
      key: "price",
      header: "Min Rate",
      align: "right",
      render: (b) =>
        num(b.minimumPrice) > 0 ? (
          <MoneyCell amount={num(b.minimumPrice)} />
        ) : (
          <span className="text-muted-foreground">On req.</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (b) => {
        const s = (b.status || "submitted").toLowerCase()
        const tone: StatusTone =
          s === "approved" ? "neutral" : s === "suspended" ? "neutral" : "neutral"
        return <StatusPill tone={tone}>{cap(s)}</StatusPill>
      },
    },
    {
      key: "actions",
      header: "Operations",
      align: "right",
      render: (b) => {
        const s = (b.status || "submitted").toLowerCase()
        const isApproved = s === "approved"
        const isSuspended = s === "suspended" || s === "rejected"

        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {/* Quick Status Control */}
            {isApproved ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs px-2 text-amber-600 hover:bg-amber-50"
                title="Suspend Business"
                disabled={singleStatusMut.isPending}
                onClick={() => singleStatusMut.mutate({ id: b.id, status: "suspended" })}
              >
                Suspend
              </Button>
            ) : isSuspended ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs px-2 text-emerald-600 hover:bg-emerald-50"
                title="Restore Business"
                disabled={singleStatusMut.isPending}
                onClick={() => singleStatusMut.mutate({ id: b.id, status: "submitted" })}
              >
                Restore
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs px-2 text-emerald-700 border-emerald-500/30 hover:bg-emerald-50"
                title="Approve Business"
                disabled={singleStatusMut.isPending}
                onClick={() => singleStatusMut.mutate({ id: b.id, status: "approved" })}
              >
                ✓ Approve
              </Button>
            )}

            {/* Quick Contact Icons */}
            {(() => {
              const phone = getBizPhone(b);
              if (!phone) return null;
              const cleanPhone = phone.replace(/\D/g, "");
              const p = cleanPhone.startsWith("0") ? "92" + cleanPhone.slice(1) : cleanPhone;
              const text = encodeURIComponent(`Assalam-o-Alaikum! WeddingWala team here regarding "${b.name}".`);
              return (
                <div className="flex items-center gap-0.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-emerald-700 hover:bg-emerald-50"
                    title={`WhatsApp: ${phone}`}
                    onClick={() => window.open(`https://wa.me/${p}?text=${text}`, "_blank")}
                  >
                    <Icon name="MessageSquare" size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    title={`Call: ${phone}`}
                    onClick={() => { window.location.href = `tel:${phone}`; }}
                  >
                    <Icon name="Phone" size={13} />
                  </Button>
                </div>
              );
            })()}

            {/* 360 View */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1"
              onClick={() => open360Drawer(b.id)}
            >
              <Icon name="Eye" size={13} />
              360 View
            </Button>

            {/* Delete button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeleting(b)}
              aria-label="Remove business"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <Icon name="Trash2" size={14} />
            </Button>
          </div>
        )
      },
    },
  ]

  const hasActiveFilters =
    search ||
    selectedCity !== "All Cities" ||
    selectedType !== "All Types" ||
    statusFilter !== "all" ||
    tierFilter !== "all" ||
    sortOrder !== "newest"

  const clearAllFilters = () => {
    setSearch("")
    setSelectedCity("All Cities")
    setSelectedType("All Types")
    setStatusFilter("all")
    setTierFilter("all")
    setSortOrder("newest")
  }

  return (
    <div className="space-y-6 p-4 md:p-6 pb-24">
      <PageHeader
        eyebrow="Super Admin Operations"
        title="Businesses Command Center"
        description="Comprehensive directory of every venue and vendor in Pakistan — 360° business inspection, live routing, bulk status management, and real-time controls."
      />

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total businesses" value={total} icon="Building2" />
        <StatCard label="Cities (this page)" value={citiesCount} icon="MapPin" />
        <StatCard label="With pricing (this page)" value={withPricing} icon="Wallet" />
        <StatCard label="Avg capacity (this page)" value={avgCapacity} icon="Users" />
      </div>

      {/* Comprehensive Filter Bar */}
      <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-background p-1 rounded-lg border border-border/60">
            {(
              [
                { key: "all", label: "All Venues" },
                { key: "approved", label: "Approved" },
                { key: "submitted", label: "Unclaimed / OSM" },
                { key: "suspended", label: "Suspended" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === tab.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Order Selector — Newest First by default! */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Icon name="ArrowDown" size={13} /> Sort:
            </span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Facet Dropdowns, Live Search & Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Live Search */}
          <div className="relative flex-1 min-w-[220px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Icon name="Search" size={14} />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search business name, city, ID, area..."
              className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-1"
            />
          </div>

          {/* City Selector */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {CITIES_LIST.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Vendor Type Selector */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {VENDOR_TYPES_LIST.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as any)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Tiers</option>
            <option value="1">Tier 1+ Verified</option>
            <option value="2">Tier 2+ Verified</option>
            <option value="3">Tier 3 (Visited)</option>
          </select>

          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearAllFilters}
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
            >
              <Icon name="X" size={13} /> Reset
            </Button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <DensityToggle />
            <ExportMenu
              selectedIds={selected}
              getRowId={(b) => String(b.id)}
              rows={filteredBusinesses}
              filename="businesses-super-admin"
              columns={[
                { header: "ID", value: (b) => b.id },
                { header: "Business", value: (b) => b.name ?? "" },
                { header: "City", value: (b) => b.city ?? "" },
                { header: "Sub area", value: (b) => b.subArea ?? "" },
                { header: "Type", value: (b) => label(b.subBusinessType) },
                { header: "Status", value: (b) => b.status ?? "submitted" },
                { header: "Max capacity", value: (b) => num(b.maxCapacity) },
                { header: "Min price", value: (b) => num(b.minimumPrice) },
                { header: "Created", value: (b) => fmtDate(b.createdAt) },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <DataTable
        filterQuery={search}
        onClearFilter={() => setSearch("")}
        caption="Businesses"
        columns={columns}
        data={filteredBusinesses}
        getRowId={(b) => String(b.id)}
        loading={isLoading}
        error={isError ? "Couldn't load businesses." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        onRowClick={(b) => open360Drawer(b.id)}
        empty={{
          icon: "Building2",
          title: "No businesses found",
          description: "Try adjusting your city, keyword search, or status filter.",
          action: (
            <Button size="sm" variant="outline" onClick={clearAllFilters}>
              Clear Filters
            </Button>
          ),
        }}
        renderCard={(b) => (
          <div
            className="flex items-center justify-between gap-3 cursor-pointer p-2 hover:bg-muted/30 rounded-lg"
            onClick={() => open360Drawer(b.id)}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                {initials(b.name)}
              </span>
              <div className="min-w-0">
                <div className="truncate font-semibold text-sm">{b.name || "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {cap(b.city)}
                  {num(b.minimumPrice) > 0 ? ` · ${formatPkr(num(b.minimumPrice))}` : ""}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2"
                onClick={(e) => {
                  e.stopPropagation()
                  open360Drawer(b.id)
                }}
              >
                360
              </Button>
            </div>
          </div>
        )}
      />

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <nav
          aria-label="Businesses pagination"
          className="flex flex-wrap items-center justify-between gap-3 text-sm pt-2"
        >
          <p className="text-muted-foreground">
            Page {page} of {totalPages}
            <span className="hidden sm:inline"> · {total.toLocaleString()} businesses total</span>
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
            >
              <Icon name="ChevronLeft" size={14} className="mr-1" /> Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
            >
              Next <Icon name="ChevronRight" size={14} className="ml-1" />
            </Button>
          </div>
        </nav>
      )}

      {/* STICKY BULK ACTIONS BAR (Appears when 1+ businesses are checked) */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-foreground text-background px-4 py-3 rounded-2xl shadow-2xl flex flex-wrap items-center gap-3 border border-border/40 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 pr-2 border-r border-background/20 text-xs font-semibold">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {selected.size}
            </span>
            <span>Selected</span>
          </div>

          {/* Bulk Approve */}
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={bulkStatusMut.isPending}
            onClick={() => bulkStatusMut.mutate("approved")}
          >
            {bulkStatusMut.isPending ? <Spinner size={13} /> : <Icon name="Check" size={14} />}
            Approve All
          </Button>

          {/* Bulk Suspend */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 bg-background/10 text-background border-background/20 hover:bg-background/20"
            disabled={bulkStatusMut.isPending}
            onClick={() => bulkStatusMut.mutate("suspended")}
          >
            {bulkStatusMut.isPending ? <Spinner size={13} /> : <Icon name="Ban" size={14} />}
            Suspend All
          </Button>

          {/* Bulk Restore */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 bg-background/10 text-background border-background/20 hover:bg-background/20"
            disabled={bulkStatusMut.isPending}
            onClick={() => bulkStatusMut.mutate("submitted")}
          >
            {bulkStatusMut.isPending ? <Spinner size={13} /> : <Icon name="RefreshCw" size={14} />}
            Restore All
          </Button>

          {/* Bulk Delete */}
          <Button
            size="sm"
            variant="destructive"
            className="h-8 text-xs gap-1.5"
            onClick={() => setBulkDeleting(true)}
          >
            <Icon name="Trash2" size={14} />
            Delete
          </Button>

          {/* Clear Selection */}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-background/80 hover:text-background hover:bg-background/10"
            onClick={() => setSelected(new Set())}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* 360° Inspection Slide-Over Drawer */}
      <BusinessDetailDrawer
        businessId={selectedBusinessId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onRefreshList={() => refetch()}
      />

      {/* Quick Reassignment Modal */}
      {assignTargetBusiness && (
        <AssignToBusinessModal
          open={!!assignTargetBusiness}
          onOpenChange={(v) => !v && setAssignTargetBusiness(null)}
          lead={{
            id: 0,
            contactName: "Admin Action",
            businessName: assignTargetBusiness.name,
          }}
          onSuccess={() => refetch()}
        />
      )}

      {/* Single Delete Confirmation Alert */}
      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this business?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.name ? `"${deleting.name}"` : "This business"} will be removed from the
              platform. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && removeMut.mutate(deleting.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Alert */}
      <AlertDialog open={bulkDeleting} onOpenChange={setBulkDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {selected.size} businesses?</AlertDialogTitle>
            <AlertDialogDescription>
              All {selected.size} selected businesses will be permanently removed. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDeleteMut.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleteMut.isPending ? "Removing..." : `Remove ${selected.size} Businesses`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default BusinessesAdminRedesignedView
