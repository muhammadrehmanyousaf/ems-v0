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
  title: "Wedding Day Timeline & Schedule Planner",
  description:
    "Create hour-by-hour timelines for your mehndi, barat, and walima events. Keep family, photographers, and vendors in sync.",
  path: "/planning-tools/timeline",
});

export default function TimelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appLd = webApplicationLD({
    name: `Wedding Day Timeline & Schedule Planner — ${SITE_NAME}`,
    description:
      "Create hour-by-hour timelines for your mehndi, barat, and walima events. Keep family, photographers, and vendors in sync.",
    url: "/planning-tools/timeline",
    applicationCategory: "LifestyleApplication",
  });

  const breadcrumbsLd = breadcrumbsLD([
    { name: "Home", url: "/" },
    { name: "Planning Tools", url: "/planning-tools" },
    { name: "Timeline Planner", url: "/planning-tools/timeline" },
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
