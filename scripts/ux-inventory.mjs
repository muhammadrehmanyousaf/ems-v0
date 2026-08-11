/**
 * Measure UX depth per dashboard route, straight from the source.
 *
 * The portal's problem is not styling — it is depth per door. This walks every
 * route under app/(dashboard), follows its imports until it reaches the real
 * view components, and reports what UX scaffolding each screen actually uses.
 *
 * The number that matters most is the empty-state column: a screen that renders
 * an empty message WITHOUT the shared EmptyState primitive is an unguided dead
 * end, because the primitive is the only thing that carries a CTA.
 *
 * Everything here is derived. Nothing is hand-listed, so it cannot drift from
 * the code — re-run it after any sweep to see the delta.
 *
 * Output: qa/UX-INVENTORY.md  +  qa/UX-INVENTORY.json
 * Run:    node scripts/ux-inventory.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APP = path.join(ROOT, "app", "(dashboard)");
const MAX_DEPTH = 3; // page.tsx → view → sub-view. Deeper is noise.

/* ── 1. Every route under app/(dashboard) ───────────────────────────── */
function findRoutes(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) findRoutes(full, acc);
    else if (e.name === "page.tsx") {
      acc.push({
        route: "/" + path.relative(APP, path.dirname(full)).split(path.sep).join("/"),
        file: full,
      });
    }
  }
  return acc;
}

/* ── 2. Follow local imports so we scan the real view, not the shim ─── */
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

/** All files reachable from a page, bounded. Includes the page itself. */
function reachable(entry) {
  const seen = new Set([entry]);
  let frontier = [entry];
  for (let d = 0; d < MAX_DEPTH; d++) {
    const next = [];
    for (const file of frontier) {
      let src;
      try {
        src = fs.readFileSync(file, "utf8");
      } catch {
        continue;
      }
      for (const m of src.matchAll(/from\s+["']([^"']+)["']/g)) {
        const r = resolveImport(m[1], file);
        // ui/* primitives are leaves — we detect them by import, not by descending.
        if (!r || seen.has(r) || r.includes("node_modules")) continue;
        seen.add(r);
        if (!r.includes(`components${path.sep}ui${path.sep}`)) next.push(r);
      }
    }
    frontier = next;
    if (!frontier.length) break;
  }
  return [...seen];
}

/* ── 3. Signals ─────────────────────────────────────────────────────── */

/**
 * Prose that reads as "there is nothing here".
 *
 * Deliberately matches the RENDERED string, not a variable name, so that
 * `const emptyLabel = ...` doesn't count while `>No bookings yet<` does. The
 * point is to find text a vendor actually sees.
 */
