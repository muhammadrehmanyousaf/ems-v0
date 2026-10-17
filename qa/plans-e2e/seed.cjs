// Seed a registered vendor with records the Wall must protect (bookings, leads, expenses, receipts...). node seed.cjs <email> <businessId>
process.env.WW_API = "http://localhost:5134/api/v1"
process.env.WW_PG = "postgres://postgres:postgres@127.0.0.1:5434/ww_pay_34"
const K = require("C:/Projects/WW-PAYMENT-TEST/tools/kit.cjs")
;(async () => {
  const [email, bid] = [process.argv[2], Number(process.argv[3])]
  const who = { email, password: "Localtest#1234" }
  const slots = [{id:34,t:"10:00"},{id:35,t:"14:00"},{id:36,t:"18:00"}]
  console.log("slots", slots)
  const out = {}
  for (let i = 0; i < 2; i++) {
    const body = { customerName: `Seed Customer ${i}`, customerPhone: "030011122" + (10 + i), customerEmail: `seedc${i}@localhost.test`, bookingDate: K.addDays(K.pktToday(), 20 + i * 5), bookingTime: slots[i % 3].t, guestCount: 150 + i * 10, vendors: [{ businessId: bid, slotTemplateId: Number(slots[i % slots.length].id) }], isOfflineBooking: true, agreedPrice: 400000 + i * 50000 }
    const r = await K.api(who, "POST", "/bookings", body)
    console.log("booking", i, r.status, JSON.stringify(r.body).slice(0, 250))
    out["b" + i] = r.body && r.body.data && r.body.data.booking && r.body.data.booking.id
  }
  for (let i = 0; i < 3; i++) {
    const r = await K.api(who, "POST", "/leads", { name: `Seed Lead ${i}`, phone: "030055566" + (10 + i), eventType: "nikah", businessId: bid, source: "walk_in", guestCount: 200 })
    console.log("lead", i, r.status, JSON.stringify(r.body).slice(0, 200))
  }
  for (let i = 0; i < 2; i++) {
    const r = await K.api(who, "POST", "/expenses", { businessId: bid, category: "labour", amount: 12000 + i * 1000, description: `Seed expense ${i}`, date: K.pktToday() })
    console.log("expense", i, r.status, JSON.stringify(r.body).slice(0, 200))
  }
  console.log(out); process.exit(0)
})()
