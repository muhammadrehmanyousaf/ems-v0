"use client"

/**
 * Promote — redesigned (Track C). Wired to PromotionsAPI.listMine(); rendered
 * through the primitives. Read-only; original screen untouched.
 * Route /dashboard/promote-new.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  PromotionsAPI,
  PLACEMENT_LABEL,
  type PromotionRequestRow,
  type PromotionStatus,
} from "@/lib/api/promotions"
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
const fmtDate = (v?: string | null) => {
  if (!v) return "—"
  const d = new Date(v)
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}

const placementLabel = (r: PromotionRequestRow) =>
  (r.placement && PLACEMENT_LABEL[r.placement]) || cap(r.placement)

const STATUS_TONE: Record<PromotionStatus, StatusTone> = {
  approved: "success",
  pending: "warning",
  rejected: "error",
  expired: "error",
  cancelled: "neutral",
}

const statusTone = (s?: PromotionStatus | null): StatusTone =>
  (s && STATUS_TONE[s]) || "neutral"

export function PromoteRedesignedView() {
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["promote-redesigned"],
    queryFn: () => PromotionsAPI.listMine(),
  })

  const all = data?.requests ?? []
  const requests = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((r) =>
      [r.business?.name, placementLabel(r), r.note, r.status].some((v) =>
        (v ?? "").toString().toLowerCase().includes(q),
      ),
    )
  }, [all, search])

  const pending = all.filter((r) => r.status === "pending").length
  const active = all.filter((r) => r.status === "approved").length
  const quotedTotal = all.reduce((sum, r) => sum + num(r.priceQuoted), 0)

  const columns: Column<PromotionRequestRow>[] = [
    {
      key: "business",
      header: "Business",
      render: (r) => <span className="font-medium">{r.business?.name || `#${r.businessId}`}</span>,
    },
    {
      key: "placement",
      header: "Placement",
      cellClassName: "text-muted-foreground",
      render: (r) => placementLabel(r),
    },
    {
      key: "window",
      header: "Window",
      cellClassName: "text-muted-foreground",
      render: (r) => (num(r.windowDays) > 0 ? `${num(r.windowDays)} days` : "—"),
    },
    {
      key: "price",
      header: "Quoted",
      align: "right",
      render: (r) => <MoneyCell amount={r.priceQuoted == null ? null : num(r.priceQuoted)} />,
    },
    {
      key: "createdAt",
      header: "Requested",
      cellClassName: "text-muted-foreground",
      render: (r) => fmtDate(r.createdAt),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusPill tone={statusTone(r.status)}>{cap(r.status)}</StatusPill>,
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Grow"
        title="Promote"
        description="Your featured-placement requests — redesigned, wired to live data."
        actions={<Button><Icon name="Plus" size={16} className="mr-1.5" /> Request placement</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total requests" value={all.length} icon="Megaphone" />
        <StatCard label="Pending" value={pending} icon="Clock" trend={pending > 0 ? "up" : undefined} />
        <StatCard label="Active" value={active} icon="ShieldCheck" />
        <StatCard label="Quoted (total)" value={formatPkr(quotedTotal)} icon="Wallet" />
      </div>

      <DataTable
        columns={columns}
        data={requests}
        getRowId={(r) => String(r.id)}
        loading={isLoading}
        error={isError ? "Couldn't load promotions." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Megaphone",
          title: "No placement requests yet",
          description: "Request a featured placement to boost your business on the homepage, category, city or search.",
          action: <Button size="sm"><Icon name="Plus" size={14} className="mr-1" /> Request placement</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search promotions…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu rows={requests} filename="promotions" columns={[
                { header: "Business", value: (r) => r.business?.name ?? `#${r.businessId}` },
                { header: "Placement", value: (r) => placementLabel(r) },
                { header: "Window (days)", value: (r) => num(r.windowDays) },
                { header: "Quoted", value: (r) => num(r.priceQuoted) },
                { header: "Status", value: (r) => r.status ?? "" },
                { header: "Requested", value: (r) => fmtDate(r.createdAt) },
                { header: "Note", value: (r) => r.note ?? "" },
              ]} />
            </div>
          </>
        }
        renderCard={(r) => (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{r.business?.name || `#${r.businessId}`}</div>
              <div className="text-xs text-muted-foreground">
                {placementLabel(r)} · {r.priceQuoted == null ? "—" : formatPkr(num(r.priceQuoted))}
              </div>
            </div>
            <StatusPill tone={statusTone(r.status)}>{cap(r.status)}</StatusPill>
          </div>
        )}
      />
    </div>
  )
}

export default PromoteRedesignedView
