"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import type { RevenueTrendItem } from "@/lib/api/analytics"

const chartConfig = {
  revenue: {
    label: "Revenue (Rs.)",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

const formatCompact = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return String(v)
}

interface RevenueBarChartProps {
  chartHeight?: number;
  data: RevenueTrendItem[];
  period: string;
  loading?: boolean;
}

export function RevenueBarChart({ chartHeight, data, period, loading }: RevenueBarChartProps) {
  return (
    <Card className="flex h-full xlarge:h-auto flex-col">
      <CardHeader>
        <CardTitle>Total Revenue</CardTitle>
        <CardDescription>{period || "Monthly revenue"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height: chartHeight }} className="w-full">
          {loading ? (
            <Skeleton className="h-full w-full rounded-lg" />
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No revenue data
            </div>
          ) : (
            <ChartContainer config={chartConfig}>
              <BarChart accessibilityLayer data={data} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  width={48}
                  tickFormatter={formatCompact}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
