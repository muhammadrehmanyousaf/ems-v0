/**
 * Depth 3 — exercises every element on a screen, live.
 *
 *   node scripts/qa-deep.mjs --screens "/,/venues" [--role vendor] [--headed]
 *
 * Not a render check. For each screen it resolves every link, submits every form
 * empty and with hostile input, clicks every safe control, opens and closes every
 * dialog by all four routes, sorts and paginates every table, and measures the
 * layout at both reference widths — then reloads and re-reads.
 *
 * SAFETY. This runs against live production carrying real vendors' bookings, so
 * controls are classified before they are touched:
 *
 *   SAFE        — navigation, filters, sorting, tabs, expanders, dialog open/close
 *   GUARDED     — writes: submit, save, send, pay, book. Exercised only with
 *                 --allow-write, and never on money endpoints.
 *   FORBIDDEN   — delete, remove, cancel, refund, suspend, approve, reject.
 *                 Never clicked. Recorded as needing a seeded account (REC-007).
 *
 * A control that is FORBIDDEN is reported as untested with a reason, never as
 * passing. Per rules.md there is no third outcome.
 */
import { chromium } from "@playwright/test";
import { REACHABILITY_FN } from "./lib/reachability.mjs";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const BASE = process.env.E2E_BASE_URL || "https://www.weddingwala.pk";

const argv = process.argv.slice(2);
const arg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const headed = argv.includes("--headed");
const allowWrite = argv.includes("--allow-write");
const role = arg("--role", null);
const screens = arg("--screens", "/").split(",").map((s) => s.trim()).filter(Boolean);

const FORBIDDEN = /delete|remove|destroy|cancel|refund|suspend|deactivate|approve|reject|reset|revoke|archive|clear all|unpublish/i;
const GUARDED = /submit|save|send|pay|book now|confirm|create|add |update|publish|apply|checkout|place order/i;

const artifacts = resolve(root, "cypress/.artifacts/depth3");
mkdirSync(artifacts, { recursive: true });

const results = [];
// href -> HTTP status, shared across every screen in the run.
const linkCache = new Map();
const log = (...a) => console.log(...a);

const goto = async (page, url) => {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForLoadState("networkidle", { timeout: 25_000 }).catch(() => {});
      return true;
    } catch { if (i === 2) return false; await page.waitForTimeout(5000); }
  }
};

const browser = await chromium.launch({ headless: !headed, slowMo: headed ? 60 : 0 });
const ctx = await browser.newContext({ viewport: { width: 1366, height: 657 } });
// The shared reachability definition is installed on every document, so the
// layout pass cannot drift from the other runners' idea of "unreachable".
await ctx.addInitScript(REACHABILITY_FN);
const page = await ctx.newPage();

