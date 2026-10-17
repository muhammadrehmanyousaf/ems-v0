const L = require("./lib.cjs")
;(async () => {
  await L.restartBackend(200 * L.DAY, { BILLING_ENFORCE: "shadow" })
  for (const who of ["vendor", "other", { email: "ple.vendor.61855850@localhost.test", password: L.PW }]) {
    for (const p of ["/bookings?limit=5", "/leads", "/expenses", "/receipts", "/staff/members"]) {
      const r = await L.K.api(who, "GET", p)
      process.stdout.write(`${typeof who === "string" ? who : "V1"} ${p} ${r.status}  `)
    }
    console.log()
  }
  const s = await L.status("ple.vendor.61855850@localhost.test"); console.log("V1 shadow:", s.state, "enforced", s.enforced)
  process.exit(0)
})()
