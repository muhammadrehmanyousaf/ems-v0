"use client"

// Ops Portal P7 — Bookings Coordination Desk (/ops/bookings)
// Lists marketplace bookings (online & vendor-created), lets staff claim coordination, filter by status/stage/source/city, and inspect vendor & couple links.
import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarCheck2, RefreshCw, Search } from "lucide-react"

import { Btn, Card, Empty, ErrorState, PageHead, SkelRows, Status, TabBar, fmtDay, fmtNum, useOpsToast, type Tone } from "@/components/ops/ops-ui"
import { opsErrorMessage } from "@/lib/api/ops"
import { opsBookingsApi, type OpsBookingStage, type OpsBookingView } from "@/lib/api/ops-bookings"

const STAGE_META: Record<OpsBookingStage, { label: string; tone: Tone }> = {
  new: { label: "Needs check", tone: "warn" },
  vendor_contacted: { label: "Vendor called", tone: "info" },
  vendor_confirmed: { label: "Vendor OK", tone: "info" },
  couple_confirmed: { label: "Couple OK", tone: "acc" },
  ready: { label: "All ready", tone: "ok" },
  issue: { label: "Issue", tone: "bad" },
  resolved: { label: "Resolved", tone: "mut" },
}

const BOOKING_STATUS_TONE: Record<string, Tone> = {
  Confirmed: "ok",
  Pending: "warn",
  "Awaiting Payment": "warn",
  Completed: "info",
  Cancelled: "bad",
}

const VALID_VIEWS: OpsBookingView[] = ["needs_action", "confirmed", "pending", "upcoming", "completed", "cancelled", "all"]

