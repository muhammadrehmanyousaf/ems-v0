/** Look at the admin screens. node adminshots.cjs <tag> [w] [h] [route,route...] */
const L = require("./lib.cjs")
;(async () => {
  const [tag, w = "1536", h = "864", routes = "manual-payments,billing-tools"] = process.argv.slice(2)
  const b = await L.launch()
  const ctx = await L.uiLogin(b, L.K.CREDS.admin.email, { width: +w, height: +h }, L.K.CREDS.admin.password)
  for (const r of routes.split(",")) {
    const page = await ctx.newPage()
    const errors = []
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)))
    await page.goto(`${L.BASE}/dashboard/admin/${r}`, { waitUntil: "domcontentloaded", timeout: 180000 })
    await page.waitForSelector("h1, h2", { timeout: 90000 }).catch(() => {})
    await page.waitForTimeout(3500)
    const info = await page.evaluate(() => ({ h: document.querySelector("h1")?.textContent, hscroll: document.documentElement.scrollWidth > innerWidth + 1, wall: !!document.querySelector("[data-testid=access-wall]") }))
    await L.shot(page, `${tag}-${r}`)
    console.log(r, JSON.stringify(info), "errors:", errors.length ? errors.join("|") : "NONE")
    await page.close()
  }
  await b.close()
  process.exit(0)
})().catch((e) => { console.error("FAILED", e); process.exit(1) })
