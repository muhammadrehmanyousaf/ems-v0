'use client'
import React from 'react'
import Link from 'next/link'
import BasicDetailsCard from '../subComponents/basic-details-card'
import AdditionalInfoCard from '../subComponents/additional-info-card'
import { ApiBusiness } from '@/lib/api/dashboard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Edit, Images, Package, Settings2, CreditCard, Users, CalendarClock } from 'lucide-react'

interface OverviewTabProps {
    business: ApiBusiness;
}

const quickLinks = [
    { label: 'Edit Info', tab: 'basic', icon: Edit, description: 'Update business name, location & pricing' },
    { label: 'Images', tab: 'images', icon: Images, description: 'Manage your portfolio photos' },
    { label: 'Packages', tab: 'packages', icon: Package, description: 'Create & edit service packages' },
    { label: 'Details', tab: 'type-specific', icon: Settings2, description: 'Configure type-specific settings' },
    // Phase 0 #2 — payout target.
    { label: 'Bank Details', tab: 'bank-details', icon: CreditCard, description: 'Where payouts land — required for online bookings' },
    // Phase 0 #6.7 — team roster.
    { label: 'Team', tab: 'team', icon: Users, description: 'Lead artist, associates, crew — who customers will meet' },
    // Phase 0 #6.2 + #6.3 + #6.4 — booking-engine availability config.
    { label: 'Availability', tab: 'availability', icon: CalendarClock, description: 'Slot templates, recurring closures, date overrides' },
]

const OverviewTab = ({ business }: OverviewTabProps) => {
    const imageCount = business.images?.length ?? 0
    const packageCount = business.packages?.length ?? 0

    return (
        <div className='space-y-5'>
            {/* Status bar */}
            <div className='flex items-center gap-2 flex-wrap'>
                <Badge variant={imageCount > 0 ? 'default' : 'secondary'} className='text-xs'>
                    {imageCount} {imageCount === 1 ? 'Image' : 'Images'}
                </Badge>
                <Badge variant={packageCount > 0 ? 'default' : 'secondary'} className='text-xs'>
                    {packageCount} {packageCount === 1 ? 'Package' : 'Packages'}
                </Badge>
                {business.minimumPrice && (
                    <Badge variant='outline' className='text-xs text-primary border-primary/30 bg-primary/5'>
                        From Rs. {business.minimumPrice.toLocaleString()}
                    </Badge>
                )}
            </div>

            {/* Quick navigation cards */}
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3'>
                {quickLinks.map(({ label, tab, icon: Icon, description }) => (
                    <Link key={tab} href={`/dashboard/settings?tab=${tab}`}>
                        <Card className='hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer h-full group'>
                            <CardContent className='p-3 flex flex-col gap-1.5'>
                                <div className='flex items-center gap-2'>
                                    <Icon className='size-4 text-primary shrink-0' />
                                    <span className='text-sm font-medium group-hover:text-primary transition-colors'>{label}</span>
                                </div>
                                <p className='text-xs text-muted-foreground leading-tight'>{description}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Main content */}
            <BasicDetailsCard business={business} />
            <AdditionalInfoCard business={business} />
        </div>
    )
}

export default OverviewTab
