import { Metadata } from "next"
import { QuotesView } from "@/components/dashboard/mainScreens/quotes/quotes-view"

export const metadata: Metadata = {
  title: "Dashboard : Quote requests",
  description: "Customer quote requests — send a price, counter, or accept.",
}

const page = () => <QuotesView />

export default page
