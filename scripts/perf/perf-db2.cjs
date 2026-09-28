/**
 * Read-only introspection of the production database.
 *
 * NOTE ON WHAT THE TIMINGS MEAN: my own round-trip to Railway's public proxy is
 * ~350ms, so nothing here measures what the deployed app experiences — the app
 * reaches Postgres over Railway's private network. Row counts, index coverage
 * and EXPLAIN's own "actual time" are what transfer; my wall-clock does not.
 *
 * SELECT and EXPLAIN only. Nothing writes.
 */
require("C:/Projects/ems-v0-backend/node_modules/dotenv").config({ path: "C:/Projects/ems-v0-backend/.env" });
const { Client } = require("C:/Projects/ems-v0-backend/node_modules/pg");

const q = async (c, sql) => {
  const t0 = Date.now();
  try { const r = await c.query(sql); return { ms: Date.now() - t0, rows: r.rows }; }
  catch (e) { return { ms: Date.now() - t0, err: e.message.split("\n")[0] }; }
};

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const p0 = Date.now(); await c.query("SELECT 1");
  console.log(`(my own round-trip to the DB proxy: ${Date.now() - p0}ms — the deployed app does NOT pay this)\n`);

  const sizes = await q(c, `
    SELECT c.relname AS tbl, s.n_live_tup AS rows,
           pg_size_pretty(pg_total_relation_size(c.oid)) AS total,
           pg_size_pretty(pg_indexes_size(c.oid)) AS idx
    FROM pg_stat_user_tables s
    JOIN pg_class c ON c.oid = s.relid
    WHERE s.n_live_tup > 50
    ORDER BY pg_total_relation_size(c.oid) DESC LIMIT 16;`);
  console.log("=== biggest tables ===");
  if (sizes.err) console.log("  " + sizes.err);
  else for (const r of sizes.rows) console.log(`  ${String(r.tbl).padEnd(26)} ${String(r.rows).padStart(9)} rows   ${String(r.total).padStart(9)} total, ${r.idx} of it indexes`);

  const idx = await q(c, `SELECT tablename, indexdef FROM pg_indexes WHERE schemaname='public';`);
  console.log("\n=== index coverage on the columns the hot endpoints filter/join on ===");
  if (idx.err) console.log("  " + idx.err);
  else {
    const byTable = {};
    for (const r of idx.rows) { if (!byTable[r.tablename]) byTable[r.tablename] = []; byTable[r.tablename].push(r.indexdef); }
    const want = [
      ["Businesses", "status"], ["Businesses", "city"], ["Businesses", "userId"],
      ["Businesses", "minimumPrice"], ["Businesses", "maxCapacity"], ["Businesses", "subBusinessType"],
      ["Businesses", "createdAt"],
      ["Reviews", "businessId"], ["Packages", "businessId"], ["Menus", "businessId"],
      ["BookingDetails", "businessId"], ["BookingDetails", "bookingDate"], ["BookingDetails", "status"],
      ["Bookings", "userId"], ["Bookings", "status"], ["Bookings", "createdAt"],
      ["PaymentReceipts", "bookingId"], ["Leads", "businessId"], ["Leads", "status"],
      ["Favorites", "userId"], ["Notifications", "userId"], ["Users", "reviewProfile"],
    ];
    let missing = 0;
    for (const pair of want) {
      const t = pair[0], col = pair[1];
      const defs = byTable[t] || [];
      // does any index have this column as its FIRST key? (a trailing column
      // in a composite index does not serve a filter on its own)
      const re = new RegExp('\\(\\s*"?' + col + '"?\\s*[,)]', "i");
      const hit = defs.some(function (d) { return re.test(d); });
      if (!hit) missing++;
      console.log(`  ${(t + "." + col).padEnd(32)} ${hit ? "indexed" : "** NO INDEX **"}`);
    }
    console.log(`\n  ${idx.rows.length} indexes in the database; ${missing} of the ${want.length} hot columns unindexed`);
  }

  const pss = await q(c, `SELECT count(*)::int AS n FROM pg_extension WHERE extname='pg_stat_statements';`);
  console.log(`\npg_stat_statements: ${pss.err ? pss.err : (pss.rows[0].n ? "installed" : "NOT installed — the DB cannot tell us its own slowest queries")}`);

  console.log("\n=== EXPLAIN ANALYZE — the COUNT half of findAndCountAll, as the list endpoint issues it ===");
  const cnt = await q(c, `EXPLAIN (ANALYZE, BUFFERS)
    SELECT count(DISTINCT "Business"."id") FROM "Businesses" AS "Business"
    INNER JOIN "Users" AS "vendor" ON "Business"."userId" = "vendor"."id" AND "vendor"."reviewProfile" = true
    LEFT JOIN "Packages" AS "packages" ON "packages"."businessId" = "Business"."id"
    LEFT JOIN "Menus" AS "menus" ON "menus"."businessId" = "Business"."id";`);
  if (cnt.err) console.log("  " + cnt.err);
  else for (const r of cnt.rows) console.log("  " + r["QUERY PLAN"]);

  console.log("\n=== EXPLAIN ANALYZE — the two per-row review subqueries over 200 rows ===");
  const agg = await q(c, `EXPLAIN (ANALYZE, BUFFERS)
    SELECT "Business"."id",
      (SELECT COALESCE(AVG("Reviews"."rating"),0) FROM "Reviews" WHERE "Reviews"."businessId"="Business"."id") AS rating,
      (SELECT COUNT(*) FROM "Reviews" WHERE "Reviews"."businessId"="Business"."id") AS "reviewCount"
    FROM "Businesses" AS "Business" LIMIT 200;`);
  if (agg.err) console.log("  " + agg.err);
  else for (const r of agg.rows) console.log("  " + r["QUERY PLAN"]);

  console.log("\n=== how many rows does that join actually produce per 200 businesses? ===");
  const fan = await q(c, `
    SELECT (SELECT count(*) FROM "Businesses") AS businesses,
           (SELECT count(*) FROM "Packages") AS packages,
           (SELECT count(*) FROM "Menus") AS menus,
           (SELECT count(*) FROM "Reviews") AS reviews;`);
  if (fan.err) console.log("  " + fan.err);
  else {
    const r = fan.rows[0];
    console.log(`  Businesses ${r.businesses}   Packages ${r.packages}   Menus ${r.menus}   Reviews ${r.reviews}`);
  }
  const fan2 = await q(c, `
    WITH first200 AS (SELECT id FROM "Businesses" ORDER BY id LIMIT 200)
    SELECT count(*) AS joined_rows
    FROM first200 b
    LEFT JOIN "Packages" p ON p."businessId" = b.id
    LEFT JOIN "Menus" m ON m."businessId" = b.id;`);
  if (!fan2.err) console.log(`  200 businesses LEFT JOINed to packages AND menus => ${fan2.rows[0].joined_rows} rows for Node to de-duplicate`);

  await c.end();
})();
