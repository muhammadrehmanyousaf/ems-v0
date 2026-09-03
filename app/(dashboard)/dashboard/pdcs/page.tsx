import { PdcsArtifact } from '@/components/dashboard/mainScreens/pdcs/artifact/pdcs-artifact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Cheque ledger',
  description: 'Post-dated cheques — track held, deposited, cleared and bounced cheques.',
};

const page = () => <PdcsArtifact />;
export default page;
