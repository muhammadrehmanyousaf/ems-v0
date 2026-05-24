"use client";

import * as React from "react";
import Link from "next/link";
import { KpiCard } from "../components/data-card";
import {
    CalendarDays,
    DollarSign,
    CalendarClock,
    AlertCircle,
} from "lucide-react";
import type { DashboardKpis } from "@/lib/api/analytics";

interface CardsSectionProps {
    data: DashboardKpis | null;
    loading?: boolean;
}

function deltaDirection(delta?: number) {
    if (delta === undefined || delta === 0) return "flat" as const;
    return delta > 0 ? ("up" as const) : ("down" as const);
}

export default function CardsSection({ data, loading }: CardsSectionProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
                title="Total Bookings"
                value={data?.totalBookings.value ?? 0}
                subtitle="Total events booked"
                icon={CalendarDays}
                iconColor="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                delta={data?.totalBookings.delta}
                direction={deltaDirection(data?.totalBookings.delta)}
                loading={loading}
            />

            <KpiCard
                title="Revenue Collected"
                value={data?.totalRevenue.value ?? 0}
                isCurrency
                subtitle="Payments received (PKR)"
                icon={DollarSign}
                iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                delta={data?.totalRevenue.delta}
                direction={deltaDirection(data?.totalRevenue.delta)}
                loading={loading}
            />

            <Link
                href="/dashboard/receivables"
                className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-bridal-gold-dark focus:ring-offset-2"
                aria-label="Open receivables / A/R aging board"
            >
                <KpiCard
                    title="Revenue Due"
                    value={data?.revenueDue?.value ?? 0}
                    isCurrency
                    subtitle="Pending payments (PKR) · click to chase"
                    icon={AlertCircle}
                    iconColor="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
                    delta={undefined}
                    direction="flat"
                    loading={loading}
                    className="hover:shadow-md hover:border-bridal-gold-dark/40 transition-all cursor-pointer"
                />
            </Link>

            <KpiCard
                title="Today's Events"
                value={data?.todaysEvents.value ?? 0}
                subtitle="Bookings scheduled today"
                icon={CalendarClock}
                iconColor="bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400"
                delta={undefined}
                direction="flat"
                loading={loading}
            />

        </div>
    );
}
