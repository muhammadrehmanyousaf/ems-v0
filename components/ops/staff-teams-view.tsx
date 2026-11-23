"use client"

// Staff, teams and cities (manager screen). Every action is a server call that re-checks ops_settings.
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { MessageCircle, Plus, RefreshCw, UserCheck, UserX, Users } from "lucide-react"

import { useOps } from "@/components/ops/ops-shell"
import {
  Btn, Card, Chip, CopyButton, Empty, ErrorState, Field, Input, Modal, Notice, PageHead, Select, SearchBox, SkelRows, Status, Switch, TabBar, cx, useOpsToast,
} from "@/components/ops/ops-ui"
import {
  opsApi, opsErrorMessage, OPS_ROLE_LABEL, OPS_ROLE_TEAM_KINDS, OPS_TEAM_KIND_LABEL,
  type OpsCity, type OpsRoleName, type OpsSetPassword, type OpsStaffRow, type OpsTeam, type OpsTeamKind,
} from "@/lib/api/ops"

function CityPicker({ cities, value, onChange }: { cities: OpsCity[]; value: number[]; onChange: (v: number[]) => void }) {
  return (
    <div>
      <div className="chips" style={{ maxHeight: 148, overflowY: "auto" }}>
        {cities.filter((c) => c.active).map((c) => (
          <Chip key={c.id} on={value.includes(c.id)} onClick={() => onChange(value.includes(c.id) ? value.filter((x) => x !== c.id) : [...value, c.id])}>{c.name}</Chip>
        ))}
      </div>
      <p className="hint" style={{ marginTop: 6 }}>{value.length === 0 ? "No city selected means every city of the team." : `${value.length} selected`}</p>
    </div>
  )
}

/* ------------------------------ staff ------------------------------ */

function LinkModal({ result, onClose }: { result: { name: string; setPassword: OpsSetPassword } | null; onClose: () => void }) {
  const url = result?.setPassword.url ?? ""
  const text = result ? `Assalam o Alaikum ${result.name}, please set your Wedding Wala Ops password here (the link works once and expires in ${result.setPassword.ttlHours} hours): ${url}` : ""
  return (
    <Modal open={!!result} onClose={onClose} title="One-time set-password link" description={result ? `Send this to ${result.name}. They choose their own password; nobody else ever knows it.` : undefined}
      footer={<Btn variant="primary" onClick={onClose}>Done</Btn>}>
      <Notice tone="warn">This link is shown only now and works once. If it is lost, create a new one from the staff list.</Notice>
      <input className="inp" readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="Set-password link" />
      <div className="row">
        <CopyButton text={url} label="Copy link" />
        <a className="btn btn-ghost sm" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden />Send on WhatsApp</a>
      </div>
    </Modal>
  )
}

