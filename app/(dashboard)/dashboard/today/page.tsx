import { TodayRedesignedView } from '@/components/dashboard/mainScreens/today/redesigned/today-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Today on the floor',
  description:
    "Day-of timeline runner for Pakistani wedding vendors — every active event today, tick tasks off as they happen.",
};

export default function Page() {
  return <TodayRedesignedView />
}
