"use client"

/**
 * Cheque ledger (PDCs) — redesigned (Track C). Wired to PdcAPI.list(); rendered
 * through the primitives. Read-only; original screen untouched. Route
 * /dashboard/pdcs-new.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PdcAPI, type PostDatedCheque, type PdcStatus } from "@/lib/api/postDatedCheques"
import { PdcFormDialog, PdcTransitionDialog } from "@/components/dashboard/mainScreens/pdcs/redesigned/pdc-dialogs"
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
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)
const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })
}
const TONE: Record<PdcStatus, StatusTone> = {
  held: "info",
  deposited: "warning",
  cleared: "success",
  bounced: "error",
  cancelled: "neutral",
}

export function PdcsRedesignedView() {
  const qc = useQueryClient()
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<PostDatedCheque | undefined>(undefined)
  const [moving, setMoving] = React.useState<PostDatedCheque | undefined>(undefined)
  const [deleting, setDeleting] = React.useState<PostDatedCheque | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["pdcs-redesigned"],
    queryFn: () => PdcAPI.list(),
  })
  const invalidate = () => qc.invalidateQueries({ queryKey: ["pdcs-redesigned"] })
  const openCreate = () => { setEditing(undefined); setDialogOpen(true) }
  const openEdit = (p: PostDatedCheque) => { setEditing(p); setDialogOpen(true) }
  const removeMut = useMutation({
    mutationFn: (id: number) => PdcAPI.remove(id),
    onSuccess: () => { showSuccessToast("Cheque removed"); setDeleting(null); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't remove cheque"),
  })

  const all = data?.pdcs ?? []
  const pdcs = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((p) => [p.chequeNumber, p.bankName, p.customer?.fullName].some((v) => (v ?? "").toLowerCase().includes(q)))
  }, [all, search])

  const heldCount = all.filter((p) => p.status === "held" || p.status === "deposited").length
  const clearedValue = all.filter((p) => p.status === "cleared").reduce((s, p) => s + num(p.amount), 0)
  const bounced = all.filter((p) => p.status === "bounced").length

  const columns: Column<PostDatedCheque>[] = [
    { key: "cheque", header: "Cheque #", render: (p) => <span className="font-medium tabular-nums">{p.chequeNumber}</span> },
    { key: "bank", header: "Bank", cellClassName: "text-muted-foreground", render: (p) => p.bankName || "—" },
    { key: "customer", header: "Customer", cellClassName: "text-muted-foreground", render: (p) => p.customer?.fullName || "—" },
    { key: "chequeDate", header: "Cheque date", cellClassName: "text-muted-foreground", render: (p) => fmtDate(p.chequeDate) },
    { key: "amount", header: "Amount", align: "right", render: (p) => <MoneyCell amount={num(p.amount)} /> },
    { key: "status", header: "Status", render: (p) => <StatusPill tone={TONE[p.status]}>{cap(p.status)}</StatusPill> },
    {
      key: "actions", header: "", align: "right",
      render: (p) => (
        <div className="flex items-center justify-end gap-0.5">
          {(p.status === "held" || p.status === "deposited") && <Button size="sm" variant="ghost" onClick={() => setMoving(p)} aria-label="Update status"><Icon name="RefreshCw" size={14} /></Button>}
          <Button size="sm" variant="ghost" onClick={() => openEdit(p)} aria-label="Edit cheque"><Icon name="Pencil" size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(p)} aria-label="Remove cheque"><Icon name="Trash2" size={14} className="text-muted-foreground hover:text-destructive" /></Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Money"
        title="Cheque ledger"
        description="Post-dated cheques from held to cleared — redesigned, wired to live data."
        actions={<Button onClick={openCreate}><Icon name="Plus" size={16} className="mr-1.5" /> Log a cheque</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total cheques" value={all.length} icon="FileText" />
        <StatCard label="Held / deposited" value={heldCount} icon="Clock" delta="awaiting" />
        <StatCard label="Cleared value" value={formatPkr(clearedValue)} icon="Wallet" trend="up" />
        <StatCard label="Bounced" value={bounced} icon="AlertTriangle" trend={bounced ? "down" : "flat"} delta={bounced ? "follow up" : "none"} />
      </div>

      <DataTable
        columns={columns}
        data={pdcs}
        getRowId={(p) => String(p.id)}
        loading={isLoading}
        error={isError ? "Couldn't load cheques." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "FileText",
          title: "No cheques logged",
          description: "Track every post-dated cheque so you know exactly what's clearing and when.",
          action: <Button size="sm" onClick={openCreate}><Icon name="Plus" size={14} className="mr-1" /> Log a cheque</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search cheques…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(p) => String(p.id)} rows={pdcs} filename="cheques" columns={[
                { header: "Cheque #", value: (p) => p.chequeNumber },
                { header: "Bank", value: (p) => p.bankName ?? "" },
                { header: "Customer", value: (p) => p.customer?.fullName ?? "" },
                { header: "Cheque date", value: (p) => fmtDate(p.chequeDate) },
                { header: "Amount", value: (p) => num(p.amount) },
                { header: "Status", value: (p) => p.status },
              ]} />
            </div>
          </>
        }
        renderCard={(p) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium tabular-nums">{p.chequeNumber}</div>
              <div className="text-xs text-muted-foreground">{p.bankName} · {fmtDate(p.chequeDate)}</div>
              <div className="mt-1"><StatusPill tone={TONE[p.status]}>{cap(p.status)}</StatusPill></div>
            </div>
            <MoneyCell amount={num(p.amount)} className="text-sm font-medium" />
          </div>
        )}
      />

      <PdcFormDialog open={dialogOpen} onOpenChange={setDialogOpen} pdc={editing} onSaved={invalidate} />
      <PdcTransitionDialog open={!!moving} onOpenChange={(v) => !v && setMoving(undefined)} pdc={moving} onSaved={invalidate} />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this cheque?</AlertDialogTitle>
            <AlertDialogDescription>Cheque {deleting?.chequeNumber} will be removed. This can't be undone.</AlertDialogDescription>
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

export default PdcsRedesignedView
