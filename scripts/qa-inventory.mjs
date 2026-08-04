/**
 * Build a complete vendor-portal test inventory straight from the source.
 *
 * Hand-listing modules is how coverage gaps hide. This walks the real nav
 * config, resolves each route to its page component, follows the component
 * imports one level deep, and extracts the interactive surface of each screen:
 * tabs, sections, buttons, dialogs and form fields.
 *
 * Output: qa/VENDOR-PORTAL-TEST-MATRIX.md
 *
 * Run: node scripts/qa-inventory.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APP = path.join(ROOT, "app", "(dashboard)");

/* ── 1. Nav config: the authoritative module list ───────────────────── */
const navSrc = fs.readFileSync(
  path.join(ROOT, "components/dashboard/layout/nav-data.ts"),
  "utf8",
);

function parseNavGroup(key) {
  const re = new RegExp(`${key}:\\s*\\[([\\s\\S]*?)\\n  \\]`, "m");
  const m = navSrc.match(re);
  if (!m) return [];
  const items = [];
  for (const line of m[1].split("\n")) {
    const name = line.match(/name:\s*"([^"]+)"/);
    const url = line.match(/url:\s*"([^"]+)"/);
    if (name && url) items.push({ name: name[1], url: url[1] });
  }
  return items;
}

const GROUPS = {
  "Operate (main nav)": parseNavGroup("vendorMainNav"),
  "My Business": parseNavGroup("vendorMyBusiness"),
  "Venue-OS": parseNavGroup("vendorVenueOs"),
  "Field capture": parseNavGroup("vendorFieldCapture"),
  "Quotes": parseNavGroup("vendorQuotes"),
};

/* ── 1b. Hand-maintained status ─────────────────────────────────────────
 * The ONLY hand-edited part of this file. Everything else is derived, so the
 * inventory can never drift from the code. Keyed by route.
 *   x = deep-tested: real clicks in the live portal, hostile payloads, DB
 *       read-back, and the "does it update without a reload?" check
 *   ~ = render/health only: page loads, no console errors, no covered controls
 *   (absent) = not touched
 */
const STATUS = {
  "/dashboard/settings": {
    mark: "x",
    note:
      "Deep: Profile · Capacity & pricing · Packages · Menus · Bank details · Availability tab. " +
      "Render-only: Amenities & services · Listing content · Type-specific · Images · Team members. " +
      "FOUND: no client validation on Capacity & pricing (fixed, PR #183); " +
      "phantom Package Description field (fixed, backend PR #52); " +
      "blocked-dates ignored businessId (fixed, backend PR #52).",
  },
  "/dashboard/bookings": {
    mark: "~",
    note:
      "Add-booking dialog validation only (empty + partial payloads, native-validation probe). " +
      "NOT tested: list filters, sort, Archive, Export, row actions, booking detail, financials, status transitions.",
  },
  "/dashboard/customers": {
    mark: "~",
    note: "Add-customer dialog validation only (bad phone + bad email). NOT tested: list, edit, delete, detail page, duplicate handling.",
  },
  "/dashboard/leads": { mark: "~", note: "Render/health only. 76 leads load. NOT tested: Log a lead, Import, Export, filters, detail, status transitions." },
  "/dashboard/receivables": { mark: "~", note: "Render/health only via /dashboard/money." },
};

