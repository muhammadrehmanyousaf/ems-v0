import BookingForm from '@/components/booking/booking-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Book Your Event | Premium Event Planning",
  description: "Create your perfect celebration with our seamless booking experience",
}

export default function BookingPage() {
  return (
    <main className="min-h-screen bg-neutral-50/80">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <BookingForm />
      </div>
    </main>
  )
}
