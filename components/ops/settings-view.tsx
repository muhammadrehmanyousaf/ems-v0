"use client"

// Ops settings and the call-outcome picklist (dispositions). Everyone in ops can read them; only ops_settings can change
// them, and the server validates every value (a 0-minute lease, say, is refused there, not here).
import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useOps } from "@/components/ops/ops-shell"
import { Btn, Card, ErrorState, Input, PageHead, SkelRows, Status, Switch, useOpsToast } from "@/components/ops/ops-ui"
import { opsApi, opsErrorMessage, type OpsDisposition, type OpsSettingKey, type OpsSettingsMap } from "@/lib/api/ops"

const GO_LIVE_LABELS: Record<string, string> = {
  name: "Business name", vendorType: "Vendor type", city: "City", area: "Area", phone: "A valid phone", whatsapp: "WhatsApp number",
  ownerName: "Owner's name", subBusinessType: "Business sub-type", description: "Description", image: "At least one image", logo: "Logo",
  priceOrMenu: "A price or a menu", capacity: "Capacity",
}

function useSave(key: OpsSettingKey) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  return useMutation({
    mutationFn: (value: unknown) => opsApi.putSetting(key, value),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ops", "settings"] }); toast({ title: "Setting saved" }) },
    onError: (e) => toast({ title: "Couldn't save the setting", body: opsErrorMessage(e), tone: "bad" }),
  })
}

function NumberInput({ id, value, onChange, min, max, step = 1, suffix }: { id: string; value: number; onChange: (n: number) => void; min: number; max: number; step?: number; suffix?: string }) {
  return (
    <div className="row" style={{ flexWrap: "nowrap" }}>
      <Input id={id} type="number" inputMode="decimal" className="num" style={{ width: 112 }} value={Number.isFinite(value) ? value : ""} min={min} max={max} step={step}
        onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))} />
      {suffix && <span className="small muted">{suffix}</span>}
    </div>
  )
}

