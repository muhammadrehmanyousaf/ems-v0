/**
 * The same measurement, N times, reported as a median — because one run is not
 * a number.
 *
 * WHY THIS EXISTS. Two runs of perf-mobile.cjs against identical deployed code
 * gave 16 long tasks / 2,080ms blocking, and then 52 long tasks / 11,189ms. A
 * 5x swing with nothing changed. The cause was this machine: a Next dev server,
 * a backend, a PGlite database and a jest suite all competing with a browser
 * whose CPU is deliberately throttled 4x. Every timing number taken that way
 * was worthless, in both directions — it could as easily have flattered a
 * change as buried one.
 *
 * So this script:
 *   1. refuses to run if something obvious is still competing (dev server on
 *      3000, a backend on 4000, the test database on 5433),
 *   2. runs each page RUNS times and reports the median and the spread,
 *   3. prints the spread loudly, because a metric whose runs disagree by more
 *      than about 30% cannot adjudicate a change and should not be quoted.
 *
 * Usage: node scripts/perf/perf-median.cjs [runs]
 */
const { chromium } = require("C:/Projects/ems-v0/node_modules/playwright");
const net = require("net");

const SITE = "https://www.weddingwala.pk";
const RUNS = Math.max(3, parseInt(process.argv[2], 10) || 3);
const PAGES = [
  ["home", "/"],
  ["search", "/search"],
  ["venue city", "/wedding-venues/karachi"],
];

const INIT = `
  window.__perf = { long: [], lcp: 0, cls: 0, fcp: 0 };
  try { new PerformanceObserver((l)=>{for(const e of l.getEntries()) window.__perf.long.push({d:Math.round(e.duration), t:Math.round(e.startTime)});}).observe({type:"longtask",buffered:true}); } catch {}
  try { new PerformanceObserver((l)=>{const es=l.getEntries(); window.__perf.lcp=Math.round(es[es.length-1].startTime);}).observe({type:"largest-contentful-paint",buffered:true}); } catch {}
  try { new PerformanceObserver((l)=>{for(const e of l.getEntries()) if(!e.hadRecentInput) window.__perf.cls+=e.value;}).observe({type:"layout-shift",buffered:true}); } catch {}
  try { new PerformanceObserver((l)=>{for(const e of l.getEntries()) if(e.name==="first-contentful-paint") window.__perf.fcp=Math.round(e.startTime);}).observe({type:"paint",buffered:true}); } catch {}
`;
const NET_4G = { offline: false, downloadThroughput: (4 * 1024 * 1024) / 8, uploadThroughput: (3 * 1024 * 1024) / 8, latency: 150 };

const portBusy = (port) =>
  new Promise((res) => {
    const s = net.createConnection({ port, host: "127.0.0.1" });
    s.on("connect", () => { s.destroy(); res(true); });
    s.on("error", () => res(false));
    setTimeout(() => { s.destroy(); res(false); }, 600);
  });

const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };
const spread = (a) => (Math.min(...a) === 0 ? Infinity : Math.max(...a) / Math.min(...a));

async function once(ctx, path) {
  const p = await ctx.newPage();
  await p.addInitScript(INIT);
  const cdp = await ctx.newCDPSession(p);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", NET_4G);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  let api = 0;
  p.on("requestfinished", (r) => { if (/\/api\/v1\//.test(r.url())) api++; });
  await p.goto(SITE + path, { waitUntil: "domcontentloaded", timeout: 300000 }).catch(() => {});
  await p.waitForTimeout(20000);
  const m = await p.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] || {};
    return { ttfb: Math.round(nav.responseStart || 0), ...window.__perf };
  });
  await p.close();
  const long = m.long || [];
  const blocking = (t) => t.filter((x) => x.d > 50).reduce((a, x) => a + (x.d - 50), 0);
  return {
    fcp: m.fcp, lcp: m.lcp, cls: m.cls, api,
    tbt: blocking(long.filter((x) => x.t <= (m.fcp || 0) + 5000)),
    tasks: long.length,
  };
}

(async () => {
  const busy = [];
  for (const [port, what] of [[3000, "a dev server"], [4000, "a local backend"], [5433, "the PGlite test database"]]) {
    if (await portBusy(port)) busy.push(`${what} on :${port}`);
  }
  if (busy.length) {
    console.log("REFUSING TO MEASURE — this machine is not quiet:\n");
    for (const b of busy) console.log("   " + b);
    console.log("\nA 4x-throttled browser shares a CPU with all of it, which is how the");
    console.log("same page produced 2,080ms and then 11,189ms of blocking. Stop them first.");
    process.exit(1);
  }

  const b = await chromium.connectOverCDP("http://localhost:9223");
  const ctx = await b.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3,
    userAgent: "Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
  });
  console.log(`${RUNS} runs per page, mid-range Android on 4G, machine quiet\n`);
  console.log("page          metric      median        runs                       spread");
  console.log("-".repeat(78));
  for (const [label, path] of PAGES) {
    const rs = [];
    for (let i = 0; i < RUNS; i++) rs.push(await once(ctx, path));
    for (const key of ["fcp", "lcp", "tbt", "api", "tasks"]) {
      const vals = rs.map((r) => r[key]);
      const sp = spread(vals);
      const warn = key === "api" || sp <= 1.3 ? "" : sp === Infinity ? "  ** a run read zero" : `  ** ${sp.toFixed(1)}x — too noisy to judge`;
      console.log(
        `${label.padEnd(13)} ${key.padEnd(10)} ${String(median(vals)).padStart(7)}   ${JSON.stringify(vals).padEnd(26)}${warn}`
      );
    }
    console.log("-".repeat(78));
  }
  await b.close();
})();
