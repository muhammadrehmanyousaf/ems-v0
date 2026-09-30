"use client"

/**
 * WW-RECORD-MODE — bank transfer, rewritten.
 *
 * What this screen used to do, on live bookings over Rs 999,999:
 *
 *   · showed a hardcoded HBL account and the IBAN PK36HABB0000000123456789 —
 *     a placeholder, presented to real customers about to transfer real money
 *   · listed "JazzCash 0300-0000000" and "Easypaisa 0300-0000000" as though
 *     they were payment destinations
 *   · sent people to a hardcoded WhatsApp number to report the transfer
 *   · told the customer "Wedding Wala holds your transferred deposit until the
 *     vendor confirms the booking", which is not true and cannot be: under
 *     PEFTA 2007 and the SBP's PSO/PSP Rules a payment service provider may not
 *     act as custodian of a consumer's money, and escrow for domestic
 *     e-commerce is open only to EMIs
 *
 * It now fetches the venue's own published account, shows a reference the venue
 * can match against their bank statement, lets the customer report the transfer
 * in-product, and describes the arrangement accurately: the venue collects, we
 * record it and hold the date.
 *
 * Marquee Stage — rendered inside the desk body beside the locked Stage, with
 * its own heading (an arrival, not a step), left-aligned, cards capped at
 * 560px; ~900px of content scrolls internally. The amount, the reference and
 * the venue's account sit above the fold. Every prop, state and API call is
 * unchanged.
 */

import { Copy, Check, Clock, FileText, Home, AlertTriangle, Loader2, Send } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { errorMessage } from "@/lib/utils/api-error"
import {
  PaymentInstructionsAPI,
  type PaymentInstructions,
  type ClaimMethod,
} from "@/lib/api/paymentInstructions"
import { BridalButton } from "@/components/bridal/bridal-button"

interface BankTransferScreenProps {
  bookingId: number
  amount: number
  paymentType: string
  customerEmail?: string
  bookingDate?: string
}

const METHOD_LABELS: Record<ClaimMethod, string> = {
  bank_transfer: "Bank transfer",
  raast: "Raast",
  ibft: "IBFT",
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  cash: "Cash",
}

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bridal-gold-dark focus-visible:ring-offset-2"
const LABEL = "font-bridal text-[11px] leading-[14px] uppercase tracking-[0.18em] text-bridal-text-label"
const CARD = "w-full max-w-[560px] rounded-[4px] border border-bridal-beige bg-white"
const INPUT = `h-11 w-full rounded-[4px] border border-bridal-beige bg-white px-3 font-bridal text-[14px] text-bridal-charcoal placeholder:text-bridal-text-soft/70 focus:border-bridal-gold-dark ${FOCUS}`
const COPY_BTN = `inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-bridal-text-soft transition-colors duration-150 hover:bg-bridal-blush/45 hover:text-bridal-gold-dark ${FOCUS}`
const OUTLINE_LINK = `inline-flex h-12 w-full items-center justify-center gap-2 rounded-[4px] border border-bridal-beige bg-white px-6 font-bridal text-[13px] font-medium uppercase tracking-[0.18em] text-bridal-charcoal transition-colors duration-150 hover:border-bridal-gold-dark hover:text-bridal-gold-dark ${FOCUS}`
const PRIMARY_LINK = `inline-flex h-12 w-full items-center justify-center gap-2 rounded-[4px] bg-bridal-gold px-6 font-bridal text-[13px] font-medium uppercase tracking-[0.18em] text-bridal-charcoal shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] transition-colors duration-200 hover:bg-bridal-gold-dark hover:text-bridal-ivory ${FOCUS}`
const stagger = (i: number) => ({ animationDelay: `${Math.min(i, 8) * 30}ms` })

