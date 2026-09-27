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

**Fixed** those three, each with the shell's retry button wired. The remaining
ten are lower-traffic venue-OS screens (drone-NOC, halal-certs, generator-fuel,
trade-ops, automation, slots, calendar, chat, cancellation-policy, onboarding)
and are listed here rather than silently left.

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
3. Error states on the remaining ten screens
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

### 9.5 Still open, and who has to do it

- **The money backfill is yours to run.** 14 bookings, Rs 310,250, where a
  refund left `downPayment` stale. The repair endpoint is deployed; the write
  is on production data, so I stopped and left a paste-ready snippet on backend
  PR #160 rather than run it.
- **Calendar drag-to-move.** The reschedule endpoint was written for it
  (`§M4`, "so the calendar can drag-drop those freely"); the calendar has no
  drag code at all. The booking detail now has the door, which is the part a
  vendor needs.
- The **eight remaining analytics endpoints**, the ten lower-traffic screens
  without error states, and instalment proposal (§ Appendix) are unchanged.

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
