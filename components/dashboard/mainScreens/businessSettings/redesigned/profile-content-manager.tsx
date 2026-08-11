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
import { errorMessage } from "@/lib/utils/api-error"
import { useMutation } from "@tanstack/react-query"
import { BusinessesAPI, type ApiBusiness } from "@/lib/api/dashboard"
import { Icon, Spinner, type IconName } from "@/components/dashboard/shared/icon"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  FieldError,
  fieldAria,
  ERROR_INPUT_CLS,
  validatePkPhone,
  validateEmail,
} from "@/components/dashboard/primitives/field-error"

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
  // Air conditioning was in none of the amenity surfaces — not this list, not
  // the Amenities & services switches, not the backend whitelist — while the
  // onboarding checklist's own copy for this very item read "AC, generator
  // backup, bridal room — these are what a listing is compared on". The vendor
  // was told AC is what couples compare on and given nowhere to say they have
  // it. Added to Business.AMENITY_KEYS in the same change, since the server
  // silently drops slugs it does not recognise.
  ["air_conditioning", "Air conditioning"],
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
/**
 * A past client who will vouch for this vendor. Shape is the server's, from
 * `validateReferences` — max 5 rows, and a row needs a name OR a contact to
 * survive normalisation.
 */
type Reference = { customerName: string; weddingDate?: string | null; contact?: string }
const MAX_REFERENCES = 5
type DayState = { open: string; close: string; closed: boolean }

