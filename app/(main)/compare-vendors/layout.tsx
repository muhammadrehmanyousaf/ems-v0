import React from "react";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Compare Wedding Vendors Side-by-Side",
  description:
    "Compare Pakistani wedding venues, photographers, caterers, and decorators side-by-side by pricing, capacity, amenities, and verified reviews.",
  path: "/compare-vendors",
});

export default function CompareVendorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
