"use client";

import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axiosConfig";

/** Minimal booking shape for pickers — id + who + when + how much. */
export interface VendorBookingLite {
  id: number;
  customerName: string | null;
  bookingDate: string | null;
  totalAmount?: number | string | null;
  status?: string | null;
}

/**
 * The active vendor's recent bookings, for "pick a function" selectors across
 * Venue-OS panels (per-event P&L, EventNight, costing, etc.) so an owner never
 * has to know or type a numeric booking id. Shared query key → fetched once.
 */
export function useVendorBookings(enabled = true) {
  return useQuery({
    queryKey: ["vendor-bookings-lite"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/v1/bookings", {
        params: { page: 1, limit: 100, sortBy: "bookingDate", sortOrder: "DESC" },
      });
      return (res.data?.data?.data ?? []) as VendorBookingLite[];
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function formatBookingLabel(b: VendorBookingLite): string {
  const who = b.customerName || `Booking #${b.id}`;
  const when = b.bookingDate
    ? ` · ${new Date(b.bookingDate).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}`
    : "";
  return `${who}${when}`;
}
