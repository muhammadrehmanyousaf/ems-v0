"use client"

/**
 * Profile-content manager (Track C) — the editor for the rich listing fields that
 * existed as columns since vendor-registration-v2 but had NO post-signup editor
 * anywhere: owner/bio, years, weddings, languages, awards, press, insurance,
 * payment methods, WhatsApp, working hours, service cities, dietary options, and
 * the full venue pack (type, capacity granularity, amenities, compliance, outside
 * vendors). Every field is accepted by PATCH /businesses/user-business/:id
 * (updateBusiness — profile-content block). Self-contained save, like the other
 * redesigned managers. Renders inside the settings hub's "Listing content" tab.
 */

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { BusinessesAPI, type ApiBusiness } from "@/lib/api/dashboard"
import { Icon, Spinner, type IconName } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const inputCls =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-ring focus-visible:ring-2"
const labelCls = "text-xs font-medium text-muted-foreground"

const LANGUAGES = ["Urdu", "English", "Punjabi", "Pashto", "Sindhi", "Saraiki", "Balochi", "Hindko", "Kashmiri", "Brahui", "Arabic"]
const DIETARY = [
  ["halal", "Halal"], ["vegetarian", "Vegetarian"], ["vegan", "Vegan"], ["jain", "Jain"],
  ["dry", "Dry (no alcohol)"], ["gluten-free", "Gluten-free"], ["nut-free", "Nut-free"],
] as const
const VENUE_TYPES = [
  ["", "Not a venue"], ["wedding_lawn", "Wedding lawn"], ["marriage_hall", "Marriage hall"],
  ["banquet_hall", "Banquet hall"], ["marquee", "Marquee"], ["farmhouse", "Farmhouse"],
  ["four_star", "4-star hotel"], ["five_star", "5-star hotel"], ["rooftop", "Rooftop"],
  ["beach", "Beach"], ["private_estate", "Private estate"], ["masjid", "Masjid"],
] as const
const VENUE_AMENITIES = [
  ["bridal_suite", "Bridal suite"], ["grooms_room", "Groom's room"], ["imam_room", "Imam room"],
  ["vip_lounge", "VIP lounge"], ["kids_area", "Kids area"], ["prayer_hall", "Prayer hall"],
  ["wudu_area", "Wudu area"], ["valet", "Valet parking"], ["generator_backup", "Generator backup"],
  ["parking_covered", "Covered parking"], ["wheelchair_access", "Wheelchair access"],
] as const
const DAYS: [string, string][] = [
  ["mon", "Monday"], ["tue", "Tuesday"], ["wed", "Wednesday"], ["thu", "Thursday"],
  ["fri", "Friday"], ["sat", "Saturday"], ["sun", "Sunday"],
]
const isHHMM = (s: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s)
const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s) || 0)

type Award = { title: string; year?: number | null }
type PressItem = { title: string; url?: string }
type DayState = { open: string; close: string; closed: boolean }

