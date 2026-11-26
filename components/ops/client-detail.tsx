"use client"

// One couple file: call them, search/view venue packages, shortlist venues, send to Vendor Team,
// read Team A's availability reply, schedule a hall visit, and create the wedding booking.
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CalendarCheck, CalendarPlus, CheckCircle2, Copy, Eye, MapPin, MessageCircle, Pencil, Phone, Search, Send, Trash2, UserCheck } from "lucide-react"

import { AvailabilityBadge, CLIENT_STATUS, CLOSED, ClientStatusBadge, EVENT_LABEL, JOURNEY_STEPS, ResponseBadge, SOURCE_LABEL, StageBadge, fmtPkr, journeyStepIndex } from "@/components/ops/client-bits"
import { useOps } from "@/components/ops/ops-shell"
import { Btn, Card, Empty, ErrorState, Field, IconBtn, Input, Modal, Notice, PageHead, Seg, Select, SkelRows, Status, Textarea, fmtDay, fmtWhen, useOpsToast } from "@/components/ops/ops-ui"
import { fmtPhone, telHref, waHref } from "@/components/ops/prospect-bits"
import { VendorBriefModal } from "@/components/ops/vendor-brief-modal"
import { VendorSearchPanel } from "@/components/ops/vendor-search"
import { opsApi, opsErrorMessage } from "@/lib/api/ops"
import { clientsApi, shortlistApi, type ClientDetail, type ClientEventKind, type ClientStatus, type ContactKind } from "@/lib/api/ops-clients"
import { opsErrorData } from "@/lib/api/ops-onboarding"
import { checkedResultsMessage, shortlistMessage } from "@/lib/ops/whatsapp"
import { SITE_URL } from "@/lib/seo/constants"
import { vendorLeafHref } from "@/lib/seo/vendor-href"

