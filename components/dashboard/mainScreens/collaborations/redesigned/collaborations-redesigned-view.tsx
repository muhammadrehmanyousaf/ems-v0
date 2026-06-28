"use client"

/**
 * Collaborations — redesigned (Track C). Wired to CollaborationsAPI for both
 * directions: Incoming (invites to you — Accept/Decline) and Outgoing (invites
 * you sent — Cancel). Rendered through the redesign primitives. Original screen
 * untouched. Route /dashboard/collaborations-new.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CollaborationsAPI, type CollabInvite, type CollabStatus } from "@/lib/api/collaborations"
import { InviteVendorDialog } from "@/components/dashboard/mainScreens/collaborations/redesigned/invite-vendor-dialog"
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
import { cn } from "@/lib/utils"

type Direction = "incoming" | "outgoing"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
const fmtDate = (v?: string | null) => {
  if (!v) return "—"
  const d = new Date(v)
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
}

const STATUS_TONE: Record<CollabStatus, StatusTone> = {
  accepted: "success",
  pending: "warning",
  declined: "error",
  cancelled: "neutral",
}

/** Who the current vendor is collaborating WITH, by direction. */
const counterpartName = (c: CollabInvite, dir: Direction) =>
  dir === "incoming"
    ? c.fromVendor?.fullName || c.fromName || "A vendor"
    : c.toVendor?.fullName || c.toNameSnapshot || c.toPhone || c.toEmail || "—"

