"use client"

// Plain-English Home Dashboard for Team A (Vendor Team) & Team B (Client Team).
// Shows exact daily priorities, Client <-> Vendor handoff replies, site visits, and active bookings.
import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowRight, BarChart3, CalendarCheck2, CheckCircle2, ClipboardCheck, Contact, Headphones, MapPin, PhoneCall, Plus, RefreshCw, ShieldCheck, Sparkles, Store } from "lucide-react"

import { useOps } from "@/components/ops/ops-shell"
import { AddProspectModal } from "@/components/ops/prospects-view"
import { Btn, Card, Empty, ErrorState, PageHead, SkelRows, Status, fmtDay, fmtNum, fmtWhen, fromNow, useOpsToast } from "@/components/ops/ops-ui"
import { opsApi, opsErrorMessage } from "@/lib/api/ops"
import { opsBookingsApi } from "@/lib/api/ops-bookings"
import { prospectsApi } from "@/lib/api/ops-prospects"

const STAGE_LABEL: Record<string, string> = {
  new: "New",
  vendor_contacted: "Called vendor",
  vendor_confirmed: "Vendor ready",
  couple_confirmed: "Couple ready",
  ready: "All ready",
  issue: "Need help",
  resolved: "Done",
}

export function HomeViewP7() {
  const { me, can } = useOps()
  const qc = useQueryClient()
  const toast = useOpsToast()
  const [addingVendor, setAddingVendor] = useState(false)

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
      toast({ title: r.created ? `Updated ${r.created} booking${r.created === 1 ? "" : "s"}` : "Bookings are up to date" })
    },
    onError: (e) => toast({ title: "Could not refresh bookings", body: opsErrorMessage(e), tone: "bad" }),
  })

  const syncDir = useMutation({
    mutationFn: () => prospectsApi.syncDirectory({ includeImported: false, limit: 200 }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["ops", "home-summary"] })
      qc.invalidateQueries({ queryKey: ["ops", "prospects"] })
      toast({ title: r.created ? `Added ${r.created} vendors to calling list` : "All active vendors are already in queue" })
    },
    onError: (e) => toast({ title: "Could not pull vendors", body: opsErrorMessage(e), tone: "bad" }),
  })

  const first = (me.user.fullName || "there").split(/\s+/)[0]
  const data = summaryQ.data

  const primaryAction = data?.canWorkVendors ? (
    <Link href="/ops/call" className="btn btn-primary"><Headphones aria-hidden size={16} />Call Next Vendor</Link>
  ) : data?.canManageClients ? (
    <Link href="/ops/clients" className="btn btn-primary"><Contact aria-hidden size={16} />Open Clients</Link>
  ) : null

  return (
    <>
      <PageHead
        title={`Assalam o Alaikum, ${first}`}
        sub={
          data?.canManageClients && !data?.canWorkVendors
            ? "Client Team Guide: 1) Call couple -> 2) Search venue (e.g. Royal Palace) -> 3) Ask Vendor Team to check date -> 4) Set visit & book."
            : data?.canWorkVendors && !data?.canManageClients
              ? "Vendor Team Guide: Check Client Requests from Iqra, update vendor packages/photos, and call new vendors."
              : "Your daily shift screen across couples, vendors & wedding bookings."
        }
        actions={
          <div className="row">
            {can("ops_reports_all") && <Link href="/ops/reports" className="btn btn-primary"><BarChart3 aria-hidden size={15} />Analytics Control Tower</Link>}
            {can(["ops_prospect_import", "ops_prospect_call"]) && <Btn icon={<Plus aria-hidden size={15} />} onClick={() => setAddingVendor(true)}>Register New Vendor</Btn>}
            {can("ops_vendor_search") && !can("ops_listing_edit_on_behalf") && (
              <Link href="/ops/vendors" className="btn btn-ghost"><Store aria-hidden size={15} />Check Vendors</Link>
            )}
            {can("ops_listing_edit_on_behalf") && <Link href="/ops/find" className="btn btn-ghost"><Store aria-hidden size={15} />All Vendors</Link>}
            {data?.canSeeBookings && <Link href="/ops/bookings" className="btn btn-ghost"><CalendarCheck2 aria-hidden size={15} />Bookings</Link>}
            {!can("ops_reports_all") && primaryAction}
          </div>
        }
      />

      {can("ops_reports_all") && (
        <div className="card" style={{ padding: 14, marginBottom: 14, background: "var(--accent-wash)", borderColor: "var(--accent-line)" }}>
          <div className="row between" style={{ gap: 12 }}>
            <div>
              <div className="td-name">Manager Command View — Track Both Teams &amp; Platform Health</div>
              <div className="small muted">Monitor every call, couple SLA, handover speed, GMV revenue, city/sub-area gap, and data-quality hygiene.</div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <Link href="/ops/reports" className="btn btn-primary sm"><BarChart3 size={14} aria-hidden />Executive Analytics</Link>
              <Link href="/ops/quality" className="btn btn-ghost sm"><ShieldCheck size={14} aria-hidden />QA &amp; Consent</Link>
              <Link href="/ops/find?needs=placeholder_phone" className="btn btn-ghost sm">Fix Placeholder Phones</Link>
            </div>
          </div>
        </div>
      )}

      {summaryQ.isLoading ? (
        <div className="stack"><SkelRows rows={6} /></div>
      ) : summaryQ.isError || !data ? (
        <ErrorState message={opsErrorMessage(summaryQ.error)} onRetry={() => summaryQ.refetch()} />
      ) : (
        <div className="stack">
          {/* Team B — Client Desk KPIs */}
          {data.canManageClients && data.teamB && (
            <div className="stack" style={{ gap: 10 }}>
              <div className="row between">
                <div className="small strong muted" style={{ textTransform: "uppercase", letterSpacing: ".04em" }}>Client Desk (Couples)</div>
                <Link href="/ops/clients" className="btn btn-link sm">Open all clients <ArrowRight aria-hidden size={14} /></Link>
              </div>
              <div className="kpis" style={{ marginBottom: 0 }}>
                <Link href="/ops/clients?view=needs_response" className="card kpi" style={{ display: "block" }}>
                  <div className="k-l">Need First Call</div>
                  <div className="k-v num">{fmtNum(data.teamB.needsResponse)}</div>
                  <div className="k-n">{data.teamB.overdue > 0 ? `${data.teamB.overdue} waiting long` : "Call new inquiries"}</div>
                </Link>
                <Link
                  href="/ops/clients?view=vendor_replied"
                  className="card kpi"
                  style={{ display: "block", borderColor: (data.teamB.vendorReplied ?? 0) > 0 ? "var(--accent-line)" : undefined, background: (data.teamB.vendorReplied ?? 0) > 0 ? "var(--accent-wash)" : undefined }}
                >
                  <div className="k-l">Reply Ready (From Vendor Team)</div>
                  <div className="k-v num">{fmtNum(data.teamB.vendorReplied ?? 0)}</div>
                  <div className="k-n">Call client &amp; share quote</div>
                </Link>
                <Link href="/ops/clients?view=visits" className="card kpi" style={{ display: "block" }}>
                  <div className="k-l">Site Visits Planned</div>
                  <div className="k-v num">{fmtNum(data.teamB.visitsPlanned ?? 0)}</div>
                  <div className="k-n">Remind family &amp; book hall</div>
                </Link>
                <Link href="/ops/clients?view=unassigned" className="card kpi" style={{ display: "block" }}>
                  <div className="k-l">Unassigned Pool</div>
                  <div className="k-v num">{fmtNum(data.teamB.unassigned)}</div>
                  <div className="k-n">{data.teamB.mine} mine · {data.teamB.waitingOnVendors ?? 0} with Team A</div>
                </Link>
              </div>
            </div>
          )}

          {/* Team A — Vendor Team KPIs */}
          {data.canWorkVendors && data.teamA && (
            <div className="stack" style={{ gap: 10 }}>
              <div className="row between">
                <div className="small strong muted" style={{ textTransform: "uppercase", letterSpacing: ".04em" }}>Vendor Team</div>
                {data.teamA.readyToCall === 0 && (
                  <Btn size="sm" icon={<Sparkles aria-hidden />} loading={syncDir.isPending} onClick={() => syncDir.mutate()}>
                    Pull marketplace vendors
                  </Btn>
                )}
              </div>
              <div className="kpis" style={{ marginBottom: 0 }}>
                <Link
                  href="/ops/assigned"
                  className="card kpi"
                  style={{ display: "block", borderColor: data.teamA.assignmentsOpen > 0 ? "var(--accent-line)" : undefined, background: data.teamA.assignmentsOpen > 0 ? "var(--accent-wash)" : undefined }}
                >
                  <div className="k-l">Client Requests to Check</div>
                  <div className="k-v num">{fmtNum(data.teamA.assignmentsOpen)}</div>
                  <div className="k-n">Couples waiting for hall rate</div>
                </Link>
                <Link href="/ops/call" className="card kpi" style={{ display: "block" }}>
                  <div className="k-l">Vendors Ready to Call</div>
                  <div className="k-v num">{fmtNum(data.teamA.readyToCall)}</div>
                  <div className="k-n">Next in vendor queue</div>
                </Link>
                <Link href="/ops/tasks" className="card kpi" style={{ display: "block" }}>
                  <div className="k-l">Callbacks Due</div>
                  <div className="k-v num">{fmtNum(data.teamA.tasksDue)}</div>
                  <div className="k-n">{data.teamA.tasksOverdue > 0 ? `${data.teamA.tasksOverdue} late` : `${data.teamA.tasksNext24h} in next 24h`}</div>
                </Link>
                <div className="card kpi">
                  <div className="k-l">Vendor Calls Today</div>
                  <div className="k-v num">{fmtNum(data.teamA.callsToday)}</div>
                  <div className="k-n">{data.teamA.connectedToday} spoke · {data.teamA.interestedToday} interested</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Queues for Team B */}
          {data.canManageClients && data.teamB && (
            <div className="grid2">
              <Card
                title="Vendor Team Replied — Call Couple Now"
                sub="Rubab / Vendor Team checked availability for these couples."
                actions={<Link href="/ops/clients?view=vendor_replied" className="btn btn-ghost sm">See all</Link>}
                flush
              >
                {!data.teamB.recentReplies?.length ? (
                  <Empty icon={<CheckCircle2 />} title="No pending replies right now">When Vendor Team finishes checking a venue, it shows up here right away.</Empty>
                ) : (
                  <div>
                    {data.teamB.recentReplies.map((r) => (
                      <Link key={r.id} href={`/ops/clients/${r.id}`} className="list-row click today">
                        <div className="grow">
                          <div className="row" style={{ gap: 6 }}>
                            <span className="td-name">{r.name}</span>
                            <Status tone={r.availCount > 0 ? "ok" : "warn"}>{r.availCount} free of {r.totalChecked}</Status>
                          </div>
                          <div className="small muted" style={{ marginTop: 2 }}>
                            {[r.topVenue, r.cityName, r.guests ? `${r.guests} guests` : null, r.repliedAt ? `replied ${fromNow(r.repliedAt)}` : null].filter(Boolean).join(" · ")}
                          </div>
                        </div>
                        <ArrowRight size={15} className="muted" aria-hidden />
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              <Card
                title="New Inquiries — Need First Call"
                sub="Couples waiting for someone from Client Team to call."
                actions={<Link href="/ops/clients?view=needs_response" className="btn btn-ghost sm">Open inbox</Link>}
                flush
              >
                {data.teamB.recentUnanswered.length === 0 ? (
                  <Empty icon={<PhoneCall />} title="All called back">Every couple has received a reply.</Empty>
                ) : (
                  <div>
                    {data.teamB.recentUnanswered.map((c) => (
                      <Link key={c.id} href={`/ops/clients/${c.id}`} className={`list-row click${c.overdue ? " urgent" : ""}`}>
                        <div className="grow">
                          <div className="row" style={{ gap: 6 }}>
                            <span className="td-name">{c.name}</span>
                            {c.overdue ? <Status tone="bad">Late — Call now</Status> : <Status tone="warn">Waiting</Status>}
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
            </div>
          )}

          {/* Action Queues for Team A */}
          {data.canWorkVendors && !data.canManageClients && data.teamA && (
            <div className="grid2">
              <Card
                title="Client Requests Waiting on You"
                sub="Call these venues to check date availability & final rate for Client Team."
                actions={<Link href="/ops/assigned" className="btn btn-ghost sm">All requests</Link>}
                flush
              >
                {!data.teamA.recentRequests?.length ? (
                  <Empty icon={<ClipboardCheck />} title="No open client requests">When Client Team sends a couple shortlist, it appears here.</Empty>
                ) : (
                  <div>
                    {data.teamA.recentRequests.map((rq) => (
                      <Link key={rq.id} href={`/ops/assigned/${rq.id}`} className="list-row click today">
                        <div className="grow">
                          <div className="row" style={{ gap: 6 }}>
                            <span className="td-name">{rq.clientName}</span>
                            <Status tone="info">{rq.unchecked > 0 ? `${rq.unchecked} to call` : "Ready to send back"}</Status>
                          </div>
                          <div className="small muted" style={{ marginTop: 2 }}>
                            {[rq.cityName, rq.nextEventDate ? `Event ${fmtDay(rq.nextEventDate)}` : null, rq.guests ? `${rq.guests} guests` : null].filter(Boolean).join(" · ")}
                          </div>
                        </div>
                        <ArrowRight size={15} className="muted" aria-hidden />
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              <Card title="Quick Shortcuts" sub="Daily vendor tools.">
                <div className="stack" style={{ gap: 10 }}>
                  {can(["ops_prospect_import", "ops_prospect_call"]) && (
                    <button type="button" onClick={() => setAddingVendor(true)} className="list-row click" style={{ border: "1px solid var(--accent-line)", background: "var(--accent-wash)", borderRadius: 10, textAlign: "left", width: "100%" }}>
                      <Plus size={18} style={{ color: "var(--accent)" }} aria-hidden />
                      <div className="grow">
                        <div className="td-name">Register a new vendor while calling</div>
                        <div className="small muted">Talking to a new hall or vendor? Enter details &amp; open their call sheet in 1 click.</div>
                      </div>
                      <ArrowRight size={15} aria-hidden />
                    </button>
                  )}
                  <Link href="/ops/call" className="list-row click" style={{ border: "1px solid var(--border)", borderRadius: 10 }}>
                    <Headphones size={18} style={{ color: "var(--accent)" }} aria-hidden />
                    <div className="grow">
                      <div className="td-name">Call next vendor</div>
                      <div className="small muted">{data.teamA.readyToCall} vendors waiting in call queue</div>
                    </div>
                    <ArrowRight size={15} aria-hidden />
                  </Link>
                  <Link href="/ops/find" className="list-row click" style={{ border: "1px solid var(--border)", borderRadius: 10 }}>
                    <Store size={18} style={{ color: "var(--accent)" }} aria-hidden />
                    <div className="grow">
                      <div className="td-name">Open any vendor listing</div>
                      <div className="small muted">Add photos, packages, menus &amp; log calls</div>
                    </div>
                    <ArrowRight size={15} aria-hidden />
                  </Link>
                  {data.teamA.upcomingVisits && data.teamA.upcomingVisits.length > 0 && (
                    <div style={{ paddingTop: 4 }}>
                      <div className="small strong" style={{ marginBottom: 6 }}>Upcoming Hall Visits (Remind Venue):</div>
                      {data.teamA.upcomingVisits.map((uv) => (
                        <div key={uv.clientId} className="small muted" style={{ padding: "3px 0" }}>
                          <MapPin size={12} style={{ display: "inline", marginRight: 4 }} aria-hidden />
                          <b>{uv.venueName}</b> · {uv.clientName} · {fmtWhen(uv.visitAt)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Upcoming Site Visits (Team B) + Bookings Coordination */}
          <div className="grid2">
            {data.canManageClients && data.teamB && (
              <Card
                title="Upcoming Hall Visits"
                sub="Remind the family and confirm booking once they visit."
                actions={<Link href="/ops/clients?view=visits" className="btn btn-ghost sm">All visits</Link>}
                flush
              >
                {!data.teamB.upcomingVisits?.length ? (
                  <Empty icon={<MapPin />} title="No visits planned">When a couple wants to see a hall, click Plan Visit on their page.</Empty>
                ) : (
                  <div>
                    {data.teamB.upcomingVisits.map((v) => (
                      <Link key={v.id} href={`/ops/clients/${v.id}`} className="list-row click">
                        <div className="grow">
                          <div className="td-name">{v.name} — {v.venueName || "Venue"}</div>
                          <div className="small muted">{[v.visitAt ? fmtWhen(v.visitAt) : null, v.cityName, v.visitNote].filter(Boolean).join(" · ")}</div>
                        </div>
                        <ArrowRight size={15} className="muted" aria-hidden />
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {data.canSeeBookings && data.bookings && (
              <Card
                title="Bookings to Follow Up"
                sub="Call both hall & couple before event day to confirm setup."
                actions={
                  <div className="row">
                    <Btn size="sm" icon={<RefreshCw aria-hidden />} loading={syncBk.isPending} onClick={() => syncBk.mutate()}>Refresh</Btn>
                    <Link href="/ops/bookings" className="btn btn-ghost sm">All bookings</Link>
                  </div>
                }
                flush
              >
                {data.bookings.recent.length === 0 ? (
                  <Empty icon={<CalendarCheck2 />} title="No active bookings right now">
                    Confirmed website bookings and booked clients appear here automatically.
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
          </div>
        </div>
      )}
      <AddProspectModal open={addingVendor} onClose={() => setAddingVendor(false)} />
    </>
  )
}
