/** The billing tools screen, driven like a super admin would. node admintools.cjs <tag> [w] [h] */
const L = require("./lib.cjs")
;(async () => {
  const [tag, w = "1536", h = "864"] = process.argv.slice(2)
  const b = await L.launch()
  const ctx = await L.uiLogin(b, L.K.CREDS.admin.email, { width: +w, height: +h }, L.K.CREDS.admin.password)
  const page = await ctx.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)))
  const bad = []
  page.on("response", (r) => { if (r.url().includes(":5134/api/v1/") && r.status() >= 400) bad.push(`${r.status()} ${r.request().method()} ${r.url().replace(/^.*\/api\/v1/, "").split("?")[0]}`) })
  await page.goto(`${L.BASE}/dashboard/admin/billing-tools`, { waitUntil: "domcontentloaded", timeout: 180000 })
  await page.getByLabel("Find a vendor").waitFor({ timeout: 90000 })
  const find = async (q) => { await page.getByLabel("Find a vendor").fill(q); await page.getByRole("button", { name: /^Search$/ }).click(); await page.waitForTimeout(2500) }
  const act = async (btn, fields, submit, shotName) => {
    await page.getByRole("button", { name: btn }).first().click()
    for (const [label, val] of fields) await page.getByLabel(label).fill(val)
    if (shotName) await L.shot(page, `${tag}-${shotName}`, { wait: 300 })
    await page.getByRole("button", { name: submit }).last().click()
    await page.waitForTimeout(3500)
  }
  // 1. lookup by name, open V1
  await find("ple.vendor")
  await L.shot(page, `${tag}-lookup-hits`)
  await page.locator("[data-testid=vendor-hits] button").first().click()
  await page.waitForSelector("[data-testid=vendor-panel]", { timeout: 30000 })
  await page.waitForTimeout(1500)
  await L.shot(page, `${tag}-vendor-v1`)
  // 2. suspend / lift
  await act(/^Suspend$/, [["Reason", "PL-E: policy review"]], /^Suspend$/, "suspend-form")
  await L.shot(page, `${tag}-vendor-v1-suspended`)
  const st = await L.status("ple.vendor.61855850@localhost.test"); console.log("V1 after suspend:", st.state, st.lockReason, "canPay", st.canPay)
  await act(/Lift suspension/, [["Reason", "PL-E: review done"]], /Lift suspension/, null)
  console.log("V1 after lift:", (await L.status("ple.vendor.61855850@localhost.test")).state)
  // 3. a locked vendor (user 3): grant trial, extend, then let it be locked and force-unlock is shown via user 2
  await find("3")
  await page.waitForSelector("[data-testid=vendor-panel]", { timeout: 30000 }); await page.waitForTimeout(1200)
  await L.shot(page, `${tag}-vendor-locked`)
  await act(/Grant trial/, [["Trial days", "7"], ["Reason", "PL-E: onboarding call done"]], /^Grant trial$/, "grant-form")
  await L.shot(page, `${tag}-vendor-trialing`)
  await act(/Extend trial/, [["Days to add", "5"], ["Reason", "PL-E: needed more time"]], /^Extend trial$/, "extend-form")
  await L.shot(page, `${tag}-vendor-extended`)
  // comp over the limit is refused by the server
  await page.getByRole("button", { name: /Comp a plan/ }).click()
  await page.getByLabel("Comp end date").fill(new Date(Date.now() + 200 * 86400000).toISOString().slice(0, 10))
  await page.getByLabel("Reason").fill("PL-E: too long on purpose")
  await page.getByRole("button", { name: /Grant comp/ }).click()
  await page.waitForTimeout(2000)
  await L.shot(page, `${tag}-comp-too-long`, { wait: 100 })
  console.log("toast after 200-day comp:", await page.evaluate(() => (document.querySelector("[data-sonner-toast]")?.innerText || "none").replace(/\s+/g, " ")))
  // force unlock a locked vendor (user 2)
  await find("2")
  await page.waitForSelector("[data-testid=vendor-panel]", { timeout: 30000 }); await page.waitForTimeout(1200)
  const fu = await page.getByRole("button", { name: /Force unlock/ }).isEnabled()
  console.log("user 2 force unlock enabled:", fu)
  if (fu) { await act(/Force unlock/, [["Hours", "48"], ["Reason", "PL-E: bridge while payment is checked"]], /Unlock now/, "unlock-form"); await L.shot(page, `${tag}-vendor-unlocked`) }
  for (const [t, name] of [["Expiring", "expiring"], ["Locked with events", "locked"], ["Metrics", "metrics"], ["Audit log", "audit"], ["Shadow report", "shadow"]]) {
    await page.getByRole("tab", { name: t }).click(); await page.waitForTimeout(3500); await L.shot(page, `${tag}-tab-${name}`)
  }
  console.log("HTTP >=400:", bad.join(" | ") || "none", "| page errors:", errors.join("|") || "NONE")
  await b.close(); process.exit(0)
})().catch((e) => { console.error("FAILED", e.message.slice(0, 400)); process.exit(1) })
