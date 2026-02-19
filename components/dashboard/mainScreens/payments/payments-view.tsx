'use client'
import React, { useEffect, useState } from 'react'
import PageContainer from '../../layout/page-container'
import { Heading } from '@/components/heading'
import PaymentsTable from './components/payments-table'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, TrendingUp, Clock, Wallet, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import axiosInstance from '@/lib/axiosConfig'
import { BACKEND_URL } from '@/lib/backend-url'
import { Skeleton } from '@/components/ui/skeleton'

interface PayoutSummary {
    total: number
    totalAmount: number
    totalFees: number
    byStatus: Record<string, { count: number; amount: number }>
}

const formatRs = (value: unknown): string => {
    const num = Number(value) || 0
    return `Rs. ${num.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

const PaymentsView = () => {
    const [summary, setSummary] = useState<PayoutSummary | null>(null)
    const [balance, setBalance] = useState<number>(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const fetchPayoutSummary = async () => {
        setError(false)
        setLoading(true)
        try {
            const res = await axiosInstance.get(`${BACKEND_URL}api/v1/payments/vendor-payouts`)
            const data = res.data?.data
            const s = data?.summary
            if (s) {
                setSummary({
                    total: Number(s.total) || 0,
                    totalAmount: Number(s.totalAmount) || 0,
                    totalFees: Number(s.totalFees) || 0,
                    byStatus: s.byStatus || {},
                })
                setBalance(Number(s.totalAmount) || 0)
            }
        } catch {
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPayoutSummary()
    }, [])

    const stats = [
        {
            label: "Available Balance",
            value: formatRs(balance),
            icon: Wallet,
            color: "text-green-600",
            bg: "bg-green-50",
        },
        {
            label: "Total Earned",
            value: summary ? formatRs(summary.totalAmount) : "Rs. 0",
            icon: TrendingUp,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Platform Fees",
            value: summary ? formatRs(summary.totalFees) : "Rs. 0",
            icon: DollarSign,
            color: "text-amber-600",
            bg: "bg-amber-50",
        },
        {
            label: "Total Payouts",
            value: summary?.total?.toString() || "0",
            icon: Clock,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
    ]

    return (
        <div>
            <PageContainer>
                <div className='space-y-4'>
                    <Heading title="Payments" />
                    <Separator />

                    {/* Error Banner */}
                    {error && (
                        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-800">Unable to load payment data</p>
                                <p className="text-xs text-red-600">Please check your connection and try again.</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchPayoutSummary} className="shrink-0">
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Retry
                            </Button>
                        </div>
                    )}

                    {/* Payout Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-20 rounded-lg" />
                            ))
                        ) : (
                            stats.map((stat) => (
                                <Card key={stat.label} className="border-0 shadow-sm">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bg}`}>
                                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                                            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    <PaymentsTable />
                </div>
            </PageContainer>
        </div>
    )
}

export default PaymentsView
