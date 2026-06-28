import PaymentsView from '@/components/dashboard/mainScreens/payments/payments-view';
import { isRedesignOn } from "@/lib/dashboard-redesign-flag";
import { PaymentsRedesignedView } from "@/components/dashboard/mainScreens/payments/redesigned/payments-redesigned-view";
import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Dashboard : Payments',
    description: 'Basic dashboard with Next.js and Shadcn'
};

const page = () => {
    if (isRedesignOn()) return <PaymentsRedesignedView />;
    return (<PaymentsView/>)
}

export default page
