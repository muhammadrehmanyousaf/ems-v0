/** Give vendor 5 (owner of venues 5, 7-14) a short trial, and let customer 7 hold a confirmed booking at venue 7 that the lock must not touch. */
const L = require("./lib.cjs")
const K = L.K
;(async () => {
  const days = Number(process.argv[2] || 3)
  const g = await L.adminApi("POST", "/subscriptions/admin/billing/5/grant-trial", { days, tier: "premium", reason: "PL-E customer scenario: a short trial that will end" })
  console.log("grant trial", g.status, g.body && g.body.message, JSON.stringify(g.body && g.body.data && g.body.data.access && { state: g.body.data.access.state, ends: g.body.data.access.trialEndsAt }))
  const slots = await K.q('select id,label,"startTime"::text st from "BusinessSlotTemplates" where "businessId"=7 and "isActive" order by id')
  console.log("venue 7 slots", JSON.stringify(slots))
  const slot = slots[0]
  const date = K.addDays(K.pktToday(), 60)
  const body = { customerName: "Customer Seven", customerPhone: "03001234500", customerEmail: K.CREDS.customer.email, bookingDate: date, bookingTime: slot.st.slice(0, 5), guestCount: 120, vendors: [{ businessId: 7, slotTemplateId: Number(slot.id) }], isOfflineBooking: false }
  const r = await K.api("customer", "POST", "/bookings", body)
  const id = r.body?.data?.booking?.id
  console.log("customer booking", r.status, id, JSON.stringify(r.body).slice(0, 200))
  if (id) {
    const a = await K.api("vendor", "PATCH", `/bookings/${id}/approve`, {})
    console.log("vendor approve", a.status, JSON.stringify(a.body).slice(0, 160))
    const rc = await K.api("vendor", "POST", "/receipts", { bookingId: id, amount: 20000, method: "cash", receivedDate: K.pktToday(), notes: "advance" })
    console.log("advance", rc.status)
    const b = await K.api("customer", "GET", `/bookings/${id}`)
    console.log("customer sees it", b.status, JSON.stringify(b.body?.data).slice(0, 300))
  }
  process.exit(0)
})()
