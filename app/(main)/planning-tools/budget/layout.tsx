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
  const appLd = webApplicationLD({
    name: `Wedding Budget Calculator Pakistan — ${SITE_NAME}`,
    description:
      "Calculate and track your Pakistani wedding budget. Realistic PKR cost estimates for venues, catering, photography, bridal wear, and decor.",
    url: "/planning-tools/budget",
    applicationCategory: "FinanceApplication",
  });

  const breadcrumbsLd = breadcrumbsLD([
    { name: "Home", url: "/" },
    { name: "Planning Tools", url: "/planning-tools" },
    { name: "Budget Calculator", url: "/planning-tools/budget" },
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
