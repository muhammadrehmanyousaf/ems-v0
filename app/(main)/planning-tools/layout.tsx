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
  title: "Free Pakistani Wedding Planning Tools & Calculators (2026)",
  description:
    "16 free interactive tools for Pakistani weddings: Degh catering calculator, Haq Mehr & gold tola rates, Marquee AC & hidden costs, Nikkah Nama legal guide, Salami tracker, and 12-month checklist.",
  path: "/planning-tools",
});

export default function PlanningToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appLd = webApplicationLD({
    name: `Pakistani Wedding Planning Tools & Calculators Suite — ${SITE_NAME}`,
    description:
      "Interactive 2026 planning tools for Pakistani weddings: Degh catering calculator, Haq Mehr tola calculator, marquee hidden cost estimator, Nikkah Nama checklist, wedding budget, and checklist.",
    url: "/planning-tools",
    applicationCategory: "LifestyleApplication",
  });

  const breadcrumbsLd = breadcrumbsLD([
    { name: "Home", url: "/" },
    { name: "Planning Tools", url: "/planning-tools" },
  ]);

  const combined = combineGraph(appLd, breadcrumbsLd);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bridal-cream via-white to-bridal-cream/80">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(combined) }}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </div>
    </div>
  );
}
