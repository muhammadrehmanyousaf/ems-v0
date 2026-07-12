import { Metadata } from "next"
import { CustomerQuotesView } from "@/components/user-dashboard/quotes/customer-quotes-view"

export const metadata: Metadata = {
  title: "My quotes",
  description: "Prices you've requested from vendors — accept, counter, or decline.",
}

export default function Page() {
  return <CustomerQuotesView />
}
