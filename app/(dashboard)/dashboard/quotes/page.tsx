import { Metadata } from "next"
import { QuotesArtifact } from "@/components/dashboard/mainScreens/quotes/artifact/quotes-artifact"

export const metadata: Metadata = {
  title: "Dashboard : Quote requests",
  description: "Customer quote requests — send a price, counter, or accept.",
}

const page = () => <QuotesArtifact />
export default page
