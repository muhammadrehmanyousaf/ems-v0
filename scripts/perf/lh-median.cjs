/**
 * Lighthouse N times per page, reported as a median and a spread.
 *
 * WHY. Two sweeps of the same deployed code gave perf 76 and 77 overall, but
 * individual templates swung wildly between them — /register 64 then 80,
 * /compare-vendors 78 then 64, the photographers city page 79 then 55. Those
 * are single samples, and single samples cannot adjudicate a change. A sweep is
 * for ranking pages against each other; this is for answering "did it move".
 *
 * Usage: node scripts/perf/lh-median.cjs [runs] [route ...]
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const SITE = "https://www.weddingwala.pk";
const DIR = "C:/Users/ADMIN/AppData/Local/Temp/claude/c--Projects/a0226b59-ee03-4f7c-93a5-dfb54c68d8c2/scratchpad";
const args = process.argv.slice(2);
const RUNS = Number(args[0]) > 0 ? Number(args[0]) : 3;
const ROUTES = args.slice(1).length ? args.slice(1) : ["/", "/search", "/vendors"];
const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

for (const route of ROUTES) {
  const perf = [], lcp = [], tbt = [];
  for (let i = 0; i < RUNS; i++) {
    const tmp = path.join(DIR, "lhmed.tmp.json");
    try { fs.unlinkSync(tmp); } catch {}
    try {
      execFileSync("npx.cmd", ["--yes", "lighthouse@12", SITE + route,
        "--only-categories=performance", "--form-factor=mobile", "--screenEmulation.mobile",
        "--throttling-method=simulate", "--output=json", `--output-path=${tmp}`,
        "--chrome-flags=--headless=new --no-sandbox", "--quiet"],
        { stdio: "ignore", shell: true, timeout: 240000 });
    } catch { /* chrome-launcher EPERM on Windows fires AFTER the report is written */ }
    if (!fs.existsSync(tmp)) continue;
    const lhr = JSON.parse(fs.readFileSync(tmp, "utf8"));
    perf.push(Math.round(lhr.categories.performance.score * 100));
    lcp.push(Math.round(lhr.audits["largest-contentful-paint"].numericValue));
    tbt.push(Math.round(lhr.audits["total-blocking-time"].numericValue));
  }
  if (!perf.length) { console.log(route.padEnd(10) + "  no reports"); continue; }
  const spread = Math.max(...perf) - Math.min(...perf);
  console.log(
    route.padEnd(10) +
    "  perf median " + String(med(perf)).padStart(3) + "  (runs: " + perf.join(", ") + ", spread " + spread + ")" +
    "   LCP " + String(med(lcp)).padStart(5) + "ms" +
    "   TBT " + String(med(tbt)).padStart(4) + "ms"
  );
}
