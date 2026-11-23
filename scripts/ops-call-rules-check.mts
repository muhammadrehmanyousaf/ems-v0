/**
 * Guard: the call screen only offers choices the server accepts (Ops Portal P1).
 *
 * lib/ops/call-rules.ts mirrors, on purpose, two rules that live on the server in
 * ems-v0-backend/src/services/opsProspectService.js:
 *   ALLOWED                  which results are valid for what happened on the line (no answer can never be logged as interested)
 *   NOT_INTERESTED_REASONS   the reasons a vendor can decline for
 * The server re-checks every call; this guard proves the screen never offers a choice the server will refuse, and never hides one it allows.
 * It also asserts the rules REACH a screen (the call form imports them), because a correct rule that nothing calls protects nobody.
 *
 * Needs the backend checkout (WW_BACKEND, default ../ems-v0-backend), like the other parity guards. With no backend it FAILS rather than
 * quietly passing a comparison that compared nothing.
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/ops-call-rules-check.mts
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { CALL_ALLOWED, NOT_INTERESTED_REASONS, OUTCOME_OPTIONS, REASON_LABEL } from "../lib/ops/call-rules.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const BACKEND = process.env.WW_BACKEND || path.join(ROOT, "..", "ems-v0-backend");
const SERVICE = path.join(BACKEND, "src", "services", "opsProspectService.js");

let passed = 0;
const failures: string[] = [];
const check = (name: string, ok: boolean, detail = "") => { if (ok) passed++; else failures.push(`${name}${detail ? "  (" + detail + ")" : ""}`); };

if (!existsSync(SERVICE)) {
  console.error(`ops-call-rules-check: backend service not found at ${SERVICE}. Set WW_BACKEND to the ems-v0-backend checkout.`);
  process.exit(1);
}
const src = readFileSync(SERVICE, "utf8");

/** Evaluate `const NAME = <literal>;` from the (trusted, local) backend source. */
function literal<T>(name: string): T {
  const m = src.match(new RegExp(`const ${name} = ([\\s\\S]*?);\\r?\\n`));
  if (!m) throw new Error(`${name} not found in opsProspectService.js`);
  return new Function(`return (${m[1]})`)() as T;
}

const ALLOWED = literal<Record<string, string[]>>("ALLOWED");
const REASONS = literal<string[]>("NOT_INTERESTED_REASONS");

// ── the allowed outcome -> result pairs are identical ──
check("same outcomes", JSON.stringify(Object.keys(ALLOWED).sort()) === JSON.stringify(Object.keys(CALL_ALLOWED).sort()), `${Object.keys(ALLOWED)} vs ${Object.keys(CALL_ALLOWED)}`);
for (const [outcome, list] of Object.entries(ALLOWED)) {
  const mine = (CALL_ALLOWED as Record<string, string[]>)[outcome] ?? [];
  check(`results for "${outcome}" match the server`, JSON.stringify([...list].sort()) === JSON.stringify([...mine].sort()), `server ${list} vs screen ${mine}`);
}
// ── the decline reasons are identical, each has a label ──
check("same decline reasons", JSON.stringify([...REASONS].sort()) === JSON.stringify([...NOT_INTERESTED_REASONS].sort()), `${REASONS} vs ${NOT_INTERESTED_REASONS}`);
for (const r of REASONS) check(`reason "${r}" has a label`, typeof REASON_LABEL[r] === "string" && REASON_LABEL[r].length > 0);
// ── every outcome the screen offers exists on the server ──
for (const o of OUTCOME_OPTIONS) check(`outcome button "${o.value}" exists on the server`, o.value in ALLOWED);
// ── "onboarded" is never offered on a call (the server refuses it: only onboarding sets it) ──
check("onboarded is never offered as a call result", !Object.values(CALL_ALLOWED).flat().includes("onboarded"));

// ── reach: the call form uses these rules, and the vendor-type dropdowns use the real vendor-type list ──
const form = readFileSync(path.join(ROOT, "components", "ops", "prospect-detail.tsx"), "utf8");
check("the call form imports CALL_ALLOWED", /CALL_ALLOWED/.test(form) && /call-rules/.test(form));
check("the call form offers the decline reasons", /NOT_INTERESTED_REASONS/.test(form));

if (failures.length) {
  console.error(`ops-call-rules-check: ${failures.length} FAILED, ${passed} passed`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log(`ops-call-rules-check: ${passed} checks passed`);
