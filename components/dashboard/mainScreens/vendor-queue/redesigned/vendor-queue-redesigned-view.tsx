"use client"

/**
 * Vendor queue — redesigned (admin). Wired to listVendorQueue() (a FUNCTION,
 * not a class), now driven by a status filter so every lifecycle state is
 * viewable. Per-status admin actions (approve / request changes / reject /
 * suspend / restore) reuse the ported action dialog
 * (./vendor-queue-action-dialog) which calls the SAME backend API the original
 * screen calls. The original screen is untouched. Route
 * /dashboard/admin/vendor-queue-new.
 */

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  listVendorQueue,
  type QueueBusiness,
  type BusinessStatus,
} from "@/lib/api/adminQueue"
import { showSuccessToast } from "@/lib/toast/undo"
import { toast } from "sonner"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon, type IconName } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import {
  VendorQueueActionDialog,
  runAction,
  type ActionKind,
  type PendingAction,
} from "./vendor-queue-action-dialog"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
const fmtDate = (v?: string | null) => {
  if (!v) return "—"
  const d = new Date(v)
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}
const initials = (name?: string | null) =>
  (name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")

const STATUS_TONE: Record<BusinessStatus, StatusTone> = {
  draft: "neutral",
  submitted: "info",
  approved: "success",
  rejected: "error",
  suspended: "warning",
}
const statusTone = (s?: string | null): StatusTone =>
  STATUS_TONE[(s as BusinessStatus)] ?? "neutral"

/** The status tabs, in lifecycle order (mirrors the original screen's tabs). */
const STATUS_TABS: { value: BusinessStatus; label: string }[] = [
  { value: "submitted", label: "Awaiting review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
  { value: "draft", label: "Drafts" },
]

/** Success copy per action (drives the undo-style success toast). */
const SUCCESS_COPY: Record<ActionKind, string> = {
  approve: "Vendor approved",
  reject: "Vendor rejected",
  request_changes: "Changes requested",
  suspend: "Vendor suspended",
  restore: "Vendor restored",
}

/** Per-action button glyph + label (icon names verified in the Icon map). */
const ACTION_BTN: Record<ActionKind, { icon: IconName; label: string }> = {
  approve: { icon: "Check", label: "Approve" },
  request_changes: { icon: "MessageSquare", label: "Changes" },
  reject: { icon: "XCircle", label: "Reject" },
  suspend: { icon: "Clock", label: "Suspend" },
  restore: { icon: "Play", label: "Restore" },
}

/** Which actions are offered for each status (mirrors the original screen). */
function actionsFor(status: BusinessStatus): ActionKind[] {
  switch (status) {
    case "submitted":
      return ["approve", "request_changes", "reject"]
    case "draft":
      return ["approve"]
    case "approved":
      return ["suspend"]
    case "suspended":
      return ["restore"]
    default:
      return []
  }
}

export function VendorQueueRedesignedView() {
  const qc = useQueryClient()
  const [statusTab, setStatusTab] = React.useState<BusinessStatus>("submitted")
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [pending, setPending] = React.useState<PendingAction | null>(null)

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["vendor-queue-redesigned"] })

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["vendor-queue-redesigned", statusTab],
    queryFn: () => listVendorQueue(statusTab),
  })

  const actionMut = useMutation({
    mutationFn: ({ kind, id, notes }: { kind: ActionKind; id: number; notes?: string }) =>
      runAction(kind, id, notes),
    onSuccess: (_res, vars) => {
      showSuccessToast(SUCCESS_COPY[vars.kind])
      setPending(null)
      invalidate()
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message || e?.message || "Action failed"),
  })

  const confirmAction = (notes: string | undefined) => {
    if (!pending) return
    actionMut.mutate({ kind: pending.kind, id: pending.business.id, notes })
  }

  const all = data?.businesses ?? []
  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((r) =>
      [r.name, r.city, r.vendor?.fullName, r.vendor?.email, r.vendor?.vendorType, r.status].some((v) =>
        (v ?? "").toString().toLowerCase().includes(q),
      ),
    )
  }, [all, search])

  const avgCompleteness = all.length
    ? Math.round(all.reduce((sum, r) => sum + num(r.completenessScore), 0) / all.length)
    : 0
  const tabLabel = STATUS_TABS.find((t) => t.value === statusTab)?.label ?? cap(statusTab)

  const renderActions = (r: QueueBusiness) => {
    const kinds = actionsFor(r.status)
    if (kinds.length === 0) return <span className="text-xs text-muted-foreground">—</span>
    return (
      <div className="flex items-center justify-end gap-1">
        {kinds.map((kind) => {
          const { icon, label } = ACTION_BTN[kind]
          const isReject = kind === "reject"
          return (
            <Button
              key={kind}
              size="sm"
              variant={kind === "approve" || kind === "restore" ? "outline" : "ghost"}
              disabled={actionMut.isPending}
              onClick={() => setPending({ kind, business: r })}
            >
              <Icon
                name={icon}
                size={14}
                className={
                  kind === "approve"
                    ? "mr-1 text-emerald-600"
                    : isReject
                      ? "mr-1 text-destructive"
                      : "mr-1 text-muted-foreground"
                }
              />
              {label}
            </Button>
          )
        })}
      </div>
    )
  }

  const columns: Column<QueueBusiness>[] = [
    {
      key: "name",
      header: "Business",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials(r.name)}
          </span>
          <span className="font-medium">{r.name}</span>
        </div>
      ),
    },
    {
      key: "vendor",
      header: "Vendor",
      cellClassName: "text-muted-foreground",
      render: (r) => r.vendor?.fullName || "—",
    },
    { key: "city", header: "City", cellClassName: "text-muted-foreground", render: (r) => r.city || "—" },
    {
      key: "completeness",
      header: "Completeness",
      align: "right",
      cellClassName: "tabular-nums",
      render: (r) => `${num(r.completenessScore)}%`,
    },
    { key: "createdAt", header: "Submitted", cellClassName: "text-muted-foreground", render: (r) => fmtDate(r.createdAt) },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusPill tone={statusTone(r.status)}>{cap(r.status)}</StatusPill>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: renderActions,
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Admin"
        title="Vendor queue"
        description="Vendor businesses across their lifecycle — filter by status, review completeness, and approve, request changes, reject, suspend or restore. Wired to live data."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={tabLabel} value={isLoading ? "…" : rows.length} icon="Building2" />
        <StatCard label="Avg completeness" value={isLoading ? "…" : `${avgCompleteness}%`} icon="TrendingUp" />
        <StatCard label="Total in view" value={isLoading ? "…" : data?.count ?? all.length} icon="FileText" />
        <StatCard label="Filtered" value={isLoading ? "…" : rows.length} icon="Filter" />
      </div>

      {/* Status tabs — pass the chosen status straight to listVendorQueue. */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border">
        {STATUS_TABS.map((t) => {
          const active = t.value === statusTab
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setStatusTab(t.value)}
              aria-pressed={active}
              className={
                "relative -mb-px rounded-t-md px-3 py-2 text-sm font-medium transition-colors " +
                (active
                  ? "border-b-2 border-primary text-foreground"
                  : "border-b-2 border-transparent text-muted-foreground hover:text-foreground")
              }
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(r) => String(r.id)}
        loading={isLoading}
        error={isError ? "Couldn't load the vendor queue." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Building2",
          title: "Nothing here",
          description: `No vendor businesses are in "${tabLabel.toLowerCase()}" right now.`,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search queue…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(r) => String(r.id)}
                rows={rows}
                filename="vendor-queue"
                columns={[
                  { header: "Business", value: (r) => r.name },
                  { header: "Vendor", value: (r) => r.vendor?.fullName ?? "" },
                  { header: "Email", value: (r) => r.vendor?.email ?? "" },
                  { header: "Vendor type", value: (r) => r.vendor?.vendorType ?? "" },
                  { header: "City", value: (r) => r.city ?? "" },
                  { header: "Completeness", value: (r) => num(r.completenessScore) },
                  { header: "Verification tier", value: (r) => num(r.verificationTier) },
                  { header: "Submitted", value: (r) => r.createdAt ?? "" },
                  { header: "Status", value: (r) => r.status ?? "" },
                ]}
              />
            </div>
          </>
        }
        renderCard={(r) => (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initials(r.name)}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(r.vendor?.fullName || "—")} · {num(r.completenessScore)}% · {r.city || "—"}
                  </div>
                </div>
              </div>
              <StatusPill tone={statusTone(r.status)}>{cap(r.status)}</StatusPill>
            </div>
            {actionsFor(r.status).length > 0 && <div>{renderActions(r)}</div>}
          </div>
        )}
      />

      <VendorQueueActionDialog
        pending={pending}
        submitting={actionMut.isPending}
        onCancel={() => setPending(null)}
        onConfirm={confirmAction}
      />
    </div>
  )
}

export default VendorQueueRedesignedView