/* ── 2. Route → page file ───────────────────────────────────────────── */
function routeToPageFile(url) {
  const clean = url.split("?")[0].replace(/^\//, "");
  const p = path.join(APP, clean, "page.tsx");
  return fs.existsSync(p) ? p : null;
}

/* ── 3. Follow local imports one level so we scan the real view ─────── */
function resolveImport(spec, fromFile) {
  if (!spec.startsWith("@/") && !spec.startsWith(".")) return null;
  const base = spec.startsWith("@/")
    ? path.join(ROOT, spec.slice(2))
    : path.resolve(path.dirname(fromFile), spec);
  for (const ext of [".tsx", ".ts", "/index.tsx", "/index.ts"]) {
    if (fs.existsSync(base + ext)) return base + ext;
  }
  return null;
}

function localImports(file) {
  const src = fs.readFileSync(file, "utf8");
  const out = [];
  for (const m of src.matchAll(/from\s+["']([^"']+)["']/g)) {
    const r = resolveImport(m[1], file);
    if (r && !r.includes("components/ui/") && !r.includes("node_modules")) out.push(r);
  }
  return [...new Set(out)];
}

/* ── 4. Extract the interactive surface of a file ───────────────────── */
const NOISE = /^(true|false|null|undefined|[0-9.]+|https?:|\/|#|\s*)$/i;
const clean = (s) =>
  s.replace(/\{[^}]*\}/g, "").replace(/\s+/g, " ").trim();

/**
 * A JSX child is only a real, testable label if it is plain prose.
 * `{loading ? …`, `setCreateOpen(true)}>` and friends are code fragments the
 * naive regex swept up — they are not things a vendor can read or click.
 */
const isProse = (s) =>
  s.length > 1 &&
  !/[{}()<>=&|?;]|=>|\/\*|\.\.\./.test(s) &&
  /[a-z]/i.test(s);

/** Inner prose of `<Tag ...> … </Tag>`, with nested tags + JSX expressions removed. */
function innerText(src, tag) {
  const out = new Set();
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]{0,400}?)</${tag}>`, "g");
  for (const m of src.matchAll(re)) {
    const txt = m[1]
      // An attribute like onClick={() => fn()} contains a ">" inside the arrow,
      // so [^>]* stops early and the rest of the opening tag leaks into the
      // captured "children". Drop everything up to the real end of the tag.
      .replace(/^[\s\S]*?\}\s*>/, "")
      .replace(/\{[\s\S]*?\}/g, " ") // JSX expressions
      .replace(/<[^>]*>/g, " ") // nested elements (icons, spinners)
      .replace(/\s+/g, " ")
      .trim();
    if (txt && txt.length < 48) out.add(txt);
  }
  return [...out];
}

function extract(src) {
  const grab = (re, g = 1) => {
    const set = new Set();
    for (const m of src.matchAll(re)) {
      const v = clean(m[g] || "");
      if (v && v.length < 48 && !NOISE.test(v)) set.add(v);
    }
    return [...set];
  };

  return {
    // Buttons usually wrap an icon plus a text node — `<Plus /> Add booking` —
    // so match the whole inner block, strip nested tags and JSX expressions,
    // and keep whatever prose is left. Icon-only buttons are recovered from
    // their aria-label.
    buttons: innerText(src, "Button")
      .concat(innerText(src, "button"))
      .concat(grab(/<Button[^>]*\saria-label="([^"]{1,46})"/g))
      .concat(grab(/<button[^>]*\saria-label="([^"]{1,46})"/g))
      .filter(isProse),
    // Dialog / sheet / modal titles
    dialogs: grab(/<DialogTitle[^>]*>([^<{][^<]{0,46})</g)
      .concat(grab(/<AlertDialogTitle[^>]*>([^<{][^<]{0,46})</g))
      .concat(grab(/<SheetTitle[^>]*>([^<{][^<]{0,46})</g)),
    // Section headings rendered by the shared primitives
    sections: grab(/<Section[^>]*\stitle="([^"]{1,46})"/g)
      .concat(grab(/<PageHeader[^>]*\stitle="([^"]{1,46})"/g))
      .concat(grab(/<Card[^>]*\stitle="([^"]{1,46})"/g))
      .concat(grab(/<EmptyState[^>]*\stitle="([^"]{1,46})"/g)),
    // Form fields
    fields: grab(/<Row[^>]*\slabel="([^"]{1,46})"/g)
      .concat(grab(/<Field[^>]*\slabel="([^"]{1,46})"/g))
      .concat(grab(/<Label[^>]*>([^<{][^<]{0,46})</g))
      .concat(grab(/placeholder="([^"]{1,46})"/g)),
    // Tab / view config arrays:  { key: "x", label: "Y" }
    tabs: grab(/label:\s*"([^"]{1,46})"/g),
  };
}

function scanRoute(url) {
  const page = routeToPageFile(url);
  if (!page) return { missing: true };
  const files = [page, ...localImports(page)];
  // one more level for the thin page.tsx → view.tsx → manager.tsx chain
  for (const f of [...files]) {
    if (f !== page) for (const g of localImports(f)) files.push(g);
  }
  const uniq = [...new Set(files)].filter((f) => fs.existsSync(f));
  const merged = { buttons: [], dialogs: [], sections: [], fields: [], tabs: [] };
  for (const f of uniq.slice(0, 40)) {
    const e = extract(fs.readFileSync(f, "utf8"));
    for (const k of Object.keys(merged)) merged[k].push(...e[k]);
  }
  for (const k of Object.keys(merged)) merged[k] = [...new Set(merged[k])].sort();
  return { page: path.relative(ROOT, page), fileCount: uniq.length, ...merged };
}

/* ── 5. Emit the matrix ────────────────────────────────────────────── */
const lines = [];
lines.push("# Wedding Wala — Vendor Portal Test Matrix");
lines.push("");
lines.push("Generated from source by `scripts/qa-inventory.mjs`. Do not hand-edit the");
lines.push("inventory — re-run the script. Only the STATUS column is maintained by hand.");
lines.push("");
lines.push("Status legend: `[ ]` untested · `[~]` render/health only · `[x]` deep-tested");
lines.push("(real clicks + hostile payloads + DB verified + no-reload check)");
lines.push("");

let moduleCount = 0;
let elementCount = 0;
let deepCount = 0;
let shallowCount = 0;
const toc = [];

const body = [];
for (const [group, items] of Object.entries(GROUPS)) {
  body.push(`\n---\n\n## ${group}\n`);
  toc.push(`- [${group}](#${group.toLowerCase().replace(/[^a-z0-9]+/g, "-")})`);
  for (const item of items) {
    moduleCount++;
    const r = scanRoute(item.url);
    body.push(`\n### ${moduleCount}. ${item.name}`);
    body.push("");
    body.push(`- **Route:** \`${item.url}\``);
    if (r.missing) {
      body.push(`- **Page file:** _NOT FOUND — route may be dead_`);
      body.push(`- **Status:** \`[ ]\``);
      continue;
    }
    const st = STATUS[item.url.split("?")[0]] || {};
    const mark = st.mark || " ";
    if (mark === "x") deepCount++;
    else if (mark === "~") shallowCount++;
    body.push(`- **Page:** \`${r.page}\` (${r.fileCount} component files)`);
    body.push(`- **Status:** \`[${mark}]\``);
    if (st.note) body.push(`- **Coverage:** ${st.note}`);
    body.push("");
    const rows = [
      ["Tabs / views", r.tabs],
      ["Sections", r.sections],
      ["Dialogs", r.dialogs],
      ["Actions / buttons", r.buttons],
      ["Form fields", r.fields],
    ];
    for (const [label, vals] of rows) {
      if (!vals.length) continue;
      elementCount += vals.length;
      body.push(`**${label}** (${vals.length})`);
      body.push("");
      for (const v of vals) body.push(`- [ ] ${v}`);
      body.push("");
    }
  }
}

