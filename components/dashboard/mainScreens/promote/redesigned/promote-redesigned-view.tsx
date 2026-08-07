"use client"

/**
 * Promote — redesigned (Track C). Wired to PromotionsAPI.listMine(); rendered
 * through the primitives. 
 * Route /dashboard/promote.
 */

import * as React from "react"
import { useActiveBusinessId } from "@/lib/store/active-business-store"
import { useRecordBusinessId } from "@/hooks/use-record-business-id"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  PromotionsAPI,
  PLACEMENT_LABEL,
  type PromotionRequestRow,
  type PromotionStatus,
} from "@/lib/api/promotions"
import { BusinessesAPI } from "@/lib/api/dashboard"
import { PromoteRequestDialog } from "@/components/dashboard/mainScreens/promote/redesigned/promote-request-dialog"
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

const placementLabel = (r: PromotionRequestRow) =>
  (r.placement && PLACEMENT_LABEL[r.placement]) || cap(r.placement)

/**
 * WWL-424 — `rejected` and `expired` were both "error", so an admin declining a
 * paid request and a placement that simply ran its course rendered in the same
 * red. Only the text told them apart. A refusal is a problem to act on; a
 * finished placement is a completed purchase.
 */
const STATUS_TONE: Record<PromotionStatus, StatusTone> = {
  approved: "success",
  pending: "warning",
  rejected: "error",
  expired: "neutral",
  cancelled: "neutral",
}

const statusTone = (s?: PromotionStatus | null): StatusTone =>
  (s && STATUS_TONE[s]) || "neutral"

/**
 * WWL-419 — nothing on this screen said whether a placement WORKED, or even
 * whether it is running. "Approved" and "running today" are different facts and
 * the row showed only the first.
 */
const isLiveNow = (r: PromotionRequestRow): boolean => {
  if (r.status !== "approved") return false
  const now = Date.now()
  const from = r.startsAt ? new Date(r.startsAt).getTime() : null
  const to = r.endsAt ? new Date(r.endsAt).getTime() : null
  if (from != null && Number.isFinite(from) && now < from) return false
  if (to != null && Number.isFinite(to) && now > to) return false
  return from != null || to != null
}

