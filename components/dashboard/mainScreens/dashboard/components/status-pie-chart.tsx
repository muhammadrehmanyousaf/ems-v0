"use client";
import * as React from "react";
import { Label, Pie, PieChart, Cell } from "recharts";
import {
    Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
    ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { StatusDistributionItem } from "@/lib/api/analytics";

const STATUS_COLORS: Record<string, { label: string; color: string }> = {
    Pending: { label: "Pending", color: "#f59e0b" },
    Confirmed: { label: "Confirmed", color: "#8b5cf6" },
    Cancelled: { label: "Cancelled", color: "#ef4444" },
    Completed: { label: "Completed", color: "#10b981" },
};

const ALL_STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"];

type Props = {
    chartHeight?: number;
    data: StatusDistributionItem[];
    total: number;
    loading?: boolean;
};

const StatusPieChart: React.FC<Props> = ({ chartHeight = 320, data, total, loading }) => {
    const chartConfig = React.useMemo(() => {
        const config: ChartConfig = {
            count: { label: "Bookings" },
        };
        ALL_STATUSES.forEach((status) => {
            const key = status.toLowerCase();
            config[key] = {
                label: STATUS_COLORS[status]?.label || status,
                color: STATUS_COLORS[status]?.color || "#94a3b8",
            };
        });
        return config;
    }, []);

    // Build pie data with explicit colors
    const pieData = React.useMemo(
        () =>
            data.map((item) => ({
                status: item.status.toLowerCase(),
                count: item.count,
                fill: STATUS_COLORS[item.status]?.color || "#94a3b8",
            })),
        [data]
    );

    // All statuses for legend (shows 0 counts too)
    const legendItems = React.useMemo(() => {
        const countMap = new Map<string, number>();
        data.forEach((item) => countMap.set(item.status, item.count));
        return ALL_STATUSES.map((status) => ({
            status,
            count: countMap.get(status) || 0,
            color: STATUS_COLORS[status]?.color || "#94a3b8",
        }));
    }, [data]);

    return (
        <Card className="flex h-full min-h-[420px] flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle>Booking Status</CardTitle>
                <CardDescription>All time distribution</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 pb-0">
                <div style={{ height: chartHeight }} className="w-full">
                    {loading ? (
                        <Skeleton className="h-full w-full rounded-lg" />
                    ) : pieData.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                            No booking data
                        </div>
                    ) : (
                        <ChartContainer config={chartConfig} className="h-full w-full">
                            <PieChart>
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Pie
                                    data={pieData}
                                    dataKey="count"
                                    nameKey="status"
                                    innerRadius={60}
                                    outerRadius={100}
                                    strokeWidth={3}
                                    stroke="var(--background)"
                                >
                                    {pieData.map((entry) => (
                                        <Cell key={entry.status} fill={entry.fill} />
                                    ))}
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                return (
                                                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                                                            {total.toLocaleString()}
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) + 24}
                                                            className="fill-muted-foreground"
                                                        >
                                                            Bookings
                                                        </tspan>
                                                    </text>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex-col gap-2 text-sm">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full">
                    {legendItems.map((item) => (
                        <div key={item.status} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span
                                    className="h-3 w-3 rounded-sm shrink-0"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-xs text-muted-foreground">{item.status}</span>
                            </div>
                            <span className="text-xs font-semibold tabular-nums">{item.count}</span>
                        </div>
                    ))}
                </div>
            </CardFooter>
        </Card>
    );
};

export default StatusPieChart;
