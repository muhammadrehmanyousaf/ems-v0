import PageContainer from '@/components/dashboard/layout/page-container'
import { Heading } from '@/components/heading'
import { Separator } from '@/components/ui/separator'
import React from 'react'
import VendorsTable from './components/vendors-table'

const VendorListingView = () => {
  return (
    <div>
      <PageContainer>
        <div className='space-y-4'>
            <Heading
            title="Vendors"
            />
            <Separator/>
            <VendorsTable/>
        </div>
      </PageContainer>
    </div>
  )
}

export default VendorListingView
