/**
 * The legacy venue page (/venues/:id, VendorDetailsMobile) and the booking funnel (/:id/booking) for a paused venue (id 8
 * is paused by qa/plans-wall/proxy.cjs). node qa/plans-wall/legacy-venue.cjs [w] [h] [tag]
 */
const L = require("./lib.cjs")

;(async () => {
  const [w = "1536", h = "864", tag = "d1536"] = process.argv.slice(2)
  const b = await L.launch()
  const ctx = await L.login(b, { width: +w, height: +h }) // booking funnel needs a signed-in customer-ish session
  for (const [name, path, wait] of [["legacy-paused", "/venues/8", "[data-testid=venue-unavailable-notice]"], ["funnel-paused", "/8/booking", "[data-testid=venue-unavailable-notice]"], ["legacy-open", "/venues/9", "h1"]]) {
    const page = await ctx.newPage()
    const errors = []
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)))
    await page.goto(`${L.BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 180000 })
    const ess = page.getByRole("button", { name: /essential only/i }).first()
    await page.waitForSelector(wait, { timeout: 90000 }).catch(() => console.log("  (no", wait, "on", path, ")"))
    if (await ess.count()) await ess.click().catch(() => {})
    await page.waitForTimeout(1200)
    console.log(name.padEnd(16), "errors:", errors.length ? errors.join(" | ") : "NONE", "| notice:", await page.locator("[data-testid=venue-unavailable-notice]").count(), "| disabled hero CTAs:", await page.locator("button[disabled]").count())
    await L.shot(page, `${tag}-${name}`)
    await page.close()
  }
  await b.close()
})().catch((e) => { console.error("FAILED", e); process.exit(1) })
