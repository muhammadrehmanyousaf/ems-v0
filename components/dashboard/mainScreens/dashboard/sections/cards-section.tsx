"use client";

import * as React from "react";
import { KpiCard } from "../components/data-card";
import {
    CalendarDays,
    DollarSign,
    Users,
    CalendarCheck2,
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
                title="Total Revenue"
                value={data?.totalRevenue.value ?? 0}
                isCurrency
                subtitle="Total collected revenue"
                icon={DollarSign}
                iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                delta={data?.totalRevenue.delta}
                direction={deltaDirection(data?.totalRevenue.delta)}
                loading={loading}
            />

            <KpiCard
                title="Total Customers"
                value={data?.totalCustomers.value ?? 0}
                subtitle="Unique customers"
                icon={Users}
                iconColor="bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400"
                delta={data?.totalCustomers.delta}
                direction={deltaDirection(data?.totalCustomers.delta)}
                loading={loading}
            />

            <KpiCard
                title="Upcoming Bookings"
                value={data?.upcomingBookings.value ?? 0}
                subtitle="Pending & confirmed"
                icon={CalendarCheck2}
                iconColor="bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                delta={data?.upcomingBookings.delta}
                direction={deltaDirection(data?.upcomingBookings.delta)}
                loading={loading}
            />
        </div>
    );
}
