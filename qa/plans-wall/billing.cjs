/**
 * The billing page in every plan state, as screenshots: node qa/plans-wall/billing.cjs [width] [height] [tag] [filter]
 * Mocked: /subscriptions/status (with entitlements), manual-payment, live-venues. Real: the lab backend (/me catalogue etc.).
 */
const L = require("./lib.cjs")

const MANUAL_METHODS = [
  { key: "bank", label: "Bank transfer", accountTitle: "WeddingWala (Pvt) Ltd", bankName: "Meezan Bank", accountNumber: "PK36 MEZN 0001 2345 6789 0123", note: "Use your phone number as the reference." },
  { key: "jazzcash", label: "JazzCash", accountTitle: "WeddingWala", accountNumber: "0300 1234567" },
  { key: "easypaisa", label: "Easypaisa", accountTitle: "WeddingWala", accountNumber: "0345 7654321" },
]
const manual = (current = null) => ({ enabled: true, methods: MANUAL_METHODS, current })

const ents = (over = false) => ({
  tier: "pro", planName: "Basic", enforced: true, endsAt: null, features: {},
  limits: {
    businesses: { max: 1, used: over ? 9 : 1, label: "businesses", scope: "account", reached: true, nextPlan: "Pro" },
    staff: { max: 2, used: 1, label: "staff accounts", scope: "account", reached: false, nextPlan: "Pro" },
    spaces: { max: 3, used: over ? 5 : 2, label: "halls and spaces per business", scope: "business", reached: false, nextPlan: "Pro" },
    images: { max: 25, used: 8, label: "photos per business", scope: "business", reached: false, nextPlan: "Pro" },
  },
})

const SCENARIOS = {
  "trial": { access: () => L.accessObj("trialing", { trialEndsAt: L.pkEnd(18), daysLeft: 18 }), manual: "404" },
  "trial-last": { access: () => L.accessObj("trialing", { trialEndsAt: L.pkEnd(1), daysLeft: 1 }), manual: "404" },
  "locked": { access: () => L.accessObj("locked", { lockReason: "plan_ended", lockedAt: L.pkEnd(-1), retainUntil: L.pkEnd(89) }), manual: () => manual() },
  "deeplink-renew": { access: () => L.accessObj("locked", { lockReason: "plan_ended", lockedAt: L.pkEnd(-1), retainUntil: L.pkEnd(89) }), manual: () => manual(), path: "/dashboard/billing?renew=1&plan=premium", settle: 1500 },
  "locked-plans": { access: () => L.accessObj("locked", { lockReason: "plan_ended", lockedAt: L.pkEnd(-1), retainUntil: L.pkEnd(89) }), manual: () => manual(), scroll: 760 },
  "locked-bottom": { access: () => L.accessObj("locked", { lockReason: "plan_ended", lockedAt: L.pkEnd(-1), retainUntil: L.pkEnd(89) }), manual: () => manual(), scroll: 99999 },
  "locked-trial-ended": { access: () => L.accessObj("locked", { lockReason: "trial_ended", plan: null, planName: null, lockedAt: L.pkEnd(-1), retainUntil: L.pkEnd(89) }), manual: () => manual() },
  "past-due": { access: () => L.accessObj("past_due", { graceEndsAt: L.pkEnd(5), daysLeft: 5 }), manual: () => manual() },
  "cancelling": { access: () => L.accessObj("cancelling", { endsAt: L.pkEnd(11), daysLeft: 11 }), manual: "404" },
  "manual-open": { access: () => L.accessObj("locked", { lockReason: "plan_ended", lockedAt: L.pkEnd(-1), retainUntil: L.pkEnd(89) }), manual: () => manual(), openManual: true },
  "manual-pending": { access: () => L.accessObj("locked", { lockReason: "plan_ended", lockedAt: L.pkEnd(-1), retainUntil: L.pkEnd(89) }), manual: () => manual({ id: 1, status: "pending", tier: "premium", method: "jazzcash", amountPkr: 5000, reference: "JC-77881", submittedAt: new Date(Date.now() - 3600e3).toISOString(), decidedAt: null, rejectionReason: null }) },
  "manual-rejected": { access: () => L.accessObj("locked", { lockReason: "plan_ended", lockedAt: L.pkEnd(-1), retainUntil: L.pkEnd(89) }), manual: () => manual({ id: 1, status: "rejected", tier: "premium", method: "bank", amountPkr: 5000, reference: "TX-1", submittedAt: new Date(Date.now() - 7200e3).toISOString(), decidedAt: new Date().toISOString(), rejectionReason: "The amount on the receipt is Rs 2,500" }) },
  "manual-approved": { access: () => L.accessObj("active"), manual: () => manual({ id: 1, status: "approved", tier: "premium", method: "easypaisa", amountPkr: 5000, reference: "EP-1", submittedAt: new Date(Date.now() - 7200e3).toISOString(), decidedAt: new Date().toISOString(), rejectionReason: null }) },
  "over-limit": { access: () => L.accessObj("active", { plan: "pro", planName: "Basic" }), manual: "404", over: true, live: "404" },
  "over-limit-choose": { access: () => L.accessObj("active", { plan: "pro", planName: "Basic" }), manual: "404", over: true, live: "ok", openLive: true },
}

