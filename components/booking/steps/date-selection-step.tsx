"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import type { BookingFormData, EventVenue } from "@/lib/types";
import {
  CalendarDays,
  Clock,
  Users,
  Minus,
  Plus,
  AlertTriangle,
  Timer,
  XCircle,
} from "lucide-react";
import { VendorAPI } from "@/lib/api/vendors";

interface DateSelectionStepProps {
  formData: BookingFormData;
  updateFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  venue?: EventVenue | null;
  timeRemaining: number;
  isHolding: boolean;
  holdFailed: boolean;
  holdFailedUntil: Date | null;
  createHold: (businessId: number, date: string, time: string) => Promise<void>;
  releaseHold: () => Promise<void>;
}

type DayAvailability = {
  bookedSlots: string[];
  availableSlots: string[];
  heldSlots?: string[];
  heldSlotsExpiry?: Record<string, string>;
  isBlocked?: boolean;
  blockReason?: string;
};

export default function DateSelectionStep({
  formData,
  updateFormData,
  venue,
  timeRemaining,
  isHolding,
  holdFailed,
  holdFailedUntil,
  createHold,
  releaseHold,
}: DateSelectionStepProps) {
  const [date, setDate] = useState<Date | undefined>(() => {
    if (formData.bookingDate) {
      const d = new Date(formData.bookingDate);
      return isNaN(d.getTime()) ? undefined : d;
    }
    return undefined;
  });

  // Availability data: { "YYYY-MM-DD": { bookedSlots, availableSlots } }
  const [availability, setAvailability] = useState<
    Record<string, DayAvailability>
  >({});
  const [currentMonth, setCurrentMonth] = useState<Date>(date || new Date());

  const timeSlotToHour: Record<string, number> = {
    "09:00": 9,
    "14:00": 14,
    "18:00": 18,
  };

  // Fetch availability when month changes
  const fetchAvailability = useCallback(
    async (monthDate: Date) => {
      if (!venue?.id) return;
      const yyyy = monthDate.getFullYear();
      const mm = String(monthDate.getMonth() + 1).padStart(2, "0");
      const monthStr = `${yyyy}-${mm}`;
      try {
        const data = await VendorAPI.getMonthAvailability([venue.id], monthStr);
        const venueAvail = data[venue.id] || {};
        setAvailability(venueAvail);
      } catch {
        // silently fail
      }
    },
    [venue?.id],
  );

  useEffect(() => {
    fetchAvailability(currentMonth);
  }, [currentMonth, fetchAvailability]);

  // Clear time slot selection when hold attempt is rejected (409 — slot taken by another user)
  useEffect(() => {
    if (holdFailed && formData.timeSlot) {
      updateFormData((prev) => ({ ...prev, timeSlot: "", bookingDate: undefined }));
    }
  }, [holdFailed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-create hold when date + time are both selected
  useEffect(() => {
    if (venue?.id && date && formData.timeSlot) {
      const dateKey = toDateKey(date);
      createHold(venue.id, dateKey, formData.timeSlot);
    }
    return () => {
      // Release hold when component unmounts or selections change
    };
  }, [date, formData.timeSlot, venue?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const vendorType = venue?.vendor?.vendorType ?? ""
  const enforceCapacity = ["Wedding venue", "Catering", "Decorator"].includes(vendorType)

  const dateHeading =
    vendorType === "Bridal wearing"
      ? "When do you need your outfit?"
      : vendorType === "Car rental"
        ? "When do you need the vehicles?"
        : "When is your event?"

  // Initialize guest count to 10 if it's not set or less than 10
  useEffect(() => {
    let initialCount = formData.guestCount;
    if (!initialCount || initialCount < 10) {
      initialCount = 10;
    }
    if (enforceCapacity && venue?.maxCapacity && initialCount > venue.maxCapacity) {
      initialCount = venue.maxCapacity;
    }
    if (initialCount !== formData.guestCount) {
      updateFormData((prev) => ({ ...prev, guestCount: initialCount }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function formatDateWithSlot(d: Date, _timeSlot: string): string {
    return toDateKey(d);
  }

  function toDateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  const handleDateChange = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (!selectedDate) return;
    updateFormData((prev) => {
      const isoDate = formatDateWithSlot(selectedDate, prev.timeSlot);
      return { ...prev, bookingDate: isoDate };
    });
  };

  const allTimeSlots = ["09:00", "14:00", "18:00"];
  const timeSlots = [
    // Issue #46 — "X to Y" format for consistency with steps-v2.
    { value: "09:00", label: "Morning", time: "9 AM to 12 PM" },
    { value: "14:00", label: "Afternoon", time: "2 PM to 6 PM" },
    { value: "18:00", label: "Evening", time: "6 PM to 11 PM" },
  ];

  // Get availability for the selected date
  const selectedDateKey = date ? toDateKey(date) : null;
  const selectedDayAvail = selectedDateKey
    ? availability[selectedDateKey]
    : null;

  const adjustGuests = (delta: number) => {
    updateFormData((prev) => {
      let nextCount = Math.max(10, (prev.guestCount || 10) + delta);
      if (enforceCapacity && venue?.maxCapacity && nextCount > venue.maxCapacity) {
        nextCount = venue.maxCapacity;
      }
      return {
        ...prev,
        guestCount: nextCount,
      };
    });
  };

  // Calendar modifiers for availability visualization
  const fullyBookedDates: Date[] = [];
  const partiallyBookedDates: Date[] = [];
  const vendorBlockedDates: Date[] = [];
  Object.entries(availability).forEach(([dateStr, avail]) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (avail.isBlocked) {
      vendorBlockedDates.push(dateObj);
    } else if (avail.availableSlots.length === 0) {
      fullyBookedDates.push(dateObj);
    } else if (avail.bookedSlots.length > 0) {
      partiallyBookedDates.push(dateObj);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[22px] sm:text-[24px] font-semibold tracking-tight text-zinc-900 leading-tight">
          {dateHeading}
        </h2>
        <p className="mt-1.5 text-[13.5px] text-zinc-500">
          Select a date and preferred time slot for your event
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 items-stretch">
        {/* Left: Calendar Card */}
        <div className="flex flex-col rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-100">
            <CalendarDays className="h-4 w-4 text-zinc-700" />
            <span className="text-[12px] font-semibold text-zinc-900">
              Select date
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-between p-3 sm:p-4 min-w-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-md w-full [--cell-size:2.5rem] p-0"
              classNames={{
                root: "w-full",
                months: "w-full",
                month: "w-full gap-3",
                table: "w-full border-collapse table-fixed",
                weekdays: "flex w-full",
                weekday: "flex-1 min-w-0 text-center text-[11px] font-medium text-zinc-500 uppercase tracking-wider",
                week: "flex w-full mt-1",
                day: "flex-1 min-w-0 aspect-square p-0 text-center relative",
                month_caption: "flex h-9 w-full items-center justify-center px-9 text-[14px] font-semibold text-zinc-900",
              }}
              disabled={(d) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (d < today) return true;
                const key = toDateKey(d);
                const avail = availability[key];
                if (avail && (avail.isBlocked || avail.availableSlots.length === 0)) return true;
                return false;
              }}
              modifiers={{
                partiallyBooked: partiallyBookedDates,
                fullyBooked: fullyBookedDates,
                vendorBlocked: vendorBlockedDates,
              }}
              modifiersClassNames={{
                partiallyBooked: "bg-amber-50 text-amber-700 font-medium",
                fullyBooked: "bg-red-50 text-red-600 line-through",
                vendorBlocked: "bg-zinc-100 text-zinc-400 line-through opacity-60",
              }}
            />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 mt-3 border-t border-zinc-100 text-[11px] text-zinc-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Partially booked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                Fully booked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-300" />
                Unavailable
              </span>
            </div>
          </div>
        </div>

        {/* Right: Time Slot Card */}
        <div className="flex flex-col rounded-xl border border-zinc-200 bg-white overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-100">
            <Clock className="h-4 w-4 text-zinc-700" />
            <span className="text-[12px] font-semibold text-zinc-900">
              Select time slot
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 gap-4">
            {selectedDayAvail?.isBlocked && (
              <div className="flex items-start gap-3 rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13.5px] font-semibold text-zinc-900">Vendor not available this day</p>
                  <p className="text-[12px] text-zinc-500 mt-0.5">
                    {selectedDayAvail.blockReason || "The vendor has marked this date as unavailable."}{" "}
                    Please select a different date.
                  </p>
                </div>
              </div>
            )}

            <div
              className="flex flex-col gap-3 relative"
              style={{ zIndex: 5, pointerEvents: "auto" }}
            >
              {timeSlots.map((slot) => {
                const isSelected = formData.timeSlot === slot.value;
                const isHeld = selectedDayAvail?.heldSlots?.includes(slot.value) ?? false;
                const isBooked = !isHeld && (selectedDayAvail?.bookedSlots?.includes(slot.value) ?? false);
                const heldUntil = isHeld ? selectedDayAvail?.heldSlotsExpiry?.[slot.value] : null;
                const isUnavailable = isBooked || isHeld;

                const heldMinsLeft = heldUntil
                  ? Math.max(0, Math.ceil((new Date(heldUntil).getTime() - Date.now()) / 60000))
                  : null;

                return (
                  <div key={slot.value} className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      style={{
                        pointerEvents: "auto",
                        cursor: isUnavailable ? "not-allowed" : "pointer",
                        position: "relative",
                        zIndex: 6,
                      }}
                      onClick={() => {
                        if (isUnavailable) return;
                        const updatedBookingDate = date
                          ? formatDateWithSlot(date, slot.value)
                          : undefined;
                        updateFormData((prev) => ({
                          ...prev,
                          timeSlot: slot.value,
                          bookingDate: updatedBookingDate,
                        }));
                      }}
                      className={`flex items-center justify-between rounded-lg border px-4 py-3.5 text-left transition-all
                        ${isBooked
                          ? "border-zinc-200 bg-zinc-50 opacity-60"
                          : isHeld
                            ? "border-amber-200 bg-amber-50/50"
                            : isSelected
                              ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/5"
                              : "border-zinc-200 bg-white hover:border-zinc-400 hover:bg-zinc-50"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                          ${isBooked
                            ? "bg-zinc-100"
                            : isHeld
                              ? "bg-amber-100"
                              : isSelected
                                ? "bg-zinc-900 text-white"
                                : "bg-zinc-100 text-zinc-700"
                          }`}>
                          <Clock className={`w-4 h-4 ${
                            isBooked ? "text-zinc-400" : isHeld ? "text-amber-700" : "text-current"
                          }`} />
                        </div>
                        <div>
                          <p className={`text-[15px] font-semibold leading-tight
                            ${isBooked ? "text-zinc-400" : "text-zinc-900"}`}>
                            {slot.label}
                          </p>
                          <p className="text-[12px] text-zinc-500 mt-0.5">{slot.time}</p>
                        </div>
                      </div>
                      {isBooked ? (
                        <span className="text-[10.5px] uppercase tracking-[0.12em] font-semibold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                          Fully booked
                        </span>
                      ) : isHeld ? (
                        <span className="text-[10.5px] uppercase tracking-[0.12em] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Timer className="w-2.5 h-2.5" />
                          Reserved
                        </span>
                      ) : isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-zinc-300 shrink-0" />
                      )}
                    </button>
                    {isHeld && heldMinsLeft !== null && (
                      <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <p className="text-[12px] text-amber-900 leading-snug">
                          <span className="font-semibold">Temporarily reserved</span> — someone is completing their booking.
                          {heldMinsLeft > 0
                            ? <> Check back in ~<span className="font-semibold">{heldMinsLeft} min{heldMinsLeft !== 1 ? "s" : ""}</span> — it may become available.</>
                            : <> It may free up shortly.</>
                          }
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Alerts & Guest Count */}
            <div className="space-y-3">
              {holdFailed && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                  <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-700 leading-snug">
                    <span className="font-semibold">Slot unavailable</span> — this time slot was just reserved by another customer.
                    {holdFailedUntil && (
                      <> It will be held until{" "}
                        <span className="font-semibold">
                          {holdFailedUntil.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>.
                      </>
                    )}
                    {" "}Please select a different time slot.
                  </p>
                </div>
              )}

              {!holdFailed && !isHolding && date && formData.timeSlot && timeRemaining === 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                  <p className="text-[12px] text-amber-900">
                    Hold expired. Re-select time slot to reserve again.
                  </p>
                </div>
              )}

              {enforceCapacity && (
                <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-zinc-700" />
                      </div>
                      <div>
                        <p className="text-[10.5px] uppercase tracking-[0.14em] font-semibold text-zinc-500">Guests</p>
                        <p className="text-[14px] font-semibold text-zinc-900 leading-tight">How many?</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Decrease guests by 10"
                        onClick={() => adjustGuests(-10)}
                        style={{ pointerEvents: "auto", cursor: "pointer" }}
                        className="w-9 h-9 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 active:scale-95 inline-flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5 text-zinc-700" />
                      </button>
                      <div className="flex items-baseline gap-1">
                        <input
                          type="number"
                          min="10"
                          max={venue?.maxCapacity || undefined}
                          value={formData.guestCount || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            let nextCount = val === "" ? 0 : Number.parseInt(val, 10);
                            if (venue?.maxCapacity && nextCount > venue.maxCapacity) {
                              nextCount = venue.maxCapacity;
                            }
                            updateFormData((prev) => ({ ...prev, guestCount: nextCount }));
                          }}
                          className="w-14 text-center text-[20px] font-semibold tabular-nums text-zinc-900 bg-transparent border-0 outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0"
                          placeholder="10"
                        />
                        <span className="text-[11px] uppercase tracking-[0.12em] font-medium text-zinc-500">guests</span>
                      </div>
                      <button
                        type="button"
                        aria-label="Increase guests by 10"
                        onClick={() => adjustGuests(10)}
                        style={{ pointerEvents: "auto", cursor: "pointer" }}
                        className="w-9 h-9 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 active:scale-95 inline-flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-zinc-700" />
                      </button>
                    </div>
                  </div>
                  {venue?.maxCapacity && formData.guestCount >= venue.maxCapacity && (
                    <p className="mt-3 text-[11.5px] text-amber-700 flex items-center gap-1.5 pt-3 border-t border-zinc-100">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      Maximum capacity reached (max: {venue.maxCapacity} guests)
                    </p>
                  )}
                  {venue?.minCapacity && formData.guestCount > 0 && formData.guestCount < venue.minCapacity && (
                    <p className="mt-3 text-[11.5px] text-amber-700 flex items-center gap-1.5 pt-3 border-t border-zinc-100">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      Below minimum capacity (min: {venue.minCapacity} guests)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
