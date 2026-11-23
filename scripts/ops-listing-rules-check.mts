/**
 * Guard: the Ops Portal's onboarding screens speak every code the server can answer with (Ops Portal P2).
 *
 * The call sheet is server-driven (the screen renders whatever the backend sheet defines), so the only things the browser owns are the
 * PLAIN-LANGUAGE words for the server's short codes. A code with no words reads as a bare "reason" to an agent on a live call, or worse,
 * hides a blocker. This asserts, against the backend source:
 *   every reason a media file can be refused for        has a sentence in UPLOAD_REASON            (lib/api/ops-onboarding.ts)
 *   every go-live gap the server can report             has a label in GAP                        (components/ops/listing-view.tsx)
 *   every consent kind                                  has a label in CONSENT_LABEL              (same file)
 *   every structured-list field of the venue sheet      has an editor in LISTS                    (components/ops/sheet-form.tsx)
 *
 * Needs the backend checkout (WW_BACKEND, default ../ems-v0-backend). With no backend it FAILS rather than quietly passing a comparison
 * that compared nothing.
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/ops-listing-rules-check.mts
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const BACKEND = process.env.WW_BACKEND || path.join(ROOT, "..", "ems-v0-backend");
const rd = (...p: string[]) => readFileSync(path.join(...p), "utf8");

const media = path.join(BACKEND, "src", "services", "opsMediaService.js");
const image = path.join(BACKEND, "src", "services", "imageProcessingService.js");
const listing = path.join(BACKEND, "src", "services", "opsListingService.js");
const sheetsDir = path.join(BACKEND, "src", "utils", "opsSheets");
for (const f of [media, image, listing, path.join(sheetsDir, "index.js")]) {
  if (!existsSync(f)) { console.error(`ops-listing-rules-check: backend file not found: ${f}. Set WW_BACKEND to the ems-v0-backend checkout.`); process.exit(1); }
}

let passed = 0;
const failures: string[] = [];
const check = (name: string, ok: boolean, detail = "") => { if (ok) passed++; else failures.push(`${name}${detail ? "  (" + detail + ")" : ""}`); };
// keys of an object literal whose entries may share a line (`a: "x", b: "y"`); `label` / `hint` are the inner fields of the GAP entries
const keysOf = (src: string, name: string): string[] => {
  const m = src.match(new RegExp(`(?:const|export const) ${name}[^=]*= \\{([\\s\\S]*?)\\n\\}`));
  if (!m) throw new Error(`${name} not found`);
  return [...m[1].matchAll(/(?:^|[\s,{])["']?([A-Za-z_]+)["']?\s*:\s*(?=[{"\[])/g)].map((x) => x[1]).filter((k) => k !== "label" && k !== "hint");
};
const uniq = (a: string[]) => [...new Set(a)].sort();

// ── media refusal reasons the server can send ──
const mediaSrc = readFileSync(media, "utf8");
const imageSrc = readFileSync(image, "utf8");
const serverReasons = uniq([
  ...[...mediaSrc.matchAll(/\bbad\("([a-z_]+)"\)/g)].map((m) => m[1]),
  ...[...imageSrc.matchAll(/new ImageProcessingError\("([a-z_]+)"/g)].map((m) => m[1]),
]);
const apiSrc = rd(ROOT, "lib", "api", "ops-onboarding.ts");
const reasonWords = keysOf(apiSrc, "UPLOAD_REASON");
check("the server refuses media for at least the known reasons (the scan found them)", serverReasons.length >= 8, serverReasons.join(","));
for (const r of serverReasons) check(`media reason "${r}" has plain words on screen`, reasonWords.includes(r));

// ── go-live gaps ──
const listingSrc = readFileSync(listing, "utf8");
const checksBlock = listingSrc.match(/const CHECKS = \{([\s\S]*?)\n\};/);
const serverGaps = uniq([
  ...(checksBlock ? [...checksBlock[1].matchAll(/\n\s{2}([A-Za-z]+):/g)].map((m) => m[1]) : []),
  ...[...listingSrc.matchAll(/gaps\.push\("([a-z]+)"\)/g)].map((m) => m[1]),
]);
const viewSrc = rd(ROOT, "components", "ops", "listing-view.tsx");
const gapWords = keysOf(viewSrc, "GAP");
check("the server reports the known go-live gaps (the scan found them)", serverGaps.length >= 12, serverGaps.join(","));
for (const g of serverGaps) check(`go-live gap "${g}" has a label on screen`, gapWords.includes(g));

// ── consent kinds ──
const kinds = listingSrc.match(/const CONSENT_KINDS = \[([^\]]*)\]/);
const serverKinds = kinds ? uniq([...kinds[1].matchAll(/"([a-z_]+)"/g)].map((m) => m[1])) : [];
const kindWords = keysOf(viewSrc, "CONSENT_LABEL");
check("the server has consent kinds (the scan found them)", serverKinds.length === 3, serverKinds.join(","));
for (const k of serverKinds) check(`consent kind "${k}" has a label on screen`, kindWords.includes(k));

// ── structured lists the sheet defines need an editor ──
const require_ = createRequire(import.meta.url);
const sheets = require_(path.join(sheetsDir, "index.js"));
const formSrc = rd(ROOT, "components", "ops", "sheet-form.tsx");
const editors = keysOf(formSrc, "LISTS");
for (const type of sheets.listSheetTypes()) {
  const sheet = sheets.getSheet(type);
  for (const f of sheets.fieldsOf(sheet).filter((x: { input: string }) => x.input === "list")) {
    check(`list field "${f.key}" of the ${type} sheet has an editor`, editors.includes(f.key));
  }
}

// ── reach: the screens actually use these maps (a correct map nothing reads protects nobody) ──
check("the media manager reports refusals with UPLOAD_REASON", /UPLOAD_REASON\[/.test(rd(ROOT, "components", "ops", "media-manager.tsx")));
check("the vendor's own page reports refusals with UPLOAD_REASON", /UPLOAD_REASON\[/.test(rd(ROOT, "components", "vendor-upload", "vendor-upload-page.tsx")));
check("the listing screen labels every open gap through GAP", /GAP\[g\]/.test(viewSrc));

if (failures.length) {
  console.error(`ops-listing-rules-check: ${failures.length} FAILED, ${passed} passed`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log(`ops-listing-rules-check: ${passed} checks passed`);