export function BookingsView() {
  const sp = useSearchParams()
  const rawView = sp?.get("view") ?? ""
  const initialView = VALID_VIEWS.includes(rawView as OpsBookingView) ? (rawView as OpsBookingView) : "needs_action"

  const qc = useQueryClient()
  const toast = useOpsToast()

  const [view, setView] = useState<OpsBookingView>(initialView)
  const [q, setQ] = useState("")
  const [stage, setStage] = useState<"" | OpsBookingStage>("")
  const [source, setSource] = useState("")
  const [city, setCity] = useState("")
  const [sort, setSort] = useState<"newest" | "oldest" | "event_soonest" | "amount">("event_soonest")
  const [page, setPage] = useState(1)

  const countsQ = useQuery({
    queryKey: ["ops", "bookings", "counts"],
    queryFn: opsBookingsApi.counts,
    staleTime: 15_000,
  })

  const listQ = useQuery({
    queryKey: ["ops", "bookings", "list", { view, q, stage, source, city, sort, page }],
    queryFn: () =>
      opsBookingsApi.list({
        view,
        q: q.trim() || undefined,
        opsStage: stage || undefined,
        source: source || undefined,
        city: city.trim() || undefined,
        sort,
        page,
        pageSize: 25,
      }),
    staleTime: 15_000,
  })

  const syncMut = useMutation({
    mutationFn: () => opsBookingsApi.sync(),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["ops", "bookings"] })
      qc.invalidateQueries({ queryKey: ["ops", "home-summary"] })
      toast({
        title: r.created ? `Synced ${r.created} booking${r.created === 1 ? "" : "s"}` : "Bookings already synced",
        body: r.linkedClients ? `Created/linked ${r.linkedClients} couple record${r.linkedClients === 1 ? "" : "s"}.` : undefined,
      })
    },
    onError: (e) => toast({ title: "Sync failed", body: opsErrorMessage(e), tone: "bad" }),
  })

  const c = countsQ.data?.counts
  const data = listQ.data
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <>
      <PageHead
        title="Bookings desk"
        sub="Track every customer & vendor booking end-to-end: confirm hall readiness with the vendor and arrival details with the couple."
        actions={
          <Btn icon={<RefreshCw aria-hidden />} loading={syncMut.isPending} onClick={() => syncMut.mutate()}>
            Sync marketplace bookings
          </Btn>
        }
      />

      <Card flush>
        <div className="toolbar" style={{ padding: "14px 16px 0" }}>
          <TabBar<OpsBookingView>
            value={view}
            onChange={(v) => { setView(v); setPage(1) }}
            label="Booking views"
            tabs={[
              { value: "needs_action", label: "Needs action", count: c?.needs_action },
              { value: "upcoming", label: "Next 14d", count: c?.upcoming },
              { value: "confirmed", label: "Confirmed", count: c?.confirmed },
              { value: "pending", label: "Pending", count: c?.pending },
              { value: "completed", label: "Completed", count: c?.completed },
              { value: "cancelled", label: "Cancelled", count: c?.cancelled },
              { value: "all", label: "All", count: c?.all },
            ]}
          />

          <div className="filters">
            <div className="f-search">
              <Search aria-hidden />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1) }}
                placeholder="Booking #, couple, phone, vendor…"
                aria-label="Search bookings"
              />
            </div>

            <select className="fsel" value={stage} onChange={(e) => { setStage(e.target.value as "" | OpsBookingStage); setPage(1) }} aria-label="Filter by ops stage">
              <option value="">All ops stages</option>
              {Object.entries(STAGE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>

            <select className="fsel" value={source} onChange={(e) => { setSource(e.target.value); setPage(1) }} aria-label="Filter by source">
              <option value="">All sources</option>
              <option value="online">Website booking</option>
              <option value="offline">Vendor manual</option>
            </select>

            <input
              className="inp sm"
              style={{ width: 120 }}
              value={city}
              onChange={(e) => { setCity(e.target.value); setPage(1) }}
              placeholder="City…"
              aria-label="Filter by city"
            />

            <select className="fsel" value={sort} onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1) }} aria-label="Sort bookings">
              <option value="event_soonest">Event date (soonest)</option>
              <option value="newest">Newest created</option>
              <option value="amount">Highest value</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        {listQ.isLoading ? (
          <div style={{ padding: 16 }}><SkelRows rows={7} /></div>
        ) : listQ.isError ? (
          <div style={{ padding: 16 }}><ErrorState message={opsErrorMessage(listQ.error)} onRetry={() => listQ.refetch()} /></div>
        ) : !data || data.rows.length === 0 ? (
          <Empty
            icon={<CalendarCheck2 />}
            title="No bookings match this filter"
            action={view !== "all" ? <Btn size="sm" onClick={() => setView("all")}>View all bookings</Btn> : undefined}
          >
            Confirmed and pending marketplace bookings sync automatically into OpsBookingMeta without touching payment records.
          </Empty>
        ) : (
          <>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Booking &amp; Couple</th>
                    <th>Vendors</th>
                    <th>Event date</th>
                    <th>Marketplace status</th>
                    <th>Ops coordination</th>
                    <th>Handler</th>
                    <th className="r">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((bk) => {
                    const sm = STAGE_META[bk.opsStage] ?? { label: bk.opsStage, tone: "mut" as Tone }
                    return (
                      <tr key={bk.id} className={bk.priority === "urgent" ? "urgent" : undefined}>
                        <td>
                          <Link href={`/ops/bookings/${bk.id}`} className="td-name" style={{ textDecoration: "underline", textDecorationColor: "var(--border-2)" }}>
                            #{bk.id} · {bk.customerName || "Couple"}
                          </Link>
                          <div className="td-sub">
                            {[bk.customerPhone, bk.eventType, bk.eventCity, bk.bookingSource === "offline" ? "Manual" : "Online"].filter(Boolean).join(" · ")}
                          </div>
                        </td>
                        <td>
                          {bk.vendors?.length ? (
                            <div className="stack" style={{ gap: 2 }}>
                              {bk.vendors.map((v) => (
                                <Link key={v.businessId} href={`/ops/find/${v.businessId}`} className="small" style={{ textDecoration: "underline", textDecorationColor: "var(--border-2)" }}>
                                  {v.name}
                                </Link>
                              ))}
                            </div>
                          ) : <span className="muted">—</span>}
                        </td>
                        <td className="nw">
                          <div>{bk.bookingDate ? fmtDay(bk.bookingDate) : "TBD"}</div>
                          <div className="td-sub">{[bk.bookingTime, bk.guestCount ? `${bk.guestCount} guests` : null].filter(Boolean).join(" · ") || "—"}</div>
                        </td>
                        <td>
                          <Status tone={BOOKING_STATUS_TONE[bk.status] ?? "mut"}>{bk.status}</Status>
                          <div className="td-sub">{bk.paymentStatus}</div>
                        </td>
                        <td>
                          <div className="row" style={{ gap: 6 }}>
                            <Status tone={sm.tone}>{sm.label}</Status>
                            {bk.priority === "urgent" && <Status tone="bad">Urgent</Status>}
                          </div>
                        </td>
                        <td className="td-mut">{bk.ownerName || "Unclaimed"}</td>
                        <td className="r nw num">
                          <div className="td-name">{bk.totalAmount ? `PKR ${fmtNum(Number(bk.totalAmount))}` : "—"}</div>
                          {bk.downPayment ? <div className="td-sub">Paid: {fmtNum(Number(bk.downPayment))}</div> : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="tbl-foot">
              <span>{fmtNum(data.total)} booking{data.total === 1 ? "" : "s"} · page {data.page} of {totalPages}</span>
              <div className="pager">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </Card>
    </>
  )
}