function AddStaffModal({ open, onClose, teams, cities, onCreated }: {
  open: boolean; onClose: () => void; teams: OpsTeam[]; cities: OpsCity[]; onCreated: (r: { name: string; setPassword: OpsSetPassword }) => void
}) {
  const { me } = useOps()
  const qc = useQueryClient()
  const toast = useOpsToast()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<OpsRoleName>("ops_vendor_agent")
  const [teamId, setTeamId] = useState("")
  const [cityIds, setCityIds] = useState<number[]>([])
  const compatible = useMemo(() => teams.filter((t) => t.active && OPS_ROLE_TEAM_KINDS[role].includes(t.kind)), [teams, role])
  const reset = () => { setFullName(""); setEmail(""); setPhone(""); setRole("ops_vendor_agent"); setTeamId(""); setCityIds([]) }
  const valid = fullName.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(email.trim())

  const create = useMutation({
    mutationFn: () => opsApi.createStaff({ fullName: fullName.trim(), email: email.trim(), phoneNumber: phone.trim() || undefined, opsRole: role, teamId: teamId ? Number(teamId) : undefined, cityIds: teamId ? cityIds : undefined }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["ops", "staff"] }); qc.invalidateQueries({ queryKey: ["ops", "teams"] })
      onCreated({ name: res.user.fullName, setPassword: res.setPassword }); reset(); onClose()
    },
    onError: (e) => toast({ title: "Couldn't add the staff member", body: opsErrorMessage(e), tone: "bad" }),
  })

  return (
    <Modal open={open} onClose={onClose} title="Add a staff member" description="They get a one-time link to set their own password. Sign-in also sends a code to their email."
      footer={<><Btn onClick={onClose}>Cancel</Btn><Btn variant="primary" loading={create.isPending} disabled={!valid} onClick={() => create.mutate()}>Add staff member</Btn></>}>
      <Field label="Full name" htmlFor="st-name" required><Input id="st-name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="off" /></Field>
      <Field label="Email" htmlFor="st-email" required hint="Must be a real inbox: the sign-in code is emailed here."><Input id="st-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" /></Field>
      <Field label="Mobile" htmlFor="st-phone" hint="Optional."><Input id="st-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300 1234567" inputMode="tel" /></Field>
      <Field label="Role" htmlFor="st-role">
        <Select id="st-role" value={role} onChange={(e) => { setRole(e.target.value as OpsRoleName); setTeamId(""); setCityIds([]) }}>
          {(Object.keys(OPS_ROLE_LABEL) as OpsRoleName[]).map((r) => (
            <option key={r} value={r} disabled={r === "ops_manager" && !me.isSuperAdmin}>{OPS_ROLE_LABEL[r]}{r === "ops_manager" && !me.isSuperAdmin ? " (super admin only)" : ""}</option>
          ))}
        </Select>
      </Field>
      <Field label="Team" htmlFor="st-team" hint="Optional. Only teams that fit this role are listed.">
        <Select id="st-team" value={teamId} onChange={(e) => { setTeamId(e.target.value); setCityIds([]) }}>
          <option value="">No team yet</option>
          {compatible.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </Field>
      {teamId && <Field label="Cities they cover"><CityPicker cities={cities} value={cityIds} onChange={setCityIds} /></Field>}
    </Modal>
  )
}

