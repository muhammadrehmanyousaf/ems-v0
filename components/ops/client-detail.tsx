"use client"

// One client: contact them, log what happened, shortlist venues, hand the shortlist to a vendor manager, and read the whole history.
// The first-response timer stops at the first logged call or WhatsApp (a plain note does not). The server re-checks every rule; this screen offers the valid choices.
import Link from "next/link"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CalendarPlus, Copy, MessageCircle, Pencil, Phone, Search, Send, Trash2, UserCheck } from "lucide-react"

import { useOps } from "@/components/ops/ops-shell"
import { AvailabilityBadge, CLIENT_STATUS, CLOSED, ClientStatusBadge, EVENT_LABEL, ResponseBadge, SOURCE_LABEL, StageBadge, fmtPkr } from "@/components/ops/client-bits"
import { VendorSearchPanel } from "@/components/ops/vendor-search"
import { fmtPhone, telHref, waHref } from "@/components/ops/prospect-bits"
import { Btn, Card, Empty, ErrorState, Field, IconBtn, Input, Modal, Notice, PageHead, Seg, Select, SkelRows, Status, Textarea, fmtDay, fmtWhen, useOpsToast } from "@/components/ops/ops-ui"
import { opsApi, opsErrorMessage } from "@/lib/api/ops"
import { clientsApi, shortlistApi, type ClientDetail, type ClientEventKind, type ClientStatus, type ContactKind } from "@/lib/api/ops-clients"
import { opsErrorData } from "@/lib/api/ops-onboarding"
import { shortlistMessage } from "@/lib/ops/whatsapp"
import { SITE_URL } from "@/lib/seo/constants"
import { vendorLeafHref } from "@/lib/seo/vendor-href"

const TIMELINE_ICON: Record<string, string> = { call: "Call", whatsapp: "WhatsApp", note: "Note", status: "Status", assignment: "Hand-off", shortlist: "Shortlist", inquiry: "Inquiry", system: "" }

/* ----------------------------------- modals ----------------------------------- */

