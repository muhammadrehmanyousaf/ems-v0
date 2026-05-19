import PageContainer from '@/components/dashboard/layout/page-container';
import BookingDetailView from '@/components/dashboard/mainScreens/bookings/bookingListing/booking-detail-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Booking',
  description:
    'Full working surface for a single booking — customer, event, services, payments, linked function sheets, and audit history in one place.',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const bookingId = Number(id);
  return (
    <div>
      <PageContainer>
        <BookingDetailView bookingId={bookingId} />
      </PageContainer>
    </div>
  );
}
