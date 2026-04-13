'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation';
import OverviewTab from './tabs/overview-tab';
import { ScrollArea } from '@/components/ui/scroll-area';
import BasicInfoTab from './tabs/basic-info-tab';
import ImagesTab from './tabs/images-tab';
import PackagesTab from './tabs/packages-tab';
import MenusTab from './tabs/menus-tab';
import TypeSpecificTab from './tabs/type-specific-tab';
import { BusinessesAPI, type ApiBusiness } from '@/lib/api/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useUser } from '@/context/UserContext';
import { getVendorTypeConfig, DEFAULT_VENDOR_CONFIG } from '@/lib/vendor-type-config';

const MainView = () => {
    const searchParams = useSearchParams();
    const active = searchParams?.get('tab') || 'overview';
    const [business, setBusiness] = useState<ApiBusiness | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useUser();
    const vendorConfig = getVendorTypeConfig(user?.vendorType);

    const fetchBusiness = () => {
        setLoading(true);
        BusinessesAPI.getUserBusinesses()
            .then((businesses) => {
                if (businesses.length > 0) {
                    setBusiness(businesses[0]);
                }
            })
            .catch(() => { setBusiness(null); toast.error('Failed to load business settings'); })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchBusiness(); }, []);

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
                {active === 'basic' && <BasicInfoTab business={business} onSuccess={fetchBusiness} />}
                {active === 'images' && <ImagesTab business={business} onSuccess={fetchBusiness} />}
                {active === 'packages' && hasPackages && (
                    <PackagesTab business={business} onSuccess={fetchBusiness} />
                )}
                {active === 'menus' && hasMenus && (
                    <MenusTab business={business} onSuccess={fetchBusiness} />
                )}
                {active === 'type-specific' && vendorConfig && (
                    <TypeSpecificTab business={business} config={vendorConfig} onSuccess={fetchBusiness} />
                )}
            </div>
        </ScrollArea>
    )
}

export default MainView
