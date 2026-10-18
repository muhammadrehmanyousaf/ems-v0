/**
 * Guard: WP40 / V6-5. Opening a venue page must not scroll the page.
 *
 * The venue page's section-tab pills used `scrollIntoView` in a ref callback to bring the active pill into view inside
 * their horizontally scrolling strip. scrollIntoView scrolls EVERY scrollable ancestor, so on load (active pill =
 * "Overview", tab bar below the fold because a notice banner or a short window pushed it down) the whole page jumped down
 * (138 px at 1536x864, 37 px at 390) and the notice title ended up under the fixed header.
 *
 * Pinned: the tab strip markup carries no scrollIntoView; the strip is moved only through its own scrollBy in an effect
 * on activeSection; the page itself is only scrolled by scrollToSection (a click).
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/wp40-nav-scroll-check.mts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(path.join(ROOT, "components/VendorDetails/VendorDetailsMobile.tsx"), "utf8").replace(/\r\n/g, "\n");
let failed = 0;
const check = (ok: boolean, what: string) => {
  if (!ok) { failed += 1; console.error("FAIL " + what); } else console.log("ok   " + what);
};

const a = src.indexOf("SCROLL-SPY NAVIGATION");
const b = src.indexOf("MAIN CONTENT", a);
check(a > 0 && b > a, "found the tab bar markup");
const nav = src.slice(a, b);
check(!/scrollIntoView/.test(nav), "the tab bar markup does not call scrollIntoView (it scrolls the page, not only the strip)");
check(/ref=\{scrollSpyPillsRef\}/.test(nav), "the pill strip has its own ref");

const eff = src.match(/useEffect\(\(\) => \{\n\s*const strip = scrollSpyPillsRef\.current;[\s\S]*?\}, \[activeSection\]\);/);
check(!!eff, "an effect on activeSection moves the strip");
check(!!eff && /strip\.scrollBy\(/.test(eff[0]) && !/window\.|scrollIntoView|scrollTo\(/.test(eff[0]), "that effect moves only the strip (scrollBy on it), never the window");
check(!!eff && /if \(delta !== 0\)/.test(eff[0]), "and only when the pill is actually clipped");

// the only window scroll in the nav code path is the click handler's
const scrollsOfPage = [...src.matchAll(/window\.scrollTo\(/g)].length;
check(scrollsOfPage >= 1 && /const scrollToSection = useCallback/.test(src), "the page is scrolled by scrollToSection (a click), which still exists");

if (failed) { console.error(`${failed} check(s) failed`); process.exit(1); }
console.log("wp40-nav-scroll-check: all ok");
