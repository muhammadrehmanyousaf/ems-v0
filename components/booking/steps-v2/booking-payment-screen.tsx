"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe, type Stripe, type StripeElementsOptions } from "@stripe/stripe-js"
import axiosInstance from "@/lib/axiosConfig"
import { BACKEND_URL } from "@/lib/backend-url"
import { BridalButton } from "@/components/bridal/bridal-button"
import { Lock, ShieldCheck, AlertTriangle, ArrowRight, Sparkles, CreditCard } from "lucide-react"

interface BookingPaymentScreenProps {
  bookingId: number
  amount: number
  paymentType?: "down_payment" | "remaining_payment" | "full_payment"
  customerEmail?: string
  customerName?: string
  vendorName?: string
  bookingDate?: string
  onSuccess: () => void
  onCancel?: () => void
}

let stripePromiseCache: Promise<Stripe | null> | null = null

// Dedupe simultaneous create-payment-intent calls per booking. React 18
// StrictMode double-mounts effects in dev — without this map the second
// mount races the first one's DB insert and the unique constraint on
// stripePaymentIntentId 500s.
const inFlightIntents = new Map<string, Promise<{ clientSecret: string } | { alreadyPaid: true }>>()

/**
 * Resolve the Stripe instance lazily once the publishable key is fetched
 * from /payments/config. Cached so multiple mounts don't re-init.
 *
 * Returns `{ stripe, error }` so the caller can distinguish:
 *   - still loading (both null)
 *   - loaded successfully (stripe truthy)
 *   - publishable key missing / failed (error truthy)
 */
function useStripePromise() {
  const [stripe, setStripe] = useState<Promise<Stripe | null> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!stripePromiseCache) {
      stripePromiseCache = (async () => {
        try {
          const res = await axiosInstance.get(`${BACKEND_URL}api/v1/payments/config`)
          const key = res?.data?.data?.publishableKey
          if (!key || /REPLACE_ME/i.test(key)) throw new Error(
            "STRIPE_PUBLISHABLE_KEY isn't set on the backend. " +
            "Get your pk_test_… from https://dashboard.stripe.com/test/apikeys " +
            "and paste it into event-planner-api/.env (the .env file that dotenv loads, NOT .env.dev), " +
            "then restart `npm run dev` on the backend."
          )
          return loadStripe(key)
        } catch (e: any) {
          throw e
        }
      })()
    }

    stripePromiseCache
      .then((s) => {
        if (cancelled) return
        if (!s) setError("Stripe failed to initialize. Try again.")
        else setStripe(stripePromiseCache)
      })
      .catch((e) => {
        if (cancelled) return
        // Reset cache so a retry can re-fetch
        stripePromiseCache = null
        setError(e.message || "Could not load payment provider.")
      })

    return () => { cancelled = true }
  }, [])

  return { stripe, error }
}

/**
 * Bridal-themed payment screen. Owns the chrome (header card, summary,
 * trust footer); Stripe Elements owns the card-input iframe (mandatory
 * for PCI compliance). Appearance is tuned to match the homepage palette.
 */