function EditModal({ d, onClose, onSaved }: { d: ClientDetail; onClose: () => void; onSaved: (x: ClientDetail) => void }) {
  const toast = useOpsToast()
  const cities = useQuery({ queryKey: ["ops", "cities"], queryFn: opsApi.cities })
  const c = d.client
  const [f, setF] = useState({ name: c.name, email: c.email ?? "", cityId: c.cityId ? String(c.cityId) : "", guests: c.guests ? String(c.guests) : "", budget: c.budgetPkr ? String(Number(c.budgetPkr)) : "", requirements: c.requirements ?? "", notes: c.notes ?? "", addPhone: "" })
  const [err, setErr] = useState<{ field?: string; message: string } | null>(null)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { setF((s) => ({ ...s, [k]: e.target.value })); setErr(null) }
  const save = useMutation({
    mutationFn: () => clientsApi.update(c.id, { name: f.name, email: f.email, cityId: f.cityId || null, guests: f.guests, budgetPkr: f.budget, requirements: f.requirements, notes: f.notes, ...(f.addPhone.trim() ? { addPhone: f.addPhone } : {}) }),
    onSuccess: (x) => { toast({ title: "Saved" }); onSaved(x); onClose() },
    onError: (e) => { const dd = opsErrorData<{ field?: string }>(e); setErr({ field: dd?.field, message: opsErrorMessage(e) }) },
  })
  return (
    <Modal open onClose={onClose} title="Edit client" footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={save.isPending} disabled={!f.name.trim()} onClick={() => save.mutate()}>Save</Btn></>}>
      <div style={{ display: "grid", gap: 14 }}>
        {err && !err.field ? <Notice tone="bad">{err.message}</Notice> : null}
        <div className="grid2">
          <Field label="Name" htmlFor="ce-name" required error={err?.field === "name" ? err.message : null}><Input id="ce-name" value={f.name} onChange={set("name")} /></Field>
          <Field label="E-mail" htmlFor="ce-mail" error={err?.field === "email" ? err.message : null}><Input id="ce-mail" type="email" value={f.email} onChange={set("email")} /></Field>
        </div>
        <div className="grid3">
          <Field label="City" htmlFor="ce-city"><Select id="ce-city" value={f.cityId} onChange={set("cityId")}><option value="">Not sure</option>{(cities.data?.cities ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field>
          <Field label="Guests" htmlFor="ce-guests" error={err?.field === "guests" ? err.message : null}><Input id="ce-guests" inputMode="numeric" value={f.guests} onChange={set("guests")} /></Field>
          <Field label="Budget (PKR)" htmlFor="ce-bud" error={err?.field === "budgetPkr" ? err.message : null}><Input id="ce-bud" inputMode="numeric" value={f.budget} onChange={set("budget")} /></Field>
        </div>
        <Field label="Add another number" htmlFor="ce-ph" hint="A second phone or WhatsApp number for the same couple." error={err?.field === "addPhone" ? err.message : null}><Input id="ce-ph" type="tel" value={f.addPhone} onChange={set("addPhone")} placeholder="0300 1234567" /></Field>
        <Field label="What they want" htmlFor="ce-req"><Textarea id="ce-req" rows={3} maxLength={4000} value={f.requirements} onChange={set("requirements")} /></Field>
        <Field label="Notes" htmlFor="ce-notes"><Textarea id="ce-notes" rows={3} maxLength={4000} value={f.notes} onChange={set("notes")} /></Field>
      </div>
    </Modal>
  )
}

function EventModal({ id, onClose, onSaved }: { id: number; onClose: () => void; onSaved: (x: ClientDetail) => void }) {
  const [f, setF] = useState({ kind: "barat" as ClientEventKind, eventDate: "", guests: "", budget: "", notes: "" })
  const [err, setErr] = useState<{ field?: string; message: string } | null>(null)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setF((s) => ({ ...s, [k]: e.target.value })); setErr(null) }
  const save = useMutation({
    mutationFn: () => clientsApi.addEvent(id, { kind: f.kind, eventDate: f.eventDate || undefined, guests: f.guests || undefined, budgetPkr: f.budget || undefined, notes: f.notes || undefined }),
    onSuccess: (x) => { onSaved(x); onClose() },
    onError: (e) => { const dd = opsErrorData<{ field?: string }>(e); setErr({ field: dd?.field, message: opsErrorMessage(e) }) },
  })
  return (
    <Modal open onClose={onClose} title="Add a function" description="A wedding is often several days: mehndi, barat, walima." footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Add</Btn></>}>
      <div style={{ display: "grid", gap: 14 }}>
        {err && !err.field ? <Notice tone="bad">{err.message}</Notice> : null}
        <div className="grid2">
          <Field label="Function" htmlFor="ev-kind"><Select id="ev-kind" value={f.kind} onChange={set("kind")}>{(Object.keys(EVENT_LABEL) as ClientEventKind[]).map((k) => <option key={k} value={k}>{EVENT_LABEL[k]}</option>)}</Select></Field>
          <Field label="Date" htmlFor="ev-date" error={err?.field === "eventDate" ? err.message : null}><Input id="ev-date" type="date" value={f.eventDate} onChange={set("eventDate")} /></Field>
        </div>
        <div className="grid2">
          <Field label="Guests" htmlFor="ev-g" error={err?.field === "guests" ? err.message : null}><Input id="ev-g" inputMode="numeric" value={f.guests} onChange={set("guests")} /></Field>
          <Field label="Budget (PKR)" htmlFor="ev-b" error={err?.field === "budgetPkr" ? err.message : null}><Input id="ev-b" inputMode="numeric" value={f.budget} onChange={set("budget")} /></Field>
        </div>
        <Field label="Note" htmlFor="ev-n"><Input id="ev-n" maxLength={300} value={f.notes} onChange={set("notes")} /></Field>
      </div>
    </Modal>
  )
}

