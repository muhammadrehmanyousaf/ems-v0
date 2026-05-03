"use client"

// BK-067 admin queue — dispute list + resolve action.

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Gavel, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import {
  listAdminDisputes,
  type AdminDisputeRow,
  type DisputeStatus,
  type DisputeStatusFilter,
} from "@/lib/api/disputes"
import { ResolveDisputeDialog } from "./ResolveDisputeDialog"

const STATUS_TABS: { value: DisputeStatusFilter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "all", label: "All" },
]

// Mirror customer-side `<DisputeCard>` palette so admin & customer reads
// of the same dispute look the same.
const STATUS_LABEL: Record<DisputeStatus, string> = {
  open: "Open",
  resolved_refund: "Refund approved",
  resolved_release: "Released",
  resolved_dismissed: "Dismissed",
  resolved_forfeit: "Forfeit (no-show denied)",
}

const STATUS_VARIANT: Record<
  DisputeStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  open: "secondary",
  resolved_refund: "default",
  resolved_release: "outline",
  resolved_dismissed: "destructive",
  resolved_forfeit: "destructive",
}

const PAGE_LIMIT = 20

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

function formatMoney(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return "—"
  const n = typeof v === "string" ? parseFloat(v) : v
  if (!Number.isFinite(n)) return String(v)
  return `Rs ${n.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`
}

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return null
  return Math.max(0, Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24)))
}

export function DisputesTable() {
  const [statusTab, setStatusTab] = useState<DisputeStatusFilter>("open")
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<AdminDisputeRow[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<AdminDisputeRow | null>(null)

  const refresh = async () => {
    try {
      setLoading(true)
      const r = await listAdminDisputes({
        status: statusTab,
        page,
        limit: PAGE_LIMIT,
      })
      setRows(r.rows || [])
      setCount(r.count || 0)
    } catch (e: any) {
      toast({
        title: "Failed to load disputes",
        description: e?.response?.data?.message || "Try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusTab, page])

  // Reset to page 1 when changing tabs.
  const onTabChange = (v: string) => {
    setStatusTab(v as DisputeStatusFilter)
    setPage(1)
  }

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / PAGE_LIMIT)),
    [count],
  )

  return (
    <div className="space-y-4">
      <Tabs value={statusTab} onValueChange={onTabChange}>
        <TabsList>
          {STATUS_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {count} {count === 1 ? "dispute" : "disputes"}
            {statusTab !== "all" ? ` — ${statusTab}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-bridal-text-soft py-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-bridal-text-soft py-6 text-center">
              No disputes in this state.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-bridal-beige">
                    <th className="py-2 pr-3 font-medium">Booking</th>
                    <th className="py-2 pr-3 font-medium">Customer</th>
                    <th className="py-2 pr-3 font-medium">Opened</th>
                    <th className="py-2 pr-3 font-medium">Reason</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 font-medium">Days since event</th>
                    <th className="py-2 pl-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d) => {
                    const since = daysSince(d.booking?.bookingDate)
                    return (
                      <tr
                        key={d.id}
                        className="border-b border-bridal-beige/50 align-top"
                      >
                        <td className="py-2 pr-3">
                          <div className="font-medium text-bridal-charcoal">
                            #{d.bookingId}
                          </div>
                          <div className="text-xs text-bridal-text-soft">
                            {formatDate(d.booking?.bookingDate)} ·{" "}
                            {formatMoney(d.booking?.totalAmount)}
                          </div>
                        </td>
                        <td className="py-2 pr-3">
                          <div className="text-bridal-charcoal">
                            {d.booking?.customerName || "—"}
                          </div>
                          <div className="text-xs text-bridal-text-soft">
                            {d.booking?.customerEmail || ""}
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-bridal-text-soft mt-0.5">
                            opened by {d.openedByRole}
                          </div>
                        </td>
                        <td className="py-2 pr-3 text-xs text-bridal-text-soft whitespace-nowrap">
                          {formatDate(d.openedAt)}
                        </td>
                        <td className="py-2 pr-3 max-w-md">
                          <span
                            className="text-bridal-charcoal line-clamp-2 cursor-help"
                            title={d.reason}
                          >
                            {d.reason}
                          </span>
                        </td>
                        <td className="py-2 pr-3">
                          <Badge variant={STATUS_VARIANT[d.status]}>
                            {STATUS_LABEL[d.status]}
                          </Badge>
                        </td>
                        <td className="py-2 pr-3 text-xs text-bridal-text-soft">
                          {since === null ? "—" : `${since}d`}
                        </td>
                        <td className="py-2 pl-3 text-right">
                          {d.status === "open" ? (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => setResolving(d)}
                            >
                              <Gavel className="w-3.5 h-3.5 mr-1" />
                              Resolve
                            </Button>
                          ) : (
                            <span className="text-xs text-bridal-text-soft">
                              {formatDate(d.resolvedAt)}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination footer */}
          {count > PAGE_LIMIT ? (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-bridal-beige/60">
              <span className="text-xs text-bridal-text-soft">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <ResolveDisputeDialog
        dispute={resolving}
        onClose={() => setResolving(null)}
        onResolved={() => {
          setResolving(null)
          refresh()
        }}
      />
    </div>
  )
}
