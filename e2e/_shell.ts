import { expect, type Page } from "@playwright/test";
import { gotoWithRetry } from "./_helpers";

/**
 * Champagne-shell helpers. The console content lives inside a shadow root that
 * has `#wwc`; React pages (settings hub etc.) render as normal light DOM under
 * `.cshell`. These helpers see both, and expose the shell invariants the
 * Shell Contract (docs/TEST-CASES.md §A) asserts.
 */

/** Vendor-console routes (nav-reachable). Keep in sync with docs/TEST-CASES.md. */
export const ROUTES: [key: string, route: string][] = [
  ["overview", "/dashboard"], ["leads", "/dashboard/leads"], ["bookings", "/dashboard/bookings"],
  ["calendar", "/dashboard/calendar"], ["chat", "/dashboard/chat"], ["function-sheets", "/dashboard/function-sheets"],
  ["customers", "/dashboard/customers"], ["quotes", "/dashboard/quotes"], ["holds", "/dashboard/holds"],
  ["reviews", "/dashboard/reviews"], ["field", "/dashboard/field"], ["trade-ops", "/dashboard/trade-ops"],
  ["kitchen-prep", "/dashboard/kitchen-prep"], ["brokers", "/dashboard/brokers"], ["insights", "/dashboard/insights"],
  ["billing", "/dashboard/billing"], ["money", "/dashboard/money"], ["payments", "/dashboard/payments"],
  ["receipts", "/dashboard/receipts"], ["receivables", "/dashboard/receivables"], ["expenses", "/dashboard/expenses"],
  ["staff", "/dashboard/staff"], ["suppliers", "/dashboard/suppliers"], ["pdcs", "/dashboard/pdcs"],
  ["tax", "/dashboard/tax"], ["setup", "/dashboard/setup"], ["settings", "/dashboard/settings"],
  ["settings-advanced", "/dashboard/settings/advanced"], ["onboarding", "/dashboard/onboarding"],
  ["automation", "/dashboard/automation"], ["cancellation-policy", "/dashboard/cancellation-policy"],
  ["spaces", "/dashboard/spaces"], ["slots", "/dashboard/slots"], ["packages", "/dashboard/packages"],
  ["venue-os", "/dashboard/venue-os"], ["inventory", "/dashboard/inventory"], ["generator-fuel", "/dashboard/generator-fuel"],
  ["halal-certs", "/dashboard/halal-certs"], ["drone-noc", "/dashboard/drone-noc"], ["promote", "/dashboard/promote"],
  ["collaborations", "/dashboard/collaborations"], ["notifications", "/dashboard/notifications"],
];

/** Console noise that is not a product defect (see docs/TEST-CASES.md "known non-defects"). */
const IGNORE = [
  /favicon/i, /Fast Refresh/i, /RSC payload/i, /Download the React DevTools/i,
  /\/reviews\/\d+/i, /net::ERR_ABORTED/i, /gtag|analytics|gtm|collect|clarity|hotjar|sentry|_vercel/i,
  /ResizeObserver loop/i,
  // Browser network-log lines (no JS stack) — real server errors are caught by
  // the 5xx response listener, not the console. This also covers the documented
  // /reviews/:id 404 on a non-approved venue whose console line carries no URL.
  /Failed to load resource/i,
];
const isNoise = (t: string) => IGNORE.some((re) => re.test(t));

export type Collected = { errors: string[]; net5: string[] };

/** Attach console/pageerror/5xx collectors; returns the arrays (filtered). */
export function collect(page: Page): Collected {
  const c: Collected = { errors: [], net5: [] };
  page.on("console", (m) => { if (m.type() === "error" && !isNoise(m.text())) c.errors.push(m.text().slice(0, 160)); });
  page.on("pageerror", (e) => { const s = String(e); if (!isNoise(s)) c.errors.push("pageerror: " + s.slice(0, 140)); });
  page.on("response", (r) => { if (r.status() >= 500 && !isNoise(r.url())) c.net5.push(`${r.status()} ${r.url().replace(/^https?:\/\/[^/]+/, "").slice(0, 90)}`); });
  return c;
}

