import { BookingsRedesignedView } from "@/components/dashboard/mainScreens/bookings/redesigned/bookings-redesigned-view"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard : Bookings (redesigned)" }

export default function Page() {
  return <BookingsRedesignedView />
}
