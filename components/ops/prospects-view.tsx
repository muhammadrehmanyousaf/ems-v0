"use client"

// The prospect list: tabs with live counts, search, filters, bulk reassign (leads), export (managers), add by hand.
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Download, Plus, Users } from "lucide-react"

import { useOps } from "@/components/ops/ops-shell"
import { PhoneActions, StatusBadge, dueLabel, fmtPhone } from "@/components/ops/prospect-bits"
import { Btn, Card, Empty, ErrorState, Field, Input, Modal, Notice, PageHead, Pager, SearchBox, Select, SkelRows, Status, TabBar, Textarea, useOpsToast } from "@/components/ops/ops-ui"
import { opsApi, opsErrorMessage } from "@/lib/api/ops"
import { prospectsApi, type ProspectQuery, type ProspectRow, type ProspectView } from "@/lib/api/ops-prospects"
import { VENDOR_TYPES } from "@/lib/vendor-types"

const TABS: { value: ProspectView; label: string; perm?: string | string[] }[] = [
  { value: "mine", label: "My queue" },
  { value: "callbacks", label: "Callbacks due" },
  { value: "never", label: "Never called" },
  { value: "interested", label: "Interested" },
  { value: "claim_assist", label: "On Wedding Wala" },
  { value: "stale", label: "Needs review", perm: "ops_prospect_reassign" },
  { value: "upcoming", label: "Scheduled" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
]

export function AddProspectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  const router = useRouter()
  const { me } = useOps()
  const cities = useQuery({ queryKey: ["ops", "cities"], queryFn: opsApi.cities, enabled: open })
  const vendorTeams = me.memberships.filter((m) => m.kind === "vendor_outreach")
  const allTeams = useQuery({ queryKey: ["ops", "teams"], queryFn: opsApi.teams, enabled: open && me.scope.all })
  const teamOptions = me.scope.all ? (allTeams.data?.teams ?? []).filter((t) => t.kind === "vendor_outreach" && t.active).map((t) => ({ id: t.id, name: t.name })) : vendorTeams.map((t) => ({ id: t.teamId, name: t.teamName }))
  const [f, setF] = useState({ name: "", phone: "", vendorType: "", city: "", area: "", contactPerson: "", notes: "", teamId: "" })
  const [dupId, setDupId] = useState<number | null>(null)
  useEffect(() => { if (open && !f.teamId && teamOptions.length === 1) setF((s) => ({ ...s, teamId: String(teamOptions[0].id) })) }, [open, teamOptions.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }))
  const create = useMutation({
    mutationFn: () => prospectsApi.create({ name: f.name, phone: f.phone, vendorType: f.vendorType || undefined, city: f.city || undefined, area: f.area || undefined, contactPerson: f.contactPerson || undefined, notes: f.notes || undefined, teamId: f.teamId ? Number(f.teamId) : undefined, sourceType: "manual", assignToMe: true }),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["ops", "prospects"] }); toast({ title: "Prospect added" }); onClose(); router.push(`/ops/prospects/${r.prospect.id}`) },
    onError: (e) => {
      const data = (e as { response?: { data?: { data?: { prospectId?: number } } } })?.response?.data?.data
      setDupId(data?.prospectId ?? null)
      toast({ title: "Couldn't add the prospect", body: opsErrorMessage(e), tone: "bad" })
    },
  })
  return (
    <Modal open={open} onClose={onClose} title="Add a prospect" description="For a vendor you found yourself (a referral, a signboard). Spreadsheets go through Import."
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={create.isPending} disabled={!f.name.trim() || !f.phone.trim()} onClick={() => create.mutate()}>Add prospect</Btn></>}>
      {dupId && <Notice tone="warn">That number is already in the list. <Link href={`/ops/prospects/${dupId}`} style={{ textDecoration: "underline" }}>Open the existing prospect</Link></Notice>}
      <Field label="Business name" htmlFor="ap-name" required><Input id="ap-name" value={f.name} onChange={set("name")} /></Field>
      <Field label="Phone" htmlFor="ap-phone" required><Input id="ap-phone" value={f.phone} onChange={set("phone")} placeholder="0300 1234567" inputMode="tel" /></Field>
      <div className="form-grid">
        <Field label="Category" htmlFor="ap-type"><Select id="ap-type" value={f.vendorType} onChange={set("vendorType")}><option value="">Not sure</option>{Object.values(VENDOR_TYPES).map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
        <Field label="City" htmlFor="ap-city"><Select id="ap-city" value={f.city} onChange={set("city")}><option value="">Not set</option>{(cities.data?.cities ?? []).filter((c) => c.active).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</Select></Field>
        <Field label="Area" htmlFor="ap-area"><Input id="ap-area" value={f.area} onChange={set("area")} /></Field>
        <Field label="Contact person" htmlFor="ap-cp"><Input id="ap-cp" value={f.contactPerson} onChange={set("contactPerson")} /></Field>
      </div>
      {teamOptions.length !== 1 && <Field label="Team" htmlFor="ap-team" required><Select id="ap-team" value={f.teamId} onChange={set("teamId")}><option value="">Choose…</option>{teamOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>}
      <Field label="Notes" htmlFor="ap-notes"><Textarea id="ap-notes" value={f.notes} onChange={set("notes")} /></Field>
    </Modal>
  )
}

function ReassignModal({ open, onClose, ids, onDone }: { open: boolean; onClose: () => void; ids: number[]; onDone: () => void }) {
  const toast = useOpsToast()
  const teams = useQuery({ queryKey: ["ops", "teams"], queryFn: opsApi.teams, enabled: open })
  const [to, setTo] = useState("")
  const people = useMemo(() => {
    const out = new Map<number, string>()
    for (const t of teams.data?.teams ?? []) if (t.kind === "vendor_outreach") for (const m of t.members ?? []) if (m.active && m.user) out.set(m.userId, m.user.fullName)
    return [...out.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [teams.data])
  const go = useMutation({
    mutationFn: () => prospectsApi.reassign(ids, to === "pool" ? null : Number(to)),
    onSuccess: (r) => { toast({ title: `${r.moved} prospect${r.moved === 1 ? "" : "s"} moved`, body: r.notVisible ? `${r.notVisible} were not visible to you and were left alone.` : undefined }); onClose(); onDone() },
    onError: (e) => toast({ title: "Couldn't reassign", body: opsErrorMessage(e), tone: "bad" }),
  })
  return (
    <Modal open={open} onClose={onClose} title={`Move ${ids.length} prospect${ids.length === 1 ? "" : "s"}`} description="Open callbacks move with them."
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={go.isPending} disabled={!to} onClick={() => go.mutate()}>Move</Btn></>}>
      <Field label="Give to" htmlFor="ra-to">
        <Select id="ra-to" value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">Choose…</option>
          <option value="pool">Back to the team pool (anyone can take it)</option>
          {people.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </Select>
      </Field>
    </Modal>
  )
}

export function ProspectsView() {
  const { can, me } = useOps()
  const router = useRouter()
  const pathname = usePathname() ?? "/ops/prospects"
  const sp = useSearchParams()
  const qc = useQueryClient()
  const toast = useOpsToast()

  const tabs = TABS.filter((t) => !t.perm || can(t.perm))
  const defaultView: ProspectView = can("ops_prospect_call") ? "mine" : "all"
  const [view, setView] = useState<ProspectView>((sp?.get("view") as ProspectView) || defaultView)
  const [search, setSearch] = useState(sp?.get("q") ?? "")
  const [qDebounced, setQDebounced] = useState(search)
  const [cityId, setCityId] = useState(sp?.get("city") ?? "")
  const [vendorType, setVendorType] = useState(sp?.get("type") ?? "")
  const [owner, setOwner] = useState(sp?.get("owner") ?? "")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [adding, setAdding] = useState(false)
  const [moving, setMoving] = useState(false)
  const batchId = sp?.get("batch") ?? ""

  useEffect(() => { const t = window.setTimeout(() => { setQDebounced(search); setPage(1) }, 300); return () => window.clearTimeout(t) }, [search])
  useEffect(() => {
    const p = new URLSearchParams()
    if (view !== defaultView) p.set("view", view)
    if (qDebounced) p.set("q", qDebounced)
    if (cityId) p.set("city", cityId)
    if (vendorType) p.set("type", vendorType)
    if (owner) p.set("owner", owner)
    if (batchId) p.set("batch", batchId)
    const qs = p.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [view, qDebounced, cityId, vendorType, owner, batchId]) // eslint-disable-line react-hooks/exhaustive-deps

  const filters: ProspectQuery = { q: qDebounced || undefined, cityId: cityId || undefined, vendorType: vendorType || undefined, owner: owner || undefined, batchId: batchId ? Number(batchId) : undefined }
  const facets = useQuery({ queryKey: ["ops", "prospects", "facets"], queryFn: prospectsApi.facets })
  const counts = useQuery({ queryKey: ["ops", "prospects", "counts", filters], queryFn: () => prospectsApi.counts(filters), refetchInterval: 60_000 })
  const list = useQuery({ queryKey: ["ops", "prospects", "list", view, filters, page], queryFn: () => prospectsApi.list({ ...filters, view, page, pageSize: 25 }), placeholderData: (prev) => prev })

  const rows = list.data?.prospects ?? []
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const toggle = (id: number) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const lead = can("ops_prospect_reassign")
  const onView = (v: ProspectView) => { setView(v); setPage(1); setSelected(new Set()) }

  const exportCsv = useMutation({
    mutationFn: async () => {
      const blob = await prospectsApi.exportCsv({ ...filters, view })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = `prospects-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
      URL.revokeObjectURL(url)
    },
    onSuccess: () => toast({ title: "Export downloaded", body: "This export is logged." }),
    onError: (e) => toast({ title: "Couldn't export", body: opsErrorMessage(e), tone: "bad" }),
  })

  const c = counts.data?.counts
  const clearFilters = () => { setSearch(""); setCityId(""); setVendorType(""); setOwner("") }
  const hasFilters = !!(search || cityId || vendorType || owner || batchId)

  const rowCells = (r: ProspectRow) => {
    const next = dueLabel(r.nextActionAt)
    const phone = r.phones.find((p) => p.status !== "wrong" && p.status !== "dead") ?? r.phones[0]
    return { next, phone }
  }

  return (
    <>
      <PageHead
        title="Prospects"
        sub="Vendors to call. Open one to log a call; open the call queue to be handed the next one."
        actions={<>
          {can("ops_export") && <Btn icon={<Download aria-hidden />} loading={exportCsv.isPending} onClick={() => exportCsv.mutate()}>Export CSV</Btn>}
          {can(["ops_prospect_import", "ops_prospect_call"]) && <Btn icon={<Plus aria-hidden />} onClick={() => setAdding(true)}>Add prospect</Btn>}
          {can("ops_prospect_call") && <Link href="/ops/call" className="btn btn-primary">Start calling</Link>}
        </>}
      />
      {batchId && <div style={{ marginBottom: 12 }}><Notice tone="info">Showing only the prospects from import #{batchId}. <Link href="/ops/prospects" style={{ textDecoration: "underline" }}>Show all</Link></Notice></div>}

      <div className="toolbar">
        <TabBar value={view} onChange={onView} label="Prospect views" tabs={tabs.map((t) => ({ value: t.value, label: t.label, count: c ? c[t.value] : undefined }))} />
        <div className="filters">
          <SearchBox value={search} onChange={setSearch} placeholder="Name, phone or area" label="Search prospects" />
          <select className="fsel sel" style={{ width: "auto" }} value={cityId} onChange={(e) => { setCityId(e.target.value); setPage(1) }} aria-label="City"><option value="">All cities</option>{(facets.data?.cities ?? []).map((x) => <option key={x.id} value={x.id}>{x.name} ({x.n})</option>)}</select>
          <select className="fsel sel" style={{ width: "auto" }} value={vendorType} onChange={(e) => { setVendorType(e.target.value); setPage(1) }} aria-label="Category"><option value="">All categories</option>{(facets.data?.vendorTypes ?? []).map((x) => <option key={x.value} value={x.value}>{x.value} ({x.n})</option>)}</select>
          {(can(["ops_prospect_view_team", "ops_prospect_view_all"])) && <select className="fsel sel" style={{ width: "auto" }} value={owner} onChange={(e) => { setOwner(e.target.value); setPage(1) }} aria-label="Owner"><option value="">Everyone</option><option value="me">Mine</option><option value="none">Unassigned</option>{(facets.data?.owners ?? []).filter((o) => o.id !== me.user.id).map((o) => <option key={o.id} value={o.id}>{o.name} ({o.n})</option>)}</select>}
          {hasFilters && <Btn size="sm" variant="link" onClick={clearFilters}>Clear</Btn>}
        </div>
      </div>

      {lead && selected.size > 0 && (
        <div className="notice info" style={{ marginBottom: 12, alignItems: "center", justifyContent: "space-between" }}>
          <span><b>{selected.size}</b> selected</span>
          <span className="row"><Btn size="sm" variant="primary" icon={<Users aria-hidden />} onClick={() => setMoving(true)}>Move to…</Btn><Btn size="sm" onClick={() => setSelected(new Set())}>Clear selection</Btn></span>
        </div>
      )}

      <Card flush>
        {list.isLoading ? <SkelRows rows={8} />
          : list.isError ? <ErrorState message={opsErrorMessage(list.error)} onRetry={() => list.refetch()} />
          : rows.length === 0 ? (
            <Empty icon={<Users />} title={hasFilters ? "No prospects match" : view === "mine" ? "Your queue is empty" : "Nothing here"}
              action={hasFilters ? <Btn onClick={clearFilters}>Clear filters</Btn> : can("ops_prospect_import") ? <Link href="/ops/import" className="btn btn-primary">Import a sheet</Link> : undefined}>
              {hasFilters ? "Try different words or clear the filters." : view === "mine" ? "Press Start calling to be handed the next vendor, or ask your lead to assign you some." : "Prospects appear here once a sheet is imported."}
            </Empty>
          ) : (
            <>
              <div className="tbl-wrap hide-sm">
                <table className="tbl">
                  <thead><tr>
                    {lead && <th style={{ width: 36 }}><input type="checkbox" aria-label="Select all on this page" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)))} /></th>}
                    <th>Business</th><th>Phone</th><th>Status</th><th className="r">Tries</th><th>Next</th><th>Owner</th>
                  </tr></thead>
                  <tbody>
                    {rows.map((r) => {
                      const { next, phone } = rowCells(r)
                      return (
                        <tr key={r.id} className="click" onClick={() => router.push(`/ops/prospects/${r.id}`)}>
                          {lead && <td onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label={`Select ${r.name}`} checked={selected.has(r.id)} onChange={() => toggle(r.id)} /></td>}
                          <td style={{ minWidth: 240 }}>
                            <div className="td-name"><Link href={`/ops/prospects/${r.id}`} onClick={(e) => e.stopPropagation()}>{r.name}</Link> {r.matchKind === "phone" && <Status tone="acc">On Wedding Wala</Status>}{r.matchKind === "name_possible" && <Status tone="warn">Check match</Status>}</div>
                            <div className="td-sub">{[r.vendorType, r.cityName, r.area].filter(Boolean).join(" · ") || "—"}</div>
                          </td>
                          <td className="nw num" onClick={(e) => e.stopPropagation()}>{phone ? <span className="row" style={{ gap: 8, flexWrap: "nowrap" }}>{fmtPhone(phone)}<PhoneActions phone={phone} compact /></span> : "—"}</td>
                          <td><StatusBadge status={r.status} />{r.reviewReason && <> <Status tone="warn">Review</Status></>}</td>
                          <td className="r num">{r.attemptCount}</td>
                          <td className="nw">{r.nextActionAt ? <Status tone={next.due ? next.tone : "mut"}>{next.text}</Status> : <span className="muted">—</span>}</td>
                          <td className="td-mut nw">{r.ownerName ?? <span className="muted">Pool</span>}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="show-sm">
                {rows.map((r) => {
                  const { next, phone } = rowCells(r)
                  return (
                    <div key={r.id} className="list-row click" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }} onClick={() => router.push(`/ops/prospects/${r.id}`)}>
                      <div className="row between"><div className="td-name">{r.name}</div><StatusBadge status={r.status} /></div>
                      <div className="td-sub">{[r.vendorType, r.cityName, r.area].filter(Boolean).join(" · ") || "—"}</div>
                      <div className="row between" onClick={(e) => e.stopPropagation()}>{phone ? <span className="num">{fmtPhone(phone)}</span> : <span />}{phone && <PhoneActions phone={phone} compact />}</div>
                      <div className="small muted">{r.attemptCount} tries{r.nextActionAt ? ` · next ${next.text}` : ""} · {r.ownerName ?? "Pool"}</div>
                    </div>
                  )
                })}
              </div>
              <Pager page={page} pageSize={25} total={list.data?.total ?? 0} onPage={(p) => { setPage(p); setSelected(new Set()) }} />
            </>
          )}
      </Card>

      <AddProspectModal open={adding} onClose={() => setAdding(false)} />
      <ReassignModal open={moving} onClose={() => setMoving(false)} ids={[...selected]} onDone={() => { setSelected(new Set()); qc.invalidateQueries({ queryKey: ["ops", "prospects"] }) }} />
    </>
  )
}
