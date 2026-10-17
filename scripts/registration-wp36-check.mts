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

// 2. wizard payload and screens (static checks on the source text)
const reg = read("components/business-registration-form.tsx");
check("no pre-account upload to the auth-gated route", !/axios\s*\.post\(\s*`[^`]*upload-images/.test(reg));
check("logo, gallery and package photos travel on the registration request", /"brandLogoFile"/.test(reg) && /"galleryImages"/.test(reg) && /packageImages_\$\{k\}/.test(reg));
check("an upload failure is shown to the vendor", /Some photos could not be uploaded/.test(reg));
check("capacity is never defaulted to 1", !/maxCapacity:\s*formData\.maxCapacity\s*\|\|\s*1/.test(reg));
check("minCapacity is sent", /minCapacity:\s*formData\.minCapacity/.test(reg));
check("car rental derives its business types from the fleet", /carRentalSubTypes\(formData\.businessType/.test(reg));
check("signed-in customer gets a notice, not a silent hop", /signedInCustomer/.test(reg) && /isCustomerSession/.test(read("middleware.ts")));
const personal = read("components/VendorStepForms/personal-details.tsx");
check("account step asks if the e-mail is taken", /auth\/email-available/.test(personal));
check("food categories can state a maximum guest count", /MaxGuestsField/.test(read("components/VendorStepForms/newVendorRegisterationForm/Catering/cateringComponents/business-details.tsx")) && /MaxGuestsField/.test(read("components/VendorStepForms/newVendorRegisterationForm/Generic/generic-business-details.tsx")));
check("per-head price label for catering / live cooking", /Price per head/.test(read("components/VendorStepForms/packages.tsx")));
check("type-specific values read back from typeSpecificDetails", /typeSpecificDetails/.test(read("components/dashboard/mainScreens/businessSettings/redesigned/type-specific-manager.tsx")));
for (const f of [
  "components/dashboard/mainScreens/function-sheets/artifact/function-sheets-artifact.tsx",
  "components/dashboard/mainScreens/halal-certs/artifact/halal-certs-artifact.tsx",
  "components/dashboard/mainScreens/generator-fuel/artifact/generator-fuel-artifact.tsx",
  "components/dashboard/mainScreens/drone-noc/artifact/drone-noc-artifact.tsx",
]) check(`${f.split("/").pop()}: create form scopes to the single owned venue`, /useScopedBusinessId\(\)/.test(read(f)));
check("setup checklist follows the venue switcher", /useActiveBusinessId\(\)/.test(read("components/dashboard/mainScreens/onboarding/artifact/onboarding-artifact.tsx")));
check("per-head package makes the booking flow ask for guests", /venueOffersPerHeadPackage/.test(read("components/booking/steps-v2/date-time-step.tsx")) && /venueOffersPerHeadPackage/.test(read("components/booking/shell/booking-ledger.tsx")));
check("a caterer with one menu is not a venue booking", /FOOD_VENDOR_TYPES/.test(read("components/booking/booking-form.tsx")));
check("vendor page gets its type", /vendor\.vendor\?\.vendorType/.test(read("components/VendorDetails/vendor-detail-route.tsx")));
check("package card shows its own unit", /pricingUnit === "per_head"/.test(read("components/VendorDetails/VendorDetailsMobile.tsx")));
check("declined line leaves the customer total", /=== 'declined' \? 0/.test(read("lib/utils/booking-money.ts")));
check("anonymous deep links return after login", /loginUrl\(\)/.test(read("components/VendorDetails/VendorDetailsMobile.tsx")) && /redirect=/.test(read("lib/auth/go-login.ts")));
check("booking request carries the function name", /payload\.eventType/.test(read("components/booking/booking-form.tsx")));
check("vendor Payments card reads the server slice", /view\.slice/.test(read("components/dashboard/mainScreens/bookings/artifact/qist-payments.ts")));

console.log(`registration-wp36-check: ${total - failed}/${total} checks passed`);
if (failed) process.exit(1);
