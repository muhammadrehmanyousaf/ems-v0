/**
 * 10.13 / 10.16 — the space verdict must read identically on both sides.
 *
 * At the date step the booking does not exist yet, so the wizard cannot take
 * this verdict from a server response — it derives it from the space tree the
 * page already fetched, through a mirror of `src/utils/spaceRequirements.js`.
 *
 * A mirror without a guard is how the Sindh one-dish drift happened: the
 * frontend said the rule applied, the server said `unknown`, and only one of
 * them was right. So this drives BOTH implementations over the same inputs and
 * fails on any divergence — wording included, because a family reads the
 * wording and decides whether the women of the household are attending.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/space-fit-parity.mts
 *   WW_BACKEND=/path/to/ems-v0-backend node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/space-fit-parity.mts
 */
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import {
  checkGenderFit as feFit,
  describeBackupPlan as fePlan,
  isWeatherExposed as feExposed,
} from "../lib/booking/space-fit.ts";

const require = createRequire(import.meta.url);
const BACKEND = process.env.WW_BACKEND || "C:/Projects/ems-v0-backend";
const modulePath = path.join(BACKEND, "src/utils/spaceRequirements.js");

/** Which backend checkout — and BRANCH — this actually compared against. */
try {
  const { execSync } = await import("node:child_process");
  const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: BACKEND }).toString().trim();
  console.log(`\n  backend: ${BACKEND}  [${branch}]`);
} catch {
  console.log(`\n  backend: ${BACKEND}  [branch unknown]`);
}

let beFit: (requested: unknown, space: unknown) => unknown;
let bePlan: (space: unknown, backup: unknown) => unknown;
let beExposed: (space: unknown) => boolean;
try {
  ({
    checkGenderFit: beFit,
    describeBackupPlan: bePlan,
    isWeatherExposed: beExposed,
  } = require(modulePath));
} catch (e) {
  console.error(`\n  cannot load ${modulePath}\n  ${(e as Error).message}\n`);
  process.exit(1);
}

for (const [name, fn] of [["checkGenderFit", beFit], ["describeBackupPlan", bePlan], ["isWeatherExposed", beExposed]] as const) {
  if (typeof fn !== "function") {
    console.error(`\n  backend spaceRequirements has no ${name} — nothing to compare.\n`);
    process.exit(1);
  }
}

let pass = 0;
const failures: string[] = [];

const eq = (label: string, a: unknown, b: unknown) => {
  if (JSON.stringify(a) === JSON.stringify(b)) {
    pass++;
    console.log(`  PASS  ${label}`);
  } else {
    failures.push(`${label}\n     backend: ${JSON.stringify(a)}\n     mirror : ${JSON.stringify(b)}`);
  }
};

/* ── the gender fit ───────────────────────────────────────────────────── */

/**
 * Every combination of the four modes, plus the shapes real rows actually
 * hold: a space that never had a genderMode set, lowercase from a hand-written
 * import, whitespace, and the space being missing entirely.
 */
const MODES = ["MIXED", "MARDANA", "ZENANA", "SEGREGABLE"];
const REQUESTS: unknown[] = [...MODES, null, undefined, "", "mixed", " zenana ", "OTHER", 5, {}];
const SPACES: unknown[] = [
  ...MODES.map((m) => ({ id: 1, name: "Shalimar Hall", kind: "HALL", genderMode: m })),
  { id: 2, name: "Front Lawn", kind: "LAWN", genderMode: null },        // never set
  { id: 3, name: "Side Hall", kind: "HALL", genderMode: "mixed" },      // lowercase
  { id: 4, name: "Terrace", kind: "ROOFTOP", genderMode: " ZENANA " },  // padded
  { id: 5, name: "", kind: "HALL", genderMode: "MIXED" },               // no name
  { id: 6, kind: "HALL", genderMode: "MIXED" },                         // name absent
  {},
  null,
  undefined,
];

console.log("");
for (const req of REQUESTS) {
  for (const space of SPACES) {
    const label = `fit(${JSON.stringify(req) ?? String(req)}, ${JSON.stringify(space) ?? String(space)})`;
    let be: unknown, fe: unknown;
    try { be = beFit(req, space); } catch (e) { failures.push(`${label}\n     backend THREW: ${(e as Error).message}`); continue; }
    try { fe = feFit(req, space as never); } catch (e) { failures.push(`${label}\n     mirror THREW: ${(e as Error).message}`); continue; }
    if (JSON.stringify(be) === JSON.stringify(fe)) pass++;
    else failures.push(`${label}\n     backend: ${JSON.stringify(be)}\n     mirror : ${JSON.stringify(fe)}`);
  }
}
console.log(`  PASS  ${REQUESTS.length * SPACES.length} gender-fit combinations agree`);

