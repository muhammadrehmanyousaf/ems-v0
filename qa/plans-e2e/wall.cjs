/**
 * The Wall on the REAL backend: a locked vendor, every console route.
 *   node wall.cjs <email> <tag> [w] [h]
 * - stale-tab scenario is in stale.cjs; this one logs in fresh at the CURRENT (locked) clock
 * - every route: Wall present? which /api/v1 answers came back (any 200 that is not on the never-lock list is a leak)
 */
const L = require("./lib.cjs")
const fs = require("fs")
const ROUTES = ["/dashboard","/dashboard/automation","/dashboard/availability","/dashboard/blocked-dates","/dashboard/bookings","/dashboard/bookings/3","/dashboard/bookings/3/financials","/dashboard/brokers","/dashboard/business","/dashboard/business/15/documents","/dashboard/businesses","/dashboard/businesses-overview","/dashboard/calendar","/dashboard/cancellation-policy","/dashboard/chat","/dashboard/claims","/dashboard/collaborations","/dashboard/customers","/dashboard/customers/1","/dashboard/drone-noc","/dashboard/expenses","/dashboard/field","/dashboard/function-sheet-composer","/dashboard/function-sheet-operations","/dashboard/function-sheet-sign","/dashboard/function-sheets","/dashboard/function-sheets/1","/dashboard/generator-fuel","/dashboard/halal-certs","/dashboard/holds","/dashboard/insights","/dashboard/inventory","/dashboard/kitchen-prep","/dashboard/leads","/dashboard/leads/1","/dashboard/migrate","/dashboard/money","/dashboard/notifications","/dashboard/onboarding","/dashboard/packages","/dashboard/payments","/dashboard/pdcs","/dashboard/promote","/dashboard/quotes","/dashboard/receipts","/dashboard/receivables","/dashboard/reliability","/dashboard/reports","/dashboard/revenue","/dashboard/reviews","/dashboard/roles","/dashboard/settings","/dashboard/settings/advanced","/dashboard/settings/security","/dashboard/setup","/dashboard/slots","/dashboard/spaces","/dashboard/staff","/dashboard/staff/1","/dashboard/suppliers","/dashboard/suppliers/1","/dashboard/tax","/dashboard/today","/dashboard/trade-ops","/dashboard/users","/dashboard/vendors","/dashboard/vendors/10","/dashboard/venue-os","/dashboard/admin/platform-pulse","/dashboard/admin/vendor-queue","/dashboard/admin/subscriptions","/dashboard/admin/audit-logs"]
const OPEN = ["/dashboard/billing", "/dashboard/profile", "/dashboard/business/new"]
const NEVERLOCK_API = /\/(subscriptions\/(status|manual-payment|live-venues|me|plans)|billing\/(obligations|export)|auth\/|users\/me|user\/me|notifications\/unread|support|complaints|settings\/profile)/

;(async () => {
  const [email, tag, w = "1536", h = "864"] = process.argv.slice(2)
  const b = await L.launch()
  const ctx = await L.uiLogin(b, email, { width: +w, height: +h })
  const results = []
  const leaks = {}
  for (const route of [...ROUTES, ...OPEN]) {
    const page = await ctx.newPage()
    const api = []
    page.on("response", (r) => { const u = r.url(); if (u.includes(":5134/api/v1/")) api.push({ s: r.status(), m: r.request().method(), u: u.replace(/^.*\/api\/v1/, "").split("?")[0] }) })
    const errors = []
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 120)))
    await page.goto(L.BASE + route, { waitUntil: "domcontentloaded", timeout: 180000 }).catch((e) => errors.push("goto " + e.message.slice(0, 80)))
    await page.waitForSelector("[data-testid=access-wall]", { timeout: OPEN.includes(route) ? 9000 : 45000 }).catch(() => {})
    await page.waitForTimeout(OPEN.includes(route) ? 3000 : 1800)
    const info = await page.evaluate(() => ({
      path: location.pathname,
      wall: document.querySelector("[data-testid=access-wall]")?.getAttribute("data-variant") || null,
      sidebar: !!document.querySelector(".cshell aside, [data-sidebar], nav[aria-label]"),
      hscroll: document.documentElement.scrollWidth > window.innerWidth + 1,
    }))
    const bad = api.filter((x) => x.s === 200 && !NEVERLOCK_API.test(x.u))
    bad.forEach((x) => { leaks[x.m + " " + x.u] = (leaks[x.m + " " + x.u] || 0) + 1 })
    results.push({ route, ...info, n402: api.filter((x) => x.s === 402).length, errors })
    console.log(route.padEnd(42), "->", info.path.padEnd(28), "wall:", String(info.wall).padEnd(12), "402s:", api.filter((x) => x.s === 402).length, "200-nonexempt:", bad.length, errors.length ? "ERR " + errors.join("|") : "")
    if (["/dashboard/bookings", "/dashboard/leads", "/dashboard/settings", "/dashboard/admin/platform-pulse"].includes(route)) await L.shot(page, `${tag}-route-${route.replace(/\W+/g, "_")}`)
    await page.close()
  }
  fs.writeFileSync(`${L.OUT}/${tag}-wall-routes.json`, JSON.stringify({ results, leaks }, null, 1))
  console.log("LEAKS (200 responses outside the never-lock list):", JSON.stringify(leaks, null, 1))
  await b.close()
})().catch((e) => { console.error("FAILED", e); process.exit(1) })
