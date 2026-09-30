"use client"

/**
 * WW-REQUIREMENTS — "anything else we should know?"
 *
 * The booking flow had no free-text field anywhere. Not one textarea. So every
 * real instruction a Pakistani family has went to WhatsApp:
 *
 *   "Baraat will be late, around 9 — please hold dinner"
 *   "Meri saas diabetic hain, unke liye sugar-free kheer chahiye"
 *   "Ladies section ko fully parda chahiye, koi waiter andar na jaye"
 *   "We're bringing mithai from Rehmat-e-Shereen ourselves"
 *
 * No form will ever enumerate these, so the box is the point and the quick
 * picks are the scaffolding around it — not the other way round.
 *
 * The dietary counts are here because several of them are MONEY: children under
 * 5 and 5–12, and drivers and staff needing meals, feed the settlement
 * arithmetic directly. A family saying "450, but 18 are under five" is stating
 * a price, not a preference, and capturing that as prose would leave both the
 * kitchen and the bill guessing.
 *
 * Nothing here is required. A step that blocks on being filled in would just be
 * filled in with a full stop.
 *
 * Layout (spec §7.5): an accordion, one section open at a time — Quick picks
 * (open by default), Guests & dietary, Setup & furniture — and the free-text
 * box always visible underneath. Collapsed headers preview what was entered
 * and count the answers, so nothing typed disappears when a section folds.
 * The shell renders the heading; entrance is CSS stagger (the old framer
 * variants mounted every block at opacity 0).
 */

import { useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useBookingShell } from "@/components/booking/shell/booking-shell-context"
import {
  REQUIREMENT_TAGS,
  REQUIREMENT_TAG_LABELS,
  type RequirementTag,
  type RequirementDietary,
  type RequirementSetup,
} from "@/lib/api/requirements"

export interface RequirementsDraft {
  tags: RequirementTag[]
  dietary: RequirementDietary
  /** WW-SETUP-COUNTS — how many sofas, tables, stalls. All optional. */
  setup: RequirementSetup
  freeText: string
}

interface Props {
  value: RequirementsDraft
  onChange: (v: RequirementsDraft) => void
  /** Kept for the shell's subtitle; the step itself no longer renders an intro. */
  venueName?: string
  /** Hidden for vendor types that don't serve food. */
  showDietary?: boolean
  /**
   * WW-SETUP-COUNTS — only venues set up a room. A photographer has no round
   * tables to count, and asking them for some is how an optional section
   * starts reading as noise.
   */
  showSetup?: boolean
}

type SectionKey = "quick" | "dietary" | "setup"

/* 48px inputs on the base (phone) layout, 44px from xl where the desk fold is
   the budget. Spinners hidden: a count is typed, not nudged. */
const numFieldCls =
  "h-12 w-full rounded-[4px] border border-bridal-beige bg-white px-3 font-bridal text-[14px] leading-[20px] text-bridal-charcoal outline-none transition-colors duration-150 placeholder:text-bridal-text-soft/60 focus:border-bridal-gold-dark focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2 xl:h-11 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"

const fieldLabelCls = "mb-1 block truncate font-bridal text-[12px] leading-[16px] text-bridal-text-soft"

const DIETARY_COUNTS: [keyof RequirementDietary, string, string][] = [
  ["kidsUnder5", "Children under 5", "under 5"],
  ["kids5to12", "Children 5–12", "aged 5–12"],
  ["staffMeals", "Drivers / staff", "staff meals"],
  ["vegetarianCount", "Vegetarian", "vegetarian"],
]

/**
 * WW-SETUP-COUNTS — what a family actually asks a hall for, as numbers.
 *
 * These went into the free-text box, when they went anywhere: "6 sofa sets for
 * the stage, 40 round tables, 5 food stalls". A number written in a sentence
 * is a number nobody can total, filter or price, so the setup sheet, the floor
 * plan and the vendor's checklist were all reading prose and counting by hand.
 *
 * Ordered by how often a Pakistani venue booking actually names them.
 */
const SETUP_FIELDS: { key: keyof RequirementSetup; label: string; hint?: string }[] = [
  { key: "roundTables", label: "Round tables" },
  { key: "vipSofas", label: "VIP sofa sets", hint: "for the stage" },
  { key: "foodStalls", label: "Food stalls", hint: "live counters" },
  { key: "chairs", label: "Chairs" },
  { key: "rectTables", label: "Long tables" },
  { key: "stageSize", label: "Stage width", hint: "in feet" },
  { key: "heaters", label: "Patio heaters" },
  { key: "acUnits", label: "Extra cooling" },
  { key: "generators", label: "Backup generators" },
  { key: "parkingSlots", label: "Reserved parking" },
]

