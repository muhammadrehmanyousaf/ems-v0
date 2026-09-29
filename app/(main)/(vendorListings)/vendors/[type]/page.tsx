import { ListingRoute } from '@/components/listing/listing-route';
import { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
    title: "Vendor Lists",
    description: "Find and book the best wedding vendors in your city",
}

const page = ({params}: {params:{type:string}}) => {
    const vendorType = params.type;

    return (
        <div>
            <ListingRoute vendorType={vendorType} />
        </div>
    )
}

export default page