"use client"

/**
 * Halal certificates — redesigned (Track C). Wired to HalalCertAPI.list();
 * rendered through the primitives. Read-only; original screen untouched.
 * Route /dashboard/halal-certs-new.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  HalalCertAPI,
  type HalalCert,
  type CertStatus,
  ISSUING_AUTHORITY_LABELS,
  CERT_STATUS_LABELS,
} from "@/lib/api/halalCerts"
import { BusinessesAPI } from "@/lib/api/dashboard"
import { HalalCertFormDialog } from "@/components/dashboard/mainScreens/halal-certs/redesigned/halal-cert-form-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
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
  const qc = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<HalalCert | undefined>(undefined)
  const [deleting, setDeleting] = React.useState<HalalCert | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["halal-certs-redesigned"],
    queryFn: () => HalalCertAPI.list(),
  })
  const { data: businesses } = useQuery({ queryKey: ["my-businesses"], queryFn: () => BusinessesAPI.getUserBusinesses() })
  const businessId = businesses?.[0]?.id
  const invalidate = () => qc.invalidateQueries({ queryKey: ["halal-certs-redesigned"] })
  const openCreate = () => { setEditing(undefined); setDialogOpen(true) }
  const openEdit = (c: HalalCert) => { setEditing(c); setDialogOpen(true) }
  const removeMut = useMutation({
    mutationFn: (id: number) => HalalCertAPI.remove(id),
    onSuccess: () => { showSuccessToast("Certificate removed"); setDeleting(null); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't remove certificate"),
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
    {
      key: "actions", header: "", align: "right",
      render: (c) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button size="sm" variant="ghost" onClick={() => openEdit(c)} aria-label="Edit certificate"><Icon name="Pencil" size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(c)} aria-label="Remove certificate"><Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Compliance"
        title="Halal certificates"
        description="Supplier halal certificates, authorities and expiry tracking — redesigned, wired to live data."
        actions={<Button onClick={openCreate}><Icon name="Plus" size={16} className="mr-1.5" /> Add certificate</Button>}
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
          action: <Button size="sm" onClick={openCreate}><Icon name="Plus" size={14} className="mr-1" /> Add certificate</Button>,
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

      <HalalCertFormDialog open={dialogOpen} onOpenChange={setDialogOpen} cert={editing} businessId={businessId} onSaved={invalidate} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this certificate?</AlertDialogTitle>
            <AlertDialogDescription>{deleting?.certNumber} will be removed. This can't be undone.</AlertDialogDescription>
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

export default HalalCertsRedesignedView