function StatusModal({ d, onClose, onSaved }: { d: ClientDetail; onClose: () => void; onSaved: (x: ClientDetail) => void }) {
  const closed = CLOSED.has(d.client.status)
  const options: ClientStatus[] = closed ? ["contacted", "shortlisting"] : ["contacted", "shortlisting", "booked", "lost", "closed"]
  const [status, setStatus] = useState<ClientStatus>(options[0])
  const [reason, setReason] = useState("")
  const need = closed || status === "lost" || status === "closed"
  const save = useMutation({ mutationFn: () => clientsApi.setStatus(d.client.id, status, reason || undefined), onSuccess: (x) => { onSaved(x); onClose() } })
  return (
    <Modal open onClose={onClose} title={closed ? "Reopen this client" : "Change status"} description={status === "booked" ? "Booked means the couple confirmed a venue." : undefined}
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant={status === "lost" || status === "closed" ? "danger" : "primary"} loading={save.isPending} disabled={need && !reason.trim()} onClick={() => save.mutate()}>Save</Btn></>}>
      <div style={{ display: "grid", gap: 14 }}>
        {save.isError ? <Notice tone="bad">{opsErrorMessage(save.error)}</Notice> : null}
        <Field label="New status" htmlFor="st-s"><Select id="st-s" value={status} onChange={(e) => setStatus(e.target.value as ClientStatus)}>{options.map((s) => <option key={s} value={s}>{CLIENT_STATUS[s].label}</option>)}</Select></Field>
        {need ? <Field label="Why" htmlFor="st-r" required><Input id="st-r" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={closed ? "They called back" : "Booked another venue"} /></Field> : null}
      </div>
    </Modal>
  )
}

function AssignModal({ d, onClose, onSaved }: { d: ClientDetail; onClose: () => void; onSaved: () => void }) {
  const toast = useOpsToast()
  const open = d.assignments.find((a) => a.status === "open")
  const q = useQuery({ queryKey: ["ops", "assignees", d.client.id], queryFn: () => shortlistApi.assignees(d.client.id) })
  const [pick, setPick] = useState<number | null>(null)
  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")
  const list = (q.data?.suggestions ?? []).filter((s) => !open || s.userId !== open.assignedToUserId)
  const chosen = pick ?? list[0]?.userId ?? null
  const save = useMutation({
    mutationFn: () => shortlistApi.assign(d.client.id, { assignedToUserId: chosen ?? undefined, reason: reason || undefined, note: note || undefined }),
    onSuccess: (r) => { toast({ title: `Assigned to ${r.assigneeName}`, body: `${r.venues} venue${r.venues === 1 ? "" : "s"} to check by phone.` }); onSaved(); onClose() },
  })
  return (
    <Modal open onClose={onClose} title={open ? "Reassign to another vendor manager" : "Assign to a vendor manager"} description={`${d.shortlist.length} shortlisted venue${d.shortlist.length === 1 ? "" : "s"} for them to confirm by phone. They never see ${d.client.name}'s phone number.`}
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" icon={<Send aria-hidden />} loading={save.isPending} disabled={!chosen || (!!open && !reason.trim())} onClick={() => save.mutate()}>{open ? "Reassign" : "Assign"}</Btn></>}>
      <div style={{ display: "grid", gap: 14 }}>
        {save.isError ? <Notice tone="bad">{opsErrorMessage(save.error)}</Notice> : null}
        {q.isLoading ? <SkelRows rows={3} /> : q.data?.nobody ? <Notice tone="warn">No vendor manager is available. Pressing Assign tells the managers.</Notice> : (
          <>
            {q.data?.noCityMatch ? <Notice tone="warn">Nobody covers {d.client.cityName ?? "this city"}: the list shows everyone, lightest workload first.</Notice> : null}
            <div role="radiogroup" aria-label="Vendor manager" style={{ display: "grid", gap: 8 }}>
              {list.map((s) => (
                <label key={s.userId} className="list-row" style={{ border: "1px solid var(--border)", borderRadius: 10, cursor: "pointer", background: chosen === s.userId ? "var(--accent-wash)" : undefined }}>
                  <input type="radio" name="assignee" checked={chosen === s.userId} onChange={() => setPick(s.userId)} />
                  <div style={{ flex: 1 }}><div className="td-name">{s.fullName}</div><div className="td-sub">{s.teamName}</div></div>
                  <span className="row" style={{ gap: 6 }}>{s.cityMatch ? <Status tone="ok">Covers the city</Status> : <Status tone="mut">Other city</Status>}<Status tone={s.openCount > 3 ? "warn" : "mut"}>{s.openCount} open</Status></span>
                </label>
              ))}
            </div>
          </>
        )}
        {open ? <Field label="Why reassign" htmlFor="as-r" required><Input id="as-r" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="On leave" /></Field> : null}
        <Field label="Note for them (optional)" htmlFor="as-n"><Textarea id="as-n" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Barat in July, around 400 guests" /></Field>
      </div>
    </Modal>
  )
}

