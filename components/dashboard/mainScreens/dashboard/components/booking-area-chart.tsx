"use client";
import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { BookingTrendItem } from "@/lib/api/analytics";

const chartConfig = {
  bookings: { label: "Bookings", color: "hsl(262, 83%, 58%)" },
} satisfies ChartConfig;

const ALL_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type Props = {
  chartHeight?: number;
  data: BookingTrendItem[];
  trendPercent: number;
  period: string;
  loading?: boolean;
};

const BookingAreaChart: React.FC<Props> = ({
  chartHeight = 320,
  data,
  trendPercent,
  period,
  loading,
}) => {
  const TrendIcon =
    trendPercent > 0 ? TrendingUp : trendPercent < 0 ? TrendingDown : Minus;

  // Pad data to show all months up to current month
  const paddedData = useMemo(() => {
    const currentMonth = new Date().getMonth(); // 0-indexed
    const monthMap = new Map<string, number>();
    data.forEach((item) => {
      const key = String(item.month).slice(0, 3);
      monthMap.set(key, (monthMap.get(key) || 0) + item.bookings);
    });

    return ALL_MONTHS.slice(0, currentMonth + 1).map((month) => ({
      month,
      bookings: monthMap.get(month) || 0,
    }));
  }, [data]);

  const totalBookings = paddedData.reduce((sum, d) => sum + d.bookings, 0);

  return (
    <Card className="flex h-full min-h-[420px] flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bookings</CardTitle>
            <CardDescription>{period || "Monthly trend"}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{totalBookings}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <div style={{ height: chartHeight }} className="w-full">
          {loading ? (
            <Skeleton className="h-full w-full rounded-lg" />
          ) : paddedData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No booking data available
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart data={paddedData} accessibilityLayer margin={{ left: 0, right: 12, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-bookings)" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="var(--color-bookings)" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="var(--color-bookings)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={30}
                  allowDecimals={false}
                />
                <ChartTooltip
                  cursor={{ stroke: "var(--color-bookings)", strokeWidth: 1, strokeDasharray: "4 4" }}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="bookings"
                  type="monotone"
                  fill="url(#bookingsGradient)"
                  stroke="var(--color-bookings)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--color-bookings)", stroke: "var(--background)", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "var(--color-bookings)", stroke: "var(--background)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              {trendPercent !== 0
                ? `Trending ${trendPercent > 0 ? "up" : "down"} by ${Math.abs(trendPercent)}% this month`
                : "No change this month"}
              <TrendIcon className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground leading-none">{period}</div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default BookingAreaChart;
