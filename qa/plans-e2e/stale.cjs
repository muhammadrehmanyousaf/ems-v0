/** Stale-tab scenario: console open while the plan ends; then the person clicks the sidebar. node stale.cjs <email> <tag> <nextOffsetDays> */
const L = require("./lib.cjs")
;(async () => {
  const [email, tag, next] = process.argv.slice(2)
  const b = await L.launch()
  const ctx = await L.uiLogin(b, email)
  const page = await ctx.newPage()
  const api = []
  page.on("response", (r) => { const u = r.url(); if (u.includes(":5134/api/v1/")) api.push(`${r.status()} ${r.request().method()} ${u.replace(/^.*\/api\/v1/, "").split("?")[0]}`) })
  await page.goto(L.BASE + "/dashboard/bookings", { waitUntil: "domcontentloaded", timeout: 180000 })
  await page.waitForSelector("[data-testid=plan-banners], [data-testid=plan-chip]", { timeout: 90000 })
  await page.waitForTimeout(2000)
  const links = await page.evaluate(() => Array.from(document.querySelectorAll("a[href^='/dashboard']")).map((a) => a.getAttribute("href")).filter((v, i, a) => a.indexOf(v) === i))
  console.log("sidebar/page links:", links.join(" "))
  await L.shot(page, `${tag}-stale-0-open`)
  // the tab's own status poll would find out within 20 s; hold it back so the 402 on a vendor request is the only teller
  await page.route('**/api/v1/subscriptions/status', (r) => r.abort())
  await L.restartBackend(Number(next) * L.DAY)
  api.length = 0
  await page.waitForTimeout(1500); await L.shot(page, `${tag}-stale-0b-after-restart`); console.log('wall before click:', await page.locator('[data-testid=access-wall]').count())
  // click the first sidebar item that is not the current page
  await page.getByText('Leads', { exact: true }).first().click()
  await page.waitForSelector("[data-testid=access-wall]", { timeout: 60000 }).catch(() => console.log("  wall never appeared after click!"))
  await page.waitForTimeout(1500)
  console.log("after click leads: url", page.url(), "wall:", await page.getAttribute("[data-testid=access-wall]", "data-variant").catch(() => null))
  console.log(api.join("\n"))
  await L.shot(page, `${tag}-stale-1-wall-after-click`)
  await b.close()
})().catch((e) => { console.error("FAILED", e); process.exit(1) })
