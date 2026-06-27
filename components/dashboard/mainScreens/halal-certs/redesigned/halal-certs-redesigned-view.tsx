"use client"

/**
 * Halal certificates — redesigned (Track C). Wired to HalalCertAPI.list();
 * rendered through the primitives. Read-only; original screen untouched.
 * Route /dashboard/halal-certs-new.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  HalalCertAPI,
  type HalalCert,
  type CertStatus,
  ISSUING_AUTHORITY_LABELS,
  CERT_STATUS_LABELS,
} from "@/lib/api/halalCerts"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
const fmtDate = (v?: string | null) => {
  if (!v) return "—"
  const d = new Date(v)
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

const STATUS_TONE: Record<CertStatus, StatusTone> = {
  active: "success",
  expiring_soon: "warning",
  pending_renewal: "warning",
  expired: "error",
  revoked: "error",
}

const statusTone = (s?: CertStatus | null): StatusTone => (s ? STATUS_TONE[s] ?? "neutral" : "neutral")
const statusLabel = (s?: CertStatus | null) => (s ? CERT_STATUS_LABELS[s] ?? cap(s) : "—")
const authorityLabel = (c: HalalCert) => ISSUING_AUTHORITY_LABELS[c.issuingAuthority] ?? cap(c.issuingAuthority)
const supplierName = (c: HalalCert) => c.supplier?.name ?? c.supplierNameSnapshot ?? "—"

export function HalalCertsRedesignedView() {
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["halal-certs-redesigned"],
    queryFn: () => HalalCertAPI.list(),
  })

  const all = data?.certs ?? []
  const certs = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((c) =>
      [c.certNumber, c.itemDescription, supplierName(c)].some((v) => (v ?? "").toLowerCase().includes(q)),
    )
  }, [all, search])

  const active = all.filter((c) => c.status === "active").length
  const expiringSoon = all.filter((c) => c.status === "expiring_soon").length
  const expiredOrRevoked = all.filter((c) => c.status === "expired" || c.status === "revoked").length

  const columns: Column<HalalCert>[] = [
    {
      key: "certNumber",
      header: "Cert #",
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Icon name="ShieldCheck" size={16} />
          </span>
          <span className="font-medium">{c.certNumber || "—"}</span>
        </div>
      ),
    },
    { key: "supplier", header: "Supplier", cellClassName: "text-muted-foreground", render: (c) => supplierName(c) },
    {
      key: "item",
      header: "Item",
      cellClassName: "text-muted-foreground",
      render: (c) => c.itemDescription || "—",
    },
    { key: "authority", header: "Authority", cellClassName: "text-muted-foreground", render: (c) => authorityLabel(c) },
    { key: "expiry", header: "Expires", align: "right", cellClassName: "tabular-nums", render: (c) => fmtDate(c.expiryDate) },
    { key: "status", header: "Status", render: (c) => <StatusPill tone={statusTone(c.status)}>{statusLabel(c.status)}</StatusPill> },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Compliance"
        title="Halal certificates"
        description="Supplier halal certificates, authorities and expiry tracking — redesigned, wired to live data."
        actions={<Button><Icon name="Plus" size={16} className="mr-1.5" /> Add certificate</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total certificates" value={all.length} icon="ShieldCheck" />
        <StatCard label="Active" value={active} icon="CheckCircle2" trend="up" />
        <StatCard label="Expiring soon" value={expiringSoon} icon="Clock" trend={expiringSoon > 0 ? "down" : "flat"} />
        <StatCard label="Expired / revoked" value={expiredOrRevoked} icon="AlertTriangle" />
      </div>

      <DataTable
        columns={columns}
        data={certs}
        getRowId={(c) => String(c.id)}
        loading={isLoading}
        error={isError ? "Couldn't load halal certificates." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "ShieldCheck",
          title: "No certificates yet",
          description: "Add supplier halal certificates to track authorities, expiry dates and renewals.",
          action: <Button size="sm"><Icon name="Plus" size={14} className="mr-1" /> Add certificate</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search certificates…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(c) => String(c.id)} rows={certs} filename="halal-certs" columns={[
                { header: "Cert #", value: (c) => c.certNumber ?? "" },
                { header: "Supplier", value: (c) => supplierName(c) },
                { header: "Item", value: (c) => c.itemDescription ?? "" },
                { header: "Authority", value: (c) => authorityLabel(c) },
                { header: "Issued", value: (c) => fmtDate(c.issuedDate) },
                { header: "Expires", value: (c) => fmtDate(c.expiryDate) },
                { header: "Status", value: (c) => statusLabel(c.status) },
              ]} />
            </div>
          </>
        }
        renderCard={(c) => (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Icon name="ShieldCheck" size={16} />
              </span>
              <div className="min-w-0">
                <div className="truncate font-medium">{c.certNumber || "—"}</div>
                <div className="text-xs text-muted-foreground">{supplierName(c)} · exp {fmtDate(c.expiryDate)}</div>
              </div>
            </div>
            <StatusPill tone={statusTone(c.status)}>{statusLabel(c.status)}</StatusPill>
          </div>
        )}
      />
    </div>
  )
}

export default HalalCertsRedesignedView
