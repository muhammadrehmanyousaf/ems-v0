import React from 'react'
import PageContainer from '@/components/dashboard/layout/page-container'
import { Heading } from '@/components/heading'
import { Separator } from '@/components/ui/separator'
import CustomersTable from './components/customers-table'
import CreationsButtons from './components/creations-buttons'

const CustomersView = () => {
    return (
        <div>
            <PageContainer>
                <div className="space-y-4">
                    <div className='w-full flex items-center justify-between'>
                        <Heading
                            title='Customers'
                        />
                        <CreationsButtons/>
                    </div>
                    <Separator />
                    <CustomersTable />
                </div>
            </PageContainer>
        </div>
    )
}

export default CustomersView
