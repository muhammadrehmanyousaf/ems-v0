/** The super admin works the manual payment queue in the REAL admin screen. node adminmanual.cjs <approve|reject|look> <tag> [reason] */
const L = require("./lib.cjs")
;(async () => {
  const [action, tag, reason = "The transfer reference does not match our statement. Please send the correct reference and screenshot."] = process.argv.slice(2)
  const b = await L.launch()
  const ctx = await L.uiLogin(b, L.K.CREDS.admin.email, { width: 1536, height: 864 }, L.K.CREDS.admin.password)
  const page = await ctx.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)))
  await page.goto(`${L.BASE}/dashboard/admin/manual-payments`, { waitUntil: "domcontentloaded", timeout: 180000 })
  await page.locator("[data-testid=manual-row], :text(\"Nothing is waiting\")").first().waitFor({ timeout: 90000 })
  await page.waitForTimeout(2500)
  await L.shot(page, `${tag}-admin-queue`)
  const rows = await page.locator("[data-testid=manual-row]").count()
  console.log("pending rows:", rows)
  if (action === "reject") {
    await page.getByRole("button", { name: /^Reject$/ }).first().click()
    await page.getByLabel("Reason for rejecting").fill(reason)
    await L.shot(page, `${tag}-admin-reject-form`)
    await page.getByRole("button", { name: /Confirm reject/ }).click()
  } else if (action === "approve") {
    await page.getByRole("button", { name: /^Approve$/ }).first().click()
    await L.shot(page, `${tag}-admin-approve-confirm`)
    await page.getByRole("button", { name: /Yes, approve/ }).click()
  }
  await page.waitForTimeout(3500)
  if (action !== "look") {
    await L.shot(page, `${tag}-admin-after-${action}`)
    for (const t of ["Approved", "Rejected"]) {
      await page.getByRole("tab", { name: t }).click()
      await page.waitForTimeout(2200)
      await L.shot(page, `${tag}-admin-tab-${t}`)
    }
  }
  console.log("errors:", errors.length ? errors.join(" | ") : "NONE")
  await b.close()
  process.exit(0)
})().catch((e) => { console.error("FAILED", e); process.exit(1) })
