import { GeneratorFuelArtifact } from "@/components/dashboard/mainScreens/generator-fuel/artifact/generator-fuel-artifact";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Generator fuel',
  description:
    'Diesel ledger for Pakistani venue generators — deliveries, consumption, tank readings, maintenance. Tracks per-event burn against load-shedding hours.',
};

export default function Page() {
  return <GeneratorFuelArtifact />
}
