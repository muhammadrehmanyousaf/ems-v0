import { HalalCertsRedesignedView } from '@/components/dashboard/mainScreens/halal-certs/redesigned/halal-certs-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Halal Certificates',
  description:
    'Halal certification tracker for Pakistani caterers — PHA / SANHA / JUH / Federal HFA. Auto-flags expiring certs.',
};

export default function Page() {
  return <HalalCertsRedesignedView />
}
