import CustomersView from "@/components/dashboard/mainScreens/customers/customersListing/customers-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Dashboard : Customers',
  description: 'Basic dashboard with Next.js and Shadcn'
};


export default function CustomersPage() {

  return (
    <div>
      <CustomersView />
    </div>
  )
}

