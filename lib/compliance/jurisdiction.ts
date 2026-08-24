/**
 * WW-JURISDICTION (frontend mirror) — which province a venue is in, and whether
 * the one-dish rule reaches it.
 *
 * Mirrors `event-planner-api/src/utils/jurisdiction.js`. Needed on the client
 * for the same reason the one-dish arithmetic is: the vendor has to see the
 * verdict WHILE they build the menu, and a round trip per keystroke is not an
 * option.
 *
 * ── Why the client is allowed to answer this at all ───────────────────────
 *
 * The province lookup is pure geography, and the client already owns the
 * canonical city list (`lib/seo/constants.ts` CITIES) — the backend map was
 * generated from it. Nothing is duplicated that was not already here.
 *
 * The rule table below IS duplicated, and deliberately kept to the smallest
 * possible shape: which jurisdictions have a live ONE_DISH rule, and which have
 * one recorded as lifted. Both are read off the seeded ComplianceRules
 * migration, and `scripts/one-dish-parity.mts` fails if the two ever disagree.
 *
 * The server remains the authority. Its response carries `oneDish.jurisdiction`,
 * and where a screen has that it should prefer it over this.
 */

import { CITIES } from "@/lib/seo/constants"

export type Province = "PUNJAB" | "SINDH" | "KP" | "BALOCHISTAN" | "ICT" | "GB" | "AJK"
export type RuleApplies = "applies" | "does_not_apply" | "unknown"

const REGION_TO_CODE: Record<string, Province> = {
  Punjab: "PUNJAB",
  Sindh: "SINDH",
  "Khyber Pakhtunkhwa": "KP",
  Balochistan: "BALOCHISTAN",
  "Islamabad Capital Territory": "ICT",
  "Gilgit-Baltistan": "GB",
  "Azad Kashmir": "AJK",
}

export const PROVINCE_LABELS: Record<Province, string> = {
  PUNJAB: "Punjab",
  SINDH: "Sindh",
  KP: "Khyber Pakhtunkhwa",
  BALOCHISTAN: "Balochistan",
  ICT: "Islamabad Capital Territory",
  GB: "Gilgit-Baltistan",
  AJK: "Azad Kashmir",
}

/** Built once from CITIES, so a city added to the marketplace is known here too. */
const CITY_TO_PROVINCE: Record<string, Province> = (() => {
  const out: Record<string, Province> = {}
  for (const c of CITIES) {
    const code = REGION_TO_CODE[c.region as string]
    if (code) out[c.name.toLowerCase()] = code
  }
  return out
})()

/**
 * The province a business trades in, or null when we cannot say.
 *
 * `city` is free text. Anything unrecognised is null rather than a nearest
 * guess — "Kotri" quietly becoming Punjab is the bug this module exists to
 * remove, arriving through a different door.
 */
export function provinceOf(city: unknown): Province | null {
  if (!city || typeof city !== "string") return null
  const key = city.toLowerCase().replace(/[.,]/g, " ").replace(/\s+/g, " ").trim()
  if (!key) return null
  if (CITY_TO_PROVINCE[key]) return CITY_TO_PROVINCE[key]
  // "Lahore Cantt", "Karachi South". Checked only after an exact match fails,
  // so a real two-word city ("Rahim Yar Khan") is never truncated.
  return CITY_TO_PROVINCE[key.split(" ")[0]] ?? null
}

/**
 * Mirrors the seeded `ComplianceRules` for ONE_DISH.
 *
 *   PUNJAB — Punjab Marriage Functions Act 2016 s.5, live since 2016-06-01.
 *   SINDH  — the April 2026 austerity notification, seeded `inForce: false`
 *            with the note "LIFTED 16-May-2026 — time-bound, never a statute.
 *            DO NOT enforce as current law."
 *
 * Everything else is absent from the seed, which is NOT the same as "no such
 * law" — see `ruleAppliesTo` below.
 */
const ONE_DISH_LIVE: Province[] = ["PUNJAB"]
const ONE_DISH_RECORDED_LIFTED: Province[] = ["SINDH"]

/**
 * Does the one-dish rule reach this province?
 *
 * The three-state answer matters more than it looks. `menuController` carries a
 * comment saying s.5 binds venues "in Punjab, ICT and KP", while the seeded
 * table holds ONE_DISH for PUNJAB alone. One is a code comment and the other a
 * sourced record, and neither is enough to declare KP unregulated.
 *
 * So an absent row is `unknown`, never `does_not_apply`. Reading it the other
 * way would switch a real legal warning OFF for two provinces on the strength
 * of a gap in our own seed data — turning a false red into a false green, which
 * is the worse of the two failures.
 */
export function ruleAppliesTo(province: Province | null): RuleApplies {
  if (!province) return "unknown"
  if (ONE_DISH_LIVE.includes(province)) return "applies"
  if (ONE_DISH_RECORDED_LIFTED.includes(province)) return "does_not_apply"
  return "unknown"
}

/** Convenience: straight from a business's free-text city to the verdict. */
export function oneDishAppliesInCity(city: unknown): RuleApplies {
  return ruleAppliesTo(provinceOf(city))
}

/** What the vendor is told. The two ways of not knowing read differently. */
export function describeJurisdiction(province: Province | null, status: RuleApplies): string {
  const where = province ? PROVINCE_LABELS[province] : null
  if (status === "applies") {
    return `The Marriage Functions Act applies in ${where}, so this menu is checked against the one-dish rule.`
  }
  if (status === "does_not_apply") {
    return `This rule is not in force in ${where}, so we don't check menus against it here.`
  }
  return where
    ? `We haven't confirmed whether this rule applies in ${where}, so we're not judging this menu against it. Check with your local authority.`
    : "We can't tell which province this venue is in, so we can't say which marriage-function rules apply. Set the city to check."
}
