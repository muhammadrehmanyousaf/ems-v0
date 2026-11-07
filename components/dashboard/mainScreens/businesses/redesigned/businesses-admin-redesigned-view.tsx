"use client"

/**
 * Businesses (admin) — Enterprise Command Center.
 * Full 360° inspection, multi-facet filtering (City, Category, Status),
 * lead/booking assignment, and lifecycle controls.
 * Route: /dashboard/businesses
 */

import * as React from "react"
import Link from "next/link"
import { errorMessage } from "@/lib/utils/api-error"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { BusinessesAPI, type ApiBusiness } from "@/lib/api/dashboard"
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
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { BusinessDetailDrawer } from "@/components/dashboard/admin/businesses/BusinessDetailDrawer"
import { AssignToBusinessModal } from "@/components/dashboard/admin/assignment/AssignToBusinessModal"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)

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

export function BusinessesAdminRedesignedView() {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [selectedCity, setSelectedCity] = React.useState("All Cities")
  const [selectedType, setSelectedType] = React.useState("All Types")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "approved" | "submitted" | "suspended">("all")

  // Drawer & Modals state
  const [selectedBusinessId, setSelectedBusinessId] = React.useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [assignTargetBusiness, setAssignTargetBusiness] = React.useState<ApiBusiness | null>(null)

  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [deleting, setDeleting] = React.useState<ApiBusiness | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ["businesses-admin-redesigned"] })

  const removeMut = useMutation({
    mutationFn: (id: number) => BusinessesAPI.delete(id),
    onSuccess: () => {
      showSuccessToast("Business removed")
      setDeleting(null)
      invalidate()
    },
    onError: (e: any) => toast.error(errorMessage(e, "Couldn't remove business")),
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
  }, [debouncedSearch, selectedCity, selectedType, statusFilter])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["businesses-admin-redesigned", page, debouncedSearch],
    queryFn: () => BusinessesAPI.getAll(page, PAGE_SIZE, debouncedSearch),
    placeholderData: (prev) => prev,
  })

  const all: ApiBusiness[] =
    (data as { businesses?: ApiBusiness[] } | undefined)?.businesses ??
    (data as { data?: ApiBusiness[] } | undefined)?.data ??
    []
  const total = data?.pagination?.total ?? 0
  const totalPages = Math.max(data?.pagination?.totalPages ?? 1, 1)

  // Multi-facet filtering on loaded dataset
  const filteredBusinesses = React.useMemo(() => {
    let list = all
    const q = debouncedSearch.toLowerCase()
    if (q) {
      list = list.filter((b) =>
        [b.name, b.city, b.subArea, b.subBusinessType].some((v) =>
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

    return list
  }, [all, debouncedSearch, selectedCity, selectedType, statusFilter])

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
        const bizSlug = ((("slug" in b && b.slug) ? String(b.slug) : b.name) || "venue").toLowerCase().replace(/[^a-z0-9]+/g, "-")
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
      render: (b) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1"
            onClick={() => open360Drawer(b.id)}
          >
            <Icon name="Eye" size={13} />
            360 View
          </Button>

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
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Super Admin Portal"
        title="Businesses Command Center"
        description="Every venue and vendor in Pakistan — 360° business inspection, live leads routing, booking assignment, and capacity analytics."
      />

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total businesses" value={total} icon="Building2" />
        <StatCard label="Cities (this page)" value={citiesCount} icon="MapPin" />
        <StatCard label="With pricing (this page)" value={withPricing} icon="Wallet" />
        <StatCard label="Avg capacity (this page)" value={avgCapacity} icon="Users" />
      </div>

      {/* Facet Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/20 p-3 rounded-xl border border-border/60">
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
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                statusFilter === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dropdowns & Search Controls */}
        <div className="flex flex-wrap items-center gap-2">
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

          <DensityToggle />
          <ExportMenu
            selectedIds={selected}
            getRowId={(b) => String(b.id)}
            rows={filteredBusinesses}
            filename="businesses-enterprise"
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
          title: "No businesses match your filters",
          description: "Try resetting city, category, or search keywords.",
        }}
        toolbar={
          <div className="relative w-full max-w-sm">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Icon name="Search" size={15} />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search business name, city, area..."
              className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2"
            />
          </div>
        }
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

      {/* Delete Confirmation Alert */}
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
    </div>
  )
}

export default BusinessesAdminRedesignedView
