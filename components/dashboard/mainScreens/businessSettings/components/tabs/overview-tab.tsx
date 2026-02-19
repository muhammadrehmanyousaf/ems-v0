import React from 'react'
import BasicDetailsCard from '../subComponents/basic-details-card'
import AdditionalInfoCard from '../subComponents/additional-info-card'
import { ApiBusiness } from '@/lib/api/dashboard'

interface OverviewTabProps {
    business: ApiBusiness;
}

const OverviewTab = ({ business }: OverviewTabProps) => {
    return (
        <div className='space-y-5'>
            <BasicDetailsCard business={business} />
            <div>
                <AdditionalInfoCard business={business} />
            </div>
        </div>
    )
}

export default OverviewTab
