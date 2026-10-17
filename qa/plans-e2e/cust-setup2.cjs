/** customer 7 books the (open) venue 15 of V1 and V1 approves, so the booking exists when V1 locks later */
const L = require("./lib.cjs")
const K = L.K
;(async () => {
  const slots = await K.q('select id,"startTime"::text st from "BusinessSlotTemplates" where "businessId"=15 and "isActive" order by id')
  const body = { customerName: "Customer Seven", customerPhone: "03001234500", customerEmail: K.CREDS.customer.email, bookingDate: K.addDays(K.pktToday(), 90), bookingTime: slots[0].st.slice(0, 5), guestCount: 100, vendors: [{ businessId: 15, slotTemplateId: Number(slots[0].id) }], isOfflineBooking: false }
  const r = await K.api("customer", "POST", "/bookings", body)
  const id = r.body?.data?.booking?.id
  console.log("customer booking at venue 15", r.status, id, (r.body && r.body.message || "").slice(0, 120))
  if (id) {
    const a = await L.vApi("ple.vendor.61855850@localhost.test", "PATCH", `/bookings/${id}/approve`, {})
    console.log("V1 approves", a.status)
  }
  process.exit(0)
})()
