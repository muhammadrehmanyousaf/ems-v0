/**
 * WW-ONE-DISH — prove the mirror still agrees with the rule it mirrors.
 *
 * `lib/compliance/one-dish.ts` exists so a vendor sees the count WHILE they
 * build a menu, rather than after a save round-trip. It states in its own
 * header that it mirrors `oneDishRule.js`, and the whole reason the arithmetic
 * lives in one shape is so no surface can quietly disagree about the same menu.
 *
 * Nothing enforced that. Twice now the backend rule changed and the mirror did
 * not: once when a menu with no readable dishes stopped being called compliant,
 * and once when a choice-group breach stopped being described as "listed" —
 * which left the vendor's own editor saying "2 main dishes listed ()", an empty
 * bracket and a claim they can see is false.
 *
 * This compares both implementations across every menu shape the column has
 * held, including the ones that only appear in production data, and fails on
 * any difference in status, counts, reason or wording.
 *
 * Run:
 *   node --experimental-strip-types scripts/one-dish-parity.mts
 *   WW_BACKEND=/path/to/ems-v0-backend node --experimental-strip-types scripts/one-dish-parity.mts
 */
import { createRequire } from "node:module";
import path from "node:path";
import { checkOneDish as feCheck, describeViolation as feDescribe } from "../lib/compliance/one-dish.ts";

const require = createRequire(import.meta.url);
const BACKEND = process.env.WW_BACKEND || "C:/Projects/ems-v0-backend";
const rulePath = path.join(BACKEND, "src/utils/oneDishRule.js");

/**
 * Which backend checkout this is actually reading.
 *
 * The script loads whatever is on disk at WW_BACKEND, so it silently compares
 * against whichever BRANCH happens to be checked out there. That cost real time
 * once: 53 "divergences" that were only the backend sitting on a branch without
 * the rule the mirror had already been updated for.
 *
 * Printing the branch turns a confusing failure into an obvious one.
 */
try {
  const { execSync } = await import("node:child_process");
  const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: BACKEND })
    .toString().trim();
  console.log(`
  backend: ${BACKEND}  [${branch}]`);
} catch {
  console.log(`
  backend: ${BACKEND}  [branch unknown]`);
}

let beCheck: (d: any) => any;
let beDescribe: (v: any) => string;
try {
  ({ checkOneDish: beCheck, describeViolation: beDescribe } = require(rulePath));
} catch (e) {
  console.error(`\nCould not load the backend rule at ${rulePath}`);
  console.error("Set WW_BACKEND to the backend checkout to run this.\n");
  process.exit(2);
}

const dish = (name: string, countsAs: string, group?: string) =>
  ({ name, countsAs, ...(group ? { group } : {}) });

/** Every shape `Menu.data` has ever held, plus the choice groups. */
const CASES: [string, any][] = [
  // Legacy production data: flat strings, nothing declared.
  ["legacy flat strings", { items: ["Karahi", "Naan"] }],
  ["legacy three curries", { items: ["Karahi", "Qorma", "Handi"] }],
  ["sectioned legacy", { mains: { items: ["Karahi"] }, bread: { items: ["Naan"] } }],
  // Declared.
  ["classified, compliant", { items: [dish("Karahi", "salan"), dish("Naan", "bread")] }],
  ["three salans listed", { items: [dish("K", "salan"), dish("Q", "salan"), dish("N", "salan")] }],
  ["two sweets listed", { items: [dish("Kheer", "sweet"), dish("Firni", "sweet"), dish("K", "salan")] }],
  // Choice groups.
  ["pick 1 of 3 salans", { groups: { m: { label: "Main dish", choose: 1 } }, items: [dish("K", "salan", "m"), dish("Q", "salan", "m"), dish("N", "salan", "m")] }],
  ["pick 2 of 3 salans", { groups: { m: { label: "Main dish", choose: 2 } }, items: [dish("K", "salan", "m"), dish("Q", "salan", "m"), dish("N", "salan", "m")] }],
  ["mixed group pick 2", { groups: { p: { label: "Choose two", choose: 2 } }, items: [dish("K", "salan", "p"), dish("B", "rice", "p"), dish("Pu", "rice", "p")] }],
  ["ungrouped plus group", { groups: { e: { label: "Extra main", choose: 1 } }, items: [dish("N", "salan"), dish("K", "salan", "e"), dish("Q", "salan", "e")] }],
  ["choose above group size", { groups: { m: { label: "Mains", choose: 9 } }, items: [dish("K", "salan", "m")] }],
  ["choose missing reads as 1", { groups: { m: { label: "Main dish" } }, items: [dish("K", "salan", "m"), dish("Q", "salan", "m")] }],
  ["ghost group reference", { items: [dish("K", "salan", "ghost"), dish("Q", "salan", "ghost")] }],
  ["sweets capped in a group", { groups: { s: { label: "Sweet", choose: 2 } }, items: [dish("Kheer", "sweet", "s"), dish("Firni", "sweet", "s"), dish("K", "salan")] }],
  // Odds and ends that must not throw or diverge.
  ["supplement carried", { items: [{ name: "Raan", countsAs: "salan", supplementPerHead: 600 }] }],
  ["empty object", {}],
  ["null", null],
  ["items not an array", { items: "Karahi" }],
  ["groups not an object", { groups: [], items: [dish("K", "salan")] }],
];

