# The slot / space / availability model — diagnosis

**Status: identification complete.** Redesign not yet implemented. This is the "first identify
slots logic" deliverable. Evidence is file:line from the repo plus live reproduction on production.

---

## 1. The one-sentence root cause

> **The product has three separate availability models that do not share a vocabulary, and the
> translator between them treats every vendor's own slot time as "blocks the whole day".**

Everything the vendor experiences as "dates conflict and it's very confusing" falls out of that.

---

## 2. The three models

| # | Model | Where it lives | Unit of truth |
|---|---|---|---|
| **A** | **Slot templates** | `BusinessSlotTemplates` (BK-008) | A named clock window per **business**: `label`, `startTime`, `endTime`, `capacity`, `weekdayMask`, `isActive`, `bufferAfterMinutes`, `unitGuestCapacity` |
| **B** | **Spaces** | `SubVenues` tree + `BookingSpaces` | A `tstzrange` claim on a **sub-venue**, guarded by `EXCLUDE USING GIST ("subVenueId" WITH =, "slotRange" WITH &&)` |
| **C** | **Legacy strings** | `Bookings.bookingTime` (free-text `STRING`) | One of three hardcoded clock strings |

Model **C** is the one the whole system still validates against:

```js
// src/utils/constants.js:35
ALLOWED_BOOKING_SLOTS = ["09:00", "14:00", "18:00"]
```

The reference vendor's real slots are **10:58, 12:00, 19:00**. None of them is in that list.

---

## 3. The five defects that follow, in blast-radius order

### D1 — Every custom slot booking silently eats the whole day *(the "dates conflict")*

`src/utils/slotVocabulary.js:99-103`:

```js
// An unrecognised label — a vendor's custom slot name. It was typed against
// a real date for a real reason, so it holds the day rather than nothing.
return [...allSlots];
```

`CLOCK_SLOTS` is `["09:00","14:00","18:00"]`. A vendor's `"12:00"`, `"19:00"`, `"10:58"` match
neither the clock list, nor `NAMED_TO_CLOCK`, nor `WHOLE_DAY` — so **every one of them returns the
entire day.** Consumed by `utils/spaceOccupancy.js:182` `slotsConsumed()` and by the hold-conflict
filter.

**Effect:** a Lunch booking in Main Hall makes that hall unavailable for Dinner the same evening.
The vendor knows the evening is free; the system says it is taken.

The whole-day default is *deliberate and correct* for genuinely ambiguous names ("Mehndi", "Baraat"
— the hour varies by venue). It is simply wrong for a value that is an unambiguous `HH:MM`.

### D2 — The vendor cannot book their own venue from their own calendar

`quick-booking-sheet.tsx` sent `bookingTime: "10:58"` and **no** `slotTemplateId`, so the request
took the legacy branch and hit the whitelist:

> `400 — Invalid booking time. Allowed slots: 09:00, 14:00, 18:00`

**This is "i cant able to book this vendor which you are logged in", verbatim.**
**Fixed** — the sheet now resolves the slot once and sends `slotTemplateId` with the line.

### D3 — Slot capacity is counted per business, ignoring the hall

`src/services/slotService.js:373-380` — the used-count `WHERE` is
`{ slotTemplateId, bookingDate, status }`, **with no space term.**

**Effect:** a venue-wide template with the default `capacity = 1` means one booking **across all
five halls**. Booking "Dinner event" in Main Hall reads "0 left" in Terrace Lawn, Mardana and
Zenana too. This is the mechanism behind the live observation that switching halls changed nothing.

### D6 — A "whole day" block runs 05:00 → 05:00 PKT *(found by the step-2 regression test)*

`spaceBookingService.bookingSlotToRange` builds the whole-day branch from
`` wholeDay(`${bookingDate}T00:00:00.000Z`) `` — **UTC** midnight. PKT is a fixed +05:00, so a
"whole day" claim on 9 Sept actually covers **9 Sept 05:00 → 10 Sept 05:00 PKT**.

**Effect:** it misses 00:00–05:00 of the day it is meant to block (a baraat running past midnight)
and wrongly blocks 00:00–05:00 of the *following* day. Every unrecognised label takes this branch —
which, per D1, is currently every custom slot.

Pinned by a test asserting the wrong-but-current value, deliberately **not** fixed in step 2:
moving the anchor changes what a whole-day block covers on a live booking guard and needs its own
step with its own verification.

### D4 — The database claim is built from the wrong times

`spaceBookingService.bookingSlotToRange` buckets by the hardcoded 09/14/18 boundaries and **never
reads the template's own `startTime`/`endTime`**. So "Morning 10:58" and "Lunch 12:00" land in the
same bucket and collide on the `EXCLUDE` constraint, while "Dinner 19:00" claims until midnight.

