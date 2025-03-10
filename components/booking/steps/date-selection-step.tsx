"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import type { BookingFormData } from "@/lib/types"

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
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold">Select Date & Time</h2>
        <p className="text-muted-foreground">Choose your preferred date, time slot, and number of guests</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Select Date</Label>
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              className="rounded-md border"
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
          <Label>Select Time Slot</Label>
          <RadioGroup
            value={formData.timeSlot}
            onValueChange={(value) => updateFormData({ timeSlot: value })}
            className="flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0"
          >
            <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-slate-50">
              <RadioGroupItem value="morning" id="morning" />
              <Label htmlFor="morning" className="cursor-pointer">
                Morning (9AM - 12PM)
              </Label>
            </div>
            <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-slate-50">
              <RadioGroupItem value="midday" id="midday" />
              <Label htmlFor="midday" className="cursor-pointer">
                Midday (12PM - 4PM)
              </Label>
            </div>
            <div className="flex items-center space-x-2 rounded-md border p-3 hover:bg-slate-50">
              <RadioGroupItem value="evening" id="evening" />
              <Label htmlFor="evening" className="cursor-pointer">
                Evening (5PM - 10PM)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="guestCount">Number of Guests</Label>
          <Input
            id="guestCount"
            type="number"
            min="1"
            placeholder="Enter number of guests"
            value={formData.guestCount || ""}
            onChange={(e) => updateFormData({ guestCount: Number.parseInt(e.target.value) || 0 })}
            required
          />
        </div>
      </div>
    </div>
  )
}

