/**
 * Guard: an agent on the phone is asked the same question, in the same words, as a vendor filling the registration form (Ops Portal P3).
 *
 * The call sheets of the 22 non-venue vendor types come from ems-v0-backend/src/utils/opsSheets/typeFields.js, a file whose every label, control
 * and option was copied from THIS repo's registration forms. This asserts the two never drift:
 *   - the 14 newer types: every field of lib/vendor-type-config.ts (key, label, control, options) equals the backend's, and no field is extra
 *   - the 8 original types: every boolean row, numberInput / textInput call, Select and multi-select list in their specialty-trust forms equals
 *     the backend's label, control and options (the few controls the forms build inline are checked for presence only)
 *
 * Needs the backend checkout (WW_BACKEND, default ../ems-v0-backend). With no backend it FAILS rather than quietly passing a comparison that
 * compared nothing.
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/ops-type-fields-check.mts
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const BACKEND = process.env.WW_BACKEND || path.join(ROOT, "..", "ems-v0-backend");
const FIELDS_FILE = path.join(BACKEND, "src", "utils", "opsSheets", "typeFields.js");
if (!existsSync(FIELDS_FILE)) {
  console.error(`ops-type-fields-check: ${FIELDS_FILE} not found. Set WW_BACKEND to the ems-v0-backend checkout (with Ops Portal P3).`);
  process.exit(1);
}

let passed = 0;
const failures: string[] = [];
const check = (name: string, ok: boolean, detail = "") => { if (ok) passed++; else failures.push(`${name}${detail ? "  (" + detail + ")" : ""}`); };

type BackField = { key: string; label: string; input: string; options?: { value: string; label: string }[] };
const TYPE_FIELDS = createRequire(import.meta.url)(FIELDS_FILE).TYPE_FIELDS as Record<string, BackField[]>;
const rd = (...p: string[]) => readFileSync(path.join(...p), "utf8");
const vals = (o?: { value: string }[]) => (o || []).map((x) => x.value);
const same = (a: unknown[], b: unknown[]) => JSON.stringify(a) === JSON.stringify(b);

/* ----------------------- the 14 newer types: lib/vendor-type-config.ts ----------------------- */
const NEW14 = ["Nikahkhwan", "Choreographer", "Dhol player", "Event host", "Live streaming", "Generator rental", "Marquee rental", "Furniture rental", "Florist", "Wedding cakes", "Mithai and sweets", "Live cooking stall", "Sound system rental", "Qawwali and Naat"];
const cfgSrc = rd(ROOT, "lib", "vendor-type-config.ts");
const typesSrc = rd(ROOT, "lib", "vendor-types.ts");
const enumLabel: Record<string, string> = {};
for (const m of typesSrc.matchAll(/^\s+([A-Z_]+): '([^']+)',/gm)) enumLabel[m[1]] = m[2];
const INPUT_OF: Record<string, string> = { boolean: "boolean", number: "number", select: "select", "multi-select": "multiselect", text: "text" };
const blocks = [...cfgSrc.matchAll(/\[VENDOR_TYPES\.([A-Z_]+)\]: \{/g)];
const cfg: Record<string, { key: string; label: string; type: string; options?: string[] }[]> = {};
blocks.forEach((b, i) => {
  const body = cfgSrc.slice(b.index, i + 1 < blocks.length ? blocks[i + 1].index : cfgSrc.length);
  const m = body.match(/typeSpecificFields:\s*\[/);
  if (!m) return;
  let depth = 0; const start = m.index! + m[0].length - 1; let end = start;
  for (; end < body.length; end++) { if (body[end] === "[") depth++; else if (body[end] === "]") { depth--; if (!depth) break; } }
  try { cfg[enumLabel[b[1]]] = new Function(`return ${body.slice(start, end + 1)}`)(); } catch { /* a config that references a constant (the venue); not one of the 14 */ }
});
for (const type of NEW14) {
  const fe = cfg[type];
  const be = TYPE_FIELDS[type];
  check(`${type}: the frontend config was read`, Array.isArray(fe) && fe.length > 0);
  check(`${type}: the backend has a sheet entry`, Array.isArray(be) && be.length > 0);
  if (!Array.isArray(fe) || !Array.isArray(be)) continue;
  check(`${type}: same fields in the same order`, same(fe.map((f) => f.key), be.map((f) => f.key)), `${fe.map((f) => f.key)} vs ${be.map((f) => f.key)}`);
  for (const f of fe) {
    const b = be.find((x) => x.key === f.key);
    if (!b) continue;
    check(`${type}.${f.key}: same label`, b.label === f.label, `${f.label} vs ${b.label}`);
    check(`${type}.${f.key}: same control`, b.input === INPUT_OF[f.type], `${f.type} vs ${b.input}`);
    if (f.options) check(`${type}.${f.key}: same options`, same(f.options, vals(b.options)), `${f.options} vs ${vals(b.options)}`);
  }
}

/* ----------------------- the 8 original types: their specialty-trust forms ----------------------- */
const FORM_DIR: Record<string, string> = { Photographer: "Photographer", Catering: "Catering", "Makeup artist": "MakeupArtist", "Henna artist": "HennaArtist", Decorator: "Decorator", "Car rental": "CarRental", "Bridal wearing": "BridalWear", "Wedding Invitations and Stationery": "WeddingStationery" };
const formsRoot = path.join(ROOT, "components", "VendorStepForms", "newVendorRegisterationForm");
const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const texts = Object.values(FORM_DIR).flatMap((d) => walk(path.join(formsRoot, d)).filter((f) => /\.tsx?$/.test(f)).map((f) => readFileSync(f, "utf8")));
const all = texts.join("\n");

const fe8: Record<string, { label: string; input: string; options?: string[] }> = {};
for (const m of all.matchAll(/\{\s*key:\s*"(\w+)",\s*label:\s*"([^"]+)"\s*\}/g)) fe8[m[1]] = fe8[m[1]] || { label: m[2], input: "boolean" };
for (const m of all.matchAll(/numberInput\(\s*"(\w+)",\s*"([^"]+)"/g)) fe8[m[1]] = { label: m[2], input: "number" };
for (const m of all.matchAll(/textInput\(\s*"(\w+)",\s*"([^"]+)"/g)) fe8[m[1]] = { label: m[2], input: "text" };
// Select controls: the SelectItem values after setTsd("key", ...)
for (const m of all.matchAll(/setTsd\("(\w+)", v\)/g)) {
  const seg = all.slice(m.index!, m.index! + 2500); const end = seg.indexOf("</Select>");
  const block = seg.slice(0, end > 0 ? end : 1500);
  const items = [...block.matchAll(/<SelectItem[^>]*value="([^"]*)"/g)].map((x) => x[1]);
  if (items.length) fe8[m[1]] = { ...(fe8[m[1]] || { label: "" }), input: "select", options: items };
}
// multi-select constant lists: the const array feeding .map((x) => ...) for tsd.<key>
const constArr = (name: string) => { const m = all.match(new RegExp(`const ${name}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`)); return m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : null; };
const MULTI: Record<string, string> = { equipmentBrands: "EQUIPMENT_BRANDS", menuCuisines: "CUISINES", productBrandsUsed: "PRODUCT_BRANDS", decorStyles: "DECOR_STYLES", invitationStyles: "INVITATION_STYLES" };
for (const [k, c] of Object.entries(MULTI)) { const arr = constArr(c); check(`the frontend form constant ${c} was read`, !!arr); if (arr) fe8[k] = { ...(fe8[k] || { label: "" }), input: "multiselect", options: arr }; }
const PHOTO_STYLES = constArr("PHOTOGRAPHY_STYLES");
check("the frontend form constant PHOTOGRAPHY_STYLES was read", !!PHOTO_STYLES);
if (PHOTO_STYLES) fe8.photographyStyle = { ...(fe8.photographyStyle || { label: "" }), input: "select", options: PHOTO_STYLES };

// inline controls the forms build without a helper: checked for presence in the form source instead
const INLINE = new Set(["deliveryTurnaroundWeeks", "editRevisionsIncluded", "weddingsCompletedAsLead", "flowersVsThemeDecorPriceRange", "alterationPolicy"]);
for (const type of Object.keys(FORM_DIR)) {
  for (const b of TYPE_FIELDS[type] || []) {
    if (INLINE.has(b.key)) { check(`${type}.${b.key}: the form still builds this control`, all.includes(`"${b.key}"`)); continue; }
    const f = fe8[b.key];
    check(`${type}.${b.key}: the registration form has this field`, !!f);
    if (!f) continue;
    if (f.label) check(`${type}.${b.key}: same label`, f.label === b.label, `${f.label} vs ${b.label}`);
    check(`${type}.${b.key}: same control`, f.input === b.input, `${f.input} vs ${b.input}`);
    if (f.options) check(`${type}.${b.key}: same options`, same(f.options, vals(b.options)), `${f.options} vs ${vals(b.options)}`);
  }
}

if (failures.length) {
  console.error(`ops-type-fields-check: ${failures.length} FAILED, ${passed} passed`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log(`ops-type-fields-check: ${passed} checks passed`);