function Row({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="row between" style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ maxWidth: 460 }}>
        <label htmlFor={htmlFor} className="lbl">{label}</label>
        {hint && <p className="hint" style={{ marginTop: 3, fontSize: 12, color: "var(--ink-3)" }}>{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function SaveBar({ dirty, pending, canEdit, onSave, onReset }: { dirty: boolean; pending: boolean; canEdit: boolean; onSave: () => void; onReset: () => void }) {
  if (!canEdit) return <p className="small muted" style={{ marginTop: 14 }}>Read only. Ask a manager to change this.</p>
  return (
    <div className="row" style={{ marginTop: 16 }}>
      <Btn size="sm" variant="primary" disabled={!dirty} loading={pending} onClick={onSave}>Save</Btn>
      <Btn size="sm" disabled={!dirty || pending} onClick={onReset}>Discard</Btn>
    </div>
  )
}

function GoLiveCard({ entry, canEdit }: { entry: OpsSettingsMap["go_live_minimum"]; canEdit: boolean }) {
  const save = useSave("go_live_minimum")
  const [req, setReq] = useState(entry.value.required)
  const [extra, setExtra] = useState(entry.value.venueExtra)
  useEffect(() => { setReq(entry.value.required); setExtra(entry.value.venueExtra) }, [entry])
  const same = (a: string[], b: string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort())
  const dirty = !same(req, entry.value.required) || !same(extra, entry.value.venueExtra)
  const flip = (list: string[], set: (v: string[]) => void, k: string) => set(list.includes(k) ? list.filter((x) => x !== k) : [...list, k])
  const group = (title: string, list: string[], set: (v: string[]) => void) => (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="lbl" style={{ marginBottom: 8 }}>{title}</legend>
      <div className="grid2" style={{ gap: 4 }}>
        {Object.keys(GO_LIVE_LABELS).map((k) => (
          <label key={k} className="check"><input type="checkbox" disabled={!canEdit} checked={list.includes(k)} onChange={() => flip(list, set, k)} />{GO_LIVE_LABELS[k]}</label>
        ))}
      </div>
    </fieldset>
  )
  return (
    <Card title="Minimum to go live" sub="A staff-onboarded listing goes public immediately, so it must have at least this. Below it, onboarding is refused.">
      <div className="stack" style={{ gap: 20 }}>{group("Every vendor", req, setReq)}{group("Venues also need", extra, setExtra)}</div>
      <SaveBar dirty={dirty} pending={save.isPending} canEdit={canEdit} onSave={() => save.mutate({ required: req, venueExtra: extra })} onReset={() => { setReq(entry.value.required); setExtra(entry.value.venueExtra) }} />
    </Card>
  )
}

function CallingCard({ settings, canEdit }: { settings: OpsSettingsMap; canEdit: boolean }) {
  const saveRetry = useSave("retry_hours")
  const saveCap = useSave("attempt_cap")
  const saveLease = useSave("lease_minutes")
  const r = settings.retry_hours.value
  const c = settings.attempt_cap.value
  const l = settings.lease_minutes.value
  const [noAnswer, setNoAnswer] = useState(r.noAnswer)
  const [switchedOff, setSwitchedOff] = useState(r.switchedOff)
  const [attempts, setAttempts] = useState(c.attempts)
  const [minDays, setMinDays] = useState(c.minDays)
  const [lease, setLease] = useState(l)
  useEffect(() => { setNoAnswer(r.noAnswer); setSwitchedOff(r.switchedOff) }, [r.noAnswer, r.switchedOff])
  useEffect(() => { setAttempts(c.attempts); setMinDays(c.minDays) }, [c.attempts, c.minDays])
  useEffect(() => setLease(l), [l])
  const dirty = noAnswer !== r.noAnswer || switchedOff !== r.switchedOff || attempts !== c.attempts || minDays !== c.minDays || lease !== l
  const saveAll = () => {
    if (noAnswer !== r.noAnswer || switchedOff !== r.switchedOff) saveRetry.mutate({ noAnswer, switchedOff })
    if (attempts !== c.attempts || minDays !== c.minDays) saveCap.mutate({ attempts, minDays })
    if (lease !== l) saveLease.mutate(lease)
  }
  return (
    <Card title="Calling rules" sub="How retries, attempt limits and the call lock behave for Team A.">
      <Row label="Retry after no answer" hint="1 to 72 hours." htmlFor="s-noanswer"><NumberInput id="s-noanswer" value={noAnswer} onChange={setNoAnswer} min={1} max={72} suffix="hours" /></Row>
      <Row label="Retry after switched off" hint="1 to 168 hours." htmlFor="s-off"><NumberInput id="s-off" value={switchedOff} onChange={setSwitchedOff} min={1} max={168} suffix="hours" /></Row>
      <Row label="Attempts before review" hint="After this many tries with no contact, a lead reviews the prospect instead of calling forever." htmlFor="s-attempts"><NumberInput id="s-attempts" value={attempts} onChange={setAttempts} min={1} max={20} suffix="attempts" /></Row>
      <Row label="…over at least" htmlFor="s-mindays"><NumberInput id="s-mindays" value={minDays} onChange={setMinDays} min={0} max={30} suffix="days" /></Row>
      <Row label="Call lock" hint="While one agent has a prospect open, nobody else gets it." htmlFor="s-lease"><NumberInput id="s-lease" value={lease} onChange={setLease} min={1} max={120} suffix="minutes" /></Row>
      <SaveBar dirty={dirty} pending={saveRetry.isPending || saveCap.isPending || saveLease.isPending} canEdit={canEdit} onSave={saveAll}
        onReset={() => { setNoAnswer(r.noAnswer); setSwitchedOff(r.switchedOff); setAttempts(c.attempts); setMinDays(c.minDays); setLease(l) }} />
    </Card>
  )
}

function ClientDeskCard({ settings, canEdit }: { settings: OpsSettingsMap; canEdit: boolean }) {
  const save = useSave("client_sla")
  const v = settings.client_sla.value
  const [first, setFirst] = useState(v.firstResponseMinutes)
  const [action, setAction] = useState(v.assignmentActionHours)
  useEffect(() => { setFirst(v.firstResponseMinutes); setAction(v.assignmentActionHours) }, [v.firstResponseMinutes, v.assignmentActionHours])
  return (
    <Card title="Client desk response times" sub="How quickly a client should hear back, and how soon a vendor manager should start checking venues.">
      <Row label="First reply to a new client" hint="From the moment they exist (a website inquiry: from when they asked) to the first logged call or message. 1 to 1,440 minutes." htmlFor="s-first"><NumberInput id="s-first" value={first} onChange={setFirst} min={1} max={1440} suffix="minutes" /></Row>
      <Row label="Vendor manager's first check" hint="From being handed a shortlist to the first recorded result. 1 to 168 hours." htmlFor="s-action"><NumberInput id="s-action" value={action} onChange={setAction} min={1} max={168} suffix="hours" /></Row>
      <SaveBar dirty={first !== v.firstResponseMinutes || action !== v.assignmentActionHours} pending={save.isPending} canEdit={canEdit}
        onSave={() => save.mutate({ firstResponseMinutes: first, assignmentActionHours: action })} onReset={() => { setFirst(v.firstResponseMinutes); setAction(v.assignmentActionHours) }} />
    </Card>
  )
}

function QualityCard({ settings, canEdit }: { settings: OpsSettingsMap; canEdit: boolean }) {
  const saveQa = useSave("qa_percent")
  const saveTtl = useSave("set_password_ttl_hours")
  const saveChase = useSave("consent_chase_hours")
  const qa = settings.qa_percent.value
  const ttl = settings.set_password_ttl_hours.value
  const chase = settings.consent_chase_hours.value
  const [qaDraft, setQa] = useState(qa)
  const [ttlDraft, setTtl] = useState(ttl)
  const [chaseDraft, setChase] = useState(chase)
  useEffect(() => setQa(qa), [qa])
  useEffect(() => setTtl(ttl), [ttl])
  useEffect(() => setChase(chase), [chase])
  return (
    <Card title="Quality and access" sub="Spot-checks on new listings and how long a set-password link works.">
      <Row label="Share of new onboardings sent to a QA review" hint="A second look at a random sample. It never blocks a listing from going live." htmlFor="s-qa"><NumberInput id="s-qa" value={qaDraft} onChange={setQa} min={0} max={100} step={0.5} suffix="%" /></Row>
      <Row label="Wait before chasing a written consent" hint="A live listing with only a spoken yes after this long is shown in Quality for a written confirmation. 1 to 720 hours." htmlFor="s-chase"><NumberInput id="s-chase" value={chaseDraft} onChange={setChase} min={1} max={720} suffix="hours" /></Row>
      <Row label="Set-password link lifetime" hint="For staff accounts you create. 1 to 720 hours." htmlFor="s-ttl"><NumberInput id="s-ttl" value={ttlDraft} onChange={setTtl} min={1} max={720} suffix="hours" /></Row>
      <SaveBar dirty={qaDraft !== qa || ttlDraft !== ttl || chaseDraft !== chase} pending={saveQa.isPending || saveTtl.isPending || saveChase.isPending} canEdit={canEdit}
        onSave={() => { if (qaDraft !== qa) saveQa.mutate(qaDraft); if (ttlDraft !== ttl) saveTtl.mutate(ttlDraft); if (chaseDraft !== chase) saveChase.mutate(chaseDraft) }} onReset={() => { setQa(qa); setTtl(ttl); setChase(chase) }} />
    </Card>
  )
}

function DispositionRow({ d, canEdit }: { d: OpsDisposition; canEdit: boolean }) {
  const qc = useQueryClient()
  const toast = useOpsToast()
  const [label, setLabel] = useState(d.label)
  const [labelUr, setLabelUr] = useState(d.labelUr ?? "")
  const [cb, setCb] = useState(d.requiresCallback)
  const [reason, setReason] = useState(d.requiresReason)
  const [active, setActive] = useState(d.active)
  useEffect(() => { setLabel(d.label); setLabelUr(d.labelUr ?? ""); setCb(d.requiresCallback); setReason(d.requiresReason); setActive(d.active) }, [d])
  const dirty = label !== d.label || labelUr !== (d.labelUr ?? "") || cb !== d.requiresCallback || reason !== d.requiresReason || active !== d.active
  const save = useMutation({
    mutationFn: () => opsApi.updateDisposition(d.id, { label: label.trim(), labelUr: labelUr.trim() || null, requiresCallback: cb, requiresReason: reason, active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ops", "dispositions"] }); toast({ title: "Call outcome saved" }) },
    onError: (e) => { toast({ title: "Couldn't save", body: opsErrorMessage(e), tone: "bad" }); setActive(d.active) },
  })
  return (
    <tr>
      <td style={{ minWidth: 220 }}><Input compact value={label} onChange={(e) => setLabel(e.target.value)} disabled={!canEdit} aria-label={`${d.code} label`} /><div className="td-sub">{d.code} → {d.targetStatus}{d.isTerminal && " (final)"}</div></td>
      <td style={{ minWidth: 200 }}><Input compact value={labelUr} onChange={(e) => setLabelUr(e.target.value)} disabled={!canEdit} aria-label={`${d.code} Urdu label`} dir="auto" /></td>
      <td className="nw" style={{ textAlign: "center" }}><Switch checked={cb} onChange={setCb} disabled={!canEdit} label={`${d.code} needs a callback time`} /></td>
      <td className="nw" style={{ textAlign: "center" }}><Switch checked={reason} onChange={setReason} disabled={!canEdit} label={`${d.code} needs a reason`} /></td>
      <td className="nw" style={{ textAlign: "center" }}><Switch checked={active} onChange={setActive} disabled={!canEdit} label={`${d.code} in use`} /></td>
      <td className="r nw">{canEdit && <Btn size="sm" variant="primary" disabled={!dirty || label.trim().length < 2} loading={save.isPending} onClick={() => save.mutate()}>Save</Btn>}</td>
    </tr>
  )
}

function DispositionsCard({ canEdit }: { canEdit: boolean }) {
  const q = useQuery({ queryKey: ["ops", "dispositions"], queryFn: opsApi.dispositions })
  return (
    <Card title="Call outcomes" sub="The short list agents choose from after every call. Wording and behaviour can change; the code and where it moves a prospect cannot. At least 5 must stay in use." flush>
      {q.isLoading ? <SkelRows rows={6} /> : q.isError ? <ErrorState message={opsErrorMessage(q.error)} onRetry={() => q.refetch()} /> : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>English</th><th>Urdu / Roman Urdu</th><th style={{ textAlign: "center" }}>Callback time</th><th style={{ textAlign: "center" }}>Reason</th><th style={{ textAlign: "center" }}>In use</th><th /></tr></thead>
            <tbody>{q.data!.dispositions.map((d) => <DispositionRow key={d.id} d={d} canEdit={canEdit} />)}</tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export function SettingsView() {
  const { can } = useOps()
  const canEdit = can("ops_settings")
  const q = useQuery({ queryKey: ["ops", "settings"], queryFn: opsApi.settings })
  return (
    <>
      <PageHead title="Settings" sub="The rules the call center runs on." actions={!canEdit ? <Status tone="warn">Read only</Status> : undefined} />
      {q.isLoading ? <Card flush><SkelRows rows={8} /></Card> : q.isError ? <Card><ErrorState message={opsErrorMessage(q.error)} onRetry={() => q.refetch()} /></Card> : (
        <div className="stack">
          <GoLiveCard entry={q.data!.settings.go_live_minimum} canEdit={canEdit} />
          <div className="grid2" style={{ alignItems: "start" }}>
            <CallingCard settings={q.data!.settings} canEdit={canEdit} />
            <QualityCard settings={q.data!.settings} canEdit={canEdit} />
          </div>
          <ClientDeskCard settings={q.data!.settings} canEdit={canEdit} />
          <DispositionsCard canEdit={canEdit} />
        </div>
      )}
    </>
  )
}
