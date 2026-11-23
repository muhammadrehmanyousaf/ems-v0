"use client"

// A vendor manager's world (Team A): the clients handed to them, and the venues to confirm by phone for each. They never see the couple's
// phone number or e-mail: they call the VENUES. Record what each call found (available / not available / no answer, the quoted price), then finish.
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CheckCircle2, ClipboardCheck, Phone } from "lucide-react"

import { AvailabilityBadge, EVENT_LABEL, ageLabel, fmtPkr } from "@/components/ops/client-bits"
import { Btn, Card, Empty, ErrorState, Field, Input, Notice, PageHead, Seg, SkelRows, Status, Textarea, fmtDay, fmtWhen, useOpsToast } from "@/components/ops/ops-ui"
import { opsErrorMessage } from "@/lib/api/ops"
import { assignmentsApi, type AssignedItem } from "@/lib/api/ops-clients"
import { opsErrorData } from "@/lib/api/ops-onboarding"

export function AssignedListView() {
  const router = useRouter()
  const [all, setAll] = useState(false)
  const q = useQuery({ queryKey: ["ops", "assignments", all], queryFn: () => assignmentsApi.mine(all) })
  const rows = q.data?.assignments ?? []
  return (
    <>
      <PageHead title="Assigned to me" sub="Clients the client desk handed you. For each, confirm the shortlisted venues by phone and record what you find."
        actions={<Btn onClick={() => setAll((a) => !a)}>{all ? "Show open only" : "Show finished too"}</Btn>} />
      <Card flush>
        {q.isLoading ? <SkelRows rows={5} /> : q.isError ? <ErrorState message={opsErrorMessage(q.error)} onRetry={() => q.refetch()} /> : rows.length === 0 ? (
          <Empty icon={<ClipboardCheck />} title="Nothing assigned to you">When the client desk hands you a shortlist it appears here, and you get a notification.</Empty>
        ) : rows.map((a) => (
          <div key={a.id} className="list-row click" onClick={() => router.push(`/ops/assigned/${a.id}`)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="td-name">{a.clientName}</div>
              <div className="td-sub">{[a.cityName, a.nextEventDate ? `event ${fmtDay(a.nextEventDate)}` : null, a.guests ? `${a.guests} guests` : null, a.budgetPkr ? fmtPkr(a.budgetPkr) : null].filter(Boolean).join(" · ") || "—"}</div>
              {a.note ? <div className="td-sub">{a.note}</div> : null}
            </div>
            <div className="nw" style={{ textAlign: "right" }}>
              {a.status === "done" ? <Status tone="ok">Finished</Status> : a.unchecked > 0 ? <Status tone="warn">{a.unchecked} of {a.venues} to check</Status> : <Status tone="info">Ready to finish</Status>}
              <div className="td-sub">{ageLabel(a.createdAt)} ago</div>
            </div>
          </div>
        ))}
      </Card>
    </>
  )
}

function ItemCard({ item, open, onSaved }: { item: AssignedItem; open: boolean; onSaved: (suggested: boolean) => void }) {
  const toast = useOpsToast()
  const [result, setResult] = useState<"available" | "unavailable" | "no_answer">(item.availability === "unavailable" ? "unavailable" : item.availability === "no_answer" ? "no_answer" : "available")
  const [quoted, setQuoted] = useState(item.quotedPricePkr ? String(Number(item.quotedPricePkr)) : "")
  const [perHead, setPerHead] = useState(item.perHeadPkr ? String(Number(item.perHeadPkr)) : "")
  const [note, setNote] = useState(item.note ?? "")
  const [editing, setEditing] = useState(item.availability === "pending")
  const [err, setErr] = useState<{ field?: string; message: string } | null>(null)
  const digits = (item.contactPhone ?? "").replace(/\D/g, "")
  const save = useMutation({
    mutationFn: () => assignmentsApi.check(item.id, { availability: result, quotedPricePkr: result === "available" ? quoted || undefined : undefined, perHeadPkr: result === "available" ? perHead || undefined : undefined, note: note || undefined }),
    onSuccess: (r) => { setEditing(false); setErr(null); onSaved(!!r.suggestUpdate) },
    onError: (e) => { const dd = opsErrorData<{ field?: string }>(e); setErr({ field: dd?.field, message: opsErrorMessage(e) }); toast({ title: "Couldn't save", body: opsErrorMessage(e), tone: "bad" }) },
  })
  return (
    <Card title={item.businessName} sub={[item.subArea, item.city, item.maxCapacity && item.maxCapacity > 1 ? `up to ${item.maxCapacity} guests` : null, item.listedPerHeadPkr ? `listed ${fmtPkr(item.listedPerHeadPkr)} per head` : null].filter(Boolean).join(" · ")}
      actions={item.contactPhone ? (
        <span className="row" style={{ gap: 6 }}>
          <a className="btn btn-ghost sm" href={`tel:${item.contactPhone.replace(/[^\d+]/g, "")}`}><Phone size={14} aria-hidden />{item.contactPhone}</a>
          {digits.length >= 10 && <a className="btn btn-ghost sm" target="_blank" rel="noopener noreferrer" href={`https://wa.me/92${digits.slice(-10)}`}>WhatsApp</a>}
        </span>
      ) : <Status tone="mut">No number on the listing</Status>}>
      {!editing ? (
        <div className="row between" style={{ alignItems: "flex-start" }}>
          <div><AvailabilityBadge value={item.availability} />{item.quotedPricePkr ? <span className="small"> · quoted {fmtPkr(item.quotedPricePkr)}</span> : null}{item.perHeadPkr ? <span className="small"> · {fmtPkr(item.perHeadPkr)} per head</span> : null}{item.note ? <div className="small muted">{item.note}</div> : null}{item.checkedAt ? <div className="small muted">{fmtWhen(item.checkedAt)}</div> : null}</div>
          {open && <Btn size="sm" onClick={() => setEditing(true)}>Change</Btn>}
        </div>
      ) : open ? (
        <div style={{ display: "grid", gap: 12 }}>
          <Seg<"available" | "unavailable" | "no_answer"> label={`Result for ${item.businessName}`} value={result} onChange={(v) => { setResult(v); setErr(null) }} options={[{ value: "available", label: "Available" }, { value: "unavailable", label: "Not available" }, { value: "no_answer", label: "No answer" }]} />
          {result === "available" && (
            <div className="grid2">
              <Field label="Quoted price (PKR)" htmlFor={`q-${item.id}`} error={err?.field === "quotedPricePkr" ? err.message : null}><Input id={`q-${item.id}`} inputMode="numeric" value={quoted} onChange={(e) => setQuoted(e.target.value)} placeholder="1,650,000" /></Field>
              <Field label="Per head (PKR)" htmlFor={`p-${item.id}`} hint={item.listedPerHeadPkr ? `The listing says ${fmtPkr(item.listedPerHeadPkr)}.` : undefined} error={err?.field === "perHeadPkr" ? err.message : null}><Input id={`p-${item.id}`} inputMode="numeric" value={perHead} onChange={(e) => setPerHead(e.target.value)} placeholder="1,800" /></Field>
            </div>
          )}
          <Field label="Note" htmlFor={`n-${item.id}`}><Textarea id={`n-${item.id}`} rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder={result === "available" ? "Free on the 10th; ask about the deposit" : result === "no_answer" ? "Rang four times, try after 5 pm" : "Booked until August"} /></Field>
          <div className="row"><Btn variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Save result</Btn>{item.availability !== "pending" && <Btn onClick={() => setEditing(false)}>Cancel</Btn>}</div>
        </div>
      ) : <AvailabilityBadge value={item.availability} />}
    </Card>
  )
}

export function AssignedDetailView({ id }: { id: number }) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  const q = useQuery({ queryKey: ["ops", "assignment", id], queryFn: () => assignmentsApi.get(id), staleTime: 0, refetchOnWindowFocus: false })
  const [done, setDone] = useState("")
  const finish = useMutation({
    mutationFn: () => assignmentsApi.complete(id, done || undefined),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ops", "assignment", id] }); qc.invalidateQueries({ queryKey: ["ops", "assignments"] }); toast({ title: "Finished", body: "The client desk has been told." }) },
    onError: (e) => toast({ title: "Can't finish yet", body: opsErrorMessage(e), tone: "bad" }),
  })
  const refresh = (suggested: boolean) => { qc.invalidateQueries({ queryKey: ["ops", "assignment", id] }); toast({ title: "Saved", body: suggested ? "The price differs from the listing: we flagged it to be confirmed with the venue." : undefined }) }

  if (q.isLoading) return <><PageHead title="Assignment" /><Card flush><SkelRows rows={6} /></Card></>
  if (q.isError || !q.data) {
    const dd = opsErrorData(q.error)
    return <ErrorState message={dd?.code === "ASSIGNMENT_NOT_FOUND" ? "This assignment was not found, or it is not yours any more." : opsErrorMessage(q.error)} onRetry={() => q.refetch()} />
  }
  const d = q.data
  const open = d.assignment.status === "open"
  const pending = d.items.filter((i) => !i.checkedAt).length
  return (
    <>
      <div style={{ marginBottom: 10 }}><Link href="/ops/assigned" className="btn btn-link" style={{ paddingLeft: 0 }}><ArrowLeft aria-hidden />Assigned to me</Link></div>
      <PageHead title={d.client.name} sub={<span className="row" style={{ gap: 8 }}>{open ? <Status tone="info">Working on it</Status> : <Status tone="ok">Finished</Status>}<span>{[d.client.cityName, d.client.guests ? `${d.client.guests} guests` : null, d.client.budgetPkr ? fmtPkr(d.client.budgetPkr) : null].filter(Boolean).join(" · ")}</span></span>} />
      <div className="cols-main">
        <div className="stack">
          {!open && <Notice tone="ok">You finished this on {d.assignment.closedAt ? fmtWhen(d.assignment.closedAt) : "—"}. The results below are final.</Notice>}
          {d.items.length === 0 ? <Card><Empty title="No venues on this assignment">The client desk removed them.</Empty></Card> : d.items.map((i) => <ItemCard key={i.id} item={i} open={open} onSaved={refresh} />)}
        </div>
        <div className="stack">
          <Card title="About this client">
            <dl className="kv">
              <dt>Wants</dt><dd>{d.client.requirements || "—"}</dd>
              {d.assignment.note ? <><dt>Note from the desk</dt><dd>{d.assignment.note}</dd></> : null}
            </dl>
            {d.events.length > 0 && <div style={{ marginTop: 12 }}>{d.events.map((e, i) => <div key={i} className="small" style={{ padding: "3px 0" }}><b>{EVENT_LABEL[e.kind]}</b>{e.eventDate ? ` · ${fmtDay(e.eventDate)}` : ""}{e.guests ? ` · ${e.guests} guests` : ""}</div>)}</div>}
            <p className="small muted" style={{ margin: "12px 0 0" }}>You are calling the venues, so the couple's contact details are not shown.</p>
          </Card>
          {open && (
            <Card title="When you are done">
              <div style={{ display: "grid", gap: 12 }}>
                {pending > 0 ? <p className="small muted" style={{ margin: 0 }}>{pending} venue{pending === 1 ? "" : "s"} still need a result. A “no answer” counts.</p> : <Notice tone="ok">Every venue has a result.</Notice>}
                <Field label="Summary for the desk (optional)" htmlFor="as-done"><Textarea id="as-done" rows={2} maxLength={1000} value={done} onChange={(e) => setDone(e.target.value)} /></Field>
                <div><Btn variant="primary" icon={<CheckCircle2 aria-hidden />} loading={finish.isPending} disabled={pending > 0} onClick={() => finish.mutate()}>Finish and tell the desk</Btn></div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
