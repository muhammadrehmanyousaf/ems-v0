# Module audit — weddingwala.pk, 2026-09-27

Every claim was checked against **live production** — the console driven headed
in Playwright, the API probed with a real session, and the whole frontend read
by two static scans. Where I am proposing rather than reporting, it says so.
Where I could not verify something, it says that too.

---

## 0. Coverage — what I actually looked at

| surface | depth |
|---|---|
| 48 vendor-console screens | **rendered + inventoried** (276 actions, 40 drawers, 20 confirms, 99 fields) |
| Bookings module | **taken apart** — every action, drawer, field, endpoint |
| Every unreferenced API export | **probed against production** |
| All 682 components | **import-graph reachability** from 373 route entries |
| Customer surface, 13 routes | rendered clean, not taken apart |
| Admin console, 14 routes | **NOT VERIFIED** — the AdminGuard blocks a vendor account; I have no admin login |
| 360px mobile, 8 key screens | checked; one real finding |
| Leads/Quotes/Khata/Venue-OS internals | rendered + inventoried, **not** taken apart |

**44/44 console screens and 13/13 customer screens render clean** with zero JS
errors. Nothing is broken. What follows is about *reach* and *honesty of state*.

---

## 1. The dominant defect: a finished back end behind a missing door

Found **nine** times now. In each case the endpoint, the service and often the
admin screen were complete; nothing in the product could reach them.

| feature | back end | user entry point |
|---|---|---|
| Vendor claim | complete | missing → fixed |
| Refund approval | complete | missing → fixed |
| Chat attachments | complete | missing → fixed |
| Vendor media | complete | missing → fixed |
| KYC / verification | complete | missing → fixed |
| Post-event completion | complete | missing → fixed |
| **Mid-booking change requests** | complete | **missing → fixed in this pass** |
| Lead contact logging | complete | missing → fixed |
| **Vendor reschedule of an offline booking** | complete | **missing → fixed in this pass** |

### 1.1 Change requests were a dead end — and the customer half is live

The couple's page has always offered *"Send a request to the vendor"*. The back
end has always had approve, decline and a separate path for a cancellation
request. The answering card hung off `bookings-redesigned-view`, which nothing
has imported since the artifact port.

Every request expired unanswered:

| booking | type | status | raised |
|---|---|---|---|
| 688, 673, 563, 548 | `guest_count` | **expired** | 2026-08-26 |

Worse than the other six, because the customer-facing half **promises a reply**.
`cancel_request` rides the same queue, so a couple asking to cancel inside the
notice period was equally invisible.

**Fixed and verified**: raised as the customer, answered as the vendor both ways
— declined with a note (status `declined`, note persisted) and approved
(guests 250 → 262, total correctly unchanged on a flat package).

---

## 2. A whole analytics layer, computed and unreachable

Nine endpoints, all returning **real data on production**, none rendered
anywhere. `/dashboard/insights` fetches only KPIs and revenue trends.

| endpoint | what it returns today |
|---|---|
| `/analytics/health-signals` | **62 unanswered enquiries, oldest 116 days** |
| `/analytics/cash-flow-forecast` | Rs 27.3M total, Rs 5.4M in horizon, peak Oct 2026 Rs 2.6M |
| `/leads/conversion-analytics` | 80 leads → 10 booked, 12.5% |
| `/analytics/response-times` | responded vs unresponded, by source |
| `/analytics/seasonality` | months, YoY, peaks |
| `/expenses/booking/:id/pnl` | per-booking profit |
| `/businesses/:id/pricing-rules` | rules, bounds, engine flag |
| `/staff/team-calendar` | shifts by day |
| `/analytics/whatsapp-templates` | template performance |

**62 enquiries unanswered, the oldest waiting 116 days**, is the worst number on
this platform. Its only consumer was the React overview the artifact port
replaced — leaving two dead imports behind and the number going nowhere.

**Fixed**: it is now the first row of *Tawajjo chahiye*, styled as a warning,
because it is the one line there still *losing* business rather than recording
it. The other eight remain unbuilt — they need a decision about where they live,
not a bug fix.

---

## 3. The vendor could not record the price they agreed

