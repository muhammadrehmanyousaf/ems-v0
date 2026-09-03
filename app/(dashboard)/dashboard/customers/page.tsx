import { CustomersArtifact } from "@/components/dashboard/mainScreens/customers/artifact/customers-artifact";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Dashboard : Customers',
  description: 'Your customer book — bookings, repeat customers and contact.'
};

export default function CustomersPage() {
  return <CustomersArtifact />
}

