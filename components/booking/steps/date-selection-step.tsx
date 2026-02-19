"use client"

import { useState, useEffect, useCallback } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import type { BookingFormData, EventVenue } from "@/lib/types"
import { CalendarDays, Clock, Users, Minus, Plus, AlertTriangle, Timer } from "lucide-react"
import { VendorAPI } from "@/lib/api/vendors"
import { useDateHold } from "@/hooks/use-date-hold"

interface DateSelectionStepProps {
  formData: BookingFormData
  updateFormData: React.Dispatch<React.SetStateAction<BookingFormData>>
  venue?: EventVenue | null
}

type DayAvailability = { bookedSlots: string[]; availableSlots: string[] }

export default function DateSelectionStep({ formData, updateFormData, venue }: DateSelectionStepProps) {
  const [date, setDate] = useState<Date | undefined>(() => {
    if (formData.bookingDate) {
      const d = new Date(formData.bookingDate)
      return isNaN(d.getTime()) ? undefined : d
    }
    return undefined
  })

  // Availability data: { "YYYY-MM-DD": { bookedSlots, availableSlots } }
  const [availability, setAvailability] = useState<Record<string, DayAvailability>>({})
  const [currentMonth, setCurrentMonth] = useState<Date>(date || new Date())
  const { timeRemaining, isHolding, createHold, releaseHold } = useDateHold()

  const timeSlotToHour: Record<string, number> = {
    "09:00": 9,
    "14:00": 14,
    "18:00": 18,
  }

  // Fetch availability when month changes
  const fetchAvailability = useCallback(async (monthDate: Date) => {
    if (!venue?.id) return
    const yyyy = monthDate.getFullYear()
    const mm = String(monthDate.getMonth() + 1).padStart(2, "0")
    const monthStr = `${yyyy}-${mm}`
    try {
      const data = await VendorAPI.getMonthAvailability([venue.id], monthStr)
      const venueAvail = data[venue.id] || {}
      setAvailability(venueAvail)
    } catch {
      // silently fail
    }
  }, [venue?.id])

  useEffect(() => {
    fetchAvailability(currentMonth)
  }, [currentMonth, fetchAvailability])

  // Auto-create hold when date + time are both selected
  useEffect(() => {
    if (venue?.id && date && formData.timeSlot) {
      const dateKey = toDateKey(date)
      createHold(venue.id, dateKey, formData.timeSlot)
    }
    return () => {
      // Release hold when component unmounts or selections change
    }
  }, [date, formData.timeSlot, venue?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function formatDateWithSlot(d: Date, timeSlot: string): string {
    const hour = timeSlotToHour[timeSlot] || 0
    const formatted = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), hour, 0, 0))
    return formatted.toISOString()
  }

  function toDateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }

  const handleDateChange = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (!selectedDate) return
    updateFormData(prev => {
      const isoDate = formatDateWithSlot(selectedDate, prev.timeSlot)
      return { ...prev, bookingDate: isoDate }
    })
  }

  const allTimeSlots = ["09:00", "14:00", "18:00"]
  const timeSlots = [
    { value: "09:00", label: "Morning", time: "9 AM - 12 PM" },
    { value: "14:00", label: "Afternoon", time: "2 PM - 6 PM" },
    { value: "18:00", label: "Evening", time: "6 PM - 11 PM" },
  ]

  // Get availability for the selected date
  const selectedDateKey = date ? toDateKey(date) : null
  const selectedDayAvail = selectedDateKey ? availability[selectedDateKey] : null

  const adjustGuests = (delta: number) => {
    updateFormData(prev => ({ ...prev, guestCount: Math.max(1, (prev.guestCount || 0) + delta) }))
  }

  // Calendar modifiers for availability visualization
  const fullyBookedDates: Date[] = []
  const partiallyBookedDates: Date[] = []
  Object.entries(availability).forEach(([dateStr, avail]) => {
    const [y, m, d] = dateStr.split("-").map(Number)
    const dateObj = new Date(y, m - 1, d)
    if (avail.availableSlots.length === 0) {
      fullyBookedDates.push(dateObj)
    } else if (avail.bookedSlots.length > 0) {
      partiallyBookedDates.push(dateObj)
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-neutral-900">When is your event?</h2>
        <p className="mt-1 text-sm text-neutral-500">Pick a date, time slot, and expected guest count</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Calendar */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="h-4 w-4 text-purple-500" />
            <Label className="text-sm font-semibold text-neutral-700">Date</Label>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-3">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-lg w-full [--cell-size:2.75rem]"
              disabled={(d) => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                if (d < today) return true
                // Disable fully booked dates
                const key = toDateKey(d)
                const avail = availability[key]
                if (avail && avail.availableSlots.length === 0) return true
                return false
              }}
              modifiers={{
                partiallyBooked: partiallyBookedDates,
                fullyBooked: fullyBookedDates,
              }}
              modifiersClassNames={{
                partiallyBooked: "bg-amber-50 text-amber-700 font-semibold",
                fullyBooked: "bg-red-50 text-red-300 line-through",
              }}
            />
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 text-[10px] text-neutral-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-100 border border-amber-300" /> Partially booked</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-100 border border-red-300" /> Fully booked</span>
          </div>
        </div>

        {/* Right: Time & Guests */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-purple-500" />
              <Label className="text-sm font-semibold text-neutral-700">Time Slot</Label>
            </div>
            <div className="grid grid-cols-1 gap-2 relative" style={{ zIndex: 5, pointerEvents: 'auto' }}>
              {timeSlots.map((slot) => {
                const isSelected = formData.timeSlot === slot.value
                const isBooked = selectedDayAvail?.bookedSlots?.includes(slot.value) ?? false
                return (
                  <button
                    key={slot.value}
                    type="button"
                    style={{ pointerEvents: 'auto', cursor: isBooked ? 'not-allowed' : 'pointer', position: 'relative', zIndex: 6 }}
                    onClick={() => {
                      if (isBooked) return
                      const updatedBookingDate = date ? formatDateWithSlot(date, slot.value) : undefined
                      updateFormData(prev => ({ ...prev, timeSlot: slot.value, bookingDate: updatedBookingDate }))
                    }}
                    className={`flex items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition-colors duration-200 ${
                      isBooked
                        ? 'border-neutral-100 bg-neutral-50 opacity-60'
                        : isSelected
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-semibold ${isBooked ? 'text-neutral-400' : isSelected ? 'text-purple-700' : 'text-neutral-700'}`}>
                        {slot.label}
                      </p>
                      <p className="text-xs text-neutral-400">{slot.time}</p>
                    </div>
                    {isBooked ? (
                      <span className="text-[10px] font-medium text-red-400 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">Booked</span>
                    ) : isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : null}
                  </button>
                )
              })}
            </div>
            {/* Hold Countdown */}
            {isHolding && timeRemaining > 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-purple-50 border border-purple-200 px-3 py-2">
                <Timer className="h-4 w-4 text-purple-500 shrink-0" />
                <p className="text-xs text-purple-700">
                  Slot held for you — <span className="font-bold">{Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, "0")}</span> remaining
                </p>
              </div>
            )}
            {!isHolding && date && formData.timeSlot && timeRemaining === 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-600">
                  Hold expired. Re-select time slot to reserve again.
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-purple-500" />
              <Label className="text-sm font-semibold text-neutral-700">Number of Guests</Label>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Decrease guests by 10"
                onClick={() => adjustGuests(-10)}
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                className="w-10 h-10 rounded-lg border-2 border-neutral-200 bg-white flex items-center justify-center hover:border-neutral-300 active:scale-95 transition-colors"
              >
                <Minus className="w-4 h-4 text-neutral-600" />
              </button>
              <div className="flex-1 text-center">
                <input
                  type="number"
                  min="1"
                  value={formData.guestCount || ''}
                  onChange={(e) => updateFormData(prev => ({ ...prev, guestCount: Number.parseInt(e.target.value) || 0 }))}
                  className="w-full text-center text-3xl font-bold text-neutral-900 bg-transparent border-0 outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
                <p className="text-xs text-neutral-400 mt-0.5">guests</p>
              </div>
              <button
                type="button"
                aria-label="Increase guests by 10"
                onClick={() => adjustGuests(10)}
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                className="w-10 h-10 rounded-lg border-2 border-neutral-200 bg-white flex items-center justify-center hover:border-neutral-300 active:scale-95 transition-colors"
              >
                <Plus className="w-4 h-4 text-neutral-600" />
              </button>
            </div>
            {venue?.maxCapacity && formData.guestCount > venue.maxCapacity && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-600">
                  Exceeds venue capacity (max: {venue.maxCapacity} guests)
                </p>
              </div>
            )}
            {venue?.minCapacity && formData.guestCount > 0 && formData.guestCount < venue.minCapacity && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-600">
                  Below minimum capacity (min: {venue.minCapacity} guests)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
