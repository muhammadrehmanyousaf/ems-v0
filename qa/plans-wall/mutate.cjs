/**
 * Mutation check of scripts/plans-wall-check.mts: break the code on purpose, in the ways this guard exists to catch, and
 * require the guard to go red every time. Every file is restored afterwards (also on a crash).
 *   node qa/plans-wall/mutate.cjs
 */
const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")
const ROOT = path.join(__dirname, "..", "..")

const M = [
  ["layout stops wrapping in AccessGate", "app/(dashboard)/dashboard/layout.tsx", "<AccessGate>", "<>", "</AccessGate>", "</>"],
  ["layout stops feeding the store", "app/(dashboard)/dashboard/layout.tsx", "<AccessSync />", ""],
  ["staff layout loses the gate", "app/staff/layout.tsx", "<AccessGate>", "<>", "</AccessGate>", "</>"],
  ["floor layout loses the gate", "app/floor/layout.tsx", "<AccessGate>", "<>", "</AccessGate>", "</>"],
  ["a console route is added to the open-while-locked list", "components/dashboard/plans/access-gate.tsx", '"/dashboard/profile",', '"/dashboard/profile", "/dashboard/leads",'],
  ["the gate computes a date itself", "components/dashboard/plans/access-gate.tsx", "const pathname = usePathname() || \"\"", "const pathname = usePathname() || \"\"; const soon = Date.now() > 0"],
  ["the Wall compares an end date", "components/dashboard/plans/wall/access-wall.tsx", "const [busy, setBusy]", "const lateCheck = access.trialEndsAt < access.lockedAt; const [busy, setBusy]"],
  ["a second HTTP client forgets the 402 path", "lib/api/staffPortal.ts", "noteLock(error, { staff: true });", ""],
  ["the vendor client forgets the 402 path", "lib/axiosConfig.js", "noteLock(error)", "null"],
  ["staff are offered a pay button", "lib/plans/wall-model.ts", 'cta: "none", manual: false, safe: false, owner: false', 'cta: "renew", manual: true, safe: false, owner: false'],
  ["a suspended account is offered Renew", "lib/plans/wall-model.ts", 'title: "wall.suspended.title", body: ["wall.suspended.body"], cta: "none"', 'title: "wall.suspended.title", body: ["wall.suspended.body"], cta: "renew"'],
  ["canPay=false is ignored", "lib/plans/wall-model.ts", '(!a.canPay ? "none" : ', "("],
  ["trial ended offers Renew instead of Choose", "lib/plans/wall-model.ts", 'v === "trial_ended" || v === "no_plan" || !a.planName ? "choose" : "renew"', '"renew"'],
  ["T-3 banner starts a day late", "lib/plans/banners.ts", "if (days !== null && days <= 3) return", "if (days !== null && days <= 2) return"],
  ["T-1 banner can be dismissed", "lib/plans/banners.ts", 'keys: ["trial.t1"], vars: trialVars(a, days), cta: "choose", dismiss: null', 'keys: ["trial.t1"], vars: trialVars(a, days), cta: "choose", dismiss: "day"'],
  ["past due loses its Pay now", "lib/plans/banners.ts", 'cta: a.canPay ? "pay" : null, dismiss: null }\n  }\n  if (a.state === "cancelling")', 'cta: null, dismiss: null }\n  }\n  if (a.state === "cancelling")'],
  ["welcome shows every time", "lib/plans/banners.ts", "if (!opts.welcomeSeen) return", "if (true) return"],
  ["dates drift to UTC", "lib/plans/access.ts", 'const PK_TZ = "Asia/Karachi"', 'const PK_TZ = "UTC"'],
  ["a Roman Urdu line goes missing", "lib/plans/copy.ts", 'ru: "Aap ka muft mahina khatam ho gaya" }', 'ru: "" }'],
  ["a copy line promises a free vendor plan", "lib/plans/copy.ts", 'en: "Welcome to WeddingWala. Your free month has started.', 'en: "Welcome to WeddingWala. Enjoy our free vendor plan.'],
  ["Roman Urdu placeholder drifts", "lib/plans/copy.ts", 'ru: "Aap ka {planName} plan khatam ho gaya" }', 'ru: "Aap ka {plan} plan khatam ho gaya" }'],
  ["a free-listing promise comes back", "app/(main)/vendor-guide/page.tsx", "A free first month on Pakistan's premier event platform, no card needed", "Free listing on Pakistan's premier event platform"],
  ["the trial button comes back for everyone", "components/dashboard/mainScreens/billing/artifact/billing-artifact.tsx", "ctx.canStartTrial && days > 0", "d.trialEligible && days > 0"],
  ["a missing money figure becomes 0", "lib/plans/billing-shapes.ts", "totalToCollect: num(d.totalToCollect),", "totalToCollect: num(d.totalToCollect) ?? 0,"],
  ["the stale-status window is removed", "lib/plans/access-store.ts", "const STALE_OPEN_MS = 15_000", "const STALE_OPEN_MS = 0"],
  ["staff clients may pay", "lib/plans/access-store.ts", "{ ...lock, staff: true, canPay: false }", "{ ...lock, staff: true }"],
  ["an unknown state is treated as locked", "lib/plans/access.ts", "if (!isState(raw.state)) return null", "if (!isState(raw.state)) raw = { ...raw, state: \"locked\" }"],
  ["a 409 with any code is a paused venue", "lib/plans/venue-availability.ts", 'str(d.code) !== "VENUE_UNAVAILABLE"', "false"],
  ["the public page forgets the notice", "components/seo/vendor-detail-page.tsx", "readAvailabilityNotice(vendor.raw)", "null"],
  ["a second place lists the locked states", "components/dashboard/plans/banners/plan-banners.tsx", "const ICON = {", 'const LOCKED = ["locked", "dormant", "closed", "suspended_admin"]\nconst ICON = {'],
  ["a raw 402 check appears elsewhere", "components/dashboard/plans/access-sync.tsx", "export function AccessSync() {", "export function AccessSync() {\n  const x = (e: any) => e.response.status === 402"],
]

