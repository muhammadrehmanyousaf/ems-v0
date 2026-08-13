import React from 'react'
import { Icon } from '@/components/dashboard/shared/icon'
import { Heading } from '@/components/heading'
import { Separator } from '@/components/ui/separator'
import ReviewsTable from './components/reviews-table'
import PageContainer from '@/components/dashboard/layout/page-container'
// Phase 4 #10.2 — surfaces the review-automation cron's activity.
import { ReviewAutomationStatsCard } from '../automation-stats-card'
// Phase 5 — AI sentiment summary card.
import { AiReviewSummaryCard } from '../ai-review-summary-card'
// §M8 — reputation dashboard panel (avg vs peers, trend, shareable review).
import ReputationPanel from '../reputation-panel'

const ReviewsListingView = () => {
    return (
        <div>
            <PageContainer>
                <div className='space-y-4'>
                    <Heading
                        title="Reviews"
                    />
                    <Separator/>
                    {/**
                      * The reviews come first; the analytics fold away.
                      *
                      * Measured at 1366×674: the Reputation panel alone is
                      * 476px — the whole viewport — and with the two cards
                      * under it the first actual review landed at 1310. A
                      * vendor opening Reviews wants to read what a family
                      * wrote about them, and had to scroll past two screens of
                      * their own averages to reach it.
                      *
                      * Same collapsed-summary pattern the overview already uses
                      * for "Did each shaadi make money?", so this is a pattern
                      * the product already has rather than a new idea.
                      */}
                    <ReviewsTable/>
                    <details className="group rounded-xl border border-border bg-card">
                        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium">
                            <Icon
                                name="ChevronRight"
                                size={16}
                                className="shrink-0 text-muted-foreground transition-transform group-open:rotate-90"
                            />
                            Reputation &amp; automation
                            <span className="font-normal text-muted-foreground">
                                · your rating, how it trends, and how you compare
                            </span>
                        </summary>
                        <div className="space-y-4 border-t border-border p-4">
                            <ReputationPanel />
                            <ReviewAutomationStatsCard />
                            <AiReviewSummaryCard />
                        </div>
                    </details>
                </div>
            </PageContainer>
        </div>
    )
}

export default ReviewsListingView