export function ProfileContentManager({
  business, onSaved, onDirtyChange,
}: {
  business: ApiBusiness
  onSaved?: () => void
  /**
   * WWL-484 — this tab keeps its own state and its own save button, outside the
   * hub's `dirty` flag, so the business switcher's unsaved-changes guard could
   * not see edits made here and carried them away without asking. Reported up
   * so one guard covers the whole hub.
   */
  onDirtyChange?: (dirty: boolean) => void
}) {
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
  const [references, setReferences] = React.useState<Reference[]>(Array.isArray(b.references) ? b.references : [])

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

  /**
   * Field validation for this tab.
   *
   * Everything here was a bare text box. The two that matter most are the
   * WhatsApp number — the channel almost every Pakistani enquiry arrives on,
   * worth 5 checklist points — and the permit link, which is published to
   * couples. A bad value in either does not error; it publishes something
   * broken and the vendor never finds out.
   *
   * The closing time already had a check, but only inside the save handler,
   * where it surfaces as a toast AFTER the click. Shown against the field
   * instead, so it is answerable before the request is made.
   */
  const whatsappErr = whatsapp.trim() ? validatePkPhone(whatsapp, { label: "WhatsApp number", required: false }) : undefined
  const closingErr = closing.trim() && !isHHMM(closing.trim()) ? "Use a 24-hour time, e.g. 23:00." : undefined
  const permitUrlErr = (() => {
    const raw = permitUrl.trim()
    if (!raw) return undefined
    try {
      const u = new URL(raw)
      if (u.protocol !== "https:" && u.protocol !== "http:") return "Paste a full web address, starting with https://"
    } catch {
      return "Paste a full web address, starting with https://"
    }
    return undefined
  })()
  const referenceErrs = references.map((r) => {
    const c = (r.contact ?? "").trim()
    if (!c) return undefined
    return c.includes("@")
      ? validateEmail(c, { label: "Contact" })
      : validatePkPhone(c, { label: "Contact", required: false })
  })
  const hasBlockingError =
    !!whatsappErr || !!closingErr || !!permitUrlErr || referenceErrs.some(Boolean)

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  const addCity = () => {
    const c = cityDraft.trim()
    if (c && !cities.some((x) => x.toLowerCase() === c.toLowerCase())) setCities([...cities, c])
    setCityDraft("")
  }

  /**
   * Dirty tracking for ~30 independent pieces of state. Comparing a serialised
   * snapshot against the one taken at mount is both cheaper and less
   * error-prone than threading a setter through every control — and it cannot
   * drift when a field is added, which a hand-maintained flag would.
   *
   * The component is keyed on the business id by the hub, so "at mount" is
   * always this business's loaded values.
   */
  const snapshot = JSON.stringify([
    ownerName, ownerBio, years, weddings, languages, hasInsurance, backup, awards, press, references,
    cash, bank, taxInvoice, whatsapp, cities, guestLabel, dietary, hours,
    venueType, caps, amenities, legalCap, closing, oneDish, outsideAllowed, outsideFee,
    requiresPermit, permitUrl,
  ])
  const savedSnapshot = React.useRef<string | null>(null)
  if (savedSnapshot.current === null) savedSnapshot.current = snapshot
  const dirty = snapshot !== savedSnapshot.current
  React.useEffect(() => { onDirtyChange?.(dirty) }, [dirty, onDirtyChange])
  React.useEffect(() => () => onDirtyChange?.(false), [onDirtyChange])

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
        /* Rows with neither a name nor a contact are dropped here rather than
           sent — the server drops them anyway (validateReferences), and a row
           that vanishes on save without explanation is worse than one that was
           never sent. */
        references: references
          .map((r) => ({
            customerName: (r.customerName ?? "").trim(),
            weddingDate: (r.weddingDate ?? "") || null,
            contact: (r.contact ?? "").trim(),
          }))
          .filter((r) => r.customerName || r.contact)
          .slice(0, MAX_REFERENCES),
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
    onSuccess: () => {
      // What is on screen is now what is stored, so the guard should stand down.
      savedSnapshot.current = snapshot
      onDirtyChange?.(false)
      toast.success("Listing content saved")
      onSaved?.()
    },
    // Surface the SERVER's reason, not axios's wrapper.
    //
    // This read `e?.message`, which for an axios error is the useless string
    // "Request failed with status code 400". Verified live: saving this tab
    // with weddingsCompleted = -10 shows the vendor exactly that, while the
    // API had actually replied
    //   "WeddingsCompleted must be a whole number between 0 and 200000"
    // — a message that says precisely what to fix. Same defect the main save
    // bar had; this manager was missed at the time.
    onError: (e: any) =>
      toast.error(
        errorMessage(e, "Couldn't save your listing content."),
        { duration: 8000 },
      ),
  })

  return (
    <div className="space-y-6">
      <Group icon="ShieldCheck" title="About & credibility" desc="Owner story, experience and trust signals couples look for.">
        <Field id="lc-owner-name" label="Owner / lead name"><input id="lc-owner-name" className={inputCls} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} /></Field>
        <Field id="lc-owner-bio" label="About the owner"><textarea id="lc-owner-bio" className={cn(inputCls, "h-24 resize-y py-2")} value={ownerBio} onChange={(e) => setOwnerBio(e.target.value)} placeholder="A short bio shown in your listing's team area" /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/*
            Verified live: saving weddingsCompleted = -10 round-tripped to a 400
            ("WeddingsCompleted must be a whole number between 0 and 200000").
            The earlier fix here made that message legible; these bounds stop the
            trip being made at all. Same floor as type-specific-manager.
          */}
          <Field id="lc-years" label="Years in business"><input id="lc-years" type="number" min={0} max={200} step={1} inputMode="numeric" className={inputCls} value={years} onChange={(e) => setYears(e.target.value)} /></Field>
          <Field id="lc-weddings" label="Weddings completed"><input id="lc-weddings" type="number" min={0} max={200000} step={1} inputMode="numeric" className={inputCls} value={weddings} onChange={(e) => setWeddings(e.target.value)} /></Field>
        </div>
        <Field group label="Languages spoken">
          <ChipRow id="lc-languages" options={LANGUAGES.map((l) => [l, l])} selected={languages} onToggle={(v) => toggle(languages, setLanguages, v)} />
        </Field>
        <SwitchRow label="Carries event / equipment insurance" checked={hasInsurance} onChange={setHasInsurance} />
        <Field label="Backup arrangement"><textarea className={cn(inputCls, "h-20 resize-y py-2")} value={backup} onChange={(e) => setBackup(e.target.value)} placeholder="What happens if something goes wrong on the day" /></Field>
        <Repeater
          id="lc-awards"
          label="Awards & recognition"
          rows={awards}
          onAdd={() => setAwards([...awards, { title: "", year: null }])}
          onRemove={(i) => setAwards(awards.filter((_, j) => j !== i))}
          render={(a, i) => (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px]">
              <input className={inputCls} placeholder="Award title" value={a.title} onChange={(e) => setAwards(awards.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              {/* A year, not a count — min 0 would be meaningless, so bound it to real ones. */}
              <input className={inputCls} type="number" min={1900} max={new Date().getFullYear() + 1} step={1} inputMode="numeric" placeholder="Year" value={a.year ?? ""} onChange={(e) => setAwards(awards.map((x, j) => (j === i ? { ...x, year: e.target.value ? Number(e.target.value) : null } : x)))} />
            </div>
          )}
        />
        <Repeater
          id="lc-press"
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
        {/**
          * Reference customers.
          *
          * The completeness checklist has scored this at 3 points and told
          * vendors to "add a reference customer" since VR-050 — and there was
          * nowhere in the product to do it. The column is written once, at
          * registration, and `updateBusiness` never whitelisted it, so even a
          * hand-crafted PATCH was dropped. Live, all 3,331 businesses have
          * `references` NULL: not a single vendor has ever cleared this item,
          * because it was not clearable.
          *
          * Editor here, `references` added to the update whitelist server-side,
          * and the checklist item now links to this exact block.
          *
          * Contact validation is deliberately dual-format: a reference contact
          * in Pakistan is a mobile number far more often than an email, and
          * refusing one to insist on the other would just make vendors put the
          * number in the name field.
          */}
        <Repeater
          id="lc-references"
          label="Reference customers"
          hint="Families who would recommend you if a couple asked. Shown to nobody publicly — we use them to verify you."
          empty="No references yet. One family who will vouch for you is worth more than a paragraph of description."
          rows={references}
          max={MAX_REFERENCES}
          addLabel="Add a reference"
          onAdd={() => setReferences([...references, { customerName: "", weddingDate: null, contact: "" }])}
          onRemove={(i) => setReferences(references.filter((_, j) => j !== i))}
          render={(r, i) => {
            const contact = (r.contact ?? "").trim()
            const contactErr = contact
              ? (contact.includes("@")
                  ? validateEmail(contact, { label: "Contact" })
                  : validatePkPhone(contact, { label: "Contact", required: false }))
              : undefined
            return (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_150px_1fr]">
                <input
                  className={inputCls}
                  placeholder="Customer name"
                  value={r.customerName}
                  onChange={(e) => setReferences(references.map((x, j) => (j === i ? { ...x, customerName: e.target.value } : x)))}
                />
                <input
                  className={inputCls}
                  type="date"
                  aria-label="Wedding date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={r.weddingDate ?? ""}
                  onChange={(e) => setReferences(references.map((x, j) => (j === i ? { ...x, weddingDate: e.target.value || null } : x)))}
                />
                <div>
                  <input
                    id={`lc-ref-contact-${i}`}
                    className={cn(inputCls, contactErr && ERROR_INPUT_CLS)}
                    placeholder="0300 1234567 or email"
                    value={r.contact ?? ""}
                    onChange={(e) => setReferences(references.map((x, j) => (j === i ? { ...x, contact: e.target.value } : x)))}
                    {...fieldAria(`lc-ref-contact-${i}`, contactErr)}
                  />
                  <FieldError id={`lc-ref-contact-${i}`} message={contactErr} />
                </div>
              </div>
            )
          }}
        />
      </Group>

      <Group icon="CreditCard" title="Payments & tax" desc="How couples can pay and reach you.">
        <SwitchRow label="Accepts cash" checked={cash} onChange={setCash} />
        <SwitchRow label="Accepts bank transfer" checked={bank} onChange={setBank} />
        <SwitchRow label="Can provide a tax invoice" checked={taxInvoice} onChange={setTaxInvoice} />
        {/**
          * The WhatsApp number is worth 5 points on the checklist and is where
          * almost every Pakistani enquiry actually lands — and it was a bare
          * text box with no type, no inputMode and no validation. A typo here
          * does not fail loudly; it publishes a number that never rings, and
          * the vendor concludes the marketplace sends no enquiries.
          */}
        <Field id="lc-whatsapp" label="WhatsApp number (bookings)" hint="This is the number couples message from your public listing.">
          <input
            id="lc-whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={cn(inputCls, whatsappErr && ERROR_INPUT_CLS)}
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="03xx-xxxxxxx"
            {...fieldAria("lc-whatsapp", whatsappErr)}
          />
          <FieldError id="lc-whatsapp" message={whatsappErr} />
        </Field>
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
                <input type="number" min={0} step={1} inputMode="numeric" className={inputCls} value={caps[k]} onChange={(e) => setCaps({ ...caps, [k]: e.target.value })} />
              </div>
            ))}
          </div>
        </Field>
        <Field group label="Venue amenities">
          <ChipRow id="lc-amenities" options={VENUE_AMENITIES.map(([v, l]) => [v, l])} selected={amenities} onToggle={(v) => toggle(amenities, setAmenities, v)} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Legal guest cap"><input type="number" min={0} step={1} inputMode="numeric" className={inputCls} value={legalCap} onChange={(e) => setLegalCap(e.target.value)} /></Field>
          <Field id="lc-closing" label="Event closing time">
            <input
              id="lc-closing"
              className={cn(inputCls, closingErr && ERROR_INPUT_CLS)}
              value={closing}
              onChange={(e) => setClosing(e.target.value)}
              placeholder="23:00"
              {...fieldAria("lc-closing", closingErr)}
            />
            <FieldError id="lc-closing" message={closingErr} />
          </Field>
        </div>
        <SwitchRow label="One-dish policy applies" checked={oneDish} onChange={setOneDish} />
        <SwitchRow label="Event needs a permit" checked={requiresPermit} onChange={setRequiresPermit} />
        {requiresPermit && (
          <Field id="lc-permit" label="Permit checklist link">
            <input
              id="lc-permit"
              type="url"
              inputMode="url"
              className={cn(inputCls, permitUrlErr && ERROR_INPUT_CLS)}
              value={permitUrl}
              onChange={(e) => setPermitUrl(e.target.value)}
              placeholder="https://…"
              {...fieldAria("lc-permit", permitUrlErr)}
            />
            <FieldError id="lc-permit" message={permitUrlErr} />
          </Field>
        )}
        <SwitchRow label="Couples may bring outside vendors" checked={outsideAllowed} onChange={setOutsideAllowed} />
        {outsideAllowed && <Field label="Outside-vendor fee (Rs)"><input type="number" min={0} step="any" inputMode="decimal" className={inputCls} value={outsideFee} onChange={(e) => setOutsideFee(e.target.value)} placeholder="e.g. 50000" /></Field>}
      </Group>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {/* A disabled Save that says nothing reads as a broken button — the
            same defect FieldError exists to fix. */}
        {hasBlockingError && (
          <span className="text-xs text-destructive">Fix the highlighted fields above to save.</span>
        )}
        <Button disabled={save.isPending || hasBlockingError} onClick={() => save.mutate()}>
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

