/**
 * Guard: the Leads area (owner bugs #3 and #4, WP21).
 *
 *  1. Budget / guests: the client mirror of the server rule (backend collectLeadFieldErrors requirePositive).
 *     Empty is fine; budget must be > 0 (<= Rs 50 crore); guests a whole number >= 1 (<= 100,000).
 *     The Leads drawer and the redesigned lead dialog both go through lib/lead-numbers.ts, and the drawer
 *     checks BEFORE it sends.
 *  2. Wording: a lead's `status` is called "Status" everywhere in the Leads area (drawer label, list column,
 *     detail card, toasts). The stored values and API field names are untouched ("stage" stays the word for a
 *     booking's order stage and for the internal helper names).
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/lead-numbers-check.mts
 */
import { leadBudgetError, leadGuestsError, leadNumberMessageEn, leadNumberMessageUr, LEAD_MAX_BUDGET, LEAD_MAX_GUESTS } from "../lib/lead-numbers.ts";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

let passed = 0;
const failures: string[] = [];
const check = (name: string, ok: boolean, detail = "") => { if (ok) passed++; else failures.push(`${name}${detail ? "  (" + detail + ")" : ""}`); };
const eq = (name: string, got: unknown, want: unknown) => check(name, got === want, `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

// ── budget ──
eq("budget empty string is fine", leadBudgetError(""), null);
eq("budget undefined is fine", leadBudgetError(undefined), null);
eq("budget null is fine", leadBudgetError(null), null);
eq("budget spaces is fine", leadBudgetError("   "), null);
eq("budget -1 (the owner's screenshot)", leadBudgetError("-1"), "negative");
eq("budget -0.5", leadBudgetError(-0.5), "negative");
eq("budget 0", leadBudgetError("0"), "zero");
eq("budget 0 as a number", leadBudgetError(0), "zero");
eq("budget abc", leadBudgetError("abc"), "not_a_number");
eq("budget 150000", leadBudgetError("150000"), null);
eq("budget 1", leadBudgetError(1), null);
eq("budget at the cap", leadBudgetError(LEAD_MAX_BUDGET), null);
eq("budget over the cap", leadBudgetError(LEAD_MAX_BUDGET + 1), "too_big");

// ── guests ──
eq("guests empty is fine", leadGuestsError(""), null);
eq("guests undefined is fine", leadGuestsError(undefined), null);
eq("guests 249", leadGuestsError("249"), null);
eq("guests 1", leadGuestsError(1), null);
eq("guests 0", leadGuestsError("0"), "zero");
eq("guests -3", leadGuestsError("-3"), "negative");
eq("guests 2.5", leadGuestsError("2.5"), "fraction");
eq("guests abc", leadGuestsError("abc"), "not_a_number");
eq("guests at the cap", leadGuestsError(LEAD_MAX_GUESTS), null);
eq("guests over the cap", leadGuestsError(LEAD_MAX_GUESTS + 1), "too_big");

// ── every refusal has a sentence in both voices ──
for (const f of ["budget", "guests"] as const) {
  for (const e of ["negative", "zero", "not_a_number", "too_big", "fraction"] as const) {
    check(`en sentence ${f}/${e}`, leadNumberMessageEn(f, e).length > 8);
    check(`ur sentence ${f}/${e}`, leadNumberMessageUr(f, e).length > 8);
  }
}

// ── wiring: both forms use the shared rule; the drawer checks before it sends ──
const drawer = src("components/dashboard/mainScreens/leads/artifact/leads-artifact.tsx");
const dialog = src("components/dashboard/mainScreens/leads/redesigned/lead-form-dialog.tsx");
check("drawer imports lib/lead-numbers", drawer.includes('from "@/lib/lead-numbers"'));
check("dialog imports lib/lead-numbers", dialog.includes('from "@/lib/lead-numbers"'));
const iCheck = drawer.indexOf("leadNumberProblem(s,");
const iSend = drawer.indexOf("LeadAPI.create(");
check("drawer validates budget/guests before the create call", iCheck > 0 && iSend > 0 && iCheck < iSend, `check@${iCheck} create@${iSend}`);
check("drawer budget input has min=1", /id="ld-budget"/.test(drawer) && /type="number" min="1" id="ld-budget"/.test(drawer));
check("drawer guests input has min=1", /type="number" min="1" step="1" id="ld-guests"/.test(drawer));
check("drawer does not send an unchecked negative (no bare Number(val(\"ld-budget\")) before the check)", iCheck < drawer.indexOf('Number(val("ld-budget"))'));

// ── wording: "Status", not "Stage", on every lead label the owner can read ──
const detail = src("components/dashboard/mainScreens/leads/artifact/lead-detail-artifact.tsx");
check("drawer field label is Status", drawer.includes('<label class="dlabel">Status</label><select id="ld-status">'));
check("list column header is Status", drawer.includes("<th>Zariya</th><th>Status</th>"));
check("no 'Stage' label left in the Leads drawer/list", !/>\s*Stage\s*</.test(drawer) && !/"Stage[ :]/.test(drawer) && !/`Stage[ :]/.test(drawer));
check("detail stat card is Status", detail.includes("${svg(I.stage)} Status</div>"));
check("detail definition row is Status", detail.includes('<span class="k">Status</span>'));
check("no 'Stage' label left on the lead detail screen", !/>\s*Stage\s*</.test(detail) && !/"Stage[ :]/.test(detail) && !/`Stage[ :]/.test(detail) && !/ · stage:/.test(detail) && !/Stage update/.test(detail));
// the wire contract is untouched: the field is still `status`, the select still posts `ld-status`
check("the drawer still reads #ld-status into `status`", drawer.includes('status: val("ld-status") as LeadStatus'));

if (failures.length) {
  console.error(`lead-numbers-check: ${failures.length} FAILED, ${passed} passed`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log(`lead-numbers-check: all ${passed} checks passed`);