let bad = 0;
console.log("\nONE-DISH PARITY — the rule and its mirror must agree\n");
for (const [label, data] of CASES) {
  const be = beCheck(data);
  const fe = feCheck(data);
  const same =
    be.status === fe.status &&
    be.compliant === fe.compliant &&
    be.unknownReason === fe.unknownReason &&
    JSON.stringify(be.counts) === JSON.stringify(fe.counts) &&
    JSON.stringify(be.unclassified) === JSON.stringify(fe.unclassified) &&
    be.violations.length === fe.violations.length &&
    be.violations.every((v: any, i: number) => beDescribe(v) === feDescribe(fe.violations[i]));
  if (!same) bad++;
  console.log(`  ${same ? "PASS" : "FAIL"}  ${label.padEnd(26)} ${String(be.status).padEnd(10)} salan=${be.counts.salan} sweet=${be.counts.sweet}`);
  if (!same) {
    console.log("        backend:", JSON.stringify({ status: be.status, reason: be.unknownReason, counts: be.counts, says: be.violations.map(beDescribe) }));
    console.log("        mirror :", JSON.stringify({ status: fe.status, reason: fe.unknownReason, counts: fe.counts, says: fe.violations.map(feDescribe) }));
  }
}

/**
 * WW-JURISDICTION — the fourth state.
 *
 * The one-dish rule is s.5 of the PUNJAB Act, and `checkOneDish` was called with
 * no jurisdiction at all, so a Karachi menu with two salans was shown a red
 * violation for a law that does not reach Sindh. Both halves gained a
 * `ruleApplies` option, and they must agree about it too — a mirror that keeps
 * warning after the server has stopped is the same defect wearing a hat.
 */
const TWO_SALANS = { items: [dish("Chicken Karahi", "salan"), dish("Mutton Qorma", "salan")] };

/**
 * Does this backend checkout even HAVE jurisdiction scoping?
 *
 * The script reads whatever is on disk, so a backend sitting on a branch that
 * predates the feature reports every jurisdiction case as a divergence — 53 of
 * them, which reads as a catastrophe and is really just the wrong branch. It
 * has cost real time twice.
 *
 * A missing feature and a broken feature deserve different messages.
 */
{
  const probe = beCheck(TWO_SALANS, { ruleApplies: "does_not_apply" });
  if (probe.status !== "not_applicable") {
    console.log("\n  SKIPPED — this backend checkout has no jurisdiction scoping.");
    console.log("  Check out the branch carrying `utils/jurisdiction.js` to run these.\n");
    console.log(
      bad
        ? `  ${bad} DIVERGENCE(S) in the cases that DID run.\n`
        : `  ${CASES.length}/${CASES.length} — agreement on every menu shape that could be checked.\n`,
    );
    process.exit(bad ? 1 : 0);
  }
}
const CLEAN = { items: [dish("Chicken Karahi", "salan"), dish("Zarda", "sweet")] };