/** Navigate and wait for the champagne content (shadow #wwc) or a React page to fill. */
export async function gotoShell(page: Page, route: string) {
  await gotoWithRetry(page, route);
  await expect(page, `${route} not redirected to login`).not.toHaveURL(/\/login/);
  await page.waitForFunction(() => {
    for (const el of document.querySelectorAll("*")) {
      const w = (el as HTMLElement).shadowRoot?.getElementById("wwc");
      if (w && (w.innerText || "").trim().length > 40) return true;
    }
    return /Business settings|choose one|Save changes/.test(document.body.innerText || "");
  }, { timeout: 20_000 }).catch(() => {});
  await page.waitForTimeout(800);
}

export type ShellProbe = { cshell: boolean; shadow: boolean; contentLen: number; reactPage: boolean; hScroll: number };

export async function probeShell(page: Page): Promise<ShellProbe> {
  return page.evaluate(() => {
    const cshell = !!document.querySelector(".cshell");
    let shadow = false, contentLen = 0;
    for (const el of document.querySelectorAll("*")) {
      const w = (el as HTMLElement).shadowRoot?.getElementById("wwc");
      if (w) { shadow = true; contentLen = (w.innerText || "").length; break; }
    }
    const reactPage = /Business settings|choose one|Save changes/.test(document.body.innerText || "");
    return { cshell, shadow, contentLen, reactPage, hScroll: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
}

/** SC-05: click the theme toggle, return the resolved shell + content-host theme. */
export async function toggleDark(page: Page): Promise<{ shellTheme: string | null; hostTheme: string | null; htmlDark: boolean }> {
  // The toggle carries aria-label "Toggle theme".
  const before = await page.evaluate(() => document.querySelector(".cshell")?.getAttribute("data-theme") || null);
  const clicked = await page.evaluate(() => {
    const cs = document.querySelector(".cshell"); if (!cs) return false;
    const btns = [...cs.querySelectorAll("button")].filter((b) => (b as HTMLElement).offsetParent !== null);
    const t = btns.find((b) => /theme|dark|light|mode/i.test((b.getAttribute("aria-label") || "") + (b.getAttribute("title") || "")))
      || btns.find((b) => b.querySelector("svg") && !/search|bell|notif|menu/i.test(b.getAttribute("aria-label") || ""));
    if (!t) return false; (t as HTMLElement).click(); return true;
  });
  expect(clicked, "theme toggle found").toBeTruthy();
  // if it was already dark, click again isn't needed; ensure we end on dark
  await page.waitForTimeout(1200);
  let state = await readTheme(page);
  if (state.shellTheme !== "dark") { await page.evaluate(() => { /* re-toggle */ const cs = document.querySelector(".cshell"); const b = [...(cs?.querySelectorAll("button") || [])].find((x) => /theme|toggle/i.test(x.getAttribute("aria-label") || "")); (b as HTMLElement)?.click(); }); await page.waitForTimeout(1200); state = await readTheme(page); }
  void before;
  return state;
}

async function readTheme(page: Page) {
  return page.evaluate(() => {
    const cs = document.querySelector(".cshell");
    let hostTheme: string | null = null;
    for (const el of document.querySelectorAll("*")) { if ((el as HTMLElement).shadowRoot?.getElementById("wwc")) { hostTheme = el.getAttribute("data-theme"); break; } }
    return { shellTheme: cs?.getAttribute("data-theme") || null, hostTheme, htmlDark: document.documentElement.classList.contains("dark") };
  });
}

/** SC-03: does a list screen freeze its column-headers (thead sticky) / bound its wrap? */
export async function stickyInfo(page: Page): Promise<{ hasTable: boolean; theadSticky: boolean }> {
  return page.evaluate(() => {
    for (const el of document.querySelectorAll("*")) {
      const w = (el as HTMLElement).shadowRoot?.getElementById("wwc");
      if (w) {
        const root = w.getRootNode() as ShadowRoot | Document;
        const thead = root.querySelector(".tbl thead, table thead") as HTMLElement | null;
        if (!thead) return { hasTable: false, theadSticky: false };
        return { hasTable: true, theadSticky: getComputedStyle(thead).position === "sticky" };
      }
    }
    return { hasTable: false, theadSticky: false };
  });
}
