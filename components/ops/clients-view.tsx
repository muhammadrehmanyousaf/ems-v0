"use client"

// The client desk inbox: every couple Team B is working, oldest unanswered first, with the first-response timer on each row.
// One client per phone number: adding a number that already exists opens that client instead of making a second one.
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Users } from "lucide-react"

import { useOps } from "@/components/ops/ops-shell"
import { ClientStatusBadge, EVENT_LABEL, ResponseBadge, SOURCE_LABEL, ageLabel } from "@/components/ops/client-bits"
import { fmtPhone } from "@/components/ops/prospect-bits"
import { Btn, Card, Empty, ErrorState, Field, Input, Modal, Notice, PageHead, Pager, SearchBox, Select, SkelRows, Status, TabBar, Textarea, fmtDay, useOpsToast } from "@/components/ops/ops-ui"
import { opsApi, opsErrorMessage } from "@/lib/api/ops"
import { clientsApi, type ClientEventKind, type ClientRow, type ClientSource, type ClientView } from "@/lib/api/ops-clients"
import { opsErrorData } from "@/lib/api/ops-onboarding"

const TABS: { value: ClientView; label: string }[] = [
  { value: "inbox", label: "Inbox" },
  { value: "mine", label: "Mine" },
  { value: "needs_response", label: "Needs a reply" },
  { value: "unassigned", label: "Pool" },
  { value: "assigned", label: "With vendor manager" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
]
const SOURCES: ClientSource[] = ["phone", "whatsapp", "referral", "walk_in", "other"]

function AddClientModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  const router = useRouter()
  const cities = useQuery({ queryKey: ["ops", "cities"], queryFn: opsApi.cities, enabled: open })
  const blank = { name: "", phone: "", source: "phone" as ClientSource, cityId: "", guests: "", budget: "", requirements: "", notes: "", kind: "" as ClientEventKind | "", eventDate: "" }
  const [f, setF] = useState(blank)
  const [error, setError] = useState<{ field?: string; message: string } | null>(null)
  useEffect(() => { if (!open) { setF(blank); setError(null) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { setF((s) => ({ ...s, [k]: e.target.value })); setError(null) }

  const save = useMutation({
    mutationFn: () => clientsApi.create({
      name: f.name, phone: f.phone, source: f.source, cityId: f.cityId || undefined, guests: f.guests || undefined, budgetPkr: f.budget || undefined,
      requirements: f.requirements || undefined, notes: f.notes || undefined, event: f.kind || f.eventDate ? { kind: (f.kind || "other") as ClientEventKind, eventDate: f.eventDate || undefined, guests: f.guests || undefined } : undefined,
    }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["ops", "clients"] })
      toast({ title: r.existing ? "This client already exists" : "Client added", body: r.existing ? "Opened the existing client instead of making a second one." : undefined })
      onClose()
      router.push(`/ops/clients/${r.id}`)
    },
    onError: (e) => { const d = opsErrorData<{ field?: string }>(e); setError({ field: d?.field, message: opsErrorMessage(e) }) },
  })

  return (
    <Modal open={open} onClose={onClose} title="Add a client" description="A phone or WhatsApp number is enough to start. If we already have this number you will be taken to that client."
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={save.isPending} disabled={!f.name.trim() || !f.phone.trim()} onClick={() => save.mutate()}>Add client</Btn></>}>
      <div style={{ display: "grid", gap: 14 }}>
        {error && !error.field ? <Notice tone="bad">{error.message}</Notice> : null}
        <div className="grid2">
          <Field label="Name" htmlFor="cl-name" required error={error?.field === "name" ? error.message : null}><Input id="cl-name" value={f.name} onChange={set("name")} autoComplete="off" autoFocus /></Field>
          <Field label="Phone or WhatsApp" htmlFor="cl-phone" required error={error?.field === "phone" ? error.message : null}><Input id="cl-phone" type="tel" inputMode="tel" value={f.phone} onChange={set("phone")} placeholder="0300 1234567" autoComplete="off" /></Field>
        </div>
        <div className="grid2">
          <Field label="Where they came from" htmlFor="cl-src"><Select id="cl-src" value={f.source} onChange={set("source")}>{SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}</Select></Field>
          <Field label="City" htmlFor="cl-city"><Select id="cl-city" value={f.cityId} onChange={set("cityId")}><option value="">Not sure</option>{(cities.data?.cities ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        </div>
        <div className="grid3">
          <Field label="Function" htmlFor="cl-kind"><Select id="cl-kind" value={f.kind} onChange={set("kind")}><option value="">—</option>{(Object.keys(EVENT_LABEL) as ClientEventKind[]).map((k) => <option key={k} value={k}>{EVENT_LABEL[k]}</option>)}</Select></Field>
          <Field label="Date" htmlFor="cl-date"><Input id="cl-date" type="date" value={f.eventDate} onChange={set("eventDate")} /></Field>
          <Field label="Guests" htmlFor="cl-guests" error={error?.field === "guests" ? error.message : null}><Input id="cl-guests" inputMode="numeric" value={f.guests} onChange={set("guests")} /></Field>
        </div>
        <Field label="Budget (PKR)" htmlFor="cl-budget" error={error?.field === "budgetPkr" ? error.message : null}><Input id="cl-budget" inputMode="numeric" value={f.budget} onChange={set("budget")} placeholder="2,500,000" /></Field>
        <Field label="What they want" htmlFor="cl-req"><Textarea id="cl-req" rows={3} maxLength={4000} value={f.requirements} onChange={set("requirements")} placeholder="Outdoor lawn, 400 guests, July" /></Field>
        <Field label="Note" htmlFor="cl-notes"><Textarea id="cl-notes" rows={2} maxLength={4000} value={f.notes} onChange={set("notes")} /></Field>
      </div>
    </Modal>
  )
}

export function ClientsView() {
  const router = useRouter()
  const { can } = useOps()
  const [view, setView] = useState<ClientView>("inbox")
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(false)
  useEffect(() => { const t = window.setTimeout(() => { setDebounced(search.trim()); setPage(1) }, 300); return () => window.clearTimeout(t) }, [search])

  const counts = useQuery({ queryKey: ["ops", "clients", "counts"], queryFn: clientsApi.counts, refetchInterval: 45000 })
  const list = useQuery({ queryKey: ["ops", "clients", "list", view, debounced, page], queryFn: () => clientsApi.list({ view, q: debounced || undefined, page, pageSize: 25 }), placeholderData: (p) => p, refetchInterval: 45000 })
  const rows = list.data?.rows ?? []
  const c = counts.data

  const primary = (r: ClientRow) => r.phones.find((p) => p.status !== "wrong" && p.status !== "dead") ?? r.phones[0]
  const onView = (v: ClientView) => { setView(v); setPage(1) }

  return (
    <>
      <PageHead
        title="Clients"
        sub="Couples asking for venues, oldest unanswered first. Open one to call, shortlist venues and hand it to a vendor manager."
        actions={<>
          {can("ops_vendor_search") && <Link href="/ops/vendors" className="btn btn-ghost">Find venues</Link>}
          {can("ops_client_manage") && <Btn variant="primary" icon={<Plus aria-hidden />} onClick={() => setAdding(true)}>Add client</Btn>}
        </>}
      />
      <div className="toolbar">
        <TabBar value={view} onChange={onView} label="Client views" tabs={TABS.map((t) => ({ value: t.value, label: t.label, count: c ? c[t.value] : undefined }))} />
        <div className="filters"><SearchBox value={search} onChange={setSearch} placeholder="Name or phone" label="Search clients" /></div>
      </div>

      <Card flush>
        {list.isLoading ? <SkelRows rows={8} />
          : list.isError ? <ErrorState message={opsErrorMessage(list.error)} onRetry={() => list.refetch()} />
          : rows.length === 0 ? (
            <Empty icon={<Users />} title={debounced ? "No clients match" : view === "inbox" ? "The inbox is clear" : "Nothing here"} action={debounced ? <Btn onClick={() => setSearch("")}>Clear search</Btn> : <Btn variant="primary" onClick={() => setAdding(true)}>Add a client</Btn>}>
              {debounced ? "Try a different name or number." : view === "inbox" ? "New website inquiries appear here by themselves. WhatsApp and phone clients are added by hand." : "Clients show up here as they move through the desk."}
            </Empty>
          ) : (
            <>
              <div className="tbl-wrap hide-sm">
                <table className="tbl">
                  <thead><tr><th>Client</th><th>Phone</th><th>Reply</th><th>Status</th><th>Next function</th><th className="r">Guests</th><th>Handler</th><th className="r">Age</th></tr></thead>
                  <tbody>
                    {rows.map((r) => {
                      const p = primary(r)
                      return (
                        <tr key={r.id} className="click" onClick={() => router.push(`/ops/clients/${r.id}`)}>
                          <td style={{ minWidth: 220 }}>
                            <div className="td-name"><Link href={`/ops/clients/${r.id}`} onClick={(e) => e.stopPropagation()}>{r.name}</Link></div>
                            <div className="td-sub">{[SOURCE_LABEL[r.source], r.cityName, r.inquiries ? `${r.inquiries} inquir${r.inquiries === 1 ? "y" : "ies"}` : null, r.shortlisted ? `${r.shortlisted} shortlisted` : null].filter(Boolean).join(" · ")}</div>
                          </td>
                          <td className="nw num">{p ? fmtPhone(p) : "—"}</td>
                          <td className="nw"><ResponseBadge row={r} /></td>
                          <td><ClientStatusBadge status={r.status} />{r.assigneeName ? <div className="td-sub">{r.assigneeName}</div> : null}</td>
                          <td className="nw">{r.nextEventDate ? fmtDay(r.nextEventDate) : <span className="muted">—</span>}</td>
                          <td className="r num">{r.guests ?? "—"}</td>
                          <td className="td-mut nw">{r.ownerName ?? <Status tone="acc">Pool</Status>}</td>
                          <td className="r td-mut nw">{ageLabel(r.createdAt)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="show-sm">
                {rows.map((r) => {
                  const p = primary(r)
                  return (
                    <div key={r.id} className="list-row click" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }} onClick={() => router.push(`/ops/clients/${r.id}`)}>
                      <div className="row between"><div className="td-name">{r.name}</div><ClientStatusBadge status={r.status} /></div>
                      <div className="td-sub">{[SOURCE_LABEL[r.source], r.cityName, r.guests ? `${r.guests} guests` : null].filter(Boolean).join(" · ")}</div>
                      <div className="row between"><span className="num small">{p ? fmtPhone(p) : "—"}</span><ResponseBadge row={r} /></div>
                      <div className="small muted">{r.ownerName ?? "Pool"} · {ageLabel(r.createdAt)} ago{r.nextEventDate ? ` · event ${fmtDay(r.nextEventDate)}` : ""}</div>
                    </div>
                  )
                })}
              </div>
              <Pager page={page} pageSize={25} total={list.data?.total ?? 0} onPage={setPage} />
            </>
          )}
      </Card>
      <AddClientModal open={adding} onClose={() => setAdding(false)} />
    </>
  )
}
