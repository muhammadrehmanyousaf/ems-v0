import PageContainer from '@/components/dashboard/layout/page-container';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import DroneNocView from '@/components/dashboard/mainScreens/drone-noc/drone-noc-view';
import { isRedesignOn } from '@/lib/dashboard-redesign-flag';
import { DroneNocRedesignedView } from '@/components/dashboard/mainScreens/drone-noc/redesigned/drone-noc-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Drone NOC permits',
  description:
    'Drone NOC tracker for Pakistani wedding photographers — PCAA + Home Department + police-intimation permits with auto-status.',
};

export default function Page() {
  if (isRedesignOn()) return <DroneNocRedesignedView />;
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Drone NOC permits" />
          <Separator />
          <DroneNocView />
        </div>
      </PageContainer>
    </div>
  );
}