const FREE_TEXT_MAX = 4000
const FREE_TEXT_WARN = 3500

export default function RequirementsStep({ value, onChange, showDietary = true, showSetup = true }: Props) {
  const { scrollBodyTo } = useBookingShell()
  const [allergyText, setAllergyText] = useState((value.dietary.allergies || []).join(", "))
  const [open, setOpen] = useState<SectionKey | null>("quick")
  const [textFocused, setTextFocused] = useState(false)
  const sectionRefs = useRef<Partial<Record<SectionKey, HTMLDivElement | null>>>({})

  const toggleTag = (t: RequirementTag) =>
    onChange({
      ...value,
      tags: value.tags.includes(t) ? value.tags.filter((x) => x !== t) : [...value.tags, t],
    })

  /**
   * Blank CLEARS the key rather than storing 0.
   *
   * "0 round tables" and "they didn't say" are different statements, and only
   * one of them should reach a venue's setup sheet. Same rule as the dietary
   * counts below, for the same reason.
   */
  const setSetupCount = (k: keyof RequirementSetup, raw: string) => {
    const n = parseInt(raw, 10)
    const next = { ...(value.setup || {}) }
    if (raw.trim() === "" || !Number.isFinite(n) || n < 0) delete next[k]
    else (next as Record<string, number>)[k as string] = n
    onChange({ ...value, setup: next })
  }

  const setCount = (k: keyof RequirementDietary, raw: string) => {
    const n = parseInt(raw, 10)
    const next = { ...value.dietary }
    if (raw.trim() === "" || !Number.isFinite(n) || n < 0) delete next[k]
    else (next as any)[k] = n
    onChange({ ...value, dietary: next })
  }

  /* One open at a time. Opening a section scrolls only as far as it must to show the
     whole card (block: nearest), so the heading above stays where it was. */
  const setSection = (key: SectionKey, isOpen: boolean) => {
    setOpen(isOpen ? key : null)
    if (isOpen) {
      requestAnimationFrame(() => scrollBodyTo(sectionRefs.current[key] ?? null, { block: "nearest" }))
    }
  }

  // ── Header previews and answer counts ─────────────────────────────────
  const dietaryParts: string[] = []
  for (const [k, , short] of DIETARY_COUNTS) {
    const n = value.dietary[k] as number | undefined
    if (typeof n === "number") dietaryParts.push(`${n.toLocaleString()} ${short}`)
  }
  if (value.dietary.noBeef === true) dietaryParts.push("No beef")
  if ((value.dietary.allergies || []).length > 0) dietaryParts.push(`Allergies: ${value.dietary.allergies!.join(", ")}`)
  const dietaryAnswered = dietaryParts.length

  const setupParts: string[] = []
  for (const { key, label } of SETUP_FIELDS) {
    const n = value.setup?.[key] as number | undefined
    if (typeof n === "number") setupParts.push(`${n.toLocaleString()} ${label.toLowerCase()}`)
  }
  if (value.setup?.notes) setupParts.push(value.setup.notes)
  const setupAnswered = setupParts.length

  const pickedLabels = value.tags.map((t) => REQUIREMENT_TAG_LABELS[t])

  const freeLen = value.freeText.length

  return (
    <div>
      {/* Quick picks. Scaffolding for the box below, not a substitute for it. */}
      <Section
        sectionKey="quick"
        open={open === "quick"}
        onOpenChange={(o) => setSection("quick", o)}
        title="Quick picks"
        subtitle={pickedLabels.length ? pickedLabels.join(" · ") : "Tap any that apply"}
        answered={pickedLabels.length}
        answeredNoun="picked"
        index={0}
        refCb={(el) => (sectionRefs.current.quick = el)}
      >
        <div className="flex flex-wrap gap-2">
          {REQUIREMENT_TAGS.map((t) => {
            const on = value.tags.includes(t)
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                aria-pressed={on}
                className={`inline-flex h-11 items-center gap-1.5 rounded-full border px-3.5 font-bridal text-[12.5px] leading-[16px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2 xl:h-10 xl:[@media(max-height:820px)]:h-9 ${
                  on
                    ? "border-bridal-gold-dark bg-bridal-cream text-bridal-charcoal"
                    : "border-bridal-beige bg-white text-bridal-text hover:border-bridal-gold-dark/60 hover:bg-bridal-blush/45"
                }`}
              >
                {on && <Check className="h-3 w-3 text-bridal-gold-dark" strokeWidth={3} aria-hidden="true" />}
                {REQUIREMENT_TAG_LABELS[t]}
              </button>
            )
          })}
        </div>
      </Section>

      {showDietary && (
        <Section
          sectionKey="dietary"
          open={open === "dietary"}
          onOpenChange={(o) => setSection("dietary", o)}
          title="Guests & dietary"
          subtitle={dietaryAnswered ? dietaryParts.join(" · ") : "Children, drivers and staff, vegetarian, allergies"}
          answered={dietaryAnswered}
          index={1}
          refCb={(el) => (sectionRefs.current.dietary = el)}
        >
          {/* These four are money, not preferences — they change the billable
              head count. Said plainly so a family knows it's worth answering. */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 xl:grid-cols-4">
            {DIETARY_COUNTS.map(([k, label]) => (
              <div key={k} className="min-w-0">
                <label className={fieldLabelCls} htmlFor={`req-${k}`}>
                  {label}
                </label>
                <input
                  id={`req-${k}`}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className={numFieldCls}
                  value={(value.dietary[k] as number | undefined) ?? ""}
                  onChange={(e) => setCount(k, e.target.value)}
                  placeholder="—"
                />
              </div>
            ))}
          </div>

          <label className="mt-2 flex h-11 cursor-pointer items-center gap-2 font-bridal text-[13px] leading-[18px] text-bridal-charcoal xl:h-8">
            <input
              type="checkbox"
              className="h-4 w-4 accent-bridal-gold-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2"
              checked={value.dietary.noBeef === true}
              onChange={(e) => onChange({ ...value, dietary: { ...value.dietary, noBeef: e.target.checked } })}
            />
            No beef in any dish
          </label>

          <div className="mt-2">
            <label className={fieldLabelCls} htmlFor="req-allergies">
              Allergies
            </label>
            <input
              id="req-allergies"
              className={numFieldCls + " [font-variant-numeric:normal]"}
              value={allergyText}
              onChange={(e) => {
                setAllergyText(e.target.value)
                onChange({
                  ...value,
                  dietary: {
                    ...value.dietary,
                    allergies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  },
                })
              }}
              placeholder="e.g. peanuts, shellfish"
            />
          </div>

          <p className="mt-2 font-bridal text-[12px] leading-[16px] text-bridal-text-soft">
            Many venues charge less for children and staff — telling them now means
            it&apos;s in your quote rather than a surprise later.
          </p>
        </Section>
      )}

      {showSetup && (
        <Section
          sectionKey="setup"
          open={open === "setup"}
          onOpenChange={(o) => setSection("setup", o)}
          title="Setup & furniture"
          subtitle={
            setupAnswered
              ? setupParts.join(" · ")
              : "Tables, sofas, stalls, stage — as numbers for the venue's setup sheet"
          }
          answered={setupAnswered}
          index={2}
          refCb={(el) => (sectionRefs.current.setup = el)}
        >
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 xl:grid-cols-5">
            {SETUP_FIELDS.map(({ key, label, hint }) => (
              <div key={String(key)} className="min-w-0">
                <label className={fieldLabelCls} htmlFor={`setup-${String(key)}`} title={hint ? `${label} · ${hint}` : label}>
                  {label}
                </label>
                <input
                  id={`setup-${String(key)}`}
                  type="number"
                  min={0}
                  max={10000}
                  inputMode="numeric"
                  className={numFieldCls}
                  value={(value.setup?.[key] as number | undefined) ?? ""}
                  onChange={(e) => setSetupCount(key, e.target.value)}
                  placeholder={hint ?? "—"}
                />
              </div>
            ))}

            <div className="col-span-2 min-w-0 xl:col-span-5">
              <label htmlFor="setup-notes" className={fieldLabelCls}>
                Anything about the layout
              </label>
              <input
                id="setup-notes"
                type="text"
                maxLength={500}
                className={numFieldCls + " [font-variant-numeric:normal]"}
                value={value.setup?.notes ?? ""}
                onChange={(e) => {
                  const next = { ...(value.setup || {}) }
                  if (e.target.value.trim()) next.notes = e.target.value
                  else delete next.notes
                  onChange({ ...value, setup: next })
                }}
                placeholder="e.g. stage on the garden side, ladies seating to the left"
              />
            </div>
          </div>
        </Section>
      )}

      {/* The box. This is the actual feature. Always visible, never folded. */}
      <div className="mt-3 motion-safe:animate-stagger-fade-up" style={{ animationDelay: "90ms" }}>
        <label
          htmlFor="req-freetext"
          className="mb-[10px] block font-bridal text-[11px] uppercase leading-[14px] tracking-[0.18em] text-bridal-gold-dark"
        >
          Tell them anything else, in your own words
        </label>
        <textarea
          id="req-freetext"
          rows={5}
          maxLength={FREE_TEXT_MAX}
          dir="auto"
          onFocus={() => setTextFocused(true)}
          onBlur={() => setTextFocused(false)}
          className={`font-multilingual w-full resize-none rounded-[4px] border border-bridal-beige bg-white px-3 py-2.5 text-[14px] leading-[20px] text-bridal-charcoal outline-none transition-[height,border-color] duration-200 placeholder:text-bridal-text-soft/60 focus:border-bridal-gold-dark focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2 ${
            textFocused ? "h-[160px]" : "h-[140px] xl:h-[120px] xl:[@media(max-height:820px)]:h-[100px]"
          }`}
          value={value.freeText}
          onChange={(e) => onChange({ ...value, freeText: e.target.value })}
          placeholder={"e.g. Baraat may be 20 minutes late, please hold dinner.\nMy father uses a wheelchair — we'll need a ramp near the stage.\nMeri saas diabetic hain, sugar-free meetha chahiye."}
        />
        <div className="flex h-6 items-center justify-between gap-3">
          {/* Urdu is first-class: stored exactly as typed, never transliterated
              or machine-translated. Saying so is what makes people use it. */}
          <p className="min-w-0 truncate font-bridal text-[12px] leading-[16px] text-bridal-text-soft">
            Urdu or English — both fine, and it reaches them exactly as you write it.
          </p>
          <p
            className={`shrink-0 font-bridal text-[12px] leading-[16px] tabular-nums transition-colors duration-150 ${
              freeLen > FREE_TEXT_WARN ? "text-bridal-gold-dark" : "text-bridal-text-soft"
            }`}
            aria-live={freeLen > FREE_TEXT_WARN ? "polite" : undefined}
          >
            {freeLen.toLocaleString()}/{FREE_TEXT_MAX.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Accordion section ───────────────────────────────────────────────────── */

interface SectionProps {
  sectionKey: SectionKey
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  /** Previews entered values when collapsed; the prompt when nothing is entered. */
  subtitle: string
  answered: number
  /** "answered" by default; quick picks say "picked". */
  answeredNoun?: string
  index: number
  refCb: (el: HTMLDivElement | null) => void
  children: React.ReactNode
}

function Section({
  sectionKey,
  open,
  onOpenChange,
  title,
  subtitle,
  answered,
  answeredNoun = "answered",
  index,
  refCb,
  children,
}: SectionProps) {
  const bodyId = `req-section-${sectionKey}`
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} asChild>
      <div
        ref={refCb}
        className={`rounded-[4px] border bg-white transition-colors duration-200 motion-safe:animate-stagger-fade-up ${
          index > 0 ? "mt-2" : ""
        } ${open ? "border-bridal-gold-dark" : "border-bridal-beige"}`}
        style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
        data-booking-section={sectionKey}
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            aria-controls={bodyId}
            className="flex min-h-[56px] w-full items-center gap-3 rounded-[4px] px-4 py-2 text-left transition-colors duration-150 hover:bg-bridal-blush/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2 xl:[@media(max-height:820px)]:min-h-[52px]"
          >
            <span className="block min-w-0 flex-1">
              <span className="block font-bridal text-[14px] leading-[20px] text-bridal-charcoal">{title}</span>
              <span className="block truncate font-bridal text-[12px] leading-[16px] text-bridal-text-soft">{subtitle}</span>
            </span>
            {answered > 0 && (
              <span className="shrink-0 rounded-full bg-bridal-sage/25 px-2.5 py-1 font-bridal text-[11px] uppercase leading-[14px] tracking-[0.18em] text-[#3F6B43] tabular-nums">
                {answered} {answeredNoun}
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-bridal-text-label transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        </CollapsibleTrigger>
        {/* A folded section unmounts its inputs (plain Radix behaviour; with
            this version `forceMount` would render every section open). Values
            live in `value`, so nothing typed is lost when a section folds. */}
        <CollapsibleContent id={bodyId} className="px-4 pb-4">
          {children}
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
