import BookingForm from '@/components/booking/booking-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  // Bare title — the root layout's title template appends "| Wedding Wala", so
  // spelling it out here produced "Book Your Event | Wedding Wala | Wedding Wala".
  title: "Book Your Event",
  description: "Secure, modern booking flow",
}

export default function BookingPage() {
  // No container, no padding, no <main>: the booking shell is the page. It
  // draws its own chrome (PublicChrome hides the marketing header and footer
  // on this route) and lays itself out against the viewport — a Stage beside
  // a Desk on wide screens, a header and a pinned action bar on a phone.
  return (
    <div className="booking-shell bg-bridal-ivory">
      <BookingForm />
    </div>
  )
}
