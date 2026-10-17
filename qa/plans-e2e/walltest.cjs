/**
 * The locked vendor, REAL backend: the obligations strip equals the API, the CSV downloads and opens and matches the records,
 * and the billing page can start a Safepay checkout (link creation only: nothing is paid).   node walltest.cjs <email> <userId> <tag> [w] [h]
 */
const L = require("./lib.cjs")
const fs = require("fs")
;(async () => {
  const [email, userId, tag, w = "1536", h = "864"] = process.argv.slice(2)
  const b = await L.launch()
  const ctx = await L.uiLogin(b, email, { width: +w, height: +h })
  const page = await ctx.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)))
  await page.goto(L.BASE + "/dashboard/bookings", { waitUntil: "domcontentloaded", timeout: 180000 })
  await page.waitForSelector("[data-testid=obligations-strip] .wwp-rows", { timeout: 90000 })
  await page.waitForTimeout(1500)
  const ui = await page.evaluate(() => Array.from(document.querySelectorAll("[data-testid=obligations-strip] .wwp-row")).map((r) => ({ k: r.querySelector("dt")?.firstChild?.textContent?.trim(), v: r.querySelector("dd")?.textContent?.replace(/\s+/g, " ").trim() })))
  const missed = await page.locator("[data-testid=wall-missed]").count() ? (await page.locator("[data-testid=wall-missed]").innerText()).replace(/\s+/g, " ") : null
  const api = (await L.vApi(email, "GET", "/billing/obligations")).body.data
  console.log("UI strip :", JSON.stringify(ui))
  console.log("API      :", JSON.stringify(api))
  console.log("missed   :", missed)
  const rsDigits = (s) => Number(String(s).replace(/[^0-9]/g, ""))
  const get = (k) => ui.find((r) => r.k && r.k.toLowerCase().startsWith(k))
  const checks = [
    ["events", Number(get("confirmed events")?.v) === api.confirmedEventsNext60],
    ["to collect", rsDigits(get("still to collect")?.v) === api.totalToCollect],
    ["cheques", Number(get("cheques")?.v) === api.chequesDue14d],
  ]
  console.log("strip equals API:", JSON.stringify(checks))
  await L.shot(page, `${tag}-wall-strip`)

  // CSV
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 60000 }), page.locator("[data-testid=export-csv]").click()])
  const file = `${L.OUT}/${tag}-export.csv`
  await dl.saveAs(file)
  const raw = fs.readFileSync(file)
  const text = raw.toString("utf8")
  console.log("CSV:", dl.suggestedFilename(), raw.length, "bytes; BOM:", raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf, "lines:", text.split(/\r?\n/).filter(Boolean).length)
  console.log(text.split(/\r?\n/).slice(0, 14).join("\n"))
  const cnt = await L.counts(Number(userId))
  console.log("DB counts:", JSON.stringify(cnt))
  const direct = await L.vApi(email, "GET", "/billing/export?kind=all")
  console.log("direct export status", direct.status, "bytes", (direct.text || "").length, "equal to UI download:", (direct.text || "").replace(/^﻿/, "") === text.replace(/^﻿/, ""))

  // Renew: the Wall's primary button -> billing -> Subscribe -> Safepay checkout link (never followed)
  await page.locator("[data-testid=wall-primary]").click()
  await page.waitForURL(/dashboard\/billing/, { timeout: 60000 })
  await page.waitForFunction(() => Array.from(document.querySelectorAll("div")).some((d) => d.shadowRoot && d.shadowRoot.querySelector("[data-subscribe]")), null, { timeout: 120000 })
  await page.waitForTimeout(1500)
  await L.shot(page, `${tag}-billing-locked`)
  let checkout = null
  page.on("response", async (r) => { if (/subscriptions\/checkout/.test(r.url()) && r.request().method() === "POST") checkout = { status: r.status(), body: (await r.text().catch(() => "")).slice(0, 400) } })
  await page.route(/127\.0\.0\.1:19834\/checkout/, (r) => r.fulfill({ status: 200, contentType: "text/html", body: "<h1>fake Safepay checkout (lab)</h1>" }))
  // the Wall's link is the renewal deep link (?renew=1&plan=...): the confirmation opens by itself, once
  const auto = await page.locator("[data-ww-confirm]").first().waitFor({ timeout: 8000 }).then(() => true).catch(() => false)
  console.log("renewal confirmation opened by the deep link:", auto)
  await L.shot(page, `${tag}-billing-renew-confirm`)
  if (!auto) await page.locator("[data-subscribe]").first().click()
  await page.getByRole("button", { name: /Safepay par jaayein/i }).click()
  await page.waitForURL(/127\.0\.0\.1:19834\/checkout/, { timeout: 60000 }).catch(() => console.log("did not navigate to the checkout link"))
  console.log("checkout response:", JSON.stringify(checkout), "| landed on:", page.url().slice(0, 160))
  console.log("errors:", errors.length ? errors.join(" | ") : "NONE")
  await b.close()
  process.exit(0)
})().catch((e) => { console.error("FAILED", e); process.exit(1) })
