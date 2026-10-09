/**
 * Guard: the portal keeps NO copy of the plan rules, names a plan in exactly one place, and reads the server's plan
 * refusals the way the server sends them. (docs/PORTAL-ISSUES.md, entry 5.)
 *
 * The rules (which plan includes which feature, how many businesses / staff / halls / photos each plan allows) live
 * once, in the backend's src/utils/planEntitlements.js, and reach the portal as `entitlements` on
 * GET /subscriptions/status. Server-side they are proved by tests/http/planMatrix.http.test.js (every gated route, every
 * plan, every billing state). This half pins what the PORTAL does with them:
 *
 *   1. lib/entitlements.ts no longer has a feature map (it drifted before: three tiers, "Business" / "Growth" names).
 *   2. No other file maps an internal tier to a public plan name; lib/plan-gate.ts planNameOf is the one place.
 *   3. planNameOf maps pro/premium/elite to Basic/Pro/Premium and anything else to "No plan".
 *   4. The real shape of the server's entitlements, and of its two 403 refusals, is read correctly; anything else is
 *      "unknown", which the screens treat as everything open (the server is the one that refuses).
 *   5. A screen that handles the refusal itself claims it, so the global dialog stays quiet; and the dialog's text is not
 *      echoed as a second raw toast.
 *   6. The operations tools (Venue-OS hub, Trade ops, Kitchen prep, Brokers, Inventory, Generator fuel, Halal certs, Drone
 *      NOC, Field capture) are not in the screen-to-feature map: they stay in every paid plan.
 *   7. Every gated screen reads its lock from the shared provider, not from its own copy.
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/plan-entitlements-check.mts
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  planNameOf, parseEntitlements, gateFromError, gateHeadline, gateAdvice, describeUsage,
  claimGate, isGateClaimed, handlePlanRefusal, isPlanGateEcho, onPlanGate, SCREEN_FEATURE, LIMIT_NOUNS,
} from "../lib/plan-gate.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

let failed = 0;
const check = (name: string, fn: () => void | Promise<void>) =>
  Promise.resolve().then(fn).then(() => console.log(`  ok   ${name}`)).catch((e) => { failed++; console.error(`  FAIL ${name}\n       ${e.message}`); });
const ok = (c: unknown, m?: string) => { if (!c) throw new Error(m ?? "expected true"); };
const eq = (a: unknown, b: unknown, m?: string) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m ?? "expected"} ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };

function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    if (["node_modules", ".next", ".git", "e2e", "cypress", "qa", "docs"].includes(f)) continue;
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out); else if (/[.](ts|tsx|js|mjs)$/.test(f)) out.push(p);
  }
  return out;
}

// The real body the server sends (ems-v0-backend entitlementsFor), trimmed.
const serverEntitlements = (enforced: boolean, tier = "pro") => ({
  tier, planName: planNameOf(tier), enforced, endsAt: "2026-11-09T10:00:00.000Z",
  features: {
    analytics: { allowed: true, locked: false, label: "Analytics", requiredPlan: "Basic", requiredTier: "pro" },
    forecasting: { allowed: false, locked: enforced, label: "Forecasting", requiredPlan: "Premium", requiredTier: "elite" },
  },
  limits: {
    businesses: { max: 1, used: 1, label: "businesses", scope: "account", reached: enforced, nextPlan: "Pro" },
    spaces: { max: 3, used: 3, label: "halls and spaces per business", scope: "business", reached: enforced, nextPlan: "Pro", perBusiness: { 7: 3, 8: 1 } },
  },
});

console.log("\nno copy of the rules");
await check("lib/entitlements.ts has no feature map and no tier ranking", () => {
  const src = read("lib/entitlements.ts");
  ok(!/FEATURE_MIN_TIER\s*=/.test(src) && !/TIER_RANK\s*=/.test(src), "the feature map is back");
  ok(!/Business|Growth/.test(src.replace(/\/\*[\s\S]*?\*\//g, "")), "old plan names are back");
});
await check("no file outside lib/plan-gate.ts maps a tier to a plan name", () => {
  const bad: string[] = [];
  const mapping = /(pro|premium|elite)\s*:\s*["'](Basic|Pro|Premium|Business|Growth|Free)["']/;
  for (const dir of ["lib", "components", "app", "context", "hooks"]) {
    for (const f of walk(path.join(ROOT, dir))) {
      const rel = path.relative(ROOT, f).split(path.sep).join("/");
      if (rel === "lib/plan-gate.ts") continue;
      // The business TRUST tiers (newcomer / rising / trusted / premium / elite) are a different concept from subscription plans.
      if (rel === "lib/api/reliability.ts") continue;
      if (mapping.test(readFileSync(f, "utf8"))) bad.push(rel);
    }
  }
  eq(bad, [], "files that keep their own tier-to-name map (use planNameOf from lib/plan-gate.ts)");
});

console.log("\none function names a plan");
await check("pro/premium/elite are Basic/Pro/Premium; anything else is No plan", () => {
  eq(["pro", "premium", "elite", "free", "gold", "", null, undefined].map((t) => planNameOf(t as string)), ["Basic", "Pro", "Premium", "No plan", "No plan", "No plan", "No plan", "No plan"]);
});

console.log("\nreading what the server sends");
await check("the real entitlements parse; limits keep their per-business numbers", () => {
  const e = parseEntitlements(serverEntitlements(true))!;
  ok(e && e.enforced === true && e.planName === "Basic");
  eq(e.features.forecasting, { allowed: false, locked: true, label: "Forecasting", requiredPlan: "Premium", requiredTier: "elite" });
  eq(e.limits.spaces!.perBusiness, { "7": 3, "8": 1 });
  eq(e.limits.businesses!.nextPlan, "Pro");
});
await check("not enforced: nothing locked, nothing reached (the screens render nothing extra)", () => {
  const e = parseEntitlements(serverEntitlements(false))!;
  ok(Object.values(e.features).every((f) => !f!.locked) && Object.values(e.limits).every((l) => !l!.reached));
});
await check("anything that is not the expected shape is unknown (null), never a guess", () => {
  for (const bad of [undefined, null, 0, "x", [], {}, { features: {}, limits: {} }, { enforced: true }, { enforced: "yes", features: {}, limits: {} }]) eq(parseEntitlements(bad), null);
});
await check("usage reads naturally, including an account already over its limit", () => {
  const l = (max: number | null, used: number) => ({ max, used, label: "x", scope: "account" as const, reached: false, nextPlan: null });
  eq(describeUsage(l(4, 3), LIMIT_NOUNS.businesses), "3 of 4 businesses");
  eq(describeUsage(l(1, 1), LIMIT_NOUNS.businesses), "1 of 1 business");
  eq(describeUsage(l(1, 6), LIMIT_NOUNS.businesses), "6 businesses (your plan allows 1)");
  eq(describeUsage(l(null, 5), LIMIT_NOUNS.staff), "5 staff accounts");
});

console.log("\nthe server's two refusals");
const refusal = (data: Record<string, unknown>, message = "msg", status = 403) => ({ response: { status, data: { status: false, message, data } } });
await check("FEATURE_NOT_IN_PLAN", () => {
  const g = gateFromError(refusal({ code: "FEATURE_NOT_IN_PLAN", feature: "automations", featureLabel: "Automations", currentPlan: "Pro", currentTier: "premium", requiredPlan: "Premium", requiredTier: "elite" }, "Automations is available on the Premium plan."))!;
  eq([g.code, g.feature, g.requiredPlan, g.currentPlan], ["FEATURE_NOT_IN_PLAN", "automations", "Premium", "Pro"]);
  eq(gateHeadline(g), "Available on Premium");
  ok(/Premium plan/.test(gateAdvice(g)) && /stays exactly as it is/.test(gateAdvice(g)));
});
await check("LIMIT_REACHED (and the top plan, where the answer is a custom plan)", () => {
  const g = gateFromError(refusal({ code: "LIMIT_REACHED", limit: "businesses", limitLabel: "businesses", max: 1, used: 1, adding: 1, scope: "account", currentPlan: "Basic", requiredPlan: "Pro" }))!;
  eq(gateHeadline(g), "Your Basic plan includes 1 businesses");
  ok(/Upgrade to Pro/.test(gateAdvice(g)));
  const top = gateFromError(refusal({ code: "LIMIT_REACHED", limit: "businesses", limitLabel: "businesses", max: 4, used: 4, currentPlan: "Pro", requiredPlan: null }))!;
  ok(/custom plan/.test(gateAdvice(top)));
});
await check("any other error is not a plan refusal", () => {
  eq(gateFromError(refusal({ code: "SOMETHING_ELSE" })), null);
  eq(gateFromError(refusal({ code: "LIMIT_REACHED" }, "x", 400)), null);
  eq(gateFromError(refusal({ code: "LIMIT_REACHED" }, "x", 500)), null);
  eq(gateFromError(new Error("Network Error")), null);
  eq(gateFromError(null), null);
});

console.log("\nthe global handler");
await check("a refusal is published one macrotask later, after the caller's catch; a claimed one is not prompted", async () => {
  const seen: Array<{ prompt: boolean }> = [];
  const off = onPlanGate((_g, meta) => seen.push({ prompt: meta.prompt }));
  const g = gateFromError(refusal({ code: "LIMIT_REACHED", limit: "staff", max: 2, used: 2 }, "Your Basic plan includes 2 staff accounts."))!;
  const e1 = refusal({ code: "LIMIT_REACHED" });
  handlePlanRefusal(e1, g, { method: "post", silent: false, prompt: true });
  eq(seen.length, 0, "nothing may be published synchronously");
  ok(isPlanGateEcho("Your Basic plan includes 2 staff accounts."), "the dialog's sentence must be recognised as an echo");
  ok(!isPlanGateEcho("Delete nahi hua"), "other toasts must not be swallowed");
  await new Promise((r) => setTimeout(r, 5));
  eq(seen, [{ prompt: true }]);
  const e2 = refusal({ code: "LIMIT_REACHED" });
  handlePlanRefusal(e2, g, { method: "post", silent: false, prompt: true });
  claimGate(e2); ok(isGateClaimed(e2));
  await new Promise((r) => setTimeout(r, 5));
  eq(seen[1], { prompt: false }, "a screen that shows the refusal itself keeps the dialog quiet");
  ok(!isPlanGateEcho("Your Basic plan includes 2 staff accounts."), "a claimed refusal must not swallow the screen's own toast");
  off();
});
await check("a silent or read refusal never arms the toast filter", async () => {
  const g = gateFromError(refusal({ code: "FEATURE_NOT_IN_PLAN", feature: "forecasting" }, "Forecasting is available on the Premium plan."))!;
  handlePlanRefusal(refusal({}), g, { method: "get", silent: false, prompt: false });
  await new Promise((r) => setTimeout(r, 5));
  ok(!isPlanGateEcho("Forecasting is available on the Premium plan."));
});

console.log("\nwhich screens are locked");
await check("the operations tools are not in the screen-to-feature map (they stay in every paid plan)", () => {
  const tools = ["venue-os", "trade-ops", "kitchen-prep", "brokers", "inventory", "generator-fuel", "halal-certs", "drone-noc", "field"];
  eq(Object.keys(SCREEN_FEATURE).filter((r) => tools.some((t) => r === `/dashboard/${t}`)), []);
});
await check("the sidebar, the axios layer and the dashboard layout are wired to the shared provider", () => {
  ok(/SCREEN_FEATURE/.test(read("components/dashboard/layout/champagne-sidebar.tsx")) && /PlanLockChip/.test(read("components/dashboard/layout/champagne-sidebar.tsx")), "sidebar lock chips");
  ok(/handlePlanRefusal/.test(read("lib/axiosConfig.js")), "axios layer");
  ok(/<PlanProvider>/.test(read("app/(dashboard)/dashboard/layout.tsx")), "PlanProvider mounted");
  ok(/isPlanGateEcho/.test(read("components/ui/use-toast.ts")), "shadcn toast echo guard");
});
await check("every screen that locks a feature or shows a meter reads it from usePlan / useFeature, never a local rule", () => {
  const screens = [
    "components/dashboard/mainScreens/staff/artifact/staff-artifact.tsx",
    "components/dashboard/mainScreens/venue-os/artifact/spaces-artifact.tsx",
    "components/dashboard/mainScreens/pdcs/artifact/pdcs-artifact.tsx",
    "components/dashboard/mainScreens/automation/artifact/automation-artifact.tsx",
    "components/dashboard/mainScreens/insights/artifact/reports-artifact.tsx",
    "components/dashboard/mainScreens/billing/artifact/billing-artifact.tsx",
    "components/dashboard/mainScreens/businessSettings/redesigned/images-manager.tsx",
    "components/dashboard/shared/whatsapp-quick-send.tsx",
    "components/dashboard/mainScreens/function-sheets/redesigned/function-sheet-detail-redesigned-view.tsx",
  ];
  const bad = screens.filter((s) => !/usePlan\(|useFeature\(|useScreenLock\(/.test(read(s)));
  eq(bad, [], "screens that no longer ask the provider");
});

if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1); }
console.log("\nall plan-entitlement checks passed");
