"use client"

// Ops settings and the call-outcome picklist (dispositions). Everyone in ops can read them; only ops_settings can
// change them, and the server validates every value (a 0-minute lease, say, is refused there, not here).
import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { useOps } from "@/components/ops/ops-shell"
import { Card, inputCls, Notice, PageHeader, Pill } from "@/components/ops/ops-ui"
import {
  opsApi,
  opsErrorMessage,
  type OpsDisposition,
  type OpsSettingKey,
  type OpsSettingsMap,
} from "@/lib/api/ops"

const press = "transition-all duration-150 active:scale-[0.98]"

const GO_LIVE_LABELS: Record<string, string> = {
  name: "Business name",
  vendorType: "Vendor type",
  city: "City",
  area: "Area",
  phone: "A valid phone",
  whatsapp: "WhatsApp number",
  ownerName: "Owner's name",
  subBusinessType: "Business sub-type",
  description: "Description",
  image: "At least one image",
  logo: "Logo",
  priceOrMenu: "A price or a menu",
  capacity: "Capacity",
}

function useSave(key: OpsSettingKey) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (value: unknown) => opsApi.putSetting(key, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ops", "settings"] })
      toast({ title: "Setting saved" })
    },
    onError: (e) => toast({ title: "Couldn't save the setting", description: opsErrorMessage(e), variant: "destructive" }),
  })
}

function NumberInput({ id, value, onChange, min, max, step = 1, suffix }: {
  id: string
  value: number
  onChange: (n: number) => void
  min: number
  max: number
  step?: number
  suffix?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        className={`${inputCls} max-w-[8rem]`}
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
      />
      {suffix && <span className="text-sm text-bridal-text-soft">{suffix}</span>}
    </div>
  )
}

