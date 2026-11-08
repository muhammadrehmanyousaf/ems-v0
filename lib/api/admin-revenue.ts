import axiosInstance from "@/lib/axiosConfig"

export interface AdminRevenueKpis {
  totalGmv: number
  platformTakeRate: number
  activeEscrow: number
  completedVolume: number
  pendingPayouts: number
  subscriptionMrr: number
  activeSubscriptionsCount: number
  totalBookingsCount: number
}

export interface CityDistributionItem {
  city: string
  gmv: number
  bookingCount: number
}

export interface PayoutDisbursementItem {
  bookingId: number
  customerName: string
  customerPhone: string
  venueName: string
  venueId: number | null
  city: string
  eventDate: string | null
  grossAmount: number
  platformTakeRate: number
  netPayoutDue: number
  status: "ready_for_payout" | "escrow_held" | "settled"
}

export interface AdminRevenueOverviewData {
  kpis: AdminRevenueKpis
  cityDistribution: CityDistributionItem[]
  disbursementQueue: PayoutDisbursementItem[]
}

export class AdminRevenueAPI {
  static async getOverview(): Promise<AdminRevenueOverviewData> {
    const res = await axiosInstance.get("/api/v1/admin/revenue/analytics")
    return res.data?.data
  }
}
