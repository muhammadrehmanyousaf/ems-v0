import PageContainer from '@/components/dashboard/layout/page-container'
import { Heading } from '@/components/heading'
import { Separator } from '@/components/ui/separator'
import React from 'react'
import BusinessTable from './components/business-table'

const BusinessListingView = () => {
    return (
        <div>
            <PageContainer>
                <div className='space-y-4'>
                    <Heading
                        title="Businesses"
                    />
                    <Separator/>
                    <BusinessTable/>
                </div>
            </PageContainer>
        </div>
    )
}

export default BusinessListingView