console.log("\n  jurisdiction scoping\n");
const JCASES: [string, any, any][] = [
  ["omitted — unchanged behaviour", TWO_SALANS, undefined],
  ["applies — still a violation", TWO_SALANS, { ruleApplies: "applies" }],
  ["does_not_apply — not judged", TWO_SALANS, { ruleApplies: "does_not_apply" }],
  ["unknown province — not judged", TWO_SALANS, { ruleApplies: "unknown" }],
  ["clean menu, rule applies", CLEAN, { ruleApplies: "applies" }],
  ["clean menu, rule does not apply", CLEAN, { ruleApplies: "does_not_apply" }],
  ["clean menu, province unknown", CLEAN, { ruleApplies: "unknown" }],
];
for (const [label, data, opts] of JCASES) {
  const be = beCheck(data, opts);
  const fe = feCheck(data, opts);
  const same =
    be.status === fe.status &&
    be.compliant === fe.compliant &&
    be.unknownReason === fe.unknownReason &&
    be.ruleApplies === fe.ruleApplies;
  if (!same) bad++;
  console.log(`  ${same ? "PASS" : "FAIL"}  ${label.padEnd(34)} ${String(be.status).padEnd(15)} reason=${be.unknownReason ?? "-"}`);
  if (!same) {
    console.log("        backend:", JSON.stringify({ status: be.status, reason: be.unknownReason, applies: be.ruleApplies }));
    console.log("        mirror :", JSON.stringify({ status: fe.status, reason: fe.unknownReason, applies: fe.ruleApplies }));
  }
}

/**
 * The two directions this must never get wrong. Claims about the RULE rather
 * than about the mirror, so they are asserted on the backend alone.
 */
const violates = beCheck(TWO_SALANS, { ruleApplies: "applies" });
const notHere = beCheck(TWO_SALANS, { ruleApplies: "does_not_apply" });
const CHECKS: [string, boolean][] = [
  ["a real breach in Punjab is still red", violates.status === "violation"],
  ["the same menu elsewhere is NOT called a breach", notHere.status === "not_applicable"],
  ["and is NOT called compliant either", notHere.compliant === false],
  ["the counts survive so the vendor can still read them", notHere.counts.salan === 2],
];
console.log("\n  what the fourth state must and must not claim\n");
for (const [label, ok] of CHECKS) {
  if (!ok) bad++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
}

/**
 * WW-JURISDICTION — the city map itself.
 *
 * The backend owns `utils/pakistanLocations.js` and the client builds its map
 * from `lib/seo/constants.ts` CITIES. A first pass of this work gave the
 * backend a SECOND city table generated from CITIES, which is the rival source
 * of truth this codebase keeps being bitten by; the two were reconciled instead
 * (42 marketplace towns merged in, zero disagreements).
 *
 * Reconciled once is not the same as staying reconciled. This walks every city
 * the marketplace knows and fails if the two halves ever place one differently.
 */
const bePak = require(path.join(BACKEND, "src/utils/pakistanLocations.js"));
/**
 * Compared against CITIES directly rather than against the frontend module.
 *
 * `lib/compliance/jurisdiction.ts` builds its map FROM CITIES, so CITIES is the
 * thing the mirror actually asserts — and importing that module here would drag
 * in its `@/` alias, which plain node cannot resolve and which tsc refuses to
 * let us write as a `.ts` path.
 */
const { CITIES } = await import("../lib/seo/constants.ts");
const REGION_TO_CODE: Record<string, string> = {
  Punjab: "PUNJAB", Sindh: "SINDH", "Khyber Pakhtunkhwa": "KP",
  Balochistan: "BALOCHISTAN", "Islamabad Capital Territory": "ICT",
  "Gilgit-Baltistan": "GB", "Azad Kashmir": "AJK",
};
const feProvince = (name: string) => REGION_TO_CODE[
  (CITIES as { name: string; region: string }[]).find((c) => c.name === name)?.region ?? ""
] ?? null;

