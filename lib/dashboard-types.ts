// ─── Booking ──────────────────────────────────────────────────
export type BookingStatus = "Awaiting Payment" | "Pending" | "Completed" | "Cancelled" | "Confirmed";

export type Booking = {
  _id: string;
  name: string;
  phone: string;
  email: string;
  event_type: string;
  status: BookingStatus;
  date: string;
  createdAt?: string;
  updatedAt?: string;
};

// ─── Customers (aggregated from bookings) ─────────────────────
export type CustomersType = {
  _id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  total_booking: number;
  last_booking: string;
  createdAt?: string;
  updatedAt?: string;
};

// ─── Payment ──────────────────────────────────────────────────
export type PaymentStatus =
  | "Pending"
  | "Advance Paid"
  | "Fully Paid"
  | "Cancelled"
  | "Failed";

export type PaymentMethod =
  | "Bank Transfer"
  | "Credit Card"
  | "Debit Card"
  | "Cash"
  | "stripe"
  | null;

export interface Payment {
  paymentId: string;
  customerName: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  venue: string;
  guestsCount: number;
  packageSelected: string;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  currency: string;
  paymentStatus: string;
  paymentMethod: PaymentMethod;
  transactionId: string | null;
  invoiceId: string;
  orderId: string;
  paymentDate: string | null;
  dueDate: string;
  notes?: string;
}

// ─── Vendor Revenue Payment ───────────────────────────────────
export interface VendorPayment {
  bookingId:     number;
  customerName:  string;
  customerPhone: string;
  customerEmail: string | null;
  bookingDate:   string;
  bookingTime:   string;
  paymentStatus: string;
  status:        string;
  bookingSource: 'online' | 'offline';
  businessName:  string;
  totalAmount:   number;
  downPayment:   number;
  received:      number;
  due:           number;
}

export interface VendorRevenueStats {
  count:    number;
  total:    number;
  received: number;
  due:      number;
}

export interface VendorRevenueResponse {
  payments: VendorPayment[];
  stats: {
    offline: VendorRevenueStats;
    online:  VendorRevenueStats;
    all:     VendorRevenueStats;
  };
}

// ─── Review ───────────────────────────────────────────────────
export type ReviewStatus = "Published" | "Pending" | "Rejected";

export interface Review {
  id: string;
  reviewerName: string;
  email: string;
  phone: string;
  bookingId: string;
  rating: number;
  reviewText: string;
  businessName?: string;
  status: string;
  createdAt: string;
  vendorReply?: string;
  vendorReplyDate?: string;
  isPinned?: boolean;
}

// ─── User ─────────────────────────────────────────────────────
export type User = {
  id: number;
  fullName: string;
  email?: string;
  phoneNumber: string;
  active: boolean;
  isVendor: boolean;
  roles: { id: number; name: string }[];
  createdAt: string;
  updatedAt?: string;
};

// ─── Role ─────────────────────────────────────────────────────
export type Role = {
  id: string | number;
  name?: string;
  title?: string;
  description: string;
  type?: string;
  status?: "active" | "inActive";
  createdAt: string;
  users?: { id: number; fullName: string; isVendor: boolean }[];
};

// ─── Vendor ───────────────────────────────────────────────────
export type Vendor = {
  id: string | number;
  fullName: string;
  email: string;
  phoneNumber: string;
  vendorType?: string;
  businessType?: string;
  BusinessName?: string;
  status: string;
  active?: boolean;
  reviewProfile?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// ─── Business ─────────────────────────────────────────────────
export type Business = {
  id: string | number;
  name: string;
  type?: string;
  city?: string;
  subArea?: string;
  total_packages?: number;
  vendorName?: string;
  vendorType?: string;
  createdAt?: string;
  updatedAt?: string;
};

// ─── Menu ─────────────────────────────────────────────────────
export interface Menu {
  id: number;
  title: string;
  price: number;
  data: Record<string, unknown>;
}

// ─── Package ──────────────────────────────────────────────────
export interface Package {
  id: number;
  name: string;
  description?: string;
  price: number;
  features: string[];
  businessId: number;
}

// ─── Booking Detail ───────────────────────────────────────────
export interface BookingDetail {
  id: number;
  bookingId: number;
  businessId: number;
  menuId: number;
  packageId: number;
  totalAmount: number;
  downPayment: number;
  specialRequests: string | null;
  additionalRequests: string | null;
  business: Business;
  menu: Menu;
  package: Package;
  createdAt: string;
  updatedAt: string;
}

// ─── Full Booking Data ────────────────────────────────────────
export interface BookingData {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: string;
  bookingTime: string;
  status: BookingStatus;
  paymentStatus: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  downPayment: number;
  guestCount: number | null;
  specialRequests: string | null;
  additionalRequests: string | null;
  cancellationReason: string | null;
  vendorIds: number[];
  bookingSource: 'online' | 'offline';
  createdAt: string;
  updatedAt: string;
  bookingDetails: BookingDetail[];
  // BK-100.53 — Service-location mode + address + notes. NULL on
  // legacy bookings; vendor detail sheet renders the section only
  // when set.
  serviceLocationMode?:
    | 'at_vendor'
    | 'at_customer_home'
    | 'at_customer_plot'
    | 'at_third_party'
    | null;
  serviceLocationAddress?: string | null;
  serviceLocationNotes?: string | null;
}

export interface BookingListResponse {
  data: Booking[];
  filters: {
    total: number;
  };
}