const TIMELINE_ICON: Record<string, string> = { call: "Call", whatsapp: "WhatsApp", note: "Note", status: "Step", assignment: "Vendor Team", shortlist: "Venue List", inquiry: "Website", system: "Update" }

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
    <Modal open onClose={onClose} title="Edit Couple Details" footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={save.isPending} disabled={!f.name.trim()} onClick={() => save.mutate()}>Save</Btn></>}>
      <div style={{ display: "grid", gap: 14 }}>
        {err && !err.field ? <Notice tone="bad">{err.message}</Notice> : null}
        <div className="grid2">
          <Field label="Name" htmlFor="ce-name" required error={err?.field === "name" ? err.message : null}><Input id="ce-name" value={f.name} onChange={set("name")} /></Field>
          <Field label="Email" htmlFor="ce-mail" error={err?.field === "email" ? err.message : null}><Input id="ce-mail" type="email" value={f.email} onChange={set("email")} /></Field>
        </div>
        <div className="grid3">
          <Field label="City" htmlFor="ce-city"><Select id="ce-city" value={f.cityId} onChange={set("cityId")}><option value="">Any city</option>{(cities.data?.cities ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field>
          <Field label="Guests" htmlFor="ce-guests" error={err?.field === "guests" ? err.message : null}><Input id="ce-guests" inputMode="numeric" value={f.guests} onChange={set("guests")} /></Field>
          <Field label="Budget (PKR)" htmlFor="ce-bud" error={err?.field === "budgetPkr" ? err.message : null}><Input id="ce-bud" inputMode="numeric" value={f.budget} onChange={set("budget")} /></Field>
        </div>
        <Field label="Second Phone / WhatsApp" htmlFor="ce-ph" hint="Another family member's number for the same wedding." error={err?.field === "addPhone" ? err.message : null}><Input id="ce-ph" type="tel" value={f.addPhone} onChange={set("addPhone")} placeholder="0300 1234567" /></Field>
        <Field label="What they want" htmlFor="ce-req"><Textarea id="ce-req" rows={3} maxLength={4000} value={f.requirements} onChange={set("requirements")} /></Field>
        <Field label="Private Desk Notes" htmlFor="ce-notes"><Textarea id="ce-notes" rows={3} maxLength={4000} value={f.notes} onChange={set("notes")} /></Field>
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
    <Modal open onClose={onClose} title="Add Wedding Function" description="Add Mehndi, Barat, or Walima date so Vendor Team knows which date to check." footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={save.isPending} onClick={() => save.mutate()}>Add Function</Btn></>}>
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
  const options: ClientStatus[] = closed ? ["contacted", "shortlisting"] : ["contacted", "shortlisting", "vendor_replied", "booked", "lost", "closed"]
  const [status, setStatus] = useState<ClientStatus>(options[0])
  const [reason, setReason] = useState("")
  const need = closed || status === "lost" || status === "closed"
  const save = useMutation({ mutationFn: () => clientsApi.setStatus(d.client.id, status, reason || undefined), onSuccess: (x) => { onSaved(x); onClose() } })
  return (
    <Modal open onClose={onClose} title={closed ? "Reopen Client" : "Change Client Status"} description={status === "booked" ? "Couple confirmed a venue." : undefined}
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant={status === "lost" || status === "closed" ? "danger" : "primary"} loading={save.isPending} disabled={need && !reason.trim()} onClick={() => save.mutate()}>Save Status</Btn></>}>
      <div style={{ display: "grid", gap: 14 }}>
        {save.isError ? <Notice tone="bad">{opsErrorMessage(save.error)}</Notice> : null}
        <Field label="New Status" htmlFor="st-s"><Select id="st-s" value={status} onChange={(e) => setStatus(e.target.value as ClientStatus)}>{options.map((s) => <option key={s} value={s}>{CLIENT_STATUS[s].label}</option>)}</Select></Field>
        {need ? <Field label="Reason" htmlFor="st-r" required><Input id="st-r" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={closed ? "Client called back" : "Too expensive / Booked elsewhere"} /></Field> : null}
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
    onSuccess: (r) => { toast({ title: `Sent to ${r.assigneeName} (Vendor Team)`, body: `${r.venues} venue${r.venues === 1 ? "" : "s"} to check by phone.` }); onSaved(); onClose() },
  })
  return (
    <Modal open onClose={onClose} title={open ? "Send to Another Vendor Team Member" : "Ask Vendor Team to Check Availability"}
      description={`${d.shortlist.length} venue${d.shortlist.length === 1 ? "" : "s"} on the list. Pick who on Vendor Team will call the hall manager for date & final rate.`}
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" icon={<Send aria-hidden />} loading={save.isPending} disabled={!chosen || (!!open && !reason.trim())} onClick={() => save.mutate()}>{open ? "Send Again" : "Send to Vendor Team"}</Btn></>}>
      <div style={{ display: "grid", gap: 14 }}>
        {save.isError ? <Notice tone="bad">{opsErrorMessage(save.error)}</Notice> : null}
        {d.events.length === 0 && (
          <Notice tone="warn">No wedding date added yet! Adding a date in <b>Wedding Functions</b> helps Vendor Team check exact hall availability faster.</Notice>
        )}
        {q.isLoading ? <SkelRows rows={3} /> : q.data?.nobody ? <Notice tone="warn">No Vendor Team member is online in Settings right now. Ask your manager.</Notice> : (
          <>
            {q.data?.noCityMatch ? <Notice tone="warn">Nobody specifically set for {d.client.cityName ?? "this city"} — showing all Vendor Team staff (lightest workload first).</Notice> : null}
            <div role="radiogroup" aria-label="Vendor Team person" style={{ display: "grid", gap: 8 }}>
              {list.map((s) => (
                <label key={s.userId} className="list-row" style={{ border: "1px solid var(--border)", borderRadius: 10, cursor: "pointer", background: chosen === s.userId ? "var(--accent-wash)" : undefined }}>
                  <input type="radio" name="assignee" checked={chosen === s.userId} onChange={() => setPick(s.userId)} />
                  <div style={{ flex: 1 }}><div className="td-name">{s.fullName}</div><div className="td-sub">{s.teamName}</div></div>
                  <span className="row" style={{ gap: 6 }}>{s.cityMatch ? <Status tone="ok">Covers city</Status> : <Status tone="mut">Other city</Status>}<Status tone={s.openCount > 3 ? "warn" : "mut"}>{s.openCount} active</Status></span>
                </label>
              ))}
            </div>
          </>
        )}
        {open ? <Field label="Why changing person?" htmlFor="as-r" required><Input id="as-r" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="On leave" /></Field> : null}
        <Field label="Message for Vendor Team (what to ask)" htmlFor="as-n"><Textarea id="as-n" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Confirm 15 Nov Barat rate for 400 guests, ask if discount possible" /></Field>
      </div>
    </Modal>
  )
}

