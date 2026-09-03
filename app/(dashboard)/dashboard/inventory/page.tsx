import { InventoryArtifact } from "@/components/dashboard/mainScreens/inventory/artifact/inventory-artifact";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard : Inventory",
  description: "Track your stock — items, quantities, low-stock alerts and movements.",
};

export default function Page() {
  return <InventoryArtifact />;
}
