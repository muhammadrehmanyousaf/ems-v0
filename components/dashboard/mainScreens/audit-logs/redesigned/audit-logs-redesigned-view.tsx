"use client"

/**
 * Audit logs — redesigned (Track C). Wired to listAuditLogs() from
 * lib/api/adminQueue. Read-only; original screen untouched.
 * Route /dashboard/admin/audit-logs-new.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { listAuditLogs, type AuditLog } from "@/lib/api/adminQueue"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill } from "@/components/dashboard/primitives/status-pill"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/[_.]/g, " ") : "—")
const fmtDate = (v?: string | null) => {
  if (!v) return "—"
  const d = new Date(v)
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}
const initials = (name: string) => (name || "?").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")

const isToday = (v?: string | null) => {
  if (!v) return false
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return false
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

const actorLabel = (l: AuditLog) => (l.actorUserId != null ? `User #${l.actorUserId}` : "System")
const targetLabel = (l: AuditLog) =>
  l.targetType ? `${cap(l.targetType)}${l.targetId != null ? ` #${l.targetId}` : ""}` : "—"

export function AuditLogsRedesignedView() {
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["audit-logs-redesigned"],
    queryFn: () => listAuditLogs({}),
  })

  const all = data?.logs ?? []
  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((l) =>
      [l.action, l.targetType, actorLabel(l), targetLabel(l)].some((v) => (v ?? "").toLowerCase().includes(q))
    )
  }, [all, search])

  const total = num(data?.count) || all.length
  const todayCount = all.filter((l) => isToday(l.at)).length
  const distinctActions = new Set(all.map((l) => l.action).filter(Boolean)).size
  const distinctActors = new Set(all.map((l) => (l.actorUserId != null ? l.actorUserId : "system"))).size

  const columns: Column<AuditLog>[] = [
    {
      key: "action",
      header: "Action / Event",
      render: (l) => <StatusPill tone="neutral">{cap(l.action)}</StatusPill>,
    },
    {
      key: "actor",
      header: "Actor",
      render: (l) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {l.actorUserId != null ? initials(actorLabel(l)) : "SY"}
          </span>
          <span className="font-medium">{actorLabel(l)}</span>
        </div>
      ),
    },
    { key: "target", header: "Target", cellClassName: "text-muted-foreground", render: (l) => targetLabel(l) },
    { key: "when", header: "When", cellClassName: "text-muted-foreground tabular-nums", render: (l) => fmtDate(l.at) },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Admin"
        title="Audit logs"
        description="Every admin and system action — who did what, to which record, and when. Read-only, wired to live data."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total entries" value={isLoading ? "…" : total} icon="FileText" />
        <StatCard label="Today" value={isLoading ? "…" : todayCount} icon="Calendar" trend="up" />
        <StatCard label="Distinct actions" value={isLoading ? "…" : distinctActions} icon="Activity" />
        <StatCard label="Distinct actors" value={isLoading ? "…" : distinctActors} icon="Users" />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(l) => String(l.id)}
        loading={isLoading}
        error={isError ? "Couldn't load audit logs." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "FileText",
          title: "No audit entries yet",
          description: "Admin and system actions will appear here as they happen.",
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
                placeholder="Search logs…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(l) => String(l.id)}
                rows={rows}
                filename="audit-logs"
                columns={[
                  { header: "Action", value: (l) => l.action ?? "" },
                  { header: "Actor", value: (l) => actorLabel(l) },
                  { header: "Target type", value: (l) => l.targetType ?? "" },
                  { header: "Target id", value: (l) => (l.targetId != null ? l.targetId : "") },
                  { header: "When", value: (l) => fmtDate(l.at) },
                ]}
              />
            </div>
          </>
        }
        renderCard={(l) => (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {l.actorUserId != null ? initials(actorLabel(l)) : "SY"}
              </span>
              <div className="min-w-0">
                <div className="truncate font-medium">{cap(l.action)}</div>
                <div className="text-xs text-muted-foreground">
                  {actorLabel(l)} · {targetLabel(l)} · {fmtDate(l.at)}
                </div>
              </div>
            </div>
            <StatusPill tone="neutral">{cap(l.targetType)}</StatusPill>
          </div>
        )}
      />
    </div>
  )
}

export default AuditLogsRedesignedView
