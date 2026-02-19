'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    ArrowRight,
    CalendarClock,
    Mail,
    Phone,
    User2,
    Package as PackageIcon,
    Utensils,
    X,
} from 'lucide-react';

// --- your existing calendar event type ---
export type CalendarEvent = {
    id: string;
    title: string;
    start: Date;
    end: Date;
};

// --- booking detail model for the popover ---
type MenuItem = { name: string; price: number; qty?: number };
export type BookingDetail = {
    type: string;
    user: { name: string; email: string; phone: string };
    package: { name: string; price: number };
    menu: MenuItem[];
    currency?: string; // e.g., 'PKR'
};

type AddBookingDialogProps = {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    selectedEvents: CalendarEvent[]; // events on the chosen day
    /** Mapping of event.id -> booking detail */
    bookingDetails: Record<string, BookingDetail>;
};

/** Helpers */
const formatCurrency = (value: number, currency = 'PKR') =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(value);

const formatDateRange = (start: Date, end: Date) => {
    const d = new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    }).format(start);

    const tf = new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
    });

    return `${d}, ${tf.format(start)} – ${tf.format(end)}`;
};

const totalMenu = (menu: MenuItem[]) =>
    menu.reduce((sum, m) => sum + m.price * (m.qty ?? 1), 0);

const totalBooking = (detail: BookingDetail) =>
    detail.package.price + totalMenu(detail.menu);

const Empty = ({ text }: { text: string }) => (
    <span className="text-sm text-muted-foreground">{text}</span>
);

const Row = ({
    label,
    value,
}: {
    label: React.ReactNode;
    value: React.ReactNode;
}) => (
    <div className="flex items-start justify-between gap-2">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-sm font-medium text-right">{value}</div>
    </div>
);

const Section = ({
    title,
    icon,
    children,
}: {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) => (
    <div className="space-y-2">
        <div className="flex items-center gap-2">
            {icon}
            <h4 className="text-sm font-semibold">{title}</h4>
        </div>
        {children}
    </div>
);

export default function AddBookingDialog({
    open,
    setOpen,
    selectedEvents,
    bookingDetails,
}: AddBookingDialogProps) {
    return (
        <Dialog onOpenChange={setOpen} open={open}>
            <DialogContent className="left-[40%] p-4 sm:max-w-[520px] min-h-96 flex flex-col">
                <DialogHeader className="space-y-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle>Bookings for this date</DialogTitle>
                        <Button onClick={()=>setOpen(false)} variant="ghost" size="icon" className="hover:bg-accent">
                            <X className="size-5" />
                        </Button>
                    </div>
                    <DialogDescription>View or manage bookings.</DialogDescription>
                </DialogHeader>

                <Separator />

                {/* List of bookings with individual popovers */}
                <div className="space-y-2 flex-grow">
                    {selectedEvents.length === 0 && (
                        <div className='h-48 w-full flex items-center justify-center'>
                            <Empty text="No bookings for this date yet." />
                        </div>
                    )}

                    {selectedEvents.map((ev) => {
                        const detail = bookingDetails[ev.id];
                        const currency = detail?.currency ?? 'PKR';

                        return (
                            <Popover key={ev.id}>
                                <PopoverTrigger asChild>
                                    <Button className="bg-primary w-full justify-between text-white hover:bg-primary/90">
                                        <span className="truncate">{ev.title}</span>
                                        <span className="flex items-center gap-1 text-sm text-white/70">
                                            View
                                            <ArrowRight className="size-4" />
                                        </span>
                                    </Button>
                                </PopoverTrigger>

                                <PopoverContent
                                    side="right"
                                    align="center"
                                    className="ml-4 p-4 w-[420px]"
                                >
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold">Booking Details</h2>
                                    </div>

                                    <Separator className="my-3" />

                                    {/* Title + schedule */}
                                    <div className="flex items-start gap-2">
                                        <div className="h-3 w-3 bg-primary rounded mt-1" />
                                        <div className="min-w-0">
                                            <h3 className="text-base font-semibold truncate">
                                                {ev.title}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <CalendarClock className="size-4" />
                                                <span>{formatDateRange(ev.start, ev.end)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="my-3" />

                                    {/* Customer */}
                                    <Section
                                        title="Customer"
                                        icon={<User2 className="size-4 text-muted-foreground" />}
                                    >
                                        {detail ? (
                                            <div className="grid grid-cols-1 gap-1">
                                                <Row label="Name" value={detail.user.name} />
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground flex items-center gap-1">
                                                        <Mail className="size-4" /> Email
                                                    </span>
                                                    <span className="font-medium">{detail.user.email}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground flex items-center gap-1">
                                                        <Phone className="size-4" /> Phone
                                                    </span>
                                                    <span className="font-medium">
                                                        {detail.user.phone}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <Empty text="No customer info set." />
                                        )}
                                    </Section>

                                    <Separator className="my-3" />

                                    {/* Package */}
                                    <Section
                                        title="Package"
                                        icon={<PackageIcon className="size-4 text-muted-foreground" />}
                                    >
                                        {detail ? (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">{detail.package.name}</span>
                                                <span>{formatCurrency(detail.package.price, currency)}</span>
                                            </div>
                                        ) : (
                                            <Empty text="No package selected." />
                                        )}
                                    </Section>

                                    <Separator className="my-3" />

                                    {/* Menu */}
                                    <Section
                                        title="Menu"
                                        icon={<Utensils className="size-4 text-muted-foreground" />}
                                    >
                                        {detail && detail.menu.length > 0 ? (
                                            <div className="space-y-1">
                                                {detail.menu.map((m, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between text-sm"
                                                    >
                                                        <span className="truncate">
                                                            {m.name}
                                                            {m.qty ? ` × ${m.qty}` : ''}
                                                        </span>
                                                        <span>
                                                            {formatCurrency(m.price * (m.qty ?? 1), currency)}
                                                        </span>
                                                    </div>
                                                ))}
                                                <Separator />
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Menu total</span>
                                                    <span className="font-medium">
                                                        {formatCurrency(totalMenu(detail.menu), currency)}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <Empty text="No menu items selected." />
                                        )}
                                    </Section>

                                    <Separator className="my-3" />

                                    {/* Grand total */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold">Total</span>
                                        <span className="text-base font-semibold">
                                            {detail
                                                ? formatCurrency(totalBooking(detail), currency)
                                                : '—'}
                                        </span>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        );
                    })}
                </div>

                <Separator />

                <DialogFooter className='mt-auto'>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
