// types/booking.ts
export type BookingStatus = "Pending" | "Completed" | "Canceled" | "Confirmed"
export type EventType =
  | "demo"
  | "consultation"
  | "installation"
  | "support"
  | "follow_up"

export type Booking = {
  _id: string
  name: string
  phone: string
  email: string
  event_type: EventType
  status: BookingStatus
  /** ISO string, e.g. "2025-08-09T10:00:00.000Z" */
  date: string
  createdAt?: string
  updatedAt?: string
}

export type CustomersType = {
  _id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  total_booking: number;
  last_booking: string
  createdAt?: string
  updatedAt?: string
}

// types.ts

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
  | null;

export interface Payment {
  paymentId: string;
  customerName: string;
  email: string;
  phone: string;
  eventType: "Wedding" | "Birthday Party" | "Corporate Event" | "Other";
  eventDate: string; // ISO date string
  venue: string;
  guestsCount: number;
  packageSelected: string; // Silver, Gold, Platinum etc.
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId: string | null;
  invoiceId: string;
  orderId: string;
  paymentDate: string | null; // ISO string or null if not paid yet
  dueDate: string;
  notes?: string;
}

export type ReviewStatus = "Published" | "Pending" | "Rejected";

export interface Review {
  id: string;              // Unique review ID
  reviewerName: string;    // Full name of the reviewer
  email: string;           // Reviewer email
  phone: string;           // Reviewer phone number
  bookingId: string;       // Associated booking ID
  rating: number;          // Rating (1–5)
  reviewText: string;      // Written review
  status: ReviewStatus;    // Review status
  createdAt: string;       // Date/Time string (ISO or formatted)
}

export type UserRole = "Admin" | "Vendor" | "Manager";

export type User = {
  id: number;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  status: boolean;
  createdAt: string;
}

export type Role = {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'inActive';
  createdAt: string;
}

export type Vendor = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  businessType: string;
  BusinessName: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export type Business = {
  id: string;
  name: string;
  type: string;
  total_packages: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Menu {
  id: number;
  title: string;
  price: number;
  data: Record<string, unknown>; // or a specific shape if you have it
}

export interface Package {
  id: number;
  name: string;
  price: number;
  features: string[]; // adjust if not strictly string[]
}

// details row (the item inside bookingDetails[])
export interface BookingDetail {
  id: number;                // 44
  bookingId: number;         // 33
  businessId: number;        // 1
  menuId: number;            // 1
  packageId: number;         // 1

  totalAmount: number;       // 500
  downPayment: number;       // 20

  specialRequests: string | null;   // "Need vegetarian meal options"
  additionalRequests: string | null;

  // denormalized joins (present in your sample)
  business: Business;
  menu: Menu;
  package: Package;

  // audit
  createdAt: string;         // ISO
  updatedAt: string;         // ISO
}

// top-level booking row (what your table lists)
export interface BookingData {
  id: number;                       // 33
  customerName: string;             // "Michael Brown"
  customerEmail: string;            // "michaelbrown@gmail.com"
  customerPhone: string;            // "+9988776655"

  bookingDate: string;              // "2040-09-01T00:00:00.000Z"
  bookingTime: string;              // "14:00"  (keep string; don't lock to a literal)

  status: BookingStatus;            // "Pending"
  paymentStatus: PaymentStatus;     // "Pending"
  paymentMethod: PaymentMethod;     // null | method

  totalAmount: number;              // 1000
  downPayment: number;              // 40

  specialRequests: string | null;
  additionalRequests: string | null;
  cancellationReason: string | null;

  vendorIds: number[];              // [2,3]

  // audit
  createdAt: string;                // ISO
  updatedAt: string;                // ISO

  // nested
  bookingDetails: BookingDetail[];  // Array(1)
}

// common API list response shape
export interface BookingListResponse {
  data: Booking[];
  filters: {
    total: number;
    // add page, pageSize, etc., if your API returns them
  };
}