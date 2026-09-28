/**
 * Every page in the product, classified — the map before the journey.
 *
 * Produces the worklist that the performance sweep will walk. Classification
 * matters because the surfaces have different economics:
 *   - public/SEO pages are anonymous, identical for every visitor, and Google
 *     grades them. They can be static/ISR and edge-cached.
 *   - customer pages are per-user and mostly behind login.
 *   - the vendor console is where one user spends hours a day; a slow screen
 *     there costs the business its own staff time.
 *   - admin/staff are low-traffic; correctness over speed.
 *
 * Also records what each page needs to be reachable: a dynamic segment needs a
 * real id, so the sweep cannot just visit "/vendor/[id]".
 */
const fs = require("fs");
const path = require("path");
const ROOT = "C:/Projects/ems-v0";
const norm = (p) => p.split(path.sep).join("/");

const pages = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/^page\.(tsx?|jsx?)$/.test(e.name)) {
      let r = norm(path.relative(path.join(ROOT, "app"), path.dirname(p)));
      const groups = r.split("/").filter((s) => /^\(.*\)$/.test(s));
      r = "/" + r.split("/").filter((s) => !/^\(.*\)$/.test(s)).join("/");
      if (r === "//") r = "/";
      const src = fs.readFileSync(p, "utf8");
      pages.push({
        route: r === "/" ? "/" : r.replace(/\/$/, ""),
        file: norm(path.relative(ROOT, p)),
        group: groups.join("") || "(root)",
        dynamic: /\[/.test(r),
        client: /^\s*["']use client["']/m.test(src),
        revalidate: (src.match(/export\s+const\s+revalidate\s*=\s*(\d+)/) || [])[1] || null,
        staticParams: /generateStaticParams/.test(src),
        forceDynamic: /export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/.test(src),
        lines: src.split("\n").length,
      });
    }
  }
})(path.join(ROOT, "app"));

const classify = (r) => {
  if (r.startsWith("/dashboard")) return "vendor-console";
  if (r.startsWith("/admin")) return "admin";
  if (r.startsWith("/staff")) return "staff";
  if (r.startsWith("/user") || r.startsWith("/booking") || r.startsWith("/favorites") || r.startsWith("/wedding")) return "customer";
  if (r.startsWith("/login") || r.startsWith("/register") || r.startsWith("/business-registration") || r.startsWith("/forgot") || r.startsWith("/reset") || r.startsWith("/verify")) return "auth";
  return "public";
};

for (const p of pages) p.surface = classify(p.route);

const bySurface = {};
for (const p of pages) (bySurface[p.surface] ||= []).push(p);

console.log(`${pages.length} pages in the app\n`);
console.log("surface            pages   client-rendered   ISR/static   dynamic-segment");
console.log("-".repeat(78));
for (const [s, list] of Object.entries(bySurface).sort((a, b) => b[1].length - a[1].length)) {
  console.log(
    `${s.padEnd(18)} ${String(list.length).padStart(5)}   ${String(list.filter((p) => p.client).length).padStart(15)}   ${String(list.filter((p) => p.revalidate || p.staticParams).length).padStart(10)}   ${String(list.filter((p) => p.dynamic).length).padStart(15)}`
  );
}

// the ones that cannot be visited without a real id
console.log(`\ndynamic routes needing a real id to sweep: ${pages.filter((p) => p.dynamic).length}`);
for (const p of pages.filter((p) => p.dynamic).slice(0, 12)) console.log(`   ${p.route}`);

// public pages that are fully client-rendered are the SEO risk
const seoRisk = pages.filter((p) => p.surface === "public" && p.client && !p.revalidate);
console.log(`\npublic pages that are "use client" with no ISR (SEO + LCP risk): ${seoRisk.length}`);
for (const p of seoRisk) console.log(`   ${p.route.padEnd(46)} ${p.lines} lines`);

fs.writeFileSync(
  "C:/Users/ADMIN/AppData/Local/Temp/claude/c--Projects/a0226b59-ee03-4f7c-93a5-dfb54c68d8c2/scratchpad/routes.json",
  JSON.stringify(pages, null, 1)
);
console.log("\nwritten: scratchpad/routes.json");
