import BookingForm from '@/components/booking/booking-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Book Your Event | Wedding Wala",
  description: "Secure, modern booking flow",
}

export default function BookingPage() {
  return (
    <main className="min-h-screen bg-bridal-ivory pb-24 lg:pb-12">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <BookingForm />
      </div>
    </main>
  )
}
