/**
 * Does any page ship content the visitor can never see?
 *
 * WHY THIS EXISTS. A ScrollReveal change left large parts of the homepage and
 * the listings at `opacity: 0` permanently — 26 blocks still invisible after
 * scrolling the whole page. It reached production and customers complained. It
 * was invisible to everything else we measure: Lighthouse scored the pages,
 * LCP and TBT looked normal, the request sweep was clean, the accessibility
 * audit passed. None of them ask whether the page can be SEEN.
 *
 * The check: load each route, scroll it the way a person does, then count
 * elements that are large, still at opacity 0, not animating, and actually
 * contain something.
 *
 * What it deliberately ignores, because the first version reported twelve
 * "defects" on a perfectly healthy page:
 *   - anything with a `group-hover:opacity-*` / `hover:opacity-*` class,
 *   - `absolute inset-0` gradient scrims, which are hover overlays,
 *   - elements with no text and no image, which are not content anyone misses.
 *
 * Any non-zero result is a page with content nobody can read. Run it before
 * calling a front-end change done.
 *
 * Usage: node scripts/qa/hidden-content.cjs [https://base-url]
 */
const { chromium } = require("playwright");
const BASE = process.argv[2] || "https://www.weddingwala.pk";
const ROUTES = ["/", "/venues", "/vendors", "/search", "/about", "/how-it-works", "/pricing",
  "/help", "/contact", "/blog", "/real-weddings", "/planning-tools", "/wedding-venues",
  "/wedding-venues/karachi", "/compare-vendors", "/wedding-guides"];
(async () => {
  const b = await chromium.launch();
  for (const r of ROUTES) {
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    let status = 0;
    try { const res = await p.goto(BASE + r, { waitUntil: "networkidle", timeout: 60000 }); status = res ? res.status() : 0; } catch {}
    await p.waitForTimeout(2500);
    // scroll through, as a person would
    await p.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 0.8) {
        window.scrollTo(0, y); await new Promise((x) => setTimeout(x, 150));
      }
    });
    await p.waitForTimeout(2500);
    const n = await p.evaluate(() => [...document.querySelectorAll("*")].filter((e) => {
      const cs = getComputedStyle(e); const rc = e.getBoundingClientRect();
      if (!(rc.width > 250 && rc.height > 150)) return false;
      if (cs.opacity !== "0" || cs.animationName !== "none") return false;
      const cls = (e.className || "").toString();
      // Hover overlays are opacity:0 ON PURPOSE and reveal on hover — a card's
      // gradient scrim, for instance. Counting those as broken content is how
      // the first version of this check reported 12 "defects" on a healthy page.
      if (/group-hover:opacity|hover:opacity/.test(cls)) return false;
      if (/absolute inset-0/.test(cls) && /gradient|bg-black|bg-bridal/.test(cls)) return false;
      // Something with no text and no image is not content a visitor is missing.
      const hasContent = (e.innerText || "").trim().length > 0 || e.querySelector("img");
      return !!hasContent;
    }).length);
    console.log("  " + String(status) + "  invisible=" + String(n).padStart(3) + "   " + r);
    await p.close();
  }
  await b.close();
})();
