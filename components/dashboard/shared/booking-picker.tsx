"use client";

import * as React from "react";
import { useVendorBookings, formatBookingLabel, isCancelledBooking } from "@/hooks/use-vendor-bookings";
import { cn } from "@/lib/utils";

/**
 * Pick a booking / function by customer name + date instead of typing a numeric
 * id. Drop-in replacement for the raw `<input type="number">Booking #</input>`
 * boxes scattered across the Venue-OS panels. Selecting a row calls onChange
 * with the booking id (null when cleared), so panels can auto-load on select.
 *
 * WWL-127 — live options are grouped ahead of cancelled ones, and cancelled
 * bookings are labelled as such rather than sitting in the list looking exactly
 * like live events. They are still reachable: a receipt, cheque or expense
 * legitimately attaches to a cancelled booking (refunds, forfeited advances),
 * and hiding them outright would blank the value on any record already
 * pointing at one.
 */
export function BookingPicker({
  value,
  onChange,
  placeholder = "Select a function / booking…",
  className,
  "aria-label": ariaLabel = "Select a booking",
}: {
  value: number | null;
  onChange: (id: number | null) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
}): React.ReactElement {
  const { data, isLoading } = useVendorBookings();
  const bookings = data ?? [];
  const live = bookings.filter((b) => !isCancelledBooking(b));
  const cancelled = bookings.filter(isCancelledBooking);

  return (
    <select
      aria-label={ariaLabel}
      value={value == null ? "" : String(value)}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className={cn(
        "h-9 min-w-[16rem] max-w-full rounded-md border border-input bg-background px-2 text-sm outline-none ring-ring focus-visible:ring-2",
        className,
      )}
    >
      <option value="">{isLoading ? "Loading your bookings…" : placeholder}</option>
      {live.map((b) => (
        <option key={b.id} value={String(b.id)}>
          {formatBookingLabel(b)}
        </option>
      ))}
      {cancelled.length > 0 && (
        <optgroup label="Cancelled bookings">
          {cancelled.map((b) => (
            <option key={b.id} value={String(b.id)}>
              {formatBookingLabel(b)}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

export default BookingPicker;
