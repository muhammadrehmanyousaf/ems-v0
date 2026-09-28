/**
 * The second problem: the venue city page makes ZERO API calls and still blocks
 * the main thread for 2.2s on a mid-range phone. That cost is the JavaScript
 * itself — how much is shipped, how much is ever executed, and how long the
 * browser spends compiling and hydrating it.
 *
 * V8 coverage tells us what fraction of the shipped JS is never used, which is
 * the difference between "we need this" and "we ship this".
 */
const { chromium } = require("C:/Projects/ems-v0/node_modules/playwright");
const SITE = "https://www.weddingwala.pk";

async function run(b, label, path) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await p.coverage.startJSCoverage({ resetOnNavigation: false });
  await p.goto(SITE + path, { waitUntil: "load", timeout: 300000 }).catch(() => {});
  await p.waitForTimeout(20000);
  const cov = await p.coverage.stopJSCoverage();

  let total = 0, used = 0, biggest = [];
  for (const e of cov) {
    const len = (e.source || "").length;
    if (!len) continue;
    let u = 0;
    for (const f of e.functions || []) for (const r of f.ranges || []) if (r.count > 0) u += r.endOffset - r.startOffset;
    // ranges nest, so cap at len
    u = Math.min(u, len);
    total += len; used += u;
    biggest.push({ url: e.url.split("/").slice(-1)[0].slice(0, 46), len, u });
  }
  const timings = await p.evaluate(() => {
    const res = performance.getEntriesByType("resource");
    const js = res.filter((r) => r.initiatorType === "script" || /\.js(\?|$)/.test(r.name));
    return {
      scriptCount: js.length,
      scriptWire: js.reduce((a, r) => a + (r.transferSize || 0), 0),
      scriptDecoded: js.reduce((a, r) => a + (r.decodedBodySize || 0), 0),
    };
  });
  const kb = (n) => (n / 1024).toFixed(0);
  console.log(`\n══ ${label}  ${path}`);
  console.log(`   script requests ${timings.scriptCount}   decoded JS ${kb(timings.scriptDecoded)}kb (wire ${kb(timings.scriptWire)}kb)`);
  console.log(`   JS parsed by V8: ${kb(total)}kb — of which EXECUTED: ${kb(used)}kb (${((used / total) * 100).toFixed(0)}%), UNUSED ${kb(total - used)}kb`);
  console.log(`   biggest bundles:`);
  for (const e of biggest.sort((a, c) => c.len - a.len).slice(0, 8))
    console.log(`      ${kb(e.len).padStart(6)}kb  ${((e.u / e.len) * 100).toFixed(0).padStart(3)}% used   ${e.url}`);
  await ctx.close();
}

(async () => {
  const b = await chromium.connectOverCDP("http://localhost:9223");
  await run(b, "home", "/");
  await run(b, "venue city page (0 API calls)", "/wedding-venues/karachi");
  await b.close();
})();
