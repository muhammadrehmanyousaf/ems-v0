import PageContainer from '@/components/dashboard/layout/page-container'
import { Heading } from '@/components/heading'
import { Separator } from '@/components/ui/separator'
import React from 'react'
import RolesTable from './components/roles-table'

const RolesListingView = () => {
    return (
        <div>
            <PageContainer>
                <div className='space-y-4'>
                    <Heading
                        title="Roles"
                    />
                    <Separator/>
                    <RolesTable/>
                </div>
            </PageContainer>
        </div>
    )
}

export default RolesListingView
