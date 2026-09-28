/**
 * What happens when more than one person uses it at once.
 *
 * Deliberately LIGHT: one burst of 10, then one of 25, against the endpoint the
 * public pages hammer. Ten simultaneous requests is what ten people loading the
 * homepage looks like — normal traffic, not an attack. No sustained load.
 *
 * The single-request numbers were fine (~300ms, mostly my own round-trip). The
 * question is whether a single Node process serialising 761 KB of JSON and
 * brotli-compressing it can do that 35 times per page view for N users.
 */
const fs = require("fs");
const SP = "C:/Users/ADMIN/AppData/Local/Temp/claude/c--Projects/a0226b59-ee03-4f7c-93a5-dfb54c68d8c2/scratchpad/";
const API = "https://ems-v0-backend-production.up.railway.app/api/v1";

const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };

async function burst(n, path, label) {
  const t0 = Date.now();
  const rs = await Promise.all(
    Array.from({ length: n }, async () => {
      const s = Date.now();
      try {
        const r = await fetch(API + path, { headers: { "Accept-Encoding": "br, gzip" } });
        const b = await r.arrayBuffer();
        return { ms: Date.now() - s, status: r.status, bytes: b.byteLength };
      } catch (e) { return { ms: Date.now() - s, status: 0, bytes: 0, err: String(e.message).slice(0, 40) }; }
    })
  );
  const wall = Date.now() - t0;
  const times = rs.map((r) => r.ms);
  const bad = rs.filter((r) => r.status !== 200);
  console.log(
    `  ${label.padEnd(30)} n=${String(n).padStart(3)}  wall ${String(wall).padStart(6)}ms   ` +
    `p50 ${String(pct(times, 0.5)).padStart(6)}ms   p95 ${String(pct(times, 0.95)).padStart(6)}ms   ` +
    `max ${String(Math.max(...times)).padStart(6)}ms   non-200: ${bad.length}` +
    (bad.length && bad[0].err ? `  (${bad[0].err})` : "")
  );
  return { wall, times };
}

(async () => {
  console.log("Serial baseline first, so the burst numbers have something to mean:\n");
  await burst(1, "/businesses?page=1&limit=200", "1 request, catalog page");
  await burst(1, "/businesses?page=1&limit=20", "1 request, 20 rows");
  await burst(1, "/platform-stats", "1 request, platform-stats");

  console.log("\nNow concurrent — this is the part that matters:\n");
  await burst(10, "/businesses?page=1&limit=200", "10 at once, catalog page");
  await new Promise((r) => setTimeout(r, 3000));
  await burst(10, "/businesses?page=1&limit=20", "10 at once, 20 rows");
  await new Promise((r) => setTimeout(r, 3000));
  await burst(25, "/businesses?page=1&limit=200", "25 at once, catalog page");
  await new Promise((r) => setTimeout(r, 4000));

  console.log("\nAnd what ONE homepage view actually asks for, in one go:\n");
  const homepage = [];
  for (let p = 1; p <= 17; p++) homepage.push(`/businesses?page=${p}&limit=200`);
  for (const t of ["Wedding venue", "Photographer", "Catering", "Makeup artist", "Car rental", "Decor"])
    homepage.push(`/businesses/businesses-by-vendor?vendorType=${encodeURIComponent(t)}&page=1&limit=200`);
  const t0 = Date.now();
  const res = await Promise.all(homepage.map(async (path) => {
    const s = Date.now();
    try {
      const r = await fetch(API + path, { headers: { "Accept-Encoding": "br, gzip" } });
      const buf = Buffer.from(await r.arrayBuffer());
      // decompressed size is what the browser must JSON.parse
      return { ms: Date.now() - s, wire: buf.byteLength, status: r.status };
    } catch (e) { return { ms: Date.now() - s, wire: 0, status: 0 }; }
  }));
  const wall = Date.now() - t0;
  const times = res.map((r) => r.ms);
  const wire = res.reduce((a, r) => a + r.wire, 0);
  console.log(`  ${res.length} requests (17 catalog pages + 6 per-type), all at once:`);
  console.log(`    wall-clock for the set: ${wall}ms      p50 ${pct(times, 0.5)}ms   p95 ${pct(times, 0.95)}ms   max ${Math.max(...times)}ms`);
  console.log(`    compressed on the wire: ${(wire / 1048576).toFixed(2)} MB`);
  console.log(`    non-200: ${res.filter((r) => r.status !== 200).length}`);

  // and the uncompressed volume the browser has to parse
  const one = await fetch(API + "/businesses?page=1&limit=200", { headers: { "Accept-Encoding": "identity" } });
  const oneLen = Number(one.headers.get("content-length") || 0);
  console.log(`    ONE catalog page uncompressed: ${(oneLen / 1024).toFixed(0)} kb`);
  console.log(`    => the browser JSON.parses roughly ${((oneLen * 23) / 1048576).toFixed(1)} MB for a single homepage view`);
})();
