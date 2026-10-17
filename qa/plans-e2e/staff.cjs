process.env.WW_API = "http://localhost:5134/api/v1"
const K = require("C:/Projects/WW-PAYMENT-TEST/tools/kit.cjs")
;(async () => {
  const who = { email: process.argv[2], password: "Localtest#1234" }; const bid = Number(process.argv[3])
  const m = await K.api(who, "POST", "/staff/members", { businessId: bid, fullName: "Ple Staff", role: "waiter", phone: "03001234777", dihariRate: 3000 })
  console.log("member", m.status, JSON.stringify(m.body).slice(0, 300))
  const id = m.body?.data?.member?.id || m.body?.data?.id
  if (id) {
    const l = await K.api(who, "POST", `/staff/members/${id}/login`, { email: "ple.staff@localhost.test", password: "Localtest#1234" })
    console.log("login", l.status, JSON.stringify(l.body).slice(0, 300))
  }
  process.exit(0)
})()
