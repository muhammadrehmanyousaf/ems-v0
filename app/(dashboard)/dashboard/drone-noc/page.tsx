import { DroneNocRedesignedView } from '@/components/dashboard/mainScreens/drone-noc/redesigned/drone-noc-redesigned-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard : Drone NOC permits',
  description:
    'Drone NOC tracker for Pakistani wedding photographers — PCAA + Home Department + police-intimation permits with auto-status.',
};

export default function Page() {
  return <DroneNocRedesignedView />
}
