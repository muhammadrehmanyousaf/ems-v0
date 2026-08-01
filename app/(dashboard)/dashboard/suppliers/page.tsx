import { SuppliersRedesignedView } from '@/components/dashboard/mainScreens/suppliers/redesigned/suppliers-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Supplier Ledger',
  description:
    'Supplier directory + A/P invoice ledger for Pakistani wedding vendors — embedded payment tracking, FBR NTN/STRN capture, A/P aging dashboard.',
};

export default function Page() {
  return <SuppliersRedesignedView />
}
