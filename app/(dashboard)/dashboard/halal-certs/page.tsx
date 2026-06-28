import PageContainer from '@/components/dashboard/layout/page-container';
import { Heading } from '@/components/heading';
import { Separator } from '@/components/ui/separator';
import HalalCertsView from '@/components/dashboard/mainScreens/halal-certs/halal-certs-view';
import { isRedesignOn } from '@/lib/dashboard-redesign-flag';
import { HalalCertsRedesignedView } from '@/components/dashboard/mainScreens/halal-certs/redesigned/halal-certs-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Halal Certificates',
  description:
    'Halal certification tracker for Pakistani caterers — PHA / SANHA / JUH / Federal HFA. Auto-flags expiring certs.',
};

export default function Page() {
  if (isRedesignOn()) return <HalalCertsRedesignedView />;
  return (
    <div>
      <PageContainer>
        <div className="space-y-4">
          <Heading title="Halal certificates" />
          <Separator />
          <HalalCertsView />
        </div>
      </PageContainer>
    </div>
  );
}
