'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import WeekCalendar from './week-calendar';
import { DayView } from './day-view';
import MonthView from './month-view';
import AgendaView from './agenda-view';
import Toolbar from './toolbar';
import { StaffAPI, type TeamCalendarShift } from '@/lib/api/staff';
import { buildMonth, buildWeekRange, CalendarEvent, endOfDay, filterEvents, startOfDay, ymd } from '@/lib/utils';
import AddBookingDialog, { BookingDetail } from './add-booking-dialog';
// Issue #45 — "+ Add booking for this date" reuses the offline-booking dialog.
import { OfflineBookingDialog } from '@/components/dashboard/mainScreens/bookings/bookingListing/components/offline-booking-dialog';
import axiosInstance from '@/lib/axiosConfig';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { BlockedDatesAPI, type BlockedDate } from '@/lib/api/dashboard';
import BlockDateDialog from './block-date-dialog';
import {
    BusinessAvailabilityAPI,
    type RecurringBlock,
    type SlotAvailabilityRow,
} from '@/lib/api/businessAvailability';
// Phase 3 #9.2 — Hijri overlay + Islamic-events suggestion strip.
import { IslamicEventsStrip } from './islamic-events-strip';

type Mode = 'month' | 'week' | 'day' | 'agenda';

const AGENDA_HORIZON_DAYS = 60;