export default function BookingPaymentScreen(props: BookingPaymentScreenProps) {
  const { bookingId, paymentType = "down_payment", customerEmail, onSuccess } = props
  const { stripe: stripePromise, error: stripeError } = useStripePromise()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [bootstrapError, setBootstrapError] = useState<string | null>(null)

  // Mirror the latest onSuccess in a ref so the create-payment-intent effect
  // stays stable across renders (parent passes a new inline arrow each render
  // — including it in the deps array caused the effect to re-fire on every
  // render and spam the endpoint into 429 rate-limit hell).
  const onSuccessRef = useRef(onSuccess)
  useEffect(() => { onSuccessRef.current = onSuccess }, [onSuccess])

  // Create the PaymentIntent once on mount. Dedupes via module-level
  // inFlightIntents so StrictMode's double-mount in dev doesn't race
  // (which would 500 on the unique constraint via the second insert).
  useEffect(() => {
    let cancelled = false
    const key = `${bookingId}|${paymentType}`

    const fetcher =
      inFlightIntents.get(key) ??
      (async () => {
        try {
          const r = await axiosInstance.post(`${BACKEND_URL}api/v1/payments/create-payment-intent`, {
            bookingId,
            customerEmail,
            paymentType,
          })
          const cs = r.data?.data?.clientSecret
          if (!cs) throw new Error("No clientSecret returned")
          return { clientSecret: cs } as const
        } catch (e: any) {
          if (e?.response?.status === 409 && e?.response?.data?.data?.code === "already_paid") {
            return { alreadyPaid: true } as const
          }
          throw e
        }
      })()

    inFlightIntents.set(key, fetcher)

    fetcher
      .then((res) => {
        if (cancelled) return
        if ("alreadyPaid" in res) {
          onSuccessRef.current()
          return
        }
        setClientSecret(res.clientSecret)
      })
      .catch((e: any) => {
        if (cancelled) return
        const serverMessage =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.response?.data?.code
        const status = e?.response?.status
        // eslint-disable-next-line no-console
        console.error("[BookingPaymentScreen] create-payment-intent failed", {
          status,
          body: e?.response?.data,
        })
        setBootstrapError(
          serverMessage
            ? `${serverMessage}${status ? ` (HTTP ${status})` : ""}`
            : e.message || "Could not start payment",
        )
      })
      .finally(() => {
        // Clear once settled so a future explicit retry can re-fire.
        inFlightIntents.delete(key)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, customerEmail, paymentType])

  const elementsOptions = useMemo<StripeElementsOptions | null>(() => {
    if (!clientSecret) return null
    return {
      clientSecret,
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: "#C9956A",
          colorBackground: "#FAF6EE",
          colorText: "#2C1810",
          colorTextPlaceholder: "#9C7E64",
          colorDanger: "#C46A6A",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
          fontSizeBase: "14px",
          spacingUnit: "4px",
          borderRadius: "4px",
          colorIconTab: "#8B5A72",
          colorIconTabSelected: "#C9956A",
          colorIconCardCvc: "#9C7E64",
        },
        rules: {
          ".Input": {
            backgroundColor: "#FFFEFA",
            border: "1px solid #E5D9C2",
            boxShadow: "none",
            padding: "11px 12px",
          },
          ".Input:focus": {
            border: "1px solid #C9956A",
            boxShadow: "0 0 0 3px rgba(201,149,106,0.18)",
          },
          ".Label": {
            color: "#7E6753",
            fontWeight: "500",
            fontSize: "11.5px",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            marginBottom: "6px",
          },
          ".Tab": {
            backgroundColor: "#FFFEFA",
            border: "1px solid #E5D9C2",
            padding: "10px 12px",
          },
          ".Tab:hover": { borderColor: "#C9956A" },
          ".Tab--selected": {
            borderColor: "#A87B53",
            backgroundColor: "#FAF6EE",
            boxShadow: "0 4px 14px -8px rgba(176,125,84,0.45)",
          },
        },
      },
    }
  }, [clientSecret])

  const fatalError = stripeError || bootstrapError

  if (fatalError) {
    return (
      <div className="rounded-md border border-bridal-coral/40 bg-bridal-coral/15 p-6 text-center">
        <AlertTriangle className="w-7 h-7 mx-auto mb-2 text-bridal-coral" />
        <h2 className="font-display italic text-[20px] text-bridal-charcoal">Couldn&apos;t start payment</h2>
        <p className="font-bridal text-[12.5px] text-bridal-text-soft mt-1 max-w-md mx-auto">{fatalError}</p>
        {props.onCancel && (
          <BridalButton variant="ghost" size="sm" className="mt-4" onClick={props.onCancel}>
            Go back
          </BridalButton>
        )}
      </div>
    )
  }

  if (!clientSecret || !stripePromise || !elementsOptions) {
    return (
      <div className="rounded-md border border-bridal-beige bg-bridal-cream p-10 text-center">
        <span className="inline-block w-6 h-6 rounded-full border-2 border-bridal-gold border-t-transparent animate-spin" />
        <p className="mt-3 font-bridal text-[12px] uppercase tracking-[0.22em] text-bridal-text-soft">
          Preparing secure payment…
        </p>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <PaymentBody {...props} />
    </Elements>
  )
}

function PaymentBody({
  amount,
  customerEmail,
  customerName,
  vendorName,
  bookingDate,
  bookingId,
  onSuccess,
  onCancel,
}: BookingPaymentScreenProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isPaying, setIsPaying] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [paymentReady, setPaymentReady] = useState(false)
  const [stripeLoadError, setStripeLoadError] = useState<string | null>(null)

  const formatPKR = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n)

  const dateLabel = bookingDate
    ? new Date(bookingDate).toLocaleDateString("en-PK", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setIsPaying(true)
    setErrorMsg(null)

    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const returnUrl = `${origin}${window.location.pathname}?ps=1&bid=${bookingId}&pt=down_payment`

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    })

    if (error) {
      setErrorMsg(error.message || "Payment failed. Please try again.")
      setIsPaying(false)
      return
    }

    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      onSuccess()
      return
    }

    setIsPaying(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full">
      {/* Heading — homepage editorial */}
      <div className="text-center">
        <p className="font-bridal text-[10.5px] uppercase tracking-[0.32em] font-medium text-bridal-gold-dark mb-2 inline-flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Secure Checkout
        </p>
        <h2 className="font-display italic text-[26px] sm:text-[30px] text-bridal-charcoal leading-tight">
          Complete your payment
        </h2>
        <p className="mt-1.5 font-bridal text-[12.5px] text-bridal-text-soft max-w-xl mx-auto">
          Encrypted end-to-end. We never see your card number — only Stripe does.
        </p>
      </div>

      {/* Two-column: card form + summary */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 lg:gap-5">
        {/* Card form panel */}
        <section className="rounded-md border border-bridal-beige bg-bridal-ivory overflow-hidden">
          <div className="px-4 py-3 border-b border-bridal-beige bg-bridal-cream/60 flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5 text-bridal-gold-dark" />
            <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark">
              Payment details
            </p>
          </div>
          <div className="p-4 sm:p-5 min-h-[140px]">
            <PaymentElement
              options={{ layout: "tabs" }}
              onReady={() => setPaymentReady(true)}
              onLoadError={(e) => {
                const msg =
                  e?.error?.message ||
                  e?.error?.code ||
                  "Stripe could not load the payment form."
                setStripeLoadError(
                  `${msg} — likely cause: the Stripe publishable key on the frontend doesn't match the secret key on the backend (test vs live, or two different Stripe accounts), OR the currency (PKR) isn't enabled on this Stripe account. Check Stripe Dashboard → Settings → Payment methods.`,
                )
              }}
            />
            {!paymentReady && !stripeLoadError && (
              <div className="text-center py-2">
                <span className="inline-block w-5 h-5 rounded-full border-2 border-bridal-gold border-t-transparent animate-spin" />
                <p className="mt-2 font-bridal text-[11px] uppercase tracking-[0.22em] text-bridal-text-soft">
                  Loading card form…
                </p>
              </div>
            )}
          </div>
          {(stripeLoadError || errorMsg) && (
            <div className="mx-4 mb-4 flex items-start gap-2 rounded-md bg-bridal-coral/15 border border-bridal-coral/40 px-3 py-2 font-bridal text-[12px] text-bridal-coral">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p>{stripeLoadError || errorMsg}</p>
            </div>
          )}
        </section>

        {/* Summary panel */}
        <aside className="rounded-md border border-bridal-charcoal bg-bridal-charcoal text-bridal-ivory overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
          <div className="px-5 py-5 space-y-3">
            <p className="font-bridal text-[10px] uppercase tracking-[0.32em] font-medium text-bridal-gold">Due now</p>
            <p className="font-display italic text-[34px] text-bridal-ivory leading-none tabular-nums">
              {formatPKR(amount)}
            </p>
            <div className="pt-3 border-t border-bridal-ivory/15 space-y-2 text-[12.5px]">
              {vendorName && (
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-bridal text-bridal-ivory/65">Vendor</span>
                  <span className="font-display italic text-bridal-ivory text-right">{vendorName}</span>
                </div>
              )}
              {customerName && (
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-bridal text-bridal-ivory/65">Customer</span>
                  <span className="font-display italic text-bridal-ivory text-right">{customerName}</span>
                </div>
              )}
              {dateLabel && (
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-bridal text-bridal-ivory/65">Event</span>
                  <span className="font-display italic text-bridal-ivory text-right">{dateLabel}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-bridal text-bridal-ivory/65">Booking #</span>
                <span className="font-display italic text-bridal-ivory tabular-nums">{bookingId}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Footer — Pay button + trust */}
      <div className="rounded-md border border-bridal-beige bg-bridal-cream/40 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 font-bridal text-[10.5px] text-bridal-text-soft">
          <span className="inline-flex items-center gap-1">
            <Lock className="h-3 w-3 text-bridal-gold-dark" />
            256-bit encryption
          </span>
          <span className="text-bridal-beige">·</span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-bridal-gold-dark" />
            Stripe-secured
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <BridalButton type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPaying}>
              Cancel
            </BridalButton>
          )}
          <BridalButton
            type="submit"
            variant="primary"
            size="md"
            loading={isPaying}
            disabled={!stripe || !elements || isPaying}
          >
            {isPaying ? "Processing…" : `Pay ${formatPKR(amount)}`}
            {!isPaying && <ArrowRight className="h-3.5 w-3.5" />}
          </BridalButton>
        </div>
      </div>
    </form>
  )
}
