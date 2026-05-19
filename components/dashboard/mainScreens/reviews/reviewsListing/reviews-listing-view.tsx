import React from 'react'
import { Heading } from '@/components/heading'
import { Separator } from '@/components/ui/separator'
import ReviewsTable from './components/reviews-table'
import PageContainer from '@/components/dashboard/layout/page-container'
// Phase 4 #10.2 — surfaces the review-automation cron's activity.
import { ReviewAutomationStatsCard } from '../automation-stats-card'

const ReviewsListingView = () => {
    return (
        <div>
            <PageContainer>
                <div className='space-y-4'>
                    <Heading
                        title="Reviews"
                    />
                    <Separator/>
                    <ReviewAutomationStatsCard />
                    <ReviewsTable/>
                </div>
            </PageContainer>
        </div>
    )
}

export default ReviewsListingView
