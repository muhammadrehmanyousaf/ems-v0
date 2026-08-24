/**
 * WW-SHAPES P1.9 — the quote estimate and its mirror must agree.
 *
 * `lib/seo/quote-estimate.ts` exists so the sticky quote bar moves as the couple
 * types a guest count; a round trip per keystroke is not an option. It mirrors
 * `perHeadEquivalent.js`, and a mirror that drifts shows a couple one figure on
 * the listing and charges another at checkout — the same class of failure this
 * programme started with.
 *
 * The one-dish mirror drifted from its rule twice before anything checked. This
 * walks every shape, at several guest counts, and fails on any disagreement in
 * the total, the per-head figure, the basis, or the refusal.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/quote-estimate-parity.mts
 */
import { createRequire } from "node:module";
import path from "node:path";
import { quoteEstimate } from "@/lib/seo/quote-estimate";

const require = createRequire(import.meta.url);
const BACKEND = process.env.WW_BACKEND || "C:/Projects/ems-v0-backend";
const modPath = path.join(BACKEND, "src/utils/perHeadEquivalent.js");

let perHeadEquivalent: (args: any) => any;
try {
  ({ perHeadEquivalent } = require(modPath));
} catch {
  console.error(`\nCould not load ${modPath}`);
  console.error("Set WW_BACKEND to the backend checkout, on a branch that has it.\n");
  process.exit(2);
}

// Which backend checkout this actually read. Without it, a branch mismatch
// reads as dozens of divergences — it has cost real time once already.
try {
  const { execSync } = await import("node:child_process");
  const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: BACKEND }).toString().trim();
  console.log(`\n  backend: ${BACKEND}  [${branch}]`);
} catch {
  console.log(`\n  backend: ${BACKEND}  [branch unknown]`);
}

const perHeadMenu = { id: 1, title: "Gold", price: 2500, pricingUnit: "per_head" };
const cheapMenu = { id: 2, title: "Silver", price: 1800, pricingUnit: "per_head" };
const flatPkg = { id: 1, name: "Hall", price: 450000, pricingUnit: "per_event" };
const allInPkg = { id: 2, name: "All-in", price: 3200, pricingUnit: "per_head", includesFood: true };

/** [label, business, guestCount] */
const CASES: [string, any, number | undefined][] = [
  ["all-in per head", { packages: [allInPkg] }, 400],
  ["hall + food (UC-05)", { packages: [flatPkg], menus: [perHeadMenu] }, 400],
  ["hall + food, small", { packages: [flatPkg], menus: [perHeadMenu] }, 80],
  ["picks the cheaper menu", { packages: [flatPkg], menus: [perHeadMenu, cheapMenu] }, 400],
  ["caterer, no hall", { menus: [perHeadMenu] }, 400],
  ["hall only", { packages: [flatPkg] }, 400],
  ["starting price only", { minimumPrice: 350000 }, 400],
  ["min booking value lifts it", { minimumPrice: 900000, menus: [perHeadMenu] }, 100],
  ["min food spend lifts it", { minFoodSpendPkr: 500000, packages: [flatPkg], menus: [perHeadMenu] }, 100],
  ["menu min guarantee", { menus: [{ ...perHeadMenu, minGuaranteeCount: 250 }] }, 100],
  ["package min guarantee", { packages: [{ ...allInPkg, minGuaranteeCount: 300 }] }, 100],
  ["flat menu", { menus: [{ id: 1, price: 120000, pricingUnit: "per_event" }] }, 400],
  ["no guest count, own band", { minCapacity: 200, maxCapacity: 800, packages: [allInPkg] }, undefined],
  ["no guest count, max only", { maxCapacity: 800, packages: [allInPkg] }, undefined],
  ["no guest count, no band", { packages: [allInPkg] }, undefined],
  ["zero-priced package ignored", { packages: [{ ...flatPkg, price: 0 }], menus: [perHeadMenu] }, 400],
  ["quote-only refuses", { pricingMode: "quote", minimumPrice: 500000 }, 400],
  ["nothing published refuses", {}, 400],
  ["one guest", { packages: [allInPkg] }, 1],
];

let bad = 0;
console.log("\n  the estimate vs the engine\n");
for (const [label, biz, guestCount] of CASES) {
  const args = {
    business: biz,
    packages: biz.packages ?? [],
    menus: biz.menus ?? [],
    guestCount,
  };
  const be = perHeadEquivalent(args);
  const fe = quoteEstimate(args as any);

  const same =
    be.comparable === fe.comparable &&
    be.perHead === fe.perHead &&
    be.total === fe.total &&
    be.guestCount === fe.guestCount &&
    be.basis === fe.basis &&
    be.reason === fe.reason &&
    JSON.stringify(be.assumptions) === JSON.stringify(fe.assumptions);

  if (!same) bad++;
  console.log(
    `  ${same ? "PASS" : "FAIL"}  ${label.padEnd(28)} ${
      be.comparable ? `Rs ${be.perHead}/head @ ${be.guestCount}  (${be.basis})` : "refused"
    }`,
  );
  if (!same) {
    console.log("        engine:", JSON.stringify(be));
    console.log("        mirror:", JSON.stringify(fe));
  }
}

/**
 * The case the whole thing exists for, asserted on both halves: the venue
 * advertising the SMALLER headline is the dearer one.
 */
console.log("\n  UC-05 — which venue is actually cheaper\n");
const a = { packages: [allInPkg] };
const b = { packages: [flatPkg], menus: [perHeadMenu] };
for (const [who, impl] of [["engine", perHeadEquivalent], ["mirror", quoteEstimate]] as const) {
  const ra = (impl as any)({ business: a, packages: a.packages, menus: [], guestCount: 400 });
  const rb = (impl as any)({ business: b, packages: b.packages, menus: b.menus, guestCount: 400 });
  const ok = rb.perHead > ra.perHead && ra.perHead === 3200 && rb.perHead === 3625;
  if (!ok) bad++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${who}: Rs 3,200/head venue = ${ra.perHead}, Rs 2,500/plate venue = ${rb.perHead}`);
}

const TOTAL = CASES.length + 2;
console.log(
  bad
    ? `\n  ${bad} DIVERGENCE(S) — the listing and the engine disagree about the price.\n`
    : `\n  ${TOTAL}/${TOTAL} — the listing and the engine agree on every shape.\n`,
);
process.exit(bad ? 1 : 0);
