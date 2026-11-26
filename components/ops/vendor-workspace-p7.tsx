"use client"

// Ops Portal P7 — Vendor Workspace Extras (/ops/find/[id])
// Adds Photos/Media upload, Live Bookings for this vendor, Website Inquiries, Call/WhatsApp/Note logger, and Add-to-Call-Queue action.
import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarCheck2, ExternalLink, Headphones, MessageCircle, Phone, Plus } from "lucide-react"

import { MediaManager } from "@/components/ops/media-manager"
import { useOps } from "@/components/ops/ops-shell"
import { Btn, Card, Empty, ErrorState, Field, Select, SkelRows, Status, fmtDay, fmtNum, fmtWhen, useOpsToast } from "@/components/ops/ops-ui"
import { opsErrorMessage } from "@/lib/api/ops"
import { directoryOpsApi, type VendorBookingRef, type VendorInquiryRef, type VendorLogRef } from "@/lib/api/ops-directory"
import api from "@/lib/axiosConfig"
import { vendorConfirmedClientMessage, waWebLink } from "@/lib/ops/whatsapp"

interface VendorFullP7Response {
  vendor: { id: number; name: string; city: string | null; slug: string | null; phone?: string | null; ownerName?: string | null; completenessScore?: number | null; prospectId?: number | null }
  bookings: VendorBookingRef[]
  inquiries: VendorInquiryRef[]
  vendorLogs: VendorLogRef[]
}

