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
| **2** | `bookingSlotToRange` reads the template's real `startTime`/`endTime` instead of the 09/14/18 buckets | low | Feeds the correct guard correct data. Must precede 3 |
| **3** | `slotVocabulary.clockSlotsFor` — an unambiguous `HH:MM` resolves to its own window, not the whole day. Keep whole-day for genuinely ambiguous **names** | medium — it makes the system *less* restrictive, so it lands only after the range guard in 2 is correct | Kills D1, the "dates conflict" |
| **4** | `slotService.usedCount` adds the space term when the template is space-scoped | low | Kills D3 — halls stop cannibalising each other |
| **5** | Backfill `subVenueId` on existing templates; repair malformed rows (the 10:58 "Morning") | low | Data hygiene before the UI exposes it |
| **6** | One slot writer. Merge `venueSlotService.createSlot` into `slotService` with the union of both validations, scoped per space. Soft delete only | medium | Kills D5 |
| **7** | Add `UNIQUE (businessId, subVenueId, label)` + an overlap `EXCLUDE` on the template table | low | Makes D5 structurally impossible |
| **8** | Accept mixed-mode carts server-side so a venue line can carry a slot while a photographer line does not | medium | Removes the multi-vendor dead end |
| **9** | One slot + space editor, reachable from the calendar's empty state, with the `isActive` toggle exposed | — | The vendor-facing ask |
| **10** | Single slot vocabulary on detail / booking / review / success screens | low | Stops the four-way disagreement |

**Not doing:** a new slot table. The target model is already in the schema; the work is to make one
engine authoritative and delete the other two paths.

---

## 7. Open question for the product owner

Containment is confirmed as the default: booking the whole venue blocks every hall, and booking any
hall blocks the whole venue. Merge groups (`Mardana + Zenana` as one event) stay **explicit
packages, never automatic** — which is exactly what `SpaceMergeGroup` already documents.
