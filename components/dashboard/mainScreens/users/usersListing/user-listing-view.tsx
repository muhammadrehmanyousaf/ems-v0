'use client';

import PageContainer from '@/components/dashboard/layout/page-container'
import { Heading } from '@/components/heading'
import { Separator } from '@/components/ui/separator'
import React, { useState } from 'react'
import UserTable from './components/user-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

const UserListingView = () => {
    const [openCreate, setOpenCreate] = useState(false);

    return (
        <div>
            <PageContainer>
                <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <Heading title="Users" />
                        <Button className='gap-2' onClick={() => setOpenCreate(true)}>
                            <Plus className='size-4' />
                            Add New
                        </Button>
                    </div>
                    <Separator />
                    <UserTable
                        openCreate={openCreate}
                        onCreateClose={() => setOpenCreate(false)}
                    />
                </div>
            </PageContainer>
        </div>
    )
}

export default UserListingView
