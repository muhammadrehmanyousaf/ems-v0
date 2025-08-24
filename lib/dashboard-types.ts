// types/booking.ts
export type BookingStatus = "pending" | "confirmed" | "canceled"
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