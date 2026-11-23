"use client"

// Vendor search for the client desk. Shows what the public catalogue shows, plus the filters a desk agent needs, and is honest about thin data:
// venues with no price and no capacity sit in their own "needs a call" group instead of vanishing, and "free" is never claimed (the platform only
// knows about bookings made on it): what IS shown is when a staff phone check last found the venue available.
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, ExternalLink, Search as SearchIcon, SlidersHorizontal } from "lucide-react"

import { fmtPkr } from "@/components/ops/client-bits"
import { Btn, Card, Chip, Empty, ErrorState, Field, Input, Modal, Notice, PageHead, Pager, Select, SkelRows, Status, useOpsToast } from "@/components/ops/ops-ui"
import { opsApi, opsErrorMessage } from "@/lib/api/ops"
import { shortlistApi, vendorsApi, type VendorFlag, type VendorQuery, type VendorRow } from "@/lib/api/ops-clients"
import { opsErrorData } from "@/lib/api/ops-onboarding"
import { shortlistMessage } from "@/lib/ops/whatsapp"
import { SITE_URL } from "@/lib/seo/constants"
import { vendorLeafHref } from "@/lib/seo/vendor-href"
import { VENDOR_TYPES } from "@/lib/vendor-types"

const FLAGS: { value: VendorFlag; label: string }[] = [
  { value: "ac", label: "Air conditioned" }, { value: "parking", label: "Parking" }, { value: "generator", label: "Generator" }, { value: "valet", label: "Valet" }, { value: "wifi", label: "Wi-Fi" },
  { value: "separateHalls", label: "Separate halls" }, { value: "outsideDecor", label: "Outside decor OK" }, { value: "outsideDj", label: "Outside DJ OK" }, { value: "outsideFood", label: "Outside food OK" },
  { value: "outsideVendors", label: "Outside caterers OK" }, { value: "inHouseCateringOnly", label: "In-house catering only" }, { value: "catering", label: "Own kitchen" },
]
const PAGE_SIZE = 24

