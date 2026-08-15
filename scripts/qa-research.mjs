/**
 * Phase 0 — RESEARCH. What is this system supposed to do?
 *
 *   node scripts/qa-research.mjs
 *
 * Writes QA_RESEARCH.md: the data model, every validation rule, every status
 * enum, and every error code the API can return — extracted from source.
 *
 * WHY THIS EXISTS, stated plainly because it was a real failure:
 *
 * The first Depth 3 pass tested for crashes. It checked that links resolved,
 * that nothing threw, that the layout held. It found a dialog missing a title.
 * What it could NOT find was a booking accepting an invalid date range, a status
 * moving somewhere it should not, a field saving past its column width, or a
 * price computed wrongly — because it had no idea what correct looked like.
 *
 * Testing without expectations only finds the bugs that scream. Everything that
 * fails quietly — which is everything that matters about money and bookings —
 * survives. So: derive the expected behaviour from source FIRST, then test
 * against it.
 *
 * Each extracted rule is a test case. A field declared `allowNull: false,
 * len: [1, 255]` is four tests: empty, one char, 255 chars, 256 chars.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const api = resolve(root, "..", "event-planner-api");
const read = (p) => { try { return readFileSync(p, "utf8"); } catch { return ""; } };

// ── Models: fields, constraints, enums ──────────────────────────────────────
/**
 * Sequelize model definitions are the contract the database enforces. A field
 * that is `allowNull: false` with no default WILL 500 the request if the UI ever
 * submits without it — which is exactly how vendor registration was returning
 * "transaction aborted" on a VARCHAR(255) overflow.
 */
