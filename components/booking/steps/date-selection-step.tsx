"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { LEGACY_PERIODS, formatSlotRange } from "@/lib/booking/slot-vocabulary"

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
  /**
   * WHICH month `availability` actually describes, and whether the fetch for it
   * succeeded. Both are load-bearing, because the payload is SPARSE: the API
   * returns only the notable days (6 of 31 for August on business 3358), so a
   * missing key legitimately means "free". That is only a safe reading when we
   * know the map is (a) for the month on screen and (b) actually loaded.
   *
   * Without this, "no entry" and "no data" were indistinguishable, and both
   * resolved to bookable. Measured on production: the server blocked 6, 14, 15,
   * 22 and 25 August while the calendar offered every one of them and greyed
   * out 26, 28 and 29 instead — two completely disjoint sets. Picking one of
   * the offered-but-blocked dates then failed at the very last step, after the
   * customer had chosen a package and a menu.
   */
  const [availabilityMonth, setAvailabilityMonth] = useState<string | null>(null);
  const [availabilityFailed, setAvailabilityFailed] = useState(false);
  /**
   * The month is unselectable until its availability lands — otherwise the
   * calendar would be guessing. That window is short but it is not nothing, and
   * a grid where every date is dead and nothing says why is its own bug. So it
   * is stated: "Checking availability…".
   */
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<Date>(date || new Date());

  const monthKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  const timeSlotToHour: Record<string, number> = {
    "09:00": 9,
    "14:00": 14,
    "18:00": 18,
  };

  /**
   * Tracks the newest fetch so a slow earlier one can't overwrite it.
   *
   * The picker fires a request per month, and the responses do not necessarily
   * come back in order. Measured on production: two calls went out for August
   * and September, September's landed last, and the calendar then displayed
   * August while holding September's keys — so every visible day missed the map
   * and fell through to "bookable". That is why the bug came and went between
   * loads rather than failing consistently.
   */
  const availabilityReqId = useRef(0);

  // Fetch availability when month changes
  const fetchAvailability = useCallback(
    async (monthDate: Date) => {
      if (!venue?.id) return;
      const monthStr = monthKey(monthDate);
      const reqId = ++availabilityReqId.current;
      setAvailabilityLoading(true);
      setAvailabilityFailed(false);
      try {
        const data = await VendorAPI.getMonthAvailability([venue.id], monthStr);
        if (reqId !== availabilityReqId.current) return; // a newer month won
        setAvailability(data[venue.id] || {});
        setAvailabilityMonth(monthStr);
        setAvailabilityFailed(false);
        setAvailabilityLoading(false);
      } catch {
        if (reqId !== availabilityReqId.current) return;
        setAvailabilityLoading(false);
        /**
         * Was `// silently fail`, which left the map `{}` — and an empty map
         * read as "every date is free". A rate-limited or flaky response
         * therefore opened the whole calendar, including dates the vendor had
         * explicitly blocked. Record the failure instead and let the disabled
         * predicate refuse to guess.
         */
        setAvailability({});
        setAvailabilityMonth(null);
        setAvailabilityFailed(true);
      }
    },
    [venue?.id],
  );

  useEffect(() => {
    setAvailabilityMonth(null); // the map no longer describes what's on screen
    fetchAvailability(currentMonth);
  }, [currentMonth, fetchAvailability]);

  // Clear time slot selection when hold attempt is rejected (409 — slot taken by another user)
  useEffect(() => {
    if (holdFailed && formData.timeSlot) {
      updateFormData((prev) => ({ ...prev, timeSlot: "", bookingDate: undefined }));
    }
  }, [holdFailed]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Date holds removed from the booking flow (founder, 2026-08-29: "the date
     held thing should not be there, i dont want the date held for the booking
     thing").

     Only the CREATE call is gone. The DateHold feature itself is untouched —
     the vendor's own Calendar > Date holds screen still works, and any hold
     already on the server still expires on its own. Nothing was deleted, so
     restoring this is uncommenting one call.

     Consequence, recorded deliberately: two customers can now reach the end of
     the flow for the same date and slot, and the vendor will receive both
     requests and have to decline one. That is the trade the founder asked for
     — no date is taken out of circulation before the vendor has agreed to it. */
  // useEffect(() => {
  //   if (venue?.id && date && formData.timeSlot) {
  //     const dateKey = toDateKey(date);
  //     createHold(venue.id, dateKey, formData.timeSlot);
  //   }
  //   return () => {};
  // }, [date, formData.timeSlot, venue?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // SLOTS step 10 — both lists come from the one shared definition. They were
  // maintained here by hand alongside six other copies, and "consistency with
  // steps-v2" was a comment rather than something the code could enforce.
  const allTimeSlots = LEGACY_PERIODS.map((p) => p.value);
  const timeSlots = LEGACY_PERIODS.map((p) => ({
    value: p.value,
    label: p.label,
    time: formatSlotRange(p.startTime, p.endTime),
  }));

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
                /**
                 * Only trust the map for the month it was actually fetched for.
                 * Until that lands — or if it failed — no day is selectable,
                 * because we cannot tell a free date from a blocked one and
                 * guessing "free" is how a customer reached the last step of
                 * the booking before the server refused the date.
                 *
                 * This is deliberately NOT "unknown day ⇒ disabled". The
                 * payload is sparse (6 of 31 days for August), so a missing key
                 * means free, and refusing those would black out most of the
                 * month. The distinction that matters is data-for-this-month
                 * present vs absent, not key present vs absent.
                 */
                if (availabilityFailed) return true;
                if (availabilityMonth !== monthKey(d)) return true;
                const avail = availability[toDateKey(d)];
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
            {/* The calendar now refuses to guess when it has no data for the
                month on screen — so it has to say why, or it is just a dead
                grid. Retry re-fires the same month rather than reloading the
                page, which would lose the event already chosen. */}
            {availabilityLoading && !availabilityFailed && (
              <div className="mt-3 flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12px] text-zinc-600">
                <span className="inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                Checking this venue&apos;s availability…
              </div>
            )}
            {availabilityFailed && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div>
                  <p className="font-medium">We couldn&apos;t load this venue&apos;s calendar.</p>
                  <p className="mt-0.5">
                    Dates are hidden rather than guessed, so you don&apos;t pick one the venue
                    can&apos;t take.{" "}
                    <button
                      type="button"
                      onClick={() => fetchAvailability(currentMonth)}
                      className="font-medium underline underline-offset-2 hover:no-underline"
                    >
                      Try again
                    </button>
                  </p>
                </div>
              </div>
            )}
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
