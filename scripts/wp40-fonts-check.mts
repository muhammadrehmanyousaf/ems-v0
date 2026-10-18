/**
 * Guard: WP40 / V6-4. The site's fonts are self-hosted (lib/fonts/local-fonts.ts, next/font/local); `next build` must never
 * need fonts.googleapis.com (it failed at random when Google answered with extension-less font URLs), and the font CSS must
 * reach EVERY route.
 *
 * Pinned:
 *   1. nothing under app/, components/, lib/, context/ imports next/font/google or names a Google Fonts host;
 *   2. exactly ONE module imports lib/fonts/local-fonts: app/layout.tsx. Next 14.2 sorts the CSS of nested layouts by
 *      splitting entry paths on "/"; on Windows (backslashes) the order is then insertion order, and a font module shared
 *      by the root layout and (main)/layout gave its @font-face rules to (main)/layout only, so /register, /login ... had
 *      NO Inter / Playfair / DM Sans (found by the headed screenshot comparison, not by a build error);
 *   3. every woff2 the font file lists exists, with the licence notice beside them.
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/wp40-fonts-check.mts
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
let failed = 0;
const check = (ok: boolean, what: string) => {
  if (!ok) { failed += 1; console.error("FAIL " + what); } else console.log("ok   " + what);
};

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name.startsWith(".")) continue;
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|mts|css)$/.test(name)) out.push(p);
  }
  return out;
}
const rel = (p: string) => path.relative(ROOT, p).replaceAll(path.sep, "/");
const files = ["app", "components", "lib", "context"].filter((d) => existsSync(path.join(ROOT, d))).flatMap((d) => walk(path.join(ROOT, d)));

const google = files.filter((f) => /from\s+["']next\/font\/google["']|https?:\/\/fonts\.(googleapis|gstatic)\.com/.test(readFileSync(f, "utf8")));
check(google.length === 0, `no source file uses next/font/google or a Google Fonts host (${google.map(rel).join(", ") || "none"})`);

const importers = files.filter((f) => rel(f) !== "lib/fonts/local-fonts.ts" && /from\s+["']@\/lib\/fonts\/local-fonts["']|from\s+["'][./]+\/lib\/fonts\/local-fonts["']|import\s+["']@\/lib\/fonts\/local-fonts["']/.test(readFileSync(f, "utf8")));
check(importers.length === 1 && rel(importers[0]) === "app/layout.tsx", `only app/layout.tsx imports lib/fonts/local-fonts (found: ${importers.map(rel).join(", ") || "none"})`);

const lf = readFileSync(path.join(ROOT, "lib/fonts/local-fonts.ts"), "utf8");
const refs = [...lf.matchAll(/\.\/files\/([a-z0-9.-]+\.woff2)/g)].map((m) => m[1]);
check(refs.length > 0, `local-fonts.ts lists ${new Set(refs).size} font files`);
for (const f of new Set(refs)) check(existsSync(path.join(ROOT, "lib/fonts/files", f)), `lib/fonts/files/${f} exists`);
check(existsSync(path.join(ROOT, "lib/fonts/LICENSES.txt")), "the font licence notice is kept beside the files");
for (const v of ["--font-inter", "--font-playfair", "--font-dm-sans", "--font-nastaliq"]) check(lf.includes(`"${v}"`), `${v} is still set`);

if (failed) { console.error(`${failed} check(s) failed`); process.exit(1); }
console.log("wp40-fonts-check: all ok");
