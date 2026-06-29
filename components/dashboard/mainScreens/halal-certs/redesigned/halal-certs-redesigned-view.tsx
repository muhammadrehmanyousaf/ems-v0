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
import { RevokeCertDialog, RenewCertDialog } from "@/components/dashboard/mainScreens/halal-certs/redesigned/halal-cert-transition-dialogs"
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
import { cn } from "@/lib/utils"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
const fmtDate = (v?: string | null) => {
  if (!v) return "—"
  const d = new Date(v)
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}
const daysFromNow = (v?: string | null): number | null => {
  if (!v) return null
  const t = new Date(v).getTime()
  if (isNaN(t)) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((t - today.getTime()) / (1000 * 60 * 60 * 24))
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
  const [revoking, setRevoking] = React.useState<HalalCert | null>(null)
  const [renewing, setRenewing] = React.useState<HalalCert | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["halal-certs-redesigned"],
    queryFn: () => HalalCertAPI.list(),
  })
  const { data: expiringData } = useQuery({
    queryKey: ["halal-certs-expiring"],
    queryFn: () => HalalCertAPI.expiring(),
  })
  const { data: businesses } = useQuery({ queryKey: ["my-businesses"], queryFn: () => BusinessesAPI.getUserBusinesses() })
  const businessId = businesses?.[0]?.id
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["halal-certs-redesigned"] })
    qc.invalidateQueries({ queryKey: ["halal-certs-expiring"] })
  }
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
  const expiring = expiringData?.certs ?? []

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
      render: (c) => {
        const canRevoke = c.status !== "revoked"
        const isPendingRenewal = c.status === "pending_renewal"
        const canMarkPending = c.status !== "revoked" && c.status !== "pending_renewal"
        return (
          <div className="flex items-center justify-end gap-0.5">
            {isPendingRenewal && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRenewing(c)}
                aria-label="Renewal received"
                title="Renewal received"
                className="text-emerald-700 hover:text-emerald-800"
              >
                <Icon name="RefreshCw" size={14} />
              </Button>
            )}
            {canMarkPending && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRenewing(c)}
                aria-label="Mark pending renewal"
                title="Mark pending renewal"
              >
                <Icon name="Clock" size={14} className="text-muted-foreground" />
              </Button>
            )}
            {canRevoke && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRevoking(c)}
                aria-label="Revoke certificate"
                title="Revoke certificate"
              >
                <Icon name="ShieldAlert" size={14} className="text-muted-foreground hover:text-destructive" />
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => openEdit(c)} aria-label="Edit certificate" title="Edit"><Icon name="Pencil" size={14} /></Button>
            <Button size="sm" variant="ghost" onClick={() => setDeleting(c)} aria-label="Remove certificate" title="Remove"><Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
          </div>
        )
      },
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

      {expiring.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50/60 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
            <Icon name="AlertTriangle" size={16} />
            {expiring.length} certificate{expiring.length === 1 ? "" : "s"} expiring soon or already expired
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {expiring.slice(0, 6).map((c) => {
              const dueIn = daysFromNow(c.expiryDate)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setRenewing(c)}
                  className="flex flex-col rounded-md border border-amber-200 bg-background px-3 py-2 text-left text-xs transition-colors hover:border-amber-300 hover:bg-amber-50/40 dark:border-amber-500/20"
                >
                  <span className="truncate font-medium">{c.itemDescription || c.certNumber}</span>
                  <span className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span className="truncate">{authorityLabel(c)}</span>
                    <span className={cn("shrink-0 font-semibold", (dueIn ?? 0) < 0 ? "text-red-700 dark:text-red-400" : "text-amber-800 dark:text-amber-300")}>
                      {dueIn != null ? (dueIn < 0 ? `${Math.abs(dueIn)}d overdue` : `${dueIn}d`) : "—"}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

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

      <RevokeCertDialog cert={revoking} onOpenChange={(v) => !v && setRevoking(null)} onSaved={invalidate} />
      <RenewCertDialog cert={renewing} onOpenChange={(v) => !v && setRenewing(null)} onSaved={invalidate} />

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
