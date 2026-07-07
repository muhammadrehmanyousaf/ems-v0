import { Metadata } from "next";
import { FieldCaptureView } from "@/components/dashboard/mainScreens/field/field-capture-view";

export const metadata: Metadata = {
  title: "Dashboard : Field capture",
  description: "Capture leads, payments, expenses and holds on-site — works offline.",
};

const page = () => <FieldCaptureView />;

export default page;
