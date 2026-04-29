'use client';

import { Store, Globe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { VendorRevenueResponse } from '@/lib/dashboard-types';

const fmt = (n: number) =>
    `Rs. ${n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

interface RevenueSplitSectionProps {
    data: VendorRevenueResponse | null;
    loading?: boolean;
}

export default function RevenueSplitSection({ data, loading }: RevenueSplitSectionProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
            </div>
        );
    }

    const s = data?.stats;

    const cards = [
        {
            label: 'Offline Revenue',
            icon: Store,
            theme: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', sub: 'text-orange-500' },
            stats: s?.offline,
        },
        {
            label: 'Online Revenue',
            icon: Globe,
            theme: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', sub: 'text-blue-500' },
            stats: s?.online,
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map(({ label, icon: Icon, theme, stats }) => (
                <div key={label} className={`rounded-xl border ${theme.border} ${theme.bg} p-5 space-y-3`}>
                    <div className={`flex items-center gap-2 font-semibold text-sm ${theme.text}`}>
                        <Icon className="h-4 w-4" />
                        {label}
                        <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-white/60 ${theme.text}`}>
                            {stats?.count ?? 0} bookings
                        </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: 'Total',    value: stats?.total    ?? 0 },
                            { label: 'Received', value: stats?.received ?? 0 },
                            { label: 'Due',      value: stats?.due      ?? 0 },
                        ].map(({ label: l, value }) => (
                            <div key={l} className="bg-white/70 rounded-lg px-3 py-2">
                                <p className={`text-[11px] ${theme.sub}`}>{l}</p>
                                <p className={`text-sm font-bold ${theme.text}`}>{fmt(value)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
