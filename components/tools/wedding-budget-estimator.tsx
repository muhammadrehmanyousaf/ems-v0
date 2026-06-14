"use client"

/**
 * Interactive Pakistani wedding budget estimator.
 *
 * Top-of-funnel calculator embedded on /wedding-cost-in-pakistan — the #1
 * differentiator vs competing cost pages (none has a working calculator).
 * Distinct from /planning-tools/budget, which is a detailed expense *tracker*;
 * this is a quick *estimator* (guests/city/tier → instant total + breakdown).
 *
 * Pure math lives in lib/content/wedding-budget-model.ts. Initial render uses
 * default inputs so the server-rendered HTML already shows a real estimate.
 */

import { useMemo, useState } from "react"
import { CITIES } from "@/lib/seo"
import {
  estimateBudget,
  TIERS,
  SERVICE_STYLES,
  EVENT_OPTIONS,
  type Tier,
  type ServiceStyle,
  type EventKey,
} from "@/lib/content/wedding-budget-model"

function pkr(n: number): string {
  return `PKR ${n.toLocaleString("en-PK")}`
}

function pkrShort(n: number): string {
  if (n >= 1e7) return `${(n / 1e7).toFixed(2)} crore`
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)} lakh`
  return n.toLocaleString("en-PK")
}

const PILL =
  "px-3 py-1.5 rounded-full border font-bridal text-[13px] transition-all cursor-pointer"
const PILL_ON = "border-bridal-gold bg-bridal-blush text-bridal-charcoal"
const PILL_OFF =
  "border-bridal-beige text-bridal-text-soft hover:border-bridal-gold hover:text-bridal-charcoal"

export function WeddingBudgetEstimator() {
  const [guests, setGuests] = useState(400)
  const [citySlug, setCitySlug] = useState("lahore")
  const [tier, setTier] = useState<Tier>("mid")
  const [events, setEvents] = useState<EventKey[]>(["mehndi", "barat", "walima"])
  const [service, setService] = useState<ServiceStyle>("buffet")
  const [designerOutfits, setDesignerOutfits] = useState(false)
  const [cinematicVideo, setCinematicVideo] = useState(false)

  const estimate = useMemo(
    () =>
      estimateBudget({
        guests,
        citySlug,
        tier,
        events,
        service,
        designerOutfits,
        cinematicVideo,
      }),
    [guests, citySlug, tier, events, service, designerOutfits, cinematicVideo],
  )

  const maxCat = Math.max(...estimate.categories.map((c) => c.amount), 1)

  function toggleEvent(e: EventKey) {
    setEvents((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
    )
  }

  return (
    <div className="rounded-lg border border-bridal-beige bg-bridal-cream overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* ── Controls ── */}
        <div className="p-5 sm:p-7 space-y-6 border-b lg:border-b-0 lg:border-r border-bridal-beige">
          {/* Guests */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="guest-count" className="font-bridal text-[13px] font-semibold text-bridal-charcoal">
                Number of guests
              </label>
              <span className="font-display italic text-[18px] text-bridal-gold-dark">
                {guests.toLocaleString("en-PK")}
              </span>
            </div>
            <input
              id="guest-count"
              type="range"
              min={50}
              max={1500}
              step={25}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full accent-bridal-gold-dark"
            />
            <div className="flex justify-between font-bridal text-[11px] text-bridal-text-soft mt-1">
              <span>50</span>
              <span>1,500</span>
            </div>
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className="block font-bridal text-[13px] font-semibold text-bridal-charcoal mb-2">
              City
            </label>
            <select
              id="city"
              value={citySlug}
              onChange={(e) => setCitySlug(e.target.value)}
              className="w-full rounded-md border border-bridal-beige bg-white px-3 py-2 font-bridal text-[14px] text-bridal-charcoal focus:border-bridal-gold focus:outline-none"
            >
              {CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tier */}
          <div>
            <span className="block font-bridal text-[13px] font-semibold text-bridal-charcoal mb-2">
              Style / tier
            </span>
            <div className="flex flex-wrap gap-2">
              {TIERS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={tier === t.value}
                  onClick={() => setTier(t.value)}
                  className={`${PILL} ${tier === t.value ? PILL_ON : PILL_OFF}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Events */}
          <div>
            <span className="block font-bridal text-[13px] font-semibold text-bridal-charcoal mb-2">
              Events
            </span>
            <div className="flex flex-wrap gap-2">
              {EVENT_OPTIONS.map((e) => (
                <button
                  key={e.value}
                  type="button"
                  aria-pressed={events.includes(e.value)}
                  onClick={() => toggleEvent(e.value)}
                  className={`${PILL} ${events.includes(e.value) ? PILL_ON : PILL_OFF}`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Service style */}
          <div>
            <span className="block font-bridal text-[13px] font-semibold text-bridal-charcoal mb-2">
              Catering service
            </span>
            <div className="flex flex-wrap gap-2">
              {SERVICE_STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={service === s.value}
                  onClick={() => setService(s.value)}
                  className={`${PILL} ${service === s.value ? PILL_ON : PILL_OFF}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Add-ons */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-bridal text-[13px] text-bridal-text cursor-pointer">
              <input
                type="checkbox"
                checked={designerOutfits}
                onChange={(e) => setDesignerOutfits(e.target.checked)}
                className="accent-bridal-gold-dark w-4 h-4"
              />
              Designer outfits &amp; heavier jewellery
            </label>
            <label className="flex items-center gap-2 font-bridal text-[13px] text-bridal-text cursor-pointer">
              <input
                type="checkbox"
                checked={cinematicVideo}
                onChange={(e) => setCinematicVideo(e.target.checked)}
                className="accent-bridal-gold-dark w-4 h-4"
              />
              Cinematic video &amp; drone
            </label>
          </div>
        </div>

        {/* ── Results ── */}
        <div className="p-5 sm:p-7 bg-bridal-ivory/50">
          <p className="font-bridal text-[10px] uppercase tracking-[0.28em] text-bridal-gold mb-1">
            Estimated total
          </p>
          <p className="font-display italic text-[34px] sm:text-[40px] leading-none text-bridal-charcoal">
            {pkr(estimate.total)}
          </p>
          <p className="mt-1 font-bridal text-[13px] text-bridal-text-soft">
            ≈ {pkrShort(estimate.total)}
            {estimate.cateringSharePct > 0 && (
              <> · venue &amp; catering is {estimate.cateringSharePct}% of your budget</>
            )}
          </p>

          <ul className="mt-6 space-y-3">
            {estimate.categories.map((c) => (
              <li key={c.key}>
                <div className="flex items-center justify-between font-bridal text-[13px] mb-1">
                  <span className="text-bridal-text">{c.label}</span>
                  <span className="text-bridal-charcoal font-medium">{pkr(c.amount)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-bridal-beige overflow-hidden">
                  <div
                    className="h-full bg-bridal-gold-dark rounded-full"
                    style={{ width: `${Math.round((c.amount / maxCat) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-6 font-bridal text-[11.5px] text-bridal-text-soft leading-relaxed">
            Estimate only — 2026 planning ranges, not a quote. Jewellery tracks
            the live gold rate and luxury costs run higher. For real prices,{" "}
            <a href="/vendors" className="text-bridal-gold-dark hover:underline">
              compare verified vendors
            </a>{" "}
            on Wedding Wala.
          </p>
        </div>
      </div>
    </div>
  )
}
