'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import WeekCalendar from './week-calendar';
import { DayView } from './day-view';
import MonthView from './month-view';
import Toolbar from './toolbar';
import { buildMonth, buildWeekRange, CalendarEvent, endOfDay, filterEvents, startOfDay } from '@/lib/utils';
import AddBookingDialog, { BookingDetail } from './add-booking-dialog';
import axiosInstance from '@/lib/axiosConfig';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type Mode = 'month' | 'week' | 'day';

export default function MainCalendar() {
    const [mode, setMode] = useState<Mode>('month');
    const [openAddBooking, setOpenAddBookeng] = useState<boolean>(false);
    const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[] | []>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [bookingDetailsMap, setBookingDetailsMap] = useState<Record<string, BookingDetail>>({});
    const [loading, setLoading] = useState(true);

    const [cursor, setCursor] = useState<Date>(() => {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return t;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type RawBooking = Record<string, any>;

    // Fetch bookings and convert to CalendarEvents
    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await axiosInstance.get('/api/v1/bookings');
                const bookings: RawBooking[] = res.data?.data?.data || res.data?.data || [];
                const calEvents: CalendarEvent[] = [];
                const details: Record<string, BookingDetail> = {};

                bookings.forEach((b) => {
                    const date = new Date(b.bookingDate);
                    const [hours, minutes] = (b.bookingTime || '10:00').split(':').map(Number);
                    const start = new Date(date);
                    start.setHours(hours || 10, minutes || 0, 0, 0);
                    const end = new Date(start);
                    end.setHours(start.getHours() + 2);

                    const id = String(b.id);

                    calEvents.push({
                        id,
                        title: `${b.customerName} (${b.status})`,
                        start,
                        end,
                    });

                    details[id] = {
                        type: b.status || '',
                        user: {
                            name: b.customerName || '',
                            email: b.customerEmail || b.customer?.email || '',
                            phone: b.customerPhone || b.customer?.phoneNumber || '',
                        },
                        package: {
                            name: b.packageName || b.package?.name || 'N/A',
                            price: b.packagePrice || b.package?.price || 0,
                        },
                        menu: Array.isArray(b.menuItems) ? b.menuItems : [],
                        currency: 'PKR',
                    };
                });

                setEvents(calEvents);
                setBookingDetailsMap(details);
            } catch {
                setEvents([]);
                toast.error('Failed to load calendar bookings');
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const { monthTitle, cells } = useMemo(() => {
        const built = buildMonth(cursor);
        return { monthTitle: built.title, cells: built.cells };
    }, [cursor]);

    const { weekStart, weekEnd, weekTitle } = useMemo(
        () => buildWeekRange(cursor, true),
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

    const eventsThisWeek = useMemo(
        () => filterEvents(events, startOfDay(weekStart), endOfDay(weekEnd)),
        [events, weekStart, weekEnd]
    );

    const eventsThisDay = useMemo(
        () => filterEvents(events, startOfDay(cursor), endOfDay(cursor)),
        [events, cursor]
    );

    const onOpenCellDialog = (evts: CalendarEvent[] | []) => {
        setOpenAddBookeng(true);
        setSelectedEvents(evts);
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-[500px] w-full rounded-lg" />
            </div>
        );
    }

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
                bookingDetails={bookingDetailsMap}
            />
        </div>
    );
}
