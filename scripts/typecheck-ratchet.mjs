#!/usr/bin/env node
/**
 * TypeScript ratchet.
 *
 * `next.config.mjs` sets `typescript.ignoreBuildErrors: true`, so `next build`
 * never fails on a type error. That is not laziness — this repo carries 125
 * pre-existing errors in legacy registration/homepage components, and turning
 * the compiler on wholesale would block every deploy until they were fixed.
 *
 * The cost of leaving it off is that the compiler catches nothing. A payload
 * field was once added to a booking request without being added to its
 * interface; `tsc` flagged it, but only because someone ran `tsc` by hand.
 * Nothing in the repo would have caught the next one.
 *
 * So: don't gate on "zero errors", gate on "no NEW errors". The baseline in
 * typecheck-baseline.json records how many errors of each code each file is
 * allowed to have. Exceed it, or add an error to a file that had none, and
 * this exits non-zero. Fix errors and it tells you to re-baseline, so the
 * count can only ever go down.
 *
 * Keyed by `file|TScode`, never by line number — lines shift when you add an
 * import, and a gate that trips on unrelated edits gets switched off within
 * a week. Counting only the total would let you fix one error and introduce
 * another for free.
 *
 *   node scripts/typecheck-ratchet.mjs            # check (exit 1 on regression)
 *   node scripts/typecheck-ratchet.mjs --update   # rewrite the baseline
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = join(ROOT, "typecheck-baseline.json");
const UPDATE = process.argv.includes("--update");

/**
 * `file(line,col): error TSxxxx: message`
 *
 * The path group is greedy on purpose: Next.js route groups put parentheses in
 * real paths — `app/(dashboard)/page.tsx(9,3): error TS2322: ...`. A lazy match
 * stops at `(dashboard` and silently mis-attributes the error. Anchoring on the
 * LAST `(digits,digits)` is what makes this correct.
 */
const ERROR_RE = /^(.*)\((\d+),(\d+)\): error (TS\d+): (.*)$/;

function runTsc() {
  const res = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["tsc", "-p", "tsconfig.ratchet.json", "--noEmit", "--pretty", "false"],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, shell: process.platform === "win32" },
  );
  if (res.error) {
    console.error("Could not run tsc:", res.error.message);
    process.exit(2);
  }
  return `${res.stdout || ""}${res.stderr || ""}`;
}

/** @returns {{counts: Record<string, number>, samples: Record<string, string>, total: number}} */
function parse(output) {
  const counts = Object.create(null);
  const samples = Object.create(null);
  let total = 0;
  for (const line of output.split(/\r?\n/)) {
    const m = ERROR_RE.exec(line);
    if (!m) continue; // indented continuation lines are part of the previous message
    const [, file, ln, , code, msg] = m;
    const key = `${file.replace(/\\/g, "/")}|${code}`;
    counts[key] = (counts[key] || 0) + 1;
    if (!samples[key]) samples[key] = `${file}:${ln} — ${msg}`;
    total++;
  }
  return { counts, samples, total };
}

const { counts, samples, total } = parse(runTsc());

if (UPDATE) {
  // Sort by hand. An array replacer would filter keys at EVERY level, so the
  // `counts` map — whose keys are file paths — would serialize as `{}`, giving
  // an empty baseline that silently permits every future error.
  const sorted = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(BASELINE, `${JSON.stringify({ total, counts: sorted }, null, 2)}\n`);
  console.log(`Baseline written: ${total} pre-existing errors across ${Object.keys(counts).length} file/code pairs.`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error(`No baseline at ${BASELINE}. Run: node scripts/typecheck-ratchet.mjs --update`);
  process.exit(2);
}

const base = JSON.parse(readFileSync(BASELINE, "utf8"));
const allowed = base.counts || {};

const regressions = [];
for (const [key, n] of Object.entries(counts)) {
  const budget = allowed[key] || 0;
  if (n > budget) regressions.push({ key, n, budget, sample: samples[key] });
}

const improvements = [];
for (const [key, budget] of Object.entries(allowed)) {
  const n = counts[key] || 0;
  if (n < budget) improvements.push({ key, n, budget });
}

if (regressions.length) {
  console.error("\n  TypeScript ratchet: NEW type errors introduced.\n");
  for (const r of regressions) {
    const [file, code] = r.key.split("|");
    const verb = r.budget === 0 ? "was clean, now has" : `allowed ${r.budget}, now has`;
    console.error(`  ${file}`);
    console.error(`    ${code}: ${verb} ${r.n}`);
    console.error(`    ${r.sample}\n`);
  }
  console.error(`  ${total} total errors vs ${base.total} in the baseline.`);
  console.error("  Fix them, or — if the file was already broken and you made it worse");
  console.error("  for a good reason — re-baseline: node scripts/typecheck-ratchet.mjs --update\n");
  process.exit(1);
}

if (improvements.length) {
  const fixed = improvements.reduce((s, i) => s + (i.budget - i.n), 0);
  console.log(`TypeScript ratchet: passed, and ${fixed} baseline error(s) are now fixed.`);
  console.log("Lock it in: node scripts/typecheck-ratchet.mjs --update");
} else {
  console.log(`TypeScript ratchet: passed (${total} known errors, 0 new).`);
}
process.exit(0);
