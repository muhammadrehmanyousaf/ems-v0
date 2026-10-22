import React from "react";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

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
  return <>{children}</>;
}
