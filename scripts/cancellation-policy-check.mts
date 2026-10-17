/**
 * Guard: the cancellation policy a vendor chooses is shown in words, and "Partially Refundable" carries a
 * number the server also accepts.
 *
 * The defects this pins (owner bugs 1 and 2, 2026-10-16): the registration review step printed the stored
 * key `partially_refundable` (the owner asked why the underscore shows), the venue page and the settings
 * screens printed whatever was stored, and "Partially Refundable" had no fixed amount / percentage at all.
 *
 *   - lib/cancellation-policy.ts mirrors the server's src/utils/partialRefundPolicy.js. Both run the SAME cases
 *     (scripts/fixtures/partialRefundCases.json is a copy of the backend's tests/fixtures/partialRefundCases.json;
 *     change them together).
 *   - every registration form that offers a Cancellation Policy also renders <PartialRefundFields>.
 *   - no surface prints `cancelationPolicy` / `cancellationPolicy` without going through cancellationLabel /
 *     cancellationText (the raw-key leak).
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/cancellation-policy-check.mts
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { CANCELLATION_HELP, CUSTOM_SCHEDULE_LABEL, cancellationDisplay, cancellationKey, cancellationLabel, cancellationText, fixedRefundCeiling, isGeneratedPartialText, ladderText, partialPolicyText, partialRefundErrors, shapeOfSlabs, summarisePolicy, validatePartialRefund } from "../lib/cancellation-policy.ts";
import { humanizeKey } from "../lib/humanize-key.ts";
import { refundParts, refundPin, refundTotal } from "../lib/refund-total.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
let passed = 0;
const failures: string[] = [];
const check = (name: string, ok: boolean, detail = "") => { if (ok) passed++; else failures.push(`${name}${detail ? "  (" + detail + ")" : ""}`); };

const cases = JSON.parse(readFileSync(path.join(HERE, "fixtures", "partialRefundCases.json"), "utf8")) as {
  keys: [string, string | null, string][];
  validate: { type: unknown; value: unknown; ceiling?: number | null; ok: boolean; text?: string }[];
};

// ── the same key / label answers as the server ──
for (const [raw, key, label] of cases.keys) {
  check(`key of ${JSON.stringify(raw)} is ${key}`, cancellationKey(raw) === key, String(cancellationKey(raw)));
  check(`label of ${JSON.stringify(raw)} is ${JSON.stringify(label)}`, cancellationLabel(raw) === label, cancellationLabel(raw));
}
check("a non-string is never a key and has an empty label", cancellationKey(null) === null && cancellationKey(5) === null && cancellationLabel(undefined) === "");

// ── the same verdicts and the same sentence as the server ──
cases.validate.forEach((c, i) => {
  const r = validatePartialRefund(c.type, c.value, c.ceiling ?? null);
  check(`case ${i} ${JSON.stringify(c)} verdict`, r.ok === c.ok, JSON.stringify(r));
  if (c.ok && r.ok) {
    check(`case ${i} text`, partialPolicyText(r.type, r.value) === c.text, partialPolicyText(r.type, r.value));
    check(`case ${i} the sentence is recognised as generated`, isGeneratedPartialText(c.text));
  }
  if (!c.ok && !r.ok) check(`case ${i} names the field under which to show the message`, ["partialRefundType", "partialRefundValue"].includes(r.field) && r.message.length > 5);
});

// ── what the review step prints ──
check("review: the key is a label", cancellationText("partially_refundable", null) === "Partially Refundable");
check("review: percent detail", cancellationText("partially_refundable", { type: "percent", value: 50 }) === "Partially Refundable: venue keeps 50%");
check("review: fixed detail (a typed string)", cancellationText("partially_refundable", { type: "fixed", value: "20000" }) === "Partially Refundable: venue keeps PKR 20,000");
check("review: a stale detail never rides on another policy", cancellationText("non_refundable", { type: "percent", value: 50 }) === "Non-Refundable" && cancellationText("refundable", { type: "fixed", value: 5000 }) === "Refundable");
check("review: an invalid detail falls back to the label", cancellationText("partially_refundable", { type: "percent", value: 150 }) === "Partially Refundable");
check("review: free text is untouched", cancellationText("Advance non-refundable within 30 days.", null) === "Advance non-refundable within 30 days.");

// ── form-level errors (what Continue checks) ──
check("no policy chosen: no refund error", Object.keys(partialRefundErrors({ cancelationPolicy: "" })).length === 0);
check("Refundable ignores the detail", Object.keys(partialRefundErrors({ cancelationPolicy: "refundable", partialRefundType: "percent", partialRefundValue: 500 })).length === 0);
check("partial without a type is an error under the type", Object.keys(partialRefundErrors({ cancelationPolicy: "partially_refundable" })).join() === "partialRefundType");
check("partial percent 100 is an error under the value", Object.keys(partialRefundErrors({ cancelationPolicy: "partially_refundable", partialRefundType: "percent", partialRefundValue: "100" })).join() === "partialRefundValue");
check("partial fixed above the dearest package is an error (packages are known on submit)", Object.keys(partialRefundErrors({ cancelationPolicy: "Partially Refundable", partialRefundType: "fixed", partialRefundValue: "200000", packages: [{ price: 150000 }] })).join() === "partialRefundValue");
check("partial fixed within the dearest package is fine", Object.keys(partialRefundErrors({ cancelationPolicy: "Partially Refundable", partialRefundType: "fixed", partialRefundValue: "20000", packages: [{ price: 150000 }] })).length === 0);
check("ceiling: minimum price wins, else dearest package, else none", fixedRefundCeiling({ minimumPrice: 100000, packages: [{ price: 500000 }] }) === 100000 && fixedRefundCeiling({ packages: [{ price: 150000 }, { price: "250000" }] }) === 250000 && fixedRefundCeiling({}) === null);

// ── a stored key is shown as words ──
check("humanizeKey: camelCase and snake_case", humanizeKey("SeatingArrangement") === "Seating Arrangement" && humanizeKey("soundLighting") === "Sound & Lighting" && humanizeKey("additionalServices") === "Additional Services" && humanizeKey("hall") === "Hall / Venue" && humanizeKey("non_refundable") === "Non refundable" && humanizeKey("Hall") === "Hall" && humanizeKey("Main Hall") === "Main Hall" && humanizeKey("AC") === "AC");

// ── source scan ──
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");
const walk = (dir: string, out: string[] = []): string[] => {
  for (const n of readdirSync(dir)) {
    if (n === "node_modules" || n === ".next" || n.startsWith(".")) continue;
    const p = path.join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out); else if (/\.(tsx?|jsx?)$/.test(n)) out.push(p);
  }
  return out;
};
const rel = (p: string) => path.relative(ROOT, p).replace(/\\/g, "/");

// every registration form that renders the Cancellation Policy control also renders the detail fields
const FORMS = [
  "components/VendorStepForms/newVendorRegisterationForm/venueSteps/vanueComponents/business-details.tsx",
  "components/VendorStepForms/newVendorRegisterationForm/BridalWear/components/business-details.tsx",
  "components/VendorStepForms/newVendorRegisterationForm/CarRental/components/business-details.tsx",
  "components/VendorStepForms/newVendorRegisterationForm/WeddingStationery/components/business-details.tsx",
  "components/VendorStepForms/newVendorRegisterationForm/Catering/cateringComponents/business-details.tsx",
  "components/VendorStepForms/newVendorRegisterationForm/Decorator/decoratorComponents/business-details.tsx",
  "components/VendorStepForms/newVendorRegisterationForm/HennaArtist/hennaArtistComponents/business-details.tsx",
  "components/VendorStepForms/newVendorRegisterationForm/MakeupArtist/makeupArtistComponents/business-details.tsx",
  "components/VendorStepForms/newVendorRegisterationForm/Photographer/photographerComponents/business-details.tsx",
  "components/VendorStepForms/newVendorRegisterationForm/Generic/generic-business-details.tsx",
];
for (const f of FORMS) check(`${f} renders <PartialRefundFields>`, /<PartialRefundFields\b/.test(read(f)));
// and every validator of the step checks it
for (const f of [
  "components/VendorStepForms/newVendorRegisterationForm/venueSteps/vanueComponents/vanueValidations.tsx",
  "components/VendorStepForms/newVendorRegisterationForm/BridalWear/components/validations.tsx",
  "components/VendorStepForms/newVendorRegisterationForm/CarRental/components/validations.tsx",
  "components/VendorStepForms/newVendorRegisterationForm/WeddingStationery/components/validations.tsx",
  "components/business-registration-form.tsx",
]) check(`${f} validates the partial refund`, /partialRefundErrors\(/.test(read(f)));
const regForm = read("components/business-registration-form.tsx");
check("the submit sends the validated detail, and only for Partially Refundable", /partialRefundType: v\.type, partialRefundValue: v\.value/.test(regForm) && /cancellationKey\(formData\.cancelationPolicy\) === "partially_refundable"/.test(regForm));

check("the review step prints the cancellation policy through cancellationText, with the entered detail", /value=\{cancellationText\(formData\.cancelationPolicy, \{\s*type: formData\.partialRefundType,\s*value: formData\.partialRefundValue,\s*\}\)\}/.test(read("components/VendorStepForms/preview.tsx")));
check("the review step humanizes package spec keys", /: humanizeKey\(cat\)/.test(read("components/VendorStepForms/preview.tsx")));

// owner decision 2026-10-16: the value is what the VENUE KEEPS, never what the customer gets back
const fields = read("components/VendorStepForms/components/partial-refund-fields.tsx");
check("the step-4 fields say the venue keeps (label, suffix, helper)", /Venue Keeps \(%\)/.test(fields) && /Venue Keeps \(PKR\)/.test(fields) && /the venue keeps this share/.test(fields) && /the venue keeps this amount/.test(fields));
check("the step-4 fields never describe the value as the customer's refund", !/they get this (share|amount)/.test(fields) && !/Refund Amount|Refund Percentage|Refund Type/.test(fields));
check("the policy screen, the refund preview card and the types use venueKeepsFixed (not the superseded refundFixed)", !/refundFixed/.test(read("components/dashboard/mainScreens/cancellation-policy/artifact/cancellation-policy-artifact.tsx") + read("components/bookings/refund-preview-card.tsx") + read("lib/api/bookingOrder.ts")) && /venueKeepsFixed/.test(read("components/bookings/refund-preview-card.tsx")) && /venueKeepsFixed/.test(read("components/dashboard/mainScreens/cancellation-policy/artifact/cancellation-policy-artifact.tsx")));
check("the customer cancel dialog says the venue keeps (not an unexplained 'forfeited')", /Venue keeps \(per \{refundPreview/.test(read("app/(main)/user/bookings/[id]/page.tsx")));

// ── WP26 / V4-1: the venue page's Cancellation tile shows the whole sentence (it was cut at "venue keeps 4...") ──
for (const [file, tile] of [["components/VendorDetails/VendorDetails.tsx", "StatTile"], ["components/VendorDetails/VendorDetailsMobile.tsx", "BridalStatTile"]] as const) {
  const src = read(file);
  const tileFn = src.slice(src.indexOf(`function ${tile}(`), src.indexOf(`function ${tile}(`) + 1500);
  check(`${file}: ${tile} can wrap a long value (wide) instead of truncating it`, /wide\?: boolean/.test(tileFn) && /wide \? "break-words" : "truncate"/.test(tileFn) && /col-span-2/.test(tileFn));
  check(`${file}: the Cancellation tile is wide when the sentence is long`, /label="Cancellation"[\s\S]{0,260}wide=\{[^}]*\.length > 20\}/.test(src));
}

// ── WP26 / V4-6: the cancel dialog tells the customer what they will RECEIVE, not only the policy part ──
// (the cancel dialog said "You'll get back Rs 18,000" to a customer owed 38,000: the price-drop overpayment is a
// separate obligation the preview reports in `priceDropRefund`, the declined-line sum in `declinedLineRefund`)
const totalCases = JSON.parse(readFileSync(path.join(HERE, "fixtures", "refundTotalCases.json"), "utf8")).cases as {
  name: string; refund: number; priceDropRefund?: unknown; declinedLineRefund?: unknown; total: number; pin: number; hasExtras: boolean;
}[];
for (const c of totalCases) {
  const input = { preview: { refund: c.refund }, priceDropRefund: c.priceDropRefund as number | null | undefined, declinedLineRefund: c.declinedLineRefund as number | null | undefined };
  check(`refund total: ${c.name}`, refundTotal(input) === c.total && refundParts(input).total === c.total, String(refundTotal(input)));
  check(`refund pin is the policy part only: ${c.name}`, refundPin(input) === c.pin, String(refundPin(input)));
  check(`refund extras flag: ${c.name}`, refundParts(input).hasExtras === c.hasExtras);
}
check("refund pin: no preview figure -> no pin (old behaviour)", refundPin({ preview: null }) === undefined && refundPin({}) === undefined);
const cancelPage = read("app/(main)/user/bookings/[id]/page.tsx");
check("the cancel dialog headline is the TOTAL (refundParts), never the policy part alone", /data-refund-total[^>]*>\{fmt\(refundParts\(refundPreview\)\.total\)\}/.test(cancelPage) && !/fmt\(refundPreview\.preview\.refund\)/.test(cancelPage));
check("the cancel dialog names each non-zero component (policy, price drop, declined line)", /refundParts\(refundPreview\)\.priceDrop > 0/.test(cancelPage) && /refundParts\(refundPreview\)\.declinedLine > 0/.test(cancelPage) && /data-refund-components/.test(cancelPage));
check("expectedRefund pins the POLICY part (refundPin), not the total the dialog shows", /refundPin\(refundPreview\)/.test(cancelPage) && !/expectedRefund: refundParts|expectedRefund: refundTotal/.test(cancelPage));
check("REFUND_CHANGED: the toast names the same total as the refreshed dialog (not only the policy part the server answers)", /const nowShown = fresh \? refundParts\(fresh\)\.total : now;/.test(cancelPage) && /The refund is now \$\{fmt\(nowShown\)\}/.test(cancelPage));
const vendorCard = read("components/bookings/refund-preview-card.tsx");
check("the vendor refund card and its WhatsApp line use the same total", /refundParts\(data\)/.test(vendorCard) && /Wapas: \$\{rs\(parts\.total\)\}/.test(vendorCard) && /\{rs\(parts\.total\)\}<\/p>/.test(vendorCard) && !/rs\(preview\.refund\)/.test(vendorCard));
check("the preview type carries the two additive fields", /priceDropRefund\?: number/.test(read("lib/api/bookingOrder.ts")) && /declinedLineRefund\?: number/.test(read("lib/api/bookingOrder.ts")));

// ── WP29: Refundable / Non-Refundable are real policies (the refund engine reads them) ──
// The same shared cases the server runs (backend tests/fixtures/cancellationLabelCases.json, copied to scripts/fixtures).
const labelCases = JSON.parse(readFileSync(path.join(HERE, "fixtures", "cancellationLabelCases.json"), "utf8")) as {
  ladder: { name: string; slabs: unknown; text: string }[];
  shape: { slabs: unknown; kind: string; value?: number }[];
  summary: { name: string; source: string; labelKey: "refundable" | "non_refundable" | "partially_refundable" | null; slabs: unknown; kind: string; headline: string; detail: string }[];
};
for (const c of labelCases.ladder) check(`ladder text: ${c.name}`, ladderText(c.slabs) === c.text, ladderText(c.slabs));
labelCases.shape.forEach((c, i) => { const s = shapeOfSlabs(c.slabs); check(`slab shape ${i}`, s.kind === c.kind && (c.value === undefined || s.value === c.value), JSON.stringify(s)); });
for (const c of labelCases.summary) {
  const s = summarisePolicy({ source: c.source, slabs: c.slabs, labelKey: c.labelKey });
  check(`summary: ${c.name}`, s.kind === c.kind && s.headline === c.headline && s.detail === c.detail, JSON.stringify(s));
}
// registration step 4: each answer is explained to the vendor, in what it means for the couple
check("step-4 helper: Non-Refundable says the venue keeps everything paid, and what still goes back", /keeps everything they have paid/.test(CANCELLATION_HELP.non_refundable) && /overpayment/.test(CANCELLATION_HELP.non_refundable) && /security deposit/.test(CANCELLATION_HELP.non_refundable));
check("step-4 helper: Refundable says the standard schedule", /standard schedule/.test(CANCELLATION_HELP.refundable) && /Wedding Wala/.test(CANCELLATION_HELP.refundable));
check("the shared fields render the helper for Refundable and Non-Refundable (so all ten forms show it)", /CANCELLATION_HELP\[policyKey\]/.test(fields) && /policyKey === "refundable" \|\| policyKey === "non_refundable"/.test(fields) && /data-testid="cancellation-policy-helper"/.test(fields));
// what a venue page / booking page prints: the engine's summary wins; the vendor's own words stay the headline
const sumNR = { kind: "non_refundable", headline: "Non-Refundable", detail: "D-NR" };
const sumStd = { kind: "standard", headline: "Standard refund schedule", detail: "D-STD" };
check("display: a known answer prints the engine's headline and detail", JSON.stringify(cancellationDisplay({ cancelationPolicy: "non_refundable", cancellationSummary: sumNR })) === JSON.stringify({ headline: "Non-Refundable", detail: "D-NR" }));
check("display: the stored row beats the label (label Refundable, row says ladder)", cancellationDisplay({ cancelationPolicy: "Refundable", cancellationSummary: { kind: "ladder", headline: "Refund schedule", detail: "D-L" } })?.headline === "Refund schedule");
check("display: the vendor's own words stay the headline, the engine's schedule is the detail", JSON.stringify(cancellationDisplay({ cancelationPolicy: "Advance non-refundable within 30 days.", cancellationSummary: sumStd })) === JSON.stringify({ headline: "Advance non-refundable within 30 days.", detail: "D-STD" }));
check("display: no label and only the platform schedule: nothing printed (as before)", cancellationDisplay({ cancelationPolicy: "", cancellationSummary: sumStd }) === null);
check("display: no label but the venue has its own stored policy: printed", cancellationDisplay({ cancelationPolicy: null, cancellationSummary: { kind: "partial_percent", headline: "Partially Refundable: venue keeps 40%", detail: "D" } })?.headline === "Partially Refundable: venue keeps 40%");
check("display: an older API (no summary) still shows the label as before", JSON.stringify(cancellationDisplay({ cancelationPolicy: "non_refundable" })) === JSON.stringify({ headline: "Non-Refundable", detail: "" }) && cancellationDisplay({}) === null);
check("a ladder saved later gives the label a truthful name", CUSTOM_SCHEDULE_LABEL === "Custom refund schedule");
for (const f of ["components/VendorDetails/VendorDetails.tsx", "components/VendorDetails/VendorDetailsMobile.tsx", "components/seo/vendor-detail-page.tsx", "components/booking/steps/preview-step.tsx"]) {
  const src = read(f);
  check(`${f} prints the policy through cancellationDisplay (the engine's summary), not the bare label`, /cancellationDisplay\(/.test(src) && !/cancellationLabel\(/.test(src));
}
const previewStep = read("components/booking/steps/preview-step.tsx");
check("the booking confirmation reads the venue's and every added vendor's policy through cancellationDisplay", /cancellationDisplay\(venue\)/.test(previewStep) && /cancellationDisplay\(v\)/.test(previewStep));
check("the venue page prints the plain-words detail under the headline (both layouts and the booking confirmation)", ["components/VendorDetails/VendorDetails.tsx", "components/VendorDetails/VendorDetailsMobile.tsx", "components/booking/steps/preview-step.tsx"].every((f) => /data-cancellation-detail/.test(read(f))));
check("the vendor payload mappers carry the server summary", /cancellationSummary: raw\.cancellationSummary/.test(read("lib/api/vendors.ts")) && /cancellationSummary: raw\?\.cancellationSummary/.test(read("lib/seo/fetch-vendor.ts")));
const policyScreen = read("components/dashboard/mainScreens/cancellation-policy/artifact/cancellation-policy-artifact.tsx");
check("the vendor Cancellation policy screen says what couples read (the engine's summary) and names a label-derived source", /data-policy-says/.test(policyScreen) && /d\.summary/.test(policyScreen) && /business_label/.test(policyScreen));
check("the vendor screen's ladder rows are the engine's bands (N+ din pehle, A-B din pehle, X din ya kam pehle), not the old 8-15 / 7 din tak reading", /din ya kam pehle/.test(policyScreen) && !/din tak/.test(policyScreen));
check("the vendor screen can edit the partial keep value: same rules as registration, same server door", /data-keep-edit>/.test(policyScreen) && /closest\("\[data-keep-edit\]"\)/.test(policyScreen) && /validatePartialRefund\(/.test(policyScreen) && /partialRefund: \{ type: v\.type, value: v\.value \}/.test(policyScreen) && /Venue Keeps \(PKR\)/.test(policyScreen) && /Venue Keeps \(%\)/.test(policyScreen) && /partialRefund\?: \{ type: "percent" \| "fixed"/.test(read("lib/api/bookingOrder.ts")));
check("the customer cancel dialog states the governing policy in words (policySummary)", /data-policy-summary/.test(cancelPage) && /\{refundPreview\.policySummary\?\.detail && \(/.test(cancelPage) && /policySummary\?:/.test(read("lib/api/bookingOrder.ts")));

// no component prints the stored policy raw: a JSX expression that is just the field, or a Field/StatTile value, must go through the label helper
// (form controls such as <Select value={formData.cancelationPolicy}> hold the KEY on purpose: they are not display)
const RAW_PRINT = /(\{\s*(?:vendor|venue|biz|activeBiz|business)\??\.(?:cancelationPolicy|cancellationPolicy)(?:\s*\|\|\s*(?:vendor|venue)\.cancellationPolicy)?\s*\})|(\bvalue=\{\s*vendor\.(?:cancelationPolicy|cancellationPolicy)[^)}]*\})/;
for (const p of walk(path.join(ROOT, "components")).concat(walk(path.join(ROOT, "app")))) {
  const r = rel(p);
  const src = readFileSync(p, "utf8");
  src.split(/\r?\n/).forEach((line, i) => {
    if (/^\s*(\/\/|\*|\{\/\*)/.test(line)) return;
    if (RAW_PRINT.test(line) && !/cancellationLabel|cancellationText/.test(line)) failures.push(`${r}:${i + 1} prints the stored cancellation policy raw: ${line.trim().slice(0, 110)}`);
  });
}

// the registration radio indicator uses colours the theme defines (roze-* is not one of them)
const radio = read("components/VendorStepForms/components/radio-button.tsx");
const radioCode = radio.split(/\r?\n/).filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
check("RadioButton does not use the undefined roze-* colour", !radioCode.includes("roze-"));
check("RadioButton keeps the input focusable (not display:none)", !/className="hidden"/.test(radio) && /sr-only/.test(radio));

if (failures.length) {
  console.error(`cancellation-policy check FAILED (${failures.length}):\n - ` + failures.join("\n - "));
  process.exit(1);
}
console.log(`cancellation-policy check OK: ${passed} checks`);
