# Flow audit — weddingwala.pk, 2026-09-26

Evidence-based pass over the live production database and both codebases. Every
number here came from a query against production, not from reading a doc.

---

## 0. The number that reframes everything

**48.** That is how many bookings on this platform come from a non-QA email
address. Out of 698 rows.

| | total | real (non-QA email) |
|---|---|---|
| Bookings | 698 | **48** |
| Conversations | 13 | — |
| Chat messages | 44 | — |
| Reviews | 23 | — |

So this is a **pre-launch platform with a very large surface**: 69 routers, 823
endpoints, a 188-endpoint venue-OS. The gaps that matter are the ones blocking
the *first hundred real customers*, not scale problems.

This also means several alarming-looking numbers are QA residue. Worth saying
plainly, because any of them would look like a crisis on a dashboard:

- "419 cancelled bookings with money paid and no refund request, Rs 33.8M" —
  **369 of them belong to QA accounts**, only 76 have a real PaymentReceipt, and
  filtered to genuine customers it is **zero**. No real customer is owed money.
- "3,232 businesses stuck in `submitted` vs 61 approved" — these are imported
  public-directory listings, 3,218 created in one June batch. Not an approval
  backlog. See §1, where the real problem with them is a different one.

---

## 1. P1 — The marketplace cannot be claimed  ← biggest single gap

There are **3,232 imported vendor listings** on the site that no owner has ever
claimed, against **61 approved** businesses.

A claim flow exists and is fully built on the back end:

- `src/routes/claimRouter.js`, mounted at `/api/v1/claims`
- `src/models/vendorClaim.js` + its migration
- an **admin** review queue in the frontend: `components/admin/ClaimsQueueTable.tsx`, `lib/api/claims.ts`

**There is no "Claim this listing" CTA anywhere a vendor would actually land.**
`components/seo/vendor-detail-page.tsx` — the page a venue owner reaches when
they google themselves — contains no claim entry point at all.

Claims raised to date: **4.**

This is the same shape as two bugs already fixed this session (the refund
approval UI, the chat attach button): back end complete, admin side complete,
**the user-facing entry point missing**. It is the growth engine of the whole
marketplace — 3,232 listings are inert without it.

**Fix:** a claim CTA on the public vendor detail page, plus an email path for
"is this your business?".

---

## 2. P1 — Nothing closes a booking after the event

**16 real bookings** are past their event date and still sitting in `Pending`,
`Awaiting Payment` or `Confirmed`. Platform-wide it is 40.

Nothing advances a booking to `Completed` when the date passes — no cron, no
prompt, no vendor nudge. Consequences compound:

- **reviews are never triggered** (23 reviews against 18 real completed bookings)
- **money is never chased** (see §3)
- analytics, revenue reporting and the vendor's own khata all read from status

**Fix:** a post-event transition — even a vendor-facing "did this happen?" prompt
rather than an automatic cron, since an auto-complete would also auto-close money.

---

## 3. P1 — Delivered-and-unpaid has no collections path

**8 real bookings** sit at `Completed` + `paymentStatus: Partial`, with
**Rs 2,448,980** outstanding. The event happened; the balance never arrived.

There is a due-reminder endpoint (`GET /bookings/reminders/due`,
`logReminderHandler`) but nothing drives it: no scheduled chase, and this state
has no dedicated surface in the vendor console.

**Fix:** surface "delivered, unpaid" as a worklist in the vendor console, the same
way open refund obligations now are.

---

## 4. P2 — Refund obligations do not age or nag

The refund engine now works end to end (verified on production this session,
including the DISPUTED branch). But:

- **135** refund requests ever raised
- **14** negative receipts ever written, Rs 310,250 total
- **7** obligations currently open, **Rs 175,000**, with nothing reminding the
  vendor they exist

`listOpenObligations` exists and the console shows a refund on the booking it
belongs to, but a vendor never sees "you owe three customers money" unless they
open those three bookings.

**Fix:** an obligations worklist + aging on the vendor dashboard home.

---

## 5. P2 — Verification: the ladder was fine, the door was missing  [CORRECTED]

**My original finding here was wrong and is kept below, struck through, because
being wrong in an audit is worth recording.**

The ladder is fully built: `utils/vendorVerificationStatus.js` computes the
tier, `verificationTierFromTimestamps` writes it, the admin queue reviews
documents, vendors can enter an NTN in settings, and `KycUploadCard` is mounted
at `/dashboard/business/[id]/documents`.

What was missing was, again, the **door**: nothing anywhere linked to that page.
A vendor could only reach verification by typing the URL. Fixed — a
"Verification" tab now sits beside Bank details in business settings.

That makes **five** separate instances in this one audit of the same failure:
complete back end, complete admin side, no user-facing entry point. It is the
single most reliable bug shape in this codebase.

### ~~Original (incorrect) finding~~

Nearly every imported listing sits at `verificationTier: 0` with no NTN, CNIC,
address or visit check recorded. The "✓ Verified" badge bug was correctly fixed
(it used to print unconditionally, which as the code notes reads as merchant
misrepresentation to a payment processor).

But nothing now *moves* a vendor up the tiers. The ladder exists in the schema
and has no rungs in the product.

---

## 6. P3 — A recurring bug class worth a systematic sweep

Three times now a feature has been implemented on **one** of several code paths:

| Feature | Done | Missed |
|---|---|---|
| Chat attachments | REST `createMessage` | **socket handler** — the path the UI actually uses |
| Videos on a business | `createBusinessWithVendor` | **`createBusiness`**, `addMyBusiness` |
| Cancel routing | `status` | **`paymentStatus`** |

All three shipped, all three were caught only by testing against the live system.
There are likely more: any feature touching bookings, businesses or messages
should be grepped for *every* call site before being called done.

---

## 7. What is genuinely healthy

Worth stating, because the list above is all problems:

- **The money model is sound.** Obligations are recorded rather than assumed,
  only the customer can close one, and the authorization boundaries hold — I
  tried to break them three ways on production and all three were refused.
- **The refund lifecycle is complete**, including DISPUTED and dispute history.
- **Chat media works both directions** with real Cloudinary storage.
- **Zero real customers are owed money.** The ledger nets out.
- The codebase documents its own traps unusually well — most of this audit was
  possible because past bugs were written down next to the code that caused them.

---

## Recommended order

1. **Claim CTA on the public vendor page** — unlocks 3,232 inert listings (§1)
2. **Post-event booking closure** — unblocks reviews and collections (§2)
3. **Delivered-unpaid worklist** — Rs 2.45M already outstanding (§3)
4. Obligations aging/worklist (§4)
5. Verification ladder (§5)
6. Multi-path sweep (§6)

Items 1–3 are what stand between this platform and its first hundred real
bookings. Everything else is refinement.
