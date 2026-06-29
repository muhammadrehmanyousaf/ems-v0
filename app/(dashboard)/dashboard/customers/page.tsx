import CustomersView from "@/components/dashboard/mainScreens/customers/customersListing/customers-view";
import { isRedesignOn } from "@/lib/dashboard-redesign-flag";
import { CustomersRedesignedView } from "@/components/dashboard/mainScreens/customers/redesigned/customers-redesigned-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Dashboard : Customers',
  description: 'Basic dashboard with Next.js and Shadcn'
};


export default function CustomersPage() {

  if (isRedesignOn()) return <CustomersRedesignedView />;

  return (
    <div>
      <CustomersView />
    </div>
  )
}

