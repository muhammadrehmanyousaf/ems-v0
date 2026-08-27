/**
 * WW-AMENITIES — the vendor's ticked facilities, exercised against every shape
 * a real business row actually arrives in.
 *
 * There is no test runner in this app, so this follows the pattern
 * `venue-answers-check.mts` established: drive the real function across
 * real-ish shapes and fail loudly on anything wrong.
 *
 * What it is really guarding:
 *
 *   1. That the CANONICAL column wins. `amenitiesJson` is what the Setup editor
 *      writes and what the server whitelists; `amenities` is an older label
 *      column holding a SUBSET on production (measured: 3 labels against 5 keys
 *      on the same row). Reading the legacy column alone shows a vendor fewer
 *      facilities than they ticked — the original complaint in a new costume.
 *
 *   2. That a tick is never silently dropped. An unrecognised key must become a
 *      readable label, not disappear. Disappearing is the quieter bug: it saves,
 *      the vendor sees it saved, and the couple never learns what it said.
 *
 *   3. That a malformed row renders nothing rather than throwing. This runs on
 *      the page Google sends organic traffic to, and the row reaches it through
 *      an `any` escape hatch, so a string-instead-of-array must not 500 it.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/amenities-check.mts
 */
import { resolveAmenityLabels, VENUE_AMENITIES } from "@/lib/amenities";

let bad = 0;
const t = (label: string, ok: boolean, detail = "") => {
  if (!ok) bad++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `\n            ${detail}` : ""}`);
};
const eq = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

console.log("\nthe canonical column is the one that wins:");

t(
  "maps amenitiesJson keys to human labels",
  eq(resolveAmenityLabels({ amenitiesJson: ["bridal_suite", "valet"] }), [
    "Bridal suite",
    "Valet parking",
  ]),
  JSON.stringify(resolveAmenityLabels({ amenitiesJson: ["bridal_suite", "valet"] })),
);

{
  // The exact production shape: the JSON column carries five keys, the legacy
  // label column carries three. Every one of the five must survive.
  const raw = {
    amenitiesJson: ["bridal_suite", "valet", "generator_backup", "parking_covered", "prayer_hall"],
    amenities: ["Bridal suite", "Parking", "Generator backup"],
  };
  const out = resolveAmenityLabels(raw);
  t("keeps all five JSON keys when the legacy column only holds three", out.length >= 5, JSON.stringify(out));
  t("does not print 'Bridal suite' twice when both columns carry it", out.filter((x) => x === "Bridal suite").length === 1);
  t("still surfaces a legacy-only label the JSON column never had", out.includes("Parking"), JSON.stringify(out));
}

t(
  "a row with only the legacy column still renders",
  eq(resolveAmenityLabels({ amenities: ["Parking", "Waiters"] }), ["Parking", "Waiters"]),
);

console.log("\na tick is never silently dropped:");

t(
  "an unknown key becomes a readable label rather than vanishing",
  eq(resolveAmenityLabels({ amenitiesJson: ["rooftop_seating"] }), ["Rooftop seating"]),
  JSON.stringify(resolveAmenityLabels({ amenitiesJson: ["rooftop_seating"] })),
);

t(
  "every catalogue key resolves to a non-empty label",
  VENUE_AMENITIES.every(([k]) => resolveAmenityLabels({ amenitiesJson: [k] })[0]?.length > 0),
);

t(
  "the catalogue has no duplicate keys",
  new Set(VENUE_AMENITIES.map(([k]) => k)).size === VENUE_AMENITIES.length,
);

t(
  "air_conditioning is present — it was missing from every amenity surface once",
  VENUE_AMENITIES.some(([k]) => k === "air_conditioning"),
);

console.log("\na malformed row renders nothing, never throws:");

const empties: [string, any][] = [
  ["undefined row", undefined],
  ["null row", null],
  ["empty object", {}],
  ["amenitiesJson is a string, not an array", { amenitiesJson: "bridal_suite" }],
  ["amenities is a string, not an array", { amenities: "Parking" }],
  ["arrays full of junk", { amenitiesJson: [null, 3, {}, ""], amenities: [undefined, false] }],
  ["whitespace-only labels", { amenities: ["   ", "\t"] }],
];
for (const [label, raw] of empties) {
  let out: string[] | null = null;
  let threw = false;
  try {
    out = resolveAmenityLabels(raw);
  } catch {
    threw = true;
  }
  t(`${label} → [] and no throw`, !threw && Array.isArray(out) && out!.length === 0, threw ? "THREW" : JSON.stringify(out));
}

console.log(
  bad === 0
    ? `\n  ${8 + empties.length}/${8 + empties.length} — what the vendor ticked is what the couple reads.\n`
    : `\n  ${bad} FAILED\n`,
);
process.exit(bad === 0 ? 0 : 1);
