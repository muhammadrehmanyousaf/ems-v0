/** node banner.cjs <email> <tag> [route] : fresh UI login at the CURRENT backend clock, open the console, shoot at 1536 / 1920 / 390. */
const L = require("./lib.cjs")
;(async () => {
  const [email, tag, route = "/dashboard/bookings"] = process.argv.slice(2)
  const b = await L.launch()
  try {
    for (const [w, h, n] of [[1536, 864, "d1536"], [1920, 1080, "d1920"], [390, 844, "m390"]]) {
      const ctx = await L.uiLogin(b, email, { width: w, height: h })
      const page = await ctx.newPage()
      const errors = []
      page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)))
      await page.goto(L.BASE + route, { waitUntil: "domcontentloaded", timeout: 180000 })
      await page.waitForSelector("[data-testid=plan-banners], [data-testid=plan-chip], [data-testid=access-wall]", { timeout: 120000 }).catch(() => console.log("  (no plan UI seen)"))
      await page.waitForTimeout(2500)
      const info = await page.evaluate(() => {
        const q = (s) => document.querySelector(s)
        return { wall: q("[data-testid=access-wall]")?.getAttribute("data-variant") || null, banners: Array.from(document.querySelectorAll("[data-kind]")).map((e) => e.getAttribute("data-kind")), chip: q("[data-testid=plan-chip]")?.textContent || null, hscroll: document.documentElement.scrollWidth > window.innerWidth + 1 }
      })
      await L.shot(page, `${tag}-${n}`)
      console.log(n, JSON.stringify(info), "errors:", errors.length ? errors.join(" | ") : "NONE")
      await ctx.close()
    }
  } finally { await b.close() }
})().catch((e) => { console.error("FAILED", e); process.exit(1) })
