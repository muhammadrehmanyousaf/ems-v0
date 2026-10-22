import React from "react";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

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
  return <>{children}</>;
}
