import React, { Suspense } from 'react'
import PageContainer from '../../layout/page-container'
import { Heading } from '@/components/heading'
import { Separator } from '@/components/ui/separator'
import MainView from './components/main-view'
import { Skeleton } from '@/components/ui/skeleton'

const BusinessSettingsView = () => {
    return (
        <div>
            <PageContainer>
                <div className='space-y-4'>
                    <Heading
                        title="Business Settings"
                    />
                    <Separator />
                    <Suspense fallback={
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-[400px] w-full rounded-lg" />
                        </div>
                    }>
                        <MainView />
                    </Suspense>
                </div>
            </PageContainer>
        </div>
    )
}

export default BusinessSettingsView
