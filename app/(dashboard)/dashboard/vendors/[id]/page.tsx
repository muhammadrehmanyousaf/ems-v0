import PageContainer from '@/components/dashboard/layout/page-container';
import VendorDetailView from '@/components/dashboard/mainScreens/vendors/vendor-detail-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Vendor',
  description:
    'A single vendor account — who they are, what they have listed, and their trust state.',
};

/**
 * /dashboard/vendors/[id] — admin object page for one vendor.
 *
 * The vendors list had an approve/reject toggle and nothing behind it. Data
 * sources here are server-gated to super admin, so a vendor who guesses the URL
 * sees empty panels rather than a peer's account.
 */
export default function Page({ params }: { params: { id: string } }) {
  const vendorId = Number(params.id);
  return (
    <PageContainer>
      <VendorDetailView vendorId={vendorId} />
    </PageContainer>
  );
}
