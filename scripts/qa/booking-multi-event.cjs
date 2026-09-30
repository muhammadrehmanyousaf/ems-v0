/**
 * Two functions in one booking — the tabs, the ledger's "1 of 2", and the
 * per-function state. Screenshots only; nothing is submitted.
 *
 *   node scripts/qa/booking-multi-event.cjs [--base http://localhost:3001] [--venue 3358] [--out DIR]
 *
 * Reuses the session saved by booking-journey.cjs (.qa/booking-journey/state.json
 * or --state PATH).
 */
const { chromium } = require("playwright")
const fs = require("fs")
const path = require("path")

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`)
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d
}
const BASE = arg("base", "http://localhost:3001").replace(/\/$/, "")
const VENUE = arg("venue", "3358")
const OUT = arg("out", path.join(process.cwd(), ".qa", "booking-multi"))
const STATE = arg("state", path.join(process.cwd(), ".qa", "run3", "state.json"))
fs.mkdirSync(OUT, { recursive: true })
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)

async function shot(p, name) {
  const file = path.join(OUT, `${name}.png`)
  await p.screenshot({ path: file })
  const m = await p.evaluate(() => ({
    step: document.querySelector("[data-booking-step]")?.getAttribute("data-booking-step"),
    tabs: [...document.querySelectorAll('[role="tab"]')].map((t) => `${t.textContent.trim()}${t.getAttribute("aria-selected") === "true" ? "*" : ""}`),
    eventRow: document.querySelector('[data-booking-ledger-row="event"]')?.textContent.trim(),
    money: document.querySelector("[data-booking-money]")?.textContent.trim().slice(0, 80),
    docScroll: document.documentElement.scrollHeight > window.innerHeight + 1,
  }))
  log(name, JSON.stringify(m))
  return m
}

;(async () => {
  const b = await chromium.launch({ headless: false })
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, storageState: STATE })
  const p = await ctx.newPage()
  await p.goto(`${BASE}/${VENUE}/booking`, { waitUntil: "domcontentloaded", timeout: 90000 })
  await p.waitForSelector("[data-booking-step]", { timeout: 60000 })
  await p.waitForTimeout(2000)
  await p.addStyleTag({ content: ".tsqd-open-btn-container{display:none !important}" }).catch(() => {})
  const discard = p.getByRole("button", { name: /discard|start over|start fresh/i }).first()
  if (await discard.count()) { await discard.click().catch(() => {}); await p.waitForTimeout(600) }

  await p.getByRole("button", { name: /^Mehndi/i }).first().click()
  await p.getByRole("button", { name: /^Baraat/i }).first().click()
  await p.waitForTimeout(400)
  await shot(p, "m1-two-picked")
  await p.locator('[data-booking-action="continue"]').click()
  await p.waitForSelector('[data-booking-step="datetime"]', { timeout: 30000 })
  await p.waitForTimeout(2500)
  await shot(p, "m2-tab1-date")

  // Fill tab 1's date + slot + guests, then switch to tab 2 and back.
  const day = p.locator('[data-booking-step="datetime"] button[aria-label*=", 20"]:not([disabled])').first()
  await day.click(); await p.waitForTimeout(1000)
  const slot = p.locator("[data-booking-slots] button:not([disabled])").first()
  if (await slot.count()) { await slot.click(); await p.waitForTimeout(600) }
  await shot(p, "m3-tab1-filled")
  const tab2 = p.getByRole("tab").nth(1)
  await tab2.click(); await p.waitForTimeout(1200)
  await shot(p, "m4-tab2-empty")
  await p.getByRole("tab").nth(0).click(); await p.waitForTimeout(1200)
  await shot(p, "m5-tab1-again")

  // Walk tab 1 to review so the combined "All functions" line can show.
  for (let i = 0; i < 6; i++) {
    const key = await p.evaluate(() => document.querySelector("[data-booking-step]")?.getAttribute("data-booking-step"))
    if (key === "review") break
    if (key === "packages") { await p.locator('[data-booking-step="packages"] button[aria-pressed]').first().click(); await p.waitForTimeout(400) }
    if (key === "menu") { await p.locator('[data-booking-step="menu"] [role="radio"]').first().click(); await p.waitForTimeout(400) }
    await p.locator('[data-booking-action="continue"]').click()
    await p.waitForTimeout(1500)
  }
  await shot(p, "m6-tab1-review")

  // Leave guard: the close button must ask, not navigate.
  await p.getByRole("button", { name: /close booking/i }).click()
  await p.waitForTimeout(600)
  await shot(p, "m7-leave-dialog")
  const stay = p.getByRole("button", { name: /^stay$/i })
  log("leave dialog shown:", await stay.count() > 0)
  if (await stay.count()) await stay.click()
  await p.waitForTimeout(400)

  await ctx.close(); await b.close()
  log("done →", OUT)
})().catch((e) => { console.error(e); process.exit(1) })
