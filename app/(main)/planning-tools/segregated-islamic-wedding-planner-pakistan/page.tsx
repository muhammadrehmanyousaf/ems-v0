import type { Metadata } from "next";
import { SegregatedWeddingClient } from "./SegregatedWeddingClient";
import { SITE_NAME, SITE_URL } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Segregated & Female-Staff Wedding Finder Pakistan [Halal] | Wedding Wala",
  description:
    "Need 100% female photographers, separate Gents/Ladies halls, Mahram-safe bridal shoots & no-music Nikkah setups? Get your verified vendor list in 30 seconds!",
  alternates: {
    canonical: "/planning-tools/segregated-islamic-wedding-planner-pakistan",
  },
  openGraph: {
    title: "Segregated & Female-Staff Wedding Finder Pakistan [Halal]",
    description:
      "Find 100% female photography teams, segregated soundproof halls & Mahram-safe wedding services across Pakistan.",
    url: `${SITE_URL}/planning-tools/segregated-islamic-wedding-planner-pakistan`,
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
        name: "Segregated & Female-Staff Wedding Finder Pakistan",
        url: `${SITE_URL}/planning-tools/segregated-islamic-wedding-planner-pakistan`,
        applicationCategory: "LifestyleApplication",
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
            name: "How can I ensure female-only photography for my Pakistani wedding?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "WeddingWala verifies female photographers who provide all-female shooting crews and female video editors, along with a signed Non-Disclosure Agreement (NDA) guaranteeing no client images are shared on social media or stored unencrypted.",
            },
          },
          {
            "@type": "Question",
            name: "What venues offer soundproof segregated halls in Lahore, Karachi, and Islamabad?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Many premier marquees and banquets feature dual halls with independent entrances, dedicated female waitstaff, private washrooms, and strict no-entry policies for male staff during ladies functions.",
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
      <SegregatedWeddingClient />
    </>
  );
}
