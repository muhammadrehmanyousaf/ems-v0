"use client"

/**
 * Businesses (admin) — redesigned (Track C). Wired to BusinessesAPI.getAll();
 * rendered through the primitives, mirroring the staff redesigned view 1:1.
 * Read-only; original screen untouched. Route /dashboard/businesses-new.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { BusinessesAPI, type ApiBusiness } from "@/lib/api/dashboard"
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
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
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
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["businesses-admin-redesigned"],
    queryFn: () => BusinessesAPI.getAll(1, 100),
  })

  // BusinessesAPI.getAll resolves to an object wrapping the rows. Be defensive
  // about the wrapper key (data vs businesses) so we never silently render empty.
  const all: ApiBusiness[] =
    (data as { businesses?: ApiBusiness[] } | undefined)?.businesses ??
    (data as { data?: ApiBusiness[] } | undefined)?.data ??
    []

  const businesses = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((b) =>
      [b.name, b.city, b.subArea, b.subBusinessType].some((v) => (v ?? "").toLowerCase().includes(q)),
    )
  }, [all, search])

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
        b.subBusinessType ? <StatusPill tone={PILL_TONE}>{cap(b.subBusinessType)}</StatusPill> : <span className="text-muted-foreground">—</span>,
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
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Admin"
        title="Businesses"
        description="Every vendor business on the platform — cities, types, capacity and pricing at a glance."
        actions={<Button><Icon name="Plus" size={16} className="mr-1.5" /> Add business</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total businesses" value={all.length} icon="Building2" />
        <StatCard label="Cities" value={cities} icon="MapPin" />
        <StatCard label="With pricing" value={withPricing} icon="Wallet" />
        <StatCard label="Avg capacity" value={avgCapacity} icon="Users" />
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
          action: <Button size="sm"><Icon name="Plus" size={14} className="mr-1" /> Add business</Button>,
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
                { header: "Type", value: (b) => b.subBusinessType ?? "" },
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
            {b.subBusinessType ? <StatusPill tone={PILL_TONE}>{cap(b.subBusinessType)}</StatusPill> : null}
          </div>
        )}
      />
    </div>
  )
}

export default BusinessesAdminRedesignedView
