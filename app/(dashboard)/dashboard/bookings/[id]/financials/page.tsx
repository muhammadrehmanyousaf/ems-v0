import { Suspense } from "react";
import { BookingFinancialsView } from "@/components/dashboard/mainScreens/bookings/financials/booking-financials-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard : Event financials",
  description:
    "Per-event costing, expenses and P&L for a single booking — the three money questions about one event, in one place.",
};

/**
 * /dashboard/bookings/[id]/financials?tab=pnl|costing|expenses
 *
 * A facet of the Booking, not a nav destination. There is no separate Event
 * object in this system — the Booking is the event — so the financials for an
 * event live under that booking's own URL.
 */
export default function Page({ params }: { params: { id: string } }) {
  const bookingId = Number(params.id);
  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">That booking reference isn&apos;t valid.</p>
      </div>
    );
  }
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading financials…</div>}>
      <BookingFinancialsView bookingId={bookingId} />
    </Suspense>
  );
}
