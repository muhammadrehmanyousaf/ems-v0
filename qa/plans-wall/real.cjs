/**
 * The real thing, no mocks (lab backend with PL-A's accessState): the locked fixture vendor sees the Wall, starts the free
 * trial from the fallback, and the console opens with the trial chip. node qa/plans-wall/real.cjs [w] [h] [tag]
 * (dev server on :3011 pointed at the proxy -> the lab backend; the vendor must be at "no plan": re-clone the DB to repeat)
 */
const L = require("./lib.cjs")

;(async () => {
  const [w = "1536", h = "864", tag = "d1536"] = process.argv.slice(2)
  const b = await L.launch()
  const ctx = await L.login(b, { width: +w, height: +h })
  const page = await ctx.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)))
  const reqs = []
  page.on("response", (r) => { const u = r.url(); if (/subscriptions\/(status|trial)|billing\//.test(u)) reqs.push(`${r.status()} ${r.request().method()} ${u.replace(/^https?:\/\/[^/]+/, "")}`) })

  await page.goto(`${L.BASE}/dashboard/bookings`, { waitUntil: "domcontentloaded", timeout: 180000 })
  await page.waitForSelector("[data-testid=access-wall]", { timeout: 120000 })
  console.log("wall variant:", await page.getAttribute("[data-testid=access-wall]", "data-variant"), "| trial link:", await page.locator("[data-testid=wall-trial]").count(), "| primary:", (await page.locator("[data-testid=wall-primary]").innerText()).trim())
  await L.shot(page, `${tag}-real-1-wall`)

  await page.locator("[data-testid=wall-trial]").click()
  await page.waitForURL(/dashboard\/billing/, { timeout: 60000 })
  await page.waitForFunction(() => Array.from(document.querySelectorAll("div")).some((d) => d.shadowRoot && d.shadowRoot.querySelector("[data-trial]")), null, { timeout: 120000 })
  await page.waitForTimeout(1200)
  await L.shot(page, `${tag}-real-2-billing`)

  await page.locator("[data-trial]").nth(1).click() // Pro
  await page.waitForTimeout(700)
  await page.getByRole("button", { name: /Trial shuru karein/i }).click()
  await page.waitForTimeout(3500)
  await page.goto(`${L.BASE}/dashboard/bookings`, { waitUntil: "domcontentloaded", timeout: 120000 })
  await page.waitForSelector("[data-testid=plan-banners], [data-testid=plan-chip]", { timeout: 120000 }).catch(() => {})
  await page.waitForTimeout(1500)
  await L.shot(page, `${tag}-real-3-after-trial`)
  console.log("errors:", errors.length ? errors.join(" | ") : "NONE")
  console.log(reqs.join("\n"))
  await b.close()
})().catch((e) => { console.error("FAILED", e); process.exit(1) })
