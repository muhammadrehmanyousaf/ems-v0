/**
 * A tiny lab proxy in front of the lab backend (default :5132) for the parts of the plans programme the backend does not
 * have yet (PL-A / PL-B are built in parallel): it adds `availabilityNotice` to a venue payload and answers 409
 * VENUE_UNAVAILABLE on the customer's new-enquiry doors, switched by POST /__ctl. SSR fetches (the public venue page) go
 * through it too, which page.route() cannot reach.
 *
 *   node qa/plans-wall/proxy.cjs [listenPort=5190] [upstreamPort=5132]
 *   curl -X POST localhost:5190/__ctl -d '{"notice":true,"gone409":true}'
 */
const http = require("http")
const LISTEN = Number(process.argv[2] || 5190)
const UP = Number(process.argv[3] || 5132)
// Venues 8 and 12 are the "paused" ones, always (the public pages cache a venue for an hour, so a switch would be hidden by the cache).
const ctl = { notice: false, gone409: false, pausedIds: [8, 12] }

const server = http.createServer((req, res) => {
  const cors = () => {
    const o = req.headers.origin
    if (o) { res.setHeader("access-control-allow-origin", o); res.setHeader("access-control-allow-credentials", "true"); res.setHeader("vary", "Origin") }
  }
  if (req.url === "/__ctl") {
    let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { try { Object.assign(ctl, JSON.parse(b || "{}")) } catch {} ; res.setHeader("content-type", "application/json"); res.end(JSON.stringify(ctl)) })
    return
  }
  const url = req.url || ""
  const isCustomerDoor = req.method === "POST" && /^\/api\/v1\/(leads\/inquiry|quotes)(\/|\?|$)/.test(url)
  if (ctl.gone409 && isCustomerDoor) {
    cors()
    res.statusCode = 409
    res.setHeader("content-type", "application/json")
    return res.end(JSON.stringify({ status: false, message: "This venue is not taking new enquiries right now.", data: { code: "VENUE_UNAVAILABLE" } }))
  }
  const headers = { ...req.headers, host: `localhost:${UP}`, "accept-encoding": "identity" }
  const up = http.request({ host: "127.0.0.1", port: UP, path: url, method: req.method, headers }, (ur) => {
    const m = req.method === "GET" && /^\/api\/v1\/businesses\/(\d+)(\?.*)?$/.exec(url)
    const isVenue = !!m && (ctl.notice || ctl.pausedIds.includes(Number(m[1])))
    if (!isVenue) { res.writeHead(ur.statusCode || 502, ur.headers); return ur.pipe(res) }
    let body = ""; ur.setEncoding("utf8"); ur.on("data", (c) => (body += c)); ur.on("end", () => {
      try {
        const j = JSON.parse(body)
        if (j && j.data) j.data.availabilityNotice = { code: "NOT_TAKING_ENQUIRIES", text: "This venue isn't taking new enquiries right now. Already booked? Your booking is unaffected." }
        const out = JSON.stringify(j)
        const h = { ...ur.headers, "content-length": Buffer.byteLength(out) }
        delete h["content-encoding"]
        res.writeHead(ur.statusCode || 200, h); res.end(out)
      } catch { res.writeHead(ur.statusCode || 502, ur.headers); res.end(body) }
    })
  })
  up.on("error", () => { res.statusCode = 502; res.end("proxy: upstream down") })
  req.pipe(up)
})
server.listen(LISTEN, "127.0.0.1", () => console.log(`proxy :${LISTEN} -> :${UP}`))
