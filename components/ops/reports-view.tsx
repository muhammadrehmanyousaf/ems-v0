"use client"

// Reports (spec section 13). Two tabs, one per team, over one date range. Quality sits beside volume on purpose: a count on its own
// rewards the wrong behaviour. A lead sees their own teams; a manager sees everything and can narrow by team and city.
import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { BarChart3, Download } from "lucide-react"

import { useOps } from "@/components/ops/ops-shell"
import { SOURCE_LABEL } from "@/components/ops/client-bits"
import { Btn, Card, Empty, ErrorState, Field, Input, Kpi, PageHead, Select, Seg, SkelRows, TabBar, useOpsToast } from "@/components/ops/ops-ui"
import { opsApi, opsErrorMessage } from "@/lib/api/ops"
import { opsReportsApi, type Report, type TeamAReport, type TeamBReport } from "@/lib/api/ops-reports"

type Tab = "a" | "b"
type Preset = "7" | "30" | "90" | "custom"

/** Today in Karachi, not in the browser's zone: the report's days are Karachi days. */
const karachiDay = (back = 0) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date(Date.now() - back * 86400000))

const pct = (v: number | null | undefined) => (v == null ? "—" : `${v}%`)
const fmtMins = (m: number | null | undefined) => (m == null ? "—" : m < 60 ? `${Math.round(m)} min` : m < 1440 ? `${(m / 60).toFixed(1)} h` : `${(m / 1440).toFixed(1)} days`)
const fmtHours = (h: number | null | undefined) => (h == null ? "—" : fmtMins(h * 60))
const dayLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })

function Bars({ rows, empty }: { rows: { label: string; n: number }[]; empty: string }) {
  if (rows.length === 0) return <p className="small muted" style={{ margin: 0 }}>{empty}</p>
  const max = Math.max(...rows.map((r) => r.n), 1)
  return (
    <div className="hbars">
      {rows.map((r) => (
        <div className="hbar" key={r.label}>
          <span className="hb-l" title={r.label}>{r.label}</span>
          <span className="hb-t" aria-hidden><i style={{ width: `${Math.max(2, (r.n / max) * 100)}%` }} /></span>
          <span className="hb-v">{r.n}</span>
        </div>
      ))}
    </div>
  )
}

/** Every Karachi day in the range, zero days included, so a quiet day shows as a quiet day and not as a missing bar. */
function fillDays(rows: { day: string; n: number }[], from: string, to: string) {
  const by = new Map(rows.map((r) => [r.day, r.n]))
  const out: { day: string; n: number }[] = []
  for (let t = new Date(`${from}T00:00:00Z`).getTime(), stop = new Date(`${to}T00:00:00Z`).getTime(); t <= stop; t += 86400000) {
    const d = new Date(t).toISOString().slice(0, 10)
    out.push({ day: d, n: by.get(d) ?? 0 })
  }
  return out
}

