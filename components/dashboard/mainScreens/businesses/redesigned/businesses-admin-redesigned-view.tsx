"use client"

/**
 * Businesses (admin) — redesigned (Track C). Wired to BusinessesAPI.getAll();
 * rendered through the primitives, mirroring the staff redesigned view 1:1.
 * Route /dashboard/businesses.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { BusinessesAPI, type ApiBusiness } from "@/lib/api/dashboard"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
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

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)

/**
 * Coerce a display label out of a field that is NOT reliably a string.
 *
 * `subBusinessType` comes back from the API as `string | string[] | null`
 * depending on the vendor type — on live it is an array for venue businesses
 * (`["Marquee"]`) and `[]` for others. An empty array is TRUTHY in JS, so it
 * sailed straight through a `b.subBusinessType ? …` guard into cap(), where
 * `s[0]` was undefined and `.toUpperCase()` threw — taking the whole
 * /dashboard/businesses page down with "We hit an unexpected error". One row
 * (id 3273, "Ali shadi hall") was enough to kill the screen for all 3,272.
 *
 * Same family as the booking `features:null` crash: a falsy-looking value that
 * isn't actually falsy. Normalise first, then decide whether to render.
 */
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
  return isNaN(t.getTime()) ? "—" : t.toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" })
}
const initials = (name?: string | null) =>
  (name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")

// No status enum on businesses — every pill renders as a stable neutral tone.
const PILL_TONE: StatusTone = "neutral"

export function BusinessesAdminRedesignedView() {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [deleting, setDeleting] = React.useState<ApiBusiness | null>(null)
  const invalidate = () => qc.invalidateQueries({ queryKey: ["businesses-admin-redesigned"] })
  const removeMut = useMutation({
    mutationFn: (id: number) => BusinessesAPI.delete(id),
    // The backend blocks deletes that would orphan money (e.g. active bookings)
    // — surface its specific reason rather than a generic failure (WW-095).
    onSuccess: () => { showSuccessToast("Business removed"); setDeleting(null); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't remove business"),
  })

  // Server-side paging. Fetching a flat 100 and printing rows.length reported
  // "Total businesses 100" against a real 3,272 — same page-1 bug as the Users
  // and Vendors screens — and left everything past the 100th unreachable.
  const PAGE_SIZE = 25
  const [page, setPage] = React.useState(1)

  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])
  React.useEffect(() => { setPage(1) }, [debouncedSearch])

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["businesses-admin-redesigned", page, debouncedSearch],
    queryFn: () => BusinessesAPI.getAll(page, PAGE_SIZE, debouncedSearch),
    placeholderData: (prev) => prev,
  })

  // BusinessesAPI.getAll resolves to an object wrapping the rows. Be defensive
  // about the wrapper key (data vs businesses) so we never silently render empty.
  const all: ApiBusiness[] =
    (data as { businesses?: ApiBusiness[] } | undefined)?.businesses ??
    (data as { data?: ApiBusiness[] } | undefined)?.data ??
    []
  const total = data?.pagination?.total ?? 0
  const totalPages = Math.max(data?.pagination?.totalPages ?? 1, 1)

  // The server already applied `q`; keep the local filter only as a no-op guard
  // so a stale page never shows rows that don't match what was typed.
  const businesses = React.useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    if (!q) return all
    return all.filter((b) =>
      // label() not `?? ""` — subBusinessType can be an array, which has no
      // .toLowerCase() and would throw the moment anyone typed in the search box.
      [b.name, b.city, b.subArea, b.subBusinessType].some((v) => label(v).toLowerCase().includes(q)),
    )
  }, [all, debouncedSearch])

  const cities = new Set(all.map((b) => (b.city ?? "").trim().toLowerCase()).filter(Boolean)).size
  const withPricing = all.filter((b) => num(b.minimumPrice) > 0).length
  const capped = all.filter((b) => num(b.maxCapacity) > 0)
  const avgCapacity = capped.length
    ? Math.round(capped.reduce((s, b) => s + num(b.maxCapacity), 0) / capped.length)
    : 0

  const columns: Column<ApiBusiness>[] = [
    {
      key: "name",
      header: "Business",
      render: (b) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(b.name)}</span>
          <span className="font-medium">{b.name || "—"}</span>
        </div>
      ),
    },
    {
      key: "city",
      header: "City",
      render: (b) => (b.city ? <StatusPill tone={PILL_TONE}>{cap(b.city)}</StatusPill> : <span className="text-muted-foreground">—</span>),
    },
    {
      key: "type",
      header: "Type",
      render: (b) =>
        label(b.subBusinessType) ? <StatusPill tone={PILL_TONE}>{cap(b.subBusinessType)}</StatusPill> : <span className="text-muted-foreground">—</span>,
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
      header: "Min price",
      align: "right",
      render: (b) => (num(b.minimumPrice) > 0 ? <MoneyCell amount={num(b.minimumPrice)} /> : <span className="text-muted-foreground">—</span>),
    },
    {
      key: "actions", header: "", align: "right",
      render: (b) => (
        <Button size="sm" variant="ghost" onClick={() => setDeleting(b)} aria-label="Remove business"><Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Admin"
        title="Businesses"
        description="Every vendor business on the platform — cities, types, capacity and pricing at a glance."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* "Total businesses" is platform-wide from pagination.total. The rest
            are derived from the loaded page and labelled as such — the endpoint
            has no aggregate for them. */}
        <StatCard label="Total businesses" value={total} icon="Building2" />
        <StatCard label="Cities (this page)" value={cities} icon="MapPin" />
        <StatCard label="With pricing (this page)" value={withPricing} icon="Wallet" />
        <StatCard label="Avg capacity (this page)" value={avgCapacity} icon="Users" />
      </div>

      <DataTable
        columns={columns}
        data={businesses}
        getRowId={(b) => String(b.id)}
        loading={isLoading}
        error={isError ? "Couldn't load businesses." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Building2",
          title: "No businesses yet",
          description: "Vendor businesses appear here once vendors complete their profiles.",
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search businesses…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(b) => String(b.id)} rows={businesses} filename="businesses" columns={[
                { header: "Business", value: (b) => b.name ?? "" },
                { header: "City", value: (b) => b.city ?? "" },
                { header: "Sub area", value: (b) => b.subArea ?? "" },
                { header: "Type", value: (b) => label(b.subBusinessType) },
                { header: "Max capacity", value: (b) => num(b.maxCapacity) },
                { header: "Min capacity", value: (b) => num(b.minCapacity) },
                { header: "Min price", value: (b) => num(b.minimumPrice) },
                { header: "Created", value: (b) => fmtDate(b.createdAt) },
              ]} />
            </div>
          </>
        }
        renderCard={(b) => (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials(b.name)}</span>
              <div className="min-w-0">
                <div className="truncate font-medium">{b.name || "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {cap(b.city)}
                  {num(b.minimumPrice) > 0 ? ` · ${formatPkr(num(b.minimumPrice))}` : ""}
                </div>
              </div>
            </div>
            {label(b.subBusinessType) ? <StatusPill tone={PILL_TONE}>{cap(b.subBusinessType)}</StatusPill> : null}
          </div>
        )}
      />

      {/* Without this, only the first page of 3,272 businesses was reachable. */}
      {totalPages > 1 && (
        <nav aria-label="Businesses pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">
            Page {page} of {totalPages}
            <span className="hidden sm:inline"> · {total.toLocaleString()} businesses</span>
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || isLoading}>
              <Icon name="ChevronLeft" size={14} className="mr-1" /> Previous
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || isLoading}>
              Next <Icon name="ChevronRight" size={14} className="ml-1" />
            </Button>
          </div>
        </nav>
      )}

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this business?</AlertDialogTitle>
            <AlertDialogDescription>{deleting?.name ? `"${deleting.name}"` : "This business"} will be removed. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && removeMut.mutate(deleting.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default BusinessesAdminRedesignedView