function StaffTab({ teams, cities }: { teams: OpsTeam[]; cities: OpsCity[] }) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  const [search, setSearch] = useState("")
  const [adding, setAdding] = useState(false)
  const [linkResult, setLinkResult] = useState<{ name: string; setPassword: OpsSetPassword } | null>(null)
  const [confirm, setConfirm] = useState<OpsStaffRow | null>(null)
  const staff = useQuery({ queryKey: ["ops", "staff", search], queryFn: () => opsApi.staff({ search: search.trim() || undefined }) })

  const setActive = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => opsApi.updateStaff(id, { active }),
    onSuccess: (_r, v) => { qc.invalidateQueries({ queryKey: ["ops", "staff"] }); toast({ title: v.active ? "Account re-activated" : "Account deactivated and signed out" }); setConfirm(null) },
    onError: (e) => { toast({ title: "Couldn't update the account", body: opsErrorMessage(e), tone: "bad" }); setConfirm(null) },
  })
  const newLink = useMutation({
    mutationFn: (id: number) => opsApi.staffSetPasswordLink(id),
    onSuccess: (r) => setLinkResult({ name: r.user.fullName, setPassword: r.setPassword }),
    onError: (e) => toast({ title: "Couldn't create a link", body: opsErrorMessage(e), tone: "bad" }),
  })

  const rows = staff.data?.staff ?? []
  const seatNames = (s: OpsStaffRow) => s.seats.filter((x) => x.active).map((x) => x.teamName).join(", ") || "No team"
  const actionButtons = (s: OpsStaffRow) => (
    <div className="row" style={{ justifyContent: "flex-end" }}>
      <Btn size="sm" icon={<RefreshCw aria-hidden />} disabled={newLink.isPending} onClick={() => newLink.mutate(s.id)}>New link</Btn>
      {s.active
        ? <Btn size="sm" variant="danger" icon={<UserX aria-hidden />} onClick={() => setConfirm(s)}>Deactivate</Btn>
        : <Btn size="sm" icon={<UserCheck aria-hidden />} disabled={setActive.isPending} onClick={() => setActive.mutate({ id: s.id, active: true })}>Re-activate</Btn>}
    </div>
  )

  return (
    <>
      <div className="toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Search name, email or phone" label="Search staff" />
        <div className="filters"><Btn variant="primary" icon={<Plus aria-hidden />} onClick={() => setAdding(true)}>Add staff member</Btn></div>
      </div>
      <Card flush>
        {staff.isLoading ? <SkelRows />
          : staff.isError ? <ErrorState message={opsErrorMessage(staff.error)} onRetry={() => staff.refetch()} />
          : rows.length === 0 ? <Empty icon={<Users />} title={search ? "No one matches that search" : "No staff yet"}>{search ? "Try a different name, email or number." : "Add your first call-center team member to get started."}</Empty>
          : (
            <>
              <div className="tbl-wrap hide-sm">
                <table className="tbl">
                  <thead><tr><th>Name</th><th>Role</th><th>Team</th><th>Status</th><th className="r">Actions</th></tr></thead>
                  <tbody>
                    {rows.map((s) => (
                      <tr key={s.id}>
                        <td><div className="td-name">{s.fullName}</div><div className="td-sub">{s.email}</div></td>
                        <td>{s.roles.map((r) => <Status key={r} tone="info">{OPS_ROLE_LABEL[r] ?? r}</Status>)}</td>
                        <td className="td-mut">{seatNames(s)}</td>
                        <td>{s.active ? <Status tone="ok">Active</Status> : <Status tone="bad">Deactivated</Status>}</td>
                        <td className="r">{actionButtons(s)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="show-sm">
                {rows.map((s) => (
                  <div key={s.id} className="list-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                    <div className="row between"><div style={{ minWidth: 0 }}><div className="td-name">{s.fullName}</div><div className="td-sub">{s.email}</div></div>{s.active ? <Status tone="ok">Active</Status> : <Status tone="bad">Deactivated</Status>}</div>
                    <div className="row">{s.roles.map((r) => <Status key={r} tone="info">{OPS_ROLE_LABEL[r] ?? r}</Status>)}<span className="small muted">{seatNames(s)}</span></div>
                    {actionButtons(s)}
                  </div>
                ))}
              </div>
            </>
          )}
      </Card>

      <AddStaffModal open={adding} onClose={() => setAdding(false)} teams={teams} cities={cities} onCreated={setLinkResult} />
      <LinkModal result={linkResult} onClose={() => setLinkResult(null)} />
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={`Deactivate ${confirm?.fullName ?? ""}?`}
        description="They are signed out everywhere immediately and cannot sign in again until you re-activate them. Their history stays."
        footer={<><Btn onClick={() => setConfirm(null)}>Keep active</Btn><Btn variant="primary" loading={setActive.isPending} onClick={() => confirm && setActive.mutate({ id: confirm.id, active: false })}>Deactivate</Btn></>} />
    </>
  )
}

/* ------------------------------ teams ------------------------------ */

function TeamCard({ team, staff, cities }: { team: OpsTeam; staff: OpsStaffRow[]; cities: OpsCity[] }) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  const [userId, setUserId] = useState("")
  const [cityIds, setCityIds] = useState<number[]>([])
  const refresh = () => { qc.invalidateQueries({ queryKey: ["ops", "teams"] }); qc.invalidateQueries({ queryKey: ["ops", "staff"] }) }
  const fail = (title: string) => (e: unknown) => toast({ title, body: opsErrorMessage(e), tone: "bad" })

  const toggle = useMutation({ mutationFn: (active: boolean) => opsApi.updateTeam(team.id, { active }), onSuccess: refresh, onError: fail("Couldn't update the team") })
  const seat = useMutation({ mutationFn: () => opsApi.putMember(team.id, { userId: Number(userId), cityIds }), onSuccess: () => { refresh(); setUserId(""); setCityIds([]); toast({ title: "Seat saved" }) }, onError: fail("Couldn't save the seat") })
  const remove = useMutation({ mutationFn: (uid: number) => opsApi.removeMember(team.id, uid), onSuccess: () => { refresh(); toast({ title: "Seat removed" }) }, onError: fail("Couldn't remove the seat") })

  const members = (team.members ?? []).filter((m) => m.active)
  const seated = new Set(members.map((m) => m.userId))
  const candidates = staff.filter((s) => s.active && !seated.has(s.id) && s.roles.some((r) => OPS_ROLE_TEAM_KINDS[r].includes(team.kind)))
  const cityName = (id: number) => cities.find((c) => c.id === id)?.name ?? `City ${id}`

  return (
    <Card
      title={team.name}
      sub={OPS_TEAM_KIND_LABEL[team.kind]}
      actions={<div className="row"><span className="small muted">{team.active ? "Active" : "Inactive"}</span><Switch checked={team.active} onChange={(v) => toggle.mutate(v)} disabled={toggle.isPending} label={`${team.name} active`} /></div>}
      flush
    >
      {members.length === 0 ? <div className="small muted" style={{ padding: "4px 18px 14px" }}>No one is seated on this team yet.</div>
        : members.map((m) => (
          <div key={m.id} className="list-row">
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="td-name">{m.user?.fullName ?? `User ${m.userId}`} {m.memberRole === "lead" && <Status tone="info">Lead</Status>}</div>
              <div className="td-sub">{m.cityIds.length === 0 ? "All cities" : m.cityIds.map(cityName).join(", ")}</div>
            </div>
            <Btn size="sm" disabled={remove.isPending} onClick={() => remove.mutate(m.userId)}>Remove</Btn>
          </div>
        ))}
      {team.active && (
        <div style={{ padding: 18, borderTop: "1px solid var(--border)", display: "grid", gap: 14 }}>
          <Field label="Seat a staff member" htmlFor={`seat-${team.id}`}>
            <Select id={`seat-${team.id}`} value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">Choose…</option>
              {candidates.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
            </Select>
          </Field>
          {userId && <Field label="Cities they cover"><CityPicker cities={cities} value={cityIds} onChange={setCityIds} /></Field>}
          <div><Btn size="sm" variant="primary" disabled={!userId} loading={seat.isPending} onClick={() => seat.mutate()}>Save seat</Btn></div>
        </div>
      )}
    </Card>
  )
}

function TeamsTab({ teams, staff, cities }: { teams: OpsTeam[]; staff: OpsStaffRow[]; cities: OpsCity[] }) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  const [name, setName] = useState("")
  const [kind, setKind] = useState<OpsTeamKind>("vendor_outreach")
  const create = useMutation({
    mutationFn: () => opsApi.createTeam({ name: name.trim(), kind }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ops", "teams"] }); setName(""); toast({ title: "Team created" }) },
    onError: (e) => toast({ title: "Couldn't create the team", body: opsErrorMessage(e), tone: "bad" }),
  })
  return (
    <div className="stack">
      <Card title="New team" sub="Team A calls vendors; Team B handles clients. A team's kind cannot be changed later.">
        <div className="row" style={{ alignItems: "flex-end", gap: 12 }}>
          <Field label="Team name" htmlFor="tm-name" className="grow"><Input id="tm-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lahore vendors" style={{ minWidth: 220 }} /></Field>
          <Field label="Kind" htmlFor="tm-kind">
            <Select id="tm-kind" value={kind} onChange={(e) => setKind(e.target.value as OpsTeamKind)} style={{ minWidth: 220 }}>
              {(Object.keys(OPS_TEAM_KIND_LABEL) as OpsTeamKind[]).map((k) => <option key={k} value={k}>{OPS_TEAM_KIND_LABEL[k]}</option>)}
            </Select>
          </Field>
          <Btn variant="primary" disabled={name.trim().length < 2} loading={create.isPending} onClick={() => create.mutate()}>Create team</Btn>
        </div>
      </Card>
      {teams.length === 0 ? <Card><Empty title="No teams yet">Create Team A and Team B above.</Empty></Card>
        : <div className="grid2">{teams.map((t) => <TeamCard key={t.id} team={t} staff={staff} cities={cities} />)}</div>}
    </div>
  )
}

/* ------------------------------ cities ------------------------------ */

function CitiesTab({ cities }: { cities: OpsCity[] }) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  const [name, setName] = useState("")
  const [province, setProvince] = useState("")
  const refresh = () => qc.invalidateQueries({ queryKey: ["ops", "cities"] })
  const create = useMutation({
    mutationFn: () => opsApi.createCity({ name: name.trim(), province: province.trim() || undefined }),
    onSuccess: () => { refresh(); setName(""); setProvince(""); toast({ title: "City added" }) },
    onError: (e) => toast({ title: "Couldn't add the city", body: opsErrorMessage(e), tone: "bad" }),
  })
  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => opsApi.updateCity(id, { active }),
    onSuccess: refresh,
    onError: (e) => toast({ title: "Couldn't update the city", body: opsErrorMessage(e), tone: "bad" }),
  })
  return (
    <div className="stack">
      <Card title="Add a city" sub="A new city is just a new row: assign agents to it and import a sheet.">
        <div className="row" style={{ alignItems: "flex-end", gap: 12 }}>
          <Field label="City" htmlFor="ct-name"><Input id="ct-name" value={name} onChange={(e) => setName(e.target.value)} style={{ minWidth: 220 }} /></Field>
          <Field label="Province" htmlFor="ct-prov" hint="Optional."><Input id="ct-prov" value={province} onChange={(e) => setProvince(e.target.value)} style={{ minWidth: 220 }} /></Field>
          <Btn variant="primary" disabled={name.trim().length < 2} loading={create.isPending} onClick={() => create.mutate()}>Add city</Btn>
        </div>
      </Card>
      <Card title={`Cities (${cities.length})`} flush>
        <div className="grid3" style={{ padding: 18, gap: 10 }}>
          {cities.map((c) => (
            <div key={c.id} className="list-row" style={{ border: "1px solid var(--border)", borderRadius: 9, background: "var(--surface-2)", padding: "9px 12px" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className={cx("td-name", !c.active && "muted")} style={{ textDecoration: c.active ? undefined : "line-through" }}>{c.name}</div>
                {c.province && <div className="td-sub">{c.province}</div>}
              </div>
              <Switch checked={c.active} onChange={(v) => toggle.mutate({ id: c.id, active: v })} label={`${c.name} active`} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------ screen ------------------------------ */

export function StaffTeamsView() {
  const { can } = useOps()
  const [tab, setTab] = useState<"staff" | "teams" | "cities">("staff")
  const teams = useQuery({ queryKey: ["ops", "teams"], queryFn: opsApi.teams })
  const cities = useQuery({ queryKey: ["ops", "cities"], queryFn: opsApi.cities })
  const allStaff = useQuery({ queryKey: ["ops", "staff", ""], queryFn: () => opsApi.staff() })

  if (!can("ops_settings")) return <Notice tone="warn">This screen is for managers.</Notice>
  if (teams.isLoading || cities.isLoading) return <Card flush><SkelRows rows={8} /></Card>
  if (teams.isError || cities.isError) return <Card><ErrorState message={opsErrorMessage(teams.error ?? cities.error)} onRetry={() => { teams.refetch(); cities.refetch() }} /></Card>

  const teamList = teams.data!.teams
  const cityList = cities.data!.cities
  return (
    <>
      <PageHead title="Staff & teams" sub="Create call-center accounts, seat people on teams, and choose the cities each person covers." />
      <div className="toolbar">
        <TabBar value={tab} onChange={setTab} label="Sections" tabs={[{ value: "staff", label: "Staff" }, { value: "teams", label: "Teams", count: teamList.length }, { value: "cities", label: "Cities", count: cityList.length }]} />
      </div>
      {tab === "staff" && <StaffTab teams={teamList} cities={cityList} />}
      {tab === "teams" && <TeamsTab teams={teamList} staff={allStaff.data?.staff ?? []} cities={cityList} />}
      {tab === "cities" && <CitiesTab cities={cityList} />}
    </>
  )
}
