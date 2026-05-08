"use client"

import { Building2, Copy, CheckCircle, Clock, Phone, FileText, Home } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

interface BankTransferScreenProps {
  bookingId: number
  amount: number
  paymentType: string
  customerEmail?: string
  bookingDate?: string
}

const BANK_DETAILS = [
  { label: "Bank Name", value: "HBL (Habib Bank Limited)" },
  { label: "Account Title", value: "WeddingPlatform Pvt Ltd" },
  { label: "Account Number", value: "0123-4567890-001" },
  { label: "IBAN", value: "PK36HABB0000000123456789" },
  { label: "Branch Code", value: "0123" },
]

export default function BankTransferScreen({
  bookingId,
  amount,
  paymentType,
  customerEmail,
  bookingDate,
}: BankTransferScreenProps) {
  const [copied, setCopied] = useState<string | null>(null)

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

  const typeLabel = paymentType === "full_payment" ? "Full Payment" : "Down Payment (Advance)"

  return (
    <div className="flex flex-col items-center py-8 text-center max-w-lg mx-auto">
      {/* Crest */}
      <div className="mb-6 relative">
        <div className="absolute inset-0 rounded-full bg-bridal-gold/15 blur-2xl scale-110" aria-hidden />
        <div className="relative rounded-full bg-bridal-cream border border-bridal-gold/55 p-6 shadow-[0_18px_44px_-22px_rgba(176,125,84,0.5)]">
          <Building2 className="h-12 w-12 text-bridal-gold-dark" strokeWidth={1.5} />
        </div>
      </div>

      <p className="font-bridal text-[10.5px] uppercase tracking-[0.4em] font-medium text-bridal-gold-dark mb-3">
        Bank transfer required
      </p>
      <h2 className="font-display italic text-[34px] sm:text-[40px] text-bridal-charcoal mb-2 leading-[1.05]">
        Complete your payment
      </h2>
      <div className="mx-auto mt-1 mb-5 h-[1px] w-20 bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
      <p className="font-bridal text-[14px] text-bridal-text-soft mb-1">
        Your booking amount exceeds the online payment limit.
      </p>
      <p className="font-bridal text-[14px] text-bridal-text-soft mb-8">
        Please transfer the amount to confirm your booking.
      </p>

      {/* Amount Card — bridal charcoal hero with gold accent */}
      <div className="w-full relative rounded-md bg-bridal-charcoal text-bridal-ivory text-left overflow-hidden mb-6 shadow-[0_24px_60px_-30px_rgba(44,24,16,0.6)]">
        <div className="absolute inset-0 bg-mughal-jaal opacity-[0.08] pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
        <div className="relative px-6 py-6">
          <p className="font-bridal text-[10px] uppercase tracking-[0.4em] font-medium text-bridal-gold mb-2">
            Amount to transfer
          </p>
          <p className="font-display italic text-[44px] sm:text-[48px] text-bridal-ivory leading-none">
            Rs. {Number(amount).toLocaleString()}
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

      {/* Bank Details */}
      <div className="w-full rounded-md border border-bridal-beige bg-bridal-cream overflow-hidden mb-6 shadow-[0_18px_40px_-32px_rgba(176,125,84,0.35)]">
        <div className="px-5 py-3 bg-bridal-ivory border-b border-bridal-beige text-left">
          <p className="font-bridal text-[10.5px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark">
            Bank account details
          </p>
        </div>
        <div className="divide-y divide-bridal-beige/70">
          {BANK_DETAILS.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-5 py-3.5">
              <div className="text-left min-w-0">
                <p className="font-bridal text-[10px] uppercase tracking-[0.22em] font-medium text-bridal-text-label">{label}</p>
                <p className="font-bridal text-[13.5px] font-medium text-bridal-charcoal mt-0.5 truncate">{value}</p>
              </div>
              <button
                type="button"
                onClick={() => copy(value, label)}
                className="ml-3 p-2.5 rounded-full text-bridal-text-soft hover:text-bridal-gold-dark hover:bg-bridal-blush/55 transition-colors"
                title="Copy"
              >
                {copied === label
                  ? <CheckCircle className="w-4 h-4 text-bridal-sage" strokeWidth={2} />
                  : <Copy className="w-4 h-4" />
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="w-full rounded-md bg-bridal-cream border border-bridal-gold/45 px-5 py-4 text-left mb-6">
        <p className="font-bridal text-[10.5px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark flex items-center gap-1.5 mb-3">
          <Clock className="w-3.5 h-3.5" /> Important instructions
        </p>
        <ul className="font-bridal text-[12.5px] text-bridal-charcoal/85 space-y-1.5 list-disc list-inside leading-relaxed">
          <li>Use <strong className="text-bridal-charcoal not-italic">Booking #{bookingId}</strong> as the transfer reference/description</li>
          <li>Send payment screenshot to <strong className="text-bridal-charcoal">+92 327 4811220</strong> on WhatsApp</li>
          <li>Your booking will be confirmed within <strong className="text-bridal-charcoal">2-4 hours</strong> of payment receipt</li>
          <li>Keep the bank transfer receipt for your records</li>
        </ul>
      </div>

      {/*
        Security + refund disclosure for bank-transfer flow. Bank transfers
        sit outside card-network protections, so the customer sees this
        explicitly. Pure copy, no logic. Reference:
        docs/payfast/01-payfast-integration-overview.md §1 item 6.
      */}
      <div className="w-full rounded-md border border-bridal-beige bg-bridal-ivory/60 px-5 py-4 text-left mb-6">
        <p className="font-bridal text-[10.5px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark mb-2">
          Security &amp; refunds
        </p>
        <p className="font-bridal text-[12.5px] text-bridal-text leading-relaxed">
          Wedding Wala holds your transferred deposit until the vendor
          confirms the booking. If the vendor declines, your full deposit
          is refunded to the originating bank account within 3–7 working
          days. Bank transfers do not carry chargeback rights — for the
          highest level of payment protection, pay by card instead. Read
          our{" "}
          <a href="/refund-policy" target="_blank" rel="noopener noreferrer" className="text-bridal-gold hover:underline">
            Refund Policy
          </a>{" "}
          and{" "}
          <a href="/cancellation-policy" target="_blank" rel="noopener noreferrer" className="text-bridal-gold hover:underline">
            Cancellation Policy
          </a>
          .
        </p>
      </div>

      {/* Also accept via JazzCash/Easypaisa */}
      <div className="w-full rounded-md border border-bridal-beige bg-bridal-ivory px-5 py-4 text-left mb-9">
        <p className="font-bridal text-[10.5px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark mb-3 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5" /> Also accept via
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-bridal-coral/15 border border-bridal-coral/30 p-3.5 text-center">
            <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-coral">JazzCash</p>
            <p className="font-display italic text-[16px] text-bridal-charcoal mt-1">0300-0000000</p>
          </div>
          <div className="rounded-md bg-bridal-sage/15 border border-bridal-sage/40 p-3.5 text-center">
            <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-[#3F6B43]">Easypaisa</p>
            <p className="font-display italic text-[16px] text-bridal-charcoal mt-1">0300-0000000</p>
          </div>
        </div>
      </div>

      {/* CTAs */}
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
