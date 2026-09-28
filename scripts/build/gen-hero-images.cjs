/**
 * Pre-generate the homepage hero images, so they never touch /_next/image.
 *
 * WHY. The Vercel image-optimization quota is exhausted, and it fails in a way
 * that hides itself: a variant already in the optimizer's cache returns 200, any
 * variant that is not returns 402. Measured on production, same hero image:
 *
 *     /_next/image?...spotlight.jpg&w=1200&q=75   200   89,726 bytes
 *     ...&q=60                                    402
 *     ...&q=50                                    402
 *     ...&q=40                                    402
 *
 * So the homepage hero renders today only because ONE variant happens to be
 * cached, and it cannot be tuned at all — changing the quality by a single point
 * would 402 and break the largest paint on the busiest page on the site.
 *
 * These files are committed rather than built on demand: the encode takes
 * minutes at effort 9, and the inputs change about once a year. Re-run this
 * after replacing a hero photograph.
 *
 * Settings chosen by measurement, against the optimizer's own 88kb output:
 *     q52 effort 6            105kb   (worse than the optimizer)
 *     q45 effort 9             83kb
 *     q40 effort 9  4:2:0      61kb   <- chosen
 *     q35 effort 9  4:2:0      50kb
 *     q30 effort 9  4:2:0      41kb
 * q40 rather than q35: this is a backdrop behind a scrim and headline text, but
 * it is also the first thing anyone sees, and 11kb is not worth arguing about.
 *
 * Usage: npm install --no-save sharp && node scripts/build/gen-hero-images.cjs
 */
const fs = require("fs");
const path = require("path");
let sharp;
try { sharp = require("sharp"); } catch {
  console.error("sharp is not installed. Run: npm install --no-save sharp");
  process.exit(1);
}

const SOURCES = [
  "images/home/spotlight/spotlight.jpg",
  "images/home/hero/h2.jpg",
  "images/home/hero/h3.jpg",
  "images/home/hero/h4.jpg",
  "images/home/partners/venue.jpg",
  "images/home/hero/h6.jpg",
  "images/home/hero/h7.jpg",
];
const WIDTHS = [828, 1200, 1920];
const OUT = "public/images/home/hero-opt";

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let total = 0;
  for (const rel of SOURCES) {
    const src = path.join("public", rel);
    const base = path.basename(rel).replace(/\.jpg$/i, "");
    const line = [];
    for (const w of WIDTHS) {
      const dest = path.join(OUT, base + "-" + w + ".avif");
      await sharp(src)
        .resize({ width: w, withoutEnlargement: true })
        .avif({ quality: 40, effort: 9, chromaSubsampling: "4:2:0" })
        .toFile(dest);
      const n = fs.statSync(dest).size;
      total += n;
      line.push(w + ": " + Math.round(n / 1024) + "kB");
    }
    console.log("  " + base.padEnd(12) + line.join("  "));
  }
  console.log("\n  " + SOURCES.length * WIDTHS.length + " variants, " + Math.round(total / 1024) + "kB total");
})();
