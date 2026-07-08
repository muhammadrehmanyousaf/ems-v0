import { Metadata } from "next";
import { KitchenPrepView } from "@/components/dashboard/mainScreens/kitchen/kitchen-prep-view";

export const metadata: Metadata = {
  title: "Dashboard : Kitchen prep sheet",
  description: "Turn the menu into deghs to cook and a consolidated shopping list.",
};

const page = () => <KitchenPrepView />;

export default page;
