import { Metadata } from "next";
import { ReportCardsView } from "@/components/reports/report-cards-view";

export const metadata: Metadata = {
  title: "Dashboard : Reports",
  description: "Your business at a glance — the Urdu report cards.",
};

const page = () => <ReportCardsView />;

export default page;
