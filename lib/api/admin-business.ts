import axiosInstance from "../axiosConfig"
import type { ApiBusiness, ApiPackage } from "./dashboard"
import type { BusinessStatus } from "./adminQueue"
import type { Lead } from "./leads"

export interface Business360Metrics {
  totalLeads: number
  totalBookings: number
  confirmedBookings: number
  totalRevenueEstimate: number
}

export interface Business360Owner {
  id: number
  fullName: string
  email: string
  phoneNumber: string
  vendorType: string | null
  city: string | null
  emailVerified: boolean
  phoneVerified: boolean
  createdAt: string
}

export interface Business360Menu {
  id: number
  name?: string
  title?: string
  pricePerHead?: number | null
  items: unknown
}

export interface Business360BookingItem {
  id: number
  bookingDate: string
  eventDate?: string | null
  status: string
  totalAmount: number
  notes?: string | null
  createdAt: string
  customer?: {
    id: number
    fullName: string
    phoneNumber: string
    email: string
  } | null
}

export interface AdminBusinessProfile extends Omit<Partial<ApiBusiness>, "vendor" | "status" | "menus"> {
  id: number
  name: string
  city: string | null
  subArea: string | null
  slug?: string | null
  phoneNumber?: string | null
  whatsappNumber?: string | null
  address?: string | null
  completenessScore?: number | null
  verificationTier?: number
  minimumPrice: number | null
  maxCapacity: number | null
  minCapacity: number | null
  description: string | null
  images: string[]
  status?: BusinessStatus
  subBusinessType?: string | null
  vendor?: Business360Owner | null
  packages?: ApiPackage[]
  menus?: Business360Menu[]
  documents?: unknown[]
}

export interface Business360Data {
  business: AdminBusinessProfile
  recentLeads: Lead[]
  totalLeadsCount: number
  recentBookings: Business360BookingItem[]
  totalBookingsCount: number
  metrics: Business360Metrics
}

export interface BusinessSearchAssignItem {
  id: number
  name: string
  city: string | null
  subArea: string | null
  subBusinessType: unknown
  vendorType: string | null
  status: string
  verificationTier?: number
  ownerName: string
  ownerPhone: string
  ownerEmail: string
}

export class AdminBusinessAPI {
  /**
   * GET /api/v1/admin/businesses/:id/360
   * Retrieves complete 360-degree business profile for administrative operations.
   */
  static async getBusiness360(id: number): Promise<Business360Data> {
    const res = await axiosInstance.get(`/api/v1/admin/businesses/${id}/360`)
    return res.data?.data
  }

  /**
   * GET /api/v1/admin/businesses/search-assign
   * Search businesses for quick lead/booking assignment.
   */
  static async searchBusinessesForAssignment(params: {
    q?: string
    city?: string
    vendorType?: string
  }): Promise<BusinessSearchAssignItem[]> {
    const qs = new URLSearchParams()
    if (params.q) qs.set("q", params.q)
    if (params.city && params.city !== "all") qs.set("city", params.city)
    if (params.vendorType && params.vendorType !== "all") qs.set("vendorType", params.vendorType)

    const res = await axiosInstance.get(`/api/v1/admin/businesses/search-assign?${qs.toString()}`)
    return res.data?.data ?? []
  }

  /**
   * POST /api/v1/admin/leads/:id/assign-business
   * Assign or reassign an inquiry/lead to a target business.
   */
  static async assignLeadToBusiness(
    leadId: number,
    targetBusinessId: number,
    adminNote?: string,
  ): Promise<{ lead: Lead; targetBusiness: { id: number; name: string } }> {
    const res = await axiosInstance.post(`/api/v1/admin/leads/${leadId}/assign-business`, {
      targetBusinessId,
      adminNote,
    })
    return res.data?.data
  }

  /**
   * POST /api/v1/admin/leads/bulk-assign
   * Assign or reassign multiple inquiries/leads to a target business in a batch.
   */
  static async bulkAssignLeads(
    leadIds: number[],
    targetBusinessId: number,
    adminNote?: string,
  ): Promise<{ assignedCount: number; targetBusiness: { id: number; name: string } }> {
    const res = await axiosInstance.post('/api/v1/admin/leads/bulk-assign', {
      leadIds,
      targetBusinessId,
      adminNote,
    })
    return res.data?.data
  }

  /**
   * POST /api/v1/admin/bookings/:id/assign-business
   * Assign or reassign a booking order to a target business.
   */
  static async assignBookingToBusiness(
    bookingId: number,
    targetBusinessId: number,
    adminNote?: string,
  ): Promise<{ booking: unknown; targetBusiness: { id: number; name: string } }> {
    const res = await axiosInstance.post(`/api/v1/admin/bookings/${bookingId}/assign-business`, {
      targetBusinessId,
      adminNote,
    })
    return res.data?.data
  }

  /**
   * POST /api/v1/admin/businesses/:id/assign-owner
   * Transfer business ownership to a new vendor user ID.
   */
  static async transferBusinessOwnership(
    businessId: number,
    targetUserId: number,
    reason?: string,
  ): Promise<{ business: ApiBusiness; newOwner: unknown }> {
    const res = await axiosInstance.post(`/api/v1/admin/businesses/${businessId}/assign-owner`, {
      targetUserId,
      reason,
    })
    return res.data?.data
  }

  /**
   * PATCH /api/v1/admin/businesses/:id/details
   * Administratively update business contact and operational fields.
   */
  static async updateBusinessAdmin(
    businessId: number,
    updates: Record<string, unknown>,
  ): Promise<ApiBusiness> {
    const res = await axiosInstance.patch(`/api/v1/admin/businesses/${businessId}/details`, updates)
    return res.data?.data
  }
  /**
   * POST /api/v1/admin/businesses/bulk-status
   * Bulk transition business status (approved, suspended, submitted, rejected).
   */
  static async bulkUpdateStatus(
    ids: number[],
    status: "approved" | "suspended" | "submitted" | "rejected",
    notes?: string,
  ): Promise<{ updatedCount: number; ids: number[]; status: string }> {
    const res = await axiosInstance.post(`/api/v1/admin/businesses/bulk-status`, {
      ids,
      status,
      notes,
    })
    return res.data?.data
  }
}