A marquee lists Gold at Rs 760,000 and closes at Rs 700,000. Ordinary here, and
impossible to record.

`agreedAmount` looks like the field and is not — pricing treats it as a Rs 0
rescue for an unpriced listing and refuses to override a package. The form's own
label said so (*"sirf agar package select nahi"*). After creation there was **no
price edit at all**: the `data-settle-*` controls are final-headcount
settlement, a different thing. And `PUT /bookings/:id/order-lines` — a complete
pricing engine with its API wrapper written — is imported by nothing.

**Fixed** via `negotiatedAmount`, which routes to the map that genuinely
replaces the catalogue price, under the same ownership check the quote map uses.
Verified six ways including that a customer sending it is ignored.

**One consequence to decide on:** a vendor can now book **below their own
minimumPrice** (Rs 300,000 against a Rs 350,000 floor was accepted). That is the
documented semantics of this map, and the floor is a listing guard rather than a
legal minimum — but it is a real change in what the system permits.

---

## 4. Honesty of state — 13 screens lied when a request failed

The console canon says `isError → errorBannerHtml`. Thirteen screens fetch data
and handle no error at all. Two were worse than empty:

- **Settings** and **Profile** showed *"load ho rahi hain…"* **forever** on a
  failed request — a permanent loading state with nothing to click.
- **Booking detail** showed *"Ye booking nahi mili"* — telling a vendor their
  customer's booking **does not exist** when the network had simply dropped.

**Fixed** those three, each with the shell's retry button wired. The other ten
(drone-NOC, halal-certs, generator-fuel, cancellation-policy, onboarding, then
trade-ops, automation, slots, calendar, chat) were finished in the same day's
second pass — **all thirteen now say "could not load" and offer a retry**, each
proven by aborting that screen's own request. Two were worth more than a banner:
the **calendar** keeps its grid and carries the warning above it, because a
vendor still needs to block dates on a blip and an empty-looking month is how a
hall gets double-booked (WWL-569); **chat** already had `conversationsError` and
`messagesError` in its context from WWL-019 and read neither, so a failed inbox
said "Abhi koi conversation nahi" — an empty inbox is the one thing nobody
chases.

Also fixed: **collaborations "Cancel"** withdrew an invite from another vendor's
inbox on one click, with no confirm — the one survivor of the un-gated-action
sweep. (`kitchen-prep delrow` looked like a second one and is **not**: it removes
an unsaved row from a local form builder.)

---

## 5. Mobile, 360px

- **No page-level horizontal overflow on any screen** — the main risk, clean.
- Every "covered control" my first sweep reported was **my own instrument**: the
  TanStack Query devtools button (z-index 100000, bottom-right) on the dev
  server. It is correctly gated to `NODE_ENV === "development"`; on production
  the chat Send button is fully visible. Reported here because a false "7 of 8
  screens broken" is worse than no data.
- **One real finding:** at 360px `/dashboard/chat` stacks the inbox list *and*
  the open conversation on one screen, clipping the second inbox row. A phone
  should show list → tap → conversation with a back button. Pakistan is a
  mobile-first market; this is the screen a vendor uses most.

---

## 6. Smaller findings

- ~~`GET /packages` returns 0 for everything~~ — **WRONG, retracted.** It
  returns `{ results, meta }`; my counter looked for `rows`/`items`/`data` and
  not `results`, so it read 4 packages as 0. The endpoint is fine, the frontend
  reads `.results` correctly, and `/dashboard/packages` does render the vendor's
  packages (verified on production: "Silver — Nikah Package" and
  "Gold — Barat Package" both on screen). The same key assumption also made my
  first sweep report `rows=0` on several admin screens that render cards.
  Recorded rather than deleted, because the shape of the mistake — a probe that
  only knows some response envelopes — produced three separate false alarms in
  this audit.
- **Cancelled bookings appear under "Aane wale events"** (upcoming) on the
  dashboard. They carry a Cancelled chip, so it is clutter rather than a lie.
- **48 unreferenced API exports** in total; the Stripe client
  (`lib/api/payments.ts`, 6 functions) is dead weight from a removed integration
  and can be deleted.
- **260 unreachable components**, 110 of them known artifact-migration residue.

