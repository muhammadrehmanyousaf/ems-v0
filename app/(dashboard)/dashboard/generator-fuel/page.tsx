import { GeneratorFuelRedesignedView } from '@/components/dashboard/mainScreens/generator-fuel/redesigned/generator-fuel-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Generator fuel',
  description:
    'Diesel ledger for Pakistani venue generators — deliveries, consumption, tank readings, maintenance. Tracks per-event burn against load-shedding hours.',
};

export default function Page() {
  return <GeneratorFuelRedesignedView />
}
