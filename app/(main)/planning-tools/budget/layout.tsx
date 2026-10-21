import React from "react";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Wedding Budget Calculator Pakistan",
  description:
    "Calculate and track your Pakistani wedding budget. Realistic PKR cost estimates for venues, catering, photography, bridal wear, and decor.",
  path: "/planning-tools/budget",
});

export default function BudgetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