export function CollaborationsRedesignedView() {
  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [tab, setTab] = React.useState<Direction>("incoming")
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [cancelTarget, setCancelTarget] = React.useState<CollabInvite | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ["collaborations-redesigned"] })

  const acceptMut = useMutation({
    mutationFn: (id: number) => CollaborationsAPI.accept(id),
    onSuccess: () => { showSuccessToast("Invite accepted"); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't accept"),
  })
  const declineMut = useMutation({
    mutationFn: (id: number) => CollaborationsAPI.decline(id),
    onSuccess: () => { showSuccessToast("Invite declined"); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't decline"),
  })
  const cancelMut = useMutation({
    mutationFn: (id: number) => CollaborationsAPI.cancel(id),
    onSuccess: () => { showSuccessToast("Invite cancelled"); setCancelTarget(null); invalidate() },
    onError: (e: any) => toast.error(e?.response?.data?.message || e?.message || "Couldn't cancel invite"),
  })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["collaborations-redesigned"],
    queryFn: async () => {
      const [incoming, outgoing] = await Promise.all([
        CollaborationsAPI.incoming(),
        CollaborationsAPI.outgoing(),
      ])
      return { incoming, outgoing }
    },
  })

  const incoming = data?.incoming ?? []
  const outgoing = data?.outgoing ?? []

  // Reset selection whenever the active tab changes (row ids are not unique across tabs).
  React.useEffect(() => { setSelected(new Set()) }, [tab])

  const rows = tab === "incoming" ? incoming : outgoing
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((c) =>
      [counterpartName(c, tab), c.eventLabel, c.scope].some((v) => (v ?? "").toLowerCase().includes(q)),
    )
  }, [rows, search, tab])

  // Stat cards reflect BOTH directions.
  const allInvites = React.useMemo(() => [...incoming, ...outgoing], [incoming, outgoing])
  const pending = allInvites.filter((c) => c.status === "pending").length
  const accepted = allInvites.filter((c) => c.status === "accepted").length
  const agreedTotal = allInvites.reduce((sum, c) => sum + num(c.agreedAmount), 0)

  const withHeader = tab === "incoming" ? "From" : "To"

  const columns: Column<CollabInvite>[] = [
    {
      key: "event",
      header: "Event",
      render: (c) => <span className="font-medium">{c.eventLabel || "Untitled collaboration"}</span>,
    },
    {
      key: "with",
      header: withHeader,
      cellClassName: "text-muted-foreground",
      render: (c) => (
        <span>
          {counterpartName(c, tab)}
          {tab === "outgoing" && !c.toUserId && (
            <span className="ml-1 text-[11px] italic">· not on Wedding Wala yet</span>
          )}
        </span>
      ),
    },
    { key: "scope", header: "Scope", cellClassName: "text-muted-foreground", render: (c) => cap(c.scope) },
    {
      key: "amount",
      header: "Agreed amount",
      align: "right",
      render: (c) => <MoneyCell amount={num(c.agreedAmount)} />,
    },
    { key: "created", header: "Sent", cellClassName: "text-muted-foreground", render: (c) => fmtDate(c.createdAt) },
    {
      key: "status",
      header: "Status",
      render: (c) => <StatusPill tone={STATUS_TONE[c.status] ?? "neutral"}>{cap(c.status)}</StatusPill>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) => {
        if (c.status !== "pending") return <span className="text-xs text-muted-foreground">—</span>
        if (tab === "incoming") {
          return (
            <div className="flex items-center justify-end gap-1">
              <Button size="sm" variant="outline" disabled={acceptMut.isPending} onClick={() => acceptMut.mutate(c.id)}>
                <Icon name="Check" size={14} className="mr-1" /> Accept
              </Button>
              <Button size="sm" variant="ghost" disabled={declineMut.isPending} onClick={() => declineMut.mutate(c.id)} aria-label="Decline">
                <Icon name="XCircle" size={14} className="text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          )
        }
        return (
          <div className="flex items-center justify-end gap-1">
            <Button size="sm" variant="ghost" disabled={cancelMut.isPending} onClick={() => setCancelTarget(c)} aria-label="Cancel invite">
              <Icon name="XCircle" size={14} className="mr-1 text-muted-foreground hover:text-destructive" /> Cancel
            </Button>
          </div>
        )
      },
    },
  ]

  const tabBtn = (id: Direction, label: string, count: number) => (
    <button
      key={id}
      type="button"
      onClick={() => setTab(id)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        tab === id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
      aria-pressed={tab === id}
    >
      {label}
      <span className={cn(
        "rounded-full px-1.5 text-[11px] tabular-nums",
        tab === id ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
      )}>{count}</span>
    </button>
  )

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Grow"
        title="Collaborations"
        description="Invites to team up with other Wedding Wala vendors on events — incoming and outgoing, wired to live data."
        actions={<Button onClick={() => setDialogOpen(true)}><Icon name="Plus" size={16} className="mr-1.5" /> Invite vendor</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total invites" value={allInvites.length} icon="Users" />
        <StatCard label="Pending" value={pending} icon="Clock" trend="flat" />
        <StatCard label="Accepted" value={accepted} icon="CheckCircle2" trend="up" />
        <StatCard label="Agreed value" value={formatPkr(agreedTotal)} icon="Wallet" />
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 w-fit">
        {tabBtn("incoming", "Invites to you", incoming.length)}
        {tabBtn("outgoing", "Invites you sent", outgoing.length)}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        getRowId={(c) => String(c.id)}
        loading={isLoading}
        error={isError ? "Couldn't load collaborations." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Users",
          title: tab === "incoming" ? "No invites to you yet" : "No invites sent yet",
          description:
            tab === "incoming"
              ? "When another Wedding Wala vendor invites you onto an event, it'll show up here to accept or decline."
              : "Invite another Wedding Wala vendor to team up on an event — they accept or decline, and agreed amounts are tracked here.",
          action: <Button size="sm" onClick={() => setDialogOpen(true)}><Icon name="Plus" size={14} className="mr-1" /> Invite vendor</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search collaborations…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(c) => String(c.id)} rows={filtered} filename="collaborations" columns={[
                { header: "Event", value: (c) => c.eventLabel ?? "" },
                { header: withHeader, value: (c) => counterpartName(c, tab) },
                { header: "Scope", value: (c) => c.scope ?? "" },
                { header: "Agreed amount", value: (c) => num(c.agreedAmount) },
                { header: "Sent", value: (c) => c.createdAt ?? "" },
                { header: "Status", value: (c) => c.status ?? "" },
              ]} />
            </div>
          </>
        }
        renderCard={(c) => (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{c.eventLabel || "Untitled collaboration"}</div>
              <div className="text-xs text-muted-foreground">
                {counterpartName(c, tab)} · {formatPkr(num(c.agreedAmount))}
              </div>
            </div>
            <StatusPill tone={STATUS_TONE[c.status] ?? "neutral"}>{cap(c.status)}</StatusPill>
          </div>
        )}
      />

      <InviteVendorDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={invalidate} />

      <AlertDialog open={!!cancelTarget} onOpenChange={(v) => { if (!v) setCancelTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this invite?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget
                ? `The invite to ${counterpartName(cancelTarget, "outgoing")}${cancelTarget.eventLabel ? ` for "${cancelTarget.eventLabel}"` : ""} will be withdrawn. This can't be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMut.isPending}>Keep invite</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); if (cancelTarget) cancelMut.mutate(cancelTarget.id) }}
              disabled={cancelMut.isPending}
            >
              {cancelMut.isPending ? "Cancelling…" : "Cancel invite"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default CollaborationsRedesignedView
