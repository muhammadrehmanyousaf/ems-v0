import { CustomersRedesignedView } from "@/components/dashboard/mainScreens/customers/redesigned/customers-redesigned-view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Dashboard : Customers',
  description: 'Basic dashboard with Next.js and Shadcn'
};


export default function CustomersPage() {
  return <CustomersRedesignedView />
}

