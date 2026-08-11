# Slot campaign — deploy runbook

**You run this. I cannot push, and deploying requires a push.**

Branch `fix/deep-ux-maturity-audit` on both repos. Nothing on it has been
exercised by a real booking — every claim below is from tests and from
read-only/rolled-back queries against production. That is exactly why this
document exists.

---

## 0. Before anything

```bash
# both repos, confirm you are on the branch and nothing is dangling
cd "event-planner-api" && git status -sb && git log --oneline master..HEAD | cat
cd "../ems-v0"        && git status -sb && git log --oneline master..HEAD | cat
```

Take a database snapshot in the Railway dashboard. Three migrations write to
tables that hold live bookings. Two of them are reversible by their own `down`;
a snapshot is what makes the third decision cheap.

---

## 1. Migrations, production-first

Backend migrations must land **before** the backend code that reads the new
columns, because the code reads them unconditionally.

| Order | Migration | What it does | Reversible |
|---|---|---|---|
| 1 | `20260811090000-slot-template-integrity` | unique label + overlap `EXCLUDE` on `BusinessSlotTemplates` | yes — drops both |
| 2 | `20260811120000-wholeday-claims-to-pk-midnight` | re-anchors whole-day claims to PKT midnight | yes — shifts back |
| 3 | `20260811140000-bookingdetails-per-line-slot` | adds `slotTemplateId` + `guestUnitsConsumed` to `BookingDetails`, backfills | yes — drops columns |
| 4 | `20260811160000-bookingdetails-per-line-time` | adds `bookingTime` to `BookingDetails`, backfills | yes — drops column |

```bash
cd "event-planner-api"
npx sequelize-cli db:migrate
```

**Expected output**, measured against production on 2026-08-11:

```
[SLOT-06] whole-day claims re-anchored to PKT midnight: 1
[SLOTS step 8] booking lines given their own slot: 6
[SLOTS step 11] booking lines given their own time: 139
```

If any of those three numbers differs, **stop and tell me**. They were measured
from live data; a different number means the data moved and the assumptions
behind the backfills need re-checking, not overriding.

Migration 1 can fail if a vendor created an overlapping slot since 2026-08-11.
That is the constraint doing its job on real bad data, not a bug — the offending
row has to be fixed or deactivated first.

---

## 2. Deploy

Backend (Railway) before frontend (Vercel). The frontend sends `slotLabel` /
`slotStartTime` / `slotEndTime` and, for mixed carts, per-vendor `bookingTime` —
all additive fields an older backend ignores, so the ordering is a preference
rather than a hard requirement. Migrations before backend is the hard one.

---

## 3. Verify — in the browser, as a real vendor and a real customer

Not curl. Every one of these is a click, and after every mutation: **hard-reload
and read the value back.**

### A · The vendor can book their own venue (this was the original complaint)

1. Vendor portal → Calendar → hover a free date → **+** appears on the right.
2. Click it. The quick-booking sheet opens with that date.
3. Pick the vendor's own slot (e.g. `10:58`), fill name/phone/amount, save.
4. **Expected:** it saves. Before this branch it returned
   *"Invalid booking time. Allowed slots: 09:00, 14:00, 18:00"*.
5. Hard-reload. The booking is on the calendar, on the right date.

### B · Lunch does not swallow dinner (SLOT-06 / step 3)

1. Same venue, same date, same hall. Book the **Lunch** slot.
2. Hard-reload. Try to book **Dinner**, same hall, same date.
3. **Expected:** dinner is still offered and still sells.
4. Try to book **Lunch** again in that hall. **Expected:** refused.

### C · One hall does not consume the others (step 4)

1. A venue with more than one hall. Book *Dinner* in **Main Hall**.
2. Hard-reload. Open **Terrace Lawn**, same date, same slot.
3. **Expected:** it reads available, not "0 left".

### D · Live / Hidden actually hides (step 9)

1. Venue-OS → Halls & spaces → pick a space → toggle a slot to **Hidden**.
2. Hard-reload the editor. **Expected:** the slot is still listed, dimmed,
   badged "hidden" — it must not vanish, or you could never switch it back.
3. Open the **public** booking page for that venue in a private window.
   **Expected:** the hidden slot is not offered.
4. Toggle it back to Live. Hard-reload both. **Expected:** it returns.

### E · The slot is named the same everywhere (step 10)

Book through the customer funnel against a vendor slot called something like
"Dinner event", and read the slot on each screen:

- date-time step · review · payment modal · success · vendor success
- then the customer's **bookings list**, **booking detail** and **payments** page

**Expected:** every one says the vendor's own label. Before this branch the
later screens said a bare `19:00`, and the vendor success screen said `14:00`
for two of the three legacy slots.

The three post-booking pages will show the legacy period name rather than the
vendor's label until the API returns `slotTemplateSnapshotJson` on them — that
is stated in `lib/booking/slot-vocabulary.ts` and is not a regression.

### F · A whole-day block covers the right day (SLOT-06)

1. On a `WHOLE_DAY` space, block or book a date.
2. **Expected:** the whole of that PKT day is held — including 00:00–05:00,
   which used to stay free — and the following day is **not** held.

### G · The mixed cart (step 11)

Only if you have a cart flow that can hold two vendors. One venue on its own
slot template, one vendor with no slots.

- **Expected:** it books.
- **Expected:** the legacy vendor is refused if its time is not 09:00 / 14:00 /
  18:00, and the message names *that vendor*, not the cart.

---

## 4. If something is wrong

Each step is independently reversible.

```bash
# undo the most recent migration only
npx sequelize-cli db:migrate:undo
```

- **Wrong slot hours on new bookings** → migration 2 (`down` shifts back).
- **Capacity counted wrongly** → migration 3's `down` drops the columns; the
  counter falls back to `Booking.slotTemplateId` through its `COALESCE`.
- **A cart refused that should not be** → migration 4's `down`; the conflict
  check falls back to the booking-level time the same way.

There is no feature flag on any of this, deliberately — see the standing
decision that flags are debt in this codebase. Reversal is by migration and by
`git revert`, both of which are honest about what changed.

---

## 5. What is still not done

- The reschedule dialog offers only the three legacy periods, so a vendor's own
  slot cannot be rescheduled *into* from there. Stated in the file.
- `BusinessSlotBlocks` has no `subVenueId`, so a vendor still cannot close one
  hall for a day — every block is venue-wide.
- `CHECK endTime > startTime` still makes an overnight slot (22:00 → 02:00)
  impossible to store. The range maths handles it; the schema does not.
- The customer-facing booking/payments endpoints do not return
  `slotTemplateSnapshotJson`, so those three screens cannot yet show a vendor's
  slot label.
