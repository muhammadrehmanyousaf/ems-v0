/**
 * One-off codemod: give every silently-disabled Save button a reason.
 *
 * BUG-057 — 22 of 30 dashboard forms gate submit behind a `canSave` boolean and
 * render NO explanation. Measured live on the packages form with a negative
 * price: button disabled, no message, aria-invalid null, aria-describedby null,
 * no red border. Vendors read that as "the button is broken", which is the
 * "not a single patch is going / the CRUDs don't work" complaint.
 *
 * These forms share one shape:
 *     const canSave = <expr>
 *     <Button disabled={!canSave || someMut.isPending} ...>
 *
 * so the reason can be derived mechanically from the expression's field
 * references and rendered next to the button. This is the FLOOR, not the
 * ceiling: full per-field messages + aria wiring (as done by hand on packages
 * and add-customer) is better, but every form needs to stop being mute first.
 *
 * Run:  node scripts/codemod-form-blocked-hint.mjs [--dry]
 */
import fs from "node:fs";
import path from "node:path";

const DRY = process.argv.includes("--dry");
const ROOT = "components/dashboard";

/** camelCase / dotted field ref -> human words, with correct articles. */
function humanise(ref) {
  const leaf = ref.split(".").pop() ?? ref;
  let words = leaf
    .replace(/Id$/, "")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();

  // Form-state prefixes that mean nothing to a vendor: toName -> name.
  words = words.replace(/^(to|from|new|selected)\s+/, "");

  // Phrases that need their own wording rather than "a <field>".
  const map = {
    amount: "an amount above 0",
    price: "a price above Rs 0",
    cost: "a cost",
    "cost per litre": "a cost per litre",
    qty: "a quantity",
    quantity: "a quantity",
    "hold date": "a date",
    "hold time": "a time",
    "received date": "the date it was received",
    "spent date": "the date it was spent",
    "accrued date": "the date it accrued",
    "issued date": "the date it was issued",
    "expiry date": "an expiry date",
    "cheque date": "a cheque date",
    "valid from": "a start date",
    "valid until": "an end date",
    "name snapshot": "a name",
    "broker name snapshot": "a broker name",
    litres: "the number of litres",
    type: "a type",
  };
  if (map[words]) return map[words];

  // Plural nouns take no article ("add litres", not "add a litres").
  const isPlural = /s$/.test(words) && !/(ss|us|is)$/.test(words);
  if (isPlural) return words;

  const article = /^[aeiou]/.test(words) ? "an" : "a";
  return `${article} ${words}`;
}

/** Pull field references out of a canSave expression. */
function fieldsFrom(expr) {
  const refs = new Set();
  // form.foo / state.foo
  for (const m of expr.matchAll(/\b(?:form|state)\.([A-Za-z_]\w*)/g)) refs.add(m[1]);
  // bare identifiers used with .trim() e.g. name.trim()
  for (const m of expr.matchAll(/\b([A-Za-z_]\w*)\.trim\(\)/g)) {
    if (!["form", "state"].includes(m[1])) refs.add(m[1]);
  }
  // `businessId != null` style guards
  for (const m of expr.matchAll(/\b([A-Za-z_]\w*Id)\s*!=\s*null/g)) refs.add(m[1]);
  return [...refs];
}

function buildMessage(expr) {
  const parts = fieldsFrom(expr)
    .map(humanise)
    // A missing businessId/bookingId is a wiring problem, not something the
    // vendor can type — don't tell them to "add a business".
    .filter((p) => !/^a (business|booking)$/.test(p));
  if (!parts.length) return "Fill in the required fields above to save.";
  const uniq = [...new Set(parts)];
  const list =
    uniq.length === 1
      ? uniq[0]
      : `${uniq.slice(0, -1).join(", ")} and ${uniq[uniq.length - 1]}`;
  return `Add ${list} to save.`;
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

const changed = [];
const skipped = [];

for (const file of walk(ROOT)) {
  let src = fs.readFileSync(file, "utf8");

  // Already has real field-level messaging? Leave it alone.
  if (src.includes("FormBlockedHint")) { skipped.push([file, "already done"]); continue; }

  const canSaveRe = /^(\s*)const (canSave|canSubmit|canPlace|canAdd)\s*=\s*([\s\S]*?)\n(?=\s*(?:const|return|\/\/|\n))/m;
  const m = src.match(canSaveRe);
  if (!m) { skipped.push([file, "no canSave gate"]); continue; }

  const [full, indent, varName, expr] = m;
  // Must also have a Button disabled by that gate.
  const btnRe = new RegExp(`(\\s*)<Button([^>]*?)disabled=\\{!${varName}\\s*\\|\\|`, "m");
  const btn = src.match(btnRe);
  if (!btn) { skipped.push([file, "no disabled Button using the gate"]); continue; }

  const message = buildMessage(expr);

  // 1) insert the reason const right after the gate
  src = src.replace(
    canSaveRe,
    `${full}${indent}// BUG-057 — a disabled button is not feedback. Say what it is waiting for.\n${indent}const blockedReason = ${varName} ? undefined : "${message.replace(/"/g, '\\"')}"\n`,
  );

  // 2) render the hint immediately before that Button
  src = src.replace(btnRe, (_s, ws, attrs) => `${ws}<FormBlockedHint message={blockedReason} />${ws}<Button${attrs}disabled={!${varName} ||`);

  // 3) import
  if (!src.includes('from "@/components/dashboard/primitives/field-error"')) {
    const lastImport = src.lastIndexOf("\nimport ");
    const eol = src.indexOf("\n", lastImport + 1);
    src =
      src.slice(0, eol) +
      `\nimport { FormBlockedHint } from "@/components/dashboard/primitives/field-error"` +
      src.slice(eol);
  }

  if (!DRY) fs.writeFileSync(file, src);
  changed.push([file, message]);
}

console.log(`\nCHANGED (${changed.length}):`);
for (const [f, msg] of changed) console.log(`  ${f}\n      -> "${msg}"`);
console.log(`\nSKIPPED (${skipped.length}):`);
const reasons = {};
for (const [, r] of skipped) reasons[r] = (reasons[r] || 0) + 1;
console.log("  " + JSON.stringify(reasons));
