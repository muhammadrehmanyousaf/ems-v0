'use client'

import React, { useEffect, useState, useCallback } from 'react'
import PageContainer from '../../layout/page-container'
import { Heading } from '@/components/heading'
import { Separator } from '@/components/ui/separator'
import { KpiCard } from '../dashboard/components/data-card'
import { RevenueBarChart } from '../dashboard/components/revenue-bar-chart'
import DashboardDateFilter from '../../globalComponents/dashboard-date-filter'
import {
    AnalyticsAPI,
    type DateRange,
    type PlatformRevenueData,
    type RevenueTrendsData,
} from '@/lib/api/analytics'
import { PaymentsAPI, type ApiVendorPayout } from '@/lib/api/dashboard'
import { DollarSign, Wallet, TrendingUp, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/context/UserContext'
import { useRouter } from 'next/navigation'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const formatPKR = (n: number) =>
    new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        maximumFractionDigits: 0,
    }).format(n)

const statusColors: Record<string, string> = {
    completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    scheduled: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    failed: 'bg-red-500/10 text-red-600 border-red-200',
    hold: 'bg-orange-500/10 text-orange-600 border-orange-200',
}

const RevenueView = () => {
    const { user } = useUser()
    const router = useRouter()
    const [dateRange, setDateRange] = useState<DateRange>('this_month')
    const [customStart, setCustomStart] = useState<string | undefined>()
    const [customEnd, setCustomEnd] = useState<string | undefined>()
    const [loading, setLoading] = useState(true)
    const [revenue, setRevenue] = useState<PlatformRevenueData | null>(null)
    const [revenueTrends, setRevenueTrends] = useState<RevenueTrendsData | null>(null)
    const [payouts, setPayouts] = useState<ApiVendorPayout[]>([])
    const [payoutFilter, setPayoutFilter] = useState<string>('all')

    // Redirect non-admin users
    useEffect(() => {
        if (user && !user.isSuperAdmin) {
            router.replace('/dashboard')
        }
    }, [user, router])

    if (user && !user.isSuperAdmin) {
        return null
    }

    const fetchData = useCallback(async () => {
        setLoading(true)
        const [revenueData, trendsData, payoutsData] = await Promise.all([
            AnalyticsAPI.getPlatformRevenue(dateRange, customStart, customEnd),
            AnalyticsAPI.getRevenueTrends('this_year'),
            PaymentsAPI.getAllPayouts({ limit: 50 }).catch(() => ({
                payouts: [] as ApiVendorPayout[],
                pagination: { total: 0, limit: 50, offset: 0, pages: 0 },
                summary: { total: 0, totalAmount: 0, totalFees: 0 },
            })),
        ])
        setRevenue(revenueData)
        setRevenueTrends(trendsData)
        setPayouts(payoutsData?.payouts ?? [])
        setLoading(false)
    }, [dateRange, customStart, customEnd])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleDateChange = (range: DateRange, start?: string, end?: string) => {
        setDateRange(range)
        setCustomStart(start)
        setCustomEnd(end)
    }

    const filteredPayouts = payoutFilter === 'all'
        ? payouts
        : payouts.filter((p) => p.status === payoutFilter)

    return (
        <div>
            <PageContainer>
                <div className='space-y-4'>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-4">
                        <Heading
                            title="Revenue & Payouts"
                            description="Platform revenue, fees, and vendor payout management"
                        />
                        <DashboardDateFilter value={dateRange} onChange={handleDateChange} />
                    </div>
                    <Separator />

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                            title="Total Revenue"
                            value={revenue?.totalRevenue ?? 0}
                            isCurrency
                            icon={DollarSign}
                            iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                            loading={loading}
                        />
                        <KpiCard
                            title="Platform Fees"
                            value={revenue?.totalFees ?? 0}
                            isCurrency
                            icon={TrendingUp}
                            iconColor="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                            loading={loading}
                        />
                        <KpiCard
                            title="Vendor Payouts"
                            value={revenue?.totalPayouts ?? 0}
                            isCurrency
                            icon={Wallet}
                            iconColor="bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400"
                            loading={loading}
                        />
                        <KpiCard
                            title="Pending Payouts"
                            value={revenue?.pendingPayouts ?? 0}
                            isCurrency
                            icon={Clock}
                            iconColor="bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                            loading={loading}
                        />
                    </div>

                    {/* Revenue Chart */}
                    <RevenueBarChart
                        data={revenueTrends?.data || []}
                        period={revenueTrends?.period || ''}
                        loading={loading}
                    />

                    {/* Revenue by Vendor */}
                    {!loading && revenue?.byVendor && revenue.byVendor.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue by Vendor</CardTitle>
                                <CardDescription>Top vendors by revenue this period</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-muted-foreground">
                                                <th className="py-2 pr-4 text-left font-medium">Vendor</th>
                                                <th className="py-2 pr-4 text-left font-medium">Type</th>
                                                <th className="py-2 pr-4 text-right font-medium">Revenue</th>
                                                <th className="py-2 pr-4 text-right font-medium">Platform Fee</th>
                                                <th className="py-2 pr-4 text-right font-medium">Net Payout</th>
                                                <th className="py-2 text-right font-medium">Transactions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {revenue.byVendor.map((v) => (
                                                <tr key={v.vendorId} className="border-b last:border-0 hover:bg-muted/50">
                                                    <td className="py-2.5 pr-4">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-7 w-7">
                                                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                                    {v.vendorName?.charAt(0)?.toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-medium">{v.vendorName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 pr-4">
                                                        <Badge variant="outline" className="capitalize text-xs">
                                                            {v.vendorType || 'N/A'}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-right font-semibold tabular-nums">
                                                        {formatPKR(v.revenue)}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
                                                        {formatPKR(v.fees)}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-right tabular-nums">
                                                        {formatPKR(v.payout)}
                                                    </td>
                                                    <td className="py-2.5 text-right tabular-nums">
                                                        {v.transactions}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Payouts Table */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Vendor Payouts</CardTitle>
                                    <CardDescription>All payout transactions</CardDescription>
                                </div>
                                <Select value={payoutFilter} onValueChange={setPayoutFilter}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Filter status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="hold">On Hold</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <Skeleton className="h-[300px] w-full rounded-lg" />
                            ) : filteredPayouts.length === 0 ? (
                                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                                    No payouts found
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-muted-foreground">
                                                <th className="py-2 pr-4 text-left font-medium">Vendor</th>
                                                <th className="py-2 pr-4 text-left font-medium">Business</th>
                                                <th className="py-2 pr-4 text-right font-medium">Amount</th>
                                                <th className="py-2 pr-4 text-right font-medium">Fee</th>
                                                <th className="py-2 pr-4 text-right font-medium">Net Payout</th>
                                                <th className="py-2 pr-4 text-center font-medium">Status</th>
                                                <th className="py-2 text-right font-medium">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPayouts.map((p) => (
                                                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                                                    <td className="py-2.5 pr-4 font-medium">
                                                        {p.vendor?.fullName || 'Unknown'}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-muted-foreground">
                                                        {p.business?.name || 'N/A'}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-right tabular-nums">
                                                        {formatPKR(Number(p.originalAmount) || 0)}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-right tabular-nums text-muted-foreground">
                                                        {formatPKR(Number(p.platformFee) || 0)}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-right font-semibold tabular-nums">
                                                        {formatPKR(Number(p.payoutAmount) || 0)}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-center">
                                                        <Badge
                                                            className={`capitalize ${statusColors[p.status?.toLowerCase()] || ''}`}
                                                        >
                                                            {p.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2.5 text-right text-muted-foreground">
                                                        {p.createdAt
                                                            ? new Date(p.createdAt).toLocaleDateString()
                                                            : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </PageContainer>
        </div>
    )
}

export default RevenueView
