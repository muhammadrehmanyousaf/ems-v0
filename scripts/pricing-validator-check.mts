import { validateListing, isListingIndexable } from "../lib/pricing/pricing-validator";

let failures = 0;
function test(name: string, ok: boolean, msg?: string) {
  if (ok) {
    console.log(`  PASS: ${name}`);
  } else {
    failures++;
    console.error(`  FAIL: ${name}${msg ? ` - ${msg}` : ""}`);
  }
}

console.log("=== Testing Listing Validator & Quality Gate ===");

// 1. Clean listing
const cleanVenue = {
  name: "Rehman Grand Marquee",
  description: "Air-conditioned marquee in Johar Town with in-house catering, generator backup and parking for 120 cars.",
  images: ["img1.jpg", "img2.jpg", "img3.jpg", "img4.jpg"],
  type: "Wedding venue",
  minimumPrice: 350000,
};
const v1 = validateListing(cleanVenue);
test("Clean venue is valid", v1.isValid);
test("Clean venue is indexable", v1.isIndexable);

// 2. Junk symbols
const junkSymbols = {
  name: "Royal Palace &^ Marquee",
  description: "Beautiful venue",
  images: ["img1.jpg"],
};
const v2 = validateListing(junkSymbols);
test("Flags &^ junk symbols", v2.flags.hasJunkSymbols);
test("Junk symbols venue is NOT indexable", !v2.isIndexable);

// 3. Test words
const testWordListing = {
  name: "Test Marquee 123",
  description: "some test venue",
  images: ["img1.jpg"],
};
const v3 = validateListing(testWordListing);
test("Flags test word in name", v3.flags.isTestWord);
test("Test word venue is NOT indexable", !v3.isIndexable);

// 4. Off-topic businesses
const pizzaListing = {
  name: "Kings & Queens Pizza Parlour",
  description: "Best pizza in town",
  images: ["img1.jpg"],
  type: "Bridal wear",
};
const v4 = validateListing(pizzaListing);
test("Flags pizza parlour as off-topic", v4.flags.isOffTopic);
test("Off-topic business is NOT indexable", !v4.isIndexable);

const dentalListing = {
  name: "Sherwani Dental Associates",
  description: "Root canals and teeth whitening",
  images: ["img1.jpg"],
  type: "Bridal wear",
};
const v5 = validateListing(dentalListing);
test("Flags dental clinic as off-topic", v5.flags.isOffTopic);
test("Dental clinic is NOT indexable", !v5.isIndexable);

// 5. Pricing sanity check
const cheapVenue = {
  name: "Super Budget Hall",
  description: "A small hall",
  images: ["img1.jpg"],
  type: "Wedding venue",
  packages: [{ name: "Budget Event", price: 5000, pricingUnit: "per_event" }],
};
const v6 = validateListing(cheapVenue);
test("Flags venue price below Rs 20,000", v6.flags.pricingSanityFailed);

const lowPerHead = {
  name: "Low Rate Catering",
  description: "Catering service",
  images: ["img1.jpg"],
  type: "Catering",
  minimumPrice: 300, // Below Rs 800 per head
};
const v7 = validateListing(lowPerHead);
test("Flags per-head price below Rs 800", v7.flags.pricingSanityFailed);

// 6. Thin content check
const thinListing = {
  name: "Empty Marquee",
  description: "",
  images: [],
};
const v8 = validateListing(thinListing);
test("Flags 0 images as thin content", v8.flags.thinContent);
test("Thin listing is NOT indexable", !v8.isIndexable);

console.log(`\nResults: ${failures === 0 ? "All tests passed!" : `${failures} test(s) failed.`}`);
process.exit(failures > 0 ? 1 : 0);
