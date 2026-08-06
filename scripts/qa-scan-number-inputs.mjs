/**
 * QA scan: number inputs that carry no `min` floor.
 *
 * Two bugs already CONFIRMED LIVE on production came from exactly this shape:
 *   - Business Settings > Type-specific: capacities/prices stepped negative,
 *     API rejected on round-trip (fixed, commit 5295fe4).
 *   - Inventory: all four number fields accepted negatives (fixed, 1725bfa).
 *
 * This is a STATIC scan. A hit here is a CANDIDATE, not a finding — the field
 * may be floored by a zod/RHF rule, by a shared <NumberField>, or by an
 * onChange clamp that never renders a `min` attribute. Every hit must still be
 * driven in the live UI (fill hostile value -> save -> hard reload -> read back)
 * before it is called a bug. The point of this file is to aim the browser work,
 * not to replace it.
 *
 * Run:  node scripts/qa-scan-number-inputs.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOTS = ["components", "app"];

/** An <input ...> tag, possibly spanning many lines. */
const INPUT_TAG = /<[Ii]nput\b[^>]*?\/?>/gs;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next") continue;
      walk(p, out);
    } else if (e.name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

const hits = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const src = fs.readFileSync(file, "utf8");
    if (!src.includes('type="number"')) continue;

    for (const m of src.matchAll(INPUT_TAG)) {
      const tag = m[0];
      if (!/type=["']number["']/.test(tag)) continue;
      // `min` may arrive spread in via {...props} — treat that as unknown, not clean.
      const hasMin = /\bmin=/.test(tag);
      const spread = /\{\.\.\./.test(tag);
      if (hasMin) continue;

      const line = src.slice(0, m.index).split("\n").length;
      // Nearest preceding label/placeholder gives the field a human name.
      const before = src.slice(Math.max(0, m.index - 600), m.index);
      const label =
        [...before.matchAll(/>([^<>{}\n]{3,40})<\/[Ll]abel>/g)].pop()?.[1] ??
        /placeholder=["']([^"']{1,30})["']/.exec(tag)?.[1] ??
        "?";
      hits.push({ file, line, label: label.trim(), spread });
    }
  }
}

hits.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

const byFile = new Map();
for (const h of hits) {
  if (!byFile.has(h.file)) byFile.set(h.file, []);
  byFile.get(h.file).push(h);
}

console.log(`\nNumber inputs with NO min= floor — ${hits.length} across ${byFile.size} files`);
console.log(`(CANDIDATES for live testing, not confirmed bugs)\n`);
for (const [file, list] of byFile) {
  console.log(`  ${file}`);
  for (const h of list) {
    console.log(`      :${h.line}  ${h.label}${h.spread ? "   [has {...spread} — min may arrive via props]" : ""}`);
  }
}
console.log("");
