"use client"

// Staff, teams and cities (manager screen). Every action is a server call that re-checks ops_settings; the screen is
// only shown to people who hold it.
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { MessageCircle, Plus, RefreshCw, UserCheck, UserX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { useOps } from "@/components/ops/ops-shell"
import { Card, CopyButton, Empty, Field, inputCls, Notice, PageHeader, Pill } from "@/components/ops/ops-ui"
import {
  opsApi,
  opsErrorMessage,
  OPS_ROLE_LABEL,
  OPS_ROLE_TEAM_KINDS,
  OPS_TEAM_KIND_LABEL,
  type OpsCity,
  type OpsRoleName,
  type OpsSetPassword,
  type OpsStaffRow,
  type OpsTeam,
  type OpsTeamKind,
} from "@/lib/api/ops"

const press = "transition-all duration-150 active:scale-[0.98]"

function CityPicker({ cities, value, onChange }: { cities: OpsCity[]; value: number[]; onChange: (v: number[]) => void }) {
  const active = cities.filter((c) => c.active)
  return (
    <div>
      <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-md border border-bridal-beige bg-white p-2">
        {active.map((c) => {
          const on = value.includes(c.id)
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((x) => x !== c.id) : [...value, c.id])}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark active:scale-[0.97] ${
                on ? "border-bridal-gold-dark bg-bridal-gold-dark text-white" : "border-bridal-beige bg-bridal-cream text-bridal-text hover:bg-bridal-sand"
              }`}
            >
              {c.name}
            </button>
          )
        })}
      </div>
      <p className="mt-1 text-xs text-bridal-text-soft">{value.length === 0 ? "No city selected = every city of the team." : `${value.length} selected`}</p>
    </div>
  )
}

/* ------------------------------ staff ------------------------------ */

function LinkDialog({ result, onClose }: { result: { name: string; setPassword: OpsSetPassword } | null; onClose: () => void }) {
  if (!result) return null
  const { url, ttlHours } = result.setPassword
  const text = `Assalam o Alaikum ${result.name}, please set your Wedding Wala Ops password here (the link works once and expires in ${ttlHours} hours): ${url}`
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>One-time set-password link</DialogTitle>
          <DialogDescription>Send this to {result.name}. They choose their own password; nobody else ever knows it.</DialogDescription>
        </DialogHeader>
        <Notice tone="warning">This link is shown only now and can be used once. If it is lost, create a new one from the staff list.</Notice>
        <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className={inputCls} aria-label="Set-password link" />
        <div className="flex flex-wrap gap-2">
          <CopyButton text={url} label="Copy link" />
          <Button asChild variant="outline" size="sm" className={`gap-2 ${press}`}>
            <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" aria-hidden /> Send on WhatsApp
            </a>
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className={press}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddStaffDialog({ open, onClose, teams, cities, onCreated }: {
  open: boolean
  onClose: () => void
  teams: OpsTeam[]
  cities: OpsCity[]
  onCreated: (r: { name: string; setPassword: OpsSetPassword }) => void
}) {
  const { me } = useOps()
  const qc = useQueryClient()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState<OpsRoleName>("ops_vendor_agent")
  const [teamId, setTeamId] = useState<string>("")
  const [cityIds, setCityIds] = useState<number[]>([])

  const compatibleTeams = useMemo(
    () => teams.filter((t) => t.active && OPS_ROLE_TEAM_KINDS[role].includes(t.kind)),
    [teams, role],
  )

  const reset = () => {
    setFullName(""); setEmail(""); setPhone(""); setRole("ops_vendor_agent"); setTeamId(""); setCityIds([])
  }

  const create = useMutation({
    mutationFn: () =>
      opsApi.createStaff({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phone.trim() || undefined,
        opsRole: role,
        teamId: teamId ? Number(teamId) : undefined,
        cityIds: teamId ? cityIds : undefined,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["ops", "staff"] })
      qc.invalidateQueries({ queryKey: ["ops", "teams"] })
      onCreated({ name: res.user.fullName, setPassword: res.setPassword })
      reset()
      onClose()
    },
    onError: (e) => toast({ title: "Couldn't add the staff member", description: opsErrorMessage(e), variant: "destructive" }),
  })

  const valid = fullName.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(email.trim())

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a staff member</DialogTitle>
          <DialogDescription>They get a one-time link to set their own password. Sign-in also sends a code to their email.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (valid && !create.isPending) create.mutate()
          }}
        >
          <Field label="Full name" htmlFor="st-name"><input id="st-name" className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="off" /></Field>
          <Field label="Email" htmlFor="st-email" hint="Must be a real inbox: the sign-in code is emailed here."><input id="st-email" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" /></Field>
          <Field label="Mobile (optional)" htmlFor="st-phone"><input id="st-phone" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300 1234567" inputMode="tel" /></Field>
          <Field label="Role" htmlFor="st-role">
            <select id="st-role" className={inputCls} value={role} onChange={(e) => { setRole(e.target.value as OpsRoleName); setTeamId(""); setCityIds([]) }}>
              {(Object.keys(OPS_ROLE_LABEL) as OpsRoleName[]).map((r) => (
                <option key={r} value={r} disabled={r === "ops_manager" && !me.isSuperAdmin}>
                  {OPS_ROLE_LABEL[r]}{r === "ops_manager" && !me.isSuperAdmin ? " (super admin only)" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Team (optional)" htmlFor="st-team" hint="Only teams that fit this role are listed.">
            <select id="st-team" className={inputCls} value={teamId} onChange={(e) => { setTeamId(e.target.value); setCityIds([]) }}>
              <option value="">No team yet</option>
              {compatibleTeams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          {teamId && (
            <Field label="Cities they cover"><CityPicker cities={cities} value={cityIds} onChange={setCityIds} /></Field>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className={press}>Cancel</Button>
            <Button type="submit" disabled={!valid || create.isPending} className={press}>{create.isPending ? "Adding…" : "Add staff member"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StaffTab({ teams, cities }: { teams: OpsTeam[]; cities: OpsCity[] }) {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [adding, setAdding] = useState(false)
  const [linkResult, setLinkResult] = useState<{ name: string; setPassword: OpsSetPassword } | null>(null)
  const [confirm, setConfirm] = useState<OpsStaffRow | null>(null)

  const staff = useQuery({ queryKey: ["ops", "staff", search], queryFn: () => opsApi.staff({ search: search.trim() || undefined }) })

  const setActive = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => opsApi.updateStaff(id, { active }),
    onSuccess: (_r, v) => {
      qc.invalidateQueries({ queryKey: ["ops", "staff"] })
      toast({ title: v.active ? "Account re-activated" : "Account deactivated and signed out" })
      setConfirm(null)
    },
    onError: (e) => { toast({ title: "Couldn't update the account", description: opsErrorMessage(e), variant: "destructive" }); setConfirm(null) },
  })

  const newLink = useMutation({
    mutationFn: (id: number) => opsApi.staffSetPasswordLink(id),
    onSuccess: (r) => setLinkResult({ name: r.user.fullName, setPassword: r.setPassword }),
    onError: (e) => toast({ title: "Couldn't create a link", description: opsErrorMessage(e), variant: "destructive" }),
  })

  return (
    <Card
      title="Staff"
      description="Wedding Wala's own call-center team."
      actions={<Button onClick={() => setAdding(true)} className={`gap-2 ${press}`}><Plus className="h-4 w-4" aria-hidden /> Add staff member</Button>}
    >
      <div className="mb-4 max-w-sm">
        <input className={inputCls} placeholder="Search name, email or phone" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search staff" />
      </div>

      {staff.isLoading ? (
        <p className="py-8 text-center text-sm text-bridal-text-soft">Loading…</p>
      ) : staff.isError ? (
        <Notice tone="danger">{opsErrorMessage(staff.error)}</Notice>
      ) : staff.data!.staff.length === 0 ? (
        <Empty>{search ? "No one matches that search." : "No staff yet. Add your first team member."}</Empty>
      ) : (
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-bridal-beige/70 text-xs uppercase tracking-wide text-bridal-text-label">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Role</th>
                <th className="py-2 pr-4 font-medium">Team</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.data!.staff.map((s) => (
                <tr key={s.id} className="border-b border-bridal-beige/40 align-top last:border-0">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-bridal-charcoal">{s.fullName}</p>
                    <p className="text-xs text-bridal-text-soft">{s.email}</p>
                  </td>
                  <td className="py-3 pr-4">{s.roles.map((r) => <Pill key={r} tone="info">{OPS_ROLE_LABEL[r] ?? r}</Pill>)}</td>
                  <td className="py-3 pr-4 text-bridal-text-soft">
                    {s.seats.filter((x) => x.active).length === 0 ? "—" : s.seats.filter((x) => x.active).map((x) => x.teamName).join(", ")}
                  </td>
                  <td className="py-3 pr-4">{s.active ? <Pill tone="success">Active</Pill> : <Pill tone="danger">Deactivated</Pill>}</td>
                  <td className="py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button variant="outline" size="sm" className={`gap-1.5 ${press}`} disabled={newLink.isPending} onClick={() => newLink.mutate(s.id)}>
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden /> New link
                      </Button>
                      {s.active ? (
                        <Button variant="outline" size="sm" className={`gap-1.5 text-bridal-coral-dark ${press}`} onClick={() => setConfirm(s)}>
                          <UserX className="h-3.5 w-3.5" aria-hidden /> Deactivate
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className={`gap-1.5 ${press}`} disabled={setActive.isPending} onClick={() => setActive.mutate({ id: s.id, active: true })}>
                          <UserCheck className="h-3.5 w-3.5" aria-hidden /> Re-activate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Phones: one card per person, so every action is reachable without sideways scrolling. */}
      {staff.data && staff.data.staff.length > 0 && (
        <ul className="space-y-3 md:hidden" aria-label="Staff">
          {staff.data.staff.map((s) => (
            <li key={s.id} className="rounded-lg border border-bridal-beige/70 bg-bridal-cream/40 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-bridal-charcoal">{s.fullName}</p>
                  <p className="truncate text-xs text-bridal-text-soft">{s.email}</p>
                </div>
                {s.active ? <Pill tone="success">Active</Pill> : <Pill tone="danger">Deactivated</Pill>}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {s.roles.map((r) => <Pill key={r} tone="info">{OPS_ROLE_LABEL[r] ?? r}</Pill>)}
                <span className="text-xs text-bridal-text-soft">
                  {s.seats.filter((x) => x.active).length === 0 ? "No team" : s.seats.filter((x) => x.active).map((x) => x.teamName).join(", ")}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className={`gap-1.5 ${press}`} disabled={newLink.isPending} onClick={() => newLink.mutate(s.id)}>
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden /> New link
                </Button>
                {s.active ? (
                  <Button variant="outline" size="sm" className={`gap-1.5 text-bridal-coral-dark ${press}`} onClick={() => setConfirm(s)}>
                    <UserX className="h-3.5 w-3.5" aria-hidden /> Deactivate
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className={`gap-1.5 ${press}`} disabled={setActive.isPending} onClick={() => setActive.mutate({ id: s.id, active: true })}>
                    <UserCheck className="h-3.5 w-3.5" aria-hidden /> Re-activate
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddStaffDialog open={adding} onClose={() => setAdding(false)} teams={teams} cities={cities} onCreated={setLinkResult} />
      <LinkDialog result={linkResult} onClose={() => setLinkResult(null)} />

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate {confirm?.fullName}?</DialogTitle>
            <DialogDescription>They are signed out everywhere immediately and cannot sign in again until you re-activate them. Their history stays.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)} className={press}>Keep active</Button>
            <Button variant="destructive" disabled={setActive.isPending} onClick={() => confirm && setActive.mutate({ id: confirm.id, active: false })} className={press}>
              {setActive.isPending ? "Deactivating…" : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

/* ------------------------------ teams ------------------------------ */

function TeamCard({ team, staff, cities }: { team: OpsTeam; staff: OpsStaffRow[]; cities: OpsCity[] }) {
  const qc = useQueryClient()
  const [userId, setUserId] = useState("")
  const [cityIds, setCityIds] = useState<number[]>([])
  const invalidate = () => { qc.invalidateQueries({ queryKey: ["ops", "teams"] }); qc.invalidateQueries({ queryKey: ["ops", "staff"] }) }
  const fail = (title: string) => (e: unknown) => toast({ title, description: opsErrorMessage(e), variant: "destructive" })

  const toggle = useMutation({ mutationFn: (active: boolean) => opsApi.updateTeam(team.id, { active }), onSuccess: invalidate, onError: fail("Couldn't update the team") })
  const seat = useMutation({
    mutationFn: () => opsApi.putMember(team.id, { userId: Number(userId), cityIds }),
    onSuccess: () => { invalidate(); setUserId(""); setCityIds([]); toast({ title: "Seat saved" }) },
    onError: fail("Couldn't save the seat"),
  })
  const remove = useMutation({ mutationFn: (uid: number) => opsApi.removeMember(team.id, uid), onSuccess: () => { invalidate(); toast({ title: "Seat removed" }) }, onError: fail("Couldn't remove the seat") })

  const activeMembers = (team.members ?? []).filter((m) => m.active)
  const seatedIds = new Set(activeMembers.map((m) => m.userId))
  const candidates = staff.filter((s) => s.active && !seatedIds.has(s.id) && s.roles.some((r) => OPS_ROLE_TEAM_KINDS[r].includes(team.kind)))
  const cityName = (id: number) => cities.find((c) => c.id === id)?.name ?? `City ${id}`

  return (
    <div className="rounded-xl border border-bridal-beige/70 bg-bridal-cream/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold tracking-tight text-bridal-charcoal">{team.name}</p>
          <p className="text-xs text-bridal-text-soft">{OPS_TEAM_KIND_LABEL[team.kind]}</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-bridal-text">
          <Switch checked={team.active} onCheckedChange={(v) => toggle.mutate(v)} disabled={toggle.isPending} aria-label={`${team.name} active`} />
          {team.active ? "Active" : "Inactive"}
        </label>
      </div>

      <ul className="mt-4 space-y-2">
        {activeMembers.length === 0 && <li className="text-sm text-bridal-text-soft">No one is seated on this team yet.</li>}
        {activeMembers.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
            <div className="min-w-0">
              <p className="font-medium text-bridal-charcoal">{m.user?.fullName ?? `User ${m.userId}`} {m.memberRole === "lead" && <Pill tone="info">Lead</Pill>}</p>
              <p className="text-xs text-bridal-text-soft">{m.cityIds.length === 0 ? "All cities" : m.cityIds.map(cityName).join(", ")}</p>
            </div>
            <Button variant="outline" size="sm" className={press} disabled={remove.isPending} onClick={() => remove.mutate(m.userId)}>Remove</Button>
          </li>
        ))}
      </ul>

      {team.active && (
        <form className="mt-4 space-y-3 border-t border-bridal-beige/60 pt-4" onSubmit={(e) => { e.preventDefault(); if (userId && !seat.isPending) seat.mutate() }}>
          <Field label="Seat a staff member" htmlFor={`seat-${team.id}`}>
            <select id={`seat-${team.id}`} className={inputCls} value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">Choose…</option>
              {candidates.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
            </select>
          </Field>
          {userId && <Field label="Cities they cover"><CityPicker cities={cities} value={cityIds} onChange={setCityIds} /></Field>}
          <Button type="submit" size="sm" disabled={!userId || seat.isPending} className={press}>{seat.isPending ? "Saving…" : "Save seat"}</Button>
        </form>
      )}
    </div>
  )
}

function TeamsTab({ teams, staff, cities }: { teams: OpsTeam[]; staff: OpsStaffRow[]; cities: OpsCity[] }) {
  const qc = useQueryClient()
  const [name, setName] = useState("")
  const [kind, setKind] = useState<OpsTeamKind>("vendor_outreach")
  const create = useMutation({
    mutationFn: () => opsApi.createTeam({ name: name.trim(), kind }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ops", "teams"] }); setName(""); toast({ title: "Team created" }) },
    onError: (e) => toast({ title: "Couldn't create the team", description: opsErrorMessage(e), variant: "destructive" }),
  })

  return (
    <div className="space-y-6">
      <Card title="New team" description="Team A calls vendors; Team B handles clients. A team's kind cannot be changed later.">
        <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); if (name.trim().length >= 2 && !create.isPending) create.mutate() }}>
          <div className="min-w-[200px] flex-1"><Field label="Team name" htmlFor="tm-name"><input id="tm-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lahore vendors" /></Field></div>
          <div className="min-w-[200px]"><Field label="Kind" htmlFor="tm-kind">
            <select id="tm-kind" className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as OpsTeamKind)}>
              {(Object.keys(OPS_TEAM_KIND_LABEL) as OpsTeamKind[]).map((k) => <option key={k} value={k}>{OPS_TEAM_KIND_LABEL[k]}</option>)}
            </select>
          </Field></div>
          <Button type="submit" disabled={name.trim().length < 2 || create.isPending} className={press}>{create.isPending ? "Creating…" : "Create team"}</Button>
        </form>
      </Card>

      {teams.length === 0 ? (
        <Empty>No teams yet. Create Team A and Team B above.</Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {teams.map((t) => <TeamCard key={t.id} team={t} staff={staff} cities={cities} />)}
        </div>
      )}
    </div>
  )
}

/* ------------------------------ cities ------------------------------ */

function CitiesTab({ cities }: { cities: OpsCity[] }) {
  const qc = useQueryClient()
  const [name, setName] = useState("")
  const [province, setProvince] = useState("")
  const refresh = () => qc.invalidateQueries({ queryKey: ["ops", "cities"] })
  const create = useMutation({
    mutationFn: () => opsApi.createCity({ name: name.trim(), province: province.trim() || undefined }),
    onSuccess: () => { refresh(); setName(""); setProvince(""); toast({ title: "City added" }) },
    onError: (e) => toast({ title: "Couldn't add the city", description: opsErrorMessage(e), variant: "destructive" }),
  })
  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => opsApi.updateCity(id, { active }),
    onSuccess: refresh,
    onError: (e) => toast({ title: "Couldn't update the city", description: opsErrorMessage(e), variant: "destructive" }),
  })

  return (
    <div className="space-y-6">
      <Card title="Add a city" description="A new city is just a new row: assign agents to it and import a sheet.">
        <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); if (name.trim().length >= 2 && !create.isPending) create.mutate() }}>
          <div className="min-w-[200px] flex-1"><Field label="City" htmlFor="ct-name"><input id="ct-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field></div>
          <div className="min-w-[200px] flex-1"><Field label="Province (optional)" htmlFor="ct-prov"><input id="ct-prov" className={inputCls} value={province} onChange={(e) => setProvince(e.target.value)} /></Field></div>
          <Button type="submit" disabled={name.trim().length < 2 || create.isPending} className={press}>{create.isPending ? "Adding…" : "Add city"}</Button>
        </form>
      </Card>
      <Card title={`Cities (${cities.length})`}>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-bridal-beige/60 bg-bridal-cream/40 px-3 py-2 text-sm">
              <span className="min-w-0">
                <span className={`block truncate font-medium ${c.active ? "text-bridal-charcoal" : "text-bridal-text-soft line-through"}`}>{c.name}</span>
                {c.province && <span className="block truncate text-xs text-bridal-text-soft">{c.province}</span>}
              </span>
              <Switch checked={c.active} onCheckedChange={(v) => toggle.mutate({ id: c.id, active: v })} aria-label={`${c.name} active`} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

/* ------------------------------ screen ------------------------------ */

export function StaffTeamsView() {
  const { can } = useOps()
  const teams = useQuery({ queryKey: ["ops", "teams"], queryFn: opsApi.teams })
  const cities = useQuery({ queryKey: ["ops", "cities"], queryFn: opsApi.cities })
  // The full (unfiltered) staff list feeds the team seat pickers; the Staff tab runs its own searchable query.
  const allStaff = useQuery({ queryKey: ["ops", "staff", ""], queryFn: () => opsApi.staff() })

  if (!can("ops_settings")) {
    return <Notice tone="warning">This screen is for managers.</Notice>
  }
  if (teams.isLoading || cities.isLoading) return <p className="py-12 text-center text-sm text-bridal-text-soft">Loading…</p>
  if (teams.isError || cities.isError) return <Notice tone="danger">{opsErrorMessage(teams.error ?? cities.error)}</Notice>

  const teamList = teams.data!.teams
  const cityList = cities.data!.cities

  return (
    <>
      <PageHeader title="Staff & teams" subtitle="Create call-center accounts, seat people on teams, and choose the cities each person covers." />
      <Tabs defaultValue="staff" className="space-y-6">
        <TabsList>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="cities">Cities</TabsTrigger>
        </TabsList>
        <TabsContent value="staff"><StaffTab teams={teamList} cities={cityList} /></TabsContent>
        <TabsContent value="teams"><TeamsTab teams={teamList} staff={allStaff.data?.staff ?? []} cities={cityList} /></TabsContent>
        <TabsContent value="cities"><CitiesTab cities={cityList} /></TabsContent>
      </Tabs>
    </>
  )
}
