import axiosInstance from "../axiosConfig";

// ─── Users ────────────────────────────────────────────────────
export interface ApiUser {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  isVendor: boolean;
  active: boolean;
  vendorType: string | null;
  reviewProfile: boolean;
  balance: number;
  city: string | null;
  subArea: string | null;
  brandLogo: string | null;
  createdAt: string;
  updatedAt: string;
  roles: { id: number; name: string }[];
}

export class UsersAPI {
  static async getAll(): Promise<ApiUser[]> {
    const res = await axiosInstance.get("/api/v1/users");
    return res.data?.data ?? [];
  }

  static async getById(id: number): Promise<ApiUser> {
    const res = await axiosInstance.get(`/api/v1/users/${id}`);
    return res.data?.data;
  }

  static async changeStatus(id: number, active: boolean): Promise<void> {
    await axiosInstance.patch(
      `/api/v1/users/change-status?id=${id}&active=${active}`,
    );
  }

  static async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/users?id=${id}`);
  }

  static async updateProfile(data: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
  }): Promise<void> {
    await axiosInstance.patch("/api/v1/users", data);
  }

  static async getMyProfile(): Promise<{ user: ApiUser; token: string }> {
    const res = await axiosInstance.get("/api/v1/users/profile/me");
    return res.data?.data;
  }
}

// ─── Vendors ──────────────────────────────────────────────────
export class VendorsAPI {
  static async getAll(): Promise<ApiUser[]> {
    const res = await axiosInstance.get("/api/v1/vendors");
    return res.data?.data.data ?? [];
  }

  static async getById(id: number): Promise<ApiUser> {
    const res = await axiosInstance.get(`/api/v1/vendors/${id}`);
    return res.data?.data;
  }

  static async changeProfileStatus(
    id: number,
    reviewProfile: boolean,
  ): Promise<void> {
    await axiosInstance.patch(
      `/api/v1/users/vendor-profile-update?id=${id}&reviewProfile=${reviewProfile}`,
    );
  }
}

// ─── Businesses ───────────────────────────────────────────────
export interface ApiBusiness {
  id: number;
  userId: number;
  name: string;
  brandLogo: string | null;
  city: string | null;
  subArea: string | null;
  description: string | null;
  additionalInfo: string | null;
  minimumPrice: number | null;
  images: string[];
  maxCapacity: number | null;
  minCapacity: number | null;
  // Type-specific fields
  staff: string[] | null;
  services: string | null;
  subBusinessType: string | null;
  cityCovered: string[] | null;
  travelToClientHome: boolean | null;
  serviceProvided: string[] | null;
  expertise: string[] | null;
  amenities: string[] | null;
  catering: boolean | null;
  parking: boolean | null;
  carParkingCapacity: number | null;
  sellMehndi: boolean | null;
  hasTeam: boolean | null;
  instruction: string | null;
  provideDecorationItem: boolean | null;
  provideFoodTesting: boolean | null;
  provideSoundSystem: boolean | null;
  provideSeatingArrangement: boolean | null;
  provideWaiter: boolean | null;
  providePlate: boolean | null;
  covidComplaint: boolean | null;
  cancelationPolicy: string | null;
  downPaymentType: "Percentage" | "Fixed Amount" | null;
  downPayment: number | null;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    vendorType: string;
    brandLogo: string | null;
    isVendor: boolean;
  };
  packages?: ApiPackage[];
  menus?: ApiMenu[];
}

export class BusinessesAPI {
  static async getAll(
    page = 1,
    limit = 20,
  ): Promise<{
    data: ApiBusiness[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const res = await axiosInstance.get(
      `/api/v1/businesses?page=${page}&limit=${limit}`,
    );
    return (
      res.data?.data ?? {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }
    );
  }

  static async getUserBusinesses(): Promise<ApiBusiness[]> {
    const res = await axiosInstance.get("/api/v1/businesses/user-business");
    return res.data?.data ?? [];
  }

  static async getById(id: number): Promise<ApiBusiness> {
    const res = await axiosInstance.get(`/api/v1/businesses/${id}`);
    return res.data?.data;
  }

  static async update(
    id: number,
    data: Partial<ApiBusiness>,
  ): Promise<ApiBusiness> {
    const res = await axiosInstance.patch(
      `/api/v1/businesses/user-business/${id}`,
      data,
    );
    return res.data?.data;
  }

  static async uploadImages(files: File[], businessId?: number): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    const url = businessId
      ? `/api/v1/businesses/upload-images?businessId=${businessId}`
      : "/api/v1/businesses/upload-images";
    const res = await axiosInstance.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data ?? [];
  }

  static async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/businesses/${id}`);
  }

  static async getCompleteness(id: number): Promise<CompletenessResponse> {
    const res = await axiosInstance.get(`/api/v1/businesses/${id}/completeness`);
    return res.data?.data;
  }

  // BK-100.5 — vendor-selectable cancellation policy presets.
  static async getCancellationPolicy(
    id: number,
  ): Promise<CancellationPolicyResponse> {
    const res = await axiosInstance.get(
      `/api/v1/businesses/${id}/cancellation-policy`,
    );
    return res.data?.data;
  }

  static async setCancellationPolicy(
    id: number,
    preset: CancellationPresetKey,
  ): Promise<{ policy: CancellationPolicy; presetKey: CancellationPresetKey }> {
    const res = await axiosInstance.patch(
      `/api/v1/businesses/${id}/cancellation-policy`,
      { preset },
    );
    return res.data?.data;
  }

  // Pricing-rules engine (flag-gated by env PRICING_RULES_ENGINE).
  static async getPricingRules(id: number): Promise<PricingRulesResponse> {
    const res = await axiosInstance.get(`/api/v1/businesses/${id}/pricing-rules`);
    return res.data?.data;
  }

  static async setPricingRules(
    id: number,
    rules: PricingRulesConfig,
  ): Promise<{ rules: PricingRulesConfig; engineEnabled: boolean }> {
    const res = await axiosInstance.patch(
      `/api/v1/businesses/${id}/pricing-rules`,
      rules,
    );
    return res.data?.data;
  }
}

