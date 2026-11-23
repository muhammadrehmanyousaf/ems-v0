"use client"

// The call workspace for one prospect: log the call, see the history, the numbers, the matched listing and the callbacks.
// One dominant action (Save & next call). The server re-checks every rule; this screen only offers the valid choices.
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CheckCircle2, Pencil, Plus, RotateCcw, Store } from "lucide-react"

import { useOps } from "@/components/ops/ops-shell"
import { DISPOSITION_LABEL, KIND_LABEL, PhoneActions, StatusBadge, dueLabel, fmtPhone } from "@/components/ops/prospect-bits"
import { Btn, Card, Chip, Empty, ErrorState, Field, Input, Modal, Notice, PageHead, Select, SkelRows, Status, Textarea, cx, fmtDay, fmtWhen, useOpsToast } from "@/components/ops/ops-ui"
import { opsApi, opsErrorMessage, type OpsDisposition } from "@/lib/api/ops"
import { prospectsApi, tasksApi, type AuditEventRow, type CallChannel, type CallLogRow, type CallOutcome, type ProspectDetail, type ProspectFull } from "@/lib/api/ops-prospects"
import { CALL_ALLOWED, NOT_INTERESTED_REASONS, OUTCOME_OPTIONS, REASON_LABEL, quickCallbackTimes, toLocalInput } from "@/lib/ops/call-rules"
import { VENDOR_TYPES } from "@/lib/vendor-types"

const CLOSED_BLOCKED = new Set(["do_not_contact", "duplicate", "invalid", "live", "not_interested"])
const EVENT_LABEL: Record<string, string> = {
  "ops.prospect.created": "Added to the list", "ops.prospect.updated": "Details edited", "ops.prospect.reopened": "Reopened",
  "ops.prospect.reassigned": "Reassigned", "ops.prospect.review_decision": "Review decision", "ops.prospect.exported": "Exported",
}

/* ------------------------------ the call form ------------------------------ */

