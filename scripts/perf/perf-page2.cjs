/**
 * Round 2, with the instrument fixed.
 *
 * Round 1 reported "0 long tasks, LCP n/a" — void: getEntriesByType("longtask")
 * returns nothing unless a PerformanceObserver was registered BEFORE the page's
 * scripts ran, and cross-origin resource timing hides transferSize without a
 * Timing-Allow-Origin header. So: observers go in via addInitScript, and byte
 * sizes come from Playwright's own request.sizes() instead of the page's.
 *
 * Measures production, and the vendor dashboard behind a real login, because
 * that is the screen a vendor stares at all day.
 */
const { chromium } = require("C:/Projects/ems-v0/node_modules/playwright");
const SITE = "https://www.weddingwala.pk";

const INIT = `
  window.__perf = { long: [], lcp: 0, cls: 0, fcp: 0 };
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__perf.long.push(Math.round(e.duration)); })
      .observe({ type: "longtask", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((l) => { const es = l.getEntries(); window.__perf.lcp = Math.round(es[es.length - 1].startTime); })
      .observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value; })
      .observe({ type: "layout-shift", buffered: true });
  } catch {}
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === "first-contentful-paint") window.__perf.fcp = Math.round(e.startTime); })
      .observe({ type: "paint", buffered: true });
  } catch {}
`;

async function measure(ctx, label, url, settleMs, readyCheck) {
  const p = await ctx.newPage();
  await p.addInitScript(INIT);
  const api = [];
  p.on("requestfinished", async (r) => {
    const u = r.url();
    if (!/\/api\/v1\//.test(u)) return;
    try {
      const s = await r.sizes();
      const t = r.timing();
      api.push({ u: u.split("/api/v1")[1], wire: s.responseBodySize || 0, ms: Math.round(t.responseEnd - t.requestStart) });
    } catch {}
  });
  const t0 = Date.now();
  await p.goto(url, { waitUntil: "domcontentloaded", timeout: 180000 }).catch(() => {});
  const dcl = Date.now() - t0;
  let readyAt = null;
  if (readyCheck) {
    try { await readyCheck(p); readyAt = Date.now() - t0; } catch { readyAt = null; }
  }
  await p.waitForTimeout(settleMs);
  const perf = await p.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] || {};
    const res = performance.getEntriesByType("resource");
    return {
      ttfb: Math.round(nav.responseStart || 0),
      load: Math.round(nav.loadEventEnd || 0),
      requests: res.length,
      ...window.__perf,
      heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
    };
  });
  const totalWire = api.reduce((a, r) => a + r.wire, 0);
  const long = perf.long || [];
  const blocking = long.filter((d) => d > 50).reduce((a, d) => a + (d - 50), 0);
  const mb = (n) => (n / 1048576).toFixed(2);

  console.log(`\n══ ${label}   ${url.replace(SITE, "")}`);
  console.log(`   TTFB ${perf.ttfb}ms · FCP ${perf.fcp}ms · LCP ${perf.lcp}ms · load ${perf.load}ms${readyAt !== null ? ` · USABLE at ${readyAt}ms` : ""}`);
  console.log(`   long tasks ${long.length}, worst ${long.length ? Math.max(...long) : 0}ms, total blocking ${blocking}ms · CLS ${perf.cls.toFixed(3)} · heap ${perf.heap}MB`);
  console.log(`   API calls ${api.length}, ${mb(totalWire)} MB compressed on the wire`);
  // group by endpoint shape so "6 copies of the catalog" is visible as such
  const byShape = {};
  for (const r of api) {
    const k = r.u.split("?")[0] + (r.u.includes("limit=200") ? "?limit=200" : "");
    (byShape[k] ||= { n: 0, wire: 0, ms: 0 });
    byShape[k].n++; byShape[k].wire += r.wire; byShape[k].ms = Math.max(byShape[k].ms, r.ms);
  }
  const top = Object.entries(byShape).sort((a, b) => b[1].wire - a[1].wire).slice(0, 8);
  console.log(`   ${"endpoint".padEnd(52)} calls   wire(MB)  slowest`);
  for (const [k, v] of top)
    console.log(`   ${k.slice(0, 52).padEnd(52)} ${String(v.n).padStart(5)}   ${mb(v.wire).padStart(8)}  ${String(v.ms).padStart(6)}ms`);
  await p.close();
  return { label, perf, api, totalWire };
}

(async () => {
  const b = await chromium.connectOverCDP("http://localhost:9223");
  const ctx = await b.newContext({ viewport: { width: 1440, height: 950 } });
  await measure(ctx, "PUBLIC home", SITE + "/", 22000);
  await measure(ctx, "PUBLIC search", SITE + "/search", 22000);

  // log in on production, then the screens a vendor actually lives in
  const lp = await ctx.newPage();
  await lp.goto(SITE + "/login", { waitUntil: "load", timeout: 180000 });
  await lp.waitForTimeout(6000);
  const cc = lp.getByRole("button", { name: /essential only|accept/i }).first();
  if (await cc.count().catch(() => 0)) { await cc.click().catch(() => {}); await lp.waitForTimeout(600); }
  if (await lp.locator('input[type="email"]').count().catch(() => 0)) {
    await lp.fill('input[type="email"]', "muhammadrehmanyousaf786@gmail.com");
    await lp.fill('input[type="password"]', process.env.WW_QA_VENDOR_PASSWORD || (() => { throw new Error("Set WW_QA_VENDOR_PASSWORD") })());
    await lp.getByRole("button", { name: /sign in/i }).first().click();
    await lp.waitForTimeout(20000);
  }
  const signedIn = await lp.evaluate(() => !!localStorage.getItem("auth_token")).catch(() => false);
  console.log(`\n--- signed in on production: ${signedIn} ---`);
  await lp.close();
  if (!signedIn) { await b.close(); return }

  const shadowText = (re) => async (p) => {
    await p.waitForFunction((src) => {
      const roots = []; document.querySelectorAll("*").forEach((el) => { if (el.shadowRoot) roots.push(el.shadowRoot); });
      return roots.some((r) => new RegExp(src, "i").test(r.textContent || ""));
    }, re, { timeout: 90000 });
  };
  await measure(ctx, "VENDOR dashboard", SITE + "/dashboard", 20000, shadowText("aaj|today|booking"));
  await measure(ctx, "VENDOR bookings", SITE + "/dashboard/bookings", 20000, shadowText("booking"));
  await measure(ctx, "VENDOR calendar", SITE + "/dashboard/calendar", 20000, shadowText("[0-9]"));
  await b.close();
})();
