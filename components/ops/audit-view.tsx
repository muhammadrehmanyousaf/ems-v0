"use client"

// The audit trail (spec 11.2): everything staff did in the portal, newest first, read-only. Managers only: a row can carry what changed,
// which may include a client's or vendor's contact details. Always bounded by a date range.
import Link from "next/link"
import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ScrollText } from "lucide-react"

import { Card, Empty, ErrorState, Field, Input, PageHead, Pager, Select, SkelRows, fmtWhen } from "@/components/ops/ops-ui"
import { opsErrorMessage } from "@/lib/api/ops"
import { opsReportsApi, type AuditRow } from "@/lib/api/ops-reports"

const PAGE = 50
const karachiDay = (back = 0) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date(Date.now() - back * 86400000))

/** "ops.client.status" -> "Client: status". The raw code stays in the title for anyone who needs to search for it. */
const HEAD_LABEL: Record<string, string> = { qa: "QA", owner: "Owner login", onboard: "Onboarding", prospect: "Prospect", client: "Client", consent: "Consent", listing: "Listing", media: "Media", import: "Import", setting: "Setting", team: "Team", staff: "Staff", city: "City", disposition: "Call outcome", task: "Task" }
const TARGET_LABEL: Record<string, string> = { business: "Listing", opsClient: "Client", opsProspect: "Prospect" }
function actionLabel(action: string) {
  const parts = action.replace(/^ops\./, "").split(".")
  const head = HEAD_LABEL[parts[0]] ?? (parts[0] ? parts[0][0].toUpperCase() + parts[0].slice(1) : action)
  return parts.length > 1 ? `${head}: ${parts.slice(1).join(" ").replace(/_/g, " ")}` : head
}

const isExport = (r: AuditRow) => /\.exported$/.test(r.action)

/** Where a row's target can be opened, when it can. */
function targetHref(r: AuditRow): string | null {
  if (isExport(r)) return null // an export is not about one record: its target is only an anchor for the row
  if (r.targetType === "opsClient") return `/ops/clients/${r.targetId}`
  if (r.targetType === "opsProspect") return `/ops/prospects/${r.targetId}`
  if (r.targetType === "business" && /^ops\.(onboard|consent|qa|listing|media|owner)/.test(r.action)) return `/ops/listings/${r.targetId}`
  return null
}

const json = (v: unknown) => JSON.stringify(v, null, 2)

export function AuditView() {
  const [from, setFrom] = useState(() => karachiDay(13))
  const [to, setTo] = useState(() => karachiDay(0))
  const [actor, setActor] = useState("")
  const [action, setAction] = useState("")
  const [targetId, setTargetId] = useState("")
  const [debouncedTarget, setDebouncedTarget] = useState("")
  const [page, setPage] = useState(1)
  useEffect(() => { const t = window.setTimeout(() => { setDebouncedTarget(targetId.trim()); setPage(1) }, 350); return () => window.clearTimeout(t) }, [targetId])

  const badRange = !from || !to || from > to
  const badTarget = debouncedTarget !== "" && !/^\d{1,9}$/.test(debouncedTarget)
  const q = useQuery({
    queryKey: ["ops", "audit", from, to, actor, action, debouncedTarget, page],
    queryFn: () => opsReportsApi.audit({ from, to, actorUserId: actor || undefined, action: action || undefined, targetId: debouncedTarget || undefined, page, pageSize: PAGE }),
    enabled: !badRange && !badTarget, placeholderData: (p) => p,
  })
  const d = q.data
  const change = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { set(e.target.value); setPage(1) }

  return (
    <>
      <PageHead title="Audit trail" sub="What staff did in the portal, newest first. Read only, and every export and settings change is on it." />
      <div className="toolbar">
        <div className="filters" style={{ marginLeft: 0 }}>
          <Field label="From" htmlFor="au-from"><Input id="au-from" type="date" compact value={from} max={to} onChange={change(setFrom)} /></Field>
          <Field label="To" htmlFor="au-to"><Input id="au-to" type="date" compact value={to} min={from} max={karachiDay(0)} onChange={change(setTo)} /></Field>
          <Field label="Person" htmlFor="au-actor">
            <Select id="au-actor" value={actor} onChange={change(setActor)} style={{ width: 190 }}><option value="">Everyone</option>{(d?.actors ?? []).map((a) => <option key={a.id} value={a.id}>{a.name} ({a.n})</option>)}</Select>
          </Field>
          <Field label="Action" htmlFor="au-action">
            <Select id="au-action" value={action} onChange={change(setAction)} style={{ width: 230 }}><option value="">Everything</option>{(d?.actions ?? []).map((a) => <option key={a.action} value={a.action}>{actionLabel(a.action)} ({a.n})</option>)}</Select>
          </Field>
          <Field label="Record number" htmlFor="au-target" error={badTarget ? "Numbers only" : null}>
            <Input id="au-target" compact inputMode="numeric" placeholder="e.g. 1042" value={targetId} onChange={(e) => setTargetId(e.target.value)} style={{ width: 130 }} />
          </Field>
        </div>
      </div>

      <Card flush>
        {badRange ? <Empty icon={<ScrollText />} title="Check the dates">The start date must be on or before the end date.</Empty>
          : q.isLoading ? <SkelRows rows={8} />
          : q.isError ? <ErrorState message={opsErrorMessage(q.error)} onRetry={() => q.refetch()} />
          : !d || d.rows.length === 0 ? <Empty icon={<ScrollText />} title="Nothing matches">No portal activity was recorded for these filters. Try a wider date range.</Empty>
          : (
            <>
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>When</th><th>Person</th><th>What</th><th>Record</th><th>Details</th></tr></thead>
                  <tbody>
                    {d.rows.map((r) => {
                      const href = targetHref(r)
                      const has = r.before != null || r.after != null
                      return (
                        <tr key={String(r.id)} style={{ verticalAlign: "top" }}>
                          <td className="nw num">{fmtWhen(r.at)}</td>
                          <td className="td-name nw">{r.actorName ?? <span className="muted">System</span>}</td>
                          <td style={{ minWidth: 170 }}><div className="td-name" title={r.action}>{actionLabel(r.action)}</div></td>
                          <td className="nw">{isExport(r) ? <span className="muted">—</span> : href ? <Link href={href} style={{ color: "var(--accent-ink)" }}>{TARGET_LABEL[r.targetType] ?? r.targetType} #{r.targetId}</Link> : <span className="muted">{TARGET_LABEL[r.targetType] ?? r.targetType} #{r.targetId}</span>}</td>
                          <td>
                            {has ? (
                              <details>
                                <summary className="small" style={{ cursor: "pointer", color: "var(--accent-ink)" }}>Show what changed</summary>
                                {r.before != null && <><div className="small muted" style={{ marginTop: 6 }}>Before</div><pre className="audit-json">{json(r.before)}</pre></>}
                                {r.after != null && <><div className="small muted" style={{ marginTop: 6 }}>After</div><pre className="audit-json">{json(r.after)}</pre></>}
                              </details>
                            ) : <span className="muted">—</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <Pager page={page} pageSize={PAGE} total={d.total} onPage={setPage} />
            </>
          )}
      </Card>
    </>
  )
}
