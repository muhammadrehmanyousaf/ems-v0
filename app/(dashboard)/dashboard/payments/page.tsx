import { PaymentsRedesignedView } from "@/components/dashboard/mainScreens/payments/redesigned/payments-redesigned-view";
import { Metadata } from 'next';
export const metadata: Metadata = {
    title: 'Dashboard : Payments',
    description: 'Basic dashboard with Next.js and Shadcn'
};

const page = () => {
  return <PaymentsRedesignedView />
}

export default page
