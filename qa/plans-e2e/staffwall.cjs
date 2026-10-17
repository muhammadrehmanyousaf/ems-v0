/** A staff member of a locked vendor: login works, every staff screen shows the staff Wall (no pay button, owner masked). node staffwall.cjs <tag> */
const L = require("./lib.cjs")
const ROUTES = ["/staff/today", "/staff/leave", "/staff/payslips", "/staff/profile", "/floor"]
;(async () => {
  const tag = process.argv[2] || "s05"
  const b = await L.launch()
  const ctx = await b.newContext({ viewport: { width: 1536, height: 864 }, locale: "en-GB", timezoneId: "Asia/Karachi" })
  const p = await ctx.newPage()
  await p.goto(`${L.BASE}/staff/login`, { waitUntil: "domcontentloaded", timeout: 180000 })
  await p.waitForSelector("input[type=email]", { timeout: 120000 })
  await L.shot(p, `${tag}-staff-login`)
  await p.fill("input[type=email]", "ple.staff@localhost.test")
  await p.fill("input[type=password]", L.PW)
  await p.getByRole("button", { name: /sign in|log in|login/i }).first().click()
  await p.waitForFunction(() => !!localStorage.getItem("staff_auth_token"), null, { timeout: 60000 }).catch(() => console.log("no staff token after login"))
  await p.waitForTimeout(3000)
  console.log("after login url:", p.url())
  await L.shot(p, `${tag}-staff-after-login`)
  for (const r of ROUTES) {
    const page = await ctx.newPage()
    const api = []
    page.on("response", (x) => { const u = x.url(); if (u.includes(":5134/api/v1/")) api.push(`${x.status()} ${x.request().method()} ${u.replace(/^.*\/api\/v1/, "").split("?")[0]}`) })
    await page.goto(L.BASE + r, { waitUntil: "domcontentloaded", timeout: 180000 })
    await page.waitForSelector("[data-testid=access-wall]", { timeout: 40000 }).catch(() => {})
    await page.waitForTimeout(1500)
    const info = await page.evaluate(() => {
      const w = document.querySelector("[data-testid=access-wall]")
      return { path: location.pathname, wall: w?.getAttribute("data-variant") || null, pay: !!document.querySelector("[data-testid=wall-primary]"), text: (w?.textContent || "").replace(/\s+/g, " ").slice(0, 200) }
    })
    console.log(r.padEnd(16), JSON.stringify(info), "\n    api:", api.join(" | "))
    if (r === "/staff/today" || r === "/floor") await L.shot(page, `${tag}-staff-${r.replace(/\W+/g, "_")}`)
    await page.close()
  }
  await b.close()
})().catch((e) => { console.error("FAILED", e); process.exit(1) })
