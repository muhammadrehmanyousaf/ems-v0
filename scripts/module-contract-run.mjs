/**
 * Executes the shared module contract against the live deployment.
 *
 * Why this exists alongside the Cypress suite: Cypress cannot execute in the
 * environment this was authored in (its binary resolves to Node, not Electron),
 * and a suite that has never been run is not a suite. Playwright does run here,
 * so the same contract is executed through it and the results are real.
 *
 * This is a READ-ONLY sweep. It navigates and measures. It never submits a
 * form, never clicks a destructive control, never writes a row.
 *
 *   node scripts/module-contract-run.mjs [--role superadmin] [--pass desktop|mobile]
 *
 * The checks mirror cypress/support/module-suite.ts one-for-one, so a green run
 * here and a green run there mean the same thing.
 */
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const BASE = process.env.E2E_BASE_URL || "https://www.weddingwala.pk";

const argv = process.argv.slice(2);
const arg = (flag, fallback) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : fallback;
};
const role = arg("--role", "superadmin");
const pass = arg("--pass", "desktop");
const only = arg("--only", null);
const VIEWPORT =
  pass === "mobile" ? { width: 360, height: 720 } : { width: 1366, height: 657 };

const modules = JSON.parse(readFileSync(resolve(root, "cypress/fixtures/modules.json"), "utf8"));
const list = (Array.isArray(modules) ? modules : modules.modules).filter((m) =>
  only ? m.route.includes(only) : true,
);

const accounts = JSON.parse(readFileSync(resolve(root, "cypress.env.json"), "utf8")).accounts;
const acct = accounts[role];
if (!acct) throw new Error(`No "${role}" in cypress.env.json`);

const BROKEN =
  /something went wrong|application error|client-side exception|unhandled|this page could not be found|internal server error/i;

const artifacts = resolve(root, "cypress/.artifacts");
mkdirSync(artifacts, { recursive: true });

// `--headed` opens a real window so the run can be watched rather than trusted.
// Slower, and worth it: a screen you can see is how you catch the things an
// assertion was never written for.
const headed = argv.includes("--headed");
const browser = await chromium.launch({
  headless: !headed,
  slowMo: headed ? 120 : 0,
});
const ctx = await browser.newContext({ viewport: VIEWPORT });
const page = await ctx.newPage();

// ── Sign in once. Every module reuses this context. ───────────────────────────
await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 90_000 });
/**
 * The consent dialog mounts AFTER first paint, so a `count()` check that runs
 * immediately sees nothing, skips, and then the banner appears on top of the
 * submit button. Wait for it deliberately, dismiss it, and wait for it to
 * detach before touching the form. (It overlaps Sign In at 1366x657 — see
 * qa/CONSENT-OVERLAPS-SIGNIN.md; that is a product defect, not a harness one.)
 */
const consentDialog = page.locator("[aria-label='Cookie preferences']");
await consentDialog.waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});
if (await consentDialog.count()) {
  await page.getByRole("button", { name: "Accept all", exact: true }).click({ timeout: 10_000 }).catch(() => {});
  await consentDialog.waitFor({ state: "detached", timeout: 10_000 }).catch(() => {});
}
await page.locator("#email").waitFor({ timeout: 30_000 });
await page.locator("#email").fill(acct.email);
await page.locator("#password").fill(acct.password);
await page.getByRole("button", { name: "Sign In", exact: true }).click({ timeout: 20_000 });
await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
await page.waitForTimeout(3000);

const token = await page.evaluate(() => localStorage.getItem("auth_token"));
if (!token) throw new Error("Signed in but no auth_token was written.");
console.log(`signed in as ${role} · pass=${pass} · ${VIEWPORT.width}x${VIEWPORT.height}\n`);

const rows = [];

