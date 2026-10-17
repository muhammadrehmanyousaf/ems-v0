process.env.WW_API = "http://localhost:5134/api/v1"
const K = require("C:/Projects/WW-PAYMENT-TEST/tools/kit.cjs")
;(async () => {
  const who = { email: process.argv[2], password: "Localtest#1234" }
  for (const id of process.argv.slice(3).map(Number)) {
    const r = await K.api(who, "POST", "/receipts", { bookingId: id, amount: 10000, method: "cash", receivedDate: K.pktToday(), notes: "seed advance" })
    console.log("receipt", id, r.status, JSON.stringify(r.body).slice(0, 220))
    const b = await K.api(who, "GET", "/bookings/" + id)
    console.log(" booking status", b.body && b.body.data && JSON.stringify(b.body.data).match(/"status":"[^"]+"/g)?.slice(0,3))
  }
  process.exit(0)
})()