const untested = moduleCount - deepCount - shallowCount;
const pct = (n) => Math.round((n / moduleCount) * 100);
lines.push("## Progress");
lines.push("");
lines.push("| | Modules | % |");
lines.push("|---|---:|---:|");
lines.push(`| \`[x]\` deep-tested | ${deepCount} | ${pct(deepCount)}% |`);
lines.push(`| \`[~]\` render/health only | ${shallowCount} | ${pct(shallowCount)}% |`);
lines.push(`| \`[ ]\` **not touched** | **${untested}** | **${pct(untested)}%** |`);
lines.push(`| **Total** | **${moduleCount}** | |`);
lines.push("");
lines.push(`**${elementCount} enumerated elements** across ${moduleCount} modules.`);
lines.push("");
lines.push("> Element lists are extracted statically and are a FLOOR, not a ceiling —");
lines.push("> anything rendered through a shared toolbar or a deep component chain may");
lines.push("> be missing. Each module's list is completed from the live DOM at the");
lines.push("> moment that module is tested.");
lines.push("");
lines.push("## Contents");
lines.push(...toc);
lines.push(...body);

const outDir = path.join(ROOT, "qa");
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, "VENDOR-PORTAL-TEST-MATRIX.md");
fs.writeFileSync(out, lines.join("\n"));
console.log(`Wrote ${path.relative(ROOT, out)}`);
console.log(`Modules: ${moduleCount}   Elements: ${elementCount}`);