const run = () => {
  const r = spawnSync("npm", ["run", "guard:plans-wall"], { cwd: ROOT, shell: true, encoding: "utf8" })
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") }
}

let escaped = 0
const base = run()
if (base.code !== 0) { console.error("the guard is red BEFORE any mutation:\n" + base.out.split("\n").filter((l) => /FAIL|expected|got/.test(l)).slice(0, 6).join("\n")); process.exit(1) }
console.log("baseline green; " + M.length + " mutations\n")
for (const [name, rel, ...pairs] of M) {
  const file = path.join(ROOT, rel)
  const original = fs.readFileSync(file)
  let s = original.toString("utf8")
  const crlf = s.includes("\r\n"); if (crlf) s = s.replace(/\r\n/g, "\n")
  try {
    for (let i = 0; i < pairs.length; i += 2) {
      if (!s.includes(pairs[i])) throw new Error("mutation target not found: " + pairs[i].slice(0, 60))
      s = s.replace(pairs[i], () => pairs[i + 1])
    }
    fs.writeFileSync(file, crlf ? s.replace(/\n/g, "\r\n") : s)
    const r = run()
    const fail = r.out.split("\n").find((l) => /FAIL/.test(l)) || (r.out.match(/Error[^\n]*/) || [""])[0]
    if (r.code === 0) { escaped++; console.log("  ESCAPED  " + name) } else console.log("  caught   " + name.padEnd(58) + " <- " + fail.trim().slice(0, 90))
  } catch (e) {
    escaped++; console.log("  ERROR    " + name + ": " + e.message)
  } finally { fs.writeFileSync(file, original) }
}
const after = run()
console.log("\nrestored; guard " + (after.code === 0 ? "green" : "RED (restore failed!)") + "; escaped mutants: " + escaped)
process.exit(escaped || after.code ? 1 : 0)
