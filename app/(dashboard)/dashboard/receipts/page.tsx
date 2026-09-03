import { ReceiptsArtifact } from '@/components/dashboard/mainScreens/receipts/artifact/receipts-artifact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Receipts',
  description: 'Record and manage the payments you have received, by method.',
};

const page = () => <ReceiptsArtifact />;
export default page;