function CallForm({ detail, dispositions, onSaved }: { detail: ProspectDetail; dispositions: OpsDisposition[]; onSaved: (next: boolean) => void }) {
  const toast = useOpsToast()
  const p = detail.prospect
  const usablePhones = p.phones.filter((x) => x.status !== "wrong" && x.status !== "dead")
  const [channel, setChannel] = useState<CallChannel>("call")
  const [outcome, setOutcome] = useState<CallOutcome | null>(null)
  const [disposition, setDisposition] = useState("")
  const [phoneUsed, setPhoneUsed] = useState(usablePhones[0]?.raw ?? p.phones[0]?.raw ?? "")
  const [reason, setReason] = useState("")
  const [callbackAt, setCallbackAt] = useState("")
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const quick = useMemo(() => quickCallbackTimes(), [])

  const cfg = (code: string) => dispositions.find((d) => d.code === code)
  const options = outcome ? CALL_ALLOWED[outcome].map((c) => cfg(c)).filter((d): d is OpsDisposition => !!d && d.active) : []
  useEffect(() => {
    if (!outcome) { setDisposition(""); return }
    if (options.length === 1) setDisposition(options[0].code)
    else if (!options.some((o) => o.code === disposition)) setDisposition("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outcome, dispositions])

  const sel = cfg(disposition)
  const needsCallback = !!sel?.requiresCallback
  const needsReason = !!sel?.requiresReason
  const needsPhone = disposition === "wrong_number"
  const valid = !!outcome && !!disposition && (!needsCallback || !!callbackAt) && (!needsReason || !!reason) && (!needsPhone || !!phoneUsed)

  const save = useMutation({
    mutationFn: () => prospectsApi.logCall(p.id, {
      outcome: outcome!, disposition, channel, note: note.trim() || undefined, reason: needsReason ? reason : undefined,
      phoneUsed: outcome === "wrong_number" || outcome === "spoke" || phoneUsed ? phoneUsed || undefined : undefined,
      nextActionAt: needsCallback && callbackAt ? new Date(callbackAt).toISOString() : undefined,
    }),
  })
  const submit = (next: boolean) => {
    if (!valid || save.isPending) return
    setError(null)
    save.mutate(undefined, {
      onSuccess: (r) => {
        toast({ title: "Call logged", body: r.reviewReason ? "No answer after repeated tries: sent to your lead to decide." : undefined })
        setOutcome(null); setDisposition(""); setReason(""); setCallbackAt(""); setNote("")
        onSaved(next)
      },
      onError: (e) => setError(opsErrorMessage(e)),
    })
  }

  return (
    <Card title="Log this call" sub="Pick what happened, then the result. Notes are for the next person who calls." >
      <form onSubmit={(e) => { e.preventDefault(); submit(true) }} onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); submit(true) } }} className="stack" style={{ gap: 18 }}>
        <div className="row between">
          <span className="lbl">How did you reach them?</span>
          <div className="seg" role="group" aria-label="Channel">
            {(["call", "whatsapp", "in_person"] as CallChannel[]).map((c) => (
              <button key={c} type="button" className={cx(channel === c && "on")} aria-pressed={channel === c} onClick={() => setChannel(c)}>{c === "call" ? "Phone call" : c === "whatsapp" ? "WhatsApp" : "In person"}</button>
            ))}
          </div>
        </div>

        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="lbl" style={{ marginBottom: 8 }}>What happened? <span className="req" aria-hidden>*</span></legend>
          <div className="chips" role="radiogroup" aria-label="What happened">
            {OUTCOME_OPTIONS.map((o) => (
              <Chip key={o.value} on={outcome === o.value} onClick={() => setOutcome(o.value)}>{o.label}</Chip>
            ))}
          </div>
          {outcome && <p className="hint" style={{ marginTop: 6, fontSize: 11.5, color: "var(--ink-3)" }}>{OUTCOME_OPTIONS.find((o) => o.value === outcome)?.hint}</p>}
        </fieldset>

        {outcome && options.length > 1 && (
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="lbl" style={{ marginBottom: 8 }}>Result <span className="req" aria-hidden>*</span></legend>
            <div className="chips" role="radiogroup" aria-label="Result">
              {options.map((o) => (
                <Chip key={o.code} on={disposition === o.code} onClick={() => setDisposition(o.code)}>{o.label}{o.labelUr ? <span className="muted" style={{ fontWeight: 500 }}> · {o.labelUr}</span> : null}</Chip>
              ))}
            </div>
          </fieldset>
        )}

        {needsPhone && (
          <Field label="Which number was wrong?" htmlFor="cf-phone" required hint="That number is marked wrong. If another number is left, the prospect stays in your queue.">
            <Select id="cf-phone" value={phoneUsed} onChange={(e) => setPhoneUsed(e.target.value)}>
              {p.phones.map((x) => <option key={x.key} value={x.raw}>{fmtPhone(x)}</option>)}
            </Select>
          </Field>
        )}

        {needsCallback && (
          <Field label="Call back at" htmlFor="cf-when" required hint="A callback task is created for you at this time.">
            <div className="chips" style={{ marginBottom: 8 }}>
              {quick.map((q) => <Chip key={q.label} on={callbackAt === toLocalInput(q.at)} onClick={() => setCallbackAt(toLocalInput(q.at))}>{q.label}</Chip>)}
            </div>
            <Input id="cf-when" type="datetime-local" value={callbackAt} min={toLocalInput(new Date())} onChange={(e) => setCallbackAt(e.target.value)} />
          </Field>
        )}

        {needsReason && (
          <Field label="Why not?" htmlFor="cf-reason" required>
            <Select id="cf-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">Choose a reason…</option>
              {NOT_INTERESTED_REASONS.map((r) => <option key={r} value={r}>{REASON_LABEL[r]}</option>)}
            </Select>
          </Field>
        )}

        {outcome && (
          <Field label="Note" htmlFor="cf-note" hint="What did they say? Price, hall size, who to ask for, best time to call.">
            <Textarea id="cf-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1500} />
          </Field>
        )}

        {error && <Notice tone="bad">{error}</Notice>}
        <div className="row">
          <Btn variant="primary" type="submit" loading={save.isPending} disabled={!valid} title={!valid ? "Choose what happened and the result first" : "Ctrl + Enter"}>Save & next call</Btn>
          <Btn loading={false} disabled={!valid || save.isPending} onClick={() => submit(false)}>Save</Btn>
          {!valid && outcome && <span className="small muted">{needsCallback && !callbackAt ? "Set the callback time" : needsReason && !reason ? "Choose a reason" : !disposition ? "Choose the result" : ""}</span>}
        </div>
      </form>
    </Card>
  )
}

/* ------------------------------- timeline ------------------------------- */

