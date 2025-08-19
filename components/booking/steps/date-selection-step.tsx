"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import type { BookingFormData } from "@/lib/types"
import { CalendarDays, Clock, Users } from "lucide-react"

interface DateSelectionStepProps {
  formData: BookingFormData
  updateFormData: React.Dispatch<React.SetStateAction<BookingFormData>>
}

export default function DateSelectionStep({ formData, updateFormData }: DateSelectionStepProps) {
  const [date, setDate] = useState<Date | undefined>()
  console.log('date', date?.toLocaleDateString().replace(/\//g, "-"));

  const formatedDate = date?.toLocaleDateString().replace(/\//g, "-")

  const timeSlotToHour: Record<string, number> = {
    morning: 9,   // 9:00 AM
    midday: 14,   // 2:00 PM
    evening: 18,  // 6:00 PM
  }

  function formatDateWithSlot(date: Date, timeSlot: string): string {
    const hour = timeSlotToHour[timeSlot] || 0
    const formatted = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hour, 0, 0))
    return formatted.toISOString() // Gives '2025-03-01T09:00:00.000Z'
  }

  const handleDateChange = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (!selectedDate) return
    const isoDate = formatDateWithSlot(selectedDate, formData.timeSlot)
    updateFormData({ ...formData, bookingDate: isoDate })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-neutral-900">Select Date & Time</h2>
        <p className="text-neutral-600">Choose your preferred date, time slot, and number of guests</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center">
            <CalendarDays className="mr-2 h-5 w-5 text-rose-500" />
            <Label className="text-base font-medium text-neutral-700">Select Date</Label>
          </div>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              className="rounded-xl border border-neutral-200 shadow-lg"
              disabled={(date) => {
                // Disable dates in the past
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return date < today
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-rose-500" />
            <Label className="text-base font-medium text-neutral-700">Select Time Slot</Label>
          </div>
          <RadioGroup
            value={formData.timeSlot}
            onValueChange={(value) => {
              const updatedBookingDate = date ? formatDateWithSlot(date, value) : undefined
              updateFormData({
                ...formData,
                timeSlot: value,
                bookingDate: updatedBookingDate
              })
            }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <div
              className={`flex cursor-pointer items-center rounded-xl border p-3 transition-all duration-200 ${
                formData.timeSlot === "9:00" 
                  ? "border-rose-500 bg-gradient-to-r from-rose-50 to-pink-50 shadow-md" 
                  : "border-neutral-200 hover:border-rose-200 hover:bg-rose-50/50"
              }`}
            >
              <RadioGroupItem value="9:00" id="9:00" className="border-rose-500 text-rose-500" />
              <Label htmlFor="9:00" className="ml-3 cursor-pointer">
                Morning
                <span className="block text-xs text-neutral-500 mt-0.5">9AM - 12PM</span>
              </Label>
            </div>
            <div
              className={`flex cursor-pointer items-center rounded-xl border p-3 transition-all duration-200 ${
                formData.timeSlot === '14:00' 
                  ? "border-rose-500 bg-gradient-to-r from-rose-50 to-pink-50 shadow-md" 
                  : "border-neutral-200 hover:border-rose-200 hover:bg-rose-50/50"
              }`}
            >
              <RadioGroupItem value="14:00" id="14:00" className="border-rose-500 text-rose-500" />
              <Label htmlFor="14:00" className="ml-3 cursor-pointer">
                Midday
                <span className="block text-xs text-neutral-500 mt-0.5">2PM - 6PM</span>
              </Label> 
            </div>
            <div
              className={`flex cursor-pointer items-center rounded-xl border p-3 transition-all duration-200 ${
                formData.timeSlot === "18:00" 
                  ? "border-rose-500 bg-gradient-to-r from-rose-50 to-pink-50 shadow-md" 
                  : "border-neutral-200 hover:border-rose-200 hover:bg-rose-50/50"
              }`}
            >
              <RadioGroupItem value="18:00" id="18:00" className="border-rose-500 text-rose-500" />
              <Label htmlFor="18:00" className="ml-3 cursor-pointer">
                Evening
                <span className="block text-xs text-neutral-500 mt-0.5">6PM - 11PM</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-rose-500" />
            <Label htmlFor="guestCount" className="text-base font-medium text-neutral-700">
              Number of Guests
            </Label>
          </div>
          <div className="relative max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Users className="h-5 w-5 text-neutral-400" />
            </div>
            <Input
              id="guestCount"
              type="number"
              min="1"
              placeholder="Enter number of guests"
              value={formData.guestCount || ""}
              onChange={(e) => updateFormData({ ...formData, guestCount: Number.parseInt(e.target.value) || 0 })}
              className="pl-10 border-neutral-300 focus:border-rose-500 focus:ring-rose-500"
              required
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 p-4 border border-rose-200">
        <p className="text-sm text-rose-700">
          Please ensure your selected date and time are available before proceeding. Our team will confirm availability
          upon submission.
        </p>
      </div>
    </div>
  )
}