function PerDay({ rows, from, to }: { rows: { day: string; n: number }[]; from: string; to: string }) {
  if (rows.length === 0) return <p className="small muted" style={{ margin: 0 }}>Nothing was taken live in this period.</p>
  const days = fillDays(rows, from, to)
  const max = Math.max(...days.map((r) => r.n), 1)
  return (
    <div>
      <div className="spark" style={{ gap: days.length > 60 ? 1 : 3 }} role="img" aria-label={`Listings taken live per day: ${days.filter((r) => r.n > 0).map((r) => `${dayLabel(r.day)} ${r.n}`).join(", ")}`}>
        {days.map((r) => <span className="sp" key={r.day} title={`${dayLabel(r.day)}: ${r.n}`}><i style={{ height: r.n > 0 ? `${(r.n / max) * 100}%` : 2, opacity: r.n > 0 ? 1 : 0.35 }} /></span>)}
      </div>
      <div className="spark-l"><span>{dayLabel(days[0].day)}</span><span>Most in one day: {max}</span><span>{dayLabel(days[days.length - 1].day)}</span></div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="small" style={{ margin: "4px 0 10px", color: "var(--ink-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11.5 }}>{title}</h2>
      <div className="kpis" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>{children}</div>
    </div>
  )
}

function TeamAView({ a, range }: { a: TeamAReport; range: { from: string; to: string } }) {
  return (
    <div className="stack">
      <Section title="Activity">
        <Kpi label="Prospects imported" value={a.imported} note="New in this period" />
        <Kpi label="Prospects called" value={a.called} note={`${a.contacts} contacts logged`} />
        <Kpi label="Connected" value={a.connected} note={`${pct(a.connectRate)} of those called`} />
        <Kpi label="Interested" value={a.interested} note={`${pct(a.interestedRate)} of those connected`} />
        <Kpi label="Listings taken live" value={a.onboarded.total} note={`${a.onboarded.newListings} new · ${a.onboarded.takeovers} taken over`} />
        <Kpi label="Callbacks overdue now" value={a.overdueCallbacks} note="More than an hour late" />
      </Section>
      <Section title="Quality">
        <Kpi label="Average completeness" value={a.onboarded.avgCompleteness == null ? "—" : `${a.onboarded.avgCompleteness}%`} note="Of listings taken live" />
        <Kpi label="Venues with price and capacity" value={pct(a.onboarded.venuePriceCapacityRate)} note={`${a.onboarded.venuesWithPriceAndCapacity} of ${a.onboarded.venues} venues`} />
        <Kpi label="Written consent" value={pct(a.consent.writtenRate)} note={`${a.consent.verbalOnly} spoken only · ${a.consent.none} none · ${a.consent.withdrawn} withdrawn`} />
        <Kpi label="QA pass rate" value={pct(a.qa.passRate)} note={`${a.qa.queued} waiting · ${a.qa.flagged} flagged`} />
        <Kpi label="Import to first call" value={fmtHours(a.medianHoursImportToFirstCall)} note={`Median, ${a.firstCalled} prospects`} />
      </Section>
      <div className="grid2">
        <Card title="Listings taken live, per day"><PerDay rows={a.onboarded.byDay} from={range.from} to={range.to} /></Card>
        <Card title="How the calls ended" sub="Every logged contact, by the outcome picked."><Bars rows={a.dropoff.map((d) => ({ label: d.label, n: d.n }))} empty="No calls were logged in this period." /></Card>
      </div>
      <Card title="By city" flush>
        {a.byCity.length === 0 ? <div style={{ padding: 16 }}><p className="small muted" style={{ margin: 0 }}>No activity in this period.</p></div> : (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>City</th><th className="r">Imported</th><th className="r">Called</th><th className="r">Taken live</th></tr></thead>
            <tbody>{a.byCity.map((c) => <tr key={c.city}><td className="td-name">{c.city}</td><td className="r num">{c.imported}</td><td className="r num">{c.called}</td><td className="r num">{c.onboarded}</td></tr>)}</tbody>
          </table></div>
        )}
      </Card>
      <Card title="People" sub="Volume next to quality, so a number of calls is never read on its own." flush>
        {a.agents.length === 0 ? <div style={{ padding: 16 }}><p className="small muted" style={{ margin: 0 }}>No one on a vendor outreach team in this view.</p></div> : (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Person</th><th className="r">Contacts</th><th className="r">Called</th><th className="r">Connected</th><th className="r">Interested</th><th className="r">Taken live</th><th className="r">Completeness</th><th className="r">QA passed</th><th className="r">QA flagged</th><th className="r">Callbacks overdue</th></tr></thead>
            <tbody>{a.agents.map((p) => (
              <tr key={p.userId}>
                <td style={{ minWidth: 180 }}><div className="td-name">{p.name}</div><div className="td-sub">{p.teams.join(" · ")}</div></td>
                <td className="r num">{p.contacts}</td><td className="r num">{p.called}</td>
                <td className="r num">{p.connected}{p.connectRate != null && <span className="td-sub" style={{ display: "inline", marginLeft: 6 }}>{p.connectRate}%</span>}</td>
                <td className="r num">{p.interested}</td><td className="r num">{p.onboarded}</td>
                <td className="r num">{p.avgCompleteness == null ? "—" : `${p.avgCompleteness}%`}</td>
                <td className="r num">{p.qaPassed}</td><td className="r num">{p.qaFlagged > 0 ? <b style={{ color: "var(--bad)" }}>{p.qaFlagged}</b> : 0}</td>
                <td className="r num">{p.overdueCallbacks > 0 ? <b style={{ color: "var(--bad)" }}>{p.overdueCallbacks}</b> : 0}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
    </div>
  )
}

function TeamBView({ b }: { b: TeamBReport }) {
  const as = b.assignments
  return (
    <div className="stack">
      <Section title="Clients who asked in this period">
        <Kpi label="Clients received" value={b.received} note={`${b.responded} have had a reply`} />
        <Kpi label="Replied in time" value={pct(b.firstResponse.withinSlaRate)} note={`Within ${b.firstResponse.slaMinutes} min, of all received`} />
        <Kpi label="Median first reply" value={fmtMins(b.firstResponse.medianMinutes)} note="Of those who got one" />
        <Kpi label="Unanswered and late now" value={b.firstResponse.unansweredOverdue} note="Still waiting past the target" />
        <Kpi label="Qualified" value={pct(b.qualifiedRate)} note={`${b.qualified} reached a shortlist`} />
        <Kpi label="Booked" value={pct(b.bookedRate)} note={`${b.booked} booked · ${b.lost} lost`} />
      </Section>
      <Section title="Handed to vendor managers">
        <Kpi label="Handed over" value={as.handedOver} note={`${as.done} finished · ${as.open} open`} />
        <Kpi label="Median time to first check" value={fmtHours(as.medianHoursToFirstAction)} note="From hand-over to the first venue result" />
        <Kpi label="Checked in time" value={pct(as.withinSlaRate)} note={`Within ${as.slaHours} h, of all handed over`} />
        <Kpi label="Idle and late now" value={as.idleOverdue} note="Open, no venue checked yet" />
      </Section>
      <div className="grid2">
        <Card title="Why clients were lost" sub="The reason the desk wrote when closing them."><Bars rows={b.lostReasons.map((r) => ({ label: r.reason, n: r.n }))} empty="No clients were lost in this period." /></Card>
        <Card title="By where they came from" flush>
          {b.bySource.length === 0 ? <div style={{ padding: 16 }}><p className="small muted" style={{ margin: 0 }}>No clients in this period.</p></div> : (
            <div className="tbl-wrap"><table className="tbl">
              <thead><tr><th>Source</th><th className="r">Received</th><th className="r">Booked</th><th className="r">Booked %</th></tr></thead>
              <tbody>{b.bySource.map((s) => <tr key={s.source}><td className="td-name">{SOURCE_LABEL[s.source as keyof typeof SOURCE_LABEL] ?? s.source}</td><td className="r num">{s.received}</td><td className="r num">{s.booked}</td><td className="r num">{pct(s.bookedRate)}</td></tr>)}</tbody>
            </table></div>
          )}
        </Card>
      </div>
      <Card title="By city" flush>
        {b.byCity.length === 0 ? <div style={{ padding: 16 }}><p className="small muted" style={{ margin: 0 }}>No clients in this period.</p></div> : (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>City</th><th className="r">Received</th><th className="r">Booked</th><th className="r">Booked %</th></tr></thead>
            <tbody>{b.byCity.map((c) => <tr key={c.city}><td className="td-name">{c.city}</td><td className="r num">{c.received}</td><td className="r num">{c.booked}</td><td className="r num">{pct(c.bookedRate)}</td></tr>)}</tbody>
          </table></div>
        )}
      </Card>
      <Card title="Client desk" sub="Counted by who owns the client now." flush>
        {b.agents.length === 0 ? <div style={{ padding: 16 }}><p className="small muted" style={{ margin: 0 }}>No one on a client desk in this view.</p></div> : (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Person</th><th className="r">Received</th><th className="r">Replied</th><th className="r">In time</th><th className="r">Median reply</th><th className="r">Booked</th><th className="r">Late now</th><th className="r">Handed over</th></tr></thead>
            <tbody>{b.agents.map((p) => (
              <tr key={p.userId}>
                <td style={{ minWidth: 180 }}><div className="td-name">{p.name}</div><div className="td-sub">{p.teams.join(" · ")}</div></td>
                <td className="r num">{p.received}</td><td className="r num">{p.responded}</td>
                <td className="r num">{p.withinSla}{p.withinSlaRate != null && <span className="td-sub" style={{ display: "inline", marginLeft: 6 }}>{p.withinSlaRate}%</span>}</td>
                <td className="r num">{fmtMins(p.medianMinutes)}</td><td className="r num">{p.booked}</td>
                <td className="r num">{p.unansweredOverdue > 0 ? <b style={{ color: "var(--bad)" }}>{p.unansweredOverdue}</b> : 0}</td>
                <td className="r num">{p.handedOver}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
      <Card title="Vendor managers" sub="People who were handed clients, whichever team they sit on." flush>
        {b.managers.length === 0 ? <div style={{ padding: 16 }}><p className="small muted" style={{ margin: 0 }}>No client was handed over in this period.</p></div> : (
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>Person</th><th className="r">Received</th><th className="r">Finished</th><th className="r">Open</th><th className="r">Checked in time</th><th className="r">Median to first check</th><th className="r">Idle and late</th></tr></thead>
            <tbody>{b.managers.map((m) => (
              <tr key={m.userId}>
                <td className="td-name">{m.name}</td><td className="r num">{m.received}</td><td className="r num">{m.done}</td><td className="r num">{m.open}</td>
                <td className="r num">{m.withinSla}{m.withinSlaRate != null && <span className="td-sub" style={{ display: "inline", marginLeft: 6 }}>{m.withinSlaRate}%</span>}</td>
                <td className="r num">{fmtHours(m.medianHours)}</td>
                <td className="r num">{m.idleOverdue > 0 ? <b style={{ color: "var(--bad)" }}>{m.idleOverdue}</b> : 0}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
    </div>
  )
}

export function ReportsView() {
  const { can } = useOps()
  const toast = useOpsToast()
  const [tab, setTab] = useState<Tab>("a")
  const [from, setFrom] = useState(() => karachiDay(29))
  const [to, setTo] = useState(() => karachiDay(0))
  const [cityId, setCityId] = useState("")
  const [teamId, setTeamId] = useState("")

  const preset: Preset = to === karachiDay(0) ? (from === karachiDay(6) ? "7" : from === karachiDay(29) ? "30" : from === karachiDay(89) ? "90" : "custom") : "custom"
  const pick = (p: Preset) => { if (p === "custom") return; setTo(karachiDay(0)); setFrom(karachiDay(Number(p) - 1)) }

  const cities = useQuery({ queryKey: ["ops", "cities"], queryFn: opsApi.cities })
  const teams = useQuery({ queryKey: ["ops", "teams"], queryFn: opsApi.teams, enabled: can(["ops_prospect_view_team", "ops_settings"]), retry: false })
  const badRange = !from || !to || from > to
  const report = useQuery<Report>({
    queryKey: ["ops", "report", from, to, cityId, teamId],
    queryFn: () => opsReportsApi.overview({ from, to, cityId: cityId || undefined, teamId: teamId || undefined }),
    enabled: !badRange, placeholderData: (p) => p, staleTime: 30000,
  })
  const exportCsv = useMutation({
    mutationFn: () => opsReportsApi.downloadClients({ from, to, cityId: cityId || undefined }),
    onSuccess: () => toast({ title: "Export started", body: "The download is recorded in the audit trail." }),
    onError: (e) => toast({ title: "Couldn't export", body: e instanceof Error ? e.message : "Please try again.", tone: "bad" }),
  })

  const r = report.data
  return (
    <>
      <PageHead
        title="Reports"
        sub="How each team is doing, with quality next to volume. A lead sees their own teams; a manager sees everything."
        actions={can("ops_export") && tab === "b" ? <Btn icon={<Download aria-hidden />} loading={exportCsv.isPending} disabled={badRange} onClick={() => exportCsv.mutate()}>Export clients (CSV)</Btn> : undefined}
      />
      <div className="toolbar">
        <Seg<Preset> label="Period" value={preset} onChange={pick} options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "90", label: "90 days" }, ...(preset === "custom" ? [{ value: "custom" as const, label: "Custom" }] : [])]} />
        <div className="filters">
          <Field label="From" htmlFor="rp-from"><Input id="rp-from" type="date" compact value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="To" htmlFor="rp-to"><Input id="rp-to" type="date" compact value={to} min={from} max={karachiDay(0)} onChange={(e) => setTo(e.target.value)} /></Field>
          <Select aria-label="City" value={cityId} onChange={(e) => setCityId(e.target.value)} style={{ width: 150 }}><option value="">All cities</option>{(cities.data?.cities ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
          {(teams.data?.teams.length ?? 0) > 1 && <Select aria-label="Team" value={teamId} onChange={(e) => setTeamId(e.target.value)} style={{ width: 180 }}><option value="">All my teams</option>{teams.data!.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>}
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <TabBar<Tab> label="Team" value={tab} onChange={setTab} tabs={[{ value: "a", label: "Vendor outreach (Team A)" }, { value: "b", label: "Client desk (Team B)" }]} />
      </div>

      {badRange ? <Card><Empty icon={<BarChart3 />} title="Check the dates">The start date must be on or before the end date.</Empty></Card>
        : report.isLoading ? <Card flush><SkelRows rows={8} /></Card>
        : report.isError ? <ErrorState message={opsErrorMessage(report.error)} onRetry={() => report.refetch()} />
        : r ? (
          <div className="stack" style={{ opacity: report.isFetching ? 0.7 : 1, transition: "opacity .15s" }}>
            <p className="small muted" style={{ margin: 0 }}>{new Date(`${r.range.from}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })} to {new Date(`${r.range.to}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })} · {r.range.days} day{r.range.days === 1 ? "" : "s"}, Karachi time</p>
            {tab === "a" ? <TeamAView a={r.teamA} range={r.range} /> : <TeamBView b={r.teamB} />}
            <Card>
              <details className="how">
                <summary>How these numbers are counted</summary>
                <ul>
                  <li><b>Days</b> are Karachi days, from the start of the first to the end of the last.</li>
                  <li><b>Called</b> is a prospect with at least one logged contact in the period; <b>connected</b> is one where someone actually spoke. <b>Interested</b> is measured against connected, because a no-answer cannot be interested.</li>
                  <li><b>Taken live</b> is a listing the portal published in the period, new or taken over. <b>Consent</b> uses each listing&apos;s latest entry, so a later &ldquo;no&rdquo; overrides an earlier &ldquo;yes&rdquo;.</li>
                  <li><b>Clients</b> are a group: those who arrived in the period, and what has happened to them since. <b>Qualified</b> means they reached a shortlist. <b>Replied in time</b> counts every client received, so an unanswered one counts against the desk.</li>
                  <li><b>First reply</b> runs from when the client asked (for a website inquiry, when the couple wrote) to the first logged call or WhatsApp. A note does not count.</li>
                  <li><b>Vendor managers</b>: time to first check runs from being handed a client to the first venue result. Cancelled hand-overs are left out.</li>
                  <li><b>Not measured:</b> how many vendors an agent offered to take over versus how many accepted. Only the takeovers that happened are counted.</li>
                </ul>
              </details>
            </Card>
          </div>
        ) : null}
    </>
  )
}
