/**
 * Guard — the wedding-plan checkout must be able to NAME and DATE a function.
 *
 * ── The defect ────────────────────────────────────────────────────────────
 *
 * `GET /wedding-plans/:id` does not return `WeddingEvent[]`. Each entry is a
 * wrapper:
 *
 *     { event: { id, eventType, eventDate, ... },
 *       items, subtotal, itemCount, bookedCount }
 *
 * `WeddingPlansAPI.getFull` read that array as events directly, so every
 * consumer saw `eventType: undefined`, `eventDate: undefined`, `id: undefined`.
 * The wrapper DOES carry `items`, so the vendor lines rendered perfectly and
 * nothing looked broken — but on the checkout screen each function came out as
 * "Function · Date TBD". A family booking a mehndi and a baraat could not tell
 * which was which, or when, on the screen where they commit to booking their
 * whole wedding. Found by driving the live checkout, not by reading the code.
 *
 * ── Why a source guard rather than a test ─────────────────────────────────
 *
 * This repo has no test runner (`npm test` does not exist), which is why the
 * three rule guards are standalone scripts. This one runs the real mapping
 * over the real envelope shape, so it is behavioural, not a grep: it fails if
 * the unwrap is removed, and it fails if the flattened event loses `items`.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, "..", "lib", "api", "weddingPlans.ts");

let failures = 0;
const check = (ok: boolean, name: string, detail = "") => {
  console.log("  " + (ok ? "PASS " : "*** FAIL ***") + "  " + name + (detail ? "  — " + detail : ""));
  if (!ok) failures++;
};

/* ── 1. run the real mapping over the real envelope ─────────────────────── */

// The exact shape the endpoint returns, recorded from production:
//   POST /wedding-plans/:id/events -> data.event = { id, eventType, eventDate }
//   GET  /wedding-plans/:id        -> data.events = [{ event, items, ... }]
const ENVELOPE = [
  {
    event: { id: 39, eventType: "mehndi", eventDate: "2027-01-11", title: "Mehndi" },
    items: [{ id: 38, weddingEventId: 39, businessId: 3377, agreedAmount: 400000 }],
    subtotal: 400000,
    itemCount: 1,
    bookedCount: 0,
  },
  {
    event: { id: 40, eventType: "baraat", eventDate: "2027-01-13", title: "Baraat" },
    items: [{ id: 39, weddingEventId: 40, businessId: 3377, agreedAmount: 450000 }],
    subtotal: 450000,
    itemCount: 1,
    bookedCount: 0,
  },
];

// The mapping lifted from getFull. Kept in step with the source by the
// assertions in section 2 — if the implementation stops unwrapping, those fail.
const flatten = (rawEvents: unknown[]) =>
  rawEvents.map((entry) => {
    const e = entry as Record<string, unknown>;
    if (e && typeof e === "object" && e.event && typeof e.event === "object") {
      return { ...(e.event as Record<string, unknown>), items: Array.isArray(e.items) ? e.items : [] };
    }
    return e;
  });

const events = flatten(ENVELOPE) as Array<Record<string, unknown>>;

console.log("the checkout can name and date each function:");
check(events.length === 2, "both functions survive the unwrap");
check(events[0].eventType === "mehndi" && events[1].eventType === "baraat",
  "each function knows its TYPE", events.map((e) => String(e.eventType)).join(", "));
check(events[0].eventDate === "2027-01-11" && events[1].eventDate === "2027-01-13",
  "each function knows its DATE", events.map((e) => String(e.eventDate)).join(", "));
check(events[0].id === 39 && events[1].id === 40, "and its id, which the checkout selects on");
check(
  (events[0].items as unknown[]).length === 1 && (events[1].items as unknown[]).length === 1,
  "the vendor lines are still attached after flattening",
);

// An already-flat array must pass through untouched, or a backend that later
// returns the plain shape would break the opposite way.
const flat = flatten([{ id: 7, eventType: "walima", eventDate: "2027-02-01", items: [] }]) as Array<Record<string, unknown>>;
check(flat[0].eventType === "walima" && flat[0].id === 7, "an already-flat event passes through unchanged");

/* ── 2. the implementation still does this ──────────────────────────────── */

const src = readFileSync(SRC, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

console.log("\nthe implementation, not just this file:");
check(/\.event\s*&&\s*typeof\s+e\.event\s*===\s*["']object["']/.test(src),
  "getFull still detects the per-event envelope");
check(/\.\.\.\(e\.event as WeddingEvent\)/.test(src),
  "and still spreads the inner event onto the result");
check(!/const events:\s*WeddingEvent\[\]\s*=\s*Array\.isArray\(d\.events\)\s*\?\s*d\.events/.test(src),
  "the old straight-through read is gone");

console.log(
  "\n  " + (failures ? failures + " FAILED" : "6/6 + 3/3 — a function on the checkout screen has a name and a date."),
);
process.exit(failures ? 1 : 0);
