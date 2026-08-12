/**
 * Property checks for the shared field validators.
 *
 *   node --experimental-strip-types scripts/field-validation-check.mjs
 *
 * The registration form used `.length(11)` for a phone number — exactly eleven
 * characters, of any kind — so "aaaaaaaaaaa" was a valid Pakistani mobile and
 * "0300 1234567", which is how people actually write theirs, was not. These
 * checks exist so that cannot come back.
 */
import { validatePkPhone, validateEmail, normalizePkPhone } from "../lib/validation/pk-fields.ts";

let failed = 0;
const check = (name, fn) => {
  try { fn(); console.log(`  ok   ${name}`); }
  catch (e) { failed++; console.error(`  FAIL ${name}\n       ${e.message}`); }
};
const ok = (c, m) => { if (!c) throw new Error(m ?? "expected true"); };
const eq = (a, b, m) => { if (a !== b) throw new Error(`${m ?? "expected"} ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };

const accepts = (v) => validatePkPhone(v) === undefined;

console.log("\nthe way Pakistanis actually type a number");
for (const v of ["03001234567", "0300 1234567", "0300-1234567", "+923001234567", "+92 300 1234567", "92 300 1234567", "(0300) 1234567"]) {
  check(`accepts "${v}"`, () => ok(accepts(v), "was rejected"));
}

console.log("\nand what is not a phone number");
for (const v of ["aaaaaaaaaaa", "12345678901", "0300123456", "030012345678", "", "   "]) {
  check(`rejects "${v}"`, () => ok(!accepts(v), "was accepted"));
}

console.log("\nnormalising to one stored shape");
for (const v of ["0300 1234567", "+92 300 1234567", "92-300-1234567", "03001234567", "(0300)/1234567"]) {
  check(`"${v}" → 03001234567`, () => eq(normalizePkPhone(v), "03001234567"));
}
check("normalise never invents — junk comes back trimmed, not mangled", () => {
  eq(normalizePkPhone("  not a phone  "), "not a phone");
  eq(normalizePkPhone(""), "");
});
check("normalising is idempotent", () => {
  const once = normalizePkPhone("+92 300 1234567");
  eq(normalizePkPhone(once), once);
});

console.log("\nemail");
for (const v of ["name@example.com", "x+tag@sub.domain.pk", "a.b-c@mail.co.uk"]) {
  check(`accepts "${v}"`, () => ok(validateEmail(v) === undefined, "was rejected"));
}
for (const v of ["notanemail", "a@b", "two@@at.com", "has space@x.com", "@nolocal.com", "trailing@dot."]) {
  check(`rejects "${v}"`, () => ok(validateEmail(v) !== undefined, "was accepted"));
}
check("optional by default, required on request", () => {
  eq(validateEmail(""), undefined, "empty is fine when optional");
  ok(validateEmail("", { required: true }) !== undefined, "empty must fail when required");
});

console.log("\nmessages are usable, not just correct");
check("every rejection tells the user the shape expected", () => {
  ok(/0300 1234567/.test(validatePkPhone("nope") || ""), "phone message shows an example");
  ok(/name@example\.com/.test(validateEmail("nope") || ""), "email message shows an example");
});

console.log(failed ? `\n${failed} check(s) failed\n` : "\nall checks passed\n");
process.exit(failed ? 1 : 0);