function VisitModal({ d, onClose, onSaved }: { d: ClientDetail; onClose: () => void; onSaved: (x: ClientDetail) => void }) {
  const toast = useOpsToast()
  const availFirst = d.shortlist.filter((s) => s.availability === "available")
  const list = availFirst.length ? availFirst : d.shortlist
  const [bid, setBid] = useState(String(d.client.visitBusinessId || list[0]?.businessId || ""))
  const [when, setWhen] = useState("")
  const [note, setNote] = useState(d.client.visitNote || "")
  const save = useMutation({
    mutationFn: () => clientsApi.scheduleVisit(d.client.id, { businessId: Number(bid), visitAt: new Date(when).toISOString(), visitNote: note.trim() || undefined }),
    onSuccess: (x) => { toast({ title: "Site visit planned", body: "Vendor Team was also notified to tell the hall manager." }); onSaved(x); onClose() },
    onError: (e) => toast({ title: "Could not save visit", body: opsErrorMessage(e), tone: "bad" }),
  })
  return (
    <Modal open onClose={onClose} title="Plan Hall Visit / Tasting" description="Pick the venue, date & time. Vendor Team will remind the hall manager."
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" disabled={!bid || !when} loading={save.isPending} onClick={() => save.mutate()}>Save Site Visit</Btn></>}>
      <div style={{ display: "grid", gap: 14 }}>
        <Field label="Which Venue?" htmlFor="vs-biz" required>
          <Select id="vs-biz" value={bid} onChange={(e) => setBid(e.target.value)}>
            <option value="">Choose venue...</option>
            {d.shortlist.map((s) => (
              <option key={s.businessId} value={s.businessId}>
                {s.businessName}{s.availability === "available" ? " (Available)" : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Visit Date & Time" htmlFor="vs-at" required>
          <Input id="vs-at" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </Field>
        <Field label="Who is going & visit note" htmlFor="vs-note">
          <Textarea id="vs-note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Couple + parents at 5:30 PM, meet Manager Tariq for food tasting" />
        </Field>
      </div>
    </Modal>
  )
}

function BookModal({ d, onClose, onSaved }: { d: ClientDetail; onClose: () => void; onSaved: (x: ClientDetail, bookingId: number) => void }) {
  const toast = useOpsToast()
  const availFirst = d.shortlist.filter((s) => s.availability === "available")
  const defaultItem = availFirst[0] ?? d.shortlist[0]
  const [mode, setMode] = useState<"create" | "link">("create")
  const [existingId, setExistingId] = useState("")
  const [bid, setBid] = useState(String(defaultItem?.businessId || d.client.visitBusinessId || ""))
  const [date, setDate] = useState(d.events[0]?.eventDate || defaultItem?.checkedForDate || "")
  const [slot, setSlot] = useState("Evening (6 PM - 11 PM)")
  const [evType, setEvType] = useState(d.events[0]?.kind ? (EVENT_LABEL[d.events[0].kind] || "Barat") : "Barat")
  const [guests, setGuests] = useState(String(d.client.guests || ""))
  const [total, setTotal] = useState(defaultItem?.quotedPricePkr ? String(Number(defaultItem.quotedPricePkr)) : "")
  const [adv, setAdv] = useState(defaultItem?.tokenAmountPkr ? String(Number(defaultItem.tokenAmountPkr)) : "")
  const [notes, setNotes] = useState("")

  const save = useMutation({
    mutationFn: () =>
      mode === "link"
        ? clientsApi.bookClient(d.client.id, { existingBookingId: Number(existingId) })
        : clientsApi.bookClient(d.client.id, {
            businessId: Number(bid),
            bookingDate: date,
            bookingTime: slot,
            eventType: evType,
            guestCount: guests || undefined,
            totalAmount: total || undefined,
            advanceDuePkr: adv || undefined,
            notes: notes.trim() || undefined,
          }),
    onSuccess: (r) => {
      toast({ title: `Booked! (Booking #${r.bookingId})`, body: "Added to the Bookings Desk for wedding follow-up." })
      onSaved(r.detail, r.bookingId)
      onClose()
    },
    onError: (e) => toast({ title: "Could not save booking", body: opsErrorMessage(e), tone: "bad" }),
  })

  return (
    <Modal open onClose={onClose} size="wide" title="Confirm Venue Booking"
      description="Create a booking record for the Bookings Desk so both teams coordinate advance, hall readiness & couple arrival. (No money is charged here.)"
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn
            variant="primary"
            disabled={mode === "link" ? !Number(existingId) : !bid || !date}
            loading={save.isPending}
            onClick={() => save.mutate()}
          >
            {mode === "link" ? "Link Booking #" : "Create Booking & Mark Booked"}
          </Btn>
        </>
      }>
      <div style={{ display: "grid", gap: 14 }}>
        <Seg<"create" | "link">
          label="Booking method"
          value={mode}
          onChange={setMode}
          options={[{ value: "create", label: "Create new wedding booking" }, { value: "link", label: "Already booked on website (enter Booking #)" }]}
        />
        {mode === "link" ? (
          <Field label="Website Booking ID #" htmlFor="bk-ex" required hint="Enter the numeric booking ID from the Bookings screen.">
            <Input id="bk-ex" inputMode="numeric" value={existingId} onChange={(e) => setExistingId(e.target.value)} placeholder="e.g. 125" />
          </Field>
        ) : (
          <>
            <Field label="Confirmed Venue / Vendor" htmlFor="bk-bid" required>
              <Select id="bk-bid" value={bid} onChange={(e) => setBid(e.target.value)}>
                <option value="">Choose venue...</option>
                {d.shortlist.map((s) => (
                  <option key={s.businessId} value={s.businessId}>
                    {s.businessName}{s.availability === "available" ? " (Confirmed Free)" : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid3">
              <Field label="Event Date" htmlFor="bk-date" required><Input id="bk-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
              <Field label="Time Slot" htmlFor="bk-slot">
                <Select id="bk-slot" value={slot} onChange={(e) => setSlot(e.target.value)}>
                  <option value="Evening (6 PM - 11 PM)">Evening / Dinner</option>
                  <option value="Afternoon (12 PM - 5 PM)">Afternoon / Lunch</option>
                </Select>
              </Field>
              <Field label="Function" htmlFor="bk-ev">
                <Input id="bk-ev" value={evType} onChange={(e) => setEvType(e.target.value)} placeholder="Barat" />
              </Field>
            </div>
            <div className="grid3">
              <Field label="Guests" htmlFor="bk-g"><Input id="bk-g" inputMode="numeric" value={guests} onChange={(e) => setGuests(e.target.value)} /></Field>
              <Field label="Agreed Total (PKR)" htmlFor="bk-tot"><Input id="bk-tot" inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="1350000" /></Field>
              <Field label="Advance / Token Needed (PKR)" htmlFor="bk-adv"><Input id="bk-adv" inputMode="numeric" value={adv} onChange={(e) => setAdv(e.target.value)} placeholder="100000" /></Field>
            </div>
            <Field label="Arrangement Notes" htmlFor="bk-notes">
              <Textarea id="bk-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Confirmed Main Hall, Valet included, menu tasting done..." />
            </Field>
          </>
        )}
      </div>
    </Modal>
  )
}

/* ------------------------------------- screen ------------------------------------- */

export function ClientDetailView({ id }: { id: number }) {
  const router = useRouter()
  const qc = useQueryClient()
  const toast = useOpsToast()
  const { can } = useOps()
  const q = useQuery({ queryKey: ["ops", "client", id], queryFn: () => clientsApi.get(id), staleTime: 0, refetchOnWindowFocus: false })
  const [edit, setEdit] = useState(false)
  const [eventing, setEventing] = useState(false)
  const [statusing, setStatusing] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [visiting, setVisiting] = useState(false)
  const [booking, setBooking] = useState(false)
  const [finding, setFinding] = useState(false)
  const [briefId, setBriefId] = useState<number | null>(null)
  const [kind, setKind] = useState<ContactKind>("call")
  const [text, setText] = useState("")

  const put = (x: ClientDetail) => { qc.setQueryData(["ops", "client", id], x); qc.invalidateQueries({ queryKey: ["ops", "clients"] }); qc.invalidateQueries({ queryKey: ["ops", "home-summary"] }) }
  const refresh = () => { qc.invalidateQueries({ queryKey: ["ops", "client", id] }); qc.invalidateQueries({ queryKey: ["ops", "clients"] }); qc.invalidateQueries({ queryKey: ["ops", "home-summary"] }) }
  const log = useMutation({ mutationFn: () => clientsApi.contact(id, kind, text || undefined), onSuccess: (x) => { put(x); setText(""); toast({ title: kind === "note" ? "Note saved" : "Call saved", body: kind === "note" ? undefined : "Couple marked as contacted." }) }, onError: (e) => toast({ title: "Could not save", body: opsErrorMessage(e), tone: "bad" }) })
  const claim = useMutation({ mutationFn: () => clientsApi.claim(id), onSuccess: (x) => { put(x); toast({ title: "This couple is now assigned to you" }) }, onError: (e) => toast({ title: "Could not claim", body: opsErrorMessage(e), tone: "bad" }) })
  const pool = useMutation({ mutationFn: () => clientsApi.setOwner(id, null, "Returned to pool"), onSuccess: put, onError: (e) => toast({ title: "Could not change", body: opsErrorMessage(e), tone: "bad" }) })
  const unlist = useMutation({ mutationFn: (itemId: number) => shortlistApi.remove(id, itemId), onSuccess: refresh, onError: (e) => toast({ title: "Could not remove", body: opsErrorMessage(e), tone: "bad" }) })
  const rmEvent = useMutation({ mutationFn: (eventId: number) => clientsApi.removeEvent(id, eventId), onSuccess: put })

  if (q.isLoading) return <><PageHead title="Couple File" /><Card flush><SkelRows rows={8} /></Card></>
  if (q.isError || !q.data) {
    const dd = opsErrorData(q.error)
    return <ErrorState message={dd?.code === "CLIENT_NOT_FOUND" ? "Couple file not found or belongs to another teammate." : opsErrorMessage(q.error)} onRetry={() => q.refetch()} />
  }
  const d = q.data
  const c = d.client
  const closed = CLOSED.has(c.status)
  const openAssign = d.assignments.find((a) => a.status === "open")
  const canManage = can("ops_client_manage")
  const lead = can("ops_prospect_reassign")
  const stepIdx = journeyStepIndex(c.status)
  const hasAnyChecked = d.shortlist.some((s) => s.availability !== "pending")

  const sendWhatsAppQuote = async () => {
    const msg = hasAnyChecked
      ? checkedResultsMessage({
          clientName: c.name,
          origin: SITE_URL,
          items: d.shortlist.map((s) => ({
            name: s.businessName,
            availability: s.availability,
            checkedForDate: s.checkedForDate,
            quotedPricePkr: s.quotedPricePkr,
            perHeadPkr: s.perHeadPkr,
            tokenAmountPkr: s.tokenAmountPkr,
            altSuggestion: s.altSuggestion,
            note: s.note,
            link: vendorLeafHref({ id: s.businessId, name: s.businessName, city: s.city, vendorType: s.vendorType }),
          })),
        })
      : shortlistMessage({
          clientName: c.name,
          venues: d.shortlist.map((s) => ({ id: s.businessId, name: s.businessName, city: s.city, vendorType: s.vendorType, maxCapacity: s.maxCapacity, perHeadFromPkr: s.perHeadPkr ?? s.listedPerHeadPkr })),
          origin: SITE_URL,
          href: (v) => vendorLeafHref({ id: v.id, name: v.name, city: v.city, vendorType: v.vendorType }),
        })
    const phone = c.phones[0]
    const wa = phone ? waHref(phone, msg) : null
    try { await navigator.clipboard.writeText(msg) } catch { /* copied via link */ }
    if (wa) window.open(wa, "_blank", "noopener,noreferrer")
    else toast({ title: "Quote message copied", body: "Paste it to the couple on WhatsApp." })
  }

  const nextGuide = (() => {
    if (c.status === "new") return { tone: "warn" as const, text: "Step 1: Call or WhatsApp the couple below and save what hall, date & budget they want." }
    if (c.status === "contacted") return { tone: "info" as const, text: "Step 2: Click Add Venues below to pick Royal Palace / halls they want, then send to Vendor Team." }
    if (c.status === "shortlisting") return { tone: "info" as const, text: "Step 3: Click Ask Vendor Team so Rubab confirms the date & final price with each venue." }
    if (c.status === "assigned") return { tone: "info" as const, text: `Step 4: Waiting for ${openAssign?.assigneeName || "Vendor Team"} to call the venue(s) and reply back.` }
    if (c.status === "vendor_replied") return { tone: "ok" as const, text: "Step 5: Vendor Team replied! Call the couple now, share available rates below, then click Plan Hall Visit or Confirm Booking." }
    if (c.status === "visit_scheduled") return { tone: "info" as const, text: `Step 6: Visit planned${c.visitVenueName ? ` at ${c.visitVenueName}` : ""}${c.visitAt ? ` on ${fmtWhen(c.visitAt)}` : ""}. Remind couple before the visit, then click Confirm Booking if they say yes!` }
    if (c.status === "booked") return { tone: "ok" as const, text: "Step 7: Booked! Open the booking link in the right panel to follow up until the wedding day." }
    return null
  })()

  return (
    <>
      <div style={{ marginBottom: 10 }}><Link href="/ops/clients" className="btn btn-link" style={{ paddingLeft: 0 }}><ArrowLeft aria-hidden />All Clients</Link></div>
      <PageHead
        title={c.name}
        sub={<span className="row" style={{ gap: 8 }}><ClientStatusBadge status={c.status} /><ResponseBadge row={c} />{c.ownerName ? <span>· Owner: {c.ownerName}</span> : <Status tone="acc">No owner yet</Status>}</span>}
        actions={<>
          {!c.ownerUserId && canManage && !closed && <Btn variant="primary" icon={<UserCheck aria-hidden />} loading={claim.isPending} onClick={() => claim.mutate()}>Take Client</Btn>}
          {canManage && !closed && d.shortlist.length > 0 && (
            <>
              <Btn icon={<MapPin aria-hidden />} onClick={() => setVisiting(true)}>Plan Visit</Btn>
              <Btn variant="primary" icon={<CalendarCheck aria-hidden />} onClick={() => setBooking(true)}>Confirm Booking</Btn>
            </>
          )}
          {canManage && <Btn icon={<Pencil aria-hidden />} onClick={() => setEdit(true)}>Edit</Btn>}
          {canManage && <Btn onClick={() => setStatusing(true)}>{closed ? "Reopen" : "Change Status"}</Btn>}
        </>}
      />

      {/* Visual Step Progress Bar */}
      {!["lost", "closed"].includes(c.status) && (
        <div className="card" style={{ padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 6 }}>
            {JOURNEY_STEPS.map((st, idx) => {
              const done = idx < stepIdx || (c.status === "booked" && idx === JOURNEY_STEPS.length - 1)
              const active = idx === stepIdx && c.status !== "booked"
              return (
                <div
                  key={st.key}
                  style={{
                    padding: "6px 8px",
                    borderRadius: 8,
                    fontSize: 11.5,
                    fontWeight: active || done ? 600 : 500,
                    background: done ? "var(--ok-wash)" : active ? "var(--accent-wash)" : "var(--surface-2)",
                    color: done ? "var(--ok)" : active ? "var(--accent-ink)" : "var(--ink-3)",
                    border: active ? "1px solid var(--accent-line)" : "1px solid var(--border)",
                  }}
                >
                  {st.label}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="stack" style={{ marginBottom: 16 }}>
        {nextGuide && <Notice tone={nextGuide.tone}>{nextGuide.text}</Notice>}
        {closed && c.status !== "booked" && <Notice tone="info">Closed ({CLIENT_STATUS[c.status].label.toLowerCase()}{c.statusReason ? `: ${c.statusReason}` : ""}). Click Reopen if they call back.</Notice>}
        {c.overdue && !closed && <Notice tone="bad">First call is late! Call or WhatsApp the couple right now.</Notice>}
      </div>

      <div className="cols-main">
        <div className="stack">
          {/* ------------------------------ shortlist ------------------------------ */}
          <Card
            title="Venues & Availability Answers"
            sub={d.shortlist.length ? `${d.shortlist.length} venue${d.shortlist.length === 1 ? "" : "s"} picked — click any venue name to read full packages, menus & photos.` : "Pick venues this couple asked about, then ask Vendor Team to check date & final price."}
            actions={<>
              {canManage && !closed && can("ops_vendor_search") && <Btn size="sm" icon={<Search aria-hidden />} onClick={() => setFinding(true)}>{d.shortlist.length > 0 ? "Add Venues" : "Search Venues"}</Btn>}
              {d.shortlist.length > 0 && <Btn size="sm" icon={<Copy aria-hidden />} onClick={sendWhatsAppQuote}>{hasAnyChecked ? "Send Quote on WhatsApp" : "Copy List for WhatsApp"}</Btn>}
              {canManage && can("ops_client_assign") && !closed && d.shortlist.length > 0 && (
                <Btn size="sm" variant="primary" icon={<Send aria-hidden />} onClick={() => setAssigning(true)}>
                  {openAssign ? "Change Vendor Person" : hasAnyChecked ? "Check Again with Vendor Team" : "Ask Vendor Team"}
                </Btn>
              )}
            </>}
            flush={d.shortlist.length > 0}
          >
            {d.shortlist.length === 0 ? (
              <Empty icon={<Search />} title="No venues picked yet" action={canManage && !closed && can("ops_vendor_search") ? <Btn variant="primary" onClick={() => setFinding(true)}>Find Royal Palace / Venues</Btn> : undefined}>
                Search any venue, read its packages &amp; menus to the couple, and add it here.
              </Empty>
            ) : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Venue (click to view rates)</th>
                      <th>Vendor Team Reply</th>
                      <th className="r">Final Price / Per Head</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {d.shortlist.map((s) => (
                      <tr key={s.id}>
                        <td style={{ minWidth: 220 }}>
                          <button
                            type="button"
                            className="td-name"
                            style={{ background: "none", border: 0, padding: 0, textAlign: "left", textDecoration: "underline", textDecorationColor: "var(--border-2)" }}
                            onClick={() => setBriefId(s.businessId)}
                          >
                            {s.businessName}
                          </button>
                          <div className="td-sub">
                            {[s.subArea, s.city, s.maxCapacity && s.maxCapacity > 1 ? `${s.maxCapacity} guests` : null].filter(Boolean).join(" · ")}
                          </div>
                          {s.note && <div className="small" style={{ marginTop: 4 }}>{s.note}</div>}
                          {s.altSuggestion && <div className="small" style={{ color: "var(--accent-ink)", marginTop: 2 }}>Alt: {s.altSuggestion}</div>}
                        </td>
                        <td>
                          <AvailabilityBadge value={s.availability} />
                          {s.checkedForDate && <div className="td-sub">Date: <b>{fmtDay(s.checkedForDate)}</b></div>}
                          {s.tokenAmountPkr && Number(s.tokenAmountPkr) > 0 && <div className="td-sub">Token: {fmtPkr(s.tokenAmountPkr)}</div>}
                          {s.holdUntil && <div className="td-sub">Hold till {fmtWhen(s.holdUntil)}</div>}
                          {s.checkedAt && <div className="td-sub">{fmtWhen(s.checkedAt)}{s.checkedByName ? ` · ${s.checkedByName}` : ""}</div>}
                        </td>
                        <td className="r num">
                          <div>{s.quotedPricePkr ? <b>{fmtPkr(s.quotedPricePkr)}</b> : "—"}</div>
                          <div className="td-sub">
                            {s.perHeadPkr ? `${fmtPkr(s.perHeadPkr)} / head` : s.listedPerHeadPkr ? `Listed ${fmtPkr(s.listedPerHeadPkr)}/head` : ""}
                          </div>
                        </td>
                        <td className="r nw">
                          <div className="row" style={{ justifyContent: "flex-end", gap: 4 }}>
                            <IconBtn label={`View details of ${s.businessName}`} onClick={() => setBriefId(s.businessId)}><Eye size={14} /></IconBtn>
                            {canManage && !closed && !s.checkedAt && (
                              <IconBtn label={`Remove ${s.businessName}`} onClick={() => unlist.mutate(s.id)}><Trash2 size={14} /></IconBtn>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* ------------------------------ contact ------------------------------ */}
          <Card title="Call or Message Couple" sub="Call from your phone or open WhatsApp, then save what they said below.">
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
                <Seg<ContactKind> label="How did you talk?" value={kind} onChange={setKind} options={[{ value: "call", label: "I Called" }, { value: "whatsapp", label: "I Sent WhatsApp" }, { value: "note", label: "Just Add Note" }]} />
                <Field label={kind === "note" ? "Note" : "What did the couple say?"} htmlFor="lg-text" hint={kind === "note" ? "A note is internal only." : "Saving Call or WhatsApp counts as calling back the couple."}>
                  <Textarea id="lg-text" rows={3} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} placeholder={kind === "call" ? "e.g. Wants Royal Palace on 15 Nov for 400 guests, max Rs 2,500 per head" : ""} />
                </Field>
                <div><Btn variant="primary" loading={log.isPending} disabled={kind === "note" && !text.trim()} onClick={() => log.mutate()}>{kind === "note" ? "Save Note" : "Save Call"}</Btn></div>
              </div>
            ) : null}
          </Card>

          {/* ------------------------------ history ------------------------------ */}
          <Card title="Full Timeline" sub="Every call, vendor answer, site visit, and booking update in one list." flush>
            {d.timeline.length === 0 ? <Empty title="Nothing yet">Calls, notes, and vendor replies appear here.</Empty> : d.timeline.map((e) => (
              <div key={e.id} className="list-row" style={{ alignItems: "flex-start" }}>
                <div style={{ width: 96, flex: "none" }}><Status tone={e.kind === "call" || e.kind === "whatsapp" ? "info" : e.kind === "inquiry" ? "acc" : "mut"}>{TIMELINE_ICON[e.kind] || "Update"}</Status></div>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, wordBreak: "break-word" }}>{e.body || "—"}</div><div className="small muted">{fmtWhen(e.at)}{e.authorName ? ` · ${e.authorName}` : ""}</div></div>
              </div>
            ))}
          </Card>
        </div>

        <div className="stack">
          <Card title="Couple Requirements">
            <dl className="kv">
              <dt>Source</dt><dd>{SOURCE_LABEL[c.source]}</dd>
              <dt>City</dt><dd>{c.cityName ?? "—"}</dd>
              <dt>Guests</dt><dd>{c.guests ?? "—"}</dd>
              <dt>Budget</dt><dd>{fmtPkr(c.budgetPkr)}</dd>
              <dt>Wants</dt><dd>{c.requirements || "—"}</dd>
              <dt>Notes</dt><dd>{c.notes || "—"}</dd>
            </dl>
          </Card>

          {(c.status === "visit_scheduled" || c.visitAt) && (
            <Card title="Planned Site Visit" sub="Couple visiting the hall." actions={canManage && !closed ? <Btn size="sm" onClick={() => setVisiting(true)}>Edit Visit</Btn> : undefined}>
              <dl className="kv">
                <dt>Venue</dt><dd><b>{c.visitVenueName || "—"}</b></dd>
                <dt>Date &amp; Time</dt><dd>{c.visitAt ? fmtWhen(c.visitAt) : "—"}</dd>
                {c.visitNote && <><dt>Notes</dt><dd>{c.visitNote}</dd></>}
              </dl>
              {canManage && !closed && (
                <div style={{ marginTop: 12 }}>
                  <Btn size="sm" variant="primary" icon={<CheckCircle2 aria-hidden />} onClick={() => setBooking(true)}>
                    Visit Done — Book Now
                  </Btn>
                </div>
              )}
            </Card>
          )}

          <Card title="Wedding Functions & Dates" sub="Mehndi, Barat, Walima dates." actions={canManage && !closed ? <Btn size="sm" icon={<CalendarPlus aria-hidden />} onClick={() => setEventing(true)}>Add Date</Btn> : undefined}>
            {d.events.length === 0 ? <p className="muted small" style={{ margin: 0 }}>No wedding dates added yet.</p> : d.events.map((e) => (
              <div key={e.id} className="row between" style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <div><b>{EVENT_LABEL[e.kind]}</b>{e.eventDate ? ` · ${fmtDay(e.eventDate)}` : ""}<div className="small muted">{[e.guests ? `${e.guests} guests` : null, e.budgetPkr ? fmtPkr(e.budgetPkr) : null, e.notes].filter(Boolean).join(" · ")}</div></div>
                {canManage && !closed ? <IconBtn label="Remove function" onClick={() => rmEvent.mutate(e.id)}><Trash2 size={15} /></IconBtn> : null}
              </div>
            ))}
          </Card>

          <Card title="Vendor Team Requests" sub="Who from Vendor Team checked the halls.">
            {d.assignments.length === 0 ? <p className="muted small" style={{ margin: 0 }}>Not sent yet. Pick a venue above and click Ask Vendor Team.</p> : d.assignments.map((a) => (
              <div key={a.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div className="row between"><b>{a.assigneeName}</b><Status tone={a.status === "open" ? "info" : a.status === "done" ? "ok" : "mut"}>{a.status === "open" ? "Checking" : a.status === "done" ? "Replied" : "Cancelled"}</Status></div>
                <div className="small muted">{fmtWhen(a.createdAt)}{a.assignedByName ? ` · by ${a.assignedByName}` : ""}{a.firstActionAt ? ` · called ${fmtWhen(a.firstActionAt)}` : a.status === "open" ? " · not called yet" : ""}</div>
                {a.status === "open" && <div className="row" style={{ gap: 8, marginTop: 6, flexWrap: "wrap" }}><StageBadge stage={a.stage} />{a.stageNote ? <span className="small">{a.stageNote}</span> : null}</div>}
                {a.reason ? <div className="small">{a.reason}</div> : null}
              </div>
            ))}
          </Card>

          {d.inquiries.length > 0 && (
            <Card title="Website Inquiries" sub="What this couple submitted on weddingwala.pk.">
              {d.inquiries.map((i) => (
                <div key={i.id} style={{ padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                  <div><b>{i.vendorName ?? "A vendor"}</b>{i.eventType ? ` · ${i.eventType}` : ""}</div>
                  {i.inquiry ? <div className="small">{i.inquiry}</div> : null}
                  <div className="small muted">{fmtWhen(i.createdAt)}</div>
                </div>
              ))}
            </Card>
          )}

          {Array.isArray(d.bookings) && d.bookings.length > 0 && (
            <Card title="Bookings" sub="Active wedding bookings for this couple.">
              {d.bookings.map((bk) => (
                <div key={bk.id} className="row between" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)", gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                      <Link href={`/ops/bookings/${bk.id}`} style={{ fontWeight: 600 }}>Booking #{bk.id}</Link>
                      <Status tone={bk.status === "Confirmed" ? "ok" : bk.status === "Cancelled" ? "bad" : "info"}>{bk.status}</Status>
                    </div>
                    <div className="small muted">
                      {[bk.vendors, bk.bookingDate ? fmtDay(bk.bookingDate) : null, bk.eventCity, bk.paymentStatus].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <Link href={`/ops/bookings/${bk.id}`} className="btn btn-sm">Open</Link>
                </div>
              ))}
            </Card>
          )}

          {d.tasks.some((t) => !t.doneAt) && (
            <Card title="Reminders">
              {d.tasks.filter((t) => !t.doneAt).map((t) => <div key={t.id} className="row between" style={{ padding: "6px 0" }}><span className="small">{t.note || t.kind}</span><span className="small muted">{fmtWhen(t.dueAt)}</span></div>)}
            </Card>
          )}

          {lead && c.ownerUserId && !closed && <div><Btn size="sm" loading={pool.isPending} onClick={() => pool.mutate()}>Return to Team Pool</Btn></div>}
        </div>
      </div>

      {edit && <EditModal d={d} onClose={() => setEdit(false)} onSaved={put} />}
      {eventing && <EventModal id={id} onClose={() => setEventing(false)} onSaved={put} />}
      {statusing && <StatusModal d={d} onClose={() => setStatusing(false)} onSaved={put} />}
      {assigning && <AssignModal d={d} onClose={() => setAssigning(false)} onSaved={refresh} />}
      {visiting && <VisitModal d={d} onClose={() => setVisiting(false)} onSaved={put} />}
      {booking && <BookModal d={d} onClose={() => setBooking(false)} onSaved={(det, bookingId) => { put(det); router.push(`/ops/bookings/${bookingId}`) }} />}

      <Modal open={finding} onClose={() => setFinding(false)} size="xwide" title={`Pick Venues for ${c.name}`}>
        {finding && <VendorSearchPanel clientId={id} clientName={c.name} shortlisted={d.shortlist.map((s) => s.businessId)} onShortlisted={refresh} />}
      </Modal>
      <VendorBriefModal
        businessId={briefId}
        open={briefId != null}
        onClose={() => setBriefId(null)}
        clientId={id}
        clientName={c.name}
        shortlisted={d.shortlist.map((s) => s.businessId)}
        onShortlisted={refresh}
      />
    </>
  )
}
