/**
 * WW-AMENITIES — one definition of the venue amenity catalogue.
 *
 * ── Why this exists ───────────────────────────────────────────────────────
 *
 * There are TWO amenity columns on `Businesses` and they do not agree:
 *
 *   amenitiesJson  jsonb   ["bridal_suite","valet","generator_backup",…]
 *   amenities      text[]  ["Bridal suite","Parking","Generator backup"]
 *
 * `amenitiesJson` is the canonical one. It is what the Setup editor writes,
 * and the server validates it against `Business.AMENITY_KEYS` — silently
 * dropping any slug it does not recognise. `amenities` is the older label
 * column; on production it holds a SUBSET (measured: 3 labels where the JSON
 * column had 5 keys), so rendering it shows a vendor fewer facilities than
 * they ticked. That is the same complaint in a new costume, so read the JSON
 * column first and treat the label column as a fallback for rows that only
 * ever had it.
 *
 * The keys and labels below are byte-identical to `Business.AMENITY_KEYS` in
 * `ems-v0-backend/src/models/businessModel.js` (12 keys, same order) and to
 * the copy that used to live privately inside `profile-content-manager.tsx`.
 * Keeping one definition is the point: when the vendor's editor and the
 * customer's page disagree about what a key means, the vendor ticks a box and
 * the couple never learns what it said.
 *
 * Adding an amenity means adding it in BOTH repos — the server drops unknown
 * slugs on write, so a key added only here saves as nothing.
 */

/** Canonical key → the label a human should read. Order is display order. */
export const VENUE_AMENITIES: ReadonlyArray<readonly [string, string]> = [
  // Air conditioning is first deliberately. In Pakistan a June barat in a hall
  // without AC is a different product, and this key was missing from every
  // amenity surface while the onboarding checklist told vendors "AC, generator
  // backup, bridal room — these are what a listing is compared on".
  ["air_conditioning", "Air conditioning"],
  ["bridal_suite", "Bridal suite"],
  ["grooms_room", "Groom's room"],
  ["imam_room", "Imam room"],
  ["vip_lounge", "VIP lounge"],
  ["kids_area", "Kids area"],
  ["prayer_hall", "Prayer hall"],
  ["wudu_area", "Wudu area"],
  ["valet", "Valet parking"],
  ["generator_backup", "Generator backup"],
  ["parking_covered", "Covered parking"],
  ["wheelchair_access", "Wheelchair access"],
] as const;

const LABEL_BY_KEY = new Map(VENUE_AMENITIES.map(([k, v]) => [k, v]));

/**
 * A key with no catalogue entry becomes a readable label rather than nothing.
 *
 * Dropping it would be the quieter bug: a vendor ticks something, it saves,
 * and it silently never appears. `generator_backup` → "Generator backup".
 */
function prettifyKey(key: string): string {
  const words = key.replace(/[_-]+/g, " ").trim();
  if (!words) return "";
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Resolve a business row's amenities to display labels.
 *
 * Accepts the raw row because callers get it through an `any` escape hatch,
 * and a row carrying `amenities: "Parking"` (a string, not an array) or a
 * stray null must produce an empty list rather than throw on the page Google
 * sends organic traffic to.
 *
 * @param raw       the business row (reads `amenitiesJson` then `amenities`)
 * @param fallback  optional already-normalised label list (VendorDetail.amenities)
 */
export function resolveAmenityLabels(raw: any, fallback?: unknown): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (label: string) => {
    const trimmed = String(label ?? "").trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(trimmed);
  };

  // Canonical first, so a vendor who has both columns gets the complete set
  // and the catalogue's spelling.
  const json = raw?.amenitiesJson;
  if (Array.isArray(json)) {
    for (const entry of json) {
      if (typeof entry !== "string") continue;
      push(LABEL_BY_KEY.get(entry) ?? prettifyKey(entry));
    }
  }

  // Legacy label column, and whatever the caller already normalised. These are
  // already human-readable, so they go through unmapped.
  for (const source of [raw?.amenities, fallback, raw?.serviceProvided]) {
    if (!Array.isArray(source)) continue;
    for (const entry of source) {
      if (typeof entry !== "string") continue;
      push(entry);
    }
  }

  return out;
}