export function PromoteRedesignedView() {
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const activeBusinessId = useActiveBusinessId()

  const qc = useQueryClient()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const { data, isLoading, isError, refetch } = useQuery({
    // WWL-421 — the venue belongs in the key now that the server scopes on it.
    queryKey: ["promote-redesigned", activeBusinessId],
    queryFn: () => PromotionsAPI.listMine(),
  })
  const { data: businesses } = useQuery({ queryKey: ["my-businesses"], queryFn: () => BusinessesAPI.getUserBusinesses() })
  /**
   * WWL-293/311/332/350 — this was `businesses?.[0]?.id`, so under "All venues"
   * a new record landed on whichever venue happened to be first in the array,
   * silently. The hook returns undefined rather than guessing when there is no
   * right answer; the create dialog then asks.
   */
  const businessId = useRecordBusinessId()
  const invalidate = () => qc.invalidateQueries({ queryKey: ["promote-redesigned"] })

  const all = data?.requests ?? []
  const pricing = data?.pricing ?? []
  const requests = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return all
    return all.filter((r) =>
      [r.business?.name, placementLabel(r), r.note, r.status].some((v) =>
        (v ?? "").toString().toLowerCase().includes(q),
      ),
    )
  }, [all, search])

  const pending = all.filter((r) => r.status === "pending").length
  const active = all.filter((r) => r.status === "approved").length
  /**
   * WWL-418 — this summed `priceQuoted` across EVERY row and every status, so a
   * request an admin refused, a request the vendor withdrew and a placement
   * that ran three months ago all added to one number. It is not spend, not
   * commitment and not owed. Only live money counts: approved placements are
   * committed, pending ones are quoted and not yet agreed, and the two are
   * different questions so they get different cards.
   */
  const committedTotal = all
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + num(r.priceQuoted), 0)
  const pendingTotal = all
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + num(r.priceQuoted), 0)

  const columns: Column<PromotionRequestRow>[] = [
    {
      key: "business",
      header: "Business",
      render: (r) => <span className="font-medium">{r.business?.name || `#${r.businessId}`}</span>,
    },
    {
      key: "placement",
      header: "Placement",
      cellClassName: "text-muted-foreground",
      render: (r) => placementLabel(r),
    },
    {
      key: "window",
      header: "Window",
      cellClassName: "text-muted-foreground",
      render: (r) => (num(r.windowDays) > 0 ? `${num(r.windowDays)} days` : "—"),
    },
    {
      key: "price",
      header: "Quoted",
      align: "right",
      render: (r) => <MoneyCell amount={r.priceQuoted == null ? null : num(r.priceQuoted)} />,
    },
    {
      key: "createdAt",
      header: "Requested",
      cellClassName: "text-muted-foreground",
      render: (r) => fmtDate(r.createdAt),
    },
    /**
     * WWL-417 — `startsAt`, `endsAt`, `rejectionReason` and `decidedAt` all
     * arrive on every row and none had a column. Two things followed. A
     * REJECTED request rendered the word "Rejected" and nothing else, while the
     * admin's reason sat on the payload and was reachable only from a
     * notification. And a vendor with an APPROVED placement could not see when
     * it starts, when it ends, or whether they are featured right now — the end
     * date appeared only in the approval notification.
     */
    {
      key: "runs",
      header: "Runs",
      cellClassName: "text-muted-foreground",
      render: (r) =>
        r.startsAt || r.endsAt ? (
          <span className="whitespace-nowrap">
            {fmtDate(r.startsAt)} → {fmtDate(r.endsAt)}
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => {
        const live = isLiveNow(r)
        return (
          <div className="min-w-0">
            <StatusPill tone={statusTone(r.status)}>{cap(r.status)}</StatusPill>
            {live && (
              <div className="mt-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                Featured right now
              </div>
            )}
            {r.status === "rejected" && r.rejectionReason && (
              <div className="mt-0.5 max-w-[240px] text-[11px] text-muted-foreground" title={r.rejectionReason}>
                {r.rejectionReason}
              </div>
            )}
            {r.decidedAt && (
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                Decided {fmtDate(r.decidedAt)}
              </div>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        eyebrow="Grow"
        title="Promote"
        description="Your featured-placement requests."
        actions={<Button onClick={() => setDialogOpen(true)}><Icon name="Plus" size={16} className="mr-1.5" /> Request placement</Button>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total requests" value={all.length} icon="Megaphone" />
        <StatCard label="Pending" value={pending} icon="Clock" trend={pending > 0 ? "up" : undefined} />
        <StatCard label="Active" value={active} icon="ShieldCheck" />
        <StatCard
          label="Committed"
          value={formatPkr(committedTotal)}
          icon="Wallet"
          delta={pendingTotal > 0 ? `${formatPkr(pendingTotal)} awaiting approval` : undefined}
          error={isError}
        />
      </div>

      <DataTable
        filterQuery={search}
        onClearFilter={() => setSearch("")}
        caption="Promotions"
        columns={columns}
        data={requests}
        getRowId={(r) => String(r.id)}
        loading={isLoading}
        error={isError ? "Couldn't load promotions." : null}
        onRetry={() => refetch()}
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        empty={{
          icon: "Megaphone",
          title: "No placement requests yet",
          description: "Request a featured placement to boost your business on the homepage, category, city or search.",
          action: <Button size="sm" onClick={() => setDialogOpen(true)}><Icon name="Plus" size={14} className="mr-1" /> Request placement</Button>,
        }}
        toolbar={
          <>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Icon name="Search" size={15} />
              </span>
              {/* WWL-423 — a placeholder is not an accessible name. */}
              <input id="promote-search" aria-label="Search promotions" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search promotions…"
                className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DensityToggle />
              <ExportMenu selectedIds={selected} getRowId={(r) => String(r.id)} rows={requests} filename="promotions" columns={[
                { header: "Business", value: (r) => r.business?.name ?? `#${r.businessId}` },
                { header: "Placement", value: (r) => placementLabel(r) },
                { header: "Window (days)", value: (r) => num(r.windowDays) },
                { header: "Quoted", value: (r) => num(r.priceQuoted) },
                { header: "Status", value: (r) => r.status ?? "" },
                { header: "Requested", value: (r) => fmtDate(r.createdAt) },
                // WWL-417 — on screen, so in the file.
                { header: "Starts", value: (r) => r.startsAt ?? "" },
                { header: "Ends", value: (r) => r.endsAt ?? "" },
                { header: "Decided", value: (r) => r.decidedAt ?? "" },
                { header: "Rejection reason", value: (r) => r.rejectionReason ?? "" },
                { header: "Note", value: (r) => r.note ?? "" },
              ]} />
            </div>
          </>
        }
        renderCard={(r) => (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{r.business?.name || `#${r.businessId}`}</div>
              <div className="text-xs text-muted-foreground">
                {placementLabel(r)} · {r.priceQuoted == null ? "—" : formatPkr(num(r.priceQuoted))}
              </div>
              {(r.startsAt || r.endsAt) && (
                <div className="text-xs text-muted-foreground">
                  {fmtDate(r.startsAt)} → {fmtDate(r.endsAt)}
                </div>
              )}
              {isLiveNow(r) && (
                <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Featured right now</div>
              )}
              {r.status === "rejected" && r.rejectionReason && (
                <div className="text-xs text-muted-foreground">{r.rejectionReason}</div>
              )}
            </div>
            <StatusPill tone={statusTone(r.status)}>{cap(r.status)}</StatusPill>
          </div>
        )}
      />

      <PromoteRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} pricing={pricing} businessId={businessId} onSaved={invalidate} />
    </div>
  )
}

export default PromoteRedesignedView
