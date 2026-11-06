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
  title: "Wedding Guest List Manager Pakistan",
  description:
    "Manage your wedding guest list across barat, walima, and mehndi. Track RSVPs, family sides, and headcounts.",
  path: "/planning-tools/guest-list",
});

export default function GuestListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appLd = webApplicationLD({
    name: `Wedding Guest List Manager Pakistan — ${SITE_NAME}`,
    description:
      "Manage your wedding guest list across barat, walima, and mehndi. Track RSVPs, family sides, and headcounts.",
    url: "/planning-tools/guest-list",
    applicationCategory: "LifestyleApplication",
  });

  const breadcrumbsLd = breadcrumbsLD([
    { name: "Home", url: "/" },
    { name: "Planning Tools", url: "/planning-tools" },
    { name: "Guest List Manager", url: "/planning-tools/guest-list" },
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
