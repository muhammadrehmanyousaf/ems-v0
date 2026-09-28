/**
 * The vendor console, measured behind a real login.
 *
 * Lighthouse cannot reach these screens — they are authenticated — so this
 * drives a real browser with a real session and records what each screen costs:
 * how many requests, how much JSON, how long until it is USABLE (content on
 * screen, not just a 200), duplicate calls, and blocking within the window the
 * vendor waits through.
 *
 * The vendor lives here all day. A screen that takes four seconds costs the
 * business its own staff time, every time, which is a different kind of
 * expensive from a slow public page.
 *
 * Usage: node scripts/perf/sweep-console.cjs [--site=https://www.weddingwala.pk]
 */
const { chromium } = require("C:/Projects/ems-v0/node_modules/playwright");

const SITE = (process.argv.find((a) => a.startsWith("--site=")) || "").split("=")[1] || "https://www.weddingwala.pk";
const EMAIL = "muhammadrehmanyousaf786@gmail.com";
const PASSWORD = "mian@A12345";

const SCREENS = [
  ["overview", "/dashboard"],
  ["bookings", "/dashboard/bookings"],
  ["calendar", "/dashboard/calendar"],
  ["leads", "/dashboard/leads"],
  ["money / khata", "/dashboard/money"],
  ["customers", "/dashboard/customers"],
  ["payments", "/dashboard/payments"],
  ["receivables", "/dashboard/receivables"],
  ["expenses", "/dashboard/expenses"],
  ["insights", "/dashboard/insights"],
  ["venue-os", "/dashboard/venue-os"],
  ["spaces", "/dashboard/spaces"],
  ["settings", "/dashboard/settings"],
  ["chat", "/dashboard/chat"],
  ["function sheets", "/dashboard/function-sheets"],
  ["packages", "/dashboard/packages"],
  ["staff", "/dashboard/staff"],
  ["promote", "/dashboard/promote"],
];

const INIT = `
  window.__perf = { long: [], fcp: 0, lcp: 0 };
  try { new PerformanceObserver((l)=>{for(const e of l.getEntries()) window.__perf.long.push({d:Math.round(e.duration),t:Math.round(e.startTime)});}).observe({type:"longtask",buffered:true}); } catch {}
  try { new PerformanceObserver((l)=>{for(const e of l.getEntries()) if(e.name==="first-contentful-paint") window.__perf.fcp=Math.round(e.startTime);}).observe({type:"paint",buffered:true}); } catch {}
  try { new PerformanceObserver((l)=>{const es=l.getEntries(); window.__perf.lcp=Math.round(es[es.length-1].startTime);}).observe({type:"largest-contentful-paint",buffered:true}); } catch {}
`;

(async () => {
  const b = await chromium.connectOverCDP("http://127.0.0.1:9223");
  const ctx = await b.newContext({ viewport: { width: 1440, height: 950 } });

  // sign in once; every screen reuses the session
  const lp = await ctx.newPage();
  await lp.goto(SITE + "/login", { waitUntil: "load", timeout: 180000 });
  await lp.waitForTimeout(6000);
  const cc = lp.getByRole("button", { name: /essential only|accept/i }).first();
  if (await cc.count().catch(() => 0)) { await cc.click().catch(() => {}); await lp.waitForTimeout(600); }
  if (await lp.locator('input[type="email"]').count().catch(() => 0)) {
    await lp.fill('input[type="email"]', EMAIL);
    await lp.fill('input[type="password"]', PASSWORD);
    await lp.getByRole("button", { name: /sign in/i }).first().click();
    await lp.waitForTimeout(20000);
  }
  const signedIn = await lp.evaluate(() => !!localStorage.getItem("auth_token")).catch(() => false);
  console.log(`signed in: ${signedIn}\n`);
  await lp.close();
  if (!signedIn) { console.log("** every measurement below would be a redirect, not a screen"); await b.close(); return }

  const rows = [];
  for (const [label, path] of SCREENS) {
    const p = await ctx.newPage();
    await p.addInitScript(INIT);
    const calls = [];
    p.on("response", async (r) => {
      if (!/\/api\/v1\//.test(r.url())) return;
      let bytes = 0;
      try { bytes = (await r.body()).length } catch {}
      calls.push({ u: r.url().split("/api/v1")[1].split("?")[0], status: r.status(), bytes });
    });
    const errors = [];
    p.on("pageerror", (e) => errors.push(String(e.message).slice(0, 80)));

    const t0 = Date.now();
    await p.goto(SITE + path, { waitUntil: "domcontentloaded", timeout: 240000 }).catch(() => {});
    // "usable" = the shadow shell has rendered real content, not a spinner
    let usable = null;
    try {
      await p.waitForFunction(() => {
        const roots = [];
        document.querySelectorAll("*").forEach((el) => { if (el.shadowRoot) roots.push(el.shadowRoot) });
        const txt = roots.map((r) => r.textContent || "").join(" ") + document.body.innerText;
        return txt.replace(/\s+/g, "").length > 400;
      }, null, { timeout: 60000 });
      usable = Date.now() - t0;
    } catch {}
    await p.waitForTimeout(9000);

    const m = await p.evaluate(() => window.__perf);
    const long = m.long || [];
    const tbt = long.filter((x) => x.d > 50 && x.t <= (m.fcp || 0) + 5000).reduce((a, x) => a + (x.d - 50), 0);
    const bytes = calls.reduce((a, c) => a + c.bytes, 0);
    const dupes = {};
    for (const c of calls) dupes[c.u] = (dupes[c.u] || 0) + 1;
    const repeated = Object.entries(dupes).filter(([, n]) => n > 1).sort((a, c) => c[1] - a[1]);
    const bad = calls.filter((c) => c.status >= 400);

    rows.push({ label, path, calls: calls.length, kb: Math.round(bytes / 1024), usable, tbt, repeated, bad: bad.length, errors: errors.length });
    console.log(
      `  ${label.padEnd(17)} ${String(calls.length).padStart(3)} calls  ${String(Math.round(bytes / 1024)).padStart(5)}kb  usable ${String(usable ?? "never").padStart(6)}ms  blocking ${String(tbt).padStart(5)}ms` +
      (repeated.length ? `  repeats: ${repeated.slice(0, 2).map(([u, n]) => `${n}x${u}`).join(", ")}` : "") +
      (bad.length ? `  ** ${bad.length} non-2xx` : "") +
      (errors.length ? `  ** ${errors.length} js errors` : "")
    );
    await p.close();
  }

  console.log("\nWORST FIRST (by requests, then by time-to-usable)");
  console.log("-".repeat(88));
  for (const r of [...rows].sort((a, c) => c.calls - a.calls || (c.usable || 0) - (a.usable || 0))) {
    console.log(`  ${r.label.padEnd(17)} ${String(r.calls).padStart(3)} calls  ${String(r.kb).padStart(5)}kb  usable ${String(r.usable ?? "never").padStart(6)}ms`);
  }
  const tot = rows.reduce((a, r) => a + r.calls, 0);
  console.log(`\n${rows.length} screens · ${tot} requests total · median ${rows.map((r) => r.calls).sort((a, b) => a - b)[rows.length >> 1]} per screen`);
  await b.close();
})();
