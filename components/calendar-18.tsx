"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { startOfToday, isBefore } from "date-fns"

interface Calendar18Props {
  selected?: Date | undefined
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
}

export default function Calendar18({ 
  selected, 
  onSelect, 
  disabled 
}: Calendar18Props) {
  const [date, setDate] = React.useState<Date | undefined>(selected || new Date(2025, 5, 12))

  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate)
    if (onSelect) {
      onSelect(newDate)
    }
  }

  const defaultDisabled = (date: Date) => {
    const today = startOfToday()
    return isBefore(date, today)
  }

  return (
    <Calendar
      mode="single"
      selected={selected || date}
      onSelect={handleSelect}
      disabled={disabled || defaultDisabled}
      className="rounded-lg border [--cell-size:2.75rem] md:[--cell-size:3rem] w-full"
      buttonVariant="ghost"
    />
  )
}
