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
 */

import { useState } from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
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
  /** Shown in the intro so the copy names who is actually reading it. */
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

const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } }

const numFieldCls =
  "h-10 w-full rounded-[3px] border border-bridal-beige bg-bridal-ivory px-3 font-bridal text-[13.5px] text-bridal-charcoal focus:border-bridal-gold outline-none tabular-nums"

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

export default function RequirementsStep({ value, onChange, venueName, showDietary = true, showSetup = true }: Props) {
  const [allergyText, setAllergyText] = useState((value.dietary.allergies || []).join(", "))

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

  return (
    <motion.div className="space-y-7" variants={container} initial="hidden" animate="visible">
      <motion.div variants={item}>
        <p className="font-bridal text-[10.5px] uppercase tracking-[0.32em] font-medium text-bridal-gold-dark mb-2">
          Step · Your requirements
        </p>
        <h2 className="font-display italic text-[28px] sm:text-[32px] text-bridal-charcoal leading-tight">
          Anything we should know?
        </h2>
        <p className="mt-2 font-bridal text-[14px] text-bridal-text-soft">
          All optional — but whatever you write here goes straight to{" "}
          {venueName || "the venue"} and onto their kitchen sheet.
        </p>
      </motion.div>

      {/* Quick picks. Scaffolding for the box below, not a substitute for it. */}
      <motion.div variants={item} className="space-y-2">
        <p className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">
          Tap any that apply
        </p>
        <div className="flex flex-wrap gap-2">
          {REQUIREMENT_TAGS.map((t) => {
            const on = value.tags.includes(t)
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                aria-pressed={on}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-bridal text-[12.5px] transition-colors ${
                  on
                    ? "border-bridal-gold-dark bg-bridal-gold/20 text-bridal-charcoal"
                    : "border-bridal-beige bg-bridal-ivory text-bridal-text hover:border-bridal-gold/55"
                }`}
              >
                {on && <Check className="w-3 h-3" strokeWidth={3} />}
                {REQUIREMENT_TAG_LABELS[t]}
              </button>
            )
          })}
        </div>
      </motion.div>

      {showDietary && (
        <motion.div variants={item} className="space-y-3">
          <p className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">
            Guests &amp; dietary
          </p>

          {/* These four are money, not preferences — they change the billable
              head count. Said plainly so a family knows it's worth answering. */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {([
              ["kidsUnder5", "Children under 5"],
              ["kids5to12", "Children 5–12"],
              ["staffMeals", "Drivers / staff"],
              ["vegetarianCount", "Vegetarian"],
            ] as [keyof RequirementDietary, string][]).map(([k, label]) => (
              <div key={k}>
                <label className="block font-bridal text-[11.5px] text-bridal-text-soft mb-1" htmlFor={`req-${k}`}>
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
          <p className="font-bridal text-[11.5px] text-bridal-text-soft">
            Many venues charge less for children and staff — telling them now means
            it&apos;s in your quote rather than a surprise later.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-2 font-bridal text-[13px] text-bridal-charcoal cursor-pointer">
              <input
                type="checkbox"
                className="accent-bridal-gold-dark"
                checked={value.dietary.noBeef === true}
                onChange={(e) => onChange({ ...value, dietary: { ...value.dietary, noBeef: e.target.checked } })}
              />
              No beef in any dish
            </label>
          </div>

          <div>
            <label className="block font-bridal text-[11.5px] text-bridal-text-soft mb-1" htmlFor="req-allergies">
              Allergies
            </label>
            <input
              id="req-allergies"
              className="h-10 w-full rounded-[3px] border border-bridal-beige bg-bridal-ivory px-3 font-bridal text-[13.5px] text-bridal-charcoal focus:border-bridal-gold outline-none"
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
        </motion.div>
      )}

      {showSetup && (
        <motion.div variants={item} className="space-y-3">
          <p className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">
            Setup &amp; furniture
          </p>
          <p className="font-bridal text-[11.5px] text-bridal-text-soft -mt-1">
            All optional. Anything you put here goes on the venue&apos;s setup sheet as a
            number they can plan against, instead of a line in a message.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {SETUP_FIELDS.map(({ key, label, hint }) => (
              <div key={String(key)}>
                <label
                  className="block font-bridal text-[11.5px] text-bridal-text-soft mb-1"
                  htmlFor={`setup-${String(key)}`}
                >
                  {label}
                  {hint && (
                    <span className="text-bridal-text-soft/70"> · {hint}</span>
                  )}
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
                  placeholder="—"
                />
              </div>
            ))}
          </div>

          <div>
            <label
              htmlFor="setup-notes"
              className="block font-bridal text-[11.5px] text-bridal-text-soft mb-1"
            >
              Anything about the layout
            </label>
            <input
              id="setup-notes"
              type="text"
              maxLength={500}
              className={numFieldCls + " tabular-nums-none"}
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
        </motion.div>
      )}

      {/* The box. This is the actual feature. */}
      <motion.div variants={item} className="space-y-2">
        <label
          htmlFor="req-freetext"
          className="block font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label"
        >
          Tell them anything else, in your own words
        </label>
        <textarea
          id="req-freetext"
          rows={5}
          maxLength={4000}
          className="w-full rounded-[3px] border border-bridal-beige bg-bridal-ivory px-3 py-2.5 font-bridal text-[14px] text-bridal-charcoal focus:border-bridal-gold outline-none resize-y leading-relaxed"
          value={value.freeText}
          onChange={(e) => onChange({ ...value, freeText: e.target.value })}
          placeholder={"e.g. Baraat may be 20 minutes late, please hold dinner.\nMy father uses a wheelchair — we'll need a ramp near the stage.\nMeri saas diabetic hain, sugar-free meetha chahiye."}
        />
        <div className="flex items-center justify-between">
          {/* Urdu is first-class: stored exactly as typed, never transliterated
              or machine-translated. Saying so is what makes people use it. */}
          <p className="font-bridal text-[11.5px] text-bridal-text-soft">
            Urdu or English — both fine, and it reaches them exactly as you write it.
          </p>
          <p className="font-bridal text-[11px] text-bridal-text-soft tabular-nums">
            {value.freeText.length}/4000
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
