import { test, expect } from "@playwright/test";
import { gotoShell, collect } from "./_shell";

/**
 * Money-truth (docs/TEST-CASES.md BKD-02/03) — the booking-detail money card
 * reads from booking-money (received/outstanding), so the figures reconcile:
 *   active   -> Kul = Mil chuka + Baqaya
 *   cancelled -> Baqaya = 0
 * Read-only. Opens the first booking in the list, so it needs no fixed id.
 */

async function readMoney(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    let wwc: HTMLElement | null = null;
    for (const el of document.querySelectorAll("*")) { const w = (el as HTMLElement).shadowRoot?.getElementById("wwc"); if (w) { wwc = w; break; } }
    const t = wwc?.innerText || "";
    const num = (label: string) => {
      const m = t.match(new RegExp(label + "[^\\d]{0,14}Rs\\s*([\\d,]+)", "i"));
      return m ? Number(m[1].replace(/,/g, "")) : null;
    };
    return { total: num("Kul"), paid: num("Mil chuka"), due: num("Baqaya"), cancelled: /cancel ho chuki|Cancelled/i.test(t) };
  });
}

test("BKD-02/03 money-truth — booking-detail paid/baqaya reconcile", async ({ page }) => {
  const seen = collect(page);

  await gotoShell(page, "/dashboard/bookings");
  const target = await page.evaluate(() => {
    for (const el of document.querySelectorAll("*")) {
      const w = (el as HTMLElement).shadowRoot?.getElementById("wwc");
      if (w) { const r = w.getRootNode() as ShadowRoot; const t = r.querySelector('[data-nav-btn^="/dashboard/bookings/"]'); return t?.getAttribute("data-nav-btn") || null; }
    }
    return null;
  });
  expect(target, "a booking row exists").toBeTruthy();

  await page.evaluate((href) => {
    for (const el of document.querySelectorAll("*")) {
      const w = (el as HTMLElement).shadowRoot?.getElementById("wwc");
      if (w) { const r = w.getRootNode() as ShadowRoot; (r.querySelector(`[data-nav-btn="${href}"]`) as HTMLElement)?.click(); return; }
    }
  }, target);

  // booking detail fans out ~7 money calls — wait for the card, not a fixed time
  await page.waitForFunction(() => {
    for (const el of document.querySelectorAll("*")) { const w = (el as HTMLElement).shadowRoot?.getElementById("wwc"); if (w && /Mil chuka/i.test(w.innerText || "")) return true; }
    return false;
  }, { timeout: 30_000 });
  await page.waitForTimeout(1500);

  const m = await readMoney(page);
  expect(m.total, "Kul present").not.toBeNull();
  expect(m.paid, "Mil chuka present").not.toBeNull();
  expect(m.due, "Baqaya present").not.toBeNull();

  if (m.cancelled) {
    expect(m.due, "cancelled -> baqaya 0").toBe(0);
  } else {
    expect(Math.abs(m.total! - (m.paid! + m.due!)), "Kul = Mil chuka + Baqaya").toBeLessThanOrEqual(2);
  }
  expect(seen.net5, `no 5xx (${seen.net5.join(", ")})`).toHaveLength(0);
});