// BK-100.5 — types mirror the backend `cancellationPolicyPresets.js` util.
export type CancellationPresetKey =
  | "platform_default"
  | "flexible"
  | "standard"
  | "strict";

export interface CancellationPolicyTier {
  minDaysBefore: number;
  refundPercent: number;
  depositRefundable: boolean;
}

export interface CancellationPolicy {
  version: number;
  presetKey?: CancellationPresetKey;
  presetLabel?: string;
  tiers: CancellationPolicyTier[];
  vendorCancelOverridesToFull: boolean;
  forceMajeureOverridesToFull: boolean;
  platformFeeRefundable: boolean;
}

export interface CancellationPolicyPreset extends CancellationPolicy {
  key: CancellationPresetKey;
}

export interface CancellationPolicyResponse {
  currentPolicy: CancellationPolicy | null;
  currentPresetKey: CancellationPresetKey | null;
  presets: CancellationPolicyPreset[];
}

// Pricing-rules engine — weekend premium + early-bird discount layered
// on seasonal surge. Mirrors backend pricingRulesService. weekdayMask
// uses Mon=1..Sun=64 (default Sat+Sun = 96).
export interface PricingRulesWeekendPremium {
  enabled: boolean;
  percent: number;
  weekdayMask?: number;
}
export interface PricingRulesEarlyBird {
  enabled: boolean;
  percent: number;
  thresholdDays: number;
}
export interface PricingRulesConfig {
  enabled: boolean;
  weekendPremium: PricingRulesWeekendPremium;
  earlyBird: PricingRulesEarlyBird;
}
export interface PricingRulesResponse {
  rules: PricingRulesConfig | null;
  engineEnabled: boolean;
  bounds: {
    premiumMaxPercent: number;
    discountMaxPercent: number;
    defaultWeekendMask: number;
  };
}

// VR-050.10 — vendor profile completeness widget. Shape mirrors the
// backend `computeCompletenessBreakdown` + `computeVerificationStatus`.
export interface CompletenessItem {
  key: string;
  label: string;
  weight: number;
  done: boolean;
}
export interface CompletenessCategory {
  key: string;
  label: string;
  earned: number;
  max: number;
  items: CompletenessItem[];
}
export interface CompletenessVerification {
  tier: 0 | 1 | 2 | 3 | 4;
  canAcceptBookings: boolean;
  canListPublicly: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  ntnVerified: boolean;
  cnicVerified: boolean;
  addressVerified: boolean;
  visited: boolean;
  completeness: number;
  missingForBookings: string[];
  missingForPublic: string[];
}
export interface CompletenessResponse {
  score: number;
  categories: CompletenessCategory[];
  suggestions: string[];
  verification: CompletenessVerification;
}

