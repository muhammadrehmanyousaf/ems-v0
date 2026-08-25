/**
 * A17 — the deposit sentences must read identically on both sides.
 *
 * At Review the booking does not exist yet, so the Review screen cannot take
 * these sentences from a server response — it derives them from the venue's own
 * policy, through a mirror of `src/utils/depositLedger.js#describeDepositTerms`.
 *
 * A mirror without a guard is how the Sindh one-dish drift happened: the
 * frontend said the rule applied, the server said `unknown`, and only one of
 * them was right. So this drives BOTH implementations over the same inputs and
 * fails on any divergence — wording included, because the wording IS the
 * promise here ("not part of the price", "ask the venue how soon").
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/deposit-terms-parity.mts
 *   WW_BACKEND=/path/to/ems-v0-backend node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/deposit-terms-parity.mts
 */
import { createRequire } from "node:module";
import path from "node:path";
import { describeDepositTerms as feTerms } from "../lib/booking/deposit-terms.ts";

const require = createRequire(import.meta.url);
const BACKEND = process.env.WW_BACKEND || "C:/Projects/ems-v0-backend";
const ledgerPath = path.join(BACKEND, "src/utils/depositLedger.js");

/** Which backend checkout — and BRANCH — this actually compared against. */
try {
  const { execSync } = await import("node:child_process");
  const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: BACKEND }).toString().trim();
  console.log(`\n  backend: ${BACKEND}  [${branch}]`);
} catch {
  console.log(`\n  backend: ${BACKEND}  [branch unknown]`);
}

let beTerms: (p: unknown) => string[];
try {
  ({ describeDepositTerms: beTerms } = require(ledgerPath));
} catch (e) {
  console.error(`\n  cannot load ${ledgerPath}\n  ${(e as Error).message}\n`);
  process.exit(1);
}

if (typeof beTerms !== "function") {
  console.error("\n  backend depositLedger has no describeDepositTerms — nothing to compare.\n");
  process.exit(1);
}

/**
 * Every shape a real venue row can hold, including the ones that only turn up
 * in production data: a NULL return window (most venues — the column was never
 * on a setup screen), a decimal string from Postgres, and a 1-day window whose
 * singular/plural the two sides could disagree about.
 */
const CASES: Array<Record<string, unknown>> = [
  { securityDepositPkr: 50000, depositReturnDays: 14 },
  { securityDepositPkr: "50000.00", depositReturnDays: 7 },
  { securityDepositPkr: 50000, depositReturnDays: 1 },     // "1 day", not "1 days"
  { securityDepositPkr: 50000, depositReturnDays: 30 },
  { securityDepositPkr: 50000, depositReturnDays: null },  // the live venue 3275
  { securityDepositPkr: 50000 },                           // window absent entirely
  { securityDepositPkr: 50000, depositReturnDays: 0 },
  { securityDepositPkr: 50000, depositReturnDays: -3 },
  { securityDepositPkr: 50000, depositReturnDays: "abc" },
  { securityDepositPkr: "250000.50", depositReturnDays: 10 },
  { securityDepositPkr: 1, depositReturnDays: 1 },
  { securityDepositPkr: 0 },                               // no deposit → say nothing
  { securityDepositPkr: "0.00" },
  { securityDepositPkr: null },
  { securityDepositPkr: -5000 },
  { securityDepositPkr: "not a number" },
  {},
];

let pass = 0;
const failures: string[] = [];

for (const c of [...CASES, null, undefined] as unknown[]) {
  const label = JSON.stringify(c) ?? String(c);
  let be: string[], fe: string[];
  try { be = beTerms(c); } catch (e) { failures.push(`${label}\n     backend THREW: ${(e as Error).message}`); continue; }
  try { fe = feTerms(c as never); } catch (e) { failures.push(`${label}\n     mirror THREW: ${(e as Error).message}`); continue; }

  if (JSON.stringify(be) === JSON.stringify(fe)) {
    pass++;
    const shown = be.length ? `${be.length} line(s)` : "(silent)";
    console.log(`  PASS  ${label.padEnd(52)} ${shown}`);
  } else {
    failures.push(`${label}\n     backend: ${JSON.stringify(be)}\n     mirror : ${JSON.stringify(fe)}`);
  }
}

/**
 * The claim A17 actually makes. Asserted separately from equality, because two
 * implementations can agree perfectly and both be wrong.
 */
const live = beTerms({ securityDepositPkr: 50000, depositReturnDays: null }).join(" ");
const claims: Array<[string, boolean]> = [
  ["states the amount", /50,000/.test(live)],
  ["says it is separate from the total", /separately from your booking total/i.test(live)],
  ["says it is not part of the price", /not part of the price/i.test(live)],
  ["invents no return window when none is set", !/within \d+ days?/.test(live)],
  ["says who to ask instead", /ask the venue/i.test(live)],
];
console.log("");
for (const [what, ok] of claims) {
  if (ok) { pass++; console.log(`  PASS  ${what}`); }
  else failures.push(`A17 claim not met: ${what}\n     text: ${live}`);
}

const total = pass + failures.length;
if (failures.length) {
  console.error(`\n  ${failures.length}/${total} FAILED\n`);
  for (const f of failures) console.error(`   ✖ ${f}\n`);
  process.exit(1);
}
console.log(`\n  ${pass}/${total} — the venue's deposit reads the same on both sides.\n`);