export function ProfileContentManager({ business, onSaved }: { business: ApiBusiness; onSaved?: () => void }) {
  const b = business
  const [ownerName, setOwnerName] = React.useState(b.ownerName ?? "")
  const [ownerBio, setOwnerBio] = React.useState(b.ownerBio ?? "")
  const [years, setYears] = React.useState(b.yearsInBusiness != null ? String(b.yearsInBusiness) : "")
  const [weddings, setWeddings] = React.useState(b.weddingsCompleted != null ? String(b.weddingsCompleted) : "")
  const [languages, setLanguages] = React.useState<string[]>(Array.isArray(b.languagesSpoken) ? b.languagesSpoken : [])
  const [hasInsurance, setHasInsurance] = React.useState(Boolean(b.hasInsurance))
  const [backup, setBackup] = React.useState(b.backupArrangement ?? "")
  const [awards, setAwards] = React.useState<Award[]>(Array.isArray(b.awards) ? b.awards : [])
  const [press, setPress] = React.useState<PressItem[]>(Array.isArray(b.press) ? b.press : [])

  const [cash, setCash] = React.useState(Boolean(b.acceptsCash))
  const [bank, setBank] = React.useState(Boolean(b.acceptsBankTransfer))
  const [taxInvoice, setTaxInvoice] = React.useState(Boolean(b.providesTaxInvoice))
  const [whatsapp, setWhatsapp] = React.useState(b.whatsappNumber ?? "")

  const [cities, setCities] = React.useState<string[]>(Array.isArray(b.cityCovered) ? b.cityCovered : [])
  const [cityDraft, setCityDraft] = React.useState("")
  const [guestLabel, setGuestLabel] = React.useState(b.guestCountLabel ?? "")
  const [dietary, setDietary] = React.useState<string[]>(Array.isArray(b.dietaryOptions) ? b.dietaryOptions : [])
  const [hours, setHours] = React.useState<Record<string, DayState>>(() => {
    const out: Record<string, DayState> = {}
    for (const [key] of DAYS) {
      const v = b.workingHours?.[key]
      out[key] = { open: v?.open ?? "", close: v?.close ?? "", closed: v?.closed === true }
    }
    return out
  })

  const [venueType, setVenueType] = React.useState(b.venueType ?? "")
  const [caps, setCaps] = React.useState<Record<string, string>>({
    comfortCapacity: b.comfortCapacity != null ? String(b.comfortCapacity) : "",
    seatedCapacity: b.seatedCapacity != null ? String(b.seatedCapacity) : "",
    standingCapacity: b.standingCapacity != null ? String(b.standingCapacity) : "",
    indoorCapacity: b.indoorCapacity != null ? String(b.indoorCapacity) : "",
    outdoorCapacity: b.outdoorCapacity != null ? String(b.outdoorCapacity) : "",
  })
  const [amenities, setAmenities] = React.useState<string[]>(Array.isArray(b.amenitiesJson) ? b.amenitiesJson : [])
  const [legalCap, setLegalCap] = React.useState(b.legalGuestCap != null ? String(b.legalGuestCap) : "")
  const [closing, setClosing] = React.useState(b.eventClosingTime ?? "")
  const [oneDish, setOneDish] = React.useState(Boolean(b.oneDishPolicy))
  const [outsideAllowed, setOutsideAllowed] = React.useState(Boolean(b.outsideVendorsAllowed))
  const [outsideFee, setOutsideFee] = React.useState(b.outsideVendorFee != null ? String(b.outsideVendorFee) : "")
  const [requiresPermit, setRequiresPermit] = React.useState(Boolean(b.requiresPermit))
  const [permitUrl, setPermitUrl] = React.useState(b.permitChecklistUrl ?? "")

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const addCity = () => {
    const c = cityDraft.trim()
    if (c && !cities.some((x) => x.toLowerCase() === c.toLowerCase())) setCities([...cities, c])
    setCityDraft("")
  }

  const save = useMutation({
    mutationFn: () => {
      // Validate the shaped fields client-side (the server 400s otherwise).
      const wh: Record<string, { open?: string; close?: string; closed?: boolean }> = {}
      for (const [key] of DAYS) {
        const d = hours[key]
        if (d.closed) wh[key] = { closed: true }
        else if (d.open || d.close) {
          if (!isHHMM(d.open) || !isHHMM(d.close)) throw new Error(`Working hours for ${key.toUpperCase()} must be HH:MM (24-hour).`)
          wh[key] = { open: d.open, close: d.close }
        }
      }
      if (closing.trim() && !isHHMM(closing.trim())) throw new Error("Event closing time must be HH:MM (24-hour).")

      const payload: Partial<ApiBusiness> = {
        ownerName: ownerName.trim() || null,
        ownerBio: ownerBio.trim() || null,
        backupArrangement: backup.trim() || null,
        yearsInBusiness: numOrNull(years),
        weddingsCompleted: numOrNull(weddings),
        languagesSpoken: languages,
        hasInsurance,
        awards: awards.map((a) => ({ title: (a.title ?? "").trim(), year: a.year ?? null })).filter((a) => a.title),
        press: press.map((p) => ({ title: (p.title ?? "").trim(), url: (p.url ?? "").trim() })).filter((p) => p.title),
        acceptsCash: cash,
        acceptsBankTransfer: bank,
        providesTaxInvoice: taxInvoice,
        whatsappNumber: whatsapp.trim() || null,
        cityCovered: cities,
        guestCountLabel: guestLabel.trim() || null,
        dietaryOptions: dietary,
        workingHours: Object.keys(wh).length ? wh : null,
        venueType,
        comfortCapacity: numOrNull(caps.comfortCapacity),
        seatedCapacity: numOrNull(caps.seatedCapacity),
        standingCapacity: numOrNull(caps.standingCapacity),
        indoorCapacity: numOrNull(caps.indoorCapacity),
        outdoorCapacity: numOrNull(caps.outdoorCapacity),
        amenitiesJson: amenities,
        legalGuestCap: numOrNull(legalCap),
        eventClosingTime: closing.trim() || null,
        oneDishPolicy: oneDish,
        outsideVendorsAllowed: outsideAllowed,
        outsideVendorFee: numOrNull(outsideFee),
        requiresPermit,
        permitChecklistUrl: permitUrl.trim() || null,
      }
      return BusinessesAPI.update(b.id, payload)
    },
    onSuccess: () => { toast.success("Listing content saved"); onSaved?.() },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  })

  return (
    <div className="space-y-6">
      <Group icon="ShieldCheck" title="About & credibility" desc="Owner story, experience and trust signals couples look for.">
        <Field label="Owner / lead name"><input className={inputCls} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} /></Field>
        <Field label="About the owner"><textarea className={cn(inputCls, "h-24 resize-y py-2")} value={ownerBio} onChange={(e) => setOwnerBio(e.target.value)} placeholder="A short bio shown in your listing's team area" /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Years in business"><input type="number" className={inputCls} value={years} onChange={(e) => setYears(e.target.value)} /></Field>
          <Field label="Weddings completed"><input type="number" className={inputCls} value={weddings} onChange={(e) => setWeddings(e.target.value)} /></Field>
        </div>
        <Field label="Languages spoken">
          <ChipRow options={LANGUAGES.map((l) => [l, l])} selected={languages} onToggle={(v) => toggle(languages, setLanguages, v)} />
        </Field>
        <SwitchRow label="Carries event / equipment insurance" checked={hasInsurance} onChange={setHasInsurance} />
        <Field label="Backup arrangement"><textarea className={cn(inputCls, "h-20 resize-y py-2")} value={backup} onChange={(e) => setBackup(e.target.value)} placeholder="What happens if something goes wrong on the day" /></Field>
        <Repeater
          label="Awards & recognition"
          rows={awards}
          onAdd={() => setAwards([...awards, { title: "", year: null }])}
          onRemove={(i) => setAwards(awards.filter((_, j) => j !== i))}
          render={(a, i) => (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px]">
              <input className={inputCls} placeholder="Award title" value={a.title} onChange={(e) => setAwards(awards.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              <input className={inputCls} type="number" placeholder="Year" value={a.year ?? ""} onChange={(e) => setAwards(awards.map((x, j) => (j === i ? { ...x, year: e.target.value ? Number(e.target.value) : null } : x)))} />
            </div>
          )}
        />
        <Repeater
          label="Press & features"
          rows={press}
          onAdd={() => setPress([...press, { title: "", url: "" }])}
          onRemove={(i) => setPress(press.filter((_, j) => j !== i))}
          render={(p, i) => (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input className={inputCls} placeholder="Publication / title" value={p.title} onChange={(e) => setPress(press.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              <input className={inputCls} placeholder="https://…" value={p.url ?? ""} onChange={(e) => setPress(press.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
            </div>
          )}
        />
      </Group>

      <Group icon="CreditCard" title="Payments & tax" desc="How couples can pay and reach you.">
        <SwitchRow label="Accepts cash" checked={cash} onChange={setCash} />
        <SwitchRow label="Accepts bank transfer" checked={bank} onChange={setBank} />
        <SwitchRow label="Can provide a tax invoice" checked={taxInvoice} onChange={setTaxInvoice} />
        <Field label="WhatsApp number (bookings)"><input className={inputCls} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="03xx-xxxxxxx" /></Field>
      </Group>

      <Group icon="MapPin" title="Service area & hours" desc="Where you work, when you're open, and what you cater.">
        <Field label="Cities you cover">
          <div className="flex gap-2">
            <input className={inputCls} value={cityDraft} onChange={(e) => setCityDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCity() } }} placeholder="Add a city and press Enter" />
            <Button type="button" variant="outline" size="sm" onClick={addCity}>Add</Button>
          </div>
          {cities.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {cities.map((c) => (
                <button key={c} type="button" onClick={() => setCities(cities.filter((x) => x !== c))} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs hover:bg-muted">
                  {c} <Icon name="X" size={11} />
                </button>
              ))}
            </div>
          )}
        </Field>
        <Field label="Working hours">
          <div className="space-y-2">
            {DAYS.map(([key, label]) => {
              const d = hours[key]
              return (
                <div key={key} className="flex flex-wrap items-center gap-2">
                  <span className="w-24 text-sm">{label}</span>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Switch checked={!d.closed} onCheckedChange={(v) => setHours({ ...hours, [key]: { ...d, closed: !v } })} /> Open
                  </label>
                  {!d.closed && (
                    <>
                      <input className={cn(inputCls, "w-24")} placeholder="10:00" value={d.open} onChange={(e) => setHours({ ...hours, [key]: { ...d, open: e.target.value } })} />
                      <span className="text-muted-foreground">–</span>
                      <input className={cn(inputCls, "w-24")} placeholder="22:00" value={d.close} onChange={(e) => setHours({ ...hours, [key]: { ...d, close: e.target.value } })} />
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </Field>
        <Field label="Dietary options">
          <ChipRow options={DIETARY.map(([v, l]) => [v, l])} selected={dietary} onToggle={(v) => toggle(dietary, setDietary, v)} />
        </Field>
        <Field label="Booking unit label"><input className={inputCls} value={guestLabel} onChange={(e) => setGuestLabel(e.target.value)} placeholder="e.g. per event, per 100 guests, per day" /></Field>
      </Group>

      <Group icon="Building2" title="Venue & capacity" desc="For venues and spaces — the realistic numbers couples compare on.">
        <Field label="Venue type">
          <select className={inputCls} value={venueType} onChange={(e) => setVenueType(e.target.value)}>
            {VENUE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Guest capacity">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {(["comfortCapacity", "seatedCapacity", "standingCapacity", "indoorCapacity", "outdoorCapacity"] as const).map((k) => (
              <div key={k}>
                <span className="mb-1 block text-[11px] capitalize text-muted-foreground">{k.replace("Capacity", "")}</span>
                <input type="number" className={inputCls} value={caps[k]} onChange={(e) => setCaps({ ...caps, [k]: e.target.value })} />
              </div>
            ))}
          </div>
        </Field>
        <Field label="Venue amenities">
          <ChipRow options={VENUE_AMENITIES.map(([v, l]) => [v, l])} selected={amenities} onToggle={(v) => toggle(amenities, setAmenities, v)} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Legal guest cap"><input type="number" className={inputCls} value={legalCap} onChange={(e) => setLegalCap(e.target.value)} /></Field>
          <Field label="Event closing time"><input className={inputCls} value={closing} onChange={(e) => setClosing(e.target.value)} placeholder="23:00" /></Field>
        </div>
        <SwitchRow label="One-dish policy applies" checked={oneDish} onChange={setOneDish} />
        <SwitchRow label="Event needs a permit" checked={requiresPermit} onChange={setRequiresPermit} />
        {requiresPermit && <Field label="Permit checklist link"><input className={inputCls} value={permitUrl} onChange={(e) => setPermitUrl(e.target.value)} placeholder="https://…" /></Field>}
        <SwitchRow label="Couples may bring outside vendors" checked={outsideAllowed} onChange={setOutsideAllowed} />
        {outsideAllowed && <Field label="Outside-vendor fee (Rs)"><input type="number" className={inputCls} value={outsideFee} onChange={(e) => setOutsideFee(e.target.value)} placeholder="e.g. 50000" /></Field>}
      </Group>

      <div className="flex justify-end">
        <Button disabled={save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? <><Spinner size={14} className="mr-1.5" /> Saving…</> : <><Icon name="CheckCircle2" size={15} className="mr-1.5" /> Save listing content</>}
        </Button>
      </div>
    </div>
  )
}

function Group({ icon, title, desc, children }: { icon: IconName; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon name={icon} size={16} /></span>
        <div><h2 className="text-sm font-semibold">{title}</h2><p className="text-xs text-muted-foreground">{desc}</p></div>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label className={labelCls}>{label}</label>{children}</div>
}

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5 hover:bg-accent/50">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </label>
  )
}

function ChipRow({ options, selected, onToggle }: { options: (readonly [string, string])[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([value, label]) => {
        const on = selected.includes(value)
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function Repeater<T>({ label, rows, onAdd, onRemove, render }: {
  label: string
  rows: T[]
  onAdd: () => void
  onRemove: (i: number) => void
  render: (row: T, i: number) => React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className={labelCls}>{label}</label>
      {rows.map((row, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1">{render(row, i)}</div>
          <button type="button" onClick={() => onRemove(i)} className="mt-1 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Remove"><Icon name="Trash2" size={14} /></button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={onAdd}><Icon name="Plus" size={14} className="mr-1" /> Add</Button>
    </div>
  )
}

export default ProfileContentManager
