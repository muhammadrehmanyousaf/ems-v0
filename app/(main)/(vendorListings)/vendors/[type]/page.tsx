import VendorSearch from '@/components/VendorSearch';
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
            <VendorSearch vendorType={vendorType} />
        </div>
    )
}

export default page