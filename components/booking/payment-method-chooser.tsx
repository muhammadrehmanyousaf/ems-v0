"use client"

// FEAT_CASH_BOOKING + FEAT_PK_PAYMENTS — payment-step method chooser.
//
// Additive wrapper around the existing Stripe card screen. When both flags are
// off the parent renders BookingPaymentScreen directly (byte-identical), so
// this component only ever appears once a flag is enabled. Card stays the
// default/first option and its flow is untouched.
//
//   - Card        → the existing Stripe <BookingPaymentScreen /> (unchanged)
//   - Pay cash    → POST /bookings/:id/confirm-cash (no gateway, no money)
//   - JazzCash /  → POST /payments/pk/initiate — SCAFFOLD: surfaces the
//     Easypaisa      backend's "not configured yet" message; never fakes success

import { useState } from "react"
import axiosInstance from "@/lib/axiosConfig"
import { BACKEND_URL } from "@/lib/backend-url"
import { toast } from "@/hooks/use-toast"
import { BridalButton } from "@/components/bridal/bridal-button"
import { CreditCard, Banknote, Smartphone, Info, Loader2, CheckCircle2 } from "lucide-react"
import { PK_PAYMENTS_ENABLED } from "@/lib/payment-flags"
import BookingPaymentScreen from "@/components/booking/steps-v2/booking-payment-screen"

type Method = "card" | "cash" | "jazzcash" | "easypaisa"

// The outcome tells the parent WHAT actually happened so it can message
// honestly. "paid" = real money captured (the Stripe card path); "cash_reserved"
// = booking reserved with NO money moved (the customer will pay in cash and the
// vendor confirms on receipt). The card screen calls onSuccess() with no
// argument, which is treated as "paid" — so its behaviour is unchanged.
export type PaymentOutcome = "paid" | "cash_reserved"

interface Props {
  bookingId: number
  amount: number
  paymentType?: "down_payment" | "remaining_payment" | "full_payment"
  customerEmail?: string
  customerName?: string
  vendorName?: string
  bookingDate?: string
  onSuccess: (outcome?: PaymentOutcome) => void
  onCancel?: () => void
}

const formatPKR = (n: number) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n)

