/**
 * Lighthouse across every distinct PUBLIC template, ranked worst first.
 *
 * 313 route files, but far fewer templates: 41 of the public routes are dynamic
 * segments (city pages, blog posts, vendor leaves), and the seven vendor-profile
 * routes are one 140-line file repeated. Measuring one representative URL per
 * template covers the lot; measuring all 313 URLs would take hours and tell us
 * the same thing seven times.
 *
 * Lighthouse, not the homemade harness: two runs of that harness on identical
 * deployed code reported 2,080ms and then 11,189ms of blocking, because this
 * laptop was running a dev server, a backend, a database and a test suite
 * against a CPU-throttled browser. Lighthouse's simulated throttling is far
 * less sensitive to that, and it is the engine PageSpeed grades with.
 *
 * Usage: node scripts/perf/sweep-templates.cjs [--only=substring]
 * Writes sweep-<date>.json next to this file and prints the ranked table.
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SITE = "https://www.weddingwala.pk";
const OUT = path.join(
  "C:/Users/ADMIN/AppData/Local/Temp/claude/c--Projects/a0226b59-ee03-4f7c-93a5-dfb54c68d8c2/scratchpad",
  `sweep-${new Date().toISOString().slice(0, 10)}.json`
);
const only = (process.argv.find((a) => a.startsWith("--only=")) || "").split("=")[1];

/**
 * One URL per template. `reach` is how many people hit it, used for ranking:
 * a slow page nobody opens loses to a slightly slow homepage.
 *   3 = every visitor · 2 = every SEO arrival · 1 = occasional
 */
const TEMPLATES = [
  ["home", "/", 3],
  ["search", "/search", 3],
  ["city landing (venues)", "/wedding-venues/karachi", 2],
  ["city landing (photographers)", "/wedding-photographers/lahore", 2],
  ["vendor type hub", "/wedding-venues", 2],
  ["all vendors", "/vendors", 2],
  ["venues list", "/venues", 2],
  ["blog index", "/blog", 1],
  ["real weddings index", "/real-weddings", 1],
  ["pricing", "/pricing", 1],
  ["how it works", "/how-it-works", 1],
  ["help", "/help", 1],
  ["about", "/about", 1],
  ["contact", "/contact", 1],
  ["planning tools hub", "/planning-tools", 1],
  ["budget tool", "/planning-tools/budget", 1],
  ["checklist tool", "/planning-tools/checklist", 1],
  ["guest list tool", "/planning-tools/guest-list", 1],
  ["compare vendors", "/compare-vendors", 1],
  ["login", "/login", 2],
  ["register", "/register", 1],
  ["business registration", "/business-registration", 1],
];

const run = (url) => {
  const tmp = OUT.replace(".json", ".tmp.json");
  if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  try {
    execFileSync(
      process.platform === "win32" ? "npx.cmd" : "npx",
      [
        "--yes", "lighthouse@12", url,
        "--only-categories=performance,accessibility,seo,best-practices",
        "--form-factor=mobile", "--screenEmulation.mobile",
        "--throttling-method=simulate",
        "--output=json", `--output-path=${tmp}`,
        "--chrome-flags=--headless=new --no-sandbox", "--quiet",
      ],
      { stdio: ["ignore", "ignore", "ignore"], shell: process.platform === "win32", timeout: 240000 }
    );
  } catch (e) {
    /**
     * Lighthouse exits non-zero on Windows AFTER a perfectly good run.
     *
     * chrome-launcher's `destroyTmp` tries to delete its temp profile directory
     * while Chrome still holds a handle on it, and throws
     * `EPERM, Permission denied: ...\Temp\lighthouse.NNNNN` from inside
     * `Launcher.kill`. That happens once the report is already written, so the
     * exit code says "failed" and the data is sitting on disk.
     *
     * The first run of this sweep recorded 21 of 22 templates as FAILED for
     * exactly this reason. So: judge by whether the report exists, not by the
     * exit code, and only treat it as a failure if there is nothing to read.
     */
    if (!fs.existsSync(tmp)) throw e;
  }
  const d = JSON.parse(fs.readFileSync(tmp, "utf8"));
  try { fs.unlinkSync(tmp); } catch {}
  const a = d.audits;
  const num = (id) => Math.round(a[id]?.numericValue ?? 0);
  const el = a["largest-contentful-paint-element"]?.details?.items || [];
  const phases = el.length > 1 ? Object.fromEntries((el[1].items || []).map((p) => [p.phase, Math.round(p.timing || 0)])) : {};
  return {
    perf: Math.round((d.categories.performance?.score || 0) * 100),
    a11y: Math.round((d.categories.accessibility?.score || 0) * 100),
    seo: Math.round((d.categories.seo?.score || 0) * 100),
    bp: Math.round((d.categories["best-practices"]?.score || 0) * 100),
    fcp: num("first-contentful-paint"),
    lcp: num("largest-contentful-paint"),
    tbt: num("total-blocking-time"),
    cls: Number((a["cumulative-layout-shift"]?.numericValue ?? 0).toFixed(3)),
    si: num("speed-index"),
    dom: a["dom-size"]?.numericValue ?? 0,
    phases,
    scriptEval: Math.round(
      (a["mainthread-work-breakdown"]?.details?.items || []).find((g) => /Script Eval/i.test(g.groupLabel))?.duration || 0
    ),
  };
};

