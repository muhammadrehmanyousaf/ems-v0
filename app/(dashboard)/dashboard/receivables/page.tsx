import { ReceivablesArtifact } from '@/components/dashboard/mainScreens/receivables/artifact/receivables-artifact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Receivables',
  description:
    'A/R aging board — who owes you, how much, and how overdue. Phone-list-ready with WhatsApp deep links + CSV export.',
};

export default function Page() {
  return <ReceivablesArtifact />
}
