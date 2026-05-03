"use client"

import type { BookingFormData, EventVenue, Vendor } from "@/lib/types"
import { Calendar, Clock, MapPin, Package as PackageIcon, Users, Mail, Phone, User, Sparkles } from "lucide-react"

interface Props {
  formData: BookingFormData
  selectedPackageObj?: any
  selectedMenuObj?: any
  vendorDetails?: Vendor[]
  venue: EventVenue | null
}

const PERIOD_LABEL: Record<string, string> = {
  "09:00": "Morning · 9 AM – 12 PM",
  "14:00": "Afternoon · 2 PM – 6 PM",
  "18:00": "Evening · 6 PM – 11 PM",
}

export default function ReviewStep({ formData, selectedPackageObj, selectedMenuObj, venue }: Props) {
  const formatPKR = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n)

  const eventDate = formData.bookingDate ? new Date(formData.bookingDate) : null
  const dateLabel = eventDate
    ? eventDate.toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : "—"
  const timeLabel = formData.timeSlot ? PERIOD_LABEL[formData.timeSlot] || formData.timeSlot : "—"

  const isCarRental = venue?.vendor?.vendorType === "Car rental"
  const isBridalWear = venue?.vendor?.vendorType === "Bridal wearing"
  const isWeddingStationery = venue?.vendor?.vendorType === "Wedding Invitations and Stationery"
  const showGuests = !isCarRental && !isBridalWear && !isWeddingStationery && (venue?.maxCapacity || venue?.minCapacity)

  const pkgPrice = Number(selectedPackageObj?.price) || 0
  const qty = isCarRental || isBridalWear || isWeddingStationery ? formData.vehicleQuantity || 1 : 1
  const menuPrice = Number(selectedMenuObj?.price) || 0
  const total = pkgPrice * qty + menuPrice

  let downPayment = 0
  if (venue) {
    const dpType = (venue.downPaymentType || "").toLowerCase()
    const dpValue = Number(venue.downPayment) || 0
    downPayment = dpType === "percentage" || dpType === "percent" ? Math.round(total * (dpValue / 100)) : dpValue
  }

  const contactRows: { icon: any; label: string; value: string }[] = [
    { icon: User,  label: "Full name", value: formData.username || "—" },
    { icon: Mail,  label: "Email",     value: formData.email || "—" },
    { icon: Phone, label: "Phone",     value: formData.phoneNumber || "—" },
  ]

  const bookingRows: { icon: any; label: string; value: string }[] = [
    { icon: MapPin,   label: "Vendor",      value: venue?.name || "—" },
    { icon: Calendar, label: "Event date",  value: dateLabel },
    { icon: Clock,    label: "Time of day", value: timeLabel },
  ]
  if (showGuests) bookingRows.push({ icon: Users, label: "Guests", value: formData.guestCount ? `${formData.guestCount} guests` : "—" })
  if (selectedPackageObj) bookingRows.push({ icon: PackageIcon, label: isCarRental ? "Vehicle" : isBridalWear ? "Outfit" : "Package", value: qty > 1 ? `${selectedPackageObj.name} × ${qty}` : selectedPackageObj.name })
  if (selectedMenuObj) bookingRows.push({ icon: PackageIcon, label: "Menu", value: selectedMenuObj.title || selectedMenuObj.name })

  const SectionRow = ({ row }: { row: { icon: any; label: string; value: string } }) => {
    const Icon = row.icon
    return (
      <div className="px-4 py-3 grid grid-cols-[20px_1fr_1.6fr] gap-3 items-center border-b border-bridal-beige/70 last:border-b-0">
        <Icon className="w-4 h-4 text-bridal-gold-dark" />
        <span className="font-bridal text-[10.5px] uppercase tracking-[0.18em] font-medium text-bridal-text-label">{row.label}</span>
        <span className="font-display italic text-[14px] text-bridal-charcoal break-all">{row.value}</span>
      </div>
    )
  }

  return (
    <div className="space-y-5 w-full">
      {/* Heading — homepage typography */}
      <div className="text-center">
        <p className="font-bridal text-[10.5px] uppercase tracking-[0.32em] font-medium text-bridal-gold-dark mb-2 inline-flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Final Step · Confirm
        </p>
        <h2 className="font-display italic text-[26px] sm:text-[30px] text-bridal-charcoal leading-tight">
          Review your booking
        </h2>
        <p className="mt-1.5 font-bridal text-[12.5px] text-bridal-text-soft max-w-xl mx-auto">
          Double-check the details. The down payment is charged on confirm — the rest is due at the venue.
        </p>
      </div>

      {/* Two-column section grid — Contact + Booking side-by-side on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contact */}
        <section className="rounded-md border border-bridal-beige bg-bridal-ivory overflow-hidden">
          <div className="px-4 py-2.5 border-b border-bridal-beige bg-bridal-cream/60">
            <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark">Contact</p>
          </div>
          <div>
            {contactRows.map((row, i) => <SectionRow key={i} row={row} />)}
          </div>
        </section>

        {/* Booking */}
        <section className="rounded-md border border-bridal-beige bg-bridal-ivory overflow-hidden">
          <div className="px-4 py-2.5 border-b border-bridal-beige bg-bridal-cream/60">
            <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold-dark">Booking</p>
          </div>
          <div>
            {bookingRows.map((row, i) => <SectionRow key={i} row={row} />)}
          </div>
        </section>
      </div>

      {/* Total — bridal-charcoal hero block with gold accents */}
      <section className="relative rounded-md overflow-hidden bg-bridal-charcoal text-bridal-ivory border border-bridal-charcoal">
        {/* Gold accent strips top + bottom — matches homepage hero treatment */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-bridal-gold to-transparent" />

        <div className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div>
            <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold mb-1">Total</p>
            <p className="font-display italic text-[28px] sm:text-[32px] text-bridal-ivory leading-none tabular-nums">
              {formatPKR(total)}
            </p>
          </div>

          {downPayment > 0 ? (
            <>
              <div className="sm:border-l sm:border-bridal-ivory/15 sm:pl-4">
                <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-gold mb-1">Due now</p>
                <p className="font-display italic text-[22px] sm:text-[24px] text-bridal-gold leading-none tabular-nums">
                  {formatPKR(downPayment)}
                </p>
              </div>
              <div className="sm:border-l sm:border-bridal-ivory/15 sm:pl-4">
                <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] font-medium text-bridal-ivory/65 mb-1">Remaining at venue</p>
                <p className="font-display italic text-[22px] sm:text-[24px] text-bridal-ivory/85 leading-none tabular-nums">
                  {formatPKR(total - downPayment)}
                </p>
              </div>
            </>
          ) : (
            <div className="sm:col-span-2">
              <p className="font-bridal text-[12.5px] text-bridal-ivory/70">Full amount payable at confirmation.</p>
            </div>
          )}
        </div>
      </section>

      <p className="text-center font-bridal text-[11.5px] text-bridal-text-soft">
        By confirming, you agree to the vendor&apos;s terms. Payments are Stripe-secured.
      </p>
    </div>
  )
}
