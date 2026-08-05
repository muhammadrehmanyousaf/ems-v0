# Wedding Wala — Vendor Portal Test Matrix

Generated from source by `scripts/qa-inventory.mjs`. Do not hand-edit the
inventory — re-run the script. Only the STATUS column is maintained by hand.

Status legend: `[ ]` untested · `[~]` render/health only · `[x]` deep-tested
(real clicks + hostile payloads + DB verified + no-reload check)

## Progress

| | Modules | % |
|---|---:|---:|
| `[x]` deep-tested | 6 | 14% |
| `[~]` render/health only | 11 | 25% |
| `[ ]` **not touched** | **27** | **61%** |
| **Total** | **44** | |

**2006 enumerated elements** across 44 modules.

> Element lists are extracted statically and are a FLOOR, not a ceiling —
> anything rendered through a shared toolbar or a deep component chain may
> be missing. Each module's list is completed from the live DOM at the
> moment that module is tested.

## Contents
- [Operate (main nav)](#operate-main-nav-)
- [My Business](#my-business)
- [Venue-OS](#venue-os)
- [Field capture](#field-capture)
- [Quotes](#quotes)

---

## Operate (main nav)


### 1. Dashboard

- **Route:** `/dashboard`
- **Page:** `app\(dashboard)\dashboard\page.tsx` (21 component files)
- **Status:** `[x]`
- **Coverage:** 0 covered controls once the cookie banner is dismissed (it was the only occluder), no overflow, 59 interactive elements. Recent/Most profit/Biggest segments all re-sort correctly. FOUND + FIXED: the event-profit board counted CANCELLED bookings as revenue — booking 175 (Cancelled, Rs 2,742,400) ranked #1 under both profit sorts, and 3 cancelled bookings worth Rs 3,855,050 inflated every headline tile including 'Outstanding · to collect'. OPEN (minor): the sort segments set neither aria-current nor aria-pressed, so a screen-reader user cannot tell which sort is active.

**Tabs / views** (3)

- [ ] Today
- [ ] Tomorrow
- [ ] no date

**Actions / buttons** (7)

- [ ] Add booking
- [ ] Add your business
- [ ] Nayi Booking
- [ ] Paisa
- [ ] Retry
- [ ] See all remaining
- [ ] Skip


### 2. Today

- **Route:** `/dashboard/today`
- **Page:** `app\(dashboard)\dashboard\today\page.tsx` (13 component files)
- **Status:** `[x]`
- **Coverage:** Verified against the API rather than assumed: shows exactly the 2 bookings dated today and correctly excludes the two Cancelled Waheed Jutt bookings (dated 04-Aug and 12-Aug). Revenue today (350,000 + 1,262,250 = 1,612,250) arithmetic correct. Outstanding Rs 12,292,729 matches Receivables exactly — which makes Reports' Rs 13,417,229 the outlier in the open money-mismatch question. 0 covered, no overflow.

**Dialogs** (1)

- [ ] Day-of timeline

**Actions / buttons** (10)

- [ ] Add task
- [ ] By person
- [ ] By time
- [ ] Cancel
- [ ] Print
- [ ] Retry
- [ ] Run sheet
- [ ] Timeline
- [ ] Toggle done
- [ ] View timeline

**Form fields** (4)

- [ ] Note (optional)
- [ ] What happens? e.g. Baraat entry + rasm
- [ ] e.g. lead photographer
- [ ] mins


### 3. Lead inbox

- **Route:** `/dashboard/leads`
- **Page:** `app\(dashboard)\dashboard\leads\page.tsx` (22 component files)
- **Status:** `[~]`
- **Coverage:** Render/health only. 76 leads load. NOT tested: Log a lead, Import, Export, filters, detail, status transitions.

**Tabs / views** (3)

- [ ] Comfortable
- [ ] Compact
- [ ] Undo

**Sections** (1)

- [ ] Leads

**Dialogs** (3)

- [ ] Add Offline Booking
- [ ] Import
- [ ] Remove this lead?

**Actions / buttons** (8)

- [ ] Cancel
- [ ] Copy
- [ ] Discard
- [ ] Import
- [ ] Log a lead
- [ ] Redraft
- [ ] Retry
- [ ] Send on WhatsApp

**Form fields** (39)

- [ ] 03XX-XXXXXXX
- [ ] 03xx-xxxxxxx
- [ ] Any special requests or notes...
- [ ] Budget (Rs)
- [ ] Business *
- [ ] Contact name
- [ ] Customer name
- [ ] Dropoff address
- [ ] Email
- [ ] Event date
- [ ] Event type
- [ ] Existing customer
- [ ] Full Name *
- [ ] Guests
- [ ] Hall / Lawn
- [ ] Inquiry / notes
- [ ] Leave blank to use city-pair lookup
- [ ] Mehndi / Baraat / Walima…
- [ ] Menu
- [ ] Number of Guests
- [ ] Phone
- [ ] Phone Number *
- [ ] Pickup address
- [ ] Search leads…
- [ ] Select time
- [ ] Source
- [ ] Status
- [ ] The draft will appear here…
- [ ] Time Slot *
- [ ] Wedding group
- [ ] What are they asking for?
- [ ] WhatsApp
- [ ] Which function is this? *
- [ ] Whole venue (default)
- [ ] customer@example.com
- [ ] e.g. 200
- [ ] e.g. 350000
- [ ] e.g. Gulberg III, Lahore
- [ ] e.g. Pearl Continental, Lahore


### 4. Bookings

- **Route:** `/dashboard/bookings`
- **Page:** `app\(dashboard)\dashboard\bookings\page.tsx` (17 component files)
- **Status:** `[~]`
- **Coverage:** Add-booking dialog validation only (empty + partial payloads, native-validation probe). NOT tested: list filters, sort, Archive, Export, row actions, booking detail, financials, status transitions.

**Tabs / views** (2)

- [ ] Comfortable
- [ ] Compact

**Sections** (1)

- [ ] Bookings

**Dialogs** (2)

- [ ] Add Offline Booking
- [ ] Cancel Booking

**Actions / buttons** (3)

- [ ] Add booking
- [ ] Booking actions
- [ ] Retry

**Form fields** (25)

- [ ] 03XX-XXXXXXX
- [ ] Any special requests or notes...
- [ ] Business *
- [ ] Customer name
- [ ] Dropoff address
- [ ] Existing customer
- [ ] Full Name *
- [ ] Hall / Lawn
- [ ] Leave blank to use city-pair lookup
- [ ] Mehndi / Baraat / Walima…
- [ ] Menu
- [ ] Number of Guests
- [ ] Phone Number *
- [ ] Pickup address
- [ ] Search bookings…
- [ ] Select time
- [ ] Time Slot *
- [ ] Wedding group
- [ ] Which function is this? *
- [ ] Whole venue (default)
- [ ] customer@example.com
- [ ] e.g. 200
- [ ] e.g. 350000
- [ ] e.g. Gulberg III, Lahore
- [ ] e.g. Pearl Continental, Lahore


### 5. Date holds

- **Route:** `/dashboard/holds`
- **Page:** `app\(dashboard)\dashboard\holds\page.tsx` (11 component files)
- **Status:** `[x]`
- **Coverage:** FULL CRUD verified live. Create → toast 'Date held' → row appears. Release → toast 'Hold released' → row gone WITHOUT reload → 0 holds left in the DB. Date field correctly carries min=today so a past date cannot be held. Test hold created and cleaned up. OPEN (minor): the dialog defaults to today/Evening with the button already enabled, so one click holds today without the vendor explicitly choosing a date.

**Tabs / views** (1)

- [ ] Undo

**Sections** (1)

- [ ] Date holds

**Dialogs** (1)

- [ ] Hold a date

**Actions / buttons** (5)

- [ ] Cancel
- [ ] Discard
- [ ] Hold a date
- [ ] Release
- [ ] Try again

**Form fields** (1)

- [ ] e.g. 6pm, Nikah


### 6. Function sheets

- **Route:** `/dashboard/function-sheets`
- **Page:** `app\(dashboard)\dashboard\function-sheets\page.tsx` (16 component files)
- **Status:** `[~]`
- **Coverage:** 17 sheets, Rs 28,559,050 total value, 0 covered, no overflow. New-sheet dialog gating is correct: disabled when empty AND when the title is whitespace-only (properly trimmed). FOUND (minor): Event date has no min attribute and accepts 2020-01-01 with no warning — a quote/BEO dated six years in the past. Date holds gets this right; this dialog does not. NOT tested: create (avoided cluttering live data), edit, remove, Export, view, status flow.

**Tabs / views** (3)

- [ ] Comfortable
- [ ] Compact
- [ ] Undo

**Sections** (1)

- [ ] Function sheets

**Dialogs** (2)

- [ ] New function sheet
- [ ] Remove this function sheet?

**Actions / buttons** (3)

- [ ] Cancel
- [ ] New function sheet
- [ ] Retry

**Form fields** (5)

- [ ] Customer name
- [ ] Event date
- [ ] Search sheets…
- [ ] Title
- [ ] e.g. Wedding Photography — Ahmed & Fatima


### 7. Customers

- **Route:** `/dashboard/customers`
- **Page:** `app\(dashboard)\dashboard\customers\page.tsx` (13 component files)
- **Status:** `[~]`
- **Coverage:** Add-customer dialog validation only (bad phone + bad email). NOT tested: list, edit, delete, detail page, duplicate handling.

**Tabs / views** (3)

- [ ] Comfortable
- [ ] Compact
- [ ] Name

**Sections** (1)

- [ ] Customers

**Dialogs** (3)

- [ ] Add customer
- [ ] Customer Details
- [ ] Import customers from Excel / CSV

**Actions / buttons** (9)

- [ ] Add customer
- [ ] Cancel
- [ ] Change
- [ ] Done
- [ ] Import
- [ ] Open detail
- [ ] Quick view
- [ ] Retry
- [ ] Upload .csv

**Form fields** (10)

- [ ] 03xx-xxxxxxx
- [ ] Assign to vendor
- [ ] Business (optional)
- [ ] City / area
- [ ] Email (optional)
- [ ] Map your columns
- [ ] Name
- [ ] Phone
- [ ] Search customers…
- [ ] Search vendors by name, email or phone…


### 8. Calendar

- **Route:** `/dashboard/calendar`
- **Page:** `app\(dashboard)\dashboard\calendar\page.tsx` (16 component files)
- **Status:** `[x]`
- **Coverage:** 179 interactive elements, 0 covered, no overflow. Month navigation verified (August → September → August). Day 5 shows exactly the 2 events Today reported, so the two screens agree. Correctly EXCLUDES cancelled bookings: 12-Aug is empty even though booking 178 (Cancelled, Rs 762,650) is dated then — the calendar handles cancellation properly, unlike the profit board did. ICS feed documents that cancelled bookings render struck through. NOT tested: generating the calendar feed, per-day drill-in, Add booking from a cell.

**Sections** (2)

- [ ] Calendar
- [ ] Nothing scheduled

**Dialogs** (1)

- [ ] Add Offline Booking

**Actions / buttons** (6)

- [ ] Add booking
- [ ] Copy feed URL
- [ ] Generate calendar feed
- [ ] Revoke
- [ ] Rotate
- [ ] Today

**Form fields** (24)

- [ ] 03XX-XXXXXXX
- [ ] Any special requests or notes...
- [ ] Business *
- [ ] Customer name
- [ ] Dropoff address
- [ ] Existing customer
- [ ] Full Name *
- [ ] Hall / Lawn
- [ ] Leave blank to use city-pair lookup
- [ ] Mehndi / Baraat / Walima…
- [ ] Menu
- [ ] Number of Guests
- [ ] Phone Number *
- [ ] Pickup address
- [ ] Select time
- [ ] Time Slot *
- [ ] Wedding group
- [ ] Which function is this? *
- [ ] Whole venue (default)
- [ ] customer@example.com
- [ ] e.g. 200
- [ ] e.g. 350000
- [ ] e.g. Gulberg III, Lahore
- [ ] e.g. Pearl Continental, Lahore


### 9. Conversations

- **Route:** `/dashboard/chat`
- **Page:** `app\(dashboard)\dashboard\chat\page.tsx` (13 component files)
- **Status:** `[~]`
- **Coverage:** Thread opens on a real click (a synthetic click on the wrapper does NOT — worth knowing for future automation). Message composer 'Type a message…' present, conversation search present, 0 covered, no overflow, history renders with timestamps and online/offline state. OPEN (minor): the page has no h1. NOT tested: sending a message (would message a real customer), attachments, search filtering, realtime socket delivery.

**Actions / buttons** (1)

- [ ] Start a conversation

**Form fields** (3)

- [ ] Search contacts...
- [ ] Search conversations...
- [ ] Type a message...


### 10. Payments

- **Route:** `/dashboard/payments`
- **Page:** `app\(dashboard)\dashboard\payments\page.tsx` (14 component files)
- **Status:** `[~]`
- **Coverage:** Renders, 0 covered controls, no overflow. 'Record payment' opens a dialog TITLED 'Record a receipt' (shared ReceiptFormDialog) — label mismatch, same validated form. NOT tested: create/edit/delete (deliberate — will not write fake money rows to a live ledger).

**Tabs / views** (5)

- [ ] Amount
- [ ] Comfortable
- [ ] Compact
- [ ] Date received
- [ ] Notes

**Sections** (1)

- [ ] Payments

**Actions / buttons** (3)

- [ ] Cancel
- [ ] Record payment
- [ ] Retry

**Form fields** (8)

- [ ] Amount (Rs)
- [ ] Date
- [ ] Linked booking (registered customer)
- [ ] Method
- [ ] Notes
- [ ] Search payments…
- [ ] TID / cheque #
- [ ] Transaction ref


### 11. Receivables

- **Route:** `/dashboard/receivables`
- **Page:** `app\(dashboard)\dashboard\receivables\page.tsx` (11 component files)
- **Status:** `[~]`
- **Coverage:** Render/health only via /dashboard/money.

**Tabs / views** (2)

- [ ] Comfortable
- [ ] Compact

**Sections** (1)

- [ ] Receivables

**Actions / buttons** (1)

- [ ] Retry

**Form fields** (1)

- [ ] Search customers…


### 12. Receipts

- **Route:** `/dashboard/receipts`
- **Page:** `app\(dashboard)\dashboard\receipts\page.tsx` (18 component files)
- **Status:** `[~]`
- **Coverage:** Record-receipt dialog validation deep-tested: negative amount and future date both blocked with aria-invalid + disabled Save; PK methods present (cash/jazzcash/easypaisa/raast/ibft/bank_transfer). NOT tested: actual create/edit/delete, Export, list filters, row actions.

**Tabs / views** (6)

- [ ] Amount
- [ ] Comfortable
- [ ] Compact
- [ ] Date received
- [ ] Notes
- [ ] Undo

**Sections** (1)

- [ ] Receipts

**Dialogs** (1)

- [ ] Remove this receipt?

**Actions / buttons** (4)

- [ ] Cancel
- [ ] Discard
- [ ] Record receipt
- [ ] Retry

**Form fields** (8)

- [ ] Amount (Rs)
- [ ] Date
- [ ] Linked booking (registered customer)
- [ ] Method
- [ ] Notes
- [ ] Search receipts…
- [ ] TID / cheque #
- [ ] Transaction ref


### 13. Cheque ledger

- **Route:** `/dashboard/pdcs`
- **Page:** `app\(dashboard)\dashboard\pdcs\page.tsx` (16 component files)
- **Status:** `[~]`
- **Coverage:** Log-a-cheque validation deep-tested and GOOD: rejects non-numeric cheque number, negative amount, and enforces the Pakistani staleness rule — 'This cheque is over 6 months old, so a bank will refuse it as stale.' 11 cheques render. NOT tested: create, status transitions (held→deposited→cleared/bounced), Export.

**Tabs / views** (7)

- [ ] Amount
- [ ] Bank
- [ ] Comfortable
- [ ] Compact
- [ ] Deposit date
- [ ] Notes
- [ ] Undo

**Sections** (1)

- [ ] Cheque ledger

**Dialogs** (2)

- [ ] Remove this cheque?
- [ ] Update cheque status

**Actions / buttons** (3)

- [ ] Cancel
- [ ] Log a cheque
- [ ] Retry

**Form fields** (14)

- [ ] 4–20 digits
- [ ] Amount (Rs)
- [ ] Bank
- [ ] Bounce reason
- [ ] Branch code
- [ ] Cheque date
- [ ] Cheque number
- [ ] Deposit date
- [ ] Linked booking (registered customer)
- [ ] Mark as
- [ ] Notes
- [ ] Search cheques…
- [ ] e.g. Insufficient funds
- [ ] e.g. Meezan, HBL


### 14. Expenses

- **Route:** `/dashboard/expenses`
- **Page:** `app\(dashboard)\dashboard\expenses\page.tsx` (23 component files)
- **Status:** `[~]`
- **Coverage:** Add-expense dialog validation deep-tested: negative amount and future date both blocked with aria-invalid + disabled Save; amount min=0, date max=today. 169 rows render. NOT tested: create/edit/delete, Scan (receipt OCR), category filters, day/month/year toggle.

**Tabs / views** (8)

- [ ] Amount
- [ ] Comfortable
- [ ] Compact
- [ ] Date spent
- [ ] Note
- [ ] Option
- [ ] Paid to
- [ ] Undo

**Sections** (1)

- [ ] Expenses

**Dialogs** (3)

- [ ] Custom fields ·
- [ ] Import
- [ ] Remove this expense?

**Actions / buttons** (10)

- [ ] Add a field
- [ ] Add expense
- [ ] Add option
- [ ] Add the first one
- [ ] Back
- [ ] Cancel
- [ ] Discard
- [ ] Import
- [ ] Retry
- [ ] Today

**Form fields** (13)

- [ ] Amount (Rs)
- [ ] Category
- [ ] Date
- [ ] Function / booking (optional)
- [ ] Note
- [ ] Paid to
- [ ] Payment method
- [ ] Search expenses…
- [ ] Short hint shown under the field
- [ ] Space (optional)
- [ ] Subcategory (optional)
- [ ] Supplier / payee
- [ ] What was this for?


### 15. Tax report

- **Route:** `/dashboard/tax`
- **Page:** `app\(dashboard)\dashboard\tax\page.tsx` (9 component files)
- **Status:** `[x]`
- **Coverage:** Read-only report. Arithmetic verified by hand: monthly revenue rows sum to the stated gross (14,349,700), monthly expenses sum to the stated total (4,869,700), and gross − expenses equals the stated Net P&L (9,480,000). FBR submitted Rs 0 — consistent with the adapter still being a no-op. No covered controls, no overflow.

**Sections** (1)

- [ ] Tax & P&L

**Actions / buttons** (2)

- [ ] Export PDF
- [ ] Retry


### 16. Reports

- **Route:** `/dashboard/reports`
- **Page:** `app\(dashboard)\dashboard\reports\page.tsx` (7 component files)
- **Status:** `[~]`
- **Coverage:** Renders, Roman-Urdu (Aasaan persona) copy correct, Maheena/Saal toggle works. OPEN QUESTION — cross-module money mismatch, NOT yet proven a bug: Reports/Saal shows Rs 33,493,850 over 22 events while Tax & P&L shows Rs 14,349,700 over 10 bookings for the same year and the same 'All venues' scope; Reports/Maheena shows Rs 16,065,700 for ONE month, more than Tax's entire year. Reports 'Baqaya' Rs 13,417,229 vs Receivables 'Outstanding' Rs 12,292,729 (Rs 1,124,500 apart). Could legitimately be different bases (contract value vs recognised revenue, active-bucket vs all bookings) — needs a definition check against the queries before calling it. Flagged, not asserted.

**Actions / buttons** (1)

- [ ] Image


### 17. Trade operations

- **Route:** `/dashboard/trade-ops`
- **Page:** `app\(dashboard)\dashboard\trade-ops\page.tsx` (11 component files)
- **Status:** `[ ]`

**Tabs / views** (1)

- [ ] Undo

**Sections** (3)

- [ ] No function sheet
- [ ] No trades configured
- [ ] Trade operations


### 18. Automation

- **Route:** `/dashboard/automation`
- **Page:** `app\(dashboard)\dashboard\automation\page.tsx` (16 component files)
- **Status:** `[ ]`

**Tabs / views** (3)

- [ ] Comfortable
- [ ] Compact
- [ ] Undo

**Sections** (1)

- [ ] Automation

**Dialogs** (1)

- [ ] Remove this rule?

**Actions / buttons** (3)

- [ ] Cancel
- [ ] New rule
- [ ] Retry

**Form fields** (8)

- [ ] Action
- [ ] Message (optional)
- [ ] Offset (days)
- [ ] Rule name
- [ ] Search rules…
- [ ] Template sent when the rule fires
- [ ] Trigger
- [ ] e.g. 3-day pre-event reminder


### 19. Kitchen prep

- **Route:** `/dashboard/kitchen-prep`
- **Page:** `app\(dashboard)\dashboard\kitchen-prep\page.tsx` (8 component files)
- **Status:** `[ ]`

**Sections** (1)

- [ ] Kitchen prep sheet

**Actions / buttons** (1)

- [ ] Add dish

**Form fields** (2)

- [ ] e.g. Khan Walima · 14 Feb
- [ ] guests


### 20. Inventory

- **Route:** `/dashboard/inventory`
- **Page:** `app\(dashboard)\dashboard\inventory\page.tsx` (17 component files)
- **Status:** `[ ]`

**Tabs / views** (6)

- [ ] Comfortable
- [ ] Compact
- [ ] In stock
- [ ] Low stock
- [ ] Out of stock
- [ ] Undo

**Sections** (1)

- [ ] Inventory

**Dialogs** (2)

- [ ] Adjust stock` : ""}
- [ ] Remove this item?

**Actions / buttons** (3)

- [ ] Add item
- [ ] Cancel
- [ ] Retry

**Form fields** (15)

- [ ] Category
- [ ] Cost / unit (Rs, optional)
- [ ] Default supplier
- [ ] Item name
- [ ] Last cost / unit (Rs)
- [ ] Low-stock threshold
- [ ] Movement
- [ ] Notes
- [ ] Opening stock
- [ ] Reason / note
- [ ] Reorder lead time (days)
- [ ] SKU
- [ ] Search items…
- [ ] Unit
- [ ] e.g. Premium photo album (12x18)


### 21. Staff & payroll

- **Route:** `/dashboard/staff`
- **Page:** `app\(dashboard)\dashboard\staff\page.tsx` (20 component files)
- **Status:** `[ ]`

**Tabs / views** (3)

- [ ] Comfortable
- [ ] Compact
- [ ] Undo

**Sections** (2)

- [ ] Shifts & payroll
- [ ] Team & Shooters

**Dialogs** (3)

- [ ] Import
- [ ] Remove this shift?
- [ ] Remove this staff member?

**Actions / buttons** (7)

- [ ] Add staff
- [ ] Cancel
- [ ] Disable login
- [ ] Import
- [ ] Log shift
- [ ] Reset password
- [ ] Retry

**Form fields** (21)

- [ ] 03xx-xxxxxxx
- [ ] Bank account #
- [ ] Bank name
- [ ] CNIC
- [ ] Dihari rate (Rs/day)
- [ ] Easypaisa
- [ ] Emergency contact
- [ ] Emergency phone
- [ ] Employment
- [ ] Full name
- [ ] JazzCash
- [ ] Joined date
- [ ] Monthly salary (Rs)
- [ ] New password (min 8 characters)
- [ ] Notes
- [ ] Phone
- [ ] Role
- [ ] Search staff…
- [ ] Staff email
- [ ] Temporary password (min 8 characters)
- [ ] WhatsApp


### 22. Suppliers

- **Route:** `/dashboard/suppliers`
- **Page:** `app\(dashboard)\dashboard\suppliers\page.tsx` (18 component files)
- **Status:** `[ ]`

**Tabs / views** (3)

- [ ] Comfortable
- [ ] Compact
- [ ] Undo

**Sections** (1)

- [ ] Suppliers

**Dialogs** (5)

- [ ] Dispute —
- [ ] Log invoice
- [ ] Remove this invoice?
- [ ] Remove this supplier?
- [ ] Void —

**Actions / buttons** (7)

- [ ] Add supplier
- [ ] Cancel
- [ ] Log invoice
- [ ] Mark disputed
- [ ] Record
- [ ] Retry
- [ ] Void

**Form fields** (29)

- [ ] 03xx-xxxxxxx
- [ ] 30kg mutton + 50kg chicken for Saturday Nikah
- [ ] Address
- [ ] Bank account #
- [ ] Bank name
- [ ] Category
- [ ] Contact person
- [ ] Credit limit (Rs)
- [ ] Easypaisa
- [ ] JazzCash
- [ ] LMS-202605-019
- [ ] NTN
- [ ] Name
- [ ] Notes
- [ ] Payment terms (days)
- [ ] Phone
- [ ] Pick
- [ ] Pick or fill name below
- [ ] Raast ID
- [ ] Reason (optional)
- [ ] STRN
- [ ] Search invoices…
- [ ] Search suppliers…
- [ ] Supplier / company name
- [ ] Tie to event
- [ ] Txn id / cheque #
- [ ] WhatsApp
- [ ] e.g. Ad-hoc generator rental
- [ ] https://… (kachi rasid scan)


### 23. Brokers

- **Route:** `/dashboard/brokers`
- **Page:** `app\(dashboard)\dashboard\brokers\page.tsx` (18 component files)
- **Status:** `[ ]`

**Tabs / views** (3)

- [ ] Comfortable
- [ ] Compact
- [ ] Undo

**Sections** (1)

- [ ] Brokers

**Dialogs** (1)

- [ ] Remove this commission?

**Actions / buttons** (3)

- [ ] Add commission
- [ ] Cancel
- [ ] Retry

**Form fields** (18)

- [ ] Accrued date
- [ ] Amount (Rs)
- [ ] Broker name
- [ ] Broker type
- [ ] Commission %
- [ ] Commission (Rs)
- [ ] Commission type
- [ ] Description
- [ ] Dispute reason
- [ ] Due date
- [ ] Method
- [ ] Payment date
- [ ] Reason (optional)
- [ ] Reference
- [ ] Search brokers…
- [ ] Txn id / cheque #
- [ ] What this commission is for
- [ ] e.g. 5


### 24. Generator fuel

- **Route:** `/dashboard/generator-fuel`
- **Page:** `app\(dashboard)\dashboard\generator-fuel\page.tsx` (16 component files)
- **Status:** `[ ]`

**Tabs / views** (3)

- [ ] Comfortable
- [ ] Compact
- [ ] Undo

**Sections** (1)

- [ ] Generator fuel log

**Dialogs** (1)

- [ ] Remove this entry?

**Actions / buttons** (3)

- [ ] Cancel
- [ ] Log entry
- [ ] Retry

**Form fields** (10)

- [ ] Date
- [ ] Entry type
- [ ] Fuel type
- [ ] Generator
- [ ] Litres
- [ ] Notes
- [ ] Run hours
- [ ] Search fuel log…
- [ ] Supplier
- [ ] e.g. 25 KVA #1


### 25. Halal certs

- **Route:** `/dashboard/halal-certs`
- **Page:** `app\(dashboard)\dashboard\halal-certs\page.tsx` (17 component files)
- **Status:** `[ ]`

**Tabs / views** (3)

- [ ] Comfortable
- [ ] Compact
- [ ] Undo

**Sections** (1)

- [ ] Halal certificates

**Dialogs** (1)

- [ ] Remove this certificate?

**Actions / buttons** (3)

- [ ] Add certificate
- [ ] Cancel
- [ ] Retry

**Form fields** (12)

- [ ] Certificate number
- [ ] Expires
- [ ] Issued
- [ ] Issuing authority
- [ ] Notes
- [ ] PHA-2026-0042
- [ ] Renewal lead (days)
- [ ] Search certificates…
- [ ] Supplier
- [ ] What it covers
- [ ] e.g. Beef & mutton supply
- [ ] e.g. Supplier lost their PHA certification


### 26. Drone NOC

- **Route:** `/dashboard/drone-noc`
- **Page:** `app\(dashboard)\dashboard\drone-noc\page.tsx` (17 component files)
- **Status:** `[ ]`

**Tabs / views** (3)

- [ ] Comfortable
- [ ] Compact
- [ ] Undo

**Sections** (1)

- [ ] Drone NOC permits

**Dialogs** (1)

- [ ] Remove this permit?

**Actions / buttons** (4)

- [ ] Add permit
- [ ] Cancel
- [ ] Retry
- [ ] Save

**Form fields** (14)

- [ ] Drone model
- [ ] Drone reg #
- [ ] Event / notes
- [ ] Fee paid (Rs)
- [ ] Issuing authority
- [ ] Permit type
- [ ] Pilot license
- [ ] Pilot name
- [ ] Reference number
- [ ] Search permits…
- [ ] Valid from
- [ ] Valid until
- [ ] Venue / area
- [ ] e.g. DJI Mavic 3


### 27. Reviews

- **Route:** `/dashboard/reviews`
- **Page:** `app\(dashboard)\dashboard\reviews\page.tsx` (9 component files)
- **Status:** `[ ]`

**Actions / buttons** (4)

- [ ] Copy
- [ ] PNG
- [ ] Refresh
- [ ] Share


### 28. Notifications

- **Route:** `/dashboard/notifications`
- **Page:** `app\(dashboard)\dashboard\notifications\page.tsx` (18 component files)
- **Status:** `[ ]`

**Tabs / views** (28)

- [ ] Account
- [ ] Activity
- [ ] All
- [ ] Approved
- [ ] Booking
- [ ] Bookings
- [ ] Cancelled
- [ ] Complaints
- [ ] Failed
- [ ] Favourites
- [ ] Messages
- [ ] My quotes
- [ ] My wedding plan
- [ ] Notifications
- [ ] Overview
- [ ] Payment
- [ ] Payments
- [ ] Payout
- [ ] Profile
- [ ] Refund
- [ ] Rejected
- [ ] Review
- [ ] Reviews
- [ ] Settings
- [ ] System
- [ ] Unread
- [ ] Wedding overview
- [ ] Welcome

**Sections** (1)

- [ ] Notifications

**Actions / buttons** (2)

- [ ] Load more
- [ ] Mark all read

**Form fields** (1)

- [ ] Search bookings, vendors…


### 29. Promote

- **Route:** `/dashboard/promote`
- **Page:** `app\(dashboard)\dashboard\promote\page.tsx` (14 component files)
- **Status:** `[ ]`

**Tabs / views** (2)

- [ ] Comfortable
- [ ] Compact

**Sections** (1)

- [ ] Promote

**Dialogs** (1)

- [ ] Request a placement

**Actions / buttons** (3)

- [ ] Cancel
- [ ] Request placement
- [ ] Retry

**Form fields** (5)

- [ ] Anything the admin should know
- [ ] Duration
- [ ] Note (optional)
- [ ] Placement
- [ ] Search promotions…


### 30. Plan & billing

- **Route:** `/dashboard/billing`
- **Page:** `app\(dashboard)\dashboard\billing\page.tsx` (10 component files)
- **Status:** `[ ]`

**Tabs / views** (1)

- [ ] Undo

**Sections** (1)

- [ ] Billing & plan

**Actions / buttons** (3)

- [ ] Current plan
- [ ] Included below your plan
- [ ] Upgrade requested


### 31. Collaborations

- **Route:** `/dashboard/collaborations`
- **Page:** `app\(dashboard)\dashboard\collaborations\page.tsx` (16 component files)
- **Status:** `[ ]`

**Tabs / views** (3)

- [ ] Comfortable
- [ ] Compact
- [ ] Undo

**Sections** (1)

- [ ] Collaborations

**Dialogs** (2)

- [ ] Cancel this invite?
- [ ] Invite a vendor

**Actions / buttons** (4)

- [ ] Accept
- [ ] Cancel
- [ ] Invite vendor
- [ ] Retry

**Form fields** (10)

- [ ] 03xx-xxxxxxx
- [ ] Agreed amount (Rs)
- [ ] Email
- [ ] Event / job
- [ ] Phone
- [ ] Scope
- [ ] Search collaborations…
- [ ] Vendor name
- [ ] e.g. Ahmed & Fatima walima
- [ ] e.g. Drone coverage


---

## My Business


### 32. Business Settings

- **Route:** `/dashboard/settings`
- **Page:** `app\(dashboard)\dashboard\settings\page.tsx` (23 component files)
- **Status:** `[x]`
- **Coverage:** ALL 11 TABS COVERED. Deep: Profile · Capacity & pricing · Amenities & services · Listing content · Type-specific · Packages · Menus · Bank details · Availability. Images = render only (no file uploaded). Team members = handoff card to its own screen, by design. FOUND + FIXED: no client validation on Capacity & pricing; no min on type-specific number fields; Listing content error toast showed the axios wrapper instead of the server reason. FOUND + FIXED backend: phantom Package Description column; blocked-dates ignored businessId.

**Tabs / views** (203)

- [ ] AC / Cooling Included
- [ ] Accepts Female-only Events
- [ ] Accessory Matching
- [ ] Account holder
- [ ] Acrylic Cards Available
- [ ] Alteration Service
- [ ] Amenities
- [ ] Amenities & services
- [ ] Anchors Both Events in a Day
- [ ] Availability
- [ ] Backup Internet (Mobile Data)
- [ ] Backup Unit for Failover
- [ ] Bank details
- [ ] Bank name
- [ ] Bilingual Printing
- [ ] Bridal Bouquet
- [ ] Bridesmaid Outfits
- [ ] Brings Own Equipment
- [ ] Calligraphy Available
- [ ] Capacity & pricing
- [ ] Capacity (KVA)
- [ ] Car Decor
- [ ] Car Parking Capacity
- [ ] Catering
- [ ] Centerpieces Available
- [ ] Chairs Available
- [ ] Chef Included
- [ ] Cities Covered
- [ ] Covers Baraat
- [ ] Covers Doli
- [ ] Covers Mehfil
- [ ] Covers Mehndi
- [ ] Covid Compliant
- [ ] Crockery & plates
- [ ] Crockery / Plates
- [ ] Custom Designs
- [ ] Custom Packaging
- [ ] Customisation Available
- [ ] DJ Booth Included
- [ ] Dance Styles
- [ ] Decoration
- [ ] Decoration Type
- [ ] Delivery & Pickup
- [ ] Delivery & Setup
- [ ] Delivery Radius (km)
- [ ] Description
- [ ] Design Consultation
- [ ] Digital Invitation Files
- [ ] Dupatta Styling
- [ ] Eggless Available
- [ ] Envelope Included
- [ ] Expertise
- [ ] Fabric Colors
- [ ] Fabrics Available
- [ ] Family-Friendly (Mahram-safe) Choreography
- [ ] Female Attendees Permitted
- [ ] Female Seating Compatible
- [ ] Finish
- [ ] Flowers
- [ ] Food Tasting
- [ ] Food tasting
- [ ] Fuel Included
- [ ] Fuel Type
- [ ] Garlands (Haar)
- [ ] Groom Wear Available
- [ ] Guest Take-home Boxes
- [ ] Halal-sourced Ingredients
- [ ] Handles Kids' Groups
- [ ] Has a Team
- [ ] Henna Style
- [ ] Home / Courier Delivery
- [ ] Home Delivery
- [ ] Hosting Style
- [ ] Hours Included
- [ ] Images
- [ ] Imported Flowers Available
- [ ] In-house Catering
- [ ] Includes Carpet
- [ ] Includes Chairs
- [ ] Includes Distribution
- [ ] Includes Tables
- [ ] Instruments
- [ ] Languages
- [ ] Languages Hosted
- [ ] Languages for Printing
- [ ] Languages of Nikah
- [ ] Lighting Included
- [ ] Linen Included
- [ ] Listing content
- [ ] Makeup Type
- [ ] Mandap / Stage Available
- [ ] Max Guest Capacity
- [ ] Max Tiers
- [ ] Maximum Capacity
- [ ] Maximum Guests
- [ ] Mehndi Cake
- [ ] Mehr Advisory Offered
- [ ] Menu title
- [ ] Menus
- [ ] Microphone Included
- [ ] Mini Cakes / Cupcakes
- [ ] Minimum Capacity
- [ ] Minimum Guests
- [ ] Minimum Order (Kg)
- [ ] Minimum Order (PKR)
- [ ] Minimum Order Quantity
- [ ] Mixer Included
- [ ] Mosque / Masjid Affiliation
- [ ] Music Editing Included
- [ ] Nationwide Delivery
- [ ] Nikahnama Drafting Provided
- [ ] Number of Cameras
- [ ] Number of Dholis
- [ ] Number of Speakers
- [ ] Occasions Catered
- [ ] Operator Included
- [ ] Operator On-site
- [ ] Order Lead Time
- [ ] Outdoor Rated
- [ ] Outfit Categories
- [ ] Output (kg / hour)
- [ ] Overseas Time-zone Coordination
- [ ] Package name
- [ ] Packages
- [ ] Parking
- [ ] Parking Available
- [ ] Per-Kg Pricing
- [ ] Photography Type
- [ ] Platforms
- [ ] Power (Watts)
- [ ] Price
- [ ] Price per head
- [ ] Printing Techniques
- [ ] Pro Switching Desk
- [ ] Production Turnaround
- [ ] Products Offered
- [ ] Profile
- [ ] Provide Decoration Items
- [ ] Recording Allowed
- [ ] Recording Provided
- [ ] Rehearsal Venue Provided
- [ ] Religious Etiquette Trained
- [ ] Rental Available
- [ ] Rush Orders Accepted
- [ ] SOP compliant
- [ ] Salami Coordination
- [ ] Script Customization
- [ ] Seating Arrangement
- [ ] Seating arrangement
- [ ] Sect-specific Preparation
- [ ] Sects Served
- [ ] Sehra Specialty
- [ ] Sell Mehndi Products
- [ ] Sermon Style
- [ ] Services
- [ ] Services & Amenities
- [ ] Session Length (hours)
- [ ] Session Length (minutes)
- [ ] Sessions Included
- [ ] Setup Hours
- [ ] Shop Type
- [ ] Signature Pieces
- [ ] Sofas Available
- [ ] Sound System
- [ ] Sound system
- [ ] Sound-proofed
- [ ] Staff
- [ ] Stage Decor Included
- [ ] Stage Florals
- [ ] Stage Lighting Included
- [ ] Stage Presence
- [ ] Starting Price (PKR)
- [ ] Stations
- [ ] Store Type
- [ ] Sugar-free Options
- [ ] Sweets Range
- [ ] Swings (Jhoola) Available
- [ ] Table Centerpieces
- [ ] Table Linen & Styling
- [ ] Tables Available
- [ ] Tasting Policy
- [ ] Team members
- [ ] Teardown Hours
- [ ] Traditional Attire
- [ ] Travel to Client
- [ ] Travel to Venue
- [ ] Travel to client
- [ ] Travels to Venue
- [ ] Trial / Fitting Session
- [ ] Troupe Performance Offered
- [ ] Troupe Size
- [ ] Type-specific
- [ ] Undo
- [ ] Uniformed Staff
- [ ] Venue Type
- [ ] Video Quality
- [ ] Waiter Service
- [ ] Waiters
- [ ] Wall-sided Tent
- [ ] Wax Seal / Stamp Available
- [ ] Wireless Mics
- [ ] Witnesses Provided
- [ ] Year-round Fresh Supply

**Sections** (10)

- [ ] Amenities & services
- [ ] Capacity & pricing
- [ ] No blocked dates
- [ ] No business found
- [ ] No images yet
- [ ] No menus yet
- [ ] No packages yet
- [ ] No payout accounts yet
- [ ] No type-specific settings
- [ ] Profile

**Actions / buttons** (14)

- [ ] Add
- [ ] Add account
- [ ] Add menu
- [ ] Add package
- [ ] Back
- [ ] Cancel
- [ ] Edit
- [ ] End tour
- [ ] Free
- [ ] Open
- [ ] Remove
- [ ] Set default
- [ ] Start tour
- [ ] Take a tour

**Form fields** (49)

- [ ] 03xx-xxxxxxx
- [ ] 10:00
- [ ] 22:00
- [ ] 23:00
- [ ] A short bio shown in your listing's team area
- [ ] About the owner
- [ ] Add a city and press Enter
- [ ] Advance type
- [ ] Area / locality
- [ ] As on the account
- [ ] Award title
- [ ] Backup arrangement
- [ ] Booking unit label
- [ ] Brand logo URL
- [ ] Business name
- [ ] Cancellation policy
- [ ] Cities you cover
- [ ] City
- [ ] Description
- [ ] Dietary options
- [ ] Event closing time
- [ ] Guest capacity
- [ ] Languages spoken
- [ ] Legal guest cap
- [ ] Max guests
- [ ] Min guests
- [ ] Optional
- [ ] Outside-vendor fee (Rs)
- [ ] Owner / lead name
- [ ] PK00XXXX0000000000000000
- [ ] Permit checklist link
- [ ] Publication / title
- [ ] Short summary
- [ ] Starting price (Rs)
- [ ] Tell couples what makes you special…
- [ ] Venue amenities
- [ ] Venue type
- [ ] Weddings completed
- [ ] WhatsApp number (bookings)
- [ ] Working hours
- [ ] Year
- [ ] Years in business
- [ ] e.g. 50000
- [ ] e.g. Meezan Bank, HBL, UBL
- [ ] e.g. Personal leave, already booked
- [ ] e.g. Silver Wedding Package
- [ ] e.g. Standard Buffet (per head)
- [ ] e.g. per event, per 100 guests, per day
- [ ] https://…


### 33. Availability

- **Route:** `/dashboard/availability`
- **Page:** `app\(dashboard)\dashboard\availability\page.tsx` (7 component files)
- **Status:** `[ ]`

**Actions / buttons** (3)

- [ ] Add lane
- [ ] Add line
- [ ] Add stock

**Form fields** (11)

- [ ] Back
- [ ] Deadline
- [ ] Delivery date
- [ ] End
- [ ] Out
- [ ] Qty
- [ ] Start
- [ ] Title
- [ ] e.g. Ali Studio Crew
- [ ] e.g. Chiavari chairs
- [ ] e.g. Degh kitchen


### 34. Cancellation policy

- **Route:** `/dashboard/cancellation-policy`
- **Page:** `app\(dashboard)\dashboard\cancellation-policy\page.tsx` (6 component files)
- **Status:** `[ ]`


### 35. Setup checklist

- **Route:** `/dashboard/onboarding`
- **Page:** `app\(dashboard)\dashboard\onboarding\page.tsx` (12 component files)
- **Status:** `[ ]`

**Tabs / views** (3)

- [ ] baaqi tracked
- [ ] bookings logged
- [ ] future dates locked

**Actions / buttons** (1)

- [ ] Dismiss


---

## Venue-OS


### 36. Tonight

- **Route:** `/dashboard/venue-os?tab=today`
- **Page:** `app\(dashboard)\dashboard\venue-os\page.tsx` (65 component files)
- **Status:** `[ ]`

**Tabs / views** (7)

- [ ] Advanced
- [ ] Bookings & Profit
- [ ] Cash & Cheques
- [ ] Kitchen
- [ ] Money & Expenses
- [ ] Spaces
- [ ] Today

**Sections** (6)

- [ ] Bookings & profit
- [ ] Cash & cheques
- [ ] Kitchen & suppliers
- [ ] Money & expenses
- [ ] Spaces & calendar
- [ ] Tonight

**Actions / buttons** (79)

- [ ] + Capital
- [ ] + Photo session
- [ ] Accept GRN
- [ ] Add
- [ ] Add contract
- [ ] Add partner
- [ ] Add policy
- [ ] Add segment
- [ ] Advance float
- [ ] Aging
- [ ] Beneficial owners
- [ ] Board
- [ ] Bounce-stress
- [ ] Build calendar
- [ ] Build one-pager
- [ ] CA export
- [ ] Capture FX
- [ ] Channel status
- [ ] Check
- [ ] Check input
- [ ] Check status
- [ ] Check variance
- [ ] Clean night score
- [ ] Close month
- [ ] Compare
- [ ] Compare seasons
- [ ] Compliance shield
- [ ] Compute runway
- [ ] Create
- [ ] Dispatch queued
- [ ] Distribute
- [ ] Download CSV
- [ ] Draft 489-F
- [ ] Draft review reply
- [ ] Estimate
- [ ] Evaluate triggers
- [ ] File §165
- [ ] Filer
- [ ] Generate statement
- [ ] Hold
- [ ] IVR
- [ ] Ijarah sample
- [ ] KPIs
- [ ] List
- [ ] Load
- [ ] Load contracts
- [ ] Load partners
- [ ] Load recipes
- [ ] Log incident
- [ ] Management
- [ ] Mark registered
- [ ] Non-filer
- [ ] Optimise payout
- [ ] Park
- [ ] Post
- [ ] Post accruals
- [ ] Preview
- [ ] Preview accruals
- [ ] Raise
- [ ] Readiness card
- [ ] Recompute expiry
- [ ] Reconcile
- [ ] Reconcile event
- [ ] Reconcile turnover
- [ ] Record
- [ ] Record bill
- [ ] Reopen
- [ ] Run appropriation
- [ ] Run batch
- [ ] Send same-night apology
- [ ] Shaadi-Qist
- [ ] Std cost
- [ ] Summary
- [ ] Tax view
- [ ] deliver
- [ ] generate ledger
- [ ] mark renewed
- [ ] verify chain
- [ ] − Drawing

**Form fields** (59)

- [ ] 123:150000, 124:200000
- [ ] COGS
- [ ] Overheads
- [ ] RSVP yes
- [ ] Revenue
- [ ] YYYY-MM
- [ ] actual rate
- [ ] amount
- [ ] billed rate
- [ ] booking Rs
- [ ] business #
- [ ] cash price
- [ ] cheque Rs
- [ ] cycle
- [ ] deposit
- [ ] due YYYY-MM-DD
- [ ] est. loss
- [ ] found by user#
- [ ] from YYYY-MM
- [ ] generator
- [ ] govt order ref
- [ ] insurer
- [ ] invited
- [ ] item
- [ ] item e.g. Chicken
- [ ] kVA
- [ ] label
- [ ] meter #
- [ ] monthly
- [ ] monthly rental
- [ ] name
- [ ] net profit
- [ ] net profit (optional)
- [ ] opening cash
- [ ] partner name
- [ ] per-head Rs
- [ ] period e.g. 2026
- [ ] plate
- [ ] premium
- [ ] production run #
- [ ] qty
- [ ] qty accepted
- [ ] rate
- [ ] rate/unit
- [ ] relationship
- [ ] season year
- [ ] share %
- [ ] start YYYY-MM
- [ ] start YYYY-MM-DD
- [ ] tag #
- [ ] term mo
- [ ] to YYYY-MM
- [ ] tol %
- [ ] total payable
- [ ] udhaar price
- [ ] unit
- [ ] value
- [ ] which function?
- [ ] witness user#


### 37. Event profit

- **Route:** `/dashboard/venue-os?tab=profit`
- **Page:** `app\(dashboard)\dashboard\venue-os\page.tsx` (65 component files)
- **Status:** `[ ]`

**Tabs / views** (7)

- [ ] Advanced
- [ ] Bookings & Profit
- [ ] Cash & Cheques
- [ ] Kitchen
- [ ] Money & Expenses
- [ ] Spaces
- [ ] Today

**Sections** (6)

- [ ] Bookings & profit
- [ ] Cash & cheques
- [ ] Kitchen & suppliers
- [ ] Money & expenses
- [ ] Spaces & calendar
- [ ] Tonight

**Actions / buttons** (79)

- [ ] + Capital
- [ ] + Photo session
- [ ] Accept GRN
- [ ] Add
- [ ] Add contract
- [ ] Add partner
- [ ] Add policy
- [ ] Add segment
- [ ] Advance float
- [ ] Aging
- [ ] Beneficial owners
- [ ] Board
- [ ] Bounce-stress
- [ ] Build calendar
- [ ] Build one-pager
- [ ] CA export
- [ ] Capture FX
- [ ] Channel status
- [ ] Check
- [ ] Check input
- [ ] Check status
- [ ] Check variance
- [ ] Clean night score
- [ ] Close month
- [ ] Compare
- [ ] Compare seasons
- [ ] Compliance shield
- [ ] Compute runway
- [ ] Create
- [ ] Dispatch queued
- [ ] Distribute
- [ ] Download CSV
- [ ] Draft 489-F
- [ ] Draft review reply
- [ ] Estimate
- [ ] Evaluate triggers
- [ ] File §165
- [ ] Filer
- [ ] Generate statement
- [ ] Hold
- [ ] IVR
- [ ] Ijarah sample
- [ ] KPIs
- [ ] List
- [ ] Load
- [ ] Load contracts
- [ ] Load partners
- [ ] Load recipes
- [ ] Log incident
- [ ] Management
- [ ] Mark registered
- [ ] Non-filer
- [ ] Optimise payout
- [ ] Park
- [ ] Post
- [ ] Post accruals
- [ ] Preview
- [ ] Preview accruals
- [ ] Raise
- [ ] Readiness card
- [ ] Recompute expiry
- [ ] Reconcile
- [ ] Reconcile event
- [ ] Reconcile turnover
- [ ] Record
- [ ] Record bill
- [ ] Reopen
- [ ] Run appropriation
- [ ] Run batch
- [ ] Send same-night apology
- [ ] Shaadi-Qist
- [ ] Std cost
- [ ] Summary
- [ ] Tax view
- [ ] deliver
- [ ] generate ledger
- [ ] mark renewed
- [ ] verify chain
- [ ] − Drawing

**Form fields** (59)

- [ ] 123:150000, 124:200000
- [ ] COGS
- [ ] Overheads
- [ ] RSVP yes
- [ ] Revenue
- [ ] YYYY-MM
- [ ] actual rate
- [ ] amount
- [ ] billed rate
- [ ] booking Rs
- [ ] business #
- [ ] cash price
- [ ] cheque Rs
- [ ] cycle
- [ ] deposit
- [ ] due YYYY-MM-DD
- [ ] est. loss
- [ ] found by user#
- [ ] from YYYY-MM
- [ ] generator
- [ ] govt order ref
- [ ] insurer
- [ ] invited
- [ ] item
- [ ] item e.g. Chicken
- [ ] kVA
- [ ] label
- [ ] meter #
- [ ] monthly
- [ ] monthly rental
- [ ] name
- [ ] net profit
- [ ] net profit (optional)
- [ ] opening cash
- [ ] partner name
- [ ] per-head Rs
- [ ] period e.g. 2026
- [ ] plate
- [ ] premium
- [ ] production run #
- [ ] qty
- [ ] qty accepted
- [ ] rate
- [ ] rate/unit
- [ ] relationship
- [ ] season year
- [ ] share %
- [ ] start YYYY-MM
- [ ] start YYYY-MM-DD
- [ ] tag #
- [ ] term mo
- [ ] to YYYY-MM
- [ ] tol %
- [ ] total payable
- [ ] udhaar price
- [ ] unit
- [ ] value
- [ ] which function?
- [ ] witness user#


### 38. Venue money

- **Route:** `/dashboard/venue-os?tab=money`
- **Page:** `app\(dashboard)\dashboard\venue-os\page.tsx` (65 component files)
- **Status:** `[ ]`

**Tabs / views** (7)

- [ ] Advanced
- [ ] Bookings & Profit
- [ ] Cash & Cheques
- [ ] Kitchen
- [ ] Money & Expenses
- [ ] Spaces
- [ ] Today

**Sections** (6)

- [ ] Bookings & profit
- [ ] Cash & cheques
- [ ] Kitchen & suppliers
- [ ] Money & expenses
- [ ] Spaces & calendar
- [ ] Tonight

**Actions / buttons** (79)

- [ ] + Capital
- [ ] + Photo session
- [ ] Accept GRN
- [ ] Add
- [ ] Add contract
- [ ] Add partner
- [ ] Add policy
- [ ] Add segment
- [ ] Advance float
- [ ] Aging
- [ ] Beneficial owners
- [ ] Board
- [ ] Bounce-stress
- [ ] Build calendar
- [ ] Build one-pager
- [ ] CA export
- [ ] Capture FX
- [ ] Channel status
- [ ] Check
- [ ] Check input
- [ ] Check status
- [ ] Check variance
- [ ] Clean night score
- [ ] Close month
- [ ] Compare
- [ ] Compare seasons
- [ ] Compliance shield
- [ ] Compute runway
- [ ] Create
- [ ] Dispatch queued
- [ ] Distribute
- [ ] Download CSV
- [ ] Draft 489-F
- [ ] Draft review reply
- [ ] Estimate
- [ ] Evaluate triggers
- [ ] File §165
- [ ] Filer
- [ ] Generate statement
- [ ] Hold
- [ ] IVR
- [ ] Ijarah sample
- [ ] KPIs
- [ ] List
- [ ] Load
- [ ] Load contracts
- [ ] Load partners
- [ ] Load recipes
- [ ] Log incident
- [ ] Management
- [ ] Mark registered
- [ ] Non-filer
- [ ] Optimise payout
- [ ] Park
- [ ] Post
- [ ] Post accruals
- [ ] Preview
- [ ] Preview accruals
- [ ] Raise
- [ ] Readiness card
- [ ] Recompute expiry
- [ ] Reconcile
- [ ] Reconcile event
- [ ] Reconcile turnover
- [ ] Record
- [ ] Record bill
- [ ] Reopen
- [ ] Run appropriation
- [ ] Run batch
- [ ] Send same-night apology
- [ ] Shaadi-Qist
- [ ] Std cost
- [ ] Summary
- [ ] Tax view
- [ ] deliver
- [ ] generate ledger
- [ ] mark renewed
- [ ] verify chain
- [ ] − Drawing

**Form fields** (59)

- [ ] 123:150000, 124:200000
- [ ] COGS
- [ ] Overheads
- [ ] RSVP yes
- [ ] Revenue
- [ ] YYYY-MM
- [ ] actual rate
- [ ] amount
- [ ] billed rate
- [ ] booking Rs
- [ ] business #
- [ ] cash price
- [ ] cheque Rs
- [ ] cycle
- [ ] deposit
- [ ] due YYYY-MM-DD
- [ ] est. loss
- [ ] found by user#
- [ ] from YYYY-MM
- [ ] generator
- [ ] govt order ref
- [ ] insurer
- [ ] invited
- [ ] item
- [ ] item e.g. Chicken
- [ ] kVA
- [ ] label
- [ ] meter #
- [ ] monthly
- [ ] monthly rental
- [ ] name
- [ ] net profit
- [ ] net profit (optional)
- [ ] opening cash
- [ ] partner name
- [ ] per-head Rs
- [ ] period e.g. 2026
- [ ] plate
- [ ] premium
- [ ] production run #
- [ ] qty
- [ ] qty accepted
- [ ] rate
- [ ] rate/unit
- [ ] relationship
- [ ] season year
- [ ] share %
- [ ] start YYYY-MM
- [ ] start YYYY-MM-DD
- [ ] tag #
- [ ] term mo
- [ ] to YYYY-MM
- [ ] tol %
- [ ] total payable
- [ ] udhaar price
- [ ] unit
- [ ] value
- [ ] which function?
- [ ] witness user#


### 39. Halls & spaces

- **Route:** `/dashboard/venue-os?tab=spaces`
- **Page:** `app\(dashboard)\dashboard\venue-os\page.tsx` (65 component files)
- **Status:** `[ ]`

**Tabs / views** (7)

- [ ] Advanced
- [ ] Bookings & Profit
- [ ] Cash & Cheques
- [ ] Kitchen
- [ ] Money & Expenses
- [ ] Spaces
- [ ] Today

**Sections** (6)

- [ ] Bookings & profit
- [ ] Cash & cheques
- [ ] Kitchen & suppliers
- [ ] Money & expenses
- [ ] Spaces & calendar
- [ ] Tonight

**Actions / buttons** (79)

- [ ] + Capital
- [ ] + Photo session
- [ ] Accept GRN
- [ ] Add
- [ ] Add contract
- [ ] Add partner
- [ ] Add policy
- [ ] Add segment
- [ ] Advance float
- [ ] Aging
- [ ] Beneficial owners
- [ ] Board
- [ ] Bounce-stress
- [ ] Build calendar
- [ ] Build one-pager
- [ ] CA export
- [ ] Capture FX
- [ ] Channel status
- [ ] Check
- [ ] Check input
- [ ] Check status
- [ ] Check variance
- [ ] Clean night score
- [ ] Close month
- [ ] Compare
- [ ] Compare seasons
- [ ] Compliance shield
- [ ] Compute runway
- [ ] Create
- [ ] Dispatch queued
- [ ] Distribute
- [ ] Download CSV
- [ ] Draft 489-F
- [ ] Draft review reply
- [ ] Estimate
- [ ] Evaluate triggers
- [ ] File §165
- [ ] Filer
- [ ] Generate statement
- [ ] Hold
- [ ] IVR
- [ ] Ijarah sample
- [ ] KPIs
- [ ] List
- [ ] Load
- [ ] Load contracts
- [ ] Load partners
- [ ] Load recipes
- [ ] Log incident
- [ ] Management
- [ ] Mark registered
- [ ] Non-filer
- [ ] Optimise payout
- [ ] Park
- [ ] Post
- [ ] Post accruals
- [ ] Preview
- [ ] Preview accruals
- [ ] Raise
- [ ] Readiness card
- [ ] Recompute expiry
- [ ] Reconcile
- [ ] Reconcile event
- [ ] Reconcile turnover
- [ ] Record
- [ ] Record bill
- [ ] Reopen
- [ ] Run appropriation
- [ ] Run batch
- [ ] Send same-night apology
- [ ] Shaadi-Qist
- [ ] Std cost
- [ ] Summary
- [ ] Tax view
- [ ] deliver
- [ ] generate ledger
- [ ] mark renewed
- [ ] verify chain
- [ ] − Drawing

**Form fields** (59)

- [ ] 123:150000, 124:200000
- [ ] COGS
- [ ] Overheads
- [ ] RSVP yes
- [ ] Revenue
- [ ] YYYY-MM
- [ ] actual rate
- [ ] amount
- [ ] billed rate
- [ ] booking Rs
- [ ] business #
- [ ] cash price
- [ ] cheque Rs
- [ ] cycle
- [ ] deposit
- [ ] due YYYY-MM-DD
- [ ] est. loss
- [ ] found by user#
- [ ] from YYYY-MM
- [ ] generator
- [ ] govt order ref
- [ ] insurer
- [ ] invited
- [ ] item
- [ ] item e.g. Chicken
- [ ] kVA
- [ ] label
- [ ] meter #
- [ ] monthly
- [ ] monthly rental
- [ ] name
- [ ] net profit
- [ ] net profit (optional)
- [ ] opening cash
- [ ] partner name
- [ ] per-head Rs
- [ ] period e.g. 2026
- [ ] plate
- [ ] premium
- [ ] production run #
- [ ] qty
- [ ] qty accepted
- [ ] rate
- [ ] rate/unit
- [ ] relationship
- [ ] season year
- [ ] share %
- [ ] start YYYY-MM
- [ ] start YYYY-MM-DD
- [ ] tag #
- [ ] term mo
- [ ] to YYYY-MM
- [ ] tol %
- [ ] total payable
- [ ] udhaar price
- [ ] unit
- [ ] value
- [ ] which function?
- [ ] witness user#


### 40. Cash & cheques

- **Route:** `/dashboard/venue-os?tab=cash`
- **Page:** `app\(dashboard)\dashboard\venue-os\page.tsx` (65 component files)
- **Status:** `[ ]`

**Tabs / views** (7)

- [ ] Advanced
- [ ] Bookings & Profit
- [ ] Cash & Cheques
- [ ] Kitchen
- [ ] Money & Expenses
- [ ] Spaces
- [ ] Today

**Sections** (6)

- [ ] Bookings & profit
- [ ] Cash & cheques
- [ ] Kitchen & suppliers
- [ ] Money & expenses
- [ ] Spaces & calendar
- [ ] Tonight

**Actions / buttons** (79)

- [ ] + Capital
- [ ] + Photo session
- [ ] Accept GRN
- [ ] Add
- [ ] Add contract
- [ ] Add partner
- [ ] Add policy
- [ ] Add segment
- [ ] Advance float
- [ ] Aging
- [ ] Beneficial owners
- [ ] Board
- [ ] Bounce-stress
- [ ] Build calendar
- [ ] Build one-pager
- [ ] CA export
- [ ] Capture FX
- [ ] Channel status
- [ ] Check
- [ ] Check input
- [ ] Check status
- [ ] Check variance
- [ ] Clean night score
- [ ] Close month
- [ ] Compare
- [ ] Compare seasons
- [ ] Compliance shield
- [ ] Compute runway
- [ ] Create
- [ ] Dispatch queued
- [ ] Distribute
- [ ] Download CSV
- [ ] Draft 489-F
- [ ] Draft review reply
- [ ] Estimate
- [ ] Evaluate triggers
- [ ] File §165
- [ ] Filer
- [ ] Generate statement
- [ ] Hold
- [ ] IVR
- [ ] Ijarah sample
- [ ] KPIs
- [ ] List
- [ ] Load
- [ ] Load contracts
- [ ] Load partners
- [ ] Load recipes
- [ ] Log incident
- [ ] Management
- [ ] Mark registered
- [ ] Non-filer
- [ ] Optimise payout
- [ ] Park
- [ ] Post
- [ ] Post accruals
- [ ] Preview
- [ ] Preview accruals
- [ ] Raise
- [ ] Readiness card
- [ ] Recompute expiry
- [ ] Reconcile
- [ ] Reconcile event
- [ ] Reconcile turnover
- [ ] Record
- [ ] Record bill
- [ ] Reopen
- [ ] Run appropriation
- [ ] Run batch
- [ ] Send same-night apology
- [ ] Shaadi-Qist
- [ ] Std cost
- [ ] Summary
- [ ] Tax view
- [ ] deliver
- [ ] generate ledger
- [ ] mark renewed
- [ ] verify chain
- [ ] − Drawing

**Form fields** (59)

- [ ] 123:150000, 124:200000
- [ ] COGS
- [ ] Overheads
- [ ] RSVP yes
- [ ] Revenue
- [ ] YYYY-MM
- [ ] actual rate
- [ ] amount
- [ ] billed rate
- [ ] booking Rs
- [ ] business #
- [ ] cash price
- [ ] cheque Rs
- [ ] cycle
- [ ] deposit
- [ ] due YYYY-MM-DD
- [ ] est. loss
- [ ] found by user#
- [ ] from YYYY-MM
- [ ] generator
- [ ] govt order ref
- [ ] insurer
- [ ] invited
- [ ] item
- [ ] item e.g. Chicken
- [ ] kVA
- [ ] label
- [ ] meter #
- [ ] monthly
- [ ] monthly rental
- [ ] name
- [ ] net profit
- [ ] net profit (optional)
- [ ] opening cash
- [ ] partner name
- [ ] per-head Rs
- [ ] period e.g. 2026
- [ ] plate
- [ ] premium
- [ ] production run #
- [ ] qty
- [ ] qty accepted
- [ ] rate
- [ ] rate/unit
- [ ] relationship
- [ ] season year
- [ ] share %
- [ ] start YYYY-MM
- [ ] start YYYY-MM-DD
- [ ] tag #
- [ ] term mo
- [ ] to YYYY-MM
- [ ] tol %
- [ ] total payable
- [ ] udhaar price
- [ ] unit
- [ ] value
- [ ] which function?
- [ ] witness user#


### 41. Kitchen

- **Route:** `/dashboard/venue-os?tab=kitchen`
- **Page:** `app\(dashboard)\dashboard\venue-os\page.tsx` (65 component files)
- **Status:** `[ ]`

**Tabs / views** (7)

- [ ] Advanced
- [ ] Bookings & Profit
- [ ] Cash & Cheques
- [ ] Kitchen
- [ ] Money & Expenses
- [ ] Spaces
- [ ] Today

**Sections** (6)

- [ ] Bookings & profit
- [ ] Cash & cheques
- [ ] Kitchen & suppliers
- [ ] Money & expenses
- [ ] Spaces & calendar
- [ ] Tonight

**Actions / buttons** (79)

- [ ] + Capital
- [ ] + Photo session
- [ ] Accept GRN
- [ ] Add
- [ ] Add contract
- [ ] Add partner
- [ ] Add policy
- [ ] Add segment
- [ ] Advance float
- [ ] Aging
- [ ] Beneficial owners
- [ ] Board
- [ ] Bounce-stress
- [ ] Build calendar
- [ ] Build one-pager
- [ ] CA export
- [ ] Capture FX
- [ ] Channel status
- [ ] Check
- [ ] Check input
- [ ] Check status
- [ ] Check variance
- [ ] Clean night score
- [ ] Close month
- [ ] Compare
- [ ] Compare seasons
- [ ] Compliance shield
- [ ] Compute runway
- [ ] Create
- [ ] Dispatch queued
- [ ] Distribute
- [ ] Download CSV
- [ ] Draft 489-F
- [ ] Draft review reply
- [ ] Estimate
- [ ] Evaluate triggers
- [ ] File §165
- [ ] Filer
- [ ] Generate statement
- [ ] Hold
- [ ] IVR
- [ ] Ijarah sample
- [ ] KPIs
- [ ] List
- [ ] Load
- [ ] Load contracts
- [ ] Load partners
- [ ] Load recipes
- [ ] Log incident
- [ ] Management
- [ ] Mark registered
- [ ] Non-filer
- [ ] Optimise payout
- [ ] Park
- [ ] Post
- [ ] Post accruals
- [ ] Preview
- [ ] Preview accruals
- [ ] Raise
- [ ] Readiness card
- [ ] Recompute expiry
- [ ] Reconcile
- [ ] Reconcile event
- [ ] Reconcile turnover
- [ ] Record
- [ ] Record bill
- [ ] Reopen
- [ ] Run appropriation
- [ ] Run batch
- [ ] Send same-night apology
- [ ] Shaadi-Qist
- [ ] Std cost
- [ ] Summary
- [ ] Tax view
- [ ] deliver
- [ ] generate ledger
- [ ] mark renewed
- [ ] verify chain
- [ ] − Drawing

**Form fields** (59)

- [ ] 123:150000, 124:200000
- [ ] COGS
- [ ] Overheads
- [ ] RSVP yes
- [ ] Revenue
- [ ] YYYY-MM
- [ ] actual rate
- [ ] amount
- [ ] billed rate
- [ ] booking Rs
- [ ] business #
- [ ] cash price
- [ ] cheque Rs
- [ ] cycle
- [ ] deposit
- [ ] due YYYY-MM-DD
- [ ] est. loss
- [ ] found by user#
- [ ] from YYYY-MM
- [ ] generator
- [ ] govt order ref
- [ ] insurer
- [ ] invited
- [ ] item
- [ ] item e.g. Chicken
- [ ] kVA
- [ ] label
- [ ] meter #
- [ ] monthly
- [ ] monthly rental
- [ ] name
- [ ] net profit
- [ ] net profit (optional)
- [ ] opening cash
- [ ] partner name
- [ ] per-head Rs
- [ ] period e.g. 2026
- [ ] plate
- [ ] premium
- [ ] production run #
- [ ] qty
- [ ] qty accepted
- [ ] rate
- [ ] rate/unit
- [ ] relationship
- [ ] season year
- [ ] share %
- [ ] start YYYY-MM
- [ ] start YYYY-MM-DD
- [ ] tag #
- [ ] term mo
- [ ] to YYYY-MM
- [ ] tol %
- [ ] total payable
- [ ] udhaar price
- [ ] unit
- [ ] value
- [ ] which function?
- [ ] witness user#


### 42. Accounting

- **Route:** `/dashboard/venue-os?tab=advanced`
- **Page:** `app\(dashboard)\dashboard\venue-os\page.tsx` (65 component files)
- **Status:** `[ ]`

**Tabs / views** (7)

- [ ] Advanced
- [ ] Bookings & Profit
- [ ] Cash & Cheques
- [ ] Kitchen
- [ ] Money & Expenses
- [ ] Spaces
- [ ] Today

**Sections** (6)

- [ ] Bookings & profit
- [ ] Cash & cheques
- [ ] Kitchen & suppliers
- [ ] Money & expenses
- [ ] Spaces & calendar
- [ ] Tonight

**Actions / buttons** (79)

- [ ] + Capital
- [ ] + Photo session
- [ ] Accept GRN
- [ ] Add
- [ ] Add contract
- [ ] Add partner
- [ ] Add policy
- [ ] Add segment
- [ ] Advance float
- [ ] Aging
- [ ] Beneficial owners
- [ ] Board
- [ ] Bounce-stress
- [ ] Build calendar
- [ ] Build one-pager
- [ ] CA export
- [ ] Capture FX
- [ ] Channel status
- [ ] Check
- [ ] Check input
- [ ] Check status
- [ ] Check variance
- [ ] Clean night score
- [ ] Close month
- [ ] Compare
- [ ] Compare seasons
- [ ] Compliance shield
- [ ] Compute runway
- [ ] Create
- [ ] Dispatch queued
- [ ] Distribute
- [ ] Download CSV
- [ ] Draft 489-F
- [ ] Draft review reply
- [ ] Estimate
- [ ] Evaluate triggers
- [ ] File §165
- [ ] Filer
- [ ] Generate statement
- [ ] Hold
- [ ] IVR
- [ ] Ijarah sample
- [ ] KPIs
- [ ] List
- [ ] Load
- [ ] Load contracts
- [ ] Load partners
- [ ] Load recipes
- [ ] Log incident
- [ ] Management
- [ ] Mark registered
- [ ] Non-filer
- [ ] Optimise payout
- [ ] Park
- [ ] Post
- [ ] Post accruals
- [ ] Preview
- [ ] Preview accruals
- [ ] Raise
- [ ] Readiness card
- [ ] Recompute expiry
- [ ] Reconcile
- [ ] Reconcile event
- [ ] Reconcile turnover
- [ ] Record
- [ ] Record bill
- [ ] Reopen
- [ ] Run appropriation
- [ ] Run batch
- [ ] Send same-night apology
- [ ] Shaadi-Qist
- [ ] Std cost
- [ ] Summary
- [ ] Tax view
- [ ] deliver
- [ ] generate ledger
- [ ] mark renewed
- [ ] verify chain
- [ ] − Drawing

**Form fields** (59)

- [ ] 123:150000, 124:200000
- [ ] COGS
- [ ] Overheads
- [ ] RSVP yes
- [ ] Revenue
- [ ] YYYY-MM
- [ ] actual rate
- [ ] amount
- [ ] billed rate
- [ ] booking Rs
- [ ] business #
- [ ] cash price
- [ ] cheque Rs
- [ ] cycle
- [ ] deposit
- [ ] due YYYY-MM-DD
- [ ] est. loss
- [ ] found by user#
- [ ] from YYYY-MM
- [ ] generator
- [ ] govt order ref
- [ ] insurer
- [ ] invited
- [ ] item
- [ ] item e.g. Chicken
- [ ] kVA
- [ ] label
- [ ] meter #
- [ ] monthly
- [ ] monthly rental
- [ ] name
- [ ] net profit
- [ ] net profit (optional)
- [ ] opening cash
- [ ] partner name
- [ ] per-head Rs
- [ ] period e.g. 2026
- [ ] plate
- [ ] premium
- [ ] production run #
- [ ] qty
- [ ] qty accepted
- [ ] rate
- [ ] rate/unit
- [ ] relationship
- [ ] season year
- [ ] share %
- [ ] start YYYY-MM
- [ ] start YYYY-MM-DD
- [ ] tag #
- [ ] term mo
- [ ] to YYYY-MM
- [ ] tol %
- [ ] total payable
- [ ] udhaar price
- [ ] unit
- [ ] value
- [ ] which function?
- [ ] witness user#


---

## Field capture


### 43. Field capture

- **Route:** `/dashboard/field`
- **Page:** `app\(dashboard)\dashboard\field\page.tsx` (13 component files)
- **Status:** `[ ]`

**Tabs / views** (6)

- [ ] Amount
- [ ] Date received
- [ ] Date spent
- [ ] Note
- [ ] Notes
- [ ] Paid to

**Sections** (1)

- [ ] Field capture

**Dialogs** (1)

- [ ] Hold a date

**Actions / buttons** (2)

- [ ] Cancel
- [ ] Discard

**Form fields** (30)

- [ ] 03xx-xxxxxxx
- [ ] Amount (Rs)
- [ ] Budget (Rs)
- [ ] Category
- [ ] Contact name
- [ ] Date
- [ ] Email
- [ ] Event date
- [ ] Event type
- [ ] Function / booking (optional)
- [ ] Guests
- [ ] Inquiry / notes
- [ ] Linked booking (registered customer)
- [ ] Method
- [ ] Note
- [ ] Notes
- [ ] Paid to
- [ ] Payment method
- [ ] Phone
- [ ] Source
- [ ] Space (optional)
- [ ] Status
- [ ] Subcategory (optional)
- [ ] Supplier / payee
- [ ] TID / cheque #
- [ ] Transaction ref
- [ ] What are they asking for?
- [ ] What was this for?
- [ ] WhatsApp
- [ ] e.g. 6pm, Nikah


---

## Quotes


### 44. Quote requests

- **Route:** `/dashboard/quotes`
- **Page:** `app\(dashboard)\dashboard\quotes\page.tsx` (10 component files)
- **Status:** `[ ]`

**Tabs / views** (8)

- [ ] Baraat
- [ ] Dholki
- [ ] Engagement
- [ ] Mehndi
- [ ] Nikah
- [ ] Not sure yet
- [ ] Other
- [ ] Walima

**Sections** (1)

- [ ] Quote requests

**Actions / buttons** (5)

- [ ] Accept
- [ ] Cancel
- [ ] Counter
- [ ] Decline
- [ ] Send quote

**Form fields** (3)

- [ ] Note (optional)
- [ ] Price (PKR)
- [ ] e.g. 250000
