/**
 * Property checks for the business health score.
 *
 * This repo has no unit-test runner — only Playwright e2e — so a jest-style
 * spec here would be a file that never runs and a ratchet full of "cannot find
 * name 'describe'". Node 24 strips TypeScript natively, so these run for real:
 *
 *   node --experimental-strip-types scripts/health-score-check.mjs
 *
 * Exits non-zero on failure, so it can gate a build the day someone wants it to.
 */
import { computeHealth } from "../lib/health/score.ts";

let failed = 0;
const check = (name, fn) => {
  try {
    fn();
    console.log(`  ok   ${name}`);
  } catch (e) {
    failed++;
    console.error(`  FAIL ${name}\n       ${e.message}`);
  }
};
const eq = (a, b, m) => {
  if (a !== b) throw new Error(`${m ?? "expected"} ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
};
const ok = (c, m) => {
  if (!c) throw new Error(m ?? "expected true");
};

const base = {
  unansweredEnquiries: 0,
  oldestUnansweredHours: null,
  hasPublishedAvailability: true,
  profileCompleteness: 1,
  bookingsMissingPayment: 0,
  bookingsAwaitingAction: 0,
  hasBusiness: true,
};

console.log("\na quiet month is not a failing grade");
check("zero bookings, nothing outstanding → 100 / healthy", () => {
  // The whole reason volume is absent from the model. A marquee owner through
  // Muharram has no bookings and has done nothing wrong.
  const r = computeHealth(base);
  eq(r.score, 100, "score");
  eq(r.severity, "healthy", "severity");
  eq(r.nextAction, null, "nextAction");
});
check("no factor ever blames the vendor for having no bookings", () => {
  const r = computeHealth({ ...base, profileCompleteness: 0.2 });
  for (const f of r.factors) ok(!/\b(no|zero)\s+bookings\b/i.test(f.label), `blames volume: "${f.label}"`);
});

console.log("\nmonotonicity — doing more can never score you lower");
const worse = {
  unansweredEnquiries: 4,
  oldestUnansweredHours: 200,
  hasPublishedAvailability: false,
  profileCompleteness: 0.1,
  bookingsMissingPayment: 5,
  bookingsAwaitingAction: 3,
  hasBusiness: true,
};
for (const [label, patch] of [
  ["answering an enquiry", { unansweredEnquiries: 3 }],
  ["answering sooner", { oldestUnansweredHours: 100 }],
  ["publishing availability", { hasPublishedAvailability: true }],
  ["filling in the listing", { profileCompleteness: 0.6 }],
  ["recording a payment", { bookingsMissingPayment: 4 }],
  ["clearing a pending booking", { bookingsAwaitingAction: 2 }],
]) {
  check(`${label} does not lower the score`, () => {
    const before = computeHealth(worse).score;
    const after = computeHealth({ ...worse, ...patch }).score;
    ok(after >= before, `${before} → ${after}`);
  });
}

console.log("\nbounds and hostile input");
check("absurd values stay within 0..100", () => {
  const r = computeHealth({
    unansweredEnquiries: 1e6,
    oldestUnansweredHours: 1e9,
    hasPublishedAvailability: false,
    profileCompleteness: 99,
    bookingsMissingPayment: 1e6,
    bookingsAwaitingAction: 1e6,
    hasBusiness: true,
  });
  ok(r.score >= 0 && r.score <= 100, `score ${r.score}`);
});
check("NaN and negatives never produce NaN", () => {
  const r = computeHealth({
    ...base,
    profileCompleteness: Number.NaN,
    unansweredEnquiries: -3,
    bookingsMissingPayment: -1,
  });
  ok(Number.isFinite(r.score), `score ${r.score}`);
});
check("a vendor with no business is prompted, not scored", () => {
  const r = computeHealth({ ...base, hasBusiness: false });
  eq(r.factors.length, 0, "factors");
  eq(r.nextAction?.href, "/dashboard/business/new", "href");
});

console.log("\nthe next action is the most recoverable one, not the ugliest");
check("prefers availability (25pts fully unearned) over a nearly-done listing", () => {
  const r = computeHealth({ ...base, hasPublishedAvailability: false, profileCompleteness: 0.9 });
  eq(r.nextAction?.href, "/dashboard/availability", "href");
});

console.log(failed ? `\n${failed} check(s) failed\n` : "\nall checks passed\n");
process.exit(failed ? 1 : 0);
