'use client'
import React from 'react'
import TabsSection from './tabs/tabs-section'
import OverviewTab from './tabs/overview-tab';
import { ScrollArea } from '@/components/ui/scroll-area';
import BasicInfoTab from './tabs/basic-info-tab';

const MainView = () => {
    const [active, setActive] = React.useState('overview');
    return (
        <div>
            <TabsSection
                value={active}
                onValueChange={setActive}
                tabs={[
                    { id: 'overview', label: 'Overview' },
                    { id: 'basic', label: 'Basic Information' },
                    { id: 'images', label: 'Images', count: 12 },
                    { id: 'packages', label: 'Packages', count: 3 },
                    { id: 'menus', label: 'Menus', count: 6 },
                    { id: 'amenities', label: 'Amenities' },
                    { id: 'availability', label: 'Availability' },
                ]}
                defaultValue="overview"
            />
            <ScrollArea className='h-[calc(100dvh-200px)]'>
                <div className='pt-5 pb-1'>
                    {active === 'overview' && <OverviewTab />}
                    {active === 'basic' && <BasicInfoTab />}
                    {/*{active === 'images' && <Images />}
            {active === 'packages' && <Packages />}
            {active === 'menus' && <Menus />}
            {active === 'amenities' && <Amenities />}
            {active === 'availability' && <Availability />} */}
                </div>
            </ScrollArea>
        </div>
    )
}

export default MainView
