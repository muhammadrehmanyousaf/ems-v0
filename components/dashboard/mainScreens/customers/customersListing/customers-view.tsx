'use client';

import React, { useCallback, useRef } from 'react'
import PageContainer from '@/components/dashboard/layout/page-container'
import { Heading } from '@/components/heading'
import { Separator } from '@/components/ui/separator'
import CustomersTable from './components/customers-table'
import CreationsButtons from './components/creations-buttons'

const CustomersView = () => {
    const refreshRef = useRef<() => void>(() => {});

    return (
        <div>
            <PageContainer>
                <div className="space-y-4">
                    <div className='w-full flex items-center justify-between'>
                        <Heading
                            title='Customers'
                        />
                        <CreationsButtons onCustomerAdded={() => refreshRef.current()} />
                    </div>
                    <Separator />
                    <CustomersTable onRefreshReady={(fn) => { refreshRef.current = fn; }} />
                </div>
            </PageContainer>
        </div>
    )
}

export default CustomersView
