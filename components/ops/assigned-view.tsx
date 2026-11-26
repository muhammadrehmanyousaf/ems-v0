"use client"

// Vendor Team (Team A) — Client Requests sent by Client Team (Team B):
// Step 1: Call the venue owner using the phone button below
// Step 2: Save availability, quoted rate, date checked, hold/token or alternate venue idea
// Step 3: Click "Send Reply to Client Team" so Iqra calls the couple back right away.
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CheckCircle2, ClipboardCheck, MessageCircle, Phone, Store } from "lucide-react"

import { AvailabilityBadge, EVENT_LABEL, STAGE_META, StageBadge, ageLabel, fmtPkr } from "@/components/ops/client-bits"
import { Btn, Card, Empty, ErrorState, Field, Input, Notice, PageHead, Seg, SkelRows, Status, Textarea, fmtDay, fmtWhen, useOpsToast } from "@/components/ops/ops-ui"
import { fmtPhone, telHref, waHref } from "@/components/ops/prospect-bits"
import { opsErrorMessage } from "@/lib/api/ops"
import { assignmentsApi, type AssignedDetail, type AssignedItem, type AssignmentStage } from "@/lib/api/ops-clients"
import { opsErrorData } from "@/lib/api/ops-onboarding"
import { vendorConfirmedClientMessage, waWebLink } from "@/lib/ops/whatsapp"

export function AssignedListView() {
  const router = useRouter()
  const [all, setAll] = useState(false)
  const q = useQuery({ queryKey: ["ops", "assignments", all], queryFn: () => assignmentsApi.mine(all) })
  const rows = q.data?.assignments ?? []
  return (
    <>
      <PageHead
        title="Client Requests"
        sub="Client Team asked you to check venue availability and final rates for these couples. Call the venue, save the answer, and send reply back."
        actions={<Btn onClick={() => setAll((a) => !a)}>{all ? "Show open only" : "Show finished requests"}</Btn>}
      />
      <Card flush>
        {q.isLoading ? <SkelRows rows={5} /> : q.isError ? <ErrorState message={opsErrorMessage(q.error)} onRetry={() => q.refetch()} /> : rows.length === 0 ? (
          <Empty icon={<ClipboardCheck />} title="No client requests right now">When Client Team asks you to check a hall date &amp; price, the request appears here.</Empty>
        ) : rows.map((a) => (
          <div key={a.id} className="list-row click" onClick={() => router.push(`/ops/assigned/${a.id}`)}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="td-name">{a.clientName}</div>
              <div className="td-sub">
                {[a.cityName, a.nextEventDate ? `Event: ${fmtDay(a.nextEventDate)}` : null, a.guests ? `${a.guests} guests` : null, a.budgetPkr ? `Budget ${fmtPkr(a.budgetPkr)}` : null].filter(Boolean).join(" · ") || "—"}
              </div>
              {a.visitAt && a.visitVenueName && (
                <div className="small" style={{ color: "var(--accent-ink)", marginTop: 2 }}>
                  Visit set: {a.visitVenueName} ({fmtWhen(a.visitAt)})
                </div>
              )}
              {a.note ? <div className="td-sub">Message from Client Team: {a.note}</div> : null}
            </div>
            <div className="nw" style={{ textAlign: "right" }}>
              {a.status === "done" ? <Status tone="ok">Replied</Status> : <StageBadge stage={a.stage} short />}
              {a.status === "open" && <div className="td-sub">{a.unchecked > 0 ? `${a.unchecked} of ${a.venues} venue to call` : "Ready to send back"}</div>}
              <div className="td-sub">{ageLabel(a.createdAt)} ago</div>
            </div>
          </div>
        ))}
      </Card>
    </>
  )
}

