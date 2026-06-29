import DashboardView from "@/components/dashboard/mainScreens/dashboard/dashboard-view";
import { isRedesignOn } from "@/lib/dashboard-redesign-flag";
import { OverviewRedesignedView } from "@/components/dashboard/mainScreens/dashboard/redesigned/overview-redesigned-view";

export default function DashboardPage() {
  if (isRedesignOn()) return <OverviewRedesignedView />;
  return (
    <div>
      <DashboardView/>
    </div>
  );
}
