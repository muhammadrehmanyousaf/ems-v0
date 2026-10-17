/**
 * Guard: the customer and public product is the bridal gold, not violet (owner bug 8, WP27).
 *
 * ── The defect this pins ──────────────────────────────────────────────────
 *
 * app/globals.css declared `--primary: 263 84% 57%` (violet). Every default shadcn
 * Button ("Pay now", "Plan my wedding", "Send Message"), Badge, switch, checkbox,
 * slider, tab and focus ring on the customer and public pages read it, so they were
 * violet beside screens that use the bridal-* tokens. The owner asked "why blue in
 * the UI buttons".
 *
 * What this guard holds:
 *   1. the customer/public token set (app/globals.css :root and .dark) keeps
 *      --primary, --ring and the neutral steps out of the violet-blue hues, and
 *      --primary stays in the gold family (hue 15-45);
 *   2. the primary label and the hover step both clear WCAG AA (4.5:1) on the
 *      primary fill, in both modes (a label on plain bridal-gold #C9956A is 2.63:1;
 *      primary at 90% opacity under white was 4.18:1 — that is why --primary-hover
 *      exists);
 *   3. the Button's default variant is still driven by those tokens
 *      (bg-primary / hover:bg-primary-hover), and the hover step is declared only
 *      where <html> has no data-theme, so it cannot leak into the vendor console;
 *   4. (WP30) NO raw blue/sky/cyan/teal/indigo/violet/purple/fuchsia colour utility
 *      anywhere in customer or public code. The WP27 ratchet is closed to zero: trust
 *      tiers, category tiles, KPI cards and every status colour now come from the bridal
 *      palette and the semantic status set;
 *   5. coral TEXT on a light surface is bridal-coral-dark (AA), never plain bridal-coral
 *      (2.3:1); the one dark surface that keeps it is booking-ledger.tsx;
 *   6. the semantic status set (tailwind colors.status.{success,warning,danger,info,
 *      neutral} + components/ui/status-tones.ts) is complete, sits in the right brand hue
 *      family, and every tone clears AA (text on its soft fill and on white, solid >= 3:1
 *      under a white label);
 *   7. body ink: the customer/public --foreground is bridal-charcoal, not the near-black
 *      the WP27 neutrals left.
 *
 * The vendor console (app/(dashboard), components/dashboard, components/admin)
 * declares its own tokens in app/styles/dashboard-styles.css and
 * components/dashboard/layout/champagne-shell.tsx and is not scanned.
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/brand-colour-check.mts
 *   (add --print-baseline to list the current counts)
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

let failures = 0;
const fail = (msg: string) => { failures++; console.error("FAIL  " + msg); };
const pass = (msg: string) => console.log("ok    " + msg);

// ── 1 + 2: the token set ─────────────────────────────────────────────────────
const css = read("app/globals.css");

function block(selectorRe: RegExp, label: string): Record<string, string> {
  const m = selectorRe.exec(css);
  if (!m) { fail(`globals.css: no ${label} block`); return {}; }
  const out: Record<string, string> = {};
  for (const d of m[1].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) out[d[1]] = d[2].replace(/\/\*.*?\*\//g, "").trim();
  return out;
}

type HSL = [number, number, number];
function hsl(v: string | undefined): HSL | null {
  const m = v ? /^(-?[\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/.exec(v) : null;
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}
function rgb([h, s, l]: HSL): [number, number, number] {
  const S = s / 100, L = l / 100, k = (n: number) => (n + h / 30) % 12, a = S * Math.min(L, 1 - L);
  const f = (n: number) => L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
const lum = (c: [number, number, number]) => {
  const [r, g, b] = c.map((x) => { const v = x / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: HSL, b: HSL) => { const x = lum(rgb(a)), y = lum(rgb(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const violetBlue = (h: number) => h >= 195 && h <= 300;

const light = block(/@layer base\s*\{\s*:root\s*\{([^}]*)\}/, ":root");
const dark = block(/\n\s*\.dark\s*\{([^}]*)\}/, ".dark");
const hover = {
  light: hsl(/:root:not\(\[data-theme\]\)\s*\{\s*--primary-hover\s*:\s*([^;]+);/.exec(css)?.[1]?.trim()),
  dark: hsl(/\.dark:not\(\[data-theme\]\)\s*\{\s*--primary-hover\s*:\s*([^;]+);/.exec(css)?.[1]?.trim()),
};

for (const [mode, tokens, hov] of [["light", light, hover.light], ["dark", dark, hover.dark]] as const) {
  const primary = hsl(tokens["primary"]), fg = hsl(tokens["primary-foreground"]), ring = hsl(tokens["ring"]);
  if (!primary || !fg || !ring) { fail(`${mode}: --primary / --primary-foreground / --ring missing or not "H S% L%"`); continue; }
  if (violetBlue(primary[0]) || violetBlue(ring[0])) fail(`${mode}: --primary (${tokens["primary"]}) or --ring (${tokens["ring"]}) is violet/blue again`);
  else if (primary[0] < 15 || primary[0] > 45) fail(`${mode}: --primary hue ${primary[0]} is outside the bridal gold family (15-45)`);
  else pass(`${mode}: --primary ${tokens["primary"]} and --ring ${tokens["ring"]} are bridal gold`);
  for (const k of ["secondary", "muted", "accent", "border", "input", "secondary-foreground", "accent-foreground", "muted-foreground"]) {
    const v = hsl(tokens[k]);
    if (v && v[1] >= 8 && violetBlue(v[0]) && mode === "light") fail(`${mode}: --${k} (${tokens[k]}) is a violet-tinted neutral`);
  }
  const c = contrast(primary, fg);
  if (c < 4.5) fail(`${mode}: primary label contrast ${c.toFixed(2)}:1 < 4.5`); else pass(`${mode}: primary label ${c.toFixed(2)}:1`);
  if (!hov) fail(`${mode}: --primary-hover is not declared (:root:not([data-theme]) / .dark:not([data-theme]))`);
  else { const ch = contrast(hov, fg); if (ch < 4.5) fail(`${mode}: hover step contrast ${ch.toFixed(2)}:1 < 4.5`); else pass(`${mode}: hover step ${ch.toFixed(2)}:1`); }
}

// ── 3: the Button and the tailwind colour ────────────────────────────────────
const button = read("components/ui/button.tsx");
if (!/default:\s*"bg-primary text-primary-foreground hover:bg-primary-hover/.test(button)) fail('components/ui/button.tsx: the default variant must stay "bg-primary text-primary-foreground hover:bg-primary-hover"');
else pass("Button default variant is token-driven");
const tw = read("tailwind.config.ts");
if (!/hover:\s*'hsl\(var\(--primary-hover,\s*var\(--primary\)\s*\/\s*0\.9\)\)'/.test(tw)) fail("tailwind.config.ts: primary.hover must fall back to primary/90 so the vendor console keeps its hover");
else pass("primary.hover falls back to primary/90 (vendor console unchanged)");

// ── 4: raw violet utilities in customer/public code (ratchet) ────────────────
// WP30: the ratchet is closed. Nothing is allowed any more.
const BASELINE: Record<string, number> = {};
const SCAN_ROOTS = ["app/(main)", "app/(auth)", "app/staff", "app/floor", "app/pin", "app/globals.css", "components"];
const SKIP_DIRS = new Set(["node_modules", ".next", "dashboard", "admin"]);
const RAW = /(?:^|[\s"'`:])(?:[a-z0-9-]+:)*(?:bg|text|border|ring|from|to|via|fill|stroke|shadow|outline|divide|accent|decoration|placeholder|caret)-(?:blue|sky|cyan|teal|violet|purple|indigo|fuchsia)-\d{2,3}/g;

function walk(rel: string, out: string[]) {
  const abs = path.join(ROOT, rel);
  let st; try { st = statSync(abs); } catch { return; }
  if (st.isFile()) { if (/\.(tsx|ts|css)$/.test(rel)) out.push(rel); return; }
  for (const e of readdirSync(abs)) { if (!SKIP_DIRS.has(e)) walk(rel + "/" + e, out); }
}
const files: string[] = [];
for (const r of SCAN_ROOTS) walk(r, files);
const counts: Record<string, number> = {};
for (const f of files) { const n = (read(f).match(RAW) || []).length; if (n) counts[f] = n; }

if (process.argv.includes("--print-baseline")) { console.log(JSON.stringify(counts, null, 2)); process.exit(0); }

let ratchetOk = true;
for (const [f, n] of Object.entries(counts)) {
  const allowed = BASELINE[f] ?? 0;
  if (n > allowed) { ratchetOk = false; fail(`${f}: ${n} raw blue/violet-family utilities (allowed ${allowed}). Use the bridal-* tokens, the status-* set (components/ui/status-tones.ts), or bg-primary for a primary action`); }
}
for (const [f, n] of Object.entries(BASELINE)) { if ((counts[f] ?? 0) < n) console.log(`note  ${f}: down to ${counts[f] ?? 0} from ${n}; lower BASELINE`); }
if (ratchetOk) pass(`no raw blue/violet-family utilities in customer/public code (0 allowed, ${files.length} files scanned)`);

// ── 5: destructive / cancel TEXT in coral (F5-2, WP28) ───────────────────────
// bridal-coral #E8917A is 2.3:1 on a near-white card: fine for a border or a tint, not for a label.
// Destructive text uses bridal-coral-dark: same hue, lower lightness, AA on every surface it sits on.
{
  const hexRgb = (h: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
  const hue = (h: string) => { const [r, g, b] = hexRgb(h).map((x) => x / 255); const mx = Math.max(r, g, b), d = mx - Math.min(r, g, b); return ((mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60 + 360) % 360; };
  const L = (c: [number, number, number]) => lum(c);
  const cr = (a: [number, number, number], b: [number, number, number]) => (Math.max(L(a), L(b)) + 0.05) / (Math.min(L(a), L(b)) + 0.05);
  const coral = /\bcoral:\s*'(#[0-9A-Fa-f]{6})'/.exec(tw)?.[1];
  const dark = /'coral-dark':\s*'(#[0-9A-Fa-f]{6})'/.exec(tw)?.[1];
  if (!coral || !dark) fail("tailwind.config.ts: bridal coral / 'coral-dark' not found");
  else {
    const d = hexRgb(dark), c = hexRgb(coral);
    const tint = c.map((x) => Math.round(x * 0.1 + 255 * 0.9)) as [number, number, number]; // 10% coral hover tint on white
    const surfaces: Array<[string, [number, number, number]]> = [["white", [255, 255, 255]], ["cream #FFF9F4", hexRgb("#FFF9F4")], ["ivory #FDF8F2", hexRgb("#FDF8F2")], ["10% coral hover tint", tint]];
    let ok = Math.abs(hue(dark) - hue(coral)) <= 6;
    if (!ok) fail(`coral-dark ${dark} hue ${hue(dark).toFixed(1)} drifted from coral ${coral} hue ${hue(coral).toFixed(1)}`);
    for (const [n, s] of surfaces) { const r = cr(d, s); if (r < 4.5) { ok = false; fail(`coral-dark ${dark} on ${n}: ${r.toFixed(2)}:1 < 4.5`); } }
    if (ok) pass(`coral-dark ${dark}: same hue as coral, AA (${surfaces.map(([n, s]) => cr(d, s).toFixed(2)).join(" / ")}) on white / cream / ivory / hover tint`);
  }
  for (const f of ["app/(main)/user/bookings/page.tsx", "app/(main)/user/bookings/[id]/page.tsx"]) {
    const src = read(f);
    const bad = src.split(/\r?\n/).filter((l) => /\btext-bridal-coral\b(?!-)/.test(l) && /hover:bg-bridal-coral\/10/.test(l));
    if (bad.length) fail(`${f}: a Cancel button label still uses text-bridal-coral (2.3:1); use text-bridal-coral-dark`);
    else pass(`${f}: Cancel labels use text-bridal-coral-dark`);
  }
}

// ── 5b: plain coral TEXT in customer/public code (WP30) ───────────────────────
{
  const ALLOW = new Set(["components/booking/shell/booking-ledger.tsx"]); // dark ledger: coral on charcoal is fine
  const bad: string[] = [];
  for (const f of files) {
    if (ALLOW.has(f)) continue;
    read(f).split(/\r?\n/).forEach((l, n) => {
      if (/(?<![\w-])(?:[a-z-]+:)*text-bridal-coral(?![\w-])/.test(l) && !/fill-bridal-coral/.test(l)) bad.push(`${f}:${n + 1}`);
    });
  }
  if (bad.length) fail(`plain text-bridal-coral (2.3:1 on light) in: ${bad.slice(0, 8).join(", ")}${bad.length > 8 ? ` (+${bad.length - 8} more)` : ""}; use text-bridal-coral-dark`);
  else pass("no plain text-bridal-coral on light surfaces (coral-dark carries coral text)");
}

// ── 6: the semantic status set (WP30) ─────────────────────────────────────────
{
  const hexRgb = (h: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
  const hueOf = (h: string) => { const [r, g, b] = hexRgb(h).map((x) => x / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return -1; return ((mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60 + 360) % 360; };
  const satOf = (h: string) => { const [r, g, b] = hexRgb(h).map((x) => x / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; return d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1)); };
  const cr = (a: string, b: string) => { const x = lum(hexRgb(a)), y = lum(hexRgb(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const statusAt = tw.indexOf("status: {");
  const block = statusAt < 0 ? "" : tw.slice(statusAt, statusAt + 1500);
  const FAMILY: Record<string, [number, number]> = { success: [85, 160], warning: [20, 55], danger: [0, 25], info: [300, 345], neutral: [10, 45] };
  const TONES = Object.keys(FAMILY);
  let ok = true;
  if (statusAt < 0) { ok = false; fail("tailwind.config.ts: colors.status (the semantic status set) is missing"); }
  for (const tone of TONES) {
    const m = new RegExp(tone + "\\s*:\\s*\\{([^}]*)\\}").exec(block);
    const get = (k: string) => new RegExp("\\b" + k + "\\s*:\\s*'(#[0-9A-Fa-f]{6})'").exec(m?.[1] ?? "")?.[1];
    const t = { DEFAULT: get("DEFAULT"), soft: get("soft"), line: get("line"), solid: get("solid") };
    if (!m || !t.DEFAULT || !t.soft || !t.line || !t.solid) { ok = false; fail(`tailwind.config.ts colors.status.${tone}: needs DEFAULT, soft, line and solid hex values`); continue; }
    const [lo, hi] = FAMILY[tone];
    const h = hueOf(t.DEFAULT);
    if (h < lo || h > hi) { ok = false; fail(`status.${tone} ${t.DEFAULT} hue ${h.toFixed(0)} is outside its brand family (${lo}-${hi}); no blue or violet`); }
    if (tone === "neutral" && satOf(t.DEFAULT) > 0.5) { ok = false; fail(`status.neutral ${t.DEFAULT} must be a warm brown-grey (saturation <= 50%)`); }
    const onSoft = cr(t.DEFAULT, t.soft), onWhite = cr(t.DEFAULT, "#FFFFFF"), white = cr("#FFFFFF", t.solid);
    if (onSoft < 4.5) { ok = false; fail(`status.${tone}: text ${t.DEFAULT} on soft ${t.soft} is ${onSoft.toFixed(2)}:1 < 4.5`); }
    if (onWhite < 4.5) { ok = false; fail(`status.${tone}: text ${t.DEFAULT} on white is ${onWhite.toFixed(2)}:1 < 4.5`); }
    if (white < 3) { ok = false; fail(`status.${tone}: white on solid ${t.solid} is ${white.toFixed(2)}:1 < 3 (graphic minimum)`); }
  }
  const tones = read("components/ui/status-tones.ts");
  for (const map of ["STATUS_CHIP", "STATUS_TEXT", "STATUS_ICON", "STATUS_SOLID", "STATUS_SOFT_BG"]) {
    const m = new RegExp("export const " + map + "[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};").exec(tones);
    const missing = TONES.filter((t) => !new RegExp("\\b" + t + "\\s*:").test(m?.[1] ?? ""));
    if (!m || missing.length) { ok = false; fail(`components/ui/status-tones.ts ${map}: missing tone(s) ${missing.join(", ") || "(map not found)"}`); }
  }
  if (/(?:blue|violet|purple|indigo|sky)-\d/.test(tones)) { ok = false; fail("components/ui/status-tones.ts: raw blue/violet utility"); }
  if (ok) pass(`semantic status set: ${TONES.join("/")} complete, brand hue families, text >= 4.5:1 on soft and white, solid >= 3:1 under white`);
}

// ── 7: body ink is bridal-charcoal (WP30) ─────────────────────────────────────
{
  const m = /:root:not\(\[data-theme\]\)\s*\{([^}]*--foreground[^}]*)\}/.exec(css)?.[1] ?? "";
  const fgv = hsl(/--foreground\s*:\s*([^;]+);/.exec(m)?.[1]?.trim());
  if (!fgv) fail("globals.css: :root:not([data-theme]) must declare --foreground (body ink = bridal-charcoal) for customer/public pages");
  else if (fgv[0] < 12 || fgv[0] > 22 || fgv[1] < 35 || fgv[2] < 9 || fgv[2] > 14) fail(`globals.css: customer/public --foreground ${fgv.join(" ")} is not bridal-charcoal #2C1810 (about 17 47% 12%)`);
  else pass(`customer/public --foreground ${fgv[0]} ${fgv[1]}% ${fgv[2]}% is bridal-charcoal`);
}

if (failures) { console.error(`\nbrand-colour-check: ${failures} failure(s)`); process.exit(1); }
console.log("\nbrand-colour-check: all passed");
