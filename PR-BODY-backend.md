**⚠️ This supersedes PR #80, which merged only the first of these commits. The `excess_only` fix is not on main, so the settlement double-charge is live right now — bookings 192, 190 and 189 on venue 3358 would each bill the party's food twice.**

Run migration `20260824170000` before deploying: `Booking` is read with all model attributes, so the model must not land ahead of the SQL.

## Settle the bill on the night

`utils/settlementPolicy.js` was complete and correct — `bill = max(guaranteed, actual)`, tolerance band, walk-in rate, children drawn *out* of the stated total, staff on their own rate, fractions rounded up — and **called from nowhere**. Three references existed, all prose in comments. A venue could set every term and none of them did anything.

Now wired: `guaranteedHeadcount` (snapshotted at lock, so a later minimum change can't rewrite what was agreed), `finalHeadcount` and its breakdown, a frozen `settlementJson`. `GET /:id/settlement` is readable by **both** parties on purpose — most disputes are "why is it more than you said", and every line carries a `why`.

**Then testing it against a real booking found a defect in it.** After the `includesFood` backfill every package is flat *and* food-inclusive with a per-head menu attached for dish choice, and `resolvePerHeadRate` read that suppressed menu price as the settlement rate — billing the whole party's food a second time, at the one moment nobody re-checks the maths. Three modes now:

| Mode | When | Bills |
|---|---|---|
| `per_head` | per-head package, or menu priced separately | every head |
| `excess_only` | flat package already covering food | **only guests beyond the guarantee** |
| `none` | nothing per-head | refuses to invent a rate |

## Two rules built and never called

**`oneDishRule.js` appears exactly once in the backend — inside a comment.** The s.5 one-dish rule was a frontend hint; a vendor could save two salans with one curl. The verdict now comes from the server, recomputed from the saved row. Returned rather than refused: s.5 binds Punjab/ICT/KP, and a Karachi marquee serving two mains is doing nothing wrong.

**`grep extras packageController.js` → nothing.** BK-075 built priced add-ons, `pricingService` throws `unknown_extra` against a column NULL on every row. The whole feature was unreachable. Now validated and wired on create *and* update.

## A20 — the advance moves to the new date

`advanceTransferMonths` was settable, validated 0–60, read into the policy object, **enforced nowhere**. A paid booking could move arbitrarily far while the platform implied the advance still stood.

Measured from the *original* date (postponing twice can't extend your own deadline). Moving earlier always allowed. Nothing paid → never blocked. Unset policy → unlimited, because inventing a deadline forfeits a real family's money. `addMonths` clamps: 31 Jan + 1 month is 28 Feb, not 3 March.

## The two genuinely orphaned Venue-OS models

Researched, not recalled.

**EOBI** is charged on the **federal minimum wage, not the worker's pay** — a bearer on Rs 25,000 and a manager on Rs 150,000 generate the same contribution. Employer 5% / employee 1%; provincial ESSI 6% employer-only from 6+ workers; due the 15th of the following month; late 2%/month capped at 50%. Minimum wage is a dated table (37,000 → 40,000 → 40,700) read by the contribution's own month.

**Receipt serials** are pre-allocated blocks, because a cash desk works through load-shedding and the printed number must be final. The FBR IRN is kept strictly separate — it's issued in real time through PRAL and cannot exist offline.

## Verification

**1908 unit tests passing**, 116 new. The 8 failures are pre-existing — proven by stashing and re-running against clean `main` (identical `Expected 220000 / Received 50000` in `zeroPriceGuard`).

Everything above was found by driving production in a real browser, not by reading code.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