// ─── Roles ────────────────────────────────────────────────────
export interface ApiRole {
  id: number;
  name: string;
  description: string | null;
  type: string | null;
  createdAt: string;
  updatedAt: string;
  users?: { id: number; fullName: string; isVendor: boolean }[];
}

export class RolesAPI {
  static async getAll(): Promise<ApiRole[]> {
    const res = await axiosInstance.get("/api/v1/roles");
    return res.data?.data ?? [];
  }

  static async getById(id: number): Promise<ApiRole> {
    const res = await axiosInstance.get(`/api/v1/roles/${id}`);
    return res.data?.data;
  }

  static async create(data: {
    name: string;
    description?: string;
    type?: string;
  }): Promise<ApiRole> {
    const res = await axiosInstance.post("/api/v1/roles", data);
    return res.data?.data;
  }

  static async update(
    id: number,
    data: { name?: string; description?: string; type?: string },
  ): Promise<ApiRole> {
    const res = await axiosInstance.patch(`/api/v1/roles?id=${id}`, data);
    return res.data?.data;
  }

  static async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/roles?roleId=${id}`);
  }
}

// ─── Payments ─────────────────────────────────────────────────
export interface ApiPaymentTransaction {
  id: number;
  bookingId: number;
  amount: number;
  currency: string;
  paymentType: "down_payment" | "remaining_payment" | "full_payment";
  paymentMethod: string;
  status: "pending" | "completed" | "failed" | "refunded";
  receiptUrl: string | null;
  createdAt: string;
  updatedAt: string;
  booking?: {
    id: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    bookingDate: string;
    bookingTime: string;
    totalAmount: number;
    downPayment: number;
    status: string;
  };
  bookingDetails?: {
    id: number;
    businessId: number;
    totalAmount: number;
    business?: { id: number; name: string };
  }[];
}

export interface ApiVendorPayout {
  id: number;
  bookingId: number;
  vendorId: number;
  businessId: number;
  originalAmount: number;
  platformFee: number;
  payoutAmount: number;
  status: "scheduled" | "completed" | "failed" | "hold";
  payoutMethod: string;
  scheduledDate: string;
  processedDate: string | null;
  createdAt: string;
  vendor?: { id: number; fullName: string; email: string };
  booking?: { id: number; customerName: string; bookingDate: string };
  business?: { id: number; name: string };
}

export class PaymentsAPI {
  static async getHistory(): Promise<ApiPaymentTransaction[]> {
    const res = await axiosInstance.get("/api/v1/payments/history");
    return res.data?.data ?? [];
  }

  static async getVendorPayouts(params?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{
    payouts: ApiVendorPayout[];
    summary: {
      total: number;
      totalAmount: number;
      totalFees: number;
    };
  }> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.dateFrom) qs.set("dateFrom", params.dateFrom);
    if (params?.dateTo) qs.set("dateTo", params.dateTo);
    const res = await axiosInstance.get(
      `/api/v1/payments/vendor-payouts?${qs.toString()}`,
    );
    return (
      res.data?.data ?? {
        payouts: [],
        summary: { total: 0, totalAmount: 0, totalFees: 0 },
      }
    );
  }

  static async getAllPayouts(params?: {
    status?: string;
    vendorId?: number;
    limit?: number;
    offset?: number;
  }): Promise<{
    payouts: ApiVendorPayout[];
    pagination: { total: number; limit: number; offset: number; pages: number };
    summary: { total: number; totalAmount: number; totalFees: number };
  }> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.vendorId) qs.set("vendorId", String(params.vendorId));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const res = await axiosInstance.get(
      `/api/v1/payments/all-payouts?${qs.toString()}`,
    );
    return res.data?.data;
  }

  static async getVendorRevenue(params?: {
    source?: 'offline' | 'online';
    dateFrom?: string;
    dateTo?: string;
  }): Promise<import('@/lib/dashboard-types').VendorRevenueResponse> {
    const qs = new URLSearchParams();
    if (params?.source)   qs.set('source',   params.source);
    if (params?.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params?.dateTo)   qs.set('dateTo',   params.dateTo);
    const res = await axiosInstance.get(`/api/v1/payments/vendor-revenue?${qs.toString()}`);
    const empty = { count: 0, total: 0, received: 0, due: 0 };
    return res.data?.data ?? { payments: [], stats: { offline: empty, online: empty, all: empty } };
  }
}

// ─── Reviews ──────────────────────────────────────────────────
export interface ApiReviewRow {
  id: string;
  reviewerName: string;
  email: string;
  phone: string;
  bookingId: string;
  rating: number;
  reviewText: string;
  businessName: string;
  status: string;
  createdAt: string;
}

export class ReviewsAPI {
  static async getAll(
    page = 1,
    limit = 20,
  ): Promise<{
    reviews: ApiReviewRow[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const res = await axiosInstance.get(
      `/api/v1/analytics/reviews?page=${page}&limit=${limit}`,
    );
    return (
      res.data?.data ?? {
        reviews: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }
    );
  }

  static async getBusinessReviews(businessId: number): Promise<{
    reviews: unknown[];
    averageRating: number | null;
    totalReviews: number;
  }> {
    const res = await axiosInstance.get(`/api/v1/reviews/${businessId}`);
    return res.data?.data;
  }

  static async delete(reviewId: number | string): Promise<void> {
    await axiosInstance.delete(`/api/v1/reviews/${reviewId}`);
  }

  // §M8 — pin / unpin a review (vendor showcases their best).
  static async togglePin(reviewId: number | string, isPinned?: boolean): Promise<{ id: number; isPinned: boolean }> {
    const res = await axiosInstance.patch(
      `/api/v1/reviews/${reviewId}/pin`,
      typeof isPinned === "boolean" ? { isPinned } : {},
    );
    return res.data?.data;
  }

  // BK-100.7 — customer submits a review for a specific business on a
  // specific booking. Backend gates to booking.status === 'Completed'
  // and enforces one review per (user, business, booking).
  static async submitReview(input: {
    businessId: number;
    bookingId: number;
    rating: number; // 1..5
    comment?: string;
  }): Promise<{ review: unknown }> {
    const res = await axiosInstance.post(`/api/v1/reviews`, input);
    return res.data?.data;
  }
}

// ─── Customers ────────────────────────────────────────────────
export interface ApiCustomer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  total_booking: number;
  last_booking: string;
  first_booking?: string;
}

export interface CustomerProfileBooking {
  id: number;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  bookingDate: string | null;
  bookingTime: string | null;
  status: string;
  paymentStatus: string | null;
  paymentMethod: string | null;
  totalAmount: number | string;
  downPayment: number | string;
  guestCount: number | null;
  bookingSource: string | null;
  specialRequests: string | null;
  createdAt: string;
}

export interface CustomerProfileSheet {
  id: number;
  title: string;
  state: string;
  eventDate: string | null;
  grandTotal: number | string;
  bookingId: number | null;
  customerName: string | null;
  createdAt: string;
}

export interface CustomerProfileLead {
  id: number;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  source: string;
  status: string;
  eventType: string | null;
  eventDate: string | null;
  bookingId: number | null;
  createdAt: string;
}

export interface CustomerProfileResponse {
  profile: {
    name: string | null;
    email: string | null;
    phone: string | null;
    address: string;
    offlineCustomerId: number | null;
    firstBookingAt: string | null;
    lastBookingAt: string | null;
  };
  stats: {
    totalBookings: number;
    completedBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    upcomingBookings: number;
    lifetimeRevenue: number;
    cancelledRevenue: number;
    avgTicketSize: number;
    repeatCustomer: boolean;
    daysSinceLastBooking: number | null;
    totalFunctionSheets: number;
    paidSheets: number;
    invoicedSheets: number;
    signedSheets: number;
    sheetRevenue: number;
    totalLeads: number;
    convertedLeads: number;
    lostLeads: number;
  };
  bookings: CustomerProfileBooking[];
  functionSheets: CustomerProfileSheet[];
  leads: CustomerProfileLead[];
}

// ─── Two-way rating (§26.4) — vendor rates the customer ────────────
// Back-channel signal stored on offlineCustomer.vendorRatingsJson.
// Each event is private to the vendor who wrote it. Server stamps
// id + ratedAt + ratedByUserId — the FE never spoofs them.
export type CustomerRatingFlag =
  | "advance_disputed"
  | "last_minute_cancel"
  | "rude_to_staff"
  | "harassed_staff"
  | "cheque_bounced"
  | "no_show"
  | "negotiated_at_event"
  | "scope_creep"
  | "ghosted"
  | "great_to_work_with"
  | "paid_on_time"
  | "premium_customer";
export interface CustomerRatingSubscores {
  paymentReliability?: number;        // 1-5
  communication?: number;             // 1-5
  expectations?: number;              // 1-5
  dayOfBehavior?: number;             // 1-5
}
export interface CustomerRating {
  id: string;
  ratedAt: string;                    // ISO
  ratedByUserId: number;
  bookingId?: number | null;
  overallStars: number;               // 1-5
  wouldBookAgain: boolean;
  flags: CustomerRatingFlag[];
  subscores?: CustomerRatingSubscores;
  notes?: string | null;
}
export interface CustomerRatingInput {
  overallStars: number;               // 1-5 (required)
  wouldBookAgain?: boolean;
  flags?: CustomerRatingFlag[];
  subscores?: CustomerRatingSubscores;
  notes?: string | null;
  bookingId?: number | null;
}
export interface CustomerRatingsResponse {
  ratings: CustomerRating[];
  allowedFlags: CustomerRatingFlag[];
}

// ─── Community trust (cross-vendor aggregate) ──────────────────────
// Anonymized signal from OTHER vendors who rated the same customer
// (matched by phone/email). k-anonymity ≥2 other vendors; never
// returns identities or notes. Vendor-only.
export interface CommunityTrustFlag {
  flag: CustomerRatingFlag;
  count: number;
}
export interface CommunityTrustData {
  hasData: boolean;
  reason?: "insufficient";
  raterVendorCount: number;
  threshold?: number;
  totalRatings?: number;
  avgStars?: number | null;
  wouldBookAgainPct?: number | null;
  flags?: CommunityTrustFlag[];
}

export class CommunityTrustAPI {
  /** GET /offlineCustomers/community-trust?phone=&email= */
  static async get(params: { phone?: string | null; email?: string | null }): Promise<CommunityTrustData | null> {
    const qs = new URLSearchParams();
    if (params.phone) qs.set("phone", params.phone);
    if (params.email) qs.set("email", params.email);
    if (qs.toString() === "") return null;
    try {
      const res = await axiosInstance.get(
        `/api/v1/offlineCustomers/community-trust?${qs.toString()}`,
      );
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  }
}

export class CustomerRatingsAPI {
  /** GET /offlineCustomers/:id/ratings — vendor-private list. */
  static async list(offlineCustomerId: number): Promise<CustomerRatingsResponse> {
    const res = await axiosInstance.get(
      `/api/v1/offlineCustomers/${offlineCustomerId}/ratings`,
    );
    return res.data?.data ?? { ratings: [], allowedFlags: [] };
  }

  /** POST /offlineCustomers/:id/ratings — append a rating event. */
  static async add(
    offlineCustomerId: number,
    body: CustomerRatingInput,
  ): Promise<CustomerRating> {
    const res = await axiosInstance.post(
      `/api/v1/offlineCustomers/${offlineCustomerId}/ratings`,
      body,
    );
    return res.data?.data?.rating;
  }

  /** DELETE /offlineCustomers/:id/ratings/:ratingId — remove your own event. */
  static async remove(
    offlineCustomerId: number,
    ratingId: string,
  ): Promise<void> {
    await axiosInstance.delete(
      `/api/v1/offlineCustomers/${offlineCustomerId}/ratings/${ratingId}`,
    );
  }
}

export class CustomersAPI {
  static async getAll(
    page = 1,
    limit = 20,
    search = "",
  ): Promise<{
    customers: ApiCustomer[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const qs = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) qs.set("search", search);
    const res = await axiosInstance.get(
      `/api/v1/analytics/customers?${qs.toString()}`,
    );
    return (
      res.data?.data ?? {
        customers: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }
    );
  }

  /**
   * Customer 360 — single-customer aggregate (bookings + function
   * sheets + leads + stats). The listing's `_id` is either the
   * customer's email or `offline_<id>`; pass it via the matching
   * query param.
   */
  static async getProfile(params: {
    email?: string;
    phone?: string;
    offlineId?: number;
  }): Promise<CustomerProfileResponse | null> {
    const qs = new URLSearchParams();
    if (params.email) qs.set("email", params.email);
    if (params.phone) qs.set("phone", params.phone);
    if (params.offlineId != null) qs.set("offlineId", String(params.offlineId));
    if (qs.toString() === "") return null;
    const res = await axiosInstance.get(
      `/api/v1/analytics/customers/profile?${qs.toString()}`,
    );
    return res.data?.data ?? null;
  }

  /**
   * Unified communication timeline — every touchpoint with one customer
   * (enquiry, booking, status changes, WhatsApp sends, smart files,
   * reviews) merged into one reverse-chronological feed.
   */
  static async getTimeline(params: {
    email?: string;
    phone?: string;
    offlineId?: number;
  }): Promise<CustomerTimelineResponse | null> {
    const qs = new URLSearchParams();
    if (params.email) qs.set("email", params.email);
    if (params.phone) qs.set("phone", params.phone);
    if (params.offlineId != null) qs.set("offlineId", String(params.offlineId));
    if (qs.toString() === "") return null;
    try {
      const res = await axiosInstance.get(
        `/api/v1/analytics/customers/timeline?${qs.toString()}`,
      );
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  }
}

// ─── Customer communication timeline ──────────────────────────────
export type CustomerTimelineEventType =
  | "booking_created"
  | "lead_created"
  | "lead_responded"
  | "sheet_created"
  | "status_change"
  | "whatsapp"
  | "review"
  | "vendor_reply";

export interface CustomerTimelineEvent {
  type: CustomerTimelineEventType;
  at: string; // ISO
  title: string;
  detail: string | null;
  bookingId?: number | null;
  leadId?: number | null;
  sheetId?: number | null;
  actorRole?: string;
  rating?: number | null;
  amount?: number | null;
}

export interface CustomerTimelineResponse {
  customer: {
    name: string | null;
    email: string | null;
    phone: string | null;
    offlineCustomerId: number | null;
  };
  events: CustomerTimelineEvent[];
  counts: Partial<Record<CustomerTimelineEventType, number>>;
  totalEvents: number;
  generatedAt: string;
}

// ─── Bookings ────────────────────────────────────────────────
export interface CreateBookingVendor {
  businessId: number;
  packageId?: number | null;
  menuId?: number | null;
  vehicleQuantity?: number;
  totalAmount: number;
  downPayment: number;
  specialRequests?: string | null;
}

export interface CreateBookingPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: string;
  bookingTime: string;
  guestCount?: number;
  vendors: CreateBookingVendor[];
  isOfflineBooking?: boolean;
}

export type PaymentType = "down_payment" | "remaining" | "full_payment";

export interface BulkImportBookingRow {
  customerName: string;
  customerPhone: string;
  bookingDate: string;          // YYYY-MM-DD or DD/MM/YYYY (BE forgives both)
  totalAmount: number | string;
  customerEmail?: string;
  bookingTime?: string;          // HH:MM (default 00:00)
  downPayment?: number | string;
  paymentStatus?: "Paid" | "Partial" | "Pending";
  guestCount?: number | string;
  eventCity?: string;
  notes?: string;
}
export interface BulkImportBookingsResponse {
  imported: number;
  failed: number;
  skipped: number;
  errors: string[];
  dryRun: boolean;
  businessId: number;
  businessName: string;
}

export class BookingsAPI {
  static async create(data: CreateBookingPayload) {
    const res = await axiosInstance.post("/api/v1/bookings", data);
    return res.data;
  }

  /**
   * Bulk import historical bookings (Excel/register backfill).
   * Server creates Booking rows with status="Completed", paymentStatus=
   * "Paid" (overridable per row), bookingSource="offline". Bypasses
   * past-date + lead-time validation. Soft cap 200 rows/request.
   */
  static async bulkImport(
    rows: BulkImportBookingRow[],
    businessId: number,
    dryRun: boolean,
  ): Promise<BulkImportBookingsResponse> {
    const res = await axiosInstance.post("/api/v1/bookings/bulk-import", {
      rows, businessId, dryRun,
    });
    return res.data?.data;
  }

  static async recordPayment(
    id: number,
    paymentType: PaymentType,
    paymentMethod: string,
  ) {
    const res = await axiosInstance.patch(
      `/api/v1/bookings/${id}/record-payment`,
      {
        paymentType,
        paymentMethod,
      },
    );
    return res.data;
  }

  static async cancel(id: number, reason?: string): Promise<void> {
    await axiosInstance.patch(`/api/v1/bookings/${id}/cancel`, { reason });
  }
}

// ─── Packages ─────────────────────────────────────────────────
export type PackageFeatures = string[] | Record<string, unknown> | null;

export interface ApiPackage {
  id: number;
  name: string;
  description: string | null;
  price: number;
  features: PackageFeatures;
  images: string[] | null;
  businessId: number;
  createdAt: string;
  updatedAt: string;
  business?: { id: number; name: string };
}

export class PackagesAPI {
  static async getAll(businessId?: number): Promise<ApiPackage[]> {
    const qs = businessId ? `?businessId=${businessId}` : "";
    const res = await axiosInstance.get(`/api/v1/packages${qs}`);
    return res.data?.data?.results ?? [];
  }

  static async create(data: {
    name: string;
    description?: string;
    price: number;
    features?: PackageFeatures;
    images?: string[];
    businessId: number;
  }): Promise<ApiPackage> {
    const res = await axiosInstance.post(
      "/api/v1/packages/single-package",
      data,
    );
    return res.data?.data;
  }

  static async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      price?: number;
      features?: PackageFeatures;
      images?: string[];
      businessId: number;
    },
  ): Promise<ApiPackage> {
    const res = await axiosInstance.patch(`/api/v1/packages/${id}`, data);
    return res.data?.data;
  }

  static async uploadImages(files: File[], businessId: number): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    const res = await axiosInstance.post(
      `/api/v1/businesses/upload-images?businessId=${businessId}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data?.data ?? [];
  }

  static async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/packages/${id}`);
  }
}

// ─── Menus ────────────────────────────────────────────────────
export interface ApiMenu {
  id: number;
  title: string;
  price: number;
  data: Record<string, unknown> | null;
  businessId: number;
  createdAt: string;
  updatedAt: string;
  business?: { id: number; name: string };
}

export class MenusAPI {
  static async getAll(businessId?: number): Promise<ApiMenu[]> {
    const qs = businessId ? `?businessId=${businessId}` : "";
    const res = await axiosInstance.get(`/api/v1/menus${qs}`);
    const payload = res.data?.data;
    // Backend wraps paginated results as { data: rows[], meta: {...} }
    return Array.isArray(payload) ? payload : (payload?.data ?? []);
  }

  static async create(data: {
    title: string;
    price: number;
    businessId: number;
    data?: Record<string, unknown>;
  }): Promise<ApiMenu> {
    const res = await axiosInstance.post("/api/v1/menus/single-menu", data);
    return res.data?.data;
  }

  static async update(
    id: number,
    data: { title?: string; price?: number; businessId?: number; data?: Record<string, unknown> },
  ): Promise<ApiMenu> {
    const res = await axiosInstance.patch(`/api/v1/menus/${id}`, data);
    return res.data?.data;
  }

  static async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/menus/${id}`);
  }
}

// ─── Vendor Blocked Dates ─────────────────────────────────────

export interface BlockedDate {
  id: number;
  businessId: number;
  blockedDate: string; // "YYYY-MM-DD"
  reason: string | null;
}

export class BlockedDatesAPI {
  static async getAll(month?: string): Promise<BlockedDate[]> {
    const params = month ? { month } : {};
    const res = await axiosInstance.get("/api/v1/bookings/blocked-dates", { params });
    return res.data?.data?.blockedDates ?? [];
  }

  static async block(blockedDate: string, reason?: string): Promise<BlockedDate[]> {
    const res = await axiosInstance.post("/api/v1/bookings/blocked-dates", {
      blockedDate,
      reason: reason || null,
    });
    return res.data?.data?.blockedDates ?? [];
  }

  static async unblock(date: string): Promise<void> {
    await axiosInstance.delete(`/api/v1/bookings/blocked-dates/${date}`);
  }
}