export default function PaymentMethodChooser(props: Props) {
  const { bookingId, amount, onSuccess } = props
  const [method, setMethod] = useState<Method>("card")
  const [busy, setBusy] = useState(false)
  // For a scaffold rail that isn't wired to a gateway yet.
  const [pkNotice, setPkNotice] = useState<string | null>(null)

  const options: Array<{ id: Method; label: string; icon: React.ReactNode }> = [
    { id: "card", label: "Card", icon: <CreditCard className="w-4 h-4" /> },
    { id: "cash" as Method, label: "Pay cash / later", icon: <Banknote className="w-4 h-4" /> },
    ...(PK_PAYMENTS_ENABLED
      ? [
          { id: "jazzcash" as Method, label: "JazzCash", icon: <Smartphone className="w-4 h-4" /> },
          { id: "easypaisa" as Method, label: "Easypaisa", icon: <Smartphone className="w-4 h-4" /> },
        ]
      : []),
  ]

  const confirmCash = async () => {
    setBusy(true)
    try {
      await axiosInstance.post(`${BACKEND_URL}api/v1/bookings/${bookingId}/confirm-cash`, {})
      // NO money moved — the booking is only RESERVED (stays Pending / Awaiting
      // cash). Hand the honest outcome to the parent so it never claims a
      // payment was received. (We don't toast here: the single-slot toast queue
      // would evict the parent's honest message, which is the bug we're fixing.)
      onSuccess("cash_reserved")
    } catch (e: any) {
      toast({
        title: "Couldn't confirm",
        description: e?.response?.data?.message || e?.message || "Please try again.",
      })
    } finally {
      setBusy(false)
    }
  }

  const initiatePk = async (rail: "jazzcash" | "easypaisa") => {
    setBusy(true)
    setPkNotice(null)
    try {
      const res = await axiosInstance.post(`${BACKEND_URL}api/v1/payments/pk/initiate`, {
        bookingId,
        method: rail,
        paymentType: props.paymentType || "down_payment",
      })
      const data = res?.data?.data
      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl
        return
      }
      // No redirect returned — treat as not-yet-live.
      setPkNotice("This payment method isn't available yet. Please choose another option.")
    } catch (e: any) {
      // The backend returns 503 not_configured until merchant credentials are
      // provisioned. Surface that honestly — never pretend the payment worked.
      const msg =
        e?.response?.data?.message ||
        "This payment method isn't available yet. Please choose another option."
      setPkNotice(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Method selector */}
      <div>
        <p className="font-bridal text-[10px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark mb-2">
          How would you like to pay?
        </p>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const active = method === o.id
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setMethod(o.id)
                  setPkNotice(null)
                }}
                className={`inline-flex items-center gap-2 rounded-md border px-3.5 py-2.5 font-bridal text-[12.5px] transition-all ${
                  active
                    ? "border-bridal-gold-dark bg-bridal-cream text-bridal-charcoal shadow-[0_10px_26px_-16px_rgba(176,125,84,0.5)]"
                    : "border-bridal-beige bg-bridal-ivory text-bridal-text-soft hover:border-bridal-gold/55"
                }`}
              >
                {o.icon}
                {o.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Card → existing Stripe screen (unchanged) */}
      {method === "card" && (
        <BookingPaymentScreen {...props} />
      )}

      {/* Cash / pay-later */}
      {method === "cash" && (
        <div className="rounded-md border border-bridal-sage/45 bg-bridal-sage/10 p-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-bridal-sage/25 border border-bridal-sage/40 flex items-center justify-center flex-shrink-0">
              <Banknote className="h-5 w-5 text-[#3F6B43]" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display italic text-[18px] text-bridal-charcoal leading-tight">
                Pay cash / at the venue
              </h3>
              <p className="font-bridal text-[12.5px] text-bridal-text-soft mt-1.5 leading-relaxed">
                Reserve this booking now and settle {formatPKR(amount)} in cash directly with your
                vendor. Your booking will show as <strong className="not-italic text-bridal-charcoal">Awaiting cash / deposit pending</strong> until
                the vendor records your payment.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            {props.onCancel && (
              <BridalButton type="button" variant="ghost" size="sm" onClick={props.onCancel} disabled={busy}>
                Cancel
              </BridalButton>
            )}
            <BridalButton type="button" variant="primary" size="md" loading={busy} onClick={confirmCash}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Reserve — I&apos;ll pay in cash
            </BridalButton>
          </div>
        </div>
      )}

      {/* JazzCash / Easypaisa (scaffold) */}
      {(method === "jazzcash" || method === "easypaisa") && (
        <div className="rounded-md border border-bridal-beige bg-bridal-ivory p-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-bridal-blush/60 border border-bridal-rose/40 flex items-center justify-center flex-shrink-0">
              <Smartphone className="h-5 w-5 text-bridal-mauve" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display italic text-[18px] text-bridal-charcoal leading-tight capitalize">
                {method}
              </h3>
              <p className="font-bridal text-[12.5px] text-bridal-text-soft mt-1.5 leading-relaxed">
                Pay {formatPKR(amount)} from your {method} mobile wallet.
              </p>
            </div>
          </div>

          {pkNotice && (
            <div className="mt-4 flex items-start gap-2 rounded-md bg-bridal-cream border border-bridal-gold/45 px-3 py-2.5 font-bridal text-[12px] text-bridal-charcoal/85">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-bridal-gold-dark" />
              <p>{pkNotice}</p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-end gap-2">
            {props.onCancel && (
              <BridalButton type="button" variant="ghost" size="sm" onClick={props.onCancel} disabled={busy}>
                Cancel
              </BridalButton>
            )}
            <BridalButton
              type="button"
              variant="primary"
              size="md"
              loading={busy}
              onClick={() => initiatePk(method)}
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Continue with {method}
            </BridalButton>
          </div>
        </div>
      )}
    </div>
  )
}
