"use client"

// Ops Portal P7 — Single Booking Coordination Workspace (/ops/bookings/[id])
// Read-only view of marketplace payment/status + full coordination workflow (claim, stage, priority, multi-vendor phone checks, couple call/WhatsApp logs).
import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CheckCircle2, MessageCircle, Phone, Store, UserCheck } from "lucide-react"

import { Btn, Card, Empty, ErrorState, Field, PageHead, Select, SkelRows, Status, fmtDay, fmtNum, fmtWhen, useOpsToast, type Tone } from "@/components/ops/ops-ui"
import { opsErrorMessage } from "@/lib/api/ops"
import { opsBookingsApi, type OpsBookingChannel, type OpsBookingParty, type OpsBookingPriority, type OpsBookingStage } from "@/lib/api/ops-bookings"

const STAGES: { value: OpsBookingStage; label: string }[] = [
  { value: "new", label: "Needs check" },
  { value: "vendor_contacted", label: "Vendor contacted" },
  { value: "vendor_confirmed", label: "Vendor confirmed" },
  { value: "couple_confirmed", label: "Couple confirmed" },
  { value: "ready", label: "All ready for event" },
  { value: "issue", label: "Has issue / escalation" },
  { value: "resolved", label: "Resolved / closed" },
]

const STAGE_TONE: Record<OpsBookingStage, Tone> = {
  new: "warn",
  vendor_contacted: "info",
  vendor_confirmed: "info",
  couple_confirmed: "acc",
  ready: "ok",
  issue: "bad",
  resolved: "mut",
}