/* ------------------------------------- screen ------------------------------------- */

export function ClientDetailView({ id }: { id: number }) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  const { can } = useOps()
  const q = useQuery({ queryKey: ["ops", "client", id], queryFn: () => clientsApi.get(id), staleTime: 0, refetchOnWindowFocus: false })
  const [edit, setEdit] = useState(false)
  const [eventing, setEventing] = useState(false)
  const [statusing, setStatusing] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [finding, setFinding] = useState(false)
  const [kind, setKind] = useState<ContactKind>("call")
  const [text, setText] = useState("")

  const put = (x: ClientDetail) => { qc.setQueryData(["ops", "client", id], x); qc.invalidateQueries({ queryKey: ["ops", "clients"] }) }
  const refresh = () => { qc.invalidateQueries({ queryKey: ["ops", "client", id] }); qc.invalidateQueries({ queryKey: ["ops", "clients"] }) }
  const log = useMutation({ mutationFn: () => clientsApi.contact(id, kind, text || undefined), onSuccess: (x) => { put(x); setText(""); toast({ title: kind === "note" ? "Note saved" : "Logged", body: kind === "note" ? undefined : "The first-response timer is stopped." }) }, onError: (e) => toast({ title: "Couldn't log", body: opsErrorMessage(e), tone: "bad" }) })
  const claim = useMutation({ mutationFn: () => clientsApi.claim(id), onSuccess: (x) => { put(x); toast({ title: "This client is yours" }) }, onError: (e) => toast({ title: "Couldn't take it", body: opsErrorMessage(e), tone: "bad" }) })
  const pool = useMutation({ mutationFn: () => clientsApi.setOwner(id, null, "Returned to the pool"), onSuccess: put, onError: (e) => toast({ title: "Couldn't change the handler", body: opsErrorMessage(e), tone: "bad" }) })
  const unlist = useMutation({ mutationFn: (itemId: number) => shortlistApi.remove(id, itemId), onSuccess: refresh, onError: (e) => toast({ title: "Couldn't remove", body: opsErrorMessage(e), tone: "bad" }) })
  const rmEvent = useMutation({ mutationFn: (eventId: number) => clientsApi.removeEvent(id, eventId), onSuccess: put })

  if (q.isLoading) return <><PageHead title="Client" /><Card flush><SkelRows rows={8} /></Card></>
  if (q.isError || !q.data) {
    const dd = opsErrorData(q.error)
    return <ErrorState message={dd?.code === "CLIENT_NOT_FOUND" ? "This client was not found, or it belongs to someone else." : opsErrorMessage(q.error)} onRetry={() => q.refetch()} />
  }
  const d = q.data
  const c = d.client
  const closed = CLOSED.has(c.status)
  const openAssign = d.assignments.find((a) => a.status === "open")
  const canManage = can("ops_client_manage")
  const lead = can("ops_prospect_reassign")
  const message = async () => {
    const text = shortlistMessage({ clientName: c.name, venues: d.shortlist.map((s) => ({ id: s.businessId, name: s.businessName, city: s.city, vendorType: s.vendorType, maxCapacity: s.maxCapacity, perHeadFromPkr: s.perHeadPkr ?? s.listedPerHeadPkr })), origin: SITE_URL, href: (v) => vendorLeafHref({ id: v.id, name: v.name, city: v.city, vendorType: v.vendorType }) })
    const phone = c.phones[0]
    const wa = phone ? waHref(phone, text) : null
    try { await navigator.clipboard.writeText(text) } catch { /* the link below carries the text */ }
    if (wa) window.open(wa, "_blank", "noopener,noreferrer")
    else toast({ title: "Message copied", body: "Paste it into WhatsApp." })
  }

  return (
    <>
      <div style={{ marginBottom: 10 }}><Link href="/ops/clients" className="btn btn-link" style={{ paddingLeft: 0 }}><ArrowLeft aria-hidden />All clients</Link></div>
      <PageHead
        title={c.name}
        sub={<span className="row" style={{ gap: 8 }}><ClientStatusBadge status={c.status} /><ResponseBadge row={c} />{c.ownerName ? <span>· {c.ownerName}</span> : <Status tone="acc">In the pool</Status>}</span>}
        actions={<>
          {!c.ownerUserId && canManage && !closed && <Btn variant="primary" icon={<UserCheck aria-hidden />} loading={claim.isPending} onClick={() => claim.mutate()}>Take this client</Btn>}
          {canManage && <Btn icon={<Pencil aria-hidden />} onClick={() => setEdit(true)}>Edit</Btn>}
          {canManage && <Btn onClick={() => setStatusing(true)}>{closed ? "Reopen" : "Status"}</Btn>}
        </>}
      />

      <div className="stack" style={{ marginBottom: 16 }}>
        {closed && <Notice tone="info">This client is {CLIENT_STATUS[c.status].label.toLowerCase()}{c.statusReason ? `: ${c.statusReason}` : ""}. Reopen it to log calls or change the shortlist.</Notice>}
        {c.overdue && <Notice tone="bad">Nobody has replied to this client yet and the target time has passed. Call or WhatsApp them now.</Notice>}
        {!c.ownerUserId && !closed && <Notice tone="info">This client is in the desk's pool. Take it, or just log a call and it becomes yours.</Notice>}
      </div>

      <div className="cols-main">
        <div className="stack">
          {/* ------------------------------ contact ------------------------------ */}
          <Card title="Contact" sub="Call or WhatsApp from your own phone, then log it here.">
            <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
              {c.phones.map((p) => (
                <div key={p.raw} className="row between" style={{ gap: 10 }}>
                  <span className="num">{fmtPhone(p)}{p.label ? <span className="muted small"> · {p.label}</span> : null}</span>
                  <span className="row" style={{ gap: 6 }}>
                    <a className="btn btn-ghost sm" href={telHref(p)}><Phone size={14} aria-hidden />Call</a>
                    {waHref(p) && <a className="btn btn-ghost sm" href={waHref(p)!} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} aria-hidden />WhatsApp</a>}
                  </span>
                </div>
              ))}
              {c.email ? <div className="small muted">{c.email}</div> : null}
            </div>
            {canManage && !closed ? (
              <div style={{ display: "grid", gap: 10, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                <Seg<ContactKind> label="What happened" value={kind} onChange={setKind} options={[{ value: "call", label: "I called" }, { value: "whatsapp", label: "I messaged" }, { value: "note", label: "Just a note" }]} />
                <Field label={kind === "note" ? "Note" : "What was said (optional)"} htmlFor="lg-text" hint={kind === "note" ? "A note does not stop the first-response timer." : "Logging a call or message counts as the first reply."}>
                  <Textarea id="lg-text" rows={3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder={kind === "call" ? "Spoke to the bride's brother, wants a lawn in July" : ""} />
                </Field>
                <div><Btn variant="primary" loading={log.isPending} disabled={kind === "note" && !text.trim()} onClick={() => log.mutate()}>{kind === "note" ? "Save note" : "Log it"}</Btn></div>
              </div>
            ) : null}
          </Card>

          {/* ------------------------------ shortlist ------------------------------ */}
          <Card title="Shortlist" sub={d.shortlist.length ? `${d.shortlist.length} venue${d.shortlist.length === 1 ? "" : "s"}` : "Venues to suggest to this couple."}
            actions={<>
              {canManage && !closed && can("ops_vendor_search") && d.shortlist.length > 0 && <Btn size="sm" icon={<Search aria-hidden />} onClick={() => setFinding(true)}>Add venues</Btn>}
              {d.shortlist.length > 0 && <Btn size="sm" icon={<Copy aria-hidden />} onClick={message}>Send on WhatsApp</Btn>}
              {canManage && can("ops_client_assign") && !closed && d.shortlist.length > 0 && <Btn size="sm" variant="primary" icon={<Send aria-hidden />} onClick={() => setAssigning(true)}>{openAssign ? "Reassign" : "Assign to a vendor manager"}</Btn>}
            </>} flush={d.shortlist.length > 0}>
            {d.shortlist.length === 0 ? <Empty icon={<Search />} title="No venues yet" action={canManage && !closed && can("ops_vendor_search") ? <Btn variant="primary" onClick={() => setFinding(true)}>Find venues</Btn> : undefined}>Search the catalogue and add the ones that fit, then assign the client so a vendor manager confirms each by phone.</Empty> : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Venue</th><th>Phone check</th><th className="r">Quoted</th><th className="r">Per head</th><th /></tr></thead>
                  <tbody>{d.shortlist.map((s) => (
                    <tr key={s.id}>
                      <td style={{ minWidth: 200 }}><div className="td-name">{s.businessName}</div><div className="td-sub">{[s.subArea, s.city, s.maxCapacity && s.maxCapacity > 1 ? `up to ${s.maxCapacity}` : null].filter(Boolean).join(" · ")}</div>{s.note ? <div className="td-sub">{s.note}</div> : null}</td>
                      <td className="nw"><AvailabilityBadge value={s.availability} />{s.checkedAt ? <div className="td-sub">{fmtWhen(s.checkedAt)}{s.checkedByName ? ` · ${s.checkedByName}` : ""}</div> : null}</td>
                      <td className="r num">{fmtPkr(s.quotedPricePkr)}</td>
                      <td className="r num">{s.perHeadPkr ? fmtPkr(s.perHeadPkr) : s.listedPerHeadPkr ? <span className="muted">{fmtPkr(s.listedPerHeadPkr)} listed</span> : "—"}</td>
                      <td className="r">{canManage && !closed && !s.checkedAt ? <IconBtn label={`Remove ${s.businessName}`} onClick={() => unlist.mutate(s.id)}><Trash2 size={15} /></IconBtn> : null}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </Card>

          {/* ------------------------------ history ------------------------------ */}
          <Card title="History" flush>
            {d.timeline.length === 0 ? <Empty title="Nothing yet">Calls, notes and changes will appear here.</Empty> : d.timeline.map((e) => (
              <div key={e.id} className="list-row" style={{ alignItems: "flex-start" }}>
                <div style={{ width: 84, flex: "none" }}><Status tone={e.kind === "call" || e.kind === "whatsapp" ? "info" : e.kind === "inquiry" ? "acc" : "mut"}>{TIMELINE_ICON[e.kind] || "Update"}</Status></div>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, wordBreak: "break-word" }}>{e.body || "—"}</div><div className="small muted">{fmtWhen(e.at)}{e.authorName ? ` · ${e.authorName}` : ""}</div></div>
              </div>
            ))}
          </Card>
        </div>

        <div className="stack">
          <Card title="Details">
            <dl className="kv">
              <dt>Source</dt><dd>{SOURCE_LABEL[c.source]}</dd>
              <dt>City</dt><dd>{c.cityName ?? "—"}</dd>
              <dt>Guests</dt><dd>{c.guests ?? "—"}</dd>
              <dt>Budget</dt><dd>{fmtPkr(c.budgetPkr)}</dd>
              <dt>Wants</dt><dd>{c.requirements || "—"}</dd>
              <dt>Notes</dt><dd>{c.notes || "—"}</dd>
            </dl>
          </Card>

          <Card title="Functions" sub="Mehndi, barat, walima and the dates." actions={canManage && !closed ? <Btn size="sm" icon={<CalendarPlus aria-hidden />} onClick={() => setEventing(true)}>Add</Btn> : undefined}>
            {d.events.length === 0 ? <p className="muted small" style={{ margin: 0 }}>No dates yet.</p> : d.events.map((e) => (
              <div key={e.id} className="row between" style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <div><b>{EVENT_LABEL[e.kind]}</b>{e.eventDate ? ` · ${fmtDay(e.eventDate)}` : ""}<div className="small muted">{[e.guests ? `${e.guests} guests` : null, e.budgetPkr ? fmtPkr(e.budgetPkr) : null, e.notes].filter(Boolean).join(" · ")}</div></div>
                {canManage && !closed ? <IconBtn label="Remove this function" onClick={() => rmEvent.mutate(e.id)}><Trash2 size={15} /></IconBtn> : null}
              </div>
            ))}
          </Card>

          <Card title="Vendor manager" sub="Who is confirming the shortlist by phone.">
            {d.assignments.length === 0 ? <p className="muted small" style={{ margin: 0 }}>Not handed over yet. Shortlist venues, then assign.</p> : d.assignments.map((a) => (
              <div key={a.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div className="row between"><b>{a.assigneeName}</b><Status tone={a.status === "open" ? "info" : a.status === "done" ? "ok" : "mut"}>{a.status === "open" ? "Working on it" : a.status === "done" ? "Finished" : "Cancelled"}</Status></div>
                <div className="small muted">{fmtWhen(a.createdAt)}{a.assignedByName ? ` · by ${a.assignedByName}` : ""}{a.firstActionAt ? ` · first check ${fmtWhen(a.firstActionAt)}` : a.status === "open" ? " · no check yet" : ""}</div>
                {a.status === "open" && <div className="row" style={{ gap: 8, marginTop: 6, flexWrap: "wrap" }}><StageBadge stage={a.stage} />{a.stageNote ? <span className="small">{a.stageNote}</span> : null}{a.stageAt ? <span className="small muted">{fmtWhen(a.stageAt)}</span> : null}</div>}
                {a.reason ? <div className="small">{a.reason}</div> : null}
              </div>
            ))}
          </Card>

          {d.inquiries.length > 0 && (
            <Card title="Website inquiries" sub="What this couple asked on the site.">
              {d.inquiries.map((i) => (
                <div key={i.id} style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                  <div><b>{i.vendorName ?? "A vendor"}</b>{i.eventType ? ` · ${i.eventType}` : ""}</div>
                  {i.inquiry ? <div className="small">{i.inquiry}</div> : null}
                  <div className="small muted">{fmtWhen(i.createdAt)}</div>
                </div>
              ))}
            </Card>
          )}

          {Array.isArray((d as unknown as { bookings?: unknown[] }).bookings) && (d as unknown as { bookings: { id: number; status: string; paymentStatus: string; bookingDate: string | null; eventCity: string | null; eventType: string | null; totalAmount: number | string | null; opsStage: string | null }[] }).bookings.length > 0 && (
            <Card title="Bookings" sub="Live marketplace bookings for this couple.">
              {(d as unknown as { bookings: { id: number; status: string; paymentStatus: string; bookingDate: string | null; eventCity: string | null; eventType: string | null; totalAmount: number | string | null; opsStage: string | null }[] }).bookings.map((bk) => (
                <div key={bk.id} className="row between" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                      <Link href={`/ops/bookings/${bk.id}`} style={{ fontWeight: 600 }}>Booking #{bk.id}</Link>
                      <Status tone={bk.status === "Confirmed" ? "ok" : bk.status === "Cancelled" ? "bad" : "info"}>{bk.status}</Status>
                    </div>
                    <div className="small muted">
                      {[bk.bookingDate ? fmtDay(bk.bookingDate) : null, bk.eventType, bk.eventCity, bk.paymentStatus].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <Link href={`/ops/bookings/${bk.id}`} className="btn btn-sm">Open</Link>
                </div>
              ))}
            </Card>
          )}

          {d.tasks.some((t) => !t.doneAt) && (
            <Card title="To do">
              {d.tasks.filter((t) => !t.doneAt).map((t) => <div key={t.id} className="row between" style={{ padding: "6px 0" }}><span>{t.note || t.kind}</span><span className="small muted">{fmtWhen(t.dueAt)}</span></div>)}
            </Card>
          )}

          {lead && c.ownerUserId && !closed && <div><Btn size="sm" loading={pool.isPending} onClick={() => pool.mutate()}>Return to the pool</Btn></div>}
        </div>
      </div>

      {edit && <EditModal d={d} onClose={() => setEdit(false)} onSaved={put} />}
      {eventing && <EventModal id={id} onClose={() => setEventing(false)} onSaved={put} />}
      {statusing && <StatusModal d={d} onClose={() => setStatusing(false)} onSaved={put} />}
      {assigning && <AssignModal d={d} onClose={() => setAssigning(false)} onSaved={refresh} />}
      <Modal open={finding} onClose={() => setFinding(false)} size="xwide" title={`Find venues for ${c.name}`}>
        {finding && <VendorSearchPanel clientId={id} clientName={c.name} shortlisted={d.shortlist.map((s) => s.businessId)} onShortlisted={refresh} />}
      </Modal>
    </>
  )
}
