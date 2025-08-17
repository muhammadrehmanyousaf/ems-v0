import PaymentsView from '@/components/dashboard/mainScreens/payments/payments-view';
import { Metadata } from 'next';
import React from 'react'

export const metadata: Metadata = {
    title: 'Dashboard : Payments',
    description: 'Basic dashboard with Next.js and Shadcn'
};

const page = () => {
    return (<PaymentsView/>)
}

export default page
