import { Metadata } from "next";
import { PolicyTemplatePicker } from "@/components/settings/policy-template-picker";

export const metadata: Metadata = {
  title: "Dashboard : Cancellation Policy",
  description: "Choose your cancellation & refund policy.",
};

const page = () => <PolicyTemplatePicker />;

export default page;
