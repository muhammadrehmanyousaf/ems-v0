import React from "react";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  SITE_NAME,
  webApplicationLD,
  breadcrumbsLD,
  combineGraph,
} from "@/lib/seo";
import { safeJsonLd } from "@/lib/seo/jsonld";

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
  const appLd = webApplicationLD({
    name: `Vendor Comparison Tool — ${SITE_NAME}`,
    description:
      "Compare Pakistani wedding venues, photographers, caterers, and decorators side-by-side by pricing, capacity, amenities, and verified reviews.",
    url: "/compare-vendors",
    applicationCategory: "LifestyleApplication",
  });

  const breadcrumbsLd = breadcrumbsLD([
    { name: "Home", url: "/" },
    { name: "Compare Vendors", url: "/compare-vendors" },
  ]);

  const combined = combineGraph(appLd, breadcrumbsLd);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(combined) }}
      />
      {children}
    </>
  );
}
