"use client";

import * as React from "react";
import { KpiCard } from "../components/data-card";
import {
    CalendarDays,
    DollarSign,
    Users,
    CalendarCheck2,
} from "lucide-react";

export default function CardsSection() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
                title="Total Bookings"
                value={1250}
                subtitle="Total events booked"
                icon={CalendarDays}
                delta={12.5}
                direction="up"
            />

            <KpiCard
                title="Total Revenue"
                value={49220}
                isCurrency
                subtitle="Total generated revenue"
                icon={DollarSign}
                delta={5.4}
                direction="up"
            />

            <KpiCard
                title="Total Customers"
                value={44000}
                subtitle="Total customers in this venue"
                icon={Users}
                delta={0.8}
                direction="down"
            />

            <KpiCard
                title="Upcoming Bookings"
                value={20}
                subtitle="Next 30 days bookings"
                icon={CalendarCheck2}
                delta={1.2}
                direction="up"
            />
        </div>
    );
}