/**
 * `id` is the anchor the onboarding checklist deep-links to
 * (`?tab=listing&field=lc-whatsapp`) AND the label's `htmlFor`. Both were
 * missing: none of the thirty labels in this form was associated with its
 * input, so a screen reader announced an unlabelled textbox and a click on the
 * label did nothing. Optional, because the group headings that carry no single
 * control still use this wrapper.
 */
function Field({ id, label, hint, group, children }: {
  id?: string
  label: string
  hint?: string
  /** A set of controls rather than one — chips, switches. `htmlFor` has nothing
   *  single to point at, so it announces as a labelled group instead. */
  group?: boolean
  children: React.ReactNode
}) {
  if (group) {
    return (
      <div className="space-y-1.5" role="group" aria-label={label}>
        <span className={cn(labelCls, "block")}>{label}</span>
        {children}
        {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
      </div>
    )
  }
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={labelCls}>{label}</label>
      {children}
      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  )
}

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5 hover:bg-accent/50">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </label>
  )
}

function ChipRow({ id, options, selected, onToggle }: { id?: string; options: (readonly [string, string])[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div id={id} className="flex flex-wrap gap-1.5">
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

function Repeater<T>({ id, label, hint, rows, onAdd, onRemove, render, max, addLabel, empty }: {
  id?: string
  label: string
  hint?: string
  rows: T[]
  onAdd: () => void
  onRemove: (i: number) => void
  render: (row: T, i: number) => React.ReactNode
  /** Server-enforced ceiling. Hiding Add at the limit beats a 400 after typing. */
  max?: number
  addLabel?: string
  /** Shown when there are no rows — a bare Add button says nothing about why. */
  empty?: string
}) {
  const atMax = max != null && rows.length >= max
  return (
    <div className="space-y-2" id={id}>
      <label className={labelCls}>{label}</label>
      {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
      {rows.length === 0 && empty && (
        <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">{empty}</p>
      )}
      {rows.map((row, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1">{render(row, i)}</div>
          <button type="button" onClick={() => onRemove(i)} className="mt-1 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Remove"><Icon name="Trash2" size={14} /></button>
        </div>
      ))}
      {atMax ? (
        <p className="text-[11px] text-muted-foreground">{max} is the maximum.</p>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={onAdd}><Icon name="Plus" size={14} className="mr-1" /> {addLabel ?? "Add"}</Button>
      )}
    </div>
  )
}

export default ProfileContentManager
