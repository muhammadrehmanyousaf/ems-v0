process.env.WW_API = "http://localhost:5134/api/v1"
process.env.WW_PG = "postgres://postgres:postgres@127.0.0.1:5434/ww_pay_34"
const K = require("C:/Projects/WW-PAYMENT-TEST/tools/kit.cjs")
;(async () => {
  const who = process.argv[2]
  const role = who.includes("@") ? { email: who, password: "Localtest#1234" } : who
  const s = await K.api(role, "GET", "/subscriptions/status")
  console.log(JSON.stringify(s.body.data.accessState, null, 1))
})()
