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
  updateFormData: (data: Partial<BookingFormData>) => void
}

export default function DateSelectionStep({ formData, updateFormData }: DateSelectionStepProps) {
  const [date, setDate] = useState<Date | undefined>(formData.bookingDate)

  const handleDateChange = (date: Date | undefined) => {
    setDate(date)
    updateFormData({ bookingDate: date })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-gray-800">Select Date & Time</h2>
        <p className="text-gray-600">Choose your preferred date, time slot, and number of guests</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center">
            <CalendarDays className="mr-2 h-5 w-5 text-blue-500" />
            <Label className="text-base font-medium text-gray-700">Select Date</Label>
          </div>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              className="rounded-md border border-gray-200 shadow-sm"
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
            <Clock className="mr-2 h-5 w-5 text-blue-500" />
            <Label className="text-base font-medium text-gray-700">Select Time Slot</Label>
          </div>
          <RadioGroup
            value={formData.timeSlot}
            onValueChange={(value) => updateFormData({ timeSlot: value })}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <div
              className={`flex cursor-pointer items-center rounded-md border p-3 ${
                formData.timeSlot === "morning" ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
            >
              <RadioGroupItem value="morning" id="morning" className="border-blue-500 text-blue-500" />
              <Label htmlFor="morning" className="ml-3 cursor-pointer">
                Morning
                <span className="ml-1 block text-xs text-gray-500">9AM - 12PM</span>
              </Label>
            </div>
            <div
              className={`flex cursor-pointer items-center rounded-md border p-3 ${
                formData.timeSlot === "midday" ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
            >
              <RadioGroupItem value="midday" id="midday" className="border-blue-500 text-blue-500" />
              <Label htmlFor="midday" className="ml-3 cursor-pointer">
                Midday
                <span className="ml-1 block text-xs text-gray-500">12PM - 4PM</span>
              </Label>
            </div>
            <div
              className={`flex cursor-pointer items-center rounded-md border p-3 ${
                formData.timeSlot === "evening" ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
            >
              <RadioGroupItem value="evening" id="evening" className="border-blue-500 text-blue-500" />
              <Label htmlFor="evening" className="ml-3 cursor-pointer">
                Evening
                <span className="ml-1 block text-xs text-gray-500">5PM - 10PM</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-blue-500" />
            <Label htmlFor="guestCount" className="text-base font-medium text-gray-700">
              Number of Guests
            </Label>
          </div>
          <div className="relative max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="guestCount"
              type="number"
              min="1"
              placeholder="Enter number of guests"
              value={formData.guestCount || ""}
              onChange={(e) => updateFormData({ guestCount: Number.parseInt(e.target.value) || 0 })}
              className="pl-10"
              required
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-700">
          Please ensure your selected date and time are available before proceeding. Our team will confirm availability
          upon submission.
        </p>
      </div>
    </div>
  )
}
