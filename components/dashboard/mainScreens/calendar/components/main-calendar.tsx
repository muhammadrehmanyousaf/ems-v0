'use client';

import React, { useMemo, useState, useCallback } from 'react';
import WeekCalendar from './week-calendar';
import { DayView } from './day-view';
import MonthView from './month-view';
import Toolbar from './toolbar';
import { buildMonth, buildWeekRange, CalendarEvent, endOfDay, filterEvents, SAMPLE_EVENTS, startOfDay } from '@/lib/utils';
import AddBookingDialog, { BookingDetail } from './add-booking-dialog';

type Mode = 'month' | 'week' | 'day';

export default function MainCalendar() {
    const [mode, setMode] = useState<Mode>('month');
    const [openAddBooking, setOpenAddBookeng] = useState<boolean>(false)
    const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[] | []>([])

    const [cursor, setCursor] = useState<Date>(() => {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return t;
    });

    const { monthTitle, cells } = useMemo(() => {
        const built = buildMonth(cursor);
        return { monthTitle: built.title, cells: built.cells };
    }, [cursor]);

    const { weekStart, weekEnd, weekTitle } = useMemo(
        () => buildWeekRange(cursor, /* startOnMonday */ true),
        [cursor]
    );

    const dayTitle = useMemo(
        () =>
            new Intl.DateTimeFormat(undefined, {
                weekday: 'short',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            }).format(cursor),
        [cursor]
    );

    const step = useCallback(
        (dir: 1 | -1) => {
            const d = new Date(cursor);
            if (mode === 'month') d.setMonth(d.getMonth() + dir, 1);
            else if (mode === 'week') d.setDate(d.getDate() + dir * 7);
            else d.setDate(d.getDate() + dir);
            d.setHours(0, 0, 0, 0);
            setCursor(d);
        },
        [cursor, mode]
    );
    const goPrev = () => step(-1);
    const goNext = () => step(1);
    const goToday = () => {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        setCursor(t);
    };

    const events = SAMPLE_EVENTS;

    const eventsThisWeek = useMemo(
        () => filterEvents(events, startOfDay(weekStart), endOfDay(weekEnd)),
        [events, weekStart, weekEnd]
    );

    const eventsThisDay = useMemo(
        () => filterEvents(events, startOfDay(cursor), endOfDay(cursor)),
        [events, cursor]
    );

    const onOpenCellDialog = (events: CalendarEvent[] | []) => {
        setOpenAddBookeng(true)
        setSelectedEvents(events)
    };

    const bookingDetails: Record<string, BookingDetail> = {
        '1': {
            type: 'Barat',
            user: { name: 'Ayesha Khan', email: 'ayesha@example.com', phone: '+92 300 1234567' },
            package: { name: 'Premium', price: 200000 },
            menu: [
                { name: 'Buffet (per head)', price: 3500, qty: 100 },
                { name: 'Dessert table', price: 25000 },
            ],
            currency: 'PKR',
        },
        '2': {
            type: 'Valima',
            user: { name: 'Usman Ali', email: 'usman@example.com', phone: '+92 333 7654321' },
            package: { name: 'Standard', price: 120000 },
            menu: [{ name: 'Hi-tea', price: 1800, qty: 80 }],
            currency: 'PKR',
        },
    };

    return (
        <div className="space-y-4">
            <Toolbar
                goNext={goNext}
                goPrev={goPrev}
                goToday={goToday}
                dayTitle={dayTitle}
                weekTitle={weekTitle}
                mode={mode}
                monthTitle={monthTitle}
                setMode={setMode}
            />

            {mode === 'month' && (
                <MonthView
                    cells={cells}
                    events={events}
                    onOpenCellDialog={onOpenCellDialog}
                />
            )}

            {mode === 'week' && (
                <WeekCalendar
                    current={cursor}
                    startOnMonday
                    events={eventsThisWeek}
                    onOpenCellDialog={onOpenCellDialog}
                />
            )}

            {mode === 'day' && (
                <DayView
                    date={cursor}
                    events={eventsThisDay}
                    onOpenCellDialog={onOpenCellDialog}
                />
            )}

            <AddBookingDialog
                open={openAddBooking}
                setOpen={setOpenAddBookeng}
                selectedEvents={selectedEvents}
                bookingDetails={bookingDetails}
            />
        </div>
    );
}
