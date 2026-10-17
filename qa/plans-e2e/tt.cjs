/** node tt.cjs <days> [extra...] : restart the lab backend with the clock shifted by <days> (float ok). */
const L = require("./lib.cjs")
;(async () => {
  const d = Number(process.argv[2])
  await L.restartBackend(Math.round(d * L.DAY))
  console.log("backend clock offset", d, "days; now =", (await L.K.api("admin", "GET", "/subscriptions/status")).status)
  process.exit(0)
})()
