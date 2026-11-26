"use client"

// Ops Portal P7 — Upgraded Client Desk Inbox (/ops/clients)
// Preserves quick-add couple, website inquiry sync, status tabs & SLA overdue badge while adding City/Source/Handler/Sort filters,
// live Bookings count indicator, and multi-select Bulk Claim / Bulk Reassign.
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarCheck2, Contact, Plus, RefreshCw, Search, UserCheck } from "lucide-react"

import { useOps } from "@/components/ops/ops-shell"
import { Btn, Card, Empty, ErrorState, Field, Modal, PageHead, Select, SkelRows, Status, TabBar, fmtDay, fmtNum, fromNow, useOpsToast, type Tone } from "@/components/ops/ops-ui"
import { opsApi, opsErrorMessage } from "@/lib/api/ops"
import { clientBulkApi } from "@/lib/api/ops-directory"
import api from "@/lib/axiosConfig"

type ClientViewTab = "needs_response" | "inbox" | "mine" | "unassigned" | "assigned" | "booked" | "closed" | "all"

interface ClientRowItem {
  id: number
  name: string
  phones: { raw?: string; e164?: string }[]
  whatsapp: string | null
  email: string | null
  cityName: string | null
  source: string
  status: string
  guests: number | null
  budgetPkr: string | number | null
  ownerUserId: number | null
  ownerName: string | null
  firstResponseDueAt: string | null
  firstResponseAt: string | null
  createdAt: string
  overdue: boolean
  inquiries: number
  shortlisted: number
  bookingsCount: number
  nextEventDate: string | null
  assigneeName: string | null
  assignmentStage: string | null
}

