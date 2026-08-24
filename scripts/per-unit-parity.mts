/**
 * WW-RATECARD 10.7 — prove the per-unit mirror still agrees with the engine.
 *
 * `lib/pricing/per-unit.ts` exists so the quantity step, the running total, the
 * Review screen and the submitted payload all show the number the server is
 * going to charge. It says in its own header that it mirrors the `per_unit`
 * branch of `pricingService.computeVendorPrice`, and nothing enforced that.
 *
 * That has bitten this codebase before. `lib/compliance/one-dish.ts` drifted
 * from its rule twice, and both times the vendor's own screen stated something
 * the server disagreed with. Here the stake is money rather than a badge: a
 * mirror that drifts shows the customer one total on Review and charges
 * another, which is exactly the surprise PAY-3 was removed to stop.
 *
 * This drives the REAL `computeVendorPrice` — not a re-implementation of it —
 * across every unit shape the config can hold, and fails on any difference in
 * the total, the billed quantity or the minimum.
 *
 * Run:
 *   node --experimental-strip-types scripts/per-unit-parity.mts
 *   WW_BACKEND=/path/to/ems-v0-backend node --experimental-strip-types scripts/per-unit-parity.mts
 */
import { createRequire } from "node:module";
import path from "node:path";
import { readUnitConfig, sellsByTheUnit, unitLineFor } from "../lib/pricing/per-unit.ts";

const require = createRequire(import.meta.url);
const BACKEND = process.env.WW_BACKEND || "C:/Projects/ems-v0-backend";
const svcPath = path.join(BACKEND, "src/services/pricingService.js");

let computeVendorPrice: (vendor: any, business: any, opts?: any) => any;
try {
  ({ computeVendorPrice } = require(svcPath));
} catch (e) {
  console.error(`\nCould not load the pricing engine at ${svcPath}`);
  console.error("Set WW_BACKEND to the backend checkout to run this.\n");
  process.exit(2);
}

/** A vendor whose whole rate card is a unit. Minimum price is deliberately
 *  large, because the floor skipping the unit line is half of what is tested. */
const carHire = (cfg: any, over: any = {}) => ({
  id: 9,
  name: "Test vendor",
  minimumPrice: 250000,
  downPaymentType: "Percentage",
  downPayment: 20,
  packages: [],
  menus: [],
  pricingMode: "per_unit",
  pricingConfigJson: cfg,
  ...over,
});

const CAR = { unitLabel: "car", unitPricePkr: 15000 };

/** [label, business, requested quantity] */
const CASES: [string, any, number][] = [
  ["3 cars", carHire(CAR), 3],
  ["1 car — must NOT be floored", carHire(CAR), 1],
  ["the maximum the server allows", carHire(CAR), 50],
  ["a minimum that bites", carHire({ ...CAR, minUnitQty: 3 }), 1],
  ["a minimum exactly met", carHire({ ...CAR, minUnitQty: 3 }), 3],
  ["a minimum comfortably exceeded", carHire({ ...CAR, minUnitQty: 3 }), 5],
  ["a minimum of 1 is no minimum", carHire({ ...CAR, minUnitQty: 1 }), 2],
  ["a nonsense minimum is ignored", carHire({ ...CAR, minUnitQty: 0 }), 2],
  ["an unparseable minimum is ignored", carHire({ ...CAR, minUnitQty: "abc" }), 2],
  ["the older unitPrice spelling", carHire({ unitLabel: "car", unitPrice: 15000 }), 3],
  ["a price with paisa", carHire({ unitLabel: "kilo", unitPricePkr: 1250.5 }), 4],
  ["a multi-word label", carHire({ unitLabel: "100 cards", unitPricePkr: 4500 }), 6],
  ["a label already plural", carHire({ unitLabel: "chairs", unitPricePkr: 250 }), 200 > 50 ? 50 : 200],
  ["an expensive unit", carHire({ unitLabel: "marquee", unitPricePkr: 900000 }), 2],
];

