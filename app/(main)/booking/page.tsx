import BookingForm from "@/components/booking/booking-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Venue Booking | Professional Event Planning",
  description: "Book your perfect venue and vendors for any event with our streamlined booking process",
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fafc] py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-800 md:text-4xl">Event Booking</h1>
          <p className="text-gray-600">Plan your perfect celebration with our easy booking process</p>
        </div>

        <BookingForm />
      </div>
    </main>
  )
}
