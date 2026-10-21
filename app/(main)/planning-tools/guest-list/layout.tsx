import React from "react";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

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
  return <>{children}</>;
}