---

## 7. What I have NOT done

- **Admin console (14 routes) is unverified.** The guard blocks a vendor
  account; every route returned the same shell. I need an admin login.
- **Leads, Quotes, Khata cluster, Venue-OS cluster** are rendered and
  inventoried but not taken apart the way Bookings was.
- **Customer surface** beyond bookings — quotes, plan, umbrellas, complaints,
  payments — rendered clean, logic not traced.
- The **eight remaining analytics endpoints** have no home yet.

---

## 8. Order I would work in

1. The eight unreachable analytics surfaces — cash flow and lead response first
2. Chat at 360px (list → conversation navigation)
3. ~~Error states on the remaining ten screens~~ — done, see §9
4. Instalment proposal + vendor approval (§ see the design below)
5. Price change *after* creation, through history and the refund engine
6. Take Leads / Quotes / Khata / Venue-OS apart properly
7. Admin console, once I can sign in

---

## 9. Second pass, same day — what the first pass got wrong

The first pass "fixed" error states on thirteen screens. Seven of those fixes
**could never fire**, and the page rendered perfectly, which is why nothing
looked wrong.

### 9.1 The dead-branch trap

Every artifact screen rebuilds its HTML inside a `useEffect`. A query's
`isError` has to be in that effect's dependency array or the error branch is
unreachable code that typechecks, ships and does nothing. I had added
`if (q.isError) …` on seven screens and left `isError` out of the deps.

Caught mechanically, not by reading: abort the screen's own request in
Playwright and assert the banner *and* its retry button appear. Six of six
re-tested screens now pass. **This trap is now the first entry in both
CLAUDE.md files** — it is invisible to review and invisible to a happy-path
test.

### 9.2 Two screens were lying about money

- **Venue-OS profit.** The P&L subtracted real expenses from *booked contract
  value* and called the result cash profit: **Rs 3.01 crore at 64% margin**
  where the truth is **Rs 64.1 lakh at 28%**. A 4.7× overstatement on the
  screen a vendor would use to decide whether the business is worth running.
  Now computed from receipts.
  Then my own fix introduced the mirror-image lie: when the cash request
  failed, `received` defaulted to `0`, so the screen announced *"Business ghata
  mein ja raha hai"* on a profitable venue. `received` is now nullable — an
  unknown number prints `—` and the verdict stays quiet.
- **The pay page asked a customer for Rs 325,000 on a booking that was already
  cancelled and refunded.** Now gated by a shared `isClosedBookingStatus()`.

### 9.3 Reach, measured

An endpoint-map scan (backend routes ∩ every frontend reference, template
literals resolved) ended at **99 endpoints with no caller**, now **98** with the
reschedule door added — down from a first reading of 366. All four corrections were instrument bugs: `${BACKEND_URL}api/v1/x`
has no leading slash, `${BASE}/x` where `BASE` is a path const, a bare
`const v1 = ${BACKEND_URL}api/v1`, and `${encodeURIComponent(...)}` inside a
path. The scan now asserts seven known-reachable endpoints are *not* reported
missing; if a control trips the numbers are void. Slots CRUD was a false
positive both times before that.

### 9.4 Fixed in this pass

| what | why it mattered |
|---|---|
| Vendor reschedule of an offline booking | a walk-in written on the wrong date could only be cancelled and re-entered, losing its receipts and history |
| Change requests answerable by the vendor | the customer half promises a reply; every request had expired unanswered |
| Agreed price alongside a package | the vendor could not record the number they actually settled on |
| Cash-flow forecast, seasonality, conversion | three computed analytics with no screen |
| Admin vendor queue counts | the first tab was empty, hiding 3,232 waiting vendors |
| Lead contact logged on WhatsApp / call hand-off | outreach left no trace, so "unanswered enquiries" was wrong |
| Post-event closure button | gated on a status regex that also matched "Awaiting Payment" |
| Chat at 360px | inbox and conversation shared one phone screen |
| Vacation mode reachable, and per-venue | the card existed; nothing mounted it, and it kept the previous venue's state |
| Dues KPI relabelled | "abhi tak pending" for a figure scoped to this year's events |
| Error states on the last five screens | automation and trade-ops hung on "load ho rahi hai…" for ever; slots claimed a three-session venue had none; chat called a failed inbox empty |
| Response-time card | 21 of 25 leads never answered, and nothing in the product said so |
| Blocked-date lock on the reschedule endpoint | the new door would otherwise have been a route around the lock `createBooking` enforces |

