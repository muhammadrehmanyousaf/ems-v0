import { Metadata } from "next";
import { AddBusinessView } from "@/components/dashboard/mainScreens/business/add-business-view";
import { ShellChromeSetter } from "@/components/dashboard/layout/champagne-shell";

export const metadata: Metadata = {
  title: "Dashboard : Add a business",
  description: "Add another venue or service to your vendor account. Reviewed by our team before it goes live.",
};

// Static segment: Next matches /dashboard/business/new here, not in [id].
// Renders INSIDE the persistent champagne shell, like the settings hub: a plain
// React page, so the form keeps real labels, errors and keyboard behaviour.
const page = () => (
  <>
    <ShellChromeSetter activeHref="/dashboard/business/new" crumbBold="Set up" crumbSub="Add a business" />
    <AddBusinessView />
  </>
);
export default page;
