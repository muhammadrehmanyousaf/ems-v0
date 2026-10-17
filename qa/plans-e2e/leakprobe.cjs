const L = require("./lib.cjs")
;(async () => {
  const email = process.argv[2]
  for (const p of ["/payments/booking-status/3", "/vendors/10", "/notifications", "/notifications?limit=5", "/ai/status", "/users/profile/me", "/bookings/3", "/payments/booking-status/4"]) {
    const r = await L.vApi(email, "GET", p)
    console.log(p.padEnd(34), r.status, (r.text || "").slice(0, 330).replace(/\s+/g, " "))
  }
  process.exit(0)
})()
