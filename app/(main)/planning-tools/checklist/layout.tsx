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
  title: "Pakistani Wedding Checklist & To-Do List",
  description:
    "Comprehensive month-by-month Pakistani wedding checklist. Track tasks from baat pakki to walima with custom due dates.",
  path: "/planning-tools/checklist",
});

export default function ChecklistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appLd = webApplicationLD({
    name: `Pakistani Wedding Checklist & To-Do List — ${SITE_NAME}`,
    description:
      "Comprehensive month-by-month Pakistani wedding checklist. Track tasks from baat pakki to walima with custom due dates.",
    url: "/planning-tools/checklist",
    applicationCategory: "LifestyleApplication",
  });

  const breadcrumbsLd = breadcrumbsLD([
    { name: "Home", url: "/" },
    { name: "Planning Tools", url: "/planning-tools" },
    { name: "Checklist", url: "/planning-tools/checklist" },
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
