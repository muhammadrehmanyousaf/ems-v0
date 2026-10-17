/**
 * Guard: the plans WALL. (PLANS-SPEC R2, PL-C.)
 *
 * What it pins, so the lock screen can not quietly stop covering something:
 *
 *   1. COVERAGE. Every route under app/(dashboard) is rendered inside <AccessGate> (one layout, deny by default), the staff
 *      app and the floor app are gated the same way, and the list of routes that stay open while locked is exactly the
 *      three it is meant to be. A route group added later next to `dashboard`, or a layout that stops wrapping, fails here.
 *   2. ONE 402 PATH. Every HTTP client turns 402 SUBSCRIPTION_REQUIRED into state through noteLock(), and only the status
 *      sync and that function write the access store.
 *   3. NO LOCAL PLAN LOGIC. The gate, the Wall and the Wall model do no date or tier arithmetic: they read the server's
 *      state. Nothing outside lib/plans decides what "locked" means.
 *   4. COPY. Every key has English and Roman Urdu with the same {placeholders}; every key used in the source exists; and
 *      nothing the vendor reads promises a free vendor plan.
 *   5. BEHAVIOUR. wallModel / bannerFor / chipFor / the store / the parsers, run for every state: staff never get a pay
 *      button, a suspended account never gets a renew button, the trial countdown says the right thing on every day, a
 *      figure the server did not send is "not available" and never 0.
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/plans-wall-check.mts
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  ACCESS_STATES, LOCKED_STATES, isLockedState, parseAccess, accessFromStatus, lockFromError, legacyAccessWord,
  fmtPkDate, fmtPkDateTime, fmtPkDateTimeRu, daysUntilPk, type Access, type AccessStateKey,
} from "../lib/plans/access.ts";
import { COPY, fill, say, firstFilled, placeholdersOf, type CopyKey } from "../lib/plans/copy.ts";
import { wallModel, wallVars } from "../lib/plans/wall-model.ts";
import { bannerFor, chipFor } from "../lib/plans/banners.ts";
import { useAccessStore, noteLock } from "../lib/plans/access-store.ts";
import { readAvailabilityNotice, venueUnavailableFromError, handleVenueUnavailable, claimVenueUnavailable, onVenueUnavailable } from "../lib/plans/venue-availability.ts";
import { parseObligations, parseManualPayment, parseLiveVenues } from "../lib/plans/billing-shapes.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");
const exists = (rel: string) => existsSync(path.join(ROOT, rel));

let failed = 0;
const check = (name: string, fn: () => void | Promise<void>) =>
  Promise.resolve().then(fn).then(() => console.log(`  ok   ${name}`)).catch((e) => { failed++; console.error(`  FAIL ${name}\n       ${e.message}`); });
const ok = (c: unknown, m?: string) => { if (!c) throw new Error(m ?? "expected true"); };
const eq = (a: unknown, b: unknown, m?: string) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m ?? "expected"} ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };

function walk(dir: string, out: string[] = [], skip: string[] = ["node_modules", ".next", ".git", "e2e", "cypress", "qa", "docs"]): string[] {
  for (const f of readdirSync(dir)) {
    if (skip.includes(f)) continue;
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out, skip); else if (/[.](ts|tsx|js|mjs|mts)$/.test(f)) out.push(p);
  }
  return out;
}
const rel = (f: string) => path.relative(ROOT, f).split(path.sep).join("/");
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

/* ───────────────────────── fixtures ───────────────────────── */
const A = (state: AccessStateKey, o: Partial<Access> = {}): Access => ({
  state, plan: "premium", planName: "Pro", trialEndsAt: null, graceEndsAt: null, endsAt: null, lockedAt: null, retainUntil: null, lockReason: null,
  canPay: true, canStartTrial: false, renewUrl: null, daysLeft: null, staff: false, ownerMasked: null, source: "status", ...o,
});
// 23:59:59 Asia/Karachi = 18:59:59Z
const PKT_EOD = (ymd: string) => `${ymd}T18:59:59.000Z`;
const NOW = new Date("2026-10-17T07:00:00.000Z"); // 12:00 PKT on 17 Oct

