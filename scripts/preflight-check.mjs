/**
 * Property checks for the booking pre-flight rules.
 *
 * No unit-test runner in this repo — only Playwright e2e — so a jest-style
 * spec would be a file that never runs. Node 24 strips TypeScript natively:
 *
 *   node --experimental-strip-types scripts/preflight-check.mjs
 *
 * Exits non-zero on failure.
 */
import { preflight, parseHHMM, CLOSING_MINUTES } from "../lib/booking/preflight.ts";

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

/** A vendor with nothing wrong. */
const healthy = {
  status: "approved",
  minimumPrice: 150000,
  packageCount: 2,
  slots: [{ label: "Evening", startTime: "18:00", endTime: "22:00", capacity: 1, isActive: true }],
  spaces: [{ id: 1, name: "Main Hall", capacity: 500 }],
};

console.log("\nthe clean case");
check("a correctly set up vendor is bookable with no issues", () => {
  const r = preflight(healthy);
  eq(r.bookable, true, "bookable");
  eq(r.issues.length, 0, "issues");
  eq(r.unknown.length, 0, "unknown");
});

console.log("\nunknown signals are never failures");
check("nothing known → bookable is null, not false", () => {
  // false here would be an accusation built out of our own ignorance, and it
  // is exactly the mistake that teaches vendors to ignore the panel.
  const r = preflight({});
  eq(r.bookable, null, "bookable");
  eq(r.issues.length, 0, "issues");
  eq(r.unknown.length, 4, "unknown");
});
check("a missing signal is skipped and named, not failed", () => {
  const r = preflight({ status: "approved", minimumPrice: 150000, packageCount: 1 });
  ok(r.unknown.includes("slots"), "names slots");
  ok(r.unknown.includes("spaces"), "names spaces");
  ok(!r.blocking.length, "invents no blockers");
});

console.log("\nthe closure rule — the bug this file exists for");
check("a slot ending after 10 PM blocks, and names itself", () => {
  const r = preflight({ ...healthy, slots: [{ label: "Barat", startTime: "19:00", endTime: "23:00", capacity: 1, isActive: true }] });
  eq(r.bookable, false, "bookable");
  ok(/Barat/.test(r.blocking[0].title), `names the slot: ${r.blocking[0].title}`);
  ok(/19:00–23:00/.test(r.blocking[0].title), "shows the times");
});
check("exactly 22:00 is allowed — the boundary is inclusive", () => {
  const r = preflight({ ...healthy, slots: [{ label: "Evening", startTime: "18:00", endTime: "22:00", capacity: 1, isActive: true }] });
  eq(r.bookable, true, "22:00 must be legal");
  eq(parseHHMM("22:00"), CLOSING_MINUTES, "boundary");
});
check("a hidden bad slot is not reported — customers never see it", () => {
  const r = preflight({ ...healthy, slots: [
    { label: "Evening", startTime: "18:00", endTime: "22:00", capacity: 1, isActive: true },
    { label: "Old", startTime: "19:00", endTime: "23:30", capacity: 1, isActive: false },
  ] });
  eq(r.bookable, true, "a hidden row harms nobody");
});
check("an unparseable end time is not treated as illegal", () => {
  const r = preflight({ ...healthy, slots: [{ label: "Odd", startTime: "18:00", endTime: null, capacity: 1, isActive: true }] });
  eq(r.blocking.length, 0, "unknown ≠ broken");
});

console.log("\nthe price rule — the largest group on production");
check("no price and no packages blocks", () => {
  const r = preflight({ ...healthy, minimumPrice: 0, packageCount: 0 });
  eq(r.bookable, false, "bookable");
  eq(r.blocking[0].key, "price", "key");
});
check("a package alone is enough to be bookable", () => {
  const r = preflight({ ...healthy, minimumPrice: 0, packageCount: 1 });
  eq(r.bookable, true, "packages price a vendor just as well");
});
check("a starting price alone is enough", () => {
  const r = preflight({ ...healthy, minimumPrice: 50000, packageCount: 0 });
  eq(r.bookable, true, "bookable");
});

console.log("\nslots — absent is a warning, all-hidden is a blocker");
check("no slots at all only warns — the canonical four still apply", () => {
  // A venue with no templates falls back to Whole day / Day / Midday / Evening,
  // so it IS bookable. Calling this a blocker would be false.
  const r = preflight({ ...healthy, slots: [] });
  eq(r.bookable, true, "still bookable");
  eq(r.warnings[0].key, "slots-none", "warned");
});
check("every slot hidden blocks — there is no time to choose", () => {
  const r = preflight({ ...healthy, slots: [{ label: "Evening", startTime: "18:00", endTime: "22:00", capacity: 1, isActive: false }] });
  eq(r.bookable, false, "bookable");
  eq(r.blocking[0].key, "slots-all-hidden", "key");
});

console.log("\ncapacity");
check("a slot taking 0 bookings blocks", () => {
  const r = preflight({ ...healthy, slots: [{ label: "Evening", startTime: "18:00", endTime: "22:00", capacity: 0, isActive: true }] });
  eq(r.bookable, false, "bookable");
  ok(/0 bookings/.test(r.blocking[0].title), r.blocking[0].title);
});
check("a space holding no guests blocks", () => {
  const r = preflight({ ...healthy, spaces: [{ id: 3, name: "Zenana Section", capacity: 0 }] });
  eq(r.bookable, false, "bookable");
  ok(/Zenana Section/.test(r.blocking[0].title), r.blocking[0].title);
});

console.log("\nevery issue is actionable — the point of the whole panel");
check("no issue is ever reported without an action and a link", () => {
  const broken = preflight({
    status: "suspended",
    minimumPrice: 0,
    packageCount: 0,
    slots: [{ label: "Bad", startTime: "19:00", endTime: "23:00", capacity: 0, isActive: true }],
    spaces: [{ id: 1, name: "Hall", capacity: 0 }],
  });
  ok(broken.issues.length >= 4, `expected several issues, got ${broken.issues.length}`);
  for (const i of broken.issues) {
    ok(!!i.action && !!i.href, `"${i.title}" has no action/href`);
    ok(!!i.consequence, `"${i.title}" never says why it matters`);
  }
});
check("issue keys are unique so React lists cannot collide", () => {
  const r = preflight({
    ...healthy,
    slots: [
      { label: "A", startTime: "19:00", endTime: "23:00", capacity: 1, isActive: true },
      { label: "B", startTime: "20:00", endTime: "23:30", capacity: 1, isActive: true },
    ],
  });
  const keys = r.issues.map((i) => i.key);
  eq(new Set(keys).size, keys.length, "duplicate keys");
});

console.log(failed ? `\n${failed} check(s) failed\n` : "\nall checks passed\n");
process.exit(failed ? 1 : 0);
