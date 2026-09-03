import { Metadata } from "next";
import { KitchenPrepArtifact } from "@/components/dashboard/mainScreens/kitchen/artifact/kitchen-prep-artifact";

export const metadata: Metadata = {
  title: "Dashboard : Kitchen prep sheet",
  description: "Turn the menu into deghs to cook and a consolidated shopping list.",
};

const page = () => <KitchenPrepArtifact />;

export default page;
