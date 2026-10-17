/**
 * Guard - availability screens agree with the server (WP35, portal audit P4).
 *
 * What this holds:
 *   1. BOOKINGS-062 (S1): the slot Edit lookup compares ids as STRINGS (the API sends bigint ids as '2', '3').
 *   2. CUSTOMER-003 / 004 / 017: one rule for what the picker knows about a day. An absent day is closed for slot
 *      templates and FREE for fixed periods (an exceptions list); a failed request is 'unknown', never 'closed'; the
 *      booking picker asks for the month STRICTLY so a failure is seen.
 *   3. FLAGGED-002: a hold's "Book karein" hands the booking form a real time ('Evening' -> 18:00), never 'Eveni'.
 *   4. VENDORTYPES-022: the quantity stepper stays inside the vendor's units / minimum order.
 *   5. BOOKINGS-039 / 054 / 042 / 024 and the server-refusal confirm (SLOT_HAS_BOOKINGS): the screens carry the logic.
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/availability-check.mts
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { findSlotById, slotErrorInfo } from "../components/dashboard/mainScreens/availability/artifact/slot-helpers.ts";
import { dayKnowledgeOf } from "../lib/booking/day-knowledge.ts";
import { holdBookingTime } from "../lib/booking/slot-vocabulary.ts";
import { quantityBounds, clampQuantity, unitsAvailableOf } from "../lib/booking/quantity-bounds.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

let checks = 0;
const failures: string[] = [];
function ok(cond: boolean, label: string) {
  checks += 1;
  if (!cond) failures.push(label);
}
const eq = (a: unknown, b: unknown, label: string) => ok(JSON.stringify(a) === JSON.stringify(b), `${label}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

// 1 ─ slot lookup
{
  const list = [{ id: "2", label: "A" }, { id: "3", label: "B" }, { id: 4, label: "C" }];
  eq(findSlotById(list, "3")?.label, "B", "string id from the button's data attribute finds the string-id slot");
  eq(findSlotById(list, "4")?.label, "C", "a numeric id still matches");
  eq(findSlotById(list, 2)?.label, "A", "a numeric lookup finds a string id");
  eq(findSlotById(list, ""), undefined, "empty id");
  eq(findSlotById(list, undefined), undefined, "no id");
  eq(findSlotById(list, "9"), undefined, "unknown id");
  eq(slotErrorInfo({ response: { data: { message: "Slot has bookings", data: { code: "SLOT_HAS_BOOKINGS" } } } }, "x"), { message: "Slot has bookings", code: "SLOT_HAS_BOOKINGS" }, "server sentence + code");
  eq(slotErrorInfo(new Error("net"), "Save nahi hua"), { message: "Save nahi hua", code: null }, "no response -> fallback");
  eq(slotErrorInfo({ response: { data: { message: "SLOT_ENDS_AFTER_CLOSURE", data: { code: "SLOT_CONFLICT", details: { reason: "Wedding halls have to be closed by 10 PM" } } } } }, "x").message, "Wedding halls have to be closed by 10 PM", "a bare machine-code message is replaced by the server's sentence (BOOKINGS-024)");
  eq(slotErrorInfo({ response: { data: { message: "Slot has 2 bookings. Move them first.", data: { code: "SLOT_HAS_BOOKINGS", details: { reason: "other" } } } } }, "x").message, "Slot has 2 bookings. Move them first.", "a real sentence is kept");
  const src = read("components/dashboard/mainScreens/availability/artifact/slots-artifact.tsx");
  ok(!/x\.id === Number\(ed\.dataset/.test(src), "slots-artifact no longer compares x.id === Number(dataset.slotEdit)");
  ok(src.includes("findSlotById(tplRef.current, ed.dataset.slotEdit)"), "slots-artifact looks the slot up with findSlotById");
  ok(src.includes('SLOT_HAS_BOOKINGS') && src.includes("openConfirm(s,"), "slots-artifact confirms an edit the server flags SLOT_HAS_BOOKINGS");
  ok(src.includes('"22:00"') && !/: "23:00"\}/.test(src.replace(/\s+/g, " ")) , "new slot default end is 22:00, not 23:00");
  ok(src.includes("end <= start"), "slots-artifact checks end after start before calling the server");
}

// 2 ─ day knowledge
{
  const open = { availableSlots: ["a"], bookedSlots: [] as string[], isBlocked: false };
  const part = { availableSlots: ["a"], bookedSlots: ["b"], isBlocked: false };
  const full = { availableSlots: [] as string[], bookedSlots: ["a"], isBlocked: false };
  const blocked = { availableSlots: ["a"], bookedSlots: [] as string[], isBlocked: true };
  for (const t of [true, false]) {
    eq(dayKnowledgeOf(open, "ready", t), "free", `open day (templates=${t})`);
    eq(dayKnowledgeOf(part, "ready", t), "partial", `partial day (templates=${t})`);
    eq(dayKnowledgeOf(full, "ready", t), "unavailable", `full day (templates=${t})`);
    eq(dayKnowledgeOf(blocked, "ready", t), "unavailable", `blocked day (templates=${t})`);
    eq(dayKnowledgeOf(undefined, "loading", t), "pending", `absent while loading (templates=${t})`);
    eq(dayKnowledgeOf(undefined, undefined, t), "pending", `absent, never asked (templates=${t})`);
    eq(dayKnowledgeOf(undefined, "error", t), "unknown", `absent after a failed request (templates=${t}) is unknown, never closed`);
  }
  eq(dayKnowledgeOf(undefined, "ready", true), "unavailable", "templates: an absent day of a ready month is closed");
  eq(dayKnowledgeOf(undefined, "ready", false), "free", "fixed periods: an absent day of a ready month is free (the answer is an exceptions list)");
  const step = read("components/booking/steps-v2/date-time-step.tsx");
  ok(step.includes("dayKnowledgeOf("), "date-time-step reads day knowledge through the shared rule");
  ok(!/if \(state === "ready"\) return "unavailable"/.test(step), "date-time-step has no private 'ready => unavailable' rule left");
  ok(step.includes("getMonthAvailability([venue.id], m, { strict: true })"), "date-time-step asks for the month strictly (a failure must be seen)");
  const api = read("lib/api/vendors.ts");
  ok(api.includes("opts?.strict") && api.includes("throw e"), "getMonthAvailability can rethrow; other callers keep {}");
  ok(/getMonthAvailability\(\[Number\(vendor\.id\)\], `\$\{yyyy\}-\$\{mm\}`\)/.test(read("components/VendorDetails/VendorDetailsMobile.tsx")), "the venue-page calendar still uses the forgiving call");
}

// 3 ─ hold -> booking time
{
  eq(holdBookingTime("Evening"), "18:00", "Evening");
  eq(holdBookingTime("evening"), "18:00", "evening (case)");
  eq(holdBookingTime("Morning"), "09:00", "Morning");
  eq(holdBookingTime("Midday"), "12:00", "Midday");
  eq(holdBookingTime("Afternoon"), "14:00", "Afternoon");
  eq(holdBookingTime("Full day"), "10:00", "Full day");
  eq(holdBookingTime("Whole day"), "10:00", "Whole day");
  eq(holdBookingTime("18:00"), "18:00", "a clock time");
  eq(holdBookingTime("20:00:00"), "20:00", "a clock time with seconds");
  eq(holdBookingTime("7 PM"), "19:00", "12-hour");
  eq(holdBookingTime("Baraat"), undefined, "a function name has no clock time");
  eq(holdBookingTime("Dinner#12"), undefined, "a slot-template label with its id suffix");
  eq(holdBookingTime("Evening#3"), "18:00", "the id suffix is plumbing");
  eq(holdBookingTime(""), undefined, "empty");
  const holds = read("components/dashboard/mainScreens/holds/artifact/holds-artifact.tsx");
  ok(holds.includes("holdBookingTime(bk.dataset.hbTime)") && !holds.includes('.slice(0, 5)\n        openBookingForm'), "holds screen converts the label with holdBookingTime");
  ok(holds.includes("featureOff"), "holds screen shows a feature-off notice (404 + flag), not the money-style banner");
  const form = read("components/dashboard/mainScreens/artifact/booking-form.ts");
  ok(form.includes("Venue #${selBiz}") && form.includes("if (!bizOpts"), "booking form selects the prefilled venue when no venue list is passed");
}

// 4 ─ quantity stepper
{
  const car = { features: { unitsAvailable: ["3 Units"] } };
  eq(unitsAvailableOf(car), 3, "unitsAvailable 3 Units");
  eq(unitsAvailableOf({ features: [{ name: "unitsAvailable", values: ["12 Units"] }] }), 12, "array-shaped features");
  eq(unitsAvailableOf({ features: { unitsAvailable: ["many"] } }), null, "unreadable");
  eq(unitsAvailableOf(null), null, "no package");
  const b = quantityBounds(car, { isCarRental: true });
  eq(b, { min: 1, max: 3 }, "car rental bounds");
  eq([0, 1, 2, 3, 4, 50].map((n) => clampQuantity(n, b)), [1, 1, 2, 3, 3, 3], "clamp 0..50 into 1..3");
  eq(quantityBounds(car, { isCarRental: false }), { min: 1, max: null }, "units only bound a car rental");
  const stationery = quantityBounds({ features: [] }, { minOrder: 100 });
  eq([1, 50, 100, 101].map((n) => clampQuantity(n, stationery)), [100, 100, 100, 101], "a minimum order is the floor, no ceiling");
  eq(clampQuantity(NaN, b), 1, "NaN");
  const pk = read("components/booking/steps-v2/package-step.tsx");
  ok(pk.includes("clampQuantity(qty + n, qtyBounds)") && !pk.includes("Math.max(1, qty + n)"), "package step clamps the stepper");
}

// 5 ─ calendar + copy
{
  const cal = read("components/dashboard/mainScreens/calendar/artifact/calendar-artifact.tsx");
  ok(cal.includes("activeBizRef.current == null && bizListRef.current.length > 1) { void openSlotDrawer(k); return }"), "a multi-venue 'all venues' block/unblock goes through the per-venue drawer, never a null-venue call");
  ok(!cal.includes("Poora din band karne se purani bookings rahengi, sirf nayi rukengi"), "the false promise (old bookings stay, only new ones stop) is gone");
  ok(cal.includes("block_conflicts_existing_holds_or_bookings"), "the whole-day refusal code is mapped to a sentence");
  ok(cal.includes('disabled title="Pehle is din ki booking ko cancel ya move karein">Booking hai'), "'Poora din band' is not offered on a day that carries a booking");
}

if (failures.length) {
  console.error(`availability-check: ${failures.length} of ${checks} FAILED`);
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log(`availability-check: ${checks} checks pass`);
