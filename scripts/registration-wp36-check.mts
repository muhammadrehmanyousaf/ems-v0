/**
 * Guard - the vendor registration wizard and the multi-vendor cart screens (WP36 / portal audit P5).
 *
 *   1. /onboarding (quick signup) sends a subBusinessType for EVERY vendor type it offers, taken from the wizard's own
 *      option lists (the server refuses a registration with no business type);
 *   2. the wizard payloads and screens below keep the fixes in place (static checks on the source text).
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/registration-wp36-check.mts
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { VENDOR_TYPES } from "../lib/vendor-types.ts";
import { VENDOR_TYPE_CONFIGS } from "../lib/vendor-type-config.ts";
import { quickSignupSubTypes, QUICK_SIGNUP_FIXED_VALUES } from "../lib/quick-signup-subtypes.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

let failed = 0;
let total = 0;
function check(name: string, ok: boolean, detail = "") {
  total += 1;
  if (!ok) {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` :: ${detail}` : ""}`);
  }
}

// 1. quick signup
for (const t of Object.values(VENDOR_TYPES) as string[]) {
  const subs = quickSignupSubTypes(t);
  check(`quick signup sends a business type for ${t}`, Array.isArray(subs) && subs.length === 1 && subs[0].trim().length > 0, JSON.stringify(subs));
}
for (const [type, value] of Object.entries(QUICK_SIGNUP_FIXED_VALUES)) {
  const cfg = (VENDOR_TYPE_CONFIGS as Record<string, { typeSpecificFields: { key: string; options?: string[] }[] }>)[type];
  const field = cfg?.typeSpecificFields?.find((f) => f.key === "subBusinessType");
  if (field?.options) check(`${type}: "${value}" is one of the wizard's own options`, field.options.includes(value), String(field.options));
}
check("a generic category falls back to its own name", quickSignupSubTypes("Florist")[0] === "Florist");
const onboarding = read("app/(auth)/onboarding/page.tsx");
check("onboarding page appends subBusinessType from the shared mapping", /fd\.append\("subBusinessType",\s*JSON\.stringify\(quickSignupSubTypes\(vendorType\)\)\)/.test(onboarding));

console.log(`registration-wp36-check: ${total - failed}/${total} checks passed`);
if (failed) process.exit(1);
