/**
 * A customer meets a locked venue (vendor 5's venues 7 and 8) on the REAL backend.   node cust.cjs <tag> <existingBookingId>
 *  A. guest: public venue page notice + disabled CTAs, search excludes it
 *  B. the 409 doors by API (inquiry, quote, booking)
 *  C. customer UI: the page of the EXISTING booking at the locked venue, pay controls
 */
const L = require("./lib.cjs")
const K = L.K
;(async () => {
  const [tag, bookingId = "0"] = process.argv.slice(2)
  const out = {}
  // B. API doors
  const body409 = (r) => `${r.status} ${r.body && r.body.data && r.body.data.code || ""} ${(r.body && r.body.message || "").slice(0, 90)}`
  const inq = await K.api(null, "POST", "/leads/inquiry", { businessId: 8, contactName: "Guest", contactPhone: "03001234599", message: "hello" })
  console.log("POST /leads/inquiry (guest, venue 8):", body409(inq))
  const q = await K.api("customer", "POST", "/quotes", { businessId: 8, eventType: "nikah", eventDate: K.addDays(K.pktToday(), 40), guestCount: 100 })
  console.log("POST /quotes (customer, venue 8):", body409(q))
  const slots = await K.q('select id,"startTime"::text st from "BusinessSlotTemplates" where "businessId"=8 and "isActive" order by id')
  const bk = await K.api("customer", "POST", "/bookings", { customerName: "C7", customerPhone: "03001234500", customerEmail: K.CREDS.customer.email, bookingDate: K.addDays(K.pktToday(), 60), bookingTime: slots[0].st.slice(0, 5), guestCount: 100, vendors: [{ businessId: 8, slotTemplateId: Number(slots[0].id) }], isOfflineBooking: false })
  console.log("POST /bookings (customer, venue 8):", body409(bk))
  const hold = await K.api("customer", "POST", "/bookings/hold", { businessId: 8 })
  console.log("POST /bookings/hold:", body409(hold))
  const pub = await K.api(null, "GET", "/businesses/8")
  console.log("GET /businesses/8 (public):", pub.status, JSON.stringify(pub.body && pub.body.data && pub.body.data.availabilityNotice))
  const list = await K.api(null, "GET", "/businesses?limit=500")
  const ids = (list.body && list.body.data && (list.body.data.businesses || list.body.data.results || list.body.data) || [])
  const idArr = Array.isArray(ids) ? ids.map((x) => x.id) : []
  console.log("search lists venue 7/8?", idArr.includes(7), idArr.includes(8), "(of", idArr.length, "venues)")
  // existing booking by API
  if (Number(bookingId)) {
    const g = await K.api("customer", "GET", `/bookings/${bookingId}`)
    console.log("customer GET /bookings/" + bookingId + ":", g.status)
    const ps = await K.api("customer", "GET", `/payments/booking-status/${bookingId}`)
    console.log("customer booking-status:", ps.status, JSON.stringify(ps.body && ps.body.data && { total: ps.body.data.totalAmount, paid: ps.body.data.paidAmount, remaining: ps.body.data.remainingAmount }))
    const pi = await K.api("customer", "GET", `/payment-instructions/booking/${bookingId}`)
    console.log("payment-instructions:", pi.status)
  }
  // A + C UI
  const b = await L.launch()
  const g = await b.newContext({ viewport: { width: 1536, height: 864 }, locale: "en-GB", timezoneId: "Asia/Karachi" })
  for (const id of [8, 7]) {
    for (const [w, h, n] of [[1536, 864, "d1536"], [390, 844, "m390"]]) {
      const ctx = n === "d1536" ? g : await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true })
      const page = await ctx.newPage()
      const errors = []
      page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)))
      const resp = await page.goto(`${L.BASE}/wedding-venues/lahore/x-${id}`, { waitUntil: "domcontentloaded", timeout: 180000 })
      const ess = page.getByRole("button", { name: /essential only/i }).first(); if (await ess.count()) await ess.click().catch(() => {})
      await page.waitForSelector("h1", { timeout: 120000 }).catch(() => {})
      await page.waitForTimeout(2500)
      const info = await page.evaluate(() => ({ notice: document.querySelectorAll("[data-testid=venue-unavailable-notice]").length, disabled: document.querySelectorAll("[data-testid=venue-cta-disabled]").length, robots: document.querySelector("meta[name=robots]")?.getAttribute("content") || null, h1: document.querySelector("h1")?.textContent?.slice(0, 60), hscroll: document.documentElement.scrollWidth > innerWidth + 1 }))
      await L.shot(page, `${tag}-venue${id}-${n}`)
      console.log(`venue ${id} ${n}: http ${resp && resp.status()}`, JSON.stringify(info), "errors:", errors.length ? errors.join("|") : "NONE")
      await page.close()
      if (n !== "d1536") await ctx.close()
    }
  }
  // the inquiry dialog on a locked venue by hand
  const page = await g.newPage()
  await page.goto(`${L.BASE}/wedding-venues/lahore/x-8`, { waitUntil: "domcontentloaded", timeout: 180000 })
  await page.waitForSelector("h1", { timeout: 120000 }).catch(() => {})
  await page.waitForTimeout(2000)
  const cta = await page.evaluate(() => Array.from(document.querySelectorAll("button, a")).filter((e) => /ask a question|request a quote|book now|check availability|send inquiry/i.test(e.textContent || "")).map((e) => ({ t: (e.textContent || "").trim().slice(0, 40), disabled: e.disabled || e.getAttribute("aria-disabled") === "true" || e.hasAttribute("data-testid") })))
  console.log("venue 8 primary controls:", JSON.stringify(cta))
  await page.close()
  // customer UI: the existing booking
  if (Number(bookingId)) {
    const cctx = await L.uiLogin(b, K.CREDS.customer.email, { width: 1536, height: 864 }, K.CREDS.customer.password)
    const cp = await cctx.newPage()
    const calls = []
    cp.on("response", (r) => { const u = r.url(); if (u.includes(":5134/api/v1/")) calls.push(`${r.status()} ${r.request().method()} ${u.replace(/^.*\/api\/v1/, "").split("?")[0]}`) })
    await cp.goto(`${L.BASE}/user/bookings`, { waitUntil: "domcontentloaded", timeout: 180000 })
    await cp.waitForTimeout(6000)
    await L.shot(cp, `${tag}-cust-bookings`)
    await cp.goto(`${L.BASE}/user/bookings/${bookingId}`, { waitUntil: "domcontentloaded", timeout: 180000 })
    await cp.waitForTimeout(7000)
    await L.shot(cp, `${tag}-cust-booking-detail`)
    console.log("customer booking page API:", calls.join(" | "))
    console.log("bad statuses:", calls.filter((c) => /^(4|5)/.test(c)).join(" | ") || "none")
  }
  await b.close()
  process.exit(0)
})().catch((e) => { console.error("FAILED", e); process.exit(1) })
