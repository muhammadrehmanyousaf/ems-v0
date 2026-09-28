/**
 * Which accessibility / best-practices audits actually FAIL, and on what element.
 *
 * The template sweep reports a score; a score cannot be fixed. This prints the
 * failing audit ids with the offending selectors so each one is a piece of work.
 *
 * Usage: node scripts/perf/audit-fails.cjs /budget /search ...
 *        (no args = the six worst-scoring templates from the 2026-09-28 sweep)
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SITE = "https://www.weddingwala.pk";
const TMP = path.join(
  "C:/Users/ADMIN/AppData/Local/Temp/claude/c--Projects/a0226b59-ee03-4f7c-93a5-dfb54c68d8c2/scratchpad",
  "auditfails.tmp.json"
);

const routes = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["/planning-tools/budget", "/vendors", "/venues", "/search", "/planning-tools/checklist", "/planning-tools/guest-list", "/"];

for (const route of routes) {
  try {
    execFileSync(
      "npx",
      [
        "--yes", "lighthouse@12", SITE + route,
        "--only-categories=accessibility,best-practices",
        "--form-factor=mobile", "--screenEmulation.mobile",
        "--output=json", "--output-path=" + TMP,
        "--chrome-flags=--headless=new --no-sandbox", "--quiet",
      ],
      { stdio: "ignore", shell: true, timeout: 180000 }
    );
  } catch {
    console.log(route + "  -- lighthouse failed");
    continue;
  }
  const lhr = JSON.parse(fs.readFileSync(TMP, "utf8"));
  const a11y = Math.round((lhr.categories.accessibility?.score ?? 0) * 100);
  const bp = Math.round((lhr.categories["best-practices"]?.score ?? 0) * 100);
  console.log("\n" + route + "   a11y " + a11y + "   best-practices " + bp);

  for (const [catId, cat] of Object.entries(lhr.categories)) {
    for (const ref of cat.auditRefs) {
      const a = lhr.audits[ref.id];
      if (!a || a.score === null || a.score === 1 || a.scoreDisplayMode === "notApplicable") continue;
      const items = a.details?.items ?? [];
      console.log("  [" + catId + "] " + a.id + " — " + a.title + "  (" + items.length + ")");
      for (const it of items.slice(0, 4)) {
        const sel = it.node?.selector || it.node?.snippet || it.source?.url || it.url || JSON.stringify(it).slice(0, 110);
        console.log("      " + String(sel).replace(/\s+/g, " ").slice(0, 150));
      }
    }
  }
}
