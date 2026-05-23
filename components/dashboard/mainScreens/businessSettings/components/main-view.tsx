'use client'
import { useSearchParams } from 'next/navigation';
import OverviewTab from './tabs/overview-tab';
import { ScrollArea } from '@/components/ui/scroll-area';
import BasicInfoTab from './tabs/basic-info-tab';
import ImagesTab from './tabs/images-tab';
import PackagesTab from './tabs/packages-tab';
import MenusTab from './tabs/menus-tab';
import TypeSpecificTab from './tabs/type-specific-tab';
// Phase 0 #2 — Bank details admin tab. Backend was always live;
// this is the missing UI surface that lets vendors register a
// payout target.
import BankDetailsTab from './tabs/bank-details-tab';
// Phase 0 #6.7 — Team members admin tab (VR-050.15).
import TeamMembersTab from './tabs/team-members-tab';
// Phase 0 #6.2 + #6.3 + #6.4 — Availability tab (slot templates +
// recurring closed days + per-date capacity overrides).
import AvailabilityTab from './tabs/availability-tab';
import VenueComplianceCard from './subComponents/venue-compliance-card';

// Venue compliance pack — flag-gated rollout (default OFF = no UI change).
const VENUE_COMPLIANCE_ENABLED = process.env.NEXT_PUBLIC_VENUE_COMPLIANCE === '1';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/context/UserContext';
import { useBusiness } from '@/context/BusinessContext';
import { getVendorTypeConfig, DEFAULT_VENDOR_CONFIG } from '@/lib/vendor-type-config';

const MainView = () => {
    const searchParams = useSearchParams();
    const active = searchParams?.get('tab') || 'overview';
    const { user } = useUser();
    const { business, loading, refreshBusiness } = useBusiness();
    const vendorConfig = getVendorTypeConfig(user?.vendorType);

    const onSuccess = () => refreshBusiness(true);

    const hasPackages = vendorConfig?.hasPackages ?? DEFAULT_VENDOR_CONFIG.hasPackages;
    const hasMenus = vendorConfig?.hasMenus ?? DEFAULT_VENDOR_CONFIG.hasMenus;

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-[400px] w-full rounded-lg" />
            </div>
        );
    }

    if (!business) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <h3 className="text-lg font-semibold">No business found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    You don&apos;t have any businesses yet. Create one to get started.
                </p>
            </div>
        );
    }

    return (
        <ScrollArea className='h-[calc(100dvh-200px)]'>
            <div className='pt-1 pb-1'>
                {active === 'overview' && <OverviewTab business={business} />}
                {active === 'basic' && <BasicInfoTab business={business} onSuccess={onSuccess} />}
                {active === 'images' && <ImagesTab business={business} onSuccess={onSuccess} />}
                {active === 'fleet' && (
                    <PackagesTab business={business} onSuccess={onSuccess} mode="fleet" />
                )}
                {active === 'packages' && hasPackages && (
                    <PackagesTab business={business} onSuccess={onSuccess} mode="packages" />
                )}
                {active === 'menus' && hasMenus && (
                    <MenusTab business={business} onSuccess={onSuccess} />
                )}
                {active === 'type-specific' && vendorConfig && (
                    <TypeSpecificTab business={business} config={vendorConfig} onSuccess={onSuccess} />
                )}
                {active === 'bank-details' && <BankDetailsTab />}
                {active === 'team' && <TeamMembersTab />}
                {active === 'availability' && (
                    <>
                        {VENUE_COMPLIANCE_ENABLED && user?.vendorType === 'Wedding venue' && (
                            <VenueComplianceCard />
                        )}
                        <AvailabilityTab />
                    </>
                )}
            </div>
        </ScrollArea>
    )
}

export default MainView
