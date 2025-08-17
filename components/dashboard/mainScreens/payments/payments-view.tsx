'use client'
import React from 'react'
import PageContainer from '../../layout/page-container'
import { Heading } from '@/components/heading'
import PaymentsTable from './components/payments-table'
import { Separator } from '@/components/ui/separator'

const PaymentsView = () => {
    return (
        <div>
            <PageContainer>
                <div className='space-y-4'>
                    <Heading
                        title="Payments"
                    />
                    <Separator/>
                    <PaymentsTable />
                </div>
            </PageContainer>
        </div>
    )
}

export default PaymentsView
