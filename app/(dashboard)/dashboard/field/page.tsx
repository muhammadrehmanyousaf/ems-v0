import { Metadata } from "next";
import { FieldArtifact } from "@/components/dashboard/mainScreens/field/artifact/field-artifact";

export const metadata: Metadata = {
  title: "Dashboard : Field capture",
  description: "Capture leads, payments, expenses and holds on-site — works offline.",
};

const page = () => <FieldArtifact />;

export default page;
