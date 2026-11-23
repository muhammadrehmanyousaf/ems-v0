"use client"

// Callbacks and follow-ups: what is due now, what is overdue, what is coming. Done / Snooze / Open from here.
import Link from "next/link"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarClock, CheckCircle2, Clock, PhoneCall } from "lucide-react"

import { useOps } from "@/components/ops/ops-shell"
import { KIND_LABEL, PhoneActions, dueLabel } from "@/components/ops/prospect-bits"
import { Btn, Card, Chip, Empty, ErrorState, Field, Input, Modal, PageHead, Seg, SkelRows, Status, fmtWhen, useOpsToast } from "@/components/ops/ops-ui"
import { opsErrorMessage } from "@/lib/api/ops"
import { tasksApi, type TaskRow } from "@/lib/api/ops-prospects"
import { quickCallbackTimes, toLocalInput } from "@/lib/ops/call-rules"

export function TasksView() {
  const { can } = useOps()
  const qc = useQueryClient()
  const toast = useOpsToast()
  const [scope, setScope] = useState<"mine" | "team">("mine")
  const [snoozing, setSnoozing] = useState<TaskRow | null>(null)
  const [when, setWhen] = useState("")
  const team = can(["ops_prospect_view_team", "ops_prospect_view_all"])
  const q = useQuery({ queryKey: ["ops", "tasks", scope], queryFn: () => tasksApi.list(scope), refetchInterval: 60_000 })
  const quick = useMemo(() => quickCallbackTimes(), [snoozing])

  const refresh = () => { qc.invalidateQueries({ queryKey: ["ops", "tasks"] }); qc.invalidateQueries({ queryKey: ["ops", "summary"] }); qc.invalidateQueries({ queryKey: ["ops", "prospects"] }) }
  const done = useMutation({ mutationFn: (id: number) => tasksApi.done(id), onSuccess: () => { refresh(); toast({ title: "Marked done" }) }, onError: (e) => toast({ title: "Couldn't update", body: opsErrorMessage(e), tone: "bad" }) })
  const snooze = useMutation({
    mutationFn: () => tasksApi.snooze(snoozing!.id, new Date(when).toISOString()),
    onSuccess: () => { refresh(); setSnoozing(null); setWhen(""); toast({ title: "Moved" }) },
    onError: (e) => toast({ title: "Couldn't move it", body: opsErrorMessage(e), tone: "bad" }),
  })

  const tasks = q.data?.tasks ?? []
  const groups = useMemo(() => {
    const now = Date.now()
    const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999)
    return [
      { key: "overdue", title: "Overdue", sub: "More than an hour late", list: tasks.filter((t) => t.overdue) },
      { key: "due", title: "Due now", sub: "Call these first", list: tasks.filter((t) => !t.overdue && t.due) },
      { key: "today", title: "Later today", sub: undefined, list: tasks.filter((t) => !t.due && new Date(t.dueAt).getTime() <= endOfToday.getTime()) },
      { key: "soon", title: "Coming up", sub: undefined, list: tasks.filter((t) => new Date(t.dueAt).getTime() > endOfToday.getTime() && new Date(t.dueAt).getTime() > now) },
    ].filter((g) => g.list.length > 0)
  }, [tasks])

  return (
    <>
      <PageHead title="Callbacks" sub="Everyone you promised to call back, in the order they are due."
        actions={team ? <Seg value={scope} onChange={setScope} label="Whose callbacks" options={[{ value: "mine", label: "Mine" }, { value: "team", label: "My team" }]} /> : undefined} />
      {q.isLoading ? <Card flush><SkelRows rows={6} /></Card>
        : q.isError ? <Card><ErrorState message={opsErrorMessage(q.error)} onRetry={() => q.refetch()} /></Card>
        : tasks.length === 0 ? <Card><Empty icon={<CheckCircle2 />} title="No callbacks waiting" action={can("ops_prospect_call") ? <Link href="/ops/call" className="btn btn-primary"><PhoneCall aria-hidden />Start calling</Link> : undefined}>Koi callback baqaya nahi. When you promise someone a call, it shows up here.</Empty></Card>
        : (
          <div className="stack">
            {groups.map((g) => (
              <Card key={g.key} title={`${g.title} · ${g.list.length}`} sub={g.sub} flush>
                {g.list.map((t) => {
                  const dl = dueLabel(t.dueAt)
                  const phone = (t.phones ?? []).find((p) => p.status !== "wrong" && p.status !== "dead") ?? t.phones?.[0]
                  return (
                    <div key={t.id} className={`list-row ${t.overdue ? "urgent" : t.due ? "today" : ""}`} style={{ flexWrap: "wrap" }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="td-name"><Link href={`/ops/prospects/${t.prospectId}`}>{t.prospectName}</Link></div>
                        <div className="td-sub">{KIND_LABEL[t.kind] ?? t.kind} · {[t.vendorType, t.cityName].filter(Boolean).join(" · ") || "—"}{scope === "team" && t.assigneeName ? ` · ${t.assigneeName}` : ""}</div>
                        {t.note && <div className="small muted" style={{ marginTop: 4 }}>“{t.note}”</div>}
                      </div>
                      <span className="row" style={{ gap: 8 }}>
                        <Status tone={dl.due ? dl.tone : "mut"}>{dl.text}</Status>
                        <span className="small muted nw">{fmtWhen(t.dueAt)}</span>
                      </span>
                      <span className="row" style={{ gap: 6 }}>
                        {phone && <PhoneActions phone={phone} compact />}
                        <Link href={`/ops/prospects/${t.prospectId}`} className="btn btn-primary sm">Open</Link>
                        <Btn size="sm" icon={<Clock aria-hidden />} onClick={() => { setSnoozing(t); setWhen("") }}>Later</Btn>
                        <Btn size="sm" icon={<CheckCircle2 aria-hidden />} loading={done.isPending && done.variables === t.id} onClick={() => done.mutate(t.id)}>Done</Btn>
                      </span>
                    </div>
                  )
                })}
              </Card>
            ))}
          </div>
        )}

      <Modal open={!!snoozing} onClose={() => setSnoozing(null)} title="Move this callback" description={snoozing ? `${snoozing.prospectName}: pick a new time.` : undefined}
        footer={<><Btn onClick={() => setSnoozing(null)}>Cancel</Btn><Btn variant="primary" icon={<CalendarClock aria-hidden />} loading={snooze.isPending} disabled={!when} onClick={() => snooze.mutate()}>Move it</Btn></>}>
        <div className="chips">{quick.map((x) => <Chip key={x.label} on={when === toLocalInput(x.at)} onClick={() => setWhen(toLocalInput(x.at))}>{x.label}</Chip>)}</div>
        <Field label="New time" htmlFor="sn-when" required><Input id="sn-when" type="datetime-local" value={when} min={toLocalInput(new Date())} onChange={(e) => setWhen(e.target.value)} /></Field>
      </Modal>
    </>
  )
}
