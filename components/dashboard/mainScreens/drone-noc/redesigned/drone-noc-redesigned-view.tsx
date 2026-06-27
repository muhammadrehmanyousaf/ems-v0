"use client"

/**
 * Drone NOC permits — redesigned (Track C). Wired to DroneNocAPI.list();
 * rendered through the primitives. Read-only; original screen untouched.
 * Route /dashboard/drone-noc-new.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  DroneNocAPI,
  type DroneNOC,
  type PermitStatus,
  PERMIT_STATUS_LABELS,
  PERMIT_TYPE_LABELS,
  PERMIT_AUTHORITY_LABELS,
} from "@/lib/api/droneNoc"
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

const STATUS_TONE: Record<PermitStatus, StatusTone> = {
  approved: "success",
  pending: "warning",
  expiring_soon: "warning",
  rejected: "error",
  expired: "error",
  cancelled: "neutral",
}

const statusLabel = (s?: PermitStatus | null) => (s ? PERMIT_STATUS_LABELS[s] ?? cap(s) : "—")
const typeLabel = (p: DroneNOC) => PERMIT_TYPE_LABELS[p.permitType] ?? cap(p.permitType)
const authorityLabel = (p: DroneNOC) => PERMIT_AUTHORITY_LABELS[p.issuingAuthority] ?? cap(p.issuingAuthority)

export function DroneNocRedesignedView() {
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["drone-noc-redesigned"],
    queryFn: () => DroneNocAPI.list(),
  })

  const all = data?.permits ?? []
  const permits = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((p) =>
      [p.referenceNumber, p.pilotName, p.droneRegNumber, p.venueAddress].some((v) =>
        (v ?? "").toLowerCase().includes(q),
      ),
    )
  }, [all, search])

  const approved = all.filter((p) => p.status === "approved").length
  const attention = all.filter((p) => p.status === "pending" || p.status === "expiring_soon").length
  const feesPaid = all.reduce((sum, p) => sum + num(p.feePaid), 0)

  const columns: Column<DroneNOC>[] = [
    {
      key: "reference",
      header: "Reference",
      render: (p) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Icon name="ShieldCheck" size={16} />
          </span>
          <div className="min-w-0">
            <span className="font-medium">{p.referenceNumber || "—"}</span>
            <div className="text-xs text-muted-foreground">{typeLabel(p)}</div>
          </div>
        </div>
      ),
    },
    { key: "authority", header: "Authority", cellClassName: "text-muted-foreground", render: (p) => authorityLabel(p) },
    { key: "pilot", header: "Pilot", cellClassName: "text-muted-foreground", render: (p) => p.pilotName || "—" },
    { key: "validUntil", header: "Valid until", cellClassName: "text-muted-foreground", render: (p) => fmtDate(p.validUntil) },
    {
      key: "fee",
      header: "Fee paid",
      align: "right",
      cellClassName: "tabular-nums",
      render: (p) => <MoneyCell amount={p.feePaid == null ? null : num(p.feePaid)} />,
    },
    {
      key: "status",
      header: "Status",
      render: (p) => <StatusPill tone={STATUS_TONE[p.status] ?? "neutral"}>{statusLabel(p.status)}</StatusPill>,
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Compliance"
        title="Drone NOC permits"
        description="Aerial-shoot No-Objection Certificates, authorities and validity — redesigned, wired to live data."
        actions={<Button><Icon name="Plus" size={16} className="mr-1.5" /> Add permit</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total permits" value={all.length} icon="ShieldCheck" />
        <StatCard label="Approved" value={approved} icon="CheckCircle2" trend="up" />
        <StatCard label="Needs attention" value={attention} icon="AlertTriangle" />
        <StatCard label="Fees paid" value={formatPkr(feesPaid)} icon="Wallet" />
      </div>

      <DataTable
        columns={columns}
        data={permits}
        getRowId={(p) => String(p.id)}
        loading={isLoading}
        error={isError ? "Couldn't load permits." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        bulkActions={() => <Button size="sm" variant="outline">Export selected</Button>}
        empty={{
          icon: "ShieldCheck",
          title: "No permits yet",
          description: "Track your drone NOCs, issuing authorities and validity windows so aerial shoots stay compliant.",
          action: <Button size="sm"><Icon name="Plus" size={14} className="mr-1" /> Add permit</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search permits…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu rows={permits} filename="drone-noc-permits" columns={[
                { header: "Reference", value: (p) => p.referenceNumber ?? "" },
                { header: "Type", value: (p) => typeLabel(p) },
                { header: "Authority", value: (p) => authorityLabel(p) },
                { header: "Pilot", value: (p) => p.pilotName ?? "" },
                { header: "Drone reg #", value: (p) => p.droneRegNumber ?? "" },
                { header: "Valid from", value: (p) => p.validFrom ?? "" },
                { header: "Valid until", value: (p) => p.validUntil ?? "" },
                { header: "Fee paid", value: (p) => num(p.feePaid) },
                { header: "Status", value: (p) => statusLabel(p.status) },
              ]} />
            </div>
          </>
        }
        renderCard={(p) => (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Icon name="ShieldCheck" size={16} />
              </span>
              <div className="min-w-0">
                <div className="truncate font-medium">{p.referenceNumber || "—"}</div>
                <div className="text-xs text-muted-foreground">{authorityLabel(p)} · {fmtDate(p.validUntil)}</div>
              </div>
            </div>
            <StatusPill tone={STATUS_TONE[p.status] ?? "neutral"}>{statusLabel(p.status)}</StatusPill>
          </div>
        )}
      />
    </div>
  )
}

export default DroneNocRedesignedView
