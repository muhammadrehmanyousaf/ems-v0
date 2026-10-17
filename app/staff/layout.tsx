import "../globals.css";
import type { Metadata } from "next";
import { AccessGate } from "@/components/dashboard/plans/access-gate";

export const metadata: Metadata = {
  title: "Wedding Wala — Staff",
  robots: { index: false, follow: false },
};

// Staff portal shell — deliberately minimal and mobile-first. It sits OUTSIDE
// the (main)/(dashboard)/(auth) route groups, so it inherits none of the
// marketing/vendor chrome; a staff member only ever sees their own surface.
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bridal-ivory">
      <AccessGate>
        <div className="mx-auto w-full max-w-md px-4 py-6">{children}</div>
      </AccessGate>
    </div>
  );
}
