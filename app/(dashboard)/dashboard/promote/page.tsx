import { PromoteRedesignedView } from '@/components/dashboard/mainScreens/promote/redesigned/promote-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Promote',
  description: 'Request featured placement on the Wedding Wala marketplace.',
};

export default function Page() {
  return <PromoteRedesignedView />
}