/* ── the wet-weather plan ─────────────────────────────────────────────── */

const PLAN_CASES: Array<[unknown, unknown]> = [
  [{ id: 1, name: "Front Lawn", kind: "LAWN" }, { id: 2, name: "Shalimar Hall" }],
  [{ id: 1, name: "Front Lawn", kind: "LAWN" }, null],
  [{ id: 1, name: "Front Lawn", kind: "LAWN" }, { id: 2, name: "" }],       // backup with no name
  [{ id: 1, name: "Sky Terrace", kind: "ROOFTOP" }, { id: 2, name: "Hall A" }],
  [{ id: 1, name: "Shalimar Hall", kind: "HALL" }, { id: 2, name: "Hall B" }], // indoors: silent
  [{ id: 1, name: "Lawn", kind: "lawn" }, { id: 2, name: "Hall A" }],       // lowercase kind
  [{ id: 1, name: "Unknown", kind: null }, null],
  [{ id: 1, name: "Unknown" }, null],
  [null, null],
  [undefined, undefined],
];

console.log("");
for (const [space, backup] of PLAN_CASES) {
  const label = `plan(${JSON.stringify(space) ?? String(space)}, ${JSON.stringify(backup) ?? String(backup)})`;
  let be: unknown, fe: unknown;
  try { be = bePlan(space, backup); } catch (e) { failures.push(`${label}\n     backend THREW: ${(e as Error).message}`); continue; }
  try { fe = fePlan(space as never, backup as never); } catch (e) { failures.push(`${label}\n     mirror THREW: ${(e as Error).message}`); continue; }
  eq(label, be, fe);
}

for (const space of [{ kind: "LAWN" }, { kind: "ROOFTOP" }, { kind: "HALL" }, { kind: "lawn" }, { kind: null }, {}, null]) {
  eq(`exposed(${JSON.stringify(space) ?? String(space)})`, beExposed(space), feExposed(space as never));
}

/* ── the claims, asserted separately ──────────────────────────────────── */

/**
 * Two implementations can agree perfectly and both be wrong. These are the
 * things 10.13 and 10.16 actually promise.
 */
const zenanaIntoMixed = beFit("ZENANA", { name: "Shalimar Hall", kind: "HALL", genderMode: "MIXED" }) as { status: string; reason: string };
const zenanaIntoSegregable = beFit("ZENANA", { name: "Shalimar Hall", kind: "HALL", genderMode: "SEGREGABLE" }) as { status: string };
const nothingAsked = beFit(null, { name: "Hall", kind: "HALL", genderMode: "MIXED" }) as { status: string };
const spaceSilent = beFit("ZENANA", { name: "Hall", kind: "HALL", genderMode: null }) as { status: string; reason: string };
const noPlan = bePlan({ name: "Front Lawn", kind: "LAWN" }, null) as { hasPlan: boolean; message: string };

console.log("");
const claims: Array<[string, boolean]> = [
  ["a zenana function in a MIXED hall is a mismatch", zenanaIntoMixed.status === "mismatch"],
  ["and the customer is told which hall and why", /Shalimar Hall/.test(zenanaIntoMixed.reason) && /zenana/i.test(zenanaIntoMixed.reason)],
  ["and pointed at the thing that can fix it", /partition/i.test(zenanaIntoMixed.reason)],
  // A hall with a partition is the normal Pakistani answer to "can you do a
  // zenana side". Calling it a mismatch would refuse the venues most able to help.
  ["a SEGREGABLE hall can host a zenana function", zenanaIntoSegregable.status === "fits"],
  // Absence of a stated requirement is not a requirement. "fits" would be a
  // claim nobody made.
  ["asking for nothing yields `unknown`, never `fits`", nothingAsked.status === "unknown"],
  ["a space that has said nothing yields `unknown`", spaceSilent.status === "unknown"],
  ["and says to ask the venue", /ask the venue/i.test(spaceSilent.reason)],
  // Phrased as a question FOR the venue, not a defect OF it — the field did
  // not exist until now, and most venues have had a plan for twenty years.
  ["a lawn with no backup is a question, not an accusation", noPlan.hasPlan === false && /Ask the venue/.test(noPlan.message)],
  ["and never claims the venue has no plan", !/no plan exists|does not have/i.test(noPlan.message)],
];
for (const [what, ok] of claims) {
  if (ok) { pass++; console.log(`  PASS  ${what}`); }
  else failures.push(`claim not met: ${what}`);
}

/* ── and that any of it REACHES a screen ──────────────────────────────── */

