/**
 * Endpoint timing, production backend. Three runs each, median reported, with a
 * trivial endpoint measured first to separate my own round-trip to Railway from
 * the server's own work. Sizes are the compressed bytes on the wire and the
 * decompressed JSON, because a 3 MB payload is slow even on a fast server.
 */
const fs = require("fs");
const SP = "C:/Users/ADMIN/AppData/Local/Temp/claude/c--Projects/a0226b59-ee03-4f7c-93a5-dfb54c68d8c2/scratchpad/";
const tok = fs.readFileSync(SP + "vendor.token", "utf8").trim();
const API = "https://ems-v0-backend-production.up.railway.app/api/v1";
const BIZ = 3377;

const EP = [
  ["health/baseline", "/health", false],
  ["businesses p1 limit=200", "/businesses?page=1&limit=200", false],
  ["businesses p1 limit=20", "/businesses?page=1&limit=20", false],
  ["businesses p9 limit=200", "/businesses?page=9&limit=200", false],
  ["businesses-by-vendor Photographer", "/businesses/businesses-by-vendor?vendorType=Photographer&page=1&limit=200", false],
  ["one business (public leaf)", `/businesses/${BIZ}`, false],
  ["vendor bookings list", "/bookings?limit=50", true],
  ["dashboard KPIs this_year", "/analytics/dashboard-kpis?period=this_year", true],
  ["revenue breakdowns this_year", "/analytics/revenue-breakdowns?period=this_year", true],
  ["leads list", "/leads?limit=100", true],
  ["expenses list", "/vendor-expenses", true],
  ["notifications", "/notifications?limit=20", true],
  ["calendar availability bulk", `/slots/availability-bulk?businessId=${BIZ}&from=2026-10-01&to=2026-12-31`, true],
];

const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const kb = (n) => (n / 1024).toFixed(0) + "kb";

(async () => {
  console.log("endpoint                                 median   runs(ms)          wire     json    rows");
  console.log("-".repeat(104));
  for (const [name, path, auth] of EP) {
    const times = [];
    let wire = 0, json = 0, rows = "";
    let status = 0;
    for (let i = 0; i < 3; i++) {
      const t0 = Date.now();
      try {
        const r = await fetch(API + path, { headers: auth ? { Authorization: "Bearer " + tok } : {} });
        const buf = Buffer.from(await r.arrayBuffer());
        times.push(Date.now() - t0);
        status = r.status;
        wire = Number(r.headers.get("content-length") || buf.length);
        json = buf.length;
        if (i === 0) {
          try {
            const b = JSON.parse(buf.toString("utf8"));
            const d = b?.data;
            const arr = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : Array.isArray(d?.bookings) ? d.bookings : Array.isArray(d?.leads) ? d.leads : null;
            rows = arr ? String(arr.length) : "-";
          } catch { rows = "-" }
        }
      } catch (e) { times.push(-1); }
    }
    const m = med(times);
    const flag = m > 2000 ? " **" : m > 800 ? " *" : "";
    console.log(
      `${name.padEnd(40)} ${String(m).padStart(6)}   ${times.join("/").padEnd(16)} ${kb(wire).padStart(7)} ${kb(json).padStart(7)} ${String(rows).padStart(6)}  ${status}${flag}`
    );
  }
  console.log("\n* over 800ms   ** over 2s");
})();