function Row({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-bridal-beige/40 py-3 last:border-0">
      <div className="min-w-0 max-w-md">
        <label htmlFor={htmlFor} className="text-sm font-medium text-bridal-charcoal">{label}</label>
        {hint && <p className="mt-0.5 text-xs leading-relaxed text-bridal-text-soft">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

function SaveBar({ dirty, pending, canEdit, onSave, onReset }: { dirty: boolean; pending: boolean; canEdit: boolean; onSave: () => void; onReset: () => void }) {
  if (!canEdit) return <p className="mt-3 text-xs text-bridal-text-soft">Read only. Ask a manager to change this.</p>
  return (
    <div className="mt-4 flex gap-2">
      <Button size="sm" disabled={!dirty || pending} onClick={onSave} className={press}>{pending ? "Saving…" : "Save"}</Button>
      <Button size="sm" variant="outline" disabled={!dirty || pending} onClick={onReset} className={press}>Discard</Button>
    </div>
  )
}

/* ---------- one card per setting (each keeps its own draft) ---------- */

function GoLiveCard({ entry, canEdit }: { entry: OpsSettingsMap["go_live_minimum"]; canEdit: boolean }) {
  const save = useSave("go_live_minimum")
  const [req, setReq] = useState(entry.value.required)
  const [extra, setExtra] = useState(entry.value.venueExtra)
  useEffect(() => { setReq(entry.value.required); setExtra(entry.value.venueExtra) }, [entry])
  const dirty = JSON.stringify([[...req].sort(), [...extra].sort()]) !== JSON.stringify([[...entry.value.required].sort(), [...entry.value.venueExtra].sort()])
  const flip = (list: string[], set: (v: string[]) => void, k: string) => set(list.includes(k) ? list.filter((x) => x !== k) : [...list, k])

  // A plain render helper (not a nested component): a component defined here would remount on every render.
  const group = (title: string, list: string[], set: (v: string[]) => void) => (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-bridal-charcoal">{title}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.keys(GO_LIVE_LABELS).map((k) => (
          <label key={k} className="flex items-center gap-2 text-sm text-bridal-text">
            <input type="checkbox" className="h-4 w-4 rounded border-bridal-beige accent-bridal-gold-dark" disabled={!canEdit} checked={list.includes(k)} onChange={() => flip(list, set, k)} />
            {GO_LIVE_LABELS[k]}
          </label>
        ))}
      </div>
    </fieldset>
  )

  return (
    <Card title="Minimum to go live" description="A staff-onboarded listing goes public immediately, so it must have at least this. Below it, onboarding is refused.">
      <div className="space-y-5">
        {group("Every vendor", req, setReq)}
        {group("Venues also need", extra, setExtra)}
      </div>
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
  const pending = saveRetry.isPending || saveCap.isPending || saveLease.isPending

  const saveAll = () => {
    if (noAnswer !== r.noAnswer || switchedOff !== r.switchedOff) saveRetry.mutate({ noAnswer, switchedOff })
    if (attempts !== c.attempts || minDays !== c.minDays) saveCap.mutate({ attempts, minDays })
    if (lease !== l) saveLease.mutate(lease)
  }

  return (
    <Card title="Calling rules" description="How retries, attempt limits and the call lock behave for Team A.">
      <Row label="Retry after no answer" htmlFor="s-noanswer" hint="1 to 72 hours."><NumberInput id="s-noanswer" value={noAnswer} onChange={setNoAnswer} min={1} max={72} suffix="hours" /></Row>
      <Row label="Retry after switched off" htmlFor="s-off" hint="1 to 168 hours."><NumberInput id="s-off" value={switchedOff} onChange={setSwitchedOff} min={1} max={168} suffix="hours" /></Row>
      <Row label="Attempts before review" htmlFor="s-attempts" hint="After this many tries with no contact, a lead reviews the prospect instead of calling forever."><NumberInput id="s-attempts" value={attempts} onChange={setAttempts} min={1} max={20} suffix="attempts" /></Row>
      <Row label="…over at least" htmlFor="s-mindays"><NumberInput id="s-mindays" value={minDays} onChange={setMinDays} min={0} max={30} suffix="days" /></Row>
      <Row label="Call lock" htmlFor="s-lease" hint="While one agent has a prospect open, nobody else gets it."><NumberInput id="s-lease" value={lease} onChange={setLease} min={1} max={120} suffix="minutes" /></Row>
      <SaveBar dirty={dirty} pending={pending} canEdit={canEdit} onSave={saveAll}
        onReset={() => { setNoAnswer(r.noAnswer); setSwitchedOff(r.switchedOff); setAttempts(c.attempts); setMinDays(c.minDays); setLease(l) }} />
    </Card>
  )
}

function QualityCard({ settings, canEdit }: { settings: OpsSettingsMap; canEdit: boolean }) {
  const saveQa = useSave("qa_percent")
  const saveTtl = useSave("set_password_ttl_hours")
  const qa = settings.qa_percent.value
  const ttl = settings.set_password_ttl_hours.value
  const [qaDraft, setQa] = useState(qa)
  const [ttlDraft, setTtl] = useState(ttl)
  useEffect(() => setQa(qa), [qa])
  useEffect(() => setTtl(ttl), [ttl])
  const dirty = qaDraft !== qa || ttlDraft !== ttl
  return (
    <Card title="Quality and access" description="Spot-checks on new listings and how long a set-password link works.">
      <Row label="Share of new onboardings sent to a QA review" htmlFor="s-qa" hint="A second look at a random sample. It never blocks a listing from going live."><NumberInput id="s-qa" value={qaDraft} onChange={setQa} min={0} max={100} step={0.5} suffix="%" /></Row>
      <Row label="Set-password link lifetime" htmlFor="s-ttl" hint="For staff accounts you create. 1 to 720 hours."><NumberInput id="s-ttl" value={ttlDraft} onChange={setTtl} min={1} max={720} suffix="hours" /></Row>
      <SaveBar dirty={dirty} pending={saveQa.isPending || saveTtl.isPending} canEdit={canEdit}
        onSave={() => { if (qaDraft !== qa) saveQa.mutate(qaDraft); if (ttlDraft !== ttl) saveTtl.mutate(ttlDraft) }}
        onReset={() => { setQa(qa); setTtl(ttl) }} />
    </Card>
  )
}

/* ---------- dispositions ---------- */

function DispositionRow({ d, canEdit }: { d: OpsDisposition; canEdit: boolean }) {
  const qc = useQueryClient()
  const [label, setLabel] = useState(d.label)
  const [labelUr, setLabelUr] = useState(d.labelUr ?? "")
  const [cb, setCb] = useState(d.requiresCallback)
  const [reason, setReason] = useState(d.requiresReason)
  const [active, setActive] = useState(d.active)
  useEffect(() => { setLabel(d.label); setLabelUr(d.labelUr ?? ""); setCb(d.requiresCallback); setReason(d.requiresReason); setActive(d.active) }, [d])

  const dirty = label !== d.label || labelUr !== (d.labelUr ?? "") || cb !== d.requiresCallback || reason !== d.requiresReason || active !== d.active
  const save = useMutation({
    mutationFn: () => opsApi.updateDisposition(d.id, { label: label.trim(), labelUr: labelUr.trim() || null, requiresCallback: cb, requiresReason: reason, active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ops", "dispositions"] }); toast({ title: "Disposition saved" }) },
    onError: (e) => { toast({ title: "Couldn't save", description: opsErrorMessage(e), variant: "destructive" }); setActive(d.active) },
  })

  return (
    <tr className="border-b border-bridal-beige/40 align-top last:border-0">
      <td className="py-3 pr-3">
        <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} disabled={!canEdit} aria-label={`${d.code} label`} />
        <p className="mt-1 text-xs text-bridal-text-soft">{d.code} → {d.targetStatus}{d.isTerminal && " (final)"}</p>
      </td>
      <td className="py-3 pr-3"><input className={inputCls} value={labelUr} onChange={(e) => setLabelUr(e.target.value)} disabled={!canEdit} aria-label={`${d.code} Urdu label`} dir="auto" /></td>
      <td className="py-3 pr-3 text-center"><Switch checked={cb} onCheckedChange={setCb} disabled={!canEdit} aria-label={`${d.code} needs a callback time`} /></td>
      <td className="py-3 pr-3 text-center"><Switch checked={reason} onCheckedChange={setReason} disabled={!canEdit} aria-label={`${d.code} needs a reason`} /></td>
      <td className="py-3 pr-3 text-center"><Switch checked={active} onCheckedChange={setActive} disabled={!canEdit} aria-label={`${d.code} in use`} /></td>
      <td className="py-3 text-right">{canEdit && <Button size="sm" disabled={!dirty || save.isPending || label.trim().length < 2} onClick={() => save.mutate()} className={press}>{save.isPending ? "Saving…" : "Save"}</Button>}</td>
    </tr>
  )
}

function DispositionsCard({ canEdit }: { canEdit: boolean }) {
  const q = useQuery({ queryKey: ["ops", "dispositions"], queryFn: opsApi.dispositions })
  return (
    <Card title="Call outcomes" description="The short list agents choose from after every call. Wording and behaviour can change; the code and where it moves a prospect cannot. At least 5 must stay in use.">
      {q.isLoading ? <p className="py-6 text-center text-sm text-bridal-text-soft">Loading…</p>
        : q.isError ? <Notice tone="danger">{opsErrorMessage(q.error)}</Notice>
        : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-bridal-beige/70 text-xs uppercase tracking-wide text-bridal-text-label">
                  <th className="py-2 pr-3 font-medium">English</th>
                  <th className="py-2 pr-3 font-medium">Urdu / Roman Urdu</th>
                  <th className="py-2 pr-3 text-center font-medium">Callback time</th>
                  <th className="py-2 pr-3 text-center font-medium">Reason</th>
                  <th className="py-2 pr-3 text-center font-medium">In use</th>
                  <th className="py-2" />
                </tr>
              </thead>
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
      <PageHeader
        title="Settings"
        subtitle="The rules the call center runs on."
        actions={!canEdit ? <Pill tone="warning">Read only</Pill> : undefined}
      />
      {q.isLoading ? <p className="py-12 text-center text-sm text-bridal-text-soft">Loading…</p>
        : q.isError ? <Notice tone="danger">{opsErrorMessage(q.error)}</Notice>
        : (
          <div className="space-y-6">
            <GoLiveCard entry={q.data!.settings.go_live_minimum} canEdit={canEdit} />
            <CallingCard settings={q.data!.settings} canEdit={canEdit} />
            <QualityCard settings={q.data!.settings} canEdit={canEdit} />
            <DispositionsCard canEdit={canEdit} />
          </div>
        )}
    </>
  )
}
