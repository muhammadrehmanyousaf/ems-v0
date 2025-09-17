import React from 'react'
import PageContainer from '../../layout/page-container'
import { Heading } from '@/components/heading'
import { Separator } from '@/components/ui/separator'
import MainView from './components/main-view'

const BusinessSettingsView = () => {
    return (
        <div>
            <PageContainer>
                <div className='space-y-4'>
                    <Heading
                        title="Business Settings"
                    />
                    <Separator />
                    <MainView />
                </div>
            </PageContainer>
        </div>
    )
}

export default BusinessSettingsView