export function BookingDetailView({ id }: { id: number }) {
  const qc = useQueryClient()
  const toast = useOpsToast()

  const q = useQuery({
    queryKey: ["ops", "booking", id],
    queryFn: () => opsBookingsApi.get(id),
    staleTime: 10_000,
  })

  const [targetParty, setTargetParty] = useState<OpsBookingParty>("vendor")
  const [channel, setChannel] = useState<OpsBookingChannel>("call")
  const [outcome, setOutcome] = useState("confirmed")
  const [note, setNote] = useState("")
  const [followUp, setFollowUp] = useState("")

  const [editNotes, setEditNotes] = useState<string | null>(null)
  const [editStage, setEditStage] = useState<OpsBookingStage | "">("")
  const [editPriority, setEditPriority] = useState<OpsBookingPriority | "">("")

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["ops", "booking", id] })
    qc.invalidateQueries({ queryKey: ["ops", "bookings"] })
    qc.invalidateQueries({ queryKey: ["ops", "home-summary"] })
  }

  const claimMut = useMutation({
    mutationFn: () => opsBookingsApi.claim(id),
    onSuccess: () => { refresh(); toast({ title: "You took ownership of this booking" }) },
    onError: (e) => toast({ title: "Could not claim", body: opsErrorMessage(e), tone: "bad" }),
  })

  const stageMut = useMutation({
    mutationFn: () => {
      const d = q.data!
      return opsBookingsApi.updateStage(id, {
        opsStage: (editStage || d.ops.opsStage) as OpsBookingStage,
        priority: (editPriority || d.ops.priority) as OpsBookingPriority,
        notes: editNotes !== null ? editNotes : d.ops.notes,
      })
    },
    onSuccess: () => {
      setEditNotes(null)
      refresh()
      toast({ title: "Coordination details saved" })
    },
    onError: (e) => toast({ title: "Could not save stage", body: opsErrorMessage(e), tone: "bad" }),
  })

  const logMut = useMutation({
    mutationFn: () =>
      opsBookingsApi.logContact(id, {
        targetParty,
        channel,
        outcome: channel === "note" ? null : outcome,
        note: note.trim() || null,
        nextFollowUpAt: followUp || null,
      }),
    onSuccess: () => {
      setNote("")
      setFollowUp("")
      refresh()
      toast({ title: "Contact log added" })
    },
    onError: (e) => toast({ title: "Could not save log", body: opsErrorMessage(e), tone: "bad" }),
  })

  if (q.isLoading) return <SkelRows rows={8} />
  if (q.isError || !q.data) return <ErrorState message={opsErrorMessage(q.error)} onRetry={() => q.refetch()} />

  const { booking: bk, ops, vendors, logs, statusHistory } = q.data
  const curStage = (editStage || ops.opsStage) as OpsBookingStage
  const curPriority = (editPriority || ops.priority) as OpsBookingPriority
  const curNotes = editNotes !== null ? editNotes : (ops.notes || "")
  const phoneClean = (bk.customerPhone || "").replace(/[^\d+]/g, "")
  const waNum = phoneClean.startsWith("03") ? `92${phoneClean.slice(1)}` : phoneClean.replace(/^\+/, "")

  return (
    <>
      <PageHead
        title={`Booking #${bk.id} · ${bk.customerName || "Couple"}`}
        sub={[bk.bookingDate ? fmtDay(bk.bookingDate) : "Date TBD", bk.bookingTime, bk.eventType, bk.eventCity].filter(Boolean).join(" · ")}
        actions={
          <div className="row">
            <Link href="/ops/bookings" className="btn btn-ghost sm"><ArrowLeft size={14} aria-hidden />All bookings</Link>
            {ops.clientId && <Link href={`/ops/clients/${ops.clientId}`} className="btn btn-ghost sm">Couple profile</Link>}
            <Btn size="sm" variant="primary" icon={<UserCheck aria-hidden />} loading={claimMut.isPending} onClick={() => claimMut.mutate()}>
              {ops.ownerName ? `Handler: ${ops.ownerName}` : "Take ownership"}
            </Btn>
          </div>
        }
      />

      <div className="cols-main">
        <div className="stack">
          {/* Couple & Event Summary */}
          <Card
            title="Couple &amp; event summary"
            actions={
              <div className="row" style={{ gap: 6 }}>
                <Status tone={bk.status === "Confirmed" ? "ok" : bk.status === "Cancelled" ? "bad" : "info"}>{bk.status}</Status>
                <Status tone="mut">{bk.paymentStatus}</Status>
                <Status tone={STAGE_TONE[ops.opsStage]}>{STAGES.find((s) => s.value === ops.opsStage)?.label ?? ops.opsStage}</Status>
              </div>
            }
          >
            <dl className="kv">
              <dt>Couple</dt>
              <dd>{bk.customerName || "—"}</dd>
              <dt>Phone</dt>
              <dd className="row" style={{ gap: 8 }}>
                <span>{bk.customerPhone || "—"}</span>
                {phoneClean && <a href={`tel:${phoneClean}`} className="btn btn-ghost sm"><Phone size={13} aria-hidden />Call</a>}
                {waNum && <a href={`https://wa.me/${waNum}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost sm"><MessageCircle size={13} aria-hidden />WhatsApp</a>}
              </dd>
              <dt>Email</dt>
              <dd>{bk.customerEmail || "—"}</dd>
              <dt>Event date &amp; slot</dt>
              <dd>{[bk.bookingDate ? fmtDay(bk.bookingDate) : "TBD", bk.bookingTime].filter(Boolean).join(" · ")}</dd>
              <dt>City &amp; guests</dt>
              <dd>{[bk.eventCity || "—", bk.guestCount ? `${bk.guestCount} guests` : null].filter(Boolean).join(" · ")}</dd>
              <dt>Financials (read-only)</dt>
              <dd className="num">
                Total: {bk.totalAmount ? `PKR ${fmtNum(Number(bk.totalAmount))}` : "—"} · Paid: {bk.downPayment ? `PKR ${fmtNum(Number(bk.downPayment))}` : "PKR 0"}
                {bk.advanceDuePkr ? ` · Advance due: PKR ${fmtNum(Number(bk.advanceDuePkr))}` : ""}
              </dd>
              {bk.additionalRequests && (
                <>
                  <dt>Special requests</dt>
                  <dd>{bk.additionalRequests}</dd>
                </>
              )}
            </dl>
          </Card>

          {/* Linked Vendors in this Booking */}
          <Card title={`Vendors on this booking (${vendors.length})`} sub="Call each vendor to confirm hall, staff, package and timing." flush>
            {vendors.length === 0 ? (
              <Empty icon={<Store />} title="No linked business lines">This booking has no Business lines attached in BookingDetails.</Empty>
            ) : (
              <div>
                {vendors.map((v) => {
                  const vp = (v.phone || "").replace(/[^\d+]/g, "")
                  return (
                    <div key={v.businessId} className="list-row" style={{ alignItems: "flex-start" }}>
                      <div className="grow">
                        <div className="row" style={{ gap: 8 }}>
                          <Link href={`/ops/find/${v.businessId}`} className="td-name" style={{ textDecoration: "underline" }}>{v.name}</Link>
                          {v.vendorType && <Status tone="mut">{v.vendorType}</Status>}
                        </div>
                        <div className="small muted" style={{ marginTop: 2 }}>
                          {[v.city, v.subArea, v.ownerName, v.phone].filter(Boolean).join(" · ")}
                        </div>
                        {(v.packageName || v.menuTitle || v.lineTotal) && (
                          <div className="small" style={{ marginTop: 4 }}>
                            {[v.packageName ? `Pkg: ${v.packageName}` : null, v.menuTitle ? `Menu: ${v.menuTitle}` : null, v.lineTotal ? `PKR ${fmtNum(Number(v.lineTotal))}` : null].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </div>
                      <div className="row" style={{ gap: 6 }}>
                        {vp && <a href={`tel:${vp}`} className="btn btn-ghost sm"><Phone size={13} aria-hidden />Call</a>}
                        <Link href={`/ops/find/${v.businessId}`} className="btn btn-ghost sm">Workspace</Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Contact & Coordination Timeline */}
          <Card title="Coordination timeline" sub="Every vendor call, couple call & internal handoff note." flush>
            {logs.length === 0 ? (
              <Empty title="No calls logged yet">Use the contact logger on the right to record your vendor or couple confirmation call.</Empty>
            ) : (
              <div>
                {logs.map((l) => (
                  <div key={l.id} className="list-row" style={{ alignItems: "flex-start" }}>
                    <div style={{ width: 92, flex: "none" }}>
                      <Status tone={l.targetParty === "vendor" ? "acc" : l.targetParty === "couple" ? "info" : "mut"}>
                        {l.targetParty}
                      </Status>
                    </div>
                    <div className="grow">
                      <div className="row" style={{ gap: 6 }}>
                        <strong className="small">{l.channel}</strong>
                        {l.outcome && <Status tone={l.outcome === "confirmed" ? "ok" : l.outcome === "issue" ? "bad" : "mut"}>{l.outcome}</Status>}
                      </div>
                      {l.note && <div className="small" style={{ marginTop: 3 }}>{l.note}</div>}
                      <div className="small muted" style={{ marginTop: 2 }}>
                        {fmtWhen(l.at)}{l.agentName ? ` · ${l.agentName}` : ""}{l.nextFollowUpAt ? ` · Next follow-up ${fmtWhen(l.nextFollowUpAt)}` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Rail: Coordination Stage + Contact Logger */}
        <div className="stack">
          <Card title="Ops stage &amp; priority">
            <div className="stack" style={{ gap: 12 }}>
              <Field label="Coordination stage" htmlFor="bk-stage">
                <Select id="bk-stage" value={curStage} onChange={(e) => setEditStage(e.target.value as OpsBookingStage)}>
                  {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
              </Field>
              <Field label="Priority" htmlFor="bk-prio">
                <Select id="bk-prio" value={curPriority} onChange={(e) => setEditPriority(e.target.value as OpsBookingPriority)}>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent (SLA priority)</option>
                </Select>
              </Field>
              <Field label="Internal handover notes" htmlFor="bk-notes">
                <textarea
                  id="bk-notes"
                  className="txa"
                  value={curNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Parking details, setup timing, kitchen instructions…"
                />
              </Field>
              <div className="small muted">
                <div>Vendor confirmed: {ops.vendorConfirmedAt ? fmtWhen(ops.vendorConfirmedAt) : "Not yet"}</div>
                <div>Couple confirmed: {ops.coupleConfirmedAt ? fmtWhen(ops.coupleConfirmedAt) : "Not yet"}</div>
              </div>
              <Btn variant="primary" icon={<CheckCircle2 aria-hidden />} loading={stageMut.isPending} onClick={() => stageMut.mutate()}>
                Save stage &amp; notes
              </Btn>
            </div>
          </Card>

          <Card title="Log vendor / couple call">
            <div className="stack" style={{ gap: 12 }}>
              <div className="form-grid">
                <Field label="Who did you contact?" htmlFor="bk-party">
                  <Select id="bk-party" value={targetParty} onChange={(e) => setTargetParty(e.target.value as OpsBookingParty)}>
                    <option value="vendor">Vendor</option>
                    <option value="couple">Couple</option>
                    <option value="internal">Internal</option>
                  </Select>
                </Field>
                <Field label="Channel" htmlFor="bk-ch">
                  <Select id="bk-ch" value={channel} onChange={(e) => setChannel(e.target.value as OpsBookingChannel)}>
                    <option value="call">Phone call</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="note">Note only</option>
                  </Select>
                </Field>
              </div>
              {channel !== "note" && (
                <Field label="Outcome" htmlFor="bk-out">
                  <Select id="bk-out" value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                    <option value="confirmed">Confirmed ready</option>
                    <option value="spoke">Spoke — follow up needed</option>
                    <option value="no_answer">No answer / busy</option>
                    <option value="issue">Issue / conflict</option>
                  </Select>
                </Field>
              )}
              <Field label="Summary note" htmlFor="bk-lognote">
                <textarea id="bk-lognote" className="txa" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Hall manager confirmed timing & decor…" />
              </Field>
              <Field label="Follow-up reminder (optional)" htmlFor="bk-fu">
                <input id="bk-fu" type="datetime-local" className="inp" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
              </Field>
              <Btn variant="primary" loading={logMut.isPending} onClick={() => logMut.mutate()}>
                Log contact
              </Btn>
            </div>
          </Card>

          {statusHistory.length > 0 && (
            <Card title="Marketplace status history">
              {statusHistory.map((h) => (
                <div key={h.id} style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                  <div className="small strong">{h.fromStatus || "New"} → {h.toStatus}</div>
                  {h.note && <div className="small muted">{h.note}</div>}
                  <div className="small muted">{fmtWhen(h.createdAt)}</div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