### 9.5 Still open, and who has to do it

- **The money backfill is yours to run.** 14 bookings, Rs 310,250, where a
  refund left `downPayment` stale. The repair endpoint is deployed; the write
  is on production data, so I stopped and left a paste-ready snippet on backend
  PR #160 rather than run it.
- **Calendar drag-to-move.** The reschedule endpoint was written for it
  (`§M4`, "so the calendar can drag-drop those freely"); the calendar has no
  drag code at all. The booking detail now has the door, which is the part a
  vendor needs.
- Instalment proposal (§ Appendix) and price-change-after-creation are
  unchanged — both are features, not gaps.
- The eight analytics endpoints with no home are now down to two:
  `getTodaysBookings` and `getUpcomingBookings7Days`, and the overview already
  answers both from the KPI endpoint (`upcomingBookings.value` feeds the
  "Aane wale (7 din)" card), so they are duplicates rather than gaps.
  **Response times got a card**, and it is the bluntest number in the product:
  on the reference vendor, 25 leads, **4 answered, 21 never** — median 56 days.
  The endpoint scopes by vendor rather than by business, so the card says
  "saari venues" instead of implying one; its buckets and hours are re-said in
  Roman Urdu (the endpoint answers in English hours, and "1350 ghante" reads as
  a glitch).

---

## 10. "If I block a date, nothing should be bookable on it" — every path

Asked as a question about one button, and it turned out to be a question about
nine paths. A blocked date DID stop a booking being created; four other ways
onto a closed date had no lock at all, and the couple's own date picker at a
slot-engine venue never even greyed the day out.

| path onto a closed date | before | now |
|---|---|---|
| Vendor console form → create | refused, message mapped | + **warns before the form is filled** |
| Customer flow → create | refused; picker greys the day (legacy venues) | unchanged |
| Customer picker at a **slot-engine** venue | **offered three bookable slots on a closed day** | day closed |
| Wedding-plan checkout, quote acceptance | refused (they route through the same core) | unchanged |
| Vendor reschedule of an offline booking | refused (added earlier the same day) | unchanged |
| **Customer reschedule, and postpone-then-resume** | **no check at all** | `date_blocked` 409 |
| **Customer reschedule into vacation mode** | **no check** (create has had one for ever) | `vendor_on_vacation` 409 |
| **`POST /bookings/hold`** | **no check** | `DATE_BLOCKED` 409 |
| **"Closed every Monday" (recurring), legacy-mode create** | **booking went straight through** | `DATE_BLOCKED` 409 |
| Blocking a day that is already sold | refused, 409 naming the booking | + **the calendar now shows that reason** |
| Calendar "+ → Nayi booking" on a closed day | dead end: form, fill, refusal | says it is closed, offers Unblock |
| Calendar block/unblock that the server refuses | **`.catch(() => {})` — nothing happened, nothing said** | the reason is shown |

### 10.1 The two block tables, again

`VendorBlockedDate` is what the calendar's "Poora din band" writes.
`BusinessSlotBlock` + `BusinessRecurringBlock` are what the slot engine reads.
Nothing read both, so each side enforced a rule the other could not see:

- the slot engine's availability never mentioned the calendar's block — which
  is why a couple was shown three open slots on a closed day (proven live on
  the QA venue). Folded in, **on the display side only**: the same switch also
  gates an existing booking's slot swap, and refusing that is a different
  decision than the one being made here.
- the core's create lock never read the recurring table — so "closed every
  Monday" saved, showed on the availability card, and a Monday booking still
  went through. Proven live: recurring Monday block, `POST /bookings` for that
  Monday → **201**. Now 409, asked through `slotService.isBlocked` so the
  weekday-mask rules cannot drift apart from the engine's.

### 10.2 Left alone, on purpose

- **Bulk import.** A vendor loading years of their own Excel register should not
  have a row refused because of their own block. It reports per row.
