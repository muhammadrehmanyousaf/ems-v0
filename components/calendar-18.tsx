"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { startOfToday, isBefore } from "date-fns"

interface Calendar18Props {
  selected?: Date | undefined
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  month?: Date
  onMonthChange?: (month: Date) => void
  modifiers?: Record<string, Date[]>
  modifiersClassNames?: Record<string, string>
}

export default function Calendar18({
  selected,
  onSelect,
  disabled,
  month,
  onMonthChange,
  modifiers,
  modifiersClassNames,
}: Calendar18Props) {
  const [date, setDate] = React.useState<Date | undefined>(selected || new Date())

  const handleSelect = (newDate: Date | undefined) => {
    setDate(newDate)
    if (onSelect) onSelect(newDate)
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
      month={month}
      onMonthChange={onMonthChange}
      modifiers={modifiers}
      modifiersClassNames={modifiersClassNames}
      className="rounded-lg border [--cell-size:2.75rem] md:[--cell-size:3rem] w-full"
      buttonVariant="ghost"
    />
  )
}
