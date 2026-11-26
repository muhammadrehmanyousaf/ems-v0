"use client"

// Client Desk Inbox (/ops/clients): simple English workflow tabs so Team B sees New Calls,
// Replies Ready from Vendor Team, Upcoming Site Visits, and Unassigned Pool at one glance.
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarCheck2, Contact, Plus, RefreshCw, Search, Store, UserCheck } from "lucide-react"

import { CLIENT_STATUS, ClientStatusBadge } from "@/components/ops/client-bits"
import { useOps } from "@/components/ops/ops-shell"
import { Btn, Card, Empty, ErrorState, Field, Modal, PageHead, Select, SkelRows, Status, TabBar, fmtDay, fmtNum, fromNow, useOpsToast, type Tone } from "@/components/ops/ops-ui"
import { opsApi, opsErrorMessage } from "@/lib/api/ops"
import type { ClientStatus, ClientView } from "@/lib/api/ops-clients"
import { clientBulkApi } from "@/lib/api/ops-directory"
import api from "@/lib/axiosConfig"

interface ClientRowItem {
  id: number
  name: string
  phones: { raw?: string; e164?: string }[]
  whatsapp: string | null
  email: string | null
  cityName: string | null
  source: string
  status: ClientStatus
  guests: number | null
  budgetPkr: string | number | null
  ownerUserId: number | null
  ownerName: string | null
  firstResponseDueAt: string | null
  firstResponseAt: string | null
  createdAt: string
  visitAt?: string | null
  visitVenueName?: string | null
  bookingId?: number | null
  overdue: boolean
  inquiries: number
  shortlisted: number
  availableCount?: number
  bookingsCount: number
  nextEventDate: string | null
  assigneeName: string | null
  assignmentStage: string | null
}

const VALID_VIEWS: ClientView[] = ["needs_response", "vendor_replied", "visits", "inbox", "mine", "unassigned", "assigned", "closed", "all"]
const SOURCE_LABEL: Record<string, string> = {
  website: "Website form",
  whatsapp: "WhatsApp",
  phone: "Phone call",
  instagram: "Instagram",
  walk_in: "Walk-in",
  referral: "Referral",
  other: "Other",
}