(async () => {
  const list = only ? TEMPLATES.filter(([n, u]) => (n + u).includes(only)) : TEMPLATES;
  console.log(`Lighthouse (mobile) across ${list.length} templates. ~40s each.\n`);
  const results = [];
  for (const [name, route, reach] of list) {
    process.stdout.write(`  ${name.padEnd(30)} `);
    try {
      const r = run(SITE + route);
      results.push({ name, route, reach, ...r });
      console.log(
        `perf ${String(r.perf).padStart(3)}  LCP ${String(r.lcp).padStart(5)}  TBT ${String(r.tbt).padStart(5)}  CLS ${String(r.cls).padEnd(5)}  a11y ${r.a11y}`
      );
    } catch (e) {
      console.log(`FAILED — ${String(e.message).split("\n")[0].slice(0, 60)}`);
      results.push({ name, route, reach, failed: true });
    }
  }

  const ok = results.filter((r) => !r.failed);
  // rank by how much it hurts x how many people it hurts
  const cost = (r) =>
    (Math.max(0, r.lcp - 2500) / 1000) * 2 + (Math.max(0, r.tbt - 200) / 100) + (r.cls > 0.1 ? 5 : 0);
  ok.sort((a, b) => cost(b) * b.reach - cost(a) * a.reach);

  console.log("\n\nRANKED — worst first, weighted by how many people hit it");
  console.log("=".repeat(96));
  console.log("template                        reach  perf  LCP     TBT    CLS    a11y  the biggest LCP phase");
  console.log("-".repeat(96));
  for (const r of ok) {
    const worst = Object.entries(r.phases).sort((a, b) => b[1] - a[1])[0];
    console.log(
      `${r.name.slice(0, 30).padEnd(30)} ${String(r.reach).padStart(4)}  ${String(r.perf).padStart(4)}  ${(r.lcp + "ms").padStart(7)} ${(r.tbt + "ms").padStart(6)}  ${String(r.cls).padEnd(6)} ${String(r.a11y).padStart(4)}  ${worst ? worst[0] + " " + worst[1] + "ms" : ""}`
    );
  }
  const failed = results.filter((r) => r.failed);
  if (failed.length) console.log(`\n${failed.length} failed to measure: ${failed.map((f) => f.route).join(", ")}`);

  fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
  console.log(`\nwritten: ${OUT}`);
  const avg = (k) => Math.round(ok.reduce((s, r) => s + r[k], 0) / ok.length);
  console.log(`\nacross ${ok.length} templates: perf ${avg("perf")}  LCP ${avg("lcp")}ms  TBT ${avg("tbt")}ms  a11y ${avg("a11y")}  seo ${avg("seo")}  best-practices ${avg("bp")}`);
})();
