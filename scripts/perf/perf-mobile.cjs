/**
 * The Pakistani user, not me.
 *
 * My laptop on a wired connection said FCP 960ms / LCP 1.9s and called it fine.
 * The customers this marketplace is for are on a mid-range Android on 4G. So:
 * CPU throttled 4x (a realistic mid-tier phone vs this laptop), network shaped
 * to 4G, 390px viewport — and measure the same things.
 *
 * Run twice per page: cold (no cache) and warm, because a first visit is what
 * decides whether someone stays.
 */
const { chromium } = require("C:/Projects/ems-v0/node_modules/playwright");
const SITE = "https://www.weddingwala.pk";

const INIT = `
  window.__perf = { long: [], lcp: 0, cls: 0, fcp: 0 };
  try { new PerformanceObserver((l)=>{for(const e of l.getEntries()) window.__perf.long.push({d:Math.round(e.duration), t:Math.round(e.startTime)});}).observe({type:"longtask",buffered:true}); } catch {}
  try { new PerformanceObserver((l)=>{const es=l.getEntries(); window.__perf.lcp=Math.round(es[es.length-1].startTime);}).observe({type:"largest-contentful-paint",buffered:true}); } catch {}
  try { new PerformanceObserver((l)=>{for(const e of l.getEntries()) if(!e.hadRecentInput) window.__perf.cls+=e.value;}).observe({type:"layout-shift",buffered:true}); } catch {}
  try { new PerformanceObserver((l)=>{for(const e of l.getEntries()) if(e.name==="first-contentful-paint") window.__perf.fcp=Math.round(e.startTime);}).observe({type:"paint",buffered:true}); } catch {}
`;

// Chrome's own "Fast 4G" preset
const NET_4G = { offline: false, downloadThroughput: (4 * 1024 * 1024) / 8, uploadThroughput: (3 * 1024 * 1024) / 8, latency: 150 };

async function run(b, label, path) {
  const ctx = await b.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
    userAgent: "Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
  });
  const p = await ctx.newPage();
  await p.addInitScript(INIT);
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", NET_4G);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  let apiCalls = 0, apiMs = 0;
  p.on("requestfinished", (r) => { if (/\/api\/v1\//.test(r.url())) { apiCalls++; const t = r.timing(); apiMs = Math.max(apiMs, Math.round(t.responseEnd - t.requestStart)); } });

  const t0 = Date.now();
  await p.goto(SITE + path, { waitUntil: "domcontentloaded", timeout: 300000 }).catch(() => {});
  const dcl = Date.now() - t0;
  await p.waitForTimeout(30000);
  const total = Date.now() - t0;

  const m = await p.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] || {};
    return { ttfb: Math.round(nav.responseStart || 0), load: Math.round(nav.loadEventEnd || 0), ...window.__perf };
  });
  const long = m.long || [];
  /**
   * TWO blocking numbers, because they answer different questions and the gap
   * between them is the entire point of deferring work.
   *
   * `tbt` counts only long tasks STARTING within 5s of FCP — roughly
   * Lighthouse's FCP-to-interactive window, i.e. the blocking a visitor
   * actually waits through. `tbtAll` counts every long task in the ~30s
   * observation.
   *
   * Measured on the venue page after Google Analytics was deferred: the total
   * barely moved (2,229 -> 2,209ms) because gtag still runs, just at 4.8s
   * instead of at load. Reporting only the total said the change did nothing,
   * which was this instrument being wrong about what "blocked" means.
   */
  const blocking = (tasks) => tasks.filter((x) => x.d > 50).reduce((a, x) => a + (x.d - 50), 0);
  const inWindow = long.filter((x) => x.t <= (m.fcp || 0) + 5000);
  const tbt = blocking(inWindow);
  const tbtAll = blocking(long);
  const worst = long.length ? Math.max(...long.map((x) => x.d)) : 0;
  console.log(`\n══ ${label}  ${path}   [mid-range Android, 4G, CPU 4x slower]`);
  console.log(`   TTFB ${m.ttfb}ms · FCP ${m.fcp}ms · LCP ${m.lcp}ms · load ${m.load}ms`);
  console.log(`   BLOCKING first 5s after FCP: ${tbt}ms (${inWindow.length} tasks)  ·  whole window: ${tbtAll}ms (${long.length} tasks, worst ${worst}ms) · CLS ${m.cls.toFixed(3)}`);
  console.log(`   API calls ${apiCalls}, slowest ${apiMs}ms   (page settled by ${total}ms)`);
  const verdict = [];
  if (m.lcp > 2500) verdict.push(`LCP ${m.lcp}ms fails Google's 2500ms threshold`);
  if (tbt > 300) verdict.push(`blocking ${tbt}ms in the first 5s is over the 300ms line`);
  if (m.cls > 0.1) verdict.push(`CLS ${m.cls.toFixed(3)} fails 0.1`);
  console.log(`   ${verdict.length ? "** " + verdict.join("; ") : "within Core Web Vitals thresholds"}`);
  await ctx.close();
}

(async () => {
  const b = await chromium.connectOverCDP("http://localhost:9223");
  await run(b, "home", "/");
  await run(b, "search", "/search");
  await run(b, "venue city page", "/wedding-venues/karachi");
  await b.close();
})();
