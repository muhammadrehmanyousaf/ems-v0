import React from 'react'
import { Heading } from '@/components/heading'
import DashboardDateFilter from '../../globalComponents/dashboard-date-filter'
import { Button } from '@/components/ui/button'
import CardsSection from './sections/cards-section'
import ChartsSections from './sections/charts-sections'
import { ScrollArea } from '@/components/ui/scroll-area'
import TableAndReviewSection from './sections/table-and-review-section'

const DashboardView = () => {
    return (
        <div className='py-4 space-y-4'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-y-4 w-full px-4 md:px-6'>
                <Heading
                    title='Hi, Welcome Back!'
                />
                <span className='flex items-center justify-end gap-2'>
                    <DashboardDateFilter />
                    <Button>Today's Bookings</Button>
                </span>
            </div>
            <ScrollArea className='h-[calc(100dvh-200px)] md:h-[calc(100dvh-140px)] overflow-auto px-4 md:px-6'>
                <div className='space-y-4'>
                    <CardsSection />
                    <ChartsSections />
                    <TableAndReviewSection/>
                </div>
            </ScrollArea>
        </div>
    )
}

export default DashboardView