;(async () => {
  const [w = "1536", h = "864", tag = "d1536", filter = ""] = process.argv.slice(2)
  const b = await L.launch()
  const ctx = await L.login(b, { width: +w, height: +h })
  for (const [name, sc] of Object.entries(SCENARIOS)) {
    if (filter && !new RegExp(filter).test(name)) continue
    const page = await ctx.newPage()
    const errors = []
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)))
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 140)) })
    await L.mockAll(page, { status: () => L.statusBody(L.accessObj("active"), {}), obligations: undefined })
    await page.unroute("**/api/v1/subscriptions/status")
    await page.route("**/api/v1/subscriptions/status", (r) => { const a = sc.access(); return L.fulfill(r, L.j({ ...L.statusBody(a), entitlements: ents(!!sc.over) })) })
    await page.route("**/api/v1/subscriptions/manual-payment", (r) => {
      if (r.request().method() === "POST") return L.fulfill(r, L.j({ id: 9, status: "pending" }))
      return sc.manual === "404" || !sc.manual ? L.fulfill(r, L.j(null, "nf", false), 404) : L.fulfill(r, L.j(sc.manual()))
    })
    await page.route("**/api/v1/subscriptions/live-venues", (r) => {
      if (sc.live !== "ok") return L.fulfill(r, L.j(null, "nf", false), 404)
      if (r.request().method() === "PUT") return L.fulfill(r, L.j({ ok: true }))
      return L.fulfill(r, L.j({ limit: 1, planName: "Basic", venues: Array.from({ length: 9 }, (_, i) => ({ id: 100 + i, name: i === 0 ? "Local Test Marquee" : `Venue ${i + 1}`, city: "Lahore", live: i === 0 })) }))
    })
    await page.goto(`${L.BASE}${sc.path || "/dashboard/billing" + (sc.openManual ? "?pay=manual" : "")}`, { waitUntil: "domcontentloaded", timeout: 180000 })
    await page.waitForSelector(".cscroll", { timeout: 90000 }).catch(() => {})
    await page.waitForFunction(() => {
      const hosts = Array.from(document.querySelectorAll("div")).filter((d) => d.shadowRoot)
      return hosts.some((h) => h.shadowRoot.querySelector(".plans"))
    }, null, { timeout: 120000 }).catch(() => console.log("  (plans never rendered)"))
    await page.waitForTimeout(1800)
    if (sc.openLive) { await page.locator("[data-live-open]").first().click().catch(() => {}); await page.waitForTimeout(900) }
    if (sc.scroll) { await page.evaluate((y) => { const el = document.querySelector(".cscroll"); if (el) el.scrollTop = y }, sc.scroll); await page.waitForTimeout(600) }
    const f = await L.shot(page, `${tag}-bill-${name}`)
    console.log(name.padEnd(20), "errors:", errors.length ? errors.join(" | ") : "NONE")
    await page.close()
  }
  await b.close()
})().catch((e) => { console.error("FAILED", e); process.exit(1) })
