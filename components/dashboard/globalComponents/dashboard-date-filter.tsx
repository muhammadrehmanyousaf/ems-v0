'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarIcon } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'

const DashboardDateFilter = () => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    const buttons = [
        { label: 'Today', value: 'today' },
        { label: 'Yesterday', value: 'yesterday' },
        { label: 'This Week', value: 'this week' },
        { label: 'Last 7 Days', value: 'last 7 days' },
        { label: 'This Month', value: 'this month' },
        { label: 'Last Month', value: 'last month' },
        { label: 'Last 30 Days', value: 'last 30 days' },
        { label: 'This Year', value: 'this year' },
    ];

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className='gap-2'>
                    <CalendarIcon className='size-4' />
                    <span>{`This Month`}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align='end' className="">
                <div className='flex gap-5'>
                    <div className='flex flex-col items-center gap-1'>
                        {buttons.map((btn, i) => (
                            <Button
                                key={i}
                                variant={'ghost'}
                                className='text-muted-foreground font-medium hover:text-muted-foreground w-full'>
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
                            selected={date}
                            onSelect={setDate}
                        />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default DashboardDateFilter