- **Per-slot blocks.** The slot engine's business; a whole-day closure is what
  "we are shut" means.
- **`minLeadDays` / `maxLeadDays` and capacity** are enforced on create and not
  on reschedule. Same shape as the two fixed here, not yet done — the next thing
  I would do on this thread.

### 10.3 Verified

Against the live database, every write cleaned up: hold on a blocked date 409 /
open date 201; slot availability on a blocked date — all three slots shut;
create on a blocked date 409; blocking a day that already has a booking 409
naming it; recurring Monday 409 with the Tuesday after still booking. Unit
tests for the reschedule lock and the recurring lock both fail with the guard
disabled and pass with it. Backend suite: **4232 passed, 0 failed**.

---

## 11. The three things §10 left open

All three are now done. What follows is what they actually were, since two of
them were features and one was a guard I had described as "the next thing".

### 11.1 Lead time and capacity on reschedule

`createBookingCore` refuses a date inside `minLeadDays`, beyond `maxLeadDays`
(BK-026) and a guest count over the hall's `maxCapacity` (BK-072). The move
checked none of the three, so "we need 14 days' notice" was avoided by booking a
far date and moving it to next Tuesday, and `newGuestCount` was written onto the
booking with no cap at all — a 300-guest hall talked up to 900 after the fact.
Both mirrored exactly, BK-072's carve-out included: a makeup artist's "guest
count" means service units, and a venue cap means nothing against it.

### 11.2 A price that can change after the contract

The price could be negotiated at creation (`agreedAmountByBusinessId`) and never
again — which is not how a Pakistani wedding works. The family drops the sweet
counter a month out; the hall throws in the mehndi stage to close the deal. With
no way to say so, vendors did it in two dishonest ways: carry the difference in
their head (which is how `baqaya` stops matching reality), or cancel and
re-enter the booking, losing its receipts, its history and its number.

`PATCH /bookings/:id/price` rewrites **one line and the header together**, so the
two can never drift. Money received is untouched — a price change is not a
payment. Where the new price is **below** what has already been received, the
customer has overpaid, and that runs through the same engine a cheaper reschedule
uses: the shortfall is written down as a `pending` cash refund the vendor owes.
An obligation nobody recorded is the one outcome that must never happen. The
listing floor is **not** enforced — it is not enforced at creation either, it is a
listing guard rather than a legal minimum — but `belowFloor` goes on the audit
row so the decision stays visible.

The vendor's door is **"Qeemat badlein"** on the package card. It says what the
number does before it is saved: with money in, dropping below it is not a
discount, it is cash owed back, and it names the figure.

### 11.3 Instalments: the plumbing was there, the conversation was not

`BookingInstallment` had rows, sequences, labels, amounts, due dates anchored at
Pakistan midnight, an overdue sweeper, payment matching, and the schedule on
screen. The plan itself was **two hardcoded rows** — advance, then balance —
nobody proposed and nobody agreed to. In practice a family asks *"teen qiston
mein kar dein?"* on the phone, the vendor says haan, and the system never hears
about it, so every reminder and overdue flag it sends is about a schedule that
was superseded in a WhatsApp message.

The plan now rides `BookingChangeRequest` rather than getting a table of its own.
That queue already has raise / approve / decline / expire, a reason, a decision
note — and, since the change-request card shipped in §1.1, a vendor screen that
answers it. A parallel state machine would have been a second thing to keep
honest.

The rules are Pakistan-shaped, not generic:

| rule | why |
|---|---|
| At most **3** instalments | beyond that it stops being a wedding payment and becomes informal credit nobody can chase |
| Must add up to the outstanding **to the rupee** | a plan that does not is what makes `baqaya` a fiction. Money already received is not re-planned |
| Nothing due inside **event − 7 days** | a balance due the morning of the baraat is not a plan. One explicit `override` exists, because vendors sometimes genuinely agree |
| The **1st–5th** is the salary window | reported, not refused — a plan landing on the 20th is the difference between a plan kept and a plan chased, but it is the couple's money |

Approving replaces only the **unpaid** rows and renumbers after whatever
survives: a paid instalment is a receipt, not a schedule entry.

