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
      {/* Icon */}
      <div className="mb-6 rounded-full bg-blue-50 p-5 border-2 border-blue-100">
        <Building2 className="h-14 w-14 text-blue-600" />
      </div>

      <h2 className="text-3xl font-bold text-neutral-900 mb-2">Bank Transfer Required</h2>
      <p className="text-neutral-500 text-sm mb-1">
        Your booking amount exceeds the online payment limit.
      </p>
      <p className="text-neutral-500 text-sm mb-8">
        Please transfer the advance to confirm your booking.
      </p>

      {/* Amount Card */}
      <div className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 p-5 mb-6 text-white text-left">
        <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1">Amount to Transfer</p>
        <p className="text-4xl font-bold">Rs. {Number(amount).toLocaleString()}</p>
        <div className="flex items-center justify-between mt-3 text-sm text-purple-100">
          <span>{typeLabel}</span>
          <span>Booking #{bookingId}</span>
        </div>
        {bookingDate && (
          <p className="text-xs text-purple-200 mt-1">Event: {formatDate(bookingDate)}</p>
        )}
      </div>

      {/* Bank Details */}
      <div className="w-full rounded-2xl border border-neutral-200 bg-white overflow-hidden mb-6">
        <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-100 text-left">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Bank Account Details</p>
        </div>
        <div className="divide-y divide-neutral-100">
          {BANK_DETAILS.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-5 py-3">
              <div className="text-left">
                <p className="text-xs text-neutral-400">{label}</p>
                <p className="text-sm font-semibold text-neutral-800">{value}</p>
              </div>
              <button
                type="button"
                onClick={() => copy(value, label)}
                className="p-2 rounded-lg text-neutral-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                title="Copy"
              >
                {copied === label
                  ? <CheckCircle className="w-4 h-4 text-green-500" />
                  : <Copy className="w-4 h-4" />
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="w-full rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 text-left mb-6 space-y-2">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Important Instructions
        </p>
        <ul className="text-xs text-amber-700 space-y-1.5 list-disc list-inside">
          <li>Use <strong>Booking #{bookingId}</strong> as the transfer reference/description</li>
          <li>Send payment screenshot to <strong>+92 300 0000000</strong> on WhatsApp</li>
          <li>Your booking will be confirmed within <strong>2-4 hours</strong> of payment receipt</li>
          <li>Keep the bank transfer receipt for your records</li>
        </ul>
      </div>

      {/* Also accept via JazzCash/Easypaisa */}
      <div className="w-full rounded-xl border border-neutral-200 bg-white px-5 py-4 text-left mb-8">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5" /> Also Accept Via
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-center">
            <p className="text-xs font-bold text-red-600">JazzCash</p>
            <p className="text-sm font-semibold text-neutral-800 mt-1">0300-0000000</p>
          </div>
          <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-center">
            <p className="text-xs font-bold text-green-600">Easypaisa</p>
            <p className="text-sm font-semibold text-neutral-800 mt-1">0300-0000000</p>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Link
          href="/user/bookings"
          className="flex items-center justify-center gap-2 flex-1 px-5 py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
        >
          <FileText className="h-4 w-4" />
          View My Bookings
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 flex-1 px-5 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-700 text-sm font-semibold hover:bg-neutral-50 transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
