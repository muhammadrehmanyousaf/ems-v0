/**
 * One-off codemod: show the SERVER's rejection reason, not axios's wrapper.
 *
 * Every one of these handlers reads `e?.message`. For an axios error that is
 * the string "Request failed with status code 400" — which tells a vendor
 * nothing. The reason the API actually sent lives at
 * `e.response.data.message`.
 *
 * Verified live on production, Business Settings → Listing content: saving
 * with weddingsCompleted = -10 showed the vendor
 *     "Request failed with status code 400"
 * while the API had replied
 *     "WeddingsCompleted must be a whole number between 0 and 200000"
 * — a message that says exactly what to fix.
 *
 * A rejected save that cannot say why is indistinguishable from a broken
 * button, which is the "nothing saves" complaint this whole pass exists to
 * kill. The main save bar was fixed earlier; these 12 were missed.
 *
 * The toast is held to 8s because a validation message is something the vendor
 * has to read and act on, not a passing confirmation.
 *
 * Run:  node scripts/codemod-server-error-message.mjs [--dry]
 */
import fs from "node:fs";
import path from "node:path";

const DRY = process.argv.includes("--dry");
const ROOT = "components";

/** `toast.error(e?.message || "Fallback")` — optionally already multi-line. */
const RE = /toast\.error\(\s*(\w+)\?\.message\s*\|\|\s*("(?:[^"\\]|\\.)*")\s*\)/g;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".tsx") || e.name.endsWith(".ts")) out.push(p);
  }
  return out;
}

const changed = [];
for (const file of walk(ROOT)) {
  const src = fs.readFileSync(file, "utf8");
  if (!RE.test(src)) continue;
  RE.lastIndex = 0;

  let count = 0;
  const next = src.replace(RE, (_m, err, fallback) => {
    count++;
    return (
      `toast.error(\n` +
      `        ${err}?.response?.data?.message || ${err}?.message || ${fallback},\n` +
      `        { duration: 8000 },\n` +
      `      )`
    );
  });

  if (!DRY) fs.writeFileSync(file, next);
  changed.push([file, count]);
}

console.log(`\nFILES CHANGED (${changed.length}):`);
let total = 0;
for (const [f, n] of changed) {
  total += n;
  console.log(`  ${n}×  ${f}`);
}
console.log(`\n${total} handler(s) now surface the server's reason.`);