function ItemCard({ item, client, events, defaultDate, open, onSaved }: {
  item: AssignedItem
  client: AssignedDetail["client"]
  events: AssignedDetail["events"]
  defaultDate?: string
  open: boolean
  onSaved: (suggested: boolean) => void
}) {
  const toast = useOpsToast()
  const [result, setResult] = useState<"available" | "unavailable" | "no_answer">(item.availability === "unavailable" ? "unavailable" : item.availability === "no_answer" ? "no_answer" : "available")
  const [checkedDate, setCheckedDate] = useState(item.checkedForDate || defaultDate || "")
  const [quoted, setQuoted] = useState(item.quotedPricePkr ? String(Number(item.quotedPricePkr)) : "")
  const [perHead, setPerHead] = useState(item.perHeadPkr ? String(Number(item.perHeadPkr)) : "")
  const [token, setToken] = useState(item.tokenAmountPkr ? String(Number(item.tokenAmountPkr)) : "")
  const [holdUntil, setHoldUntil] = useState(item.holdUntil ? item.holdUntil.slice(0, 16) : "")
  const [alt, setAlt] = useState(item.altSuggestion ?? "")
  const [note, setNote] = useState(item.note ?? "")
  const [editing, setEditing] = useState(item.availability === "pending")
  const [err, setErr] = useState<{ field?: string; message: string } | null>(null)
  const digits = (item.contactPhone ?? "").replace(/\D/g, "")

  const firstPhone = client.whatsapp || client.phones[0]?.raw || null
  const primaryEv = events.find((e) => e.eventDate) || events[0]
  const clientInfoMsg = vendorConfirmedClientMessage({
    vendorName: item.businessName,
    kind: client.status === "booked" ? "booking" : client.status === "visit_scheduled" ? "visit" : "availability",
    clientName: client.name,
    clientPhone: firstPhone,
    eventType: primaryEv ? EVENT_LABEL[primaryEv.kind] : null,
    eventDate: (item.checkedForDate || defaultDate) ? fmtDay(item.checkedForDate || defaultDate!) : null,
    guests: primaryEv?.guests || client.guests,
    agreedTotalPkr: item.quotedPricePkr || quoted || null,
    perHeadPkr: item.perHeadPkr || perHead || null,
    tokenAmountPkr: item.tokenAmountPkr || token || null,
    visitAt: client.visitAt ? fmtWhen(client.visitAt) : null,
    notes: [client.requirements, client.visitNote].filter(Boolean).join(" · ") || null,
  })
  const clientInfoWaUrl = digits.length >= 10 ? waWebLink(item.contactPhone, clientInfoMsg) : null

  const save = useMutation({
    mutationFn: () =>
      assignmentsApi.check(item.id, {
        availability: result,
        checkedForDate: checkedDate || undefined,
        quotedPricePkr: result === "available" ? quoted || undefined : undefined,
        perHeadPkr: result === "available" ? perHead || undefined : undefined,
        tokenAmountPkr: result === "available" ? token || undefined : undefined,
        holdUntil: result === "available" && holdUntil ? new Date(holdUntil).toISOString() : undefined,
        altSuggestion: alt.trim() || undefined,
        note: note || undefined,
      }),
    onSuccess: (r) => { setEditing(false); setErr(null); onSaved(!!r.suggestUpdate) },
    onError: (e) => { const dd = opsErrorData<{ field?: string }>(e); setErr({ field: dd?.field, message: opsErrorMessage(e) }); toast({ title: "Could not save", body: opsErrorMessage(e), tone: "bad" }) },
  })

  return (
    <Card
      title={item.businessName}
      sub={[item.subArea, item.city, item.maxCapacity && item.maxCapacity > 1 ? `Up to ${item.maxCapacity} guests` : null, item.listedPerHeadPkr ? `Listed ${fmtPkr(item.listedPerHeadPkr)}/head` : null].filter(Boolean).join(" · ")}
      actions={
        <span className="row" style={{ gap: 6 }}>
          <Link href={`/ops/find/${item.businessId}`} className="btn btn-ghost sm">
            <Store size={13} aria-hidden />Edit Listing
          </Link>
          {item.contactPhone ? (
            <>
              <a className="btn btn-primary sm" href={`tel:${item.contactPhone.replace(/[^\d+]/g, "")}`}><Phone size={14} aria-hidden />{item.contactPhone}</a>
              {clientInfoWaUrl && (
                <a
                  className="btn btn-ghost sm"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={clientInfoWaUrl}
                  title="Open logged-in WhatsApp Web pre-filled with couple name, phone, event date & rates"
                >
                  <MessageCircle size={13} aria-hidden />Send Client Info (WA Web)
                </a>
              )}
              {digits.length >= 10 && <a className="btn btn-ghost sm" target="_blank" rel="noopener noreferrer" href={waWebLink(item.contactPhone, `Assalam o alaikum,\nFollowing up from Wedding Wala regarding ${item.businessName}.`)}>Chat</a>}
            </>
          ) : <Status tone="mut">No phone on listing</Status>}
        </span>
      }
    >
      {!editing ? (
        <div className="row between" style={{ alignItems: "flex-start" }}>
          <div className="stack" style={{ gap: 4 }}>
            <div className="row" style={{ gap: 8 }}>
              <AvailabilityBadge value={item.availability} />
              {item.checkedForDate && <span className="small">Date: <b>{fmtDay(item.checkedForDate)}</b></span>}
              {item.quotedPricePkr ? <span className="small">Package: <b>{fmtPkr(item.quotedPricePkr)}</b></span> : null}
              {item.perHeadPkr ? <span className="small">Per head: <b>{fmtPkr(item.perHeadPkr)}</b></span> : null}
              {item.tokenAmountPkr ? <span className="small">Token: {fmtPkr(item.tokenAmountPkr)}</span> : null}
            </div>
            {item.holdUntil && <div className="small muted">Date hold until: {fmtWhen(item.holdUntil)}</div>}
            {item.altSuggestion && <div className="small" style={{ color: "var(--accent-ink)" }}>Alternate suggestion: {item.altSuggestion}</div>}
            {item.note && <div className="small muted">Note: {item.note}</div>}
            {item.checkedAt && <div className="small muted">Checked {fmtWhen(item.checkedAt)}</div>}
          </div>
          {open && <Btn size="sm" onClick={() => setEditing(true)}>Edit Answer</Btn>}
        </div>
      ) : open ? (
        <div style={{ display: "grid", gap: 12 }}>
          <Seg<"available" | "unavailable" | "no_answer">
            label={`Venue reply for ${item.businessName}`}
            value={result}
            onChange={(v) => { setResult(v); setErr(null) }}
            options={[
              { value: "available", label: "Available (Free)" },
              { value: "unavailable", label: "Not Free (Booked)" },
              { value: "no_answer", label: "No Answer" },
            ]}
          />
          <div className="grid3">
            <Field label="Event Date Checked" htmlFor={`dt-${item.id}`} error={err?.field === "checkedForDate" ? err.message : null}>
              <Input id={`dt-${item.id}`} type="date" value={checkedDate} onChange={(e) => setCheckedDate(e.target.value)} />
            </Field>
            {result === "available" && (
              <>
                <Field label="Final Total Price (PKR)" htmlFor={`q-${item.id}`} error={err?.field === "quotedPricePkr" ? err.message : null}>
                  <Input id={`q-${item.id}`} inputMode="numeric" value={quoted} onChange={(e) => setQuoted(e.target.value)} placeholder="1,350,000" />
                </Field>
                <Field label="Final Per Head (PKR)" htmlFor={`p-${item.id}`} error={err?.field === "perHeadPkr" ? err.message : null}>
                  <Input id={`p-${item.id}`} inputMode="numeric" value={perHead} onChange={(e) => setPerHead(e.target.value)} placeholder="2,200" />
                </Field>
              </>
            )}
          </div>
          {result === "available" && (
            <div className="grid2">
              <Field label="Token / Advance Asked (PKR)" htmlFor={`tk-${item.id}`} error={err?.field === "tokenAmountPkr" ? err.message : null}>
                <Input id={`tk-${item.id}`} inputMode="numeric" value={token} onChange={(e) => setToken(e.target.value)} placeholder="e.g. 100,000" />
              </Field>
              <Field label="Can Hold Date Till (optional)" htmlFor={`hd-${item.id}`}>
                <Input id={`hd-${item.id}`} type="datetime-local" value={holdUntil} onChange={(e) => setHoldUntil(e.target.value)} />
              </Field>
            </div>
          )}
          <Field
            label={result === "available" ? "Other Hall / Option (optional)" : "Other Free Date or Nearby Hall Idea"}
            htmlFor={`alt-${item.id}`}
          >
            <Input
              id={`alt-${item.id}`}
              value={alt}
              maxLength={400}
              onChange={(e) => setAlt(e.target.value)}
              placeholder={result === "available" ? "e.g. Main Lawn also open for 500+ guests" : "e.g. 16 Nov is free, or try Pearl Marquee nearby"}
            />
          </Field>
          <Field label="Note for Client Team" htmlFor={`n-${item.id}`}>
            <Textarea
              id={`n-${item.id}`}
              rows={2}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={result === "available" ? "Spoke to Manager Tariq, agreed 50k discount + complimentary stage" : result === "no_answer" ? "Called twice, try after 5 PM" : "Already booked for that night"}
            />
          </Field>
          <div className="row">
            <Btn variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Save Answer</Btn>
            {item.availability !== "pending" && <Btn onClick={() => setEditing(false)}>Cancel</Btn>}
          </div>
        </div>
      ) : <AvailabilityBadge value={item.availability} />}
    </Card>
  )
}

