"use client"

// Ops Portal P7 — Upgraded Vendor Directory Browser (/ops/find)
// Loads immediately (no 2-char wait), adds City/Source/Needs/Live/Sort filters, shows photos/packages/bookings/leads signals, and supports queuing any vendor to call.
import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowRight, PhoneCall, Search, Store } from "lucide-react"

import { useOps } from "@/components/ops/ops-shell"
import { Btn, Card, Empty, ErrorState, PageHead, SkelRows, Status, fmtNum, useOpsToast } from "@/components/ops/ops-ui"
import { opsApi, opsErrorMessage } from "@/lib/api/ops"
import { directoryOpsApi, type DirectorySearchParams } from "@/lib/api/ops-directory"
import { VENDOR_TYPES } from "@/lib/vendor-types"

export function VendorFinderP7() {
  const { can } = useOps()
  const qc = useQueryClient()
  const toast = useOpsToast()

  const [q, setQ] = useState("")
  const [type, setType] = useState("")
  const [city, setCity] = useState("")
  const [source, setSource] = useState("")
  const [needs, setNeeds] = useState("")
  const [live, setLive] = useState<"" | "true" | "false">("")
  const [sort, setSort] = useState<NonNullable<DirectorySearchParams["sort"]>>("completeness_asc")
  const [page, setPage] = useState(1)

  const citiesQ = useQuery({ queryKey: ["ops", "cities"], queryFn: opsApi.cities, staleTime: 60_000 })

  const query = useQuery({
    queryKey: ["ops", "directory", { q, type, city, source, needs, live, sort, page }],
    queryFn: () =>
      directoryOpsApi.search({
        q: q.trim() || undefined,
        type: type || undefined,
        city: city || undefined,
        source: source || undefined,
        needs: needs || undefined,
        live: live || undefined,
        sort,
        page,
        pageSize: 30,
      }),
    staleTime: 15_000,
  })

  const queueMut = useMutation({
    mutationFn: (id: number) => directoryOpsApi.queueProspect(id),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["ops", "directory"] })
      qc.invalidateQueries({ queryKey: ["ops", "prospects"] })
      toast({ title: r.existed ? `Already in Prospects (#${r.id})` : `Added to Call Queue (#${r.id})` })
    },
    onError: (e) => toast({ title: "Could not add to queue", body: opsErrorMessage(e), tone: "bad" }),
  })

  const vendors = query.data?.rows ?? []
  const total = query.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / (query.data?.pageSize ?? 30)))
  const cities = (citiesQ.data?.cities ?? []).filter((c) => c.active).map((c) => c.name)

  return (
    <>
      <PageHead
        title="Vendors directory"
        sub="Browse all Wedding Wala businesses, inspect missing photos/packages, view bookings & inquiries, and queue calls."
        actions={can("ops_prospect_call") ? <Link href="/ops/call" className="btn btn-ghost"><PhoneCall aria-hidden size={15} />Call queue</Link> : undefined}
      />

      <Card flush>
        <div className="toolbar" style={{ padding: "14px 16px 0", marginBottom: 12 }}>
          <div className="f-search" style={{ minWidth: 220, flex: "1 1 220px", maxWidth: 320 }}>
            <Search aria-hidden />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1) }}
              placeholder="Search name, phone, area, or city…"
              aria-label="Search vendors"
            />
          </div>

          <select className="fsel" value={city} onChange={(e) => { setCity(e.target.value); setPage(1) }} aria-label="Filter by city">
            <option value="">All cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select className="fsel" value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} aria-label="Filter by category">
            <option value="">All categories</option>
            {Object.values(VENDOR_TYPES).map((vt) => <option key={vt} value={vt}>{vt}</option>)}
          </select>

          <select className="fsel" value={source} onChange={(e) => { setSource(e.target.value); setPage(1) }} aria-label="Filter by source">
            <option value="">All sources</option>
            <option value="registered">Registered vendors</option>
            <option value="ops">Ops onboarded</option>
            <option value="import">Directory imports</option>
          </select>

          <select className="fsel" value={needs} onChange={(e) => { setNeeds(e.target.value); setPage(1) }} aria-label="Filter by missing data">
            <option value="">Any profile health</option>
            <option value="no_photos">Needs photos</option>
            <option value="no_packages">Needs packages &amp; menus</option>
            <option value="low_score">Score below 60%</option>
          </select>

          <select className="fsel" value={live} onChange={(e) => { setLive(e.target.value as "" | "true" | "false"); setPage(1) }} aria-label="Filter by live state">
            <option value="">Live &amp; Draft</option>
            <option value="true">Live only</option>
            <option value="false">Draft / Off</option>
          </select>

          <select className="fsel" value={sort} onChange={(e) => { setSort(e.target.value as NonNullable<DirectorySearchParams["sort"]>); setPage(1) }} aria-label="Sort vendors">
            <option value="completeness_asc">Needs work first</option>
            <option value="completeness_desc">Most complete</option>
            <option value="bookings">Most bookings</option>
            <option value="leads">Most leads</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        {query.isLoading ? (
          <div style={{ padding: 16 }}><SkelRows rows={8} /></div>
        ) : query.isError ? (
          <div style={{ padding: 16 }}><ErrorState message={opsErrorMessage(query.error)} onRetry={() => query.refetch()} /></div>
        ) : vendors.length === 0 ? (
          <Empty icon={<Store />} title="No matching vendors">Try clearing one of the filters or searching a different keyword.</Empty>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>City / Area</th>
                  <th>Phone</th>
                  <th>Health &amp; Content</th>
                  <th className="r">Bookings / Leads</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link href={`/ops/find/${v.id}`} className="td-name" style={{ textDecoration: "underline", textDecorationColor: "var(--border-2)" }}>
                        {v.name}
                      </Link>
                      <div className="td-sub">
                        {[v.vendorType, v.ownerName, v.source === "import" ? "Import" : v.source === "ops" ? "Ops" : "Direct"].filter(Boolean).join(" · ")}
                      </div>
                    </td>
                    <td className="td-mut">{[v.city, v.subArea].filter(Boolean).join(", ") || "—"}</td>
                    <td className="nw num td-mut">{v.phone || "—"}</td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <Status tone={(v.completenessScore ?? 0) >= 75 ? "ok" : (v.completenessScore ?? 0) >= 45 ? "warn" : "bad"}>
                          {v.completenessScore ?? 0}%
                        </Status>
                        <span className="small muted">{v.imagesCount} imgs · {v.packages} pkg · {v.menus} menu</span>
                      </div>
                    </td>
                    <td className="r nw num">
                      <span className="small">{fmtNum(v.bookingsCount)} bk · {fmtNum(v.leadsCount)} leads</span>
                    </td>
                    <td>
                      <Status tone={v.live ? "ok" : v.status === "suspended" ? "bad" : "mut"}>
                        {v.live ? "Live" : v.status}
                      </Status>
                    </td>
                    <td className="r nw">
                      <div className="row" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
                        {v.prospectId ? (
                          <Link href={`/ops/prospects/${v.prospectId}`} className="btn btn-link sm">In queue</Link>
                        ) : can("ops_prospect_call") ? (
                          <Btn size="sm" loading={queueMut.isPending && queueMut.variables === v.id} onClick={() => queueMut.mutate(v.id)}>
                            Queue call
                          </Btn>
                        ) : null}
                        <Link href={`/ops/find/${v.id}`} className="btn btn-ghost sm">
                          Manage <ArrowRight size={13} aria-hidden />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {vendors.length > 0 && (
          <div className="tbl-foot">
            <span>{fmtNum(total)} vendor{total === 1 ? "" : "s"} · page {page} of {totalPages}</span>
            <div className="pager">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </Card>
    </>
  )
}
