/** node look.cjs <email> <route> <tag> [w] [h] [waitSelector] : login, open a route, shoot (viewport) */
const L = require("./lib.cjs")
;(async () => {
  const [email, route, tag, w = "1536", h = "864", sel] = process.argv.slice(2)
  const b = await L.launch()
  const ctx = await L.uiLogin(b, email, { width: +w, height: +h })
  const page = await ctx.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)))
  await page.goto(L.BASE + route, { waitUntil: "domcontentloaded", timeout: 180000 })
  if (sel) await page.waitForSelector(sel, { timeout: 90000 }).catch(() => console.log("(selector never seen)"))
  await page.waitForTimeout(4500)
  const info = await page.evaluate(() => ({ path: location.pathname, wall: document.querySelector("[data-testid=access-wall]")?.getAttribute("data-variant") || null, banners: Array.from(document.querySelectorAll("[data-kind]")).map((e) => e.getAttribute("data-kind")), chip: document.querySelector("[data-testid=plan-chip]")?.textContent || null, hscroll: document.documentElement.scrollWidth > innerWidth + 1 }))
  await L.shot(page, `${tag}`, { full: false })
  console.log(JSON.stringify(info), "errors:", errors.length ? errors.join(" | ") : "NONE")
  await b.close()
  process.exit(0)
})().catch((e) => { console.error("FAILED", e); process.exit(1) })
