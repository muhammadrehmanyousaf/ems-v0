'use client';

import { CalendarClock, AlertCircle, Building2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { UpcomingBookings7DaysData } from '@/lib/api/analytics';
import type { VendorPayment } from '@/lib/dashboard-types';

const fmt = (n: number) => `Rs. ${n.toLocaleString()}`;

function statusClass(status: string) {
    const s = status.toLowerCase();
    if (s === 'confirmed')       return 'border-emerald-400 text-emerald-700 bg-emerald-50';
    if (s === 'pending')         return 'border-amber-400 text-amber-700 bg-amber-50';
    if (s === 'awaiting payment') return 'border-blue-400 text-blue-700 bg-blue-50';
    return 'border-neutral-300 text-neutral-600 bg-neutral-50';
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
}

function formatTime(time?: string) {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    if (isNaN(h)) return time;
    return `${h % 12 || 12}:${String(m ?? 0).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

interface UpcomingAndDueSectionProps {
    upcoming: UpcomingBookings7DaysData | null;
    due: VendorPayment[];
    loading?: boolean;
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
            <Icon className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">{text}</p>
        </div>
    );
}

export default function UpcomingAndDueSection({ upcoming, due, loading }: UpcomingAndDueSectionProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upcoming 7 days */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <CalendarClock className="h-4 w-4 text-violet-500" />
                        Upcoming 7 Days
                        {(upcoming?.count ?? 0) > 0 && (
                            <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                                {upcoming!.count} booking{upcoming!.count !== 1 ? 's' : ''}
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2 max-h-56 overflow-y-auto pr-2">
                    {!upcoming || upcoming.bookings.length === 0 ? (
                        <EmptyState icon={CalendarClock} text="No upcoming bookings in the next 7 days" />
                    ) : (
                        upcoming.bookings.map((b) => (
                            <div key={b.id} className="flex items-start gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
                                <div className="flex flex-col items-center justify-center min-w-[36px] text-center">
                                    <p className="text-[11px] font-bold text-primary leading-tight">
                                        {formatDate(b.bookingDate)}
                                    </p>
                                    {b.time && (
                                        <p className="text-[10px] text-muted-foreground">{formatTime(b.time)}</p>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold truncate">{b.customerName}</p>
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                                        <Building2 className="h-3 w-3 shrink-0" />{b.business}
                                    </p>
                                </div>
                                <Badge variant="outline" className={cn('text-[10px] shrink-0 px-1.5 py-0', statusClass(b.status))}>
                                    {b.status}
                                </Badge>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Payments Due */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        Payments Due
                        {due.length > 0 && (
                            <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                                {due.length} pending
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2 max-h-56 overflow-y-auto pr-2">
                    {due.length === 0 ? (
                        <EmptyState icon={AlertCircle} text="No outstanding payments" />
                    ) : (
                        due.slice(0, 10).map((p) => (
                            <div key={p.bookingId} className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold truncate">{p.customerName}</p>
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3 shrink-0" />
                                        #{p.bookingId}
                                        {p.bookingDate && (
                                            <span className="ml-1">· {formatDate(p.bookingDate)}</span>
                                        )}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs font-bold text-orange-600">{fmt(p.due)}</p>
                                    <p className="text-[10px] text-muted-foreground">due</p>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