const STAGES: AssignmentStage[] = ["new", "contacted", "confirmed", "unavailable"]

function StageCard({ id, stage, note, open }: { id: number; stage: AssignmentStage; note: string | null; open: boolean }) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  const [pick, setPick] = useState<AssignmentStage>(stage)
  const [text, setText] = useState(note ?? "")
  useEffect(() => { setPick(stage); setText(note ?? "") }, [stage, note])
  const save = useMutation({
    mutationFn: () => assignmentsApi.setStage(id, pick, text || undefined),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["ops", "assignment", id] }); qc.invalidateQueries({ queryKey: ["ops", "assignments"] }); toast({ title: r.changed ? "Update sent to Client Team" : "Already saved" }) },
    onError: (e) => toast({ title: "Could not save", body: opsErrorMessage(e), tone: "bad" }),
  })
  return (
    <Card title="Live Progress Note" sub="Optional quick status if venue asks you to wait for callback.">
      {!open ? <div className="row" style={{ gap: 8 }}><StageBadge stage={stage} />{note ? <span className="small muted">{note}</span> : null}</div> : (
        <div style={{ display: "grid", gap: 10 }}>
          <Seg<AssignmentStage> label="Progress" value={pick} onChange={setPick} options={STAGES.map((s) => ({ value: s, label: STAGE_META[s].pick }))} />
          <Field label="Quick note (optional)" htmlFor="st-note"><Input id="st-note" value={text} maxLength={300} onChange={(e) => setText(e.target.value)} placeholder="Manager will confirm after 4 PM" /></Field>
          <div><Btn size="sm" loading={save.isPending} disabled={pick === stage && text === (note ?? "")} onClick={() => save.mutate()}>Send Update</Btn></div>
        </div>
      )}
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops", "assignment", id] })
      qc.invalidateQueries({ queryKey: ["ops", "assignments"] })
      qc.invalidateQueries({ queryKey: ["ops", "home-summary"] })
      toast({ title: "Reply Sent to Client Team!", body: "Iqra / Client Desk can now call the couple back." })
    },
    onError: (e) => toast({ title: "Cannot finish yet", body: opsErrorMessage(e), tone: "bad" }),
  })
  const refresh = (suggested: boolean) => {
    qc.invalidateQueries({ queryKey: ["ops", "assignment", id] })
    toast({ title: "Answer saved", body: suggested ? "Price differed from listing — reminder created to update menu rate." : undefined })
  }

  if (q.isLoading) return <><PageHead title="Client Request" /><Card flush><SkelRows rows={6} /></Card></>
  if (q.isError || !q.data) {
    const dd = opsErrorData(q.error)
    return <ErrorState message={dd?.code === "ASSIGNMENT_NOT_FOUND" ? "Request not found or assigned to someone else." : opsErrorMessage(q.error)} onRetry={() => q.refetch()} />
  }
  const d = q.data
  const open = d.assignment.status === "open"
  const pending = d.items.filter((i) => !i.checkedAt).length
  const defaultDate = d.events.find((e) => e.eventDate)?.eventDate || undefined

  return (
    <>
      <div style={{ marginBottom: 10 }}><Link href="/ops/assigned" className="btn btn-link" style={{ paddingLeft: 0 }}><ArrowLeft aria-hidden />Client Requests</Link></div>
      <PageHead
        title={`Venue Check for ${d.client.name}`}
        sub={
          <span className="row" style={{ gap: 8 }}>
            {open ? <Status tone="info">Step 1: Call venues &amp; save answers</Status> : <Status tone="ok">Sent back to Client Team</Status>}
            <span>{[d.client.cityName, d.client.guests ? `${d.client.guests} guests` : null, d.client.budgetPkr ? fmtPkr(d.client.budgetPkr) : null].filter(Boolean).join(" · ")}</span>
          </span>
        }
      />

      {d.client.status === "visit_scheduled" && d.client.visitAt && (
        <div style={{ marginBottom: 14 }}>
          <Notice tone="info">
            <b>Site Visit Planned:</b> {d.client.name} is visiting <b>{d.client.visitVenueName || "venue"}</b> on <b>{fmtWhen(d.client.visitAt)}</b>. Please remind the venue manager.{d.client.visitNote ? ` (${d.client.visitNote})` : ""}
          </Notice>
        </div>
      )}

      <div className="cols-main">
        <div className="stack">
          {!open && <Notice tone="ok">You sent this reply to Client Team on {d.assignment.closedAt ? fmtWhen(d.assignment.closedAt) : "—"}.</Notice>}
          {d.items.length === 0 ? <Card><Empty title="No venues on list">Client Team removed them.</Empty></Card> : d.items.map((i) => <ItemCard key={i.id} item={i} client={d.client} events={d.events} defaultDate={defaultDate} open={open} onSaved={refresh} />)}
        </div>
        <div className="stack">
          {open && (
            <Card title="When All Venues Are Checked" sub="Step 3: Send your final answers back so Client Team calls the couple.">
              <div style={{ display: "grid", gap: 12 }}>
                {pending > 0 ? <p className="small muted" style={{ margin: 0 }}>{pending} venue{pending === 1 ? "" : "s"} left — click Save Answer on each card above first.</p> : <Notice tone="ok">All venues saved! Click below to notify Client Team.</Notice>}
                <Field label="Final message for Client Team (optional)" htmlFor="as-done"><Textarea id="as-done" rows={2} maxLength={1000} value={done} onChange={(e) => setDone(e.target.value)} placeholder="e.g. Royal Palace agreed Rs 13.5L, ask couple to visit before Friday" /></Field>
                <div><Btn variant="primary" icon={<CheckCircle2 aria-hidden />} loading={finish.isPending} disabled={pending > 0} onClick={() => finish.mutate()}>Send Reply to Client Team</Btn></div>
              </div>
            </Card>
          )}
          <Card title="About the Couple">
            <dl className="kv">
              <dt>Couple</dt><dd>{d.client.name}</dd>
              <dt>Phone</dt><dd>{d.client.phones.length === 0 ? "—" : d.client.phones.map((p) => (
                <span key={p.raw} className="row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                  <a className="btn btn-ghost sm" href={telHref(p)}><Phone size={14} aria-hidden />{fmtPhone(p)}</a>
                  {waHref(p) && <a className="btn btn-ghost sm" target="_blank" rel="noopener noreferrer" href={waHref(p)!}>WhatsApp</a>}
                </span>
              ))}</dd>
              <dt>Requirements</dt><dd>{d.client.requirements || "—"}</dd>
              {d.assignment.note ? <><dt>Client Team Note</dt><dd>{d.assignment.note}</dd></> : null}
            </dl>
            {d.events.length > 0 && <div style={{ marginTop: 12 }}>{d.events.map((e, i) => <div key={i} className="small" style={{ padding: "3px 0" }}><b>{EVENT_LABEL[e.kind]}</b>{e.eventDate ? ` · ${fmtDay(e.eventDate)}` : ""}{e.guests ? ` · ${e.guests} guests` : ""}</div>)}</div>}
            <p className="small muted" style={{ margin: "12px 0 0" }}>Client Team talks to the couple first; call only the venue unless needed.</p>
          </Card>
          <StageCard id={id} stage={d.assignment.stage} note={d.assignment.stageNote} open={open} />
        </div>
      </div>
    </>
  )
}
