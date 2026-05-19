import PageContainer from '@/components/dashboard/layout/page-container';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import GeneratorFuelView from '@/components/dashboard/mainScreens/generator-fuel/generator-fuel-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Generator Fuel Log',
  description:
    'Diesel ledger for Pakistani venue generators — deliveries, consumption, tank readings, maintenance. Tracks per-event burn against load-shedding hours.',
};

export default function Page() {
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Generator fuel log" />
          <Separator />
          <GeneratorFuelView />
        </div>
      </PageContainer>
    </div>
  );
}
