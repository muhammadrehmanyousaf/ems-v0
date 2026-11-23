"use client"

// Home = "my day": what is due, how the day is going, and one big way to start calling. Your access sits below, for transparency.
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { CalendarClock, Headphones, Upload } from "lucide-react"

import { useOps } from "@/components/ops/ops-shell"
import { KIND_LABEL, dueLabel } from "@/components/ops/prospect-bits"
import { Card, Empty, Kpi, Notice, PageHead, Skel, Status } from "@/components/ops/ops-ui"
import { opsApi, OPS_ROLE_LABEL, OPS_TEAM_KIND_LABEL } from "@/lib/api/ops"
import { reportsApi, tasksApi } from "@/lib/api/ops-prospects"

export const PERMISSION_LABEL: Record<string, string> = {
  ops_access: "Open the Ops Portal",
  ops_prospect_import: "Import vendor prospect sheets",
  ops_prospect_call: "Work a prospect queue and log calls",
  ops_prospect_view_team: "See the whole team's prospects",
  ops_prospect_view_all: "See every team's prospects",
  ops_prospect_reassign: "Reassign prospects between agents",
  ops_onboard_direct: "Onboard a vendor directly",
  ops_takeover_listing: "Take over an unclaimed listing",
  ops_media_upload: "Upload photos and videos for a vendor",
  ops_listing_edit_on_behalf: "Edit a listing on a vendor's behalf",
  ops_client_manage: "Create and work client records",
  ops_client_assign: "Assign a client to a vendor manager",
  ops_vendor_search: "Search vendors with internal filters",
  ops_reports_team: "See team reports",
  ops_reports_all: "See all reports",
  ops_export: "Export contact data",
  ops_settings: "Manage teams, cities, settings and staff",
}

export function HomeView() {
  const { me, can } = useOps()
  const works = can(["ops_prospect_call", "ops_prospect_view_team", "ops_prospect_view_all"])
  const cities = useQuery({ queryKey: ["ops", "cities"], queryFn: opsApi.cities })
  const summary = useQuery({ queryKey: ["ops", "summary"], queryFn: reportsApi.summary, enabled: works, refetchInterval: 60_000 })
  const tasks = useQuery({ queryKey: ["ops", "tasks", "mine"], queryFn: () => tasksApi.list("mine"), enabled: works, refetchInterval: 60_000 })
  const cityName = (id: number) => cities.data?.cities.find((c) => c.id === id)?.name ?? `City ${id}`
  const s = summary.data
  const due = (tasks.data?.tasks ?? []).slice(0, 6)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Subah bakhair" : hour < 17 ? "Assalam o Alaikum" : "Shaam bakhair"

  return (
    <>
      <PageHead
        title={`${greeting}, ${me.user.fullName.split(" ")[0]}`}
        sub={works ? "Your day at a glance. Callbacks that are due come first." : "This is your access in the Ops Portal. Everything here is checked again by the server on every request."}
        actions={<>
          {can("ops_prospect_import") && <Link href="/ops/import" className="btn btn-ghost"><Upload aria-hidden />Import vendors</Link>}
          {can("ops_prospect_call") && <Link href="/ops/call" className="btn btn-primary"><Headphones aria-hidden />Start calling</Link>}
        </>}
      />

      {works && (
        <div className="kpis">
          <Kpi label="Callbacks due" value={s ? s.tasksDue : <Skel h={26} w={40} />} note={s && s.tasksOverdue ? `${s.tasksOverdue} overdue by a day` : s ? `${s.tasksNext24h} more in the next 24 h` : undefined} />
          <Kpi label="Ready to call" value={s ? s.readyToCall.toLocaleString() : <Skel h={26} w={50} />} note="Waiting in your queue" />
          <Kpi label="Calls today" value={s ? s.callsToday : <Skel h={26} w={40} />} note={s ? `${s.connectedToday} connected` : undefined} />
          <Kpi label="Interested today" value={s ? s.interestedToday : <Skel h={26} w={40} />} note={s ? `${s.interestedOpen} waiting for onboarding` : undefined} />
        </div>
      )}

      <div className="cols-main">
        <div className="stack">
          {works && (
            <Card title="Callbacks to make" sub="Your next calls, soonest first." actions={<Link href="/ops/tasks" className="btn btn-link">See all</Link>} flush>
              {tasks.isLoading ? <div style={{ padding: 16, display: "grid", gap: 12 }}><Skel h={16} /><Skel h={16} w="80%" /><Skel h={16} w="65%" /></div>
                : due.length === 0 ? <Empty icon={<CalendarClock />} title="No callbacks waiting">Koi callback baqaya nahi. Press Start calling to be handed the next vendor.</Empty>
                : due.map((t) => {
                  const dl = dueLabel(t.dueAt)
                  return (
                    <Link key={t.id} href={`/ops/prospects/${t.prospectId}`} className={`list-row click ${t.overdue ? "urgent" : t.due ? "today" : ""}`}>
                      <div style={{ minWidth: 0, flex: 1 }}><div className="td-name">{t.prospectName}</div><div className="td-sub">{KIND_LABEL[t.kind] ?? t.kind} · {[t.vendorType, t.cityName].filter(Boolean).join(" · ")}</div></div>
                      <Status tone={dl.due ? dl.tone : "mut"}>{dl.text}</Status>
                    </Link>
                  )
                })}
            </Card>
          )}
          {s?.needsReview ? <Notice tone="warn"><b>{s.needsReview} prospect{s.needsReview === 1 ? "" : "s"} need{s.needsReview === 1 ? "s" : ""} your decision.</b> They never picked up. <Link href="/ops/prospects?view=stale" style={{ textDecoration: "underline" }}>Review them</Link></Notice> : null}

          <Card title="Your access" sub={`${me.permissions.length} permission${me.permissions.length === 1 ? "" : "s"}`}>
            <div className="row" style={{ marginBottom: 12 }}>
              {me.isSuperAdmin && <Status tone="acc">Super admin</Status>}
              {me.roles.map((r) => <Status key={r} tone="ok">{OPS_ROLE_LABEL[r] ?? r}</Status>)}
              {!me.isSuperAdmin && me.roles.length === 0 && <Status tone="warn">No ops role</Status>}
            </div>
            {me.permissions.length === 0 ? <Empty title="No permissions yet">Ask your manager to give you a role.</Empty> : (
              <ul className="grid2" style={{ listStyle: "none", margin: 0, padding: 0, gap: 8 }}>
                {me.permissions.map((p) => (
                  <li key={p} className="row" style={{ alignItems: "flex-start", flexWrap: "nowrap", gap: 10 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--ok)", marginTop: 7, flex: "none" }} aria-hidden />
                    <span>{PERMISSION_LABEL[p] ?? p}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="stack">
          <Card title="Your teams" sub={me.scope.all ? "You can see every team and city." : undefined}>
            {me.memberships.length === 0 ? (
              <Empty title="No team seat">{me.scope.all ? "You are not seated on a team; you see all of them." : "Ask your manager to add you to a team."}</Empty>
            ) : (
              <div className="stack" style={{ gap: 10 }}>
                {me.memberships.map((m) => (
                  <div key={m.teamId} className="card" style={{ background: "var(--surface-2)", boxShadow: "none", padding: "12px 14px" }}>
                    <div className="strong">{m.teamName}</div>
                    <div className="small muted">{OPS_TEAM_KIND_LABEL[m.kind]} · {m.memberRole === "lead" ? "Lead" : "Agent"}</div>
                    <div className="small" style={{ marginTop: 8 }}>{m.cityIds.length === 0 ? "All cities" : m.cityIds.map(cityName).join(", ")}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
