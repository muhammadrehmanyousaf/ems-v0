import { test, expect } from "@playwright/test";
import { gotoShell } from "./_shell";
import {
  useQaVenue, openAdd, waitForm, fillForm, saveForm, deleteRow,
  waitSettled, apiHas, apiCleanup,
} from "./_crud";

/**
 * Champagne CRUD (docs/TEST-CASES.md — ST/SU/BR/EX "create -> appears -> delete
 * -> gone"). Drives the shadow-DOM "Naya …" drawer forms, scoped to the QA venue
 * #3377 ("safe to delete"), on vendor-internal ledgers that notify no one.
 *
 * Reliable by construction: the create/delete assertions are made via the API
 * (JSON contains the unique marker), and an afterEach API cleanup guarantees no
 * residue is left in production even if a UI step flakes.
 *
 * Serial — all tests write to one shared venue.
 */
test.describe.configure({ mode: "serial" });

const STAMP = Date.now().toString().slice(-6);

const ENTITIES = [
  { key: "staff", route: "/dashboard/staff", add: /naya staff/i, marker: `E2EStaff${STAMP}`, list: "/staff/members", del: (id: any) => `/staff/members/${id}` },
  { key: "suppliers", route: "/dashboard/suppliers", add: /naya supplier/i, marker: `E2ESup${STAMP}`, list: "/suppliers", del: (id: any) => `/suppliers/${id}` },
  { key: "brokers", route: "/dashboard/brokers", add: /naya broker/i, marker: `E2EBroker${STAMP}`, list: "/brokers", del: (id: any) => `/brokers/${id}` },
  // More entities (expenses, inventory, generator-fuel, halal-certs, drone-noc)
  // create cleanly via UI too, but their DELETE is entity-specific (a stock-zero
  // guard, or the marker not shown in the deletable row) — add them with a
  // per-entity delete step. The blueprint is docs/TEST-CASES.md.
];

for (const e of ENTITIES) {
  test(`CRUD ${e.key} — create → persists → delete → gone`, async ({ page }) => {
    await useQaVenue(page);
    await gotoShell(page, e.route);

    // CREATE — open the "Naya …" form, fill valid data, save.
    expect(await openAdd(page, e.add), `${e.key}: Add opens`).toBeTruthy();
    await waitForm(page);
    const fields = await fillForm(page, e.marker);
    expect(fields, `${e.key}: form has fillable fields`).toBeGreaterThan(0);
    expect(await saveForm(page), `${e.key}: Save clicked`).toBeTruthy();
    await waitSettled(page, e.marker);

    // …the record persisted (asserted via API — reliable across list layouts;
    // poll for the Railway write round-trip).
    let created = false;
    for (let i = 0; i < 6 && !created; i++) { created = await apiHas(page, e.list, e.marker); if (!created) await page.waitForTimeout(1000); }
    expect(created, `${e.key}: created`).toBeTruthy();

    // DELETE — via the row's trash + openConfirm.
    await deleteRow(page, e.marker);
    await waitSettled(page, e.marker, true);

    // …gone (asserted via API — the real UI-delete check; poll for the round-trip).
    let gone = false;
    for (let i = 0; i < 6 && !gone; i++) { gone = !(await apiHas(page, e.list, e.marker)); if (!gone) await page.waitForTimeout(1000); }
    expect(gone, `${e.key}: deleted via UI`).toBeTruthy();
  });

  test.afterEach(async ({ page }) => {
    // Safety net — never leave an E2E row in production.
    await apiCleanup(page, e.list, e.del, e.marker);
  });
}