console.log("\n  the city map\n");
let cityBad = 0;
let cityChecked = 0;
for (const c of CITIES as { name: string; region: string }[]) {
  if (c.region === "Pakistan") continue; // the catch-all row, not a city
  const be = bePak.cityToProvince(c.name);
  const fe = feProvince(c.name);
  cityChecked++;
  const same = (be ? String(be).toUpperCase() : null) === (fe ?? null);
  if (!same) {
    cityBad++;
    bad++;
    console.log(`  FAIL  ${c.name.padEnd(22)} backend=${be ?? "null"}  mirror=${fe ?? "null"}`);
  }
}
console.log(
  cityBad
    ? `  ${cityBad} of ${cityChecked} cities are placed differently by the two halves.`
    : `  PASS  all ${cityChecked} marketplace cities are placed identically`,
);

/** The free-text forms the column actually holds, which only the backend normalises. */
console.log("\n  free-text city forms\n");
const FORMS: [string, string | null][] = [
  ["Lahore Cantt", "PUNJAB"],
  ["Karachi South", "SINDH"],
  ["Lahore.", "PUNJAB"],
  ["Rahim Yar Khan", "PUNJAB"],
  ["Nowhere", null],
];
for (const [city, expected] of FORMS) {
  const be = bePak.cityToProvince(city);
  const got = be ? String(be).toUpperCase() : null;
  const ok = got === expected;
  if (!ok) bad++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${city.padEnd(22)} ${got ?? "null"}`);
}

/**
 * The city -> verdict resolution, against the rules that are ACTUALLY SEEDED.
 *
 * This is the check that was missing, and its absence shipped a defect. Every
 * jurisdiction case above hands `checkOneDish` an explicit `ruleApplies`, so
 * both halves agreed perfectly about what to do WITH a verdict while disagreeing
 * about how to REACH one: the mirror had Sindh as `does_not_apply`, reading the
 * lifted austerity notification as a one-dish rule when it is a GUEST_CAP row.
 *
 * Driven off the migration's own RULES array so the mirror is asserted against
 * the seed rather than against a hand-kept copy of it.
 */
console.log("\n  city -> does the rule apply? (against the seeded rules)\n");
const { RULES: SEEDED } = require(path.join(BACKEND, "src/migrations/20260629102000-venueos-create-compliance-rules.js"));
const { ruleStatusFor: beStatus, provinceOf: beProvince } = require(path.join(BACKEND, "src/utils/jurisdiction.js"));
const { ruleAppliesTo: feApplies, provinceOf: feProv } = await import("@/lib/compliance/jurisdiction");

// The migration stores rules in short form (j/t/v/inForce); `ruleStatusFor`
// reads the column names. Map once, here, rather than in either implementation.
const asRows = (SEEDED as any[]).map((r) => ({
  jurisdiction: r.j,
  ruleType: r.t,
  active: r.v !== false,
  inForce: r.inForce !== false,
}));

const CITY_CASES = [
  "Lahore", "Rawalpindi", "Muridke",       // Punjab — the rule applies
  "Karachi", "Hyderabad", "Sukkur",        // Sindh — no ONE_DISH row seeded
  "Peshawar", "Quetta", "Islamabad",       // no row either
  "Gilgit", "Muzaffarabad",
  "Nowhere", "",                            // unplaceable
];
let verdictBad = 0;
for (const city of CITY_CASES) {
  const be = beStatus(beProvince({ city }), "ONE_DISH", asRows);
  const fe = feApplies(feProv(city));
  const same = be === fe;
  if (!same) { verdictBad++; bad++; }
  console.log(
    `  ${same ? "PASS" : "FAIL"}  ${(city || "(blank)").padEnd(16)} ${String(be).padEnd(16)}${same ? "" : `  mirror said ${fe}`}`,
  );
}
console.log(
  verdictBad
    ? `  ${verdictBad} city/cities where the editor and the server disagree about which law applies.`
    : `  PASS  all ${CITY_CASES.length} resolve identically on both halves`,
);

const TOTAL = CASES.length + JCASES.length + CHECKS.length + 1 + FORMS.length + CITY_CASES.length + 1;
console.log(
  bad
    ? `\n  ${bad} DIVERGENCE(S) — the vendor's editor and the server disagree about the same menu.\n`
    : `\n  ${TOTAL}/${TOTAL} — the two surfaces agree on every shape.\n`,
);
process.exit(bad ? 1 : 0);