/* ═════════════════════════ 1. coverage ═════════════════════════ */
console.log("\ncoverage: no console route renders without the Wall");
await check("app/(dashboard) holds exactly one route group, `dashboard`, so one layout covers every console route", () => {
  const top = readdirSync(path.join(ROOT, "app/(dashboard)")).sort();
  eq(top, ["dashboard"], "a sibling of `dashboard` would have its own layout and no Wall");
});
await check("the dashboard layout wraps the console chrome and every page in <AccessGate>, and feeds the store with <AccessSync>", () => {
  const src = read("app/(dashboard)/dashboard/layout.tsx");
  const open = src.indexOf("<AccessGate>"), chrome = src.indexOf("<DashboardChrome>"), close = src.indexOf("</AccessGate>");
  ok(open > 0 && chrome > open && close > chrome, "AccessGate must open before DashboardChrome and close after it");
  ok(/<AccessSync\s*\/>/.test(src), "AccessSync (status -> store) must be mounted");
  ok(/\{children\}/.test(src.slice(chrome, close)), "children must be inside the gate");
});
await check("no other layout under app/(dashboard) can sit outside the gate (nested layouts are children of the gated one)", () => {
  const layouts = walk(path.join(ROOT, "app/(dashboard)")).map(rel).filter((f) => /\/layout\.tsx$/.test(f));
  eq(layouts.filter((f) => f !== "app/(dashboard)/dashboard/layout.tsx").filter((f) => !f.startsWith("app/(dashboard)/dashboard/")), []);
});
await check("the old 'Choose a plan' wall and BillingGate are gone, and nothing imports them", () => {
  ok(!exists("components/dashboard/billing/billing-gate.tsx"), "billing-gate.tsx is back");
  const bad = walk(ROOT).map(rel).filter((f) => f !== "scripts/plans-wall-check.mts" && /\b(BillingGate|PlanWall)\b/.test(stripComments(read(f))));
  eq(bad, [], "files still using BillingGate / PlanWall");
});
await check("the staff app and the floor app (outside the dashboard layout) are behind the same gate", () => {
  for (const f of ["app/staff/layout.tsx", "app/floor/layout.tsx"]) {
    const src = read(f);
    ok(/<AccessGate>[\s\S]*\{children\}[\s\S]*<\/AccessGate>/.test(src), `${f} must render children inside <AccessGate>`);
  }
});
await check("the routes that stay open while locked are exactly: billing, account, add-a-business, staff sign-in", () => {
  const src = read("components/dashboard/plans/access-gate.tsx");
  const m = /WALL_EXEMPT_PREFIXES[^=]*=\s*\[([\s\S]*?)\]/.exec(src);
  ok(m, "WALL_EXEMPT_PREFIXES not found");
  const list = [...m![1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  eq(list, ["/dashboard/billing", "/dashboard/profile", "/dashboard/business/new", "/staff/login"]);
});
await check("the Wall (not a local copy) is the only thing the gate renders instead of the console", () => {
  const users = walk(ROOT).map(rel).filter((f) => f !== "scripts/plans-wall-check.mts" && /<AccessWall\b/.test(read(f)) && !/^components\/dashboard\/plans\/wall\/access-wall\.tsx$/.test(f));
  eq(users, ["components/dashboard/plans/access-gate.tsx"]);
});

/* ═════════════════════════ 2. one 402 path ═════════════════════════ */
console.log("\none 402 path");
await check("both HTTP clients (vendor axios, staff axios) turn a 402 into state through noteLock()", () => {
  ok(/noteLock\(error\)/.test(read("lib/axiosConfig.js")), "lib/axiosConfig.js");
  ok(/noteLock\(error, \{ staff: true \}\)/.test(read("lib/api/staffPortal.ts")), "lib/api/staffPortal.ts");
});
await check("only noteLock and the status sync write the access store; nobody else reads a raw 402", () => {
  const writers = walk(ROOT).map(rel).filter((f) => /\.(applyLock|applyStatus)\(/.test(stripComments(read(f))) && f !== "scripts/plans-wall-check.mts");
  eq(writers.sort(), ["components/dashboard/plans/access-sync.tsx", "lib/plans/access-store.ts"].sort());
  const raw402 = walk(ROOT).map(rel).filter((f) => /status\s*(===?|!==?)\s*402\b/.test(stripComments(read(f))) && f !== "scripts/plans-wall-check.mts");
  eq(raw402, ["lib/plans/access.ts"], "a file that handles 402 on its own");
});
await check("the billing status reader keeps `access` as the old one-word string and moves the new object to accessContext", () => {
  const src = read("lib/api/subscription.ts");
  ok(/accessContext/.test(src) && /legacyAccessWord\(ctx\.state\)/.test(src));
});

/* ═════════════════════════ 3. no local plan logic ═════════════════════════ */
console.log("\nno local plan logic");
await check("the gate, the Wall and the Wall model do no date or tier arithmetic (they read the server's state)", () => {
  const files = ["components/dashboard/plans/access-gate.tsx", "components/dashboard/plans/wall/access-wall.tsx", "lib/plans/wall-model.ts"];
  const bad: string[] = [];
  for (const f of files) {
    const src = stripComments(read(f));
    if (/new Date\(|Date\.now\(/.test(src)) bad.push(`${f}: date arithmetic`);
    if (/["'](pro|premium|elite|free)["']/.test(src)) bad.push(`${f}: a tier literal`);
    if (/(subscriptionEndsAt|trialEndsAt|graceEndsAt)\s*(<|>)/.test(src)) bad.push(`${f}: compares an end date`);
  }
  eq(bad, []);
});
await check("what 'locked' means is defined once: LOCKED_STATES lives in lib/plans/access.ts and nothing else lists the states", () => {
  const holders = walk(ROOT).map(rel).filter((f) => /["']suspended_admin["']/.test(stripComments(read(f))) && f !== "scripts/plans-wall-check.mts");
  eq(holders.sort(), ["lib/plans/access.ts", "lib/plans/wall-model.ts"].sort());
});
await check("the billing screen offers a trial button only when the server's access object says canStartTrial", () => {
  const src = read("components/dashboard/mainScreens/billing/artifact/billing-artifact.tsx");
  ok(/ctx\.canStartTrial\s*&&/.test(src), "the trial button must be behind ctx.canStartTrial");
  ok(!/d\.trialEligible/.test(src), "d.trialEligible must not decide the trial button any more");
  ok(!/planNameOf\("free"\)/.test(src), "the comparison table must not draw a free column");
});

/* ═════════════════════════ 4. copy ═════════════════════════ */
console.log("\ncopy");
const KEYS = Object.keys(COPY) as CopyKey[];
const SAME_IN_BOTH = new Set<string>(["chip.comp", "wall.link.receipts", "wall.link.account", "wall.link.logout", "wall.lang.both", "wall.lang.en", "wall.lang.ru", "wall.staff.owner"]);
await check(`every key (${KEYS.length}) has English and Roman Urdu, non-empty, and a Roman Urdu line that is not the English one`, () => {
  const bad: string[] = [];
  for (const k of KEYS) {
    const c = COPY[k] as { en: string; ru: string };
    if (!c.en?.trim() || !c.ru?.trim()) bad.push(`${k}: empty`);
    else if (c.en === c.ru && !SAME_IN_BOTH.has(k)) bad.push(`${k}: Roman Urdu is the English text`);
    if (/[؀-ۿ]/.test(c.ru)) bad.push(`${k}: Urdu script (the product uses Roman Urdu)`);
  }
  eq(bad, []);
});
await check("both languages use the same {placeholders}", () => {
  const bad = KEYS.filter((k) => { const c = COPY[k] as { en: string; ru: string }; return JSON.stringify(placeholdersOf(c.en).sort()) !== JSON.stringify(placeholdersOf(c.ru).sort()); });
  eq(bad, []);
});
await check("every plan-copy key used in the source exists in the table (no typo renders a hole)", () => {
  const re = /["']((?:wall|obl|export|trial|past_due|cancelling|comp|banner|chip|bill|manual|over|cust)\.[a-z0-9_]+(?:\.[a-z0-9_]+)?)["']/g;
  const used = new Map<string, string>();
  const dirs = ["components", "lib", "app", "hooks"];
  for (const d of dirs) for (const f of walk(path.join(ROOT, d))) {
    const src = stripComments(readFileSync(f, "utf8"));
    for (const m of src.matchAll(re)) if (!(m[1] in COPY) && /(say|fill|firstFilled|bi|COPY)\b|keys:|label=|Key\b/.test(src.slice(Math.max(0, (m.index ?? 0) - 60), (m.index ?? 0) + 5))) used.set(m[1], rel(f));
  }
  eq([...used.entries()], [], "copy keys used but missing from lib/plans/copy.ts");
});
await check("fill() never prints a hole: a missing value makes the sentence unavailable, and the ladder falls back to the one without it", () => {
  eq(fill("wall.safe", "en", {}), null);
  eq(fill("wall.safe", "en", { retainUntil: "14 January 2027" }), "Your data is safe. Nothing has been deleted. We keep everything until 14 January 2027.");
  eq(firstFilled(["wall.safe", "wall.safe_nodate"], "en", {}), "Your data is safe. Nothing has been deleted.");
  eq(firstFilled(["past_due.banner", "past_due.banner_nodate"], "ru", {}), "Aap ki payment nahi ho saki. Dashboard khula rakhne ke liye jald theek kar lein.");
  ok(!/undefined|null|\{|\}/.test(say("wall.plan_ended.body", "en", { planName: "Pro" })), "say() must not leave placeholders or 'undefined'");
});
await check("nothing a vendor reads promises a free vendor plan (the lines that say there is none are the only ones that mention it)", () => {
  const promise = /\bfree (vendor )?(plan|tier)\b|\bfree (listing|profile)\b|free, full-featured|list(ing)? for free/i;
  const bad: string[] = [];
  for (const k of KEYS) for (const l of ["en", "ru"] as const) {
    const t = (COPY[k] as { en: string; ru: string })[l];
    if (promise.test(t) && !/\bno free\b|\bkoi free\b|\bnahi\b/i.test(t)) bad.push(`${k}.${l}`);
  }
  for (const f of [...walk(path.join(ROOT, "app")), ...walk(path.join(ROOT, "components"))]) {
    const r = rel(f);
    if (r.startsWith("components/dashboard/mainScreens/") || /VendorStepForms/.test(r) || /\.test\./.test(r)) continue;
    const src = stripComments(readFileSync(f, "utf8"));
    for (const m of src.matchAll(/["'`]([^"'`\n]{0,120})["'`]/g)) {
      const s = m[1];
      if (/free listing|free profile|free, full-featured|free vendor (plan|tier)|free (plan|tier) for vendors/i.test(s) && !/\bno free\b|\bthere is no\b|\bnot a free\b/i.test(s)) bad.push(`${r}: "${s.slice(0, 70)}"`);
    }
  }
  eq(bad, []);
});

/* ═════════════════════════ 5. behaviour ═════════════════════════ */
console.log("\nreading what the server sends");
await check("the access object parses; an unknown state is unknown (null), never a guessed lock", () => {
  const a = parseAccess({ state: "locked", plan: "premium", planName: "Pro", lockedAt: "2026-10-16T18:59:59.000Z", retainUntil: "2027-01-14T18:59:59.000Z", lockReason: "trial_ended", canPay: true, canStartTrial: false, renewUrl: "/dashboard/billing?renew=1", daysLeft: null })!;
  eq([a.state, a.planName, a.lockReason, a.canPay, a.staff, a.source], ["locked", "Pro", "trial_ended", true, false, "status"]);
  for (const bad of [null, undefined, 0, "locked", [], {}, { state: "weird" }, { plan: "pro" }]) eq(parseAccess(bad), null);
});
await check("all nine states are known, and exactly four of them are locked", () => {
  eq([...ACCESS_STATES].sort(), ["active", "cancelling", "closed", "comp", "dormant", "locked", "past_due", "suspended_admin", "trialing"]);
  eq([...LOCKED_STATES].sort(), ["closed", "dormant", "locked", "suspended_admin"]);
  eq(ACCESS_STATES.filter(isLockedState).length, 4);
  eq(legacyAccessWord("trialing") + legacyAccessWord("comp") + legacyAccessWord("cancelling"), "activeactiveactive");
  eq([legacyAccessWord("past_due"), legacyAccessWord("locked"), legacyAccessWord("closed")], ["past_due", "none", "none"]);
});
await check("accessFromStatus: the object under `access`, the object under `accessContext`, and the legacy one-word string", () => {
  eq(accessFromStatus({ access: { state: "trialing", trialEndsAt: PKT_EOD("2026-11-04"), daysLeft: 18 }, subscriptionEndsAt: PKT_EOD("2026-11-04") })!.state, "trialing");
  eq(accessFromStatus({ access: "active", accessContext: { state: "past_due", graceEndsAt: PKT_EOD("2026-10-22") } })!.state, "past_due");
  const legacyLocked = accessFromStatus({ access: "none", enforced: true, tier: "free", subscription: null })!;
  eq([legacyLocked.state, legacyLocked.source, legacyLocked.lockReason], ["locked", "legacy", "no_plan"]);
  eq(accessFromStatus({ access: "none", enforced: false, tier: "free", subscription: null })!.state, "active", "not enforced: nothing is locked");
  eq(accessFromStatus({ access: "active", enforced: true, tier: "premium", subscription: { status: "trialing", trialEndsAt: PKT_EOD("2026-11-04") } })!.state, "trialing");
  eq(accessFromStatus({ access: "active", enforced: true, tier: "premium", subscription: { status: "cancelled" } })!.state, "cancelling");
  eq(accessFromStatus({ access: "past_due", enforced: true, tier: "pro" })!.state, "past_due");
  eq(accessFromStatus(null), null);
  eq(accessFromStatus({}), null);
  eq(accessFromStatus({ access: { state: "cancelling" }, subscriptionEndsAt: "2026-11-01T00:00:00.000Z" })!.endsAt, "2026-11-01T00:00:00.000Z", "the status' own end date fills a missing endsAt");
});
const e402 = (data: Record<string, unknown>, status = 402) => ({ response: { status, data: { status: false, message: "Your plan has ended", data } } });
await check("a 402 SUBSCRIPTION_REQUIRED is a lock; any other 402 / 403 / 409 is not; staff and suspended can not pay", () => {
  const l = lockFromError(e402({ code: "SUBSCRIPTION_REQUIRED", state: "locked", lockReason: "plan_ended", lockedSince: "2026-10-16T18:59:59.000Z", retainUntil: "2027-01-14T18:59:59.000Z", renewUrl: "/dashboard/billing" }))!;
  eq([l.state, l.lockedAt, l.canPay, l.staff, l.source], ["locked", "2026-10-16T18:59:59.000Z", true, false, "402"]);
  eq(lockFromError(e402({ code: "SUBSCRIPTION_REQUIRED" }))!.state, "locked", "a 402 with no state still means locked");
  eq(lockFromError(e402({ code: "SUBSCRIPTION_REQUIRED", state: "suspended_admin" }))!.canPay, false);
  const s = lockFromError(e402({ code: "SUBSCRIPTION_REQUIRED", state: "locked", staff: true, ownerMasked: "+92 3** *** *20" }))!;
  eq([s.staff, s.canPay, s.ownerMasked], [true, false, "+92 3** *** *20"]);
  eq(lockFromError(e402({ code: "PAYMENT_REQUIRED" })), null);
  eq(lockFromError(e402({ code: "SUBSCRIPTION_REQUIRED" }, 403)), null);
  eq(lockFromError(e402({ code: "SUBSCRIPTION_REQUIRED" }, 409)), null);
  eq(lockFromError(new Error("Network Error")), null);
  eq(lockFromError(null), null);
});

console.log("\nthe access store");
await check("a lock from a request opens the Wall; a stale 'open' status right after it is ignored, a later one unlocks", () => {
  const st = useAccessStore;
  st.getState().reset();
  const realNow = Date.now; let t = 1_000_000;
  Date.now = () => t;
  try {
    noteLock(e402({ code: "SUBSCRIPTION_REQUIRED", state: "locked", lockReason: "plan_ended" }));
    ok(isLockedState(st.getState().access?.state), "locked after the 402");
    st.getState().applyStatus(A("active"));
    ok(isLockedState(st.getState().access?.state), "an open status 2 seconds after a 402 is a stale cache, not an unlock");
    t += 20_000;
    st.getState().applyStatus(A("active"));
    eq(st.getState().access?.state, "active", "a status 20 s later is the truth");
    st.getState().applyStatus(A("locked", { lockReason: "plan_ended" }));
    eq(st.getState().access?.state, "locked", "a locked status always applies at once");
    st.getState().applyStatus(null);
    eq(st.getState().access?.state, "locked", "an unreadable status changes nothing");
  } finally { Date.now = realNow; st.getState().reset(); }
});
await check("noteLock marks staff clients as staff and unable to pay; releaseLock forgets a request lock; reset forgets everything", () => {
  const st = useAccessStore;
  st.getState().reset();
  const a = noteLock(e402({ code: "SUBSCRIPTION_REQUIRED", state: "locked", ownerMasked: "+92 3** *** *20" }), { staff: true })!;
  eq([a.staff, a.canPay], [true, false]);
  st.getState().releaseLock();
  eq(st.getState().access, null);
  st.getState().applyStatus(A("trialing", { trialEndsAt: PKT_EOD("2026-11-04") }));
  st.getState().releaseLock();
  eq(st.getState().access?.state, "trialing", "releaseLock must not erase a status-sourced state");
  st.getState().reset();
  eq(st.getState().access, null);
  eq(noteLock(new Error("x")), null);
});

console.log("\nthe Wall model");
await check("the staff variant has no pay button, no money, no obligations; it shows the owner's masked phone", () => {
  for (const reason of ["trial_ended", "plan_ended", "payment_failed", "cancelled", null]) {
    const m = wallModel(A("locked", { staff: true, canPay: false, lockReason: reason as string | null, ownerMasked: "+92 3** *** *20" }));
    eq([m.variant, m.cta, m.manual, m.owner, m.safe, m.missed], ["staff", "none", false, false, false, false], `staff, reason ${reason}`);
  }
  eq(wallVars(A("locked", { staff: true, ownerMasked: "+92 3** *** *20" })).owner, "+92 3** *** *20");
});
await check("a suspended account has no renew button and leads with support; a closed one too", () => {
  const s = wallModel(A("suspended_admin", { canPay: false }));
  eq([s.variant, s.cta, s.manual, s.supportFirst, s.missed, s.onHold], ["suspended", "none", false, true, false, true]);
  const c = wallModel(A("closed"));
  eq([c.variant, c.supportFirst], ["closed", true]);
});
await check("every locked state and reason picks the right sentence and the right button", () => {
  const w = (state: AccessStateKey, reason: string | null, o: Partial<Access> = {}) => wallModel(A(state, { lockReason: reason, ...o }));
  eq([w("locked", "trial_ended").variant, w("locked", "trial_ended").cta], ["trial_ended", "choose"]);
  eq([w("locked", "plan_ended").variant, w("locked", "plan_ended").cta], ["plan_ended", "renew"]);
  eq([w("locked", "payment_failed").variant, w("locked", "payment_failed").cta], ["payment_failed", "renew"]);
  eq([w("locked", "cancelled").variant, w("locked", "cancelled").cta], ["cancelled", "renew"]);
  eq([w("dormant", "plan_ended").variant, w("dormant", "plan_ended").cta], ["dormant", "renew"]);
  eq([w("locked", "no_plan", { plan: null, planName: null }).variant, w("locked", "no_plan", { plan: null, planName: null }).cta], ["no_plan", "choose"]);
  eq(w("locked", "something_new").variant, "plan_ended", "a reason this build does not know still gets a true sentence");
  eq(w("locked", "plan_ended", { planName: null, plan: null }).cta, "choose", "no known plan: choose, never 'Renew null'");
  for (const reason of ["trial_ended", "plan_ended", "payment_failed", "cancelled"]) eq(w("locked", reason, { canPay: false }).cta, "none", `canPay false, ${reason}`);
  ok(ACCESS_STATES.filter(isLockedState).every((s) => wallModel(A(s)).safe), "every locked owner state says the data is safe");
});
await check("the Wall's sentences fill with real values and never invent a date", () => {
  const a = A("locked", { lockReason: "plan_ended", lockedAt: PKT_EOD("2026-10-16"), retainUntil: PKT_EOD("2027-01-14") });
  const m = wallModel(a), v = wallVars(a);
  eq(firstFilled(m.body, "en", v), "Your Pro plan ended on 16 October 2026. Renew to open your dashboard. Everything comes back exactly as you left it.");
  eq(firstFilled(["wall.safe", "wall.safe_nodate"], "ru", v), "Aap ka data mehfooz hai. Kuch delete nahi hua. Hum sab kuch 14 January 2027 tak rakhte hain.");
  const bare = wallVars(A("locked", { lockReason: "plan_ended" }));
  eq(firstFilled(m.body, "en", bare), "Your Pro plan has ended. Renew to open your dashboard. Everything comes back exactly as you left it.", "no lockedAt: the dateless sentence");
  eq(firstFilled(["wall.safe", "wall.safe_nodate"], "en", bare), "Your data is safe. Nothing has been deleted.", "no retainUntil: no invented date");
});

console.log("\ndates are Pakistan time, to the minute");
await check("a trial ending 23:59:59 PKT reads 11:59 PM, in English and in Roman Urdu; the PKT day changes at 19:00 UTC", () => {
  eq(fmtPkDateTime(PKT_EOD("2026-11-04")), "4 November 2026, 11:59 PM");
  eq(fmtPkDateTimeRu(PKT_EOD("2026-11-04")), "4 November 2026, raat 11:59 baje");
  eq(fmtPkDate("2026-11-04T19:00:00.000Z"), "5 November 2026");
  eq(fmtPkDateTime("2026-10-17T07:00:00.000Z"), "17 October 2026, 12:00 PM");
  eq(fmtPkDateTimeRu("2026-10-17T07:00:00.000Z"), "17 October 2026, dopahar 12:00 baje");
  eq(fmtPkDate(null) + fmtPkDate("not a date"), "");
  eq(daysUntilPk(PKT_EOD("2026-10-17"), NOW), 0);
  eq(daysUntilPk(PKT_EOD("2026-10-18"), NOW), 1);
  eq(daysUntilPk(PKT_EOD("2026-10-24"), NOW), 7);
  eq(daysUntilPk(PKT_EOD("2026-10-16"), NOW), -1);
  eq(daysUntilPk("2026-10-17T18:59:59.000Z", new Date("2026-10-17T18:59:58.000Z")), 0);
  eq(daysUntilPk("2026-10-18T18:59:59.000Z", new Date("2026-10-17T19:00:01.000Z")), 0, "after 19:00 UTC it is already the next PKT day");
});

console.log("\nbanners and the chip");
await check("trial: welcome once, quiet until 7 days, then 7 / 3 / 1 / today, each with the exact date and time", () => {
  const trial = (days: number) => A("trialing", { trialEndsAt: PKT_EOD(`2026-10-${String(17 + days).padStart(2, "0")}`), daysLeft: days });
  const kind = (days: number, o = {}) => bannerFor(trial(days), NOW, o)?.kind ?? null;
  eq(kind(29), "trial_welcome");
  eq(kind(29, { welcomeSeen: true }), null);
  eq([8, 9, 14, 20].map((d) => kind(d, { welcomeSeen: true })), [null, null, null, null], "no banner between day 8 and the welcome");
  eq([7, 6, 5, 4].map((d) => kind(d, { welcomeSeen: true })), ["trial_t7", "trial_t7", "trial_t7", "trial_t7"]);
  eq([3, 2].map((d) => kind(d, { welcomeSeen: true })), ["trial_t3", "trial_t3"]);
  eq(kind(1, { welcomeSeen: true }), "trial_t1");
  eq(kind(0, { welcomeSeen: true }), "trial_today");
  const b = bannerFor(trial(3), NOW, {})!;
  ok(/^3 days left\. After 20 October 2026, 11:59 PM your dashboard locks\. Your data stays safe\.$/.test(firstFilled(b.keys, "en", b.vars("en"))), firstFilled(b.keys, "en", b.vars("en")));
  ok(/20 October 2026, raat 11:59 baje/.test(firstFilled(b.keys, "ru", b.vars("ru"))));
  eq([bannerFor(trial(1), NOW, {})!.dismiss, bannerFor(trial(0), NOW, {})!.dismiss, bannerFor(trial(7), NOW, {})!.dismiss, bannerFor(trial(29), NOW, {})!.dismiss], [null, null, "day", "once"], "the last two days can not be dismissed");
  eq(bannerFor(A("trialing", { trialEndsAt: PKT_EOD("2026-10-20") }), NOW, { welcomeSeen: true })!.kind, "trial_t3", "no server daysLeft: counted on the Pakistan calendar");
});
await check("past due is red with the exact grace end and a Pay now button; cancelling says when access ends; comp warns in its last week", () => {
  const p = bannerFor(A("past_due", { graceEndsAt: PKT_EOD("2026-10-22") }), NOW)!;
  eq([p.kind, p.tone, p.cta, p.dismiss], ["past_due", "bad", "pay", null]);
  eq(firstFilled(p.keys, "en", p.vars("en")), "Your payment didn't go through. Fix it by 22 October 2026, 11:59 PM to keep your dashboard open.");
  eq(firstFilled(bannerFor(A("past_due"), NOW)!.keys, "en", {}), "Your payment didn't go through. Fix it soon to keep your dashboard open.", "no date: no invented one");
  eq(bannerFor(A("past_due", { canPay: false }), NOW)!.cta, null);
  const c = bannerFor(A("cancelling", { endsAt: PKT_EOD("2026-11-01") }), NOW)!;
  eq([c.kind, c.cta], ["cancelling", "resume"]);
  ok(/1 November 2026/.test(firstFilled(c.keys, "en", c.vars("en"))));
  eq(bannerFor(A("comp", { endsAt: PKT_EOD("2026-10-30") }), NOW), null);
  eq(bannerFor(A("comp", { endsAt: PKT_EOD("2026-10-22") }), NOW)!.kind, "comp_end");
  eq(bannerFor(A("active"), NOW), null, "a healthy paid plan says nothing");
});
await check("no banner for staff; on the billing page a locked account is described by the page itself; welcome-back after a lock; over the limit last", () => {
  eq(bannerFor(A("locked", { staff: true }), NOW), null);
  eq(bannerFor(A("locked"), NOW, { onPaymentPage: true }), null);
  eq(bannerFor(A("locked"), NOW, {})!.kind, "locked_here");
  eq(bannerFor(A("active"), NOW, { wasLocked: true })!.kind, "reactivated");
  eq(bannerFor(A("active"), NOW, { overLimit: true })!.kind, "over_limit");
  eq(bannerFor(A("past_due"), NOW, { overLimit: true })!.kind, "past_due", "a payment problem outranks the limit note");
  eq(bannerFor(A("active"), NOW, { overLimit: true, onPaymentPage: true }), null, "the billing page shows its own over-limit card");
  eq(bannerFor(null, NOW), null);
});
await check("the chip: trial days, today, past due, cancelling; nothing for a healthy plan, for staff or for a locked account", () => {
  const key = (a: Access | null) => chipFor(a, NOW)?.key ?? null;
  eq(key(A("trialing", { daysLeft: 18, trialEndsAt: PKT_EOD("2026-11-04") })), "chip.trial");
  eq(chipFor(A("trialing", { daysLeft: 18 }), NOW)!.vars, { days: 18 });
  eq(key(A("trialing", { daysLeft: 1 })), "chip.trial_1");
  eq(key(A("trialing", { daysLeft: 0 })), "chip.trial_0");
  eq(key(A("trialing", {})), "chip.trial_nodays");
  eq(chipFor(A("trialing", { daysLeft: 2 }), NOW)!.tone, "warn");
  eq([key(A("past_due")), key(A("cancelling", { endsAt: PKT_EOD("2026-11-01") })), key(A("comp"))], ["chip.past_due", "chip.cancelling", "chip.comp"]);
  eq([key(A("active")), key(A("locked")), key(A("trialing", { staff: true })), key(null)], [null, null, null, null]);
});

console.log("\nthe numbers the Wall shows");
await check("obligations: a figure the server did not send is null (shown 'not available'), never 0; an empty answer is no answer", () => {
  const o = parseObligations({ confirmedEventsNext60: 4, nextEvent: { date: PKT_EOD("2026-10-26"), slotLabel: "Evening", hall: "Grand Hall" }, totalToCollect: 1850000, chequesDue14d: 2, enquiriesWhileLocked: 12 })!;
  eq([o.confirmedEventsNext60, o.totalToCollect, o.chequesDue14d, o.enquiriesWhileLocked, o.nextEvent!.hall], [4, 1850000, 2, 12, "Grand Hall"]);
  const partial = parseObligations({ confirmedEventsNext60: 0, nextEvent: null })!;
  eq([partial.confirmedEventsNext60, partial.totalToCollect, partial.chequesDue14d, partial.enquiriesWhileLocked, partial.nextEvent], [0, null, null, null, null]);
  eq(parseObligations({ obligations: { totalToCollect: "1200" } })!.totalToCollect, 1200);
  for (const bad of [null, undefined, 3, "x", [], {}, { nothing: 1 }]) eq(parseObligations(bad), null);
});
await check("manual payment: bank / JazzCash / Easypaisa details and the three proof states; an unknown shape is not an offer", () => {
  const m = parseManualPayment({ enabled: true, methods: [{ key: "bank", label: "Bank transfer", accountTitle: "WeddingWala", accountNumber: "PK36 X" }, { key: "cash", label: "Cash" }, { key: "jazzcash", accountNumber: "0300 1234567" }], current: { status: "pending", tier: "premium", method: "jazzcash", amountPkr: 5000, submittedAt: "2026-10-17T05:00:00.000Z" } })!;
  eq([m.enabled, m.methods.map((x) => x.key), m.current!.status, m.current!.amountPkr], [true, ["bank", "jazzcash"], "pending", 5000]);
  eq(parseManualPayment({ enabled: true, methods: [] })!.enabled, false, "enabled with no account to pay to is not an offer");
  eq(parseManualPayment({ enabled: true, methods: [{ key: "bank" }], current: { status: "weird" } })!.current, null);
  eq(parseManualPayment(null), null);
});
await check("live venues: which stay live over the limit; a venue without an id is dropped", () => {
  const l = parseLiveVenues({ limit: 1, planName: "Basic", venues: [{ id: 100, name: "A", city: "Lahore", live: true }, { id: 101, name: "B", live: false }, { name: "no id" }] })!;
  eq([l.limit, l.venues.map((v) => [v.id, v.live])], [1, [[100, true], [101, false]]]);
  eq(parseLiveVenues({ limit: null, venues: [] })!.limit, null);
  eq(parseLiveVenues({ nothing: 1 }), null);
});

console.log("\ncustomers of a paused venue");
await check("availabilityNotice is read from the venue payload; null for a venue that is taking enquiries", () => {
  eq(readAvailabilityNotice({ availabilityNotice: { code: "NOT_TAKING_ENQUIRIES", text: "Back soon." } }), { code: "NOT_TAKING_ENQUIRIES", text: "Back soon." });
  eq(readAvailabilityNotice({ availabilityNotice: { code: "NOT_TAKING_ENQUIRIES" } })!.text, null);
  for (const none of [{}, { availabilityNotice: null }, null, undefined, "x", { availabilityNotice: "paused" }]) eq(readAvailabilityNotice(none), null);
});
await check("409 VENUE_UNAVAILABLE is recognised; the same status with another code, or another status, is not", () => {
  const e = (status: number, code: string) => ({ response: { status, data: { status: false, message: "Not taking enquiries.", data: { code } } } });
  eq(venueUnavailableFromError(e(409, "VENUE_UNAVAILABLE")), { message: "Not taking enquiries." });
  eq(venueUnavailableFromError(e(409, "ALREADY_BOOKED")), null);
  eq(venueUnavailableFromError(e(400, "VENUE_UNAVAILABLE")), null);
  eq(venueUnavailableFromError(null), null);
});
await check("the dialog host is told one macrotask later, unless the screen showed the refusal itself", async () => {
  const seen: string[] = [];
  const off = onVenueUnavailable((v) => seen.push(v.message ?? ""));
  const e1 = { response: { status: 409 } };
  handleVenueUnavailable(e1, { message: "first" });
  eq(seen.length, 0, "nothing may be published synchronously");
  await new Promise((r) => setTimeout(r, 5));
  eq(seen, ["first"]);
  const e2 = { response: { status: 409 } };
  handleVenueUnavailable(e2, { message: "second" });
  claimVenueUnavailable(e2);
  await new Promise((r) => setTimeout(r, 5));
  eq(seen, ["first"], "a claimed refusal stays inline");
  off();
});
await check("the public venue page, the legacy page and the booking funnel all read availabilityNotice, and the inquiry and quote dialogs handle the 409", () => {
  for (const f of ["components/seo/vendor-detail-page.tsx", "components/VendorDetails/VendorDetailsMobile.tsx", "components/booking/booking-form.tsx"]) ok(/readAvailabilityNotice\(/.test(read(f)), `${f} must read availabilityNotice`);
  ok(/VENUE_UNAVAILABLE/.test(read("components/VendorInquiryDialog.tsx")), "inquiry dialog (raw fetch)");
  ok(/venueUnavailableFromError/.test(read("components/RequestQuoteDialog.tsx")), "quote dialog");
  ok(/handleVenueUnavailable/.test(read("lib/axiosConfig.js")), "axios layer");
  ok(/<VenueUnavailableHost\s*\/>/.test(read("app/(main)/layout.tsx")), "the public layout must mount the dialog host");
});

console.log("\nthis guard is wired into the build");
await check("package.json runs it in `guards` and has guard:plans-wall", () => {
  const pkg = JSON.parse(read("package.json"));
  ok(/plans-wall-check\.mts/.test(pkg.scripts.guards), "guards chain");
  ok(/plans-wall-check\.mts/.test(pkg.scripts["guard:plans-wall"] ?? ""), "guard:plans-wall");
});

if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1); }
console.log("\nall plans-wall checks passed");
