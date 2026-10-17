/**
 * Headed Playwright kit for the plans wall (PL-C). Lab only: the app is the dev/prod server on PORT with
 * NEXT_PUBLIC_BACKEND_URL pointing at the lab backend; nothing here can reach production.
 *
 * Status and the lock answers are mocked at the network edge (the backend for PL-A/PL-B is built in parallel), everything
 * else is the real lab backend with the real fixture vendor.
 */
const { chromium } = require("playwright")
const fs = require("fs")
const path = require("path")

const PORT = process.env.FE_PORT || "3011"
const BASE = `http://localhost:${PORT}`
const LAB_API = process.env.LAB_API || "http://localhost:5132"
const OUT = process.env.OUT || path.join(__dirname, "shots")
const STATE = process.env.STATE_FILE || path.join(process.env.TEMP || ".", `plc-state-${PORT}.json`)
fs.mkdirSync(OUT, { recursive: true })

const VENDOR = { email: "vendor.ww-local-test-fixture@localhost.test", password: "localtestpassword" }

async function launch() {
  return chromium.launch({ headless: false })
}

async function login(browser, viewport = { width: 1536, height: 864 }) {
  if (fs.existsSync(STATE)) {
    const ctx = await browser.newContext({ viewport, storageState: STATE })
    return ctx
  }
  const ctx = await browser.newContext({ viewport })
  const p = await ctx.newPage()
  await p.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 180000 })
  await p.waitForSelector("input[type=email]", { timeout: 180000 })
  const ess = p.getByRole("button", { name: /essential only/i }).first()
  if (await ess.count()) await ess.click().catch(() => {})
  await p.fill("input[type=email]", VENDOR.email)
  await p.fill("input[type=password]", VENDOR.password)
  await p.getByRole("button", { name: /sign in/i }).first().click()
  await p.waitForFunction(() => !!localStorage.getItem("auth_token"), null, { timeout: 90000 })
  await p.waitForTimeout(1500)
  await ctx.storageState({ path: STATE })
  await p.close()
  return ctx
}

/* ───────── fixtures ───────── */
const j = (data, message = "ok", status = true) => JSON.stringify({ status, message, data })
const fulfill = (route, body, code = 200, headers = {}) => route.fulfill({ status: code, contentType: "application/json", headers, body })

/** 23:59:59 Asia/Karachi on `days` calendar days from now, as an ISO (UTC) string. */
function pkEnd(days) {
  const now = new Date()
  const pk = new Date(now.getTime() + 5 * 3600 * 1000) // PKT = UTC+5, no DST
  const y = pk.getUTCFullYear(), m = pk.getUTCMonth(), d = pk.getUTCDate() + days
  return new Date(Date.UTC(y, m, d, 23, 59, 59) - 5 * 3600 * 1000).toISOString()
}

function accessObj(state, o = {}) {
  return {
    state, plan: "premium", planName: "Pro", trialEndsAt: null, graceEndsAt: null, lockedAt: null, retainUntil: null, lockReason: null,
    canPay: true, canStartTrial: false, renewUrl: "/dashboard/billing?renew=1&plan=premium", daysLeft: null, ...o,
  }
}

function statusBody(access, extra = {}) {
  const open = !["locked", "dormant", "closed", "suspended_admin"].includes(access.state)
  return {
    access, tier: access.plan || "free", enforced: true, environment: "sandbox",
    subscriptionEndsAt: access.trialEndsAt || access.graceEndsAt || access.lockedAt || null,
    subscription: access.plan ? {
      reference: "wwsub_1_demo", tier: access.plan, status: access.state === "trialing" ? "trialing" : open ? "active" : "lapsed",
      activatedAt: "2026-09-01T00:00:00.000Z", trialEndsAt: access.trialEndsAt, currentPeriodEndsAt: access.trialEndsAt,
      failedAt: null, cancelledAt: null, lastEventType: null, lastEventAt: null, createdAt: "2026-09-01T00:00:00.000Z",
    } : null,
    pending: null,
    ...extra,
  }
}

const OBLIGATIONS = { confirmedEventsNext60: 4, nextEvent: { date: pkEnd(9), slotLabel: "Evening", hall: "Grand Hall" }, totalToCollect: 1850000, chequesDue14d: 2, enquiriesWhileLocked: 12 }

async function mockAll(page, ctl) {
  // ctl = { status: object|fn, lockData: false|{...}, obligations, staff }
  await page.route("**/api/v1/subscriptions/status", (r) => {
    if (ctl.statusCode) return fulfill(r, j(null, "no", false), ctl.statusCode)
    const s = typeof ctl.status === "function" ? ctl.status() : ctl.status
    return fulfill(r, j(s))
  })
  await page.route("**/api/v1/billing/obligations", (r) => {
    if (ctl.obligations === "error") return fulfill(r, j(null, "boom", false), 500)
    if (ctl.obligations === "404") return fulfill(r, j(null, "nf", false), 404)
    return fulfill(r, j(ctl.obligations || OBLIGATIONS))
  })
  await page.route("**/api/v1/billing/export", (r) => fulfill(r, "date,type,amount\n2026-10-01,receipt,50000\n", 200, { "content-type": "text/csv", "content-disposition": 'attachment; filename="weddingwala-money-tax.csv"' }))
  if (ctl.lock402) {
    await page.route(/\/api\/v1\/(leads|bookings|customers|payments|receipts|calendar|chat)(\?|\/|$)/, (r) => {
      if (r.request().method() === "OPTIONS") return r.fallback()
      return fulfill(r, JSON.stringify({ status: false, message: "Your plan has ended.", data: ctl.lock402 }), 402)
    })
  }
}

async function shot(page, name, opts = {}) {
  await page.waitForTimeout(opts.wait ?? 900)
  // The dev-only React Query devtools button would sit in every shot; hide it so screenshots show the product.
  await page.addStyleTag({ content: ".tsqd-open-btn-container,[data-nextjs-toast],nextjs-portal{display:none !important}" }).catch(() => {})
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  return file
}

module.exports = { BASE, LAB_API, OUT, launch, login, j, fulfill, pkEnd, accessObj, statusBody, OBLIGATIONS, mockAll, shot, VENDOR }
