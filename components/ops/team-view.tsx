"use client"

// Team view for leads and managers: who is calling how much, who is behind, and the prospects waiting for a decision.
// Counts only: no contact details on this screen.
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Users } from "lucide-react"

import { useOps } from "@/components/ops/ops-shell"
import { StatusBadge } from "@/components/ops/prospect-bits"
import { Card, Empty, ErrorState, Notice, PageHead, Seg, SkelRows, Status, fmtWhen } from "@/components/ops/ops-ui"
import { opsErrorMessage } from "@/lib/api/ops"
import { prospectsApi, reportsApi } from "@/lib/api/ops-prospects"

export function TeamView() {
  const { can } = useOps()
  const router = useRouter()
  const [days, setDays] = useState<"7" | "14" | "30">("7")
  const report = useQuery({ queryKey: ["ops", "team-report", days], queryFn: () => reportsApi.team(Number(days)), enabled: can(["ops_reports_team", "ops_reports_all"]) })
  const stale = useQuery({ queryKey: ["ops", "prospects", "list", "stale", "team"], queryFn: () => prospectsApi.list({ view: "stale", pageSize: 25 }), enabled: can("ops_prospect_reassign") })

  if (!can(["ops_reports_team", "ops_reports_all"])) return <Notice tone="warn">This screen is for team leads and managers.</Notice>
  const agents = report.data?.agents ?? []
  const totals = agents.reduce((a, r) => ({ calls: a.calls + r.calls, connected: a.connected + r.connected, interested: a.interested + r.interested }), { calls: 0, connected: 0, interested: 0 })

  return (
    <>
      <PageHead title="Team" sub="How the calling is going, per person. Use Prospects to move work between people."
        actions={<Seg value={days} onChange={setDays} label="Period" options={[{ value: "7", label: "7 days" }, { value: "14", label: "14 days" }, { value: "30", label: "30 days" }]} />} />
      <div className="stack">
        <Card title="Agents" sub={agents.length ? `${totals.calls.toLocaleString()} calls · ${totals.connected.toLocaleString()} connected · ${totals.interested.toLocaleString()} interested` : undefined} flush>
          {report.isLoading ? <SkelRows rows={5} /> : report.isError ? <ErrorState message={opsErrorMessage(report.error)} onRetry={() => report.refetch()} />
            : agents.length === 0 ? <Empty icon={<Users />} title="No one on a vendor outreach team yet">Seat people on a team under Staff & teams.</Empty> : (
              <div className="tbl-wrap"><table className="tbl">
                <thead><tr><th>Person</th><th>Team</th><th className="r">Today</th><th className="r">Calls</th><th className="r">Connected</th><th className="r">Interested</th><th className="r">Open</th><th className="r">Live</th><th className="r">Overdue</th></tr></thead>
                <tbody>
                  {agents.map((a) => (
                    <tr key={`${a.userId}-${a.teamName}`}>
                      <td className="td-name">{a.fullName}</td>
                      <td className="td-mut">{a.teamName}</td>
                      <td className="r num">{a.callsToday}</td>
                      <td className="r num">{a.calls}</td>
                      <td className="r num">{a.connected}<span className="td-sub" style={{ display: "inline", marginLeft: 6 }}>{a.calls ? `${Math.round((a.connected / a.calls) * 100)}%` : ""}</span></td>
                      <td className="r num">{a.interested}</td>
                      <td className="r num"><Link href={`/ops/prospects?owner=${a.userId}&view=all`} style={{ color: "var(--accent-ink)" }}>{a.openAssigned}</Link></td>
                      <td className="r num">{a.live}</td>
                      <td className="r num">{a.overdueTasks > 0 ? <Status tone="bad">{a.overdueTasks}</Status> : <span className="muted">0</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
        </Card>

        {can("ops_prospect_reassign") && (
          <Card title="Waiting for your decision" sub="No answer after repeated tries. Open one to try again, mark it invalid, or close it." flush>
            {stale.isLoading ? <SkelRows rows={3} /> : stale.isError ? <ErrorState message={opsErrorMessage(stale.error)} onRetry={() => stale.refetch()} />
              : (stale.data?.prospects ?? []).length === 0 ? <Empty title="Nothing to decide">Prospects that never pick up will appear here.</Empty>
              : (stale.data!.prospects.map((p) => (
                <div key={p.id} className="list-row click" onClick={() => router.push(`/ops/prospects/${p.id}`)}>
                  <div style={{ minWidth: 0, flex: 1 }}><div className="td-name">{p.name}</div><div className="td-sub">{[p.vendorType, p.cityName].filter(Boolean).join(" · ")} · {p.attemptCount} tries · last {fmtWhen(p.lastAttemptAt)}</div></div>
                  <StatusBadge status={p.status} />
                  <Link href={`/ops/prospects/${p.id}`} className="btn btn-primary sm" onClick={(e) => e.stopPropagation()}>Decide</Link>
                </div>
              )))}
          </Card>
        )}
      </div>
    </>
  )
}