const VALID_VIEWS: ClientViewTab[] = ["needs_response", "inbox", "mine", "unassigned", "assigned", "booked", "closed", "all"]
const STATUS_TONE: Record<string, Tone> = {
  new: "warn",
  contacted: "info",
  shortlisting: "acc",
  assigned: "info",
  booked: "ok",
  lost: "bad",
  closed: "mut",
}
const SOURCE_LABEL: Record<string, string> = {
  website: "Website inquiry",
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
  const initialView: ClientViewTab = VALID_VIEWS.includes(rawView as ClientViewTab) ? (rawView as ClientViewTab) : "inbox"

  const { me, can } = useOps()
  const router = useRouter()
  const qc = useQueryClient()
  const toast = useOpsToast()

  const [view, setView] = useState<ClientViewTab>(initialView)
  const [q, setQ] = useState("")
  const [cityId, setCityId] = useState("")
  const [source, setSource] = useState("")
  const [owner, setOwner] = useState("")
  const [sort, setSort] = useState("oldest")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<number[]>([])
  const [adding, setAdding] = useState(false)
  const [assignTarget, setAssignTarget] = useState("")

  // Quick-add couple modal state
  const [cName, setCName] = useState("")
  const [cPhone, setCPhone] = useState("")
  const [cCityId, setCCityId] = useState("")
  const [cSource, setCSource] = useState("whatsapp")
  const [cGuests, setCGuests] = useState("")
  const [cReq, setCReq] = useState("")
  const [cEvKind, setCEvKind] = useState("")
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
    onError: (e) => toast({ title: "Bulk action failed", body: opsErrorMessage(e), tone: "bad" }),
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
      setCName(""); setCPhone(""); setCCityId(""); setCGuests(""); setCReq(""); setCEvKind(""); setCEvDate("")
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
        title="Clients inbox"
        sub="Wedding couples from the website, WhatsApp & calls. First response SLA starts automatically when an inquiry arrives."
        actions={
          <div className="row">
            {can("ops_reports_all") && (
              <Btn icon={<RefreshCw aria-hidden />} loading={syncMut.isPending} onClick={() => syncMut.mutate()}>
                Sync website inquiries
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
                    aria-label="Reassign selected to desk agent"
                  >
                    <option value="">Assign to agent…</option>
                    <option value="pool">Return to pool (unassigned)</option>
                    {deskMembers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user?.fullName ?? `User #${m.userId}`}{m.userId === me.user.id ? " (me)" : ""}
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
          <TabBar<ClientViewTab>
            value={view}
            onChange={(v) => { setView(v); setPage(1); setSelected([]) }}
            label="Client views"
            tabs={[
              { value: "needs_response", label: "Needs reply", count: counts.needs_response },
              { value: "inbox", label: "Active inbox", count: counts.inbox },
              { value: "mine", label: "Mine", count: counts.mine },
              { value: "unassigned", label: "Unassigned", count: counts.unassigned },
              { value: "assigned", label: "With vendor team", count: counts.assigned },
              { value: "closed", label: "Closed / booked", count: counts.closed },
              { value: "all", label: "All", count: counts.all },
            ]}
          />

          <div className="filters">
            <div className="f-search">
              <Search aria-hidden />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1) }}
                placeholder="Name, phone, or notes…"
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

            <select className="fsel" value={owner} onChange={(e) => { setOwner(e.target.value); setPage(1) }} aria-label="Filter by handler">
              <option value="">Any handler</option>
              <option value={String(me.user.id)}>Assigned to me</option>
              {can("ops_prospect_reassign") && deskMembers.filter((m) => m.userId !== me.user.id).map((m) => (
                <option key={m.userId} value={String(m.userId)}>{m.user?.fullName ?? `Agent #${m.userId}`}</option>
              ))}
            </select>

            <select className="fsel" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }} aria-label="Sort clients">
              <option value="oldest">Oldest unanswered</option>
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
          <Empty icon={<Contact />} title="No couples here">No inquiries or clients match the selected filters.</Empty>
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
                    <th>Wedding / City</th>
                    <th>Source &amp; Status</th>
                    <th>SLA / Activity</th>
                    <th>Handler</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const phoneText = r.phones?.[0]?.raw || r.whatsapp || r.email || "—"
                    return (
                      <tr key={r.id} className={r.overdue ? "urgent" : undefined}>
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
                        </td>
                        <td>
                          <div className="row" style={{ gap: 6 }}>
                            <Status tone={STATUS_TONE[r.status] ?? "mut"}>{r.status}</Status>
                            {r.bookingsCount > 0 && (
                              <span className="st ok"><CalendarCheck2 size={11} aria-hidden />Booked</span>
                            )}
                          </div>
                          <div className="td-sub">{SOURCE_LABEL[r.source] ?? r.source} · {r.inquiries} inq · {r.shortlisted} shortlist</div>
                        </td>
                        <td>
                          {!r.firstResponseAt && r.overdue ? (
                            <Status tone="bad">Overdue reply</Status>
                          ) : !r.firstResponseAt ? (
                            <Status tone="warn">Needs reply</Status>
                          ) : (
                            <Status tone="ok">Replied</Status>
                          )}
                          <div className="td-sub">Added {fromNow(r.createdAt)}</div>
                        </td>
                        <td className="td-mut">
                          {r.ownerName || "Unassigned"}
                          {r.assigneeName && <div className="td-sub">Venue: {r.assigneeName}</div>}
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
        title="Add couple"
        description="Log a couple who messaged on WhatsApp, Instagram, or phone. Deduplicated automatically by phone number."
        footer={
          <>
            <Btn onClick={() => setAdding(false)}>Cancel</Btn>
            <Btn variant="primary" disabled={!cName.trim() || !cPhone.trim()} loading={createMut.isPending} onClick={() => createMut.mutate()}>
              Save &amp; open
            </Btn>
          </>
        }
      >
        <div className="form-grid">
          <Field label="Couple / contact name" htmlFor="ac-name" required>
            <input id="ac-name" className="inp" value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Ayesha &amp; Bilal" />
          </Field>
          <Field label="Phone / WhatsApp" htmlFor="ac-phone" required>
            <input id="ac-phone" className="inp" value={cPhone} onChange={(e) => setCPhone(e.target.value)} placeholder="0300 1234567" />
          </Field>
          <Field label="City" htmlFor="ac-city">
            <Select id="ac-city" value={cCityId} onChange={(e) => setCCityId(e.target.value)}>
              <option value="">Any / Unknown</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Source" htmlFor="ac-src">
            <Select id="ac-src" value={cSource} onChange={(e) => setCSource(e.target.value)}>
              <option value="whatsapp">WhatsApp</option>
              <option value="phone">Phone call</option>
              <option value="instagram">Instagram</option>
              <option value="walk_in">Walk-in</option>
              <option value="referral">Referral</option>
              <option value="other">Other</option>
            </Select>
          </Field>
          <Field label="Main function (optional)" htmlFor="ac-ev">
            <Select id="ac-ev" value={cEvKind} onChange={(e) => setCEvKind(e.target.value)}>
              <option value="">None yet</option>
              <option value="mehndi">Mehndi</option>
              <option value="barat">Barat</option>
              <option value="walima">Walima</option>
              <option value="nikah">Nikah</option>
              <option value="engagement">Engagement</option>
            </Select>
          </Field>
          <Field label="Event date (optional)" htmlFor="ac-date">
            <input id="ac-date" type="date" className="inp" value={cEvDate} onChange={(e) => setCEvDate(e.target.value)} />
          </Field>
          <Field label="Estimated guests" htmlFor="ac-guests">
            <input id="ac-guests" type="number" className="inp" value={cGuests} onChange={(e) => setCGuests(e.target.value)} placeholder="350" />
          </Field>
          <Field label="Requirements" htmlFor="ac-req" className="full">
            <textarea id="ac-req" className="txa" value={cReq} onChange={(e) => setCReq(e.target.value)} placeholder="Marquee in DHA or Gulberg, outdoor lawn option…" />
          </Field>
        </div>
      </Modal>
    </>
  )
}
