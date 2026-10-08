/**
 * Field help: the content map in lib/field-help.ts, checked as data.
 *
 * There is no component test runner in this app, so this follows the pattern of
 * the other `scripts/*.mts` checks: drive the real module and fail loudly. The
 * behaviour of the "?" itself (opens on focus, Escape closes, aria linkage,
 * stays on screen) is covered by e2e/public.field-help.spec.ts.
 *
 * What it guards:
 *
 *   1. No entry is empty, and each stays SHORT. A help bubble that needs
 *      scrolling is a help page; the whole point is a line you read in a glance.
 *   2. Every key is used by a form. An entry nobody renders is dead copy that
 *      drifts out of date and gets "fixed" for nothing.
 *   3. Every key a form names exists. Typed props catch this in tsc, but the
 *      specialty steps derive keys from field names at run time, so a rename on
 *      one side would silently drop the "?".
 *   4. Plain ASCII only, so a curly quote or dash cannot arrive as mojibake on
 *      a device with a different encoding path.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/field-help-check.mts
 */
import fs from "node:fs";
import path from "node:path";
import { FIELD_HELP, fieldHelpPlainText, hasFieldHelp } from "@/lib/field-help";

let bad = 0;
const t = (label: string, ok: boolean, detail = "") => {
  if (!ok) bad++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `\n            ${detail}` : ""}`);
};

const MAX_TEXT = 240;
const MAX_EXAMPLE = 80;
const MAX_WHY = 240;
const MAX_TOTAL = 430;

const entries = Object.entries(FIELD_HELP);

console.log(`\n${entries.length} help entries; each is present, short and plain:`);

const problems: string[] = [];
for (const [key, e] of entries) {
  if (!/^[a-z][A-Za-z0-9]*$/.test(key)) problems.push(`${key}: key is not camelCase`);
  if (!e.name?.trim()) problems.push(`${key}: empty name`);
  if (!e.text?.trim()) problems.push(`${key}: empty text`);
  if (e.example !== undefined && !e.example.trim()) problems.push(`${key}: example is present but blank`);
  if (e.why !== undefined && !e.why.trim()) problems.push(`${key}: why is present but blank`);
  if (e.text.length > MAX_TEXT) problems.push(`${key}: text is ${e.text.length} chars (max ${MAX_TEXT})`);
  if ((e.example?.length ?? 0) > MAX_EXAMPLE) problems.push(`${key}: example is ${e.example!.length} chars (max ${MAX_EXAMPLE})`);
  if ((e.why?.length ?? 0) > MAX_WHY) problems.push(`${key}: why is ${e.why!.length} chars (max ${MAX_WHY})`);
  const total = fieldHelpPlainText(e).length;
  if (total > MAX_TOTAL) problems.push(`${key}: ${total} chars in all (max ${MAX_TOTAL})`);
  if (!/[.?!]$/.test(e.text.trim())) problems.push(`${key}: text should end like a sentence`);
  for (const [field, value] of Object.entries(e)) {
    if (typeof value === "string" && /[^\x20-\x7E]/.test(value)) problems.push(`${key}.${field}: non-ASCII character`);
    if (typeof value === "string" && /\s{2,}/.test(value)) problems.push(`${key}.${field}: double space`);
    if (typeof value === "string" && /\b(TODO|FIXME|lorem)\b/i.test(value)) problems.push(`${key}.${field}: placeholder text`);
  }
}
t("every entry has a name and text, within the length limits", problems.length === 0, problems.slice(0, 8).join("\n            "));

// -- usage ----------------------------------------------------------------
const ROOT = process.cwd();
const SKIP = new Set(["node_modules", ".next", ".git", "e2e", "scripts", "cypress", "docs"]);
const sources: { file: string; text: string }[] = [];
(function walk(dir: string) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (/\.(tsx|ts)$/.test(ent.name)) {
      const rel = path.relative(ROOT, full).replace(/\\/g, "/");
      if (rel === "lib/field-help.ts" || rel === "components/ui/field-help.tsx") continue;
      sources.push({ file: rel, text: fs.readFileSync(full, "utf8") });
    }
  }
})(ROOT);

console.log("\nevery entry is used by a form, and every key a form names exists:");

const unused = entries
  .map(([key]) => key)
  .filter((key) => {
    const re = new RegExp(`["'\`]${key}["'\`]`);
    return !sources.some((s) => re.test(s.text));
  });
t("no entry is orphaned", unused.length === 0, unused.join(", "));

const unknown: string[] = [];
const refRe = /\b(?:help|field)=(?:"([A-Za-z0-9]+)"|'([A-Za-z0-9]+)')/g;
const ternaryRe = /help=\{[^}]*\?\s*"([A-Za-z0-9]+)"\s*:\s*"([A-Za-z0-9]+)"[^}]*\}/g;
for (const s of sources) {
  for (const m of s.text.matchAll(refRe)) {
    const key = m[1] ?? m[2];
    // `field=` is also used by react-hook-form style props elsewhere; only judge
    // files that actually import the help components.
    if (/field-help/.test(s.text) && !hasFieldHelp(key)) unknown.push(`${s.file}: ${key}`);
  }
  for (const m of s.text.matchAll(ternaryRe)) {
    for (const key of [m[1], m[2]]) if (!hasFieldHelp(key)) unknown.push(`${s.file}: ${key}`);
  }
}
t("every help=\"...\" / field=\"...\" names a real entry", unknown.length === 0, unknown.join("\n            "));

// -- the plain-text description a screen reader gets ------------------------
console.log("\nthe screen-reader description carries the whole entry:");
const sample = FIELD_HELP.ntnNumber;
const plain = fieldHelpPlainText(sample);
t("includes the text", plain.includes(sample.text));
t("includes the example", !!sample.example && plain.includes(sample.example));
t("includes the privacy line", !!sample.why && plain.includes(sample.why));
t("an entry with only text is just the text", fieldHelpPlainText({ name: "x", text: "Hello." }) === "Hello.");

// -- sensitive fields must say why and who sees them -------------------------
console.log("\nthe sensitive fields say why they are asked:");
for (const key of [
  "ntnNumber",
  "email",
  "phoneNumber",
  "password",
  "accountTitle",
  "accountNumber",
  "iban",
  "docCnicFront",
  "docCnicBack",
  "docNtn",
  "docBankAttestation",
] as const) {
  t(`${key} explains why it is asked`, !!FIELD_HELP[key].why);
}

console.log(bad ? `\n${bad} check(s) FAILED\n` : "\nall field-help checks passed\n");
process.exit(bad ? 1 : 0);
