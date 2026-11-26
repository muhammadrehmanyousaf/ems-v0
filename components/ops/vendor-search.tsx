"use client"

// Check Vendors screen for Client Desk (Team B): search any venue on phone with a couple,
// open the full Vendor Fact Sheet (packages, menus, facilities, photos, busy dates) in 1 click,
// compare options, copy WhatsApp intro, or add to client & send straight to Vendor Team!
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, Eye, MessageCircle, Search as SearchIcon, SlidersHorizontal } from "lucide-react"

import { fmtPkr } from "@/components/ops/client-bits"
import { VendorBriefModal } from "@/components/ops/vendor-brief-modal"
import { Btn, Card, Chip, Empty, ErrorState, Field, Input, Modal, Notice, PageHead, Pager, Select, SkelRows, Status, useOpsToast } from "@/components/ops/ops-ui"
import { opsApi, opsErrorMessage } from "@/lib/api/ops"
import { shortlistApi, vendorsApi, type VendorFlag, type VendorQuery, type VendorRow } from "@/lib/api/ops-clients"
import { opsErrorData } from "@/lib/api/ops-onboarding"
import { relatedVenuesMessage, shortlistMessage, waWebLink } from "@/lib/ops/whatsapp"
import { SITE_URL } from "@/lib/seo/constants"
import { vendorLeafHref } from "@/lib/seo/vendor-href"
import { VENDOR_TYPES } from "@/lib/vendor-types"

const FLAGS: { value: VendorFlag; label: string }[] = [
  { value: "ac", label: "AC available" },
  { value: "parking", label: "Parking" },
  { value: "generator", label: "Generator" },
  { value: "valet", label: "Valet parking" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "separateHalls", label: "Separate M/F halls" },
  { value: "outsideDecor", label: "Outside decor OK" },
  { value: "outsideDj", label: "Outside DJ OK" },
  { value: "outsideFood", label: "Outside food OK" },
  { value: "outsideVendors", label: "Outside caterers OK" },
  { value: "inHouseCateringOnly", label: "In-house food only" },
  { value: "catering", label: "Own kitchen" },
]
const PAGE_SIZE = 24

