/**
 * Pure estimation model for the Pakistani wedding budget calculator.
 *
 * No React, no side effects — just `estimateBudget(inputs)`. Kept separate from
 * the UI so it can be reused (e.g. by the cost pillar) and reasoned about.
 *
 * Calibration anchor: 400 guests · mid tier · Lahore · buffet · mehndi+barat+
 * walima → ≈ PKR 4.7M, matching the worked sample budget on
 * /wedding-cost-in-pakistan. Figures are 2026 planning ranges (midpoints of the
 * ranges documented on that page), NOT fixed quotes — surfaced with a
 * disclaimer in the UI.
 */

export type Tier = "budget" | "mid" | "luxury"
export type ServiceStyle = "buffet" | "plated" | "live"
export type EventKey = "mehndi" | "barat" | "walima" | "nikah"

export interface BudgetInputs {
  guests: number
  citySlug: string
  tier: Tier
  events: EventKey[]
  service: ServiceStyle
  /** Designer/couture outfits + heavier jewellery. */
  designerOutfits: boolean
  /** Cinematic video + drone on top of photography. */
  cinematicVideo: boolean
}

export interface CategoryLine {
  key: string
  label: string
  amount: number
}

export interface BudgetEstimate {
  total: number
  categories: CategoryLine[]
  /** Venue+catering as a % of the total — the headline insight. */
  cateringSharePct: number
}

export const TIERS: { value: Tier; label: string }[] = [
  { value: "budget", label: "Budget" },
  { value: "mid", label: "Mid-range" },
  { value: "luxury", label: "Luxury" },
]

export const SERVICE_STYLES: { value: ServiceStyle; label: string }[] = [
  { value: "buffet", label: "Buffet" },
  { value: "plated", label: "Plated" },
  { value: "live", label: "Live stations" },
]

export const EVENT_OPTIONS: { value: EventKey; label: string }[] = [
  { value: "mehndi", label: "Mehndi" },
  { value: "barat", label: "Barat" },
  { value: "walima", label: "Walima" },
  { value: "nikah", label: "Nikah" },
]

// Venue + catering, all-in per head (buffet baseline), by tier — midpoints of
// the "venue/marquee per head with food" ranges on the cost pillar.
const PER_HEAD_ALLIN: Record<Tier, number> = { budget: 1400, mid: 1900, luxury: 3500 }
const SERVICE_MULT: Record<ServiceStyle, number> = { buffet: 1, plated: 1.2, live: 1.5 }
// How much catering each event drives, relative to a full barat.
const EVENT_CATERING_WEIGHT: Record<EventKey, number> = { barat: 1, walima: 1, mehndi: 0.6, nikah: 0.3 }
// How much décor/stage each event drives.
const EVENT_DECOR_WEIGHT: Record<EventKey, number> = { barat: 1, walima: 1, mehndi: 0.6, nikah: 0.4 }

// City cost multipliers (applied to venue+catering and décor). Tier-1 metros
// cost more; tier-2/3 less. Default for unknown slugs = 0.85.
const CITY_MULT: Record<string, number> = {
  karachi: 1.1,
  lahore: 1.0,
  islamabad: 1.05,
  rawalpindi: 0.95,
  faisalabad: 0.85,
  multan: 0.85,
  peshawar: 0.85,
  sialkot: 0.85,
  gujranwala: 0.85,
  hyderabad: 0.85,
  quetta: 0.8,
  bahawalpur: 0.8,
}

// One-time category bases (PKR), by tier.
const PHOTO_BASE: Record<Tier, number> = { budget: 90_000, mid: 250_000, luxury: 600_000 }
const OUTFITS_BASE: Record<Tier, number> = { budget: 250_000, mid: 600_000, luxury: 2_000_000 }
const JEWELLERY_BASE: Record<Tier, number> = { budget: 350_000, mid: 900_000, luxury: 3_000_000 }
const MISC_BASE: Record<Tier, number> = { budget: 200_000, mid: 400_000, luxury: 900_000 }
// Per-event category bases (PKR), by tier.
const MAKEUP_PER_EVENT: Record<Tier, number> = { budget: 25_000, mid: 60_000, luxury: 150_000 }
const DECOR_PER_EVENT: Record<Tier, number> = { budget: 60_000, mid: 175_000, luxury: 800_000 }

export function getCityMultiplier(citySlug: string): number {
  return CITY_MULT[citySlug] ?? 0.85
}

function round(n: number): number {
  // Round to the nearest 10,000 PKR — estimates shouldn't imply false precision.
  return Math.round(n / 10_000) * 10_000
}

export function estimateBudget(inputs: BudgetInputs): BudgetEstimate {
  const { guests, citySlug, tier, events, service, designerOutfits, cinematicVideo } = inputs

  const cityMult = getCityMultiplier(citySlug)
  const g = Math.max(0, guests)

  // Venue + catering: per-head × guests × each event's catering weight.
  const perHead = PER_HEAD_ALLIN[tier] * SERVICE_MULT[service] * cityMult
  const cateringWeight = events.reduce((s, e) => s + EVENT_CATERING_WEIGHT[e], 0)
  const venueCatering = perHead * g * cateringWeight

  // Décor scales with the number/size of events; makeup with looks per event.
  const decorWeight = events.reduce((s, e) => s + EVENT_DECOR_WEIGHT[e], 0)
  const decor = DECOR_PER_EVENT[tier] * decorWeight * cityMult
  const makeupEvents = events.filter((e) => e !== "nikah").length + (events.includes("nikah") ? 0.5 : 0)
  const makeup = MAKEUP_PER_EVENT[tier] * Math.max(1, makeupEvents)

  // One-time lines.
  const photography = PHOTO_BASE[tier] * (cinematicVideo ? 1.4 : 1)
  const outfits = OUTFITS_BASE[tier] * (designerOutfits ? 1.6 : 1)
  const jewellery = JEWELLERY_BASE[tier] * (designerOutfits ? 1.5 : 1)
  const misc = MISC_BASE[tier]

  const categories: CategoryLine[] = [
    { key: "venue", label: "Venue & catering", amount: round(venueCatering) },
    { key: "decor", label: "Décor & stage", amount: round(decor) },
    { key: "photo", label: "Photography & video", amount: round(photography) },
    { key: "makeup", label: "Bridal makeup & hair", amount: round(makeup) },
    { key: "outfits", label: "Outfits (bride & groom)", amount: round(outfits) },
    { key: "jewellery", label: "Jewellery", amount: round(jewellery) },
    { key: "misc", label: "Cards, car & extras", amount: round(misc) },
  ]

  const total = categories.reduce((s, c) => s + c.amount, 0)
  const cateringSharePct = total > 0 ? Math.round((categories[0].amount / total) * 100) : 0

  return { total, categories, cateringSharePct }
}
