import { LeadDetailArtifact } from '@/components/dashboard/mainScreens/leads/artifact/lead-detail-artifact';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Lead',
  description:
    'A single enquiry — who asked, what they want, who owns it, and whether it became a booking.',
};

/**
 * /dashboard/leads/[id]
 *
 * The lead had no object page: every other spine object (booking, customer,
 * function sheet) has one, but the place money STARTS was a row in a list.
 */
export default function Page({ params }: { params: { id: string } }) {
  return <LeadDetailArtifact leadId={Number(params.id)} />;
}
