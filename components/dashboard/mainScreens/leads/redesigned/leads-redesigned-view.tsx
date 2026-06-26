"use client"

/**
 * Leads — redesigned (Track C). Wired to the real LeadAPI.list() and rendered
 * through the primitives. Read-only presentation; the original Leads inbox is
 * untouched. Mounted at /dashboard/leads-new.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { LeadAPI, type Lead, type LeadStatus } from "@/lib/api/leads"
import { PageHeader } from "@/components/dashboard/primitives/page-header"
import { StatCard } from "@/components/dashboard/primitives/stat-card"
import { DataTable, type Column } from "@/components/dashboard/primitives/data-table"
import { StatusPill, type StatusTone } from "@/components/dashboard/primitives/status-pill"
import { MoneyCell } from "@/components/dashboard/primitives/money-cell"
import { ExportMenu } from "@/components/dashboard/shared/export-menu"
import { DensityToggle } from "@/components/dashboard/primitives/density-toggle"
import { Icon } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"

const TONE: Record<LeadStatus, StatusTone> = {
  new: "info",
  contacted: "warning",
  qualified: "info",
  quoted: "warning",
  booked: "success",
  lost: "error",
  archived: "neutral",
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)
const pretty = (s?: string | null) => (s ? cap(s.replace(/_/g, " ")) : "—")

const fmtDate = (s?: string | null) => {
  if (!s) return "—"
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-PK", { day: "2-digit", month: "short" })
}

export function LeadsRedesignedView() {
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["leads-redesigned"],
    queryFn: () => LeadAPI.list(),
  })

  const all = data?.leads ?? []
  const leads = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((l) =>
      [l.contactName, l.contactPhone, l.inquiry, l.eventType].some((v) => (v ?? "").toLowerCase().includes(q)),
    )
  }, [all, search])

  const byStatus = data?.summary?.byStatus ?? {}
  const count = (s: LeadStatus) => byStatus[s] ?? all.filter((l) => l.status === s).length

  const columns: Column<Lead>[] = [
    { key: "contact", header: "Contact", render: (l) => <span className="font-medium">{l.contactName || "Unknown"}</span> },
    { key: "phone", header: "Phone", cellClassName: "text-muted-foreground", render: (l) => l.contactPhone || "—" },
    { key: "source", header: "Source", render: (l) => <StatusPill tone="neutral">{pretty(l.source)}</StatusPill> },
    { key: "event", header: "Event", cellClassName: "text-muted-foreground", render: (l) => pretty(l.eventType) },
    { key: "date", header: "Event date", cellClassName: "text-muted-foreground", render: (l) => fmtDate(l.eventDate) },
    { key: "budget", header: "Budget", align: "right", render: (l) => <MoneyCell amount={l.estimatedBudget != null ? Number(l.estimatedBudget) || null : null} tone="muted" /> },
    { key: "status", header: "Status", render: (l) => <StatusPill tone={TONE[l.status]}>{cap(l.status)}</StatusPill> },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Operate"
        title="Leads"
        description="Every inquiry in one inbox — redesigned, wired to live data."
        actions={<Button><Icon name="Plus" size={16} className="mr-1.5" /> Log a lead</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total leads" value={all.length} icon="Inbox" />
        <StatCard label="New" value={count("new")} icon="Sparkles" />
        <StatCard label="Qualified" value={count("qualified")} icon="ShieldCheck" />
        <StatCard label="Booked" value={count("booked")} icon="CheckCircle2" trend="up" delta="converted" />
      </div>

      <DataTable
        columns={columns}
        data={leads}
        getRowId={(l) => String(l.id)}
        loading={isLoading}
        error={isError ? "Couldn't load leads." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        bulkActions={() => (
          <>
            <Button size="sm" variant="outline">Mark contacted</Button>
            <Button size="sm" variant="outline">Archive</Button>
          </>
        )}
        empty={{
          icon: "Inbox",
          title: "No leads yet",
          description: "WhatsApp, walk-in, phone and form inquiries all land here so none slip through.",
          action: <Button size="sm"><Icon name="Plus" size={14} className="mr-1" /> Log a lead</Button>,
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
                placeholder="Search leads…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu
                rows={leads}
                filename="leads"
                columns={[
                  { header: "Contact", value: (l) => l.contactName ?? "" },
                  { header: "Phone", value: (l) => l.contactPhone ?? "" },
                  { header: "Source", value: (l) => pretty(l.source) },
                  { header: "Event", value: (l) => pretty(l.eventType) },
                  { header: "Event date", value: (l) => fmtDate(l.eventDate) },
                  { header: "Budget", value: (l) => (l.estimatedBudget != null ? Number(l.estimatedBudget) || 0 : 0) },
                  { header: "Status", value: (l) => l.status },
                ]}
              />
            </div>
          </>
        }
        renderCard={(l) => (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{l.contactName || "Unknown"}</div>
              <div className="text-xs text-muted-foreground">{pretty(l.source)} · {pretty(l.eventType)} · {fmtDate(l.eventDate)}</div>
              <div className="mt-1"><StatusPill tone={TONE[l.status]}>{cap(l.status)}</StatusPill></div>
            </div>
            <MoneyCell amount={l.estimatedBudget != null ? Number(l.estimatedBudget) || null : null} tone="muted" className="text-sm" />
          </div>
        )}
      />
    </div>
  )
}

export default LeadsRedesignedView
