process.env.WW_API = "http://localhost:5134/api/v1"
const K = require("C:/Projects/WW-PAYMENT-TEST/tools/kit.cjs")
;(async () => {
  const who = { email: process.argv[2], password: "Localtest#1234" }; const bid = Number(process.argv[3])
  const slots = [{id:34,t:"10:00"},{id:35,t:"14:00"},{id:36,t:"18:00"}]
  for (const [i, d] of [[0, 40], [1, 44], [2, 52]]) {
    const r = await K.api(who, "POST", "/bookings", { customerName: `Later Customer ${d}`, customerPhone: "030011133" + (10 + i), customerEmail: `laterc${d}@localhost.test`, bookingDate: K.addDays(K.pktToday(), d), bookingTime: slots[i].t, guestCount: 180, vendors: [{ businessId: bid, slotTemplateId: slots[i].id }], isOfflineBooking: true })
    const id = r.body?.data?.booking?.id
    console.log("booking", d, r.status, id)
    if (id) { const p = await K.api(who, "POST", "/receipts", { bookingId: id, amount: 10000, method: "cash", receivedDate: K.pktToday() }); console.log(" receipt", p.status) }
  }
  process.exit(0)
})()
