process.env.WW_API = "http://localhost:5134/api/v1"
process.env.WW_PG = "postgres://postgres:postgres@127.0.0.1:5434/ww_pay_34"
const K = require("C:/Projects/WW-PAYMENT-TEST/tools/kit.cjs")
;(async () => {
  for (const r of ["vendor", "other", "admin", "customer"]) {
    const s = await K.api(r, "GET", "/subscriptions/status")
    const d = s.body && s.body.data
    console.log(r, s.status, JSON.stringify(d && (d.accessState || d.access)).slice(0, 300))
  }
  const o = await K.api("vendor", "GET", "/billing/obligations")
  console.log("obligations", o.status, JSON.stringify(o.body).slice(0, 300))
  const b = await K.api("vendor", "GET", "/bookings?limit=3")
  console.log("bookings", b.status, JSON.stringify(b.body).slice(0, 200))
})()