type TimelineItem = { at: string; kind: "call"; call: CallLogRow } | { at: string; kind: "event"; event: AuditEventRow }

function Timeline({ calls, events }: { calls: CallLogRow[]; events: AuditEventRow[] }) {
  const items: TimelineItem[] = [
    ...calls.map((c) => ({ at: c.at, kind: "call" as const, call: c })),
    ...events.filter((e) => EVENT_LABEL[e.action]).map((e) => ({ at: e.at, kind: "event" as const, event: e })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  if (!items.length) return <Empty title="No history yet">The first call you log will appear here.</Empty>
  return (
    <div>
      {items.map((it) => it.kind === "call" ? (
        <div key={`c${it.call.id}`} className="list-row" style={{ alignItems: "flex-start" }}>
          <span className={cx("st", it.call.outcome === "spoke" ? "info" : it.call.outcome === "wrong_number" ? "bad" : "warn")} style={{ marginTop: 2 }}><i aria-hidden />{OUTCOME_OPTIONS.find((o) => o.value === it.call.outcome)?.label ?? it.call.outcome}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="strong">{DISPOSITION_LABEL[it.call.disposition] ?? it.call.disposition}{it.call.reason ? <span className="muted" style={{ fontWeight: 500 }}> · {REASON_LABEL[it.call.reason] ?? it.call.reason}</span> : null}</div>
            {it.call.note && <p style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{it.call.note}</p>}
            <div className="small muted" style={{ marginTop: 4 }}>
              {it.call.agentName ?? "Someone"} · {fmtWhen(it.call.at)} · {it.call.channel === "call" ? "call" : it.call.channel === "whatsapp" ? "WhatsApp" : "in person"}
              {it.call.statusFrom && it.call.statusTo && it.call.statusFrom !== it.call.statusTo ? ` · ${it.call.statusFrom} → ${it.call.statusTo}` : ""}
              {it.call.nextActionAt ? ` · next ${fmtWhen(it.call.nextActionAt)}` : ""}
            </div>
          </div>
        </div>
      ) : (
        <div key={`e${it.event.id}`} className="list-row" style={{ alignItems: "flex-start" }}>
          <span className="st" style={{ marginTop: 2 }}><i aria-hidden />{EVENT_LABEL[it.event.action]}</span>
          <div className="small muted" style={{ flex: 1 }}>
            {it.event.actorName ?? "Someone"} · {fmtWhen(it.event.at)}
            {typeof it.event.after?.note === "string" && it.event.after.note ? <span> · “{String(it.event.after.note)}”</span> : null}
          </div>
        </div>
      ))}
    </div>
  )
}

/* --------------------------------- edit --------------------------------- */

function EditModal({ prospect, open, onClose, canPriority }: { prospect: ProspectFull; open: boolean; onClose: () => void; canPriority: boolean }) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  const cities = useQuery({ queryKey: ["ops", "cities"], queryFn: opsApi.cities, enabled: open })
  const [f, setF] = useState({ name: prospect.name, vendorType: prospect.vendorType ?? "", cityId: prospect.cityId ? String(prospect.cityId) : "", area: prospect.area ?? "", address: prospect.address ?? "",
    mapsUrl: prospect.mapsUrl ?? "", website: prospect.website ?? "", email: prospect.email ?? "", contactPerson: prospect.contactPerson ?? "", notes: prospect.notes ?? "", priority: String(prospect.priority) })
  useEffect(() => { if (open) setF({ name: prospect.name, vendorType: prospect.vendorType ?? "", cityId: prospect.cityId ? String(prospect.cityId) : "", area: prospect.area ?? "", address: prospect.address ?? "", mapsUrl: prospect.mapsUrl ?? "", website: prospect.website ?? "", email: prospect.email ?? "", contactPerson: prospect.contactPerson ?? "", notes: prospect.notes ?? "", priority: String(prospect.priority) }) }, [open, prospect])
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }))
  const save = useMutation({
    mutationFn: () => prospectsApi.update(prospect.id, {
      name: f.name, vendorType: f.vendorType || null, cityId: f.cityId ? Number(f.cityId) : null, area: f.area || null, address: f.address || null,
      mapsUrl: f.mapsUrl || null, website: f.website || null, email: f.email || null, contactPerson: f.contactPerson || null, notes: f.notes || null,
      ...(canPriority ? { priority: Number(f.priority) } : {}),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ops", "prospect", prospect.id] }); toast({ title: "Details saved" }); onClose() },
    onError: (e) => toast({ title: "Couldn't save", body: opsErrorMessage(e), tone: "bad" }),
  })
  return (
    <Modal open={open} onClose={onClose} size="wide" title="Edit business details" description="Fix what you learn on the call. Phone numbers are managed on the right."
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={save.isPending} disabled={f.name.trim().length < 1} onClick={() => save.mutate()}>Save details</Btn></>}>
      <div className="form-grid">
        <Field label="Business name" htmlFor="ed-name" required className="full"><Input id="ed-name" value={f.name} onChange={set("name")} /></Field>
        <Field label="Category" htmlFor="ed-type"><Select id="ed-type" value={f.vendorType} onChange={set("vendorType")}><option value="">Not set</option>{Object.values(VENDOR_TYPES).map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
        <Field label="City" htmlFor="ed-city"><Select id="ed-city" value={f.cityId} onChange={set("cityId")}><option value="">Not set</option>{(cities.data?.cities ?? []).filter((c) => c.active).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Area" htmlFor="ed-area"><Input id="ed-area" value={f.area} onChange={set("area")} /></Field>
        <Field label="Contact person" htmlFor="ed-cp"><Input id="ed-cp" value={f.contactPerson} onChange={set("contactPerson")} /></Field>
        <Field label="Address" htmlFor="ed-addr" className="full"><Input id="ed-addr" value={f.address} onChange={set("address")} /></Field>
        <Field label="Google Maps link" htmlFor="ed-maps"><Input id="ed-maps" value={f.mapsUrl} onChange={set("mapsUrl")} inputMode="url" /></Field>
        <Field label="Website" htmlFor="ed-web"><Input id="ed-web" value={f.website} onChange={set("website")} inputMode="url" /></Field>
        <Field label="Email" htmlFor="ed-mail"><Input id="ed-mail" type="email" value={f.email} onChange={set("email")} /></Field>
        {canPriority && <Field label="Priority" htmlFor="ed-prio" hint="0 to 10. Higher is called sooner."><Input id="ed-prio" type="number" min={0} max={10} value={f.priority} onChange={set("priority")} /></Field>}
        <Field label="Notes" htmlFor="ed-notes" className="full"><Textarea id="ed-notes" value={f.notes} onChange={set("notes")} /></Field>
      </div>
    </Modal>
  )
}

/* --------------------------------- screen --------------------------------- */

export function ProspectDetailView({ id }: { id: number }) {
  const { me, can } = useOps()
  const router = useRouter()
  const qc = useQueryClient()
  const toast = useOpsToast()
  const params = useSearchParams()
  const fromQueue = params?.get("from") === "queue"
  const [editing, setEditing] = useState(false)
  const [newPhone, setNewPhone] = useState("")
  const [reopening, setReopening] = useState(false)
  const [reopenNote, setReopenNote] = useState("")
  const [reviewNote, setReviewNote] = useState("")

  const q = useQuery({ queryKey: ["ops", "prospect", id], queryFn: () => prospectsApi.get(id), staleTime: 0, refetchOnWindowFocus: false })
  const disp = useQuery({ queryKey: ["ops", "dispositions"], queryFn: opsApi.dispositions })
  const d = q.data

  // keep the lease alive while this screen is open and we hold it; give it back when we leave
  const holding = !!d && d.prospect.lockedByUserId === me.user.id && !!d.prospect.lockedUntil && new Date(d.prospect.lockedUntil).getTime() > Date.now()
  const holdingRef = useRef(false)
  holdingRef.current = holding
  useEffect(() => {
    if (!holding) return
    const t = window.setInterval(() => { prospectsApi.renew(id).catch(() => undefined) }, 4 * 60 * 1000)
    return () => window.clearInterval(t)
  }, [holding, id])
  useEffect(() => () => { if (holdingRef.current) prospectsApi.release(id).catch(() => undefined) }, [id])

  const refresh = () => { qc.invalidateQueries({ queryKey: ["ops", "prospect", id] }); qc.invalidateQueries({ queryKey: ["ops", "summary"] }); qc.invalidateQueries({ queryKey: ["ops", "prospects"] }) }
  const fail = (title: string) => (e: unknown) => toast({ title, body: opsErrorMessage(e), tone: "bad" })

  const addPhone = useMutation({ mutationFn: () => prospectsApi.update(id, { addPhone: newPhone }), onSuccess: () => { setNewPhone(""); refresh(); toast({ title: "Number added" }) }, onError: fail("Couldn't add the number") })
  const setPhoneStatus = useMutation({ mutationFn: (v: { key: string; status: string }) => prospectsApi.update(id, { phoneStatus: v }), onSuccess: refresh, onError: fail("Couldn't update the number") })
  const reopen = useMutation({ mutationFn: () => prospectsApi.reopen(id, reopenNote), onSuccess: () => { setReopening(false); setReopenNote(""); refresh(); toast({ title: "Prospect reopened" }) }, onError: fail("Couldn't reopen") })
  const review = useMutation({ mutationFn: (decision: "retry" | "invalid" | "not_interested") => prospectsApi.review(id, decision, reviewNote || undefined), onSuccess: () => { setReviewNote(""); refresh(); toast({ title: "Decision saved" }) }, onError: fail("Couldn't save the decision") })
  const completeTask = useMutation({ mutationFn: (tid: number) => tasksApi.done(tid), onSuccess: refresh, onError: fail("Couldn't update the task") })

  const goNext = async () => {
    try {
      const r = await prospectsApi.next({ excludeId: id })
      if (r.empty || !r.id) { router.push("/ops/call"); return }
      router.push(`/ops/prospects/${r.id}?from=queue`)
    } catch (e) { fail("Couldn't open the next prospect")(e) }
  }

  if (q.isLoading) return <><PageHead title="Loading…" /><Card flush><SkelRows rows={8} /></Card></>
  if (q.isError || !d) return <Card><ErrorState message={opsErrorMessage(q.error, "This prospect could not be opened.")} onRetry={() => q.refetch()} /></Card>

  const p = d.prospect
  const closed = CLOSED_BLOCKED.has(p.status)
  const callable = !CLOSED_BLOCKED.has(p.status) && can("ops_prospect_call")
  const lead = can("ops_prospect_reassign")
  const isOwner = p.ownerUserId === me.user.id
  const lockedByOther = !!p.lockedByUserId && p.lockedByUserId !== me.user.id && !!p.lockedUntil && new Date(p.lockedUntil).getTime() > Date.now()
  const reopenAllowed = p.status === "do_not_contact" || p.status === "duplicate" ? lead : (lead || isOwner)
  const nextDue = dueLabel(p.nextActionAt)
  const sub = [p.vendorType, [p.area, p.cityName].filter(Boolean).join(", ")].filter(Boolean).join(" · ")

  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <Link href={fromQueue ? "/ops/call" : "/ops/prospects"} className="btn btn-link" style={{ paddingLeft: 0 }}><ArrowLeft aria-hidden />{fromQueue ? "Back to the queue" : "All prospects"}</Link>
      </div>
      <PageHead
        title={p.name}
        sub={<span className="row" style={{ gap: 8 }}><StatusBadge status={p.status} />{sub && <span>{sub}</span>}{p.attemptCount > 0 && <span>· {p.attemptCount} attempt{p.attemptCount === 1 ? "" : "s"}</span>}</span>}
        actions={<>
          {can("ops_prospect_call") && <Btn icon={<Pencil aria-hidden />} onClick={() => setEditing(true)}>Edit details</Btn>}
          {p.businessId
            ? <Link href={`/ops/listings/${p.businessId}`} className="btn btn-primary"><Store size={15} aria-hidden />Open the listing</Link>
            : (can("ops_onboard_direct") || can("ops_takeover_listing")) && !CLOSED_BLOCKED.has(p.status) && (
              <Link href={`/ops/prospects/${p.id}/onboarding`} className={cx("btn", ["interested", "onboarding"].includes(p.status) ? "btn-primary" : "btn-ghost")}>
                <Store size={15} aria-hidden />{p.status === "onboarding" ? "Continue the call sheet" : p.matchedBusinessId ? "Take over the listing" : "Onboard this vendor"}
              </Link>
            )}
        </>}
      />

      <div className="stack" style={{ marginBottom: 16 }}>
        {p.status === "do_not_contact" && <Notice tone="bad">This vendor asked not to be contacted. Do not call or message them.</Notice>}
        {lockedByOther && <Notice tone="warn">Someone else is working this prospect right now. You can read it, but you cannot log a call until they finish.</Notice>}
        {p.reviewReason && (
          <Card title="Needs a decision" sub="No answer after repeated tries. A lead decides whether to keep trying.">
            {lead ? (
              <div className="stack" style={{ gap: 12 }}>
                <Field label="Note" htmlFor="rv-note" hint="Optional."><Input id="rv-note" value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} /></Field>
                <div className="row"><Btn variant="primary" loading={review.isPending} onClick={() => review.mutate("retry")}>Try again</Btn><Btn onClick={() => review.mutate("invalid")}>Mark invalid</Btn><Btn onClick={() => review.mutate("not_interested")}>Not interested</Btn></div>
              </div>
            ) : <p className="muted">Your lead has been told and will decide.</p>}
          </Card>
        )}
      </div>

      <div className="cols-main">
        <div className="stack">
          {callable && !lockedByOther ? (
            <CallForm detail={d} dispositions={disp.data?.dispositions ?? []} onSaved={(next) => { refresh(); if (next) void goNext() }} />
          ) : closed ? (
            <Card title={closedTitle(p.status)} sub="Calls cannot be logged on a closed prospect.">
              {reopenAllowed ? <Btn icon={<RotateCcw aria-hidden />} onClick={() => setReopening(true)}>Reopen</Btn> : <p className="muted">A lead can reopen this one if it should be called again.</p>}
            </Card>
          ) : null}
          <Card title="History" flush><Timeline calls={d.calls} events={d.events} /></Card>
        </div>

        <div className="stack">
          <Card title="Phone numbers">
            <div className="stack" style={{ gap: 12 }}>
              {p.phones.map((ph) => (
                <div key={ph.key} className="stack" style={{ gap: 6 }}>
                  <div className="row between">
                    <span className="strong num" style={ph.status === "wrong" || ph.status === "dead" ? { textDecoration: "line-through", color: "var(--ink-3)" } : undefined}>{fmtPhone(ph)}</span>
                    <span className="row" style={{ gap: 6 }}><span className="small muted">{ph.label}</span>{ph.status === "valid" && <Status tone="ok">Works</Status>}{ph.status === "wrong" && <Status tone="bad">Wrong</Status>}{ph.status === "dead" && <Status tone="bad">Dead</Status>}</span>
                  </div>
                  {ph.status !== "wrong" && ph.status !== "dead" && <PhoneActions phone={ph} />}
                  {can("ops_prospect_call") && (
                    <div className="row" style={{ gap: 6 }}>
                      {ph.status !== "valid" && <button type="button" className="btn btn-link" style={{ height: 24, fontSize: 12 }} onClick={() => setPhoneStatus.mutate({ key: ph.key, status: "valid" })}>Mark as working</button>}
                      {ph.status !== "wrong" && <button type="button" className="btn btn-link" style={{ height: 24, fontSize: 12, color: "var(--bad)" }} onClick={() => setPhoneStatus.mutate({ key: ph.key, status: "wrong" })}>Mark wrong</button>}
                      {(ph.status === "wrong" || ph.status === "dead") && <button type="button" className="btn btn-link" style={{ height: 24, fontSize: 12 }} onClick={() => setPhoneStatus.mutate({ key: ph.key, status: "unknown" })}>Undo</button>}
                    </div>
                  )}
                </div>
              ))}
              {can("ops_prospect_call") && (
                <form className="row" style={{ flexWrap: "nowrap", alignItems: "flex-end", gap: 8 }} onSubmit={(e) => { e.preventDefault(); if (newPhone.trim()) addPhone.mutate() }}>
                  <Field label="Add another number" htmlFor="ph-add" className="grow"><Input id="ph-add" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="0300 1234567" inputMode="tel" /></Field>
                  <Btn type="submit" icon={<Plus aria-hidden />} loading={addPhone.isPending} disabled={!newPhone.trim()}>Add</Btn>
                </form>
              )}
            </div>
          </Card>

          {d.listing && (
            <Card title="Already on Wedding Wala" sub={d.listing.unclaimed ? "This business has a listing nobody has claimed yet." : "Possible match: check it is the same business."}>
              <div className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start", gap: 10 }}>
                <span className="ava" aria-hidden><Store size={15} /></span>
                <div style={{ minWidth: 0 }}>
                  <div className="strong">{d.listing.name ?? "Listing"}</div>
                  <div className="small muted">{d.listing.city ?? ""} · {d.listing.matchKind === "phone" ? "same phone number" : "similar name in the same city"}</div>
                </div>
              </div>
              {d.listing.leads > 0 && <Notice tone="ok"><b>{d.listing.leads} couple{d.listing.leads === 1 ? "" : "s"} asked about this business</b>{d.listing.newLeads ? ` (${d.listing.newLeads} unanswered)` : ""}. Tell them: people are already looking for you.</Notice>}
            </Card>
          )}

          <Card title="Business">
            <dl className="kv">
              <dt>Category</dt><dd>{p.vendorType ?? <span className="muted">Not set</span>}</dd>
              <dt>City / area</dt><dd>{[p.cityName, p.area].filter(Boolean).join(" · ") || <span className="muted">Not set</span>}</dd>
              <dt>Address</dt><dd>{p.address ?? <span className="muted">—</span>}</dd>
              <dt>Contact person</dt><dd>{p.contactPerson ?? <span className="muted">—</span>}</dd>
              <dt>Email</dt><dd>{p.email ?? <span className="muted">—</span>}</dd>
              <dt>Website</dt><dd>{p.website ? <a href={p.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-ink)" }}>{p.website.replace(/^https?:\/\//, "")}</a> : <span className="muted">—</span>}</dd>
              <dt>On Google Maps</dt><dd>{p.mapsUrl ? <a href={p.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-ink)" }}>Open the map</a> : <span className="muted">—</span>}</dd>
              <dt>Notes</dt><dd style={{ whiteSpace: "pre-wrap" }}>{p.notes ?? <span className="muted">—</span>}</dd>
              <dt>Owner</dt><dd>{p.ownerName ?? <span className="muted">Unassigned (pool)</span>}</dd>
              <dt>Team</dt><dd>{p.teamName ?? "—"}</dd>
              <dt>Source</dt><dd>{p.sourceType === "maps" ? "Google Maps sheet" : p.sourceType}{p.batchFile ? ` · ${p.batchFile}` : ""}</dd>
              <dt>Added</dt><dd>{fmtDay(p.createdAt)}</dd>
            </dl>
          </Card>

          <Card title="Callbacks" sub={p.nextActionAt ? `Next: ${fmtWhen(p.nextActionAt)} (${nextDue.text})` : undefined}>
            {d.tasks.filter((t) => !t.doneAt).length === 0 ? <p className="muted">Nothing scheduled.</p> : d.tasks.filter((t) => !t.doneAt).map((t) => {
              const dl = dueLabel(t.dueAt)
              return (
                <div key={t.id} className="row between" style={{ padding: "6px 0" }}>
                  <div><div className="strong">{KIND_LABEL[t.kind] ?? t.kind}</div><div className="small muted">{fmtWhen(t.dueAt)} · {t.assigneeName ?? "—"}</div></div>
                  <span className="row" style={{ gap: 8 }}><Status tone={dl.due ? dl.tone : "mut"}>{dl.text}</Status><Btn size="sm" icon={<CheckCircle2 aria-hidden />} onClick={() => completeTask.mutate(t.id)}>Done</Btn></span>
                </div>
              )
            })}
          </Card>
        </div>
      </div>

      <EditModal prospect={p} open={editing} onClose={() => setEditing(false)} canPriority={lead} />
      <Modal open={reopening} onClose={() => setReopening(false)} title="Reopen this prospect?" description="It goes back to the calling queue. Say why, so the next person knows."
        footer={<><Btn onClick={() => setReopening(false)}>Cancel</Btn><Btn variant="primary" loading={reopen.isPending} disabled={reopenNote.trim().length < 3} onClick={() => reopen.mutate()}>Reopen</Btn></>}>
        <Field label="Reason" htmlFor="ro-note" required><Textarea id="ro-note" value={reopenNote} onChange={(e) => setReopenNote(e.target.value)} placeholder="e.g. the owner called us back and wants to be listed" /></Field>
      </Modal>
    </>
  )
}

function closedTitle(status: string): string {
  switch (status) {
    case "do_not_contact": return "Do not contact"
    case "duplicate": return "Duplicate"
    case "invalid": return "Invalid: no working number or not a wedding vendor"
    case "live": return "Already live on Wedding Wala"
    case "not_interested": return "Not interested"
    default: return "Closed"
  }
}
