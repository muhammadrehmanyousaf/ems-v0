"use client";

import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/lib/axiosConfig";

/** Minimal booking shape for pickers — id + who + when + how much. */
export interface VendorBookingLite {
  id: number;
  customerName: string | null;
  bookingDate: string | null;
  totalAmount?: number | string | null;
  downPayment?: number | string | null;
  status?: string | null;
  /** `Pending` | `Partially Paid` | `Paid` … — on every row, never typed before. */
  paymentStatus?: string | null;
  // Present on every row `GET /api/v1/bookings` returns (bookingAttributes in
  // bookingController) — just never typed, so no caller could reach it. The
  // Today board needs it to turn "chase this customer" into a phone call.
  customerPhone?: string | null;
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

export function isCancelledBooking(b: VendorBookingLite): boolean {
  return (b.status || "").toLowerCase() === "cancelled";
}

/**
 * WWL-127 — the label was `name · date` and nothing else, so a vendor picking
 * which booking a receipt belongs to saw three options all reading
 * "Waheed Jutt" and had to guess. Worse, cancelled bookings sat in the list
 * looking identical to live ones, so money could be allocated to an event that
 * is not happening.
 *
 * Everything added here is already on the payload — amount, payment status,
 * booking status, id. The id goes last because it is the tiebreaker of last
 * resort, and money is never inferred: `totalAmount` is the contract value the
 * row actually carries, not a computed balance that could disagree with the
 * ledger.
 */
export function formatBookingLabel(b: VendorBookingLite): string {
  const parts: string[] = [];
  parts.push(b.customerName || `Booking #${b.id}`);

  if (b.bookingDate) {
    parts.push(
      new Date(b.bookingDate).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }),
    );
  }

  const total = Number(b.totalAmount);
  if (Number.isFinite(total) && total > 0) {
    parts.push(`Rs ${Math.round(total).toLocaleString("en-PK")}`);
  }

  if (b.paymentStatus) parts.push(b.paymentStatus);
  parts.push(`#${b.id}`);

  const label = parts.join(" · ");
  return isCancelledBooking(b) ? `CANCELLED — ${label}` : label;
}