export default function BankTransferScreen({
  bookingId,
  amount,
  paymentType,
  bookingDate,
}: BankTransferScreenProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [instructions, setInstructions] = useState<PaymentInstructions | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Claim form
  const [method, setMethod] = useState<ClaimMethod>("bank_transfer")
  const [transactionRef, setTransactionRef] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [claimed, setClaimed] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  // Surfaced on the success screen: the report succeeded, only the image didn't.
  const [proofWarning, setProofWarning] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    PaymentInstructionsAPI.get(bookingId)
      .then((data) => { if (!cancelled) { setInstructions(data); setLoadError(null) } })
      .catch((e) => { if (!cancelled) setLoadError(errorMessage(e, "Couldn't load the payment details")) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [bookingId])

  const copy = (value: string, key: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const formatDate = (d?: string) => {
    if (!d) return ""
    try { return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" }) }
    catch { return d }
  }

  const submitClaim = async () => {
    setSubmitting(true)
    setClaimError(null)
    try {
      const { claim } = await PaymentInstructionsAPI.claim(bookingId, {
        method,
        transactionRef: transactionRef.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      // The report is already filed and safe. The screenshot is attached
      // separately and its failure is reported WITHOUT undoing the report —
      // the venue can find the payment from the reference alone, and losing a
      // filed claim because an image upload timed out would be the worse bug.
      if (proofFile && claim?.id) {
        try {
          await PaymentInstructionsAPI.attachProof(bookingId, claim.id, proofFile)
        } catch (e) {
          setProofWarning(
            errorMessage(e, "We couldn't attach your screenshot") +
            " — your payment report went through, so the venue can still find it by reference.",
          )
        }
      }
      setClaimed(true)
    } catch (e) {
      setClaimError(errorMessage(e, "Couldn't send that to the venue"))
    } finally {
      setSubmitting(false)
    }
  }

  const typeLabel = paymentType === "full_payment" ? "Full payment" : "Advance"
  // Prefer the server's figure — it reads the live installment ledger, so a
  // change request or a refund since checkout is already reflected.
  const dueAmount = instructions?.amountDue ?? Number(amount)
  const reference = instructions?.reference ?? `BK-${bookingId}`
  const vendorsWithAccounts = (instructions?.vendors || []).filter((v) => v.accounts.length > 0)
  // A reference is what the venue matches against their statement, so every
  // rail except cash needs one before this can be submitted.
  const refRequired = method !== "cash"
  const canSubmit = !submitting && (!refRequired || transactionRef.trim().length >= 3)

  const copyIcon = (id: string) =>
    copied === id
      ? <Check className="h-4 w-4 text-[#3F6B43] animate-scale-in" strokeWidth={2.5} aria-hidden />
      : <Copy className="h-4 w-4" aria-hidden />

  let block = 0

  return (
    <div className="w-full">
      {/* Heading — the screen's own: an arrival, not a step. */}
      <header className="animate-stagger-fade-up" style={stagger(block++)}>
        <p className="font-bridal text-[11px] font-medium uppercase leading-[14px] tracking-[0.18em] text-bridal-gold-dark">
          Secure your date
        </p>
        <h2 className="mt-2 font-display text-[32px] italic leading-[38px] text-bridal-charcoal xl:text-[40px] xl:leading-[44px]">
          Pay your {typeLabel.toLowerCase()}
        </h2>
        <p className="mt-3 max-w-[640px] font-bridal text-[14px] leading-[20px] text-bridal-text-soft">
          {/* Accurate description of the arrangement. The venue collects; we record
              it and hold the date. Nothing is held by Wedding Wala. */}
          Your venue collects this payment directly. Tell us once you&apos;ve sent it and
          we&apos;ll hold your date while they confirm.
        </p>
      </header>

      {/* Amount — the one figure that must be unmistakable, on solid charcoal. */}
      <section
        aria-label="Amount to transfer"
        className="relative mt-6 w-full max-w-[560px] overflow-hidden rounded-[4px] bg-bridal-charcoal px-4 py-3 text-bridal-ivory animate-stagger-fade-up"
        style={stagger(block++)}
      >
        <div className="pointer-events-none absolute inset-0 bg-mughal-jaal opacity-[0.08]" aria-hidden />
        <div className="relative">
          <p className="font-bridal text-[11px] uppercase leading-[14px] tracking-[0.18em] text-bridal-gold">
            Amount to transfer
          </p>
          <p className="mt-1 font-display text-[32px] italic leading-[38px] tabular-nums text-bridal-ivory">
            Rs. {Number(dueAmount).toLocaleString()}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 font-bridal text-[12px] leading-[16px]">
            <span className="uppercase tracking-[0.18em] text-bridal-gold">{typeLabel}</span>
            <span className="text-bridal-ivory/80">
              Booking #{bookingId}
              {bookingDate ? ` · Event: ${formatDate(bookingDate)}` : ""}
            </span>
          </div>
        </div>
      </section>

      {/* Reference — the single most useful field for the venue, so it gets its
          own block rather than a bullet buried in an instructions list. */}
      <section
        aria-label="Transfer reference"
        className={`${CARD} mt-3 flex min-h-[72px] items-center justify-between gap-3 border-bridal-gold-dark px-4 py-2 animate-stagger-fade-up`}
        style={stagger(block++)}
      >
        <div className="min-w-0">
          <p className={LABEL}>Put this reference on your transfer</p>
          <p className="mt-0.5 font-display text-[22px] italic leading-[26px] tabular-nums text-bridal-charcoal">{reference}</p>
          <p className="font-bridal text-[12px] leading-[16px] text-bridal-text-soft">
            It&apos;s how the venue finds your payment in their account.
          </p>
        </div>
        <button
          type="button"
          onClick={() => copy(reference, "ref")}
          className={COPY_BTN}
          title="Copy reference"
          aria-label={copied === "ref" ? "Reference copied" : "Copy reference"}
        >
          {copyIcon("ref")}
        </button>
      </section>

      {loading && (
        <div className="mt-3 flex h-12 w-full max-w-[560px] items-center gap-2 font-bridal text-[13px] leading-[18px] text-bridal-text-soft">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading the venue&apos;s account details…
        </div>
      )}

      {!loading && loadError && (
        <div className="mt-3 flex w-full max-w-[560px] items-start gap-2 rounded-[4px] border border-rose-200 bg-rose-50 px-4 py-3" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden />
          <p className="font-bridal text-[13px] leading-[18px] text-rose-800">
            {loadError} You can still contact the venue directly to arrange payment.
          </p>
        </div>
      )}

      {/* The venue's real accounts. Rendered only when the venue has published
          one — never a placeholder, and never a guess. */}
      {!loading && vendorsWithAccounts.map((vendor) => (
        <section
          key={vendor.businessId}
          aria-label={`Transfer to ${vendor.businessName || "the venue"}`}
          className={`${CARD} mt-3 animate-stagger-fade-up`}
          style={stagger(block++)}
        >
          <div className="flex h-9 items-center border-b border-bridal-beige px-4">
            <p className={LABEL}>Transfer to {vendor.businessName || "the venue"}</p>
          </div>
          {vendor.accounts.map((acc) => {
            /**
             * WW-DIRECT-PAY — a JazzCash or Easypaisa account is not a bank
             * account with blanks in it.
             *
             * This rendered five fixed rows — Bank / Account title / Account
             * number / IBAN / Branch code — because a vendor could only ever
             * publish a bank account. A wallet has no IBAN and no branch code,
             * and its "account number" is a mobile number, so the same five
             * rows would have printed two empty ones and mislabelled a third.
             */
            const isWallet = acc.accountType === "jazzcash" || acc.accountType === "easypaisa"
            const rail = acc.railLabel || acc.bankName
            const rows = isWallet
              ? [
                  { label: "Send to", value: rail },
                  { label: "Registered name", value: acc.accountHolderName },
                  { label: "Mobile number", value: acc.accountNumber },
                ]
              : [
                  { label: "Bank", value: acc.bankName },
                  { label: "Account title", value: acc.accountHolderName },
                  { label: "Account number", value: acc.accountNumber },
                  ...(acc.iban ? [{ label: "IBAN", value: acc.iban }] : []),
                  ...(acc.branchCode ? [{ label: "Branch code", value: acc.branchCode }] : []),
                ]
            return (
            <dl key={acc.id}>
              {/* Which rail this block is, and whether we have checked it.
                  Both matter BEFORE the customer transfers, so both sit above
                  the number rather than in a footnote under it. */}
              <div className="flex min-h-[36px] items-center justify-between gap-2 border-b border-bridal-beige bg-bridal-sand/50 px-4 py-1">
                <span className="font-bridal text-[12px] uppercase leading-[16px] tracking-[0.18em] text-bridal-charcoal">
                  {rail}
                </span>
                {acc.isVerified === false && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-bridal text-[10px] uppercase leading-[12px] tracking-[0.14em] text-amber-800">
                    <AlertTriangle className="h-3 w-3" aria-hidden />
                    Not yet checked by us
                  </span>
                )}
              </div>
              {rows.map(({ label, value }, i) => (
                <div
                  key={label}
                  className="flex min-h-[44px] items-center justify-between gap-3 border-b border-bridal-beige px-4 last:border-b-0 animate-stagger-fade-up"
                  style={stagger(i)}
                >
                  <div className="min-w-0">
                    <dt className={LABEL}>{label}</dt>
                    <dd className="truncate font-bridal text-[14px] leading-[20px] tabular-nums text-bridal-charcoal" title={value}>{value}</dd>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(value, `${acc.id}-${label}`)}
                    className={`-mr-2 ${COPY_BTN}`}
                    title={`Copy ${label.toLowerCase()}`}
                    aria-label={copied === `${acc.id}-${label}` ? `${label} copied` : `Copy ${label.toLowerCase()}`}
                  >
                    {copyIcon(`${acc.id}-${label}`)}
                  </button>
                </div>
              ))}
            </dl>
            )
          })}
        </section>
      ))}

      {/* No published account is a normal state, not an error. Say what to do
          instead of showing an account that isn't theirs. */}
      {!loading && !loadError && vendorsWithAccounts.length === 0 && (
        <div className={`${CARD} mt-3 px-4 py-3`}>
          <p className="font-bridal text-[13px] leading-[18px] text-bridal-text">
            This venue hasn&apos;t published bank details yet. Contact them to arrange
            payment{instructions?.vendors?.[0]?.whatsappNumber
              ? <> — WhatsApp <strong className="font-medium text-bridal-charcoal">{instructions.vendors[0].whatsappNumber}</strong></>
              : null}.
          </p>
        </div>
      )}

      {/* Report the transfer, in-product. This is what replaces "send a
          screenshot to a hardcoded WhatsApp number". */}
      {!loading && !claimed && instructions?.paymentType && (
        <section aria-label="Report your transfer" className={`${CARD} mt-3 animate-stagger-fade-up`} style={stagger(block++)}>
          <div className="flex h-9 items-center border-b border-bridal-beige px-4">
            <p className={LABEL}>Already sent it?</p>
          </div>
          <div className="space-y-3 px-4 py-3">
            <div>
              <label htmlFor="bank-claim-method" className={`mb-1 block ${LABEL}`}>How you paid</label>
              <select
                id="bank-claim-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as ClaimMethod)}
                className={INPUT}
              >
                {(Object.keys(METHOD_LABELS) as ClaimMethod[]).map((m) => (
                  <option key={m} value={m}>{METHOD_LABELS[m]}</option>
                ))}
              </select>
            </div>

            {refRequired && (
              <div>
                <label htmlFor="bank-claim-ref" className={`mb-1 block ${LABEL}`}>
                  Transaction reference
                </label>
                <input
                  id="bank-claim-ref"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="From your bank's confirmation SMS or app"
                  maxLength={120}
                  className={INPUT}
                />
                <p className="mt-1 font-bridal text-[12px] leading-[16px] text-bridal-text-soft">
                  The venue matches this against their statement.
                </p>
              </div>
            )}

            {/* The screenshot. Optional, and said to be optional — a customer
                hunting for a file on a phone at 11pm is a place people abandon,
                and the reference is what the venue actually searches on. */}
            <div>
              <label htmlFor="bank-claim-proof" className={`mb-1 block ${LABEL}`}>
                Screenshot or receipt <span className="normal-case tracking-normal text-bridal-text-soft">(optional)</span>
              </label>
              <input
                id="bank-claim-proof"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                className={`block w-full font-bridal text-[13px] leading-[18px] text-bridal-text file:mr-3 file:h-11 file:rounded-[4px] file:border file:border-bridal-beige file:bg-white file:px-3 file:font-bridal file:text-[12px] file:text-bridal-charcoal hover:file:border-bridal-gold-dark ${FOCUS}`}
              />
              <p className="mt-1 font-bridal text-[12px] leading-[16px] text-bridal-text-soft">
                {proofFile ? `Attached: ${proofFile.name}` : "Helps the venue confirm faster. Max 8 MB."}
              </p>
            </div>

            <div>
              <label htmlFor="bank-claim-notes" className={`mb-1 block ${LABEL}`}>
                Anything else? <span className="normal-case tracking-normal text-bridal-text-soft">(optional)</span>
              </label>
              <textarea
                id="bank-claim-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="e.g. sent from my father's account"
                className={`w-full resize-y rounded-[4px] border border-bridal-beige bg-white px-3 py-2 font-bridal text-[14px] leading-[20px] text-bridal-charcoal placeholder:text-bridal-text-soft/70 focus:border-bridal-gold-dark ${FOCUS}`}
              />
            </div>

            {claimError && (
              <p className="font-bridal text-[12px] leading-[16px] text-rose-800" role="alert">{claimError}</p>
            )}

            <BridalButton
              type="button"
              variant="primary"
              size="lg"
              block
              disabled={!canSubmit}
              onClick={submitClaim}
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Send className="h-3.5 w-3.5" aria-hidden />}
              {submitting ? "Sending…" : "I've sent the payment"}
            </BridalButton>
            {refRequired && transactionRef.trim().length > 0 && transactionRef.trim().length < 3 && (
              <p className="font-bridal text-[12px] leading-[16px] text-rose-800">
                Add the full reference from your bank.
              </p>
            )}
          </div>
        </section>
      )}

      {claimed && (
        <div className="mt-3 flex w-full max-w-[560px] items-start gap-2 rounded-[4px] border border-bridal-sage/45 bg-bridal-sage/15 px-4 py-3" role="status">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#3F6B43]" strokeWidth={2.5} aria-hidden />
          <div className="min-w-0">
            <p className="font-bridal text-[13px] leading-[18px] text-[#3F6B43]">
              Thanks — we&apos;ve told the venue. They&apos;ll confirm once it shows in their
              account, and you&apos;ll see the booking update.
            </p>
            {proofWarning && (
              <p className="mt-1 font-bridal text-[12px] leading-[16px] text-bridal-text-soft">
                {proofWarning}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Honest disclosure. The previous copy claimed Wedding Wala holds the
          deposit and refunds it if the vendor declines — neither of which is
          true, and the first is not something a non-EMI may lawfully do. */}
      <section aria-label="How this works" className={`${CARD} mt-3 animate-stagger-fade-up`} style={stagger(block++)}>
        <div className="flex h-9 items-center gap-1.5 border-b border-bridal-beige px-4">
          <Clock className="h-3.5 w-3.5 text-bridal-gold-dark" aria-hidden />
          <p className={LABEL}>How this works</p>
        </div>
        <ul className="list-inside list-disc space-y-1 px-4 py-3 font-bridal text-[12px] leading-[16px] text-bridal-text">
          <li>You pay the venue directly. Wedding Wala records the payment and holds your date — we don&apos;t hold the money.</li>
          <li>Refunds and cancellation terms are the venue&apos;s, agreed when you booked.</li>
          <li>Bank transfers carry no chargeback rights, so keep your receipt.</li>
          <li>
            Read the{" "}
            <a href="/refund-policy" target="_blank" rel="noopener noreferrer" className={`text-bridal-gold-dark underline underline-offset-4 ${FOCUS}`}>Refund Policy</a>
            {" "}and{" "}
            <a href="/cancellation-policy" target="_blank" rel="noopener noreferrer" className={`text-bridal-gold-dark underline underline-offset-4 ${FOCUS}`}>Cancellation Policy</a>.
          </li>
        </ul>
      </section>

      <div className="mt-6 grid w-full max-w-[560px] grid-cols-1 gap-3 xl:grid-cols-2 animate-stagger-fade-up" style={stagger(block++)}>
        <Link href="/user/bookings" className={PRIMARY_LINK}>
          <FileText className="h-3.5 w-3.5" aria-hidden />
          View my bookings
        </Link>
        <Link href="/" className={OUTLINE_LINK}>
          <Home className="h-3.5 w-3.5" aria-hidden />
          Back to home
        </Link>
      </div>
    </div>
  )
}