### 11.4 Two things the live run caught that the unit tests could not

- **The audit row used column names `AuditLog` does not have** (`entityType` /
  `entityId` / `details` instead of `targetType` / `targetId` / `before` / `after`).
  Every price change 500'd on a notNull violation the moment it met a real
  database. Fifteen mocked tests passed straight through it, because a mock
  accepts any shape. The test now asserts the column names for that reason.
- **Three of my own "PASS" lines were 403s from authorization**, not agreement:
  the instrument drove customer-only endpoints with the vendor's token. Re-run
  with both sessions, each on the endpoints that belong to it.

Also finished here: the bulk importer now **reports** rows landing on a date the
vendor has blocked (`blockedDateWarnings`), rather than importing them in
silence. It still does not refuse them — a vendor loading years of their own
register should not have a true row rejected by their own calendar — but two
records that disagree have to say so.

---

## Appendix — instalments, and the "one modal" question

**Instalments.** The plumbing exists: `BookingInstallment` with sequence, label,
amount, due date and status; a schedule seeded at creation; due dates anchored
at Pakistan midnight; an overdue sweeper; payment matching; and the schedule
*is* rendered on the booking (the "Qist schedule" block). What does not exist is
the **conversation**: the plan is a hardcoded two rows (advance + balance),
nobody proposes it, nobody approves it.

Proposed: keep the seeded plan as the default, add
`PROPOSED → COUNTERED → ACTIVE / DECLINED` on top. Pakistan-specific
constraints: cap at 3 instalments; snap dates to the 1st–5th (salary day — the
difference between a plan kept and a plan chased); refuse a final instalment
later than event − 7 days without an explicit override.

**"One modal for the whole booking."** The vendor already has it —
`openBookingForm` collects venue, hall, date, package, menu, guests, contact,
agreed price and advance in a single drawer. For **customers** I would not: the
seven steps are sequential because each answer changes the next question (hall →
capacity, and a venue models halls in two mutually exclusive ways; package →
which menus; menu → the one-dish rule; date → three-state availability and a
48-hour server-owned hold). One modal on a 360px phone means most fields
disabled or wrong.

Better: **one sheet with sliding steps** (feels like one modal, keeps the
dependencies honest), lean harder on the derived step list so a single-hall
venue never asks "which hall?", add a genuine one-screen enquiry path for the
many bookings that close on the phone anyway, and let a couple resume a draft —
`lib/draftStorage/` exists and is create-mode only.


# 2026-09-28 — the hardening list, finished

## 12. The lead that never named its wedding

Converting a lead created the booking, marked the lead won, and threw the new
booking's id away. `LeadAPI.linkBooking` exists for exactly this moment — its
own comment says it is "used by the convert-to-booking flow after the new
booking lands" — and **neither** of the two convert doors called it: lead-detail
called `transition`, the leads list wrote `status: "booked"` directly, and both
ignored the argument `onSaved` handed them.

Driven headed through the product's own convert flow, local frontend against the
live backend:

    lead 770: status=booked bookingId=766
    PASS — the lead is won AND names the booking it became

Mutation-tested: with the `linkBooking` call disabled, the same run gives
`status=qualified bookingId=null`.

**Caveat I want on the record.** Most won leads on production carry
`bookingId: null`, and I earlier attributed that to this bug. Not all of it is:
the lead screen also has a separate **"Jeeta mark karein"** button that
legitimately wins a lead with no booking at all. This fixes the convert flow.
It does not backfill the existing rows, and the existing nulls are not all
defects.

## 13. 121 type errors — what was actually hiding in them

The count was never the point. Of 121:

**37 were in live code, and four were real defects.**