function ago(iso: string | null): string | null {
  if (!iso) return null
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 86400000)
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`
}
const href = (v: Pick<VendorRow, "id" | "name" | "city" | "vendorType">) => vendorLeafHref({ id: v.id, name: v.name, city: v.city, vendorType: v.vendorType })

function CompareModal({ ids, onClose }: { ids: number[]; onClose: () => void }) {
  const q = useQuery({ queryKey: ["ops", "vendors", "compare", ids.join(",")], queryFn: () => vendorsApi.compare(ids), enabled: ids.length >= 2 })
  const rows = q.data?.rows ?? []
  const yes = (v: unknown) => (v === true ? "Yes" : v === false ? "No" : "—")
  const tsd = (r: VendorRow, k: string) => (r.typeSpecificDetails ? r.typeSpecificDetails[k] : undefined)
  const lines: { label: string; get: (r: VendorRow) => React.ReactNode }[] = [
    { label: "Area", get: (r) => [r.subArea, r.city].filter(Boolean).join(", ") || "—" },
    { label: "Capacity", get: (r) => (r.maxCapacity && r.maxCapacity > 1 ? `${r.minCapacity ? `${r.minCapacity} to ` : "up to "}${r.maxCapacity}` : "Not stated") },
    { label: "Starting price", get: (r) => fmtPkr(r.minimumPrice) },
    { label: "Per head", get: (r) => (r.perHeadFromPkr ? (r.perHeadToPkr && r.perHeadToPkr !== r.perHeadFromPkr ? `${fmtPkr(r.perHeadFromPkr)} to ${fmtPkr(r.perHeadToPkr)}` : fmtPkr(r.perHeadFromPkr)) : "Not stated") },
    { label: "Air conditioned", get: (r) => yes(tsd(r, "isAirConditioned")) },
    { label: "Parking", get: (r) => (r.parking ? `Yes${r.carParkingCapacity ? ` (${r.carParkingCapacity} cars)` : ""}` : yes(r.parking)) },
    { label: "Generator", get: (r) => (Number(tsd(r, "generatorKw")) > 0 ? `${tsd(r, "generatorKw")} kW` : "—") },
    { label: "Valet", get: (r) => yes(tsd(r, "valetParkingIncluded")) },
    { label: "Outside decor", get: (r) => yes(tsd(r, "outsideDecorAllowed")) },
    { label: "Outside DJ", get: (r) => yes(tsd(r, "outsideDjAllowed")) },
    { label: "Outside food", get: (r) => yes(tsd(r, "outsideFoodAllowed")) },
    { label: "Own kitchen", get: (r) => yes(r.catering) },
    { label: "Listing quality", get: (r) => `${r.completenessScore ?? 0}%` },
    { label: "Owner", get: (r) => (r.claimed ? "Signed in on Wedding Wala" : "Not claimed yet") },
    { label: "Last confirmed free by phone", get: (r) => ago(r.lastConfirmedFreeAt) ?? "Never" },
  ]
  return (
    <Modal open onClose={onClose} size="xwide" title="Compare venues" description="Side by side, from the listings. Anything marked “not stated” needs a call.">
      {q.isLoading ? <SkelRows rows={8} /> : q.isError ? <ErrorState message={opsErrorMessage(q.error)} onRetry={() => q.refetch()} /> : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th />{rows.map((r) => <th key={r.id}>{href(r) ? <a href={href(r)} target="_blank" rel="noopener noreferrer" className="td-name">{r.name}</a> : r.name}</th>)}</tr></thead>
            <tbody>{lines.map((l) => <tr key={l.label}><td className="td-mut nw">{l.label}</td>{rows.map((r) => <td key={r.id}>{l.get(r)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}

export function VendorSearchPanel({ clientId, clientName, shortlisted = [], onShortlisted }: { clientId?: number; clientName?: string; shortlisted?: number[]; onShortlisted?: () => void }) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  const cities = useQuery({ queryKey: ["ops", "cities"], queryFn: opsApi.cities })
  const [f, setF] = useState({ q: "", city: "", area: "", vendorType: "Wedding venue", guests: "", priceMax: "", perHeadMin: "", perHeadMax: "", completenessMin: "", claimed: "" as "" | "yes" | "no", confirmedWithinDays: "", sort: "fit" as NonNullable<VendorQuery["sort"]> })
  const [flags, setFlags] = useState<VendorFlag[]>([])
  const [page, setPage] = useState(1)
  const [picked, setPicked] = useState<number[]>([])
  const [comparing, setComparing] = useState(false)
  const [open, setOpen] = useState(true)
  const [debounced, setDebounced] = useState(f)
  useEffect(() => { const t = window.setTimeout(() => { setDebounced(f); setPage(1) }, 350); return () => window.clearTimeout(t) }, [f])

  const query: VendorQuery = useMemo(() => ({
    vendorType: debounced.vendorType || undefined, city: debounced.city || undefined, area: debounced.area || undefined, q: debounced.q || undefined, guests: debounced.guests || undefined,
    priceMax: debounced.priceMax || undefined, perHeadMin: debounced.perHeadMin || undefined, perHeadMax: debounced.perHeadMax || undefined, completenessMin: debounced.completenessMin || undefined,
    claimed: debounced.claimed || undefined, confirmedWithinDays: debounced.confirmedWithinDays || undefined, flags, sort: debounced.sort, page, pageSize: PAGE_SIZE,
  }), [debounced, flags, page])
  const res = useQuery({ queryKey: ["ops", "vendors", "search", query], queryFn: () => vendorsApi.search(query), placeholderData: (p) => p })

  const add = useMutation({
    mutationFn: (ids: number[]) => shortlistApi.add(clientId!, ids),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["ops", "client", clientId] }); onShortlisted?.(); toast({ title: r.added ? `${r.added} added to the shortlist` : "Already on the shortlist" }); setPicked([]) },
    onError: (e) => { const d = opsErrorData<{ missing?: number[] }>(e); toast({ title: "Couldn't add", body: d?.code === "SHORTLIST_FULL" ? "A shortlist holds at most 12 venues." : opsErrorMessage(e), tone: "bad" }) },
  })

  const rows = res.data?.rows ?? []
  const complete = rows.filter((r) => !r.dataMissing)
  const thin = rows.filter((r) => r.dataMissing)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }))
  const toggle = (id: number) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 4 ? p : [...p, id]))
  const toggleFlag = (v: VendorFlag) => setFlags((x) => (x.includes(v) ? x.filter((y) => y !== v) : [...x, v]))
  const reset = () => { setF({ q: "", city: "", area: "", vendorType: "Wedding venue", guests: "", priceMax: "", perHeadMin: "", perHeadMax: "", completenessMin: "", claimed: "", confirmedWithinDays: "", sort: "fit" }); setFlags([]) }

  const message = async () => {
    const chosen = rows.filter((r) => picked.includes(r.id))
    const text = shortlistMessage({ clientName, venues: chosen.map((r) => ({ id: r.id, name: r.name, city: r.city, vendorType: r.vendorType, maxCapacity: r.maxCapacity, perHeadFromPkr: r.perHeadFromPkr })), origin: SITE_URL, href: (v) => vendorLeafHref({ id: v.id, name: v.name, city: v.city, vendorType: v.vendorType }) })
    try { await navigator.clipboard.writeText(text); toast({ title: "Message copied", body: "Paste it into WhatsApp." }) } catch { toast({ title: "Couldn't copy", tone: "bad" }) }
  }

  const renderRow = (r: VendorRow) => {
    const on = shortlisted.includes(r.id)
    const confirmed = ago(r.lastConfirmedFreeAt)
    return (
      <tr key={r.id}>
        <td style={{ width: 36 }}><input type="checkbox" aria-label={`Select ${r.name}`} checked={picked.includes(r.id)} disabled={!picked.includes(r.id) && picked.length >= 4} onChange={() => toggle(r.id)} /></td>
        <td style={{ minWidth: 220 }}>
          <div className="td-name">{href(r) ? <a href={href(r)} target="_blank" rel="noopener noreferrer">{r.name} <ExternalLink size={12} aria-hidden /></a> : r.name}</div>
          <div className="td-sub">{[r.subArea, r.city, r.vendorType === "Wedding venue" ? null : r.vendorType].filter(Boolean).join(" · ") || "—"}</div>
        </td>
        <td className="r num">{r.maxCapacity && r.maxCapacity > 1 ? r.maxCapacity : <span className="muted">?</span>}</td>
        <td className="r num">{fmtPkr(r.minimumPrice)}</td>
        <td className="r num">{r.perHeadFromPkr ? fmtPkr(r.perHeadFromPkr) : <span className="muted">—</span>}</td>
        <td className="nw"><Status tone={(r.completenessScore ?? 0) >= 60 ? "ok" : (r.completenessScore ?? 0) >= 30 ? "warn" : "mut"}>{r.completenessScore ?? 0}%</Status>{!r.claimed ? <> <Status tone="mut">Unclaimed</Status></> : null}</td>
        <td className="nw td-mut">{confirmed ?? "Never"}</td>
        {clientId ? <td className="r nw">{on ? <Status tone="ok"><Check size={12} aria-hidden /> On list</Status> : <Btn size="sm" loading={add.isPending && add.variables?.[0] === r.id} onClick={() => add.mutate([r.id])}>Add</Btn>}</td> : null}
      </tr>
    )
  }
  const renderTable = (items: VendorRow[], title: string, note?: string) => (
    <Card title={title} sub={note} flush>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th /><th>Venue</th><th className="r">Guests</th><th className="r">From</th><th className="r">Per head</th><th>Listing</th><th>Last free by phone</th>{clientId ? <th /> : null}</tr></thead>
          <tbody>{items.map((r) => renderRow(r))}</tbody>
        </table>
      </div>
    </Card>
  )

  return (
    <div className="stack">
      <Card title="Find venues" sub={clientName ? `For ${clientName}` : "The same listings couples see, with the filters you need."}
        actions={<><Btn size="sm" icon={<SlidersHorizontal aria-hidden />} onClick={() => setOpen((o) => !o)}>{open ? "Hide filters" : "Filters"}</Btn><Btn size="sm" variant="link" onClick={reset}>Reset</Btn></>}>
        {open ? (
          <div style={{ display: "grid", gap: 14 }}>
            <div className="grid3">
              <Field label="Name" htmlFor="vs-q"><Input id="vs-q" value={f.q} onChange={set("q")} placeholder="Venue name" autoComplete="off" /></Field>
              <Field label="City" htmlFor="vs-city"><Select id="vs-city" value={f.city} onChange={set("city")}><option value="">Any city</option>{(cities.data?.cities ?? []).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</Select></Field>
              <Field label="Area" htmlFor="vs-area"><Input id="vs-area" value={f.area} onChange={set("area")} placeholder="Gulberg, DHA…" autoComplete="off" /></Field>
            </div>
            <div className="grid3">
              <Field label="Category" htmlFor="vs-type"><Select id="vs-type" value={f.vendorType} onChange={set("vendorType")}><option value="">Any</option>{Object.values(VENDOR_TYPES).map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
              <Field label="Guests" htmlFor="vs-guests" hint="Venues that fit; unknown capacity is kept."><Input id="vs-guests" inputMode="numeric" value={f.guests} onChange={set("guests")} /></Field>
              <Field label="Highest starting price (PKR)" htmlFor="vs-pmax"><Input id="vs-pmax" inputMode="numeric" value={f.priceMax} onChange={set("priceMax")} /></Field>
            </div>
            <div className="grid3">
              <Field label="Per head, at least (PKR)" htmlFor="vs-phmin"><Input id="vs-phmin" inputMode="numeric" value={f.perHeadMin} onChange={set("perHeadMin")} /></Field>
              <Field label="Per head, at most (PKR)" htmlFor="vs-phmax"><Input id="vs-phmax" inputMode="numeric" value={f.perHeadMax} onChange={set("perHeadMax")} /></Field>
              <Field label="Listing quality, at least (%)" htmlFor="vs-cmin"><Input id="vs-cmin" inputMode="numeric" value={f.completenessMin} onChange={set("completenessMin")} /></Field>
            </div>
            <div className="grid3">
              <Field label="Owner" htmlFor="vs-claimed"><Select id="vs-claimed" value={f.claimed} onChange={set("claimed")}><option value="">Any</option><option value="yes">Signed in on Wedding Wala</option><option value="no">Not claimed yet</option></Select></Field>
              <Field label="Last confirmed free by phone" htmlFor="vs-conf"><Select id="vs-conf" value={f.confirmedWithinDays} onChange={set("confirmedWithinDays")}><option value="">Any time</option><option value="7">In the last 7 days</option><option value="30">In the last 30 days</option><option value="90">In the last 90 days</option></Select></Field>
              <Field label="Sort by" htmlFor="vs-sort"><Select id="vs-sort" value={f.sort} onChange={set("sort")}><option value="fit">Best listed first</option><option value="price">Lowest price</option><option value="capacity">Biggest</option><option value="name">Name</option></Select></Field>
            </div>
            <div><div className="lbl" style={{ marginBottom: 8 }}>Facilities and policies</div><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{FLAGS.map((x) => <Chip key={x.value} on={flags.includes(x.value)} onClick={() => toggleFlag(x.value)}>{x.label}</Chip>)}</div></div>
          </div>
        ) : null}
      </Card>

      {picked.length > 0 && (
        <div className="notice info" style={{ alignItems: "center", justifyContent: "space-between" }}>
          <span><b>{picked.length}</b> selected{picked.length >= 4 ? " (most you can compare)" : ""}</span>
          <span className="row">
            {picked.length >= 2 && <Btn size="sm" onClick={() => setComparing(true)}>Compare</Btn>}
            <Btn size="sm" onClick={message}>Copy WhatsApp message</Btn>
            {clientId && <Btn size="sm" variant="primary" loading={add.isPending} onClick={() => add.mutate(picked)}>Add {picked.length} to the shortlist</Btn>}
            <Btn size="sm" variant="link" onClick={() => setPicked([])}>Clear</Btn>
          </span>
        </div>
      )}

      {res.isLoading ? <Card flush><SkelRows rows={6} /></Card>
        : res.isError ? <Card><ErrorState message={opsErrorMessage(res.error)} onRetry={() => res.refetch()} /></Card>
        : rows.length === 0 ? <Card><Empty icon={<SearchIcon />} title="No venues match" action={<Btn onClick={reset}>Reset filters</Btn>}>Loosen a filter: capacity and price are only known for some venues.</Empty></Card>
        : (
          <>
            <div className="small muted">{res.data!.total} venue{res.data!.total === 1 ? "" : "s"}{res.data!.dataMissing ? ` · ${res.data!.dataMissing} with no price or capacity listed (need a call)` : ""}</div>
            {complete.length > 0 && renderTable(complete, "Listed with details")}
            {thin.length > 0 && renderTable(thin, "Data missing: needs a call", "No price and no capacity on the listing. They are shown, not hidden, because most of the catalogue is like this today.")}
            <Pager page={page} pageSize={PAGE_SIZE} total={res.data!.total} onPage={setPage} />
          </>
        )}
      {comparing && <CompareModal ids={picked} onClose={() => setComparing(false)} />}
    </div>
  )
}

export function VendorSearchView() {
  return (
    <>
      <PageHead title="Find venues" sub="Search the live catalogue. Open a client to add venues to their shortlist; here you can compare venues and copy a ready WhatsApp message." actions={<Link href="/ops/clients" className="btn btn-ghost">Clients</Link>} />
      <VendorSearchPanel />
      <div style={{ marginTop: 12 }}><Notice tone="info">Availability is not known from the platform: it only sees bookings made on it. “Last free by phone” is when one of us last confirmed it, and a phone check is always the real answer.</Notice></div>
    </>
  )
}
