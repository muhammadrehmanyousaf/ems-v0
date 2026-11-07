# Vendor portal: issue log

Collected by the owner, one at a time. **Nothing here is fixed yet.** Fixing starts only when the owner says "go".
Each entry says what was seen, why it matters, and what a fix has to satisfy. Causes marked "to check" are guesses from the screenshot, not confirmed in code.

Status key: `OPEN` (logged, not started) · `FIXING` · `DONE`

---

## 1. Dashboard: the Revenue chart  `DONE: merged, empty state verified on production 9 Oct`

> Merged 9 Oct 2026 (backend #184, frontend #340). All 7 defects fixed per the PR. Still to do: headed check on production after the Vercel deploy.

Screen: Dashboard (Overview) > **Revenue** card ("Khata mein aya paisa · Rs lakh"), range toggle on **1Y**.
Evidence: owner screenshot, 8 October 2026.

### What is wrong

1. **X-axis month labels overlap and are unreadable.**
   "September 2026", "October 2026", "November 2026" and "December 2026" run into each other on the right side, and "August 2026" touches "September 2026". Full month + year names are too wide for 11 evenly spaced ticks.

2. **The chart shows months that have not happened yet.**
   Today is 8 October 2026, but the line continues through **November 2026** and ends on a dot at **December 2026**. The tooltip reads "Rs 3.58 lakh, November 2026" for a month with no completed payments. A "money received" chart must not plot the future (or, if bookings due in those months are meant to show, it must be labelled as expected/scheduled and drawn differently, not as received money).

3. **The totals are computed over the wrong span.**
   "Kul is saal Rs 2,44,19,131" and "Ausat / mahina Rs 22,19,921" check out as total / 11, so the average is divided by **11 months (Feb to Dec)** including the two future months, which pulls the average down. It should divide by the months that have actually elapsed (or by the months in the selected range up to today), and "Kul is saal" should say whether it is the calendar year or the last 12 months.

4. **The "1Y" range is not one year.**
   It starts at February 2026 and ends December 2026 (11 months). A 1Y view should be the last 12 months ending this month (Nov 2025 to Oct 2026), or the current calendar year Jan to Dec, whichever the label promises. It currently matches neither.

5. **The curve is over-smoothed.**
   The smoothed spline rounds off real peaks and valleys (June and August in particular), so the line passes through values the data does not contain. Money data should use straight or monotone segments, never a curve that can overshoot.

6. **Y-axis ticks are odd numbers.**
   0, 17.9, 35.7, 54.1 (lakh). Ticks should land on round steps (0, 20, 40, 60) so a reader can read values at a glance.

7. **The dashed "today" marker is in the wrong place and means nothing.**
   The vertical dashed line sits near November while the real today is early October. If it is meant to mark the current month, it is a month out.

### What a fix has to satisfy
- No overlapping labels at 1,280 px and at the owner's 1,536 px window (short month names, e.g. "Oct 26", and skip labels when space is tight).
- Nothing plotted, summed or averaged for a month that has not started. Future months, if shown at all, are visibly separate and labelled.
- "Kul is saal" and "Ausat / mahina" use the same, stated period and the same denominator.
- The 3M / 6M / 1Y buttons each show exactly that many months ending at the current month.
- Verify by looking: screenshot the chart at all three ranges after the fix, and compare the totals with the Khata ledger for the same months.

### To check in code
- The chart component on the dashboard overview and the endpoint that feeds it (how the 12-month series is built, and whether it pads future months with projected values).
- The average calculation (divisor).

---

## 2. Dashboard: "Aane wale events" and "Tawajjo chahiye" disagree, and the statuses look wrong  `DONE: merged, empty state verified on production 9 Oct`

> Merged 9 Oct 2026 (#184, #340). Items 1-5, 7, 9, 10 fixed; item 6 (QA data) handled by wiping the account's operational data (6,719 rows, backed up); item 8 (61 old enquiries) partly: counted by the shared rule, no triage view. Reports and Venue-OS still use the old event-year revenue definition (flagged, not changed).

Screen: Dashboard (Overview), the two cards side by side: **Aane wale events** (left, "Aapki bookings") and **Tawajjo chahiye** (right, "Jawab, ho chuke events aur baqaya raqam").
Evidence: owner screenshots, 8-9 October 2026.
Owner's concern: the left card says **Awaiting Payment**, but these look like **leads**, not bookings. "There is hell of a lot of confusion and also data-mapping issues; if old data was updated by later changes, we need a complete test again."

### What is wrong (from the screenshots)

1. **"Aane wale events" (upcoming) lists events that are already in the past.**
   Today is 9 October 2026. The four rows are dated **1 Oct, 8 Oct, 5 Oct and 30 Sept**. None is upcoming.

2. **The rows are not in date order.** They run 1 Oct, 8 Oct, 5 Oct, 30 Sept. An "upcoming" list must be sorted by event date, soonest first.

3. **The same customer events appear in both cards, with contradictory meanings.**
   On the right, "12 event ho chuke, band nahi hue" (events done, not closed) lists Rehman Yousaf QA on 2026-10-05 (Rs 7,60,000), 2026-10-01 (Rs 8,70,054) and 2026-09-30 (Rs 7,32,313), plus Rizwan Anjum & Momina Rizwan on 2026-10-07 (Rs 25,96,400).
   The left card shows the same amounts as "upcoming". A record cannot be both upcoming and finished. The two cards read from different rules (date, status, or table) and nothing reconciles them.

4. **The two cards do not list the same records.**
   Left has a Rs 7,60,000 event on **8 Oct** with no counterpart on the right, and the right has Rizwan & Momina (7 Oct, Rs 25,96,400) that the left does not show at all.

5. **The "Awaiting Payment" label does not say what it is a status of.**
   The pill appears on rows titled "Aapki bookings". The owner reads these as leads. Either (a) these records are bookings whose payment status is awaiting, and the card should say so in plain words and link to the booking, or (b) they are leads/enquiries that were given a booking-style payment status, which is a data-mapping bug. Which table feeds this card, and which status field it prints (booking status, payment status or lead status), has to be established first.

6. **Test data shows up in the live vendor's dashboard.**
   Every row is "Rehman Yousaf QA" at "Rehman Grand Marquee", with Rs 7-8 lakh amounts. QA records are mixed into the real vendor's overview, KPIs, revenue chart and the "Rs 1,20,56,189 Event ke baad baqaya" total. Before going live these must be separated from real vendor data or removed.

7. **Layout is broken in the right card.**
   The "Tawajjo chahiye" rows are right-aligned and stacked: customer name, the "band karein" pill, the date, the amount and the word "baqaya" each on its own line. The left card's rows are laid out correctly. The row has lost its two-column layout.

8. **Old unanswered work is huge and unexplained.**
   "61 poochh-gichh ka jawab nahi diya, sab se purani 127 din se" (61 enquiries unanswered, oldest 127 days). Either that is real and needs a triage view, or old/migrated/test leads are being counted. Needs a data check.

9. **Mixed language and wording.**
   "Awaiting Payment" is English while the rest of the card is Roman Urdu (and "band karein" and "baqaya" appear as terms without explanation). Pick one term per concept and use it on both cards, the Bookings list and the booking detail.

10. **Numbers elsewhere on this screen do not tie to these lists** (seen in earlier screenshots this week).
    The KPI "Aane wale (7 din)" showed 7 and 8 on different loads, while this list holds 4 rows, all in the past. To verify against the list rules once item 1-3 are decided.

### What a fix has to satisfy
- One definition per record type: **lead**, **booking**, **event done / not closed**. Each card states which it shows, uses one status vocabulary, and a record appears in exactly one of "upcoming" or "done, not closed".
- "Aane wale events" shows only events dated today or later, sorted soonest first.
- Every figure on the Overview (the KPIs, both cards, the Revenue chart) is derived from the same query rules, so they tie to each other and to the Bookings, Leads and Khata screens.
- QA/test records are excluded from real vendors' data (or the QA vendor is a separate account that is not the one used for the go-live demo).
- The right card renders in the same row layout as the left.

### To check in code
- The overview endpoint(s) behind the two cards and the KPIs: which tables, filters and sort order they use.
- Where "Awaiting Payment" is produced and whether lead status and booking payment status are being mixed up.
- Whether records were changed by later migrations/updates (old rows with a status that the new code maps differently).

---

## Go-live QA, planned for the owner's go-ahead (target: tomorrow)

The owner is going live tomorrow and wants a **complete re-test with an eagle eye**, because old data may have been mapped differently after later updates. When the owner says "go", the order is:

1. **Data audit first (read-only):** count bookings, leads, enquiries and payments per status for the real vendors; find rows whose status no longer matches the current mapping (booking vs lead vs payment status); find the QA/test rows and where they leak into real vendor screens.
2. **Fix the issues in this file**, each with a before/after screenshot on production at the owner's 1,536 px window.
3. **Full regression, headed, on production:** every vendor screen (Overview, Leads, Bookings, Calendar, Chat, Function sheets, Customers, Khata, Set up, Reports, Plan & billing) and every KPI against the underlying list; the customer booking flow; the admin console.
4. **Payments (live Safepay):** pay, activate, receipt, cancel, refund, with real-price plans (see below).

### Payment go-live blockers still open (carried over, not yet done)
- The live Safepay account is currently wired to the **Rs 100 test plans**. Real vendors who click Subscribe today pay Rs 100 for plans the portal shows at Rs 2,500 / 5,000 / 10,000. Create the real-price live plans and swap the three plan IDs **before** vendors are invited.
- The live **payment test with a real card has not been done yet** (a fresh checkout is needed; the first one went stale).
- **Rotate the Safepay secret key and webhook secret** (both appeared in the chat). Then update the Railway variables.
- The site's own pages contradict each other about holding customer money ("we hold the deposit" vs "we never hold your money"); Safepay reviewers check this, and the account is already live. Decide which is true and make every page match.
- Keep `BILLING_ENFORCE` off until one real payment has worked end to end.

---

## 3. A vendor with several businesses has no way to add another one from the portal  `DONE: merged, empty state verified on production 9 Oct`

> Merged 9 Oct 2026 (frontend #341, backend #185). Add-a-business row in the switcher and Business settings; QA businesses are data (archive in the admin console).

Screens: the **venue switcher** (top of the sidebar, "Sabhi venue / 5 venues") and **Set up > Business settings** ("Editing 5 businesses, choose one").
Evidence: owner screenshots, 9 October 2026. The owner said more screenshots may follow; add them under this entry.
Owner's point: the portal already handles vendors who own several businesses, so a vendor who is already registered must be able to **add a new business** from inside the portal. Today there is no such option in the dropdown or in settings. **Halls & spaces** only adds spaces inside one venue; it is not a new business.

### What is wrong

1. **No "Add business" entry anywhere in the vendor portal.**
   The venue dropdown lists the businesses (Rehman Grand Marquee, Rehman Banquet & Lawn, Rehman Marquee Bahria, two Zzz QA ones) and nothing else. Business settings lists the same five as tabs and nothing else. A signed-in vendor has no door to register a sixth.

2. **The feature exists in code but is unreachable.**
   - A screen for it is already built: `components/dashboard/mainScreens/business/add-business-view.tsx`. Nothing imports it (no route, no link), so it is dead code.
   - The registration form at `/business-registration` is linked only from the **public site header menu** (`components/header-avatar.tsx`) and the public footer, never from the dashboard sidebar or the venue switcher.

3. **"Halls & spaces" is easy to mistake for it.**
   The module sits under "Venue" in the sidebar and is the only "add" the vendor can find. Its name and wording do not make clear that it adds rooms/spaces to the **current** business, not a new business.

4. **What a vendor would have to know to do it today:** leave the dashboard, open the public site, find the avatar menu, and use the registration form, which is built for a brand-new vendor. That is not a path a vendor would find or trust.

5. **The venue switcher is hard to use with similar names.**
   Two entries are both shown as "Zzz QA Coverage Marque..." (truncated), so they cannot be told apart. Names need a second line (city + status) or a wider menu.

6. **Test businesses are visible in a real vendor's switcher.**
   "Zzz QA Coverage Marquee (safe to ...)" and "Zzz QA Coverage Marquee Two" (both "submitted", not approved) sit in the same list as the vendor's real businesses. Same QA-data problem as issue 2.

7. **Business status is shown but the next step is not.**
   Settings shows "Lahore, approved", "Rawalpindi, approved", "Lahore, submitted", but nothing explains what "submitted" means for the vendor, what is pending, or who is reviewing it.

### What a fix has to satisfy
- A clearly labelled **"Add a business"** action, in the venue switcher (last row of the dropdown) and in Business settings (next to the business tabs).
- It opens an add-business flow that **reuses the vendor's existing account and details** (no second signup, no second email/phone/password), asks only what is new, and ends with the new business in the switcher with a visible "submitted, under review" state.
- Plan rules are applied correctly: the vendor's plan decides how many businesses are allowed (the plan cards say Basic = one business only, Pro/Premium = multiple). Adding beyond the limit must explain it and offer the upgrade, not silently fail.
- "Halls & spaces" says in its page title/subtitle that it is for rooms inside the current business.
- Names in the switcher are distinguishable (city/type on a second line, no ambiguous truncation).
- Verify by looking: headed, on production, as a multi-business vendor and as a one-business vendor; the new business must appear in the switcher, Business settings and the public listing flow, and must not appear for any other vendor.

### To check in code
- Why `add-business-view.tsx` was left unlinked (was it replaced, or never finished?). Read it and the registration form to see what each collects.
- The backend route that creates an additional business for an existing vendor, and how it enforces the plan's business limit (see the multi-venue businessId trap in the notes).
- Whether the sidebar/switcher can show an action row without breaking the keyboard and screen-reader behaviour of the listbox.

---

## 4. Registration (and set-up) forms: fields need an info "?" with a short explanation on hover  `DONE: merged #342, verified on production 9 Oct (registration page)`

> 116 help entries across all 10 business categories and the portal forms (Business settings, Capacity & pricing, Listing content, Bank details, KYC documents). **Not wired yet:** the Shadow-DOM console screens (setup, venue-os, halls & spaces), the packages/menus/type-specific managers, the staff/supplier/broker dialogs, and the new Add-a-business form.

Screens: the vendor **registration** flow (`/business-registration`: personal details, business type, business details, documents) and, for consistency, the long **set-up forms** in the portal (Business settings, Capacity & pricing, Bank details, Venue-OS and similar).
Evidence: owner request, 9 October 2026 (no screenshot; the pattern is what big products do).
Owner's point: while registering, a vendor can be confused by a field. Beside the **field name** there should be a small **info / question-mark icon**; **hovering it shows a short description**, so nobody has to guess what a field means, what format it wants, or why it is asked.

### What is wrong
1. **Fields have a name but no explanation.** A vendor registering for the first time meets terms such as business type, NTN, CNIC, bank account title, capacity, minimum guests, advance/deposit, listing content and halls vs spaces with nothing to say what they mean or what to enter.
2. **No consistent help pattern exists.** Some labels carry a one-line hint, most carry none, and there is no shared way to show one.
3. **Touch devices.** Hover does not exist on a phone, where most vendors will register. A hover-only tooltip would hide the help from them.

### What a fix has to satisfy
- One shared **FieldHelp** (a small "?" icon button next to the label) used by every registration field that is not self-explanatory. It opens on **hover and keyboard focus (desktop) and on tap (mobile)**, closes on Escape or tapping elsewhere, and is reachable by screen readers (`aria-label` "About <field>", the text linked with `aria-describedby`).
- Each help text is **short and concrete**: what it is, what to enter, an example, and (for sensitive fields) **why it is asked and who sees it** (for example "Used only to pay you out; never shown to couples").
- Written once in a single place (a content map keyed by field), in the same language as the form, so wording stays consistent and can be edited without touching the layout.
- The help must never cover the field being filled or run off the screen at 1,280 and 1,536 px or on a phone.
- Required and optional fields, accepted formats (CNIC, NTN, phone, IBAN) and document types are covered. **Validation errors stay separate from help**: help explains the field before the mistake, the error explains the mistake after it.
- Verify by looking: headed, desktop and a phone-width window; hover, keyboard Tab + Enter, and tap each icon on a sample of fields.

### To check in code
- `components/business-registration-form.tsx`, `components/steps/personal-details-step.tsx` and `business-type-step.tsx` (and the later steps): list every field and what label/hint it has today.
- `components/ui/tooltip.tsx`, `hover-card.tsx` and `popover.tsx` already exist; a popover (tap + hover) fits better than a pure tooltip for mobile.
- Whether the in-portal set-up forms use a shared label component the icon can plug into, so one change covers them all.

---

## 5. MAJOR: the portal must show and limit things according to the vendor's plan (Basic / Pro / Premium)  `DONE: merged (backend #183 + #188, frontend #351), enforcement still OFF. Owner must pick the rollout mode`

> Delivered: every feature and limit that has an API is gated (403 FEATURE_NOT_IN_PLAN / LIMIT_REACHED), generated test matrix (every paid tier x every billing state x enforcement off/new/all, mutation-tested), GET /subscriptions/entitlements with usage, one PlanProvider/usePlan(), locked cards + upgrade dialog + usage meters, sidebar chips. Operations tools (Venue-OS hub, Trade ops, Kitchen prep, Brokers, Inventory, Generator fuel, Halal certs, Drone NOC, Field capture) are deliberately never gated (a test fails if one is). Nothing changes for any vendor until `PLAN_LIMITS_ENFORCE` is set on Railway: recommended `new` + `PLAN_LIMITS_NEW_FROM=<launch date>`, later `all`. Behaviour change: a paid tier with NO end date (admin-activated, open-ended) now counts as in force. `client_portal` has an API gate but no vendor screen (the link is issued on the customer plan page). Not verified: anything through a real Safepay checkout, a phone walk of every locked state.

> Backend merged 9 Oct 2026 (#183): rules table, gates, limits, entitlements in /subscriptions/status. OFF by default (PLAN_LIMITS_ENFORCE). Not done yet: locks and usage on every screen, WhatsApp-template and contract routes, image/space limits, forecasting split, the operations-tools placement.

Owner's words (9 October 2026): show things according to the plan, so visibility and limits depend on whether the vendor is on Basic, Pro or Premium; **I (Claude) decide which plan gets what**, and it must be **robust, no question about it**.

### What is wrong today (verified in code)

1. **Plan features are not enforced anywhere on the server.** `src/utils/entitlementHelper.js` holds the map (`FEATURE_MIN_TIER`) and `canUse()`, but nothing calls it. Its own header says so ("nothing calls this as a hard gate yet"). A Basic vendor can call every Premium API directly.
2. **The only gate is all-or-nothing.** `BILLING_ENFORCE` + `subscriptionGate` either lets a vendor into the whole portal or shows the plan wall. There is no "this feature needs Pro".
3. **The screen side is almost empty too.** Only the Insights screen uses `UpgradeNudge`. Every other module (the sidebar items, the forms, the buttons) is shown to every vendor regardless of plan. The front end also keeps its **own copy** of the feature map (`lib/entitlements.ts`), which can drift from the server's.
4. **There are no numeric limits at all.** Number of businesses, halls/spaces, staff accounts, images: all unlimited. The public pricing page already promises "One business only" on Basic and "Multiple businesses and halls" from Pro, and the real test vendor on the free tier has **5 businesses** (issue 3), so the promise is not kept.
5. **Plan names and internal tiers are shifted** (tier `pro` is sold as Basic, `premium` as Pro, `elite` as Premium). Every place that prints a plan or checks a tier is a chance to show or gate the wrong one (this already caused wrong labels in billing history and the comparison table).
6. **Edge states are undefined for features:** what a vendor sees on a cancelled plan with days left, on a paused plan, in the failed-payment grace period, after expiry, during a free trial, and after a downgrade (what happens to the 4th business or the 8th staff account).

### The decision: what each plan gets (PROPOSED, Claude's decision, owner to confirm the numbers)

Principle: **the public pricing page is the contract.** It is already published, so nothing may contradict it. Everything the page lists is kept as stated. Where the page is silent I decide, and say why.

**In every paid plan (core):** public listing and profile, unlimited bookings and enquiries, availability calendar with date blocking, Khata (payments, receipts, balances), quotes and lead inbox, Excel/CSV import, Overview, Leads, Quote requests, Date holds, Bookings, Calendar, Chat, Customers, Function sheets, Reviews, Business settings, Halls and spaces, Bookable slots, Packages and menus, Images, Bank details, Cancellation policy, Plan and billing.

| Capability | Basic (Rs 2,500) | Pro (Rs 5,000) | Premium (Rs 10,000) | Source |
|---|---|---|---|---|
| Businesses under one login | **1** | **up to 4** | **up to 4** (5+ is "Custom, let's talk") | public page ("One business only", "Multiple", Custom = "Five or more venues") |
| Analytics and Reports | yes | yes | yes | public page |
| Cheque / PDC ledger | yes | yes | yes | public page |
| Quotes, contracts and e-sign | yes | yes | yes | public page |
| WhatsApp message templates | yes | yes | yes | public page |
| Staff accounts | **2** | **6** | **20** | public says "Staff accounts" with no number; numbers are my decision |
| Wedding Wala branding removed from quotes | yes | yes | yes | public page |
| Client portal for couples | no | **yes** | yes | public page |
| Priority email support | no | **yes** | yes | public page |
| Automations | no | no | **yes** | public page |
| Forecasting | no | no | **yes** | public page |
| Named account manager | no | no | **yes** | public page |
| FBR / PRA e-invoicing | no | no | **yes, when it ships** | public page ("in rollout, not yet live"; must stay labelled that way until real) |
| Operations tools (Venue-OS hub, Trade ops, Kitchen prep, Brokers, Inventory, Generator fuel, Halal certs, Drone NOC, Field capture) | **to decide after I read what each one does** | | | page is silent; today they are ungated, so removing any from a plan vendors already use needs the owner's yes |
| Halls and spaces per business | 3 | 12 | 40 | my decision (the page only says "a single hall" for Basic) |
| Images per business | 25 | 60 | 120 | my decision |

Numbers other than the business count are **proposals**; they are generous on purpose (a limit should never block normal use) and live in **one table** so changing one is a one-line edit.

### What a robust implementation looks like (the standard to hold it to)

1. **One source of truth on the server.** One entitlement table (features and numeric limits per tier) in the backend. The API returns the vendor's **resolved entitlements** (features allowed, limits, current usage) with `/subscriptions/status`; the front end **reads it** and never keeps its own copy.
2. **The server enforces, the screen only reflects.** Every gated write route goes through one `requireFeature("x")` or `enforceLimit("businesses")` middleware that answers `403 FEATURE_NOT_IN_PLAN` or `403 LIMIT_REACHED` with the plan needed and the current usage. Hiding a button is never the protection.
3. **Visible, not mysterious.** Features above the plan are **shown locked** (small lock + "Available on Pro") with a clear upgrade action, not silently missing; limits show usage ("1 of 1 businesses") and an upgrade prompt when reached. Fully irrelevant items may be hidden only if a locked row would just be noise.
4. **Never destroy data.** On a downgrade, expiry or cancellation, nothing is deleted: extra businesses, staff, images and records stay stored; the vendor keeps **read and export** access to what the plan no longer covers, and **creating more is blocked**. Choosing which businesses stay active is the vendor's decision, with a clear message.
5. **Exact rules for each state**, written once and tested: active, trialing (gets the trial plan's features), past-due grace (keeps features), cancelled with days left (keeps features until the end date), paused (decide: features kept, new charges stopped), expired/lapsed (core read-only; paywall only if `BILLING_ENFORCE` is on), upgrade (immediate unlock), downgrade (applies at period end, with a warning listing what will lock).
6. **Rollout without punishing current vendors.** Vendors already using features today must not be locked out tomorrow without notice. Proposal: a **30-day grace window** for existing vendors (keep everything, show "your plan covers X from <date>"), enforcement on for new vendors from day one. Needs the owner's yes before launch.
7. **Same names everywhere.** One function maps internal tier to public plan name; every screen, email, receipt and the pricing page use it.
8. **Tests that cannot be skipped:** a generated test for every gated route and every limit across all four tiers and every billing state (allowed vs `403`), a test that the front-end copy of the map no longer exists, and a headed production check as a Basic, a Pro and a Premium vendor (what each sees, what each is blocked from).

### To check in code before building
- Read each operations module to place it in a plan, and list every sidebar item and route so none is missed (the feature inventory).
- Where businesses, spaces, staff and images are created, so the limit checks go on the right endpoints (see the multi-venue businessId trap in the notes).
- `lib/entitlements.ts`, `billing-gate.tsx`, `plan-wall.tsx`, `upgrade-nudge.tsx`: replace the duplicated map with the server's resolved entitlements.
- How `BILLING_ENFORCE` and plan-based gating interact, so the paywall and feature locks never contradict each other.

---

## 6. Leads: a new lead cannot be saved when the source is Instagram (or Referral)  `DONE: merged (backend #186, frontend #343); verify on production`

> One shared vocabulary file (utils/leadVocab.js) for sources, statuses, event types; Instagram/Referral accepted; refused saves show on the offending field in plain words; 14 unit tests incl. 'UI list equals shared list'.

Screen: Leads > **Naya lead** drawer, field **Zariya** (source).
Evidence: owner screenshot, 9 October 2026 (vendor "Intkhab Marquee", Lahore). With Zariya = **Instagram** and every other field filled, **Lead add karein** fails with a red toast: *"Invalid source. Must be one of: in_app_chat, whatsapp, form_inquiry, manual_phone, manual_walkin, other"*. No lead is created.

### What is wrong (root cause confirmed in code)
1. **The backend has two lists of lead sources and they disagree.**
   - `src/models/lead.js` `LEAD_SOURCES` has 9 values: in_app_chat, whatsapp, **instagram**, **referral**, form_inquiry, manual_phone, manual_walkin, other, plus a legacy **baat**.
   - `src/utils/leadHelpers.js` `SOURCES` (the list `validateLead` checks, and the one that produced this error) has only 6, so **instagram, referral** (and baat) are rejected.
   - The model file's own comment says Instagram and referral were added deliberately as primary channels ("F-7"); the validator was never updated.
2. **The screen offers choices the server refuses.** The frontend (`lib/api/leads.ts` `LEAD_SOURCE_LABELS`, `leads-artifact.tsx` `SOURCE`) lists Instagram and Referral as normal options, so a vendor picks a valid-looking option and loses the lead.
3. **The error is unreadable for a vendor.** The toast prints the raw API sentence with internal names (`form_inquiry`, `manual_walkin`), covers the drawer's title and the Naam field, and does not mark the Zariya field as the problem. Nothing is kept or highlighted, and the vendor can't tell that choosing "Other" would work.
4. **Statuses and event types are not drifting** (checked: the model and validator agree on 7 statuses and 7 event types). Sources are the only list that has drifted.
5. **Any other path that creates or edits a lead with a source** (import, bulk, update, public form, WhatsApp/Instagram intake) may go through the same short list. To check each.

### What a fix has to satisfy
- ONE source list used by the model, the validator, the importer and the API docs; the frontend reads it (or a test proves they match). Instagram and Referral are accepted; decide what to do with the legacy `baat` value (map to Referral, do not just reject it, so old rows keep working).
- Existing leads with these sources load, filter and display correctly (Zariya labels and colours already exist in the UI).
- A validation error in the drawer is **shown on the field**, in plain language ("Zariya sahi nahi"), never as the raw list of internal names, and never hiding the form's own title or fields. The vendor's input is kept.
- A generated test that every source the UI can send is accepted by `validateLead`, the model, and the update path, so a new source can never be added in one place only.
- Verify headed on production: create a lead with each Zariya option (WhatsApp, Instagram, Referral, Website, Chat, Phone, Walk-in, Other), then see it in the list, the filters and the lead detail; delete the test leads afterwards.

### To check in code
- `src/utils/leadHelpers.js` (`SOURCES`, `validateLead`), `src/models/lead.js` (`LEAD_SOURCES`), the lead controller create/update/import paths, `lib/api/leads.ts` and the Leads screen's source dropdown, the intake services that set `source`.

---

## 7. Bookings: "Nayi booking" lets the vendor type any time of day; it must offer only the vendor's open slots for that date  `DONE: merged (backend #187, frontend #346), VERIFIED on production 9 Oct (Nayi booking shows "Waqt (slot)" with the venue's real slot, no clock input, no write sent)`

> Delivered: Waqt is the venue's own open-slot list (full / blocked / closed shown disabled with the reason), same picker in the reschedule dialog, one availability engine for vendor form + public page + calendar, and the server refuses a time outside every open slot (409, plain message) whatever a client sends. 49-check guard `guard:slot-picker`; 29 real-Postgres HTTP tests. Owner decisions still open (from the worker's report): (1) no "extra slot" override is offered anywhere, by design; (2) Shaadi Plan checkout and quote acceptance still book the fixed legacy periods (no picker there); (3) AUTHORIZATION GAP, not changed: any `isVendor` user can create an offline, auto-Confirmed booking against another vendor's venue via `POST /bookings` (no ownership check on that path), recommend an owner-only guard for `isOfflineBooking`; (4) function-sheet timings outside the slot are advisory notes only; (5) `eventClosingTime` returned but not enforced; (6) the mobile vendor app (ems-v0-app) was not checked, a client sending a clock time outside a slot now gets a 409.

Screen: Bookings > **Nayi booking** drawer, field **Waqt** (time). The same form is also used when a lead is converted to a booking, from a customer's page, and from the calendar.
Evidence: owner screenshot, 9 October 2026. The field is a plain clock picker (hour/minute/AM-PM columns) with no connection to the vendor's availability.
Owner's point: "What if someone books at 12 midnight? Only the slots that this vendor has available for that day should be offered."

### What is wrong (confirmed in code)
1. **The time field is a free clock, not a slot picker.** `components/dashboard/mainScreens/artifact/booking-form.ts` renders `<input type="time" id="bf-time">`, pre-filled 18:00 and falling back to "18:00" when empty. A vendor can enter 00:00, 03:30 or any time the venue never opens.
2. **The slot system exists but this form never uses it.** The backend already has the pieces: `GET /businesses/:id/slots/availability?date=YYYY-MM-DD` (and a bulk version), slot templates per venue and per hall/space (`?subVenueId=`), blocked slots, capacity overrides, and a slot-aware booking path (`slotTemplateId`, capacity-aware, guest-units). The drawer never calls them and never sends `slotTemplateId`.
3. **So the server's slot checks are skipped.** The booking path only becomes capacity-aware "when `slotTemplateId` is provided"; clients that do not send it are accepted as legacy. A booking made from this drawer therefore bypasses slot capacity, blocks and the venue's working hours. (This is the same family as the "two block systems" trap: whole-day blocks versus per-slot blocks.)
4. **The venue's own hours are not applied either.** The business has an event closing time and a legal guest cap; a midnight booking is accepted even where the venue closes earlier.
5. **Date, venue and hall changes do not refresh anything.** The form has only a small date warning line; changing the Tareekh, the Venue or the Hall / space does not reload the options for that day and hall.
6. **The same raw clock appears elsewhere.** The reschedule dialog ("Nayi taareekh / Waqt") in the booking detail screen uses the same free `<input type="time">`, as do function-sheet timings; rescheduling can move a booking into a closed or already-taken slot.

### What a fix has to satisfy
- **Waqt becomes a list of that vendor's slots for the chosen date, venue and hall.** Each option shows the slot name and time range (for example "Dinner, 7:00 PM to 11:00 PM") and how much room is left. Slots that are full, blocked or outside the venue's hours are shown disabled with the reason (full, blocked by you, closed), not hidden silently.
- **Refresh on change:** picking a different date, venue or hall reloads the list; a loading and an empty state ("is din koi slot khula nahi") are shown; a slot that disappears while the form is open cannot be submitted.
- **Venues that are whole-day only** (no slot templates) show no time picker, or one limited to the venue's opening hours and closing time; a midnight time is not selectable.
- **The form sends `slotTemplateId`** so the server's capacity and block checks run, and the server **rejects** a booking whose time is outside every open slot (a clear 409/400 with a plain-language message), whatever a client sends. A vendor must be able to knowingly override only if the owner decides to allow it (explicit "extra slot" action, logged), not by accident.
- **Reschedule** uses the same slot picker; function-sheet timings are checked against the booking's slot.
- **Public customer booking** must already use slots; verify it and the vendor form agree on what "open" means (one availability function, not two).
- Verify headed on production (with the real `Bookable slots` data): pick a date with no slots, a full slot, a blocked slot, a normal slot; try to submit a midnight booking by calling the API directly and confirm it is refused.

### To check in code
- `booking-form.ts` (time field, `populateBookingDeps`, `bf-datewarn`), `booking-detail-artifact.tsx` (reschedule dialog), `lib/api/venueSpaces.ts` (the existing slots call), `src/services/slotService.js` (`availability`), `src/controllers/bookingController.js` (the `slotTemplateId` path near line 3064 and the legacy fallback), and the business `eventClosingTime`.

---

## 8. Customer booking page: the Pay button says "Pay Rs. 0" while "Now due" says Rs. 2,100 (a money blunder)  `DONE: merged (frontend #344); verify on production`

> Customer booking page, bookings list and payments page use lib/utils/booking-money; Now due and the Pay button show the server's amountDue; 'Paid so far' label; guard:customer-money. Pairs with the instalment worker's server change (amountDue follows the next unpaid qist when the advance is waived).

Screen: customer account > **My bookings > booking #774** (`/user/bookings/774`), the **Payment summary** card (red box in the owner's screenshot).
Evidence: owner screenshot, 9 October 2026. Booking "Intkhab Marquee", status *Awaiting payment / Unpaid*, total Rs. 2,100. The card shows: Total Rs. 2,100, Down payment Rs. 0, Remaining Rs. 2,100, **Now due Rs. 2,100**, and directly under it a button labelled **"Pay Rs. 0"**.
Owner's point: "the amount should be shown; this is a bug or a blunder".

### What is wrong (cause found in code)
1. **The button label is built from the wrong number.** `app/(main)/user/bookings/[id]/page.tsx` (around line 991) prints `Pay ${fmt(booking.downPayment || booking.totalAmount)}`. The API returns the money columns as **strings** (`"0.00"`), and a non-empty string is truthy in JavaScript, so `"0.00" || 2100` evaluates to `"0.00"`: the fallback to the total never happens and the button reads Rs. 0. (The partial-payment branch is fine because it prints `dueAmount`.)
2. **`downPayment` no longer means what this screen assumes.** The Pay page's own header comment says so: `booking.downPayment` used to hold the *required advance* and now holds **money received**, starting at zero. This page still uses it as the "pay now" figure in the button, while its "Now due" uses `total - downPayment`. Two formulas for one number, so they disagree.
3. **The row labelled "Down payment" shows money received, not a down payment.** For this booking it reads Rs. 0, and further down the Payment schedule says *"Down payment: Waived, not required for this booking"*. A customer reads Rs. 0 as "no deposit asked", then sees Rs. 2,100 due now. The label, the schedule and the due figure do not tell one story.
4. **The page does not ask the server what is owed.** The Pay page (`/user/bookings/:id/pay`) correctly uses the server's `payment-instructions.amountDue` ("the one authority on what is owed and to whom"). This summary card computes its own amount from raw columns, so "Now due", the button and the Pay page can each show a different amount for the same booking.
5. **A button that says Pay Rs. 0 on a live booking is dangerous in both directions:** a customer may think nothing is owed and walk away, or may pay an amount that does not match what the venue expects. It also undermines trust at the exact moment money is asked for.
6. **Same family as known traps** (see the notes on the payment-status endpoint, the money-mutation sync and `downPayment` staleness): money columns used as flags or as "truthy" values.

### What a fix has to satisfy
- **One source of truth for the amount: the server's `amountDue`** (from the payment-instructions endpoint). "Now due", the button label and the Pay page all show exactly that number, formatted once by one helper.
- **Never use `||` or a truthiness test on money.** Parse every money value to a number once at the API boundary (a shared `moneyOf()`); `0`, `"0"` and `"0.00"` are zero everywhere.
- **Correct labels:** rename the row that shows money received ("Paid so far"), show the *required advance* separately when there is one, and make the schedule and the summary agree (if the advance is waived, say what is due now and when the rest is due).
- **Disable or hide the Pay button when nothing is due** (it must never read "Pay Rs. 0"), and never enable it for a closed booking (already handled; keep the guard).
- A regression test that renders the card for string amounts ("0.00", "2100.00"), partial payments, waived advances and zero-due bookings and asserts button, "Now due" and the Pay page agree.
- Verify headed on production: as a customer open a booking per state (awaiting payment unpaid, partial, paid, cancelled, completed with balance) and compare the card, the button and the Pay page amount to the vendor's Khata for the same booking.

### To check in code
- `app/(main)/user/bookings/[id]/page.tsx` (the summary card and `payLabel`), `.../pay/page.tsx`, `lib/api/paymentInstructions.ts`, the server's `payment-instructions` handler (how `amountDue` is derived, including waived advances), and every other place that prints `downPayment || ...` (grep the whole frontend).

---

## 9. Vendor booking page: the "Qist schedule" (instalments) is read-only, confusing and not trustworthy; make it fully functional  `IN PROGRESS (worker running)`

> Qist schedule rebuild, backend + frontend.

Screen: vendor portal > Bookings > **booking #774** > **Payment** card and **Qist schedule** card.
Evidence: owner screenshot, 9 October 2026 (the due date of the Baqaya row is boxed in red). Owner's words: "make the qist work complete, functional and optimised; I cannot understand it".

### What the screen shows for booking #774
- Header cards: Event "3 din baaki" (Mon 12 Oct 2026), Mehmaan 200, **Kul package Rs 2,100 (71% mil chuka)**, **Baqaya Rs 600**.
- **Payment** card: Kul 2,100, Mil chuka 1,500, Baqaya 600, a 71% bar, then a history: "Booking confirm, 9 Oct", "Baqaya Rs 600, event se pehle lena hai" with *Baqaya record karein* and *WhatsApp par yaad dilayein*, "Settle, baad mein".
- **Qist schedule** card: row **Advance, 9 Oct 2026, Rs 0, pill "—"**; row **Baqaya, 5 Oct 2026, Rs 2,100, "Rs 1,500 mila", pill "Kuch mila"**; footer **Baaqi lena Rs 600**.

### What is wrong
1. **The schedule is read-only.** `booking-detail-artifact.tsx` (`installmentsCard`) only prints rows. There is no button to record a payment against a qist, change a date or amount, add or split an instalment, waive one, or remind about one. The actions that do exist are on the other card ("Baqaya record karein", the WhatsApp reminder) and are not connected to the rows.
2. **A due date earlier than the booking itself.** The Baqaya qist is due **5 Oct 2026**, but the booking was made on 9 Oct and the event is 12 Oct. It is already 4 days overdue the moment it exists. The date seems to come from the event date minus a fixed number of days, with no check against today or the booking date.
3. **No overdue state is shown even though the date is past.** The code has an "Overdue" status, but this row shows "Kuch mila" (partly received). A late instalment must say how many days late, in red, and drive the reminders.
4. **The rows do not tell the same story as the Payment card.** Qist schedule says Advance Rs 0 and Baqaya Rs 2,100 (the whole amount). The Payment card says Rs 1,500 received and Rs 600 left. The 1,500 has been put against the "Baqaya" qist, so the vendor cannot see what the 1,500 was for (an advance?).
5. **The same word means three things.** "Baqaya" is (a) the outstanding total (Rs 600, top card), (b) the second instalment (Rs 2,100, the whole price), and (c) a history step. "Baaqi lena" is a fourth spelling of the outstanding amount. Vendors cannot tell which number to collect.
6. **The code admits the schedule can be wrong.** A comment in `installmentsCard` says the instalment ledger "can lag" the real outstanding because a receipt recorded in the Record drawer "does not always pay down these installment rows"; the footer then quietly swaps in a different number ("receipts se"). Two sources of truth for money are a defect, not a feature.
7. **The cards duplicate each other.** The Payment card (progress + history) and the Qist schedule are two views of one thing with different vocabulary, one below the other.
8. **A customer who proposes an instalment plan** (a change request of type `installment_plan`) can be approved on another card, but there is no way for the vendor to design a plan themselves.
9. **Data meaning:** the customer's page for the same booking (issue 8) showed paid Rs 0 and "Unpaid" at the time of the earlier screenshot, while this page shows Rs 1,500 received and "Booking confirm". If both were taken at the same moment, the two screens disagree; if not, confirm which payment was recorded in between. To verify.

### What a fix has to satisfy (the "qist" feature, done properly)
- **One schedule, one source of truth.** Every receipt, refund and waiver goes through one function that updates the instalment rows and the booking's received amount together. Invariants, enforced and tested: the instalment amounts add up to the booking total; the amounts marked paid add up to the receipts received; outstanding = total minus received, everywhere. No "ledger lag".
- **Vendor can build and edit the plan:** presets (full amount before the event, advance + balance, three instalments, custom), add/split/remove while unpaid, edit amounts and due dates, with validation (sums match, no due date before today or the booking date unless the vendor confirms, none after the event unless confirmed).
- **Sensible default dates** when a booking is created: advance on the day of booking (or the venue's rule), balance a set number of days before the event, never in the past; if the event is closer than the rule allows, collapse into one qist due immediately.
- **Per-row actions:** record payment (allocated to the earliest unpaid qist first, with the option to pick one), edit, split, waive with a reason, and a WhatsApp/in-app reminder for that qist.
- **Honest statuses:** Upcoming, Due today, Overdue by N days, Part paid, Paid, Waived, each with a colour and the exact remaining amount.
- **One vocabulary:** *Qist* for a scheduled instalment, *Mil chuka* for received, *Baqaya* only for the outstanding total, one date format, one "Rs" format. Merge the Payment card and Qist schedule into a single **Payments** card (progress bar, the schedule, then the history).
- **Customer side shows the same plan** with the next qist and its amount (and issue 8's single "amount due" number), and an approved customer-proposed plan creates the qists atomically.
- **Reminders and overdue:** a daily job marks qists overdue, notifies the vendor, and (if the vendor enabled it) the customer; reminders respect quiet hours.
- **Optimised:** one request returns the booking's money plus its qists (no second round trip and no recalculation in the browser), a fast first paint, and a layout that works on a phone.
- **Tests:** unit and DB tests for the invariants across record, edit, refund, cancel and reschedule; a headed check on production for each state (unpaid, part paid, paid, overdue, waived, refunded).

### To check in code
- `booking-detail-artifact.tsx` (`installmentsCard`, the Payment card), the `BookingInstallments` and `ReceiptAllocations` models and their services, how receipts are recorded (`PaymentReceipts`, the Record drawer) and why they do not always pay the rows down, where the default due dates are computed (balance due days), and the change-request approval for `installment_plan`.

---

## 10. Found by reading the 390px screenshots of the full production sweep (9 Oct)  `DONE, all five fixes verified live on production; owner items below`

The automated sweep (62 vendor routes at 1536px and at 390px: console errors, failed requests, NaN/undefined text, horizontal overflow, blank pages) was clean both times. Reading the phone screenshots found what it cannot see:
- **Grey smudge down the right edge of every console screen** (heavy on phones). The closed side drawer kept its box-shadow and stayed visible. Fixed #345 (verified live: drawer is now `visibility:hidden`); the sweep tool now flags any parked off-screen panel that still paints a shadow.
- **Venue OS told an empty account "Munafa patla hai, only 0% left, cut your costs".** Fixed #347: neutral "Abhi koi hisaab nahi" state, margin shown only when there is cash. All 8 verdict branches verified (verified live on the owner's empty account).
- **Customers search stopped 20px short of the cards on a phone.** Fixed #348.
- **Halls & Spaces cards were cramped on a phone** (text 118px wide, buttons floating mid-card). Fixed #349.
- **Page headers cut descriptions to "Your publi…" on a phone** (shared PageHeader, 51 users). Fixed #350 (phone only).
- **Add a business had no "?" help** (issue 4 gap, found by the final interaction pass). Fixed #353: 7 fields wired, and tapping "?" no longer triggers a premature "Business name is required.". Verified headed at 1536 and 390.
- `scripts/space-fit-parity.mts` was failing on main (stale patterns after the Marquee Stage rebuild; the feature still reaches the customer). Guard updated and mutation-tested in #345; all guards now pass.

Needs the owner / left on purpose:
- **Two QA venues sit on the owner's live account**: "Zzz QA Coverage Marquee (safe to delete)" and "... Two" (status Under review, so not public). Not deleted without the owner's yes.
- `/dashboard/reports` is an old-shell route (different left inset, "Image / Maheena / Saal" header); the nav already points Reports at `/dashboard/insights`. Nothing links to it from the console; remove it or repoint it.
- Settings and the old Reports page use a wider side inset on a phone than the console screens do.
- The Query Devtools badge (palm tree) seen on localhost is dev-only; confirmed absent in production.

---

<!-- Add the next issue below as "## 11. ..." -->

