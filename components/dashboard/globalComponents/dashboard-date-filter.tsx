'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarIcon } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import type { DateRange } from '@/lib/api/analytics'
import { cn } from '@/lib/utils'

const PRESET_RANGES: { label: string; value: DateRange }[] = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'This Week', value: 'this_week' },
    { label: 'Last 7 Days', value: 'last_7_days' },
    { label: 'This Month', value: 'this_month' },
    { label: 'Last Month', value: 'last_month' },
    { label: 'Last 30 Days', value: 'last_30_days' },
    { label: 'This Year', value: 'this_year' },
];

const RANGE_LABELS: Record<DateRange, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    this_week: 'This Week',
    last_7_days: 'Last 7 Days',
    this_month: 'This Month',
    last_month: 'Last Month',
    last_30_days: 'Last 30 Days',
    this_year: 'This Year',
    custom: 'Custom Range',
};

interface DashboardDateFilterProps {
    value: DateRange;
    onChange: (range: DateRange, startDate?: string, endDate?: string) => void;
}

const DashboardDateFilter = ({ value, onChange }: DashboardDateFilterProps) => {
    const [open, setOpen] = useState(false);
    const [customDate, setCustomDate] = useState<Date | undefined>(undefined);

    const handlePresetClick = (range: DateRange) => {
        onChange(range);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className='gap-2'>
                    <CalendarIcon className='size-4' />
                    <span>{RANGE_LABELS[value]}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align='end' className="">
                <div className='flex gap-5'>
                    <div className='flex flex-col items-center gap-1'>
                        {PRESET_RANGES.map((btn) => (
                            <Button
                                key={btn.value}
                                variant={'ghost'}
                                onClick={() => handlePresetClick(btn.value)}
                                className={cn(
                                    'font-medium w-full justify-start',
                                    value === btn.value
                                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400'
                                        : 'text-muted-foreground hover:text-muted-foreground'
                                )}
                            >
                                <span className='text-left w-full'>{btn.label}</span>
                            </Button>
                        ))}
                    </div>
                    <div>
                        <Separator orientation='vertical' className='h-full' />
                    </div>
                    <div>
                        <Calendar
                            mode="single"
                            selected={customDate}
                            onSelect={(date) => {
                                setCustomDate(date);
                                if (date) {
                                    const dateStr = date.toISOString().split('T')[0];
                                    onChange('custom', dateStr, dateStr);
                                    setOpen(false);
                                }
                            }}
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default DashboardDateFilter
