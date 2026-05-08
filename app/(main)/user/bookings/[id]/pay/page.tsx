"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import axiosInstance from "@/lib/axiosConfig";
import { BACKEND_URL } from "@/lib/backend-url";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/context/UserContext";
import BookingPaymentScreen from "@/components/booking/steps-v2/booking-payment-screen";

interface Booking {
  id: number;
  customerName: string;
  customerEmail: string;
  bookingDate: string;
  totalAmount: number;
  downPayment: number;
  paymentStatus: string;
  bookingDetails?: Array<{ business?: { name?: string } | null }>;
}

export default function PayBookingPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = Number((params?.id as string) || 0);
  const { user, isAuthenticated, isLoading } = useUser();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?redirect=/user/bookings/${bookingId}/pay`);
      return;
    }
    if (!bookingId) {
      setError("Invalid booking id");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const r = await axiosInstance.get(`${BACKEND_URL}api/v1/bookings/simple-user-bookings`);
        const list: Booking[] = r?.data?.data || [];
        const b = list.find((row) => String(row.id) === String(bookingId));
        if (!b) throw new Error("Booking not found or not yours");
        setBooking(b);
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || "Failed to load booking");
      } finally {
        setLoading(false);
      }
    })();
  }, [isLoading, isAuthenticated, bookingId, router]);

  // Resolve which payment is owed and how much.
  const paymentInfo = (() => {
    if (!booking) return null;
    const total = Number(booking.totalAmount || 0);
    const down = Number(booking.downPayment || 0);
    const ps = String(booking.paymentStatus || "").toLowerCase();

    if (ps === "paid") return { type: "paid" as const };
    if (ps === "partial") {
      return {
        type: "remaining_payment" as const,
        amount: Math.max(total - down, 0),
        label: "remaining balance",
      };
    }
    return {
      type: "down_payment" as const,
      amount: down > 0 ? down : total,
      label: down > 0 && down < total ? "down payment" : "full payment",
    };
  })();

  if (loading || isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8 py-10">
        <Skeleton className="h-10 w-40 mb-6" />
        <Skeleton className="h-[420px] w-full rounded-md" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8 py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/user/bookings/${bookingId}`)}
          className="gap-1.5 mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Back to booking
        </Button>
        <div className="rounded-md border border-bridal-coral/40 bg-bridal-coral/15 p-6 text-center">
          <p className="font-bridal text-[13px] text-bridal-coral">{error || "Booking unavailable."}</p>
        </div>
      </div>
    );
  }

  if (paymentInfo?.type === "paid") {
    return (
      <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-md border border-bridal-sage/45 bg-bridal-sage/15 p-6 text-center">
          <p className="font-display italic text-[20px] text-bridal-charcoal mb-2">
            This booking is already fully paid.
          </p>
          <Button onClick={() => router.push(`/user/bookings/${bookingId}`)} size="sm" className="mt-3">
            View booking
          </Button>
        </div>
      </div>
    );
  }

  const vendorName = booking.bookingDetails?.[0]?.business?.name || "your vendor";

  return (
    <main className="min-h-screen bg-bridal-ivory pb-24 lg:pb-12">
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/user/bookings/${bookingId}`)}
          className="gap-1.5 mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Back to booking
        </Button>

        <div className="rounded-md bg-bridal-cream border border-bridal-beige overflow-hidden p-5 sm:p-6 lg:p-8 shadow-[0_18px_44px_-32px_rgba(176,125,84,0.4)]">
          <BookingPaymentScreen
            bookingId={booking.id}
            amount={paymentInfo!.amount}
            paymentType={paymentInfo!.type}
            customerEmail={booking.customerEmail}
            customerName={booking.customerName}
            vendorName={vendorName}
            bookingDate={booking.bookingDate}
            onSuccess={() => {
              toast({
                title: "Payment received",
                description: `Your ${paymentInfo!.label} has been recorded.`,
              });
              router.push(`/user/bookings/${booking.id}`);
            }}
            onCancel={() => router.push(`/user/bookings/${bookingId}`)}
          />
        </div>
      </div>
    </main>
  );
}
