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

import { dateOnlyOf, fmtYmd } from "@/lib/utils/ymd"
import { Copy, Check, Clock, FileText, Home, AlertTriangle, Loader2, Send } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { errorMessage, claimAlreadyOpen } from "@/lib/utils/api-error"
import {
  PaymentInstructionsAPI,
  type PaymentInstructions,
  type PaymentClaim,
  type ClaimMethod,
} from "@/lib/api/paymentInstructions"
import { venueClaimShares } from "@/lib/payment-status"
import { BridalButton } from "@/components/bridal/bridal-button"
import { proofFileIssue } from "@/lib/proof-file"

interface BankTransferScreenProps {
  bookingId: number
  amount: number
  paymentType: string
  customerEmail?: string
  bookingDate?: string
  /**
   * "stack" (default): one narrow column, as the booking desk and the plan page expect.
   * "split": a full page. Wide windows get two columns: the amount, reference and the venue's accounts
   * (what to pay, and where) on the right, kept in view, and the heading and the report form (what to do
   * next) on the left. Narrow windows stay one column in the same order.
   */
  layout?: "stack" | "split"
  /** With layout "split" inside a card (the plan pay page): the form column is narrow, so method and
   *  reference stay stacked instead of side by side. */
  compact?: boolean
}

/** PK number -> wa.me digits (leading 0 -> 92). */
function waDigitsOf(n: string | null | undefined): string {
  let d = String(n || "").replace(/\D/g, "")
  if (d.startsWith("0")) d = "92" + d.slice(1)
  else if (!d.startsWith("92") && d.length === 10) d = "92" + d
  return d
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
const CARD_FULL = "w-full rounded-[4px] border border-bridal-beige bg-white"
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
  layout = "stack",
  compact = false,
}: BankTransferScreenProps) {
  const split = layout === "split"
  const card = split ? CARD_FULL : CARD
  const cap = split ? "" : "max-w-[560px]"
  // The summary column is kept in view while the form is filled in, but only when it fits the window: a column
  // taller than the window that is pinned to its top would leave its lower part unreachable.
  const sumRef = useRef<HTMLDivElement>(null)
  const [pin, setPin] = useState(false)
  useEffect(() => {
    if (!split || !sumRef.current) return
    const el = sumRef.current
    const measure = () => setPin(el.offsetHeight <= window.innerHeight - 112)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener("resize", measure)
    return () => { ro.disconnect(); window.removeEventListener("resize", measure) }
  }, [split])
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
  // PAY-UI_CUSTOMER-015 (WP17): a multi-venue booking is reported venue by venue. `reports` is what has been
  // filed (or was already open: 409 CLAIM_ALREADY_OPEN), keyed by venue ("all" = a whole-booking claim).
  const [venueId, setVenueId] = useState<number | null>(null)
  const [reports, setReports] = useState<Array<{ key: string; name: string | null; existing: boolean; claim?: Partial<PaymentClaim> }>>([])
  const [proofFile, setProofFile] = useState<File | null>(null)
  // WP33 / CUSTOMER-008: the file is checked (8 MB, image or PDF) before upload, and a screenshot that failed to attach can be
  // sent again against the report that was already filed.
  const [proofError, setProofError] = useState<string | null>(null)
  const [retryClaimId, setRetryClaimId] = useState<number | null>(null)
  const [retrying, setRetrying] = useState(false)
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
    if (dateOnlyOf(d)) return fmtYmd(d, "long") // WP23: a calendar day
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
        // Several venues: this claim is for the venue chosen. One venue (or an older server that states no
        // shares): no businessId, the claim is for the whole booking as it always was.
        ...(selected ? { businessId: selected.businessId } : {}),
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
          setRetryClaimId(claim.id)
        }
      }
      markReported({ key: selected ? String(selected.businessId) : "all", name: selected?.name ?? null, existing: false, claim })
    } catch (e) {
      // 409 CLAIM_ALREADY_OPEN: the report is already with the venue. Show THAT claim, not a generic error.
      const open = claimAlreadyOpen<Partial<PaymentClaim>>(e)
      if (open) {
        const whole = !selected || open.businessId == null
        markReported({ key: whole ? "all" : String(selected!.businessId), name: whole ? null : selected!.name, existing: true, claim: open })
      } else {
        setClaimError(errorMessage(e, "Couldn't send that to the venue"))
      }
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
  // PAY-UI_CUSTOMER-015: a cart can hold several venues, and a venue with no published account used to vanish from
  // this screen, so the whole amount looked like it belonged to the first venue shown. The server returns every
  // venue; name the ones that cannot be paid here. (It does not yet return a per-venue amount.)
  const allVendors = instructions?.vendors || []
  const vendorsWithoutAccounts = allVendors.filter((v) => v.accounts.length === 0)
  // WP39 / FLAGGED-050: only the rails some venue on this booking really takes (the form offered every method, even bank transfer for a
  // venue that published no account). Raast / IBFT ride on a bank account. An older server sends no `methods`: then everything, as before.
  const allMethods = Object.keys(METHOD_LABELS) as ClaimMethod[]
  const offered = (() => {
    const lists = allVendors.map((v) => v.methods).filter((m): m is string[] => Array.isArray(m))
    if (!lists.length) return allMethods
    const have = new Set(lists.flat())
    const out = allMethods.filter((m) => (m === "raast" || m === "ibft" ? have.has("bank_transfer") : have.has(m)))
    return out.length ? out : allMethods
  })()
  useEffect(() => {
    if (!offered.includes(method)) setMethod(offered[0])
  }, [offered.join(","), method]) // eslint-disable-line react-hooks/exhaustive-deps
  // A reference is what the venue matches against their statement, so every
  // rail except cash needs one before this can be submitted.
  const refRequired = method !== "cash"
  const canSubmit = !submitting && (!refRequired || transactionRef.trim().length >= 3)

  // Per-venue shares (WP17), or null: one venue, or a server that does not state them.
  const shares = venueClaimShares(allVendors)
  const shareOf = (id: number) => shares?.find((s) => s.businessId === Number(id)) ?? null
  const unreported = shares
    ? shares.filter((s) => s.amountDue > 0 && !reports.some((r) => r.key === "all" || r.key === String(s.businessId)))
    : []
  const selected = shares ? (unreported.find((s) => s.businessId === venueId) ?? unreported[0] ?? null) : null
  const markReported = (r: { key: string; name: string | null; existing: boolean; claim?: Partial<PaymentClaim> }) => {
    setReports((prev) => [...prev.filter((x) => x.key !== r.key), r])
    // The form is done once nothing is left to report: a whole-booking claim, or every venue that is owed money.
    const stillOpen = shares && r.key !== "all"
      ? unreported.filter((s) => String(s.businessId) !== r.key).length
      : 0
    if (!shares || r.key === "all" || stillOpen === 0) setClaimed(true)
    else { setVenueId(null); setTransactionRef(""); setNotes(""); setProofFile(null) }
  }

  const copyIcon = (id: string) =>
    copied === id
      ? <Check className="h-4 w-4 text-status-success animate-scale-in" strokeWidth={2.5} aria-hidden />
      : <Copy className="h-4 w-4" aria-hidden />

  let block = 0

  return (
    <div className={split ? "grid w-full min-[1180px]:grid-cols-[minmax(0,1fr)_minmax(340px,380px)] min-[1180px]:grid-rows-[auto_1fr] min-[1180px]:gap-x-10" : "w-full"}>
      {/* Heading — the screen's own: an arrival, not a step. */}
      <header className={`animate-stagger-fade-up ${split ? "min-[1180px]:col-start-1 min-[1180px]:row-start-1" : ""}`} style={stagger(block++)}>
        <p className="font-bridal text-[11px] font-medium uppercase leading-[14px] tracking-[0.18em] text-bridal-gold-dark">
          Secure your date
        </p>
        <h2 className="mt-2 font-display text-[32px] italic leading-[38px] text-bridal-charcoal xl:text-[40px] xl:leading-[44px]">
          Pay your {typeLabel.toLowerCase()}
        </h2>
        <p className="mt-3 max-w-[640px] font-bridal text-[14px] leading-[20px] text-bridal-text-soft">
          {/* Accurate description of the arrangement. The venue collects; we record
              the payment for them to confirm. Nothing is held by Wedding Wala (WP39 / FLAGGED-050: the old
              "we'll hold your date" promised a hold this screen does not make). */}
          Your venue collects this payment directly. Tell us once you&apos;ve sent it and
          we&apos;ll record it for them to confirm.
        </p>
      </header>

      <div
        ref={sumRef}
        className={split ? `min-[1180px]:col-start-2 min-[1180px]:row-span-2 min-[1180px]:row-start-1 min-[1180px]:self-start ${pin ? "min-[1180px]:sticky min-[1180px]:top-20" : ""}` : undefined}
      >
      {/* Amount — the one figure that must be unmistakable, on solid charcoal. */}
      <section
        aria-label="Amount to transfer"
        className={`relative ${split ? "mt-6 min-[1180px]:mt-0" : "mt-6"} w-full ${cap} overflow-hidden rounded-[4px] bg-bridal-charcoal px-4 py-3 text-bridal-ivory animate-stagger-fade-up`}
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
        className={`${card} mt-3 flex min-h-[72px] items-center justify-between gap-3 border-bridal-gold-dark px-4 py-2 animate-stagger-fade-up`}
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
        <div className={`mt-3 flex h-12 w-full ${cap} items-center gap-2 font-bridal text-[13px] leading-[18px] text-bridal-text-soft`}>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading the venue&apos;s account details…
        </div>
      )}

      {!loading && loadError && (
        <div className={`mt-3 flex w-full ${cap} items-start gap-2 rounded-[4px] border border-status-danger-line bg-status-danger-soft px-4 py-3`} role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-danger" aria-hidden />
          <p className="font-bridal text-[13px] leading-[18px] text-status-danger">
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
          className={`${card} mt-3 animate-stagger-fade-up`}
          style={stagger(block++)}
        >
          <div className="flex h-9 items-center justify-between gap-3 border-b border-bridal-beige px-4">
            <p className={`min-w-0 ${LABEL}`}>Transfer to {vendor.businessName || "the venue"}</p>
            {shareOf(vendor.businessId) && (
              <p className="shrink-0 whitespace-nowrap font-bridal text-[13px] font-medium leading-[16px] tabular-nums text-bridal-charcoal">
                Rs. {Number(shareOf(vendor.businessId)!.amountDue).toLocaleString()}
              </p>
            )}
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
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-status-warning-line bg-status-warning-soft px-2 py-0.5 font-bridal text-[10px] uppercase leading-[12px] tracking-[0.14em] text-status-warning">
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

      {/* Several venues on one booking: the figure above covers all of them. */}
      {!loading && !loadError && allVendors.length > 1 && (
        <div className={`${card} mt-3 px-4 py-3`} role="note" aria-label="Venues on this booking">
          <p className="font-bridal text-[13px] leading-[18px] text-bridal-text">
            {shares
              ? <>This booking is with {allVendors.length} venues and the amount above is the total. Each venue is paid
                  separately: transfer each venue&apos;s own amount to its own account, then report each payment below.</>
              : <>This booking is with {allVendors.length} venues and the amount above covers all of them. Each venue is paid
                  separately, so check with each what it is owed before you transfer.</>}
          </p>
          {vendorsWithoutAccounts.map((v) => (
            <p key={v.businessId} className="mt-2 font-bridal text-[13px] leading-[18px] text-bridal-text">
              <strong className="font-medium text-bridal-charcoal">{v.businessName || "A venue"}</strong>
              {shareOf(v.businessId) ? <> ({"Rs. " + Number(shareOf(v.businessId)!.amountDue).toLocaleString()})</> : null} hasn&apos;t published
              bank details yet. Contact them to arrange payment
              {v.whatsappNumber ? <> — <a className="font-medium text-bridal-charcoal underline" href={`https://wa.me/${waDigitsOf(v.whatsappNumber)}`} target="_blank" rel="noopener noreferrer">WhatsApp {v.whatsappNumber}</a></> : null}.
            </p>
          ))}
        </div>
      )}

      {/* No published account is a normal state, not an error. Say what to do
          instead of showing an account that isn't theirs. */}
      {!loading && !loadError && vendorsWithAccounts.length === 0 && allVendors.length <= 1 && (
        <div className={`${card} mt-3 px-4 py-3`}>
          <p className="font-bridal text-[13px] leading-[18px] text-bridal-text">
            This venue hasn&apos;t published bank details yet. Contact them to arrange
            payment{instructions?.vendors?.[0]?.whatsappNumber
              ? <> — <a className="font-medium text-bridal-charcoal underline" href={`https://wa.me/${waDigitsOf(instructions.vendors[0].whatsappNumber)}`} target="_blank" rel="noopener noreferrer">WhatsApp {instructions.vendors[0].whatsappNumber}</a></>
              : null}.
          </p>
        </div>
      )}

      </div>

      <div className={split ? "min-[1180px]:col-start-1 min-[1180px]:row-start-2" : undefined}>
      {/* Report the transfer, in-product. This is what replaces "send a
          screenshot to a hardcoded WhatsApp number". */}
      {!loading && !claimed && instructions?.paymentType && (
        <section aria-label="Report your transfer" className={`${card} ${split ? "mt-6" : "mt-3"} animate-stagger-fade-up`} style={stagger(block++)}>
          <div className="flex h-9 items-center border-b border-bridal-beige px-4">
            <p className={LABEL}>Already sent it?</p>
          </div>
          <div className="space-y-3 px-4 py-3">
            {selected && (
              <div>
                <label htmlFor="bank-claim-venue" className={`mb-1 block ${LABEL}`}>Which venue did you pay?</label>
                <select
                  id="bank-claim-venue"
                  value={selected.businessId}
                  onChange={(e) => setVenueId(Number(e.target.value))}
                  className={INPUT}
                >
                  {unreported.map((s) => (
                    <option key={s.businessId} value={s.businessId}>{s.name} — Rs. {s.amountDue.toLocaleString()}</option>
                  ))}
                </select>
              </div>
            )}
            <div className={split && !compact ? "grid gap-3 sm:max-[1179px]:grid-cols-[minmax(0,170px)_minmax(0,1fr)] min-[1260px]:grid-cols-[minmax(0,170px)_minmax(0,1fr)]" : "space-y-3"}>
            <div>
              <label htmlFor="bank-claim-method" className={`mb-1 block ${LABEL}`}>How you paid</label>
              <select
                id="bank-claim-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as ClaimMethod)}
                className={INPUT}
              >
                {offered.map((m) => (
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
            </div>

            {/* The screenshot. Optional, and said to be optional — a customer
                hunting for a file on a phone at 11pm is a place people abandon,
                and the reference is what the venue actually searches on. */}
            <div>
              <label htmlFor="bank-claim-proof" className={`mb-1 block ${LABEL}`}>
                Screenshot or receipt <span className="normal-case tracking-normal text-bridal-text-soft">(optional)</span>
              </label>
              <input
                key={reports.length}
                id="bank-claim-proof"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null
                  const issue = proofFileIssue(f)
                  if (issue) { setProofError(issue); setProofFile(null); e.target.value = ""; return }
                  setProofError(null)
                  setProofFile(f)
                }}
                className={`block w-full font-bridal text-[13px] leading-[18px] text-bridal-text file:mr-3 file:h-11 file:rounded-[4px] file:border file:border-bridal-beige file:bg-white file:px-3 file:font-bridal file:text-[12px] file:text-bridal-charcoal hover:file:border-bridal-gold-dark ${FOCUS}`}
              />
              <p className="mt-1 font-bridal text-[12px] leading-[16px] text-bridal-text-soft">
                {proofFile ? `Attached: ${proofFile.name}` : "Helps the venue confirm faster. Max 8 MB."}
              </p>
              {proofError && (
                <p className="mt-1 font-bridal text-[12px] leading-[16px] text-rose-800" role="alert">{proofError}</p>
              )}
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
              <p className="font-bridal text-[12px] leading-[16px] text-status-danger" role="alert">{claimError}</p>
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
              <p className="font-bridal text-[12px] leading-[16px] text-status-danger">
                Add the full reference from your bank.
              </p>
            )}
          </div>
        </section>
      )}

      {reports.map((r) => (
        <div key={r.key} className={`mt-3 flex w-full ${cap} items-start gap-2 rounded-[4px] border border-bridal-sage/45 bg-bridal-sage/15 px-4 py-3`} role="status" data-claim-report={r.key}>
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-status-success" strokeWidth={2.5} aria-hidden />
          <div className="min-w-0">
            <p className="font-bridal text-[13px] leading-[18px] text-status-success">
              {r.existing ? (
                <>
                  You&apos;ve already reported this payment{r.name ? <> to {r.name}</> : null}
                  {r.claim?.amount ? <> (Rs. {Number(r.claim.amount).toLocaleString()}{r.claim.transactionRef ? <>, ref {r.claim.transactionRef}</> : null})</> : null}.
                  The venue is checking it, and you&apos;ll see the booking update once it&apos;s confirmed.
                </>
              ) : (
                <>
                  Thanks — we&apos;ve told {r.name || "the venue"}. They&apos;ll confirm once it shows in their
                  account, and you&apos;ll see the booking update.
                </>
              )}
            </p>
          </div>
        </div>
      ))}
      {proofWarning && (
        <div className={`mt-1 w-full ${cap}`}>
          <p className="font-bridal text-[12px] leading-[16px] text-bridal-text-soft">{proofWarning}</p>
          {retryClaimId != null && (
            <div className="mt-2">
              <label htmlFor="bank-claim-proof-retry" className={`mb-1 block ${LABEL}`}>Try the screenshot again</label>
              <input
                id="bank-claim-proof-retry"
                type="file"
                accept="image/*,application/pdf"
                disabled={retrying}
                onChange={async (e) => {
                  const f = e.target.files?.[0] ?? null
                  const issue = proofFileIssue(f)
                  if (issue) { setProofWarning(issue); e.target.value = ""; return }
                  if (!f) return
                  setRetrying(true)
                  try {
                    await PaymentInstructionsAPI.attachProof(bookingId, retryClaimId, f)
                    setProofWarning(null)
                    setRetryClaimId(null)
                  } catch (err) {
                    setProofWarning(errorMessage(err, "We couldn't attach your screenshot") + " — your payment report went through.")
                    e.target.value = ""
                  } finally {
                    setRetrying(false)
                  }
                }}
                className={`block w-full font-bridal text-[13px] leading-[18px] text-bridal-text ${FOCUS}`}
              />
            </div>
          )}
        </div>
      )}

      {/* Honest disclosure. The previous copy claimed Wedding Wala holds the
          deposit and refunds it if the vendor declines — neither of which is
          true, and the first is not something a non-EMI may lawfully do. */}
      <section aria-label="How this works" className={`${card} mt-3 animate-stagger-fade-up`} style={stagger(block++)}>
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

      <div className={`mt-6 grid w-full ${cap} grid-cols-1 gap-3 xl:grid-cols-2 animate-stagger-fade-up`} style={stagger(block++)}>
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
    </div>
  )
}
