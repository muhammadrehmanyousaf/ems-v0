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
