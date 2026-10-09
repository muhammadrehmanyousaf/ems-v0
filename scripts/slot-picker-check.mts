/**
 * Guard — the vendor's "Waqt" is a list of the venue's own open slots, never a clock.
 *
 * ── The defect this pins (docs/PORTAL-ISSUES.md, entry 7) ─────────────────
 *
 * "Nayi booking" and the reschedule dialog had a free `<input type="time">`
 * (pre-filled 18:00, falling back to "18:00"): any time of day could be typed,
 * midnight included, no slot was sent, so the server's capacity and block checks
 * never ran. Changing the date, venue or hall refreshed nothing.
 *
 * This repo has no unit runner, so like its sibling guards this drives the REAL
 * modules under plain node. The server's half (the gate that refuses a time
 * outside every open slot, whatever a client sends; the one availability engine)
 * is pinned in the backend: tests/unit/slotRules.test.js,
 * tests/unit/bookingCreateServiceCore.test.js, tests/integration/slotPicker.integration.test.js
 * and tests/http/bookingSlotPicker.http.test.js. This half pins what the screens
 * do with what the server sends.
 *
 *   node --experimental-strip-types --import ./scripts/ts-resolve.mjs scripts/slot-picker-check.mts
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  WHOLE_DAY_TIME,
  slotStatus,
  isSlotOpen,
  slotContainsTime,
  buildPickerModel,
  chooseSelection,
  submitChoice,
  type PickerModel,
} from "../lib/booking/slot-picker-model.ts";
import { bookingWindowOf, timingNotes } from "../lib/booking/function-sheet-window.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

let failures = 0;
const results: string[] = [];
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failures += 1;
  results.push(`${ok ? "  ok  " : "FAIL  "}${name}${!ok && detail ? `\n        ${detail}` : ""}`);
}
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// ── fixtures: rows exactly as the server sends them ──────────────────────────
const row = (over: Record<string, unknown> = {}) => ({
  slotTemplateId: 1, label: "Dinner", startTime: "19:00:00", endTime: "22:00:00",
  capacity: 1, used: 0, free: 1, blocked: false, blockReason: null, runsThisWeekday: true,
  utilizationPct: 0, lastSpot: false, thresholdPct: 25, ...over,
}) as never;
const meta = (over: Record<string, unknown> = {}) => ({ mode: "slots", needsSpace: false, subVenueId: null, closingTime: null, ...over }) as never;

// ── 1. the one openness rule, with and without the server's `status` ─────────
check("a free slot is open", slotStatus(row()).status === "open");
check("a taken slot is full", slotStatus(row({ used: 1, free: 0 })).status === "full");
check("a blocked slot is blocked", slotStatus(row({ blocked: true, free: 0, capacity: 0 })).status === "blocked");
check("a slot that does not run today is closed (weekday)", eq(slotStatus(row({ runsThisWeekday: false })), { status: "closed", reason: "closed_weekday" }));
check("a slot with no capacity is closed", eq(slotStatus(row({ capacity: 0, free: 0 })), { status: "closed", reason: "capacity_zero" }));
check("the server's status wins when sent", slotStatus(row({ status: "full", reason: "capacity_full" })).status === "full");
check("isSlotOpen agrees (open only)", isSlotOpen(row()) && !isSlotOpen(row({ used: 1, free: 0 })) && !isSlotOpen(null));
{
  // the property: open <=> runs && !blocked && capacity > 0 && used < capacity, over every combination
  let bad = 0;
  for (const runs of [true, false]) for (const blocked of [true, false]) for (const capacity of [0, 1, 3]) for (const used of [0, 1, 3, 4]) {
    const free = Math.max(0, capacity - used);
    const expectOpen = runs && !blocked && capacity > 0 && used < capacity;
    if (isSlotOpen(row({ runsThisWeekday: runs, blocked, capacity, used, free })) !== expectOpen) bad += 1;
  }
  check("open <=> runs AND not blocked AND capacity > 0 AND used < capacity (all 48 combinations)", bad === 0, `${bad} disagree`);
}

// ── 2. time inside a slot: half-open, midnight never inside an evening slot ──
check("19:00 is inside 19:00-22:00; 22:00 is not", slotContainsTime({ startTime: "19:00:00", endTime: "22:00:00" }, "19:00") && !slotContainsTime({ startTime: "19:00:00", endTime: "22:00:00" }, "22:00"));
check("midnight is inside no evening slot", !slotContainsTime({ startTime: "19:00:00", endTime: "22:00:00" }, "00:00"));

// ── 3. what the picker shows ─────────────────────────────────────────────────
const day: ReturnType<typeof row>[] = [
  row({ slotTemplateId: 1, label: "Lunch", startTime: "12:00:00", endTime: "16:00:00", capacity: 2, used: 1, free: 1 }),
  row({ slotTemplateId: 2, label: "Dinner", used: 1, free: 0 }),
  row({ slotTemplateId: 3, label: "Mehndi", startTime: "17:00:00", endTime: "18:30:00", blocked: true, blockReason: "Repaint", capacity: 0, free: 0 }),
  row({ slotTemplateId: 4, label: "Weekday morning", startTime: "09:00:00", endTime: "11:00:00", runsThisWeekday: false }),
];
const m = buildPickerModel({ rows: day, meta: meta(), selectedId: null }) as Extract<PickerModel, { mode: "slots" }>;
check("every slot is listed, none hidden", m.mode === "slots" && m.options.length === 4);
check("only the open one is enabled", eq(m.options.map((o) => o.enabled), [true, false, false, false]));
check("each disabled slot says why", eq(m.options.map((o) => o.note), ["1 khaali · 2 mein se", "Bhar gaya", "Aap ne band kiya", "Is din ye slot nahi chalta"]));
check("a vendor's own block note is shown", m.options[2].detail === "Repaint");
check("a system block reason is not echoed back as if the vendor wrote it", buildPickerModel({ rows: [row({ blocked: true, blockReason: "recurring_whole_day", capacity: 0, free: 0 })], meta: meta(), selectedId: null }).mode === "slots"
  && (buildPickerModel({ rows: [row({ blocked: true, blockReason: "recurring_whole_day", capacity: 0, free: 0 })], meta: meta(), selectedId: null }) as Extract<PickerModel, { mode: "slots" }>).options[0].detail === null);
check("time ranges read like the rest of the product", m.options[1].range === "7 PM to 10 PM");
check("no open slot -> an empty-state banner, list still shown", (() => {
  const none = buildPickerModel({ rows: [day[1], day[2]], meta: meta(), selectedId: null }) as Extract<PickerModel, { mode: "slots" }>;
  return !none.anyOpen && /koi slot khula nahi/.test(none.banner || "") && none.options.length === 2;
})());
check("a whole-day venue shows no list", buildPickerModel({ rows: [], meta: meta({ mode: "whole_day" }), selectedId: null }).mode === "whole_day");
check("slots that exist only per hall ask for a hall first", buildPickerModel({ rows: [], meta: meta({ mode: "whole_day", needsSpace: true }), selectedId: null }).mode === "needs_space");
check("the booking's own slot stays choosable on its own date (it looks full because of the booking itself)", (() => {
  const cur = buildPickerModel({ rows: [day[1]], meta: meta(), selectedId: 2, currentId: 2, dateMoved: false }) as Extract<PickerModel, { mode: "slots" }>;
  return cur.options[0].enabled && cur.options[0].selected && cur.options[0].isCurrent;
})());
check("...but not once the date has moved (then it really is full)", (() => {
  const cur = buildPickerModel({ rows: [day[1]], meta: meta(), selectedId: 2, currentId: 2, dateMoved: true }) as Extract<PickerModel, { mode: "slots" }>;
  return !cur.options[0].enabled && !cur.options[0].selected;
})());

// ── 4. what stays selected when date / venue / hall change underneath ────────
check("a choice that is still offered is kept", chooseSelection({ options: m.options, previousId: 1 }) === 1);
check("a choice that is no longer offered is DROPPED, never carried", chooseSelection({ options: m.options, previousId: 2 }) === null);
check("a lead's time preselects the slot it sits in, if offered", chooseSelection({ options: m.options, previousId: null, preferTime: "13:00" }) === 1);
check("...and not a slot that is full", chooseSelection({ options: m.options, previousId: null, preferTime: "20:00" }) === null);
check("nothing is preselected from thin air", chooseSelection({ options: m.options, previousId: null }) === null);

// ── 5. what the form sends ───────────────────────────────────────────────────
const sel = buildPickerModel({ rows: day, meta: meta(), selectedId: 1 });
check("a chosen open slot sends its id and its START time", eq(submitChoice({ model: sel, selectedId: 1 }), { ok: true, bookingTime: "12:00", slotTemplateId: 1 }));
check("a disabled slot can never be submitted, even if selected", submitChoice({ model: sel, selectedId: 2 }).ok === false);
check("nothing chosen cannot be submitted", submitChoice({ model: sel, selectedId: null }).ok === false);
check("a whole-day venue sends the Whole-day period and no slot", eq(submitChoice({ model: buildPickerModel({ rows: [], meta: meta({ mode: "whole_day" }), selectedId: null }), selectedId: null }), { ok: true, bookingTime: WHOLE_DAY_TIME, slotTemplateId: null }));
check("midnight is not a time any picker state can produce", (() => {
  for (const mdl of [sel, buildPickerModel({ rows: [], meta: meta({ mode: "whole_day" }), selectedId: null })]) {
    for (const id of [null, 1, 2, 3, 4]) {
      const c = submitChoice({ model: mdl, selectedId: id });
      if (c.ok && (c.bookingTime === "00:00" || !/^(0[9]|1\d|2[0-1]):\d\d$/.test(c.bookingTime))) return false;
    }
  }
  return true;
})());
check("loading and a failed load both refuse to submit", submitChoice({ model: null, selectedId: null, loading: true }).ok === false && submitChoice({ model: sel, selectedId: 1, loadFailed: true }).ok === false);
check("needs-space refuses to submit", submitChoice({ model: buildPickerModel({ rows: [], meta: meta({ mode: "whole_day", needsSpace: true }), selectedId: null }), selectedId: null }).ok === false);

// ── 6. function-sheet timings against the booking's slot (advisory) ──────────
const win = bookingWindowOf({ bookingTime: "19:00", slotTemplateSnapshotJson: { label: "Dinner", startTime: "19:00:00", endTime: "22:00:00" } } as never);
check("a booking's window is its frozen slot", eq(win, { label: "Dinner", start: "19:00", end: "22:00", source: "slot" }));
check("a legacy booking falls back to its fixed period", eq(bookingWindowOf({ bookingTime: "18:00" } as never)?.source, "period"));
check("a free-text time claims no hours, so nothing is checked", bookingWindowOf({ bookingTime: "Baraat" } as never) === null && timingNotes({ window: null, timeline: [{ time: "03:00" }] }).length === 0);
check("a row outside the slot is flagged; one inside is not", (() => {
  const n = timingNotes({ window: win, timeline: [{ time: "03:30", activity: "Khaana" }, { time: "20:00", activity: "Rukhsati" }] });
  return n.length === 1 && /3:30 AM \(Khaana\)/.test(n[0]);
})());
check("setup BEFORE the slot is normal; setup after it ends is flagged", timingNotes({ window: win, timeline: [], setup: "15:00" }).length === 0 && timingNotes({ window: win, timeline: [], setup: "23:00" }).length === 1);
check("teardown AFTER the slot is normal; before it starts is flagged", timingNotes({ window: win, timeline: [], teardown: "23:30" }).length === 0 && timingNotes({ window: win, timeline: [], teardown: "10:00" }).length === 1);

// ── 7. the screens are wired to it (source-level: what the DOM cannot be asked here) ──
const form = read("components/dashboard/mainScreens/artifact/booking-form.ts");
check("Nayi booking has no free clock", !/type="time"/.test(form) && !/bf-time/.test(form));
check("...and never falls back to a default time", !/\|\|\s*"18:00"/.test(form));
check("...it sends the chosen slot's id", /slotTemplateId\s*=\s*choice\.slotTemplateId/.test(form));
check("...it reloads the list on date, venue AND hall changes", /bf-date"\) \{ void reloadSlots/.test(form) && /bf-subvenue"\) void reloadSlots/.test(form) && /bf-biz"/.test(form) && /deps\.then\(\(\) => reloadSlots/.test(form));
check("...it re-reads the list right before submitting", /recheckPicker\(shadow, SLOTS_ID\)/.test(form));
const detail = read("components/dashboard/mainScreens/bookings/artifact/booking-detail-artifact.tsx");
check("the reschedule dialog has no free clock either", !/id="rs-time"/.test(detail) && /slotPickerField\("rs-slots"\)/.test(detail));
check("...it sends the chosen slot, and re-reads the list before sending", /newSlotTemplateId: fresh\.choice\.slotTemplateId/.test(detail) && /recheckPicker\(s, "rs-slots"\)/.test(detail));
const pub = read("components/booking/steps-v2/date-time-step.tsx");
check("the public booking page decides 'open' with the SAME function", /isSlotOpen\(row\)/.test(pub) && /from "@\/lib\/booking\/slot-picker-model"/.test(pub) && !/row\.blocked \|\| row\.free <= 0/.test(pub));
const fsheet = read("components/dashboard/mainScreens/function-sheets/artifact/function-sheets-artifact.tsx");
check("the function sheet checks its timings against the booking's slot", /timingNotes\(/.test(fsheet) && /bookingWindowOf\(/.test(fsheet));
check("no 'extra slot' override is offered anywhere", !/extraSlot|allowExtra|overrideSlot/i.test(form + detail + read("components/dashboard/mainScreens/artifact/slot-picker.ts")));

console.log(results.join("\n"));
console.log(`\nslot-picker-check: ${results.length - failures}/${results.length} passed`);
process.exit(failures ? 1 : 0);
