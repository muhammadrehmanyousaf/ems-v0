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
    await axiosInstance.patch(`/api/v1/users/change-status?id=${id}&active=${active}`);
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
    return res.data?.data ?? [];
  }

  static async getById(id: number): Promise<ApiUser> {
    const res = await axiosInstance.get(`/api/v1/vendors/${id}`);
    return res.data?.data;
  }

  static async changeProfileStatus(
    id: number,
    reviewProfile: boolean
  ): Promise<void> {
    await axiosInstance.patch(
      `/api/v1/users/vendor-profile-update?id=${id}&reviewProfile=${reviewProfile}`
    );
  }
}

// ─── Businesses ───────────────────────────────────────────────
export interface ApiBusiness {
  id: number;
  userId: number;
  name: string;
  city: string | null;
  subArea: string | null;
  description: string | null;
  additionalInfo: string | null;
  minimumPrice: number | null;
  starterPrice: number | null;
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
    limit = 20
  ): Promise<{
    data: ApiBusiness[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const res = await axiosInstance.get(
      `/api/v1/businesses?page=${page}&limit=${limit}`
    );
    return res.data?.data ?? { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
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
    data: Partial<ApiBusiness>
  ): Promise<ApiBusiness> {
    const res = await axiosInstance.patch(
      `/api/v1/businesses/user-business/${id}`,
      data
    );
    return res.data?.data;
  }

  static async uploadImages(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    const res = await axiosInstance.post(
      "/api/v1/businesses/upload-images",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data?.data ?? [];
  }

  static async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/businesses/${id}`);
  }
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
    data: { name?: string; description?: string; type?: string }
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
      `/api/v1/payments/vendor-payouts?${qs.toString()}`
    );
    return res.data?.data ?? { payouts: [], summary: { total: 0, totalAmount: 0, totalFees: 0 } };
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
      `/api/v1/payments/all-payouts?${qs.toString()}`
    );
    return res.data?.data;
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
    limit = 20
  ): Promise<{
    reviews: ApiReviewRow[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const res = await axiosInstance.get(
      `/api/v1/analytics/reviews?page=${page}&limit=${limit}`
    );
    return res.data?.data ?? { reviews: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
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

export class CustomersAPI {
  static async getAll(
    page = 1,
    limit = 20,
    search = ""
  ): Promise<{
    customers: ApiCustomer[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const qs = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search) qs.set("search", search);
    const res = await axiosInstance.get(
      `/api/v1/analytics/customers?${qs.toString()}`
    );
    return res.data?.data ?? { customers: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }
}

// ─── Bookings ────────────────────────────────────────────────
export interface CreateBookingVendor {
  businessId: number;
  packageId?: number | null;
  menuId?: number | null;
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
}

export type PaymentType = 'down_payment' | 'remaining' | 'full_payment';

export class BookingsAPI {
  static async create(data: CreateBookingPayload) {
    const res = await axiosInstance.post('/api/v1/bookings', data);
    return res.data;
  }

  static async recordPayment(id: number, paymentType: PaymentType, paymentMethod: string) {
    const res = await axiosInstance.patch(`/api/v1/bookings/${id}/record-payment`, {
      paymentType,
      paymentMethod,
    });
    return res.data;
  }

  static async cancel(id: number, reason?: string): Promise<void> {
    await axiosInstance.patch(`/api/v1/bookings/${id}/cancel`, { reason });
  }
}

// ─── Packages ─────────────────────────────────────────────────
export interface ApiPackage {
  id: number;
  name: string;
  description: string | null;
  price: number;
  features: string[] | null;
  businessId: number;
  createdAt: string;
  updatedAt: string;
  business?: { id: number; name: string };
}

export class PackagesAPI {
  static async getAll(businessId?: number): Promise<ApiPackage[]> {
    const qs = businessId ? `?businessId=${businessId}` : "";
    const res = await axiosInstance.get(`/api/v1/packages${qs}`);
    return res.data?.data ?? [];
  }

  static async create(data: {
    name: string;
    description?: string;
    price: number;
    features?: string[];
    businessId: number;
  }): Promise<ApiPackage> {
    const res = await axiosInstance.post("/api/v1/packages/single-package", data);
    return res.data?.data;
  }

  static async update(
    id: number,
    data: { name?: string; price?: number; features?: string[]; businessId: number }
  ): Promise<ApiPackage> {
    const res = await axiosInstance.patch(`/api/v1/packages/${id}`, data);
    return res.data?.data;
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
    return res.data?.data ?? [];
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
    data: { title?: string; price?: number; data?: Record<string, unknown> }
  ): Promise<ApiMenu> {
    const res = await axiosInstance.patch(`/api/v1/menus/${id}`, data);
    return res.data?.data;
  }

  static async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/menus/${id}`);
  }
}