function ago(iso: string | null): string | null {
  if (!iso) return null
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 86400000)
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`
}

function CompareModal({ ids, onClose }: { ids: number[]; onClose: () => void }) {
  const q = useQuery({ queryKey: ["ops", "vendors", "compare", ids.join(",")], queryFn: () => vendorsApi.compare(ids), enabled: ids.length >= 2 })
  const rows = q.data?.rows ?? []
  const yes = (v: unknown) => (v === true ? "Yes" : v === false ? "No" : "—")
  const tsd = (r: VendorRow, k: string) => (r.typeSpecificDetails ? r.typeSpecificDetails[k] : undefined)
  const lines: { label: string; get: (r: VendorRow) => React.ReactNode }[] = [
    { label: "Area", get: (r) => [r.subArea, r.city].filter(Boolean).join(", ") || "—" },
    { label: "Guests", get: (r) => (r.maxCapacity && r.maxCapacity > 1 ? `${r.minCapacity ? `${r.minCapacity} to ` : "up to "}${r.maxCapacity}` : "Ask vendor") },
    { label: "Starting price", get: (r) => fmtPkr(r.minimumPrice) },
    { label: "Per head", get: (r) => (r.perHeadFromPkr ? (r.perHeadToPkr && r.perHeadToPkr !== r.perHeadFromPkr ? `${fmtPkr(r.perHeadFromPkr)} to ${fmtPkr(r.perHeadToPkr)}` : fmtPkr(r.perHeadFromPkr)) : "Not set") },
    { label: "AC", get: (r) => yes(tsd(r, "isAirConditioned")) },
    { label: "Parking", get: (r) => (r.parking ? `Yes${r.carParkingCapacity ? ` (${r.carParkingCapacity} cars)` : ""}` : yes(r.parking)) },
    { label: "Generator", get: (r) => (Number(tsd(r, "generatorKw")) > 0 ? `${tsd(r, "generatorKw")} kW` : "—") },
    { label: "Valet", get: (r) => yes(tsd(r, "valetParkingIncluded")) },
    { label: "Outside decor", get: (r) => yes(tsd(r, "outsideDecorAllowed")) },
    { label: "Outside food", get: (r) => yes(tsd(r, "outsideFoodAllowed")) },
    { label: "Own kitchen", get: (r) => yes(r.catering) },
    { label: "Last checked free", get: (r) => ago(r.lastConfirmedFreeAt) ?? "Not checked" },
  ]
  return (
    <Modal open onClose={onClose} size="xwide" title="Compare venues" description="Side-by-side details so you can explain clearly to the couple.">
      {q.isLoading ? <SkelRows rows={8} /> : q.isError ? <ErrorState message={opsErrorMessage(q.error)} onRetry={() => q.refetch()} /> : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th />{rows.map((r) => <th key={r.id}>{r.name}</th>)}</tr></thead>
            <tbody>{lines.map((l) => <tr key={l.label}><td className="td-mut nw">{l.label}</td>{rows.map((r) => <td key={r.id}>{l.get(r)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}

export function VendorSearchPanel({
  clientId,
  clientName,
  clientPhone,
  shortlisted = [],
  onShortlisted,
  initialQuery = "",
}: {
  clientId?: number
  clientName?: string
  clientPhone?: string | null
  shortlisted?: number[]
  onShortlisted?: () => void
  initialQuery?: string
}) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  const cities = useQuery({ queryKey: ["ops", "cities"], queryFn: opsApi.cities })
  const [f, setF] = useState({
    q: initialQuery,
    city: "",
    area: "",
    vendorType: initialQuery ? "" : "Wedding venue",
    guests: "",
    priceMax: "",
    perHeadMin: "",
    perHeadMax: "",
    completenessMin: "",
    claimed: "" as "" | "yes" | "no",
    confirmedWithinDays: "",
    includePending: true,
    sort: "fit" as NonNullable<VendorQuery["sort"]>,
  })
  const [flags, setFlags] = useState<VendorFlag[]>([])
  const [page, setPage] = useState(1)
  const [picked, setPicked] = useState<number[]>([])
  const [comparing, setComparing] = useState(false)
  const [briefId, setBriefId] = useState<number | null>(null)
  const [open, setOpen] = useState(true)
  const [debounced, setDebounced] = useState(f)

  useEffect(() => {
    if (initialQuery && initialQuery !== f.q) {
      setF((s) => ({ ...s, q: initialQuery, vendorType: "" }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery])

  useEffect(() => {
    const t = window.setTimeout(() => { setDebounced(f); setPage(1) }, 250)
    return () => window.clearTimeout(t)
  }, [f])

  const query: VendorQuery = useMemo(() => ({
    vendorType: debounced.vendorType || undefined,
    city: debounced.city || undefined,
    area: debounced.area || undefined,
    q: debounced.q || undefined,
    guests: debounced.guests || undefined,
    priceMax: debounced.priceMax || undefined,
    perHeadMin: debounced.perHeadMin || undefined,
    perHeadMax: debounced.perHeadMax || undefined,
    completenessMin: debounced.completenessMin || undefined,
    claimed: debounced.claimed || undefined,
    confirmedWithinDays: debounced.confirmedWithinDays || undefined,
    includePending: debounced.includePending,
    flags,
    sort: debounced.sort,
    page,
    pageSize: PAGE_SIZE,
  }), [debounced, flags, page])

  const res = useQuery({ queryKey: ["ops", "vendors", "search", query], queryFn: () => vendorsApi.search(query), placeholderData: (p) => p })

  const add = useMutation({
    mutationFn: (ids: number[]) => shortlistApi.add(clientId!, ids),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["ops", "client", clientId] }); onShortlisted?.(); toast({ title: r.added ? `${r.added} venue added` : "Already on client's list" }); setPicked([]) },
    onError: (e) => { const d = opsErrorData<{ missing?: number[] }>(e); toast({ title: "Could not add", body: d?.code === "SHORTLIST_FULL" ? "Maximum 12 venues per client." : opsErrorMessage(e), tone: "bad" }) },
  })

  const rows = res.data?.rows ?? []
  const complete = rows.filter((r) => !r.dataMissing)
  const thin = rows.filter((r) => r.dataMissing)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }))
  const toggle = (id: number) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 4 ? p : [...p, id]))
  const toggleFlag = (v: VendorFlag) => setFlags((x) => (x.includes(v) ? x.filter((y) => y !== v) : [...x, v]))
  const reset = () => {
    setF({ q: "", city: "", area: "", vendorType: "", guests: "", priceMax: "", perHeadMin: "", perHeadMax: "", completenessMin: "", claimed: "", confirmedWithinDays: "", includePending: true, sort: "fit" })
    setFlags([])
  }

  const message = async () => {
    const chosen = rows.filter((r) => picked.includes(r.id))
    const text = shortlistMessage({
      clientName,
      venues: chosen.map((r) => ({ id: r.id, name: r.name, city: r.city, vendorType: r.vendorType, maxCapacity: r.maxCapacity, perHeadFromPkr: r.perHeadFromPkr })),
      origin: SITE_URL,
      href: (v) => vendorLeafHref({ id: v.id, name: v.name, city: v.city, vendorType: v.vendorType }),
    })
    try { await navigator.clipboard.writeText(text); toast({ title: "WhatsApp message copied", body: "Paste it to the couple on WhatsApp." }) } catch { toast({ title: "Could not copy", tone: "bad" }) }
  }

  const renderRow = (r: VendorRow) => {
    const on = shortlisted.includes(r.id)
    const confirmed = ago(r.lastConfirmedFreeAt)
    return (
      <tr key={r.id}>
        <td style={{ width: 36 }}><input type="checkbox" aria-label={`Select ${r.name}`} checked={picked.includes(r.id)} disabled={!picked.includes(r.id) && picked.length >= 4} onChange={() => toggle(r.id)} /></td>
        <td style={{ minWidth: 230 }}>
          <button
            type="button"
            className="td-name"
            style={{ background: "none", border: 0, padding: 0, textAlign: "left", textDecoration: "underline", textDecorationColor: "var(--border-2)" }}
            onClick={() => setBriefId(r.id)}
          >
            {r.name}
          </button>
          <div className="td-sub">
            {[r.subArea, r.city, r.vendorType, `${r.packagesCount ?? 0} pkg`, `${r.menusCount ?? 0} menu`, `${r.imagesCount ?? 0} photos`].filter(Boolean).join(" · ")}
            {r.isLive === false && <> · <span style={{ color: "var(--warn)" }}>Vendor team adding</span></>}
          </div>
        </td>
        <td className="r num">{r.maxCapacity && r.maxCapacity > 1 ? r.maxCapacity : <span className="muted">Ask</span>}</td>
        <td className="r num">{fmtPkr(r.minimumPrice)}</td>
        <td className="r num">{r.perHeadFromPkr ? fmtPkr(r.perHeadFromPkr) : <span className="muted">—</span>}</td>
        <td className="nw td-mut">{confirmed ?? "Not checked"}</td>
        <td className="r nw">
          <div className="row" style={{ justifyContent: "flex-end", gap: 6 }}>
            <Btn size="sm" icon={<Eye size={13} aria-hidden />} onClick={() => setBriefId(r.id)}>Full Details</Btn>
            {clientId && (
              on ? <Status tone="ok"><Check size={12} aria-hidden /> Added</Status>
                : <Btn size="sm" variant="primary" disabled={r.isLive === false} loading={add.isPending && add.variables?.[0] === r.id} onClick={() => add.mutate([r.id])}>Add</Btn>
            )}
          </div>
        </td>
      </tr>
    )
  }

  const renderTable = (items: VendorRow[], title: string, note?: string) => (
    <Card title={title} sub={note} flush>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th />
              <th>Vendor &amp; Content</th>
              <th className="r">Guests</th>
              <th className="r">From</th>
              <th className="r">Per head</th>
              <th>Last Free by Call</th>
              <th />
            </tr>
          </thead>
          <tbody>{items.map((r) => renderRow(r))}</tbody>
        </table>
      </div>
    </Card>
  )

  return (
    <div className="stack">
      <Card
        title="Search Vendors & Venues"
        sub={clientName ? `Pick venues for ${clientName}` : "Type any name (e.g. Royal Palace) while talking to the client, then click Full Details to read packages, menus, and photos."}
        actions={<><Btn size="sm" icon={<SlidersHorizontal aria-hidden />} onClick={() => setOpen((o) => !o)}>{open ? "Hide filters" : "Show filters"}</Btn><Btn size="sm" variant="link" onClick={reset}>Reset</Btn></>}
      >
        {open ? (
          <div style={{ display: "grid", gap: 12 }}>
            <div className="grid3">
              <Field label="Vendor / Hall Name" htmlFor="vs-q"><Input id="vs-q" value={f.q} onChange={set("q")} placeholder="Type name, e.g. Royal Palace..." autoComplete="off" /></Field>
              <Field label="City" htmlFor="vs-city"><Select id="vs-city" value={f.city} onChange={set("city")}><option value="">All cities</option>{(cities.data?.cities ?? []).map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</Select></Field>
              <Field label="Area" htmlFor="vs-area"><Input id="vs-area" value={f.area} onChange={set("area")} placeholder="Gulberg, DHA..." autoComplete="off" /></Field>
            </div>
            <div className="grid3">
              <Field label="Type of Business" htmlFor="vs-type"><Select id="vs-type" value={f.vendorType} onChange={set("vendorType")}><option value="">All types</option>{Object.values(VENDOR_TYPES).map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
              <Field label="Number of Guests" htmlFor="vs-guests"><Input id="vs-guests" inputMode="numeric" value={f.guests} onChange={set("guests")} placeholder="e.g. 350" /></Field>
              <Field label="Max Price (PKR)" htmlFor="vs-pmax"><Input id="vs-pmax" inputMode="numeric" value={f.priceMax} onChange={set("priceMax")} placeholder="e.g. 1500000" /></Field>
            </div>
            <div className="grid3">
              <Field label="Per Head Min (PKR)" htmlFor="vs-phmin"><Input id="vs-phmin" inputMode="numeric" value={f.perHeadMin} onChange={set("perHeadMin")} /></Field>
              <Field label="Per Head Max (PKR)" htmlFor="vs-phmax"><Input id="vs-phmax" inputMode="numeric" value={f.perHeadMax} onChange={set("perHeadMax")} /></Field>
              <Field label="Sort" htmlFor="vs-sort"><Select id="vs-sort" value={f.sort} onChange={set("sort")}><option value="fit">Best details first</option><option value="price">Lowest price first</option><option value="capacity">Biggest capacity</option><option value="name">A to Z</option></Select></Field>
            </div>
            <div className="row between" style={{ gap: 12 }}>
              <label className="check">
                <input type="checkbox" checked={f.includePending} onChange={(e) => setF((s) => ({ ...s, includePending: e.target.checked }))} />
                Include vendors Vendor Team is still preparing
              </label>
            </div>
            <div><div className="lbl" style={{ marginBottom: 8 }}>Facilities</div><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{FLAGS.map((x) => <Chip key={x.value} on={flags.includes(x.value)} onClick={() => toggleFlag(x.value)}>{x.label}</Chip>)}</div></div>
            {(res.data?.areaOptions?.length ?? 0) > 0 && (
              <div>
                <div className="lbl" style={{ marginBottom: 8 }}>Areas in {res.data?.related?.city || f.city}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {f.area && <Chip on={false} onClick={() => setF((s) => ({ ...s, area: "" }))}>All areas</Chip>}
                  {res.data!.areaOptions!.map((a) => (
                    <Chip
                      key={a.subArea}
                      on={f.area.toLowerCase() === a.subArea.toLowerCase()}
                      onClick={() => setF((s) => ({ ...s, area: s.area.toLowerCase() === a.subArea.toLowerCase() ? "" : a.subArea }))}
                    >
                      {a.subArea} ({a.count})
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Card>

      {picked.length > 0 && (
        <div className="notice info" style={{ alignItems: "center", justifyContent: "space-between" }}>
          <span><b>{picked.length}</b> selected</span>
          <span className="row">
            {picked.length >= 2 && <Btn size="sm" onClick={() => setComparing(true)}>Compare side by side</Btn>}
            <Btn size="sm" onClick={message}>Copy WhatsApp list</Btn>
            {clientId && <Btn size="sm" variant="primary" loading={add.isPending} onClick={() => add.mutate(picked)}>Add {picked.length} to client</Btn>}
            <Btn size="sm" variant="link" onClick={() => setPicked([])}>Clear</Btn>
          </span>
        </div>
      )}

      {res.isLoading ? <Card flush><SkelRows rows={6} /></Card>
        : res.isError ? <Card><ErrorState message={opsErrorMessage(res.error)} onRetry={() => res.refetch()} /></Card>
        : rows.length === 0 ? <Card><Empty icon={<SearchIcon />} title="No matching vendors" action={<Btn onClick={reset}>Reset search</Btn>}>Clear a filter or search another name.</Empty></Card>
        : (
          <>
            <div className="small muted">{res.data!.total} vendor{res.data!.total === 1 ? "" : "s"} found · click <b>Full Details</b> to read packages, menus &amp; photos on a call.</div>
            {complete.length > 0 && renderTable(complete, "Vendors with prices & packages")}
            {thin.length > 0 && renderTable(thin, "Basic listing (prices missing — ask Vendor Team to call)", "These vendors do not have a full rate card entered yet.")}
            <Pager page={page} pageSize={PAGE_SIZE} total={res.data!.total} onPage={setPage} />
          </>
        )}

      {res.data?.related && (res.data.related.sameArea.length > 0 || res.data.related.sameCity.length > 0) && (() => {
        const rel = res.data!.related!
        const allRel = [
          ...rel.sameArea.map((r) => ({ ...r, _relLabel: `Same Area · ${r.subArea || rel.subArea}` })),
          ...rel.sameCity.map((r) => ({ ...r, _relLabel: r.subArea || rel.city || "Same City" })),
        ].slice(0, 8)
        const areaTitle = [rel.subArea, rel.city].filter(Boolean).join(", ")
        const waRelatedHref = waWebLink(
          clientPhone,
          relatedVenuesMessage({
            clientName,
            areaLabel: areaTitle,
            venues: allRel,
            origin: SITE_URL,
            href: (v) => vendorLeafHref({ id: v.id, name: v.name, city: v.city, vendorType: v.vendorType }),
          }),
        )
        return (
          <Card
            title={`Related Venues in ${areaTitle}`}
            sub="Share these same-area and same-city options while talking to the couple on call."
            actions={
              <a href={waRelatedHref} target="_blank" rel="noopener noreferrer" className="btn btn-ghost sm">
                <MessageCircle size={13} aria-hidden />Send Related List (WA Web)
              </a>
            }
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
              {allRel.map((r) => (
                <div key={r.id} className="card" style={{ padding: 12, display: "grid", gap: 8, background: "var(--surface-2)" }}>
                  <div className="row between" style={{ gap: 6, alignItems: "flex-start" }}>
                    <button
                      type="button"
                      className="td-name"
                      style={{ background: "none", border: 0, padding: 0, textAlign: "left", textDecoration: "underline", textDecorationColor: "var(--border-2)" }}
                      onClick={() => setBriefId(r.id)}
                    >
                      {r.name}
                    </button>
                    <Status tone={r._relLabel.startsWith("Same Area") ? "acc" : "mut"}>{r._relLabel}</Status>
                  </div>
                  <div className="small muted">
                    {[
                      r.maxCapacity && r.maxCapacity > 1 ? `Up to ${r.maxCapacity} guests` : "Ask guests",
                      r.perHeadFromPkr ? `${fmtPkr(r.perHeadFromPkr)}/head` : fmtPkr(r.minimumPrice),
                      `${r.packagesCount ?? 0} pkg · ${r.menusCount ?? 0} menu · ${r.imagesCount ?? 0} photos`,
                    ].filter(Boolean).join(" · ")}
                  </div>
                  <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                    <Btn size="sm" icon={<Eye size={13} aria-hidden />} onClick={() => setBriefId(r.id)}>Full Details</Btn>
                    {clientId && !shortlisted.includes(r.id) && r.isLive !== false && (
                      <Btn size="sm" variant="primary" loading={add.isPending && add.variables?.[0] === r.id} onClick={() => add.mutate([r.id])}>+ Add</Btn>
                    )}
                    {clientId && shortlisted.includes(r.id) && <Status tone="ok"><Check size={12} aria-hidden /> Added</Status>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )
      })()}

      {comparing && <CompareModal ids={picked} onClose={() => setComparing(false)} />}
      <VendorBriefModal
        businessId={briefId}
        open={briefId != null}
        onClose={() => setBriefId(null)}
        clientId={clientId}
        clientName={clientName}
        clientPhone={clientPhone}
        shortlisted={shortlisted}
        onShortlisted={onShortlisted}
      />
    </div>
  )
}

export function VendorSearchView() {
  const sp = useSearchParams()
  const q = sp?.get("q") ?? ""
  return (
    <>
      <PageHead
        title="Check Vendors"
        sub="Search any venue or vendor while talking to a client. Click Full Details to read packages, menus, photos, rules & known booked dates — then save the client and send to Vendor Team."
        actions={<Link href="/ops/clients" className="btn btn-ghost">Back to Clients</Link>}
      />
      <VendorSearchPanel initialQuery={q} />
      <div style={{ marginTop: 12 }}>
        <Notice tone="info">Vendor phone numbers stay with Vendor Team (Team A). When a couple likes a venue, send it to Team A so they confirm the exact date &amp; discount.</Notice>
      </div>
    </>
  )
}
