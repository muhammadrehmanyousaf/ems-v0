import React from 'react'
import BasicDetailsCard from '../subComponents/basic-details-card'
import { Label } from '@/components/ui/label'
import AdditionalInfoCard from '../subComponents/additional-info-card'


const OverviewTab = () => {
    return (
        <div className='space-y-5'>
            <BasicDetailsCard />
            <div className=''>
                <AdditionalInfoCard/>
            </div>
        </div>
    )
}

export default OverviewTab
