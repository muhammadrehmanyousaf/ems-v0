/**
 * 7.13 / A22 / UC-16 — the indicative currency must stay wired, and stay honest.
 *
 * ── Why a wiring guard and not a parity guard ─────────────────────────────
 *
 * The deposit and space-fit rules are MIRRORED on the client, so they need a
 * parity check. This one deliberately is not: the browser does no arithmetic at
 * all, because whether a converted figure may be shown is four separate rules
 * (a seven-day staleness cut-off, a zero-rate refusal, the supported list, and
 * rounding UP against the customer's optimism) and duplicating them is how they
 * drift. So the thing to guard here is the opposite of parity — that no second
 * implementation ever appears on the client, and that the one on the server
 * actually reaches a screen.
 *
 * That second half is the failure this whole area already had once. `fxDisplay`
 * was written, correct, unit-tested, and required by nothing: every refusal in
 * it was unreachable, because nothing in the repo stored a rate at all.
 *
 * Run:
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/fx-display-wiring.mts
 */
import path from "node:path";
import fs from "node:fs";

const BACKEND = process.env.WW_BACKEND || "C:/Projects/ems-v0-backend";

try {
  const { execSync } = await import("node:child_process");
  const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: BACKEND }).toString().trim();
  console.log(`\n  backend: ${BACKEND}  [${branch}]`);
} catch {
  console.log(`\n  backend: ${BACKEND}  [branch unknown]`);
}

let pass = 0;
const failures: string[] = [];
const check = (what: string, ok: boolean, detail = "") => {
  if (ok) { pass++; console.log(`  PASS  ${what}`); }
  else failures.push(`${what}${detail ? `\n     ${detail}` : ""}`);
};

const fe = (rel: string) => fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const be = (rel: string) => fs.readFileSync(path.join(BACKEND, rel), "utf8");

/* ── the server half ──────────────────────────────────────────────────── */