export function VendorWorkspaceExtras({ businessId }: { businessId: number }) {
  const { can } = useOps()
  const qc = useQueryClient()
  const toast = useOpsToast()

  const q = useQuery({
    queryKey: ["ops", "vendor", businessId],
    queryFn: async () => (await api.get(`/api/v1/ops/directory/${businessId}`)).data.data as VendorFullP7Response,
    staleTime: 15_000,
  })

  const [channel, setChannel] = useState<"call" | "whatsapp" | "note">("call")
  const [outcome, setOutcome] = useState("spoke")
  const [note, setNote] = useState("")
  const [followUp, setFollowUp] = useState("")

  const logMut = useMutation({
    mutationFn: () =>
      directoryOpsApi.logCall(businessId, {
        channel,
        outcome: channel === "note" ? null : outcome,
        note: note.trim() || null,
        nextFollowUpAt: followUp || null,
      }),
    onSuccess: () => {
      setNote("")
      setFollowUp("")
      qc.invalidateQueries({ queryKey: ["ops", "vendor", businessId] })
      toast({ title: "Activity saved" })
    },
    onError: (e) => toast({ title: "Could not save activity", body: opsErrorMessage(e), tone: "bad" }),
  })

  const queueMut = useMutation({
    mutationFn: () => directoryOpsApi.queueProspect(businessId),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["ops", "vendor", businessId] })
      qc.invalidateQueries({ queryKey: ["ops", "prospects"] })
      toast({ title: r.existed ? `Linked to Prospect #${r.id}` : `Added to Prospects Queue (#${r.id})` })
    },
    onError: (e) => toast({ title: "Could not add to queue", body: opsErrorMessage(e), tone: "bad" }),
  })

  if (q.isLoading) return <SkelRows rows={4} />
  if (q.isError || !q.data) return <ErrorState message={opsErrorMessage(q.error)} onRetry={() => q.refetch()} />

  const { vendor, bookings = [], inquiries = [], vendorLogs = [] } = q.data
  const prospectId = vendor.prospectId ?? null
  const publicUrl = vendor.slug ? `/vendors/${vendor.slug}` : null

  return (
    <div className="stack" style={{ marginTop: 18 }}>
      {/* Quick Action Bar */}
      <Card>
        <div className="row between" style={{ gap: 12 }}>
          <div>
            <div className="td-name">Vendor details &amp; follow-up</div>
            <div className="small muted">Update photos and packages, check bookings, see customer inquiries, and save vendor call notes.</div>
          </div>
          <div className="row">
            {publicUrl && (
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost sm">
                View live page <ExternalLink size={14} aria-hidden />
              </a>
            )}
            {prospectId ? (
              <Link href={`/ops/prospects/${prospectId}`} className="btn btn-ghost sm">
                <Headphones size={14} aria-hidden />Open prospect #{prospectId}
              </Link>
            ) : can("ops_prospect_call") ? (
              <Btn size="sm" variant="primary" icon={<Plus aria-hidden />} loading={queueMut.isPending} onClick={() => queueMut.mutate()}>
                Add to call queue
              </Btn>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Direct Media Manager on any Wedding Wala Vendor */}
      <MediaManager
        listingId={businessId}
        businessName={vendor.name}
        ownerName={vendor.ownerName ?? null}
        ownerPhone={vendor.phone ?? null}
        mode="directory"
        onChanged={() => qc.invalidateQueries({ queryKey: ["ops", "vendor", businessId] })}
      />

      <div className="cols-main">
        <div className="stack">
          {/* Bookings for this Vendor */}
          <Card title="Bookings for this vendor" sub={`${bookings.length} recent booking${bookings.length === 1 ? "" : "s"}`} flush>
            {bookings.length === 0 ? (
              <Empty icon={<CalendarCheck2 />} title="No bookings yet">Customer bookings and manual vendor bookings will show here automatically.</Empty>
            ) : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Booking</th>
                      <th>Event date</th>
                      <th>Status</th>
                      <th className="r">Amount</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((bk) => (
                      <tr key={bk.id}>
                        <td>
                          <Link href={`/ops/bookings/${bk.id}`} className="td-name" style={{ textDecoration: "underline" }}>
                            #{bk.id} · {bk.customerName || "Couple"}
                          </Link>
                          <div className="td-sub">{[bk.customerPhone, bk.eventType, bk.eventCity].filter(Boolean).join(" · ")}</div>
                        </td>
                        <td className="nw">{bk.bookingDate ? fmtDay(bk.bookingDate) : "TBD"}</td>
                        <td>
                          <div className="row" style={{ gap: 6 }}>
                            <Status tone={bk.status === "Confirmed" ? "ok" : bk.status === "Cancelled" ? "bad" : "info"}>{bk.status}</Status>
                            {bk.opsStage && <Status tone="acc">{bk.opsStage}</Status>}
                          </div>
                        </td>
                        <td className="r nw num">{bk.totalAmount ? `PKR ${fmtNum(Number(bk.totalAmount))}` : "—"}</td>
                        <td className="r nw">
                          <div className="row" style={{ justifyContent: "flex-end", gap: 6 }}>
                            {vendor.phone && (
                              <a
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost sm"
                                href={waWebLink(
                                  vendor.phone,
                                  vendorConfirmedClientMessage({
                                    vendorName: vendor.name,
                                    kind: "booking",
                                    bookingId: bk.id,
                                    clientName: bk.customerName || "Couple",
                                    clientPhone: bk.customerPhone,
                                    eventType: bk.eventType,
                                    eventDate: bk.bookingDate ? fmtDay(bk.bookingDate) : null,
                                    agreedTotalPkr: bk.totalAmount,
                                  }),
                                )}
                                onClick={() => {
                                  directoryOpsApi.logCall(businessId, {
                                    channel: "whatsapp",
                                    outcome: "spoke",
                                    note: `Sent Booking #${bk.id} (${bk.customerName || "Couple"}) details to vendor on WhatsApp Web`,
                                  }).then(() => qc.invalidateQueries({ queryKey: ["ops", "vendor", businessId] })).catch(() => {})
                                }}
                              >
                                <MessageCircle size={13} aria-hidden />Send Client (WA Web)
                              </a>
                            )}
                            <Link href={`/ops/bookings/${bk.id}`} className="btn btn-link sm">Coordinate</Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Inquiries / Leads */}
          <Card title="Couple inquiries & leads" sub={`${inquiries.length} recent website/direct inquiries`} flush>
            {inquiries.length === 0 ? (
              <Empty title="No inquiries yet">Inquiries submitted for this vendor appear here.</Empty>
            ) : (
              <div>
                {inquiries.map((inq) => (
                  <div key={inq.id} className="list-row" style={{ alignItems: "flex-start" }}>
                    <div className="grow">
                      <div className="row" style={{ gap: 6 }}>
                        <span className="td-name">{inq.clientName || "Couple inquiry"}</span>
                        <Status tone="info">{inq.status}</Status>
                      </div>
                      <div className="small muted">{[inq.clientPhone, inq.eventType, inq.eventDate ? fmtDay(inq.eventDate) : null].filter(Boolean).join(" · ")}</div>
                      {inq.inquiry && <div className="small" style={{ marginTop: 4 }}>{inq.inquiry}</div>}
                    </div>
                    <div className="small muted nw">{fmtWhen(inq.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Outreach Log & Logger */}
        <Card title="Vendor call &amp; message notes" sub="Save every phone call or WhatsApp follow-up with this vendor.">
          <div className="stack" style={{ gap: 12 }}>
            <div className="form-grid">
              <Field label="Channel" htmlFor={`vl-ch-${businessId}`}>
                <Select id={`vl-ch-${businessId}`} value={channel} onChange={(e) => setChannel(e.target.value as "call" | "whatsapp" | "note")}>
                  <option value="call">Phone call</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="note">Internal note</option>
                </Select>
              </Field>
              {channel !== "note" && (
                <Field label="Outcome" htmlFor={`vl-out-${businessId}`}>
                  <Select id={`vl-out-${businessId}`} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                    <option value="spoke">Spoke / Responded</option>
                    <option value="no_answer">No answer</option>
                    <option value="busy">Busy</option>
                    <option value="updated">Pricing / photos updated</option>
                    <option value="issue">Issue reported</option>
                  </Select>
                </Field>
              )}
            </div>
            <Field label="Notes" htmlFor={`vl-note-${businessId}`}>
              <textarea
                id={`vl-note-${businessId}`}
                className="txa"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What did you discuss or update with the vendor?"
              />
            </Field>
            <Field label="Next follow-up (optional)" htmlFor={`vl-fu-${businessId}`}>
              <input id={`vl-fu-${businessId}`} type="datetime-local" className="inp" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
            </Field>
            <Btn variant="primary" loading={logMut.isPending} onClick={() => logMut.mutate()}>Save log entry</Btn>

            <hr className="divider" style={{ margin: "6px 0" }} />

            {vendorLogs.length === 0 ? (
              <p className="small muted">No logged calls or notes yet.</p>
            ) : (
              <div className="stack" style={{ gap: 10 }}>
                {vendorLogs.map((l) => (
                  <div key={l.id} style={{ paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
                    <div className="row between">
                      <span className="row" style={{ gap: 6 }}>
                        {l.channel === "whatsapp" ? <MessageCircle size={13} /> : <Phone size={13} />}
                        <Status tone="info">{l.channel}</Status>
                        {l.outcome && <Status tone="mut">{l.outcome}</Status>}
                      </span>
                      <span className="small muted">{fmtWhen(l.at)}</span>
                    </div>
                    {l.note && <div className="small" style={{ marginTop: 4 }}>{l.note}</div>}
                    <div className="small muted">{l.agentName || "Ops team"}{l.nextFollowUpAt ? ` · Follow up ${fmtWhen(l.nextFollowUpAt)}` : ""}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
