# QA_RECOMMENDATIONS.md

Improvements and updates needed that are **not** defects — things that work today
but should not stay as they are. Format in [rules.md](rules.md) §6.

Kept as carefully as the bug list, because this is where the product gets better
rather than merely stops breaking.

---

## P1 — do before launch

### REC-000: Clean up the QA fixture — business 3365 is suspended, not deleted
- **Module:** production data
- **Priority:** P1 (housekeeping, but on live prod)
- **State at end of the money-path campaign:**
  - **Business 3365** ("ZZ QA TEST VENDOR — DO NOT BOOK") — **suspended** via superadmin, so it is off public search and its API row returns "Business not found". It could **not** be hard-deleted: WW-095 blocks deleting a business while any booking carries money, and cancelled bookings 199/200 are `Partial` (audit-locked). This is correct behaviour, not a bug — but it means the fixture cannot be fully removed by script.
  - **Bookings 197, 198, 199, 200** — all cancelled.
  - **Staff `User` accounts** `qa-staff-a+…` / `qa-staff-b+…` and the vendor login `qa-vendor+001@weddingwala-qa.test` — still exist; there is no vendor-facing user-delete.
  - `cypress.env.json` `qaVendor` entry removed by the teardown script.
- **To finish, an admin with DB access should:** purge the cancelled bookings **and booking 203** (`ZZ QA Lifecycle`, now `Completed`/terminal from the V5 state-machine test — needs an admin force-cancel or DB delete) and their money rows, then delete business 3365 and the three QA `User` rows. All are named/prefixed to be unmistakable (`ZZ QA`, `@weddingwala-qa.test`).
- **⚠️ Two pending refund-requests on the founder's real booking 189** — ids **5 and 6**, both `customer_cancel`, created 2026-08-15 while probing whether the refund engine is enabled (it is). **`refundsTotal` is 0 — no money moved.** They are harmless but are test debris; reject/close them in the admin refund UI. The automated cleanup (decide→reject) was intentionally not forced — a money-adjacent mutation on a real booking was blocked by the safety classifier and left for a human.
- **Extra debris from the 2026-08-15 deep-testing wave** (all on the QA vendor / QA data, all harmless): a timeline task `ZZ QA timeline task` on booking 203 (the timeline API has no DELETE — it persists until 203 is purged); one resolved support complaint (`ZZ QA test complaint`, terminal — fine to leave); one chat conversation (id 11) between the QA vendor and QA customer carrying `ZZ QA X8` marker messages (recipient's unread was marked read afterwards). Self-cleaned within their runs: expense 559, the cash receipt, menu 46, and the forged customer-owned expense 560 (BUG-031 evidence).
- **U2/V2/X8 closure wave (also 2026-08-15):** a **new signed-up QA customer** `User 3382` (`zzqa.cust.01840957@weddingwala-qa.test`) — created via `/auth/signup` to prove registration + booking notifications; **booking 204** on 3365 (cancelled after the X8 approval-notification test); and **4 VendorClaims (ids 1–4)** on listings 3269–3272, all now `rejected` (the V2 claim-gate test — claimant `zzqa.claim.probe@…`). All terminal/cancelled; delete User 3382 + booking 204 with the rest of the fixture. Business 3365 was restored for the booking test and **re-suspended** afterwards.
- **The deeper gap this exposes:** there is no supported path to remove a test or spam vendor once it carries any money history — deletion is blocked and the only lever is suspension. Worth a "purge test vendor" admin tool, or a documented DB runbook.

### REC-013: Make category filters URL-addressable
- **Module:** `/venues` and sibling category listings · flow U1
- **Priority:** P3
- **Observed today:** navigating to `/venues?city=Quetta&minPrice=99000000` returns the **full 716-result** list — the URL query params are ignored; filters are client-state only. So a customer cannot bookmark or share a filtered search ("marquees in Lahore under 5 lakh"), and the back button won't restore a filter set.
- **Recommended:** sync the filter state to the URL (query params) and hydrate from it on load. Standard for a marketplace listing and a real SEO win — filtered URLs become indexable landing pages.
- **Why:** shareable filtered searches are a core discovery behaviour; their absence quietly caps both UX and the long-tail SEO the [[weddingwala_1m_megaplan]] depends on.

### REC-001: Turn sign-in OTP back on
- **Module:** Auth · login
- **Roles:** USER, VENDOR
- **Observed today:** OTP is disabled on live production via Railway `LOGIN_EMAIL_OTP=false`, opened 2026-08-14 for this test campaign. A password is currently the only credential protecting every vendor's bookings and payouts.
- **Recommended:** delete that variable the moment testing ends. Delete the branch `temp/disable-login-otp-test-window` unmerged. Then **re-run flow U2 step 4** with OTP on — it is currently untestable and therefore unproven.
- **Why:** a temporary security change that outlives its window is how platforms get breached. Nothing in the system enforces the end of this window except this line.

### REC-002: Replace Stripe TEST keys on production
- **Module:** Payments
- **Observed today:** production carries Stripe **test** keys. Deferred by the founder.
- **Recommended:** swap to live keys and re-run flow **U4** end to end before taking real money.
- **Why:** flow U4 cannot be certified until this changes. It is the single largest untested surface in the system.

### REC-003: Give the actions column an accessible label
- **Module:** 16 portal tables
- **Observed today:** each has exactly one blank `<th>` — the row-actions column. Conventional, and not a bug.
- **Recommended:** `<th><span class="sr-only">Actions</span></th>`.
- **Why:** cheap, removes 16 recurring findings from every future audit, and makes the tables usable by screen reader.

---

## P2 — do soon

### REC-004: Move the cookie banner out of the interaction zone
- **Module:** global
- **Observed today:** BUG-001 fixes the overlap, but the banner is bottom-right and full-width on phones by design, so it will keep colliding with whatever sits there.
- **Recommended:** while the banner is showing, reserve space for it (pad the page bottom) rather than floating it over content — and never let it overlay a form's primary action.
- **Why:** fixing only the login page leaves the same class of collision waiting on every other screen with a bottom-anchored control.

### REC-005: Decide what an admin-only route should do, once
- **Module:** portal routing
- **Observed today:** the gate works — "Admin only — You don't have permission to view this page." — but the route still renders the full app shell, sidebar and page title first. A vendor sees "Dashboard → Users" chrome for a page they cannot access.
- **Recommended:** redirect to `/dashboard` with a toast, or render a dedicated 403 screen without the target page's title.
- **Why:** it currently discloses the admin console's structure and reads as a broken page rather than a deliberate refusal.

### REC-006: `/dashboard/settings` should have a page title
- Consistency with all 75 other portal screens; also fixes BUG-007.

---

## P3 — worth doing

### REC-007: Give the test suite a dedicated vendor account
- **Observed today:** testing runs against the founder's real vendor account (`id=3351`, Wedding venue), which owns real listings and real bookings. Every spec is therefore read-only, which caps how much can be proven — no create, no edit, no delete, no full booking flow.
- **Recommended:** seed a disposable vendor with its own business, packages, slots, staff and bookings.
- **Why:** flows V4–V8 cannot be completed without it. This is the main blocker to depth on the vendor side.

### REC-008: Make Cypress runnable, or commit to Playwright
- **Observed today:** the installed `Cypress.exe` is a Node binary, not Electron — `bad option: --smoke-test`. **Root cause now identified**: the binary download is being truncated in transit.
  ```
  expected size: 252,614,858 bytes
  computed size: 128,785,792 bytes    ← cut off at ~122 MiB
  → "Corrupted download", checksum mismatch
  ```
  The same truncation reproduced on every attempt, so this is a network path capping the transfer (proxy, antivirus, or ISP), not a corrupt cache. 73 authored specs cannot execute.
- **Recommended, in order:**
  1. Download `cypress.zip` for 15.20.1 manually (browser or another network), then install from disk: `CYPRESS_INSTALL_BINARY=/path/to/cypress.zip npm i cypress`. This bypasses the truncating path entirely and is the cheapest fix.
  2. If that also truncates, port the 73 specs to Playwright and retire the Cypress project. Playwright already runs here, headed and headless, and the shared contract is identical.
- **Why:** two harnesses where one runs is worse than one harness that does. Right now the Cypress suite is unverifiable by definition.

---

## Observations not yet actionable

- **`/dashboard/business` renders 100 row-action menus at once.** Correct behaviour, but worth checking against a vendor with many more businesses — the page may not degrade gracefully.
- **The `user` test account has `vendorType: "Photographer"` while holding role `User`.** Harmless today; may indicate vendor fields are populated on customer accounts.
- **53 content/SEO pages** carry 206 interactive elements between them. They need link and layout checks, not functional testing — scoped that way in `QA_TRACKER.md`.

### REC-009: Delete the dead `VALID_STATUS_TRANSITIONS` constant
- **Module:** `«api»/src/utils/constants.js`
- **Roles affected:** none directly — this is a trap for whoever reads it next
- **Priority:** P2
- **Observed today:** two contradictory definitions of legal booking transitions exist.

  | | `constants.js` | `bookingStatusTransition.js` (live) |
  |---|---|---|
  | States | 4 | 5 — includes `Awaiting Payment` |
  | `Pending → Completed` | forbidden | **allowed** (forward rank) |
  | Enforced anywhere? | **no** — imported at `bookingController.js:31`, never used | yes, everywhere |

  `PAYMENT_STATUS` in the same file has the same drift: 4 values against the model's 6, missing `Cancelled` and `Failed`.
- **Recommended:** delete both constants, or reduce them to a re-export of the live machine.
- **Why:** the file is named `constants.js` and reads like the specification. It is the first place anyone — a new developer, or an agent doing exactly what I did — looks to learn the rules, and it teaches the wrong ones.

### REC-010: Category pages give customers two different experiences
- **Module:** Public · vendor category listings
- **Roles affected:** USER / PUBLIC — the top of the funnel
- **Priority:** P2
- **Observed today**, measured across 8 category pages:

  | Page | `h1` | Filters | Controls | Links |
  |---|---|---|---:|---:|
  | `/venues` | "Wedding Venues" | **yes** | 103 | 71 |
  | `/photographers` | "Photographers" | **yes** | 99 | 71 |
  | `/decor` | — | **yes** | 102 | 71 |
  | `/makeup-artists` | — | **yes** | 100 | 71 |
  | `/marquee-rental` | — | **yes** | 87 | 71 |
  | `/car-rental` | — | **yes** | 87 | 71 |
  | `/caterers` | "Caterers in Pakistan" | **no** | 3 | 171 |
  | `/mehndi-artists` | "Mehndi Artists in Pakistan" | **no** | 3 | 171 |

  Six categories are browsable, filterable listings. Two are SEO city hubs — an "X in Pakistan" heading and 145 city links, with **no way to filter and nothing to compare**. A customer clicking "Caterers" from the nav lands somewhere structurally unlike "Venues", and has to pick a city before seeing a single caterer.

- **Recommended:** decide which shape a category slug owns. Either give the hub pages the same filter UI, or move them to `/caterers/cities` and let `/caterers` be a listing like the rest.
- **Why it matters:** catering is one of the highest-value categories on a wedding platform, and it is currently the harder one to shop. Neither page is broken — this is a product-consistency question, which is why it is here and not in QA_BUGS.
- **Not established:** how many of the 23 vendor types fall on each side. Eight were sampled; the split should be measured across all of them before deciding.

### REC-011: Make write endpoints agree on their success status and their refusal message
- **Module:** `packageController`, `staffController`
- **Roles affected:** none — this is an integration-surface issue, not a user-facing one
- **Priority:** P3
- **Observed today**, exercising both CRUD surfaces back to back on the seeded vendor:

  | | create returns | missing owning id returns |
  |---|---|---|
  | `POST /staff/members` | **201** Created | **400** `"businessId required"` |
  | `POST /packages/single-package` | **200** OK | **404** `"Business not found"` |

  Both are defensible alone; together they are two conventions in one API. The 404 is the more misleading of the two — the caller omitted a field, and the API replies that something they never named does not exist.
- **Recommended:** 201 for creates, and validate the presence of `businessId` before the ownership lookup so a missing field reads as 400 rather than 404.
- **Why:** these are the two endpoints a vendor-portal integration hits most, and the current pair costs a developer one debugging session each to discover.
- **Not a bug:** neither breaks anything today, and no user can see either. Recorded here rather than in QA_BUGS for that reason.

### REC-012: A deactivated account should be logged out, not left in a dead UI
- **Module:** `middlewares/authMiddleware.js:119-125`
- **Roles affected:** STAFF (most often — a dismissed employee), and any deactivated USER or VENDOR
- **Priority:** P2
- **Observed today:** a vendor disables a staff login (`DELETE /staff/members/:id/login`). The staffer's existing token is correctly refused — **access control holds, and that is the part that matters.** But the refusal is a **400**, and the frontend's axios interceptor only force-logs-out on **401**. So a dismissed employee keeps a UI that still looks signed in, and every tap returns *"Your account had been deactivated by admin"*. Signing in again correctly fails.
- **Why it is written that way** — the rationale is in the file, and it is a good one:
  ```
  // The FE axios interceptor only force-logs-out on 401, so a bad token MUST
  // return 401 (not 400) to clear the dead session. Any OTHER error here (a
  // transient DB blip in the user/permission lookups above) deliberately stays
  // 400 -- returning 401 there would force-logout every user during an outage.
  ```
- **Recommended:** treat the *deliberate deactivation* branch differently from the *transient error* branch. A deactivated account is a settled fact, not a blip, so it can safely return **403** with a distinct code (`ACCOUNT_DEACTIVATED`) and the interceptor can clear the session on that code specifically. The blanket 400 for genuine transient errors stays exactly as it is, and the outage protection is preserved.
- **Why:** revoking access should end the session visibly. Leaving a dismissed employee in a signed-in shell that errors on every tap reads as a broken app rather than a closed account, and it is the single most likely moment for someone to be annoyed at the product.
- **Not a bug:** nothing is reachable that should not be. This is about what the user is shown after the refusal.
