import { PaymentsArtifact } from "@/components/dashboard/mainScreens/payments/artifact/payments-artifact"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard : Payments",
  description: "Billed vs received across your bookings, with the online and offline split.",
}

export default function Page() {
  return <PaymentsArtifact />
}
