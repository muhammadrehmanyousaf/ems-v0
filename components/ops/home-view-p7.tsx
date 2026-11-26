"use client"

// Ops Portal P7 — Role-aware Home Cockpit across Vendor Outreach (Team A), Client Desk (Team B), and Bookings Coordination.
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowRight, CalendarCheck2, Contact, Headphones, PhoneCall, RefreshCw, Sparkles, Store } from "lucide-react"

import { useOps } from "@/components/ops/ops-shell"
import { Btn, Card, Empty, ErrorState, Kpi, PageHead, SkelRows, Status, fmtDay, fmtNum, fmtWhen, fromNow, useOpsToast } from "@/components/ops/ops-ui"
import { opsApi, opsErrorMessage } from "@/lib/api/ops"
import { opsBookingsApi } from "@/lib/api/ops-bookings"
import { prospectsApi } from "@/lib/api/ops-prospects"

const STAGE_LABEL: Record<string, string> = {
  new: "New",
  vendor_contacted: "Vendor called",
  vendor_confirmed: "Vendor confirmed",
  couple_confirmed: "Couple confirmed",
  ready: "Ready",
  issue: "Needs help",
  resolved: "Resolved",
}

export function HomeViewP7() {
  const { me, can } = useOps()
  const qc = useQueryClient()
  const toast = useOpsToast()

  const summaryQ = useQuery({
    queryKey: ["ops", "home-summary"],
    queryFn: opsApi.homeSummary,
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

  const syncBk = useMutation({
    mutationFn: () => opsBookingsApi.sync(),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["ops", "home-summary"] })
      qc.invalidateQueries({ queryKey: ["ops", "bookings"] })
      toast({ title: r.created ? `Synced ${r.created} booking${r.created === 1 ? "" : "s"}` : "Bookings are up to date" })
    },
    onError: (e) => toast({ title: "Sync failed", body: opsErrorMessage(e), tone: "bad" }),
  })

  const syncDir = useMutation({
    mutationFn: () => prospectsApi.syncDirectory({ includeImported: false, limit: 200 }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["ops", "home-summary"] })
      qc.invalidateQueries({ queryKey: ["ops", "prospects"] })
      toast({ title: r.created ? `Added ${r.created} marketplace vendor${r.created === 1 ? "" : "s"} to queue` : "Queue already has all active vendors" })
    },
    onError: (e) => toast({ title: "Could not pull vendors", body: opsErrorMessage(e), tone: "bad" }),
  })

  const first = (me.user.fullName || "there").split(/\s+/)[0]
  const data = summaryQ.data

  const primaryAction = data?.canWorkVendors ? (
    <Link href="/ops/call" className="btn btn-primary"><Headphones aria-hidden size={16} />Open call queue</Link>
  ) : data?.canManageClients ? (
    <Link href="/ops/clients" className="btn btn-primary"><Contact aria-hidden size={16} />Open client inbox</Link>
  ) : null

  return (
    <>
      <PageHead
        title={`Welcome back, ${first}`}
        sub="Your live shift overview across vendor outreach, couple inquiries, and confirmed bookings."
        actions={
          <div className="row">
            {can("ops_listing_edit_on_behalf") && <Link href="/ops/find" className="btn btn-ghost"><Store aria-hidden size={15} />Vendors</Link>}
            {data?.canSeeBookings && <Link href="/ops/bookings" className="btn btn-ghost"><CalendarCheck2 aria-hidden size={15} />Bookings</Link>}
            {primaryAction}
          </div>
        }
      />

      {summaryQ.isLoading ? (
        <div className="stack"><SkelRows rows={6} /></div>
      ) : summaryQ.isError || !data ? (
        <ErrorState message={opsErrorMessage(summaryQ.error)} onRetry={() => summaryQ.refetch()} />
      ) : (
        <div className="stack">
          {/* Team A — Vendor Outreach KPIs */}
          {data.canWorkVendors && data.teamA && (
            <div className="stack" style={{ gap: 10 }}>
              <div className="row between">
                <div className="small strong muted" style={{ textTransform: "uppercase", letterSpacing: ".04em" }}>Vendor outreach</div>
                {data.teamA.readyToCall === 0 && (
                  <Btn size="sm" icon={<Sparkles aria-hidden />} loading={syncDir.isPending} onClick={() => syncDir.mutate()}>
                    Pull marketplace vendors
                  </Btn>
                )}
              </div>
              <div className="kpis" style={{ marginBottom: 0 }}>
                <Link href="/ops/call" className="card kpi" style={{ display: "block" }}>
                  <div className="k-l">Ready to call</div>
                  <div className="k-v num">{fmtNum(data.teamA.readyToCall)}</div>
                  <div className="k-n">Prospects available now</div>
                </Link>
                <Link href="/ops/tasks" className="card kpi" style={{ display: "block" }}>
                  <div className="k-l">Callbacks due</div>
                  <div className="k-v num">{fmtNum(data.teamA.tasksDue)}</div>
                  <div className="k-n">{data.teamA.tasksOverdue > 0 ? `${data.teamA.tasksOverdue} overdue` : `${data.teamA.tasksNext24h} in next 24h`}</div>
                </Link>
                <div className="card kpi">
                  <div className="k-l">Calls today</div>
                  <div className="k-v num">{fmtNum(data.teamA.callsToday)}</div>
                  <div className="k-n">{data.teamA.connectedToday} connected · {data.teamA.interestedToday} interested</div>
                </div>
                <Link href="/ops/assigned" className="card kpi" style={{ display: "block" }}>
                  <div className="k-l">Client shortlists for you</div>
                  <div className="k-v num">{fmtNum(data.teamA.assignmentsOpen)}</div>
                  <div className="k-n">{data.teamA.interestedOpen} interested vendors open</div>
                </Link>
              </div>
            </div>
          )}

          {/* Team B — Client Desk KPIs */}
          {data.canManageClients && data.teamB && (
            <div className="stack" style={{ gap: 10 }}>
              <div className="row between">
                <div className="small strong muted" style={{ textTransform: "uppercase", letterSpacing: ".04em" }}>Couple desk & inquiries</div>
                <Link href="/ops/clients" className="btn btn-link sm">All clients <ArrowRight aria-hidden size={14} /></Link>
              </div>
              <div className="kpis" style={{ marginBottom: 0 }}>
                <Link href="/ops/clients?view=needs_response" className="card kpi" style={{ display: "block" }}>
                  <div className="k-l">Needs first reply</div>
                  <div className="k-v num">{fmtNum(data.teamB.needsResponse)}</div>
                  <div className="k-n">{data.teamB.overdue > 0 ? `${data.teamB.overdue} past SLA` : "All within SLA"}</div>
                </Link>
                <Link href="/ops/clients?view=unassigned" className="card kpi" style={{ display: "block" }}>
                  <div className="k-l">Unassigned pool</div>
                  <div className="k-v num">{fmtNum(data.teamB.unassigned)}</div>
                  <div className="k-n">Waiting to be claimed</div>
                </Link>
                <Link href="/ops/clients?view=mine" className="card kpi" style={{ display: "block" }}>
                  <div className="k-l">My active couples</div>
                  <div className="k-v num">{fmtNum(data.teamB.mine)}</div>
                  <div className="k-n">{data.teamB.inbox} total active inbox</div>
                </Link>
              </div>
            </div>
          )}

          {/* Bookings Coordination KPIs */}
          {data.canSeeBookings && data.bookings && (
            <div className="stack" style={{ gap: 10 }}>
              <div className="row between">
                <div className="small strong muted" style={{ textTransform: "uppercase", letterSpacing: ".04em" }}>Bookings coordination</div>
                <div className="row">
                  <Btn size="sm" icon={<RefreshCw aria-hidden />} loading={syncBk.isPending} onClick={() => syncBk.mutate()}>Sync</Btn>
                  <Link href="/ops/bookings" className="btn btn-link sm">All bookings <ArrowRight aria-hidden size={14} /></Link>
                </div>
              </div>
              <div className="kpis" style={{ marginBottom: 0 }}>
                <Link href="/ops/bookings?view=needs_action" className="card kpi" style={{ display: "block" }}>
                  <div className="k-l">Needs ops action</div>
                  <div className="k-v num">{fmtNum(data.bookings.needsAction)}</div>
                  <div className="k-n">Awaiting vendor/couple check</div>
                </Link>
                <Link href="/ops/bookings?view=upcoming" className="card kpi" style={{ display: "block" }}>
                  <div className="k-l">Next 14 days</div>
                  <div className="k-v num">{fmtNum(data.bookings.upcoming14d)}</div>
                  <div className="k-n">Upcoming events to confirm</div>
                </Link>
                <Link href="/ops/bookings?view=confirmed" className="card kpi" style={{ display: "block" }}>
                  <div className="k-l">Confirmed bookings</div>
                  <div className="k-v num">{fmtNum(data.bookings.confirmed)}</div>
                  <div className="k-n">{data.bookings.pending} pending · {data.bookings.total} total</div>
                </Link>
              </div>
            </div>
          )}

          <div className="grid2">
            {/* Bookings needing attention */}
            {data.canSeeBookings && data.bookings && (
              <Card
                title="Bookings to coordinate"
                sub="Follow up with vendor & couple before the event date."
                actions={<Link href="/ops/bookings" className="btn btn-ghost sm">Open desk</Link>}
                flush
              >
                {data.bookings.recent.length === 0 ? (
                  <Empty icon={<CalendarCheck2 />} title="No active bookings right now">
                    New customer bookings and manual vendor bookings will appear here automatically.
                  </Empty>
                ) : (
                  <div>
                    {data.bookings.recent.map((bk) => (
                      <Link key={bk.id} href={`/ops/bookings/${bk.id}`} className={`list-row click${bk.priority === "urgent" ? " urgent" : ""}`}>
                        <div className="grow">
                          <div className="row" style={{ gap: 6 }}>
                            <span className="td-name">#{bk.id} · {bk.customerName || "Couple"}</span>
                            <Status tone={bk.status === "Confirmed" ? "ok" : bk.status === "Cancelled" ? "bad" : "info"}>{bk.status}</Status>
                            <Status tone={bk.opsStage === "ready" || bk.opsStage === "resolved" ? "ok" : bk.opsStage === "issue" ? "bad" : "acc"}>
                              {STAGE_LABEL[bk.opsStage] ?? bk.opsStage}
                            </Status>
                          </div>
                          <div className="small muted" style={{ marginTop: 2 }}>
                            {[bk.bookingDate ? fmtDay(bk.bookingDate) : "Date TBD", bk.eventCity, bk.vendors?.[0]?.name].filter(Boolean).join(" · ")}
                          </div>
                        </div>
                        <ArrowRight size={15} className="muted" aria-hidden />
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Unanswered Couple Inquiries */}
            {data.canManageClients && data.teamB && (
              <Card
                title="Unanswered couple inquiries"
                sub="First reply SLA queue from Wedding Wala inquiry forms."
                actions={<Link href="/ops/clients" className="btn btn-ghost sm">Open inbox</Link>}
                flush
              >
                {data.teamB.recentUnanswered.length === 0 ? (
                  <Empty icon={<PhoneCall />} title="All caught up">Every couple inquiry has received a first response.</Empty>
                ) : (
                  <div>
                    {data.teamB.recentUnanswered.map((c) => (
                      <Link key={c.id} href={`/ops/clients/${c.id}`} className={`list-row click${c.overdue ? " urgent" : ""}`}>
                        <div className="grow">
                          <div className="row" style={{ gap: 6 }}>
                            <span className="td-name">{c.name}</span>
                            {c.overdue ? <Status tone="bad">Overdue</Status> : <Status tone="warn">Waiting</Status>}
                          </div>
                          <div className="small muted" style={{ marginTop: 2 }}>
                            {[c.cityText, c.source === "website" ? "Website inquiry" : c.source, fromNow(c.createdAt)].filter(Boolean).join(" · ")}
                          </div>
                        </div>
                        <ArrowRight size={15} className="muted" aria-hidden />
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Quick Start for Team A when not seeing Team B */}
            {data.canWorkVendors && !data.canManageClients && (
              <Card title="Quick actions" sub="Everything you need for daily vendor outreach & management.">
                <div className="stack" style={{ gap: 10 }}>
                  <Link href="/ops/call" className="list-row click" style={{ border: "1px solid var(--border)", borderRadius: 10 }}>
                    <Headphones size={18} style={{ color: "var(--accent)" }} aria-hidden />
                    <div className="grow">
                      <div className="td-name">Start next call from queue</div>
                      <div className="small muted">{data.teamA?.readyToCall ?? 0} prospects ready · auto-leases next number</div>
                    </div>
                    <ArrowRight size={15} aria-hidden />
                  </Link>
                  <Link href="/ops/find" className="list-row click" style={{ border: "1px solid var(--border)", borderRadius: 10 }}>
                    <Store size={18} style={{ color: "var(--accent)" }} aria-hidden />
                    <div className="grow">
                      <div className="td-name">Manage any Wedding Wala vendor</div>
                      <div className="small muted">Upload photos, edit packages, view bookings & log vendor calls</div>
                    </div>
                    <ArrowRight size={15} aria-hidden />
                  </Link>
                  <Link href="/ops/assigned" className="list-row click" style={{ border: "1px solid var(--border)", borderRadius: 10 }}>
                    <PhoneCall size={18} style={{ color: "var(--accent)" }} aria-hidden />
                    <div className="grow">
                      <div className="td-name">Confirm couple shortlists</div>
                      <div className="small muted">{data.teamA?.assignmentsOpen ?? 0} open handoffs waiting for venue availability check</div>
                    </div>
                    <ArrowRight size={15} aria-hidden />
                  </Link>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  )
}
