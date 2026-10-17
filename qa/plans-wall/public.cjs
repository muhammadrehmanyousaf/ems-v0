/**
 * The public venue page of a paused venue, and a customer refused 409 VENUE_UNAVAILABLE.
 * node public.cjs [width] [height] [tag]  (needs the lab proxy: qa/plans-wall/proxy.cjs on :5190)
 */
const L = require("./lib.cjs")
const PROXY = "http://localhost:5190"
const ctl = (o) => fetch(`${PROXY}/__ctl`, { method: "POST", body: JSON.stringify(o) }).then((r) => r.json())

;(async () => {
  const [w = "1536", h = "864", tag = "d1536"] = process.argv.slice(2)
  const b = await L.launch()
  const ctx = await b.newContext({ viewport: { width: +w, height: +h } }) // a guest: no login
  const biz = await (await fetch(`${PROXY}/api/v1/businesses?limit=1`)).json().catch(() => null)
  const urlFor = (id) => `${L.BASE}/wedding-venues/lahore/x-${id}`
  // The page caches the venue for an hour (ISR): each scenario uses its own venue id so a cached answer never hides the switch.
  const run = async (name, o, fn, id = 5) => {
    const url = urlFor(id)
    await ctl({ notice: false, gone409: false, ...o })
    const page = await ctx.newPage()
    const errors = []
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)))
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 180000 })
    const ess = page.getByRole("button", { name: /essential only/i }).first(); if (await ess.count()) await ess.click().catch(() => {})
    await page.waitForSelector("h1", { timeout: 120000 }).catch(() => {})
    await page.waitForTimeout(1500)
    if (fn) await fn(page)
    await L.shot(page, `${tag}-venue-${name}`)
    console.log(name.padEnd(18), "errors:", errors.length ? errors.join(" | ") : "NONE", "| notice:", await page.locator("[data-testid=venue-unavailable-notice]").count(), "| disabled CTAs:", await page.locator("[data-testid=venue-cta-disabled]").count())
    await page.close()
  }
  await run("open", {})
  await run("paused", {}, null, 12)
  await run("paused-409-dialog", { gone409: true }, async (page) => {
    await page.getByRole("button", { name: /Ask a question/i }).first().click()
    await page.waitForTimeout(600)
    await page.getByLabel(/Phone/i).fill("03001234567")
    await page.getByRole("button", { name: /Send inquiry/i }).click()
    await page.waitForSelector("[data-testid=venue-unavailable-notice]", { timeout: 20000 }).catch(() => {})
    await page.waitForTimeout(500)
  }, 9)
  await ctl({ notice: false, gone409: false })
  await b.close()
})().catch((e) => { console.error("FAILED", e); process.exit(1) })
