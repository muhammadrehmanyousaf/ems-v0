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
  title: "Wedding Planning Tools & Checklists",
  description:
    "Free planning tools for Pakistani weddings — wedding checklist, budget calculator, guest list manager, and event timeline by Wedding Wala.",
  path: "/planning-tools",
});

export default function PlanningToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appLd = webApplicationLD({
    name: `Wedding Planning Tools Suite — ${SITE_NAME}`,
    description:
      "Interactive planning tools for Pakistani weddings: wedding budget calculator, checklist, guest list manager, and event timeline.",
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
