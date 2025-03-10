import BookingForm from "@/components/booking/booking-form"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-10">
      <div className="container mx-auto px-4">
        <h1 className="mb-8 text-center text-3xl font-bold text-slate-800 md:text-4xl">Venue Booking</h1>
        <BookingForm />
      </div>
    </main>
  )
}

