import { LeadsRedesignedView } from '@/components/dashboard/mainScreens/leads/redesigned/leads-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Lead Inbox',
  description:
    'Unified inbox for WhatsApp, phone, walk-in, website form & in-app chat inquiries — never lose a Pakistani wedding lead to a forgotten follow-up.',
};

export default function Page() {
  return <LeadsRedesignedView />
}
