process.env.WW_API = "http://localhost:5134/api/v1"
const K = require("C:/Projects/WW-PAYMENT-TEST/tools/kit.cjs")
;(async () => {
  const [email, bid] = [process.argv[2], Number(process.argv[3])]
  const who = { email, password: "Localtest#1234" }
  for (let i = 0; i < 3; i++) {
    const r = await K.api(who, "POST", "/leads", { name: `Seed Lead ${i}`, phone: "030055566" + (10 + i), eventType: "nikah", businessId: bid, source: "manual_phone", guestCount: 200 })
    console.log("lead", i, r.status, JSON.stringify(r.body).slice(0, 160))
  }
  for (let i = 0; i < 2; i++) {
    const r = await K.api(who, "POST", "/expenses", { businessId: bid, category: "labour", amount: 12000 + i * 1000, description: `Seed expense ${i}`, spentDate: K.pktToday() })
    console.log("expense", i, r.status, JSON.stringify(r.body).slice(0, 160))
  }
  process.exit(0)
})()
