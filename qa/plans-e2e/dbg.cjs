const L = require("./lib.cjs")
;(async () => {
  const b = await L.launch()
  const ctx = await L.uiLogin(b, "ple.vendor.61855850@localhost.test")
  const page = await ctx.newPage()
  page.on("crash", () => console.log("PAGE CRASH"))
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("console", m.type(), m.text().slice(0, 200)) })
  page.on("pageerror", (e) => console.log("pageerror", String(e).slice(0, 300)))
  await page.goto(L.BASE + "/dashboard/billing?pay=manual", { waitUntil: "domcontentloaded", timeout: 120000 })
  for (let i = 0; i < 8; i++) { await page.waitForTimeout(2500); console.log(i, await page.locator("#mp-ref").count().catch(() => "x")) }
  await L.shot(page, "dbg-billing-manual")
  await b.close(); process.exit(0)
})().catch((e) => { console.error("FAILED", e.message.slice(0, 200)); process.exit(1) })