function extractModels() {
  const dir = join(api, "src/models");
  const out = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".js"))) {
    const src = read(join(dir, f));

    /**
     * 210 of 211 models use `class X extends Model` + `X.init({...}, {...})`.
     * Only 6 use `sequelize.define`. The first version of this extractor looked
     * only for `define` and so produced NOTHING for the booking model — the
     * single most important model in the system — while still reporting a
     * confident total. Both patterns are handled, and the attributes object is
     * sliced out explicitly so association calls below it are not mistaken for
     * fields.
     */
    const name =
      (src.match(/modelName\s*:\s*["'](\w+)["']/) ||
        src.match(/class\s+(\w+)\s+extends\s+Model/) ||
        src.match(/sequelize\.define\(\s*["'](\w+)["']/) || [])[1] || f.replace(/\.js$/, "");

    // The attributes object: from `.init(` / `define("x",` to the options object.
    const start = src.search(/\.init\(\s*\{|define\(\s*["']\w+["']\s*,\s*\{/);
    const attrs = start === -1 ? src : src.slice(start);
    const fields = [];

    /**
     * Braced fields FIRST, then their text is blanked out before the shorthand
     * pass runs. Otherwise the `type: DataTypes.STRING` line *inside* every
     * braced block matches the shorthand pattern and every field comes out
     * named "type" — which is exactly what happened.
     */
    let remaining = attrs;
    for (const m of attrs.matchAll(/^\s{4,}(\w+)\s*:\s*\{([\s\S]{0,700}?)^\s{4,}\},?\s*$/gm)) {
      const [whole, field, body] = m;
      remaining = remaining.replace(whole, "");
      if (!/type\s*:/.test(body)) continue;
      const type = (body.match(/type\s*:\s*DataTypes\.(\w+)(\([^)]*\))?/) || [])[0]?.replace("type: DataTypes.", "").replace(/\s+/g, " ") || "?";
      // Values come from inside ENUM(...) only. Reading quoted strings from the
      // whole body swept in `defaultValue: "Pending"` and duplicated it as a state.
      const enumBody = (body.match(/ENUM\(\s*\[?([\s\S]*?)\]?\s*\)/) || [])[1] || "";
      const enumVals = [...enumBody.matchAll(/["']([^"']+)["']/g)].map((x) => x[1]);
      const rec = { field, type };
      if (/allowNull\s*:\s*false/.test(body)) rec.required = true;
      if (/unique\s*:\s*true/.test(body)) rec.unique = true;
      const def = (body.match(/defaultValue\s*:\s*([^,\n]+)/) || [])[1];
      if (def) rec.default = def.trim().slice(0, 40);
      if (/ENUM/.test(type)) rec.values = enumVals.filter((v) => !/^(ENUM|DataTypes)$/.test(v));
      const len = (body.match(/len\s*:\s*\[\s*(\d+)\s*,\s*(\d+)/) || []);
      if (len[1]) rec.len = [Number(len[1]), Number(len[2])];
      const varchar = (type.match(/STRING\((\d+)\)/) || [])[1];
      if (varchar) rec.maxLength = Number(varchar);
      fields.push(rec);
    }

    // Shorthand: `totalAmount: DataTypes.DECIMAL(12, 2),` — no braces at all.
    // Money columns are declared this way, so missing them missed the money.
    for (const m of remaining.matchAll(/^\s{4,}(\w+)\s*:\s*DataTypes\.(\w+)(\([^)]*\))?\s*,\s*$/gm)) {
      if (m[1] === "type" || fields.some((x) => x.field === m[1])) continue;
      fields.push({ field: m[1], type: m[2] + (m[3] || "") });
    }

    if (fields.length) out.push({ model: name, file: `models/${f}`, fields });
  }
  return out;
}

// ── Validators: what the API rejects before it reaches a controller ─────────
function extractValidators() {
  const dir = join(api, "src/validators");
  const out = [];
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".js") && x !== "index.js")) {
    const src = read(join(dir, f));
    const rules = [];
    // body("field").notEmpty().isEmail().isLength({min,max}) …
    for (const m of src.matchAll(/\b(body|param|query)\(\s*["']([\w.[\]]+)["']\s*\)([\s\S]{0,300}?)(?=,\s*\n|\n\s*\]|\n\s*\)|$)/g)) {
      const [, loc, field, chain] = m;
      const checks = [];
      for (const c of chain.matchAll(/\.(\w+)\(([^)]{0,80})\)/g)) {
        if (["withMessage", "trim", "escape"].includes(c[1])) continue;
        checks.push(c[2] ? `${c[1]}(${c[2].replace(/\s+/g, " ").slice(0, 44)})` : c[1]);
      }
      const msg = (chain.match(/withMessage\(\s*["']([^"']+)/) || [])[1];
      if (checks.length) rules.push({ loc, field, checks, message: msg });
    }
    if (rules.length) out.push({ file: `validators/${f}`, rules });
  }
  return out;
}

// ── Error codes: the vocabulary a test can assert on ────────────────────────
function extractErrorCodes() {
  const dirs = ["src/controllers", "src/services", "src/middlewares"];
  const codes = new Map();
  for (const d of dirs) {
    const full = join(api, d);
    if (!existsSync(full)) continue;
    const walk = (p) => {
      for (const e of readdirSync(p, { withFileTypes: true })) {
        const fp = join(p, e.name);
        if (e.isDirectory()) { walk(fp); continue; }
        if (!e.name.endsWith(".js")) continue;
        const src = read(fp);
        for (const m of src.matchAll(/code\s*:\s*["']([A-Z][A-Z0-9_]{2,})["']/g)) {
          const c = m[1];
          if (!codes.has(c)) codes.set(c, new Set());
          codes.get(c).add(`${d.replace("src/", "")}/${e.name}`);
        }
        // apiResponse(res, 409, false, "...", { code })
        for (const m of src.matchAll(/apiResponse\(\s*res\s*,\s*(\d{3})[^)]{0,140}?code:\s*["']([A-Z_0-9]+)["']/g)) {
          const c = m[2];
          if (!codes.has(c)) codes.set(c, new Set());
          codes.get(c).add(`HTTP ${m[1]}`);
        }
      }
    };
    walk(full);
  }
  return [...codes.entries()].map(([code, where]) => ({ code, where: [...where] })).sort((a, b) => a.code.localeCompare(b.code));
}

const models = extractModels();
const validators = extractValidators();
const errorCodes = extractErrorCodes();

// Models that matter most to the flows under test.
const CORE = /^(booking|payment|business|user|quote|lead|review|dispute|complaint|cancellation|installment|slot|hold|staff|customer)/i;
const core = models.filter((m) => CORE.test(m.model) || CORE.test(m.file.replace("models/", "")));

const fieldLine = (f) => {
  const bits = [`\`${f.field}\``, f.type];
  if (f.required) bits.push("**required**");
  if (f.unique) bits.push("**unique**");
  if (f.maxLength) bits.push(`max ${f.maxLength}`);
  if (f.len) bits.push(`len ${f.len[0]}–${f.len[1]}`);
  if (f.default) bits.push(`default ${f.default}`);
  if (f.values?.length) bits.push(`= ${f.values.map((v) => `\`${v}\``).join(" \\| ")}`);
  return `| ${bits[0]} | ${bits.slice(1).join(" · ")} |`;
};

const enumModels = models.filter((m) => m.fields.some((f) => f.values?.length));
const requiredCount = models.reduce((a, m) => a + m.fields.filter((f) => f.required).length, 0);
const uniqueCount = models.reduce((a, m) => a + m.fields.filter((f) => f.unique).length, 0);
const boundedCount = models.reduce((a, m) => a + m.fields.filter((f) => f.maxLength || f.len).length, 0);
const validatorRules = validators.reduce((a, v) => a + v.rules.length, 0);

const out = `# QA_RESEARCH.md — what the system is supposed to do

Generated by \`scripts/qa-research.mjs\` from \`event-planner-api\`. Re-run it; do
not hand-edit.

**Read this before testing anything.** Testing without expectations finds only the
bugs that scream — a crash, a 404, a blank screen. Everything that fails quietly
(a wrong total, an illegal status transition, a field silently truncated) survives
a crash-hunt untouched. Every rule below is a test case with a known correct answer.

## What was extracted

| | Count |
|---|---:|
| Models | ${models.length} |
| Fields with a **NOT NULL** constraint | ${requiredCount} |
| Fields with a **UNIQUE** constraint | ${uniqueCount} |
| Fields with a **length bound** | ${boundedCount} |
| Models carrying an **ENUM** (a state machine) | ${enumModels.length} |
| Validator rules | ${validatorRules} across ${validators.length} files |
| Distinct API error codes | ${errorCodes.length} |

## How a constraint becomes tests

A field declared \`allowNull: false\` with \`STRING(255)\` is **four** tests:

| Input | Expected |
|---|---|
| omitted / empty | rejected with a field-specific message |
| 1 character | accepted |
| 255 characters | accepted **and stored whole** — reload and re-read |
| 256 characters | rejected by validation, **never** a 500 |

That last row is not hypothetical: vendor registration returned
\`transaction aborted\` 500s because a value overran its VARCHAR(255) instead of
being rejected. A crash-hunt sees a 500 and calls it "server error". Research says
what should have happened, so the bug is nameable.

An ENUM field is a **state machine**: every value is a state, and the tests are
which transitions are legal, which are refused, and who is allowed to make them.

---

## State machines — every ENUM in the domain

These are the statuses the whole product is built on. Each needs its legal
transitions mapped, and each illegal one attempted and refused.

${enumModels.map((m) => {
  const ef = m.fields.filter((f) => f.values?.length);
  return `### ${m.model}\n\`${m.file}\`\n\n${ef.map((f) => `- \`${f.field}\` — ${f.values.map((v) => `\`${v}\``).join(" · ")}${f.default ? ` (default ${f.default})` : ""}`).join("\n")}`;
}).join("\n\n")}

---

## Core models — field by field

Every **required** field is a "submit without it" test. Every **unique** field is a
"submit a duplicate" test. Every **bounded** field is a boundary test at the limit
and one past it.

${core.map((m) => `### ${m.model}\n\`${m.file}\` — ${m.fields.length} fields\n\n| Field | Constraints |\n|---|---|\n${m.fields.map(fieldLine).join("\n")}`).join("\n\n")}

---

## Validation rules — what the API rejects before the controller runs

Each row is a negative test. If a rule exists here but the UI lets the value
through and the request succeeds anyway, the validator is not wired to that route.

${validators.map((v) => `### ${v.file}\n\n| Where | Field | Rules | Message |\n|---|---|---|---|\n${v.rules.map((r) => `| ${r.loc} | \`${r.field}\` | ${r.checks.map((c) => `\`${c}\``).join(" ")} | ${r.message || ""} |`).join("\n")}`).join("\n\n")}

---

## Error codes the API can return

Assert on these rather than on message text — copy changes, codes do not. A
business-rule refusal returning **500 instead of its code** is a bug in its own
right (\`bookingController\` had exactly this).

| Code | Seen in |
|---|---|
${errorCodes.map((e) => `| \`${e.code}\` | ${e.where.slice(0, 4).join(", ")} |`).join("\n")}
`;

writeFileSync(join(root, "QA_RESEARCH.md"), out);

console.log(`models:          ${models.length}  (${core.length} core)`);
console.log(`  required       ${requiredCount}`);
console.log(`  unique         ${uniqueCount}`);
console.log(`  length-bounded ${boundedCount}`);
console.log(`  with ENUMs     ${enumModels.length}`);
console.log(`validator rules: ${validatorRules} in ${validators.length} files`);
console.log(`error codes:     ${errorCodes.length}`);
console.log(`\nwrote QA_RESEARCH.md`);