/**
 * The bug that made all of this necessary. `spaceRequirements` was written,
 * correct, unit-tested — and required by nothing, so a family booking a zenana
 * function into a MIXED hall found out when the guests arrived. Parity with a
 * dead function is worth nothing.
 *
 * Every link is asserted, because wiring a check to an input nobody can supply
 * only relocates the dead code: asked → typed → sent → and the two verdicts
 * rendered.
 */
console.log("");
const STEP = "components/booking/steps-v2/date-time-step.tsx";
const FORM = "components/booking/booking-form.tsx";
const TYPES = "lib/types.ts";
const read = (rel: string) => fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");

try {
  const step = read(STEP);
  const form = read(FORM);
  const types = read(TYPES);

  const wiring: Array<[string, boolean]> = [
    ["the step imports the mirror", /from\s*["']@\/lib\/booking\/space-fit["']/.test(step)],
    ["the customer is asked at all", /ARRANGEMENT_CHOICES\.map/.test(step)],
    ["the answer is stored on the form", /requestedGenderMode:\s*\(e\.target\.value/.test(step)],
    ["the field is typed, not smuggled through `any`", /requestedGenderMode\?:/.test(types)],
    ["the step runs the fit check", /checkGenderFit\(formData\.requestedGenderMode/.test(step)],
    // Matches the RENDER, not the variable. The first version of the deposit
    // guard tested for "{depositTerms" and passed happily while the sentences
    // were replaced by {null} — it was matching the surrounding conditional.
    ["a mismatch is actually rendered", /\{\s*genderFit\.reason\s*\}/.test(step)],
    ["the step runs the weather check", /describeBackupPlan\(selectedSubVenue/.test(step)],
    ["the wet-weather line is actually rendered", /\{\s*backupPlan\.message\s*\}/.test(step)],
    // Both were on the wire and both were dropped by the flatten, so neither
    // check had anything to read.
    ["the space tree keeps genderMode", /genderMode:\s*\(n as any\)\.genderMode/.test(step)],
    ["the space tree keeps the backup", /backupSubVenueId:\s*\(n as any\)\.backupSubVenueId/.test(step)],
    ["the payload sends it to the server", /payload\.requestedGenderMode\s*=\s*currentForm\.requestedGenderMode/.test(form)],
    // Absence is not a value: sending MIXED for "didn't say" would record a
    // requirement the family never stated.
    ["and omits it when nothing was asked for", /if\s*\(currentForm\.requestedGenderMode\)/.test(form)],
  ];
  for (const [what, ok] of wiring) {
    if (ok) { pass++; console.log(`  PASS  ${what}`); }
    else failures.push(`the check is computed but never reaches a customer: ${what}`);
  }
} catch (e) {
  failures.push(`cannot read a wiring file: ${(e as Error).message}`);
}

/**
 * And the vendor half. A family stating "ladies only" whose venue never learns
 * it is no better off than one that was never asked — the venue is the only
 * party that can put up a partition.
 */
try {
  const controller = fs.readFileSync(path.join(BACKEND, "src/controllers/bookingController.js"), "utf8");
  const orderController = fs.readFileSync(path.join(BACKEND, "src/controllers/bookingOrderController.js"), "utf8");
  const hierarchy = fs.readFileSync(path.join(BACKEND, "src/services/venueHierarchyService.js"), "utf8");

  const server: Array<[string, boolean]> = [
    // Every Booking attribute allowlist that feeds a vendor or admin screen.
    ["the vendor's bookings list returns it", (controller.match(/requestedGenderMode/g) || []).length >= 5],
    ["the customer's order returns it", /requestedGenderMode: booking\.requestedGenderMode/.test(orderController)],
    ["the order re-runs the checks", /checkGenderFit\(booking\.requestedGenderMode/.test(orderController)],
    // Without this the wet-weather branch is permanently unreachable.
    ["a vendor can set a wet-weather backup", /clean\.backupSubVenueId = await resolveBackupSubVenueId/.test(hierarchy)],
    ["an open-air backup is refused", /BACKUP_ALSO_OPEN_AIR/.test(hierarchy)],
    ["deleting a space clears references to it", /backupSubVenueId: null/.test(hierarchy)],
  ];
  for (const [what, ok] of server) {
    if (ok) { pass++; console.log(`  PASS  ${what}`); }
    else failures.push(`the server half is incomplete: ${what}`);
  }
} catch (e) {
  failures.push(`cannot read a backend file: ${(e as Error).message}`);
}

const total = pass + failures.length;
if (failures.length) {
  console.error(`\n  ${failures.length}/${total} FAILED\n`);
  for (const f of failures) console.error(`   ✖ ${f}\n`);
  process.exit(1);
}
console.log(`\n  ${pass}/${total} — the space says the same thing on both sides, and it reaches a screen.\n`);
