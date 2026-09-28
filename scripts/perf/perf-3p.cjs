/**
 * Who is spending the phone's CPU: us, or somebody else's script?
 *
 * The venue city page makes zero API calls and still blocks 2.2s. Its largest
 * single script was 514kb of Google Analytics. So: every script grouped by
 * origin, with bytes and how long the main thread spent on each, plus a
 * with-and-without comparison to size the third-party cost honestly rather than
 * asserting it.
 */
const { chromium } = require("C:/Projects/ems-v0/node_modules/playwright");
const SITE = "https://www.weddingwala.pk";

const INIT = `
  window.__perf = { long: [], lcp: 0, fcp: 0 };
  try { new PerformanceObserver((l)=>{for(const e of l.getEntries()) window.__perf.long.push(Math.round(e.duration));}).observe({type:"longtask",buffered:true}); } catch {}
  try { new PerformanceObserver((l)=>{const es=l.getEntries(); window.__perf.lcp=Math.round(es[es.length-1].startTime);}).observe({type:"largest-contentful-paint",buffered:true}); } catch {}
  try { new PerformanceObserver((l)=>{for(const e of l.getEntries()) if(e.name==="first-contentful-paint") window.__perf.fcp=Math.round(e.startTime);}).observe({type:"paint",buffered:true}); } catch {}
`;

const NET_4G = { offline: false, downloadThroughput: (4 * 1024 * 1024) / 8, uploadThroughput: (3 * 1024 * 1024) / 8, latency: 150 };

async function run(b, label, path, blockThirdParty) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.addInitScript(INIT);
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", NET_4G);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  const THIRD = /googletagmanager|google-analytics|gtag|doubleclick|facebook|hotjar|clarity|intercom|sentry|vercel-insights|vercel-analytics|tawk|crisp/i;
  if (blockThirdParty) {
    await p.route("**/*", (route) => (THIRD.test(route.request().url()) ? route.abort() : route.continue()));
  }
  const byOrigin = {};
  p.on("requestfinished", async (r) => {
    if (r.resourceType() !== "script") return;
    try {
      const o = new URL(r.url()).host;
      const s = await r.sizes();
      byOrigin[o] = byOrigin[o] || { n: 0, wire: 0 };
      byOrigin[o].n++;
      byOrigin[o].wire += s.responseBodySize || 0;
    } catch {}
  });

  await p.goto(SITE + path, { waitUntil: "load", timeout: 300000 }).catch(() => {});
  await p.waitForTimeout(22000);
  const m = await p.evaluate(() => {
    const res = performance.getEntriesByType("resource");
    const js = res.filter((r) => r.initiatorType === "script" || /\.js(\?|$)/.test(r.name));
    const first = js.filter((r) => r.name.includes("weddingwala.pk"));
    const third = js.filter((r) => !r.name.includes("weddingwala.pk"));
    const dec = (a) => a.reduce((x, r) => x + (r.decodedBodySize || 0), 0);
    return {
      ...window.__perf,
      firstN: first.length, firstDec: dec(first),
      thirdN: third.length, thirdDec: dec(third),
      thirdHosts: [...new Set(third.map((r) => { try { return new URL(r.name).host } catch { return "?" } }))],
    };
  });
  const long = m.long || [];
  const tbt = long.filter((d) => d > 50).reduce((a, d) => a + (d - 50), 0);
  const kb = (n) => (n / 1024).toFixed(0);
  console.log(`\n══ ${label}${blockThirdParty ? "   [third-party blocked]" : ""}`);
  console.log(`   FCP ${m.fcp}ms · LCP ${m.lcp}ms · TBT ${tbt}ms · long tasks ${long.length} (worst ${long.length ? Math.max(...long) : 0}ms)`);
  console.log(`   first-party JS: ${m.firstN} files, ${kb(m.firstDec)}kb decoded`);
  console.log(`   third-party JS: ${m.thirdN} files, ${kb(m.thirdDec)}kb decoded   ${m.thirdHosts.join(", ") || "-"}`);
  await ctx.close();
  return { tbt, lcp: m.lcp, fcp: m.fcp };
}

(async () => {
  const b = await chromium.connectOverCDP("http://localhost:9223");
  const a1 = await run(b, "venue city page, as shipped", "/wedding-venues/karachi", false);
  const a2 = await run(b, "venue city page", "/wedding-venues/karachi", true);
  console.log(`\n   >> third-party cost on this page: TBT ${a1.tbt} -> ${a2.tbt}ms (${a1.tbt - a2.tbt}ms), LCP ${a1.lcp} -> ${a2.lcp}ms`);
  const h1 = await run(b, "home, as shipped", "/", false);
  const h2 = await run(b, "home", "/", true);
  console.log(`\n   >> third-party cost on home: TBT ${h1.tbt} -> ${h2.tbt}ms (${h1.tbt - h2.tbt}ms), LCP ${h1.lcp} -> ${h2.lcp}ms`);
  await b.close();
})();
