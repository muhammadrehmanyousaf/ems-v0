import { resolvePricingModel, formatPrice } from "../lib/pricing/pricing-model.ts";

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, details?: string) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${name}`);
  } else {
    failed++;
    console.error(`  FAIL: ${name}${details ? ` -> ${details}` : ""}`);
  }
}

console.log("=== Testing Pricing Model & Single Source of Truth ===");

// 1. Per-head venue with min guests
{
  const venue = {
    name: "Grand Marquee",
    vendorType: "wedding-venues",
    packages: [
      { id: 1, name: "Gold Menu", price: 1850, pricingUnit: "per_head", minGuaranteeCount: 250 },
    ],
    priceUpdatedAt: "2026-09-01T00:00:00Z",
  };
  const res = formatPrice(venue);
  assert("Per-head headline", res.headline === "Rs 1,850 per head (minimum 250 guests)", res.headline);
  assert("Per-head schema price", res.schemaPrice === 1850);
  assert("Per-head confirmation note", /Price confirmed on 1 Sep/i.test(res.confirmationNote ?? ""), res.confirmationNote ?? "");

  const withGuests = formatPrice(venue, 300);
  assert("Per-head total calculated", withGuests.calculatedTotal === 1850 * 300, String(withGuests.calculatedTotal));
}

// 2. Package venue with max capacity
{
  const venue = {
    name: "Royal Palace",
    vendorType: "wedding-venues",
    packages: [
      { id: 2, name: "Complete Hall Rental", price: 450000, pricingUnit: "per_event", guestRangeMax: 400 },
    ],
    maxCapacity: 400,
  };
  const res = formatPrice(venue);
  assert("Package headline", res.headline === "Package from Rs 450,000 for up to 400 guests", res.headline);
  assert("Package approx per head", res.approxPerHead === Math.round(450000 / 400));
  assert("Package subtext contains approx per head", !!res.subtext?.includes("approx. Rs 1,125 per head"), res.subtext ?? "");

  const withGuests = formatPrice(venue, 250);
  assert("Package approx at user guests", withGuests.approxPerHead === Math.round(450000 / 250));
  assert("Package subtext at user guests", !!withGuests.subtext?.includes("approx. Rs 1,800 per head at 250 guests"), withGuests.subtext ?? "");
}

// 3. Rehman Grand Marquee (ID 3358): Test package filtering
{
  const rehmanGrand = {
    id: 3358,
    name: "Rehman Grand Marquee",
    minimumPrice: 350000,
    packages: [
      { id: 61, name: "Silver — Nikah Package", price: 325000, pricingUnit: null, capacity: 454 },
      { id: 62, name: "Gold — Barat Package", price: 760000, pricingUnit: null, capacity: 405 },
      // The corrupting test package:
      { id: 120, name: "test", description: "this is testing", price: 1493, pricingUnit: "per_head" },
    ],
    menus: [
      { id: 33, title: "Standard Desi Menu", price: 1850, pricingUnit: "per_head", minGuaranteeCount: 148 },
    ],
  };
  const res = formatPrice(rehmanGrand);
  // Must NOT pick package 120 (Rs 1,493 test package)
  assert("Rehman Grand Marquee ignores test package", res.headline !== "Rs 1,493 per head (minimum 291 guests)", res.headline);
  assert("Rehman Grand Marquee picks legitimate menu per-head", res.headline === "Rs 1,850 per head (minimum 148 guests)", res.headline);
}

// 4. Stale date > 12 months
{
  const venue = {
    name: "Old Hall",
    packages: [{ price: 1200, pricingUnit: "per_head" }],
    priceUpdatedAt: "2024-01-01T00:00:00Z",
  };
  const res = formatPrice(venue);
  assert("Stale price warning", res.confirmationNote === "Price may have changed – confirm with vendor", res.confirmationNote ?? "");
}

// 5. Missing / On Request
{
  const venue = {
    name: "Elite Hall",
    pricingMode: "quote",
  };
  const res = formatPrice(venue);
  assert("On request headline", res.headline === "Price on request", res.headline);
  assert("On request schema is null", res.schemaPrice === null);
  assert("On request total is null", res.calculatedTotal === null);
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