/**
 * Shapes where the mirror must decline and the server must fall back to
 * `minimumPrice`. Disagreeing HERE is the dangerous direction: the mirror would
 * quote a unit line for a booking the server prices at the floor.
 */
const DECLINE: [string, any][] = [
  ["no declared mode", carHire(CAR, { pricingMode: null })],
  ["a different mode", carHire(CAR, { pricingMode: "flat" })],
  ["per_head with a unit configured", carHire(CAR, { pricingMode: "per_head" })],
  ["no config at all", carHire(null)],
  ["a config with no price", carHire({ unitLabel: "car" })],
  ["a zero price", carHire({ unitLabel: "car", unitPricePkr: 0 })],
  ["a negative price", carHire({ unitLabel: "car", unitPricePkr: -5 })],
  ["an unparseable price", carHire({ unitLabel: "car", unitPricePkr: "free" })],
];

let bad = 0;
console.log("\n  WW-RATECARD 10.7 — mirror vs engine\n");
console.log("  the unit line\n");

for (const [label, business, qty] of CASES) {
  const cfg = readUnitConfig(business);
  const mirror = cfg ? unitLineFor(cfg, qty) : null;
  const engine = computeVendorPrice({ vehicleQuantity: qty }, business);
  const beLine = engine.breakdown?.unitLine ?? null;

  const same =
    !!mirror &&
    !!beLine &&
    mirror.total === engine.totalAmount &&
    mirror.billedQty === beLine.billedQty &&
    mirror.requestedQty === beLine.requestedQty &&
    mirror.unitPrice === beLine.unitPrice &&
    (mirror.minUnitQty ?? null) === (beLine.minUnitQty ?? null);

  if (!same) bad++;
  console.log(
    `  ${same ? "PASS" : "FAIL"}  ${label.padEnd(34)} Rs ${String(engine.totalAmount).padEnd(9)} billed=${beLine?.billedQty ?? "—"}`,
  );
  if (!same) {
    console.log("        engine:", JSON.stringify({ total: engine.totalAmount, line: beLine }));
    console.log("        mirror:", JSON.stringify(mirror));
  }
}

console.log("\n  where the mirror must show nothing\n");
for (const [label, business] of DECLINE) {
  const cfg = readUnitConfig(business);
  const engine = computeVendorPrice({ vehicleQuantity: 3 }, business);
  const beLine = engine.breakdown?.unitLine ?? null;
  const same = cfg === null && beLine === null;
  if (!same) bad++;
  console.log(
    `  ${same ? "PASS" : "FAIL"}  ${label.padEnd(34)} Rs ${String(engine.totalAmount).padEnd(9)} mirror=${cfg ? "SHOWS A LINE" : "silent"}`,
  );
}

/**
 * `sellsByTheUnit` is narrower than `readUnitConfig`: the server bills the unit
 * line only when nothing else is selected, so a vendor with packages or menus
 * never reaches it. A quantity step that does not move the price is the exact
 * defect class this programme keeps finding, so the narrowing is asserted too.
 */
console.log("\n  the step is only offered where the price can actually move\n");
const NARROW: [string, any, boolean][] = [
  ["no packages, no menus", carHire(CAR), true],
  ["has a package", carHire(CAR, { packages: [{ id: 1, price: 200000 }] }), false],
  ["has a menu", carHire(CAR, { menus: [{ id: 1, price: 2500 }] }), false],
  ["no unit configured", carHire(null), false],
];
for (const [label, business, expected] of NARROW) {
  const got = sellsByTheUnit(business);
  const same = got === expected;
  if (!same) bad++;
  console.log(`  ${same ? "PASS" : "FAIL"}  ${label.padEnd(34)} offers step=${got}`);
}

const total = CASES.length + DECLINE.length + NARROW.length;
console.log(
  bad
    ? `\n  ${bad} DIVERGENCE(S) — Review would show one number and the server would charge another.\n`
    : `\n  ${total}/${total} — the screen and the engine agree on every shape.\n`,
);
process.exit(bad ? 1 : 0);
