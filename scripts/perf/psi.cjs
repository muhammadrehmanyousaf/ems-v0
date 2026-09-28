/**
 * PageSpeed Insights as the measurement instrument.
 *
 * WHY THIS REPLACES THE LOCAL HARNESS. scripts/perf/perf-mobile.cjs measured a
 * CPU-throttled browser on this laptop and reported total blocking of 2,080ms
 * on one run and 11,189ms on the next, for the same deployed code. PSI's lab
 * run of the same page reports 510ms. The local numbers were noise produced by
 * this machine's own load; PSI runs on Google's infrastructure, is reproducible,
 * and is the thing that actually grades the site. Use it for verdicts. Keep the
 * local scripts for request counts and payload sizes, which are counted rather
 * than timed and were never in doubt.
 *
 * Prints the metrics, then the audits that name a specific file or element, so
 * the fix list is "this image, that bundle" rather than "improve images".
 *
 * Usage: node scripts/perf/psi.cjs [url] [mobile|desktop]
 *        PSI_KEY=... for a higher quota (unkeyed works, just rate-limited)
 */
const URL_ = process.argv[2] || "https://weddingwala.pk/";
const STRATEGY = (process.argv[3] || "mobile").toLowerCase();
const KEY = process.env.PSI_KEY ? `&key=${process.env.PSI_KEY}` : "";

const API =
  `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
  `?url=${encodeURIComponent(URL_)}&strategy=${STRATEGY}` +
  `&category=performance&category=seo&category=accessibility&category=best-practices${KEY}`;

const ms = (v) => (v == null ? "-" : `${Math.round(v)}ms`);
const kb = (v) => (v == null ? "-" : `${Math.round(v / 1024)}kb`);

(async () => {
  const res = await fetch(API);
  if (!res.ok) {
    console.log(`PSI ${res.status} — ${(await res.text()).slice(0, 200)}`);
    return;
  }
  const j = await res.json();
  const lh = j.lighthouseResult;
  const a = lh.audits;

  console.log(`\n${URL_}   [${STRATEGY}]   lighthouse ${lh.lighthouseVersion}`);
  console.log("=".repeat(74));
  for (const [k, v] of Object.entries(lh.categories)) {
    console.log(`  ${v.title.padEnd(16)} ${Math.round((v.score || 0) * 100)}`);
  }
  console.log("\n  LAB METRICS");
  for (const id of [
    "first-contentful-paint", "largest-contentful-paint", "total-blocking-time",
    "cumulative-layout-shift", "speed-index", "interactive", "server-response-time",
  ]) {
    if (a[id]) console.log(`    ${a[id].title.padEnd(34)} ${a[id].displayValue || "-"}`);
  }

  // field data, if Google has enough real traffic for this URL
  const field = j.loadingExperience?.metrics;
  if (field) {
    console.log("\n  FIELD (real users, trailing 28 days)");
    for (const [k, v] of Object.entries(field)) {
      console.log(`    ${k.padEnd(40)} p75 ${v.percentile}   ${v.category}`);
    }
    console.log(`    overall: ${j.loadingExperience.overall_category}`);
  }

  // What is the LCP element? This is the single most useful line in the report.
  const lcpEl = a["largest-contentful-paint-element"];
  if (lcpEl?.details?.items?.length) {
    console.log("\n  LCP ELEMENT");
    const node = lcpEl.details.items[0]?.items?.[0]?.node;
    if (node) {
      console.log(`    ${(node.nodeLabel || "").slice(0, 80)}`);
      console.log(`    ${(node.snippet || "").slice(0, 150)}`);
    }
    const phases = lcpEl.details.items[1]?.items || [];
    for (const p of phases) console.log(`    ${String(p.phase).padEnd(22)} ${p.percent || ""} ${ms(p.timing)}`);
  }

  console.log("\n  OPPORTUNITIES — what, and how much");
  const opps = Object.values(a)
    .filter((x) => x.details?.type === "opportunity" && (x.details.overallSavingsMs > 0 || x.details.overallSavingsBytes > 0))
    .sort((x, y) => (y.details.overallSavingsMs || 0) - (x.details.overallSavingsMs || 0));
  for (const o of opps) {
    console.log(`    ${o.title.slice(0, 44).padEnd(46)} ${ms(o.details.overallSavingsMs).padStart(8)}  ${kb(o.details.overallSavingsBytes).padStart(7)}`);
  }

  // the named files behind the biggest opportunities
  for (const id of ["render-blocking-resources", "unused-javascript", "unused-css-rules", "uses-responsive-images", "modern-image-formats", "legacy-javascript", "third-party-summary"]) {
    const au = a[id];
    const items = au?.details?.items;
    if (!items?.length) continue;
    console.log(`\n  ${au.title}`);
    for (const it of items.slice(0, 6)) {
      const name = (it.url || it.entity || it.source || "").toString().replace(/^https?:\/\//, "").slice(0, 62);
      const save = it.wastedBytes ? kb(it.wastedBytes) : it.wastedMs ? ms(it.wastedMs) : it.blockingTime ? ms(it.blockingTime) : "";
      console.log(`    ${name.padEnd(64)} ${String(save).padStart(8)}`);
    }
  }

  // diagnostics worth acting on
  console.log("\n  DIAGNOSTICS");
  for (const id of ["mainthread-work-breakdown", "bootup-time", "dom-size", "long-tasks", "network-dependency-tree-insight"]) {
    if (a[id]?.displayValue) console.log(`    ${a[id].title.padEnd(44)} ${a[id].displayValue}`);
  }
  const mt = a["mainthread-work-breakdown"]?.details?.items || [];
  for (const g of mt.slice(0, 5)) console.log(`      ${String(g.groupLabel).padEnd(30)} ${ms(g.duration)}`);
})();
