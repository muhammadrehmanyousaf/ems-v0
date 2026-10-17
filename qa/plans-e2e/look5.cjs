/** vendor 5 (fixture vendor) screens at three sizes. node look5.cjs <route> <tag> */
const L = require("./lib.cjs")
const K = L.K
;(async () => {
  const [route, tag] = process.argv.slice(2)
  const b = await L.launch()
  for (const [w, h, n] of [[1920, 1080, "d1920"], [390, 844, "m390"], [1536, 864, "d1536"]]) {
    const ctx = await L.uiLogin(b, K.CREDS.vendor.email, { width: w, height: h }, K.CREDS.vendor.password)
    const page = await ctx.newPage()
    await page.goto(L.BASE + route, { waitUntil: "domcontentloaded", timeout: 180000 })
    await page.waitForSelector("[data-testid=access-wall], [data-testid=plan-banners]", { timeout: 60000 }).catch(() => {})
    await page.waitForTimeout(3500)
    const info = await page.evaluate(() => ({ wall: document.querySelector("[data-testid=access-wall]")?.getAttribute("data-variant") || null, hscroll: document.documentElement.scrollWidth > innerWidth + 1, vscroll: document.documentElement.scrollHeight > innerHeight + 1 }))
    await L.shot(page, `${tag}-${n}`)
    console.log(n, JSON.stringify(info))
    await ctx.close()
  }
  await b.close()
  process.exit(0)
})().catch((e) => { console.error("FAILED", e); process.exit(1) })