export function ClientsViewP7() {
  const sp = useSearchParams()
  const rawView = sp?.get("view") ?? ""
  const initialView: ClientView = VALID_VIEWS.includes(rawView as ClientView) ? (rawView as ClientView) : "inbox"

  const { me, can } = useOps()
  const router = useRouter()
  const qc = useQueryClient()
  const toast = useOpsToast()

  const [view, setView] = useState<ClientView>(initialView)
  const [q, setQ] = useState("")
  const [cityId, setCityId] = useState("")
  const [source, setSource] = useState("")
  const [owner, setOwner] = useState("")
  const [sort, setSort] = useState("oldest")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<number[]>([])
  const [adding, setAdding] = useState(false)
  const [assignTarget, setAssignTarget] = useState("")

  const [cName, setCName] = useState("")
  const [cPhone, setCPhone] = useState("")
  const [cCityId, setCCityId] = useState("")
  const [cSource, setCSource] = useState("phone")
  const [cGuests, setCGuests] = useState("")
  const [cReq, setCReq] = useState("")
  const [cEvKind, setCEvKind] = useState("barat")
  const [cEvDate, setCEvDate] = useState("")

  const citiesQ = useQuery({ queryKey: ["ops", "cities"], queryFn: opsApi.cities, staleTime: 60_000 })
  const teamsQ = useQuery({
    queryKey: ["ops", "teams"],
    queryFn: opsApi.teams,
    enabled: can("ops_prospect_reassign"),
    staleTime: 60_000,
  })

  const countsQ = useQuery({
    queryKey: ["ops", "clients", "counts"],
    queryFn: async () => (await api.get("/api/v1/ops/clients/counts")).data.data as Record<string, number>,
    staleTime: 15_000,
  })

  const listQ = useQuery({
    queryKey: ["ops", "clients", "list", { view, q, cityId, source, owner, sort, page }],
    queryFn: async () =>
      (
        await api.get("/api/v1/ops/clients", {
          params: {
            view,
            q: q.trim() || undefined,
            cityId: cityId || undefined,
            source: source || undefined,
            owner: owner || undefined,
            sort,
            page,
            pageSize: 25,
          },
        })
      ).data.data as { rows: ClientRowItem[]; total: number; page: number; pageSize: number },
    staleTime: 15_000,
  })

  const syncMut = useMutation({
    mutationFn: async () => (await api.post("/api/v1/ops/clients/sync", {})).data.data as { linked?: number; created?: number },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["ops", "clients"] })
      qc.invalidateQueries({ queryKey: ["ops", "home-summary"] })
      toast({ title: r?.created ? `Imported ${r.created} new couple inquiries` : "Website inquiries are up to date" })
    },
    onError: (e) => toast({ title: "Sync failed", body: opsErrorMessage(e), tone: "bad" }),
  })

  const bulkMut = useMutation({
    mutationFn: ({ ids, toUserId }: { ids: number[]; toUserId: "me" | "pool" | number }) =>
      clientBulkApi.bulkOwner(ids, toUserId),
    onSuccess: (r) => {
      setSelected([])
      qc.invalidateQueries({ queryKey: ["ops", "clients"] })
      qc.invalidateQueries({ queryKey: ["ops", "home-summary"] })
      toast({ title: `Updated ${r.moved} of ${r.requested} client${r.requested === 1 ? "" : "s"}` })
    },
    onError: (e) => toast({ title: "Could not update", body: opsErrorMessage(e), tone: "bad" }),
  })

  const createMut = useMutation({
    mutationFn: async () =>
      (
        await api.post("/api/v1/ops/clients", {
          name: cName.trim(),
          phone: cPhone.trim(),
          cityId: cCityId ? Number(cCityId) : undefined,
          source: cSource,
          guests: cGuests ? Number(cGuests) : undefined,
          requirements: cReq.trim() || undefined,
          event: cEvKind ? { kind: cEvKind, eventDate: cEvDate || undefined } : undefined,
        })
      ).data.data as { id: number; existing: boolean },
    onSuccess: (r) => {
      setAdding(false)
      setCName(""); setCPhone(""); setCCityId(""); setCGuests(""); setCReq(""); setCEvKind("barat"); setCEvDate("")
      qc.invalidateQueries({ queryKey: ["ops", "clients"] })
      toast({ title: r.existing ? "Opened existing couple by phone" : "Couple added" })
      router.push(`/ops/clients/${r.id}`)
    },
    onError: (e) => toast({ title: "Could not add couple", body: opsErrorMessage(e), tone: "bad" }),
  })

  const counts = countsQ.data ?? {}
  const rows = listQ.data?.rows ?? []
  const total = listQ.data?.total ?? 0
  const pageSize = listQ.data?.pageSize ?? 25
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const cities = (citiesQ.data?.cities ?? []).filter((c) => c.active)

  const deskMembers = (teamsQ.data?.teams ?? [])
    .filter((t) => t.kind === "client_desk" && t.active)
    .flatMap((t) => t.members ?? [])
    .filter((m): m is NonNullable<typeof m> => Boolean(m && m.active && m.user))
    .filter((m, idx, arr) => arr.findIndex((x) => x.userId === m.userId) === idx)

  const toggleOne = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const allChecked = rows.length > 0 && rows.every((r) => selected.includes(r.id))

  return (
    <>
      <PageHead
        title="Clients & Calls"
        sub="How it works: 1) Call client -> 2) Check venue packages -> 3) Ask Vendor Team -> 4) Reply ready -> 5) Visit & Book."
        actions={
          <div className="row">
            <Link href="/ops/vendors" className="btn btn-ghost">
              <Store size={15} aria-hidden />Check Vendors
            </Link>
            {can("ops_reports_all") && (
              <Btn icon={<RefreshCw aria-hidden />} loading={syncMut.isPending} onClick={() => syncMut.mutate()}>
                Pull website inquiries
              </Btn>
            )}
            <Btn variant="primary" icon={<Plus aria-hidden />} onClick={() => setAdding(true)}>
              Add couple
            </Btn>
          </div>
        }
      />

      {selected.length > 0 && (
        <div className="card" style={{ padding: "10px 14px", marginBottom: 14 }}>
          <div className="row between" style={{ gap: 10 }}>
            <span className="small strong">{selected.length} couple{selected.length === 1 ? "" : "s"} selected</span>
            <div className="row">
              <Btn
                size="sm"
                variant="primary"
                icon={<UserCheck aria-hidden />}
                loading={bulkMut.isPending}
                onClick={() => bulkMut.mutate({ ids: selected, toUserId: "me" })}
              >
                Take selected
              </Btn>
              {can("ops_prospect_reassign") && (
                <>
                  <select
                    className="fsel"
                    value={assignTarget}
                    onChange={(e) => setAssignTarget(e.target.value)}
                    aria-label="Assign selected to agent"
                  >
                    <option value="">Assign to agent...</option>
                    <option value="pool">Return to team pool</option>
                    {deskMembers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user?.fullName ?? `Agent #${m.userId}`}{m.userId === me.user.id ? " (me)" : ""}
                      </option>
                    ))}
                  </select>
                  <Btn
                    size="sm"
                    disabled={!assignTarget}
                    loading={bulkMut.isPending}
                    onClick={() =>
                      bulkMut.mutate({
                        ids: selected,
                        toUserId: assignTarget === "pool" ? "pool" : Number(assignTarget),
                      })
                    }
                  >
                    Apply
                  </Btn>
                </>
              )}
              <Btn size="sm" onClick={() => setSelected([])}>Clear</Btn>
            </div>
          </div>
        </div>
      )}

      <Card flush>
        <div className="toolbar" style={{ padding: "14px 16px 0" }}>
          <TabBar<ClientView>
            value={view}
            onChange={(v) => { setView(v); setPage(1); setSelected([]) }}
            label="Client groups"
            tabs={[
              { value: "needs_response", label: "Need first call", count: counts.needs_response },
              { value: "vendor_replied", label: "Reply ready", count: counts.vendor_replied },
              { value: "visits", label: "Site visits", count: counts.visits },
              { value: "inbox", label: "All open", count: counts.inbox },
              { value: "mine", label: "My couples", count: counts.mine },
              { value: "unassigned", label: "Unassigned", count: counts.unassigned },
              { value: "assigned", label: "With Vendor Team", count: counts.assigned },
              { value: "closed", label: "Booked / Closed", count: counts.closed },
              { value: "all", label: "All", count: counts.all },
            ]}
          />

          <div className="filters">
            <div className="f-search">
              <Search aria-hidden />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1) }}
                placeholder="Search name or phone..."
                aria-label="Search couples"
              />
            </div>

            <select className="fsel" value={cityId} onChange={(e) => { setCityId(e.target.value); setPage(1) }} aria-label="Filter by city">
              <option value="">All cities</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select className="fsel" value={source} onChange={(e) => { setSource(e.target.value); setPage(1) }} aria-label="Filter by source">
              <option value="">All sources</option>
              {Object.entries(SOURCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>

            <select className="fsel" value={owner} onChange={(e) => { setOwner(e.target.value); setPage(1) }} aria-label="Filter by person">
              <option value="">Anyone</option>
              <option value={String(me.user.id)}>My clients</option>
              {can("ops_prospect_reassign") && deskMembers.filter((m) => m.userId !== me.user.id).map((m) => (
                <option key={m.userId} value={String(m.userId)}>{m.user?.fullName ?? `Agent #${m.userId}`}</option>
              ))}
            </select>

            <select className="fsel" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }} aria-label="Sort couples">
              <option value="oldest">Waiting longest first</option>
              <option value="newest">Newest first</option>
              <option value="event_date">Soonest wedding</option>
            </select>
          </div>
        </div>

        {listQ.isLoading ? (
          <div style={{ padding: 16 }}><SkelRows rows={8} /></div>
        ) : listQ.isError ? (
          <div style={{ padding: 16 }}><ErrorState message={opsErrorMessage(listQ.error)} onRetry={() => listQ.refetch()} /></div>
        ) : rows.length === 0 ? (
          <Empty icon={<Contact />} title="No couples in this list">Choose another tab above or add a new couple who called.</Empty>
        ) : (
          <>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 34 }}>
                      <input
                        type="checkbox"
                        aria-label="Select all on page"
                        checked={allChecked}
                        onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])}
                      />
                    </th>
                    <th>Couple &amp; Phone</th>
                    <th>Wedding &amp; City</th>
                    <th>Stage</th>
                    <th>Call Back Status</th>
                    <th>Handling By</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const phoneText = r.phones?.[0]?.raw || r.whatsapp || r.email || "—"
                    return (
                      <tr key={r.id} className={r.overdue ? "urgent" : r.status === "vendor_replied" ? "today" : undefined}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Select ${r.name}`}
                            checked={selected.includes(r.id)}
                            onChange={() => toggleOne(r.id)}
                          />
                        </td>
                        <td>
                          <Link href={`/ops/clients/${r.id}`} className="td-name" style={{ textDecoration: "underline", textDecorationColor: "var(--border-2)" }}>
                            {r.name}
                          </Link>
                          <div className="td-sub">
                            {phoneText}{r.bookingsCount > 0 ? ` · ${r.bookingsCount} booking${r.bookingsCount === 1 ? "" : "s"}` : ""}
                          </div>
                        </td>
                        <td className="td-mut">
                          <div>{[r.cityName, r.guests ? `${r.guests} guests` : null].filter(Boolean).join(" · ") || "—"}</div>
                          {r.nextEventDate && <div className="td-sub">Event {fmtDay(r.nextEventDate)}</div>}
                          {r.status === "visit_scheduled" && r.visitVenueName && (
                            <div className="td-sub" style={{ color: "var(--accent-ink)" }}>Visit: {r.visitVenueName}</div>
                          )}
                        </td>
                        <td>
                          <div className="row" style={{ gap: 6 }}>
                            <ClientStatusBadge status={r.status} />
                            {r.bookingsCount > 0 && (
                              <span className="st ok"><CalendarCheck2 size={11} aria-hidden />Booked</span>
                            )}
                          </div>
                          <div className="td-sub">
                            {SOURCE_LABEL[r.source] ?? r.source} · {r.inquiries} web ask · {r.shortlisted} venues
                            {(r.availableCount ?? 0) > 0 ? ` (${r.availableCount} free)` : ""}
                          </div>
                        </td>
                        <td>
                          {!r.firstResponseAt && r.overdue ? (
                            <Status tone="bad">Late — Call now</Status>
                          ) : !r.firstResponseAt ? (
                            <Status tone="warn">Need first call</Status>
                          ) : (
                            <Status tone="ok">Called back</Status>
                          )}
                          <div className="td-sub">Came in {fromNow(r.createdAt)}</div>
                        </td>
                        <td className="td-mut">
                          {r.ownerName || "In pool (no owner)"}
                          {r.assigneeName && <div className="td-sub">Vendor Team: {r.assigneeName}</div>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="tbl-foot">
              <span>{fmtNum(total)} couple{total === 1 ? "" : "s"} · page {page} of {totalPages}</span>
              <div className="pager">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add Couple"
        description="Save a couple who called or messaged on WhatsApp. Same number opens their existing file automatically."
        footer={
          <>
            <Btn onClick={() => setAdding(false)}>Cancel</Btn>
            <Btn variant="primary" disabled={!cName.trim() || !cPhone.trim()} loading={createMut.isPending} onClick={() => createMut.mutate()}>
              Save &amp; Open
            </Btn>
          </>
        }
      >
        <div className="form-grid">
          <Field label="Couple / Caller Name" htmlFor="ac-name" required>
            <input id="ac-name" className="inp" value={cName} onChange={(e) => setCName(e.target.value)} placeholder="e.g. Ayesha & Bilal" />
          </Field>
          <Field label="Phone / WhatsApp" htmlFor="ac-phone" required>
            <input id="ac-phone" className="inp" value={cPhone} onChange={(e) => setCPhone(e.target.value)} placeholder="0300 1234567" />
          </Field>
          <Field label="City" htmlFor="ac-city">
            <Select id="ac-city" value={cCityId} onChange={(e) => setCCityId(e.target.value)}>
              <option value="">Any city</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="How did they contact?" htmlFor="ac-src">
            <Select id="ac-src" value={cSource} onChange={(e) => setCSource(e.target.value)}>
              <option value="phone">Phone call</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="walk_in">Walk-in</option>
              <option value="referral">Referral</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Main Function" htmlFor="ac-ev">
            <Select id="ac-ev" value={cEvKind} onChange={(e) => setCEvKind(e.target.value)}>
              <option value="barat">Barat</option>
              <option value="walima">Walima</option>
              <option value="mehndi">Mehndi</option>
              <option value="nikah">Nikah</option>
              <option value="engagement">Engagement</option>
            </Select>
          </Field>
          <Field label="Event Date (optional)" htmlFor="ac-date">
            <input id="ac-date" type="date" className="inp" value={cEvDate} onChange={(e) => setCEvDate(e.target.value)} />
          </Field>
          <Field label="Total Guests" htmlFor="ac-guests">
            <input id="ac-guests" type="number" className="inp" value={cGuests} onChange={(e) => setCGuests(e.target.value)} placeholder="350" />
          </Field>
          <Field label="Which venue / area do they want?" htmlFor="ac-req" className="full">
            <textarea id="ac-req" className="txa" value={cReq} onChange={(e) => setCReq(e.target.value)} placeholder="e.g. Royal Palace or Gulberg lawn under Rs 2,500 per head..." />
          </Field>
        </div>
      </Modal>
    </>
  )
}
