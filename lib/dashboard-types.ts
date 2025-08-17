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
