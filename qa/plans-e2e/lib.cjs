/**
 * PL-E drivers: the REAL PL-A + PL-B backend (lab slot 34, :5134), no mocks. Headed Chromium, dev server :3011.
 * The backend clock is shifted by restarting it with FAKE_CLOCK_OFFSET_MS (tools/fake-clock.cjs), as PL-C's timetravel.cjs did.
 */
const { chromium } = require("playwright")
const { spawn, spawnSync } = require("child_process")
const fs = require("fs")
const path = require("path")
const net = require("net")

const FE = process.env.FE_PORT || "3011"
const BASE = `http://localhost:${FE}`
const API = "http://localhost:5134/api/v1"
const OUT = process.env.OUT || "C:/Projects/WW-PAYMENT-TEST/regression/pl-e-admin-e2e-evidence"
const PW = "Localtest#1234"
const DAY = 86400e3
fs.mkdirSync(OUT, { recursive: true })
process.env.WW_API = API
process.env.WW_PG = "postgres://postgres:postgres@127.0.0.1:5434/ww_pay_34"
const K = require("C:/Projects/WW-PAYMENT-TEST/tools/kit.cjs")

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function listenerPid(port) {
  const r = spawnSync("cmd", ["/c", `netstat -ano | findstr :${port} | findstr LISTENING`], { encoding: "utf8" })
  const m = /LISTENING\s+(\d+)/.exec(r.stdout || "")
  return m ? m[1] : null
}
/** Restart the lab backend with the clock shifted by `offsetMs` (0 = real time). Kills only the PID listening on 5134 (ours). */
async function restartBackend(offsetMs, extraEnv = {}) {
  const old = listenerPid(5134)
  if (old) spawnSync("taskkill", ["/PID", old, "/T", "/F"])
  await sleep(1500)
  const env = { ...process.env, FAKE_CLOCK_OFFSET_MS: String(offsetMs), ...extraEnv }
  const child = spawn("bash", [path.join(__dirname, "be.sh")], { env, detached: true, stdio: "ignore" })
  child.unref()
  for (let i = 0; i < 90; i++) {
    await sleep(1000)
    if (listenerPid(5134)) { await sleep(2500); return }
  }
  throw new Error("backend did not come up")
}

async function launch() { return chromium.launch({ headless: false }) }

/** Real UI login (the same form a vendor uses). Returns a context with the session. */
async function uiLogin(browser, email, viewport = { width: 1536, height: 864 }, password = PW) {
  const ctx = await browser.newContext({ viewport, locale: "en-GB", timezoneId: "Asia/Karachi" })
  const p = await ctx.newPage()
  await p.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 180000 })
  await p.waitForSelector("input[type=email]", { timeout: 180000 })
  const ess = p.getByRole("button", { name: /essential only/i }).first()
  if (await ess.count()) await ess.click().catch(() => {})
  await p.fill("input[type=email]", email)
  await p.fill("input[type=password]", password)
  await p.getByRole("button", { name: /sign in/i }).first().click()
  await p.waitForFunction(() => !!localStorage.getItem("auth_token"), null, { timeout: 90000 })
  await p.waitForTimeout(1500)
  await p.close()
  return ctx
}

async function shot(page, name, opts = {}) {
  await page.waitForTimeout(opts.wait ?? 900)
  await page.addStyleTag({ content: ".tsqd-open-btn-container,[data-nextjs-toast],nextjs-portal{display:none !important}" }).catch(() => {})
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: !!opts.full })
  return file
}

/** DB-side record counts for one vendor user (all of the vendor's businesses). */
async function counts(userId) {
  const one = async (sql) => Number((await K.q(sql, [userId]))[0].c)
  return {
    businesses: await one('select count(*)::int c from "Businesses" where "userId"=$1'),
    bookings: await one('select count(distinct bb."bookingId")::int c from "BookingDetails" bb join "Businesses" b on b.id=bb."businessId" where b."userId"=$1'),
    leads: await one('select count(*)::int c from "Leads" l join "Businesses" b on b.id=l."businessId" where b."userId"=$1'),
    expenses: await one('select count(*)::int c from "VendorExpenses" e join "Businesses" b on b.id=e."businessId" where b."userId"=$1'),
    receipts: await one('select count(*)::int c from "PaymentReceipts" r where r."bookingId" in (select bb."bookingId" from "BookingDetails" bb join "Businesses" b on b.id=bb."businessId" where b."userId"=$1)'),
    receiptPkr: await one('select coalesce(sum(r.amount),0)::int c from "PaymentReceipts" r where r."bookingId" in (select bb."bookingId" from "BookingDetails" bb join "Businesses" b on b.id=bb."businessId" where b."userId"=$1)'),
  }
}
async function status(email) {
  const s = await K.api({ email, password: PW }, "GET", "/subscriptions/status")
  return s.body && s.body.data && s.body.data.accessState
}
async function adminApi(method, p, body) { return K.api("admin", method, p, body) }
async function vApi(email, method, p, body) { return K.api({ email, password: PW }, method, p, body) }

module.exports = { FE, BASE, API, OUT, PW, DAY, K, sleep, listenerPid, restartBackend, launch, uiLogin, shot, counts, status, adminApi, vApi }
