"use client"

/**
 * Automation rules — redesigned (Track C). Wired to AutomationRulesAPI.list();
 * rendered through the shared primitives. Read-only; original screen untouched.
 * Route /dashboard/automation-new.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { AutomationRulesAPI, type AutomationRule } from "@/lib/api/automationRules"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill } from "@/components/dashboard/primitives/status-pill"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0)
const cap = (s?: string | null) => (s ? s[0].toUpperCase() + s.slice(1).replace(/_/g, " ") : "—")
const fmtDate = (v?: string | null) => {
  if (!v) return "—"
  const d = new Date(v)
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

const triggerLabel = (r: AutomationRule) => {
  const days = num(r?.offsetDays)
  const unit = days === 1 ? "day" : "days"
  if (r?.triggerType === "days_before_event") return `${days} ${unit} before event`
  if (r?.triggerType === "days_after_event") return `${days} ${unit} after event`
  return cap(r?.triggerType)
}

export function AutomationRedesignedView() {
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["automation-redesigned"],
    queryFn: () => AutomationRulesAPI.list(),
  })

  const all = data?.rules ?? []
  const rules = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((r) =>
      [r?.name, r?.message, r?.triggerType].some((v) => (v ?? "").toLowerCase().includes(q)),
    )
  }, [all, search])

  const activeCount = all.filter((r) => r?.enabled).length
  const pausedCount = all.filter((r) => !r?.enabled).length
  const beforeCount = all.filter((r) => r?.triggerType === "days_before_event").length

  const columns: Column<AutomationRule>[] = [
    {
      key: "name",
      header: "Rule",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Icon name="Zap" size={15} />
          </span>
          <span className="font-medium">{r?.name || "Untitled rule"}</span>
        </div>
      ),
    },
    { key: "trigger", header: "Trigger", cellClassName: "text-muted-foreground", render: (r) => triggerLabel(r) },
    { key: "offset", header: "Offset (days)", align: "right", cellClassName: "tabular-nums", render: (r) => num(r?.offsetDays) },
    { key: "action", header: "Action", render: (r) => <StatusPill tone="info">{cap(r?.actionType)}</StatusPill> },
    { key: "lastRun", header: "Last run", cellClassName: "text-muted-foreground", render: (r) => fmtDate(r?.lastRunAt) },
    { key: "status", header: "Status", render: (r) => <StatusPill tone={r?.enabled ? "success" : "neutral"}>{r?.enabled ? "Active" : "Paused"}</StatusPill> },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Grow"
        title="Automation rules"
        description="No-code reminders that fire around your events — redesigned, wired to live data."
        actions={<Button><Icon name="Plus" size={16} className="mr-1.5" /> New rule</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total rules" value={all.length} icon="Settings" />
        <StatCard label="Active" value={activeCount} icon="Zap" trend="up" />
        <StatCard label="Paused" value={pausedCount} icon="Clock" />
        <StatCard label="Before event" value={beforeCount} icon="Calendar" />
      </div>

      <DataTable
        columns={columns}
        data={rules}
        getRowId={(r) => String(r?.id)}
        loading={isLoading}
        error={isError ? "Couldn't load automation rules." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Settings",
          title: "No automation rules yet",
          description: "Create a rule like “N days before any event → notify me” to stay ahead of your bookings.",
          action: <Button size="sm"><Icon name="Plus" size={14} className="mr-1" /> New rule</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search rules…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(r) => String(r?.id)} rows={rules} filename="automation-rules" columns={[
                { header: "Name", value: (r) => r?.name ?? "" },
                { header: "Trigger", value: (r) => triggerLabel(r) },
                { header: "Offset days", value: (r) => num(r?.offsetDays) },
                { header: "Action", value: (r) => r?.actionType ?? "" },
                { header: "Message", value: (r) => r?.message ?? "" },
                { header: "Last run", value: (r) => fmtDate(r?.lastRunAt) },
                { header: "Enabled", value: (r) => (r?.enabled ? "Yes" : "No") },
              ]} />
            </div>
          </>
        }
        renderCard={(r) => (
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <Icon name="Zap" size={15} />
              </span>
              <div className="min-w-0">
                <div className="truncate font-medium">{r?.name || "Untitled rule"}</div>
                <div className="text-xs text-muted-foreground">{triggerLabel(r)} · {cap(r?.actionType)}</div>
              </div>
            </div>
            <StatusPill tone={r?.enabled ? "success" : "neutral"}>{r?.enabled ? "Active" : "Paused"}</StatusPill>
          </div>
        )}
      />
    </div>
  )
}

export default AutomationRedesignedView
