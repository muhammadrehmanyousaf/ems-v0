"use client"

// Executive Analytics & Operations Control Tower (spec section 13 + COO insights across Team A, Team B, Catalog & Revenue).
import Link from "next/link"
import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { AlertTriangle, ArrowRight, BarChart3, Download, TrendingUp } from "lucide-react"

import { useOps } from "@/components/ops/ops-shell"
import { SOURCE_LABEL } from "@/components/ops/client-bits"
import { Btn, Card, Empty, ErrorState, Field, Input, Kpi, PageHead, Select, Seg, SkelRows, Status, TabBar, useOpsToast, fmtNum } from "@/components/ops/ops-ui"
import { opsApi, opsErrorMessage } from "@/lib/api/ops"
import { opsReportsApi, type ExecutiveKpiStat, type ExecutiveReport, type GeoReport, type Report, type TeamAReport, type TeamBReport } from "@/lib/api/ops-reports"
import { VENDOR_TYPES } from "@/lib/vendor-types"

type Tab = "exec" | "catalog" | "geo" | "a" | "b"
type Preset = "1" | "7" | "30" | "90" | "custom"
type VelocityMetric = "bookings" | "clients" | "calls" | "onboarded" | "gmv"

/** Today in Karachi, not in the browser's zone: the report's days are Karachi days. */
const karachiDay = (back = 0) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date(Date.now() - back * 86400000))

const pct = (v: number | null | undefined) => (v == null ? "—" : `${v}%`)
const fmtMins = (m: number | null | undefined) => (m == null ? "—" : m < 60 ? `${Math.round(m)} min` : m < 1440 ? `${(m / 60).toFixed(1)} h` : `${(m / 1440).toFixed(1)} days`)
const fmtHours = (h: number | null | undefined) => (h == null ? "—" : fmtMins(h * 60))
const dayLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })
const fmtPkrShort = (n: number | null | undefined) => {
  const v = Number(n || 0)
  if (v === 0) return "PKR 0"
  if (v >= 10000000) return `PKR ${(v / 10000000).toFixed(2)} Cr`
  if (v >= 100000) return `PKR ${(v / 100000).toFixed(1)} Lac`
  return `PKR ${v.toLocaleString("en-PK")}`
}

const STAGE_LABEL: Record<string, string> = {
  new: "New / Unworked",
  vendor_contacted: "Vendor Contacted",
  vendor_confirmed: "Vendor Ready",
  couple_confirmed: "Couple Ready",
  ready: "All Ready",
  issue: "Need Help / Issue",
  resolved: "Completed / Closed",
}

function DeltaBadge({ stat }: { stat: ExecutiveKpiStat | undefined }) {
  if (!stat || stat.deltaPct == null) return null
  const d = stat.deltaPct
  const cls = d > 0 ? "up" : d < 0 ? "down" : "flat"
  return <span className={`delta ${cls}`}>{d > 0 ? `+${d}%` : `${d}%`}</span>
}

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