const EMPTY_PROSE =
  /(?:^|[>"'`\s])(no\s+[a-z][a-z\s-]{1,28}?\s+(?:found|yet|available|match|to\s+show)|nothing\s+(?:here|to\s+show)|you\s+(?:haven't|have\s+not)\s+[a-z]+)/i;

/**
 * `DataTable` renders `EmptyState` itself, so every route that uses a table
 * inherits a guided empty state without opting in. That is a good thing — it is
 * why the table screens are already fine — but counting it as adoption hides the
 * real gap, which is the NON-table surfaces: card grids, charts, panels, boards.
 *
 * So `emptyState` is split: `emptyStateDirect` means the screen's own code calls
 * it; `emptyStateViaTable` means the table did it. Only the former is adoption.
 */
const INHERITS_EMPTY_STATE = ["primitives/data-table.tsx", "primitives/empty-state.tsx"];

const SIGNALS = {
  emptyState: (s) => /primitives\/empty-state|<EmptyState[\s/>]/.test(s),
  // Passing `empty={{ title, description, action }}` INTO DataTable is the
  // guided path — the table renders EmptyState with it. Screens doing this are
  // already correct, and counting their prop copy as "unguided prose" put
  // finished screens (bookings, leads, customers, payments) on the worklist.
  emptyProp: (s) => /empty=\{\{/.test(s),
  statCard: (s) => /primitives\/stat-card|<StatCard[\s/>]/.test(s),
  dataTable: (s) => /primitives\/data-table|<DataTable[\s/>]/.test(s),
  pageHeader: (s) => /primitives\/page-header|<PageHeader[\s/>]/.test(s),
  skeleton: (s) => /ui\/skeleton|primitives\/skeletons|<Skeleton[\s/>]/.test(s),
  tabs: (s) => /<TabsTrigger[\s/>]/.test(s),
  statusPill: (s) => /primitives\/status-pill|<StatusPill[\s/>]/.test(s),
  emptyProse: (s) => EMPTY_PROSE.test(s),
};

function scanRoute({ route, file }) {
  const files = reachable(file);
  const hit = Object.fromEntries(Object.keys(SIGNALS).map((k) => [k, false]));
  // Where the empty prose lives — so the sweep knows which file to open.
  const proseFiles = [];
  let emptyStateDirect = false;
  let emptyStateInherited = false;

  for (const f of files) {
    let src;
    try {
      src = fs.readFileSync(f, "utf8");
    } catch {
      continue;
    }
    const rel = path.relative(ROOT, f).split(path.sep).join("/");
    const inherited = INHERITS_EMPTY_STATE.some((p) => rel.endsWith(p));
    for (const [key, test] of Object.entries(SIGNALS)) {
      if (!test(src)) continue;
      // The shared primitives carry their own default copy ("No results…"). Counting
      // that as the SCREEN's prose flagged routes whose only empty text lives inside
      // DataTable — a false positive that put already-guided screens on the worklist.
      if ((key === "emptyProse" || key === "emptyState") && inherited) {
        if (key === "emptyState") emptyStateInherited = true;
        continue;
      }
      hit[key] = true;
      if (key === "emptyState") emptyStateDirect = true;
      if (key === "emptyProse") {
        // Show the evidence rather than asserting. This metric has been wrong
        // twice; a line the reader can open is worth more than a boolean.
        src.split("\n").forEach((line, i) => {
          // This codebase comments heavily and its comments describe empty
          // states ("…had nothing to show but 19:00"). Those are prose about
          // the UI, not prose in it — roughly half of every match before this.
          if (/^\s*(\/\/|\/\*|\*)/.test(line)) return;
          // Trailing comments too: `return null; // no booking money yet` is a
          // note about an empty case, not an empty state the vendor can read.
          // Only strip when the `//` is not inside a string or a URL.
          const code = line.replace(/(^|[^:"'`\\])\/\/.*$/, "$1");
          if (EMPTY_PROSE.test(code)) {
            proseFiles.push({ file: rel, line: i + 1, text: line.trim().slice(0, 110) });
          }
        });
      }
    }
  }

  // The flag must agree with the evidence. Setting it from the whole-file regex
  // let a route be "shows an empty message" on the strength of a code comment,
  // with an empty hit list underneath it.
  hit.emptyProse = proseFiles.length > 0;

  // A detail route makes a list a workspace rather than a terminus.
  const hasDetail =
    fs.existsSync(path.join(APP, route.slice(1), "[id]", "page.tsx")) ||
    fs.readdirSync(path.join(APP, route.slice(1)), { withFileTypes: true })
      .some((e) => e.isDirectory() && /^\[.+\]$/.test(e.name));

  return {
    route,
    filesScanned: files.length,
    ...hit,
    emptyStateDirect,
    emptyStateViaTable: emptyStateInherited && !emptyStateDirect,
    hasDetail,
    // The headline defect: shows an empty message, but not through the primitive,
    // so there is no CTA and no first-run / filtered / error distinction.
    // Measured against DIRECT use — a table's inherited empty state does not
    // cover the card grid or chart sitting next to it on the same screen.
    unguidedEmpty: hit.emptyProse && !emptyStateDirect && !hit.emptyProp,
    proseHits: proseFiles.slice(0, 6),
  };
}

/* ── 4. Run ─────────────────────────────────────────────────────────── */
const rows = findRoutes(APP).map(scanRoute).sort((a, b) => a.route.localeCompare(b.route));

const n = rows.length;
const count = (k) => rows.filter((r) => r[k]).length;
const pct = (x) => `${Math.round((x / n) * 100)}%`;

const summary = {
  routes: n,
  emptyStateDirect: count("emptyStateDirect"),
  emptyStateViaTable: count("emptyStateViaTable"),
  showsEmptyProse: count("emptyProse"),
  unguidedEmpty: count("unguidedEmpty"),
  usesDataTable: count("dataTable"),
  usesStatCard: count("statCard"),
  usesPageHeader: count("pageHeader"),
  usesSkeleton: count("skeleton"),
  usesStatusPill: count("statusPill"),
  hasTabs: count("tabs"),
  hasDetail: count("hasDetail"),
};

/* ── 5. Emit ────────────────────────────────────────────────────────── */
const qaDir = path.join(ROOT, "qa");
fs.mkdirSync(qaDir, { recursive: true });

fs.writeFileSync(
  path.join(qaDir, "UX-INVENTORY.json"),
  JSON.stringify({ generatedFrom: "scripts/ux-inventory.mjs", summary, rows }, null, 2),
);

const yn = (b) => (b ? "✅" : "—");
const md = [
  "# Vendor portal — UX depth inventory",
  "",
  "> Generated by `node scripts/ux-inventory.mjs`. Do not hand-edit — re-run it.",
  "",
  "## Summary",
  "",
  "| Signal | Routes | Share |",
  "|---|---:|---:|",
  `| Total dashboard routes | ${summary.routes} | 100% |`,
  `| Renders an empty message | ${summary.showsEmptyProse} | ${pct(summary.showsEmptyProse)} |`,
  `| Calls \`EmptyState\` directly (real adoption) | ${summary.emptyStateDirect} | ${pct(summary.emptyStateDirect)} |`,
  `| Inherits it via \`DataTable\` only | ${summary.emptyStateViaTable} | ${pct(summary.emptyStateViaTable)} |`,
  `| **Empty message with no guided state 🔴** | **${summary.unguidedEmpty}** | **${pct(summary.unguidedEmpty)}** |`,
  `| Uses \`DataTable\` | ${summary.usesDataTable} | ${pct(summary.usesDataTable)} |`,
  `| Uses \`PageHeader\` | ${summary.usesPageHeader} | ${pct(summary.usesPageHeader)} |`,
  `| Uses \`StatCard\` | ${summary.usesStatCard} | ${pct(summary.usesStatCard)} |`,
  `| Uses \`StatusPill\` | ${summary.usesStatusPill} | ${pct(summary.usesStatusPill)} |`,
  `| Has skeleton loading | ${summary.usesSkeleton} | ${pct(summary.usesSkeleton)} |`,
  `| Has module tabs | ${summary.hasTabs} | ${pct(summary.hasTabs)} |`,
  `| Has a detail route | ${summary.hasDetail} | ${pct(summary.hasDetail)} |`,
  "",
  "## Per route",
  "",
  "`Empty` = uses the shared primitive · `🔴` = shows an empty message without it.",
  "",
  "| Route | Empty | Table | Header | Stat | Pill | Skel | Tabs | Detail |",
  "|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|",
  ...rows.map((r) =>
    `| \`${r.route}\` | ${r.unguidedEmpty ? "🔴" : yn(r.emptyState)} | ${yn(r.dataTable)} | ${yn(r.pageHeader)} | ${yn(r.statCard)} | ${yn(r.statusPill)} | ${yn(r.skeleton)} | ${yn(r.tabs)} | ${yn(r.hasDetail)} |`,
  ),
  "",
  "## Phase 1 worklist — routes with an unguided empty state",
  "",
  "Each line is the actual matched string, so the call is judgeable without",
  "re-deriving it. Some will be legitimately fine — this is triage, not a verdict.",
  "",
  ...rows
    .filter((r) => r.unguidedEmpty)
    .flatMap((r) => [
      `- \`${r.route}\``,
      ...r.proseHits.map((h) => `  - \`${h.file}:${h.line}\` — ${h.text}`),
    ]),
  "",
].join("\n");

fs.writeFileSync(path.join(qaDir, "UX-INVENTORY.md"), md);

console.log(`Scanned ${n} routes.`);
for (const [k, v] of Object.entries(summary)) console.log(`  ${k.padEnd(18)} ${v}`);
console.log("\nWrote qa/UX-INVENTORY.md and qa/UX-INVENTORY.json");