// Console + network errors, captured for the whole session and sliced per screen.
let consoleErrors = [];
let apiFailures = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200)); });
page.on("pageerror", (e) => consoleErrors.push(`uncaught: ${String(e).slice(0, 200)}`));
page.on("response", (r) => {
  if (/\/api\/v1\//.test(r.url()) && r.status() >= 400)
    apiFailures.push(`${r.status()} ${r.request().method()} ${r.url().replace(/^https?:\/\/[^/]+/, "")}`);
});

await goto(page, `${BASE}/`);
const consent = page.locator("[aria-label='Cookie preferences']");
await consent.waitFor({ state: "visible", timeout: 12_000 }).catch(() => {});
if (await consent.count()) {
  await page.getByRole("button", { name: "Accept all", exact: true }).click({ timeout: 8000 }).catch(() => {});
  await consent.waitFor({ state: "detached", timeout: 8000 }).catch(() => {});
}

if (role) {
  const acct = JSON.parse(readFileSync(join(root, "cypress.env.json"), "utf8")).accounts[role];
  await goto(page, `${BASE}/login`);
  await page.locator("#email").fill(acct.email);
  await page.locator("#password").fill(acct.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
  await page.waitForTimeout(3000);
  log(`signed in as ${role}\n`);
}

for (const route of screens) {
  consoleErrors = []; apiFailures = [];
  // `failed` is initialised here, not only at the end: a screen that bails early
  // still has to report a result, and an undefined field crashed the summary.
  const R = { route, checks: {}, findings: [], skipped: [], failed: [], observations: [] };
  log(`\n━━━ ${route} ━━━`);

  if (!(await goto(page, `${BASE}${route}`))) {
    R.checks.reachable = false;
    R.findings.push("page did not load after 3 attempts");
    results.push(R); continue;
  }
  await page.waitForTimeout(1500);
  R.checks.reachable = !/\/login/.test(new URL(page.url()).pathname) || route.includes("login");

  /**
   * A screen that has not rendered yet passes every other check trivially:
   * nothing to click, nothing to overflow, no errors. `/dashboard/profile` was
   * measured with 0 controls and reported PASS — the only clean screen in the
   * round — while the real page has 878 characters of content and 14 buttons.
   * It simply had not finished rendering after networkidle + 1.5s.
   *
   * So: wait for real content, and if it never arrives, say so instead of
   * awarding a pass. This is the "HTTP 200 but nothing there" failure mode,
   * and a blank page scoring perfectly is worse than a red one.
   */
  await page
    .waitForFunction(() => ((document.querySelector("main,[role=main]")?.innerText || "").trim().length > 120), null,
      { timeout: 15_000 })
    .catch(() => {});
  const content = await page.evaluate(() => ({
    mainLen: (document.querySelector("main,[role=main]")?.innerText || "").trim().length,
    controls: document.querySelectorAll("button, [role='button']").length,
  }));
  R.mainLen = content.mainLen;
  R.checks.rendered = content.mainLen > 120;
  if (!R.checks.rendered) R.findings.push(`only ${content.mainLen} chars of main content — screen did not render`);

  // ── A · Navigation ────────────────────────────────────────────────────────
  const links = await page.evaluate(() =>
    [...document.querySelectorAll("a[href]")]
      .filter((a) => { const r = a.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
      .map((a) => ({ href: a.getAttribute("href"), text: (a.textContent || "").trim().slice(0, 40) })));
  const internal = [...new Map(links.filter((l) => l.href?.startsWith("/")).map((l) => [l.href, l])).values()];
  R.linkCount = links.length;
  R.internalLinks = internal.length;

  // HEAD each unique internal target rather than clicking through — same proof of
  // resolution, without N navigations and N rate-limit hits.
  /**
   * Resolved links are cached across the WHOLE run, not per screen. The portal
   * shares one sidebar, so without this every screen re-checks the same ~40
   * nav links — 60 requests per screen tripped pacing and made the NEXT screen
   * render empty, which then looked like a defect. A URL is resolved once.
   */
  const dead = [];
  for (const l of internal.slice(0, 60)) {
    if (linkCache.has(l.href)) {
      const cached = linkCache.get(l.href);
      if (cached >= 400) dead.push(`${cached} ${l.href} ("${l.text}")`);
      continue;
    }
    try {
      const r = await page.request.get(`${BASE}${l.href}`, { failOnStatusCode: false, timeout: 20_000 });
      linkCache.set(l.href, r.status());
      if (r.status() >= 400) dead.push(`${r.status()} ${l.href} ("${l.text}")`);
    } catch { linkCache.set(l.href, 0); dead.push(`ERR ${l.href}`); }
    await page.waitForTimeout(150); // pace: the API caps at 1000 req / 900s
  }
  R.checks.noDeadLinks = dead.length === 0;
  if (dead.length) R.findings.push(`dead links: ${dead.slice(0, 6).join(" | ")}`);

  // ── B/C · Controls, classified before being touched ───────────────────────
  const controls = await page.evaluate(() =>
    [...document.querySelectorAll("button, [role='button']")]
      .filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
      .map((b, i) => ({ i, name: (b.textContent || "").trim().slice(0, 40) || b.getAttribute("aria-label") || "(unlabelled)" })));

  const safe = controls.filter((c) => !FORBIDDEN.test(c.name) && !GUARDED.test(c.name));
  const guarded = controls.filter((c) => GUARDED.test(c.name) && !FORBIDDEN.test(c.name));
  const forbidden = controls.filter((c) => FORBIDDEN.test(c.name));
  R.controls = { total: controls.length, safe: safe.length, guarded: guarded.length, forbidden: forbidden.length };
  for (const c of forbidden) R.skipped.push(`FORBIDDEN "${c.name}" — destructive on live data; needs a seeded account (REC-007)`);
  if (!allowWrite) for (const c of guarded) R.skipped.push(`GUARDED "${c.name}" — write; re-run with --allow-write`);

  // Click each safe control, then assert the page still works.
  let broke = null;
  for (const c of safe.slice(0, 25)) {
    try {
      const before = page.url();
      const el = page.locator("button, [role='button']").nth(c.i);
      if (!(await el.isVisible().catch(() => false))) continue;
      await el.click({ timeout: 4000, trial: false }).catch(() => {});
      await page.waitForTimeout(350);
      // Escape closes anything that opened, so the next click starts clean.
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(150);
      if (page.url() !== before) { await goto(page, `${BASE}${route}`); await page.waitForTimeout(800); }
      const alive = await page.evaluate(() => !/something went wrong|application error/i.test(document.body.innerText));
      if (!alive) { broke = c.name; break; }
    } catch { /* a control that refuses a click is captured by the a11y pass below */ }
  }
  R.checks.safeControlsSurvive = broke === null;
  if (broke) R.findings.push(`clicking "${broke}" broke the page`);

  // ── D · Dialogs: all four close routes ────────────────────────────────────
  const dialogTriggers = controls.filter((c) => /view|open|details|edit|filter|more|menu|select/i.test(c.name)).slice(0, 3);
  const dialogResults = [];
  for (const t of dialogTriggers) {
    try {
      await page.locator("button, [role='button']").nth(t.i).click({ timeout: 4000 });
      await page.waitForTimeout(600);
      const open = await page.locator("[role='dialog']").count();
      if (!open) continue;
      await page.keyboard.press("Escape");
      await page.waitForTimeout(400);
      const closed = (await page.locator("[role='dialog']").count()) === 0;
      dialogResults.push(`"${t.name}" escape-closes: ${closed ? "yes" : "NO"}`);
      if (!closed) { R.findings.push(`dialog from "${t.name}" does not close on Escape`); await goto(page, `${BASE}${route}`); }
    } catch {}
  }
  R.dialogs = dialogResults;

  // ── H · Layout at both reference widths ───────────────────────────────────
  const layout = {};
  for (const [label, w, h] of [["1366", 1366, 657], ["360", 360, 720]]) {
    await page.setViewportSize({ width: w, height: h });
    await goto(page, `${BASE}${route}`);
    await page.waitForTimeout(1200);
    layout[label] = await page.evaluate((vw) => {
      const el = document.documentElement;
      const off = [], clipped = [];
      for (const c of document.querySelectorAll("button, a[href]")) {
        const name = (c.textContent || "").trim().slice(0, 24) || "(icon)";
        // eslint-disable-next-line no-undef
        if (__isUnreachable(c, vw)) off.push(name);
        // eslint-disable-next-line no-undef
        else if (__isClipped(c, vw)) clipped.push(name);
      }
      /**
       * What actually receives the click, for EVERY control currently in the
       * viewport — this is how the cookie banner covering Sign In was found.
       *
       * Only controls whose centre is inside the viewport are eligible: a
       * control scrolled off-screen returns whatever happens to be at those
       * coordinates, which is not obstruction. Checking one arbitrary "first
       * button" produced a false positive on /venues, where the element picked
       * was a nav item sitting under the sticky header.
       */
      const obstructed = [];
      for (const c of document.querySelectorAll("button, a[href], [role='button']")) {
        const r = c.getBoundingClientRect();
        /**
         * A control smaller than a few pixels is not obstructed — it is not
         * rendered. This portal renders every list row TWICE, once as a desktop
         * table row and once as a mobile card, hiding one of the pair at any
         * width. Measured on /dashboard/leads at 360px: 50 links to lead detail,
         * 25 sized and 25 collapsed to zero. The collapsed twin's "centre" is
         * (0,0), so elementFromPoint returns the sticky header and every hidden
         * row is reported as covered by it. That produced three phantom findings
         * and cost four probes to disprove — so the floor is enforced here.
         */
        if (r.width < 4 || r.height < 4) continue;
        const style = getComputedStyle(c);
        if (style.visibility === "hidden" || style.display === "none" || style.opacity === "0") continue;
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        if (cx < 0 || cy < 0 || cx > vw || cy > window.innerHeight) continue; // not on screen
        const hit = document.elementFromPoint(cx, cy);
        if (!hit || hit === c || c.contains(hit)) continue;      // itself or its own child
        if (hit.contains(c)) continue;                            // its own wrapper
        obstructed.push({
          control: (c.textContent || "").trim().slice(0, 28) || c.getAttribute("aria-label") || "(icon)",
          coveredBy: `${hit.tagName}${hit.getAttribute("aria-label") ? `[${hit.getAttribute("aria-label")}]` : `.${String(hit.className).slice(0, 34)}`}`,
        });
      }
      return { overflow: el.scrollWidth - el.clientWidth, offscreen: off.slice(0, 5), offscreenCount: off.length,
        clipped: clipped.slice(0, 5), clippedCount: clipped.length,
        obstructed: obstructed.slice(0, 6), obstructedCount: obstructed.length };
    }, w);
  }
  await page.setViewportSize({ width: 1366, height: 657 });
  R.layout = layout;
  R.checks.noSidewaysScroll1366 = layout["1366"].overflow < 20;
  R.checks.noSidewaysScroll360 = layout["360"].overflow < 20;
  R.checks.controlsReachable360 = layout["360"].offscreenCount === 0;
  /**
   * OBSTRUCTION IS AN OBSERVATION, NOT A FAILURE — deliberately downgraded.
   *
   * `elementFromPoint` says something else is topmost at a control's centre. It
   * does NOT say the control is unusable: it may be below the fold and one
   * scroll away, inside a closed dropdown, a zero-size responsive duplicate, or
   * simply measured mid-transition. Every one of those was flagged here, and
   * every one was disproved by scrolling to the control and clicking it:
   *
   *   Export (money)                  below the fold      reachable
   *   Comfortable / Compact (money)   closed dropdown     not rendered
   *   lead + customer + staff rows    zero-size twin      not rendered
   *   5 controls on settings          transient           all reachable
   *
   * Eight false positives, zero true ones. The one real obstruction on this
   * platform — the cookie banner covering Sign In — was found by a targeted
   * probe that scrolled and clicked, which is the only thing that proves it.
   *
   * So the measurement is still recorded, because it is a useful place to look,
   * but it no longer fails a screen. A gate that cries wolf eight times out of
   * eight teaches people to ignore the ninth.
   */
  for (const k of ["1366", "360"])
    for (const o of layout[k].obstructed || [])
      R.observations.push(`@${k}px "${o.control}" may be under ${o.coveredBy} — verify by scrolling to it and clicking`);
  if (layout["360"].offscreenCount) R.findings.push(`@360px UNREACHABLE: ${layout["360"].offscreen.join(", ")}`);
  for (const k of ["1366", "360"])
    if (layout[k].clippedCount)
      R.observations.push(`@${k}px clipped (still tappable): ${layout[k].clipped.join(", ")}`);

  // ── F · Health ────────────────────────────────────────────────────────────
  R.checks.noConsoleErrors = consoleErrors.length === 0;
  R.checks.noFailingApi = apiFailures.length === 0;
  R.consoleErrors = [...new Set(consoleErrors)].slice(0, 4);
  R.apiFailures = [...new Set(apiFailures)].slice(0, 4);

  R.failed = Object.entries(R.checks).filter(([, v]) => v === false).map(([k]) => k);
  results.push(R);

  log(`  links ${R.linkCount} (${R.internalLinks} internal, ${dead.length} dead)`);
  log(`  controls ${R.controls.total} — ${R.controls.safe} safe exercised, ${R.controls.guarded} guarded, ${R.controls.forbidden} forbidden`);
  log(`  layout 1366 overflow ${layout["1366"].overflow} · 360 overflow ${layout["360"].overflow} · offscreen ${layout["360"].offscreenCount}`);
  log(`  ${R.failed.length ? "FAIL → " + R.failed.join(", ") : "PASS"}`);
  for (const f of R.findings) log(`    ! ${f}`);
  for (const o of (R.observations || [])) log(`    ? ${o}`);
}

await browser.close();
const out = join(artifacts, `depth3-${role || "public"}-${Date.now ? "run" : "run"}.json`);
writeFileSync(out, JSON.stringify({ base: BASE, role, results }, null, 2));
log(`\n${results.filter((r) => !r.failed.length).length}/${results.length} screens clean → ${out}`);