export function GeoReportView({
  geo,
  selectedCity,
  onPickCity,
  subAreaSearch,
  onSubAreaSearch,
}: {
  geo: GeoReport
  selectedCity: string
  onPickCity: (city: string) => void
  subAreaSearch: string
  onSubAreaSearch: (v: string) => void
}) {
  const s = geo.summary
  const qLower = subAreaSearch.trim().toLowerCase()
  const subRows = qLower
    ? geo.bySubArea.filter((r) => r.subArea.toLowerCase().includes(qLower) || r.city.toLowerCase().includes(qLower))
    : geo.bySubArea

  return (
    <div className="stack">
      <Section title="City & Sub-Area Overview">
        <Kpi label="Cities tracked" value={s.totalCities} note={`${s.totalSubAreas} sub-areas active`} />
        <Kpi label="Live vendors vs total" value={`${s.liveVendors} / ${s.totalVendors}`} note={s.topDemandCity ? `Busiest city: ${s.topDemandCity}` : undefined} />
        <Kpi label="Couple inquiries" value={s.clientsReceived} note={`${s.websiteLeads} direct website leads`} />
        <Kpi label="Booked (clients / portal)" value={`${s.clientsBooked} / ${s.bookingsCount}`} note={s.topDemandSubArea ? `Top area: ${s.topDemandSubArea}` : undefined} />
        <Kpi label="Areas needing halls" value={s.supplyGapSubAreas} note={s.biggestGapSubArea ? `Priority: ${s.biggestGapSubArea}` : "Supply healthy"} />
      </Section>

      <Card
        title="City-Wise Performance & Conversion Funnel"
        sub="Click any city row to drill down into all sub-areas inside that city."
        flush
      >
        {geo.byCity.length === 0 ? (
          <div style={{ padding: 16 }}><p className="small muted" style={{ margin: 0 }}>No city records for this range.</p></div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>City</th>
                  <th className="r">Sub-Areas</th>
                  <th className="r">Live / Total Halls</th>
                  <th className="r">Missing Photos / Price</th>
                  <th className="r">Web Leads</th>
                  <th className="r">Clients</th>
                  <th className="r">Shortlisted</th>
                  <th className="r">Visits</th>
                  <th className="r">Booked</th>
                  <th className="r">Booked %</th>
                </tr>
              </thead>
              <tbody>
                {geo.byCity.map((c) => {
                  const picked = selectedCity.toLowerCase() === c.city.toLowerCase()
                  return (
                    <tr
                      key={c.city}
                      className="click"
                      style={picked ? { background: "var(--accent-wash)" } : undefined}
                      onClick={() => onPickCity(picked ? "" : c.city)}
                    >
                      <td className="td-name" style={{ textDecoration: "underline", textDecorationColor: "var(--border-2)" }}>{c.city}</td>
                      <td className="r num">{c.subAreaCount}</td>
                      <td className="r num"><b>{c.live}</b> / {c.totalVendors}</td>
                      <td className="r num td-mut">{c.missingPhotos} / {c.missingPrices}</td>
                      <td className="r num">{c.websiteLeads}</td>
                      <td className="r num">{c.clientsReceived}</td>
                      <td className="r num">{c.shortlistRequests}</td>
                      <td className="r num">{c.clientsVisits}</td>
                      <td className="r num"><b>{c.clientsBooked + c.bookings}</b></td>
                      <td className="r num">{pct(c.bookedRate)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title={selectedCity ? `Sub-Areas in ${selectedCity}` : "Sub-Area Demand vs Supply Deep Dive"}
        sub="Shows where couples are searching vs how many live complete halls we actually have in each neighborhood."
        actions={
          <div className="row" style={{ gap: 8 }}>
            <Input
              aria-label="Filter sub-area"
              compact
              value={subAreaSearch}
              onChange={(e) => onSubAreaSearch(e.target.value)}
              placeholder="Filter area (e.g. Gulberg, DHA)..."
              style={{ width: 220 }}
            />
            {selectedCity && <Btn size="sm" onClick={() => onPickCity("")}>Show all cities</Btn>}
          </div>
        }
        flush
      >
        {subRows.length === 0 ? (
          <div style={{ padding: 16 }}><p className="small muted" style={{ margin: 0 }}>No matching sub-areas found.</p></div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Area / City</th>
                  <th className="r">Live / Total</th>
                  <th className="r">Photo / Price Gaps</th>
                  <th className="r">Outreach List</th>
                  <th className="r">Web Leads</th>
                  <th className="r">Shortlist Picks</th>
                  <th className="r">Free Reply %</th>
                  <th className="r">Visits / Booked</th>
                  <th>Area Status</th>
                </tr>
              </thead>
              <tbody>
                {subRows.map((r) => (
                  <tr key={`${r.city}::${r.subArea}`}>
                    <td>
                      <div className="td-name">{r.subArea}</div>
                      <div className="td-sub">{r.city}</div>
                    </td>
                    <td className="r num"><b>{r.supply.live}</b> / {r.supply.total}</td>
                    <td className="r num td-mut">{r.supply.missingPhotos} / {r.supply.missingPrices}</td>
                    <td className="r num">{r.outreach.prospects}</td>
                    <td className="r num">{r.demand.websiteLeads}</td>
                    <td className="r num">{r.demand.shortlistRequests}</td>
                    <td className="r num">{pct(r.demand.freeRate)}</td>
                    <td className="r num">{r.demand.visits} / <b>{r.demand.bookedClients + r.demand.bookings}</b></td>
                    <td><Status tone={r.gap.tone}>{r.gap.label}</Status></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function ExecutiveControlTowerView({ ex }: { ex: ExecutiveReport }) {
  const [metric, setMetric] = useState<VelocityMetric>("calls")

  const series = ex.daily.map((d) => {
    const val =
      metric === "bookings" ? d.bookings
        : metric === "clients" ? d.clientsReceived
          : metric === "calls" ? d.calls
            : metric === "onboarded" ? d.onboarded
              : Math.round(d.gmvPkr)
    return {
      day: d.day,
      val,
      sub:
        metric === "calls" ? `${d.calls} calls (${d.connected} spoke)`
          : metric === "clients" ? `${d.clientsReceived} clients (${d.clientsBooked} booked)`
            : metric === "bookings" ? `${d.bookings} bookings`
              : metric === "onboarded" ? `${d.onboarded} listed`
                : fmtPkrShort(d.gmvPkr),
    }
  })
  const maxVal = Math.max(...series.map((s) => s.val), 1)
  const totalSeries = series.reduce((a, b) => a + b.val, 0)

  const al = ex.alerts
  const ch = ex.catalogHealth
  const bk = ex.bookings
  const pool = ex.prospectPool

  const alertItems: { label: string; value: number; href: string; tone: "ok" | "warn" | "bad"; sub: string }[] = [
    { label: "Late Couple Replies", value: al.overdueFirstReplies, href: "/ops/clients?view=needs_response", tone: al.overdueFirstReplies > 0 ? "bad" : "ok", sub: "Waiting past response SLA" },
    { label: "Idle Handovers (Team A)", value: al.overdueHandovers, href: "/ops/assigned", tone: al.overdueHandovers > 0 ? "bad" : "ok", sub: "Unchecked beyond SLA" },
    { label: "Late Vendor Callbacks", value: al.overdueVendorCallbacks, href: "/ops/tasks", tone: al.overdueVendorCallbacks > 0 ? "warn" : "ok", sub: "Tasks > 1h overdue" },
    { label: "Bookings Need Confirm", value: al.bookingsNeedsAction, href: "/ops/bookings?view=needs_action", tone: al.bookingsNeedsAction > 0 ? "warn" : "ok", sub: "Vendor/couple call pending" },
    { label: "Bookings With Issues", value: al.bookingsIssue, href: "/ops/bookings", tone: al.bookingsIssue > 0 ? "bad" : "ok", sub: "Flagged in bookings desk" },
    { label: "Visits Next 48h", value: al.upcomingVisits48h, href: "/ops/clients?view=visits", tone: "ok", sub: "Hall & couple reminders" },
    { label: "QA Review Queue", value: al.qaPendingOrFlagged, href: "/ops/quality", tone: al.qaPendingOrFlagged > 0 ? "warn" : "ok", sub: "Listings awaiting second look" },
    { label: "Consent Withdrawn", value: al.withdrawnConsents, href: "/ops/quality", tone: al.withdrawnConsents > 0 ? "bad" : "ok", sub: "Vendors pulled consent" },
  ]

  return (
    <div className="stack">
      <Section title="North-Star Performance (vs previous equal period)">
        <Kpi
          label="Confirmed GMV"
          value={<>{fmtPkrShort(ex.kpis.confirmedGmvPkr.current)}<DeltaBadge stat={ex.kpis.confirmedGmvPkr} /></>}
          note={`Pipeline total: ${fmtPkrShort(bk.pipelineGmvPkr)} · Paid ${fmtPkrShort(bk.downPaymentCollectedPkr)}`}
        />
        <Kpi
          label="Bookings Created"
          value={<>{fmtNum(ex.kpis.bookingsCreated.current)}<DeltaBadge stat={ex.kpis.bookingsCreated} /></>}
          note={`${ex.kpis.bookingsConfirmed.current} confirmed · ${bk.online} online / ${bk.offline} ops`}
        />
        <Kpi
          label="Couples Received"
          value={<>{fmtNum(ex.kpis.clientsReceived.current)}<DeltaBadge stat={ex.kpis.clientsReceived} /></>}
          note={`${ex.teamB.responded} replied (${pct(ex.teamB.firstResponse.withinSlaRate)} in SLA)`}
        />
        <Kpi
          label="Couple Booked Rate"
          value={<>{pct(ex.teamB.bookedRate)}<DeltaBadge stat={ex.kpis.clientsBooked} /></>}
          note={`${ex.teamB.booked} booked · ${ex.teamB.qualified} shortlisted`}
        />
        <Kpi
          label="Vendor Outreach Calls"
          value={<>{fmtNum(ex.kpis.vendorCalls.current)}<DeltaBadge stat={ex.kpis.vendorCalls} /></>}
          note={`${ex.teamA.connected} spoke (${pct(ex.teamA.connectRate)}) · ${ex.teamA.interested} interested`}
        />
        <Kpi
          label="Vendors Onboarded"
          value={<>{fmtNum(ex.kpis.vendorsOnboarded.current)}<DeltaBadge stat={ex.kpis.vendorsOnboarded} /></>}
          note={`${ex.teamA.onboarded.newListings} new · ${ex.teamA.onboarded.takeovers} takeovers`}
        />
        <Kpi
          label="Live Marketplace Vendors"
          value={<>{fmtNum(ch.live)} / {fmtNum(ch.total)}</>}
          note={`${pct(ch.livePct)} live · Avg completeness ${ch.gaps.avgCompleteness ?? 0}%`}
        />
        <Kpi
          label="Median Client Reply"
          value={fmtMins(ex.teamB.firstResponse.medianMinutes)}
          note={`Handover check: ${fmtHours(ex.teamB.assignments.medianHoursToFirstAction)}`}
        />
      </Section>

      <div>
        <h2 className="small" style={{ margin: "4px 0 10px", color: "var(--ink-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", fontSize: 11.5 }}>
          Live SLA &amp; Operational Attention Required Now
        </h2>
        <div className="alert-grid">
          {alertItems.map((it) => (
            <Link key={it.label} href={it.href} className={`alert-tile ${it.value > 0 ? it.tone : ""}`}>
              <div className="row between" style={{ gap: 6 }}>
                <span className="small muted">{it.label}</span>
                {it.value > 0 && it.tone !== "ok" && <AlertTriangle size={13} aria-hidden />}
              </div>
              <div className="k-v num" style={{ fontSize: 21 }}>{fmtNum(it.value)}</div>
              <div className="small muted">{it.sub}</div>
            </Link>
          ))}
        </div>
      </div>

      <Card
        title="Daily Activity Velocity (Karachi Days)"
        sub={`Total in selected metric: ${metric === "gmv" ? fmtPkrShort(totalSeries) : fmtNum(totalSeries)} across ${ex.range.days} day${ex.range.days === 1 ? "" : "s"}`}
        actions={
          <Seg<VelocityMetric>
            label="Velocity metric"
            value={metric}
            onChange={setMetric}
            options={[
              { value: "calls", label: "Calls" },
              { value: "onboarded", label: "Onboarded" },
              { value: "clients", label: "Clients" },
              { value: "bookings", label: "Bookings" },
              { value: "gmv", label: "GMV PKR" },
            ]}
          />
        }
      >
        {series.length === 0 ? (
          <p className="small muted">No daily points in range.</p>
        ) : (
          <div>
            <div className="spark" style={{ gap: series.length > 60 ? 1 : 3, height: 108 }}>
              {series.map((s) => (
                <span className="sp" key={s.day} title={`${dayLabel(s.day)}: ${s.sub}`}>
                  <i style={{ height: s.val > 0 ? `${Math.max(6, (s.val / maxVal) * 100)}%` : 2, opacity: s.val > 0 ? 1 : 0.25 }} />
                </span>
              ))}
            </div>
            <div className="spark-l">
              <span>{dayLabel(series[0].day)}</span>
              <span>Peak day: {metric === "gmv" ? fmtPkrShort(maxVal) : fmtNum(maxVal)}</span>
              <span>{dayLabel(series[series.length - 1].day)}</span>
            </div>
          </div>
        )}
      </Card>

      <div className="grid2">
        <Card title="Vendor Acquisition & Supply Pool Funnel" sub={`${fmtNum(pool.totalPool)} active prospects in database · ${pool.needsLeadReview} waiting for lead review`}>
          <Bars
            rows={[
              { label: "Total Prospect Pool", n: pool.totalPool },
              { label: "Never Called Yet", n: pool.neverCalled },
              { label: "Calling in Progress", n: pool.inProgress },
              { label: "Interested / Hot", n: pool.interested },
              { label: "In Onboarding Sheet", n: pool.onboarding },
              { label: "Converted Live", n: pool.live },
              { label: "Closed / Not Interested", n: pool.closedOut },
            ]}
            empty="No prospects in selected team/city."
          />
        </Card>

        <Card title="Booking & Coordination Stage Breakdown" sub={`Pipeline value ${fmtPkrShort(bk.pipelineGmvPkr)} · Advance due ${fmtPkrShort(bk.advanceDuePkr)}`} flush>
          {bk.byStatus.length === 0 && bk.byStage.length === 0 ? (
            <div style={{ padding: 16 }}><p className="small muted">No bookings in this period.</p></div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr><th>Status / Stage</th><th className="r">Count</th><th className="r">Amount (PKR)</th></tr>
                </thead>
                <tbody>
                  {bk.byStatus.map((s) => (
                    <tr key={`st-${s.status}`}>
                      <td className="td-name">{s.status}</td>
                      <td className="r num">{s.n}</td>
                      <td className="r num">{fmtPkrShort(s.amountPkr)}</td>
                    </tr>
                  ))}
                  {bk.byStage.map((st) => (
                    <tr key={`op-${st.stage}`}>
                      <td className="td-sub">Ops Stage: {STAGE_LABEL[st.stage] ?? st.stage}</td>
                      <td className="r num">{st.n}</td>
                      <td className="r num muted">{fmtPkrShort(st.amountPkr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Card title="Top Performing Venues & Vendors (In Range)" sub="Ranked by Bookings, Shortlist Requests, and Website Inquiries." flush>
        {ex.topVendors.length === 0 ? (
          <div style={{ padding: 16 }}><p className="small muted">No venue demand activity in this period.</p></div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>City / Area</th>
                  <th className="r">Completeness</th>
                  <th className="r">Web Inquiries</th>
                  <th className="r">Client Shortlists</th>
                  <th className="r">Bookings</th>
                  <th className="r">Revenue (PKR)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ex.topVendors.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link href={`/ops/find/${v.id}`} className="td-name" style={{ textDecoration: "underline", textDecorationColor: "var(--border-2)" }}>
                        {v.name}
                      </Link>
                      <div className="td-sub">{v.vendorType || "Vendor"}</div>
                    </td>
                    <td className="td-mut">{[v.city, v.subArea].filter(Boolean).join(", ") || "—"}</td>
                    <td className="r num">{v.completenessScore}%</td>
                    <td className="r num">{v.leadsCount}</td>
                    <td className="r num">{v.shortlistsCount}</td>
                    <td className="r num"><b>{v.bookingsCount}</b></td>
                    <td className="r num">{v.revenuePkr > 0 ? fmtPkrShort(v.revenuePkr) : "—"}</td>
                    <td><Status tone={v.live ? "ok" : "mut"}>{v.live ? "Live" : "Hidden"}</Status></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Team A Leaderboard — Vendor Calls, Onboarding & Handover Checks" sub="Unified view combining outreach calls, onboarding quality, QA results, and couple venue availability checks." flush>
        {ex.teamA.agents.length === 0 ? (
          <div style={{ padding: 16 }}><p className="small muted">No Team A agents in scope.</p></div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th className="r">Calls</th>
                  <th className="r">Spoke %</th>
                  <th className="r">Interested</th>
                  <th className="r">Listed</th>
                  <th className="r">Avg Score</th>
                  <th className="r">Handovers Done</th>
                  <th className="r">Venues Checked</th>
                  <th className="r">Median Reply</th>
                  <th className="r">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {ex.teamA.agents.map((p) => (
                  <tr key={p.userId}>
                    <td><div className="td-name">{p.name}</div><div className="td-sub">{p.teams.join(" · ")}</div></td>
                    <td className="r num">{p.contacts}</td>
                    <td className="r num">{p.connected} {p.connectRate != null && <span className="td-sub" style={{ display: "inline" }}>({p.connectRate}%)</span>}</td>
                    <td className="r num">{p.interested}</td>
                    <td className="r num"><b>{p.onboarded}</b></td>
                    <td className="r num">{p.avgCompleteness == null ? "—" : `${p.avgCompleteness}%`}</td>
                    <td className="r num">{p.handoversDone} / {p.handoversReceived}</td>
                    <td className="r num">{p.venuesChecked} ({p.venuesAvailable} free)</td>
                    <td className="r num">{fmtHours(p.medianHandoverHours)}</td>
                    <td className="r num">{(p.overdueCallbacks + p.handoversOverdue) > 0 ? <b style={{ color: "var(--bad)" }}>{p.overdueCallbacks + p.handoversOverdue}</b> : 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Team B Leaderboard — Client Response SLA & Bookings Closed" flush>
        {ex.teamB.agents.length === 0 ? (
          <div style={{ padding: 16 }}><p className="small muted">No Team B agents in scope.</p></div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th className="r">Received</th>
                  <th className="r">Replied</th>
                  <th className="r">In SLA</th>
                  <th className="r">Median Reply</th>
                  <th className="r">Sent to Team A</th>
                  <th className="r">Booked</th>
                  <th className="r">Late Now</th>
                </tr>
              </thead>
              <tbody>
                {ex.teamB.agents.map((p) => (
                  <tr key={p.userId}>
                    <td><div className="td-name">{p.name}</div><div className="td-sub">{p.teams.join(" · ")}</div></td>
                    <td className="r num">{p.received}</td>
                    <td className="r num">{p.responded}</td>
                    <td className="r num">{p.withinSla} {p.withinSlaRate != null && <span className="td-sub" style={{ display: "inline" }}>({p.withinSlaRate}%)</span>}</td>
                    <td className="r num">{fmtMins(p.medianMinutes)}</td>
                    <td className="r num">{p.handedOver}</td>
                    <td className="r num"><b>{p.booked}</b></td>
                    <td className="r num">{p.unansweredOverdue > 0 ? <b style={{ color: "var(--bad)" }}>{p.unansweredOverdue}</b> : 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function CatalogHealthView({ ex }: { ex: ExecutiveReport }) {
  const ch = ex.catalogHealth
  const g = ch.gaps

  const gapMeters: { label: string; count: number; pctGood: number | null; href: string; tone: string; hint: string }[] = [
    { label: "Placeholder Phones (03274811220)", count: g.placeholderPhones, pctGood: g.realPhonesPct, href: "/ops/find?needs=placeholder_phone", tone: "var(--bad)", hint: "Real phone coverage across catalog" },
    { label: "Missing Sub-Area / Neighborhood", count: g.missingSubArea, pctGood: g.withSubAreaPct, href: "/ops/find?needs=no_subarea", tone: "var(--warn)", hint: "Listings with sub-area filled" },
    { label: "Missing Photos", count: g.missingPhotos, pctGood: g.withPhotosPct, href: "/ops/find?needs=no_photos", tone: "var(--warn)", hint: "Listings with >= 1 photo" },
    { label: "Missing Price / Packages / Menus", count: g.missingPricing, pctGood: g.withPricingPct, href: "/ops/find?needs=no_price", tone: "var(--info)", hint: "Listings with rate or menu" },
    { label: "Low Completeness (< 60%)", count: g.lowCompleteness, pctGood: ch.total ? Math.round(((ch.total - g.lowCompleteness) / ch.total) * 1000) / 10 : null, href: "/ops/find?needs=low_completeness", tone: "var(--accent)", hint: "Profiles meeting quality threshold" },
  ]

  return (
    <div className="stack">
      <Section title="Marketplace Inventory & Visibility">
        <Kpi label="Total Vendors" value={fmtNum(ch.total)} note={`Avg completeness ${g.avgCompleteness ?? 0}%`} />
        <Kpi label="Live Public" value={fmtNum(ch.live)} note={`${pct(ch.livePct)} visible to couples`} />
        <Kpi label="Not Live (Draft / Review / Off)" value={fmtNum(ch.notLive)} note={`${ch.byStatus.submitted} submitted · ${ch.byStatus.pendingReview} pending · ${ch.byStatus.suspended} off`} />
        <Kpi label="By Source" value={`${fmtNum(ch.bySource.imported)} imp`} note={`${ch.bySource.registered} direct · ${ch.bySource.portal} ops`} />
        <Kpi label="Venues Missing Capacity" value={fmtNum(g.missingCapacity)} note={`Out of ${fmtNum(g.totalVenues)} wedding venues`} />
      </Section>

      <Card title="Data Hygiene & Cleanup Priorities" sub="Click Fix in Directory on any row to jump directly to the vendors needing cleanup.">
        <div className="stack" style={{ gap: 14 }}>
          {gapMeters.map((m) => (
            <div key={m.label}>
              <div className="row between" style={{ gap: 8 }}>
                <div>
                  <span className="td-name">{m.label}: <b>{fmtNum(m.count)}</b> missing</span>
                  <span className="small muted" style={{ marginLeft: 8 }}>{m.hint}: {pct(m.pctGood)}</span>
                </div>
                <Link href={m.href} className="btn btn-ghost sm">
                  Fix in Directory <ArrowRight size={13} aria-hidden />
                </Link>
              </div>
              <div className="health-meter">
                <i style={{ width: `${Math.min(100, Math.max(2, m.pctGood ?? 0))}%`, background: m.tone }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Catalog Quality & Demand by Vendor Category" sub="All vendor categories across WeddingWala.pk — click any category to inspect its listings." flush>
        {ch.byCategory.length === 0 ? (
          <div style={{ padding: 16 }}><p className="small muted">No vendors match current filters.</p></div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="r">Total</th>
                  <th className="r">Live (%)</th>
                  <th className="r">Real Phones (%)</th>
                  <th className="r">With Sub-Area</th>
                  <th className="r">With Photos</th>
                  <th className="r">With Pricing</th>
                  <th className="r">Avg Score</th>
                  <th className="r">Period Inquiries</th>
                </tr>
              </thead>
              <tbody>
                {ch.byCategory.map((c) => (
                  <tr key={c.vendorType}>
                    <td>
                      <Link href={`/ops/find?type=${encodeURIComponent(c.vendorType)}`} className="td-name" style={{ textDecoration: "underline", textDecorationColor: "var(--border-2)" }}>
                        {c.vendorType}
                      </Link>
                    </td>
                    <td className="r num">{fmtNum(c.total)}</td>
                    <td className="r num">{fmtNum(c.live)} <span className="td-sub" style={{ display: "inline" }}>({pct(c.livePct)})</span></td>
                    <td className="r num">{fmtNum(c.realPhones)} <span className="td-sub" style={{ display: "inline" }}>({pct(c.realPhonesPct)})</span></td>
                    <td className="r num">{fmtNum(c.withSubArea)}</td>
                    <td className="r num">{fmtNum(c.withPhotos)}</td>
                    <td className="r num">{fmtNum(c.withPricing)}</td>
                    <td className="r num">{c.avgCompleteness == null ? "—" : `${c.avgCompleteness}%`}</td>
                    <td className="r num"><b>{fmtNum(c.inquiriesInRange)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

export function ReportsView() {
  const { can } = useOps()
  const toast = useOpsToast()
  const [tab, setTab] = useState<Tab>("exec")
  const [from, setFrom] = useState(() => karachiDay(29))
  const [to, setTo] = useState(() => karachiDay(0))
  const [cityId, setCityId] = useState("")
  const [selectedCityName, setSelectedCityName] = useState("")
  const [subAreaSearch, setSubAreaSearch] = useState("")
  const [vendorType, setVendorType] = useState("")
  const [teamId, setTeamId] = useState("")

  const preset: Preset = to === karachiDay(0) ? (from === karachiDay(0) ? "1" : from === karachiDay(6) ? "7" : from === karachiDay(29) ? "30" : from === karachiDay(89) ? "90" : "custom") : "custom"
  const pick = (p: Preset) => { if (p === "custom") return; setTo(karachiDay(0)); setFrom(karachiDay(Number(p) - 1)) }

  const cities = useQuery({ queryKey: ["ops", "cities"], queryFn: opsApi.cities })
  const teams = useQuery({ queryKey: ["ops", "teams"], queryFn: opsApi.teams, enabled: can(["ops_prospect_view_team", "ops_settings"]), retry: false })
  const badRange = !from || !to || from > to

  const needExec = tab === "exec" || tab === "catalog"
  const needOverview = tab === "a" || tab === "b"
  const execQ = useQuery<ExecutiveReport>({
    queryKey: ["ops", "report-exec", from, to, cityId, selectedCityName, vendorType, teamId],
    queryFn: () => opsReportsApi.executive({ from, to, cityId: cityId || undefined, city: selectedCityName || undefined, vendorType: vendorType || undefined, teamId: teamId || undefined }),
    enabled: !badRange && needExec, placeholderData: (p) => p, staleTime: 30000,
  })
  const report = useQuery<Report>({
    queryKey: ["ops", "report", from, to, cityId, teamId],
    queryFn: () => opsReportsApi.overview({ from, to, cityId: cityId || undefined, teamId: teamId || undefined }),
    enabled: !badRange && needOverview, placeholderData: (p) => p, staleTime: 30000,
  })
  const geo = useQuery<GeoReport>({
    queryKey: ["ops", "report-geo", from, to, cityId, selectedCityName, teamId],
    queryFn: () => opsReportsApi.geo({ from, to, cityId: !selectedCityName && cityId ? cityId : undefined, city: selectedCityName || undefined, teamId: teamId || undefined }),
    enabled: !badRange && tab === "geo", placeholderData: (p) => p, staleTime: 30000,
  })
  const exportCsv = useMutation({
    mutationFn: () => tab === "geo"
      ? opsReportsApi.downloadGeo({ from, to, cityId: !selectedCityName && cityId ? cityId : undefined, city: selectedCityName || undefined, subArea: subAreaSearch.trim() || undefined })
      : tab === "b" && can("ops_export")
        ? opsReportsApi.downloadClients({ from, to, cityId: cityId || undefined })
        : opsReportsApi.downloadExecutive({ from, to, cityId: cityId || undefined, city: selectedCityName || undefined, vendorType: vendorType || undefined, teamId: teamId || undefined }),
    onSuccess: () => toast({ title: "Export started", body: "The download is recorded in the audit trail." }),
    onError: (e) => toast({ title: "Couldn't export", body: e instanceof Error ? e.message : "Please try again.", tone: "bad" }),
  })

  const activeLoading = needExec ? execQ.isLoading : tab === "geo" ? geo.isLoading : report.isLoading
  const activeFetching = needExec ? execQ.isFetching : tab === "geo" ? geo.isFetching : report.isFetching
  const activeError = needExec ? execQ.isError : tab === "geo" ? geo.isError : report.isError
  const activeErrObj = needExec ? execQ.error : tab === "geo" ? geo.error : report.error
  const refetchActive = () => (needExec ? execQ.refetch() : tab === "geo" ? geo.refetch() : report.refetch())

  const ex = execQ.data
  const r = report.data
  const g = geo.data
  const activeRange = needExec ? ex?.range : tab === "geo" ? g?.range : r?.range
  return (
    <>
      <PageHead
        title="Executive Analytics & Reports"
        sub="Real-time command view across Team A, Team B, handovers, bookings GMV, catalog quality, and city/sub-area demand gaps."
        actions={
          <div className="row" style={{ gap: 8 }}>
            <Btn variant="primary" icon={<Download aria-hidden />} loading={exportCsv.isPending} disabled={badRange} onClick={() => exportCsv.mutate()}>
              {tab === "geo" ? "Export Area CSV" : tab === "b" && can("ops_export") ? "Export Clients CSV" : "Export Full Analytics CSV"}
            </Btn>
          </div>
        }
      />
      <div className="toolbar">
        <Seg<Preset> label="Period" value={preset} onChange={pick} options={[{ value: "1", label: "Today" }, { value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "90", label: "90 days" }, ...(preset === "custom" ? [{ value: "custom" as const, label: "Custom" }] : [])]} />
        <div className="filters">
          <Field label="From" htmlFor="rp-from"><Input id="rp-from" type="date" compact value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="To" htmlFor="rp-to"><Input id="rp-to" type="date" compact value={to} min={from} max={karachiDay(0)} onChange={(e) => setTo(e.target.value)} /></Field>
          <Select aria-label="City" value={cityId} onChange={(e) => { setCityId(e.target.value); setSelectedCityName("") }} style={{ width: 145 }}><option value="">All cities</option>{(cities.data?.cities ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
          {needExec && (
            <Select aria-label="Category" value={vendorType} onChange={(e) => setVendorType(e.target.value)} style={{ width: 165 }}>
              <option value="">All categories</option>
              {Object.values(VENDOR_TYPES).map((vt) => <option key={vt} value={vt}>{vt}</option>)}
            </Select>
          )}
          {(teams.data?.teams.length ?? 0) > 1 && <Select aria-label="Team" value={teamId} onChange={(e) => setTeamId(e.target.value)} style={{ width: 170 }}><option value="">All my teams</option>{teams.data!.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>}
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <TabBar<Tab>
          label="Report View"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "exec", label: "Executive Control Tower" },
            { value: "catalog", label: "Catalog Health & Gaps" },
            { value: "geo", label: "City & Sub-Area Report" },
            { value: "a", label: "Vendor Team (Team A)" },
            { value: "b", label: "Client Team (Team B)" },
          ]}
        />
      </div>

      {badRange ? <Card><Empty icon={<BarChart3 />} title="Check the dates">The start date must be on or before the end date.</Empty></Card>
        : activeLoading ? <Card flush><SkelRows rows={8} /></Card>
        : activeError ? <ErrorState message={opsErrorMessage(activeErrObj)} onRetry={refetchActive} />
        : activeRange ? (
          <div className="stack" style={{ opacity: activeFetching ? 0.7 : 1, transition: "opacity .15s" }}>
            <p className="small muted" style={{ margin: 0 }}>
              <TrendingUp size={13} style={{ display: "inline", marginRight: 5 }} aria-hidden />
              {new Date(`${activeRange.from}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })} to {new Date(`${activeRange.to}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })} · {activeRange.days} day{activeRange.days === 1 ? "" : "s"}, Karachi time
            </p>
            {tab === "exec" && ex ? (
              <ExecutiveControlTowerView ex={ex} />
            ) : tab === "catalog" && ex ? (
              <CatalogHealthView ex={ex} />
            ) : tab === "geo" && g ? (
              <GeoReportView geo={g} selectedCity={selectedCityName} onPickCity={(c) => { setSelectedCityName(c); if (c) setCityId("") }} subAreaSearch={subAreaSearch} onSubAreaSearch={setSubAreaSearch} />
            ) : tab === "a" && r ? (
              <TeamAView a={r.teamA} range={r.range} />
            ) : r ? (
              <TeamBView b={r.teamB} />
            ) : null}
            <Card>
              <details className="how">
                <summary>How these numbers are counted</summary>
                <ul>
                  <li><b>Days</b> are Karachi days, from the start of the first to the end of the last. Trend badges compare cleanly against the preceding equal-length date window.</li>
                  <li><b>Called</b> is a prospect with at least one logged contact in the period; <b>connected</b> is one where someone actually spoke. <b>Interested</b> is measured against connected, because a no-answer cannot be interested.</li>
                  <li><b>Taken live</b> is a listing the portal published in the period, new or taken over. <b>Consent</b> uses each listing&apos;s latest entry, so a later &ldquo;no&rdquo; overrides an earlier &ldquo;yes&rdquo;.</li>
                  <li><b>Clients</b> are a cohort: those who arrived in the period, and what has happened to them since. <b>Qualified</b> means they reached a shortlist. <b>Replied in time</b> counts every client received.</li>
                  <li><b>Catalog Health</b> scans all active WeddingWala businesses (real phones vs 03274811220 placeholder, sub-area, photos, pricing/packages/menus, and completeness score).</li>
                </ul>
              </details>
            </Card>
          </div>
        ) : null}
    </>
  )
}
