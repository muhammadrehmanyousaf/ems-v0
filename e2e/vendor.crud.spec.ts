import { test, expect } from "@playwright/test";
import { gotoShell } from "./_shell";
import {
  useQaVenue, openAdd, waitForm, fillForm, fillFormRaw, saveForm, deleteRow, deleteNewest,
  waitSettled, apiHas, apiFindId, apiPost, apiDel, apiCleanup,
} from "./_crud";

/**
 * Champagne CRUD (docs/TEST-CASES.md — ST/SU/BR/EX/GF/HC/DN/IV
 * "create -> appears -> delete -> gone"). Drives the shadow-DOM "Naya …" drawer
 * and inline forms, scoped to the QA venue #3377 ("safe to delete"), on
 * vendor-internal ledgers/registers that notify no one.
 *
 * Reliable by construction: create/delete are asserted via the API (unique
 * marker in the JSON, independent of list layout), and an afterEach cleanup
 * guarantees no residue is left in production even if a UI step flakes.
 *
 * Per-entity delete mode:
 *   marker      — the row shows the unique marker; delete its trash + confirm.
 *   newest      — no unique field in the row (generator log); delete the top row.
 *   stock-guard — inventory: UI delete is BLOCKED while stock>0 (STOCK_NOT_ZERO);
 *                 assert the guard, then zero the stock and delete (IV-02).
 *
 * Serial — all tests write to one shared venue.
 */
test.describe.configure({ mode: "serial" });

const STAMP = Date.now().toString().slice(-6);
type DelMode = "marker" | "newest" | "stock-guard";

const ENTITIES: { key: string; route: string; add: RegExp; marker: string; list: string; del: (id: any) => string; mode: DelMode; rawFill?: boolean; scoped?: boolean }[] = [
  { key: "staff", route: "/dashboard/staff", add: /naya staff/i, marker: `E2EStaff${STAMP}`, list: "/staff/members", del: (id) => `/staff/members/${id}`, mode: "marker" },
  { key: "suppliers", route: "/dashboard/suppliers", add: /naya supplier/i, marker: `E2ESup${STAMP}`, list: "/suppliers", del: (id) => `/suppliers/${id}`, mode: "marker" },
  { key: "brokers", route: "/dashboard/brokers", add: /naya broker/i, marker: `E2EBroker${STAMP}`, list: "/brokers", del: (id) => `/brokers/${id}`, mode: "marker" },
  { key: "generator-fuel", route: "/dashboard/generator-fuel", add: /naya entry/i, marker: `E2EFuel${STAMP}`, list: "/generator-fuel", del: (id) => `/generator-fuel/${id}`, mode: "newest" },
  { key: "halal-certs", route: "/dashboard/halal-certs", add: /naya certificate/i, marker: `E2EHalal${STAMP}`, list: "/halal-certs", del: (id) => `/halal-certs/${id}`, mode: "marker" },
  { key: "drone-noc", route: "/dashboard/drone-noc", add: /naya permit/i, marker: `E2EDrone${STAMP}`, list: "/drone-noc", del: (id) => `/drone-noc/${id}`, mode: "marker" },
  { key: "inventory", route: "/dashboard/inventory", add: /naya item/i, marker: `E2EItem${STAMP}`, list: "/inventory/items", del: (id) => `/inventory/items/${id}`, mode: "stock-guard" },
  // Expenses are vendor-level (businessId=null), not venue-scoped → query without businessId.
  { key: "expenses", route: "/dashboard/expenses", add: /naya kharcha/i, marker: `E2EExp${STAMP}`, list: "/expenses", del: (id) => `/expenses/${id}`, mode: "newest", rawFill: true, scoped: false },
];

const poll = async (page: any, fn: () => Promise<boolean>, want: boolean, tries = 8) => {
  for (let i = 0; i < tries; i++) { if ((await fn()) === want) return true; await page.waitForTimeout(1000); }
  return false;
};

for (const e of ENTITIES) {
  test(`CRUD ${e.key} — create → persists → delete → gone`, async ({ page }) => {
    const scoped = e.scoped !== false;
    await useQaVenue(page, scoped ? undefined : null); // vendor-level entities need "All venues" so their row shows
    await gotoShell(page, e.route);

    // CREATE
    expect(await openAdd(page, e.add), `${e.key}: Add opens`).toBeTruthy();
    await waitForm(page);
    const fields = await (e.rawFill ? fillFormRaw : fillForm)(page, e.marker);
    expect(fields, `${e.key}: form has fillable fields`).toBeGreaterThan(0);
    await page.waitForTimeout(500); // let React process the synthetic input/change events before save
    expect(await saveForm(page), `${e.key}: Save clicked`).toBeTruthy();
    await waitSettled(page, e.marker);

    // persisted (poll the write round-trip)
    expect(await poll(page, () => apiHas(page, e.list, e.marker, scoped), true), `${e.key}: created`).toBeTruthy();
    const id = await apiFindId(page, e.list, e.marker, scoped);

    // DELETE (per-entity)
    if (e.mode === "stock-guard") {
      // IV-02 — the row trash is blocked while stock > 0.
      await deleteRow(page, e.marker);
      await page.waitForTimeout(2500);
      expect(await apiHas(page, e.list, e.marker, scoped), `${e.key}: UI delete blocked by STOCK_NOT_ZERO`).toBeTruthy();
      // zero the stock, then delete.
      await apiPost(page, "/inventory/movements", { inventoryItemId: id, type: "consumed", quantity: 5, reason: "E2E zero-to-delete" });
      expect(await apiDel(page, e.del(id)), `${e.key}: DELETE after zeroing stock`).toBeLessThan(300);
    } else if (e.mode === "newest") {
      await deleteNewest(page);
    } else {
      await deleteRow(page, e.marker);
    }
    await waitSettled(page, e.marker, true);

    // gone
    expect(await poll(page, () => apiHas(page, e.list, e.marker, scoped), false), `${e.key}: deleted`).toBeTruthy();
  });

  test.afterEach(async ({ page }) => {
    // Safety net — never leave an E2E row in production.
    const scoped = e.scoped !== false;
    if (e.mode === "stock-guard") {
      const id = await apiFindId(page, e.list, e.marker, scoped);
      if (id != null) { await apiPost(page, "/inventory/movements", { inventoryItemId: id, type: "consumed", quantity: 5, reason: "E2E cleanup" }); await apiDel(page, e.del(id)); }
    } else {
      await apiCleanup(page, e.list, e.del, e.marker, scoped);
    }
  });
}
