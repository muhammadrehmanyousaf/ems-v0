import { LeadsArtifact } from '@/components/dashboard/mainScreens/leads/artifact/leads-artifact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Lead Inbox',
  description:
    'Unified inbox for WhatsApp, phone, walk-in, website form & in-app chat inquiries — never lose a Pakistani wedding lead to a forgotten follow-up.',
};

export default function Page() {
  return <LeadsArtifact />
}
