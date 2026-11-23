"use client"

// One search for every vendor: ones the portal onboarded, imported listings nobody has claimed, vendors who registered themselves, and people still in
// the call list. Type a name or a phone number (any spelling) and see who they are, whether they are live, what they sell, and their number to call.
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Phone, Plus, Search, Store } from "lucide-react"

import { useOps } from "@/components/ops/ops-shell"
import { AddProspectModal } from "@/components/ops/prospects-view"
import { Btn, Card, Empty, ErrorState, PageHead, Pager, Seg, SearchBox, Select, SkelRows, Status } from "@/components/ops/ops-ui"
import { opsErrorMessage } from "@/lib/api/ops"
import { directoryApi, type VendorRow, type VendorSource } from "@/lib/api/ops-vendors"
import { toWaNumber } from "@/lib/ops/whatsapp"
import { VENDOR_TYPES } from "@/lib/vendor-types"

const PAGE = 25
type Live = "" | "live" | "notlive"
export const SOURCE_WORDS: Record<VendorSource, string> = { registered: "Registered by the vendor", imported: "Imported, not claimed", portal: "Added by the portal" }
export const money = (n: number | null | undefined) => (n == null || n <= 0 ? null : `Rs ${n.toLocaleString("en-PK")}`)

function VendorCard({ v }: { v: VendorRow }) {
  const wa = toWaNumber(v.phone)
  const price = money(v.minimumPrice)
  return (
    <div className="list-row" style={{ alignItems: "flex-start", gap: 14 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="td-name"><Link href={`/ops/find/${v.id}`}>{v.name}</Link></div>
        <div className="td-sub">{[v.vendorType, v.subArea, v.city, v.ownerName].filter(Boolean).join(" · ")}</div>
        <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          <Status tone={v.live ? "ok" : "warn"}>{v.live ? "Live" : "Not live"}</Status>
          <Status tone="mut">{SOURCE_WORDS[v.source]}</Status>
          <Status tone={v.packages + v.menus > 0 ? "info" : "mut"}>{v.packages} package{v.packages === 1 ? "" : "s"} · {v.menus} menu{v.menus === 1 ? "" : "s"}</Status>
          {price && <span className="small muted">from {price}</span>}
        </div>
      </div>
      <div className="row nw" style={{ gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
        {v.phone && <a className="btn btn-ghost sm" href={`tel:${v.phone.replace(/[^\d+]/g, "")}`}><Phone size={14} aria-hidden />{v.phone}</a>}
        {wa && <a className="btn btn-ghost sm" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${wa}`}>WhatsApp</a>}
        <Link className="btn btn-primary sm" href={`/ops/find/${v.id}`}>Open</Link>
      </div>
    </div>
  )
}

export function VendorFinderView() {
  const { can } = useOps()
  const params = useSearchParams()
  const [text, setText] = useState(params?.get("q") ?? "")
  const [q, setQ] = useState((params?.get("q") ?? "").trim())
  const [type, setType] = useState("")
  const [live, setLive] = useState<Live>("")
  const [page, setPage] = useState(1)
  const [adding, setAdding] = useState(false)
  // the top-bar search lands here with ?q=; follow it when it changes
  useEffect(() => { const t = (params?.get("q") ?? "").trim(); setText(t); setQ(t); setPage(1) }, [params])
  useEffect(() => { const t = window.setTimeout(() => { setQ(text.trim()); setPage(1) }, 300); return () => window.clearTimeout(t) }, [text])

  const ready = q.length >= 2 || !!type || !!live
  const res = useQuery({ queryKey: ["ops", "directory", q, type, live, page], queryFn: () => directoryApi.search({ q, type: type || undefined, live: live || undefined, page, pageSize: PAGE }), enabled: ready, placeholderData: (p) => p })
  const d = res.data
  const rows = d?.rows ?? []
  const prospects = d?.prospects ?? []

  return (
    <>
      <PageHead title="Vendors" sub="Find any vendor by name or phone number. Open one to see what they sell, correct anything after your call, and put them on the site."
        actions={can(["ops_prospect_import", "ops_prospect_call"]) ? <Btn variant="primary" icon={<Plus aria-hidden />} onClick={() => setAdding(true)}>Add a vendor</Btn> : undefined} />
      <div className="toolbar">
        <div style={{ flex: 1, minWidth: 240, maxWidth: 520 }}><SearchBox value={text} onChange={setText} placeholder="Name, owner, area or phone number" label="Search vendors" /></div>
        <div className="filters" style={{ marginLeft: 0 }}>
          <Select aria-label="Category" value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} style={{ width: 190 }}><option value="">All categories</option>{Object.values(VENDOR_TYPES).map((t) => <option key={t} value={t}>{t}</option>)}</Select>
          <Seg<Live> label="Visibility" value={live} onChange={(v) => { setLive(v); setPage(1) }} options={[{ value: "", label: "All" }, { value: "live", label: "Live" }, { value: "notlive", label: "Not live" }]} />
        </div>
      </div>

      {!ready ? (
        <Card><Empty icon={<Search />} title="Who are you looking for?">Type at least two letters of a name, or a phone number in any spelling (0300…, +92 300…, or just the last digits). Imported vendors, registered vendors and people in the call list all show up here.</Empty></Card>
      ) : (
        <div className="stack">
          <Card flush>
            {res.isLoading ? <SkelRows rows={6} /> : res.isError ? <ErrorState message={opsErrorMessage(res.error)} onRetry={() => res.refetch()} /> : rows.length === 0 ? (
              <Empty icon={<Store />} title={prospects.length ? "No listing matches, but there is a call-list entry below" : "No vendor matches"}
                action={can(["ops_prospect_import", "ops_prospect_call"]) ? <Btn variant="primary" onClick={() => setAdding(true)}>Add this vendor</Btn> : undefined}>
                Check the spelling, or try the phone number. If this vendor is new to us, add them and fill in the details on your call.
              </Empty>
            ) : (
              <>
                {rows.map((v) => <VendorCard key={v.id} v={v} />)}
                <Pager page={page} pageSize={PAGE} total={d?.total ?? 0} onPage={setPage} />
              </>
            )}
          </Card>

          {prospects.length > 0 && (
            <Card title="In the call list, not a listing yet" sub="We have their details but they are not on the site. Call them from here and take them live.">
              {prospects.map((p) => (
                <div key={p.id} className="list-row" style={{ alignItems: "center" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="td-name"><Link href={`/ops/prospects/${p.id}`}>{p.name}</Link></div>
                    <div className="td-sub">{[p.vendorType, p.area, p.city, p.phone].filter(Boolean).join(" · ")}</div>
                  </div>
                  <Link className="btn btn-primary sm" href={`/ops/prospects/${p.id}`}>Open</Link>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
      <AddProspectModal open={adding} onClose={() => setAdding(false)} />
    </>
  )
}
