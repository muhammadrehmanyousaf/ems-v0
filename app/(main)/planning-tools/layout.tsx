import React from "react";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

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
  return (
    <div className="min-h-screen bg-gradient-to-br from-bridal-cream via-white to-bridal-cream/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </div>
    </div>
  );
}