**The one correct guard in the system is fed the wrong ranges.**

### D5 — Two writers, disjoint validation, one table

| | `slotService.createTemplate` | `venueSlotService.createSlot` |
|---|---|---|
| duplicate label | ✅ rejects | ❌ none |
| time overlap | ✅ rejects (buffer-aware) | ❌ none |
| `end > start` | ❌ none | ✅ rejects |
| capacity ceiling | ❌ none (accepted 150) | ✅ ≤ 50 |
| writes `subVenueId` | ❌ **cannot** | ✅ |
| delete semantics | soft (`isActive = false`) | **hard `destroy()`** |

The only slot editor a vendor can actually reach is the Venue-OS one — the path with **no overlap
check** and a **hard delete** on a table `Bookings.slotTemplateId` references. That is how
"Morning 10:58 – 22:58" came to exist and to overlap Lunch and Dinner.

Worse, `slotService`'s overlap/dup checks are **business-wide and ignore `subVenueId`**, so through
that route Terrace Lawn cannot have a 12:00 lunch if Main Hall already does.

---

## 4. Supporting defects

- **`BusinessSlotBlocks` has no `subVenueId`.** A vendor cannot close one hall for a day — every
  block is venue-wide.
- **`CHECK endTime > startTime`** makes an overnight slot (22:00 → 02:00 mehndi) structurally
  impossible.
- **No unique index on `BusinessSlotTemplates` at all** — duplicate and overlapping slots are
  legal at the database level.
- **Four tables claim to be "the vendor's halls"**: `SubVenues`, `BusinessResources` kind=`hall`,
  `BookingDetails.resourceId`, `BookingDetails.subVenueId`. The offline-booking dialog renders
  **two** hall pickers stacked, and the second is permanently empty.
- **The calendar's empty state sends vendors to the wrong screen** — "Add them in Settings →
  Availability", which is a blocked-dates editor. The real editor is `/dashboard/venue-os?tab=spaces`.
- **Public detail page and booking page disagree.** The detail page renders the legacy
  9:00/2:00/6:00; the booking page renders the vendor's real 10:58/12:00/19:00. Neither set exists
  on the other screen.
- **Conflict recovery offers times that do not exist** — `getAlternativeTimeSlots` returns the
  hardcoded three.
- **Review and Success screens use a third and fourth hardcoded vocabulary**, and never show the
  vendor's slot label or the chosen hall.

---

## 5. What is already right, and must be kept

The correct engine **already exists** and is not dark:

- `BookingSpaces.slotRange` is a real `tstzrange`.
- `EXCLUDE USING GIST ("subVenueId" WITH =, "slotRange" WITH &&) WHERE (state='CONFIRMED' AND "subVenueId" IS NOT NULL AND "deletedAt" IS NULL AND "isOverbook" = FALSE)` — a **database-level**
  double-booking guard, with `btree_gist` installed.
- `role ∈ {MAIN, MARDANA, ZENANA, COMBINED}` — the Pakistani marquee case is modelled.
- `SpaceMergeGroup` + members — "Mardana + Zenana sold as one event" is modelled, priced at
  `combinedPricePkr`, and explicitly *never automatic*.
- `isMaintenance`, `isOverbook` (+ audit), `clientOpId` for offline idempotency.
- `SubVenues` is a self-referencing tree with `fireRatedCapacity`, `comfortCapacity`, `genderMode`,
  `bookingMode ∈ {SESSION, WHOLE_DAY}`.
- `BusinessSlotTemplate.isActive` — **the "vendor decides which slot is live" flag already exists.**
  It needs a UI, not a column.

`SCHEDULING_MULTI_RESOURCE` was never enabled, and the gate has since been removed: the engine now
engages when a venue has >1 leaf space **and** someone explicitly picks one.

**So this is not a build. It is a convergence.**

---

## 6. The fix, in order

Each step is independently shippable and reversible.

