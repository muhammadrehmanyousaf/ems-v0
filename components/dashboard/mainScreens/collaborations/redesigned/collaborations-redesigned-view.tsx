"use client"

/**
 * Collaborations — redesigned (Track C). Wired to CollaborationsAPI.incoming();
 * rendered through the primitives. Read-only; original screen untouched.
 * Route /dashboard/collaborations-new.
 */

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { CollaborationsAPI, type CollabInvite, type CollabStatus } from "@/lib/api/collaborations"
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
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
}

const STATUS_TONE: Record<CollabStatus, StatusTone> = {
  accepted: "success",
  pending: "warning",
  declined: "error",
  cancelled: "neutral",
}

const counterpartName = (c: CollabInvite) =>
  c.toVendor?.fullName || c.toNameSnapshot || c.toPhone || c.toEmail || "—"

export function CollaborationsRedesignedView() {
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["collaborations-redesigned"],
    queryFn: () => CollaborationsAPI.incoming(),
  })

  const all = data ?? []
  const invites = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((c) =>
      [c.fromName, counterpartName(c), c.eventLabel].some((v) => (v ?? "").toLowerCase().includes(q)),
    )
  }, [all, search])

  const pending = all.filter((c) => c.status === "pending").length
  const accepted = all.filter((c) => c.status === "accepted").length
  const agreedTotal = all.reduce((sum, c) => sum + num(c.agreedAmount), 0)

  const columns: Column<CollabInvite>[] = [
    {
      key: "event",
      header: "Event",
      render: (c) => <span className="font-medium">{c.eventLabel || "Untitled collaboration"}</span>,
    },
    { key: "from", header: "From", cellClassName: "text-muted-foreground", render: (c) => c.fromName || c.fromVendor?.fullName || "—" },
    { key: "with", header: "With", cellClassName: "text-muted-foreground", render: (c) => counterpartName(c) },
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
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Grow"
        title="Collaborations"
        description="Invites to team up with other Wedding Wala vendors on events — redesigned, wired to live data."
        actions={<Button><Icon name="Plus" size={16} className="mr-1.5" /> Invite vendor</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total invites" value={all.length} icon="Users" />
        <StatCard label="Pending" value={pending} icon="Clock" trend="flat" />
        <StatCard label="Accepted" value={accepted} icon="CheckCircle2" trend="up" />
        <StatCard label="Agreed value" value={formatPkr(agreedTotal)} icon="Wallet" />
      </div>

      <DataTable
        columns={columns}
        data={invites}
        getRowId={(c) => String(c.id)}
        loading={isLoading}
        error={isError ? "Couldn't load collaborations." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Users",
          title: "No collaborations yet",
          description: "Invite another Wedding Wala vendor to team up on an event — they accept or decline, and agreed amounts are tracked here.",
          action: <Button size="sm"><Icon name="Plus" size={14} className="mr-1" /> Invite vendor</Button>,
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
              <ExportMenu selectedIds={selected} getRowId={(c) => String(c.id)} rows={invites} filename="collaborations" columns={[
                { header: "Event", value: (c) => c.eventLabel ?? "" },
                { header: "From", value: (c) => c.fromName ?? "" },
                { header: "With", value: (c) => counterpartName(c) },
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
                {counterpartName(c)} · {formatPkr(num(c.agreedAmount))}
              </div>
            </div>
            <StatusPill tone={STATUS_TONE[c.status] ?? "neutral"}>{cap(c.status)}</StatusPill>
          </div>
        )}
      />
    </div>
  )
}

export default CollaborationsRedesignedView