| # | Defect | Effect |
|---|--------|--------|
| 1 | `queryFn: VendorAPI.getAllBusinesses` passed by reference | React Query calls queryFn with its own context object, and that function's first parameter is `availableOn`, a date. Measured on the homepage: `/businesses?availableOn[client]=[object+Object]&availableOn[queryKey][0]=vendors&availableOn[signal]=[object+AbortSignal]` on 34 of 52 calls. The backend ignores it (`bookedBusinessIdsOn` requires `/^\d{4}-\d{2}-\d{2}$/`) so nothing broke — but `data` was `unknown` for every caller, which is why the homepage hero and /search carried 21 of the 121 errors. |
| 2 | `VendorSearch` filtered on `provideFoodTasting` | The column is `provideFoodTesting` (businessModel.js:191). No row has the misspelt key, so `undefined === true` was false for every vendor: ticking "food tasting" emptied the results instead of narrowing them. |
| 3 | `carParkingCapacity` never submitted | The venue wizard asks "Car Parking Capacity" when parking = yes, stores it in `formData`, and the submit payload never included it. The column exists, `createBusinessWithVendor` reads `req.body.carParkingCapacity`, and both the settings screen and the public vendor page display it — so every venue that registered lost the answer. Another finished back end behind a closed door. |
| 4 | `app/sitemap.ts` shipped an image sitemap that was not one | See §14. |

Also fixed, not defects but lies in the types: `Vendor` was missing the nested
`vendor` row the API really returns; `subBusinessType` is a Postgres `TEXT[]` and
one reader called `.toLowerCase()` on it; `CITY_EDITORIAL` claimed to cover 84
cities and covers 11 (`getCityEditorial` already falls back, so `Partial` is the
honest type); `ogType` offered `"product"`, which Next 14's OpenGraph union has
no member for; `isValidImageUrl` returned `""` where it promised `boolean`.

**84 were in 27 files no route can reach.** A duplicate registration wizard
(`components/steps/*` — the live one is `components/VendorStepForms/*`), a
duplicate `VenueSearch` and `VenueDetails` subtree, ten `homepage/Featured*`
components, `VendorFilters`, `vendors-component`, `lib/vendor-utils`,
`lib/store/vendor-store`. Deleted. Verified first by walking the import graph
from all 379 entry points under `app/`, then by confirming the closure of those
27 files has **zero** importers that are live or in a test — and finally by a
full production build.

The ratchet baseline is now `{"total": 0, "counts": {}}`, and
`next.config.mjs` no longer sets `typescript.ignoreBuildErrors: true`: the
compiler gates the build for the first time in this repo's history. The full
build passes with it on.

**What I did NOT delete.** The same graph walk finds **283** unreachable
component/lib/hook files, the bulk of them the previous-generation dashboard
(`*/redesigned/*`, `*/bookingListing/*`) that the artifact console replaced.
None of them carry type errors, so none of them block anything. Removing half
the components directory is the owner's call, not a side-effect of a type
cleanup.

## 14. The sitemap that advertised images and shipped none

`buildImagesShard()` attached `images: string[]` to each row, and its comment
stated that "Next.js's MetadataRoute.Sitemap supports an `images` field, which
it serialises into `<image:image>`". It does not, in 14.2 — its serialiser
(`next/dist/build/webpack/loaders/metadata/resolve-route-data.js`) handles only
loc, lastmod, changefreq, priority and alternates, which is what tsc had been
reporting for three lines.

Measured on the served `/sitemap.xml` **before**:

    loc entries: 7087   distinct: 3812   duplicates: 3275
    <image: tags: 0     xmlns:image: 0

So the shard shipped zero images and 3,275 duplicate `<url>` records — every
vendor, blog and real-wedding URL a second time, with a different priority and
changefreq from its real entry.

**After**, measured on the production build output:

| | before | after |
|---|---|---|
| `/sitemap.xml` loc entries | 7,087 | 3,814 |
| duplicates | 3,275 | **0** |
| `<image:loc>` served | 0 | **3,279** across 3,273 URLs |

`/image-sitemap.xml` is a route handler that emits the real protocol, hourly
revalidated, sharing `projectToCanonical` with the main sitemap through
`lib/seo/vendor-inventory.ts` so the two can never disagree about a vendor's
URL. Both are advertised in robots.txt.

The last two duplicates were their own small defect: `/blog` was listed in the
static block *and* in the blog block, and `/wedding-cost-in-pakistan` is a
`CONTENT_PILLARS` slug that is also in the hand-written flagship list. Both
fixed, plus `dedupeByUrl()` as a guard, because the shards are built
independently enough that it will happen again.

## 15. Venue-OS — and a door that was missed when the tabs were removed

