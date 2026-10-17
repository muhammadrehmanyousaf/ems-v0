/**
 * Every plan state, as a screenshot at the chosen size: node qa/plans-wall/states.cjs [width] [height] [tag] [filter]
 * Mocked: /subscriptions/status, /billing/obligations, /billing/export, and 402 for staff. Real: the lab backend.
 */
const L = require("./lib.cjs")

const SCENARIOS = {
  "open-paid": { status: () => L.statusBody(L.accessObj("active")) },
  "trial-welcome": { status: () => L.statusBody(L.accessObj("trialing", { trialEndsAt: L.pkEnd(29), daysLeft: 29 })) },
  "trial-t7": { status: () => L.statusBody(L.accessObj("trialing", { trialEndsAt: L.pkEnd(5), daysLeft: 5 })), dismissWelcome: true },
  "trial-t3": { status: () => L.statusBody(L.accessObj("trialing", { trialEndsAt: L.pkEnd(2), daysLeft: 2 })) },
  "trial-t1": { status: () => L.statusBody(L.accessObj("trialing", { trialEndsAt: L.pkEnd(1), daysLeft: 1 })) },
  "trial-today": { status: () => L.statusBody(L.accessObj("trialing", { trialEndsAt: L.pkEnd(0), daysLeft: 0 })) },
  "trial-quiet": { status: () => L.statusBody(L.accessObj("trialing", { trialEndsAt: L.pkEnd(18), daysLeft: 18 })), dismissWelcome: true },
  "past-due": { status: () => L.statusBody(L.accessObj("past_due", { graceEndsAt: L.pkEnd(5), daysLeft: 5 })) },
  "cancelling": { status: () => L.statusBody(L.accessObj("cancelling", { endsAt: L.pkEnd(11), daysLeft: 11 })) },
  "wall-trial-ended": { status: () => L.statusBody(L.accessObj("locked", { lockReason: "trial_ended", lockedAt: L.pkEnd(-1), retainUntil: L.pkEnd(89) })) },
  "wall-plan-ended": { status: () => L.statusBody(L.accessObj("locked", { lockReason: "plan_ended", lockedAt: L.pkEnd(-1), retainUntil: L.pkEnd(89) })) },
  "wall-payment-failed": { status: () => L.statusBody(L.accessObj("locked", { lockReason: "payment_failed", lockedAt: L.pkEnd(-1), retainUntil: L.pkEnd(89) })) },
  "wall-dormant": { status: () => L.statusBody(L.accessObj("dormant", { lockReason: "plan_ended", lockedAt: L.pkEnd(-100), retainUntil: L.pkEnd(265) })) },
  "wall-closed": { status: () => L.statusBody(L.accessObj("closed", { lockReason: "plan_ended", lockedAt: L.pkEnd(-400), retainUntil: null })) },
  "wall-suspended": { status: () => L.statusBody(L.accessObj("suspended_admin", { canPay: false, lockReason: "admin_suspended", lockedAt: L.pkEnd(-2) })) },
  "wall-staff": { statusCode: 403, lock402: { code: "SUBSCRIPTION_REQUIRED", state: "locked", lockReason: "plan_ended", lockedSince: L.pkEnd(-1), retainUntil: L.pkEnd(89), renewUrl: null, staff: true, ownerMasked: "+92 3** *** *20" } },
  "wall-obl-error": { status: () => L.statusBody(L.accessObj("locked", { lockReason: "plan_ended", lockedAt: L.pkEnd(-1), retainUntil: L.pkEnd(89) })), obligations: "error" },
  "wall-obl-404": { status: () => L.statusBody(L.accessObj("locked", { lockReason: "plan_ended", lockedAt: L.pkEnd(-1), retainUntil: L.pkEnd(89) })), obligations: "404" },
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
    if (sc.dismissWelcome) { const te = sc.status().access.trialEndsAt; await page.addInitScript((k) => { try { localStorage.setItem(k, "1") } catch {} }, `ww:plans:dismiss:trial_welcome:${te}`) }
    await L.mockAll(page, sc)
    await page.goto(`${L.BASE}/dashboard/bookings`, { waitUntil: "domcontentloaded", timeout: 180000 })
    await page.waitForSelector(sc.waitFor || (name.startsWith("wall-") ? "[data-testid=access-wall]" : name === "open-paid" ? ".cscroll" : name === "trial-quiet" ? "[data-testid=plan-chip]" : "[data-testid=plan-banners]"), { timeout: 90000 }).catch(() => {})
    await page.waitForTimeout(sc.settle || 2500)
    const f = await L.shot(page, `${tag}-${name}`)
    console.log(name.padEnd(22), "errors:", errors.length ? errors.join(" | ") : "NONE", f)
    await page.close()
  }
  await b.close()
})().catch((e) => { console.error("FAILED", e); process.exit(1) })
