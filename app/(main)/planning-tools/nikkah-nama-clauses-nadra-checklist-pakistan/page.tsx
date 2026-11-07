import type { Metadata } from "next";
import { NikkahClausesClient } from "./NikkahClausesClient";
import { SITE_NAME, SITE_URL } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Pakistani Nikkah Nama Clauses (Col 13-22) & NADRA Checklist | Wedding Wala",
  description:
    "Understand Pakistani Nikkah Nama Columns 13 to 22 (Haq Mehr, Column 18 Right to Divorce, Monthly Allowance) & generate your Nikkah Day CNIC/NADRA checklist!",
  alternates: {
    canonical: "/planning-tools/nikkah-nama-clauses-nadra-checklist-pakistan",
  },
  openGraph: {
    title: "Pakistani Nikkah Nama Clauses (Col 13-22) & NADRA Checklist",
    description:
      "Interactive legal guide to Pakistani Nikkah Nama clauses and instant document checklist for Union Council and NADRA MRC.",
    url: `${SITE_URL}/planning-tools/nikkah-nama-clauses-nadra-checklist-pakistan`,
    siteName: SITE_NAME,
    type: "website",
  },
};

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "Pakistani Nikkah Nama Clauses & NADRA Checklist",
        url: `${SITE_URL}/planning-tools/nikkah-nama-clauses-nadra-checklist-pakistan`,
        applicationCategory: "ReferenceApplication",
        operatingSystem: "All",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "PKR",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is Column 18 in the Pakistani Nikkah Nama?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Column 18 pertains to 'Tafweez-e-Talaq' (the delegated right of divorce). When granted, it allows the wife to divorce without forfeiting her financial rights or having to file a Khula case through family courts.",
            },
          },
          {
            "@type": "Question",
            name: "What documents are required for NADRA Marriage Registration Certificate (MRC)?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "To obtain a computerized NADRA MRC, you require the original verified Nikkahnama with the official Nikkah Registrar stamp, copies of the Bride and Groom CNICs (or NICOP for overseas citizens), and copies of both fathers' and witnesses' CNICs.",
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NikkahClausesClient />
    </>
  );
}