55 of 58 `venue-os/*` view files are unreachable. That is **not** a finding: the
tabbed multi-view hub was deliberately rebuilt as one business-health view at
the founder's direction, and `venue-os-artifact.tsx` says so. The 55 are the
rejected enterprise pilot.

What *is* a finding: when the tabs went, `nav-data.ts` was collapsed to point at
pages that exist, and two other places were not.

- `calendar/v2/calendar-slot-grid-view.tsx` — the empty-state link that tells a
  vendor "No halls or time-slots set up yet → Set up halls & time-slots" pointed
  at `/dashboard/venue-os?tab=spaces`. The one place that tells a vendor their
  halls are not configured sent them to a profit summary. Now `/dashboard/spaces`.
- `lib/nav/module-panels.ts` — "Halls & spaces" and "Event profit" both pointed
  at `?tab=` URLs, so both rows opened the same page.

Found by checking every literal `/dashboard/...` link emitted by a live file
against the 319 routes that exist, rather than by clicking around.

## 16. Six doors into the Khata, one room behind them

The same sweep found the money panel doing what venue-OS had been doing. Six
live rows — Payments, Receipts, Receivables, Expenses, Refunds owed, Cheque
ledger — all pointed at `/dashboard/money?tab=…`. `KhataArtifact` contains no
`useSearchParams` and no reference to `tab`, so every one of them opened the
same combined ledger.

The comment above those rows says they were *"real tabs the money hub reads.
Verified against money-hub-view.tsx rather than assumed."* That verification was
honest when written and has since expired: **nothing renders
money-hub-view.tsx** any more. It is one of the 283 unreachable files. The same
is true of the `isDefaultView` flag on Receivables, whose comment reads
"/dashboard/money renders Receivables" — so a vendor on the Khata ledger saw the
panel highlighting a different screen's name.

What makes this cheap to fix properly: all five destinations already exist as
their own artifact screens — `payments-artifact`, `receipts-artifact`,
`receivables-artifact`, `expenses-artifact`, `pdcs-artifact` — and the module's
`owns` list already contains every one of those paths, so the rail still reads
Khata on all of them. Each row now points at its own screen; with no query
params left, the panel highlight is exact rather than approximate.

"Refunds owed" is the one that stays on `/dashboard/money`, and only
approximately. There is no `/dashboard/refunds` route. The Khata ledger has a
"Wapsi" filter tab, but that lists refund *receipts* — money already returned —
which is not the same thing as money still owed. So the row lands one click from
the nearest view that exists, and refunds owed remains, as its own comment says,
the only kind of money out with no page of its own. Worth a screen; not worth
pretending it has one.

**Two things I nearly reported and did not.** `/dashboard/bookings?bucket=completed`
and the seven `?tab=advanced&group=…` accounting rows are all commented out at
the founder's direction, so they are not live doors. And `/dashboard/settings`
*does* read `?tab=`, so the two links pointing there are fine.

## 17. Venue-OS, driven

| Check | Result |
|---|---|
| Money identity — cash − kharcha = munafa | Rs 2,44,19,131 − Rs 1,68,48,000 = Rs 75,71,131 ✓ |
| Margin is the margin of CASH, not booked | shown 31%, computed 31% ✓ (the WW-BOOKEDVSCASH rewrite, verified live) |
| Per-venue split sums to the booked total | Σ 47,001,250 = booked 47,001,250, exactly ✓ |
| The three "Tafseel ke liye" cards | Reports → /dashboard/insights, Kharcha → /dashboard/expenses, Khata → /dashboard/money, all three land ✓ |
| `/dashboard/spaces` is its own screen | "Halls & Spaces", with "Naya space" and "Spaces combine karein" ✓ |

The per-venue check failed on the first run at Σ 4,542,625,100 against a booked
total of 47,001,250 — roughly 100× over. That was my instrument: `.v-amt`
contains a nested `.v-sub` reading "46% total ka", so taking the element's whole
text glued the percentage digits onto the amount. Read the amount node alone and
it reconciles to the rupee. Worth writing down because a 100× "discrepancy" on a
money screen is exactly the kind of finding that gets reported before it is
checked.
