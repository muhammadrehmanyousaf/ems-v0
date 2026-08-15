import BookingForm from '@/components/booking/booking-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  // Bare title — the root layout's title template appends "| Wedding Wala", so
  // spelling it out here produced "Book Your Event | Wedding Wala | Wedding Wala".
  title: "Book Your Event",
  description: "Secure, modern booking flow",
}

export default function BookingPage() {
  // A plain <div>, not <main>: the public chrome already provides the page's
  // single <main> landmark. Adding another here nested a second (and with the
  // root layout, a third) <main> — invalid HTML that made the accessibility tree
  // list the booking content under two "main" regions, reading as a duplicated
  // empty-state card on unpriced vendors.
  return (
    <div className="min-h-screen bg-bridal-ivory pb-24 lg:pb-12">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <BookingForm />
      </div>
    </div>
  )
}