for (const [i, mod] of list.entries()) {
  const consoleErrors = [];
  const apiFailures = [];

  const onConsole = (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 300));
  };
  const onPageError = (err) => consoleErrors.push(`uncaught: ${String(err).slice(0, 300)}`);
  const onResponse = (res) => {
    const u = res.url();
    if (/\/api\/v1\//.test(u) && res.status() >= 400) {
      apiFailures.push(`${res.status()} ${res.request().method()} ${u.replace(/^https?:\/\/[^/]+/, "")}`);
    }
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("response", onResponse);

  const row = { route: mod.route, name: mod.name, checks: {}, vw: VIEWPORT.width, vh: VIEWPORT.height };

  try {
    await page.goto(`${BASE}${mod.route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    // The dashboard shell is client-rendered; measuring before it settles turns
    // this into a flake generator rather than a test.
    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
    await page.waitForTimeout(1800);

    const landed = new URL(page.url()).pathname;
    row.landedOn = landed;

    const probe = await page.evaluate(
      ({ broken, vw }) => {
        const re = new RegExp(broken, "i");
        const bodyText = document.body.innerText || "";
        const main = document.querySelector("main, [role='main']");
        const mainText = (main?.innerText || "").trim();

        // Horizontal overflow. A small tolerance is correct: the dashboard
        // reserves a scrollbar gutter on purpose. Anything real is far larger.
        const el = document.documentElement;
        const overflow = el.scrollWidth - el.clientWidth;

        // Controls pushed off the viewport. A control you cannot reach is
        // broken regardless of how well it renders.
        //
        // But a control inside a horizontally scrollable container is NOT
        // unreachable — it is one scroll away, which is the whole point of a
        // wide data table. Measured on /dashboard/business: all 100 flagged
        // "Open menu" buttons sat inside the table's scroll viewport. Counting
        // those as defects would have reported 124 phantom bugs across three
        // modules. Only controls with no scrollable ancestor are real.
        const inScroller = (el) => {
          let n = el.parentElement;
          while (n && n !== document.body) {
            const s = getComputedStyle(n);
            if ((s.overflowX === "auto" || s.overflowX === "scroll") && n.scrollWidth > n.clientWidth + 4) return true;
            n = n.parentElement;
          }
          return false;
        };
        const offscreen = [];
        for (const c of document.querySelectorAll("button, a[href]")) {
          const r = c.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const style = getComputedStyle(c);
          if (style.visibility === "hidden" || style.display === "none") continue;
          if ((r.left < -4 || r.right > vw + 4) && !inScroller(c)) {
            offscreen.push((c.textContent || "").trim().slice(0, 28) || "(icon)");
          }
        }

        // Accessible name on every visible control.
        const unnamed = [];
        for (const c of document.querySelectorAll("button, a[href], [role='button']")) {
          const r = c.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const name =
            (c.textContent || "").trim() ||
            c.getAttribute("aria-label") ||
            c.getAttribute("title") ||
            c.querySelector("img[alt]")?.getAttribute("alt") ||
            "";
          if (!name) unnamed.push(c.className?.toString().slice(0, 40) || c.tagName);
        }

        const h1s = [...document.querySelectorAll("h1")].map((h) => h.innerText.trim());
        const hasTable = !!document.querySelector("table, [role='table'], [role='grid']");
        const headerless = [...document.querySelectorAll("table thead th")].filter(
          (th) => !th.innerText.trim() && !th.querySelector("[aria-label]"),
        ).length;
        const tabs = [...document.querySelectorAll("[role='tab']")];
        const tabsWithoutState = tabs.filter(
          (t) => !["true", "false"].includes(t.getAttribute("aria-selected") || ""),
        ).length;

        return {
          errorText: (bodyText.match(re) || [])[0] || null,
          mainLen: mainText.length,
          mainTextSample: mainText.replace(/\s+/g, " ").slice(0, 400),
          overflow,
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          offscreen: offscreen.slice(0, 6),
          offscreenCount: offscreen.length,
          unnamedCount: unnamed.length,
          unnamed: unnamed.slice(0, 4),
          h1Count: h1s.length,
          h1Blank: h1s.length > 0 && h1s[0] === "",
          hasTable,
          explainsEmpty: /no |nothing |yet\b|get started|add your first|empty/i.test(bodyText),
          headerlessColumns: headerless,
          tabCount: tabs.length,
          tabsWithoutState,
        };
      },
      { broken: BROKEN.source, vw: VIEWPORT.width },
    );

    const e = mod.expects || {};
    const c = row.checks;

    /**
     * An admin route viewed by a non-admin renders "Admin only — You don't
     * have permission to view this page." That is the gate working, and the
     * only thing worth asserting there. Running the full chrome contract
     * against it reported 8 phantom failures for "no table" on pages that are
     * correctly refusing to show one — and made a working gate look like a
     * hole. Verified against the live API too: /admin/platform-pulse and
     * /users both return 403 to a vendor token.
     */
    const gated = /admin only|don't have permission|do not have permission|not authoris|not authoriz|access denied/i.test(
      probe.mainTextSample || "",
    );
    row.gated = gated;

    c.reachable = !/\/login|\/register/.test(landed);
    if (gated) {
      row.note = "admin gate held (expected for this role)";
      row.failed = [];
      rows.push(row);
      console.log(`${String(i + 1).padStart(2)}/${list.length} GATE ${mod.route}`);
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
      page.off("response", onResponse);
      await page.waitForTimeout(700);
      continue;
    }
    c.noErrorBoundary = probe.errorText === null;
    c.hasRealContent = probe.mainLen > 120;
    c.noConsoleErrors = consoleErrors.length === 0;
    c.noFailingApi = apiFailures.length === 0;
    c.noSidewaysScroll = probe.overflow < 20;
    c.controlsOnScreen = probe.offscreenCount === 0;
    c.controlsNamed = probe.unnamedCount === 0;
    if (e.pageHeader) c.hasPageTitle = probe.h1Count >= 1 && !probe.h1Blank;
    if (e.dataTable) {
      c.tableOrEmptyState = probe.hasTable || probe.explainsEmpty;
      c.columnsLabelled = probe.headerlessColumns === 0;
    }
    if (e.tabs) c.tabsExposeState = probe.tabCount > 1 && probe.tabsWithoutState === 0;

    row.probe = probe;
    row.consoleErrors = consoleErrors.slice(0, 5);
    row.apiFailures = apiFailures.slice(0, 5);
  } catch (err) {
    row.checks.reachable = false;
    row.error = String(err).slice(0, 200);
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("response", onResponse);
  }

  const failed = Object.entries(row.checks).filter(([, v]) => v === false).map(([k]) => k);
  row.failed = failed;
  rows.push(row);

  const mark = failed.length === 0 ? "PASS" : "FAIL";
  console.log(
    `${String(i + 1).padStart(2)}/${list.length} ${mark.padEnd(4)} ${mod.route}` +
      (failed.length ? `  → ${failed.join(", ")}` : ""),
  );

  // Pacing. The API caps at 1000 requests per 900s window and a burst of
  // module loads has tripped it before; a self-inflicted 429 is not a defect
  // and must not be recorded as one.
  await page.waitForTimeout(700);
}

await browser.close();

const outFile = resolve(artifacts, `contract-${role}-${pass}.json`);
writeFileSync(outFile, JSON.stringify({ role, pass, viewport: VIEWPORT, base: BASE, rows }, null, 2));

const failing = rows.filter((r) => r.failed.length > 0);
console.log(`\n${rows.length - failing.length}/${rows.length} modules clean · report: ${outFile}`);
if (failing.length) {
  console.log(`\nfailures by check:`);
  const tally = {};
  for (const r of failing) for (const f of r.failed) (tally[f] ||= []).push(r.route);
  for (const [check, routes] of Object.entries(tally).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${check} (${routes.length}): ${routes.slice(0, 8).join(", ")}${routes.length > 8 ? " …" : ""}`);
  }
}
