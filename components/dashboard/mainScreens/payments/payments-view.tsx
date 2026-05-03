'use client'
import React, { useEffect, useState, useCallback } from 'react'
import PageContainer from '../../layout/page-container'
import { Heading } from '@/components/heading'
import PaymentsTable from './components/payments-table'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Store, Globe, TrendingUp, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PaymentsAPI } from '@/lib/api/dashboard'
import type { VendorRevenueResponse, VendorPayment } from '@/lib/dashboard-types'

const fmt = (n: number) =>
    `Rs. ${n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const PaymentsView = () => {
    const [data, setData]       = useState<VendorRevenueResponse | null>(null)
    const [payments, setPayments] = useState<VendorPayment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError]     = useState(false)

    const fetchData = useCallback(async () => {
        setError(false)
        setLoading(true)
        try {
            const res = await PaymentsAPI.getVendorRevenue()
            setData(res)
            setPayments(res.payments)
        } catch {
            setError(true)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const s = data?.stats

    const sourceCards = [
        {
            label:   'Offline Revenue',
            icon:    Store,
            theme:   { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', sub: 'text-orange-500' },
            stats:   s?.offline,
        },
        {
            label:   'Online Revenue',
            icon:    Globe,
            theme:   { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', sub: 'text-blue-500' },
            stats:   s?.online,
        },
    ]

    return (
        <div>
            <PageContainer>
                <div className='space-y-5'>
                    <Heading title="Payments" />
                    <Separator />

                    {error && (
                        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-800">Unable to load payment data</p>
                                <p className="text-xs text-red-600">Please check your connection and try again.</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchData} className="shrink-0">
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Retry
                            </Button>
                        </div>
                    )}

                    {/* Overall summary row */}
                    {loading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                { label: 'Total Bookings', value: String(s?.all.count ?? 0), icon: Clock,     color: 'text-bridal-gold-dark', bg: 'bg-bridal-cream' },
                                { label: 'Total Revenue',  value: fmt(s?.all.total    ?? 0), icon: TrendingUp, color: 'text-neutral-700', bg: 'bg-neutral-100' },
                                { label: 'Total Received', value: fmt(s?.all.received ?? 0), icon: TrendingUp, color: 'text-green-600',  bg: 'bg-green-50' },
                                { label: 'Total Due',      value: fmt(s?.all.due      ?? 0), icon: AlertCircle,color: 'text-red-500',   bg: 'bg-red-50' },
                            ].map((stat) => (
                                <Card key={stat.label} className="border shadow-sm">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${stat.bg}`}>
                                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                                            <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Offline / Online split cards */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Skeleton className="h-36 rounded-xl" />
                            <Skeleton className="h-36 rounded-xl" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sourceCards.map(({ label, icon: Icon, theme, stats }) => (
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
                    )}

                    <PaymentsTable payments={payments} loading={loading} onRefresh={fetchData} />
                </div>
            </PageContainer>
        </div>
    )
}

export default PaymentsView
