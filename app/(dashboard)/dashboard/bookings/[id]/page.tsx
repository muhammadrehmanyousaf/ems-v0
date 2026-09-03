import type { Metadata } from 'next';
import { BookingDetailArtifact } from '@/components/dashboard/mainScreens/bookings/artifact/booking-detail-artifact';

export const metadata: Metadata = {
  title: 'Dashboard : Booking',
  description:
    'Full working surface for a single booking — customer, event, package, payments and history in one place.',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <BookingDetailArtifact bookingId={Number(id)} />;
}
