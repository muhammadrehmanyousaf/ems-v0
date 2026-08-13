# Wedding Wala — Live UI Test Sheet

Environment: **production** (www.weddingwala.pk) · Vendor: `muhammadrehmanyousaf786@gmail.com` (user 3351)
Businesses: 3358 Rehman Grand Marquee · 3359 Rehman Banquet & Lawn · 3360 Rehman Marquee Bahria
Method: **every action performed in the live UI**, so the UI calls the real API. Every mutation re-read after a **hard reload**.
Started: 2026-08-13

## Legend
`PASS` verified in UI + re-read after reload · `FAIL` defect · `BLOCKED` could not test · `UX` works but confuses the user

## Data manifest (everything created, and its removal)
| # | module | row created | identifier | removed? |
|---|---|---|---|---|

## Results
| # | module | action | expected | actual | verdict |
|---|---|---|---|---|---|
| 1 | Customers | READ list | list + counts render | 22 customers, 27 bookings, stats render | PASS |
| 2 | Customers | CREATE — open dialog | dialog opens with name/phone/address/email | opened, 4 fields | PASS |
| 3 | Customers | CREATE — submit missing address | refuse + say which field | toast "Fill in the name, phone and address to save." no API call fired | PASS |
| 4 | Customers | CREATE — invalid email `not-an-email` | refuse with example | "valid email address, e.g. name@example.com." | PASS |
| 5 | Customers | CREATE — phone `0300123456` (1 short) | refuse | "valid Pakistani number, e.g. 0300 1234567." (post #205) | PASS |
| 6 | Customers | CREATE — phone `042 35123456` landline | accept | accepted | PASS |
| 7 | Customers | CREATE — valid row | row saved AND visible | **POST 201 saved, but row NEVER appears in the list** | **FAIL** |
| 8 | Customers | CREATE — duplicate phone | show the server's reason | **API 400 "You already have a customer with this phone number" — NO toast, dialog just sits open** | **FAIL** |

## Defects found

### D-1 — A created customer never appears in the Customers list
`POST /api/v1/offlineCustomers` returns success and the dialog closes, but the row is
invisible: **Total customers stays 22**, the row is absent from the table, and the
in-page search cannot find it. Proof it really saved: creating it a second time returns
`400 "You already have a customer with this phone number"`.

Verified after a hard reload, not from post-action state.

Likely mechanism (NOT yet confirmed): the list is built from booking-derived customers
while "Add customer" writes to a separate `offlineCustomers` table. Either way, from the
vendor's seat: you click Add customer on the Customers page, it saves, and it is nowhere.
They will add it again — and hit D-2.

### D-2 — A server rejection shows the vendor nothing
The duplicate-phone 400 carries a clear, usable sentence. It is never rendered: no toast,
no inline error, dialog stays open with the Save button live. The vendor clicks Save and
nothing happens, forever.

Client-side validation toasts DO fire (row 3), so the gap is specifically the API error
path in this dialog.

## Data manifest
| # | module | row created | identifier | removed? |
|---|---|---|---|---|
| 1 | Customers | offline customer | `ZZ QA Delete Me` / 03001112223 | **NOT REMOVED — cannot reach it in the UI (D-1)** |

## Module 2 — Leads (live, visible browser)
| # | action | expected | actual | verdict |
|---|---|---|---|---|
| 9 | READ list | list + counts | 77 total / 71 shown / 6 archived — reconciles | PASS |
| 10 | List controls | sort, search, density, import/export, bulk select, pagination | all present, 3 pages, 25/50/100 rows | PASS |
| 11 | Row actions | convert / draft reply / edit / remove per row | all 4 present on every row | PASS |
| 12 | Open "Log a lead" | dialog opens | opened, 11 fields | PASS |
| 13 | Empty form | Save blocked WITH reason | disabled + "Add a contact name to save." | PASS |
| 14 | Phone `0300123456` (1 short) | reject with example | "valid Pakistani number, e.g. 0300 1234567." + "Fix the highlighted fields to save." | PASS (#205 live) |
| 15 | Valid name + valid phone | Save enabled | **Save STILL disabled** | **FAIL** |
| 16 | Contact name / Email / Budget / Guests inputs | accessible name | **no id, no name, no aria-label — screen reader announces bare "textbox"** | **FAIL (a11y)** |

## Defects (cont.)

### D-3 — "Log a lead" is unusable on the default business selection
With the business switcher on **"All venues"** (the default for a multi-venue vendor)
Save never enables. The only clue is a status line: *"This lead needs a business before
it can be saved."* The dialog has **no business picker**, and nothing says the fix lives
in the top-left switcher outside the dialog.

A 3-venue vendor opening Leads → Log a lead therefore hits a dead button on their very
first action, with a message that states a requirement but not a remedy.

Fix direction: put a business selector IN the dialog (defaulting to the active one), or
make the message name the control — "Choose a venue in the switcher above to save".

### D-4 — Four inputs have no accessible name
`Contact name`, `Email`, `Budget (Rs)`, `Guests` render as bare textboxes: no `id`,
no `name`, no `aria-label`, and the visible text is not associated. Screen readers
announce "textbox"; browser autofill cannot identify them either.

## Data manifest (updated)
| # | module | row created | identifier | removed? |
|---|---|---|---|---|
| 1 | Customers | offline customer | `ZZ QA Delete Me` / 03001112223 | NOT REMOVED — unreachable in UI (D-1) |
| 2 | Leads | none — save was blocked (D-3) | — | n/a, nothing written |

### D-3 CONFIRMED by controlled test
Same dialog, same data, only the business switcher changed:
`All venues` → Save **disabled** · `Rehman Grand Marquee` → Save **enabled**.
Diagnosis proven; the dialog offers no way to make that change from inside it.

## Module 2 — Leads CRUD (completed)
| # | action | expected | actual | verdict |
|---|---|---|---|---|
| 17 | CREATE valid (single business) | POST + row appears | `POST /leads 201`, dialog closed, row visible instantly | PASS |
| 18 | CREATE persistence | survives hard reload | present after hard reload | PASS |
| 19 | CREATE normalisation | one stored shape | typed `0300 1112224` → stored `03001112224` | PASS |
| 20 | SEARCH | filters to the row | filtered to exactly 1 | PASS |
| 21 | UPDATE hostile phone `abc` | refuse | "valid Pakistani number, e.g. 0300 1234567." | PASS |
| 22 | UPDATE valid | PATCH + persists | `PATCH /leads/256 200`; name + phone changed after hard reload | PASS |
| 23 | UPDATE normalisation | canonical | typed `0301 9998887` → stored `03019998887` | PASS |
| 24 | DELETE confirmation | named + irreversible warning | "Remove this lead? ZZ QA Lead EDITED will be removed. This can't be undone." | PASS |
| 25 | DELETE | row removed | `DELETE /leads/256 200`, row gone | PASS |

**Leads verdict: CRUD fully working.** Delete confirmation is the standard the rest of the
portal should match (contrast: the slot editor had none until #204).

## Data manifest (updated)
| # | module | row created | identifier | removed? |
|---|---|---|---|---|
| 1 | Customers | offline customer | `ZZ QA Delete Me` / 03001112223 | NOT REMOVED — unreachable in UI (D-1) |
| 2 | Leads | lead #256 | `ZZ QA Lead` → EDITED | **REMOVED — DELETE 200 verified** |

## Module 3 — Bookings (live)
| # | action | expected | actual | verdict |
|---|---|---|---|---|
| 26 | READ list + KPIs | render with real data | 7 bookings, Collected Rs 1,052,398, Due Rs 6,450,452 | PASS |
| 27 | Columns | booking/space/customer/date/amount/paid/balance/status | all present incl. **SPACE** | PASS |
| 28 | Filter Active/Archive/Cancelled/All | counts reconcile | 7 + 5 + 2 = **14 = All** | PASS |
| 29 | Filter deep-links | URL reflects filter | `?bucket=completed`, `?bucket=cancelled`, `?bucket=all` | PASS |
| 30 | KPI label accuracy | "Total bookings" = all | shows **7 (Active)** while All = 14 | **UX** |
| 31 | Add booking — required marks | `*` on required | Full Name *, Phone *, Business *, Event Date *, Time Slot * | PASS |
| 32 | Add booking — empty submit | blocked | blocked by native HTML5 validation (`checkValidity()` false) | PASS |
| 33 | Add booking — bad email | rejected | native: "Please include an '@' …" | PASS |
| 34 | Add booking — phone `abc` | rejected | **ACCEPTED — `:invalid` false, no pattern, form.checkValidity() TRUE** | **FAIL** |

### D-5 — Offline booking accepts `abc` as a phone number (production today)
`#ob-phone` is `type="tel"` with **no `pattern`** and only `required`. Proof captured live:
```
phoneValue "abc" · phoneIsInvalid false · phonePattern null · form.checkValidity() TRUE
```
The form would submit and create a real booking against an uncontactable customer.
**PR #206 fixes exactly this** (adds validatePkPhone + normalisation to this dialog) and is
not yet deployed. Not clicked through to Create — the validity state is conclusive and
creating it would write money rows.

### N-1 — Validation style is inconsistent across modules (not a bug, a UX debt)
Three different mechanisms for the same job:
- **Leads** — Save disabled + explanatory hint ("Add a contact name to save.")  ← best
- **Customers** — toast on submit
- **Bookings** — native browser bubbles

Native bubbles show only on the first invalid field, vanish on scroll, are unstyled, and
render in the **browser's** language — the portal has an اردو toggle, so an Urdu user gets
English browser text. Recommend standardising on the Leads pattern.

### CORRECTION logged
I first recorded Bookings' empty-submit as a "silent no-op with zero feedback". That was
wrong — it is native HTML5 validation, which a real user sees as a browser tooltip but a
programmatic click does not render. Verified via `form.checkValidity()` before reporting.

## Module 4 — Expenses (live)
| # | action | expected | actual | verdict |
|---|---|---|---|---|
| 35 | READ list + KPIs | render | 55 expenses, Spent·month Rs 655,900, -37% vs last month | PASS |
| 36 | Period toggle — summary | totals change | day 197,200 · month 655,900 · year 5,586,100 · all 5,586,100 | PASS |
| 37 | Period toggle — table | list filters to period | **"Showing 1–25 of 55" in EVERY period; "day" lists 13-Jul-2026 rows** | **FAIL** |
| 38 | Add expense — empty | Save blocked | disabled | PASS |
| 39 | Amount `0` | reject + explain | disabled + "must be more than Rs 0." | PASS |
| 40 | Amount `-500` | reject | disabled (no message) | PASS (UX) |
| 41 | Amount `999999999999` | reject | disabled — upper bound enforced | PASS |
| 42 | Amount `12.345` | reject sub-paisa | disabled | PASS |
| 43 | Amount `1500` | accept | Save enabled | PASS |
| 44 | Fields present | amount/date/category/method/payee/subcat/space/booking/note + receipt upload | all 10 present | PASS |

### D-6 — The Day/Month/Year/All toggle filters the summary but not the ledger
Row total is **55 in every period**, and selecting **day** still lists `13-Jul-2026` rows.
So the vendor reads "Spent · day Rs 197,200" directly above a table of expenses from
months earlier. For anyone reconciling a day's cash this is actively misleading.

Ambiguity acknowledged: the table sits under its own "Expenses" heading, so it may be
intended as an unfiltered ledger. Either way the toggle sits visually above both and a
vendor reasonably expects it to filter what is beneath it. Fix = filter the table too, or
move/label the toggle so its scope is obvious.

### N-2 — Amount rejections are silent except for zero
`0` says "must be more than Rs 0."; negative, absurd and sub-paisa values just disable Save
with no reason. Same fix as N-1: say why.

## Data manifest (updated)
| # | module | row created | identifier | removed? |
|---|---|---|---|---|
| 1 | Customers | offline customer | `ZZ QA Delete Me` / 03001112223 | NOT REMOVED — unreachable in UI (D-1) |
| 2 | Leads | lead #256 | `ZZ QA Lead` → EDITED | REMOVED — DELETE 200 verified |
| 3 | Expenses | **none** — dialog cancelled, nothing written to the ledger | — | n/a |

## Module 5 — Suppliers / A/P (live)
| # | action | expected | actual | verdict |
|---|---|---|---|---|
| 45 | READ A/P ledger | render | 7 invoices, Current Rs 77,000, aging buckets | PASS |
| 46 | Status filter badges | badge count == rows | All 7=7 · Received 1=1 · Partially 3=3 · Paid 3=3 · Overdue 3=3 | PASS |
| 47 | Zero-count filters | proper empty state | Disputed/Voided → "No invoices in this window" | PASS |
| 48 | Log invoice — required marks | `*` shown | Business *, Invoice date *, Subtotal * | PASS |
| 49 | Log invoice — empty submit | blocked client-side | **POST fired → 400; raw developer message shown** | **FAIL** |
| 50 | Subtotal `-1000` | reject | "must be greater than or equal to 0" | PASS |
| 51 | Subtotal `0` | reject (as Expenses does) | **accepted, no error** | **FAIL** |
| 52 | Subtotal `12.345` | reject sub-paisa | **accepted, no error** | **FAIL** |

### D-7 — Developer error text shown to the vendor
Submitting the empty form sends `POST /api/v1/suppliers/invoices` (no client-side guard),
receives 400, and renders the server's raw message verbatim:

> **"SupplierNameSnapshot required (or pass supplierId)"**

A venue owner cannot act on that. It also leaks internal field naming. Two fixes needed:
guard before sending, and map server errors to a sentence a vendor understands.

### D-8 — Money validation is inconsistent between modules
| value | Expenses | Supplier invoice |
|---|---|---|
| `0` | blocked + "must be more than Rs 0." | **accepted** |
| `-1000` | blocked | blocked |
| `12.345` | blocked | **accepted** |

A Rs 0 invoice and a sub-paisa invoice both enter the A/P ledger. The Expenses rules are
the correct ones; A/P should use the same.

## Data manifest (updated)
| # | module | row created | identifier | removed? |
|---|---|---|---|---|
| 1 | Customers | offline customer | `ZZ QA Delete Me` / 03001112223 | NOT REMOVED — unreachable in UI (D-1) |
| 2 | Leads | lead #256 | `ZZ QA Lead` → EDITED | REMOVED — DELETE 200 verified |
| 3 | Expenses | none — cancelled | — | n/a |
| 4 | Suppliers | none — the 400 rejected it | — | n/a, nothing written |

## Module 6 — Inventory (live)
| # | action | expected | actual | verdict |
|---|---|---|---|---|
| 53 | READ | render + KPIs | 12 items, 0 low-stock, stock value Rs 21,762,950 | PASS |
| 54 | Add item — empty | Save blocked | disabled | PASS |
| 55 | Name only | Save enabled (name is the only required) | enabled | PASS |
| 56 | Opening stock `-5` | reject + explain | disabled + "negative." | PASS |
| 57 | Cost `-999` | reject + explain | disabled + "negative." | PASS |
| 58 | Opening stock `1e9` | reject absurd | **accepted, Save enabled** | **UX / D-8** |

D-8 extended: Expenses blocks `999999999999`; Inventory accepts `1e9` (one billion units).
One fat-fingered opening stock silently corrupts the Rs 21.7M stock-value KPI. Lower
severity than the A/P zero-value gap, same root cause — no shared numeric rule.

## Data manifest (updated)
| 5 | Inventory | none — dialog cancelled | — | n/a |

## Modules 7–10 — Receipts · Receivables · Quotes · Holds (live)
| # | module | action | expected | actual | verdict |
|---|---|---|---|---|---|
| 59 | Receipts | READ | render | 16 receipts | PASS |
| 60 | Receipts | amount `0` | reject | "must be more than Rs 0." | PASS |
| 61 | Receipts | amount `-2000` | reject | "cannot be negative." | PASS |
| 62 | Receipts | valid amount, no booking | require linked booking | "must be tied to a booking whose customer has a registered account." | PASS |
| 63 | Receivables | READ, no create | derived from bookings | 25 rows, Outstanding shown, no create button | PASS |
| 64 | Quotes | READ | render | renders; 0 rows for this venue | PASS |
| 65 | Holds | Hold a date dialog | opens | opens with Date + Slot | PASS |
| 66 | Holds | "Hold date" on empty | should be blocked | **enabled on an empty form** | **UX** |

**Receipts is the reference implementation.** Three layers — zero guard, negative guard,
and a business rule (must tie to a booking whose customer has a registered account) — so
money-in cannot be recorded loosely. Every other money form should match this.

## Data manifest (updated)
| 6 | Receipts | none — blocked by the linked-booking rule (correctly) | — | n/a |
| 7 | Holds | none — dialog cancelled | — | n/a |

## Modules 11–14 — Staff · Calendar · Reviews · Settings (live)
| # | module | action | expected | actual | verdict |
|---|---|---|---|---|---|
| 67 | Staff | READ | render | 11 staff, Roster + Shifts & payroll tabs | PASS |
| 68 | Staff | Add staff — empty | Save blocked | disabled | PASS |
| 69 | Staff | phone `abc` | reject | "valid Pakistani number, e.g. 0300 1234567." | PASS |
| 70 | Staff | CNIC `123` | reject + explain | **"A CNIC has 13 digits — this one has 3."** | PASS |
| 71 | Staff | CNIC `35202-1234567-1` | accept | accepted | PASS |
| 72 | Staff | dihari `-500` | reject | "negative." + blocked | PASS |
| 73 | Staff | salary `-90000` | reject | "negative." + blocked | PASS |
| 74 | Calendar | READ + Add booking | render | renders; Add booking opens the SAME offline-booking dialog | PASS |
| 75 | Calendar | phone validation | reject `abc` | **inherits D-5 — same dialog, same hole** | **FAIL (dup of D-5)** |
| 76 | Reviews | READ, no create | vendors cannot write reviews | 3 reviews, read-only | PASS |
| 77 | Settings | READ | render | renders as "Rehman Grand Marquee" + guided tour | PASS |

**Staff is the best-validated module in the portal.** Phone, CNIC (digit-counted message),
dihari and salary all guarded with sentences a vendor can act on.

**D-5 has a second surface:** Calendar → Add booking mounts the same offline-booking dialog,
so the `abc` phone hole exists there too. PR #206 fixes both at once (single component).

## Data manifest (updated)
| 8 | Staff | none — dialog cancelled | — | n/a |

## Modules 15–18 — Chat · Notifications · Tax · Cheque ledger (live)
| # | module | action | expected | actual | verdict |
|---|---|---|---|---|---|
| 78 | Chat | READ | render conversations | renders, real thread (Waheed Jutt, 4d) | PASS |
| 79 | Chat | page heading | an `<h1>` | **no `<h1>` on the page at all** | **FAIL (a11y)** |
| 80 | Notifications | READ | render | renders with console/notifications sections | PASS |
| 81 | Tax report | READ | render FY figures | 12 rows, FY 2026–27 (July–June) | PASS |
| 82 | Cheque ledger | READ | render | 3 cheques | PASS |
| 83 | Cheque ledger | amount `0` | reject | "must be more than Rs 0." | PASS |
| 84 | Cheque ledger | amount `-1000` | reject | "cannot be negative." | PASS |
| 85 | Cheque ledger | valid amount, no booking | require linked booking | "must be tied to a booking whose customer has a registered account." | PASS |
| 86 | Cheque ledger | cheque no. format hint | show expected shape | placeholder "4–20 digits" | PASS |

### D-9 — /dashboard/chat has no page heading
No `<h1>` anywhere on the Messages screen. Screen-reader users get no landmark for the
page, and it is the only dashboard route missing one.

### Money-validation split is now clear
**Strong (zero + negative + linked-booking rule):** Receipts, Cheque ledger
**Weak:** Supplier A/P invoice (accepts Rs 0 and 12.345), Inventory (accepts 1e9)
The strong pattern already exists in this codebase — D-8 is A/P and Inventory not using it.

## Module 19 — Venue-OS, all 7 tabs (live)
| # | tab | expected | actual | verdict |
|---|---|---|---|---|
| 87 | Tonight | renders | h1 "Tonight" + arrivals/headcount/balances | PASS |
| 88 | Event profit | renders | h1 "Event profit" | PASS |
| 89 | Venue money | renders | h1 "Venue money" | PASS |
| 90 | Halls & spaces | renders | verified earlier — pre-flight panel + slot editor live | PASS |
| 91 | Cash & cheques | renders | h1 "Cash & cheques" | PASS |
| 92 | Kitchen | renders | h1 "Kitchen" | PASS |
| 93 | Accounting | renders | h1 "Accounting" | PASS |
| 94 | All tabs | no crashes | 0 error boundaries across all 7 | PASS |
| 95 | Fold usage | data above the fold | **tab content starts ~371 of 674 (55% consumed)** | **UX → density task** |

Every Venue-OS tab renders with its own heading and description — no regressions from the
slot work. The space cost is a layout issue, logged in UI-DENSITY-AND-HEADER-TASK.md.

## Modules 20–28 — Function Sheets · Trade Ops · Kitchen Prep · Promote · Billing · Automation · Onboarding · Collaborations · Reports
| # | route | expected | actual | verdict |
|---|---|---|---|---|
| 96 | function-sheets | render + h1 | "Function sheets", table top 321 | PASS |
| 97 | trade-ops | render + h1 | "Trade operations" | PASS |
| 98 | kitchen-prep | render + h1 | "Kitchen prep sheet" + real empty state | PASS |
| 99 | promote | render + h1 | "Promote" | PASS |
| 100 | billing | render + h1 | "Plan & billing"; **first data at top 1076 on a 674px screen** | PASS / UX |
| 101 | automation | render + h1 | "Automation" | PASS |
| 102 | automation | one primary action | **"New rule" rendered TWICE** | **UX (dup of the Expenses issue)** |
| 103 | onboarding | render + h1 | "Set up your listing" | PASS |
| 104 | collaborations | render + h1 | "Collaborations" | PASS |
| 105 | reports | render + h1 | "Reports" | PASS |
| 106 | all 9 | no crashes | 0 error boundaries | PASS |

## SUMMARY — 106 checks, 28 modules, live production UI

### Defects
| # | sev | module | finding |
|---|---|---|---|
| D-1 | High | Customers | Created customer never appears in the list (proven saved via duplicate-phone 400) |
| D-2 | High | Customers | Server 400 renders nothing — no toast, dialog stays open |
| D-3 | High | Leads | "Log a lead" dead on the default "All venues"; proven by controlled switch |
| D-5 | High | Bookings + Calendar | `abc` accepted as a phone — `checkValidity()` TRUE. **Fixed by PR #206** |
| D-6 | Med | Expenses | Period toggle filters the summary, not the ledger (55 rows in every period) |
| D-7 | Med | Suppliers | Raw developer error shown: "SupplierNameSnapshot required (or pass supplierId)" |
| D-8 | Med | Suppliers / Inventory | A/P accepts Rs 0 + 12.345; Inventory accepts 1e9 |
| D-4 | Low | Leads | 4 inputs with no accessible name |
| D-9 | Low | Chat | No `<h1>` on the page |

### Working well (verified, not assumed)
- **Leads** — full CRUD: create, read, update, delete, all re-read after hard reload; phone normalised; delete confirmation names the record and warns it is irreversible
- **Receipts / Cheque ledger** — three-layer money guard incl. "must be tied to a booking whose customer has a registered account"
- **Staff** — phone, CNIC ("A CNIC has 13 digits — this one has 3."), dihari and salary all guarded
- **Expenses** — 0 / negative / absurd / sub-paisa amounts all blocked
- **Filter integrity** — Bookings 7+5+2=14; every Supplier badge count matches its rows
- **Venue-OS** — all 7 tabs render; pre-flight panel + slot editor live and correct
- **28 modules, 0 crashes, 0 error boundaries, 0 blank pages**

### Layout — see UI-DENSITY-AND-HEADER-TASK.md
Duplicate primary actions: **Expenses** (Add expense ×2), **Automation** (New rule ×2).
Below-the-fold data: expenses table top 701, billing top 1076, staff table 385,
venue-os content ~371 — all on a 674px viewport.

### Data manifest — final
| # | module | row | removed? |
|---|---|---|---|
| 1 | Customers | `ZZ QA Delete Me` / 03001112223 | **NOT REMOVED — unreachable in UI (D-1)** |
| 2 | Leads | lead #256 | REMOVED (DELETE 200 verified) |
| 3–8 | Expenses, Suppliers, Inventory, Receipts, Holds, Staff | none — all dialogs cancelled or blocked | n/a |

**No money rows were written.** Nothing pushed.

## Addendum — spotted in the vendor's own screenshot (venue-os?tab=cash)
| # | finding | verdict |
|---|---|---|
| 107 | "Cheques clearing soon (PDC)" panel renders **"Couldn't load PDC tracking."** | **FAIL — D-10** |

### D-10 — PDC tracking panel fails to load on Venue-OS → Cash & cheques
The Cash & cheques tab's "Cheques clearing soon (PDC)" card shows a load failure while the
window selector (3d/5d/7d/14d) still renders. The Cheque ledger module at
`/dashboard/pdcs` loads its 3 cheques fine, so the data exists — this panel's own fetch is
failing. Needs the network call captured live to say whether it is a 4xx (wrong scope /
missing businessId) or a 5xx.

NOT yet root-caused — recording it so it is not lost.

## Addendum 2 — dashboard HOME (measured, 1366×674)

| # | finding | verdict |
|---|---|---|
| 108 | Home is the worst screen in the product for fold usage: first KPI at **747**, table at **2182** | **UX** |
| 109 | Listing completeness reported **twice with different numbers** on the same screen | **FAIL — D-11** |

### D-11 — Two backend endpoints disagree about listing completeness
The vendor's landing page renders two large cards 267px apart:

```
HealthPanel   top 156, 243px  →  "Your listing is 78% complete"
ProfileCard   top 423, 301px  →  "88  OF 100  ·  PROFILE COMPLETION · Rehman Grand Marquee"
```

Both name the same venue. Verified against the live API, same moment, same business 3358:

```
GET /api/v1/businesses/3358/completeness   → score 78
GET /api/v1/businesses/my-completeness     → 3358: score 88
```

Root cause: **two independent implementations**, wired to two different controllers —
`businessController.getCompleteness` vs `vendorCompletenessController.getMyCompleteness`
(src/routes/businessRouter.js:229 and :149).

The other two venues score 71 / 71 on the list endpoint; the per-business endpoint was not
checked for them.

Impact beyond the contradiction: these two cards together consume **544px** of a 674px
viewport to answer one question, which is why home's first KPI sits at 747.

**Not fixed** — deciding which calculator is authoritative is a product call, not a
refactor I should make unilaterally. Options: (a) make one controller delegate to the
other, (b) keep the rich card and drop the listing factor from HealthPanel, (c) keep
HealthPanel and collapse the card once the listing is above a threshold.

### D-11 — ROOT-CAUSED AND FIXED
Not two calculators — **one util fed two different queries.**
`computeCompletenessBreakdown` marks a checklist item done by reading the association off
the row, so anything the query does not load reads as missing.

| endpoint | loads | score |
|---|---|---|
| `/businesses/my-completeness` | packages + **menus** + vendor.**vendorType** | 88 |
| `/businesses/:id/completeness` | packages only, no vendorType, no menus | 78 |

`my-completeness` had already been fixed for exactly this and carries the reasons in
comments — `vendorType` drives the Specialty checklist, `menus` is counted by "at least 1
menu". `/:id/completeness` never got the same treatment, so it under-reported every
vendor's listing.

**78 was the wrong number.** Fix: give the per-business query the same associations.
Verified against the live production row for business 3358:

```
old query shape → 78
new query shape → 88
list endpoint   → 88     nowAgrees: true
```

Backend tests: 3 suites / 98 tests pass. The 16 failures in `addMyBusiness.http.test.js`
were verified pre-existing by stashing this change and re-running — unrelated.

### D-10 — ROOT-CAUSED AND FIXED
`components/dashboard/mainScreens/venue-os/pdc-drawer.tsx` called:

```js
queryFn: () => venueOsApi.pdcAlerts(undefined, withinDays)   // businessId hardcoded undefined
```

so the request went out as `/venue-os/pdc/alerts?withinDays=5` and the backend answered
`400 BusinessId is required` — **every time, for every vendor, since the panel shipped.**
It was never an outage; it was a request that could not succeed. The copy
("Couldn't load PDC tracking.") made it look transient.

Verified against production:
```
no businessId    → 400 "BusinessId is required"
businessId 3358  → 200, 0 rows
businessId 3359  → 200, 2 rows  (cheque id 45, Rs 5,000, dated 2020-01-01, status "held")
```

**Business impact:** Rehman Banquet & Lawn has two post-dated cheques — one long overdue —
that this panel exists specifically to chase, and the vendor has never seen them here.
`/dashboard/pdcs` listed them all along, which is why the data looked fine elsewhere.

Fixed three ways:
1. Pass the active business id.
2. Put it in the `queryKey` — without it, switching venue would have served the first
   venue's cheques from cache. Same class as the slot-scoping leak, and worse, because
   this is money owed.
3. On "All venues" the panel no longer shows an error for a question never asked; it says
   "Choose a single venue in the switcher to see its cheques."

FE typecheck: 121 — baseline.

### Class-check after D-10 (find the pattern, not just the instance)
- `Api.x(undefined, …)` anywhere in components: **none besides pdc-drawer**.
- Every other `["venueOs", …]` queryKey already carries its scoping id
  (`activeBusinessId` for business-level panels, `orgId` for org-level ones).
- Path-param APIs that could build `/business/undefined/...`: both callers of
  `liabilityCalendar` / `liabilityCalendarPdc` guard with `disabled={!businessId || …}`,
  so they cannot fire unscoped.
- Cash-float is POST-only ("Open drawer"), so it has no unscoped GET to fail.

**pdc-drawer was the only instance.** Verified, not assumed.

## RUNNING TOTAL — 11 defects, 4 fixed this session
| # | sev | module | status |
|---|---|---|---|
| D-1 | High | Customers | created row never appears — OPEN |
| D-2 | High | Customers | server 400 renders nothing — OPEN |
| D-3 | High | Leads | dead on "All venues" — OPEN (diagnosis proven) |
| D-5 | High | Bookings + Calendar | `abc` accepted as phone — **FIXED (PR #206)** |
| D-6 | Med | Expenses | period toggle doesn't filter the ledger — OPEN |
| D-7 | Med | Suppliers | raw developer error to vendor — OPEN |
| D-8 | Med | Suppliers/Inventory | Rs 0 + sub-paisa + 1e9 accepted — OPEN |
| D-4 | Low | Leads | 4 inputs unnamed — OPEN |
| D-9 | Low | Chat | no `<h1>` — OPEN |
| **D-10** | **High** | **Venue-OS cash** | **PDC panel never loaded — FIXED** |
| **D-11** | **High** | **Dashboard home** | **completeness 78 vs 88 — FIXED at source** |

### D-2 — WITHDRAWN (false finding, my measurement error)
I reported "a server rejection shows the vendor nothing". It does show it. Re-tested live,
sampling every 250ms instead of once at 5s:

```
t=500ms  toast: "You already have a customer with this phone number"
```

The dialog's `onError` calls `toast.error(errorMessage(e, …))` and surfaces the server's
sentence verbatim. Sonner auto-dismisses at ~4s; my original probe looked at 5s and found
an empty list. **The code was right; the test was wrong.**

Third false finding caught before it reached a fix — the others were the merge-packages
toggle and a stale dropdown that mimicked a capacity leak. Verifying the mechanism before
writing code is what stopped all three.

### D-1 — ROOT-CAUSED AND FIXED
Not a caching or refresh problem: **two different resources behind one screen.**

```
list   → GET  /api/v1/customers        → 22 rows (derived from bookings)
create → POST /api/v1/offlineCustomers →  4 rows (the vendor's manual book)
```

No overlap. A vendor added a customer, it saved with 201, and it was nowhere — not in the
table, not in the count, not findable by search. Adding it again returned "You already
have a customer with this phone number", which is true and unhelpable.

**Three of those four offline rows were the vendor's real customers**, invisible to them
in their own client book.

Fix: `OfflineCustomersAPI.list()` + merged into the view, de-duplicated on phone digits
and lowercased email so someone who walked in and later booked online appears once. Offline
rows show 0 bookings, which is the truth, not an invented number. The offline fetch is its
own query with `retry:false` so a failure there can never blank the main list.

## ROUND 5 — every remaining defect closed

| # | module | fix |
|---|---|---|
| **D-1** | Customers | list merged `GET /offlineCustomers` with `GET /customers`, de-duped on phone digits + lowercased email. The vendor's 4 manually-added customers are now in their own client book. Offline rows show 0 bookings — the truth, not an invented number. Separate query with `retry:false` so an offline-book failure can never blank the main list. |
| **D-2** | Customers | **WITHDRAWN — false finding.** The toast fires at 500ms with the server's exact sentence; my probe sampled at 5s, after auto-dismiss. |
| **D-3** | Leads | `BusinessScopeField` added to the dialog. It self-hides when a venue is active, so single-venue vendors see no change; on "All venues" the vendor picks the venue in the dialog instead of hunting the switcher. Hint reworded to "Choose which venue this lead is for." |
| **D-4** | Leads | `Field` now WRAPS its control in the `<label>`, giving Contact name, Email, Budget and Guests a real accessible name — and fixing every other field the component renders. Clicking a label now focuses its control. |
| **D-6** | Expenses | The ledger follows the period. `ExpenseCockpit` reports `{gran, anchor}` via `onPeriodChange`; the table filters with the same exported `inPeriod`. Callback is `useCallback`-stable and the setter no-ops on an unchanged period, so the effect cannot loop. |
| **D-7** | Suppliers | Client-side `.refine()` requires a supplier or a one-off name **before** sending, with "Choose a supplier, or type a name for a one-off supplier." The vendor no longer sees "SupplierNameSnapshot required (or pass supplierId)". |
| **D-8** | Suppliers | Subtotal `.gt(0)` + 2-decimal `paisa()` rule; tax non-negative. Rs 0 and 12.345 invoices are refused, matching Receipts and the cheque ledger. |
| **D-8b** | Inventory | Upper bounds added — `1e9` opening stock is refused. Ceilings deliberately generous (1M units, Rs 100M/unit, 365 days) so they catch a fat finger, not a large venue. |
| **D-9** | Chat | `<h1 class="sr-only">Messages</h1>` — the only dashboard route with no heading now has one, without spending a row on a full-height two-pane screen. |

### Verification
- FE typecheck: **121 — the ratchet baseline**, no new errors.
- `next build`: **Compiled successfully**.
- Suites: health **15**, pre-flight **16**, field-validation **31** — all pass.
- BE: 98 tests pass; the 16 `addMyBusiness` failures were confirmed pre-existing by stashing.

### Defect ledger — final
11 raised · **10 fixed** · **1 withdrawn as a false finding (D-2)** · 0 open.

## ROUND 6 — the four items that needed real writes

### 🔴 D-12 (CRITICAL) — production Stripe is in TEST mode
```
GET /api/v1/payments/config  →  publishableKey: pk_test_51SU…
```
A real customer entering a real card **cannot pay** — test mode rejects live cards. Every
card payment the platform has ever "taken" is a test payment. The Rs 1,052,398 shown as
collected in Bookings must therefore be offline payments the vendor recorded by hand
(cash/cheque), not card money.

Not a code fix — the backend needs its live `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY`.
**Flagged, not changed:** switching a payment provider to live is the owner's decision.

### 🔴 D-13 (CRITICAL) — two of three venues cannot take a payment at all
Completed a real booking end-to-end on 3359 (Evening 6 PM–10 PM, Silver package):
```
POST /bookings                       → 201  ✅ booking created
POST /payments/create-payment-intent → 400
  "Payment_provider_bad_request: Amount must convert to at least 30 pence.
   ₨20.00 converts to approximately…"
```
Down payment computed as **Rs 20** on a Rs 480,000 booking. Root cause:

| business | downPayment | downPaymentType |
|---|---|---|
| 3358 Rehman Grand Marquee | 10.00 | "Percentage" ✅ |
| 3359 Rehman Banquet & Lawn | 20.00 | **null** 🔴 |
| 3360 Rehman Marquee Bahria | 20.00 | **null** 🔴 |

With a null type, `20.00` is read as flat **Rs 20** instead of 20%. Rs 20 is below Stripe's
minimum charge, so the intent can never be created: the customer gets a booking they can
never pay for, and the vendor gets a stranded "Awaiting Payment" row showing
`Rs 480,000 | Rs 20 | Rs 479,980`.

Blast radius, measured precisely — **2 businesses, both this vendor's**:
```
3,278 rows have downPaymentType NULL
  3,275 → downPayment 0     benign (no deposit taken)
      2 → downPayment 20    BROKEN: 3359, 3360
      1 → downPayment >100  treated as flat rupees, likely intended
```
Fix is a data correction plus a schema guard (type should not be nullable when an amount is
set). **Flagged, not changed** — deciding 20% vs Rs 20 is the vendor's commercial call.

### ✅ Closure fix verified end-to-end
The same booking used an **Evening 6 PM–10 PM** slot — precisely the case that used to die
at this step with "Wedding halls have to be closed by 10 PM". It returned **201**. The
closure work is confirmed working in the real customer flow.

### D-14 — FIXED: "Sub-business type must be an array"
The type-specific settings form chose array-vs-string from the CURRENT value:
`Array.isArray(original) ? [val] : val`. Production has `subBusinessType: null`, so it sent
a bare string and the backend refused it. **A vendor who had never set a venue type could
never set one** — the first save always failed, and only the first.

Verified against production:
```
bare string → 400 "Sub-business type must be an array"
array       → 200, stored ["Banquet Hall"]
```
Fixed by deciding shape from the COLUMN (`ARRAY_BACKED_FIELDS`), not from whatever the row
happens to hold.

### Test data — all cleaned up
| row | disposition |
|---|---|
| Booking #191 (3359, 25-Aug-2026) | **cancelled via the UI** — `DELETE /bookings/191/cancel-pending → 200`. Confirmation named the booking number. |
| Offline customer #71 `ZZ QA Delete Me` | **deleted → 200**. The 3 remaining are the vendor's real customers — which is exactly D-1's impact. |
| Business 3358 `subBusinessType` | **CHANGED by testing**: `null → ["Banquet Hall"]`. Disclosed; revert on request. |

## ROUND 7 — remaining items

### D-13 — FIXED (data + the class)
**Data**, through the app's own API rather than a raw production UPDATE (which was blocked,
correctly):
```
PATCH /businesses/user-business/3359  downPaymentType: "Percentage"  → 200
PATCH /businesses/user-business/3360  downPaymentType: "Percentage"  → 200
now 3359/3360: downPayment 20.00 · downPaymentType "Percentage"
```
A Rs 480,000 booking now asks for Rs 96,000, not Rs 20.

**The class**, in `pricingService.computeVendorPrice`: a deposit below the smallest amount a
card network will take is now collected at the venue instead of becoming an amount the
customer is asked for and cannot pay. `MIN_CHARGEABLE_PKR` (default 150, env-overridable —
Stripe's floor is ~30p ≈ Rs 110). Fixing two rows fixes today; this fixes the shape of the
bug for every vendor and every future misconfiguration.

### Cross-tab logout — NOT PROVEN, and my attempt was invalid
To make a `storage` event fire I had to CHANGE the token value (`token + "X"`). Tab 2 then
partially wiped — but that is the correct response to an invalid token: the corrupted value
reaches `verifyWithServer()`, returns 401, and the interceptor clears the session. The wipe
signature matched the original bug (`user_id`, `auth_jti`, `auth_flags` gone; `auth_token`,
`user_data`, `session_expiry` restored by the other tab's in-flight writes) — which is why
it looked like a reproduction.

It is not one. The real race carries a **valid** token, and no simulation can mint one for
a login that did not happen. **The only faithful test is a genuine second sign-in in a
second tab, which costs an OTP.** Recorded as unproven rather than passed or failed.

Session was restored intact afterwards (all 6 keys + cookies, API 200).

### D-12 Stripe TEST keys — deferred by the owner. Untouched.
