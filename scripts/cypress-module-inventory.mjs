/**
 * Generates cypress/fixtures/modules.json from qa/UX-INVENTORY.json.
 *
 * The module list is DERIVED, never hand-written. A hand-kept list silently
 * stops matching the app the first time somebody adds a route, and then the
 * suite reports green on a product it is no longer covering — which is worse
 * than no suite, because it buys confidence that is not there.
 *
 * Regenerate:  node scripts/cypress-module-inventory.mjs
 *
 * The inventory itself comes from scripts/ux-inventory.mjs, which scans the
 * app directory. So the chain is: app routes -> UX-INVENTORY.json -> this ->
 * the specs. Nothing in it is typed by hand.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const inventory = JSON.parse(readFileSync(resolve(root, "qa/UX-INVENTORY.json"), "utf8"));

/** Turn "/dashboard/function-sheets" into "Function sheets". */
const titleFor = (route) => {
  const last = route.split("/").filter(Boolean).pop() ?? "dashboard";
  const words = last.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const modules = inventory.rows
  // Dynamic segments need a real id to visit; they are covered by the detail
  // specs that create their own fixture, not by the route sweep.
  .filter((r) => !r.route.includes("["))
  .map((r) => ({
    route: r.route,
    name: r.route === "/dashboard" ? "Home" : titleFor(r.route),
    // Admin routes render an "Admin only" gate for a vendor session. The sweep
    // still visits them — proving the gate HOLDS is a security assertion — but
    // it must not expect vendor chrome there.
    adminOnly: r.route.startsWith("/dashboard/admin/") ||
      ["/dashboard/businesses", "/dashboard/claims", "/dashboard/revenue",
       "/dashboard/roles", "/dashboard/users", "/dashboard/vendors"].includes(r.route),
    // What the scanner found in the source. Used to assert the RIGHT thing per
    // module instead of one lowest-common-denominator check everywhere.
    expects: {
      pageHeader: !!r.pageHeader,
      dataTable: !!r.dataTable,
      statCard: !!r.statCard,
      tabs: !!r.tabs,
      emptyState: !!r.emptyState,
    },
  }))
  .sort((a, b) => a.route.localeCompare(b.route));

const out = {
  generatedFrom: "qa/UX-INVENTORY.json",
  generatedBy: "scripts/cypress-module-inventory.mjs",
  count: modules.length,
  modules,
};

mkdirSync(resolve(root, "cypress/fixtures"), { recursive: true });
writeFileSync(resolve(root, "cypress/fixtures/modules.json"), JSON.stringify(out, null, 2) + "\n");

const admin = modules.filter((m) => m.adminOnly).length;
console.log(
  `cypress/fixtures/modules.json — ${modules.length} modules ` +
    `(${modules.length - admin} vendor, ${admin} admin-gated)`,
);