| # | Change | Risk | Why this order |
|---|---|---|---|
| **1** | ✅ *(done)* Quick-booking sheet sends `slotTemplateId` | none | Unblocks the vendor booking their own venue |
| **2** | ✅ *(done)* `bookingSlotToRange` reads the template's real `startTime`/`endTime` instead of the 09/14/18 buckets | low | Feeds the correct guard correct data. Must precede 3 |
| **3** | ✅ *(done)* `slotVocabulary.clockSlotsFor` takes an optional real window and computes the sessions it spans. Whole-day stays for genuinely ambiguous **names**; **without a window nothing changes at all**, so no caller is loosened that cannot supply real hours | medium — landed only after 2 | Kills D1, the "dates conflict" |
| **4** | ✅ *(done)* `usedCount` + `assertSlotAvailable` take an optional `subVenueId`; the advisory lock key carries it too. Applied **only** when `defaultSpaceIdFor` says the venue has more than one bookable space | low | Kills D3 — halls stop cannibalising each other, and the write guard stops disagreeing with the read |
| **5** | Backfill `subVenueId` on existing templates; repair malformed rows (the 10:58 "Morning") | low | Data hygiene before the UI exposes it |
| **6** | One slot writer. Merge `venueSlotService.createSlot` into `slotService` with the union of both validations, scoped per space. Soft delete only | medium | Kills D5 |
| **7** | Add `UNIQUE (businessId, subVenueId, label)` + an overlap `EXCLUDE` on the template table | low | Makes D5 structurally impossible |
| **8** | ✅ *(done)* The per-line capacity model. `BookingDetails` gains `slotTemplateId` + `guestUnitsConsumed`; `usedCount` counts **lines**, not bookings; the space claim and the reschedule re-claim resolve the slot window **per business**. **RACE-3 / `MULTI_SLOT_TEMPLATE` is lifted.** `MIXED_SLOT_MODE` **stays** — see below | **high** | The counter was the reason RACE-3 existed |
| **8a** | ✅ *(done)* Submit failures persist on the page instead of vanishing into a toast, and the mixed-cart / whitelist rejections carry a hint that names the actual next action | low | The customer no longer completes six steps and is left on Review with no explanation |
| **9** | ✅ *(done)* One slot + space editor, reachable from the calendar's empty state, with the `isActive` toggle exposed | — | The vendor-facing ask |
| **10** | ✅ *(done)* Single slot vocabulary — **eleven** private copies collapsed into `lib/booking/slot-vocabulary.ts`, and the vendor's slot label + hours now travel with the booking so the later screens can actually say it | low | Stops the disagreement |
| **11** | ✅ *(done)* `BookingDetails.bookingTime`. The conflict read is widened to (date) and compares **per business** on `COALESCE(line, booking)`; the legacy whitelist runs per line. **`MIXED_SLOT_MODE` is lifted.** | high | Both cart guards are now gone |

### Both cart guards are gone, and neither was deleted

`MULTI_SLOT_TEMPLATE` (step 8) and `MIXED_SLOT_MODE` (step 11) were not
over-cautious checks. Each was preventing a real silent double-booking, and each
was removed by removing its cause:

| | The cause | What replaced it |
|---|---|---|
| `MULTI_SLOT_TEMPLATE` | one `Booking.slotTemplateId` column; a two-template cart wrote NULL and vanished from the capacity counter | the slot on the **line**, and a counter that counts lines |
| `MIXED_SLOT_MODE` | one `Booking.bookingTime` string; the legacy vendor was conflict-checked against the slot vendor's time | the time on the **line**, and a conflict read that compares per business |

**Lifting a guard is not deleting a check.** `usingSlotTemplates` is true only
when *every* vendor carries a template, and the per-package check, the advisory
lock and `assertSlotAvailable` were all gated on it — harmless while mixed carts
were refused, a hole the moment they were not. They now gate on `anySlotMode`.
`usingSlotTemplates` survives with one job: deciding whether the cart may claim
a booking-level `slotTemplateId` (a mixed cart may not, or the legacy line would
count against the slot vendor's template through the counter's `COALESCE`).

### The property step 8 rests on

> For every row arrangement the write path or the migration can produce, the new
> counter never returns **less** than the old one.

Undercounting is the failure that double-books; overcounting merely refuses a
booking that was free, which a vendor can see and report. It is asserted over
all 48 reachable arrangements of (line slot, booking slot, line status, booking
status, date) — singly, in pairs, and under a hall filter — and it **failed on
first run**, which is how the cancelled-line case was found: backfilling a
cancelled line would have handed its own slot to a row whose capacity the old
query held, and freed a slot that yesterday was taken. The migration now skips
those lines.

Checked against production the same way: over the 121 (template, date) pairs
that exist in live data, old and new return **identical** counts.

**Not doing:** a new slot table. The target model is already in the schema; the work is to make one
engine authoritative and delete the other two paths.

---

## 7. Open question for the product owner

Containment is confirmed as the default: booking the whole venue blocks every hall, and booking any
hall blocks the whole venue. Merge groups (`Mardana + Zenana` as one event) stay **explicit
packages, never automatic** — which is exactly what `SpaceMergeGroup` already documents.
