"use client"

/**
 * Drone NOC permits — redesigned (Track C). Wired to DroneNocAPI.list();
 * rendered through the primitives. 
 * Route /dashboard/drone-noc.
 */

import * as React from "react"
import { useRecordBusinessId } from "@/hooks/use-record-business-id"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  DroneNocAPI,
  type DroneNOC,
  type PermitStatus,
  PERMIT_STATUS_LABELS,
  PERMIT_TYPE_LABELS,
  PERMIT_AUTHORITY_LABELS,
} from "@/lib/api/droneNoc"
import { BusinessesAPI } from "@/lib/api/dashboard"
import { PermitFormDialog } from "@/components/dashboard/mainScreens/drone-noc/redesigned/permit-form-dialog"
import {
  PermitReasonDialog,
  PermitConfirmTransitionDialog,
  canApprove,
  canReject,
  canResubmit,
  canCancel,
} from "@/components/dashboard/mainScreens/drone-noc/redesigned/permit-status-dialog"
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

export function DroneNocRedesignedView({ adminCapable = true }: { adminCapable?: boolean } = {}) {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<DroneNOC | undefined>(undefined)
  const [deleting, setDeleting] = React.useState<DroneNOC | null>(null)
  const [approving, setApproving] = React.useState<DroneNOC | null>(null)
  const [rejecting, setRejecting] = React.useState<DroneNOC | null>(null)
  const [cancelling, setCancelling] = React.useState<DroneNOC | null>(null)
  const [resubmitting, setResubmitting] = React.useState<DroneNOC | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["drone-noc-redesigned"],
    queryFn: () => DroneNocAPI.list(),
  })
  const { data: businesses } = useQuery({ queryKey: ["my-businesses"], queryFn: () => BusinessesAPI.getUserBusinesses() })
  /**
   * WWL-293/311/332/350 — this was `businesses?.[0]?.id`, so under "All venues"
   * a new record landed on whichever venue happened to be first in the array,
   * silently. The hook returns undefined rather than guessing when there is no
   * right answer; the create dialog then asks.
   */
  const businessId = useRecordBusinessId()
  const invalidate = () => qc.invalidateQueries({ queryKey: ["drone-noc-redesigned"] })
  const openCreate = () => { setEditing(undefined); setDialogOpen(true) }
  const openEdit = (p: DroneNOC) => { setEditing(p); setDialogOpen(true) }
  const removeMut = useMutation({
    mutationFn: (id: number) => DroneNocAPI.remove(id),
    onSuccess: () => { showSuccessToast("Permit removed"); setDeleting(null); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't remove permit"),
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
    /**
     * WWL-344 — five captured fields were columns in nothing: valid-from, drone
     * registration, pilot licence, venue/area and drone model. The search
     * matches `droneRegNumber` and `venueAddress`, so searching either filtered
     * the table down to rows that never showed the thing being searched for.
     *
     * WWL-355 — the pilot licence is the field an inspector asks for, and it
     * was captured, stored, and absent from both the table and the export.
     */
    {
      key: "pilot",
      header: "Pilot",
      cellClassName: "text-muted-foreground",
      render: (p) => (
        <div className="min-w-0">
          <div className="truncate">{p.pilotName || "—"}</div>
          {p.pilotLicense && <div className="truncate text-xs">Licence {p.pilotLicense}</div>}
        </div>
      ),
    },
    {
      key: "drone",
      header: "Drone",
      cellClassName: "text-muted-foreground",
      render: (p) => (
        <div className="min-w-0">
          <div className="truncate">{p.droneModel || "—"}</div>
          {p.droneRegNumber && <div className="truncate text-xs">Reg {p.droneRegNumber}</div>}
        </div>
      ),
    },
    { key: "venue", header: "Venue / area", cellClassName: "max-w-[200px] truncate text-muted-foreground", render: (p) => p.venueAddress || "—" },
    { key: "validFrom", header: "Valid from", cellClassName: "text-muted-foreground", render: (p) => fmtDate(p.validFrom) },
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
    {
      key: "actions", header: "", align: "right",
      render: (p) => (
        <div className="flex items-center justify-end gap-0.5">
          {adminCapable && canApprove(p.status) && (
            <Button size="sm" variant="ghost" onClick={() => setApproving(p)} aria-label="Approve permit" className="text-emerald-600 hover:text-emerald-700"><Icon name="CheckCircle2" size={14} /></Button>
          )}
          {adminCapable && canReject(p.status) && (
            <Button size="sm" variant="ghost" onClick={() => setRejecting(p)} aria-label="Reject permit" className="text-destructive hover:text-destructive"><Icon name="XSquare" size={14} /></Button>
          )}
          {canResubmit(p.status) && (
            <Button size="sm" variant="ghost" onClick={() => setResubmitting(p)} aria-label="Resubmit permit"><Icon name="RefreshCw" size={14} /></Button>
          )}
          {canCancel(p.status) && (
            <Button size="sm" variant="ghost" onClick={() => setCancelling(p)} aria-label="Cancel permit"><Icon name="XCircle" size={14} /></Button>
          )}
          {/**
            * WWL-345 — Edit and Remove rendered on EVERY status, approved
            * included. The backend guards only the status field
            * (`delete patch.status`), so an approved permit's reference number
            * and validity window could be rewritten afterwards with no trace.
            * A permit is a document an authority issued; once approved, the
            * way to change it is a fresh application, not a quiet edit.
            */}
          {p.status !== "approved" && (
            <Button size="sm" variant="ghost" onClick={() => openEdit(p)} aria-label={`Edit permit ${p.referenceNumber}`}><Icon name="Pencil" size={14} /></Button>
          )}
          {p.status !== "approved" && (
            <Button size="sm" variant="ghost" onClick={() => setDeleting(p)} aria-label={`Remove permit ${p.referenceNumber}`}><Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Compliance"
        title="Drone NOC permits"
        description="Aerial-shoot No-Objection Certificates, authorities and validity."
        actions={<Button onClick={openCreate}><Icon name="Plus" size={16} className="mr-1.5" /> Add permit</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total permits" value={all.length} icon="ShieldCheck" />
        <StatCard label="Approved" value={approved} icon="CheckCircle2" trend="up" />
        <StatCard label="Needs attention" value={attention} icon="AlertTriangle" />
        <StatCard label="Fees paid" value={formatPkr(feesPaid)} icon="Wallet" error={isError} />
      </div>

      <DataTable
        filterQuery={search}
        onClearFilter={() => setSearch("")}
        caption="Drone NOC permits"
        columns={columns}
        data={permits}
        getRowId={(p) => String(p.id)}
        loading={isLoading}
        error={isError ? "Couldn't load permits." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "ShieldCheck",
          title: "No permits yet",
          description: "Track your drone NOCs, issuing authorities and validity windows so aerial shoots stay compliant.",
          action: <Button size="sm" onClick={openCreate}><Icon name="Plus" size={14} className="mr-1" /> Add permit</Button>,
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
              <ExportMenu selectedIds={selected} getRowId={(p) => String(p.id)} rows={permits} filename="drone-noc-permits" columns={[
                { header: "Reference", value: (p) => p.referenceNumber ?? "" },
                { header: "Type", value: (p) => typeLabel(p) },
                { header: "Authority", value: (p) => authorityLabel(p) },
                { header: "Pilot", value: (p) => p.pilotName ?? "" },
                // WWL-355 — the licence is the field an inspector asks for. It
                // was captured, stored, and missing from the export.
                { header: "Pilot licence", value: (p) => p.pilotLicense ?? "" },
                { header: "Drone model", value: (p) => p.droneModel ?? "" },
                { header: "Drone reg #", value: (p) => p.droneRegNumber ?? "" },
                { header: "Venue / area", value: (p) => p.venueAddress ?? "" },
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

      <PermitFormDialog open={dialogOpen} onOpenChange={setDialogOpen} permit={editing} businessId={businessId} onSaved={invalidate} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this permit?</AlertDialogTitle>
            <AlertDialogDescription>{deleting?.referenceNumber} will be removed. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && removeMut.mutate(deleting.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve (pending → approved) — admin-capable */}
      <PermitConfirmTransitionDialog
        permit={approving}
        to="approved"
        title="Approve permit?"
        description={`Marking #${approving?.referenceNumber ?? ""} as approved. PCAA reference + cert dates should already be filled in.`}
        confirmLabel="Approve"
        successMessage="Permit approved"
        onOpenChange={(v) => !v && setApproving(null)}
        onSaved={invalidate}
      />

      {/* Reject (pending → rejected) — admin-capable, reason required */}
      <PermitReasonDialog
        permit={rejecting}
        action="rejected"
        title="Reject permit"
        description="Capture the reason PCAA / Home Dept refused (drone weight, restricted airspace, missing paperwork)."
        onOpenChange={(v) => !v && setRejecting(null)}
        onSaved={invalidate}
      />

      {/* Cancel (approved / expiring_soon / expired → cancelled) — reason required */}
      <PermitReasonDialog
        permit={cancelling}
        action="cancelled"
        title="Cancel permit"
        description="Capture why this approved permit is being cancelled (event called off, rescheduled, withdrawn)."
        onOpenChange={(v) => !v && setCancelling(null)}
        onSaved={invalidate}
      />

      {/* Resubmit (rejected / cancelled → pending) */}
      <PermitConfirmTransitionDialog
        permit={resubmitting}
        to="pending"
        title="Resubmit permit?"
        description={`Move #${resubmitting?.referenceNumber ?? ""} back to pending so it can be re-reviewed.`}
        confirmLabel="Resubmit"
        successMessage="Marked pending — resubmit"
        onOpenChange={(v) => !v && setResubmitting(null)}
        onSaved={invalidate}
      />
    </div>
  )
}

export default DroneNocRedesignedView