console.log("");
try {
  const display = be("src/utils/fxDisplay.js");
  const controller = be("src/controllers/fxRateController.js");
  const router = be("src/routes/fxRateRouter.js");
  const business = be("src/controllers/businessController.js");
  const routes = be("src/loaders/routes.js");

  check("the rule module still refuses a stale rate", /MAX_RATE_AGE_DAYS/.test(display) && /age > MAX_RATE_AGE_DAYS/.test(display));
  check("it still rounds UP", /Math\.ceil\(pkr \/ perUnit\)/.test(display));
  check("it still refuses a zero or negative rate", /perUnit <= 0/.test(display));
  check("it still refuses an undated rate", /if \(!rate\?\.asOf\) return null/.test(display));
  // A rate needs somewhere with a DATE to live, or every refusal above is
  // unreachable code — which is exactly what it was.
  check("a rate has a store behind it", /FxRate/.test(controller) && fs.existsSync(path.join(BACKEND, "src/models/fxRateModel.js")));
  check("the venue page offers a converted figure", /priceIndicative/.test(business));
  check("a public quote endpoint exists", /fxRateRouter\.get\("\/quote", fxRateController\.publicQuote\)/.test(router));
  // Public deliberately: the families this exists for are browsing before they
  // have any reason to sign up.
  check("and it is genuinely public", /get\("\/quote", fxRateController\.publicQuote\)/.test(router) && !/get\("\/quote",\s*auth\(\)/.test(router));
  check("setting a rate is still super-admin only", /post\("\/",\s*auth\(\),\s*superAdmin\(\)/.test(router));
  check("the router is mounted", /app\.use\("\/api\/v1\/fx-rates", fxRateRouter\)/.test(routes));
  // A wrong currency on a wedding quote is worse than none, and a Pakistani
  // family in Dubai visiting relatives is not shopping in dirhams.
  check("the currency is never guessed from an IP", !/geoip|req\.ip/i.test(business.slice(business.indexOf("priceIndicative") - 3000, business.indexOf("priceIndicative") + 500)));
} catch (e) {
  failures.push(`cannot read a backend file: ${(e as Error).message}`);
}

/* ── the client half: it must reach a screen ──────────────────────────── */

console.log("");
try {
  const component = fe("components/pricing/indicative-price.tsx");
  const client = fe("lib/api/fx.ts");
  const desktop = fe("components/VendorDetails/VendorDetails.tsx");
  const mobile = fe("components/VendorDetails/VendorDetailsMobile.tsx");

  check("a client for the quote endpoint exists", /\/api\/v1\/fx-rates/.test(client) && /quote:/.test(client));
  check("the component asks the server for the figure", /fxApi\s*\n?\s*\.quote\(|fxApi\.quote\(/.test(component));

  /**
   * WW-PK-ONLY — these three checks INVERTED.
   *
   * They asserted that the venue pages RENDER the indicative figure, and were
   * right to: a guard that only checked the import would pass while the
   * component was rendered as {null}, which is how the first deposit wiring
   * guard failed.
   *
   * The product decision changed underneath them. Wedding Wala serves Pakistan
   * only and the venue is paid in rupees, so a second currency under the price
   * invited a family to reason in a number nobody can honour — and the gap
   * landed on the venue, who had agreed a PKR total. The figure was removed
   * from both venue pages.
   *
   * The guard is kept and reversed rather than deleted, because "it must not
   * come back by accident" is worth exactly what "it must be wired" was. The
   * component and its API client stay in place and are still covered above:
   * the admin FX screen uses them, so restoring the render is a one-line
   * change if the platform ever sells outside Pakistan.
   */
  check("the desktop venue page does NOT show a converted price", !/<IndicativePrice\s/.test(desktop));
  check("the mobile venue page does NOT show a converted price", !/<IndicativePrice\s/.test(mobile));
  check("neither venue page imports it", !/pricing\/indicative-price/.test(desktop) && !/pricing\/indicative-price/.test(mobile));

  /**
   * THE VENUE IS PAID IN RUPEES. The converted figure sits BELOW the rupee
   * price and never in place of it — so the rupee render must still be there,
   * and the component must never be given the job of showing the price.
   */
  check("the rupee price is still what the page shows", /formatPrice\(startingPrice\)/.test(desktop) && /\{priceLabel\}/.test(mobile));
  check("the converted figure is marked approximate", /≈/.test(component));

  /**
   * The CLAIMS, not the field names.
   *
   * This used to assert `{quote.caveat}` appeared verbatim. That pinned the
   * markup rather than the promise — redesigning the block to one line broke
   * the guard while every claim was still on screen, which is a guard testing
   * the wrong thing. What must survive any redesign is: the figure is called
   * indicative, the customer is told the rupee amount they will actually be
   * billed, and the rate carries the date it was taken.
   */
  check("it still says the figure is indicative", /Indicative only/i.test(component));
  check("it still names the rupee amount that will be billed",
    /billed Rs \{quote\.amountPkr/.test(component));
  check("the rate still carries its date", /Rate of\b/.test(component) && /asOf/.test(component));
  // The server's fuller sentence must stay reachable, not be dropped.
  check("the longer explanation is still offered", /\{quote\.note\}/.test(component));
  // The visible line abbreviates the date to stay short, so the unabbreviated
  // one has to survive somewhere — a rate's provenance is what makes an
  // indicative figure honest rather than a number from nowhere.
  check("and the unabbreviated rate date with it", /Rate taken \$\{quote\.asOf\}/.test(component));
  check("the rate's own date reaches the customer", /asOf/.test(client));

  // With no rate set anywhere the page must be byte-identical to what it was
  // before this existed.
  check("it renders nothing when no rate is live", /available\.length === 0\) return null/.test(component));
  check("a failed lookup renders nothing rather than an error", /\.catch\(/.test(component));

  /**
   * The client must do NO arithmetic. If a division by a rate ever appears
   * here, the four refusals above have quietly been duplicated — and the copy
   * will not be the one that gets updated.
   *
   * Comments are STRIPPED before this runs. The check reads `/` followed by
   * optional space and "rate", which a line comment containing the word rate
   * matches perfectly — "// rate's provenance" tripped it and reported a
   * conversion that does not exist. A guard that fails on prose trains people
   * to ignore it, which is worse than not having it.
   */
  const code = component
    .replace(/\/\*[\s\S]*?\*\//g, " ")   // block comments
    .replace(/^\s*\/\/.*$/gm, " ")        // whole-line comments
    .replace(/\s\/\/.*$/gm, " ");         // trailing comments

  /**
   * Stated as the invariant rather than as a pattern-match on one spelling.
   *
   * The old check looked for a slash followed by a rate identifier. Injecting a
   * real conversion — `pkr / (quote?.pkrPerUnit ?? 1)` — sailed straight past
   * it, because a single parenthesis broke the regex. A guard that passes on
   * the very thing it exists to catch is worse than none: it reports safety it
   * has not established.
   *
   * The honest invariant: the client renders only what the server DECIDED —
   * symbol, approx, amountPkr, asOf, note. The inputs a re-implementation would
   * need (the raw rate, the age, the staleness ceiling) must not appear in the
   * component at all. Any conversion, however spelled, needs one of them.
   */
  const REIMPL_INPUTS = ["pkrPerUnit", "rateAgeDays", "maxRateAgeDays"]
  const leaked = REIMPL_INPUTS.filter((f) => code.includes(f))
  check(
    "the browser never touches the raw rate, so it cannot convert at all",
    leaked.length === 0,
    leaked.length ? `component references ${leaked.join(", ")} — the inputs a second implementation needs` : "",
  );
  // Belt and braces: no arithmetic operator near a currency amount either.
  check(
    "and does no arithmetic on the amount",
    !/\bpkr\s*[/*]/.test(code) && !/Math\.(ceil|round|floor)\s*\(/.test(code),
    "a conversion in the client is a second implementation of the staleness rules",
  );
} catch (e) {
  failures.push(`cannot read a client file: ${(e as Error).message}`);
}

/* ── and a rate must have a way IN ────────────────────────────────────── */

/**
 * Without an admin screen the routes exist and nothing can reach them, so no
 * rate is ever set and every refusal is unreachable again — the original bug,
 * one layer up.
 */
console.log("");
try {
  const form = fe("components/admin/FxRatesForm.tsx");
  const page = fe("app/(dashboard)/dashboard/admin/fx-rates/page.tsx");
  const nav = fe("components/dashboard/layout/nav-data.ts");
  const sidebar = fe("components/dashboard/layout/app-sidebar.tsx");

  check("an admin can set a rate at all", /fxApi\.set\(/.test(form));
  check("the page exists and is guarded", /AdminGuard requireSuperAdmin/.test(page) && /FxRatesForm/.test(page));
  check("it is reachable from the nav", /\/dashboard\/admin\/fx-rates/.test(nav));
  check("and only by a super admin", /"Currency rates"/.test(sidebar));
  // The single most useful thing on that screen: a rate that has aged out and
  // silently stopped being shown.
  check("the admin is told when a rate has aged out", /showingToCustomers/.test(form) && /Aged out/.test(form));
} catch (e) {
  failures.push(`cannot read an admin file: ${(e as Error).message}`);
}

const total = pass + failures.length;
if (failures.length) {
  console.error(`\n  ${failures.length}/${total} FAILED\n`);
  for (const f of failures) console.error(`   ✖ ${f}\n`);
  process.exit(1);
}
console.log(`\n  ${pass}/${total} — the rate has a way in, a way out, and only one implementation.\n`);
