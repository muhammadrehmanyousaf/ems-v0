/**
 * Property checks for the "Add a business" flow's pure logic.
 *
 *   node --experimental-strip-types scripts/add-business-check.mjs
 *
 * Three things a vendor relies on and nobody sees until they break:
 *   - what each business status MEANS (a `submitted` business is NOT hidden from
 *     couples, a `pending_review` one is; the words must not mix them up)
 *   - the line under a business name that tells two similar names apart
 *   - reading the plan's business limit, and the server's LIMIT_REACHED refusal
 */
import { businessStatusInfo, businessSubtitle, firstLabel } from "../lib/business-status.ts";
import { parseBusinessLimit, limitReachedFrom } from "../lib/business-limit-parse.ts";

let failed = 0;
const check = (name, fn) => {
  try { fn(); console.log(`  ok   ${name}`); }
  catch (e) { failed++; console.error(`  FAIL ${name}\n       ${e.message}`); }
};
const ok = (c, m) => { if (!c) throw new Error(m ?? "expected true"); };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m ?? "expected"} ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };

console.log("\nwhat a status means to the vendor");
for (const s of ["approved", "pending_review", "submitted", "draft", "rejected", "suspended"]) {
  check(`${s} has a label, a headline, a summary and an explanation`, () => {
    const i = businessStatusInfo(s);
    ok(i && i.label && i.headline && i.summary && i.detail.length > 30, "incomplete");
  });
}
check("pending_review says it is hidden and cannot take bookings (it is)", () => {
  const d = businessStatusInfo("pending_review").detail.toLowerCase();
  ok(d.includes("hidden") && d.includes("cannot take bookings"), d);
});
check("submitted never claims to be hidden (the public catalog shows it)", () => {
  const i = businessStatusInfo("submitted");
  const d = (i.detail + i.summary).toLowerCase();
  ok(!d.includes("hidden") && !d.includes("cannot take bookings"), d);
});
check("both in-review statuses read 'Submitted, under review' and are marked inReview", () => {
  for (const s of ["pending_review", "submitted"]) {
    const i = businessStatusInfo(s);
    eq(i.headline, "Submitted, under review");
    ok(i.inReview === true);
  }
  ok(businessStatusInfo("approved").inReview === false);
});
check("a missing or unknown status shows nothing rather than a guess", () => {
  eq(businessStatusInfo(undefined), null);
  eq(businessStatusInfo(null), null);
  eq(businessStatusInfo(""), null);
  eq(businessStatusInfo("archived"), null);
});

console.log("\nthe line that tells similar names apart");
check("type, city and area, in that order", () => {
  eq(businessSubtitle({ subBusinessType: ["Marquee"], city: "Lahore", subArea: "Gulberg" }), "Marquee · Lahore · Gulberg");
});
check("falls back to the account's business type when there is no venue type", () => {
  eq(businessSubtitle({ subBusinessType: null, city: "Karachi", vendor: { vendorType: "Marquee rental" } }), "Marquee rental · Karachi");
});
check("a bare-string venue type works too, empty parts vanish", () => {
  eq(businessSubtitle({ subBusinessType: "Hall", city: null, subArea: "  " }), "Hall");
  eq(businessSubtitle({}), "");
  eq(firstLabel([]), "");
});

console.log("\nreading the plan's business limit");
check("nothing published -> unknown (null), never a made-up number", () => {
  eq(parseBusinessLimit(undefined, 3), null);
  eq(parseBusinessLimit({}, 3), null);
  eq(parseBusinessLimit({ access: "active", tier: "pro" }, 3), null);
  eq(parseBusinessLimit({ entitlements: { limits: { businesses: null } } }, 3), null);
});
check("max and used from an object", () => {
  eq(parseBusinessLimit({ entitlements: { limits: { businesses: { max: 4, used: 3 } } } }, 9), { max: 4, used: 3, planName: null });
});
check("a bare number is the max; usage falls back to what the portal loaded", () => {
  eq(parseBusinessLimit({ entitlements: { limits: { businesses: 4 } } }, 2), { max: 4, used: 2, planName: null });
  eq(parseBusinessLimit({ limits: { businesses: "1" } }, 1), { max: 1, used: 1, planName: null });
});
check("usage can live beside the limit, under another name", () => {
  eq(parseBusinessLimit({ entitlements: { limits: { businesses: { limit: 4 } }, usage: { businesses: 3 } } }, 9).used, 3);
  eq(parseBusinessLimit({ entitlements: { businesses: { limit: 4, current: 2 } } }, 9).used, 2);
});
check("negative, NaN and text are not limits", () => {
  eq(parseBusinessLimit({ limits: { businesses: -1 } }, 1), null);
  eq(parseBusinessLimit({ limits: { businesses: "lots" } }, 1), null);
});
check("the plan name is carried for the upgrade message", () => {
  eq(parseBusinessLimit({ planName: "Pro", limits: { businesses: 4 } }, 1).planName, "Pro");
});

console.log("\nthe server's LIMIT_REACHED refusal");
const refusal = (status, data) => ({ response: { status, data } });
check("403 with the code at the top level", () => {
  const r = limitReachedFrom(refusal(403, { status: false, code: "LIMIT_REACHED", message: "Your plan allows 1 business.", data: null }));
  eq(r, { message: "Your plan allows 1 business.", max: null, used: null, upgradeTo: null });
});
check("403 with the code and numbers inside data", () => {
  const r = limitReachedFrom(refusal(403, { message: "No more.", data: { code: "LIMIT_REACHED", limit: 4, current: 4, planNeeded: "Premium" } }));
  eq([r.max, r.used, r.upgradeTo], [4, 4, "Premium"]);
});
check("any other refusal is not the limit (409 duplicate, 403 customer, 429)", () => {
  eq(limitReachedFrom(refusal(409, { message: "A business with this name already exists." })), null);
  eq(limitReachedFrom(refusal(403, { message: "Only vendors can add a business" })), null);
  eq(limitReachedFrom(refusal(429, { data: { code: "RATE_LIMITED:add-business" } })), null);
  eq(limitReachedFrom(refusal(403, { code: "FEATURE_NOT_IN_PLAN" })), null);
});
check("a success or a server fault carrying the word is not a refusal", () => {
  eq(limitReachedFrom(refusal(200, { code: "LIMIT_REACHED" })), null);
  eq(limitReachedFrom(refusal(500, { code: "LIMIT_REACHED" })), null);
});
check("not an HTTP error at all", () => {
  eq(limitReachedFrom(new Error("Network Error")), null);
  eq(limitReachedFrom(undefined), null);
  eq(limitReachedFrom(null), null);
});

console.log(failed ? `\n${failed} check(s) FAILED` : "\nall checks passed");
process.exit(failed ? 1 : 0);