export default function MainCalendar() {
    const [mode, setMode] = useState<Mode>('month');
    const [openAddBooking, setOpenAddBookeng] = useState<boolean>(false);
    const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[] | []>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [bookingDetailsMap, setBookingDetailsMap] = useState<Record<string, BookingDetail>>({});
    const [loading, setLoading] = useState(true);

    // Issue #45 — "Add booking for this date" flow. State for the
    // offline-booking dialog + the date prefill captured on cell click.
    const [offlineBookingOpen, setOfflineBookingOpen] = useState(false);
    const [offlineBookingDate, setOfflineBookingDate] = useState<Date | undefined>();

    // Blocked dates state
    const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
    const [blockDialogOpen, setBlockDialogOpen] = useState(false);
    const [blockDialogDate, setBlockDialogDate] = useState<Date | null>(null);
    const [blockDialogExisting, setBlockDialogExisting] = useState<BlockedDate | null>(null);

    // BK-011 — recurring blocks across ALL of this vendor's businesses, unioned.
    // We materialise them into a Set<YYYY-MM-DD> per visible cursor month
    // rather than storing per-date rows; one rule covers years.
    const [recurringRules, setRecurringRules] = useState<
        Array<RecurringBlock & { businessName?: string | null }>
    >([]);

    // BK-008/15/19/53 + BK-CALENDAR-SLOT-CHIPS follow-up — slot availability
    // per day for the SELECTED business. Toolbar's `<Building2>` picker is
    // shown when the vendor owns >1 business; defaults to first-with-templates
    // so single-business vendors see chips with zero clicks.
    const [slotAvailabilityByDate, setSlotAvailabilityByDate] = useState<
        Record<string, SlotAvailabilityRow[]>
    >({});
    const [slotBusinessId, setSlotBusinessId] = useState<number | null>(null);
    const [businessOptions, setBusinessOptions] = useState<
        Array<{ id: number; name: string; hasTemplates: boolean }>
    >([]);

    // §AGENDA — team-on-duty overlay (staff shifts grouped by date) for the
    // agenda view. Fetched lazily when the agenda mode is first opened.
    const [teamByDate, setTeamByDate] = useState<Record<string, TeamCalendarShift[]>>({});

    const [cursor, setCursor] = useState<Date>(() => {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return t;
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type RawBooking = Record<string, any>;

    // Fetch bookings and convert to CalendarEvents
    const fetchBookings = useCallback(async () => {
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
                        bookingSource: b.bookingSource,
                    });

                    const bd = b.bookingDetails?.[0];
                    const rawEmail: string = b.customerEmail || b.customer?.email || '';
                    const displayEmail = rawEmail.startsWith('offline_') ? '(Offline booking)' : rawEmail;

                    const bdList = Array.isArray(b.bookingDetails) ? b.bookingDetails : [];
                    const vendorTotal = bdList.reduce((s: number, d: RawBooking) => s + (Number(d.totalAmount) || 0), 0);

                    details[id] = {
                        type: b.status || '',
                        user: {
                            name: b.customerName || '',
                            email: displayEmail,
                            phone: b.customerPhone || b.customer?.phoneNumber || '',
                        },
                        package: {
                            name: bd?.package?.name || 'N/A',
                            price: vendorTotal > 0 ? vendorTotal : Number(b.totalAmount) || 0,
                        },
                        menu: Array.isArray(b.menuItems) ? b.menuItems : [],
                        currency: 'PKR',
                        vendorType: bd?.business?.vendor?.vendorType || '',
                        businessName: bd?.business?.name || '',
                        guestCount: Number(b.guestCount) || 0,
                        quantity: Number(bd?.vehicleQuantity) || 0,
                        paymentStatus: b.paymentStatus || '',
                        bookingSource: b.bookingSource,
                        specialRequests: b.specialRequests || b.additionalRequests || '',
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
    }, []);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    // §AGENDA — fetch the team-on-duty overlay for the agenda window
    // whenever agenda mode is active and the cursor moves. Resilient:
    // returns {} on any error so the agenda still renders bookings.
    useEffect(() => {
        if (mode !== 'agenda') return;
        let alive = true;
        const start = new Date(cursor);
        const end = new Date(cursor);
        end.setDate(end.getDate() + AGENDA_HORIZON_DAYS);
        StaffAPI.teamCalendar({ from: ymd(start), to: ymd(end) })
            .then((r) => { if (alive) setTeamByDate(r.days || {}); })
            .catch(() => { if (alive) setTeamByDate({}); });
        return () => { alive = false; };
    }, [mode, cursor]);

    // §M4 — drag-drop reschedule (offline bookings only; gated by
    // NEXT_PUBLIC_CALENDAR_DND). Online/customer bookings can't be moved
    // unilaterally (they go through the change-request flow), so we
    // toast instead of calling the (403-for-vendors) reschedule path.
    const handleEventDrop = useCallback(async (eventId: string, date: Date) => {
        const detail = bookingDetailsMap[eventId];
        if (detail && detail.bookingSource !== 'offline') {
            toast.message("Only offline bookings can be dragged — online bookings reschedule via the customer / change request");
            return;
        }
        const target = ymd(date);
        try {
            await axiosInstance.post(`/api/v1/bookings/${eventId}/vendor-reschedule`, { newBookingDate: target });
            toast.success('Booking moved');
            fetchBookings();
        } catch (e: unknown) {
            const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(msg || 'Could not move booking');
        }
    }, [bookingDetailsMap, fetchBookings]);

    const calendarDndOn = process.env.NEXT_PUBLIC_CALENDAR_DND === '1';

    // Fetch blocked dates whenever month changes
    const fetchBlockedDates = useCallback(async (monthDate: Date) => {
        try {
            const yyyy = monthDate.getFullYear();
            const mm = String(monthDate.getMonth() + 1).padStart(2, '0');
            const data = await BlockedDatesAPI.getAll(`${yyyy}-${mm}`);
            setBlockedDates(data);
        } catch {
            // silently ignore — vendor may not have businesses yet
        }
    }, []);

    useEffect(() => {
        fetchBlockedDates(cursor);
    }, [cursor, fetchBlockedDates]);

    // BK-011 — fetch recurring rules across all vendor's businesses once.
    // Rules don't change per month; the materialisation does.
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await axiosInstance.get('/api/v1/businesses/user-business');
                const list: Array<{ id: number; name?: string }> =
                    res.data?.data?.data ?? res.data?.data ?? [];
                if (!Array.isArray(list) || list.length === 0) return;
                const allRules: Array<RecurringBlock & { businessName?: string | null }> = [];
                for (const biz of list) {
                    try {
                        const r = await BusinessAvailabilityAPI.listRecurringBlocks(biz.id);
                        const blocks = r?.blocks ?? [];
                        for (const b of blocks) {
                            allRules.push({ ...b, businessName: biz.name ?? null });
                        }
                    } catch { /* swallow per-business; continue */ }
                }
                if (alive) setRecurringRules(allRules);
            } catch { /* silent */ }
        })();
        return () => {
            alive = false;
        };
    }, []);

    // BK-008/15/19/53 — fetch bulk slot availability for the visible month
    // when the vendor has at least one slot-template-aware business. Auto-picks
    // the first business that has any active templates so single-business
    // vendors get chips with zero clicks. Multi-business vendors can still
    // manage availability per-business via the AvailabilityDrawer.
    // Effect 1 — load the vendor's business list + mark which have active
    // slot templates. Runs ONCE; auto-picks the first template-enabled biz
    // as the initial `slotBusinessId` so single-business vendors see chips
    // with zero clicks. The toolbar's <Select> shows whenever there are
    // multiple businesses.
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const res = await axiosInstance.get('/api/v1/businesses/user-business');
                const list: Array<{ id: number; name?: string }> =
                    res.data?.data?.data ?? res.data?.data ?? [];
                if (!Array.isArray(list) || list.length === 0) return;

                const enriched: Array<{ id: number; name: string; hasTemplates: boolean }> = [];
                let firstWithTemplates: number | null = null;
                for (const biz of list) {
                    let hasTemplates = false;
                    try {
                        const t = await axiosInstance.get(`/api/v1/businesses/${biz.id}/slots`);
                        const templates: unknown[] =
                            t.data?.data?.templates ?? t.data?.data ?? [];
                        hasTemplates = Array.isArray(templates) && templates.length > 0;
                    } catch { /* assume no templates */ }
                    enriched.push({ id: biz.id, name: biz.name ?? `Business #${biz.id}`, hasTemplates });
                    if (hasTemplates && firstWithTemplates == null) {
                        firstWithTemplates = biz.id;
                    }
                }
                if (!alive) return;
                setBusinessOptions(enriched);
                // Don't override an explicit user pick if state already has one.
                setSlotBusinessId((curr) => (curr != null ? curr : firstWithTemplates));
            } catch { /* silent — chips just don't render */ }
        })();
        return () => {
            alive = false;
        };
    }, []);

    // Effect 2 — fetch bulk slot availability whenever the SELECTED business
    // OR visible month changes. Range = ~42 cells; backend caps at 60d.
    useEffect(() => {
        if (slotBusinessId == null) {
            setSlotAvailabilityByDate({});
            return;
        }
        let alive = true;
        (async () => {
            try {
                const start = new Date(cursor);
                start.setDate(1);
                start.setDate(start.getDate() - 7);
                const end = new Date(cursor);
                end.setMonth(end.getMonth() + 1, 0);
                end.setDate(end.getDate() + 7);
                const bulk = await BusinessAvailabilityAPI.getBulkAvailability(
                    slotBusinessId, ymd(start), ymd(end),
                );
                if (alive) setSlotAvailabilityByDate(bulk?.days ?? {});
            } catch { /* silent */ }
        })();
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slotBusinessId, cursor.getMonth(), cursor.getFullYear()]);

    const blockedDateSet = useMemo(() => {
        const s = new Set<string>();
        blockedDates.forEach((bd) => s.add(bd.blockedDate));
        return s;
    }, [blockedDates]);

    const blockedDateMap = useMemo(() => {
        const m = new Map<string, BlockedDate>();
        blockedDates.forEach((bd) => m.set(bd.blockedDate, bd));
        return m;
    }, [blockedDates]);

    // Materialise BK-011 rules into a Set<YYYY-MM-DD> for the current cursor
    // month (plus a Map<date,reason> for hover tooltips).
    //
    // weekdayMask uses Mon=1..Sun=64 (BusinessSlotTemplate convention).
    // JS Date.getDay returns Sun=0..Sat=6; map at noon-local to dodge UTC drift.
    const recurringBlockedMap = useMemo(() => {
        const m = new Map<string, { reason: string; businessName: string | null }>();
        if (!recurringRules.length) return m;
        // Materialise across the visible month + a small buffer so prev/next
        // month cells in the grid also paint.
        const start = new Date(cursor);
        start.setDate(1);
        start.setDate(start.getDate() - 7); // padding for prev month leaks
        const end = new Date(cursor);
        end.setMonth(end.getMonth() + 1, 0);
        end.setDate(end.getDate() + 7); // padding for next month leaks

        for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const probe = new Date(d);
            probe.setHours(12, 0, 0, 0); // noon to dodge UTC drift
            const jsDay = probe.getDay(); // Sun=0..Sat=6
            const bit = jsDay === 0 ? 64 : 1 << (jsDay - 1);
            const dateStr = ymd(probe);

            for (const r of recurringRules) {
                const startOk = !r.startDate || dateStr >= String(r.startDate);
                const endOk = !r.endDate || dateStr <= String(r.endDate);
                if (!startOk || !endOk) continue;
                if ((Number(r.weekdayMask) & bit) === 0) continue;
                // First match wins for the tooltip.
                if (!m.has(dateStr)) {
                    m.set(dateStr, {
                        reason: r.reason || 'Recurring block',
                        businessName: r.businessName ?? null,
                    });
                }
            }
        }
        return m;
    }, [recurringRules, cursor]);

    const recurringBlockedDateSet = useMemo(
        () => new Set(recurringBlockedMap.keys()),
        [recurringBlockedMap],
    );

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
            if (mode === 'month' || mode === 'agenda') d.setMonth(d.getMonth() + dir, 1);
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

    const onOpenCellDialog = (evts: CalendarEvent[] | [], date?: Date) => {
        setOpenAddBookeng(true);
        setSelectedEvents(evts);
        // Issue #45 — remember the clicked date so "Add booking for
        // this date" knows which Date to prefill the offline dialog with.
        if (date) setOfflineBookingDate(date);
    };

    // When a date cell is right-clicked or long-pressed for blocking
    const onDateBlockToggle = (date: Date) => {
        const key = ymd(date);
        const existing = blockedDateMap.get(key) ?? null;
        setBlockDialogDate(date);
        setBlockDialogExisting(existing);
        setBlockDialogOpen(true);
    };

    const handleBlockSave = async (reason: string) => {
        if (!blockDialogDate) return;
        const key = ymd(blockDialogDate);
        try {
            const blocked = await BlockedDatesAPI.block(key, reason);
            // Issue #36 — BlockedDatesAPI.block returns the FULL refreshed
            // list for the month, so we just adopt it as state. The green/
            // checkmark affordance lands the moment the API resolves
            // instead of waiting for fetchBlockedDates to race the dialog
            // close. fetchBlockedDates still runs to reconcile across
            // month changes.
            if (Array.isArray(blocked) && blocked.length > 0) {
                setBlockedDates(blocked);
            }
            toast.success('Date blocked — customers cannot book on this day');
            fetchBlockedDates(cursor);
        } catch {
            toast.error('Failed to block date');
        }
    };

    const handleUnblock = async () => {
        if (!blockDialogDate) return;
        const key = ymd(blockDialogDate);
        try {
            await BlockedDatesAPI.unblock(key);
            // Issue #36 — optimistically drop the row matching this date.
            setBlockedDates((prev) => (prev || []).filter((b) => b.blockedDate !== key));
            toast.success('Date unblocked — customers can book again');
            fetchBlockedDates(cursor);
        } catch {
            toast.error('Failed to unblock date');
        }
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
                businessOptions={businessOptions}
                selectedBusinessId={slotBusinessId}
                onBusinessChange={(id) => setSlotBusinessId(id)}
            />

            {/* Phase 3 #9.2 — upcoming Islamic events with 1-click block.
                Hidden when no events fall in the next 120 days. */}
            <IslamicEventsStrip
                blockedDateSet={blockedDateSet}
                onBlock={(date) => onDateBlockToggle(date)}
            />

            {mode === 'month' && (
                <MonthView
                    cells={cells}
                    events={events}
                    blockedDateSet={blockedDateSet}
                    blockedDateMap={blockedDateMap}
                    recurringBlockedDateSet={recurringBlockedDateSet}
                    recurringBlockedMap={recurringBlockedMap}
                    slotAvailabilityByDate={slotAvailabilityByDate}
                    onOpenCellDialog={onOpenCellDialog}
                    onDateBlockToggle={onDateBlockToggle}
                    onEventDrop={calendarDndOn ? handleEventDrop : undefined}
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

            {mode === 'agenda' && (
                <AgendaView
                    cursor={cursor}
                    events={events}
                    bookingDetails={bookingDetailsMap}
                    teamByDate={teamByDate}
                    onOpenEvent={onOpenCellDialog}
                    horizonDays={AGENDA_HORIZON_DAYS}
                />
            )}

            <AddBookingDialog
                open={openAddBooking}
                setOpen={setOpenAddBookeng}
                selectedEvents={selectedEvents}
                bookingDetails={bookingDetailsMap}
                onAddNewBooking={() => setOfflineBookingOpen(true)}
            />

            {/* Issue #45 — offline booking dialog mounted at calendar level
                so the date captured on the cell click can be prefilled
                via initialDate. fetchBookings refresh on success keeps
                the calendar in sync. */}
            <OfflineBookingDialog
                open={offlineBookingOpen}
                onOpenChange={setOfflineBookingOpen}
                onSuccess={() => {
                    setOfflineBookingOpen(false);
                    fetchBookings();
                }}
                initialDate={offlineBookingDate}
            />

            <BlockDateDialog
                open={blockDialogOpen}
                onOpenChange={setBlockDialogOpen}
                date={blockDialogDate}
                existingBlock={blockDialogExisting}
                onSave={handleBlockSave}
                onUnblock={handleUnblock}
            />
        </div>
    );
}
