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
 */

import { Building2, Copy, CheckCircle, Clock, FileText, Home, AlertTriangle, Loader2, Send } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { errorMessage } from "@/lib/utils/api-error"
import {
  PaymentInstructionsAPI,
  type PaymentInstructions,
  type ClaimMethod,
} from "@/lib/api/paymentInstructions"

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

  return (
    <div className="flex flex-col items-center py-8 text-center max-w-lg mx-auto">
      <div className="mb-6 relative">
        <div className="absolute inset-0 rounded-full bg-bridal-gold/15 blur-2xl scale-110" aria-hidden />
        <div className="relative rounded-full bg-bridal-cream border border-bridal-gold/55 p-6 shadow-[0_18px_44px_-22px_rgba(176,125,84,0.5)]">
          <Building2 className="h-12 w-12 text-bridal-gold-dark" strokeWidth={1.5} />
        </div>
      </div>

      <p className="font-bridal text-[10.5px] uppercase tracking-[0.4em] font-medium text-bridal-gold-dark mb-3">
        Secure your date
      </p>
      <h2 className="font-display italic text-[34px] sm:text-[40px] text-bridal-charcoal mb-2 leading-[1.05]">
        Pay your {typeLabel.toLowerCase()}
      </h2>
      <div className="mx-auto mt-1 mb-5 h-[1px] w-20 bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
      <p className="font-bridal text-[14px] text-bridal-text-soft mb-8 max-w-sm">
        {/* Accurate description of the arrangement. The venue collects; we record
            it and hold the date. Nothing is held by Wedding Wala. */}
        Your venue collects this payment directly. Tell us once you&apos;ve sent it and
        we&apos;ll hold your date while they confirm.
      </p>

      {/* Amount */}
      <div className="w-full relative rounded-md bg-bridal-charcoal text-bridal-ivory text-left overflow-hidden mb-6 shadow-[0_24px_60px_-30px_rgba(44,24,16,0.6)]">
        <div className="absolute inset-0 bg-mughal-jaal opacity-[0.08] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
        <div className="relative px-6 py-6">
          <p className="font-bridal text-[10px] uppercase tracking-[0.4em] font-medium text-bridal-gold mb-2">
            Amount to transfer
          </p>
          <p className="font-display italic text-[44px] sm:text-[48px] text-bridal-ivory leading-none">
            Rs. {Number(dueAmount).toLocaleString()}
          </p>
          <div className="flex items-center justify-between mt-4 font-bridal text-[12px]">
            <span className="uppercase tracking-[0.22em] text-bridal-gold/85">{typeLabel}</span>
            <span className="text-bridal-ivory/75">Booking #{bookingId}</span>
          </div>
          {bookingDate && (
            <p className="font-bridal text-[11.5px] text-bridal-ivory/65 mt-1.5">Event: {formatDate(bookingDate)}</p>
          )}
        </div>
      </div>

      {/* Reference — the single most useful field for the venue, so it gets its
          own block rather than a bullet buried in an instructions list. */}
      <div className="w-full rounded-md border border-bridal-gold/45 bg-bridal-cream px-5 py-4 text-left mb-6">
        <p className="font-bridal text-[10px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark mb-1.5">
          Put this reference on your transfer
        </p>
        <div className="flex items-center justify-between gap-3">
          <p className="font-display italic text-[26px] text-bridal-charcoal leading-none">{reference}</p>
          <button
            type="button"
            onClick={() => copy(reference, "ref")}
            className="p-2.5 rounded-full text-bridal-text-soft hover:text-bridal-gold-dark hover:bg-bridal-blush/55 transition-colors"
            title="Copy reference"
          >
            {copied === "ref" ? <CheckCircle className="w-4 h-4 text-bridal-sage" strokeWidth={2} /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="font-bridal text-[12px] text-bridal-text-soft mt-2">
          It&apos;s how the venue finds your payment in their account.
        </p>
      </div>

      {loading && (
        <div className="w-full flex items-center justify-center gap-2 py-8 text-bridal-text-soft font-bridal text-[13px]">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading the venue&apos;s account details…
        </div>
      )}

      {!loading && loadError && (
        <div className="w-full rounded-md border border-bridal-coral/45 bg-bridal-blush/40 px-5 py-4 text-left mb-6">
          <p className="font-bridal text-[13px] text-bridal-charcoal flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-bridal-coral shrink-0" />
            <span>{loadError} You can still contact the venue directly to arrange payment.</span>
          </p>
        </div>
      )}

      {/* The venue's real accounts. Rendered only when the venue has published
          one — never a placeholder, and never a guess. */}
      {!loading && vendorsWithAccounts.map((vendor) => (
        <div
          key={vendor.businessId}
          className="w-full rounded-md border border-bridal-beige bg-bridal-cream overflow-hidden mb-6 shadow-[0_18px_40px_-32px_rgba(176,125,84,0.35)]"
        >
          <div className="px-5 py-3 bg-bridal-ivory border-b border-bridal-beige text-left">
            <p className="font-bridal text-[10.5px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark">
              Transfer to {vendor.businessName || "the venue"}
            </p>
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
            <div key={acc.id} className="divide-y divide-bridal-beige/70">
              {/* Which rail this block is, and whether we have checked it.
                  Both matter BEFORE the customer transfers, so both sit above
                  the number rather than in a footnote under it. */}
              <div className="flex items-center justify-between gap-2 px-5 py-2.5 bg-bridal-ivory/60">
                <span className="font-bridal text-[11px] uppercase tracking-[0.2em] font-medium text-bridal-charcoal">
                  {rail}
                </span>
                {acc.isVerified === false && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-bridal text-[10px] uppercase tracking-[0.14em] font-medium text-amber-800">
                    <AlertTriangle className="w-3 h-3" />
                    Not yet checked by us
                  </span>
                )}
              </div>
              {rows.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3.5">
                  <div className="text-left min-w-0">
                    <p className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">{label}</p>
                    <p className="font-bridal text-[13.5px] font-medium text-bridal-charcoal mt-0.5 truncate">{value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(value, `${acc.id}-${label}`)}
                    className="ml-3 p-2.5 rounded-full text-bridal-text-soft hover:text-bridal-gold-dark hover:bg-bridal-blush/55 transition-colors"
                    title={`Copy ${label.toLowerCase()}`}
                  >
                    {copied === `${acc.id}-${label}`
                      ? <CheckCircle className="w-4 h-4 text-bridal-sage" strokeWidth={2} />
                      : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
            )
          })}
        </div>
      ))}

      {/* No published account is a normal state, not an error. Say what to do
          instead of showing an account that isn't theirs. */}
      {!loading && !loadError && vendorsWithAccounts.length === 0 && (
        <div className="w-full rounded-md border border-bridal-beige bg-bridal-ivory/60 px-5 py-4 text-left mb-6">
          <p className="font-bridal text-[13px] text-bridal-text leading-relaxed">
            This venue hasn&apos;t published bank details yet. Contact them to arrange
            payment{instructions?.vendors?.[0]?.whatsappNumber
              ? <> — WhatsApp <strong className="text-bridal-charcoal">{instructions.vendors[0].whatsappNumber}</strong></>
              : null}.
          </p>
        </div>
      )}

      {/* Report the transfer, in-product. This is what replaces "send a
          screenshot to a hardcoded WhatsApp number". */}
      {!loading && !claimed && instructions?.paymentType && (
        <div className="w-full rounded-md border border-bridal-beige bg-bridal-cream px-5 py-5 text-left mb-6">
          <p className="font-bridal text-[10.5px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark mb-3">
            Already sent it?
          </p>

          <label className="block font-bridal text-[11px] uppercase tracking-[0.2em] text-bridal-text-label mb-1.5">How you paid</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as ClaimMethod)}
            className="w-full h-10 rounded-[4px] border border-bridal-beige bg-bridal-ivory px-3 font-bridal text-[13.5px] text-bridal-charcoal mb-3 focus:border-bridal-gold outline-none"
          >
            {(Object.keys(METHOD_LABELS) as ClaimMethod[]).map((m) => (
              <option key={m} value={m}>{METHOD_LABELS[m]}</option>
            ))}
          </select>

          {refRequired && (
            <>
              <label className="block font-bridal text-[11px] uppercase tracking-[0.2em] text-bridal-text-label mb-1.5">
                Transaction reference
              </label>
              <input
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="From your bank's confirmation SMS or app"
                maxLength={120}
                className="w-full h-10 rounded-[4px] border border-bridal-beige bg-bridal-ivory px-3 font-bridal text-[13.5px] text-bridal-charcoal mb-1 focus:border-bridal-gold outline-none"
              />
              <p className="font-bridal text-[11.5px] text-bridal-text-soft mb-3">
                The venue matches this against their statement.
              </p>
            </>
          )}

          {/* The screenshot. Optional, and said to be optional — a customer
              hunting for a file on a phone at 11pm is a place people abandon,
              and the reference is what the venue actually searches on. */}
          <label className="block font-bridal text-[11px] uppercase tracking-[0.2em] text-bridal-text-label mb-1.5">
            Screenshot or receipt <span className="normal-case tracking-normal text-bridal-text-soft">(optional)</span>
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
            className="w-full font-bridal text-[13px] text-bridal-text mb-1 file:mr-3 file:rounded-[3px] file:border file:border-bridal-beige file:bg-bridal-ivory file:px-3 file:py-1.5 file:font-bridal file:text-[12px] file:text-bridal-charcoal hover:file:border-bridal-gold"
          />
          <p className="font-bridal text-[11.5px] text-bridal-text-soft mb-3">
            {proofFile ? `Attached: ${proofFile.name}` : "Helps the venue confirm faster. Max 8 MB."}
          </p>

          <label className="block font-bridal text-[11px] uppercase tracking-[0.2em] text-bridal-text-label mb-1.5">
            Anything else? <span className="normal-case tracking-normal text-bridal-text-soft">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="e.g. sent from my father's account"
            className="w-full rounded-[4px] border border-bridal-beige bg-bridal-ivory px-3 py-2 font-bridal text-[13.5px] text-bridal-charcoal mb-3 resize-y focus:border-bridal-gold outline-none"
          />

          {claimError && (
            <p className="font-bridal text-[12.5px] text-bridal-coral mb-3">{claimError}</p>
          )}

          <button
            type="button"
            disabled={!canSubmit}
            onClick={submitClaim}
            className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-[4px] bg-bridal-charcoal text-bridal-ivory hover:bg-bridal-gold-dark disabled:opacity-50 disabled:cursor-not-allowed font-bridal text-[12px] uppercase tracking-[0.22em] font-medium transition-colors"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {submitting ? "Sending…" : "I've sent the payment"}
          </button>
          {refRequired && transactionRef.trim().length > 0 && transactionRef.trim().length < 3 && (
            <p className="font-bridal text-[11.5px] text-bridal-coral mt-2">
              Add the full reference from your bank.
            </p>
          )}
        </div>
      )}

      {claimed && (
        <div className="w-full rounded-md border border-bridal-sage/50 bg-bridal-sage/10 px-5 py-4 text-left mb-6">
          <p className="font-bridal text-[13px] text-bridal-charcoal flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 text-bridal-sage shrink-0" />
            <span>
              Thanks — we&apos;ve told the venue. They&apos;ll confirm once it shows in their
              account, and you&apos;ll see the booking update.
            </span>
          </p>
          {proofWarning && (
            <p className="font-bridal text-[12.5px] text-bridal-text-soft mt-2 pl-6">
              {proofWarning}
            </p>
          )}
        </div>
      )}

      {/* Honest disclosure. The previous copy claimed Wedding Wala holds the
          deposit and refunds it if the vendor declines — neither of which is
          true, and the first is not something a non-EMI may lawfully do. */}
      <div className="w-full rounded-md border border-bridal-beige bg-bridal-ivory/60 px-5 py-4 text-left mb-6">
        <p className="font-bridal text-[10.5px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark mb-2 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> How this works
        </p>
        <ul className="font-bridal text-[12.5px] text-bridal-text space-y-1.5 list-disc list-inside leading-relaxed">
          <li>You pay the venue directly. Wedding Wala records the payment and holds your date — we don&apos;t hold the money.</li>
          <li>Refunds and cancellation terms are the venue&apos;s, agreed when you booked.</li>
          <li>Bank transfers carry no chargeback rights, so keep your receipt.</li>
          <li>
            Read the{" "}
            <a href="/refund-policy" target="_blank" rel="noopener noreferrer" className="text-bridal-gold hover:underline">Refund Policy</a>
            {" "}and{" "}
            <a href="/cancellation-policy" target="_blank" rel="noopener noreferrer" className="text-bridal-gold hover:underline">Cancellation Policy</a>.
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Link
          href="/user/bookings"
          className="inline-flex items-center justify-center gap-2 flex-1 h-12 px-5 rounded-[4px] bg-bridal-gold hover:bg-bridal-gold-dark text-bridal-charcoal hover:text-bridal-ivory font-bridal text-[12px] uppercase tracking-[0.22em] font-medium shadow-[0_8px_22px_-12px_rgba(176,125,84,0.55)] transition-all duration-300"
        >
          <FileText className="h-3.5 w-3.5" />
          View my bookings
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 flex-1 h-12 px-5 rounded-[4px] border border-bridal-beige bg-bridal-cream text-bridal-charcoal hover:border-bridal-gold/55 hover:text-bridal-gold-dark font-bridal text-[12px] uppercase tracking-[0.22em] font-medium transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          Back to home
        </Link>
      </div>
    </div>
  )
}
